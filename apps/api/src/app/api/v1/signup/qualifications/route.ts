/**
 * POST /api/v1/signup/qualifications
 *
 * Step 3. Optional in every sense: the whole body is optional, the endpoint may
 * be skipped, and skipping it does not affect the application. The heading the
 * client shows is "ഇത് നിർബന്ധമല്ല. തിരഞ്ഞെടുപ്പിൽ സഹായിക്കും."
 */
import { z } from "zod";
import { eq } from "drizzle-orm";
import { handler, preflight } from "@/lib/http";
import { authedRoute, ok } from "@/lib/route";
import { parseBody } from "@/lib/validation";
import { RULES } from "@/lib/ratelimit";
import { notFound } from "@/lib/errors";
import { agentQualifications, agents } from "@/db/schema";

export const dynamic = "force-dynamic";

const EXPERIENCE = [
  "INSURANCE_AGENCY",
  "AKSHAYA_CSC",
  "MARKETING_SALES",
  "BANKING_FINANCE",
  "BUSINESS_SHOP",
  "NONE",
] as const;

const REACH = [
  "BANK_EMPLOYEES",
  "CONTRACTORS",
  "STUDENTS",
  "SHOP_OWNERS",
  "GOVERNMENT_OFFICES",
  "OTHERS",
] as const;

const bodySchema = z.object({
  education: z
    .enum(["SSLC", "PLUS_TWO", "DEGREE", "PG", "DIPLOMA", "ITI", "OTHER"])
    .nullish(),
  educationOther: z.string().trim().max(120).nullish(),
  experience: z.array(z.enum(EXPERIENCE)).max(EXPERIENCE.length).nullish(),
  hoursPerDay: z.enum(["ONE", "TWO_TO_THREE", "FOUR_PLUS", "FULL_TIME"]).nullish(),
  hasVehicle: z.boolean().nullish(),
  computerLiteracy: z.enum(["YES", "BASIC", "NO"]).nullish(),
  reach: z.array(z.enum(REACH)).max(REACH.length).nullish(),
});

export const POST = handler(
  authedRoute({ name: "signup.qualifications", limit: RULES.write }, async (ctx) => {
    const body = await parseBody(ctx.request, bodySchema);

    const [agent] = await ctx.tx
      .select({ id: agents.id })
      .from(agents)
      .where(eq(agents.userId, ctx.actor.userId))
      .limit(1);
    if (!agent) throw notFound("Application");

    const values = {
      agentId: agent.id,
      education: body.education ?? null,
      educationOther: body.educationOther ?? null,
      experience: body.experience ?? null,
      hoursPerDay: body.hoursPerDay ?? null,
      hasVehicle: body.hasVehicle ?? null,
      computerLiteracy: body.computerLiteracy ?? null,
      reach: body.reach ?? null,
      updatedAt: new Date(),
    };

    await ctx.tx
      .insert(agentQualifications)
      .values(values)
      .onConflictDoUpdate({ target: agentQualifications.agentId, set: values });

    return ok(ctx, { saved: true });
  }),
);

export const OPTIONS = preflight;
