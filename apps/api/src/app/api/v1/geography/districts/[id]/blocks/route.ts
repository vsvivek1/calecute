/**
 * GET /api/v1/geography/districts/{id}/blocks
 *
 * Block panchayats in a district. Admin reports filter by block; the signup
 * flow does not, because an applicant picks a local body directly.
 */
import { asc, eq } from "drizzle-orm";
import { handler, preflight } from "@/lib/http";
import { publicRoute, ok } from "@/lib/route";
import { blockPanchayats } from "@/db/schema";
import { geoIdSchema } from "@/lib/validation";
import { ApiError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export const GET = handler(async (request, context) => {
  const params = await (context as unknown as { params: Promise<{ id: string }> })
    .params;
  const parsed = geoIdSchema.safeParse(params.id);
  if (!parsed.success) {
    throw new ApiError("VALIDATION_FAILED", "District id must be a positive integer");
  }

  return publicRoute({ name: "geo.blocks" }, async (ctx) => {
    const rows = await ctx.tx
      .select({
        id: blockPanchayats.id,
        nameEn: blockPanchayats.nameEn,
        nameMl: blockPanchayats.nameMl,
        lgdCode: blockPanchayats.lgdCode,
      })
      .from(blockPanchayats)
      .where(eq(blockPanchayats.districtId, parsed.data))
      .orderBy(asc(blockPanchayats.nameEn));

    return ok(ctx, { data: rows });
  })(request);
});

export const OPTIONS = preflight;
