/**
 * Geography lookups shared by the public page, the signup flow and the admin
 * reports.
 *
 * Two things live here because getting them wrong would be expensive:
 *
 *  1. Search that matches either script. "Kodenchery", "കോടഞ്ചേരി" and
 *     "kodancheri" must all reach the same row. Exact and prefix matches rank
 *     first; trigram similarity catches the transliteration spellings.
 *
 *  2. Slot availability, computed from the database every time. The public
 *     page states how many places are left in a panchayat, and a wrong number
 *     there is exactly the kind of thing that makes a suspicious visitor
 *     close the tab.
 */
import { and, eq, sql } from "drizzle-orm";
import type { ScopedDb } from "@/db/rls";
import { localBodies, wards } from "@/db/schema";
import { ApiError } from "./errors";

// A type alias, not an interface: drizzle's execute<T> requires an implicit
// index signature, which interfaces do not get.
export type LocalBodySearchRow = {
  id: number;
  nameEn: string;
  nameMl: string;
  type: "GRAM_PANCHAYAT" | "MUNICIPALITY" | "CORPORATION";
  districtId: number;
  blockPanchayatId: number | null;
  slotCapacity: number;
  signupsOpen: boolean;
  wardData: "COMPLETE" | "PARTIAL" | "PENDING";
  filled: number;
  remaining: number;
  waitlisted: number;
};

/**
 * Search local bodies within a district.
 *
 * The query is deliberately one round trip: on a one-bar 4G connection the
 * dependent dropdown is already the slowest interaction in the signup flow.
 */
export async function searchLocalBodies(
  tx: ScopedDb,
  params: {
    districtId?: number;
    query?: string;
    type?: "GRAM_PANCHAYAT" | "MUNICIPALITY" | "CORPORATION";
    onlyOpen?: boolean;
    limit: number;
    offsetId?: number;
  },
): Promise<LocalBodySearchRow[]> {
  const q = params.query?.trim() ?? "";
  const hasQuery = q.length > 0;

  // similarity() needs pg_trgm; the GIN indexes are created in 0001_rls.sql.
  const rows = await tx.execute<LocalBodySearchRow & { rank: number }>(sql`
    SELECT
      lb.id,
      lb.name_en           AS "nameEn",
      lb.name_ml           AS "nameMl",
      lb.type,
      lb.district_id       AS "districtId",
      lb.block_panchayat_id AS "blockPanchayatId",
      lb.slot_capacity     AS "slotCapacity",
      lb.signups_open      AS "signupsOpen",
      lb.ward_data         AS "wardData",
      u.filled                        AS filled,
      GREATEST(lb.slot_capacity - u.filled, 0)::int AS remaining,
      u.waiting                       AS waitlisted,
      ${
        hasQuery
          ? sql`GREATEST(
              CASE WHEN lower(lb.name_en) = lower(${q}) THEN 1.0 ELSE 0 END,
              CASE WHEN lb.name_ml = ${q} THEN 1.0 ELSE 0 END,
              CASE WHEN lower(lb.name_en) LIKE lower(${q}) || '%' THEN 0.9 ELSE 0 END,
              CASE WHEN lb.name_ml LIKE ${q} || '%' THEN 0.9 ELSE 0 END,
              similarity(lb.name_en, ${q}),
              similarity(lb.name_ml, ${q})
            )`
          : sql`0`
      } AS rank
    FROM local_bodies lb
    -- app.slot_usage() rather than a direct count on agents: an anonymous
    -- visitor cannot see agent rows under RLS, so counting them here reported
    -- every panchayat as empty. See drizzle/0003_slot_counts.sql.
    JOIN app.slot_usage() u ON u.local_body_id = lb.id
    WHERE 1 = 1
      ${params.districtId ? sql`AND lb.district_id = ${params.districtId}` : sql``}
      ${params.type ? sql`AND lb.type = ${params.type}::local_body_type` : sql``}
      ${params.onlyOpen ? sql`AND lb.signups_open` : sql``}
      ${
        hasQuery
          ? sql`AND (
              lb.name_en ILIKE '%' || ${q} || '%'
              OR lb.name_ml LIKE '%' || ${q} || '%'
              OR similarity(lb.name_en, ${q}) > 0.25
              OR similarity(lb.name_ml, ${q}) > 0.25
            )`
          : sql``
      }
      ${params.offsetId ? sql`AND lb.id > ${params.offsetId}` : sql``}
    ORDER BY ${hasQuery ? sql`rank DESC,` : sql``} lb.name_en ASC, lb.id ASC
    LIMIT ${params.limit}
  `);

  return rows as unknown as LocalBodySearchRow[];
}

