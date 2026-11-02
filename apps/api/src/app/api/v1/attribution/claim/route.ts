/**
 * POST /api/v1/attribution/claim
 *
 * Called by a product system when a customer signs up quoting a referral
 * code — a seller's `CA-…` code or a member's `RF-…` invite code; both live
 * in the same namespace and this endpoint does not care which.
 *
 * The rule, stated once: FIRST CODE WINS. An attribution row is written once
 * per customer and there is no path in this API that reassigns it — the
 * database has a unique constraint on customer_id and the policies grant no
 * UPDATE on the table at all.
 *
 * Every attempt is logged, accepted or not, including the losing ones. That log
 * is the entire basis for settling a dispute between two agents who both claim
 * the same customer, so it records the code as presented, the reason, and when.
 *
 * Authentication: a product API key (client or server), or a SUPER_ADMIN
 * token naming the product in the body. The customer reference is namespaced
 * as `<product slug>:<customerExternalRef>`.
 *
 * On a FREE product a USER-tier referrer earns one diamond per friend who
 * joins, awarded here. On a PAID product nothing is earned until the friend
 * pays (see /payments).
 */
import { z } from "zod";
import { eq } from "drizzle-orm";
import { handler, preflight } from "@/lib/http";
import { ok, serviceRoute } from "@/lib/route";
import { parseBody } from "@/lib/validation";
import { RULES } from "@/lib/ratelimit";
import { attributionAttempts, attributions, customers, diamondAwards } from "@/db/schema";
import { withIdempotency } from "@/lib/idempotency";
import { agentForReferral, customerRef, resolveProduct } from "@/lib/attribution";
import { awardsDiamond } from "@/lib/referral";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  /** The customer's id in the product system that owns the billing record. */
  customerExternalRef: z.string().trim().min(1).max(120),
  customerName: z.string().trim().min(1).max(200),
  agentCode: z.string().trim().toUpperCase().max(40),
  /** Where the code came from: "referral_link", "typed", "qr", "install_referrer". */
  source: z.string().trim().max(40).optional(),
  /** Only for a SUPER_ADMIN caller; a service key's product is implied. */
  productSlug: z.string().trim().min(1).max(80).optional(),
});

export const POST = handler(
  serviceRoute(
    {
      name: "attribution.claim",
      kinds: ["client", "server"],
      superAdmin: true,
      limit: RULES.service,
    },
    async (ctx) => {
      const body = await parseBody(ctx.request, bodySchema);
      const product = await resolveProduct(ctx.tx, ctx.product, body);
      const ref = customerRef(product, body.customerExternalRef);

      const outcome = await withIdempotency<Record<string, unknown>>(
        {
          key: ctx.request.headers.get("idempotency-key"),
          endpoint: "POST /api/v1/attribution/claim",
          userId: ctx.actor.role === "SERVICE" ? null : ctx.actor.userId,
          requestBody: { ...body, product: product?.slug ?? null },
          required: false,
        },
        async () => {
          // Find or create the customer record.
          let [customer] = await ctx.tx
            .select({ id: customers.id })
            .from(customers)
            .where(eq(customers.externalRef, ref))
            .limit(1);

          const agent = await agentForReferral(ctx.tx, { code: body.agentCode });

          const logAttempt = async (
            accepted: boolean,
            reason: string,
            agentId: number | null,
          ) => {
            await ctx.tx.insert(attributionAttempts).values({
              customerExternalRef: ref,
              customerId: customer?.id ?? null,
              agentCode: body.agentCode,
              agentId,
              accepted,
              reason,
              source: body.source ?? null,
            });
          };

          if (!agent) {
            await logAttempt(false, "UNKNOWN_CODE", null);
            return {
              status: 200,
              body: { attributed: false, reason: "UNKNOWN_CODE" },
            };
          }

          if (agent.status !== "APPROVED") {
            await logAttempt(false, "AGENT_NOT_APPROVED", agent.id);
            return {
              status: 200,
              body: {
                attributed: false,
                reason: "AGENT_NOT_APPROVED",
                agentStatus: agent.status,
              },
            };
          }

          // A member cannot refer themselves: the code's owner is the same
          // product user as the claimant.
          if (agent.userExternalRef !== null && agent.userExternalRef === ref) {
            await logAttempt(false, "SELF_REFERRAL", agent.id);
            return {
              status: 200,
              body: { attributed: false, reason: "SELF_REFERRAL" },
            };
          }

          if (!customer) {
            const [created] = await ctx.tx
              .insert(customers)
              .values({
                externalRef: ref,
                displayName: body.customerName,
                productId: product?.id ?? null,
                districtId: agent.districtId,
                localBodyId: agent.localBodyId,
                status: "LEAD",
              })
              .returning({ id: customers.id });
            customer = created;
          }

          // The insert is the race-safe test: a second claim for the same
          // customer conflicts on the unique constraint and is simply not
          // written. No read-then-write window exists.
          const [locked] = await ctx.tx
            .insert(attributions)
            .values({
              customerId: customer.id,
              agentId: agent.id,
              agentCode: agent.agentCode,
            })
            .onConflictDoNothing({ target: attributions.customerId })
            .returning({ id: attributions.id, agentCode: attributions.agentCode });

          if (!locked) {
            const [existing] = await ctx.tx
              .select({
                agentCode: attributions.agentCode,
                lockedAt: attributions.lockedAt,
              })
              .from(attributions)
              .where(eq(attributions.customerId, customer.id))
              .limit(1);

            await logAttempt(false, "ALREADY_ATTRIBUTED", agent.id);
            return {
              status: 200,
              body: {
                attributed: false,
                reason: "ALREADY_ATTRIBUTED",
                // The winning code is returned so the product system and any
                // later dispute can see who holds it, without a second call.
                heldBy: existing?.agentCode ?? null,
                heldSince: existing?.lockedAt ?? null,
              },
            };
          }

          // Free product, USER-tier referrer: the diamond is the reward.
          // customer_id is unique on diamond_awards, so one per friend, ever.
          let diamondAwarded = false;
          if (product && awardsDiamond(agent.tier, product)) {
            const [award] = await ctx.tx
              .insert(diamondAwards)
              .values({ agentId: agent.id, productId: product.id, customerId: customer.id })
              .onConflictDoNothing({ target: diamondAwards.customerId })
              .returning({ id: diamondAwards.id });
            diamondAwarded = Boolean(award);
          }

          await logAttempt(true, "ACCEPTED", agent.id);
          return {
            status: 201,
            body: {
              attributed: true,
              agentCode: agent.agentCode,
              tier: agent.tier,
              customerId: customer.id,
              diamondAwarded,
            },
          };
        },
      );

      return ok(ctx, outcome.body, outcome.status);
    },
  ),
);

export const OPTIONS = preflight;
