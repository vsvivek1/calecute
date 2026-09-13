/**
 * Admin reports.
 *
 * Every report shares one filter shape (geography + date range) and one output
 * path (JSON, CSV or PDF), so adding a report means adding a query and a column
 * list, not another endpoint convention.
 *
 * District scoping, and why it is in this file
 * -------------------------------------------
 * For tables that hold agent or money data, row-level security does the work:
 * an admin scoped to Kozhikode selecting from `agents` sees only Kozhikode.
 *
 * Coverage reports are the exception, and it is worth being explicit about why.
 * They are driven by `local_bodies` and `districts`, which are deliberately
 * PUBLIC — the recruitment page has to render a district and panchayat picker
 * before anyone signs in. A report that starts from those tables therefore sees
 * all fourteen districts, and a LEFT JOIN to agents would happily list every
 * panchayat in the state to a single-district admin.
 *
 * So `geoWhere` always appends `district IN (SELECT app.visible_districts())`.
 * That is the same function the RLS policies call, so scoping still has exactly
 * one definition in the database rather than a rule each report re-implements —
 * and because every report is required to pass its district column to this one
 * helper, a new report cannot be written without it.
 */
import { z } from "zod";
import { sql, type SQL } from "drizzle-orm";
import type { ScopedDb } from "@/db/rls";
import type { Column } from "./export/csv";
import { ts } from "@/db/values";

export const reportFilterSchema = z.object({
  districtId: z.coerce.number().int().positive().optional(),
  blockId: z.coerce.number().int().positive().optional(),
  localBodyId: z.coerce.number().int().positive().optional(),
  wardId: z.coerce.number().int().positive().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  format: z.enum(["json", "csv", "pdf"]).default("json"),
  /**
   * Default sized to the domain, not to a round number.
   *
   * Kerala has 941 gram panchayats plus 93 urban bodies, so a coverage report
   * with the old 500 default silently returned half the state and set
   * `truncated`. An admin looking for panchayats with no agents needs all of
   * them; that is the entire purpose of the report.
   */
  limit: z.coerce.number().int().min(1).max(5000).default(2000),
});

export type ReportFilter = z.infer<typeof reportFilterSchema>;

/**
 * Geography predicates, applied to whichever table aliases a report uses.
 *
 * `districtId` is REQUIRED, not optional: it is the column this helper scopes to
 * the caller's visible districts, and a report that could not name one would be
 * a report that leaks across districts.
 */
export function geoWhere(
  filter: ReportFilter,
  columns: {
    districtId: SQL | string;
    blockId?: SQL | string;
    localBodyId?: SQL | string;
    wardId?: SQL | string;
  },
): SQL {
  const districtColumn = sql.raw(String(columns.districtId));

  const clauses: SQL[] = [
    // Not optional and not caller-supplied. app.visible_districts() returns
    // every district for a SUPER_ADMIN, the assigned ones for a DISTRICT_ADMIN,
    // and nothing for anyone else.
    sql`${districtColumn} IN (SELECT app.visible_districts())`,
  ];
  if (filter.districtId) {
    clauses.push(sql`${districtColumn} = ${filter.districtId}`);
  }
  if (filter.blockId && columns.blockId) {
    clauses.push(sql`${sql.raw(String(columns.blockId))} = ${filter.blockId}`);
  }
  if (filter.localBodyId && columns.localBodyId) {
    clauses.push(sql`${sql.raw(String(columns.localBodyId))} = ${filter.localBodyId}`);
  }
  if (filter.wardId && columns.wardId) {
    clauses.push(sql`${sql.raw(String(columns.wardId))} = ${filter.wardId}`);
  }
  return sql.join(clauses, sql` AND `);
}

export function dateWhere(filter: ReportFilter, column: string): SQL {
  const clauses: SQL[] = [sql`1 = 1`];
  // ts() rather than the Date itself: these are raw fragments, so no column
  // type is available to tell the driver how to serialize it.
  if (filter.from) clauses.push(sql`${sql.raw(column)} >= ${ts(filter.from)}`);
  if (filter.to) clauses.push(sql`${sql.raw(column)} <= ${ts(filter.to)}`);
  return sql.join(clauses, sql` AND `);
}

