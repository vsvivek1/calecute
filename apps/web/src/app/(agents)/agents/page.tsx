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
 *  - The MCA verification invitation — the highest-value element here, because
 *    no scam invites you to check the register.
 *  - The "what we never ask you for" list, since every item on it is something
 *    a chit-fund recruiter would ask for.
 *  - Live slot availability read from the database. Never fabricated, no
 *    countdown, no "only 2 left!".
 *
 * All content is server-rendered. The scene and the scroll reveal are the only
 * client components, both decorative: if either fails, every word is still on
 * the page. The scene is loaded lazily after first paint (see SceneMount) so
 * its 130KB does not sit in front of the text on a weak connection.
 */
import type { Metadata } from "next";
import {
  MCA_VERIFY_URL,
  company,
  formattedContactNumber,
  isPlaceholder,
  page as copy,
  whatsappContactUrl,
} from "@/lib/agents/content";
import { Placeholder } from "@/components/agents/Bilingual";
import { AvailabilityChecker } from "@/components/agents/AvailabilityChecker";
import { SignInButton } from "@/components/agents/SignInButton";
import { OrganizationSchema } from "@/components/agents/OrganizationSchema";
import { SceneMount } from "@/components/agents/SceneMount";
import { ScrollReveal } from "@/components/agents/ScrollReveal";
import {
  getAvailability,
  getDistricts,
  searchLocalBodies,
} from "@/lib/api/client";
import type { AvailabilityData } from "@/components/agents/AvailabilityChecker";

export const dynamic = "force-dynamic";

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

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function toId(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

/**
 * Fetch only what the current step of the availability checker needs.
 *
 * The common case is a first-time visitor who has chosen nothing, and that case
 * costs one request.
 */
async function loadAvailability(
  district: number | undefined,
  panchayat: number | undefined,
  query: string | undefined,
): Promise<AvailabilityData> {
  try {
    const districts = (await getDistricts()).data ?? [];
    if (!district) {
      return { districts, bodies: [], availability: null, unavailable: false };
    }

    const bodies =
      (await searchLocalBodies({ districtId: district, q: query, limit: 200 }))
        .data ?? [];

    if (!panchayat) {
      return { districts, bodies, availability: null, unavailable: false };
    }

    return {
      districts,
      bodies,
      availability: await getAvailability(panchayat),
      unavailable: false,
    };
  } catch {
    // Degrades to a plain message. The terms, the CIN and the verification
    // link — the parts that do the persuading — are unaffected.
    return { districts: [], bodies: [], availability: null, unavailable: true };
  }
}

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const district = first(params.district);
  const panchayat = first(params.panchayat);
  const query = first(params.q);
  const authState = first(params.auth);
  const signedOut = first(params.signedout);

  const availability = await loadAvailability(
    toId(district),
    toId(panchayat),
    query,
  );

  const authMessage =
    authState === "cancelled"
      ? copy.signIn.cancelled
      : authState === "suspended"
        ? copy.signIn.suspended
        : authState === "failed"
          ? copy.signIn.failed
          : signedOut
            ? copy.signIn.signedOut
            : null;

  return (
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

            {authMessage && (
              <p
                className={`notice ${authState === "suspended" ? "stop" : "warn"}`}
                role="status"
              >{authMessage}
              </p>
            )}

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

          {/* ------------------------------------------ live availability */}
          <section className="reveal" id="availability" aria-labelledby="availability-h">
            <h2 id="availability-h">{copy.availability.heading}
            </h2>
            <p>{copy.availability.prompt}</p>
            <div className="panel">
              <AvailabilityChecker
                districtId={district}
                localBodyId={panchayat}
                query={query}
                data={availability}
              />
            </div>
          </section>

          {/* Repeated where a convinced reader acts. */}
          <section className="reveal">
            <SignInButton repeated />
          </section>

          {/* --------------------------------- WhatsApp channel and contact */}
          <section className="reveal" aria-labelledby="whatsapp">
            <h2 id="whatsapp">{copy.whatsapp.heading}
            </h2>
            <div className="link-row">
              <a
                className="verify-link"
                href={company.whatsappChannel}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>Join the channel
                </span>
              </a>
              <a
                className="verify-link"
                href={whatsappContactUrl()}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>
                    {copy.contact.label} · {formattedContactNumber()}
                  
                </span>
              </a>
            </div>
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
            {company.cin && (
              <p>
                CIN {company.cin} ·{" "}
                <a href={MCA_VERIFY_URL} target="_blank" rel="noopener noreferrer">
                  verify on MCA
                </a>
              </p>
            )}
            <p>
              <a href={whatsappContactUrl()} target="_blank" rel="noopener noreferrer">
                WhatsApp {formattedContactNumber()}
              </a>
            </p>
            <nav className="footer-links" aria-label="Legal">
              <a href="/agents/terms"></a>
              <a href="/agents/privacy"></a>
              <a href="/contact"></a>
            </nav>
          </footer>
        </main>
      </div>
    </>
  );
}
