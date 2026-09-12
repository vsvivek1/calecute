/**
 * Company identity for the INTERNATIONAL-facing site.
 *
 * Two legal entities exist and they are not interchangeable:
 *
 *   - Calecute Technologies LLC (Wyoming) — this file. Used everywhere the
 *     audience is international: the marketing site, the app pages, services.
 *   - Calecute Technologies (OPC) Private Limited (Kozhikode) — see
 *     src/lib/agents/content.ts. Used for India-facing surfaces, which today
 *     means the commission agent programme under /agents.
 *
 * The difference is deliberate, not drift. Do not unify them: the agent
 * programme is an Indian commercial arrangement with an Indian CIN, TDS under
 * Section 194H, and an MCA record a recruit is invited to verify. Presenting a
 * Wyoming LLC there would be both wrong and, on a page whose entire purpose is
 * proving the company is real, actively harmful.
 *
 * Keep this in sync with the LLC filing.
 */
export const company = {
  brand: "Calecutech",
  legalName: "Calecute Technologies LLC",
  jurisdiction: "a Wyoming limited liability company",
  domain: "calecutech.com",
  email: "info@calecutech.com",
  office: {
    // TODO: add the street line and PIN code once confirmed, e.g.
    // street: "2nd Floor, <building>, <road>",
    // postalCode: "673001",
    city: "Kozhikode (Calicut)",
    region: "Kerala",
    country: "India",
  },
} as const;

export const officeLines = [
  company.office.city,
  company.office.region,
  company.office.country,
];
