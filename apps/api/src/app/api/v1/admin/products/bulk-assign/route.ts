/**
 * POST /api/v1/admin/products/bulk-assign
 *
 * Assign a product to every agent matching a filter — how a new product gets
 * rolled out to a district without clicking through a thousand agents.
 *
 * The filter is resolved to agent ids inside the RLS transaction, so a
 * DISTRICT_ADMIN who submits `{}` (meaning "all agents") reaches only their own
 * districts. The response reports how many were actually affected, which is the
 * number that tells them what their scope was.
 */
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { handler, preflight } from "@/lib/http";
import { authedRoute, ok } from "@/lib/route";
import { ADMIN_ROLES } from "@/lib/auth/context";
import { parseBody, geoIdSchema } from "@/lib/validation";
import { RULES } from "@/lib/ratelimit";
import { ApiError } from "@/lib/errors";
import { agentProducts, products } from "@/db/schema";
import { record } from "@/lib/audit";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  productId: geoIdSchema,
  filter: z
    .object({
      districtId: geoIdSchema.optional(),
      localBodyId: geoIdSchema.optional(),
      status: z
        .enum(["PENDING_REVIEW", "APPROVED", "SUSPENDED", "REJECTED"])
        .optional(),
      education: z
        .enum(["SSLC", "PLUS_TWO", "DEGREE", "PG", "DIPLOMA", "ITI", "OTHER"])
        .optional(),
      hoursPerDay: z
        .enum(["ONE", "TWO_TO_THREE", "FOUR_PLUS", "FULL_TIME"])
        .optional(),
    })
    .default({}),
  /** Safety catch: refuse a run that would touch more agents than expected. */
  maxAgents: z.number().int().min(1).max(20000).default(5000),
});

export const POST = handler(
  authedRoute(
    { name: "admin.products.bulkAssign", roles: ADMIN_ROLES, limit: RULES.write },
    async (ctx) => {
      const body = await parseBody(ctx.request, bodySchema);

      const [product] = await ctx.tx
        .select({ id: products.id, slug: products.slug })
        .from(products)
        .where(eq(products.id, body.productId))
        .limit(1);
      if (!product) throw new ApiError("VALIDATION_FAILED", "Unknown product id");

      const matched = await ctx.tx.execute(sql`
        SELECT a.id FROM agents a
        LEFT JOIN agent_qualifications q ON q.agent_id = a.id
         WHERE 1 = 1
           ${body.filter.districtId ? sql`AND a.district_id = ${body.filter.districtId}` : sql``}
           ${body.filter.localBodyId ? sql`AND a.local_body_id = ${body.filter.localBodyId}` : sql``}
           ${body.filter.status ? sql`AND a.status = ${body.filter.status}::agent_status` : sql``}
           ${body.filter.education ? sql`AND q.education = ${body.filter.education}::education_level` : sql``}
           ${body.filter.hoursPerDay ? sql`AND q.hours_per_day = ${body.filter.hoursPerDay}::hours_available` : sql``}
         LIMIT ${body.maxAgents + 1}
      `);

      const agentIds = (matched as unknown as { id: number }[]).map((r) => r.id);

      if (agentIds.length > body.maxAgents) {
        throw new ApiError(
          "UNPROCESSABLE",
          `Filter matches more than maxAgents (${body.maxAgents}). Narrow the filter or raise the limit deliberately.`,
          { details: { matchedAtLeast: agentIds.length } },
        );
      }
      if (agentIds.length === 0) {
        return ok(ctx, { assigned: 0, agentIds: [] });
      }

      await ctx.tx
        .insert(agentProducts)
        .values(
          agentIds.map((agentId) => ({
            agentId,
            productId: product.id,
            assignedBy: ctx.actor.userId,
          })),
        )
        .onConflictDoNothing();

      await record(ctx.tx, {
        request: ctx.request,
        actor: ctx.actor,
        action: "agent.products_bulk_assigned",
        entityType: "product",
        entityId: product.id,
        after: {
          productSlug: product.slug,
          filter: body.filter,
          agentCount: agentIds.length,
        },
      });

      return ok(ctx, { assigned: agentIds.length, productId: product.id });
    },
  ),
);

export const OPTIONS = preflight;
