/**
 * Every word of copy for the agent programme, in one place.
 *
 * The site is English throughout. It was originally built bilingual, with
 * Malayalam primary and English beneath each line; the client asked for a
 * single language and chose English, so the interleaving is gone rather than
 * hidden behind a toggle.
 *
 * Two things survive from that: the database still stores Malayalam names for
 * every district and local body, and search still matches them — someone can
 * type "കോടഞ്ചേരി" and find Kodencheri. That happens server-side and never
 * appears on the page.
 *
 * House rules for anything added here
 * -----------------------------------
 *  - NEVER state or imply an earnings figure. No "earn up to", no worked
 *    example, no monthly range. It is the biggest scam signal on a Kerala
 *    recruitment page and it is a legal exposure.
 *  - No urgency, no superlatives, no social proof.
 *  - Reassurances are stated in passing, not badged. Emphasis reads as
 *    protesting, which is itself a scam signal.
 *
 * Placeholders are written as <<<LIKE THIS>>> and render as visible red tokens,
 * so none can ship unnoticed. They are listed in the README.
 */

export const PLACEHOLDER_PREFIX = "<<<";

export function isPlaceholder(value: string): boolean {
  return value.includes(PLACEHOLDER_PREFIX);
}

/* ------------------------------------------------------------- company */

export const company = {
  legalName: "Calecute Technologies (OPC) Private Limited",
  shortName: "Calecute Technologies",
  /** Registered CIN, supplied 2026-09-13. Shown as a quiet footer detail. */
  cin: "U62013KL2026OPC105471" as string | null,
  city: "Kozhikode, Kerala",
  /**
   * One sentence, supplied 2026-09-13.
   *
   * Written to be recognisable to the reader rather than exhaustive. A Kerala
   * recruit assessing whether this is a real company gets more from "exam
   * apps, school and coaching software, tools for agents and small businesses"
   * than from a list of eleven product names they have never heard of.
   */
  whatWeDo:
    "We build software used across Kerala: exam preparation apps for LSS, USS, PSC and UPSC, management systems for schools and coaching institutes, apps for bankers and vehicle services, planning and ERP software for small businesses, and trade apps for farmer producer organisations.",
  /** Registered office as filed, supplied 2026-09-13. */
  registeredOffice:
    "11/698A, Poolakadavu, Marikkunnu (PO), Kozhikode 673012, Kerala, India",
  postalCode: "673012",
  locality: "Marikkunnu",
  email: "info@calecutech.com",
  /** WhatsApp is the only contact channel, at the client's instruction. */
  contactWhatsapp: "8547985289",
  whatsappChannel: "https://whatsapp.com/channel/0029Vb8hpyh3mFY8Nd5PiB1H",
} as const;

export const MCA_VERIFY_URL =
  "https://www.mca.gov.in/mcafoportal/viewCompanyMasterData.do";

export function whatsappContactUrl(): string {
  return `https://wa.me/91${company.contactWhatsapp.replace(/\D/g, "")}`;
}

export function formattedContactNumber(): string {
  const d = company.contactWhatsapp.replace(/\D/g, "");
  return `${d.slice(0, 5)} ${d.slice(5)}`;
}

/* --------------------------------------------------------------- page */

export const page = {
  title: "Commission agent programme",
  eyebrow: "Calecute Technologies · Kerala",

  role: {
    body: "We are appointing commission agents to sell our software products, across every panchayat in Kerala.",
    note: "No salary. You earn when the customers you bring pay.",
  },

  commission: {
    heading: "Commission terms",
    /**
     * Stated openly and in full, including the TDS deduction. A page that says
     * what it will take before it asks for anything behaves unlike a scam.
     * Do not soften, summarise, or move below the fold.
     */
    points: [
      "10% of every payment the referred customer makes",
      "For as long as that customer keeps paying",
      "Calculated after GST and payment gateway charges",
      "Paid monthly",
      "TDS of 2% is deducted under Section 194H of the Income Tax Act",
    ],
  },

  expectations: {
    heading: "Earnings",
    /**
     * The one place a reader looks for a number, and the one place we refuse
     * to give one. Saying so in a line is more credible than a figure.
     */
    body: "Small at first. Steady as customers add up. We do not quote figures.",
  },

  background: {
    heading: "Who it suits",
    body: "Akshaya centres, agency experience, anyone who meets people daily. Open to all.",
  },

  /** One sentence, in the flow of the page. Never badged. */
  notAsked:
    "There is no registration fee or deposit, and nothing to buy. PAN is needed only when you withdraw.",

  verify: { linkLabel: "Check on MCA" },

  availability: {
    heading: "Your panchayat",
    prompt: "Find your panchayat and register.",
    /**
     * No "full" message. Capacity does not refuse anyone — who gets a place is
     * decided later from everyone who applied — so telling a reader their
     * panchayat is full would turn away somebody the programme would accept.
     */
    closed: "This panchayat is not accepting applications at the moment.",
    noData: "The panchayat list has not been loaded yet.",
    applied: "people have applied here so far",
    appliedOne: "person has applied here so far",
  },

  signIn: {
    label: "Continue with Google",
    note: "No password needed.",
    cancelled: "Sign-in was cancelled. You can try again.",
    failed: "Sign-in did not complete. Please try again.",
    suspended: "This account is not active. Please contact us.",
    signedOut: "You have been signed out.",
  },

  whatsapp: { heading: "WhatsApp channel" },

  contact: { heading: "Contact", label: "Message us on WhatsApp" },

  footer: { terms: "Terms", privacy: "Privacy policy", home: "Home" },
} as const;

