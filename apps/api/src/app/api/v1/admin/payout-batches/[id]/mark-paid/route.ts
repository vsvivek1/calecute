/**
 * POST /api/v1/admin/payout-batches/{id}/mark-paid
 *
 * Records that a batch has actually been transferred. This moves money in the
 * ledger, so an Idempotency-Key is required: a retry on a dropped connection
 * must not mark a batch paid twice.
 */
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { handler, preflight } from "@/lib/http";
import { authedRoute, ok } from "@/lib/route";
import { SUPER_ONLY } from "@/lib/auth/context";
import { parseBody, geoIdSchema } from "@/lib/validation";
import { RULES } from "@/lib/ratelimit";
import { ApiError, notFound } from "@/lib/errors";
import { payoutBatches } from "@/db/schema";
import { record } from "@/lib/audit";
import { ts } from "@/db/values";
import { withIdempotency } from "@/lib/idempotency";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  /** Bank reference for the transfer, so the ledger ties to a statement. */
  reference: z.string().trim().min(3).max(120),
  note: z.string().trim().max(500).nullish(),
});

export const POST = handler(async (request, context) => {
  const { id } = await (context as unknown as { params: Promise<{ id: string }> })
    .params;
  const batchId = geoIdSchema.safeParse(id);
  if (!batchId.success) throw new ApiError("VALIDATION_FAILED", "Bad batch id");

  return authedRoute(
    { name: "admin.payoutBatch.markPaid", roles: SUPER_ONLY, limit: RULES.write },
    async (ctx) => {
      const body = await parseBody(ctx.request, bodySchema);

      const outcome = await withIdempotency<Record<string, unknown>>(
        {
          key: ctx.request.headers.get("idempotency-key"),
          endpoint: "POST /api/v1/admin/payout-batches/{id}/mark-paid",
          userId: ctx.actor.userId,
          requestBody: { batchId: batchId.data, ...body },
          required: true,
        },
        async () => {
          const [batch] = await ctx.tx
            .select()
            .from(payoutBatches)
            .where(eq(payoutBatches.id, batchId.data))
            .limit(1);
          if (!batch) throw notFound("Payout batch");

          if (batch.status === "PAID") {
            return {
              status: 200,
              body: { alreadyPaid: true, batchId: batch.id, period: batch.period },
            };
          }

          const paidAt = new Date();

          const updated = await ctx.tx.execute(sql`
            UPDATE commissions
               SET status = 'PAID', paid_at = ${ts(paidAt)}
             WHERE payout_batch_id = ${batch.id}
               AND status IN ('ACCRUED', 'APPROVED')
             RETURNING id, net_commission_paise
          `);
          const rows = updated as unknown as {
            id: number;
            net_commission_paise: string | number;
          }[];
          const total = rows.reduce(
            (sum, row) => sum + Number(row.net_commission_paise),
            0,
          );

          await ctx.tx
            .update(payoutBatches)
            .set({
              status: "PAID",
              markedPaidBy: ctx.actor.userId,
              markedPaidAt: paidAt,
              note: body.note ?? batch.note,
            })
            .where(eq(payoutBatches.id, batch.id));

          await record(ctx.tx, {
            request: ctx.request,
            actor: ctx.actor,
            action: "payout_batch.marked_paid",
            entityType: "payout_batch",
            entityId: batch.id,
            before: { status: batch.status },
            after: {
              status: "PAID",
              reference: body.reference,
              commissionCount: rows.length,
              totalPaise: total,
            },
          });

          return {
            status: 200,
            body: {
              alreadyPaid: false,
              batchId: batch.id,
              period: batch.period,
              commissionsPaid: rows.length,
              totalNetPaise: total,
            },
          };
        },
      );

      return ok(ctx, { ...outcome.body, replayed: outcome.replayed }, outcome.status);
    },
  )(request);
});

export const OPTIONS = preflight;
