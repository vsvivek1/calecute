import type { Metadata } from "next";
import Link from "next/link";
import { company } from "@/lib/company";
import { WhatsAppLegalPage, Section, Mail, WHATSAPP_ORIGIN } from "@/components/whatsapp/WhatsAppLegal";

export const metadata: Metadata = {
  title: "WhatsApp Terms of Service | Calecutech",
  description: "The terms for using Calecutech's WhatsApp service.",
  alternates: { canonical: `${WHATSAPP_ORIGIN}/whatsapp/terms` },
};

export default function WhatsAppTermsPage() {
  return (
    <WhatsAppLegalPage title="WhatsApp Terms of Service">
      <p>
        These terms apply when you message {company.legalName} (&ldquo;{company.brand}&rdquo;,
        &ldquo;we&rdquo;, &ldquo;us&rdquo;) on WhatsApp or receive WhatsApp messages from us. They add
        to our general{" "}
        <Link className="underline underline-offset-2" href="/terms">
          Terms of Service
        </Link>
        . By messaging us on WhatsApp, you agree to them.
      </p>

      <Section heading="1. The service">
        <p>
          We use the WhatsApp Business Platform to answer questions, provide support, and send
          updates and notifications about our courses, apps and services. Replies may come from our
          team or from automated assistants, and response times are not guaranteed.
        </p>
      </Section>

      <Section heading="2. Consent and opt-out">
        <p>
          We send you messages only after you message us first or agree to receive them. You can opt
          out at any time by replying <strong>STOP</strong>, blocking our number, or emailing <Mail />.
        </p>
      </Section>

      <Section heading="3. Acceptable use">
        <p>You agree not to use our WhatsApp service to:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>send unlawful, abusive, threatening, obscene or misleading content;</li>
          <li>send spam, malware, or content that infringes the rights of others;</li>
          <li>impersonate anyone or send someone else&rsquo;s personal data without their permission.</li>
        </ul>
        <p>We may stop responding to, or block, numbers that break these rules.</p>
      </Section>

      <Section heading="4. Information we provide">
        <p>
          Information we share on WhatsApp is for general guidance. Prices, offers, course details
          and orders are confirmed only on our website, in an invoice, or in a written agreement.
        </p>
      </Section>

      <Section heading="5. WhatsApp and Meta">
        <p>
          WhatsApp is provided by Meta, not by us. Your use of WhatsApp is also governed by the{" "}
          <a className="underline underline-offset-2" href="https://www.whatsapp.com/legal/terms-of-service">
            WhatsApp Terms of Service
          </a>
          . We are not responsible for outages or changes to WhatsApp itself.
        </p>
      </Section>

      <Section heading="6. Privacy">
        <p>
          How we handle your data is described in the{" "}
          <Link className="underline underline-offset-2" href="/whatsapp/privacy-policy">
            WhatsApp Privacy Policy
          </Link>
          . To have your data removed, see the{" "}
          <Link className="underline underline-offset-2" href="/whatsapp/data-deletion">
            WhatsApp Data Deletion Instructions
          </Link>
          .
        </p>
      </Section>

      <Section heading="7. Liability">
        <p>
          To the extent the law allows, we are not liable for indirect or consequential loss arising
          from use of our WhatsApp service, including delayed or undelivered messages.
        </p>
      </Section>

      <Section heading="8. Changes">
        <p>
          We may update these terms. The date at the top of this page shows the latest version.
          Continuing to message us after a change means you accept the updated terms.
        </p>
      </Section>

      <Section heading="9. Contact">
        <p>
          Questions about these terms: <Mail subject="WhatsApp terms question" />.
        </p>
      </Section>
    </WhatsAppLegalPage>
  );
}
