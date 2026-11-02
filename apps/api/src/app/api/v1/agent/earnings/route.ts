/**
 * GET /api/v1/agent/earnings
 *
 * The rollup plus the ledger behind it, so an agent can see which payment each
 * commission came from. Cursor paginated like every other list.
 *
 * The `terms` block carries the rate per product rather than one number: a
 * seller earns the product's sellerRateBps (10% to 30%), a USER-tier member
 * earns userRateBps (1%) on paid products and diamonds on free ones.
 */
import { z } from "zod";
import { asc, desc, eq, lt, and, or } from "drizzle-orm";
import { handler, preflight } from "@/lib/http";
import { authedRoute, ok } from "@/lib/route";
import { parseQuery } from "@/lib/validation";
import { buildPage, decodeCursor, paginationSchema } from "@/lib/pagination";
import { commissions, customers, payments, products } from "@/db/schema";
import { currentAgent, earningsFor } from "@/lib/agent";
import { TDS_RATE_BPS } from "@/lib/money";
import { isFreeProduct, rateBpsFor } from "@/lib/referral";

export const dynamic = "force-dynamic";

const querySchema = paginationSchema.extend({
  status: z
    .enum(["ACCRUED", "APPROVED", "PAID", "CANCELLED", "FORFEITED"])
    .optional(),
});

export const GET = handler(
  authedRoute({ name: "agent.earnings" }, async (ctx) => {
    const query = parseQuery(ctx.url, querySchema);
    const cursor = decodeCursor(query.cursor);
    const agent = await currentAgent(ctx.tx, ctx.actor.userId);

    const rows = await ctx.tx
      .select({
        id: commissions.id,
        accruedAt: commissions.accruedAt,
        status: commissions.status,
        basePaise: commissions.basePaise,
        rateBps: commissions.rateBps,
        tier: commissions.tier,
        productSlug: products.slug,
        productName: products.nameEn,
        grossCommissionPaise: commissions.grossCommissionPaise,
        tdsPaise: commissions.tdsPaise,
        netCommissionPaise: commissions.netCommissionPaise,
        financialYear: commissions.financialYear,
        paidAt: commissions.paidAt,
        paymentPaidAt: payments.paidAt,
        customerName: customers.displayName,
      })
      .from(commissions)
      .innerJoin(payments, eq(payments.id, commissions.paymentId))
      .innerJoin(customers, eq(customers.id, payments.customerId))
      .leftJoin(products, eq(products.id, payments.productId))
      .where(
        and(
          eq(commissions.agentId, agent.id),
          query.status ? eq(commissions.status, query.status) : undefined,
          cursor
            ? or(
                lt(commissions.accruedAt, new Date(cursor.k)),
                and(
                  eq(commissions.accruedAt, new Date(cursor.k)),
                  lt(commissions.id, cursor.id),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(desc(commissions.accruedAt), desc(commissions.id))
      .limit(query.limit + 1);

    const page = buildPage(rows, query.limit, (row) => ({
      k: row.accruedAt.toISOString(),
      id: row.id,
    }));

    const catalogue = await ctx.tx
      .select({
        id: products.id,
        slug: products.slug,
        nameEn: products.nameEn,
        feePaise: products.feePaise,
        sellerRateBps: products.sellerRateBps,
        userRateBps: products.userRateBps,
      })
      .from(products)
      .where(eq(products.active, true))
      .orderBy(asc(products.nameEn));

    const rates = catalogue.map((product) => {
      const free = isFreeProduct(product);
      const diamond = agent.tier === "USER" && free;
      return {
        productId: product.id,
        slug: product.slug,
        nameEn: product.nameEn,
        isFree: free,
        reward: diamond ? ("DIAMOND" as const) : ("CASH" as const),
        rateBps: diamond ? 0 : rateBpsFor(agent.tier, product),
      };
    });
    const cashRates = rates.filter((r) => r.reward === "CASH").map((r) => r.rateBps);

    return ok(ctx, {
      summary: await earningsFor(ctx.tx, agent.id),
      ...page,
      terms: {
        tier: agent.tier,
        /** The lowest cash rate that applies to this agent; see `rates` for each product. */
        rateBps: cashRates.length > 0 ? Math.min(...cashRates) : rateBpsFor(agent.tier, null),
        maxRateBps: cashRates.length > 0 ? Math.max(...cashRates) : rateBpsFor(agent.tier, null),
        rates,
        tdsRateBps: TDS_RATE_BPS,
        tdsSection: "194H",
        basis: "Net of GST and payment gateway charges",
        payoutFrequency: "MONTHLY",
      },
    });
  }),
);

export const OPTIONS = preflight;
