/**
 * Helpers shared by the agent-facing endpoints.
 */
import { eq, sql } from "drizzle-orm";
import type { ScopedDb } from "@/db/rls";
import { agents } from "@/db/schema";
import { ApiError } from "./errors";

export interface AgentIdentity {
  id: number;
  agentCode: string;
  status: string;
  districtId: number;
  localBodyId: number;
  mobileVerifiedAt: Date | null;
}

/**
 * The agent record for the current user.
 *
 * RLS already limits what a query returns, but an agent endpoint needs the id
 * to filter its own aggregates, and a user with no application should get a
 * clear 404 rather than an empty dashboard.
 */
export async function currentAgent(
  tx: ScopedDb,
  userId: number,
): Promise<AgentIdentity> {
  const [agent] = await tx
    .select({
      id: agents.id,
      agentCode: agents.agentCode,
      status: agents.status,
      districtId: agents.districtId,
      localBodyId: agents.localBodyId,
      mobileVerifiedAt: agents.mobileVerifiedAt,
    })
    .from(agents)
    .where(eq(agents.userId, userId))
    .limit(1);

  if (!agent) {
    throw new ApiError(
      "NOT_FOUND",
      "No agent application found for this account",
      { details: { nextStep: "/api/v1/signup" } },
    );
  }
  return agent;
}

/** Earnings rollup: pending, paid, lifetime — the three numbers on the card. */
export async function earningsFor(
  tx: ScopedDb,
  agentId: number,
): Promise<{
  pendingPaise: number;
  paidPaise: number;
  lifetimePaise: number;
  tdsWithheldPaise: number;
  currency: "INR";
}> {
  const rows = (await tx.execute(sql`
    SELECT
      COALESCE(sum(net_commission_paise) FILTER (WHERE status IN ('ACCRUED','APPROVED')), 0)::bigint AS pending,
      COALESCE(sum(net_commission_paise) FILTER (WHERE status = 'PAID'), 0)::bigint AS paid,
      COALESCE(sum(net_commission_paise) FILTER (WHERE status <> 'CANCELLED' AND status <> 'FORFEITED'), 0)::bigint AS lifetime,
      COALESCE(sum(tds_paise) FILTER (WHERE status <> 'CANCELLED' AND status <> 'FORFEITED'), 0)::bigint AS tds
      FROM commissions
     WHERE agent_id = ${agentId}
  `)) as unknown as {
    pending: string | number;
    paid: string | number;
    lifetime: string | number;
    tds: string | number;
  }[];

  const row = rows[0];
  return {
    pendingPaise: Number(row?.pending ?? 0),
    paidPaise: Number(row?.paid ?? 0),
    lifetimePaise: Number(row?.lifetime ?? 0),
    tdsWithheldPaise: Number(row?.tds ?? 0),
    currency: "INR",
  };
}

/** The referral link an agent shares. Built from a configured public origin. */
export function referralLink(agentCode: string): string {
  const base =
    process.env.PUBLIC_WEB_ORIGIN?.replace(/\/$/, "") ??
    "https://calecutech.com";
  return `${base}/agents?ref=${encodeURIComponent(agentCode)}`;
}

/** Pre-filled WhatsApp share. Malayalam first, matching the public page. */
export function whatsappShareLink(agentCode: string): string {
  const link = referralLink(agentCode);
  const text = [
    "കാലിക്കറ്റ് ടെക്നോളജീസിന്റെ സോഫ്റ്റ്‌വെയർ ഉൽപ്പന്നങ്ങൾ.",
    "Calecute Technologies software products.",
    "",
    link,
  ].join("\n");
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
