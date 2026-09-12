/**
 * Every word on the public recruitment page, in both languages, in one file.
 *
 * Why it is centralised
 * --------------------
 *  1. The font subsetter reads this file to decide which Malayalam glyphs to
 *     ship. Copy written anywhere else would render as blank boxes on a phone
 *     with no Malayalam font installed. See scripts/subset-malayalam.mjs.
 *  2. The page is a legal document as much as a marketing one. Commission
 *     terms, the "what we do not ask for" list and the CIN need to be reviewable
 *     in one place by someone who is not reading JSX.
 *
 * House rules for anything added here
 * -----------------------------------
 *  - NEVER state or imply an earnings figure. No "earn up to", no worked
 *    example, no monthly range. It is the biggest scam signal on a Kerala
 *    recruitment page and it is a legal exposure. The honest framing is below.
 *  - Malayalam is primary and complete. English is a secondary gloss, not the
 *    source of truth.
 *  - No urgency, no superlatives, no social proof.
 *
 * Placeholders are written as <<<LIKE THIS>>> and listed in the README. They
 * render visibly rather than silently, so nobody ships one by accident.
 */

export interface Bilingual {
  ml: string;
  en: string;
}

/** Marks a value the client has not supplied yet. */
export const PLACEHOLDER_PREFIX = "<<<";

export function isPlaceholder(value: string): boolean {
  return value.includes(PLACEHOLDER_PREFIX);
}

/* ------------------------------------------------------------- company */

/**
 * The INDIA-facing entity.
 *
 * Deliberately not the same company as src/lib/company.ts, which carries the
 * Wyoming LLC used by the international marketing site. India-facing surfaces
 * use the OPC; everything else uses the LLC. The two must not be merged — see
 * the note in src/lib/company.ts for why.
 */
export const company = {
  legalName: {
    ml: "കാലിക്യൂട്ട് ടെക്നോളജീസ് (ഒപിസി) പ്രൈവറ്റ് ലിമിറ്റഡ്",
    en: "Calecute Technologies (OPC) Private Limited",
  },
  /**
   * PLACEHOLDER — the real CIN from the MCA filing.
   *
   * This is the single highest-value element on the page: inviting a suspicious
   * visitor to verify the company themselves is something no scam does. It must
   * be correct, and it must never be invented.
   */
  cin: "<<<CIN>>>",
  city: { ml: "കോഴിക്കോട്, കേരളം", en: "Kozhikode, Kerala" },
  /** PLACEHOLDER — one sentence, what the company actually does. */
  whatWeDo: {
    ml: "<<<കമ്പനി എന്ത് ചെയ്യുന്നു എന്ന് ഒരു വാചകത്തിൽ>>>",
    en: "<<<ONE SENTENCE — what the company does>>>",
  },
  /** PLACEHOLDER — registered office address as filed. */
  registeredOffice: {
    ml: "<<<രജിസ്റ്റർ ചെയ്ത ഓഫീസ് വിലാസം>>>",
    en: "<<<REGISTERED OFFICE ADDRESS>>>",
  },
  email: "info@calecutech.com",
  /** PLACEHOLDER — a number a stranger can actually ring. */
  phone: "<<<CONTACT NUMBER>>>",
  /** PLACEHOLDER — the WhatsApp channel invite link. */
  whatsappChannel: "<<<WHATSAPP CHANNEL LINK>>>",
} as const;

/** Where a visitor checks the CIN for themselves. */
export const MCA_VERIFY_URL =
  "https://www.mca.gov.in/mcafoportal/viewCompanyMasterData.do";

/* --------------------------------------------------------------- page */

