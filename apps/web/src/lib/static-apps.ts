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
];
