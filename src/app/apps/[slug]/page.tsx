import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { APPS, CONTACT, appBySlug } from "@/lib/apps";

export function generateStaticParams() {
  return APPS.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const app = appBySlug((await params).slug);
  if (!app) return { title: "Not found" };
  return {
    title: `${app.name} | Calecutech`,
    description: app.tagline,
  };
}

/**
 * The app's home page — what Google's OAuth consent screen, the Play listing
 * and the App Store marketing URL all point at. It has to be a real page that
 * describes the app, not a redirect to the company site.
 */
export default async function AppHomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const app = appBySlug((await params).slug);
  if (!app) notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold">{app.name}</h1>
        {app.isDemo && (
          <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs">
            Demo build
          </span>
        )}
      </div>
      <p className="mt-2 text-lg text-black/60 dark:text-white/60">
        {app.tagline}
      </p>

      <div className="mt-10 space-y-8 text-black/80 dark:text-white/80">
        <p>{app.summary}</p>

        {app.isDemo && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
            <strong className="font-medium">This is a demonstration build.</strong>{" "}
            It is published so banks can evaluate the product and train their
            staff. The cases and properties it shows are fictional sample data
            and describe no real borrower, loan, or property. Where the app
            takes a payment, the payment is genuine but capped at ₹1.
          </div>
        )}

        <section>
          <h2 className="text-xl font-medium">Who it is for</h2>
          <p className="mt-2 text-sm">{app.audience}</p>
        </section>

        <section>
          <h2 className="text-xl font-medium">What it does</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {app.collects.map((c) => (
              <li key={c.category}>{c.purpose}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-medium">Availability</h2>
          <p className="mt-2 text-sm">
            Android, published by {CONTACT.company}. Package{" "}
            <code className="rounded bg-black/5 px-1.5 py-0.5 text-xs dark:bg-white/10">
              {app.androidPackage}
            </code>
            .
          </p>
        </section>

        <section className="rounded-xl border border-black/10 p-5 dark:border-white/15">
          <h2 className="text-lg font-medium">Legal and support</h2>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <a className="underline" href={`/apps/${app.slug}/privacy`}>
              Privacy policy
            </a>
            <a className="underline" href={`/apps/${app.slug}/support`}>
              Support
            </a>
            <a className="underline" href={`/apps/${app.slug}/delete-account`}>
              Delete your account
            </a>
            <a className="underline" href="/terms">
              Terms of service
            </a>
            <a className="underline" href="/refund-policy">
              Refund policy
            </a>
          </div>
          <p className="mt-4 text-sm text-black/60 dark:text-white/60">
            {CONTACT.company} · Kozhikode (Calicut), Kerala, India ·{" "}
            <a className="underline" href={`mailto:${CONTACT.email}`}>
              {CONTACT.email}
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
