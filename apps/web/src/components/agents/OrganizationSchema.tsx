/**
 * Schema.org Organization markup.
 *
 * Carries the CIN as an official identifier, which is the same trust claim the
 * visible page makes — a search result or a link preview that shows a
 * registered company reads differently from one that does not.
 *
 * Placeholders are omitted from the structured data rather than emitted as
 * `<<<CIN>>>`: publishing a literal placeholder as a machine-readable
 * identifier would be worse than publishing nothing.
 */
import { company, isPlaceholder } from "@/lib/agents/content";

export function OrganizationSchema() {
  const origin =
    process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "https://calecutech.com";

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.legalName.en,
    alternateName: company.legalName.ml,
    url: origin,
    email: company.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Kozhikode",
      addressRegion: "Kerala",
      addressCountry: "IN",
      ...(isPlaceholder(company.registeredOffice.en)
        ? {}
        : { streetAddress: company.registeredOffice.en }),
    },
  };

  if (!isPlaceholder(company.cin)) {
    schema.identifier = {
      "@type": "PropertyValue",
      propertyID: "CIN",
      value: company.cin,
      description:
        "Corporate Identity Number, Ministry of Corporate Affairs, Government of India",
    };
    schema.legalName = company.legalName.en;
  }

  if (!isPlaceholder(company.phone)) {
    schema.telephone = company.phone;
  }

  return (
    <script
      type="application/ld+json"
      // Values come from a checked-in module, never from user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
