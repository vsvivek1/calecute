/**
 * /agents/terms — the terms an applicant accepts at signup.
 *
 * Conventional structure first — parties, what the arrangement is, obligations,
 * payment, termination, liability, governing law — with the programme's
 * specifics inside those sections rather than in place of them.
 *
 * The version constant MUST match a row in `terms_versions`: the signup
 * endpoint records which version was accepted and rejects an unknown one. When
 * these change, add a new row and bump the constant. Never edit in place, or
 * the record of what someone agreed to stops being true.
 */
import type { Metadata } from "next";
import { Clause, LegalPage } from "@/components/agents/LegalPage";
import { Placeholder } from "@/components/agents/Bilingual";
import { company, isPlaceholder } from "@/lib/agents/content";

export const metadata: Metadata = {
  title: "Terms of service",
  description:
    "Terms governing the Calecute Technologies commission agent programme in Kerala.",
  alternates: { canonical: "/agents/terms" },
};

/** Must match a row in terms_versions. See the note above. */
const VERSION = "2026-09-01";

export default function AgentTermsPage() {
  return (
    <LegalPage
      title="Terms of service"
      version={VERSION}
      updated="1 September 2026"
      intro={
        <>
          <p>
            These terms govern the commission agent programme operated by{" "}
            {company.legalName}
            {company.cin ? `, CIN ${company.cin}` : ""} (&ldquo;the
            Company&rdquo;, &ldquo;we&rdquo;), and form a binding agreement
            between the Company and you when you register as an agent.
          </p>
          <p>
            Please read them before you apply. You are asked to confirm that you
            accept them as part of registration, and the version you accepted is
            recorded against your account with the date and time.
          </p>
        </>
      }
    >
      <Clause n={1} heading="The parties and the arrangement">
        <p>
          {company.legalName} is a One Person Company incorporated in India with
          its registered office at{" "}
          {isPlaceholder(company.registeredOffice) ? (
            <Placeholder value={company.registeredOffice} />
          ) : (
            company.registeredOffice
          )}
          .
        </p>
        <p>
          You act as an independent commission agent introducing customers to
          the Company&rsquo;s software products. You are not an employee, worker,
          partner or franchisee. There is no salary, provident fund, gratuity,
          leave entitlement or other employment benefit, and you are responsible
          for your own taxes and for any registration your own circumstances
          require.
        </p>
        <p>
          Nothing in these terms creates an exclusive relationship. You may
          represent other businesses, provided doing so does not conflict with
          section 5.
        </p>
      </Clause>

      <Clause n={2} heading="Eligibility and registration">
        <p>
          You must be at least 18 years old and resident in Kerala. Registration
          is through Google Sign-In and requires six pieces of information: your
          name, mobile number, district, panchayat or municipality, ward and
          occupation.
        </p>
        <p>
          There is no registration fee, no deposit, and nothing you are required
          to buy, at registration or at any later point.
        </p>
        <p>
          Each panchayat, municipality or corporation ordinarily holds ten
          agents. The Company may vary that number, may close an area to new
          applications, and may accept or decline any application at its
          discretion. Being accepted is not automatic and applying does not
          reserve a place.
        </p>
      </Clause>

      <Clause n={3} heading="One account per person">
        {/* Required to appear here: the signup form warns about it, and an
            agent who loses accrued commission must have been told in the terms
            they accepted. */}
        <p>
          You may hold one account only. Accounts are unique by mobile number
          and, once payout details are provided, by PAN.
        </p>
        <p>
          Where two or more accounts are found to share a PAN, all but the
          earliest are cancelled and{" "}
          <strong>
            any commission accrued on the cancelled accounts is forfeited
          </strong>
          . This is how the ten-places-per-panchayat limit is kept meaningful.
        </p>
      </Clause>

      <Clause n={4} heading="Commission">
        <p>Where a customer is attributed to you and pays the Company:</p>
        <ul>
          <li>You earn 10% of every payment that customer makes.</li>
          <li>
            Commission is calculated on the amount net of GST and payment
            gateway charges, not on the gross amount.
          </li>
          <li>
            It continues for as long as that customer keeps paying. There is no
            fixed term.
          </li>
          <li>Commission is paid monthly.</li>
          <li>
            TDS of 2% is deducted under Section 194H of the Income Tax Act,
            1961. Form 16A is issued for each financial year.
          </li>
        </ul>
        <p>
          <strong>
            The Company makes no representation, projection or guarantee about
            how much you will earn.
          </strong>{" "}
          Earnings depend entirely on how many customers you introduce and how
          long they continue to pay. Anyone suggesting otherwise, including
          another agent, is not speaking for the Company.
        </p>
      </Clause>

      <Clause n={5} heading="Your obligations">
        <ul>
          <li>
            Make no claim about the Company, its products or its prices that the
            Company has not made. Never guarantee anyone an income.
          </li>
          <li>Do not collect money from customers on the Company&rsquo;s behalf.</li>
          <li>
            Do not sign agreements, give warranties or incur liabilities in the
            Company&rsquo;s name.
          </li>
          <li>
            Do not present yourself as an employee, office or branch of the
            Company.
          </li>
          <li>
            Keep customer information confidential and use it only to introduce
            that customer to the Company.
          </li>
          <li>Comply with applicable law, including consumer and data law.</li>
        </ul>
      </Clause>

      <Clause n={6} heading="Which agent a customer belongs to">
        <p>
          A customer is attributed to the first agent code used when they
          register. That attribution is permanent and cannot be reassigned,
          including by us.
        </p>
        <p>
          With ten agents in a panchayat, two agents approaching the same
          customer is expected. Every attribution attempt, accepted or rejected,
          is logged with the code presented and the time, so a dispute is
          settled from the record rather than from recollection.
        </p>
      </Clause>

      <Clause n={7} heading="Getting paid">
        <p>
          Before any payout is released you must provide a PAN and have it
          verified, confirm your mobile number, and provide bank account or UPI
          details. Until then commission continues to accrue against your
          account and is not lost.
        </p>
        <p>
          Payouts are made in batches after the end of each month. The Company
          may withhold a payment where it reasonably suspects fraud or a breach
          of these terms, and will tell you why.
        </p>
      </Clause>

      <Clause n={8} heading="Suspension and termination">
        <p>
          You may stop at any time by telling us. The Company may suspend or end
          your appointment if you breach these terms, if your account is a
          duplicate, or if the programme is discontinued.
        </p>
        <p>
          Commission properly earned before termination remains payable, except
          where an account is cancelled under section 3. Attribution of
          customers you introduced is not affected by your leaving, but no
          further commission accrues after termination.
        </p>
      </Clause>

      <Clause n={9} heading="Intellectual property">
        <p>
          The Company&rsquo;s name, logo, product names and sales material remain
          its property. You may use the material provided to you to promote the
          products while you are an agent, unchanged, and must stop using it
          when you cease to be one.
        </p>
      </Clause>

      <Clause n={10} heading="Liability">
        <p>
          Nothing in these terms limits liability for fraud, or for anything
          that cannot lawfully be limited.
        </p>
        <p>
          Subject to that, the Company is not liable for indirect or
          consequential loss, or for loss of anticipated commission, and its
          total liability to you is limited to the commission payable to you in
          the twelve months before the claim arose.
        </p>
        <p>
          You are responsible for statements you make about the Company or its
          products that the Company has not authorised.
        </p>
      </Clause>

      <Clause n={11} heading="Personal data">
        <p>
          How we handle your personal data is set out in our{" "}
          <a href="/agents/privacy">privacy policy</a>, which forms part of
          these terms.
        </p>
      </Clause>

      <Clause n={12} heading="Changes to these terms">
        <p>
          Revised terms are published under a new version number. Where a change
          materially affects your commission or obligations we will tell you
          before it takes effect, and continuing as an agent after that date
          means you accept the new version.
        </p>
      </Clause>

      <Clause n={13} heading="Governing law and disputes">
        <p>
          These terms are governed by the laws of India. The courts at
          Kozhikode, Kerala have exclusive jurisdiction over any dispute arising
          from them.
        </p>
        <p>
          Please raise any complaint with us first, using the contact details
          below. We aim to respond within seven working days.
        </p>
      </Clause>
    </LegalPage>
  );
}
