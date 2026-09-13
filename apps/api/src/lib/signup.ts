/**
 * Signup mechanics: agent codes, slot reservation and the anti-abuse checks.
 *
 * The threat this guards against is one person taking several of the ten
 * places in a panchayat using throwaway Google accounts. None of the measures
 * here is individually strong — a determined person defeats any of them — so
 * they are layered, and the ones that could reject a real applicant (device
 * and IP signals) only raise a flag for a human rather than blocking.
 */
import { and, eq, gte, sql } from "drizzle-orm";
import type { ScopedDb } from "@/db/rls";
import {
  agentCodeSequences,
  agents,
  districts,
  reviewFlags,
  signupSignals,
} from "@/db/schema";
import { ApiError } from "./errors";

/** Deliberately not a CAPTCHA: those cost conversions on low-end phones. */
export const MIN_FILL_MS = 3000;

/**
 * Issue the next agent code for a district: CA-<slug>-<6 digits>.
 *
 * The counter row is locked for the transaction, so two people submitting the
 * same second in the same district cannot receive the same code. The sequence
 * is per district and never reused, including after a rejection — a code
 * identifies an application, not an active agent.
 */
export async function issueAgentCode(
  tx: ScopedDb,
  districtId: number,
): Promise<string> {
  const rows = await tx.execute<{ next_seq: number; code_slug: string }>(sql`
    UPDATE agent_code_sequences s
       SET next_seq = s.next_seq + 1
      FROM districts d
     WHERE s.district_id = ${districtId}
       AND d.id = s.district_id
     RETURNING s.next_seq - 1 AS next_seq, d.code_slug
  `);

  const row = (rows as unknown as { next_seq: number; code_slug: string }[])[0];
  if (!row) {
    throw new ApiError(
      "UNKNOWN_GEOGRAPHY",
      "No agent code sequence for that district. Run the seed script.",
    );
  }

  return `CA-${row.code_slug}-${String(row.next_seq).padStart(6, "0")}`;
}

/**
 * Record an application against a local body.
 *
 * Capacity is NOT enforced here any more. The programme is still described as
 * ten agents per panchayat, and `slot_capacity` is still stored and still
 * reported, but a panchayat being at or over that number no longer turns
 * someone away: the client decided that who actually gets a place is a
 * selection to make later, from the people who applied, rather than a race
 * won by whoever filled the form first.
 *
 * That is the better ordering for this programme. The first ten applicants in
 * a panchayat are not the best ten, and refusing the eleventh loses somebody
 * an admin might have preferred.
 *
 * What is still enforced is `signups_open` — an admin deliberately closing a
 * panchayat is a decision that should hold.
 *
 * The advisory lock stays. Two people submitting in the same second still get
 * a consistent count back, and the lock is what makes the returned number
 * meaningful rather than a race.
 */
const SLOT_LOCK_NAMESPACE = 1001;

export interface SlotState {
  /** How many applications this local body now holds, including this one. */
  applications: number;
  slotCapacity: number;
  /** True when applications exceed the nominal capacity. Informational only. */
  overSubscribed: boolean;
}

export async function recordApplication(
  tx: ScopedDb,
  localBodyId: number,
): Promise<SlotState> {
  await tx.execute(
    sql`SELECT pg_advisory_xact_lock(${SLOT_LOCK_NAMESPACE}, ${localBodyId})`,
  );

  const rows = await tx.execute(sql`
    SELECT slot_capacity, signups_open
      FROM local_bodies
     WHERE id = ${localBodyId}
  `);

  const body = (
    rows as unknown as { slot_capacity: number; signups_open: boolean }[]
  )[0];
  if (!body) {
    throw new ApiError("UNKNOWN_GEOGRAPHY", "Local body not found");
  }
  if (!body.signups_open) {
    throw new ApiError(
      "PANCHAYAT_CLOSED",
      "This panchayat is not accepting applications at the moment",
    );
  }

  // Counted through the SECURITY DEFINER helper: the applicant cannot see other
  // applicants' rows under RLS, so a direct count here would always read zero.
  const [{ filled }] = (await tx.execute(
    sql`SELECT app.filled_slots(${localBodyId}) AS filled`,
  )) as unknown as { filled: number }[];

  const applications = filled + 1;
  return {
    applications,
    slotCapacity: body.slot_capacity,
    overSubscribed: applications > body.slot_capacity,
  };
}

