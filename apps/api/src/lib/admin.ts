/**
 * Shared plumbing for admin actions: resolve the target, act, audit.
 *
 * Every mutating admin endpoint follows the same three steps, and the audit
 * write is inside the same transaction as the change — an action that is rolled
 * back leaves no audit row, and an audited action definitely happened.
 */
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import type { ScopedDb } from "@/db/rls";
import { agents, localBodies } from "@/db/schema";
import { ApiError, notFound } from "./errors";
import { record, type AuditAction } from "./audit";
import type { AuthedActor } from "./auth/context";

/**
 * Load an agent the caller is allowed to act on.
 *
 * There is no district check here. The SELECT runs inside the RLS transaction,
 * so an agent outside the caller's districts simply does not come back and this
 * returns 404 — which is also the right answer to give, since confirming the
 * row exists would leak that an agent is registered elsewhere.
 */
export async function loadAgentForAdmin(tx: ScopedDb, agentId: number) {
  const [agent] = await tx
    .select()
    .from(agents)
    .where(eq(agents.id, agentId))
    .limit(1);
  if (!agent) throw notFound("Agent");
  return agent;
}

export async function loadLocalBodyForAdmin(tx: ScopedDb, localBodyId: number) {
  const [body] = await tx
    .select()
    .from(localBodies)
    .where(eq(localBodies.id, localBodyId))
    .limit(1);
  if (!body) throw notFound("Local body");
  return body;
}

/** Transition an agent's status, with the audit entry the change requires. */
export async function transitionAgent(
  tx: ScopedDb,
  params: {
    request: NextRequest;
    actor: AuthedActor;
    agentId: number;
    to: "APPROVED" | "REJECTED" | "SUSPENDED" | "PENDING_REVIEW";
    action: AuditAction;
    note?: string | null;
    allowedFrom: ReadonlyArray<string>;
  },
) {
  const before = await loadAgentForAdmin(tx, params.agentId);

  if (!params.allowedFrom.includes(before.status)) {
    throw new ApiError(
      "UNPROCESSABLE",
      `Cannot move an agent from ${before.status} to ${params.to}`,
      { details: { from: before.status, to: params.to, allowedFrom: params.allowedFrom } },
    );
  }

  const [after] = await tx
    .update(agents)
    .set({
      status: params.to,
      reviewedBy: params.actor.userId,
      reviewedAt: new Date(),
      reviewNote: params.note ?? null,
      updatedAt: new Date(),
    })
    .where(eq(agents.id, params.agentId))
    .returning();

  // The UPDATE is also policy-checked. If RLS rejected it we get no row back,
  // which means the caller was outside scope.
  if (!after) {
    throw new ApiError(
      "OUT_OF_DISTRICT_SCOPE",
      "That agent is outside the districts assigned to you",
    );
  }

  await record(tx, {
    request: params.request,
    actor: params.actor,
    action: params.action,
    entityType: "agent",
    entityId: params.agentId,
    before: { status: before.status, reviewNote: before.reviewNote },
    after: { status: after.status, reviewNote: after.reviewNote },
  });

  return after;
}
