/**
 * GET /api/v1/public/products/{slug}
 *
 * One product's public referral facts: free or paid, the rates, and the web
 * and Play Store URLs the /r/{code} redirect sends people to.
 */
import { and, eq } from "drizzle-orm";
import { handler, preflight } from "@/lib/http";
import { ok, publicRoute } from "@/lib/route";
import { ApiError } from "@/lib/errors";
import { RULES } from "@/lib/ratelimit";
import { products } from "@/db/schema";
import { publicProductShape } from "@/lib/products";

export const dynamic = "force-dynamic";

export const GET = handler(async (request, context) => {
  const { slug } = await (context as unknown as { params: Promise<{ slug: string }> }).params;
  const key = (slug ?? "").trim().toLowerCase();
  if (!/^[a-z0-9-]{1,80}$/.test(key)) {
    throw new ApiError("VALIDATION_FAILED", "Bad product slug");
  }

  return publicRoute({ name: "public.product", limit: RULES.referralRead }, async (ctx) => {
    const [row] = await ctx.tx
      .select()
      .from(products)
      .where(and(eq(products.slug, key), eq(products.active, true)))
      .limit(1);
    if (!row) throw new ApiError("NOT_FOUND", "Unknown product");
    return ok(ctx, publicProductShape(row), 200, 300);
  })(request);
});

export const OPTIONS = preflight;
