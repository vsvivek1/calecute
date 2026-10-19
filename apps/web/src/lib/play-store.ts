/**
 * Which of our apps are on Google Play, and the short, search-friendly
 * description each one carries wherever the site lists our products.
 *
 * To mark an app as live once its Play listing is in production, add its
 * package id to LIVE_ON_PLAY. Every badge on the site then switches from
 * "Coming soon" to the official "Get it on Google Play" badge linking to the
 * listing. Nothing else needs to change.
 */

/** Package ids whose Play listing is public (production track). */
export const LIVE_ON_PLAY = new Set<string>([
  "com.calecutech.goldlelam", // Bankers Gold
  "com.calecutech.quizkerala",
]);

export function playStoreUrl(androidPackage: string): string {
  return `https://play.google.com/store/apps/details?id=${androidPackage}`;
}

/** The Play URL when the app is live, otherwise null (show "Coming soon"). */
export function livePlayUrl(androidPackage?: string): string | null {
  return androidPackage && LIVE_ON_PLAY.has(androidPackage) ? playStoreUrl(androidPackage) : null;
}

export type ProductCategory = "Learning" | "Banking and finance" | "Everyday life" | "Business" | "Culture and astrology";

export type PlayProduct = {
  name: string;
  /** The app's page on this site. */
  href: string;
  /** True when href is a static site under public/, so it needs a plain <a>. */
  native?: boolean;
  image?: string;
  /** Unset where the package id has not been fixed yet; the badge then reads "Coming soon". */
  androidPackage?: string;
  category: ProductCategory;
  /** One or two plain sentences: what it is, who it is for, the words people search with. */
  description: string;
  /** Extra search terms for the app's page metadata. */
  keywords: string[];
};

