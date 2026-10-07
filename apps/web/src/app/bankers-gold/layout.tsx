/**
 * Root layout for /bankers-gold, the product page for the Bankers Gold app
 * (store name of GoldLelam). Its own <html>/<body> and inline stylesheet, the
 * same technique as goldlelam/layout.tsx and (agents)/layout.tsx, so it shares
 * nothing with the (site) group's Tailwind theme.
 *
 * Playfair Display matches the serif in the store artwork
 * (goldlelam repo, branding/fonts).
 */
import type { Metadata, Viewport } from "next";
import { Playfair_Display } from "next/font/google";
import { BANKERS_GOLD_STYLES } from "@/lib/bankers-gold/styles";
import { BANKERS_GOLD } from "@/lib/bankers-gold/content";

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const description =
  "Browse bank gold-loan auctions, pay the EMD and bid live from your phone. Get Bankers Gold on Google Play.";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "https://calecutech.com",
  ),
  title: `${BANKERS_GOLD.name} — ${BANKERS_GOLD.tagline}`,
  description,
  alternates: { canonical: BANKERS_GOLD.path },
  icons: {
    icon: "/bankers-gold/icon.png",
    apple: "/bankers-gold/apple-touch-icon.png",
  },
  openGraph: {
    title: BANKERS_GOLD.name,
    description,
    url: BANKERS_GOLD.path,
    siteName: "Calecute Technologies",
    images: [{ url: "/bankers-gold/og.png", width: 1024, height: 500 }],
    type: "website",
  },
  twitter: { card: "summary_large_image", images: ["/bankers-gold/og.png"] },
  other: { "google-play-app": "app-id=com.calecutech.goldlelam" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1d0912",
};

export default function BankersGoldRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={playfair.variable}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: BANKERS_GOLD_STYLES }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
