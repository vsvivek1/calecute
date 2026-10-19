import type { Metadata } from "next";
import { APPS } from "@/lib/apps";
import { OurProducts } from "@/components/site/OurProducts";

export const metadata: Metadata = {
  title: "Android apps by Calecute Technologies | Get them on Google Play",
  description:
    "Every Android app from Calecute Technologies, Kozhikode: Kerala PSC, USS, LSS and Plus One/Two exam prep, QuizKerala, Bankers Gold gold auctions, BankMates, Find My Bus, Muhurtham Clock and more. Get it on Google Play, or see which apps are coming soon.",
  keywords: [
    "Calecute Technologies apps",
    "Kerala apps",
    "Malayalam apps",
    "Android apps Kerala",
    "Kerala PSC app",
    "USS LSS exam app",
    "gold auction app",
    "Google Play",
  ],
  alternates: { canonical: "https://calecutech.com/apps" },
};

export default function AppsPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <OurProducts
        headingLevel="h1"
        heading="Our apps"
        intro="Android apps made in Kozhikode by Calecute Technologies for students, bankers, families and small businesses across Kerala and India. Apps on Google Play carry the official badge; the rest are coming soon."
      />

      <h2 className="mt-14 text-xl font-semibold">Privacy, support and account deletion</h2>
      <div className="mt-6 space-y-6">
        {APPS.map((app) => (
          <section
            key={app.slug}
            className="rounded-xl border border-black/10 p-5 dark:border-white/15"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-medium">{app.name}</h2>
              {app.isDemo && (
                <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs">
                  Demo build
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-black/60 dark:text-white/60">
              {app.tagline}
            </p>
            <p className="mt-2 font-mono text-xs text-black/40 dark:text-white/40">
              {app.androidPackage}
            </p>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <a className="underline" href={`/apps/${app.slug}`}>
                Overview
              </a>
              <a className="underline" href={`/apps/${app.slug}/privacy`}>
                Privacy policy
              </a>
              <a className="underline" href={`/apps/${app.slug}/support`}>
                Support
              </a>
              {app.terms && (
                <a className="underline" href={`/apps/${app.slug}/terms`}>
                  Terms
                </a>
              )}
              <a className="underline" href={`/apps/${app.slug}/delete-account`}>
                Delete your account
              </a>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
