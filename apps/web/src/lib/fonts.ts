import { Bricolage_Grotesque, Instrument_Serif, Noto_Sans_Malayalam } from "next/font/google";

/** Display face for big headings on the marketing site. */
export const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
});

/** Italic serif used for the one accent word in a heading. */
export const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  variable: "--font-serif",
});

/** Malayalam text, which the Latin faces above don't cover (Careers page). */
export const malayalam = Noto_Sans_Malayalam({
  subsets: ["malayalam"],
  variable: "--font-malayalam",
});
