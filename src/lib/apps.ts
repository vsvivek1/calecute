/**
 * Store-listing metadata for the mobile apps we publish.
 *
 * Google Play and the App Store each require a privacy policy URL, a support
 * URL, and — for anything with accounts — a way to request deletion that works
 * without installing the app. Those pages are generated from this file so the
 * disclosures cannot drift from what an app actually collects, and so adding
 * the production builds later is a data change rather than four new pages.
 */

export type DataCategory = {
  /** Matches Play's Data safety vocabulary, so the console form can be filled from this. */
  category: string;
  items: string[];
  purpose: string;
  /** Play asks this per data type. */
  optional?: boolean;
};

export type AppEntry = {
  slug: string;
  name: string;
  tagline: string;
  androidPackage: string;
  iosBundleId: string;
  audience: string;
  isDemo: boolean;
  summary: string;
  collects: DataCategory[];
  permissions: { name: string; why: string }[];
  sharedWith: string[];
  /** Keys into PROCESSORS. */
  processors: string[];
  retention: string;
  /** Personal data about people who are not the app's user. */
  thirdPartyData?: string;
};

const SUPPORT_EMAIL = "info@calecutech.com";
const COMPANY = "Calecute Technologies LLC";

export const CONTACT = {
  email: SUPPORT_EMAIL,
  company: COMPANY,
  address: "Kozhikode (Calicut), Kerala, India",
  /** Named contact for grievances, as India's DPDP Act 2023 expects. */
  grievanceOfficer: "The Grievance Officer",
};

/** Named services that receive data, which Google asks to see disclosed. */
export type Processor = { name: string; role: string; policy: string };

export const PROCESSORS: Record<string, Processor[]> = {
  google: [
    {
      name: "Google Sign-In",
      role: "Authenticates you and tells us your name, email address and profile picture. We never see your Google password.",
      policy: "https://policies.google.com/privacy",
    },
  ],
  razorpay: [
    {
      name: "Razorpay Software Private Limited",
      role: "Processes deposit payments. Card, UPI and netbanking details are entered on Razorpay's own screen and are never sent to or stored on our servers.",
      policy: "https://razorpay.com/privacy/",
    },
  ],
  hosting: [
    {
      name: "Vercel Inc. and Neon Inc.",
      role: "Host the application and its database. They store data on our behalf and do not use it for their own purposes.",
      policy: "https://vercel.com/legal/privacy-policy",
    },
  ],
};

