/**
 * GET /api/v1/agent/dashboard
 *
 * One request for the whole agent home screen. Deliberately a single
 * round trip: the target device is a budget Android phone on one bar of 4G,
 * where four sequential requests is the difference between usable and not.
 */
import { and, desc, eq, sql } from "drizzle-orm";
import { handler, preflight } from "@/lib/http";
import { authedRoute, ok } from "@/lib/route";
import {
  agentProducts,
  attributions,
  customers,
  payoutProfiles,
  products,
} from "@/db/schema";
import { currentAgent, earningsFor, referralLink, whatsappShareLink } from "@/lib/agent";
import { maskPan } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export const GET = handler(
  authedRoute({ name: "agent.dashboard" }, async (ctx) => {
    const agent = await currentAgent(ctx.tx, ctx.actor.userId);
    const earnings = await earningsFor(ctx.tx, agent.id);

    const [payout] = await ctx.tx
      .select({
        panStatus: payoutProfiles.panStatus,
        panLast4: payoutProfiles.panLast4,
        bankAccountLast4: payoutProfiles.bankAccountLast4,
        upiId: payoutProfiles.upiId,
      })
      .from(payoutProfiles)
      .where(eq(payoutProfiles.agentId, agent.id))
      .limit(1);

    const [{ customerCount }] = (await ctx.tx.execute(sql`
      SELECT count(*)::int AS "customerCount"
        FROM attributions WHERE agent_id = ${agent.id}
    `)) as unknown as { customerCount: number }[];

    const recentCustomers = await ctx.tx
      .select({
        customerId: customers.id,
        displayName: customers.displayName,
        status: customers.status,
        lockedAt: attributions.lockedAt,
      })
      .from(attributions)
      .innerJoin(customers, eq(customers.id, attributions.customerId))
      .where(eq(attributions.agentId, agent.id))
      .orderBy(desc(attributions.lockedAt))
      .limit(5);

    const assigned = await ctx.tx
      .select({
        id: products.id,
        slug: products.slug,
        nameEn: products.nameEn,
        nameMl: products.nameMl,
      })
      .from(agentProducts)
      .innerJoin(products, eq(products.id, agentProducts.productId))
      .where(and(eq(agentProducts.agentId, agent.id), eq(products.active, true)));

    const panVerified = payout?.panStatus === "VERIFIED";

    return ok(ctx, {
      agent: {
        id: agent.id,
        agentCode: agent.agentCode,
        status: agent.status,
        mobileVerified: agent.mobileVerifiedAt !== null,
      },
      referral: {
        code: agent.agentCode,
        link: referralLink(agent.agentCode),
        qrUrl: "/api/v1/agent/referral/qr",
        whatsappShareUrl: whatsappShareLink(agent.agentCode),
      },
      earnings,
      // The prompt that drives payout setup: show the balance, then explain
      // exactly what is blocking it.
      payout: {
        panStatus: payout?.panStatus ?? "NOT_SUBMITTED",
        pan: maskPan(payout?.panLast4 ?? null),
        bankConfigured: Boolean(payout?.bankAccountLast4 || payout?.upiId),
        withdrawalBlocked: !panVerified,
        blockedReason: panVerified
          ? null
          : payout?.panStatus === "PENDING_VERIFICATION"
            ? "PAN_UNDER_REVIEW"
            : "PAN_NOT_SUBMITTED",
      },
      customers: { total: customerCount, recent: recentCustomers },
      products: assigned,
    });
  }),
);

export const OPTIONS = preflight;
