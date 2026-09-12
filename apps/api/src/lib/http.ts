/**
 * Request plumbing shared by every route handler: the JSON envelope, CORS,
 * request ids, and the single place where an exception becomes a response.
 */
import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { ApiError, type ErrorCode } from "./errors";
import { allowedOrigins, env } from "./env";

export const API_VERSION = "v1";

export interface ResponseInit_ {
  status?: number;
  headers?: Record<string, string>;
}

function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin");
  const allowed = allowedOrigins();
  const headers: Record<string, string> = {
    Vary: "Origin",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers":
      "Authorization,Content-Type,Idempotency-Key,X-Client,X-Session-Id",
    "Access-Control-Expose-Headers":
      "X-Request-Id,RateLimit-Limit,RateLimit-Remaining,RateLimit-Reset,Retry-After",
    "Access-Control-Max-Age": "600",
  };
  if (origin && allowed.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  }
  return headers;
}

export function json(
  request: Request,
  body: unknown,
  init: ResponseInit_ = {},
): Response {
  const requestId = requestIdOf(request);
  return Response.json(body, {
    status: init.status ?? 200,
    headers: {
      ...corsHeaders(request),
      "X-Request-Id": requestId,
      "Cache-Control": "no-store",
      ...init.headers,
    },
  });
}

export function noContent(request: Request): Response {
  return new Response(null, {
    status: 204,
    headers: { ...corsHeaders(request), "X-Request-Id": requestIdOf(request) },
  });
}

export function errorResponse(
  request: Request,
  code: ErrorCode,
  message: string,
  details?: unknown,
  extraHeaders?: Record<string, string>,
): Response {
  const err = new ApiError(code, message, { details, headers: extraHeaders });
  return json(
    request,
    {
      error: {
        code: err.code,
        message: err.message,
        ...(details === undefined ? {} : { details }),
        requestId: requestIdOf(request),
      },
    },
    { status: err.status, headers: extraHeaders },
  );
}

const requestIds = new WeakMap<Request, string>();

export function requestIdOf(request: Request): string {
  let id = requestIds.get(request);
  if (!id) {
    id = request.headers.get("x-request-id") ?? randomUUID();
    requestIds.set(request, id);
  }
  return id;
}

/**
 * The context Next passes a route handler.
 *
 * `params` is optional and loosely typed on purpose: the same wrapper is used by
 * static and dynamic routes, and Next generates a per-route validator that
 * checks the exported handler's signature against the route's own param shape.
 * A narrower type here (`Promise<never>`, say) fails that check for every
 * dynamic route.
 */
export type RouteContext = { params?: Promise<Record<string, string>> };

/**
 * Wraps a handler so that any thrown `ApiError` becomes its envelope and any
 * other exception becomes a 500 with the stack logged but never returned.
 *
 * Logging deliberately records only the request id, method, path and error
 * code. Request bodies are not logged: they carry mobile numbers and, at
 * payout setup, PAN.
 */
export function handler(
  fn: (request: NextRequest, context: RouteContext) => Promise<Response>,
) {
  return async (
    request: NextRequest,
    context: RouteContext,
  ): Promise<Response> => {
    try {
      return await fn(request, context);
    } catch (error) {
      const requestId = requestIdOf(request);
      if (error instanceof ApiError) {
        if (error.status >= 500) {
          console.error(
            `[${requestId}] ${request.method} ${request.nextUrl.pathname} ${error.code}`,
          );
        }
        return json(
          request,
          {
            error: {
              code: error.code,
              message: error.message,
              ...(error.details === undefined ? {} : { details: error.details }),
              requestId,
            },
          },
          { status: error.status, headers: error.headers },
        );
      }
      console.error(
        `[${requestId}] ${request.method} ${request.nextUrl.pathname} unhandled`,
        error instanceof Error ? error.stack : error,
      );
      return json(
        request,
        {
          error: {
            code: "INTERNAL_ERROR",
            message:
              env().NODE_ENV === "production"
                ? "Something went wrong. Quote the request id when reporting this."
                : String(error),
            requestId,
          },
        },
        { status: 500 },
      );
    }
  };
}

/** Preflight. Every route file re-exports this. */
export function preflight(request: NextRequest): Response {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}
