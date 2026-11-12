/**
 * Root layout for the staff office (/login and /office/*).
 *
 * A separate root layout, like (site) and (agents): the office loads none of
 * the marketing site's header, footer or stylesheet, and the website loads
 * none of this. All office code lives in src/office and is imported from
 * here only, so the module can be copied into another company's site.
 */
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/office/office.css";

const sans = Geist({ variable: "--font-office-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-office-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Office", template: "%s | Office" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#07070c",
  colorScheme: "dark",
};

export default function OfficeRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} antialiased`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
