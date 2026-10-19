/**
 * Shared pieces of the two product-system endpoints, /attribution/claim and
 * /payments: resolving which product a call is about, namespacing the
 * customer reference, and reading the referrer behind a code without a
 * SELECT grant on seller rows.
 */
import { eq, sql } from "drizzle-orm";
import type { ScopedDb } from "@/db/rls";
import { products } from "@/db/schema";
import type { ServiceProduct } from "./auth/service";
import { ApiError } from "./errors";
import type { AgentTier } from "./referral";

/**
 * A service key already names its product. A SUPER_ADMIN caller names it in
 * the body by slug or id; naming an unknown one is an error rather than a
 * silent "no product", because the rate depends on it.
 */
export async function resolveProduct(
  tx: ScopedDb,
  keyProduct: ServiceProduct | null,
  body: { productSlug?: string | null; productId?: number | null },
): Promise<ServiceProduct | null> {
  if (keyProduct) return keyProduct;
  if (body.productSlug == null && body.productId == null) return null;

  const [row] = await tx
    .select({
      id: products.id,
      slug: products.slug,
      nameEn: products.nameEn,
      nameMl: products.nameMl,
      active: products.active,
      feePaise: products.feePaise,
      sellerRateBps: products.sellerRateBps,
      userRateBps: products.userRateBps,
      webUrl: products.webUrl,
      playUrl: products.playUrl,
      androidPackage: products.androidPackage,
    })
    .from(products)
    .where(
      body.productId != null
        ? eq(products.id, body.productId)
        : eq(products.slug, body.productSlug as string),
    )
    .limit(1);

  if (!row) {
    throw new ApiError("VALIDATION_FAILED", "Unknown product", {
      details: { productSlug: body.productSlug ?? null, productId: body.productId ?? null },
    });
  }
  return row;
}

/**
 * Customers are namespaced per product: `<slug>:<the app's uid>`. A call with
 * no product (a legacy SUPER_ADMIN call) uses the reference as given.
 */
export function customerRef(product: ServiceProduct | null, externalRef: string): string {
  return product ? `${product.slug}:${externalRef}` : externalRef;
}

export interface ReferralAgent {
  id: number;
  agentCode: string;
  status: string;
  tier: AgentTier;
  districtId: number | null;
  localBodyId: number | null;
  userId: number;
  /** The `users.external_ref` of a USER-tier referrer; null for a seller. */
  userExternalRef: string | null;
  firstSaleAt: Date | null;
}

/**
 * The referrer behind a code or an id, through app.agent_for_referral(). A
 * SECURITY DEFINER function rather than a SELECT, so a service key can
 * attribute a customer to a seller's code without being able to read the
 * seller's mobile number or anything else on the row.
 */
export async function agentForReferral(
  tx: ScopedDb,
  by: { code: string } | { id: number },
): Promise<ReferralAgent | null> {
  const code = "code" in by ? by.code : null;
  const id = "id" in by ? by.id : null;
  const rows = (await tx.execute(sql`
    SELECT id, agent_code, status, tier, district_id, local_body_id, user_id,
           user_external_ref, first_sale_at
      FROM app.agent_for_referral(${code}, ${id})
  `)) as unknown as {
    id: number;
    agent_code: string;
    status: string;
    tier: AgentTier;
    district_id: number | null;
    local_body_id: number | null;
    user_id: number;
    user_external_ref: string | null;
    first_sale_at: string | Date | null;
  }[];
  const row = rows[0];
  if (!row) return null;
  return {
    id: Number(row.id),
    agentCode: row.agent_code,
    status: row.status,
    tier: row.tier,
    districtId: row.district_id == null ? null : Number(row.district_id),
    localBodyId: row.local_body_id == null ? null : Number(row.local_body_id),
    userId: Number(row.user_id),
    userExternalRef: row.user_external_ref,
    firstSaleAt: row.first_sale_at == null ? null : new Date(row.first_sale_at),
  };
}