export const page = {
  title: {
    ml: "കേരളത്തിലുടനീളം കമ്മീഷൻ ഏജന്റുമാരെ ആവശ്യമുണ്ട്",
    en: "Commission agents wanted across Kerala",
  },

  role: {
    heading: { ml: "എന്താണ് ഈ ജോലി", en: "What the role is" },
    body: {
      ml: "ഞങ്ങളുടെ സോഫ്റ്റ്‌വെയർ ഉൽപ്പന്നങ്ങൾ വിൽക്കാൻ കേരളത്തിലുടനീളം കമ്മീഷൻ ഏജന്റുമാരെ ആവശ്യമുണ്ട്. ഓരോ പഞ്ചായത്തിലും പത്ത് ഏജന്റുമാർ.",
      en: "We are appointing commission agents across Kerala to sell our software products. Ten agents in each panchayat.",
    },
    note: {
      ml: "ഇത് ശമ്പളമുള്ള ജോലിയല്ല. നിങ്ങൾ കൊണ്ടുവരുന്ന ഉപഭോക്താക്കൾ പണം അടയ്ക്കുമ്പോൾ മാത്രമാണ് വരുമാനം.",
      en: "This is not a salaried job. You earn only when the customers you bring pay us.",
    },
  },

  commission: {
    heading: { ml: "കമ്മീഷൻ വ്യവസ്ഥകൾ", en: "Commission terms" },
    /**
     * Stated openly and in full. Full disclosure is the conversion mechanism
     * on this page — a visitor who has been shown the TDS deduction before
     * being asked for anything has been given a reason to believe the rest.
     * Do not soften, summarise or move these below the fold.
     */
    points: [
      {
        ml: "നിങ്ങൾ പരിചയപ്പെടുത്തിയ ഉപഭോക്താവ് അടയ്ക്കുന്ന ഓരോ തുകയുടെയും 10%",
        en: "10% of every payment the referred customer makes",
      },
      {
        ml: "ആ ഉപഭോക്താവ് പണം അടച്ചുകൊണ്ടിരിക്കുന്ന കാലത്തോളം",
        en: "For as long as that customer keeps paying",
      },
      {
        ml: "ജിഎസ്ടിയും പേയ്‌മെന്റ് ഗേറ്റ്‌വേ ചാർജുകളും കിഴിച്ചതിനു ശേഷമാണ് കണക്കാക്കുന്നത്",
        en: "Calculated after GST and payment gateway charges",
      },
      { ml: "മാസം തോറും നൽകും", en: "Paid monthly" },
      {
        ml: "ആദായനികുതി നിയമം സെക്ഷൻ 194H പ്രകാരം 2% ടിഡിഎസ് കുറയ്ക്കും",
        en: "TDS of 2% is deducted under Section 194H of the Income Tax Act",
      },
    ] as Bilingual[],
  },

  expectations: {
    heading: { ml: "എത്ര വരുമാനം കിട്ടും", en: "What you can expect to earn" },
    /**
     * The one place a reader looks for a number, and the one place we refuse to
     * give one. Saying so plainly is more credible than a figure would be.
     */
    body: {
      ml: "എത്ര രൂപ കിട്ടുമെന്ന് ഞങ്ങൾ പറയില്ല. അത് നിങ്ങൾ എത്ര ഉപഭോക്താക്കളെ കൊണ്ടുവരുന്നു, അവർ എത്ര കാലം തുടരുന്നു എന്നതിനെ ആശ്രയിച്ചിരിക്കും.",
      en: "We will not quote a figure. It depends on how many customers you bring and how long they keep paying.",
    },
    detail: {
      ml: "തുടക്കത്തിൽ വരുമാനം ചെറുതും പതുക്കെയുമായിരിക്കും. ഉപഭോക്താക്കൾ കൂടിവരുന്നതിനനുസരിച്ച് അത് സ്ഥിരമായ വരുമാനമായി മാറും. പെട്ടെന്ന് പണമുണ്ടാക്കാനുള്ള വഴിയല്ല ഇത്.",
      en: "In the beginning the income is small and slow. As customers accumulate it becomes steady. This is not a way to make money quickly.",
    },
  },

  background: {
    heading: { ml: "ആർക്കാണ് ഇത് ചേരുക", en: "Who this suits" },
    body: {
      ml: "അക്ഷയ കേന്ദ്രം നടത്തുന്നവർ, ഏജൻസി പ്രവൃത്തിപരിചയമുള്ളവർ, ദിവസവും ആളുകളുമായി ഇടപഴകുന്ന ജോലി ചെയ്യുന്നവർ.",
      en: "Akshaya centre operators, people with agency experience, and anyone whose work brings them into contact with the public every day.",
    },
    note: {
      ml: "ഇത് നിർബന്ധമായ യോഗ്യതയല്ല. ആർക്കും അപേക്ഷിക്കാം.",
      en: "These are preferences, not requirements. Anyone may apply.",
    },
  },

  notAsked: {
    heading: { ml: "ഞങ്ങൾ ചോദിക്കാത്തത്", en: "What we never ask you for" },
    points: [
      { ml: "രജിസ്ട്രേഷൻ ഫീസ് ഇല്ല", en: "No registration fee" },
      { ml: "നിക്ഷേപമോ ഡെപ്പോസിറ്റോ ഇല്ല", en: "No deposit" },
      {
        ml: "ഉൽപ്പന്നം വാങ്ങേണ്ടതില്ല",
        en: "No product purchase",
      },
      {
        ml: "രജിസ്റ്റർ ചെയ്യുമ്പോൾ പാൻ കാർഡോ ബാങ്ക് വിവരങ്ങളോ വേണ്ട",
        en: "No PAN card or bank details at signup",
      },
    ] as Bilingual[],
    panNote: {
      ml: "കമ്മീഷൻ പിൻവലിക്കാൻ സമയമാകുമ്പോൾ മാത്രമേ പാൻ ചോദിക്കൂ. അതുവരെ വേണ്ട.",
      en: "PAN is collected later, only when there is commission to withdraw. Not before.",
    },
  },

  verify: {
    heading: { ml: "ഞങ്ങൾ യഥാർത്ഥ കമ്പനിയാണോ?", en: "Is this a real company?" },
    body: {
      ml: "സ്വയം പരിശോധിക്കുക. ഞങ്ങളുടെ സിഐഎൻ താഴെ കൊടുത്തിട്ടുണ്ട്. കേന്ദ്ര സർക്കാരിന്റെ എംസിഎ വെബ്‌സൈറ്റിൽ അത് തിരഞ്ഞാൽ കമ്പനിയുടെ രജിസ്ട്രേഷൻ വിവരങ്ങൾ കാണാം.",
      en: "Check for yourself. Our CIN is below. Search it on the Government of India's MCA portal and you will see the company's registration details.",
    },
    linkLabel: {
      ml: "എംസിഎ വെബ്‌സൈറ്റിൽ സിഐഎൻ പരിശോധിക്കുക",
      en: "Verify the CIN on the MCA portal",
    },
  },

  availability: {
    heading: { ml: "ഒഴിവുള്ള സ്ഥാനങ്ങൾ", en: "Places available" },
    prompt: {
      ml: "ജില്ലയും പഞ്ചായത്തും തിരഞ്ഞെടുത്ത് എത്ര സ്ഥാനം ബാക്കിയുണ്ടെന്ന് നോക്കുക.",
      en: "Choose a district and panchayat to see how many places are left.",
    },
    full: {
      ml: "ഈ പഞ്ചായത്തിൽ സ്ഥാനങ്ങൾ നിറഞ്ഞു. വെയിറ്റിംഗ് ലിസ്റ്റിൽ ചേരാം.",
      en: "This panchayat is full. You can join the waiting list.",
    },
    closed: {
      ml: "ഈ പഞ്ചായത്തിൽ ഇപ്പോൾ അപേക്ഷ സ്വീകരിക്കുന്നില്ല.",
      en: "This panchayat is not accepting applications at the moment.",
    },
    noData: {
      ml: "പഞ്ചായത്ത് പട്ടിക ഇതുവരെ ചേർത്തിട്ടില്ല.",
      en: "The panchayat list has not been loaded yet.",
    },
  },

  signIn: {
    label: { ml: "ഗൂഗിൾ ഉപയോഗിച്ച് തുടരുക", en: "Continue with Google" },
    note: {
      ml: "നിങ്ങളുടെ ഗൂഗിൾ അക്കൗണ്ട് ഉപയോഗിച്ചാണ് രജിസ്റ്റർ ചെയ്യുന്നത്. പാസ്‌വേഡ് ഉണ്ടാക്കേണ്ടതില്ല.",
      en: "You register using your Google account. There is no password to create.",
    },
    cancelled: {
      ml: "സൈൻ ഇൻ റദ്ദാക്കി. വീണ്ടും ശ്രമിക്കാം.",
      en: "Sign-in was cancelled. You can try again.",
    },
    failed: {
      ml: "സൈൻ ഇൻ പൂർത്തിയായില്ല. വീണ്ടും ശ്രമിക്കുക.",
      en: "Sign-in did not complete. Please try again.",
    },
    suspended: {
      ml: "ഈ അക്കൗണ്ട് നിലവിൽ സജീവമല്ല. ഞങ്ങളെ ബന്ധപ്പെടുക.",
      en: "This account is not active. Please contact us.",
    },
    signedOut: { ml: "സൈൻ ഔട്ട് ചെയ്തു.", en: "You have been signed out." },
  },

  whatsapp: {
    heading: { ml: "വാട്‌സ്ആപ്പ് ചാനൽ", en: "WhatsApp channel" },
    body: {
      ml: "പുതിയ അറിയിപ്പുകൾ ഞങ്ങളുടെ വാട്‌സ്ആപ്പ് ചാനലിൽ ലഭിക്കും.",
      en: "Announcements are posted on our WhatsApp channel.",
    },
  },

  footer: {
    terms: { ml: "നിബന്ധനകൾ", en: "Terms" },
    privacy: { ml: "സ്വകാര്യതാ നയം", en: "Privacy policy" },
    contact: { ml: "ബന്ധപ്പെടുക", en: "Contact" },
  },
} as const;

