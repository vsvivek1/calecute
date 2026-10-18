/**
 * PATCH /api/v1/admin/products/{id}
 *
 * Referral settings for one product: the fee (null makes it free, which
 * switches USER-tier rewards from cash to diamonds), the seller band, the
 * member rate, and where the product lives on the web and on Play.
 *
 * SUPER_ADMIN only. The rates are a company-wide commercial decision, and
 * the products_super_write policy admits nobody else — a district admin's
 * PATCH would silently update nothing.
 */
import { z } from "zod";
import { eq } from "drizzle-orm";
import { handler, preflight } from "@/lib/http";
import { authedRoute, ok } from "@/lib/route";
import { SUPER_ONLY } from "@/lib/auth/context";
import { parseBody, geoIdSchema } from "@/lib/validation";
import { RULES } from "@/lib/ratelimit";
import { ApiError } from "@/lib/errors";
import { products } from "@/db/schema";
import { record } from "@/lib/audit";
import { adminProductShape } from "@/lib/products";
import { MAX_SELLER_RATE_BPS, MIN_SELLER_RATE_BPS } from "@/lib/referral";

export const dynamic = "force-dynamic";

const url = z.string().trim().url().max(500).nullable();

const bodySchema = z
  .object({
    feePaise: z.number().int().min(0).nullable().optional(),
    sellerRateBps: z.number().int().min(MIN_SELLER_RATE_BPS).max(MAX_SELLER_RATE_BPS).optional(),
    userRateBps: z.number().int().min(0).max(1000).optional(),
    webUrl: url.optional(),
    playUrl: url.optional(),
    androidPackage: z
      .string()
      .trim()
      .regex(/^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/, "Not an Android package name")
      .nullable()
      .optional(),
    active: z.boolean().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, { message: "Nothing to change" });

export const PATCH = handler(async (request, context) => {
  const { id } = await (context as unknown as { params: Promise<{ id: string }> }).params;
  const productId = geoIdSchema.safeParse(id);
  if (!productId.success) throw new ApiError("VALIDATION_FAILED", "Bad product id");

  return authedRoute(
    { name: "admin.product.update", roles: SUPER_ONLY, limit: RULES.write },
    async (ctx) => {
      const body = await parseBody(ctx.request, bodySchema);

      const [before] = await ctx.tx
        .select()
        .from(products)
        .where(eq(products.id, productId.data))
        .limit(1);
      if (!before) throw new ApiError("NOT_FOUND", "Unknown product");

      const [after] = await ctx.tx
        .update(products)
        .set(body)
        .where(eq(products.id, productId.data))
        .returning();

      await record(ctx.tx, {
        request: ctx.request,
        actor: ctx.actor,
        action: "product.settings_changed",
        entityType: "product",
        entityId: productId.data,
        before: adminProductShape(before),
        after: adminProductShape(after),
      });

      return ok(ctx, { product: adminProductShape(after) });
    },
  )(request);
});

export const OPTIONS = preflight;
