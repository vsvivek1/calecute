/**
 * Root layout for the agent programme.
 *
 * A second root layout, separate from the marketing site's. That is the point:
 * the site's layout loads two Geist webfonts and the Tailwind stylesheet, and
 * the recruitment page cannot afford either — it has 150KB for everything and
 * the Malayalam subset already takes 35KB of it.
 *
 * `lang="en"` because Malayalam is the primary language of these pages. English
 * passages carry `lang="en"` individually, so a screen reader switches voice
 * correctly rather than reading English with Malayalam phonetics.
 */
import type { Metadata, Viewport } from "next";
import { AGENT_STYLES } from "@/lib/agents/styles";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "https://calecutech.com",
  ),
  title: {
    default: "Commission agent programme | Calecute Technologies",
    template: "%s | Calecute Technologies",
  },
  robots: {
    index: true,
    follow: true,
    // The agent and admin areas opt out individually.
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // No maximum-scale and no user-scalable=no: pinch zoom must keep working, and
  // the layout is built to survive 200% text zoom.
  colorScheme: "light dark",
};

export default function AgentsRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        {/* Inlined rather than linked: one fewer render-blocking request, and
            the same stylesheet the static /agents document uses. */}
        <style dangerouslySetInnerHTML={{ __html: AGENT_STYLES }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
