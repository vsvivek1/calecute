/**
 * /agents — the public recruitment page.
 *
 * The reader arrived from a WhatsApp forward or a Facebook ad and their first
 * assumption is that this is a scam. Kerala is saturated with chit-fund and MLM
 * recruitment, and that assumption is reasonable. The job of this page is to
 * change a suspicious stranger's mind.
 *
 * The visual direction is the client's choice — a WebGL scene and a modern dark
 * treatment, chosen over the quieter notice-style page that was built first.
 * That choice supersedes two things the original brief asked for, and both are
 * recorded in the README rather than silently dropped: the 150KB page budget,
 * and the page remaining readable with JavaScript disabled.
 *
 * What did NOT change, because it is the argument the page makes rather than
 * its styling:
 *
 *  - Full disclosure, early. The commission terms, including the 2% TDS
 *    deduction, appear in their own panel rather than in a footnote. A page
 *    that tells you what it will take before it asks for anything behaves
 *    unlike a scam.
 *  - No earnings figure, ever. Not "up to", not a worked example, not a range.
 *  - The "what we never ask you for" list, since every item on it is something
 *    a chit-fund recruiter would ask for.
 * The panchayat count is not offered here. It lives at /agents/availability,
 * which still works, but nothing links to it: the client does not want readers
 * checking a panchayat before they register. The route is kept rather than
 * deleted because "as of now" is what was said.
 *
 * All content is server-rendered. The scene and the scroll reveal are the only
 * client components, both decorative: if either fails, every word is still on
 * the page. The scene is loaded lazily after first paint (see SceneMount) so
 * its 130KB does not sit in front of the text on a weak connection.
 */
import type { Metadata } from "next";
import {
  company,
  formattedContactNumber,
  isPlaceholder,
  page as copy,
  whatsappContactUrl,
} from "@/lib/agents/content";
import { Placeholder } from "@/components/agents/Bilingual";
import { AuthNotice } from "@/components/agents/AuthNotice";
import { SignInButton } from "@/components/agents/SignInButton";
import { OrganizationSchema } from "@/components/agents/OrganizationSchema";
import { SceneMount } from "@/components/agents/SceneMount";
import { ScrollReveal } from "@/components/agents/ScrollReveal";

/*
 * Static, and revalidated hourly.
 *
 * This is the page a WhatsApp forward opens, so it is the one page whose load
 * time decides whether a stranger reads any of this at all. It used to be
 * force-dynamic — a server render, an API call and sometimes a cold function
 * start on every single visit, about 700ms before the first byte — purely
 * because it read the URL for the availability checker and for the sign-in
 * error message.
 *
 * Neither belongs here. The checker moved to /agents/availability, which is
 * still dynamic and still works with JavaScript off; the sign-in message is
 * read from the URL in the browser by AuthNotice. What is left never varies by
 * reader, so it is prerendered once and served from the edge.
 */
export const revalidate = 3600;

const TITLE = "Commission agent programme";
const DESCRIPTION =
  "Calecute Technologies is appointing commission agents in every panchayat in Kerala to sell its software products. No registration fee, no deposit. 10% commission on every payment a referred customer makes.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/agents" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    locale: "ml_IN",
    type: "website",
    url: "/agents",
    // A committed file, not a generated route. next/og cannot shape Malayalam;
    // see scripts/build-og.mjs for the whole story.
    images: [
      {
        url: "/og/agents.png",
        width: 1200,
        height: 630,
        alt: "Commission agent programme — Calecute Technologies",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og/agents.png"],
  },
};

export default function AgentsPage() {  return (
    <>
      <SceneMount />
      <div className="scene-veil" aria-hidden="true" />
      <ScrollReveal />
      <OrganizationSchema />

      {/* A persistent identity strip: who this is, visible at every scroll
          position, because that is the question the reader is holding. */}
      <header className="masthead">
        <span className="mark" aria-hidden="true" />
        <span className="who">
          <strong>Calecute Technologies (OPC) Pvt Ltd</strong>
          <span>{company.city}</span>
        </span>
      </header>

      <div className="content">
        <main className="wrap">
          {/* ------------------------------------------------------ hero */}
          <section className="hero">
            <span className="eyebrow">{copy.eyebrow}</span>
            <h1>{copy.title}</h1>
            <div className="hero-sub">
              <p>{copy.role.body}</p>
              <p>{copy.role.note}</p>
            </div>

            <AuthNotice />

            <div style={{ marginTop: "2rem" }}>
              <SignInButton />
            </div>
          </section>

          {/* What the company does. The registration details live in the
              footer, stated the way a letterhead states them. */}
          <section className="reveal" aria-labelledby="what-we-do">
            <h2 id="what-we-do" className="sr-only">
              What we do
            </h2>
            {isPlaceholder(company.whatWeDo) ? (
              <p>
                <Placeholder value={company.whatWeDo} />
              </p>
            ) : (
              <p>{company.whatWeDo}</p>
            )}
          </section>

          {/* -------------------------------------------- commission terms */}
          <section className="reveal" aria-labelledby="commission-terms">
            <div className="panel emphasis">
              <h2 id="commission-terms">{copy.commission.heading}
              </h2>
              <ul className="terms-list">
                {copy.commission.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          </section>

          {/* Earnings and audience, side by side. Two short answers, not two
              sections of prose. No figure appears here or anywhere. */}
          <section className="reveal">
            <div className="pair">
              <div>
                <h2>{copy.expectations.heading}
                </h2>
                <p>{copy.expectations.body}</p>
              </div>
              <div>
                <h2>{copy.background.heading}
                </h2>
                <p>{copy.background.body}</p>
              </div>
            </div>
          </section>

          {/* Stated in passing, not badged. See the note in content.ts. */}
          <section className="reveal">
            <p>{copy.notAsked}</p>
          </section>

          {/* ------------------------------------------------- footer */}
          <footer className="page-footer">
            <p>{company.legalName}</p>
            <p>
              {isPlaceholder(company.registeredOffice) ? (
                <Placeholder value={company.registeredOffice} />
              ) : (
                <span>{company.registeredOffice}</span>
              )}
            </p>
            {company.cin && <p>CIN {company.cin}</p>}
            <p>
              <a href={whatsappContactUrl()} target="_blank" rel="noopener noreferrer">
                WhatsApp {formattedContactNumber()}
              </a>
            </p>
            <nav className="footer-links" aria-label="Legal">
              <a href="/agents/terms">{copy.footer.terms}</a>
              <a href="/agents/privacy">{copy.footer.privacy}</a>
              <a href={whatsappContactUrl()}>Contact</a>
            </nav>
          </footer>
        </main>
      </div>
    </>
  );
}
