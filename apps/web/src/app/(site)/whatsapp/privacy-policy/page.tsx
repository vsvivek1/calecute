import type { Metadata } from "next";
import Link from "next/link";
import { company } from "@/lib/company";
import { WhatsAppLegalPage, Section, Mail, WHATSAPP_ORIGIN } from "@/components/whatsapp/WhatsAppLegal";

export const metadata: Metadata = {
  title: "WhatsApp Privacy Policy | Calecutech",
  description: "How Calecutech collects, uses and protects data when you message us on WhatsApp.",
  alternates: { canonical: `${WHATSAPP_ORIGIN}/whatsapp/privacy-policy` },
};

export default function WhatsAppPrivacyPage() {
  return (
    <WhatsAppLegalPage title="WhatsApp Privacy Policy">
      <p>
        This policy explains how {company.legalName} (&ldquo;{company.brand}&rdquo;, &ldquo;we&rdquo;,
        &ldquo;us&rdquo;) handles personal data when you communicate with us through WhatsApp, using
        the WhatsApp Business Platform provided by Meta Platforms, Inc. and its affiliates
        (&ldquo;Meta&rdquo;). Our general{" "}
        <Link className="underline underline-offset-2" href="/privacy">
          Privacy Policy
        </Link>{" "}
        also applies.
      </p>

      <Section heading="1. Who we are">
        <p>
          {company.legalName}, {company.jurisdiction}, trading as {company.brand}, with operations in{" "}
          {company.office.city}, {company.office.region}, {company.office.country}. Contact: <Mail />.
        </p>
      </Section>

      <Section heading="2. What we collect">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Your WhatsApp phone number and profile name</strong>, which WhatsApp shares with us
            when you message us or agree to receive messages from us.
          </li>
          <li>
            <strong>Message content</strong>: the text, images, documents, voice notes, locations and
            other content you send us, and the replies we send you.
          </li>
          <li>
            <strong>Message metadata</strong>: timestamps, message IDs and delivery and read status.
          </li>
          <li>
            <strong>Details you choose to give us</strong>, such as your name, email address, course or
            app of interest, or order details.
          </li>
        </ul>
        <p>
          We do not access your WhatsApp contacts, other chats or groups. We only see conversations
          you have directly with our business number.
        </p>
      </Section>

      <Section heading="3. How we use it">
        <ul className="list-disc space-y-2 pl-6">
          <li>to reply to your questions and support requests;</li>
          <li>to send updates, reminders and notifications you have asked for or agreed to receive;</li>
          <li>to provide information about our courses, apps and services when you ask for it;</li>
          <li>to keep records of our conversations, improve our service and prevent misuse;</li>
          <li>to meet legal obligations.</li>
        </ul>
        <p>
          We send promotional messages only to people who have opted in, and you can opt out at any
          time by replying <strong>STOP</strong>.
        </p>
      </Section>

      <Section heading="4. Who we share it with">
        <p>We do not sell your personal data. We share it only with:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Meta / WhatsApp</strong>, which carries the messages. Meta&rsquo;s handling of data
            is covered by the{" "}
            <a className="underline underline-offset-2" href="https://www.whatsapp.com/legal/privacy-policy">
              WhatsApp Privacy Policy
            </a>{" "}
            and the{" "}
            <a className="underline underline-offset-2" href="https://www.whatsapp.com/legal/business-policy">
              WhatsApp Business Policy
            </a>
            .
          </li>
          <li>
            <strong>Service providers</strong> that host our systems and store our records (such as
            cloud hosting and database providers), only as needed for them to do that work.
          </li>
          <li>
            <strong>Authorities</strong>, where the law requires it.
          </li>
        </ul>
      </Section>

      <Section heading="5. How long we keep it">
        <p>
          We keep WhatsApp conversations and related details for as long as needed to serve you and
          for up to 24 months after your last message, unless the law requires us to keep them longer
          or you ask us to delete them sooner.
        </p>
      </Section>

      <Section heading="6. Security">
        <p>
          Messages between you and WhatsApp are encrypted in transit. Data we store is kept on access
          controlled systems served over HTTPS. No system is perfectly secure; tell us at once if you
          believe something has gone wrong.
        </p>
      </Section>

      <Section heading="7. Your choices and rights">
        <ul className="list-disc space-y-2 pl-6">
          <li>Reply <strong>STOP</strong> to stop receiving messages from us.</li>
          <li>Ask for a copy of the data we hold about you, or ask us to correct it.</li>
          <li>
            Ask us to delete your data. See the{" "}
            <Link className="underline underline-offset-2" href="/whatsapp/data-deletion">
              WhatsApp Data Deletion Instructions
            </Link>
            .
          </li>
        </ul>
      </Section>

      <Section heading="8. Children">
        <p>
          Our WhatsApp service is not meant for children under 13. Where our courses or apps are for
          younger students, we expect a parent or guardian to contact us on their behalf.
        </p>
      </Section>

      <Section heading="9. Changes">
        <p>We will update the date at the top of this page whenever this policy changes.</p>
      </Section>

      <Section heading="10. Contact">
        <p>
          For privacy questions, email <Mail subject="WhatsApp privacy question" />.
        </p>
      </Section>
    </WhatsAppLegalPage>
  );
}
