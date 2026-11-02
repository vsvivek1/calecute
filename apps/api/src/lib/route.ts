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
import {
  apiKeyOf,
  authenticateApiKey,
  type ServiceActor,
  type ServiceProduct,
} from "./auth/service";
import type { ApiKeyKind } from "./apikeys";
import { ApiError } from "./errors";
import { ipPrefix } from "./net";
import { json } from "./http";
import type { UserRole } from "@/db/rls";

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
  options: { limit?: RateLimitRule; name: string; roles?: ReadonlyArray<UserRole> },
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

/**
 * The context a product-system endpoint receives. `product` is the product
 * the API key belongs to, or null when a SUPER_ADMIN called with a JWT (the
 * pre-key integration path, kept working) — such a caller names the product
 * in the request body instead.
 */
export interface ServiceContext extends PublicContext {
  actor: ServiceActor | AuthedActor;
  product: ServiceProduct | null;
}

/**
 * An endpoint for a product system, authenticated by `X-Api-Key`.
 *
 * `kinds` lists which key kinds may call it. A client key ships inside an app
 * and is treated as public, so it is never on the list for anything that
 * moves money. With `superAdmin: true` a SUPER_ADMIN bearer token is accepted
 * as well, which is how the two product-system endpoints worked before keys
 * existed.
 *
 * The handler runs inside `withRls` as the SERVICE role with `app.product_id`
 * set, so the policies scope every read and write to the key's own product.
 * Rate limited per key.
 */
export function serviceRoute(
  options: {
    name: string;
    kinds: ReadonlyArray<ApiKeyKind>;
    limit?: RateLimitRule;
    superAdmin?: boolean;
  },
  fn: (ctx: ServiceContext) => Promise<Response>,
) {
  return async (request: NextRequest): Promise<Response> => {
    const key = apiKeyOf(request);

    if (key) {
      const actor = await authenticateApiKey(key);
      if (!options.kinds.includes(actor.keyKind)) {
        throw new ApiError(
          "FORBIDDEN",
          `A ${actor.keyKind} key may not call this endpoint`,
          { details: { required: options.kinds, actual: actor.keyKind } },
        );
      }
      const rateHeaders = await enforce(
        `${options.name}:k:${actor.keyId}`,
        options.limit ?? RULES.service,
      );
      return withRls(actor, (tx) =>
        fn({
          request,
          tx,
          actor,
          product: actor.product,
          url: new URL(request.url),
          rateHeaders,
        }),
      );
    }

    if (options.superAdmin && request.headers.get("authorization")) {
      const actor = await requireRole(request, ["SUPER_ADMIN"]);
      const rateHeaders = await enforce(
        bucketFor(request, options.name, actor),
        options.limit ?? RULES.service,
      );
      return withRls(actor, (tx) =>
        fn({ request, tx, actor, product: null, url: new URL(request.url), rateHeaders }),
      );
    }

    throw new ApiError("UNAUTHENTICATED", "X-Api-Key header required", {
      headers: { "WWW-Authenticate": 'ApiKey realm="calecute"' },
    });
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
