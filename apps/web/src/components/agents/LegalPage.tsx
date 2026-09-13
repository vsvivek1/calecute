/**
 * Shell for the agent programme's legal pages.
 *
 * These are the pages Google's OAuth consent screen links to, and the pages an
 * applicant ticks a box against at signup, so they are part of the product
 * rather than boilerplate. Same dark treatment as the rest of the programme,
 * no WebGL — nobody reads terms over a moving background.
 */
import type { ReactNode } from "react";
import { En, Ml } from "./Bilingual";
import { company, whatsappContactUrl, formattedContactNumber } from "@/lib/agents/content";

export function LegalPage({
  titleMl,
  titleEn,
  version,
  updated,
  children,
}: {
  titleMl: string;
  titleEn: string;
  version?: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="app-shell">
      <header className="masthead">
        <span className="mark" aria-hidden="true" />
        <span className="who">
          <strong lang="en">Calecute Technologies (OPC) Pvt Ltd</strong>
          <span lang="ml">{company.city.ml}</span>
        </span>
      </header>

      <main className="wrap legal" style={{ paddingTop: "2.5rem" }}>
        <h1>
          <Ml>{titleMl}</Ml>
          <En>{titleEn}</En>
        </h1>

        <p className="chips-note" lang="en">
          {version ? `Version ${version} · ` : ""}Last updated {updated}
        </p>

        {children}

        <footer className="page-footer">
          <p lang="en">{company.legalName.en}</p>
          {company.cin && <p lang="en">CIN {company.cin}</p>}
          <p>
            <a href={whatsappContactUrl()} target="_blank" rel="noopener noreferrer">
              WhatsApp {formattedContactNumber()}
            </a>
            {" · "}
            <a href={`mailto:${company.email}`}>{company.email}</a>
          </p>
          <nav className="footer-links" aria-label="Legal">
            <a href="/agents">
              <Ml>പ്രധാന പേജ്</Ml>
            </a>
            <a href="/agents/terms">
              <Ml>നിബന്ധനകൾ</Ml>
            </a>
            <a href="/agents/privacy">
              <Ml>സ്വകാര്യതാ നയം</Ml>
            </a>
          </nav>
        </footer>
      </main>
    </div>
  );
}

/** A numbered clause: Malayalam statement, English beneath. */
export function Clause({
  n,
  headingMl,
  headingEn,
  children,
}: {
  n: number;
  headingMl: string;
  headingEn: string;
  children: ReactNode;
}) {
  return (
    <section className="clause">
      <h2>
        <span className="clause-n" lang="en">
          {n}
        </span>
        <span>
          <Ml>{headingMl}</Ml>
          <En>{headingEn}</En>
        </span>
      </h2>
      {children}
    </section>
  );
}
