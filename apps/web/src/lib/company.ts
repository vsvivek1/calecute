import { company as opc } from "@/lib/agents/content";

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
 * programme is an Indian commercial arrangement with an Indian CIN and TDS
 * under Section 194H. Presenting a Wyoming LLC there would be both wrong and,
 * on a page whose entire purpose is proving the company is real, actively
 * harmful.
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

/**
 * Both legal entities, for pages that list who operates what.
 *
 * The OPC is the Google Play merchant and developer of record (Play Console
 * identity was moved to the OPC on 2026-10-12 so it matches the payments
 * profile and BillDesk merchant verification). The site must name it, with
 * its full registered address, or merchant checks see a mismatch.
 */
export const entities = [
  {
    key: "in",
    legalName: opc.legalName,
    role: "Publishes our apps on Google Play and serves customers in India.",
    addressLines: [
      "11/698A, Poolakadavu, Marikkunnu (PO)",
      `Kozhikode ${opc.postalCode}, Kerala, India`,
    ],
    ids: [
      opc.cin ? `CIN: ${opc.cin}` : null,
      opc.gstin ? `GSTIN: ${opc.gstin}` : null,
    ].filter(Boolean) as string[],
    phone: "+91 85479 85289",
  },
  {
    key: "us",
    legalName: "Calecute Technologies LLC",
    role: "Sister company. Serves international clients.",
    addressLines: ["1621 Central Ave", "Cheyenne, WY 82001-4531, USA"],
    ids: [] as string[],
    phone: null,
  },
] as const;

export const copyrightHolders =
  "Calecute Technologies (OPC) Private Limited and Calecute Technologies LLC";

export const officeLines = [
  company.office.city,
  company.office.region,
  company.office.country,
];
