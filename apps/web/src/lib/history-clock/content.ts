/**
 * Shared facts for the History Clock pages.
 *
 * Company identity comes from src/lib/company.ts, which is the international
 * entity. Nothing here invents an address, phone number or registration.
 */
import { company } from "@/lib/company";

export const SITE_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "https://calecutech.com";

/** Shown on every History Clock policy page. Update it with any edit to their text. */
export const POLICY_UPDATED = "11 October 2026";

export const historyClock = {
  name: "History Clock",
  tagline: "Spin the clock. Watch empires rise and fall.",
  appPath: "/history-clock/app",
  quizPath: "/history-clock/quiz",
  supportPath: "/history-clock/support",
} as const;

export const legalEntity = `${company.legalName}, ${company.jurisdiction}`;

export const contactEmail = company.email;

export const policyLinks = [
  { href: "/history-clock/privacy", label: "Privacy" },
  { href: "/history-clock/terms", label: "Terms" },
  { href: "/history-clock/delete-account", label: "Delete account" },
  { href: "/contact", label: "Contact" },
] as const;
