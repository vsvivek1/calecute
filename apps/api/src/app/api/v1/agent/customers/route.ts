/**
 * GET /api/v1/agent/customers
 *
 * Who the agent referred, what state each customer is in, and what they pay.
 * Only customers locked to this agent's code are visible — row-level security
 * enforces that, not the query.
 */
import { and, desc, eq, lt, or, sql } from "drizzle-orm";
import { handler, preflight } from "@/lib/http";
import { authedRoute, ok } from "@/lib/route";
import { parseQuery } from "@/lib/validation";
import { buildPage, decodeCursor, paginationSchema } from "@/lib/pagination";
import { attributions, customers } from "@/db/schema";
import { currentAgent } from "@/lib/agent";

export const dynamic = "force-dynamic";

export const GET = handler(
  authedRoute({ name: "agent.customers" }, async (ctx) => {
    const query = parseQuery(ctx.url, paginationSchema);
    const cursor = decodeCursor(query.cursor);
    const agent = await currentAgent(ctx.tx, ctx.actor.userId);

    const rows = await ctx.tx
      .select({
        id: customers.id,
        displayName: customers.displayName,
        status: customers.status,
        lockedAt: attributions.lockedAt,
        // What this customer actually pays us, and what it earns the agent.
        totalPaidPaise: sql<number>`(
          SELECT COALESCE(sum(p.gross_paise), 0)::bigint
            FROM payments p WHERE p.customer_id = ${customers.id}
        )`,
        commissionEarnedPaise: sql<number>`(
          SELECT COALESCE(sum(c.net_commission_paise), 0)::bigint
            FROM commissions c
           WHERE c.agent_id = ${agent.id}
             AND c.payment_id IN (SELECT p.id FROM payments p WHERE p.customer_id = ${customers.id})
             AND c.status <> 'CANCELLED'
        )`,
        lastPaymentAt: sql<Date | null>`(
          SELECT max(p.paid_at) FROM payments p WHERE p.customer_id = ${customers.id}
        )`,
      })
      .from(attributions)
      .innerJoin(customers, eq(customers.id, attributions.customerId))
      .where(
        and(
          eq(attributions.agentId, agent.id),
          cursor
            ? or(
                lt(attributions.lockedAt, new Date(cursor.k)),
                and(
                  eq(attributions.lockedAt, new Date(cursor.k)),
                  lt(attributions.id, cursor.id),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(desc(attributions.lockedAt), desc(attributions.id))
      .limit(query.limit + 1);

    return ok(
      ctx,
      buildPage(rows, query.limit, (row) => ({
        k: new Date(row.lockedAt).toISOString(),
        id: row.id,
      })),
    );
  }),
);

export const OPTIONS = preflight;
