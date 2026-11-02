/**
 * GET /api/v1/public/products
 *
 * The active catalogue with what a referrer earns on each: fee (null means
 * free), the seller band and the member rate, and where the product lives.
 * Public, so the rewards page and the /r redirect need no credential.
 */
import { asc, eq } from "drizzle-orm";
import { handler, preflight } from "@/lib/http";
import { ok, publicRoute } from "@/lib/route";
import { RULES } from "@/lib/ratelimit";
import { products } from "@/db/schema";
import { publicProductShape } from "@/lib/products";

export const dynamic = "force-dynamic";

export const GET = handler(
  publicRoute({ name: "public.products", limit: RULES.referralRead }, async (ctx) => {
    const rows = await ctx.tx
      .select()
      .from(products)
      .where(eq(products.active, true))
      .orderBy(asc(products.nameEn));
    return ok(ctx, { data: rows.map(publicProductShape) }, 200, 300);
  }),
);

export const OPTIONS = preflight;
