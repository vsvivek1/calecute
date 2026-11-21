import type { Metadata } from "next";
import Link from "next/link";
import { WhatsAppLegalPage, Section, Mail, WHATSAPP_ORIGIN } from "@/components/whatsapp/WhatsAppLegal";

export const metadata: Metadata = {
  title: "WhatsApp Data Deletion Instructions | Calecutech",
  description: "How to ask Calecutech to delete the data we hold from your WhatsApp conversations.",
  alternates: { canonical: `${WHATSAPP_ORIGIN}/whatsapp/data-deletion` },
};

export default function WhatsAppDataDeletionPage() {
  return (
    <WhatsAppLegalPage title="WhatsApp Data Deletion Instructions">
      <p>
        You can ask us to delete all data we hold from your WhatsApp conversations with Calecutech at
        any time. There is no charge.
      </p>

      <Section heading="Option 1: Ask on WhatsApp">
        <p>
          Send the message <strong>DELETE MY DATA</strong> to our WhatsApp business number from the
          phone number you used to message us.
        </p>
      </Section>

      <Section heading="Option 2: Ask by email">
        <p>
          Email <Mail subject="WhatsApp Data Deletion Request" /> with the subject line
          &ldquo;WhatsApp Data Deletion Request&rdquo;. Include the WhatsApp phone number (with country
          code) you used to message us, and your name.
        </p>
      </Section>

      <Section heading="What happens next">
        <ul className="list-disc space-y-2 pl-6">
          <li>We confirm the request comes from the owner of that phone number.</li>
          <li>
            Within 30 days we permanently delete your phone number, profile name, message history,
            media and any other details linked to that number from our systems.
          </li>
          <li>We confirm on WhatsApp or by email once deletion is complete.</li>
        </ul>
        <p>
          We may keep a minimal record that you asked to be deleted and opted out, so that we do not
          message you again, and any records the law requires us to keep (for example, invoices).
        </p>
      </Section>

      <Section heading="Data held by WhatsApp">
        <p>
          Copies of messages on your own phone, and data held by WhatsApp itself, are controlled by
          you and Meta. You can delete chats in the WhatsApp app, and learn more in the{" "}
          <a className="underline underline-offset-2" href="https://www.whatsapp.com/legal/privacy-policy">
            WhatsApp Privacy Policy
          </a>
          .
        </p>
      </Section>

      <p>
        See our{" "}
        <Link className="underline underline-offset-2" href="/whatsapp/privacy-policy">
          WhatsApp Privacy Policy
        </Link>{" "}
        for more information.
      </p>
    </WhatsAppLegalPage>
  );
}