export function checkFormIntegrity(params: {
  honeypot?: string | null;
  fillMs?: number | null;
}): void {
  if (params.honeypot && params.honeypot.trim() !== "") {
    throw new ApiError("HONEYPOT_TRIPPED", "Submission rejected");
  }
  if (
    typeof params.fillMs === "number" &&
    params.fillMs >= 0 &&
    params.fillMs < MIN_FILL_MS
  ) {
    throw new ApiError(
      "SUBMITTED_TOO_FAST",
      "That was submitted too quickly. Please try again.",
    );
  }
}

/**
 * Record the abuse signals and raise flags for a human.
 *
 * Never blocks. A shared device in an Akshaya centre is exactly the setting
 * this programme recruits from, so several signups from one device is a
 * question for a reviewer, not grounds for rejection.
 */
export async function recordSignupSignals(
  tx: ScopedDb,
  params: {
    agentId: number;
    districtId: number;
    localBodyId: number | null;
    deviceHash: string | null;
    ipPrefix: string | null;
    fillMs: number | null;
  },
): Promise<void> {
  await tx.insert(signupSignals).values({
    agentId: params.agentId,
    deviceHash: params.deviceHash,
    ipPrefix: params.ipPrefix,
    fillMs: params.fillMs,
    honeypotTripped: false,
  });

  if (params.deviceHash) {
    const [{ count }] = (await tx.execute<{ count: number }>(sql`
      SELECT count(*)::int AS count FROM signup_signals
       WHERE device_hash = ${params.deviceHash}
         AND created_at > now() - interval '30 days'
    `)) as unknown as { count: number }[];

    if (count >= 3) {
      await tx.insert(reviewFlags).values({
        kind: "MULTIPLE_SIGNUPS_ONE_DEVICE",
        agentId: params.agentId,
        districtId: params.districtId,
        localBodyId: params.localBodyId,
        detail: { signupsFromDevice: count, windowDays: 30 },
      });
    }
  }

  // A spike in one panchayat: more than five applications in 24 hours where
  // the programme allows ten in total. Skipped for unplaced applications —
  // there is no panchayat to spike.
  if (params.localBodyId === null) return;

  const [{ recent }] = (await tx.execute<{ recent: number }>(sql`
    SELECT count(*)::int AS recent FROM agents
     WHERE local_body_id = ${params.localBodyId}
       AND created_at > now() - interval '24 hours'
  `)) as unknown as { recent: number }[];

  if (recent >= 5) {
    await tx.insert(reviewFlags).values({
      kind: "PANCHAYAT_SIGNUP_SPIKE",
      agentId: params.agentId,
      districtId: params.districtId,
      localBodyId: params.localBodyId,
      detail: { signupsIn24h: recent },
    });
  }
}

/**
 * The district must exist even when the local body is not seeded yet.
 *
 * Without this an unplaced application could name any district id at all, and
 * the agent code — CA-<district>-<sequence> — would be issued against nothing.
 */
export async function assertDistrictExists(
  tx: ScopedDb,
  districtId: number,
): Promise<void> {
  const [row] = await tx
    .select({ id: districts.id })
    .from(districts)
    .where(eq(districts.id, districtId))
    .limit(1);
  if (!row) {
    throw new ApiError("UNKNOWN_GEOGRAPHY", "That district does not exist", {
      details: { field: "districtId" },
    });
  }
}

/** One account per mobile number, even though the number is unverified. */
export async function assertMobileUnused(
  tx: ScopedDb,
  mobile: string,
): Promise<void> {
  const existing = await tx
    .select({ id: agents.id })
    .from(agents)
    .where(eq(agents.mobile, mobile))
    .limit(1);

  if (existing.length > 0) {
    throw new ApiError(
      "MOBILE_ALREADY_USED",
      "An application already exists for this mobile number",
      { details: { field: "mobile" } },
    );
  }
}

export async function assertNotAlreadyRegistered(
  tx: ScopedDb,
  userId: number,
): Promise<void> {
  const existing = await tx
    .select({ id: agents.id, agentCode: agents.agentCode })
    .from(agents)
    .where(eq(agents.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    throw new ApiError("ALREADY_REGISTERED", "This account already has an application", {
      details: { agentCode: existing[0].agentCode },
    });
  }
}

/** Districts with a code sequence, used by the seed sanity check. */
export async function districtsReady(tx: ScopedDb): Promise<number> {
  const rows = await tx
    .select({ count: sql<number>`count(*)::int` })
    .from(agentCodeSequences)
    .innerJoin(districts, eq(districts.id, agentCodeSequences.districtId))
    .where(gte(agentCodeSequences.nextSeq, 1));
  return rows[0]?.count ?? 0;
}

export { and };
