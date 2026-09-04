import type { Metadata } from "next";
import { APPS } from "@/lib/apps";

export const metadata: Metadata = {
  title: "Mobile apps | Calecutech",
  description:
    "Privacy, support, and account deletion pages for the mobile apps published by Calecute Technologies LLC.",
};

export default function AppsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Mobile apps</h1>
      <p className="mt-2 text-black/60 dark:text-white/60">
        Privacy, support, and account deletion for each app we publish.
      </p>

      <div className="mt-10 space-y-6">
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
              <a className="underline" href={`/apps/${app.slug}/privacy`}>
                Privacy policy
              </a>
              <a className="underline" href={`/apps/${app.slug}/support`}>
                Support
              </a>
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
