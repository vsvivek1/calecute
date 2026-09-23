import { LegalPage, Clause } from "@/components/goldlelam/LegalPage";
import { GOLDLELAM, CONTACT } from "@/lib/goldlelam/content";

export const metadata = { title: "Delete your account" };

/**
 * Google Play requires a deletion route reachable without installing the
 * app; Apple requires one reachable from inside it. This page is the former
 * — mirrors the shape of (site)/apps/[slug]/delete-account/page.tsx.
 */
export default function GoldLelamDeleteAccount() {
  return (
    <LegalPage
      title="Delete your account"
      updated={GOLDLELAM.policyUpdated}
      intro={
        <>
          You can delete your {GOLDLELAM.name} account and its data from
          within the app — open <strong>Profile → Settings → Delete
          account</strong> — or by the steps below, which don&apos;t require
          the app to be installed.
        </>
      }
    >
      <Clause n={1} heading="How to request deletion">
        <p>
          Email{" "}
          <a
            href={`mailto:${CONTACT.email}?subject=${encodeURIComponent(
              `Delete my ${GOLDLELAM.name} account`,
            )}`}
          >
            {CONTACT.email}
          </a>{" "}
          from the address registered on the account, with the subject
          &ldquo;Delete my {GOLDLELAM.name} account&rdquo;. Include the
          mobile number or Google account you sign in with, so we can
          identify the account.
        </p>
      </Clause>

      <Clause n={2} heading="What happens next">
        <p>
          We verify the request is genuinely from the account holder, then
          delete the account within 30 days and confirm by email.
        </p>
      </Clause>

      <Clause n={3} heading="What is deleted">
        <ul>
          <li>Your name, phone number, email, and Google profile data</li>
          <li>Uploaded KYC documents</li>
          <li>Saved lots, watchlists, and alerts</li>
          <li>Your push notification token and any active sessions</li>
        </ul>
      </Clause>

      <Clause n={4} heading="What is kept, and why">
        <p>
          Records of any earnest money deposit you paid, refunded, or
          forfeited, and of any bid you placed, are <strong>not</strong>{" "}
          deleted. Indian financial and tax law requires them to be kept, and
          the bank you bid with needs them to account for its own auction.
          They are retained for the period the law requires and then
          removed.
        </p>
      </Clause>

      <Clause n={5} heading="Contact">
        <p>
          {CONTACT.email} is monitored by {GOLDLELAM.name} support. See also
          the <a href="/goldlelam/grievance">grievance page</a> for the
          formal DPDP grievance process.
        </p>
      </Clause>
    </LegalPage>
  );
}
