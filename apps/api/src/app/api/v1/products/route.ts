/**
 * GET /api/v1/products
 *
 * The product catalogue. Agents see active products; admins see everything.
 *
 * PLACEHOLDER DATA: no products are seeded, because the brief did not name
 * them. The endpoint and the assignment flow are complete and will work the
 * moment rows exist. See README — placeholders.
 */
import { desc } from "drizzle-orm";
import { handler, preflight } from "@/lib/http";
import { authedRoute, ok } from "@/lib/route";
import { products } from "@/db/schema";

export const dynamic = "force-dynamic";

export const GET = handler(
  authedRoute({ name: "products.list" }, async (ctx) => {
    const rows = await ctx.tx
      .select({
        id: products.id,
        slug: products.slug,
        nameEn: products.nameEn,
        nameMl: products.nameMl,
        summaryEn: products.summaryEn,
        summaryMl: products.summaryMl,
        active: products.active,
      })
      .from(products)
      .orderBy(desc(products.createdAt));

    return ok(ctx, { data: rows });
  }),
);

export const OPTIONS = preflight;