/* ------------------------------------------------------------- signup */

export const signup = {
  step2Heading: { ml: "നിങ്ങളുടെ വിവരങ്ങൾ", en: "Your details" },
  step3Heading: {
    ml: "ഇത് നിർബന്ധമല്ല. തിരഞ്ഞെടുപ്പിൽ സഹായിക്കും.",
    en: "This is optional. It helps us choose.",
  },

  fields: {
    name: { ml: "പേര്", en: "Name" },
    mobile: { ml: "മൊബൈൽ നമ്പർ", en: "Mobile number" },
    district: { ml: "ജില്ല", en: "District" },
    localBody: { ml: "പഞ്ചായത്ത് / മുനിസിപ്പാലിറ്റി", en: "Panchayat / municipality" },
    ward: { ml: "വാർഡ്", en: "Ward" },
    occupation: { ml: "ഇപ്പോഴത്തെ ജോലി", en: "Occupation" },
    education: { ml: "വിദ്യാഭ്യാസം", en: "Education" },
    experience: { ml: "മുൻപരിചയം", en: "Previous experience" },
    hours: { ml: "ദിവസം എത്ര മണിക്കൂർ", en: "Hours available per day" },
    vehicle: { ml: "വാഹനം ഉണ്ടോ", en: "Do you have a vehicle" },
    computer: { ml: "കമ്പ്യൂട്ടർ പരിചയം", en: "Computer literacy" },
    reach: { ml: "ആരുമായി ബന്ധപ്പെടാൻ കഴിയും", en: "Who can you reach" },
  },

  hints: {
    mobileNotVerified: {
      ml: "ഇപ്പോൾ ഒടിപി അയയ്ക്കില്ല. പിന്നീട് പണം പിൻവലിക്കുമ്പോൾ മാത്രം പരിശോധിക്കും.",
      en: "No OTP is sent now. The number is verified later, when you set up payouts.",
    },
    wardOptional: {
      ml: "വാർഡ് നിർബന്ധമല്ല.",
      en: "Ward is optional.",
    },
    searchLocalBody: {
      ml: "പഞ്ചായത്തിന്റെ പേര് മലയാളത്തിലോ ഇംഗ്ലീഷിലോ എഴുതി തിരയാം.",
      en: "Search by name in Malayalam or English.",
    },
  },

  consent: {
    terms: {
      ml: "നിബന്ധനകളും സ്വകാര്യതാ നയവും ഞാൻ വായിച്ച് അംഗീകരിക്കുന്നു.",
      en: "I have read and accept the terms and the privacy policy.",
    },
    duplicateWarning: {
      ml: "ഒരാൾക്ക് ഒരു അക്കൗണ്ട് മാത്രം. ഒരേ പാൻ ഉപയോഗിച്ച് ഒന്നിലധികം അക്കൗണ്ട് ഉണ്ടാക്കിയാൽ അവ റദ്ദാക്കുകയും ആ കമ്മീഷൻ നഷ്ടപ്പെടുകയും ചെയ്യും.",
      en: "One account per person. If several accounts share a PAN, the duplicates are cancelled and any commission accrued on them is forfeited.",
    },
  },

  submit: { ml: "അപേക്ഷ അയയ്ക്കുക", en: "Submit application" },
  skip: { ml: "ഒഴിവാക്കി തുടരുക", en: "Skip this" },
  save: { ml: "സേവ് ചെയ്യുക", en: "Save" },

  success: {
    heading: { ml: "അപേക്ഷ ലഭിച്ചു", en: "Application received" },
    body: {
      ml: "നിങ്ങളുടെ ഏജന്റ് കോഡ് താഴെ കൊടുത്തിരിക്കുന്നു. അപേക്ഷ പരിശോധിച്ച ശേഷം ഞങ്ങൾ ബന്ധപ്പെടും.",
      en: "Your agent code is below. We will get in touch after reviewing your application.",
    },
  },
} as const;

