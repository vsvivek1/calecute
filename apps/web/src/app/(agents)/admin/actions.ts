"use server";

/**
 * Admin actions.
 *
 * Every one of these is a thin pass-through to the API, which is where the
 * authorisation actually happens. Nothing here checks a role: a district admin
 * who crafts a request for an agent outside their districts gets a 404 from the
 * API because row-level security never returned the row. This layer exists so
 * the admin screens can be plain forms.
 *
 * Money-moving calls carry an Idempotency-Key. A double-submitted "mark paid"
 * must settle a batch once.
 */
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { ApiError, api } from "@/lib/api/client";
import { currentAccessToken } from "@/lib/session";

export interface ActionState {
  ok?: string;
  error?: string;
  code?: string;
}

function text(data: FormData, name: string): string {
  const value = data.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function id(data: FormData, name: string): number | undefined {
  const value = Number(text(data, name));
  return Number.isInteger(value) && value > 0 ? value : undefined;
}

function isRedirect(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "digest" in error &&
      String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT"),
  );
}

/** Shared wrapper: get a token, call, translate failures into form state. */
async function run(
  path: string,
  fn: (token: string) => Promise<unknown>,
  success: string,
): Promise<ActionState> {
  const token = await currentAccessToken();
  if (!token) return { error: "Your session expired. Sign in again." };

  try {
    await fn(token);
  } catch (error) {
    if (isRedirect(error)) throw error;
    if (error instanceof ApiError) {
      return { error: error.message, code: error.code };
    }
    throw error;
  }

  revalidatePath(path);
  return { ok: success };
}

/* ------------------------------------------------------------- agents */

export async function approveAgent(
  _previous: ActionState,
  data: FormData,
): Promise<ActionState> {
  const agentId = id(data, "agentId");
  if (!agentId) return { error: "Missing agent id." };
  return run(
    "/admin/agents",
    (token) =>
      api.post(
        `/admin/agents/${agentId}/approve`,
        { note: text(data, "note") || null },
        { token },
      ),
    "Approved.",
  );
}

export async function rejectAgent(
  _previous: ActionState,
  data: FormData,
): Promise<ActionState> {
  const agentId = id(data, "agentId");
  const reason = text(data, "reason");
  if (!agentId) return { error: "Missing agent id." };
  // The API requires a reason; catching it here gives a better message than a
  // round trip would.
  if (reason.length < 3) {
    return { error: "A reason is required — the applicant sees it." };
  }
  return run(
    "/admin/agents",
    (token) => api.post(`/admin/agents/${agentId}/reject`, { reason }, { token }),
    "Rejected.",
  );
}

export async function suspendAgent(
  _previous: ActionState,
  data: FormData,
): Promise<ActionState> {
  const agentId = id(data, "agentId");
  const reason = text(data, "reason");
  if (!agentId) return { error: "Missing agent id." };
  if (reason.length < 3) return { error: "A reason is required." };
  return run(
    "/admin/agents",
    (token) => api.post(`/admin/agents/${agentId}/suspend`, { reason }, { token }),
    "Suspended. The panchayat slot is free again.",
  );
}

/* -------------------------------------------------------- panchayats */

export async function updateLocalBody(
  _previous: ActionState,
  data: FormData,
): Promise<ActionState> {
  const localBodyId = id(data, "localBodyId");
  if (!localBodyId) return { error: "Missing panchayat id." };

  const body: Record<string, unknown> = { reason: text(data, "reason") || null };
  const slots = text(data, "slotCapacity");
  if (slots !== "") {
    const parsed = Number(slots);
    if (!Number.isInteger(parsed) || parsed < 0) {
      return { error: "Slot count must be a whole number." };
    }
    body.slotCapacity = parsed;
  }
  const open = text(data, "signupsOpen");
  if (open !== "") body.signupsOpen = open === "true";

  if (!("slotCapacity" in body) && !("signupsOpen" in body)) {
    return { error: "Nothing to change." };
  }

  return run(
    "/admin/panchayats",
    (token) => api.patch(`/admin/local-bodies/${localBodyId}`, body, { token }),
    "Updated.",
  );
}

