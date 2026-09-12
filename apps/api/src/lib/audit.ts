/**
 * The admin audit trail.
 *
 * Every admin action writes one row: who, what, when, and the before/after of
 * the thing they changed. The table has no UPDATE or DELETE policy and a
 * trigger that rejects both, so entries cannot be edited away after the fact.
 *
 * Before/after snapshots are redacted through `scrub` — an audit entry that
 * recorded a PAN would defeat the point of encrypting it.
 */
import type { NextRequest } from "next/server";
import type { ScopedDb } from "@/db/rls";
import { auditLog } from "@/db/schema";
import { ipPrefix } from "./net";
import type { AuthedActor } from "./auth/context";

export type AuditAction =
  | "agent.approve"
  | "agent.reject"
  | "agent.suspend"
  | "agent.reinstate"
  | "agent.products_assigned"
  | "agent.products_bulk_assigned"
  | "local_body.slots_changed"
  | "local_body.signups_opened"
  | "local_body.signups_closed"
  | "payout_batch.created"
  | "payout_batch.marked_paid"
  | "payout.pan_verified"
  | "payout.pan_rejected"
  | "payout.duplicate_cancelled"
  | "message.sent"
  | "admin.created"
  | "admin.role_changed"
  | "admin.districts_changed"
  | "admin.deleted"
  | "applicant.data_exported"
  | "applicant.data_deleted";

/** Keys whose values never belong in an audit row, at any nesting depth. */
const REDACTED_KEYS = new Set([
  "pan",
  "panCiphertext",
  "pan_ciphertext",
  "panFingerprint",
  "pan_fingerprint",
  "accountNumber",
  "bankAccountCiphertext",
  "bank_account_ciphertext",
  "mobile",
  "email",
  "token",
  "refreshToken",
  "idToken",
  "code",
]);

export function scrub(value: unknown, depth = 0): unknown {
  if (depth > 6 || value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((v) => scrub(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    out[key] = REDACTED_KEYS.has(key) ? "[redacted]" : scrub(val, depth + 1);
  }
  return out;
}

export async function record(
  tx: ScopedDb,
  params: {
    request: NextRequest;
    actor: AuthedActor;
    action: AuditAction;
    entityType: string;
    entityId?: string | number | null;
    before?: unknown;
    after?: unknown;
  },
): Promise<void> {
  await tx.insert(auditLog).values({
    actorUserId: params.actor.userId,
    actorRole: params.actor.role,
    action: params.action,
    entityType: params.entityType,
    entityId:
      params.entityId === null || params.entityId === undefined
        ? null
        : String(params.entityId),
    before: params.before === undefined ? null : scrub(params.before),
    after: params.after === undefined ? null : scrub(params.after),
    ipPrefix: ipPrefix(params.request),
    userAgent: params.request.headers.get("user-agent")?.slice(0, 300) ?? null,
  });
}
