/**
 * GET  /api/v1/admin/payout-batches — list
 * POST /api/v1/admin/payout-batches — open a batch for a month
 *
 * A batch gathers every releasable commission for a period. Commission is only
 * pulled in when the agent's PAN is verified and their mobile is confirmed,
 * which is what the published terms say.
 */
import { z } from "zod";
import { desc, sql } from "drizzle-orm";
import { handler, preflight } from "@/lib/http";
import { authedRoute, ok } from "@/lib/route";
import { SUPER_ONLY, ADMIN_ROLES } from "@/lib/auth/context";
import { parseBody } from "@/lib/validation";
import { RULES } from "@/lib/ratelimit";
import { payoutBatches } from "@/db/schema";
import { record } from "@/lib/audit";
import { withIdempotency } from "@/lib/idempotency";

export const dynamic = "force-dynamic";

export const GET = handler(
  authedRoute({ name: "admin.payoutBatches.list", roles: ADMIN_ROLES }, async (ctx) => {
    const rows = await ctx.tx
      .select()
      .from(payoutBatches)
      .orderBy(desc(payoutBatches.period))
      .limit(60);
    return ok(ctx, { data: rows });
  }),
);

const bodySchema = z.object({
  /** Calendar month, YYYY-MM. */
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  note: z.string().trim().max(500).nullish(),
});

export const POST = handler(
  authedRoute(
    { name: "admin.payoutBatches.create", roles: SUPER_ONLY, limit: RULES.write },
    async (ctx) => {
      const body = await parseBody(ctx.request, bodySchema);

      // The generic is stated because the two branches return different shapes.
      const outcome = await withIdempotency<Record<string, unknown>>(
        {
          key: ctx.request.headers.get("idempotency-key"),
          endpoint: "POST /api/v1/admin/payout-batches",
          userId: ctx.actor.userId,
          requestBody: body,
        },
        async () => {
          const [batch] = await ctx.tx
            .insert(payoutBatches)
            .values({ period: body.period, note: body.note ?? null })
            .onConflictDoNothing({ target: payoutBatches.period })
            .returning();

          if (!batch) {
            return {
              status: 200,
              body: { created: false, reason: "A batch already exists for that period" },
            };
          }

          // Attach every releasable commission. The PAN and mobile conditions
          // live in SQL rather than in a loop so the set is consistent.
          const attached = await ctx.tx.execute(sql`
            UPDATE commissions c
               SET payout_batch_id = ${batch.id}, status = 'APPROVED'
              FROM agents a
              LEFT JOIN payout_profiles pp ON pp.agent_id = a.id
             WHERE c.agent_id = a.id
               AND c.status = 'ACCRUED'
               AND c.payout_batch_id IS NULL
               AND pp.pan_status = 'VERIFIED'
               AND a.mobile_verified_at IS NOT NULL
             RETURNING c.id, c.net_commission_paise
          `);

          const rows = attached as unknown as {
            id: number;
            net_commission_paise: string | number;
          }[];
          const total = rows.reduce(
            (sum, row) => sum + Number(row.net_commission_paise),
            0,
          );

          await record(ctx.tx, {
            request: ctx.request,
            actor: ctx.actor,
            action: "payout_batch.created",
            entityType: "payout_batch",
            entityId: batch.id,
            after: {
              period: batch.period,
              commissionCount: rows.length,
              totalPaise: total,
            },
          });

          return {
            status: 201,
            body: {
              created: true,
              batch: { id: batch.id, period: batch.period, status: batch.status },
              commissionCount: rows.length,
              totalNetPaise: total,
            },
          };
        },
      );

      return ok(ctx, outcome.body, outcome.status);
    },
  ),
);

export const OPTIONS = preflight;
