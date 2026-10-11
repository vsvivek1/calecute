import type { Metadata } from "next";
import { PolicyPage, Section, Todo } from "@/components/history-clock/PolicyPage";
import { SITE_ORIGIN, historyClock, contactEmail, legalEntity } from "@/lib/history-clock/content";

export const metadata: Metadata = {
  title: "History Clock Privacy Policy | Calecutech",
  description: "How the History Clock preview handles personal data today, and what is planned.",
  alternates: { canonical: `${SITE_ORIGIN}/history-clock/privacy` },
};

export default function HistoryClockPrivacyPage() {
  return (
    <PolicyPage
      title={`${historyClock.name} Privacy Policy`}
      intro={
        <p>
          This policy explains what personal data {historyClock.name} handles, why, and with whom it is shared.
          It describes the current preview. Where we plan features that are not yet built, we say so
          separately.
        </p>
      }
    >
      <Section id="who" heading="1. Who we are">
        <p>
          {historyClock.name} is provided by {legalEntity}, trading as Calecutech. Our operations office is in
          Kozhikode, Kerala, India. You can reach us at{" "}
          <a className="underline underline-offset-2" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
          .
        </p>
      </Section>

      <Section id="scope" heading="2. What this policy covers">
        <p>
          This policy covers the History Clock pages on calecutech.com, including the{" "}
          <code>/history-clock</code> overview, the <code>/history-clock/app</code> map and the{" "}
          <code>/history-clock/quiz</code> Kerala quiz. It also covers
          the History Clock placeholder mobile app, which opens these pages in your browser and collects no
          personal data of its own.
        </p>
      </Section>

      <Section id="now" heading="3. What we collect today">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>No accounts or sign-in.</strong> History Clock does not currently create accounts, and no
            History Clock page asks you to sign in.
          </li>
          <li>
            <strong>No personal details asked.</strong> The pages do not ask for your name, email
            address or other details. The map and the quiz run in your browser; they do not send or save
            the places you pick, the years you choose or your quiz answers.
          </li>
          <li>
            <strong>Standard web server records.</strong> When you load a page, our hosting provider
            records the basic information every web server handles, such as the address of the page
            requested, the time, your IP address and your browser type. We use these records to deliver
            and secure the site. <Todo>TODO: confirm retention period for hosting logs with the provider.</Todo>
          </li>
          <li>
            <strong>No analytics, advertising or tracking.</strong> The website does not currently load
            analytics, advertising or tracking scripts on these pages.
          </li>
          <li>
            <strong>Messages you send us.</strong> If you email us, we receive your email address, the
            content of your message and any details you include. We use them only to reply and to handle
            your request.
          </li>
        </ul>
      </Section>

      <Section id="use" heading="4. How we use information">
        <p>We use the information described above to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>answer your questions, corrections and requests;</li>
          <li>keep the site available, working and secure;</li>
          <li>meet our legal and accounting obligations, where they apply.</li>
        </ul>
      </Section>

      <Section id="sharing" heading="5. Who we share information with">
        <p>
          We do not sell personal data. We share it only with service providers that process it for us,
          such as our hosting provider and the email service that carries your messages, and only as needed
          for them to do that work. We may also disclose information where the law requires it.
        </p>
      </Section>

      <Section id="retention" heading="6. How long we keep information">
        <p>
          We keep email correspondence only as long as needed to answer it and to keep a record of the
          request. <Todo>TODO: owner to set the exact retention period for correspondence.</Todo>
        </p>
        <p>
          Hosting logs are kept for the period set by our hosting provider and described in section 3.
        </p>
      </Section>

      <Section id="security" heading="7. Security">
        <p>
          The site is served over HTTPS. Because History Clock has no accounts and no passwords, there is no
          password store to protect in the preview. No system is perfectly secure, so please tell us at
          once if you believe something has gone wrong.
        </p>
      </Section>

      <Section id="planned" heading="8. Planned features, not yet in use">
        <p>
          We plan to add accounts, including sign-in with Google through Firebase Authentication, and
          possibly analytics. <strong>These are not in use today.</strong> Before any of them goes live,
          we will update this policy to describe what is collected, why, who receives it and how long it is
          kept. Until then, the statements in section 3 apply.
        </p>
      </Section>

      <Section id="children" heading="9. Children">
        <p>
          History Clock is an educational product. We do not knowingly collect personal data from children.
          If you believe a child has sent us personal data, contact us and we will delete it.{" "}
          <Todo>TODO: legal review of age thresholds for the countries where the product will be offered.</Todo>
        </p>
      </Section>

      <Section id="rights" heading="10. Your choices and deletion">
        <p>
          You can ask us what information we hold about you, correct it, or delete it. The process for
          this is on the{" "}
          <a className="underline underline-offset-2" href="/history-clock/delete-account">
            account and data deletion page
          </a>
          .
        </p>
      </Section>

      <Section id="changes" heading="11. Changes to this policy">
        <p>
          We will update the date at the top of this page whenever the policy changes, and we will describe
          material changes before they take effect.
        </p>
      </Section>

      <Section id="contact" heading="12. Contact">
        <p>
          For privacy questions, email{" "}
          <a className="underline underline-offset-2" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
          . <Todo>TODO: confirm the name of a privacy contact, if one is designated.</Todo>
        </p>
      </Section>
    </PolicyPage>
  );
}
