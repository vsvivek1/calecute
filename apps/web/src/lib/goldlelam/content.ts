/**
 * Copy and disclosure data for GoldLelam — the bank gold-auction app.
 *
 * GoldLelam is published by the same entity as the commission agent
 * programme (Calecute Technologies (OPC) Private Limited), so it reuses
 * `company` from `lib/agents/content.ts` rather than the Wyoming LLC in
 * `lib/company.ts` — see that file's header comment for why the two are
 * never interchangeable.
 *
 * Placeholders use the site's existing `<<<LIKE THIS>>>` convention
 * (`isPlaceholder`, `PLACEHOLDER_PREFIX` from lib/agents/content.ts), which
 * renders as a visible red-dashed token via the `Placeholder` component in
 * components/agents/Bilingual.tsx — not the addendum's literal
 * `{{PLACEHOLDER}}` syntax, to stay consistent with the rest of the site.
 *
 * All legal-content pages (privacy, terms, refund, grievance) must render
 * the DRAFT banner (components/goldlelam/DraftNotice.tsx) per the brief:
 * "Mark all legal text DRAFT — to be reviewed by legal."
 */
import { company } from "@/lib/agents/content";
import { PROCESSORS } from "@/lib/apps";

export { company };

export const GOLDLELAM = {
  name: "GoldLelam",
  tagline: "Bank gold auctions, beautifully simple.",
  androidPackage: "com.calecutech.goldlelam",
  iosBundleId: "com.calecutech.goldlelam",
  webDomain: "gold.calecutech.com",
  /** Date this page's disclosures were last checked against the app. */
  policyUpdated: "September 23, 2026",
} as const;

/** GoldLelam-specific contact surfaces, separate from the agent programme's. */
export const CONTACT = {
  email: company.email,
  whatsapp: "<<<GOLDLELAM WHATSAPP NUMBER>>>",
  grievanceOfficer: {
    name: "<<<GRIEVANCE OFFICER NAME>>>",
    email: "<<<GRIEVANCE OFFICER EMAIL>>>",
    phone: "<<<GRIEVANCE OFFICER PHONE>>>",
  },
} as const;

export const FEATURES = [
  {
    heading: "Browse live gold auctions",
    body: "See every gold-loan auction a partner bank has listed, with lot photographs, gross and net weight, purity, and the reserve price, sorted by branch and auction date.",
  },
  {
    heading: "Bid from your phone",
    body: "Register interest, pay the earnest money deposit, and place bids in real time as an auction runs, with your current position shown on screen.",
  },
  {
    heading: "Scan the QR, skip the queue",
    body: "Every printed and newspaper notice carries a QR code straight to that lot or that branch's auction list — no searching, no typing a URL.",
  },
  {
    heading: "Watchlist and alerts",
    body: "Save a lot or a branch and get a notification before bidding opens, before it closes, and if you are outbid.",
  },
] as const;

export const HOW_IT_WORKS = [
  {
    step: 1,
    heading: "A bank lists an auction",
    body: "A partner bank publishes its gold-loan auction — the lots, the reserve price for each, and the date and time bidding opens.",
  },
  {
    step: 2,
    heading: "You register and pay the EMD",
    body: "Sign in, complete KYC, and pay the earnest money deposit the bank has set for that auction. The deposit is held and accounted for by the bank, not by GoldLelam.",
  },
  {
    step: 3,
    heading: "You bid",
    body: "During the auction window, place bids against the reserve price. The highest valid bid when the auction closes wins the lot, subject to the bank's own auction rules.",
  },
  {
    step: 4,
    heading: "The bank settles it",
    body: "The winning bidder completes payment and collection directly with the bank. An unsuccessful bidder's EMD is refunded by the bank per its own refund timeline — see the refund policy.",
  },
] as const;

export const BANK_ONBOARDING = {
  heading: "Running gold auctions? Bring them to GoldLelam.",
  body: "GoldLelam gives your branch a modern, mobile-first way to list gold-loan auctions and reach bidders beyond a newspaper notice. We handle the software; your bank keeps full control of reserve prices, eligibility, EMD accounting, and settlement.",
  ctaLabel: "Talk to us about onboarding",
  ctaHref: `mailto:${company.email}?subject=${encodeURIComponent("GoldLelam — bank onboarding")}`,
} as const;

export const FAQS = [
  {
    q: "Who actually runs the auction — GoldLelam or the bank?",
    a: "The bank does. GoldLelam is the technology platform a bank uses to list and run its own gold-loan auctions. We are not a party to the sale, and we do not set reserve prices, decide eligibility, or take custody of gold.",
  },
  {
    q: "How do I pay the earnest money deposit (EMD)?",
    a: "In the app, on the auction you want to bid in, before bidding opens. The payment screen belongs to our payment provider — your UPI, card or netbanking details are entered there and never reach GoldLelam's servers.",
  },
  {
    q: "I didn't win the lot I bid on. When do I get my EMD back?",
    a: "See the refund policy — the bank you bid with sets and processes the refund, and its timeline governs.",
  },
  {
    q: "Can I bid on a lot from a bank branch I've never visited?",
    a: "Yes, if the bank has listed it on GoldLelam and you meet its eligibility conditions for that auction.",
  },
  {
    q: "I signed in with Google but can't see an auction I expect to.",
    a: "Check that you're signed in with the Google account you registered with, and that the auction is still open for bidding — closed and upcoming auctions are shown separately. If it still doesn't appear, contact support below.",
  },
  {
    q: "How do I delete my account?",
    a: "Use the in-app option, or the account deletion page linked in the footer — see /goldlelam/delete-account.",
  },
] as const;

/** Named third parties GoldLelam's privacy page discloses, from the shared registry. */
export const GOLDLELAM_PROCESSORS = [
  ...PROCESSORS.google,
  ...PROCESSORS.cloudflare,
  ...PROCESSORS.fcm,
  ...PROCESSORS.supabase,
  ...PROCESSORS.hosting,
] as const;
