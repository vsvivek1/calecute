/**
 * The product shapes the API returns, in one place so the public catalogue,
 * the admin PATCH and the earnings terms all describe a product the same way.
 */
import type { products } from "@/db/schema";
import { isFreeProduct } from "./referral";

type ProductRow = typeof products.$inferSelect;

/** What anyone may know about a product. No ids beyond the slug. */
export function publicProductShape(row: ProductRow) {
  return {
    id: row.id,
    slug: row.slug,
    nameEn: row.nameEn,
    nameMl: row.nameMl,
    summaryEn: row.summaryEn,
    isFree: isFreeProduct(row),
    feePaise: row.feePaise,
    sellerRateBps: row.sellerRateBps,
    userRateBps: row.userRateBps,
    webUrl: row.webUrl,
    playUrl: row.playUrl,
    androidPackage: row.androidPackage,
  };
}

/** The admin view: the public shape plus `active`. */
export function adminProductShape(row: ProductRow) {
  return { ...publicProductShape(row), active: row.active, createdAt: row.createdAt };
}