export interface ReportDefinition<Row> {
  slug: string;
  title: string;
  description: string;
  columns: Column<Row>[];
  run: (tx: ScopedDb, filter: ReportFilter) => Promise<Row[]>;
}

const rows = async <T>(tx: ScopedDb, query: SQL): Promise<T[]> =>
  (await tx.execute(query)) as unknown as T[];

/* --------------------------------------------------------------- coverage */

export interface PanchayatCoverageRow {
  localBodyId: number;
  localBodyNameEn: string;
  localBodyNameMl: string;
  type: string;
  districtNameEn: string;
  districtNameMl: string;
  blockNameEn: string | null;
  slotCapacity: number;
  agentsApproved: number;
  agentsPending: number;
  slotsFilled: number;
  slotsRemaining: number;
  waitlisted: number;
  signupsOpen: boolean;
}

const COVERAGE_SELECT = sql`
  SELECT
    lb.id                          AS "localBodyId",
    lb.name_en                     AS "localBodyNameEn",
    lb.name_ml                     AS "localBodyNameMl",
    lb.type::text                  AS type,
    d.name_en                      AS "districtNameEn",
    d.name_ml                      AS "districtNameMl",
    bp.name_en                     AS "blockNameEn",
    lb.slot_capacity               AS "slotCapacity",
    COALESCE(a.approved, 0)::int   AS "agentsApproved",
    COALESCE(a.pending, 0)::int    AS "agentsPending",
    COALESCE(a.filled, 0)::int     AS "slotsFilled",
    GREATEST(lb.slot_capacity - COALESCE(a.filled, 0), 0)::int AS "slotsRemaining",
    COALESCE(w.waiting, 0)::int    AS waitlisted,
    lb.signups_open                AS "signupsOpen"
  FROM local_bodies lb
  JOIN districts d ON d.id = lb.district_id
  LEFT JOIN block_panchayats bp ON bp.id = lb.block_panchayat_id
  LEFT JOIN (
    SELECT local_body_id,
           count(*) FILTER (WHERE status = 'APPROVED')       AS approved,
           count(*) FILTER (WHERE status = 'PENDING_REVIEW') AS pending,
           count(*) FILTER (WHERE status IN ('APPROVED','PENDING_REVIEW')) AS filled
      FROM agents GROUP BY local_body_id
  ) a ON a.local_body_id = lb.id
  LEFT JOIN (
    SELECT local_body_id, count(*) AS waiting
      FROM waitlist_entries WHERE cleared_at IS NULL
      GROUP BY local_body_id
  ) w ON w.local_body_id = lb.id
`;

const coverageColumns: Column<PanchayatCoverageRow>[] = [
  { key: "district", header: "District", value: (r) => r.districtNameEn },
  { key: "districtMl", header: "District (ML)", value: (r) => r.districtNameMl },
  { key: "block", header: "Block", value: (r) => r.blockNameEn ?? "—" },
  { key: "name", header: "Local body", value: (r) => r.localBodyNameEn },
  { key: "nameMl", header: "Local body (ML)", value: (r) => r.localBodyNameMl },
  { key: "type", header: "Type", value: (r) => r.type },
  { key: "capacity", header: "Slots", value: (r) => r.slotCapacity },
  { key: "approved", header: "Approved", value: (r) => r.agentsApproved },
  { key: "pending", header: "Pending", value: (r) => r.agentsPending },
  { key: "remaining", header: "Remaining", value: (r) => r.slotsRemaining },
  { key: "waitlisted", header: "Waitlist", value: (r) => r.waitlisted },
  { key: "open", header: "Open", value: (r) => (r.signupsOpen ? "yes" : "no") },
];

/**
 * The default admin landing view.
 *
 * Sorted by district then name so an admin reads it as a work list: these are
 * the places with nobody, go recruit there next.
 */
