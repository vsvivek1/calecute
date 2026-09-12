/**
 * Single source of truth for company identity shown across the site.
 * Keep this in sync with the LLC filing and the India office registration.
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
