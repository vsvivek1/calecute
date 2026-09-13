/**
 * Composition helpers so each route file states its policy in one line and
 * cannot forget a step.
 *
 * The order is always: rate limit, authenticate, open an RLS-scoped
 * transaction. A handler receives an actor and a scoped `tx` and nothing else —
 * there is no way to reach an unscoped connection from `src/app/**`.
 */
import type { NextRequest } from "next/server";
import { withRls, PUBLIC_ACTOR, type Actor, type ScopedDb } from "@/db/rls";
import {
  requireActor,
  requireRole,
  optionalActor,
  type AuthedActor,
} from "./auth/context";
import { enforce, RULES, type RateLimitRule } from "./ratelimit";
import { ipPrefix } from "./net";
import { json } from "./http";
import type { ActorRole } from "@/db/rls";

/** Bucket key: authenticated callers are limited per user, anonymous per /24. */
function bucketFor(
  request: NextRequest,
  name: string,
  actor: Actor | null,
): string {
  const who =
    actor?.userId != null ? `u:${actor.userId}` : `ip:${ipPrefix(request) ?? "unknown"}`;
  return `${name}:${who}`;
}

export interface PublicContext {
  request: NextRequest;
  tx: ScopedDb;
  actor: Actor;
  url: URL;
  rateHeaders: Record<string, string>;
}

export interface AuthedContext extends PublicContext {
  actor: AuthedActor;
}

/** An endpoint anyone may call, signed in or not. */
export function publicRoute(
  options: { limit?: RateLimitRule; name: string },
  fn: (ctx: PublicContext) => Promise<Response>,
) {
  return async (request: NextRequest): Promise<Response> => {
    const actor = await optionalActor(request);
    const rateHeaders = await enforce(
      bucketFor(request, options.name, actor),
      options.limit ?? RULES.publicRead,
    );
    return withRls(actor, (tx) =>
      fn({ request, tx, actor, url: new URL(request.url), rateHeaders }),
    );
  };
}

/** An endpoint that requires a valid access token. */
export function authedRoute(
  options: { limit?: RateLimitRule; name: string; roles?: ReadonlyArray<Exclude<ActorRole, "PUBLIC">> },
  fn: (ctx: AuthedContext) => Promise<Response>,
) {
  return async (request: NextRequest): Promise<Response> => {
    const actor = options.roles
      ? await requireRole(request, options.roles)
      : await requireActor(request);
    const rateHeaders = await enforce(
      bucketFor(request, options.name, actor),
      options.limit ?? RULES.authedRead,
    );
    return withRls(actor, (tx) =>
      fn({ request, tx, actor, url: new URL(request.url), rateHeaders }),
    );
  };
}

/**
 * An endpoint that must run before any user exists — sign-in itself. Runs as
 * the public actor but is rate limited hard, since it is an unauthenticated
 * write path.
 */
export function anonymousWriteRoute(
  options: { limit?: RateLimitRule; name: string },
  fn: (ctx: PublicContext) => Promise<Response>,
) {
  return async (request: NextRequest): Promise<Response> => {
    const rateHeaders = await enforce(
      bucketFor(request, options.name, null),
      options.limit ?? RULES.auth,
    );
    return withRls(PUBLIC_ACTOR, (tx) =>
      fn({
        request,
        tx,
        actor: PUBLIC_ACTOR,
        url: new URL(request.url),
        rateHeaders,
      }),
    );
  };
}

/** Convenience: JSON response carrying the rate-limit headers. */
export function ok(
  ctx: { request: NextRequest; rateHeaders: Record<string, string> },
  body: unknown,
  status = 200,
  publicCacheSeconds?: number,
): Response {
  return json(ctx.request, body, {
    status,
    headers: ctx.rateHeaders,
    publicCacheSeconds,
  });
}
