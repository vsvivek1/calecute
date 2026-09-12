/**
 * POST /api/v1/payments
 *
 * Records a customer payment and accrues the agent's commission.
 *
 * This is the endpoint that creates money, so:
 *   - an Idempotency-Key is required; a retried webhook must not pay twice
 *   - the external reference is unique, as a second line of defence
 *   - the arithmetic lives in lib/money.ts and is re-checked by a database
 *     constraint, so a bug here cannot write an inconsistent ledger row
 *
 * Commission accrues only for an APPROVED agent holding the attribution. There
 * is no path that pays an unattributed payment.
 */
import { z } from "zod";
import { eq } from "drizzle-orm";
import { handler, preflight } from "@/lib/http";
import { authedRoute, ok } from "@/lib/route";
import { SUPER_ONLY } from "@/lib/auth/context";
import { parseBody } from "@/lib/validation";
import { RULES } from "@/lib/ratelimit";
import { ApiError } from "@/lib/errors";
import {
  agents,
  attributions,
  commissions,
  customers,
  payments,
} from "@/db/schema";
import { commissionFor, financialYearOf, netOfPayment } from "@/lib/money";
import { withIdempotency } from "@/lib/idempotency";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  externalRef: z.string().trim().min(1).max(120),
  customerExternalRef: z.string().trim().min(1).max(120),
  productId: z.number().int().positive().nullish(),
  /** All amounts in paise, integers. Never a float. */
  grossPaise: z.number().int().min(0),
  gstPaise: z.number().int().min(0).default(0),
  gatewayFeePaise: z.number().int().min(0).default(0),
  paidAt: z.coerce.date(),
});

export const POST = handler(
  authedRoute(
    { name: "payments.record", roles: SUPER_ONLY, limit: RULES.write },
    async (ctx) => {
      const body = await parseBody(ctx.request, bodySchema);

      const netPaise = netOfPayment(body);
      if (netPaise < 0) {
        throw new ApiError(
          "VALIDATION_FAILED",
          "GST and gateway charges exceed the gross amount",
          { details: { grossPaise: body.grossPaise, netPaise } },
        );
      }

      const outcome = await withIdempotency<Record<string, unknown>>(
        {
          key: ctx.request.headers.get("idempotency-key"),
          endpoint: "POST /api/v1/payments",
          userId: ctx.actor.userId,
          requestBody: body,
          required: true,
        },
        async () => {
          const [customer] = await ctx.tx
            .select({ id: customers.id })
            .from(customers)
            .where(eq(customers.externalRef, body.customerExternalRef))
            .limit(1);
          if (!customer) {
            throw new ApiError("NOT_FOUND", "Unknown customer reference");
          }

          const [payment] = await ctx.tx
            .insert(payments)
            .values({
              externalRef: body.externalRef,
              customerId: customer.id,
              productId: body.productId ?? null,
              grossPaise: body.grossPaise,
              gstPaise: body.gstPaise,
              gatewayFeePaise: body.gatewayFeePaise,
              netPaise,
              paidAt: body.paidAt,
            })
            .onConflictDoNothing({ target: payments.externalRef })
            .returning();

          if (!payment) {
            return {
              status: 200,
              body: {
                recorded: false,
                reason: "PAYMENT_ALREADY_RECORDED",
                externalRef: body.externalRef,
              },
            };
          }

          // Who, if anyone, holds this customer.
          const [attribution] = await ctx.tx
            .select({
              agentId: attributions.agentId,
              agentCode: attributions.agentCode,
            })
            .from(attributions)
            .where(eq(attributions.customerId, customer.id))
            .limit(1);

          if (!attribution) {
            return {
              status: 201,
              body: {
                recorded: true,
                paymentId: payment.id,
                commissionAccrued: false,
                reason: "NO_ATTRIBUTION",
              },
            };
          }

          const [agent] = await ctx.tx
            .select({
              id: agents.id,
              status: agents.status,
              districtId: agents.districtId,
              localBodyId: agents.localBodyId,
              firstSaleAt: agents.firstSaleAt,
            })
            .from(agents)
            .where(eq(agents.id, attribution.agentId))
            .limit(1);

          if (!agent || agent.status !== "APPROVED") {
            return {
              status: 201,
              body: {
                recorded: true,
                paymentId: payment.id,
                commissionAccrued: false,
                reason: "AGENT_NOT_APPROVED",
              },
            };
          }

          const breakdown = commissionFor(netPaise);

          const [commission] = await ctx.tx
            .insert(commissions)
            .values({
              paymentId: payment.id,
              agentId: agent.id,
              districtId: agent.districtId,
              localBodyId: agent.localBodyId,
              basePaise: breakdown.basePaise,
              rateBps: breakdown.rateBps,
              grossCommissionPaise: breakdown.grossCommissionPaise,
              tdsRateBps: breakdown.tdsRateBps,
              tdsPaise: breakdown.tdsPaise,
              netCommissionPaise: breakdown.netCommissionPaise,
              status: "ACCRUED",
              financialYear: financialYearOf(body.paidAt),
            })
            .returning({ id: commissions.id });

          // Stamp the first sale, which the "no sales after N days" reports use.
          if (!agent.firstSaleAt) {
            await ctx.tx
              .update(agents)
              .set({ firstSaleAt: body.paidAt, updatedAt: new Date() })
              .where(eq(agents.id, agent.id));
          }

          // The customer is paying, so they are active.
          await ctx.tx
            .update(customers)
            .set({ status: "ACTIVE" })
            .where(eq(customers.id, customer.id));

          return {
            status: 201,
            body: {
              recorded: true,
              paymentId: payment.id,
              commissionAccrued: true,
              commissionId: commission.id,
              agentCode: attribution.agentCode,
              breakdown,
            },
          };
        },
      );

      return ok(ctx, { ...outcome.body, replayed: outcome.replayed }, outcome.status);
    },
  ),
);

export const OPTIONS = preflight;