export const zeroAgentPanchayats: ReportDefinition<PanchayatCoverageRow> = {
  slug: "zero-agent-panchayats",
  title: "Panchayats with zero agents",
  description:
    "Local bodies with no agent in any state. This is where recruitment goes next.",
  columns: coverageColumns,
  run: (tx, filter) =>
    rows(
      tx,
      sql`${COVERAGE_SELECT}
        WHERE ${geoWhere(filter, {
          districtId: "lb.district_id",
          blockId: "lb.block_panchayat_id",
          localBodyId: "lb.id",
        })}
          AND COALESCE(a.filled, 0) = 0
        ORDER BY d.name_en ASC, lb.name_en ASC
        LIMIT ${filter.limit}`,
    ),
};

export const belowThresholdPanchayats: ReportDefinition<PanchayatCoverageRow> = {
  slug: "below-threshold-panchayats",
  title: "Panchayats below threshold",
  description: "Local bodies with fewer than three agents.",
  columns: coverageColumns,
  run: (tx, filter) =>
    rows(
      tx,
      sql`${COVERAGE_SELECT}
        WHERE ${geoWhere(filter, {
          districtId: "lb.district_id",
          blockId: "lb.block_panchayat_id",
          localBodyId: "lb.id",
        })}
          AND COALESCE(a.filled, 0) BETWEEN 1 AND 2
        ORDER BY COALESCE(a.filled, 0) ASC, d.name_en ASC, lb.name_en ASC
        LIMIT ${filter.limit}`,
    ),
};

export const panchayatCoverage: ReportDefinition<PanchayatCoverageRow> = {
  slug: "panchayat-coverage",
  title: "Agents per panchayat",
  description: "Every local body with slots filled and remaining.",
  columns: coverageColumns,
  run: (tx, filter) =>
    rows(
      tx,
      sql`${COVERAGE_SELECT}
        WHERE ${geoWhere(filter, {
          districtId: "lb.district_id",
          blockId: "lb.block_panchayat_id",
          localBodyId: "lb.id",
        })}
        ORDER BY d.name_en ASC, lb.name_en ASC
        LIMIT ${filter.limit}`,
    ),
};

export const fullWithWaitlist: ReportDefinition<PanchayatCoverageRow> = {
  slug: "full-panchayats-waitlist",
  title: "Full panchayats with a waitlist",
  description:
    "Local bodies at capacity that still have people waiting — candidates for raising the slot count.",
  columns: coverageColumns,
  run: (tx, filter) =>
    rows(
      tx,
      sql`${COVERAGE_SELECT}
        WHERE ${geoWhere(filter, {
          districtId: "lb.district_id",
          localBodyId: "lb.id",
        })}
          AND COALESCE(a.filled, 0) >= lb.slot_capacity
          AND COALESCE(w.waiting, 0) > 0
        ORDER BY COALESCE(w.waiting, 0) DESC, d.name_en ASC
        LIMIT ${filter.limit}`,
    ),
};

export interface ZeroAgentWardRow {
  wardId: number;
  wardNumber: number;
  wardNameEn: string | null;
  wardStatus: string;
  localBodyNameEn: string;
  localBodyNameMl: string;
  districtNameEn: string;
}

/** Wards with nobody, inside local bodies that already have at least one agent. */
export const zeroAgentWards: ReportDefinition<ZeroAgentWardRow> = {
  slug: "zero-agent-wards",
  title: "Wards with zero agents in covered panchayats",
  description:
    "Gaps inside local bodies that are already active. Wards marked PENDING have no official name loaded.",
  columns: [
    { key: "district", header: "District", value: (r) => r.districtNameEn },
    { key: "body", header: "Local body", value: (r) => r.localBodyNameEn },
    { key: "bodyMl", header: "Local body (ML)", value: (r) => r.localBodyNameMl },
    { key: "ward", header: "Ward no.", value: (r) => r.wardNumber },
    { key: "wardName", header: "Ward name", value: (r) => r.wardNameEn ?? "—" },
    { key: "status", header: "Ward data", value: (r) => r.wardStatus },
  ],
  run: (tx, filter) =>
    rows(
      tx,
      sql`
        SELECT w.id AS "wardId", w.number AS "wardNumber",
               w.name_en AS "wardNameEn", w.status::text AS "wardStatus",
               lb.name_en AS "localBodyNameEn", lb.name_ml AS "localBodyNameMl",
               d.name_en AS "districtNameEn"
          FROM wards w
          JOIN local_bodies lb ON lb.id = w.local_body_id
          JOIN districts d ON d.id = lb.district_id
         WHERE ${geoWhere(filter, {
           districtId: "lb.district_id",
           localBodyId: "lb.id",
         })}
           AND EXISTS (SELECT 1 FROM agents a WHERE a.local_body_id = lb.id
                        AND a.status IN ('APPROVED','PENDING_REVIEW'))
           AND NOT EXISTS (SELECT 1 FROM agents a WHERE a.ward_id = w.id
                        AND a.status IN ('APPROVED','PENDING_REVIEW'))
         ORDER BY d.name_en, lb.name_en, w.number
         LIMIT ${filter.limit}`,
    ),
};

