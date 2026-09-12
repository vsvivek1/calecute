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
  isPlaceholder,
  page as copy,
} from "@/lib/agents/content";
import { Bi, En, Ml, Placeholder } from "@/components/agents/Bilingual";
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

const TITLE = "കേരളത്തിലുടനീളം കമ്മീഷൻ ഏജന്റുമാരെ ആവശ്യമുണ്ട്";
const DESCRIPTION =
  "കാലിക്യൂട്ട് ടെക്നോളജീസിന്റെ സോഫ്റ്റ്‌വെയർ ഉൽപ്പന്നങ്ങൾ വിൽക്കാൻ കേരളത്തിലെ ഓരോ പഞ്ചായത്തിലും കമ്മീഷൻ ഏജന്റുമാർ. രജിസ്ട്രേഷൻ ഫീസില്ല, നിക്ഷേപമില്ല. കമ്മീഷൻ 10%.";

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
  },
  twitter: { card: "summary_large_image" },
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
          <strong lang="en">Calecute Technologies (OPC) Pvt Ltd</strong>
          <span lang="ml">{company.city.ml}</span>
        </span>
      </header>

      <div className="content">
        <main className="wrap">
          {/* ------------------------------------------------------ hero */}
          <section className="hero">
            <span className="eyebrow" lang="en">
              Kerala · Commission agent programme
            </span>
            <h1>
              <Ml>{copy.title.ml}</Ml>
              <En>{copy.title.en}</En>
            </h1>
            <div className="hero-sub">
              <Bi text={copy.role.body} />
            </div>

            {authMessage && (
              <p
                className={`notice ${authState === "suspended" ? "stop" : "warn"}`}
                role="status"
              >
                <Ml>{authMessage.ml}</Ml>
                <En>{authMessage.en}</En>
              </p>
            )}

            <div style={{ marginTop: "2rem" }}>
              <SignInButton />
            </div>
          </section>

          {/* --------------------------------------- who we are, verifiably */}
          <section className="reveal" aria-labelledby="identity">
            <div className="panel">
              <h2 id="identity">
                <Ml>ഞങ്ങൾ ആരാണ്</Ml>
                <En>Who we are</En>
              </h2>
              <dl className="identity">
                <div>
                  <dt lang="en">Company</dt>
                  <dd>
                    <span lang="ml">{company.legalName.ml}</span>
                    <br />
                    <span lang="en" style={{ color: "var(--ink-muted)" }}>
                      {company.legalName.en}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt lang="en">CIN</dt>
                  <dd>
                    {isPlaceholder(company.cin) ? (
                      <Placeholder value={company.cin} />
                    ) : (
                      <span className="cin-value" lang="en">
                        {company.cin}
                      </span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt lang="en">Office</dt>
                  <dd>
                    <span lang="ml">{company.city.ml}</span>{" "}
                    <span lang="en" style={{ color: "var(--ink-faint)" }}>
                      ({company.city.en})
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          {/* ----------------------------------------- what the company does */}
          <section className="reveal" aria-labelledby="what-we-do">
            <h2 id="what-we-do">
              <Ml>ഞങ്ങൾ എന്ത് ചെയ്യുന്നു</Ml>
              <En>What we do</En>
            </h2>
            {isPlaceholder(company.whatWeDo.ml) ? (
              <p>
                <Placeholder value={company.whatWeDo.en} />
              </p>
            ) : (
              <Bi text={company.whatWeDo} />
            )}
            <Bi text={copy.role.note} />
          </section>

          {/* -------------------------------------------- commission terms */}
          <section className="reveal" aria-labelledby="commission-terms">
            <div className="panel emphasis">
              <h2 id="commission-terms">
                <Ml>{copy.commission.heading.ml}</Ml>
                <En>{copy.commission.heading.en}</En>
              </h2>
              <ul className="terms-list">
                {copy.commission.points.map((point) => (
                  <Bi key={point.en} text={point} as="li" />
                ))}
              </ul>
            </div>
          </section>

          {/* -------------------------------------------- expectations */}
          <section className="reveal" aria-labelledby="expectations">
            <h2 id="expectations">
              <Ml>{copy.expectations.heading.ml}</Ml>
              <En>{copy.expectations.heading.en}</En>
            </h2>
            {/* No figure appears here or anywhere on this page. */}
            <Bi text={copy.expectations.body} />
            <Bi text={copy.expectations.detail} />
          </section>

          {/* ----------------------------------------------- who it suits */}
          <section className="reveal" aria-labelledby="background">
            <h2 id="background">
              <Ml>{copy.background.heading.ml}</Ml>
              <En>{copy.background.heading.en}</En>
            </h2>
            <Bi text={copy.background.body} />
            <Bi text={copy.background.note} />
          </section>

          {/* ------------------------------------ what we never ask you for */}
          <section className="reveal" aria-labelledby="not-asked">
            <div className="panel">
              <h2 id="not-asked">
                <Ml>{copy.notAsked.heading.ml}</Ml>
                <En>{copy.notAsked.heading.en}</En>
              </h2>
              <ul className="plain-list">
                {copy.notAsked.points.map((point) => (
                  <Bi key={point.en} text={point} as="li" />
                ))}
              </ul>
              <p className="notice">
                <Ml>{copy.notAsked.panNote.ml}</Ml>
                <En>{copy.notAsked.panNote.en}</En>
              </p>
            </div>
          </section>

          {/* ------------------------------------------ live availability */}
          <section className="reveal" id="availability" aria-labelledby="availability-h">
            <h2 id="availability-h">
              <Ml>{copy.availability.heading.ml}</Ml>
              <En>{copy.availability.heading.en}</En>
            </h2>
            <Bi text={copy.availability.prompt} />
            <div className="panel">
              <AvailabilityChecker
                districtId={district}
                localBodyId={panchayat}
                query={query}
                data={availability}
              />
            </div>
          </section>

          {/* ------------------------------------------ verify us yourself */}
          <section className="reveal" aria-labelledby="verify">
            <h2 id="verify">
              <Ml>{copy.verify.heading.ml}</Ml>
              <En>{copy.verify.heading.en}</En>
            </h2>
            <Bi text={copy.verify.body} />
            <p>
              <a
                className="verify-link"
                href={MCA_VERIFY_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>
                  <Ml>{copy.verify.linkLabel.ml}</Ml>
                  <En>{copy.verify.linkLabel.en} ↗</En>
                </span>
              </a>
            </p>
          </section>

          {/* Repeated where a convinced reader acts. */}
          <section className="reveal">
            <SignInButton repeated />
          </section>

          {/* ------------------------------------------ WhatsApp channel */}
          <section className="reveal" aria-labelledby="whatsapp">
            <h2 id="whatsapp">
              <Ml>{copy.whatsapp.heading.ml}</Ml>
              <En>{copy.whatsapp.heading.en}</En>
            </h2>
            <Bi text={copy.whatsapp.body} />
            <p>
              {isPlaceholder(company.whatsappChannel) ? (
                <Placeholder value={company.whatsappChannel} />
              ) : (
                <a
                  className="verify-link"
                  href={company.whatsappChannel}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>
                    <Ml>ചാനലിൽ ചേരുക</Ml>
                    <En>Join the channel ↗</En>
                  </span>
                </a>
              )}
            </p>
          </section>

          {/* ------------------------------------------------- footer */}
          <footer className="page-footer">
            <p lang="en">{company.legalName.en}</p>
            <p>
              {isPlaceholder(company.registeredOffice.en) ? (
                <Placeholder value={company.registeredOffice.en} />
              ) : (
                <span lang="en">{company.registeredOffice.en}</span>
              )}
            </p>
            <p lang="en">
              CIN{" "}
              {isPlaceholder(company.cin) ? (
                <Placeholder value={company.cin} />
              ) : (
                company.cin
              )}
            </p>
            <p>
              <a href={`mailto:${company.email}`}>{company.email}</a>
              {" · "}
              {isPlaceholder(company.phone) ? (
                <Placeholder value={company.phone} />
              ) : (
                <a href={`tel:${company.phone.replace(/\s/g, "")}`}>
                  {company.phone}
                </a>
              )}
            </p>
            <nav className="footer-links" aria-label="Legal">
              <a href="/agents/terms">
                <Ml>{copy.footer.terms.ml}</Ml>
              </a>
              <a href="/privacy">
                <Ml>{copy.footer.privacy.ml}</Ml>
              </a>
              <a href="/contact">
                <Ml>{copy.footer.contact.ml}</Ml>
              </a>
            </nav>
          </footer>
        </main>
      </div>
    </>
  );
}
