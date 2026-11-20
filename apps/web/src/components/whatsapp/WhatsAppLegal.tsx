/**
 * Shared shell for the WhatsApp Business pages under /whatsapp. Meta's app
 * review (App settings > Basic) checks that the privacy policy, terms and
 * data deletion URLs resolve to public pages, so keep these static.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { company } from "@/lib/company";

export const WHATSAPP_UPDATED = "November 20, 2026";
export const WHATSAPP_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "https://calecutech.com";

export const whatsappLinks = [
  { href: "/whatsapp", label: "WhatsApp overview" },
  { href: "/whatsapp/privacy-policy", label: "WhatsApp Privacy Policy" },
  { href: "/whatsapp/terms", label: "WhatsApp Terms of Service" },
  { href: "/whatsapp/data-deletion", label: "WhatsApp Data Deletion" },
];

export function WhatsAppLegalPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm uppercase tracking-[0.2em] text-black/50 dark:text-white/50">
        {company.brand} on WhatsApp
      </p>
      <h1 className="mt-2 text-3xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-black/50 dark:text-white/50">
        Last updated: {WHATSAPP_UPDATED}
      </p>

      <div className="mt-8 space-y-6 text-black/80 dark:text-white/80">{children}</div>

      <nav
        aria-label="WhatsApp pages"
        className="mt-14 border-t border-black/10 pt-6 text-sm dark:border-white/10"
      >
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {whatsappLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="underline underline-offset-2">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-black/60 dark:text-white/60">
          Questions:{" "}
          <a className="underline underline-offset-2" href={`mailto:${company.email}`}>
            {company.email}
          </a>
        </p>
      </nav>
    </div>
  );
}

export function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-medium">{heading}</h2>
      <div className="mt-2 space-y-3">{children}</div>
    </section>
  );
}

export function Mail({ subject }: { subject?: string }) {
  const href = subject
    ? `mailto:${company.email}?subject=${encodeURIComponent(subject)}`
    : `mailto:${company.email}`;
  return (
    <a className="underline underline-offset-2" href={href}>
      {company.email}
    </a>
  );
}
