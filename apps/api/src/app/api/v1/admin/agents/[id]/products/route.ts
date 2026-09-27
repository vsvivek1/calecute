/**
 * POST /api/v1/admin/agents/{id}/products
 *
 * Assign or unassign products for one agent.
 */
import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";
import { handler, preflight } from "@/lib/http";
import { authedRoute, ok } from "@/lib/route";
import { ADMIN_ROLES } from "@/lib/auth/context";
import { parseBody, geoIdSchema } from "@/lib/validation";
import { RULES } from "@/lib/ratelimit";
import { ApiError } from "@/lib/errors";
import { agentProducts, products } from "@/db/schema";
import { loadAgentForAdmin } from "@/lib/admin";
import { record } from "@/lib/audit";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  assign: z.array(geoIdSchema).max(50).default([]),
  unassign: z.array(geoIdSchema).max(50).default([]),
});

export const POST = handler(async (request, context) => {
  const { id } = await (context as unknown as { params: Promise<{ id: string }> })
    .params;
  const agentId = geoIdSchema.safeParse(id);
  if (!agentId.success) throw new ApiError("VALIDATION_FAILED", "Bad agent id");

  return authedRoute(
    { name: "admin.agent.products", roles: ADMIN_ROLES, limit: RULES.write },
    async (ctx) => {
      const body = await parseBody(ctx.request, bodySchema);
      const agent = await loadAgentForAdmin(ctx.tx, agentId.data);

      if (body.assign.length > 0) {
        // Every product id is checked against the catalogue before it is used.
        const known = await ctx.tx
          .select({ id: products.id })
          .from(products)
          .where(inArray(products.id, body.assign));
        if (known.length !== body.assign.length) {
          throw new ApiError("VALIDATION_FAILED", "One or more product ids are unknown", {
            details: { field: "assign" },
          });
        }

        await ctx.tx
          .insert(agentProducts)
          .values(
            body.assign.map((productId) => ({
              agentId: agent.id,
              productId,
              assignedBy: ctx.actor.userId,
            })),
          )
          .onConflictDoNothing();
      }

      if (body.unassign.length > 0) {
        await ctx.tx
          .delete(agentProducts)
          .where(
            and(
              eq(agentProducts.agentId, agent.id),
              inArray(agentProducts.productId, body.unassign),
            ),
          );
      }

      await record(ctx.tx, {
        request: ctx.request,
        actor: ctx.actor,
        action: "agent.products_assigned",
        entityType: "agent",
        entityId: agent.id,
        after: { assigned: body.assign, unassigned: body.unassign },
      });

      const current = await ctx.tx
        .select({ productId: agentProducts.productId })
        .from(agentProducts)
        .where(eq(agentProducts.agentId, agent.id));

      return ok(ctx, { productIds: current.map((row) => row.productId) });
    },
  )(request);
});

export const OPTIONS = preflight;
