/**
 * POST /api/v1/payments
 *
 * Records a customer payment and accrues the referrer's commission.
 *
 * This is the endpoint that creates money, so:
 *   - only a SERVER key (or a SUPER_ADMIN token) may call it; a client key
 *     ships inside an app and is public knowledge
 *   - an Idempotency-Key is required; a retried webhook must not pay twice
 *   - the external reference is unique, as a second line of defence
 *   - the arithmetic lives in lib/money.ts and is re-checked by a database
 *     constraint, so a bug here cannot write an inconsistent ledger row
 *
 * The rate depends on who holds the attribution:
 *   SELLER  the product's sellerRateBps (10% to 30%), and the seller must be
 *           placed in a local body so the commission has a geography
 *   USER    the product's userRateBps (default 1%); no geography needed
 *
 * Commission accrues only for an APPROVED referrer holding the attribution.
 * There is no path that pays an unattributed payment.
 */
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { handler, preflight } from "@/lib/http";
import { ok, serviceRoute } from "@/lib/route";
import { parseBody } from "@/lib/validation";
import { RULES } from "@/lib/ratelimit";
import { ApiError } from "@/lib/errors";
import { attributions, commissions, customers, payments } from "@/db/schema";
import { commissionFor, financialYearOf, netOfPayment } from "@/lib/money";
import { withIdempotency } from "@/lib/idempotency";
import { agentForReferral, customerRef, resolveProduct } from "@/lib/attribution";
import { rateBpsFor } from "@/lib/referral";
import { ts } from "@/db/values";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  externalRef: z.string().trim().min(1).max(120),
  customerExternalRef: z.string().trim().min(1).max(120),
  /** Only for a SUPER_ADMIN caller; a service key's product is implied. */
  productId: z.number().int().positive().nullish(),
  productSlug: z.string().trim().min(1).max(80).nullish(),
  /** All amounts in paise, integers. Never a float. */
  grossPaise: z.number().int().min(0),
  gstPaise: z.number().int().min(0).default(0),
  gatewayFeePaise: z.number().int().min(0).default(0),
  paidAt: z.coerce.date(),
});

export const POST = handler(
  serviceRoute(
    { name: "payments.record", kinds: ["server"], superAdmin: true, limit: RULES.service },
    async (ctx) => {
      const body = await parseBody(ctx.request, bodySchema);
      const product = await resolveProduct(ctx.tx, ctx.product, body);
      const ref = customerRef(product, body.customerExternalRef);

      const netPaise = netOfPayment(body);
      if (netPaise < 0) {
        throw new ApiError(
          "VALIDATION_FAILED",
          "GST and gateway charges exceed the gross amount",
          { details: { grossPaise: body.grossPaise, netPaise } },
        );
      }

      const isService = ctx.actor.role === "SERVICE";
      const rawKey = ctx.request.headers.get("idempotency-key");

      const outcome = await withIdempotency<Record<string, unknown>>(
        {
          // Keys are namespaced per product so two apps cannot collide.
          key: rawKey && product ? `p${product.id}:${rawKey}` : rawKey,
          endpoint: "POST /api/v1/payments",
          userId: isService ? null : ctx.actor.userId,
          requestBody: { ...body, product: product?.slug ?? null },
          required: true,
        },
        async () => {
          const [customer] = await ctx.tx
            .select({ id: customers.id })
            .from(customers)
            .where(eq(customers.externalRef, ref))
            .limit(1);
          if (!customer) {
            throw new ApiError("NOT_FOUND", "Unknown customer reference");
          }

          const [payment] = await ctx.tx
            .insert(payments)
            .values({
              externalRef: body.externalRef,
              customerId: customer.id,
              productId: product?.id ?? null,
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

          const agent = await agentForReferral(ctx.tx, { id: attribution.agentId });

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

          /*
           * A seller's commission has to be attributable to a geography, for
           * the revenue reports and for TDS. A seller whose local body is not
           * seeded yet has none, so the payment is recorded and the commission
           * is not. Approval already refuses an unplaced seller, so this should
           * be unreachable — it is here because "should be unreachable" is not
           * a reason to write a null into the ledger. A USER-tier referrer has
           * no geography by design and is exempt.
           */
          if (agent.tier === "SELLER" && (agent.localBodyId === null || agent.districtId === null)) {
            return {
              status: 201,
              body: {
                recorded: true,
                paymentId: payment.id,
                commissionAccrued: false,
                reason: "AGENT_NOT_PLACED",
              },
            };
          }

          const rateBps = rateBpsFor(agent.tier, product);
          const breakdown = commissionFor(netPaise, { rateBps });

          const [commission] = await ctx.tx
            .insert(commissions)
            .values({
              paymentId: payment.id,
              agentId: agent.id,
              tier: agent.tier,
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

          // Stamp the first sale, which the "no sales after N days" reports
          // use. Through a definer function: a service key has no UPDATE on a
          // seller's row, and should not.
          if (!agent.firstSaleAt) {
            await ctx.tx.execute(
              sql`SELECT app.stamp_first_sale(${agent.id}, ${ts(body.paidAt)})`,
            );
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
              tier: agent.tier,
              product: product?.slug ?? null,
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
