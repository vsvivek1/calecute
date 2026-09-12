/**
 * GET /api/v1/agent/products
 *
 * Assigned products and their downloadable sales material. An agent sees only
 * products assigned to them; the asset rows are gated by the same rule in the
 * database, so a guessed product id returns nothing.
 */
import { and, eq } from "drizzle-orm";
import { handler, preflight } from "@/lib/http";
import { authedRoute, ok } from "@/lib/route";
import { agentProducts, productAssets, products } from "@/db/schema";
import { currentAgent } from "@/lib/agent";

export const dynamic = "force-dynamic";

export const GET = handler(
  authedRoute({ name: "agent.products" }, async (ctx) => {
    const agent = await currentAgent(ctx.tx, ctx.actor.userId);

    const assigned = await ctx.tx
      .select({
        id: products.id,
        slug: products.slug,
        nameEn: products.nameEn,
        nameMl: products.nameMl,
        summaryEn: products.summaryEn,
        summaryMl: products.summaryMl,
        assignedAt: agentProducts.assignedAt,
      })
      .from(agentProducts)
      .innerJoin(products, eq(products.id, agentProducts.productId))
      .where(and(eq(agentProducts.agentId, agent.id), eq(products.active, true)));

    const assets = assigned.length
      ? await ctx.tx
          .select({
            id: productAssets.id,
            productId: productAssets.productId,
            title: productAssets.title,
            kind: productAssets.kind,
            url: productAssets.url,
            sizeBytes: productAssets.sizeBytes,
          })
          .from(productAssets)
      : [];

    return ok(ctx, {
      data: assigned.map((product) => ({
        ...product,
        assets: assets.filter((asset) => asset.productId === product.id),
      })),
    });
  }),
);

export const OPTIONS = preflight;
