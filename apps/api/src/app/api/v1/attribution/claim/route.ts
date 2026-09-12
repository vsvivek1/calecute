/**
 * POST /api/v1/attribution/claim
 *
 * Called by a product system when a customer signs up quoting an agent code.
 *
 * The rule, stated once: FIRST CODE WINS. An attribution row is written once
 * per customer and there is no path in this API that reassigns it — the
 * database has a unique constraint on customer_id and the policies grant no
 * UPDATE on the table at all.
 *
 * Every attempt is logged, accepted or not, including the losing ones. That log
 * is the entire basis for settling a dispute between two agents who both claim
 * the same customer, so it records the code as presented, the reason, and when.
 */
import { z } from "zod";
import { eq } from "drizzle-orm";
import { handler, preflight } from "@/lib/http";
import { authedRoute, ok } from "@/lib/route";
import { SUPER_ONLY } from "@/lib/auth/context";
import { parseBody } from "@/lib/validation";
import { RULES } from "@/lib/ratelimit";
import { agents, attributionAttempts, attributions, customers } from "@/db/schema";
import { withIdempotency } from "@/lib/idempotency";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  /** The customer's id in the product system that owns the billing record. */
  customerExternalRef: z.string().trim().min(1).max(120),
  customerName: z.string().trim().min(1).max(200),
  agentCode: z.string().trim().toUpperCase().max(40),
  /** Where the code came from: "referral_link", "typed", "qr". */
  source: z.string().trim().max(40).optional(),
});

export const POST = handler(
  authedRoute(
    { name: "attribution.claim", roles: SUPER_ONLY, limit: RULES.write },
    async (ctx) => {
      const body = await parseBody(ctx.request, bodySchema);

      const outcome = await withIdempotency<Record<string, unknown>>(
        {
          key: ctx.request.headers.get("idempotency-key"),
          endpoint: "POST /api/v1/attribution/claim",
          userId: ctx.actor.userId,
          requestBody: body,
          required: false,
        },
        async () => {
          // Find or create the customer record.
          let [customer] = await ctx.tx
            .select({ id: customers.id })
            .from(customers)
            .where(eq(customers.externalRef, body.customerExternalRef))
            .limit(1);

          const [agent] = await ctx.tx
            .select({
              id: agents.id,
              agentCode: agents.agentCode,
              status: agents.status,
              districtId: agents.districtId,
              localBodyId: agents.localBodyId,
            })
            .from(agents)
            .where(eq(agents.agentCode, body.agentCode))
            .limit(1);

          const logAttempt = async (
            accepted: boolean,
            reason: string,
            agentId: number | null,
          ) => {
            await ctx.tx.insert(attributionAttempts).values({
              customerExternalRef: body.customerExternalRef,
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

          if (!customer) {
            const [created] = await ctx.tx
              .insert(customers)
              .values({
                externalRef: body.customerExternalRef,
                displayName: body.customerName,
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

          await logAttempt(true, "ACCEPTED", agent.id);
          return {
            status: 201,
            body: {
              attributed: true,
              agentCode: agent.agentCode,
              customerId: customer.id,
            },
          };
        },
      );

      return ok(ctx, outcome.body, outcome.status);
    },
  ),
);

export const OPTIONS = preflight;
