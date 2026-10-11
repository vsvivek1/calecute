/**
 * Shell for the Chronomap policy pages. Each page passes its own sections, so
 * the wording stays with the page it belongs to.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { POLICY_UPDATED, chronomap, legalEntity, contactEmail, policyLinks } from "@/lib/chronomap/content";

export function PolicyPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro: ReactNode;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-6 py-16 text-[#1d2538]">
      <p className="text-sm uppercase tracking-[0.2em] text-[#7d5e22]">
        {chronomap.name} · {legalEntity}
      </p>
      <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-[#101c33]">{title}</h1>
      <p className="mt-3 text-sm text-[#4a5264]">Last updated {POLICY_UPDATED}</p>

      <div className="mt-6 rounded-lg border border-[#c9a86a] bg-[#fbf7ec] p-4 text-sm leading-6">
        <strong className="text-[#101c33]">Legal review pending.</strong> This text describes the
        Chronomap preview as it works today. It has not yet been reviewed by a lawyer. Items marked{" "}
        <Todo>TODO</Todo> must be completed before launch.
      </div>

      <div className="mt-8 leading-7 text-[#2b3445]">{intro}</div>

      <div className="mt-10 space-y-10">{children}</div>

      <nav aria-label="Chronomap policies" className="mt-14 border-t border-[#1d2538]/10 pt-6 text-sm">
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {policyLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="text-[#7d5e22] underline underline-offset-2 hover:text-[#101c33]">
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/chronomap" className="text-[#7d5e22] underline underline-offset-2 hover:text-[#101c33]">
              Overview
            </Link>
          </li>
        </ul>
        <p className="mt-4 text-[#4a5264]">
          Questions about this page:{" "}
          <a className="underline underline-offset-2" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
        </p>
      </nav>
    </article>
  );
}

export function Section({ id, heading, children }: { id: string; heading: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="text-xl font-semibold text-[#101c33]">
        {heading}
      </h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

/** Marks text the owner must finish before launch. Visible on purpose. */
export function Todo({ children }: { children: ReactNode }) {
  return (
    <span className="rounded bg-[#f3e2a9] px-1.5 py-0.5 font-medium text-[#3d2e0c]">{children}</span>
  );
}
