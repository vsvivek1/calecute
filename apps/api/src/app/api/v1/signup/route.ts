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
import { agents, reviewFlags, termsVersions } from "@/db/schema";
import { mapConstraintErrors } from "@/db/constraints";
import { validateGeographySelection } from "@/lib/geography";
import { verifyFormToken } from "@/lib/auth/form-token";
import {
  assertDistrictExists,
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
  /**
   * Omitted when the applicant's municipality or corporation is not seeded yet;
   * they send `pendingLocalBodyName` instead. Exactly one is required.
   */
  localBodyId: geoIdSchema.nullish(),
  pendingLocalBodyName: z.string().trim().min(2).max(120).nullish(),
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
  /**
   * Issued by GET /signup/eligibility and signed by us, so elapsed time is
   * measured between our clock and our clock. Replaces a client-reported
   * duration, which a bot could simply lie about.
   */
  formToken: z.string().max(2048).nullish(),
  deviceFingerprint: z.string().max(512).nullish(),
})
  .refine((v) => Boolean(v.localBodyId) !== Boolean(v.pendingLocalBodyName), {
    message:
      "Give either localBodyId or pendingLocalBodyName, not both and not neither",
    path: ["localBodyId"],
  })
  // A ward belongs to a local body, so it makes no sense without one.
  .refine((v) => !(v.wardId && !v.localBodyId), {
    message: "A ward cannot be given without a local body",
    path: ["wardId"],
  });

export const POST = handler(
  authedRoute({ name: "signup.submit", limit: RULES.signup }, async (ctx) => {
    const body = await parseBody(ctx.request, bodySchema);

    // Cheap rejections first, before anything is locked.
    const timing = await verifyFormToken(body.formToken, ctx.actor.userId);
    checkFormIntegrity({
      honeypot: body.honeypot,
      fillMs: timing?.elapsedMs ?? null,
    });
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
    let remaining: number | null = null;
    if (body.localBodyId) {
      await validateGeographySelection(ctx.tx, {
        districtId: body.districtId,
        localBodyId: body.localBodyId,
        wardId: body.wardId ?? null,
      });
      ({ remaining } = await reserveSlot(ctx.tx, body.localBodyId));
    } else {
      // Unplaced: the district still has to exist, and no slot is taken because
      // we do not yet know which body it would come from.
      await assertDistrictExists(ctx.tx, body.districtId);
    }

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
          localBodyId: body.localBodyId ?? null,
          pendingLocalBodyName: body.pendingLocalBodyName ?? null,
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
      localBodyId: body.localBodyId ?? null,
      deviceHash: hashFingerprint(body.deviceFingerprint ?? null),
      ipPrefix: ipPrefix(ctx.request),
      fillMs: timing?.elapsedMs ?? null,
    });

    // Flag it so an unplaced application is worked through rather than lost.
    if (!body.localBodyId) {
      await ctx.tx.insert(reviewFlags).values({
        kind: "LOCAL_BODY_NOT_SEEDED",
        agentId: agent.id,
        districtId: body.districtId,
        detail: { typed: body.pendingLocalBodyName },
      });
    }

    return ok(
      ctx,
      {
        agent: {
          id: agent.id,
          agentCode: agent.agentCode,
          status: agent.status,
          districtId: agent.districtId,
          localBodyId: agent.localBodyId,
          pendingLocalBodyName: agent.pendingLocalBodyName,
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