/* ----------------------------------------------------------------- agents */

export interface SignupTrendRow {
  day: string;
  districtNameEn: string;
  signups: number;
  approved: number;
}

export const signupsOverTime: ReportDefinition<SignupTrendRow> = {
  slug: "signups-over-time",
  title: "Signups over time",
  description: "Applications per day by district.",
  columns: [
    { key: "day", header: "Date", value: (r) => r.day },
    { key: "district", header: "District", value: (r) => r.districtNameEn },
    { key: "signups", header: "Signups", value: (r) => r.signups },
    { key: "approved", header: "Approved", value: (r) => r.approved },
  ],
  run: (tx, filter) =>
    rows(
      tx,
      sql`
        SELECT to_char(date_trunc('day', a.created_at), 'YYYY-MM-DD') AS day,
               d.name_en AS "districtNameEn",
               count(*)::int AS signups,
               count(*) FILTER (WHERE a.status = 'APPROVED')::int AS approved
          FROM agents a
          JOIN districts d ON d.id = a.district_id
         WHERE ${geoWhere(filter, {
           districtId: "a.district_id",
           localBodyId: "a.local_body_id",
           wardId: "a.ward_id",
         })}
           AND ${dateWhere(filter, "a.created_at")}
         GROUP BY 1, 2
         ORDER BY 1 DESC, 2 ASC
         LIMIT ${filter.limit}`,
    ),
};

export interface AgentListRow {
  agentId: number;
  agentCode: string;
  name: string;
  status: string;
  districtNameEn: string;
  localBodyNameEn: string;
  localBodyNameMl: string;
  wardNumber: number | null;
  occupation: string;
  education: string | null;
  hoursPerDay: string | null;
  createdAt: string;
  daysSinceSignup: number;
  customers: number;
  netCommissionPaise: number;
}

const agentColumns: Column<AgentListRow>[] = [
  { key: "code", header: "Agent code", value: (r) => r.agentCode },
  { key: "name", header: "Name", value: (r) => r.name },
  { key: "status", header: "Status", value: (r) => r.status },
  { key: "district", header: "District", value: (r) => r.districtNameEn },
  { key: "body", header: "Local body", value: (r) => r.localBodyNameEn },
  { key: "bodyMl", header: "Local body (ML)", value: (r) => r.localBodyNameMl },
  { key: "ward", header: "Ward", value: (r) => r.wardNumber ?? "—" },
  { key: "occupation", header: "Occupation", value: (r) => r.occupation },
  { key: "education", header: "Education", value: (r) => r.education ?? "—" },
  { key: "hours", header: "Hours/day", value: (r) => r.hoursPerDay ?? "—" },
  { key: "signedUp", header: "Signed up", value: (r) => r.createdAt },
  { key: "days", header: "Days", value: (r) => r.daysSinceSignup },
  { key: "customers", header: "Customers", value: (r) => r.customers },
  {
    key: "commission",
    header: "Net commission (INR)",
    value: (r) => (r.netCommissionPaise / 100).toFixed(2),
  },
];

