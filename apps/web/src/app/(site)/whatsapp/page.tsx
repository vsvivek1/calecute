import type { Metadata } from "next";
import Link from "next/link";
import { company } from "@/lib/company";
import { WhatsAppLegalPage, Section, Mail, WHATSAPP_ORIGIN } from "@/components/whatsapp/WhatsAppLegal";

export const metadata: Metadata = {
  title: "Calecutech on WhatsApp",
  description: "How Calecutech uses the WhatsApp Business Platform, with links to its privacy policy, terms and data deletion instructions.",
  alternates: { canonical: `${WHATSAPP_ORIGIN}/whatsapp` },
};

export default function WhatsAppOverviewPage() {
  return (
    <WhatsAppLegalPage title="Calecutech on WhatsApp">
      <p>
        {company.legalName} (&ldquo;{company.brand}&rdquo;) uses the WhatsApp Business Platform
        (Cloud API), provided by Meta, to talk with customers, students and app users on WhatsApp.
        We use it to answer questions, send updates you ask for, share course and app information,
        and send account and order notifications.
      </p>

      <Section heading="Policies">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <Link className="underline underline-offset-2" href="/whatsapp/privacy-policy">
              WhatsApp Privacy Policy
            </Link>: what we collect when you message us and how we use it.
          </li>
          <li>
            <Link className="underline underline-offset-2" href="/whatsapp/terms">
              WhatsApp Terms of Service
            </Link>: the rules for using our WhatsApp service.
          </li>
          <li>
            <Link className="underline underline-offset-2" href="/whatsapp/data-deletion">
              WhatsApp Data Deletion Instructions
            </Link>: how to have your WhatsApp data removed.
          </li>
        </ul>
      </Section>

      <Section heading="Stop messages at any time">
        <p>
          Reply <strong>STOP</strong> to any of our WhatsApp messages and we will stop sending you
          messages. You can also block our number in WhatsApp, or email <Mail subject="WhatsApp opt-out" />.
        </p>
      </Section>
    </WhatsAppLegalPage>
  );
}
