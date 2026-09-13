/**
 * /agents/privacy — the privacy policy.
 *
 * Structured the way a privacy policy is conventionally structured, in the
 * order a reader (and Google's OAuth review) expects: who we are, what we
 * collect, why, the legal basis, who we share with, how long we keep it,
 * security, your rights, cookies, children, changes, contact. The
 * programme-specific parts sit inside those standard sections rather than
 * replacing them.
 *
 * Every claim here is checkable against the code: the field list matches the
 * signup schema, the encryption claim matches lib/crypto.ts, and "no personal
 * data in analytics" is asserted by the API smoke test. If the system changes,
 * this changes — a policy describing something else is worse than none.
 */
import type { Metadata } from "next";
import { Clause, LegalPage } from "@/components/agents/LegalPage";
import { company } from "@/lib/agents/content";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "How Calecute Technologies collects, uses, shares and protects the personal data of commission agents in Kerala.",
  alternates: { canonical: "/agents/privacy" },
};

export default function AgentPrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      updated="13 September 2026"
      intro={
        <>
          <p>
            This policy explains how {company.legalName} collects, uses, shares
            and protects personal data in connection with its commission agent
            programme in Kerala, and what rights you have over that data.
          </p>
          <p>
            It applies to the pages at calecutech.com/agents, to the agent
            dashboard, and to the Android application that uses the same
            service. By registering as an agent you confirm that you have read
            it.
          </p>
        </>
      }
    >
      <Clause n={1} heading="Who we are">
        <p>
          {company.legalName} is the data fiduciary responsible for your
          personal data under the Digital Personal Data Protection Act, 2023.
        </p>
        <ul>
          {company.cin && <li>CIN {company.cin}</li>}
          <li>Registered office: {company.registeredOffice}</li>
          <li>Contact: {company.email}, or WhatsApp on the number below</li>
        </ul>
      </Clause>

      <Clause n={2} heading="What personal data we collect">
        <p>
          <strong>When you sign in.</strong> We use Google Sign-In. Google gives
          us your email address, your name and a stable account identifier. We
          request no other permission from your Google account, and we never
          receive your Google password.
        </p>
        <p>
          <strong>When you apply.</strong> Six fields, and nothing else: your
          name, mobile number, district, panchayat or municipality, ward, and
          your occupation.
        </p>
        <p>
          <strong>Optional information.</strong> You may also tell us your
          education, previous experience, hours available per day, whether you
          have a vehicle, your computer literacy and the kinds of people you can
          reach. Every one of these can be left blank, and skipping them does
          not affect your application.
        </p>
        <p>
          <strong>When you set up payouts.</strong> Your PAN, and your bank
          account details or UPI ID. These are requested only at that point,
          never at signup.
        </p>
        <p>
          <strong>Technical information.</strong> A truncated form of your IP
          address (the network range, not the address itself) and a hashed
          device identifier, used to detect people creating many accounts.
        </p>
        <p>
          We do not collect your date of birth, your address, a photograph, or
          any uploaded document. We do not ask for a registration fee, a deposit
          or any payment at any stage.
        </p>
      </Clause>

      <Clause n={3} heading="Why we use it, and on what basis">
        <p>
          We process your data to assess your application, issue your agent
          code, record which customers you referred, calculate and pay your
          commission, meet our obligations under Indian tax law, and contact you
          about the programme.
        </p>
        <p>
          The basis for processing is the consent you give when you register,
          and the performance of the commission arrangement between us. Where we
          are required by law to keep or disclose data — tax records, for
          example — the basis is that legal obligation.
        </p>
        <p>
          We do not sell your data. We do not use it for advertising, and we do
          not build profiles of you for any purpose other than assessing your
          application.
        </p>
      </Clause>

      <Clause n={4} heading="Who we share it with">
        <ul>
          <li>
            <strong>Administrators of the programme.</strong> Staff responsible
            for your district, and authorised company staff. Other agents cannot
            see your details.
          </li>
          <li>
            <strong>The Income Tax Department.</strong> Your PAN and the TDS
            deducted, as required for our returns under Section 194H.
          </li>
          <li>
            <strong>Our bank.</strong> The details needed to pay you.
          </li>
          <li>
            <strong>Our service providers.</strong> Hosting and database
            providers who process data on our instructions and may not use it
            for their own purposes.
          </li>
          <li>
            <strong>Where the law requires it,</strong> or to establish or
            defend a legal claim.
          </li>
        </ul>
        <p>
          Access is enforced by the database itself, not only by the
          application: an administrator assigned to one district cannot retrieve
          records from another, and a request that asks for them returns nothing
          rather than being refused.
        </p>
      </Clause>

      <Clause n={5} heading="How long we keep it">
        <ul>
          {/*
            A concrete period, not a placeholder.

            A live privacy policy that says the retention period is unfilled
            reads as an unfinished document — Google's OAuth review rejected it
            on exactly that basis. Twelve months is the value chosen; it is a
            business decision and the client has been asked to confirm it.
          */}
          <li>
            Applications that are not approved: 12 months from the date you
            applied, after which the record is deleted.
          </li>
          <li>
            Active agent records: for as long as you are an agent, and for eight
            financial years afterwards.
          </li>
          <li>
            Commission and tax records: eight financial years, as Indian tax law
            requires. These are kept even after an account is closed.
          </li>
          <li>
            Usage measurements: 24 months. They contain nothing that identifies
            you.
          </li>
        </ul>
      </Clause>

      <Clause n={6} heading="How we protect it">
        <p>
          Your PAN and bank account number are encrypted at rest using
          AES-256-GCM. Your PAN is displayed only as a mask such as XXXXX1234F —
          to you, to administrators, and in every export. No part of this system
          returns a full PAN, and it never appears in logs, error reports or
          internal audit records.
        </p>
        <p>
          Duplicate accounts are detected using a one-way keyed fingerprint of
          the PAN, so that check never decrypts anything. Data is transmitted
          over TLS. Access by administrators is restricted by role and by
          district, and every administrative action is written to an audit log
          that cannot be edited or deleted by anyone.
        </p>
      </Clause>

      <Clause n={7} heading="Your rights">
        <p>Under the Digital Personal Data Protection Act, 2023 you may:</p>
        <ul>
          <li>Obtain a copy of the personal data we hold about you</li>
          <li>Have inaccurate data corrected or incomplete data completed</li>
          <li>Have your data erased</li>
          <li>Nominate someone to exercise these rights if you cannot</li>
          <li>Withdraw your consent at any time</li>
          <li>Complain to us, and then to the Data Protection Board of India</li>
        </ul>
        <p>
          Your dashboard does the first three without needing to contact anyone:
          it shows everything held about you, lets you correct it, and lets you
          request erasure.
        </p>
        <p>
          When you ask us to erase your data we remove the details that identify
          you. Commission and tax records are retained for the statutory period
          described in section 5, because the law requires us to hold them.
        </p>
      </Clause>

      <Clause n={8} heading="Cookies and measurement">
        <p>
          We set no advertising cookies and use no third-party trackers. The
          only cookies are the ones that keep you signed in, which are removed
          when you sign out.
        </p>
        <p>
          We count how far people get through the signup form so that we can fix
          the parts that lose them. Those counts carry no name, email address,
          mobile number or account identifier, and cannot be linked back to you.
        </p>
      </Clause>

      <Clause n={9} heading="Children">
        <p>
          This programme is not open to anyone under 18, and we do not knowingly
          collect the personal data of children. If you believe a child has
          registered, contact us and we will remove the account.
        </p>
      </Clause>

      <Clause n={10} heading="Changes to this policy">
        <p>
          If we change this policy we will publish the revised version here with
          a new date. Where a change materially affects how your data is used,
          we will tell you before it takes effect.
        </p>
      </Clause>

      <Clause n={11} heading="Contact and complaints">
        <p>
          Write to us at {company.email}, or message us on WhatsApp. We aim to
          respond within seven working days.
        </p>
        <p>
          If you are not satisfied with our response, you may complain to the
          Data Protection Board of India.
        </p>
      </Clause>
    </LegalPage>
  );
}