const AGENT_SELECT = sql`
  SELECT a.id AS "agentId", a.agent_code AS "agentCode", u.name,
         a.status::text AS status,
         d.name_en AS "districtNameEn",
         lb.name_en AS "localBodyNameEn", lb.name_ml AS "localBodyNameMl",
         w.number AS "wardNumber", a.occupation,
         q.education::text AS education, q.hours_per_day::text AS "hoursPerDay",
         to_char(a.created_at, 'YYYY-MM-DD') AS "createdAt",
         EXTRACT(day FROM now() - a.created_at)::int AS "daysSinceSignup",
         COALESCE(cu.customers, 0)::int AS customers,
         COALESCE(co.net, 0)::bigint AS "netCommissionPaise"
    FROM agents a
    JOIN users u ON u.id = a.user_id
    JOIN districts d ON d.id = a.district_id
    JOIN local_bodies lb ON lb.id = a.local_body_id
    LEFT JOIN wards w ON w.id = a.ward_id
    LEFT JOIN agent_qualifications q ON q.agent_id = a.id
    LEFT JOIN (
      SELECT agent_id, count(*) AS customers FROM attributions GROUP BY agent_id
    ) cu ON cu.agent_id = a.id
    LEFT JOIN (
      SELECT agent_id, sum(net_commission_paise) AS net
        FROM commissions WHERE status <> 'CANCELLED' GROUP BY agent_id
    ) co ON co.agent_id = a.id
`;

export const pendingVerification: ReportDefinition<AgentListRow> = {
  slug: "pending-verification",
  title: "Agents pending verification",
  description: "Applications awaiting approve or reject.",
  columns: agentColumns,
  run: (tx, filter) =>
    rows(
      tx,
      sql`${AGENT_SELECT}
        WHERE ${geoWhere(filter, {
          districtId: "a.district_id",
          localBodyId: "a.local_body_id",
          wardId: "a.ward_id",
        })}
          AND a.status = 'PENDING_REVIEW'
          AND ${dateWhere(filter, "a.created_at")}
        ORDER BY a.created_at ASC
        LIMIT ${filter.limit}`,
    ),
};

/** Approved agents with no sale after N days. N is 30, 60 or 90. */
export function noSalesAfter(days: 30 | 60 | 90): ReportDefinition<AgentListRow> {
  return {
    slug: `no-sales-${days}`,
    title: `Agents with no sale after ${days} days`,
    description: `Approved agents whose first sale has not happened ${days} days after signup.`,
    columns: agentColumns,
    run: (tx, filter) =>
      rows(
        tx,
        sql`${AGENT_SELECT}
          WHERE ${geoWhere(filter, {
            districtId: "a.district_id",
            localBodyId: "a.local_body_id",
          })}
            AND a.status = 'APPROVED'
            AND a.first_sale_at IS NULL
            AND a.created_at <= now() - (${days} || ' days')::interval
          ORDER BY a.created_at ASC
          LIMIT ${filter.limit}`,
      ),
  };
}

export const topAgentsByRevenue: ReportDefinition<AgentListRow> = {
  slug: "top-agents",
  title: "Top agents by revenue",
  description: "Ranked by net commission earned.",
  columns: agentColumns,
  run: (tx, filter) =>
    rows(
      tx,
      sql`${AGENT_SELECT}
        WHERE ${geoWhere(filter, {
          districtId: "a.district_id",
          localBodyId: "a.local_body_id",
        })}
        ORDER BY COALESCE(co.net, 0) DESC, a.created_at ASC
        LIMIT ${filter.limit}`,
    ),
};

/** The filterable agent directory: education, experience, availability, reach. */
export const agentDirectory: ReportDefinition<AgentListRow> = {
  slug: "agent-directory",
  title: "Agents",
  description:
    "All agents, filterable by geography, status and the optional qualification answers.",
  columns: agentColumns,
  run: (tx, filter) =>
    rows(
      tx,
      sql`${AGENT_SELECT}
        WHERE ${geoWhere(filter, {
          districtId: "a.district_id",
          localBodyId: "a.local_body_id",
          wardId: "a.ward_id",
        })}
          AND ${dateWhere(filter, "a.created_at")}
        ORDER BY a.created_at DESC
        LIMIT ${filter.limit}`,
    ),
};

/* ---------------------------------------------------------------- revenue */

export interface RevenueRow {
  districtNameEn: string;
  localBodyNameEn: string | null;
  accruedPaise: number;
  paidPaise: number;
  pendingPaise: number;
  tdsPaise: number;
  agents: number;
}

