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
  recordApplication,
  resolveWard,
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
  /**
   * The applicant's ward NUMBER, not an id. Ward names are not loaded for any
   * local body, so there is no list to pick from — but a resident knows their
   * own ward number, and it is the unit the coverage model works in. The row is
   * created on demand; see app.ward_for() in 0007_required_ward.sql.
   */
  wardNumber: z.number().int().min(1).max(100),
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
  /*
   * Exactly one of the two. The message is written for the person filling the
   * form, not for whoever wrote the client: this fires when a picker fails to
   * resolve a typed name, and "give either localBodyId or pendingLocalBodyName"
   * told an applicant nothing they could act on.
   */
  .refine((v) => Boolean(v.localBodyId) !== Boolean(v.pendingLocalBodyName), {
    message:
      "Choose your panchayat or municipality from the list. If it is not there, tick the box and type its name.",
    path: ["localBodyId"],
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
    let slots: Awaited<ReturnType<typeof recordApplication>> | null = null;
    let wardId: number | null = null;
    if (body.localBodyId) {
      await validateGeographySelection(ctx.tx, {
        districtId: body.districtId,
        localBodyId: body.localBodyId,
        wardId: null,
      });
      wardId = await resolveWard(ctx.tx, body.localBodyId, body.wardNumber);
      slots = await recordApplication(ctx.tx, body.localBodyId);
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
          wardId,
          // Parked, not lost: an unplaced applicant has no local body to hang a
          // ward row off, so the number waits here until an admin places them.
          pendingWardNumber: wardId === null ? body.wardNumber : null,
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
        /*
         * Reported, not enforced. Capacity no longer turns anyone away — who
         * gets a place is a selection made later from everyone who applied.
         */
        applicationsInPanchayat: slots?.applications ?? null,
        slotCapacity: slots?.slotCapacity ?? null,
        overSubscribed: slots?.overSubscribed ?? false,
        nextStep: "/api/v1/signup/qualifications",
      },
      201,
    );
  }),
);

export const OPTIONS = preflight;
