/**
 * GET /api/v1/geography/districts
 *
 * Public. The recruitment page renders this list server-side before anyone
 * signs in, so it must be cheap and cacheable at the edge of the frontend.
 */
import { asc } from "drizzle-orm";
import { handler, preflight } from "@/lib/http";
import { publicRoute, ok } from "@/lib/route";
import { districts } from "@/db/schema";

export const dynamic = "force-dynamic";

export const GET = handler(
  publicRoute({ name: "geo.districts" }, async (ctx) => {
    const rows = await ctx.tx
      .select({
        id: districts.id,
        nameEn: districts.nameEn,
        nameMl: districts.nameMl,
        codeSlug: districts.codeSlug,
        lgdCode: districts.lgdCode,
        wardData: districts.wardData,
      })
      .from(districts)
      .orderBy(asc(districts.nameEn));

    return ok(ctx, { data: rows });
  }),
);

export const OPTIONS = preflight;
