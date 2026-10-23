/**
 * The pure parts of the referral scheme: code generation, rate selection and
 * link construction. No database and no path aliases, so tests/ can import
 * this file under plain Node and the rules can be checked without a server.
 *
 * The business rules, fixed by the owner:
 *
 *   USER tier    every app user. On a PAID product, 1% of each payment a
 *                friend makes (the product's userRateBps, default 100). On a
 *                FREE product, one diamond per friend who joins — never money.
 *   SELLER tier  a vetted commission agent. 10% to 30% of the fee, set per
 *                product (sellerRateBps, 1000..3000, default 1000).
 */
import { randomBytes } from "node:crypto";

export type AgentTier = "USER" | "SELLER";

export const USER_CODE_PREFIX = "RF-";
export const USER_CODE_LENGTH = 6;

/** Crockford base32, upper case: no I, L, O or U. Typed off a screen or a poster. */
export const USER_CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export const DEFAULT_USER_RATE_BPS = 100;
export const DEFAULT_SELLER_RATE_BPS = 1000;
export const MIN_SELLER_RATE_BPS = 1000;
export const MAX_SELLER_RATE_BPS = 3000;

/**
 * A USER-tier invite code: `RF-` plus six unambiguous characters. 32^6 is
 * about a billion, so collisions are rare but possible; the caller retries on
 * the unique constraint. `random` is injectable for tests.
 */
export function generateUserCode(random: (n: number) => Uint8Array = randomBytes): string {
  const bytes = random(USER_CODE_LENGTH);
  let out = USER_CODE_PREFIX;
  for (let i = 0; i < USER_CODE_LENGTH; i += 1) {
    out += USER_CODE_ALPHABET[bytes[i] % USER_CODE_ALPHABET.length];
  }
  return out;
}

export function isUserCode(code: string): boolean {
  return new RegExp(`^${USER_CODE_PREFIX}[${USER_CODE_ALPHABET}]{${USER_CODE_LENGTH}}$`).test(code);
}

export interface ProductRates {
  /** Null means free. */
  feePaise: number | null;
  sellerRateBps: number | null;
  userRateBps: number | null;
}

export function isFreeProduct(product: ProductRates | null | undefined): boolean {
  return product?.feePaise == null;
}

/**
 * The commission rate for a payment, in basis points.
 *
 * Tier decides which column applies; a missing product falls back to the
 * programme defaults so a payment recorded without a product still accrues at
 * a defensible rate rather than failing. Seller rates are clamped to the
 * published band so a bad row can never pay outside 10%..30%.
 */
export function rateBpsFor(tier: AgentTier, product: ProductRates | null | undefined): number {
  if (tier === "USER") {
    const rate = product?.userRateBps;
    return rate == null ? DEFAULT_USER_RATE_BPS : Math.max(0, Math.floor(rate));
  }
  const rate = product?.sellerRateBps ?? DEFAULT_SELLER_RATE_BPS;
  return Math.min(MAX_SELLER_RATE_BPS, Math.max(MIN_SELLER_RATE_BPS, Math.floor(rate)));
}

/**
 * Whether a successful attribution on this product earns a diamond rather
 * than a cash commission later: only a USER-tier referrer on a FREE product.
 */
export function awardsDiamond(tier: AgentTier, product: ProductRates | null | undefined): boolean {
  return tier === "USER" && isFreeProduct(product);
}

export function webOrigin(): string {
  return process.env.PUBLIC_WEB_ORIGIN?.replace(/\/$/, "") ?? "https://calecutech.com";
}

/** `https://calecutech.com/r/RF-ABC234?app=quizkerala` — resolved by apps/web. */
export function userReferralLink(code: string, productSlug: string): string {
  return `${webOrigin()}/r/${encodeURIComponent(code)}?app=${encodeURIComponent(productSlug)}`;
}

/**
 * Play Install Referrer value for an Android visitor: the Play Store passes it
 * to the app on first launch, so the code survives the install.
 */
export function playReferrerParam(code: string): string {
  return `referrer=${encodeURIComponent(`ref=${code}`)}`;
}

/**
 * "Vivek Sankaran" -> "Vivek S.", "Anu" -> "Anu". The same masking the SQL
 * leaderboard applies, kept here so the two can be compared in a test.
 */
export function maskDisplayName(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Member";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

/**
 * The API's own public origin, for absolute URLs such as the QR image. From
 * API_PUBLIC_URL when configured (it carries the /api/v1 suffix for the
 * OpenAPI document), otherwise the origin the request arrived on.
 */
export function apiOrigin(requestUrl: string): string {
  const configured = process.env.API_PUBLIC_URL?.replace(/\/$/, "");
  if (configured) return configured.replace(/\/api\/v1$/, "");
  return new URL(requestUrl).origin;
}

/** The absolute QR image URL for a USER-tier code. */
export function userQrUrl(requestUrl: string, code: string, productSlug: string): string {
  return `${apiOrigin(requestUrl)}/api/v1/public/qr?code=${encodeURIComponent(code)}&app=${encodeURIComponent(productSlug)}`;
}

/** Pre-filled WhatsApp share for a USER-tier member. Malayalam first. */
export function userWhatsappShareLink(code: string, productSlug: string, productName: string): string {
  const link = userReferralLink(code, productSlug);
  const text = [
    `${productName} ഉപയോഗിച്ചു നോക്കൂ. എന്റെ ലിങ്ക് വഴി ചേരൂ:`,
    `Try ${productName}. Join with my link:`,
    "",
    link,
  ].join("\n");
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
