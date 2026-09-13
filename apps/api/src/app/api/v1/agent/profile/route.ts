/**
 * GET /api/v1/agent/profile — profile and settings
 * PUT /api/v1/agent/profile — the fields an agent may change themselves
 *
 * Geography is deliberately NOT editable here. Moving panchayat would vacate
 * one slot and take another, and would silently rewrite every coverage report
 * and the agent's own code. It is an admin action, on request.
 */
import { z } from "zod";
import { eq } from "drizzle-orm";
import { handler, preflight } from "@/lib/http";
import { authedRoute, ok } from "@/lib/route";
import { parseBody } from "@/lib/validation";
import { RULES } from "@/lib/ratelimit";
import {
  agentQualifications,
  agents,
  districts,
  localBodies,
  users,
  wards,
} from "@/db/schema";
import { currentAgent } from "@/lib/agent";

export const dynamic = "force-dynamic";

export const GET = handler(
  authedRoute({ name: "agent.profile.read" }, async (ctx) => {
    const agent = await currentAgent(ctx.tx, ctx.actor.userId);

    const [row] = await ctx.tx
      .select({
        agentCode: agents.agentCode,
        status: agents.status,
        occupation: agents.occupation,
        mobile: agents.mobile,
        mobileVerifiedAt: agents.mobileVerifiedAt,
        termsVersion: agents.termsVersion,
        termsAcceptedAt: agents.termsAcceptedAt,
        privacyConsentAt: agents.privacyConsentAt,
        createdAt: agents.createdAt,
        reviewNote: agents.reviewNote,
        name: users.name,
        email: users.email,
        districtNameEn: districts.nameEn,
        districtNameMl: districts.nameMl,
        localBodyNameEn: localBodies.nameEn,
        localBodyNameMl: localBodies.nameMl,
        localBodyType: localBodies.type,
        wardNumber: wards.number,
        wardNameMl: wards.nameMl,
        // An applicant whose town is not seeded yet has these instead; see
        // 0006_pending_local_body.sql and 0007_required_ward.sql.
        pendingLocalBodyName: agents.pendingLocalBodyName,
        pendingWardNumber: agents.pendingWardNumber,
      })
      .from(agents)
      .innerJoin(users, eq(users.id, agents.userId))
      .innerJoin(districts, eq(districts.id, agents.districtId))
      // Left, not inner: local_body_id is nullable for an unplaced applicant,
      // and an inner join would return them no profile at all.
      .leftJoin(localBodies, eq(localBodies.id, agents.localBodyId))
      .leftJoin(wards, eq(wards.id, agents.wardId))
      .where(eq(agents.id, agent.id))
      .limit(1);

    const [qualifications] = await ctx.tx
      .select()
      .from(agentQualifications)
      .where(eq(agentQualifications.agentId, agent.id))
      .limit(1);

    return ok(ctx, {
      profile: row,
      qualifications: qualifications ?? null,
      editable: ["name", "occupation", "qualifications"],
      note: "District, panchayat and ward are fixed at signup. Contact an administrator to change them.",
    });
  }),
);

const putSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  occupation: z.string().trim().min(2).max(120).optional(),
});

export const PUT = handler(
  authedRoute({ name: "agent.profile.write", limit: RULES.write }, async (ctx) => {
    const body = await parseBody(ctx.request, putSchema);
    const agent = await currentAgent(ctx.tx, ctx.actor.userId);

    if (body.name) {
      await ctx.tx
        .update(users)
        .set({ name: body.name, updatedAt: new Date() })
        .where(eq(users.id, ctx.actor.userId));
    }
    if (body.occupation) {
      await ctx.tx
        .update(agents)
        .set({ occupation: body.occupation, updatedAt: new Date() })
        .where(eq(agents.id, agent.id));
    }

    return ok(ctx, { updated: true });
  }),
);

export const OPTIONS = preflight;
