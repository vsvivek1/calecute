/**
 * GET /api/v1/agent/earnings
 *
 * The rollup plus the ledger behind it, so an agent can see which payment each
 * commission came from. Cursor paginated like every other list.
 */
import { z } from "zod";
import { desc, eq, lt, and, or } from "drizzle-orm";
import { handler, preflight } from "@/lib/http";
import { authedRoute, ok } from "@/lib/route";
import { parseQuery } from "@/lib/validation";
import { buildPage, decodeCursor, paginationSchema } from "@/lib/pagination";
import { commissions, customers, payments } from "@/db/schema";
import { currentAgent, earningsFor } from "@/lib/agent";

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

    return ok(ctx, {
      summary: await earningsFor(ctx.tx, agent.id),
      ...page,
      terms: {
        rateBps: 1000,
        tdsRateBps: 200,
        tdsSection: "194H",
        basis: "Net of GST and payment gateway charges",
        payoutFrequency: "MONTHLY",
      },
    });
  }),
);

export const OPTIONS = preflight;
