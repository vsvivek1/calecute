/**
 * Idempotency keys for anything that writes money.
 *
 * The Android app will retry on a flaky 4G connection. Without this, a retried
 * "mark payout batch paid" pays twice. The first request for a key records its
 * response; every later request with the same key replays it instead of doing
 * the work again.
 *
 * Reusing a key with a *different* body is an error, not a replay — that means
 * a client bug, and silently returning the old response would hide it.
 */
import { createHash } from "node:crypto";
import { sql as connection } from "@/db/client";
import { ApiError } from "./errors";

export interface IdempotentOutcome<T> {
  replayed: boolean;
  status: number;
  body: T;
}

export function hashRequest(body: unknown): string {
  return createHash("sha256").update(JSON.stringify(body ?? null)).digest("hex");
}

/**
 * Wrap a money-touching write.
 *
 * Endpoints that require a key reject a request without one, rather than
 * quietly proceeding: the caller must opt in to safe retries.
 */
export async function withIdempotency<T>(
  params: {
    key: string | null;
    endpoint: string;
    userId: number;
    requestBody: unknown;
    required?: boolean;
  },
  run: () => Promise<{ status: number; body: T }>,
): Promise<IdempotentOutcome<T>> {
  const { key, endpoint, userId, requestBody } = params;

  if (!key) {
    if (params.required !== false) {
      throw new ApiError(
        "VALIDATION_FAILED",
        "This endpoint requires an Idempotency-Key header",
        { details: { header: "Idempotency-Key" } },
      );
    }
    const result = await run();
    return { replayed: false, ...result };
  }

  const sql = connection();
  const requestHash = hashRequest(requestBody);

  // Claim the key. A conflicting row means someone got here first.
  const claimed = await sql<{ key: string }[]>`
    INSERT INTO idempotency_keys (key, endpoint, user_id, request_hash)
    VALUES (${key}, ${endpoint}, ${userId}, ${requestHash})
    ON CONFLICT (key, endpoint) DO NOTHING
    RETURNING key
  `;

  if (claimed.length === 0) {
    const existing = await sql<
      {
        request_hash: string;
        response_status: number | null;
        response_body: unknown;
        completed_at: Date | null;
      }[]
    >`
      SELECT request_hash, response_status, response_body, completed_at
        FROM idempotency_keys
       WHERE key = ${key} AND endpoint = ${endpoint}
    `;
    const row = existing[0];
    if (row && row.request_hash !== requestHash) {
      throw new ApiError(
        "IDEMPOTENCY_KEY_REUSED",
        "This Idempotency-Key was already used with a different request body",
      );
    }
    if (row?.completed_at && row.response_status) {
      return {
        replayed: true,
        status: row.response_status,
        body: row.response_body as T,
      };
    }
    // In flight. Telling the client to retry is safer than racing it.
    throw new ApiError(
      "IDEMPOTENCY_KEY_REUSED",
      "A request with this Idempotency-Key is still being processed",
      { headers: { "Retry-After": "2" } },
    );
  }

  const result = await run();

  // JSON.stringify plus an explicit ::jsonb cast rather than sql.json(): the
  // driver recognises its own wrapper object by shape, and a wrapper built in a
  // different module context is not recognised — the parameter then reaches the
  // wire serializer raw and the request dies. Same class of problem as passing a
  // Date; see db/values.ts.
  await sql`
    UPDATE idempotency_keys
       SET response_status = ${result.status},
           response_body = ${JSON.stringify(result.body ?? null)}::jsonb,
           completed_at = now()
     WHERE key = ${key} AND endpoint = ${endpoint}
  `;

  return { replayed: false, ...result };
}
