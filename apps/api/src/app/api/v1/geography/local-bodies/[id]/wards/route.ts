/**
 * GET /api/v1/geography/local-bodies/{id}/wards
 *
 * Wards in a local body. Rows whose `status` is PENDING exist because the
 * official ward count is known but the name has not been loaded — they are
 * returned with a null name rather than omitted, so the picker can still show
 * "Ward 7" and the applicant is not blocked by our data gap.
 */
import { asc, eq } from "drizzle-orm";
import { handler, preflight } from "@/lib/http";
import { publicRoute, ok } from "@/lib/route";
import { wards, localBodies } from "@/db/schema";
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

  return publicRoute({ name: "geo.wards" }, async (ctx) => {
    const [body] = await ctx.tx
      .select({ id: localBodies.id, wardData: localBodies.wardData })
      .from(localBodies)
      .where(eq(localBodies.id, parsed.data))
      .limit(1);

    if (!body) {
      throw new ApiError("UNKNOWN_GEOGRAPHY", "Local body not found");
    }

    const rows = await ctx.tx
      .select({
        id: wards.id,
        number: wards.number,
        nameEn: wards.nameEn,
        nameMl: wards.nameMl,
        status: wards.status,
      })
      .from(wards)
      .where(eq(wards.localBodyId, parsed.data))
      .orderBy(asc(wards.number));

    return ok(
      ctx,
      {
        data: rows,
        wardData: body.wardData,
      // Tells the client to render an explanatory line rather than an empty
      // dropdown that looks broken.
        note:
          rows.length === 0
            ? "Ward list not yet loaded for this local body. Ward is optional at signup."
            : null,
      },
      200,
      3600,
    );
  })(request);
});

export const OPTIONS = preflight;
