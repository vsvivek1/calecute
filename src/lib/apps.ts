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

/** A section of an app-specific terms of service. */
export type TermsSection = { heading: string; body: string[] };

export type AppTerms = {
  updated: string;
  intro: string;
  sections: TermsSection[];
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

  /**
   * Plain description of what the app does, for the overview page. Falls back
   * to the privacy purposes when absent — those read as disclosures rather
   * than features, so a consumer-facing app should set this.
   */
  features?: string[];
  /** Date the app's own disclosures last changed. */
  policyUpdated: string;
  /** How the privacy page names the backend the app talks to. */
  serviceName: string;
  /** The lawful basis on which we hold the data. */
  lawfulBasis: string;
  /** Sign-in troubleshooting, for the support page. */
  signInHelp: string;
  /** The app-specific sentence closing the Security section. */
  securityNote: string;
  /** What the user should quote so we can find their account for deletion. */
  deleteIdentifier: string;
  /** What deleting the account removes. */
  deletes: string[];
  /** What survives deletion, and why. Supports **bold**. */
  retainsOnDelete: string;
  /** Overrides DEFAULT_NOT_COLLECTED where an app's hardware use differs. */
  notCollected?: string[];
  /** App-specific terms. Apps without this simply have no terms page. */
  terms?: AppTerms;
};

/**
 * The baseline "what we do not collect" list. An app that uses different
 * hardware — or none — overrides it via `notCollected`.
 */