/* ------------------------------------------------ option lists (bilingual) */

export const educationOptions: Array<{ value: string } & Bilingual> = [
  { value: "SSLC", ml: "എസ്എസ്എൽസി", en: "SSLC" },
  { value: "PLUS_TWO", ml: "പ്ലസ് ടു", en: "Plus Two" },
  { value: "DEGREE", ml: "ബിരുദം", en: "Degree" },
  { value: "PG", ml: "ബിരുദാനന്തര ബിരുദം", en: "Postgraduate" },
  { value: "DIPLOMA", ml: "ഡിപ്ലോമ", en: "Diploma" },
  { value: "ITI", ml: "ഐടിഐ", en: "ITI" },
  { value: "OTHER", ml: "മറ്റുള്ളവ", en: "Other" },
];

export const experienceOptions: Array<{ value: string } & Bilingual> = [
  { value: "INSURANCE_AGENCY", ml: "ഇൻഷുറൻസ് ഏജൻസി", en: "Insurance agency" },
  { value: "AKSHAYA_CSC", ml: "അക്ഷയ / സിഎസ്‌സി", en: "Akshaya / CSC" },
  { value: "MARKETING_SALES", ml: "മാർക്കറ്റിംഗ് / സെയിൽസ്", en: "Marketing / sales" },
  { value: "BANKING_FINANCE", ml: "ബാങ്കിംഗ് / ഫിനാൻസ്", en: "Banking / finance" },
  { value: "BUSINESS_SHOP", ml: "സ്വന്തം കട / ബിസിനസ്", en: "Business / shop" },
  { value: "NONE", ml: "ഒന്നുമില്ല", en: "None" },
];

