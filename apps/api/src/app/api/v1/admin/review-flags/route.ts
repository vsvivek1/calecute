/**
 * GET   /api/v1/admin/review-flags — the abuse review queue
 * PATCH /api/v1/admin/review-flags — dismiss or action a flag
 *
 * Flags are raised automatically at signup and never block anybody. A shared
 * device in an Akshaya centre is a normal case for this programme, so several
 * signups from one device is a question for a human, not grounds for rejection.
 */
import { z } from "zod";
import { and, desc, eq, inArray, lt, or } from "drizzle-orm";
import { handler, preflight } from "@/lib/http";
import { authedRoute, ok } from "@/lib/route";
import { ADMIN_ROLES } from "@/lib/auth/context";
import { parseBody, parseQuery, geoIdSchema } from "@/lib/validation";
import { RULES } from "@/lib/ratelimit";
import { buildPage, decodeCursor, paginationSchema } from "@/lib/pagination";
import { agents, districts, localBodies, reviewFlags } from "@/db/schema";

export const dynamic = "force-dynamic";

const querySchema = paginationSchema.extend({
  status: z.enum(["OPEN", "DISMISSED", "ACTIONED"]).default("OPEN"),
  districtId: geoIdSchema.optional(),
});

export const GET = handler(
  authedRoute({ name: "admin.reviewFlags.list", roles: ADMIN_ROLES }, async (ctx) => {
    const query = parseQuery(ctx.url, querySchema);
    const cursor = decodeCursor(query.cursor);

    const rows = await ctx.tx
      .select({
        id: reviewFlags.id,
        kind: reviewFlags.kind,
        status: reviewFlags.status,
        detail: reviewFlags.detail,
        createdAt: reviewFlags.createdAt,
        agentId: reviewFlags.agentId,
        agentCode: agents.agentCode,
        agentStatus: agents.status,
        districtNameEn: districts.nameEn,
        localBodyNameEn: localBodies.nameEn,
        localBodyNameMl: localBodies.nameMl,
      })
      .from(reviewFlags)
      .leftJoin(agents, eq(agents.id, reviewFlags.agentId))
      .leftJoin(districts, eq(districts.id, reviewFlags.districtId))
      .leftJoin(localBodies, eq(localBodies.id, reviewFlags.localBodyId))
      .where(
        and(
          eq(reviewFlags.status, query.status),
          query.districtId ? eq(reviewFlags.districtId, query.districtId) : undefined,
          cursor
            ? or(
                lt(reviewFlags.createdAt, new Date(cursor.k)),
                and(
                  eq(reviewFlags.createdAt, new Date(cursor.k)),
                  lt(reviewFlags.id, cursor.id),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(desc(reviewFlags.createdAt), desc(reviewFlags.id))
      .limit(query.limit + 1);

    return ok(
      ctx,
      buildPage(rows, query.limit, (row) => ({
        k: row.createdAt.toISOString(),
        id: row.id,
      })),
    );
  }),
);

const patchSchema = z.object({
  flagIds: z.array(geoIdSchema).min(1).max(200),
  status: z.enum(["DISMISSED", "ACTIONED"]),
});

export const PATCH = handler(
  authedRoute(
    { name: "admin.reviewFlags.patch", roles: ADMIN_ROLES, limit: RULES.write },
    async (ctx) => {
      const body = await parseBody(ctx.request, patchSchema);

      const updated = await ctx.tx
        .update(reviewFlags)
        .set({
          status: body.status,
          resolvedBy: ctx.actor.userId,
          resolvedAt: new Date(),
        })
        .where(inArray(reviewFlags.id, body.flagIds))
        .returning({ id: reviewFlags.id });

      // A count lower than requested means some flags were outside the caller's
      // districts. Reported rather than hidden.
      return ok(ctx, {
        updated: updated.length,
        requested: body.flagIds.length,
        outOfScope: body.flagIds.length - updated.length,
      });
    },
  ),
);

export const OPTIONS = preflight;
