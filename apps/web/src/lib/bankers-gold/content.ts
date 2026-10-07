/**
 * Bankers Gold is the store name of the GoldLelam app (same Android package,
 * same legal pages under /goldlelam/*). This page is the public product page
 * the store listings and the calecutech.com home page link to; the legal and
 * support copy stays in lib/goldlelam/content.ts so there is one source.
 */
import { GOLDLELAM } from "@/lib/goldlelam/content";

export { FEATURES, BANK_ONBOARDING, company, CONTACT } from "@/lib/goldlelam/content";

const ORIGIN = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "https://calecutech.com";

export const BANKERS_GOLD = {
  name: "Bankers Gold",
  tagline: "Bank gold auctions, beautifully simple.",
  path: "/bankers-gold",
  /** The link to share: this page. */
  productUrl: `${ORIGIN}/bankers-gold`,
  playStoreUrl: `https://play.google.com/store/apps/details?id=${GOLDLELAM.androidPackage}`,
  /** No iOS build yet; the App Store badge renders as "coming soon" while null. */
  appStoreUrl: null as string | null,
} as const;

export const STEPS = [
  {
    heading: "A bank lists its auction",
    body: "Lots, photographs, weight, purity and the reserve price, published by the bank itself.",
  },
  {
    heading: "You pay the EMD",
    body: "Sign in with Google, complete KYC, and pay the earnest money deposit the bank has set.",
  },
  {
    heading: "You bid live",
    body: "Bid in real time from your phone and see where you stand as the auction runs.",
  },
  {
    heading: "The bank settles",
    body: "The winner completes payment and collection with the bank. Other EMDs are refunded by the bank.",
  },
] as const;

export const LEGAL_LINKS = [
  { href: "/goldlelam/support", label: "Support" },
  { href: "/goldlelam/privacy", label: "Privacy" },
  { href: "/goldlelam/terms", label: "Terms" },
  { href: "/goldlelam/refund", label: "Refunds" },
  { href: "/goldlelam/delete-account", label: "Delete account" },
  { href: "/goldlelam/grievance", label: "Grievance officer" },
] as const;
