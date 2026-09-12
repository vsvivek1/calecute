/**
 * /agents — the public recruitment page.
 *
 * The reader arrived from a WhatsApp forward or a Facebook ad and their first
 * assumption is that this is a scam. Kerala is saturated with chit-fund and MLM
 * recruitment, and that assumption is a reasonable one. Every decision on this
 * page is subordinate to changing a suspicious stranger's mind.
 *
 * What that means concretely, and why each is here:
 *
 *  - Full disclosure, early. The commission terms, including the 2% TDS
 *    deduction, appear above the fold-ish and in a bordered box. A page that
 *    tells you what it will take from you before it asks for anything is
 *    behaving unlike a scam.
 *  - No earnings figure, ever. Not "up to", not a worked example, not a range.
 *    It is both the biggest scam signal and a legal exposure.
 *  - The MCA verification link. Inviting the reader to check the company
 *    themselves is the highest-value element on the page; no scam does it.
 *  - The "what we never ask you for" list, stated plainly, because every item
 *    on it is something a chit-fund recruiter would ask for.
 *  - Live slot availability read from the database. Never fabricated, no
 *    countdown, no "only 2 left!".
 *
 * Rendered entirely on the server. There is no client JavaScript on this route
 * at all — the availability checker is a plain GET form, so the page works with
 * JavaScript disabled, which on a ₹8,000 phone on one bar of 4G is not a
 * hypothetical.
 */
import {
  MCA_VERIFY_URL,
  company,
  isPlaceholder,
  page as copy,
} from "@/lib/agents/content";
import { Bi, En, Ml, Placeholder } from "@/components/agents/Bilingual";
import {
  AvailabilityChecker,
  type AvailabilityData,
} from "@/components/agents/AvailabilityChecker";
import { SignInButton } from "@/components/agents/SignInButton";
import { OrganizationSchema } from "@/components/agents/OrganizationSchema";

export interface PublicPageProps {
  /** Already-resolved query values. */
  district?: string;
  panchayat?: string;
  query?: string;
  auth?: string;
  signedOut?: boolean;
  availability: AvailabilityData;
}

/**
 * Pure and synchronous: the route handler fetches, this renders. See
 * app/(agents)/agents/route.ts for why the page is a document rather than a
 * React app.
 */
export function PublicRecruitmentPage({
  district,
  panchayat,
  query,
  auth: authState,
  signedOut,
  availability,
}: PublicPageProps) {

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
    <main className="wrap">
      <OrganizationSchema />

      {/* ---------------------------------------------- 1. who we are */}
      <header className="masthead">
        <h1 className="legal-name">
          <span className="ml" lang="ml">
            {company.legalName.ml}
          </span>
          <span className="en" lang="en">
            {company.legalName.en}
          </span>
        </h1>

        {/*
          Plain spans rather than the <Bi> component here: this block is an
          inline definition list, and <Bi> renders its two runs as blocks, which
          broke each row across three lines.
        */}
        <dl className="identity">
          <div>
            <dt lang="en">CIN</dt>
            <dd>
              {isPlaceholder(company.cin) ? (
                <Placeholder value={company.cin} />
              ) : (
                <span lang="en">{company.cin}</span>
              )}
            </dd>
          </div>
          <div>
            <dt lang="ml">സ്ഥലം</dt>
            <dd>
              <span lang="ml">{company.city.ml}</span>{" "}
              <span lang="en">({company.city.en})</span>
            </dd>
          </div>
        </dl>
      </header>

      {authMessage && (
        <p
          className={`notice ${authState === "suspended" ? "stop" : "warn"}`}
          role="status"
        >
          <Ml>{authMessage.ml}</Ml>
          <En>{authMessage.en}</En>
        </p>
      )}

      {/* --------------------------------------- 2. what the company does */}
      <section aria-labelledby="what-we-do">
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
      </section>

      {/* ------------------------------------------------- 3. the role */}
      <section aria-labelledby="the-role">
        <h2 id="the-role">
          <Ml>{copy.role.heading.ml}</Ml>
          <En>{copy.role.heading.en}</En>
        </h2>
        <Bi text={copy.role.body} />
        <Bi text={copy.role.note} />
      </section>

      {/* Sign-in, above the fold on a phone and repeated at the signup point. */}
      <SignInButton />

      {/* ------------------------------------------ 4. commission terms */}
      <section aria-labelledby="commission-terms">
        <div className="terms-box">
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

      {/* ------------------------------------------- 5. what you'll earn */}
      <section aria-labelledby="expectations">
        <h2 id="expectations">
          <Ml>{copy.expectations.heading.ml}</Ml>
          <En>{copy.expectations.heading.en}</En>
        </h2>
        {/*
          No figure appears here or anywhere else on this page. Saying plainly
          that we will not quote one is more credible than any number would be,
          and it is the only defensible position legally.
        */}
        <Bi text={copy.expectations.body} />
        <Bi text={copy.expectations.detail} />
      </section>

      {/* ----------------------------------------- 6. who this suits */}
      <section aria-labelledby="background">
        <h2 id="background">
          <Ml>{copy.background.heading.ml}</Ml>
          <En>{copy.background.heading.en}</En>
        </h2>
        <Bi text={copy.background.body} />
        <Bi text={copy.background.note} />
      </section>

      {/* --------------------------------- 7. what we never ask you for */}
      <section aria-labelledby="not-asked">
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
      </section>

      {/* --------------------------------------- 8. live slot availability */}
      <section aria-labelledby="availability">
        <h2 id="availability">
          <Ml>{copy.availability.heading.ml}</Ml>
          <En>{copy.availability.heading.en}</En>
        </h2>
        <Bi text={copy.availability.prompt} />
        <AvailabilityChecker
          districtId={district}
          localBodyId={panchayat}
          query={query}
          data={availability}
        />
      </section>

      {/* ------------------------------------------ 9. verify us yourself */}
      <section aria-labelledby="verify">
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
            <Ml>{copy.verify.linkLabel.ml}</Ml>
            <En>{copy.verify.linkLabel.en} ↗</En>
          </a>
        </p>
      </section>

      {/* Repeated here, at the point where a convinced reader acts. */}
      <SignInButton repeated />

      {/* --------------------------------------- 10. WhatsApp channel */}
      <section aria-labelledby="whatsapp">
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
              <Ml>ചാനലിൽ ചേരുക</Ml>
              <En>Join the channel ↗</En>
            </a>
          )}
        </p>
      </section>

      {/* ------------------------------------------------- 11. footer */}
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
            <a href={`tel:${company.phone.replace(/\s/g, "")}`}>{company.phone}</a>
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
  );
}
