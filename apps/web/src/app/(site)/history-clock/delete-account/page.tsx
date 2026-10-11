import type { Metadata } from "next";
import { PolicyPage, Section, Todo } from "@/components/history-clock/PolicyPage";
import { SITE_ORIGIN, historyClock, contactEmail } from "@/lib/history-clock/content";

export const metadata: Metadata = {
  title: "Delete Your History Clock Account or Data | Calecutech",
  description: "How to request deletion of your History Clock data. History Clock has no accounts yet.",
  alternates: { canonical: `${SITE_ORIGIN}/history-clock/delete-account` },
};

export default function HistoryClockDeleteAccountPage() {
  return (
    <PolicyPage
      title="Delete your account or data"
      intro={
        <p>
          This page explains how to ask us to delete personal data related to {historyClock.name}. History Clock
          does not have user accounts yet, so there is no account to delete in the app today.
        </p>
      }
    >
      <Section id="status" heading="1. Current status">
        <p>
          The {historyClock.name} preview does not create accounts, does not ask you to sign in, and does not
          store your personal data on our systems. There is therefore no in-app option to delete an account
          at the moment.
        </p>
        <p>
          The only personal data we hold is what you have sent us directly, such as emails, plus standard
          hosting records described in our{" "}
          <a className="underline underline-offset-2" href="/history-clock/privacy">
            privacy policy
          </a>
          .
        </p>
      </Section>

      <Section id="request" heading="2. How to request deletion">
        <p>
          Email{" "}
          <a className="underline underline-offset-2" href={`mailto:${contactEmail}?subject=History Clock%20data%20deletion%20request`}>
            {contactEmail}
          </a>{" "}
          with the subject <strong>&ldquo;History Clock data deletion request&rdquo;</strong>. In the message:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>say which personal data you want deleted, or ask for everything we hold about you;</li>
          <li>send it from the email address we should use to find your data.</li>
        </ul>
        <p>
          We may reply to confirm that the request came from you before we delete anything. We will tell you
          when the deletion is complete.{" "}
          <Todo>TODO: owner to confirm the timescale for completing a deletion request.</Todo>
        </p>
      </Section>

      <Section id="deleted" heading="3. What gets deleted">
        <p>
          We delete the personal data we hold about you that is connected to your request, including your
          correspondence with us, except where we must keep certain records to meet legal or accounting
          obligations. If we keep anything for that reason, we will tell you what it is and why.
        </p>
      </Section>

      <Section id="future" heading="4. When accounts are introduced">
        <p>
          If we add user accounts to {historyClock.name}, we will add a deletion option inside the product and
          update this page to describe it. We will not describe an automated deletion process before it
          exists.
        </p>
      </Section>
    </PolicyPage>
  );
}
