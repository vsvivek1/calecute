/**
 * GET  /api/v1/admin/users — list admins
 * POST /api/v1/admin/users — grant someone a role and district assignments
 *
 * SUPER_ADMIN only. This is the endpoint that creates admins, and it is the
 * reason no email address is hardcoded anywhere in application code: who is an
 * admin is a row, changed here, recorded in the audit log.
 *
 * The two seeded SUPER_ADMIN accounts come from the seed script, not from a
 * constant the frontend or the API can see.
 */
import { z } from "zod";
import { desc, eq, inArray } from "drizzle-orm";
import { handler, preflight } from "@/lib/http";
import { authedRoute, ok } from "@/lib/route";
import { SUPER_ONLY } from "@/lib/auth/context";
import { parseBody, geoIdSchema } from "@/lib/validation";
import { RULES } from "@/lib/ratelimit";
import { ApiError } from "@/lib/errors";
import { adminDistricts, districts, users } from "@/db/schema";
import { record } from "@/lib/audit";

export const dynamic = "force-dynamic";

export const GET = handler(
  authedRoute({ name: "admin.users.list", roles: SUPER_ONLY }, async (ctx) => {
    const rows = await ctx.tx
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        status: users.status,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(inArray(users.role, ["DISTRICT_ADMIN", "SUPER_ADMIN"]))
      .orderBy(desc(users.createdAt));

    const assignments = await ctx.tx
      .select({
        userId: adminDistricts.userId,
        districtId: adminDistricts.districtId,
        nameEn: districts.nameEn,
        nameMl: districts.nameMl,
      })
      .from(adminDistricts)
      .innerJoin(districts, eq(districts.id, adminDistricts.districtId));

    return ok(ctx, {
      data: rows.map((user) => ({
        ...user,
        districts:
          user.role === "SUPER_ADMIN"
            ? "ALL"
            : assignments.filter((a) => a.userId === user.id),
      })),
    });
  }),
);

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(["AGENT", "DISTRICT_ADMIN", "SUPER_ADMIN"]),
  districtIds: z.array(geoIdSchema).max(14).default([]),
});

export const POST = handler(
  authedRoute(
    { name: "admin.users.create", roles: SUPER_ONLY, limit: RULES.write },
    async (ctx) => {
      const body = await parseBody(ctx.request, bodySchema);

      if (body.role === "DISTRICT_ADMIN" && body.districtIds.length === 0) {
        throw new ApiError(
          "VALIDATION_FAILED",
          "A district admin needs at least one district. Without one they can see nothing.",
          { details: { field: "districtIds" } },
        );
      }

      const known = await ctx.tx
        .select({ id: districts.id })
        .from(districts)
        .where(
          body.districtIds.length
            ? inArray(districts.id, body.districtIds)
            : eq(districts.id, -1),
        );
      if (known.length !== body.districtIds.length) {
        throw new ApiError("UNKNOWN_GEOGRAPHY", "One or more district ids are unknown");
      }

      // The row may already exist — either a seeded admin or someone who has
      // already signed in as an agent. Either way we update rather than insert,
      // so a Google subject is never orphaned.
      const existing = await ctx.tx
        .select({ id: users.id, role: users.role })
        .from(users)
        .where(eq(users.email, body.email))
        .limit(1);

      let userId: number;
      let previousRole: string | null = null;

      if (existing[0]) {
        userId = existing[0].id;
        previousRole = existing[0].role;
        await ctx.tx
          .update(users)
          .set({ role: body.role, updatedAt: new Date() })
          .where(eq(users.id, userId));
      } else {
        const [created] = await ctx.tx
          .insert(users)
          .values({
            googleSub: `pending:${body.email}`,
            email: body.email,
            name: body.email,
            role: body.role,
          })
          .returning({ id: users.id });
        userId = created.id;
      }

      await ctx.tx.delete(adminDistricts).where(eq(adminDistricts.userId, userId));
      if (body.districtIds.length > 0) {
        await ctx.tx.insert(adminDistricts).values(
          body.districtIds.map((districtId) => ({
            userId,
            districtId,
            assignedBy: ctx.actor.userId,
          })),
        );
      }

      await record(ctx.tx, {
        request: ctx.request,
        actor: ctx.actor,
        action: previousRole ? "admin.role_changed" : "admin.created",
        entityType: "user",
        entityId: userId,
        before: previousRole ? { role: previousRole } : undefined,
        after: { role: body.role, districtIds: body.districtIds },
      });

      return ok(
        ctx,
        {
          user: { id: userId, role: body.role, districtIds: body.districtIds },
          note: existing[0]
            ? "Existing account updated."
            : "Account created. The role applies the first time they sign in with Google.",
        },
        existing[0] ? 200 : 201,
      );
    },
  ),
);

export const OPTIONS = preflight;