/* ----------------------------------------------------------- payouts */

export async function decidePan(
  _previous: ActionState,
  data: FormData,
): Promise<ActionState> {
  const agentId = id(data, "agentId");
  const decision = text(data, "decision");
  if (!agentId) return { error: "Missing agent id." };
  return run(
    "/admin/payouts",
    (token) =>
      api.post(
        `/admin/payouts/${agentId}/pan`,
        { decision, note: text(data, "note") || null },
        { token },
      ),
    decision === "VERIFIED" ? "PAN verified." : "Recorded.",
  );
}

export async function createPayoutBatch(
  _previous: ActionState,
  data: FormData,
): Promise<ActionState> {
  const period = text(data, "period");
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) {
    return { error: "Period must look like 2026-09." };
  }
  return run(
    "/admin/payouts",
    (token) =>
      api.post(
        "/admin/payout-batches",
        { period, note: text(data, "note") || null },
        // Creates financial records; a retried submit must not open two batches.
        { token, idempotencyKey: `batch-${period}` },
      ),
    "Batch opened.",
  );
}

export async function markBatchPaid(
  _previous: ActionState,
  data: FormData,
): Promise<ActionState> {
  const batchId = id(data, "batchId");
  const reference = text(data, "reference");
  if (!batchId) return { error: "Missing batch id." };
  if (reference.length < 3) {
    return { error: "A bank reference is required so the ledger ties to a statement." };
  }
  return run(
    "/admin/payouts",
    (token) =>
      api.post(
        `/admin/payout-batches/${batchId}/mark-paid`,
        { reference, note: text(data, "note") || null },
        // Keyed on the batch and reference: the same transfer recorded twice is
        // the same operation, a different reference is a different one.
        { token, idempotencyKey: `paid-${batchId}-${reference}` },
      ),
    "Marked paid.",
  );
}

/* -------------------------------------------------- admin users */

export async function upsertAdmin(
  _previous: ActionState,
  data: FormData,
): Promise<ActionState> {
  const email = text(data, "email").toLowerCase();
  const role = text(data, "role");
  const districtIds = data
    .getAll("districtIds")
    .filter((v): v is string => typeof v === "string")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0);

  if (!email.includes("@")) return { error: "Enter a valid email address." };
  if (role === "DISTRICT_ADMIN" && districtIds.length === 0) {
    return { error: "A district admin with no districts can see nothing." };
  }

  return run(
    "/admin/users",
    (token) => api.post("/admin/users", { email, role, districtIds }, { token }),
    "Saved. The role applies the first time they sign in with Google.",
  );
}

/* ------------------------------------------------------ review flags */

export async function resolveFlags(
  _previous: ActionState,
  data: FormData,
): Promise<ActionState> {
  const flagIds = data
    .getAll("flagIds")
    .filter((v): v is string => typeof v === "string")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0);
  const status = text(data, "status");
  if (flagIds.length === 0) return { error: "Select at least one flag." };

  return run(
    "/admin",
    (token) => api.patch("/admin/review-flags", { flagIds, status }, { token }),
    "Updated.",
  );
}

/** Used by the message composer, which needs a fresh key per send. */
export async function messageAgents(
  _previous: ActionState,
  data: FormData,
): Promise<ActionState> {
  const subject = text(data, "subject");
  if (subject.length < 3) return { error: "A subject is required." };
  if (!text(data, "bodyMl") && !text(data, "bodyEn")) {
    return { error: "Write the message in Malayalam, English, or both." };
  }

  const audience: Record<string, unknown> = {};
  const districtId = id(data, "districtId");
  const status = text(data, "status");
  if (districtId) audience.districtId = districtId;
  if (status) audience.status = status;

  return run(
    "/admin/agents",
    (token) =>
      api.post(
        "/admin/messages",
        {
          subject,
          bodyMl: text(data, "bodyMl") || null,
          bodyEn: text(data, "bodyEn") || null,
          audience,
        },
        { token, idempotencyKey: randomUUID() },
      ),
    "Sent.",
  );
}
