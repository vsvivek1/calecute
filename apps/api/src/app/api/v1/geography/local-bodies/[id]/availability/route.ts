/**
 * GET /api/v1/geography/local-bodies/{id}/availability
 *
 * Live slot availability for the public page. Read from the database on every
 * request: this number is a trust signal, and a stale or invented one is worse
 * than none.
 */
import { handler, preflight } from "@/lib/http";
import { publicRoute, ok } from "@/lib/route";
import { availabilityFor } from "@/lib/geography";
import { geoIdSchema } from "@/lib/validation";
import { ApiError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export const GET = handler(async (request, context) => {
  const params = await (context as unknown as { params: Promise<{ id: string }> })
    .params;
  const parsed = geoIdSchema.safeParse(params.id);
  if (!parsed.success) {
    throw new ApiError("VALIDATION_FAILED", "Local body id must be a positive integer");
  }

  return publicRoute({ name: "geo.availability" }, async (ctx) =>
    ok(ctx, await availabilityFor(ctx.tx, parsed.data)),
  )(request);
});

export const OPTIONS = preflight;
