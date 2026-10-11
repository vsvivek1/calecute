import { Patrick_Hand } from "next/font/google";

/** Hand-lettered display face for History Clock headings. Body text stays Geist. */
export const handFont = Patrick_Hand({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-hand",
  display: "swap",
});