export interface Availability {
  localBodyId: number;
  slotCapacity: number;
  filled: number;
  remaining: number;
  signupsOpen: boolean;
  waitlisted: number;
  /** OPEN | FULL | CLOSED — the three states the public page renders. */
  state: "OPEN" | "FULL" | "CLOSED";
}

/** Live slot availability for one local body. Never cached, never estimated. */
export async function availabilityFor(
  tx: ScopedDb,
  localBodyId: number,
): Promise<Availability> {
  const [body] = await tx
    .select({
      id: localBodies.id,
      slotCapacity: localBodies.slotCapacity,
      signupsOpen: localBodies.signupsOpen,
    })
    .from(localBodies)
    .where(eq(localBodies.id, localBodyId))
    .limit(1);

  if (!body) throw new ApiError("UNKNOWN_GEOGRAPHY", "Local body not found");

  // Counts come from SECURITY DEFINER helpers, not from a direct query: the
  // public page must see the real number of places taken, and RLS hides agent
  // rows from an anonymous caller. The helpers return integers only.
  const [{ filled, waiting }] = (await tx.execute(sql`
    SELECT app.filled_slots(${localBodyId})  AS filled,
           app.waitlist_size(${localBodyId}) AS waiting
  `)) as unknown as { filled: number; waiting: number }[];

  const remaining = Math.max(body.slotCapacity - filled, 0);
  return {
    localBodyId: body.id,
    slotCapacity: body.slotCapacity,
    filled,
    remaining,
    signupsOpen: body.signupsOpen,
    waitlisted: waiting,
    state: !body.signupsOpen ? "CLOSED" : remaining > 0 ? "OPEN" : "FULL",
  };
}

/**
 * Validate a district / local body / ward triple against the seeded data.
 *
 * Every id a client sends is checked here, including that the three actually
 * belong together — otherwise an agent could be filed under a ward in another
 * district and every coverage report would be wrong.
 */
export async function validateGeographySelection(
  tx: ScopedDb,
  selection: { districtId: number; localBodyId: number; wardId?: number | null },
): Promise<{ blockPanchayatId: number | null }> {
  const [body] = await tx
    .select({
      id: localBodies.id,
      districtId: localBodies.districtId,
      blockPanchayatId: localBodies.blockPanchayatId,
    })
    .from(localBodies)
    .where(eq(localBodies.id, selection.localBodyId))
    .limit(1);

  if (!body) {
    throw new ApiError("UNKNOWN_GEOGRAPHY", "That panchayat or municipality does not exist", {
      details: { field: "localBodyId" },
    });
  }
  if (body.districtId !== selection.districtId) {
    throw new ApiError(
      "UNKNOWN_GEOGRAPHY",
      "That panchayat does not belong to the selected district",
      { details: { field: "localBodyId" } },
    );
  }

  if (selection.wardId != null) {
    const [ward] = await tx
      .select({ id: wards.id })
      .from(wards)
      .where(
        and(eq(wards.id, selection.wardId), eq(wards.localBodyId, body.id)),
      )
      .limit(1);
    if (!ward) {
      throw new ApiError(
        "UNKNOWN_GEOGRAPHY",
        "That ward does not belong to the selected panchayat",
        { details: { field: "wardId" } },
      );
    }
  }

  return { blockPanchayatId: body.blockPanchayatId };
}

/** Count of approved + pending agents in a body, used by the slot check. */
export async function occupiedSlots(
  tx: ScopedDb,
  localBodyId: number,
): Promise<number> {
  const [row] = (await tx.execute(
    sql`SELECT app.filled_slots(${localBodyId}) AS count`,
  )) as unknown as { count: number }[];
  return row?.count ?? 0;
}
