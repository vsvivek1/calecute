/**
 * DELETE /api/v1/admin/products/{id}/api-keys/{keyId}
 *
 * Revokes a key. The row stays, stamped, so the audit trail and any attempt
 * log can still say which key did what; the next request with it gets 401.
 */
import { and, eq, isNull } from "drizzle-orm";
import { handler, preflight } from "@/lib/http";
import { authedRoute, ok } from "@/lib/route";
import { SUPER_ONLY } from "@/lib/auth/context";
import { geoIdSchema } from "@/lib/validation";
import { RULES } from "@/lib/ratelimit";
import { ApiError } from "@/lib/errors";
import { productApiKeys } from "@/db/schema";
import { record } from "@/lib/audit";

export const dynamic = "force-dynamic";

export const DELETE = handler(async (request, context) => {
  const { id, keyId } = await (
    context as unknown as { params: Promise<{ id: string; keyId: string }> }
  ).params;
  const productId = geoIdSchema.safeParse(id);
  const key = geoIdSchema.safeParse(keyId);
  if (!productId.success || !key.success) {
    throw new ApiError("VALIDATION_FAILED", "Bad product or key id");
  }

  return authedRoute(
    { name: "admin.product.keys.revoke", roles: SUPER_ONLY, limit: RULES.write },
    async (ctx) => {
      const [revoked] = await ctx.tx
        .update(productApiKeys)
        .set({ revokedAt: new Date() })
        .where(
          and(
            eq(productApiKeys.id, key.data),
            eq(productApiKeys.productId, productId.data),
            isNull(productApiKeys.revokedAt),
          ),
        )
        .returning({
          id: productApiKeys.id,
          kind: productApiKeys.kind,
          label: productApiKeys.label,
          revokedAt: productApiKeys.revokedAt,
        });
      if (!revoked) throw new ApiError("NOT_FOUND", "No active key with that id");

      await record(ctx.tx, {
        request: ctx.request,
        actor: ctx.actor,
        action: "product.api_key_revoked",
        entityType: "product_api_key",
        entityId: revoked.id,
        after: { productId: productId.data, kind: revoked.kind, label: revoked.label },
      });

      return ok(ctx, { revoked: true, key: revoked });
    },
  )(request);
});

export const OPTIONS = preflight;
