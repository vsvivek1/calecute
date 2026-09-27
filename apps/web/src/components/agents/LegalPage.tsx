/**
 * Shell for the agent programme's legal pages.
 *
 * These are what Google's OAuth consent screen links to and what an applicant
 * ticks a box against at signup, so they are part of the product rather than
 * boilerplate. No WebGL behind them — nobody reads terms over a moving
 * background.
 */
import type { ReactNode } from "react";
import {
  company,
  formattedContactNumber,
  whatsappContactUrl,
} from "@/lib/agents/content";

export function LegalPage({
  title,
  version,
  updated,
  intro,
  children,
}: {
  title: string;
  version?: string;
  updated: string;
  intro: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="app-shell">
      <header className="masthead">
        <span className="mark" aria-hidden="true" />
        <span className="who">
          <strong>{company.legalName}</strong>
          <span>{company.city}</span>
        </span>
      </header>

      <main className="wrap legal">
        <h1>{title}</h1>
        <p className="chips-note">
          {version ? `Version ${version} · ` : ""}Last updated {updated}
        </p>

        <div className="legal-intro">{intro}</div>

        {children}

        <footer className="page-footer">
          <p>{company.legalName}</p>
          {company.cin && <p>CIN {company.cin}</p>}
          <p>
            <a href={whatsappContactUrl()} target="_blank" rel="noopener noreferrer">
              WhatsApp {formattedContactNumber()}
            </a>
            {" · "}
            <a href={`mailto:${company.email}`}>{company.email}</a>
          </p>
          <nav className="footer-links" aria-label="Legal">
            <a href="/agents">Home</a>
            <a href="/agents/terms">Terms</a>
            <a href="/agents/privacy">Privacy policy</a>
          </nav>
        </footer>
      </main>
    </div>
  );
}

/** A numbered section. */
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
