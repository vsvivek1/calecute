/**
 * GET  /api/v1/admin/products/{id}/api-keys   list (never the hash)
 * POST /api/v1/admin/products/{id}/api-keys   mint; the plaintext is in this
 *                                             response and nowhere else, ever
 *
 * SUPER_ADMIN only. A `client` key ships inside an app and may register
 * members, claim attributions and log clicks; a `server` key is held by the
 * product's backend and may additionally record payments.
 */
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { handler, preflight } from "@/lib/http";
import { authedRoute, ok } from "@/lib/route";
import { SUPER_ONLY } from "@/lib/auth/context";
import { parseBody, geoIdSchema } from "@/lib/validation";
import { RULES } from "@/lib/ratelimit";
import { ApiError } from "@/lib/errors";
import { productApiKeys, products } from "@/db/schema";
import { record } from "@/lib/audit";
import { mintApiKey } from "@/lib/apikeys";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  kind: z.enum(["client", "server"]),
  label: z.string().trim().min(1).max(120),
});

const productIdOf = async (context: unknown): Promise<number> => {
  const { id } = await (context as { params: Promise<{ id: string }> }).params;
  const parsed = geoIdSchema.safeParse(id);
  if (!parsed.success) throw new ApiError("VALIDATION_FAILED", "Bad product id");
  return parsed.data;
};

const keyShape = {
  id: productApiKeys.id,
  productId: productApiKeys.productId,
  kind: productApiKeys.kind,
  label: productApiKeys.label,
  createdAt: productApiKeys.createdAt,
  revokedAt: productApiKeys.revokedAt,
};

export const GET = handler(async (request, context) => {
  const productId = await productIdOf(context);
  return authedRoute(
    { name: "admin.product.keys.list", roles: SUPER_ONLY },
    async (ctx) => {
      const rows = await ctx.tx
        .select(keyShape)
        .from(productApiKeys)
        .where(eq(productApiKeys.productId, productId))
        .orderBy(desc(productApiKeys.createdAt));
      return ok(ctx, { data: rows });
    },
  )(request);
});

export const POST = handler(async (request, context) => {
  const productId = await productIdOf(context);
  return authedRoute(
    { name: "admin.product.keys.mint", roles: SUPER_ONLY, limit: RULES.write },
    async (ctx) => {
      const body = await parseBody(ctx.request, bodySchema);

      const [product] = await ctx.tx
        .select({ id: products.id, slug: products.slug })
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);
      if (!product) throw new ApiError("NOT_FOUND", "Unknown product");

      const { plaintext, hash } = mintApiKey(body.kind);
      const [key] = await ctx.tx
        .insert(productApiKeys)
        .values({
          productId,
          kind: body.kind,
          keyHash: hash,
          label: body.label,
          createdBy: ctx.actor.userId,
        })
        .returning(keyShape);

      await record(ctx.tx, {
        request: ctx.request,
        actor: ctx.actor,
        action: "product.api_key_minted",
        entityType: "product_api_key",
        entityId: key.id,
        after: { productId, slug: product.slug, kind: body.kind, label: body.label },
      });

      return ok(
        ctx,
        {
          key: { ...key, product: product.slug },
          // Shown once. Only its SHA-256 is stored.
          plaintext,
        },
        201,
      );
    },
  )(request);
});

export const OPTIONS = preflight;
