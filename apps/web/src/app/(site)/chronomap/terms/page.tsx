import type { Metadata } from "next";
import { PolicyPage, Section, Todo } from "@/components/chronomap/PolicyPage";
import { SITE_ORIGIN, chronomap, contactEmail, legalEntity } from "@/lib/chronomap/content";

export const metadata: Metadata = {
  title: "Chronomap Terms of Use | Calecutech",
  description: "Terms for using Chronomap, the interactive historical atlas by Calecutech.",
  alternates: { canonical: `${SITE_ORIGIN}/chronomap/terms` },
};

export default function ChronomapTermsPage() {
  return (
    <PolicyPage
      title={`${chronomap.name} Terms of Use`}
      intro={
        <p>
          These terms apply when you use {chronomap.name}, including the website pages and the preview app.
          By using {chronomap.name} you agree to them. If you do not agree, please do not use it.
        </p>
      }
    >
      <Section id="provider" heading="1. Who provides Chronomap">
        <p>
          {chronomap.name} is provided by {legalEntity}, trading as Calecutech. Contact:{" "}
          <a className="underline underline-offset-2" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
          .
        </p>
      </Section>

      <Section id="nature" heading="2. What Chronomap is">
        <p>
          {chronomap.name} is an informational and educational historical atlas. It lets you select a place
          and move along a timeline to see historical events, dynasties, monuments and cultural developments.
          It is not a source of legal, financial or academic advice.
        </p>
        <p>
          The current version is a preview. Features, content and availability may change or be withdrawn at
          any time, and the preview may not be available at all times.
        </p>
      </Section>

      <Section id="use" heading="3. Permitted use">
        <p>
          You may use {chronomap.name} for personal, educational and research purposes, and you may quote
          short passages from it when you credit the source.
        </p>
      </Section>

      <Section id="not-permitted" heading="4. What you must not do">
        <ul className="list-disc space-y-2 pl-5">
          <li>Use automated methods to copy or harvest large amounts of content or to overload the service.</li>
          <li>Attempt to disrupt, probe or gain unauthorised access to the site or its systems.</li>
          <li>Present content from {chronomap.name} as authoritative without checking its sources.</li>
          <li>Use the {chronomap.name} name or logo in a way that suggests endorsement without our permission.</li>
        </ul>
      </Section>

      <Section id="accuracy" heading="5. Historical information and sources">
        <p>
          History involves uncertainty. Dates may be approximate, and historians may disagree about events,
          attributions and interpretations. We aim to label such cases on each entry. Where you rely on
          Chronomap for study, research or publication, please check the primary and scholarly sources it
          links to.
        </p>
        <p>
          The example journey and the interface preview on the website are illustrative. They are not
          complete records.
        </p>
      </Section>

      <Section id="sources" heading="6. Source attribution and third-party material">
        <p>
          Entries are meant to cite the sources they rely on. Where we include material owned by others,
          such as images, maps, texts or data, we will credit the owner and use it only under a licence that
          permits it. If you believe material on {chronomap.name} is used without permission, tell us and we
          will review it promptly.{" "}
          <Todo>TODO: list the licence and source for each third-party asset before launch.</Todo>
        </p>
      </Section>

      <Section id="corrections" heading="7. Corrections">
        <p>
          We welcome corrections. Send the entry, what is wrong, and any source you can point to, using the
          contact address above. We review corrections and will tell you if we change an entry in response,
          where we can.
        </p>
      </Section>

      <Section id="ip" heading="8. Intellectual property">
        <p>
          Unless stated otherwise, the Chronomap software, design, text and arrangement of content belong to
          {" "}{legalEntity}. You may not copy or reuse them except as these terms allow or as the law
          permits. <Todo>TODO: confirm trademark status of the working name &ldquo;Chronomap&rdquo;.</Todo>
        </p>
      </Section>

      <Section id="disclaimer" heading="9. Disclaimers">
        <p>
          {chronomap.name} is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;, without warranties
          of any kind, express or implied, including warranties of accuracy, completeness, fitness for a
          particular purpose or uninterrupted availability.
        </p>
      </Section>

      <Section id="liability" heading="10. Limitation of liability">
        <p>
          To the fullest extent the law allows, {legalEntity} is not liable for indirect or consequential
          losses arising from your use of {chronomap.name}.{" "}
          <Todo>TODO: legal review of this clause and any mandatory consumer rights in the countries where the product is offered.</Todo>
        </p>
      </Section>

      <Section id="changes" heading="11. Changes to these terms">
        <p>
          We may update these terms. The date at the top of the page shows when they last changed, and
          continued use after a change means you accept the updated terms.
        </p>
      </Section>

      <Section id="law" heading="12. Governing law">
        <p>
          <Todo>TODO: owner and legal review to set the governing law and dispute resolution clause.</Todo>
        </p>
      </Section>

      <Section id="contact" heading="13. Contact">
        <p>
          Questions about these terms:{" "}
          <a className="underline underline-offset-2" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
          .
        </p>
      </Section>
    </PolicyPage>
  );
}
