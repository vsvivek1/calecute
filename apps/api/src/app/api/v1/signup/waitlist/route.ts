/**
 * POST /api/v1/signup/waitlist
 *
 * What a full panchayat offers instead of a signup. Recorded so the admin
 * coverage report can show which full panchayats have people waiting, which is
 * the signal for raising the slot count there.
 */
import { z } from "zod";
import { handler, preflight } from "@/lib/http";
import { authedRoute, ok } from "@/lib/route";
import { parseBody, mobileSchema, geoIdSchema } from "@/lib/validation";
import { RULES } from "@/lib/ratelimit";
import { ApiError } from "@/lib/errors";
import { waitlistEntries } from "@/db/schema";
import { availabilityFor, validateGeographySelection } from "@/lib/geography";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  districtId: geoIdSchema,
  localBodyId: geoIdSchema,
  mobile: mobileSchema,
});

export const POST = handler(
  authedRoute({ name: "signup.waitlist", limit: RULES.signup }, async (ctx) => {
    const body = await parseBody(ctx.request, bodySchema);

    await validateGeographySelection(ctx.tx, {
      districtId: body.districtId,
      localBodyId: body.localBodyId,
    });

    const availability = await availabilityFor(ctx.tx, body.localBodyId);
    if (availability.state === "OPEN") {
      throw new ApiError(
        "VALIDATION_FAILED",
        "This panchayat still has places. Apply directly instead of joining the waitlist.",
        { details: { remaining: availability.remaining } },
      );
    }

    const [entry] = await ctx.tx
      .insert(waitlistEntries)
      .values({
        userId: ctx.actor.userId,
        districtId: body.districtId,
        localBodyId: body.localBodyId,
        mobile: body.mobile,
      })
      .onConflictDoNothing({
        target: [waitlistEntries.userId, waitlistEntries.localBodyId],
      })
      .returning({ id: waitlistEntries.id });

    return ok(
      ctx,
      {
        joined: true,
        alreadyOnList: !entry,
        position: availability.waitlisted + (entry ? 1 : 0),
      },
      entry ? 201 : 200,
    );
  }),
);

export const OPTIONS = preflight;