const BASE: Omit<AppEntry, 'slug'|'name'|'androidPackage'|'iosBundleId'|'isDemo'>[] = [
  {
    tagline: "Field officer asset capture for SARFAESI possession",
    audience:
      "Authorised officers and field officers of a lending institution. Access requires credentials issued by that institution.",
    summary:
      "Sarfez Field is used by a bank's authorised officers to record a site visit under the SARFAESI Act — the schedule of property, a GPS pin, the statutory photograph set, the movable inventory, and a panchnama signed by two witnesses.",
    collects: [
      {
        category: "Location",
        items: ["Precise location (GPS coordinates and accuracy)"],
        purpose:
          "The coordinates of the secured asset are recorded as evidence of where the visit took place. Location is captured only when the officer taps to capture it — never in the background.",
      },
      {
        category: "Photos and videos",
        items: [
          "Photographs of the property",
          "Video of the possession proceedings",
          "Handwritten signature images",
        ],
        purpose:
          "Evidence annexed to the possession panchnama. Each file is stamped server-side with the capture time and the officer's identity.",
      },
      {
        category: "Personal identifiers",
        items: [
          "Officer name, employee ID, branch, and mobile number",
          "Witness name, parent's or spouse's name, address, age, occupation, and phone number",
        ],
        purpose:
          "Identifying the officer conducting the visit, and the two independent witnesses the possession procedure requires.",
      },
      {
        category: "App activity",
        items: ["Notes and observations typed by the officer", "Task status"],
        purpose: "The officer's remarks form part of the panchnama record.",
      },
      {
        category: "Device identifiers",
        items: ["Push notification token"],
        purpose: "Delivering task assignments and review outcomes.",
        optional: true,
      },
    ],
    permissions: [
      {
        name: "Camera",
        why: "Photographing the property and the affixed possession notice. Used only when the officer taps a capture tile.",
      },
      {
        name: "Precise location",
        why: "Recording the coordinates of the secured asset. Foreground only; the app has no background location access.",
      },
      {
        name: "Photos and media",
        why: "Attaching an existing photograph when the camera is unavailable.",
      },
      { name: "Internet", why: "Syncing captured reports to the bank's system." },
    ],
    sharedWith: [
      "The lending institution that employs the officer and assigned the visit. The data is captured on that institution's behalf and is visible to its reviewing officers.",
    ],
    processors: ["hosting"],
    retention:
      "Captured reports are retained by the lending institution under its own record-retention policy, because possession records are statutory documents. We do not retain them independently of that institution.",
    thirdPartyData:
      "This app records personal data about people who are not its users — principally the two panchnama witnesses, and the borrower named on the case. That data is collected by the officer, on behalf of the lending institution, for a statutory purpose under the SARFAESI Act. The institution is the data fiduciary for it; we process it on their instructions. Requests about that data should be directed to the institution, and we will assist them in responding.",
  },
  {
    tagline: "Discover and act on bank auction properties",
    audience: "Members of the public interested in bank auction properties.",
    summary:
      "Sarfez Auctions lets a prospective buyer search properties a bank has put up for auction, save and track them, register interest, and complete the earnest money deposit required to bid.",
    collects: [
      {
        category: "Personal identifiers",
        items: [
          "Name",
          "Mobile number",
          "Email address and Google profile picture, if you sign in with Google",
        ],
        purpose: "Creating and securing your account.",
      },
      {
        category: "Financial information",
        items: [
          "PAN (Permanent Account Number)",
          "Bank account number, IFSC, and account holder name, for refunds",
          "Earnest money deposit records",
        ],
        purpose:
          "PAN and a refund account are required before an earnest money deposit can be accepted, and are how a deposit is returned to an unsuccessful bidder. Card and UPI details are entered on the payment provider's own screen and never reach our servers.",
      },
      {
        category: "Location",
        items: ["Approximate location"],
        purpose:
          "Sorting listings by distance from you. Optional — declining it only removes the distance sort.",
        optional: true,
      },
      {
        category: "App activity",
        items: [
          "Saved listings and saved searches",
          "Site visit requests and expressions of interest",
        ],
        purpose: "Providing the features you asked for and alerting you to matches.",
      },
      {
        category: "Device identifiers",
        items: ["Push notification token"],
        purpose: "Alerting you to auction dates and deposit deadlines.",
        optional: true,
      },
    ],
    permissions: [
      {
        name: "Approximate location",
        why: "Sorting listings by distance. Optional — the app works fully without it.",
      },
      { name: "Internet", why: "Loading listings and submitting your requests." },
    ],
    sharedWith: [
      "The lending institution running an auction you register for, so it can verify your eligibility to bid.",
      "Our payment provider, which processes the deposit. Card and UPI details are handled entirely by that provider.",
    ],
    processors: ["google", "razorpay", "hosting"],
    retention:
      "Account data is kept while your account exists. Deposit and refund records are kept for as long as tax and financial-record rules require, which is longer than the account itself, and is why deleting an account does not delete those records.",
  },
];

/**
 * Demo and production are separate published apps, not one app promoted.
 *
 * The demonstration builds are shown to banks and used for staff training
 * indefinitely, so they must install alongside production rather than replace
 * it. That means separate package ids, separate store listings, and separate
 * OAuth clients — and therefore separate policy pages, since Google matches
 * the app name on the consent screen against the one on this page.
 */
const FIELD = 0;
const BUYER = 1;

export const APPS: AppEntry[] = [
  {
    ...BASE[FIELD],
    slug: "sarfez-field-demo",
    name: "Sarfez Field Demo",
    androidPackage: "com.calecutech.sarfez.demo.field",
    iosBundleId: "com.calecutech.sarfez.demo.field",
    isDemo: true,
  },
  {
    ...BASE[FIELD],
    slug: "sarfez-field",
    name: "Sarfez Field",
    androidPackage: "com.calecutech.sarfez.live.field",
    iosBundleId: "com.calecutech.sarfez.live.field",
    isDemo: false,
  },
  {
    ...BASE[BUYER],
    slug: "sarfez-auctions-demo",
    name: "Sarfez Auctions Demo",
    androidPackage: "com.calecutech.sarfez.demo.buyer",
    iosBundleId: "com.calecutech.sarfez.demo.buyer",
    isDemo: true,
  },
  {
    ...BASE[BUYER],
    slug: "sarfez-auctions",
    name: "Sarfez Auctions",
    androidPackage: "com.calecutech.sarfez.live.buyer",
    iosBundleId: "com.calecutech.sarfez.live.buyer",
    isDemo: false,
  },
];

export function appBySlug(slug: string): AppEntry | undefined {
  return APPS.find((a) => a.slug === slug);
}
