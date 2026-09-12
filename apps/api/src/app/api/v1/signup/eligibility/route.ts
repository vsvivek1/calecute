/**
 * GET /api/v1/signup/eligibility
 *
 * Lets a signed-in client decide what to render without guessing: has this
 * account already applied, and is the chosen panchayat open. Answering this
 * server-side keeps the "you already have an application" case out of the
 * signup form entirely.
 */
import { eq } from "drizzle-orm";
import { z } from "zod";
import { handler, preflight } from "@/lib/http";
import { authedRoute, ok } from "@/lib/route";
import { parseQuery, geoIdSchema } from "@/lib/validation";
import { agents, termsVersions } from "@/db/schema";
import { availabilityFor } from "@/lib/geography";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

const querySchema = z.object({ localBodyId: geoIdSchema.optional() });

export const GET = handler(
  authedRoute({ name: "signup.eligibility" }, async (ctx) => {
    const query = parseQuery(ctx.url, querySchema);

    const [existing] = await ctx.tx
      .select({
        id: agents.id,
        agentCode: agents.agentCode,
        status: agents.status,
      })
      .from(agents)
      .where(eq(agents.userId, ctx.actor.userId))
      .limit(1);

    const [currentTerms] = await ctx.tx
      .select({ version: termsVersions.version, url: termsVersions.url })
      .from(termsVersions)
      .orderBy(desc(termsVersions.effectiveFrom))
      .limit(1);

    const availability = query.localBodyId
      ? await availabilityFor(ctx.tx, query.localBodyId)
      : null;

    return ok(ctx, {
      canApply: !existing,
      existingApplication: existing ?? null,
      currentTerms: currentTerms ?? null,
      availability,
    });
  }),
);

export const OPTIONS = preflight;
