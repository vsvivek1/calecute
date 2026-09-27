import { LegalPage, Clause } from "@/components/goldlelam/LegalPage";
import { DraftNotice } from "@/components/goldlelam/DraftNotice";
import { Placeholder } from "@/components/agents/Bilingual";
import { GOLDLELAM, CONTACT, company } from "@/lib/goldlelam/content";

export const metadata = { title: "Grievance Officer" };

export default function GoldLelamGrievance() {
  return (
    <LegalPage
      title="Grievance Officer"
      updated={GOLDLELAM.policyUpdated}
      intro={
        <>
          Under India&apos;s Digital Personal Data Protection Act, 2023,{" "}
          {company.legalName} has appointed a Grievance Officer for{" "}
          {GOLDLELAM.name} to receive and resolve complaints about how your
          personal data is handled.
        </>
      }
    >
      <DraftNotice />

      <Clause n={1} heading="Grievance Officer">
        <p>
          Name: <Placeholder value={CONTACT.grievanceOfficer.name} />
          <br />
          Email: <Placeholder value={CONTACT.grievanceOfficer.email} />
          <br />
          Phone: <Placeholder value={CONTACT.grievanceOfficer.phone} />
          <br />
          Address: {company.registeredOffice}
        </p>
      </Clause>

      <Clause n={2} heading="What you can raise">
        <ul>
          <li>
            A concern about how your personal data was collected, used, or
            shared.
          </li>
          <li>
            A request to access, correct, or erase your personal data that
            was not resolved through the in-app options or the{" "}
            <a href="/goldlelam/delete-account">account deletion page</a>.
          </li>
          <li>Any other complaint under the DPDP Act, 2023.</li>
        </ul>
        <p>
          A grievance about a specific bank&apos;s auction — a reserve
          price, eligibility decision, or EMD refund — should go to that
          bank first; see the{" "}
          <a href="/goldlelam/refund">refund policy</a>.
        </p>
      </Clause>

      <Clause n={3} heading="How to raise a grievance">
        <p>
          Email the Grievance Officer at the address above with
          &ldquo;Grievance&rdquo; in the subject line, your name, the email
          or mobile number your account uses, and a description of the
          issue.
        </p>
      </Clause>

      <Clause n={4} heading="Response timelines">
        <ul>
          <li>Acknowledgement within 7 business days of receipt.</li>
          <li>
            A substantive response, or a resolution, within 30 business days
            of acknowledgement.
          </li>
          <li>
            If you&apos;re not satisfied with the outcome, you may escalate
            to the Data Protection Board of India.
          </li>
        </ul>
      </Clause>
    </LegalPage>
  );
}
