/**
 * Mobile verification, which happens at payout setup rather than signup.
 *
 * Deliberate sequencing: asking for an OTP during signup adds a failure point
 * on a weak connection, and the number is not needed until money moves. By the
 * time an agent reaches payout setup they have a reason to complete it.
 *
 * The OTP itself is stored hashed with a short expiry in the idempotency-style
 * key table, so no new table and no plaintext code at rest.
 *
 * NOTE: no SMS provider is wired up. `deliver` currently logs in development
 * and throws in production — see README "Before going live".
 */
import { createHash, randomInt } from "node:crypto";
import { sql as connection } from "@/db/client";
import { ApiError } from "./errors";
import { env } from "./env";

const OTP_TTL_SECONDS = 10 * 60;
const MAX_ATTEMPTS = 5;

function keyFor(agentId: number, mobile: string): string {
  return `otp:${agentId}:${createHash("sha256").update(mobile).digest("hex").slice(0, 16)}`;
}

function hashCode(code: string, key: string): string {
  return createHash("sha256").update(`${key}:${code}`).digest("hex");
}

export async function startVerification(
  agentId: number,
  mobile: string,
): Promise<{ expiresInSeconds: number }> {
  const code = String(randomInt(100000, 999999));
  const key = keyFor(agentId, mobile);
  const sql = connection();

  await sql`
    INSERT INTO idempotency_keys (key, endpoint, user_id, request_hash, response_status, response_body, created_at)
    VALUES (
      ${key}, 'otp', NULL, ${hashCode(code, key)}, 0,
      ${JSON.stringify({ attempts: 0, mobile })}::jsonb, now()
    )
    ON CONFLICT (key, endpoint) DO UPDATE
      SET request_hash = EXCLUDED.request_hash,
          response_body = EXCLUDED.response_body,
          created_at = now()
  `;

  await deliver(mobile, code);
  return { expiresInSeconds: OTP_TTL_SECONDS };
}

export async function checkVerification(
  agentId: number,
  mobile: string,
  code: string,
): Promise<void> {
  const key = keyFor(agentId, mobile);
  const sql = connection();

  const rows = await sql<
    { request_hash: string; response_body: { attempts: number }; created_at: Date }[]
  >`
    SELECT request_hash, response_body, created_at
      FROM idempotency_keys
     WHERE key = ${key} AND endpoint = 'otp'
  `;
  const row = rows[0];

  if (!row) {
    throw new ApiError("VALIDATION_FAILED", "Request a code first");
  }
  if (Date.now() - row.created_at.getTime() > OTP_TTL_SECONDS * 1000) {
    throw new ApiError("VALIDATION_FAILED", "That code has expired. Request a new one.");
  }
  if ((row.response_body?.attempts ?? 0) >= MAX_ATTEMPTS) {
    throw new ApiError("RATE_LIMITED", "Too many attempts. Request a new code.");
  }

  if (hashCode(code, key) !== row.request_hash) {
    await sql`
      UPDATE idempotency_keys
         SET response_body = jsonb_set(
               response_body, '{attempts}',
               to_jsonb(COALESCE((response_body->>'attempts')::int, 0) + 1)
             )
       WHERE key = ${key} AND endpoint = 'otp'
    `;
    throw new ApiError("VALIDATION_FAILED", "That code is not correct");
  }

  await sql`DELETE FROM idempotency_keys WHERE key = ${key} AND endpoint = 'otp'`;
}

/**
 * PLACEHOLDER — no SMS gateway is configured.
 *
 * Wire an Indian DLT-registered sender here (the template must be registered
 * before a single message will be delivered). Until then this throws in
 * production rather than silently pretending to send.
 */
async function deliver(mobile: string, code: string): Promise<void> {
  if (env().NODE_ENV === "production") {
    throw new ApiError(
      "DEPENDENCY_UNAVAILABLE",
      "SMS delivery is not configured. See README — Before going live.",
    );
  }
  console.log(`[dev] OTP for ${mobile.slice(-4).padStart(10, "*")}: ${code}`);
}
