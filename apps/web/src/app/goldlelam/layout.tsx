/**
 * Root layout for /goldlelam — a second root layout alongside (site) and
 * (agents), same technique as (agents)/layout.tsx: its own <html>/<body>,
 * its own inline stylesheet (lib/goldlelam/styles.ts), no shared Tailwind
 * or fonts. GoldLelam is pink-branded end to end; Calecute appears only in
 * the footer (see components/goldlelam/Footer.tsx).
 *
 * No parenthesised route group: nothing else shares this layout, so a plain
 * `goldlelam/` folder is enough — matches (agents) in behaviour without the
 * redundant grouping syntax.
 */
import type { Metadata, Viewport } from "next";
import { GOLDLELAM_STYLES } from "@/lib/goldlelam/styles";
import { GOLDLELAM } from "@/lib/goldlelam/content";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "https://calecutech.com",
  ),
  title: {
    default: `${GOLDLELAM.name} — ${GOLDLELAM.tagline}`,
    template: `%s | ${GOLDLELAM.name}`,
  },
  description: GOLDLELAM.tagline,
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light",
};

export default function GoldLelamRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: GOLDLELAM_STYLES }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
