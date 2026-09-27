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
import { company, isPlaceholder, whatsappContactUrl } from "@/lib/agents/content";

export function OrganizationSchema() {
  const origin =
    process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "https://calecutech.com";

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.legalName,
    alternateName: company.legalName,
    url: origin,
    email: company.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: "11/698A, Poolakadavu",
      addressLocality: company.locality,
      addressRegion: "Kerala",
      postalCode: company.postalCode,
      addressCountry: "IN",
    },
  };

  // Emitted only when a CIN is actually published. A structured-data
  // identifier is a machine-readable claim; publishing a blank or placeholder
  // one would be worse than publishing none.
  if (company.cin && !isPlaceholder(company.cin)) {
    schema.identifier = {
      "@type": "PropertyValue",
      propertyID: "CIN",
      value: company.cin,
      description:
        "Corporate Identity Number, Ministry of Corporate Affairs, Government of India",
    };
    schema.legalName = company.legalName;
  }

  // WhatsApp is the only contact channel, so it is what gets published.
  schema.contactPoint = {
    "@type": "ContactPoint",
    contactType: "customer support",
    telephone: `+91${company.contactWhatsapp}`,
    url: whatsappContactUrl(),
    availableLanguage: ["ml", "en"],
  };
  schema.sameAs = [company.whatsappChannel];

  return (
    <script
      type="application/ld+json"
      // Values come from a checked-in module, never from user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
