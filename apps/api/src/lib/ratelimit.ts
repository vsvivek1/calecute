/**
 * Fixed-window rate limiting backed by Postgres.
 *
 * A dedicated store (Redis) would be the usual choice, but this programme adds
 * a second vendor and an extra failure mode for traffic that peaks in the low
 * hundreds per minute. One upsert per request against a table the database
 * already has is cheaper to operate. If volume grows, the interface here is
 * narrow enough to swap.
 *
 * Counters run as SECURITY DEFINER through a plain SQL upsert on a connection
 * outside the request's RLS transaction, so a rate-limit write never rolls back
 * with a failed request — a client cannot escape the limiter by sending
 * requests that error.
 */
import { sql as connection } from "@/db/client";
import { ApiError } from "./errors";

export interface RateLimitRule {
  /** Requests allowed per window. */
  limit: number;
  /** Window length in seconds. */
  windowSeconds: number;
}

export interface RateLimitResult {
  limit: number;
  remaining: number;
  resetSeconds: number;
  /** True when this request is the one that goes over the limit. */
  exceeded: boolean;
}

/** Limits tuned for a recruitment page, not an API product. */
export const RULES = {
  /** Anonymous reads: geography lookups, slot availability. */
  publicRead: { limit: 120, windowSeconds: 60 },
  /** Sign-in attempts from one address. */
  auth: { limit: 20, windowSeconds: 60 },
  /** Signup submissions. Deliberately tight; this is the abuse surface. */
  signup: { limit: 5, windowSeconds: 3600 },
  /** Authenticated reads. */
  authedRead: { limit: 300, windowSeconds: 60 },
  /** Anything that writes. */
  write: { limit: 60, windowSeconds: 60 },
  /** Analytics beacons. Generous: one page view fires several. */
  analytics: { limit: 240, windowSeconds: 60 },
} as const satisfies Record<string, RateLimitRule>;

export async function consume(
  bucket: string,
  rule: RateLimitRule,
): Promise<RateLimitResult> {
  const sql = connection();
  const windowMs = rule.windowSeconds * 1000;
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);

  // The timestamp is sent as a cast ISO string, not as a Date — see db/values.ts
  // for why driver type inference cannot be relied on here.
  const rows = await sql<{ hits: number }[]>`
    INSERT INTO rate_limit_buckets (bucket_key, window_start, hits)
    VALUES (${bucket}, ${windowStart.toISOString()}::timestamptz, 1)
    ON CONFLICT (bucket_key, window_start)
    DO UPDATE SET hits = rate_limit_buckets.hits + 1
    RETURNING hits
  `;

  const hits = rows[0]?.hits ?? 1;
  const resetSeconds = Math.ceil(
    (windowStart.getTime() + windowMs - Date.now()) / 1000,
  );
  return {
    limit: rule.limit,
    remaining: Math.max(0, rule.limit - hits),
    resetSeconds: Math.max(0, resetSeconds),
    // `hits` counts this request, so the rule is exceeded only once hits goes
    // past the limit. Comparing `remaining <= 0` instead would reject the
    // limit-th request and give every bucket one fewer than advertised.
    exceeded: hits > rule.limit,
  };
}

export function headersFor(result: RateLimitResult): Record<string, string> {
  return {
    "RateLimit-Limit": String(result.limit),
    "RateLimit-Remaining": String(result.remaining),
    "RateLimit-Reset": String(result.resetSeconds),
  };
}

/**
 * Consume a slot and throw 429 if the bucket is exhausted.
 * Returns headers to merge into the success response.
 */
export async function enforce(
  bucket: string,
  rule: RateLimitRule,
): Promise<Record<string, string>> {
  const result = await consume(bucket, rule);
  const headers = headersFor(result);
  if (result.exceeded) {
    throw new ApiError("RATE_LIMITED", "Too many requests. Try again shortly.", {
      headers: { ...headers, "Retry-After": String(result.resetSeconds) },
    });
  }
  return headers;
}

/** Housekeeping: called by the daily cron, keeps the table from growing. */
export async function pruneOldBuckets(): Promise<number> {
  const sql = connection();
  const rows = await sql`
    DELETE FROM rate_limit_buckets
     WHERE window_start < now() - interval '1 day'
     RETURNING 1
  `;
  return rows.length;
}