const revenueColumns: Column<RevenueRow>[] = [
  { key: "district", header: "District", value: (r) => r.districtNameEn },
  { key: "body", header: "Local body", value: (r) => r.localBodyNameEn ?? "(all)" },
  { key: "agents", header: "Agents", value: (r) => r.agents },
  {
    key: "accrued",
    header: "Accrued (INR)",
    value: (r) => (r.accruedPaise / 100).toFixed(2),
  },
  { key: "paid", header: "Paid (INR)", value: (r) => (r.paidPaise / 100).toFixed(2) },
  {
    key: "pending",
    header: "Pending (INR)",
    value: (r) => (r.pendingPaise / 100).toFixed(2),
  },
  { key: "tds", header: "TDS (INR)", value: (r) => (r.tdsPaise / 100).toFixed(2) },
];

export const revenueByGeography: ReportDefinition<RevenueRow> = {
  slug: "revenue-by-geography",
  title: "Commission by geography",
  description: "Accrued, paid and pending commission per district and local body.",
  columns: revenueColumns,
  run: (tx, filter) =>
    rows(
      tx,
      sql`
        SELECT d.name_en AS "districtNameEn",
               lb.name_en AS "localBodyNameEn",
               COALESCE(sum(c.net_commission_paise), 0)::bigint AS "accruedPaise",
               COALESCE(sum(c.net_commission_paise) FILTER (WHERE c.status = 'PAID'), 0)::bigint AS "paidPaise",
               COALESCE(sum(c.net_commission_paise) FILTER (WHERE c.status IN ('ACCRUED','APPROVED')), 0)::bigint AS "pendingPaise",
               COALESCE(sum(c.tds_paise), 0)::bigint AS "tdsPaise",
               count(DISTINCT c.agent_id)::int AS agents
          FROM commissions c
          JOIN districts d ON d.id = c.district_id
          JOIN local_bodies lb ON lb.id = c.local_body_id
         WHERE ${geoWhere(filter, {
           districtId: "c.district_id",
           localBodyId: "c.local_body_id",
         })}
           AND ${dateWhere(filter, "c.accrued_at")}
           AND c.status <> 'CANCELLED'
         GROUP BY 1, 2
         ORDER BY "accruedPaise" DESC
         LIMIT ${filter.limit}`,
    ),
};

export interface LiabilityRow {
  agentCode: string;
  name: string;
  districtNameEn: string;
  outstandingPaise: number;
  panStatus: string;
  payable: string;
}

/** What we owe but have not paid, and whether it can actually be released. */
export const outstandingLiability: ReportDefinition<LiabilityRow> = {
  slug: "outstanding-liability",
  title: "Outstanding commission liability",
  description:
    "Commission accrued and not yet paid, per agent, with whether a payout is currently releasable.",
  columns: [
    { key: "code", header: "Agent code", value: (r) => r.agentCode },
    { key: "name", header: "Name", value: (r) => r.name },
    { key: "district", header: "District", value: (r) => r.districtNameEn },
    {
      key: "outstanding",
      header: "Outstanding (INR)",
      value: (r) => (r.outstandingPaise / 100).toFixed(2),
    },
    { key: "pan", header: "PAN status", value: (r) => r.panStatus },
    { key: "payable", header: "Releasable", value: (r) => r.payable },
  ],
  run: (tx, filter) =>
    rows(
      tx,
      sql`
        SELECT a.agent_code AS "agentCode", u.name,
               d.name_en AS "districtNameEn",
               COALESCE(sum(c.net_commission_paise), 0)::bigint AS "outstandingPaise",
               COALESCE(pp.pan_status::text, 'NOT_SUBMITTED') AS "panStatus",
               CASE WHEN pp.pan_status = 'VERIFIED' AND a.mobile_verified_at IS NOT NULL
                    THEN 'yes' ELSE 'no' END AS payable
          FROM commissions c
          JOIN agents a ON a.id = c.agent_id
          JOIN users u ON u.id = a.user_id
          JOIN districts d ON d.id = c.district_id
          LEFT JOIN payout_profiles pp ON pp.agent_id = a.id
         WHERE ${geoWhere(filter, { districtId: "c.district_id" })}
           AND c.status IN ('ACCRUED', 'APPROVED')
         GROUP BY a.agent_code, u.name, d.name_en, pp.pan_status, a.mobile_verified_at
        HAVING sum(c.net_commission_paise) > 0
         ORDER BY "outstandingPaise" DESC
         LIMIT ${filter.limit}`,
    ),
};

