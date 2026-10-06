/**
 * Root layout for /quizkerala — a separate root layout, same technique as
 * goldlelam/layout.tsx: its own <html>/<body> and inline stylesheet
 * (lib/quizkerala/styles.ts), no shared Tailwind. QuizKerala is green and
 * gold end to end; Calecutech appears in the footer as publisher.
 */
import type { Metadata, Viewport } from "next";
import { QUIZKERALA_STYLES } from "@/lib/quizkerala/styles";
import { QUIZKERALA } from "@/lib/quizkerala/content";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "https://calecutech.com",
  ),
  title: {
    default: `${QUIZKERALA.name} — ${QUIZKERALA.tagline}`,
    template: `%s | ${QUIZKERALA.name}`,
  },
  description:
    "QuizKerala runs timed online quizzes with Google sign-in, one attempt per player, fixed or random questions and a live leaderboard where the fastest wins ties.",
  icons: {
    icon: "/quizkerala/logo.svg",
    apple: "/quizkerala/logo-192.png",
  },
  openGraph: {
    siteName: QUIZKERALA.name,
    type: "website",
    images: [{ url: "/quizkerala/og.png", width: 1200, height: 630 }],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light",
  themeColor: "#0a5c35",
};

export default function QuizKeralaRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: QUIZKERALA_STYLES }} />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