export const PLAY_PRODUCTS: PlayProduct[] = [
  // Learning
  {
    name: "QuizKerala",
    href: "/quizkerala",
    image: "/quizkerala/logo-192.png",
    androidPackage: "com.calecutech.quizkerala",
    category: "Learning",
    description:
      "Timed online quizzes for Kerala schools, colleges and clubs. Players join with a code, answer once, and watch a live leaderboard rank them by score and speed.",
    keywords: ["online quiz app", "quiz competition Kerala", "school quiz", "live leaderboard", "GK quiz Malayalam"],
  },
  {
    name: "Recallio: Kerala PSC",
    href: "/apps/recallio",
    image: "/recallio/icon.png",
    androidPackage: "com.calecutech.recallio",
    category: "Learning",
    description:
      "Kerala PSC exam preparation in five minutes a day. The syllabus comes as short fact cards with spaced repetition, so every fact returns just before you would forget it.",
    keywords: ["Kerala PSC app", "PSC preparation", "PSC study app", "spaced repetition", "Kerala PSC questions"],
  },
  {
    name: "Recallio: USS Kerala Exam Prep",
    href: "/uss-recallio",
    native: true,
    image: "/uss-recallio/assets/logo-256.png",
    androidPackage: "com.calecutech.ussrecallio",
    category: "Learning",
    description:
      "Daily study cards for the Kerala Class 7 USS scholarship exam, in Malayalam and English, built from the SCERT textbooks and revised at the right time.",
    keywords: ["USS exam", "USS scholarship Kerala", "Class 7 USS questions", "USS model questions"],
  },
  {
    name: "Recallio: LSS Kerala Exam Prep",
    href: "/lss-recallio",
    native: true,
    image: "/lss-recallio/assets/logo.svg",
    androidPackage: "com.calecutech.lssrecallio",
    category: "Learning",
    description:
      "Daily study cards for the Kerala Class 4 LSS scholarship exam, in Malayalam and English, short enough for a young child to finish every day.",
    keywords: ["LSS exam", "LSS scholarship Kerala", "Class 4 LSS questions", "LSS model questions"],
  },
  {
    name: "Recallio: Plus One Science",
    href: "/plus-one-science",
    native: true,
    image: "/plus-one-science/assets/logo.svg",
    category: "Learning",
    description:
      "Kerala Higher Secondary Plus One Science revision: physics, chemistry, biology and maths as short daily cards in Malayalam and English.",
    keywords: ["Plus One Science", "Kerala HSE", "Plus One notes", "Plus One exam preparation"],
  },
  {
    name: "Recallio: Plus Two Science",
    href: "/plus-two-science",
    native: true,
    image: "/plus-two-science/assets/logo.svg",
    category: "Learning",
    description:
      "Kerala Higher Secondary Plus Two Science revision for the board exam and entrance prep, as short daily cards in Malayalam and English.",
    keywords: ["Plus Two Science", "Kerala HSE", "Plus Two notes", "Plus Two board exam"],
  },
  {
    name: "Geological Assistant Prep",
    href: "/geological-assistant",
    native: true,
    image: "/geological-assistant/assets/logo.svg",
    androidPackage: "com.calecutech.geologicalassistant",
    category: "Learning",
    description:
      "The complete Kerala PSC Geological Assistant (Ground Water Department) syllabus: fact cards, practice questions, previous papers and timed mock tests.",
    keywords: ["Geological Assistant Kerala PSC", "Ground Water Department exam", "geology PSC questions"],
  },

  // Banking and finance
  {
    name: "Bankers Gold",
    href: "/bankers-gold",
    image: "/bankers-gold/icon.png",
    androidPackage: "com.calecutech.goldlelam",
    category: "Banking and finance",
    description:
      "Bank gold loan auctions on your phone. Browse the lots a bank has listed, pay the EMD online and bid live, while the bank keeps full control of its auction.",
    keywords: ["gold auction app", "bank gold auction", "gold loan auction Kerala", "online gold bidding", "EMD payment"],
  },
  {
    name: "BankMates",
    href: "/apps/bankmates",
    image: "/bankmates/icon.png",
    androidPackage: "com.calecutech.bankmates",
    category: "Banking and finance",
    description:
      "An app for Indian bank staff: offline EMI, FD, RD, SIP and staff loan calculators, JAIIB and CAIIB notes, and a doubts space shared only with colleagues at the same bank.",
    keywords: ["bank employee app", "JAIIB CAIIB notes", "EMI calculator", "FD RD calculator", "banker app India"],
  },
  {
    name: "Sarfez Auctions",
    href: "/apps/sarfez-auctions",
    androidPackage: "com.calecutech.sarfez.live.buyer",
    category: "Banking and finance",
    description:
      "Find bank auction properties under the SARFAESI Act. Search, save and track listings, register interest and pay the earnest money deposit to bid.",
    keywords: ["bank auction property", "SARFAESI auction", "e-auction property India", "bank repossessed property"],
  },
  {
    name: "Sarfez Field",
    href: "/apps/sarfez-field",
    androidPackage: "com.calecutech.sarfez.live.field",
    category: "Banking and finance",
    description:
      "SARFAESI possession made orderly for bank officers: property schedule, GPS pin, the statutory photo set, movable inventory and a witnessed panchnama in one report.",
    keywords: ["SARFAESI possession app", "bank recovery officer", "panchnama app", "asset inspection"],
  },

  // Everyday life
  {
    name: "Find My Bus",
    href: "/findmybus",
    native: true,
    image: "/findmybus/assets/logo-192.png",
    androidPackage: "com.calecutech.findmybus",
    category: "Everyday life",
    description:
      "Live bus tracking for Kerala. See private and city buses on a map, and bus owners share their location free from any phone.",
    keywords: ["live bus tracking Kerala", "private bus timing", "bus tracker app", "where is my bus"],
  },
  {
    name: "Work Force",
    href: "/apps/workforce",
    image: "/workforce/icon.png",
    androidPackage: "com.calecutech.workforce",
    category: "Everyday life",
    description:
      "Find local workers near you, from electricians and plumbers to painters, and call or WhatsApp them directly. No middleman and no commission.",
    keywords: ["local workers near me", "find electrician plumber", "daily wage workers Kerala", "hire workers app"],
  },
  {
    name: "Voffer",
    href: "/voffer",
    native: true,
    image: "/voffer/assets/icon-192.png",
    androidPackage: "com.calecutech.voffer",
    category: "Everyday life",
    description:
      "Fresh, time-limited offers from shops and cafés near you. Reserve a deal in the app and pay at the counter.",
    keywords: ["offers near me", "local shop deals", "discount app Kerala", "cafe offers"],
  },
  {
    name: "KSEBEA Engineers Association",
    href: "/apps/ksebea",
    androidPackage: "com.calecutech.ksebea",
    category: "Everyday life",
    description:
      "The KSEB Engineers' Association member app: unit office bearers and activities, association news and the Hydel Bullet, membership dues and grievances.",
    keywords: ["KSEBEA", "KSEB engineers association", "Hydel Bullet", "association membership app"],
  },

  // Business
  {
    name: "Doplando",
    href: "/doplando",
    native: true,
    image: "/doplando/assets/icon-192.png",
    androidPackage: "com.calecutech.doplando",
    category: "Business",
    description:
      "A task planner and team workspace for individuals, families and offices. Plan tasks, assign them and keep everyone in step on the web and on Android.",
    keywords: ["task planner app", "team task manager", "to do list app", "office work planner"],
  },
  {
    name: "FPO: Farm Connect",
    href: "/farmconnect",
    native: true,
    image: "/farmconnect/assets/icon-192.png",
    androidPackage: "com.calecutech.farmconnect",
    category: "Business",
    description:
      "A digital mall for Kerala's farmers. Every farmer and FPO opens their own shop, and buyers order fresh produce straight from the farm.",
    keywords: ["farmer producer organisation", "buy from farmers Kerala", "FPO app", "farm fresh online"],
  },
  {
    name: "spareX",
    href: "/sparex",
    native: true,
    image: "/sparex/assets/icon-192.png",
    androidPackage: "com.calecutech.sparex",
    category: "Business",
    description:
      "A marketplace for second-hand vehicle spare parts, scrap vehicles and workshops across Kerala.",
    keywords: ["used spare parts Kerala", "second hand car parts", "scrap vehicle", "vehicle workshop near me"],
  },
  {
    name: "DentalMart",
    href: "/dentalmart",
    native: true,
    image: "/dentalmart/assets/icon-192.png",
    androidPackage: "com.calecutech.dentalmart",
    category: "Business",
    description:
      "A B2B marketplace where dental clinics buy implants and supplies directly from manufacturers, wholesalers and distributors.",
    keywords: ["dental supplies online", "dental implants India", "dental B2B marketplace", "clinic supplies"],
  },

  // Culture and astrology
  {
    name: "Grahanila: Kerala Astrology",
    href: "/jathakam",
    native: true,
    image: "/jathakam/assets/icon-192.png",
    androidPackage: "com.calecute.jathakam",
    category: "Culture and astrology",
    description:
      "Kerala-style jathakam (birth chart), marriage porutham and muhurtham, with the classical text named behind every reading.",
    keywords: ["jathakam Malayalam", "horoscope matching", "porutham", "Kerala astrology app"],
  },
  {
    name: "Muhurtham Clock",
    href: "/muhurtham-clock",
    native: true,
    image: "/muhurtham-clock/assets/icon-192.png",
    androidPackage: "com.calecutech.muhurthamclock",
    category: "Culture and astrology",
    description:
      "The Kerala panchangam as a live clock: Rahu kalam, Gulika kalam, Yamagandam, the running hora, Abhijit and Brahma muhurtham for your town on one dial.",
    keywords: ["Rahu kalam today", "panchangam Malayalam", "muhurtham time", "Gulika kalam"],
  },
  {
    name: "Ramayanam Wallpapers",
    href: "/ramayanam",
    native: true,
    image: "/ramayanam/assets/icon-192.png",
    androidPackage: "com.calecutech.ramayanam",
    category: "Culture and astrology",
    description:
      "A new Ramayana painting and its story as your phone wallpaper every day, ideal for the Ramayana month of Karkidakam.",
    keywords: ["Ramayana wallpaper", "Ramayanam Malayalam", "Karkidakam Ramayana masam", "Hindu wallpaper"],
  },
  {
    name: "Bhagavatham Wallpapers",
    href: "/bhagavatham",
    native: true,
    image: "/bhagavatham/assets/icon-192.png",
    androidPackage: "com.calecutech.bhagavatham",
    category: "Culture and astrology",
    description:
      "A new Bhagavatam painting and its story as your phone wallpaper every day, from Krishna's childhood to the Gita.",
    keywords: ["Bhagavatam wallpaper", "Krishna wallpaper", "Bhagavatham Malayalam", "devotional wallpaper"],
  },
];

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  "Learning",
  "Banking and finance",
  "Everyday life",
  "Business",
  "Culture and astrology",
];

export function productByHref(href: string): PlayProduct | undefined {
  return PLAY_PRODUCTS.find((p) => p.href === href);
}
