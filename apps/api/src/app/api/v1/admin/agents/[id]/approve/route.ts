/**
 * POST /api/v1/admin/agents/{id}/approve
 */
import { z } from "zod";
import { handler, preflight } from "@/lib/http";
import { authedRoute, ok } from "@/lib/route";
import { ADMIN_ROLES } from "@/lib/auth/context";
import { parseBody, geoIdSchema } from "@/lib/validation";
import { RULES } from "@/lib/ratelimit";
import { ApiError } from "@/lib/errors";
import { transitionAgent } from "@/lib/admin";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ note: z.string().trim().max(500).nullish() });

export const POST = handler(async (request, context) => {
  const { id } = await (context as unknown as { params: Promise<{ id: string }> })
    .params;
  const agentId = geoIdSchema.safeParse(id);
  if (!agentId.success) throw new ApiError("VALIDATION_FAILED", "Bad agent id");

  return authedRoute(
    { name: "admin.agent.approve", roles: ADMIN_ROLES, limit: RULES.write },
    async (ctx) => {
      const body = await parseBody(ctx.request, bodySchema);
      const agent = await transitionAgent(ctx.tx, {
        request: ctx.request,
        actor: ctx.actor,
        agentId: agentId.data,
        to: "APPROVED",
        action: "agent.approve",
        note: body.note ?? null,
        allowedFrom: ["PENDING_REVIEW", "SUSPENDED", "REJECTED"],
      });
      return ok(ctx, { agent: { id: agent.id, status: agent.status } });
    },
  )(request);
});

export const OPTIONS = preflight;