/* ------------------------------------------------------------- signup */

export const signup = {
  step2Heading: "Your details",
  step3Heading: "This is optional. It helps us choose.",

  fields: {
    name: "Name",
    mobile: "Mobile number",
    district: "District",
    localBody: "Panchayat or municipality",
    ward: "Ward",
    occupation: "Occupation",
    education: "Education",
    experience: "Previous experience",
    hours: "Hours available per day",
    vehicle: "Do you have a vehicle",
    computer: "Computer literacy",
    reach: "Who can you reach",
  },

  hints: {
    mobileNotVerified:
      "No OTP is sent now. The number is verified later, when you set up payouts.",
    wardOptional: "Ward is optional.",
    searchLocalBody: "Search by name. Malayalam spellings work too.",
    notListed: "Municipality or corporation not in the list? Type the name here.",
    notListedNote:
      "We are still loading the list of municipalities and corporations. Your application is accepted and we will place it correctly.",
  },

  consent: {
    terms: "I have read and accept the terms and the privacy policy.",
    duplicateWarning:
      "One account per person. If several accounts share a PAN, the duplicates are cancelled and any commission accrued on them is forfeited.",
  },

  submit: "Submit application",
  skip: "Skip this",
  save: "Save",

  success: {
    heading: "Application received",
    body: "Your agent code is below. We will get in touch after reviewing your application.",
  },
} as const;

/* ------------------------------------------------------- option lists */

export interface Option {
  value: string;
  label: string;
}

export const educationOptions: Option[] = [
  { value: "SSLC", label: "SSLC" },
  { value: "PLUS_TWO", label: "Plus Two" },
  { value: "DEGREE", label: "Degree" },
  { value: "PG", label: "Postgraduate" },
  { value: "DIPLOMA", label: "Diploma" },
  { value: "ITI", label: "ITI" },
  { value: "OTHER", label: "Other" },
];

export const experienceOptions: Option[] = [
  { value: "INSURANCE_AGENCY", label: "Insurance agency" },
  { value: "AKSHAYA_CSC", label: "Akshaya or CSC" },
  { value: "MARKETING_SALES", label: "Marketing or sales" },
  { value: "BANKING_FINANCE", label: "Banking or finance" },
  { value: "BUSINESS_SHOP", label: "Own business or shop" },
  { value: "NONE", label: "None" },
];

export const hoursOptions: Option[] = [
  { value: "ONE", label: "1 hour" },
  { value: "TWO_TO_THREE", label: "2 to 3 hours" },
  { value: "FOUR_PLUS", label: "4 or more" },
  { value: "FULL_TIME", label: "Full time" },
];

export const computerOptions: Option[] = [
  { value: "YES", label: "Yes" },
  { value: "BASIC", label: "Basic" },
  { value: "NO", label: "No" },
];

export const reachOptions: Option[] = [
  { value: "BANK_EMPLOYEES", label: "Bank employees" },
  { value: "CONTRACTORS", label: "Contractors" },
  { value: "STUDENTS", label: "Students" },
  { value: "SHOP_OWNERS", label: "Shop owners" },
  { value: "GOVERNMENT_OFFICES", label: "Government offices" },
  { value: "OTHERS", label: "Others" },
];

export const yesNoOptions: Option[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];