export const DEFAULT_NOT_COLLECTED = [
  "We do not collect your contacts, calendar, call logs or SMS.",
  "We do not track you across other apps or websites.",
  "We do not use advertising identifiers and show no advertising.",
  "We do not record audio or use the camera except at the moment you tap to capture something.",
  "We never receive your Google password, and — where the app takes payments — never your card, UPI or netbanking credentials.",
];

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
  fcm: [
    {
      name: "Firebase Cloud Messaging (Google LLC)",
      role: "Delivers push notifications to your device. It receives the notification text and your device's push token. It is not used to sign you in and holds none of your app data.",
      policy: "https://firebase.google.com/support/privacy",
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
    policyUpdated: "September 4, 2026",
    serviceName: "the Sarfez service",
    lawfulBasis:
      "We process this data on the instructions of the lending institution that assigned the visit, so that it can discharge obligations placed on it by the SARFAESI Act, 2002. That institution is the data fiduciary; we are its processor.",
    signInHelp:
      "Credentials are issued by the bank you work for, not by us. If you cannot sign in, contact your branch IT helpdesk first — we cannot create or reset officer accounts.",
    securityNote: "An officer or buyer can only reach records belonging to them.",
    deleteIdentifier: "the mobile number or employee ID you sign in with",
    deletes: [
      "Your officer profile, contact details, and preferences",
      "Your sign-in credentials and any active sessions",
      "Your push notification token",
    ],
    retainsOnDelete:
      "Possession reports you submitted are **not** deleted. They are statutory records belonging to the lending institution that assigned the visit, not to us — a possession panchnama cannot be withdrawn because the officer who recorded it left. Your name stays attached to them as the recording officer. Requests about those records go to that institution.",
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
    policyUpdated: "September 4, 2026",
    serviceName: "the Sarfez service",
    lawfulBasis:
      "We process your data to provide the service you asked for — searching listings, registering interest, and completing a deposit — and, for deposit and refund records, to meet obligations under Indian financial and tax law. You give consent when you create an account, and you may withdraw it by deleting the account.",
    signInHelp:
      "Sign in with your mobile number or a Google account. If a one-time code does not arrive, check the number and try again after a minute.",
    securityNote: "An officer or buyer can only reach records belonging to them.",
    deleteIdentifier: "the mobile number or employee ID you sign in with",
    deletes: [
      "Your name, phone number, email, and Google profile data",
      "Your PAN and refund account details",
      "Saved listings, saved searches, and alerts",
      "Site visit requests and expressions of interest",
      "Your push notification token and any active sessions",
    ],
    retainsOnDelete:
      "Records of any earnest money deposit you paid or had refunded are **not** deleted. Financial and tax law requires them to be retained, and the bank running the auction needs them to show who was eligible to bid. They are kept for the period the law requires and then removed.",
  },
  {
    tagline: "Calculators, JAIIB and CAIIB notes, and a circle scoped to your own bank",
    audience:
      "Employees of Indian banks — public sector, private, regional rural, co-operative, small finance and payments banks, and the regulators and development finance institutions. Anyone may install it; the community features require you to identify the bank you work at.",
    summary:
      "BankMates gives bank staff a set of financial calculators that run entirely on the phone, study material for the IIBF's JAIIB and CAIIB certifications, and a question-and-answer space that is visible only to colleagues at the same bank.",
    collects: [
      {
        category: "Personal identifiers",
        items: [
          "Name, email address and profile picture, from Google Sign-In",
        ],
        purpose:
          "Creating your account and showing colleagues who wrote a post. We never see your Google password.",
      },
      {
        category: "Personal identifiers",
        items: [
          "The bank you work at",
          "Branch or office, designation, and grade or scale",
        ],
        purpose:
          "The bank you choose decides which colleagues you can see and who can see you — it is the boundary the whole community sits inside. Grade decides whether you can post Tips. Branch, designation and grade are optional and you can leave them blank.",
      },
      {
        category: "Messages and other user-generated content",
        items: [
          "Doubts you ask and replies you write",
          "Tips you post, and the tips you like",
          "Messages you send to colleagues at your bank",
          "Reports you file about someone else's post",
        ],
        purpose:
          "Showing your posts to colleagues at your bank, and reviewing anything that gets reported. Please do not put customer information, account numbers or anything your bank treats as confidential into a post — this is a staffroom, not a banking system.",
      },
      {
        category: "Personal identifiers",
        items: ["Email addresses of colleagues you invite"],
        purpose:
          "Sending a single invitation and recording whether it was accepted, so your referral count is accurate. See the section below on people who do not use the app.",
        optional: true,
      },
      {
        category: "App activity",
        items: [
          "Which coaching chapters you have opened and marked as read",
          "Which calculator you opened, and when",
        ],
        purpose:
          "Showing your reading progress, and telling us which calculators are worth improving. The numbers you type into a calculator are never part of this — see below.",
        optional: true,
      },
      {
        category: "Device identifiers",
        items: ["Push notification token"],
        purpose:
          "Delivering a notification when someone answers your doubt, a tip is posted at your bank, or a colleague joins through your invitation.",
        optional: true,
      },
    ],
    permissions: [
      {
        name: "Internet",
        why: "Signing in, and loading coaching content and your bank's doubts and tips. The calculators need no connection at all.",
      },
      {
        name: "Notifications",
        why: "Telling you about replies, new tips and accepted invitations. Optional — declining it costs you nothing but the alerts.",
      },
    ],
    sharedWith: [
      "Other BankMates users who have identified themselves as working at the same bank as you. They see your name, profile picture, branch, designation and grade, and anything you post. Nobody at a different bank can see any of it — every request for a doubt, a tip or a message is filtered by your bank on our servers, and the app has no way to ask for another bank's content.",
      "Nobody else. We do not share your data with your employer as an organisation, and identifying your bank does not give it access to your account or your posts.",
    ],
    processors: ["google", "fcm", "hosting"],
    retention:
      "Your account and its content are kept while the account exists. A post you delete is hidden immediately and removed within 30 days; we keep it briefly so a report filed against it can still be reviewed. Invitation records are kept while your account exists, because they are what your referral count is computed from.",
    thirdPartyData:
      "When you invite a colleague by email, you give us that person's address. We use it once, to send a single invitation naming you as the sender, and we record whether it was accepted. We never send a reminder, never add the address to a mailing list, and never share it. If someone does not accept, their address is removed when you delete your account, and sooner on request to the address below. Only invite people you actually know and who would expect to hear from you.",
    features: [
      "Five financial calculators built for how bank books actually work: a two-phase staff loan with a separate interest account, SIP, FD and RD on the quarterly-compounding convention Indian banks use, reducing-balance EMI with a full amortisation schedule, and a SARFAESI notice timeline.",
      "Every calculator runs entirely on the phone. They work with no signal, and the figures you type never leave the device.",
      "Study material for the IIBF's JAIIB and CAIIB certifications, organised by paper, module and chapter, with end-of-chapter self-checks. Anything you open is cached for reading offline.",
      "A question-and-answer space visible only to colleagues at the same bank you identified, plus tips posted by officers.",
      "Invite colleagues by email or WhatsApp, and see how many joined through you.",
    ],
    policyUpdated: "September 6, 2026",
    serviceName: "the BankMates service",
    lawfulBasis:
      "We process your data to provide the service you asked for — an account, your bank's doubts and tips, and your coaching progress. You give consent when you create an account, and you may withdraw it at any time by deleting the account. We rely on the same consent for invitations you choose to send.",
    signInHelp:
      "BankMates uses Google Sign-In only. If sign-in fails, check that the Google account has a verified email address — we cannot create an account without one. We cannot reset a Google password; that is done at myaccount.google.com. Your bank is set once during sign-up and can only be changed by writing to us, because your posts live inside that bank's circle.",
    securityNote:
      "Doubts, tips and messages are filtered by your bank on the server, not in the app, so a device cannot request another bank's content even if it is tampered with. Sign-in tokens are held in the device keychain or Android keystore, never in ordinary app storage.",
    deleteIdentifier: "the Google account you sign in with",
    deletes: [
      "Your name, email address, profile picture, and the bank, branch, designation and grade on your profile",
      "The doubts, replies and tips you posted, and your likes",
      "Messages you sent to colleagues",
      "Your coaching progress and calculator usage records",
      "Invitations you sent that were never accepted",
      "Your push notification token and any active sessions",
    ],
    retainsOnDelete:
      "Where a colleague already replied to a doubt you asked, the thread is **not** removed wholesale — your question is anonymised rather than deleted, so their answer does not lose its context for everyone else at your bank. Nothing identifying you remains attached to it. Records of invitations that were accepted are kept in a form that no longer names the person invited, because another user's referral count depends on them.",
    notCollected: [
      "We do not collect your contacts, calendar, call logs or SMS.",
      "We do not track you across other apps or websites.",
      "We do not use advertising identifiers and show no advertising.",
      "The app never asks for camera, microphone, location or file access, because it does not use them.",
      "The figures you enter into any calculator — loan amounts, salaries, deposits, dates — are worked out on your phone and are never sent to us. We record only that a calculator was opened.",
      "We never receive your Google password.",
    ],
    terms: {
      updated: "September 6, 2026",
      intro:
        "These terms apply to the BankMates app and cover the things a general terms page cannot: what its calculators are and are not, what the coaching content is, and what may and may not be posted in a space shared with your colleagues. Where they differ from our general terms of service, these take precedence for BankMates.",
      sections: [
        {
          heading: "Who may use BankMates",
          body: [
            "You must be at least 18 and an employee, retired employee, or trainee of a bank or financial institution in India. You identify your own employer during sign-up; we do not verify it with your bank, and you must not claim to work somewhere you do not.",
            "Your account is yours alone. Do not share your sign-in with anyone, including a colleague.",
          ],
        },
        {
          heading: "Calculator results are estimates, not your bank's figures",
          body: [
            "Every calculator in BankMates is an independent illustration. It is **not** a quotation, sanction, statement of account, or any other official figure, and it does not come from your bank or from any bank.",
            "Interest conventions differ between institutions and between products — rounding, day-count, the balance a month's interest is charged on, when a rate reset applies. We have implemented the conventions described in the app, and we state them on each screen so you can check them. Your employer's own system is the authority on what any borrower or depositor actually owes or receives.",
            "Do not use a BankMates figure to quote a rate to a customer, to answer a customer's query about their own account, or in any document that leaves your branch. Check it against your core banking system first.",
            "We are not liable for any loss arising from reliance on a calculator output.",
          ],
        },
        {
          heading: "The SARFAESI timeline tool in particular",
          body: [
            "The SARFAESI screen projects dates from statutory periods that are printed on screen with the section or rule each comes from. Those periods are shown so you can verify them; they are **not** legal advice and have not been settled by counsel for this app.",
            "Every period is editable precisely because you should not accept ours without checking. A recovery action taken on a wrong date can be set aside. Confirm each date against the Act, the current rules, any applicable court direction, and your bank's own recovery policy before acting.",
          ],
        },
        {
          heading: "Coaching content",
          body: [
            "The JAIIB and CAIIB material in BankMates is independent study material. We are **not** affiliated with, endorsed by, or connected to the Indian Institute of Banking and Finance, and BankMates is not an official IIBF study resource. JAIIB, CAIIB and IIBF are the marks of their respective owners and are used here only to describe what the material covers.",
            "Chapters marked as drafts are unfinished and should not be relied on for an examination. The syllabus is set by IIBF and changes; check the current syllabus on their site before you sit a paper.",
            "We do not promise that using BankMates will help you pass anything.",
          ],
        },
        {
          heading: "Your bank's circle, and what must not be posted",
          body: [
            "Doubts, tips and messages are visible to other BankMates users who have identified the same employer as you. Treat that as a staffroom conversation among people you have not met, because that is what it is — we do not verify anyone's employment.",
            "You must **not** post customer or borrower information of any kind. That includes names, account numbers, loan account numbers, CIF or customer IDs, PAN, Aadhaar, balances, transaction details, contact details, and any document or screenshot containing them. Ask your question in general terms.",
            "You must also not post anything your employer classifies as confidential or internal — unreleased circulars, internal audit findings, security procedures, credentials, or system screenshots.",
            "Your bank's own service conduct rules, IT policy and confidentiality obligations continue to apply to what you write here. Nothing in BankMates overrides them, and we cannot shield you from the consequences of breaching them.",
            "Also out of bounds: harassment, abuse, communal or casteist content, content targeting a colleague, spam, recruitment or sales pitches, and anything unlawful.",
          ],
        },
        {
          heading: "Content you post",
          body: [
            "You keep ownership of what you write. You give us permission to store it and show it to colleagues at your bank so the app can work, and to keep a copy briefly after deletion so a report against it can be reviewed.",
            "Anyone can report a post. We may hide or remove content, and suspend or close an account, where a post breaks these terms — including where it exposes customer information, which we will act on quickly and without waiting for a report.",
            "Tips can be posted by users who identify themselves as officers or executives. That is a self-declared field, not something we verify, and a tip carries no authority beyond the person who wrote it.",
            "Advice from a colleague is a colleague's opinion. It is not your bank's position, and it is not ours.",
          ],
        },
        {
          heading: "Invitations",
          body: [
            "Only invite people you know and who would expect to hear from you. Each address receives one invitation and no reminders.",
            "Do not enter addresses from a customer list, a directory, or anywhere else you have not been given the address personally. Accounts used to send bulk or unsolicited invitations will be closed.",
          ],
        },
        {
          heading: "Availability, and ending your account",
          body: [
            "BankMates is provided as it is. We do not guarantee it will be available without interruption, and we may change or withdraw features. The calculators are designed to keep working offline; the rest of the app needs a connection.",
            "You can delete your account at any time — see the account deletion page. We may suspend or close an account that breaks these terms, and will tell you why unless we are prevented from doing so.",
          ],
        },
        {
          heading: "Liability",
          body: [
            "To the extent the law allows, we are not liable for indirect or consequential loss, for loss of profit or opportunity, or for any loss arising from reliance on a calculator output, on coaching content, or on advice given by another user.",
            "Nothing here limits liability that cannot be limited by law.",
          ],
        },
        {
          heading: "Governing law",
          body: [
            "These terms are governed by the laws of India, and the courts at Kozhikode, Kerala have jurisdiction.",
          ],
        },
      ],
    },
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
const BANKMATES = 2;

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
  {
    ...BASE[BANKMATES],
    slug: "bankmates",
    name: "BankMates",
    androidPackage: "com.calecutech.bankmates",
    iosBundleId: "com.calecutech.bankmates",
    isDemo: false,
  },
];

export function appBySlug(slug: string): AppEntry | undefined {
  return APPS.find((a) => a.slug === slug);
}
