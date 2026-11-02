/**
 * Authenticating a product system by API key.
 *
 * The lookup runs on the raw connection, outside any RLS transaction, for the
 * same reason the rate limiter does: no role exists yet. Only the hash is
 * compared, so the query carries nothing that would be useful in a log.
 */
import type { NextRequest } from "next/server";
import { sql as connection } from "@/db/client";
import type { Actor } from "@/db/rls";
import { ApiError } from "../errors";
import { hashApiKey, type ApiKeyKind } from "../apikeys";

/** The product columns an endpoint may need, read once at authentication. */
export interface ServiceProduct {
  id: number;
  slug: string;
  nameEn: string;
  nameMl: string;
  active: boolean;
  feePaise: number | null;
  sellerRateBps: number;
  userRateBps: number;
  webUrl: string | null;
  playUrl: string | null;
  androidPackage: string | null;
}

export interface ServiceActor extends Actor {
  userId: 0;
  role: "SERVICE";
  productId: number;
  product: ServiceProduct;
  keyId: number;
  keyKind: ApiKeyKind;
}

export const API_KEY_HEADER = "x-api-key";

export function apiKeyOf(request: NextRequest): string | null {
  const value = request.headers.get(API_KEY_HEADER)?.trim();
  return value ? value : null;
}

/**
 * Resolve a presented key, or throw 401. A revoked key and an unknown key are
 * indistinguishable to the caller on purpose.
 */
export async function authenticateApiKey(plaintext: string): Promise<ServiceActor> {
  const sql = connection();
  const rows = await sql<
    {
      key_id: number;
      kind: ApiKeyKind;
      id: number;
      slug: string;
      name_en: string;
      name_ml: string;
      active: boolean;
      fee_paise: number | null;
      seller_rate_bps: number;
      user_rate_bps: number;
      web_url: string | null;
      play_url: string | null;
      android_package: string | null;
    }[]
  >`
    SELECT k.id AS key_id, k.kind,
           p.id, p.slug, p.name_en, p.name_ml, p.active, p.fee_paise,
           p.seller_rate_bps, p.user_rate_bps, p.web_url, p.play_url, p.android_package
      FROM product_api_keys k
      JOIN products p ON p.id = k.product_id
     WHERE k.key_hash = ${hashApiKey(plaintext)}
       AND k.revoked_at IS NULL
     LIMIT 1
  `;
  const row = rows[0];
  if (!row) {
    throw new ApiError("UNAUTHENTICATED", "Unknown or revoked API key", {
      headers: { "WWW-Authenticate": 'ApiKey realm="calecute"' },
    });
  }
  if (!row.active) {
    throw new ApiError("FORBIDDEN", "This product is not active");
  }
  return {
    userId: 0,
    role: "SERVICE",
    productId: row.id,
    keyId: row.key_id,
    keyKind: row.kind,
    product: {
      id: row.id,
      slug: row.slug,
      nameEn: row.name_en,
      nameMl: row.name_ml,
      active: row.active,
      feePaise: row.fee_paise,
      sellerRateBps: Number(row.seller_rate_bps),
      userRateBps: Number(row.user_rate_bps),
      webUrl: row.web_url,
      playUrl: row.play_url,
      androidPackage: row.android_package,
    },
  };
}