export interface TdsRow {
  financialYear: string;
  agentCode: string;
  name: string;
  panMasked: string;
  districtNameEn: string;
  grossCommissionPaise: number;
  tdsPaise: number;
  netPaise: number;
  section: string;
}

/**
 * TDS per agent per financial year, shaped for a Form 16A preparation run.
 *
 * PAN appears masked. Producing the actual certificates needs the full PAN,
 * which is a deliberate manual step run by an operator against the decrypt
 * helper — it is not something an admin endpoint hands out.
 */
export const tdsByFinancialYear: ReportDefinition<TdsRow> = {
  slug: "tds-by-financial-year",
  title: "TDS per agent per financial year",
  description:
    "Section 194H deductions, grouped by financial year. PAN is masked; see README for issuing Form 16A.",
  columns: [
    { key: "fy", header: "Financial year", value: (r) => r.financialYear },
    { key: "code", header: "Agent code", value: (r) => r.agentCode },
    { key: "name", header: "Name", value: (r) => r.name },
    { key: "pan", header: "PAN", value: (r) => r.panMasked },
    { key: "district", header: "District", value: (r) => r.districtNameEn },
    {
      key: "gross",
      header: "Gross commission (INR)",
      value: (r) => (r.grossCommissionPaise / 100).toFixed(2),
    },
    { key: "tds", header: "TDS (INR)", value: (r) => (r.tdsPaise / 100).toFixed(2) },
    { key: "net", header: "Net paid (INR)", value: (r) => (r.netPaise / 100).toFixed(2) },
    { key: "section", header: "Section", value: (r) => r.section },
  ],
  run: (tx, filter) =>
    rows(
      tx,
      sql`
        SELECT c.financial_year AS "financialYear",
               a.agent_code AS "agentCode", u.name,
               CASE WHEN pp.pan_last4 IS NULL THEN 'NOT SUBMITTED'
                    ELSE 'XXXXX' || pp.pan_last4 END AS "panMasked",
               d.name_en AS "districtNameEn",
               COALESCE(sum(c.gross_commission_paise), 0)::bigint AS "grossCommissionPaise",
               COALESCE(sum(c.tds_paise), 0)::bigint AS "tdsPaise",
               COALESCE(sum(c.net_commission_paise), 0)::bigint AS "netPaise",
               '194H' AS section
          FROM commissions c
          JOIN agents a ON a.id = c.agent_id
          JOIN users u ON u.id = a.user_id
          JOIN districts d ON d.id = c.district_id
          LEFT JOIN payout_profiles pp ON pp.agent_id = a.id
         WHERE ${geoWhere(filter, { districtId: "c.district_id" })}
           AND c.status <> 'CANCELLED'
         GROUP BY 1, 2, 3, 4, 5
         ORDER BY 1 DESC, "tdsPaise" DESC
         LIMIT ${filter.limit}`,
    ),
};

/* ----------------------------------------------------------------- funnel */

export interface FunnelRow {
  districtNameEn: string;
  pageViews: number;
  signupStarted: number;
  signupSubmitted: number;
  verified: number;
  productAssigned: number;
  firstSale: number;
  dropOffViewToStart: string;
  dropOffStartToSubmit: string;
  dropOffSubmitToVerified: string;
}

/**
 * Page views come from the analytics events table, which carries no PII and no
 * user id, so the funnel is by district rather than by person.
 */