export const hoursOptions: Array<{ value: string } & Bilingual> = [
  { value: "ONE", ml: "ഒരു മണിക്കൂർ", en: "1 hour" },
  { value: "TWO_TO_THREE", ml: "രണ്ട് മുതൽ മൂന്ന് വരെ", en: "2 to 3 hours" },
  { value: "FOUR_PLUS", ml: "നാലോ അതിലധികമോ", en: "4 or more" },
  { value: "FULL_TIME", ml: "മുഴുവൻ സമയം", en: "Full time" },
];

export const computerOptions: Array<{ value: string } & Bilingual> = [
  { value: "YES", ml: "ഉണ്ട്", en: "Yes" },
  { value: "BASIC", ml: "അടിസ്ഥാന പരിചയം", en: "Basic" },
  { value: "NO", ml: "ഇല്ല", en: "No" },
];

export const reachOptions: Array<{ value: string } & Bilingual> = [
  { value: "BANK_EMPLOYEES", ml: "ബാങ്ക് ജീവനക്കാർ", en: "Bank employees" },
  { value: "CONTRACTORS", ml: "കരാറുകാർ", en: "Contractors" },
  { value: "STUDENTS", ml: "വിദ്യാർത്ഥികൾ", en: "Students" },
  { value: "SHOP_OWNERS", ml: "കടയുടമകൾ", en: "Shop owners" },
  { value: "GOVERNMENT_OFFICES", ml: "സർക്കാർ ഓഫീസുകൾ", en: "Government offices" },
  { value: "OTHERS", ml: "മറ്റുള്ളവർ", en: "Others" },
];

export const yesNoOptions: Array<{ value: string } & Bilingual> = [
  { value: "yes", ml: "ഉണ്ട്", en: "Yes" },
  { value: "no", ml: "ഇല്ല", en: "No" },
];
