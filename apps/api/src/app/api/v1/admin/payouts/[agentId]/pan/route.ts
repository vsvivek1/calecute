/**
 * POST /api/v1/admin/payouts/{agentId}/pan
 *
 * Verify, reject, or cancel-as-duplicate an agent's PAN.
 *
 * The endpoint never receives or returns a PAN. An admin sees only the mask and
 * whatever offline check they performed; this records the decision.
 *
 * DUPLICATE_CANCELLED is the action the published terms describe: where two
 * accounts share a PAN, the duplicate is cancelled and its accrued commission
 * forfeited. Doing that is destructive, so it requires SUPER_ADMIN and writes a
 * full audit entry.
 */
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { handler, preflight } from "@/lib/http";
import { authedRoute, ok } from "@/lib/route";
import { ADMIN_ROLES, SUPER_ONLY } from "@/lib/auth/context";
import { parseBody, geoIdSchema } from "@/lib/validation";
import { RULES } from "@/lib/ratelimit";
import { ApiError, notFound } from "@/lib/errors";
import { agents, payoutProfiles } from "@/db/schema";
import { record } from "@/lib/audit";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  decision: z.enum(["VERIFIED", "REJECTED", "DUPLICATE_CANCELLED"]),
  note: z.string().trim().max(500).nullish(),
});

export const POST = handler(async (request, context) => {
  const { agentId: rawAgentId } = await (
    context as unknown as { params: Promise<{ agentId: string }> }
  ).params;
  const agentId = geoIdSchema.safeParse(rawAgentId);
  if (!agentId.success) throw new ApiError("VALIDATION_FAILED", "Bad agent id");

  return authedRoute(
    { name: "admin.payouts.pan", roles: ADMIN_ROLES, limit: RULES.write },
    async (ctx) => {
      const body = await parseBody(ctx.request, bodySchema);

      // Cancelling a duplicate forfeits money. Only a SUPER_ADMIN may do it.
      if (
        body.decision === "DUPLICATE_CANCELLED" &&
        !SUPER_ONLY.includes(ctx.actor.role as "SUPER_ADMIN")
      ) {
        throw new ApiError(
          "ROLE_REQUIRED",
          "Cancelling a duplicate and forfeiting commission requires SUPER_ADMIN",
        );
      }

      const [agent] = await ctx.tx
        .select({ id: agents.id, agentCode: agents.agentCode })
        .from(agents)
        .where(eq(agents.id, agentId.data))
        .limit(1);
      if (!agent) throw notFound("Agent");

      const [before] = await ctx.tx
        .select({
          panStatus: payoutProfiles.panStatus,
          panLast4: payoutProfiles.panLast4,
        })
        .from(payoutProfiles)
        .where(eq(payoutProfiles.agentId, agent.id))
        .limit(1);

      if (!before || !before.panLast4) {
        throw new ApiError(
          "UNPROCESSABLE",
          "This agent has not submitted a PAN yet",
        );
      }

      await ctx.tx
        .update(payoutProfiles)
        .set({
          panStatus: body.decision,
          panVerifiedAt: body.decision === "VERIFIED" ? new Date() : null,
          panVerifiedBy: ctx.actor.userId,
          updatedAt: new Date(),
        })
        .where(eq(payoutProfiles.agentId, agent.id));

      let forfeited = 0;
      if (body.decision === "DUPLICATE_CANCELLED") {
        const rows = (await ctx.tx.execute(sql`
          UPDATE commissions
             SET status = 'FORFEITED'
           WHERE agent_id = ${agent.id}
             AND status IN ('ACCRUED', 'APPROVED')
           RETURNING net_commission_paise
        `)) as unknown as { net_commission_paise: string | number }[];
        forfeited = rows.reduce((sum, row) => sum + Number(row.net_commission_paise), 0);

        await ctx.tx
          .update(agents)
          .set({
            status: "REJECTED",
            reviewNote: body.note ?? "Duplicate PAN — cancelled per terms",
            reviewedBy: ctx.actor.userId,
            reviewedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(agents.id, agent.id));
      }

      await record(ctx.tx, {
        request: ctx.request,
        actor: ctx.actor,
        action:
          body.decision === "VERIFIED"
            ? "payout.pan_verified"
            : body.decision === "REJECTED"
              ? "payout.pan_rejected"
              : "payout.duplicate_cancelled",
        entityType: "payout_profile",
        entityId: agent.id,
        before: { panStatus: before.panStatus },
        after: {
          panStatus: body.decision,
          note: body.note ?? null,
          forfeitedPaise: forfeited || undefined,
        },
      });

      return ok(ctx, {
        agentCode: agent.agentCode,
        panStatus: body.decision,
        forfeitedPaise: forfeited,
      });
    },
  )(request);
});

export const OPTIONS = preflight;
