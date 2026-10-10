/**
 * Apps whose policy pages are plain static sites under public/<slug>/ (built in
 * their own repos and copied in by each repo's web/publish_to_calecutech.py).
 * They are not in APPS because their pages are hand-designed, not generated
 * from lib/apps.ts. Listed here so /apps can show them next to the rest.
 */
export type StaticApp = {
  name: string;
  tagline: string;
  href: string;
  image: string;
};

export const STATIC_APPS: StaticApp[] = [
  {
    name: "Recallio: USS Kerala Exam Prep",
    tagline: "Class 7 USS scholarship exam prep",
    href: "/uss-recallio",
    image: "/uss-recallio/assets/logo-256.png",
  },
  {
    name: "Recallio: LSS Kerala Exam Prep",
    tagline: "Class 4 LSS scholarship exam prep",
    href: "/lss-recallio",
    image: "/lss-recallio/assets/logo.svg",
  },
  {
    name: "Recallio: Plus One Science",
    tagline: "Kerala Higher Secondary Plus One Science",
    href: "/plus-one-science",
    image: "/plus-one-science/assets/logo.svg",
  },
  {
    name: "Recallio: Plus Two Science",
    tagline: "Kerala Higher Secondary Plus Two Science",
    href: "/plus-two-science",
    image: "/plus-two-science/assets/logo.svg",
  },
  {
    name: "Geological Assistant Prep",
    tagline: "Kerala PSC Geological Assistant (Ground Water Dept) exam prep",
    href: "/geological-assistant",
    image: "/geological-assistant/assets/logo.svg",
  },
  {
    name: "Find My Bus",
    tagline: "Live bus tracking for riders and bus owners",
    href: "/findmybus",
    image: "/findmybus/assets/logo-192.png",
  },
  {
    name: "Grahanila: Kerala Astrology",
    tagline: "Jathakam, porutham and muhurtham with classical sources",
    href: "/jathakam",
    image: "/jathakam/assets/icon-192.png",
  },
  {
    name: "Muhurtham Clock",
    tagline: "The Kerala panchangam as a live clock: kalams, horas, Abhijit",
    href: "/muhurtham-clock",
    image: "/muhurtham-clock/assets/icon-192.png",
  },
  {
    name: "spareX",
    tagline: "Second-hand vehicle spares, scrap and workshops",
    href: "/sparex",
    image: "/sparex/assets/icon-192.png",
  },
  {
    name: "FarmConnect",
    tagline: "Buy fresh produce straight from Kerala farmers",
    href: "/farmconnect",
    image: "/farmconnect/assets/icon-192.png",
  },
  {
    name: "Voffer",
    tagline: "Fresh offers from shops near you",
    href: "/voffer",
    image: "/voffer/assets/icon-192.png",
  },
  {
    name: "DentalMart",
    tagline: "B2B marketplace for dental supplies",
    href: "/dentalmart",
    image: "/dentalmart/assets/icon-192.png",
  },
  {
    name: "Doplando",
    tagline: "Task and team planner",
    href: "/doplando",
    image: "/doplando/assets/icon-192.png",
  },
  {
    name: "QuizKerala",
    tagline: "Timed quizzes with live leaderboards",
    href: "/quizkerala",
    image: "/quizkerala/logo-192.png",
  },
];
