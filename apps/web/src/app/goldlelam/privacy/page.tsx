import { LegalPage, Clause } from "@/components/goldlelam/LegalPage";
import { DraftNotice } from "@/components/goldlelam/DraftNotice";
import { Placeholder } from "@/components/agents/Bilingual";
import {
  GOLDLELAM,
  CONTACT,
  GOLDLELAM_PROCESSORS,
} from "@/lib/goldlelam/content";

export const metadata = { title: "Privacy Policy" };

export default function GoldLelamPrivacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated={GOLDLELAM.policyUpdated}
      intro={
        <>
          This policy explains what {GOLDLELAM.name} collects when you use
          the app to browse and bid in a bank&apos;s gold-loan auctions, why,
          and who else sees it. It applies to the {GOLDLELAM.name} mobile app
          and to {GOLDLELAM.webDomain}.
        </>
      }
    >
      <DraftNotice />

      <Clause n={1} heading="Information we collect">
        <p>
          <strong>Account and sign-in.</strong> When you sign in with Google,
          we receive your name, email address and profile picture. We never
          see your Google password.
        </p>
        <p>
          <strong>KYC documents.</strong> Identity documents you upload to
          register for bidding — for example PAN and a government photo ID —
          so a bank can verify your eligibility to bid before accepting an
          earnest money deposit.
        </p>
        <p>
          <strong>Photos.</strong> Lot photographs are published by the
          listing bank, not by you. If a KYC document requires a photograph
          of yourself, that image is stored as part of your KYC record.
        </p>
        <p>
          <strong>Bids and auction activity.</strong> The auctions you view,
          the lots you watch, and every bid you place — amount, time, and
          which auction it was against.
        </p>
        <p>
          <strong>Location — district only.</strong> We ask for your
          approximate location so nearby auctions can be shown first. What we
          store is your district, not a precise coordinate. Declining this
          only removes the &quot;near you&quot; sort.
        </p>
        <p>
          <strong>Device identifiers.</strong> A push notification (FCM)
          token, so we can alert you when bidding opens on a lot you are
          watching, or when you are outbid.
        </p>
        <p>
          <strong>Analytics.</strong> Basic usage events — which screens are
          opened and how often — so we can tell which parts of the app are
          actually used. Analytics events are not linked to your bids for any
          purpose other than product improvement.
        </p>
      </Clause>

      <Clause n={2} heading="How we use it">
        <ul>
          <li>Creating and securing your account.</li>
          <li>
            Verifying your eligibility to bid, on behalf of the bank running
            an auction you register for.
          </li>
          <li>Showing you relevant, nearby auctions.</li>
          <li>Running the bidding itself and recording its outcome.</li>
          <li>
            Sending alerts about auctions you are watching or bidding in.
          </li>
          <li>Improving the app based on how it is actually used.</li>
        </ul>
      </Clause>

      <Clause n={3} heading="Who we share it with">
        <p>
          The bank running an auction you register for or bid in, so it can
          verify your eligibility, accept your earnest money deposit, and
          run the auction. We share only what that bank needs for its own
          auction, not your full account.
        </p>
        <p>We also use the following processors, who act on our instructions:</p>
        <ul>
          {GOLDLELAM_PROCESSORS.map((p) => (
            <li key={p.name}>
              <strong>{p.name}.</strong> {p.role}{" "}
              <a href={p.policy} target="_blank" rel="noopener noreferrer">
                Privacy policy
              </a>
              .
            </li>
          ))}
        </ul>
        <p>
          Your card, UPI or netbanking details for an earnest money deposit
          are entered on our payment provider&apos;s own screen and never
          reach {GOLDLELAM.name}&apos;s servers.
        </p>
      </Clause>

      <Clause n={4} heading="Retention">
        <p>
          Account data is kept while your account exists. KYC documents and
          bid records are kept for as long as the bank you dealt with, or
          Indian financial and tax law, requires — which is longer than the
          account itself, and is why deleting your account does not delete an
          auction&apos;s bid or deposit records. See the account deletion
          page for the full list of what is and isn&apos;t removed.
        </p>
      </Clause>

      <Clause n={5} heading="Your rights under the DPDP Act, 2023">
        <p>
          Under India&apos;s Digital Personal Data Protection Act, 2023, you
          have the right to:
        </p>
        <ul>
          <li>Access a summary of the personal data we hold about you.</li>
          <li>
            Ask us to correct or complete inaccurate or incomplete personal
            data.
          </li>
          <li>
            Ask us to erase personal data that is no longer needed for the
            purpose it was collected — see the account deletion page.
          </li>
          <li>
            Nominate another individual to exercise these rights on your
            behalf in the event of death or incapacity.
          </li>
          <li>
            Withdraw consent at any time, as easily as you gave it — where we
            rely on consent as the lawful basis.
          </li>
          <li>
            Register a grievance with our Grievance Officer (below), and, if
            unresolved, with the Data Protection Board of India.
          </li>
        </ul>
        <p>
          We process your data to provide the service you asked for —
          browsing, registering, and bidding in an auction — and, for KYC and
          deposit records, to meet obligations under Indian financial and tax
          law. Consent is given when you create an account and may be
          withdrawn by deleting it, subject to records we are required to
          keep regardless.
        </p>
      </Clause>

      <Clause n={6} heading="Security">
        <p>
          A bidder can only reach records belonging to them. Sign-in tokens
          are held in the device keystore or keychain, never in ordinary app
          storage.
        </p>
      </Clause>

      <Clause n={7} heading="Grievance Officer">
        <p>
          Under the DPDP Act, 2023, our Grievance Officer for {GOLDLELAM.name}{" "}
          is:
        </p>
        <p>
          <Placeholder value={CONTACT.grievanceOfficer.name} /> ·{" "}
          <Placeholder value={CONTACT.grievanceOfficer.email} /> ·{" "}
          <Placeholder value={CONTACT.grievanceOfficer.phone} />
        </p>
        <p>
          Full details, including response timelines, are on the{" "}
          <a href="/goldlelam/grievance">grievance page</a>.
        </p>
      </Clause>

      <Clause n={8} heading="Changes to this policy">
        <p>
          We&apos;ll update the date at the top of this page when this policy
          changes, and post the update here before it takes effect.
        </p>
      </Clause>

      <Clause n={9} heading="Contact">
        <p>
          Questions about this policy:{" "}
          <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>.
        </p>
      </Clause>
    </LegalPage>
  );
}
