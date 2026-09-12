/**
 * GET /api/v1/me      — who am I, and what may I do
 * PATCH /api/v1/me    — edit the handful of fields a user owns
 * DELETE /api/v1/me   — DPDP erasure request
 *
 * This is the endpoint the frontend renders its navigation from. The role in
 * the response is the role in the JWT, which came from the database. No client
 * decides it, and knowing a role grants nothing on its own — every other
 * endpoint re-derives it from the token.
 */
import { eq } from "drizzle-orm";
import { z } from "zod";
import { handler, preflight } from "@/lib/http";
import { authedRoute, ok } from "@/lib/route";
import { parseBody } from "@/lib/validation";
import { RULES } from "@/lib/ratelimit";
import { notFound } from "@/lib/errors";
import {
  adminDistricts,
  agents,
  districts,
  localBodies,
  users,
} from "@/db/schema";

export const dynamic = "force-dynamic";

export const GET = handler(
  authedRoute({ name: "me.read" }, async (ctx) => {
    const rows = await ctx.tx
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        pictureUrl: users.pictureUrl,
        role: users.role,
        status: users.status,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, ctx.actor.userId))
      .limit(1);

    const user = rows[0];
    if (!user) throw notFound("User");

    // Agent summary, present only when the user has completed signup.
    const agentRows = await ctx.tx
      .select({
        id: agents.id,
        agentCode: agents.agentCode,
        status: agents.status,
        districtId: agents.districtId,
        districtNameEn: districts.nameEn,
        districtNameMl: districts.nameMl,
        localBodyId: agents.localBodyId,
        localBodyNameEn: localBodies.nameEn,
        localBodyNameMl: localBodies.nameMl,
        mobileVerifiedAt: agents.mobileVerifiedAt,
      })
      .from(agents)
      .innerJoin(districts, eq(districts.id, agents.districtId))
      .innerJoin(localBodies, eq(localBodies.id, agents.localBodyId))
      .where(eq(agents.userId, ctx.actor.userId))
      .limit(1);

    // Which districts an admin may act in. SUPER_ADMIN is unscoped.
    const scope =
      ctx.actor.role === "DISTRICT_ADMIN"
        ? await ctx.tx
            .select({
              districtId: adminDistricts.districtId,
              nameEn: districts.nameEn,
              nameMl: districts.nameMl,
            })
            .from(adminDistricts)
            .innerJoin(districts, eq(districts.id, adminDistricts.districtId))
            .where(eq(adminDistricts.userId, ctx.actor.userId))
        : [];

    return ok(ctx, {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        pictureUrl: user.pictureUrl,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
      },
      agent: agentRows[0] ?? null,
      districtScope:
        ctx.actor.role === "SUPER_ADMIN" ? "ALL" : scope.map((s) => s.districtId),
      districtScopeDetail: scope,
      // Where this client should land after sign-in. The frontend follows it
      // rather than deciding for itself.
      landing:
        ctx.actor.role === "AGENT"
          ? agentRows[0]
            ? "/agents/dashboard"
            : "/agents/signup"
          : "/admin",
    });
  }),
);

const patchSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
});

export const PATCH = handler(
  authedRoute({ name: "me.write", limit: RULES.write }, async (ctx) => {
    const body = await parseBody(ctx.request, patchSchema);
    if (Object.keys(body).length === 0) return ok(ctx, { updated: false });

    const updated = await ctx.tx
      .update(users)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(users.id, ctx.actor.userId))
      .returning({ id: users.id, name: users.name });

    return ok(ctx, { updated: true, user: updated[0] });
  }),
);

/**
 * DPDP erasure. Personal fields are cleared and the row is tombstoned rather
 * than deleted outright: commission and TDS records must survive for the
 * statutory retention period, and they reference the agent.
 */
export const DELETE = handler(
  authedRoute({ name: "me.delete", limit: RULES.write }, async (ctx) => {
    await ctx.tx
      .update(users)
      .set({
        status: "DELETED",
        name: "Deleted user",
        pictureUrl: null,
        email: `deleted+${ctx.actor.userId}@invalid.calecutech.com`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, ctx.actor.userId));

    return ok(ctx, {
      deleted: true,
      note: "Identifying fields have been erased. Commission and tax records are retained for the statutory period stated in the privacy policy.",
    });
  }),
);

export const OPTIONS = preflight;
