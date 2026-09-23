/**
 * Shell for GoldLelam's legal/procedural pages — same idea as
 * components/agents/LegalPage.tsx, but GoldLelam-branded (pink masthead,
 * GoldLelam footer nav) rather than reused directly, since the audience,
 * masthead and footer links differ.
 */
import type { ReactNode } from "react";
import { Masthead } from "./Masthead";
import { Footer } from "./Footer";

export function LegalPage({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="legal-page">
      <Masthead />

      <main className="wrap">
        <h1>{title}</h1>
        <p className="chips-note">Last updated {updated}</p>

        <div className="legal-intro">{intro}</div>

        {children}
      </main>

      <Footer />
    </div>
  );
}

/** A numbered section, matching the agents LegalPage's Clause shape. */
export function Clause({
  n,
  heading,
  children,
}: {
  n: number;
  heading: string;
  children: ReactNode;
}) {
  return (
    <section className="clause">
      <h2>
        <span className="clause-n">{n}</span>
        <span>{heading}</span>
      </h2>
      {children}
    </section>
  );
}