export const funnel: ReportDefinition<FunnelRow> = {
  slug: "funnel",
  title: "Recruitment funnel",
  description:
    "Page view → signup started → submitted → verified → product assigned → first sale, with drop-off per stage.",
  columns: [
    { key: "district", header: "District", value: (r) => r.districtNameEn },
    { key: "views", header: "Page views", value: (r) => r.pageViews },
    { key: "started", header: "Signup started", value: (r) => r.signupStarted },
    { key: "submitted", header: "Submitted", value: (r) => r.signupSubmitted },
    { key: "verified", header: "Verified", value: (r) => r.verified },
    { key: "assigned", header: "Product assigned", value: (r) => r.productAssigned },
    { key: "sale", header: "First sale", value: (r) => r.firstSale },
    { key: "d1", header: "Drop view→start", value: (r) => r.dropOffViewToStart },
    { key: "d2", header: "Drop start→submit", value: (r) => r.dropOffStartToSubmit },
    { key: "d3", header: "Drop submit→verified", value: (r) => r.dropOffSubmitToVerified },
  ],
  run: (tx, filter) =>
    rows(
      tx,
      sql`
        WITH ev AS (
          SELECT district_id,
                 count(DISTINCT session_id) FILTER (WHERE event = 'page_view')     AS views,
                 count(DISTINCT session_id) FILTER (WHERE event = 'signup_start')  AS started
            FROM analytics_events
           WHERE ${dateWhere(filter, "created_at")}
           GROUP BY district_id
        ), ag AS (
          SELECT a.district_id,
                 count(*)::int AS submitted,
                 count(*) FILTER (WHERE a.status = 'APPROVED')::int AS verified,
                 count(*) FILTER (WHERE EXISTS (
                   SELECT 1 FROM agent_products ap WHERE ap.agent_id = a.id))::int AS assigned,
                 count(*) FILTER (WHERE a.first_sale_at IS NOT NULL)::int AS sale
            FROM agents a
           WHERE ${dateWhere(filter, "a.created_at")}
           GROUP BY a.district_id
        )
        SELECT d.name_en AS "districtNameEn",
               COALESCE(ev.views, 0)::int      AS "pageViews",
               COALESCE(ev.started, 0)::int    AS "signupStarted",
               COALESCE(ag.submitted, 0)       AS "signupSubmitted",
               COALESCE(ag.verified, 0)        AS verified,
               COALESCE(ag.assigned, 0)        AS "productAssigned",
               COALESCE(ag.sale, 0)            AS "firstSale",
               CASE WHEN COALESCE(ev.views, 0) = 0 THEN 'n/a'
                    ELSE round(100.0 * (ev.views - COALESCE(ev.started, 0)) / ev.views, 1) || '%'
               END AS "dropOffViewToStart",
               CASE WHEN COALESCE(ev.started, 0) = 0 THEN 'n/a'
                    ELSE round(100.0 * (ev.started - COALESCE(ag.submitted, 0)) / ev.started, 1) || '%'
               END AS "dropOffStartToSubmit",
               CASE WHEN COALESCE(ag.submitted, 0) = 0 THEN 'n/a'
                    ELSE round(100.0 * (ag.submitted - COALESCE(ag.verified, 0)) / ag.submitted, 1) || '%'
               END AS "dropOffSubmitToVerified"
          FROM districts d
          LEFT JOIN ev ON ev.district_id = d.id
          LEFT JOIN ag ON ag.district_id = d.id
         WHERE ${geoWhere(filter, { districtId: "d.id" })}
         ORDER BY d.name_en
         LIMIT ${filter.limit}`,
    ),
};

/** Every report the admin API exposes, keyed by slug. */
export const REPORTS = {
  [zeroAgentPanchayats.slug]: zeroAgentPanchayats,
  [belowThresholdPanchayats.slug]: belowThresholdPanchayats,
  [panchayatCoverage.slug]: panchayatCoverage,
  [fullWithWaitlist.slug]: fullWithWaitlist,
  [zeroAgentWards.slug]: zeroAgentWards,
  [signupsOverTime.slug]: signupsOverTime,
  [pendingVerification.slug]: pendingVerification,
  [agentDirectory.slug]: agentDirectory,
  "no-sales-30": noSalesAfter(30),
  "no-sales-60": noSalesAfter(60),
  "no-sales-90": noSalesAfter(90),
  [topAgentsByRevenue.slug]: topAgentsByRevenue,
  [revenueByGeography.slug]: revenueByGeography,
  [outstandingLiability.slug]: outstandingLiability,
  [tdsByFinancialYear.slug]: tdsByFinancialYear,
  [funnel.slug]: funnel,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as Record<string, ReportDefinition<any>>;

export const REPORT_SLUGS = Object.keys(REPORTS);
