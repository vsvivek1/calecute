/**
 * Shared facts for the Chronomap pages.
 *
 * Company identity comes from src/lib/company.ts, which is the international
 * entity. Nothing here invents an address, phone number or registration.
 */
import { company } from "@/lib/company";

export const SITE_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "https://calecutech.com";

/** Shown on every Chronomap policy page. Update it with any edit to their text. */
export const POLICY_UPDATED = "11 October 2026";

export const chronomap = {
  name: "Chronomap",
  // A working name. Confirm the name and any trademark position before launch.
  tagline: "Move through time. Explore the world.",
  appPath: "/chronomap/app",
} as const;

export const legalEntity = `${company.legalName}, ${company.jurisdiction}`;

export const contactEmail = company.email;

export const policyLinks = [
  { href: "/chronomap/privacy", label: "Privacy" },
  { href: "/chronomap/terms", label: "Terms" },
  { href: "/chronomap/delete-account", label: "Delete account" },
  { href: "/contact", label: "Contact" },
] as const;
