/**
 * POST /api/v1/signup
 *
 * Step 2 of the flow: the six required fields, plus consent and the anti-abuse
 * signals. Requires a signed-in user — step 1 is Google Sign-In.
 *
 * Everything happens in one transaction: validate geography, take the slot,
 * issue the code, write the agent, record consent and signals. A failure at any
 * point leaves no half-created agent and no consumed slot.
 */
import { z } from "zod";
import { eq } from "drizzle-orm";
import { handler, preflight } from "@/lib/http";
import { authedRoute, ok } from "@/lib/route";
import { parseBody, mobileSchema, geoIdSchema } from "@/lib/validation";
import { RULES } from "@/lib/ratelimit";
import { ApiError } from "@/lib/errors";
import { hashFingerprint, ipPrefix } from "@/lib/net";
import { agents, termsVersions } from "@/db/schema";
import { mapConstraintErrors } from "@/db/constraints";
import { validateGeographySelection } from "@/lib/geography";
import {
  assertMobileUnused,
  assertNotAlreadyRegistered,
  checkFormIntegrity,
  issueAgentCode,
  recordSignupSignals,
  reserveSlot,
} from "@/lib/signup";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  // The six required fields, and nothing beyond them.
  name: z.string().trim().min(2).max(120),
  mobile: mobileSchema,
  districtId: geoIdSchema,
  localBodyId: geoIdSchema,
  wardId: geoIdSchema.nullish(),
  occupation: z.string().trim().min(2).max(120),

  // Consent, recorded with the version of the terms actually shown.
  termsVersion: z.string().min(1),
  acceptedTerms: z.literal(true, {
    error: "The terms must be accepted to apply",
  }),
  privacyConsent: z.literal(true, {
    error: "Consent to the privacy policy is required",
  }),

  // Anti-abuse. All optional: a client that omits them is not rejected, it
  // simply provides no signal.
  honeypot: z.string().max(200).nullish(),
  fillMs: z.number().int().min(0).max(86_400_000).nullish(),
  deviceFingerprint: z.string().max(512).nullish(),
});

export const POST = handler(
  authedRoute({ name: "signup.submit", limit: RULES.signup }, async (ctx) => {
    const body = await parseBody(ctx.request, bodySchema);

    // Cheap rejections first, before anything is locked.
    checkFormIntegrity({ honeypot: body.honeypot, fillMs: body.fillMs });
    await assertNotAlreadyRegistered(ctx.tx, ctx.actor.userId);
    await assertMobileUnused(ctx.tx, body.mobile);

    const [terms] = await ctx.tx
      .select({ version: termsVersions.version })
      .from(termsVersions)
      .where(eq(termsVersions.version, body.termsVersion))
      .limit(1);
    if (!terms) {
      throw new ApiError(
        "VALIDATION_FAILED",
        "Unknown terms version. Reload the page and try again.",
        { details: { field: "termsVersion" } },
      );
    }

    // Every geography id is checked against the seeded data, and checked to
    // belong together. A modified client cannot file an agent into a ward in
    // another district.
    await validateGeographySelection(ctx.tx, {
      districtId: body.districtId,
      localBodyId: body.localBodyId,
      wardId: body.wardId ?? null,
    });

    const { remaining } = await reserveSlot(ctx.tx, body.localBodyId);
    const agentCode = await issueAgentCode(ctx.tx, body.districtId);
    const now = new Date();

    // The insert, not the pre-check, is what guarantees one account per mobile:
    // under RLS the applicant cannot see another applicant's row, so
    // assertMobileUnused above only catches collisions with rows they can see.
    const [agent] = await mapConstraintErrors(() =>
      ctx.tx
        .insert(agents)
        .values({
          userId: ctx.actor.userId,
          agentCode,
          districtId: body.districtId,
          localBodyId: body.localBodyId,
          wardId: body.wardId ?? null,
          mobile: body.mobile,
          occupation: body.occupation,
          status: "PENDING_REVIEW",
          termsVersion: terms.version,
          termsAcceptedAt: now,
          privacyConsentAt: now,
        })
        .returning(),
    );

    await recordSignupSignals(ctx.tx, {
      agentId: agent.id,
      districtId: body.districtId,
      localBodyId: body.localBodyId,
      deviceHash: hashFingerprint(body.deviceFingerprint ?? null),
      ipPrefix: ipPrefix(ctx.request),
      fillMs: body.fillMs ?? null,
    });

    return ok(
      ctx,
      {
        agent: {
          id: agent.id,
          agentCode: agent.agentCode,
          status: agent.status,
          districtId: agent.districtId,
          localBodyId: agent.localBodyId,
          wardId: agent.wardId,
        },
        slotsRemainingAfter: remaining,
        nextStep: "/api/v1/signup/qualifications",
      },
      201,
    );
  }),
);

export const OPTIONS = preflight;
