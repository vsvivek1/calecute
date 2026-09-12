import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { APPS, CONTACT, appBySlug } from "@/lib/apps";
import { rich } from "@/lib/rich";

/**
 * App-specific terms.
 *
 * Only generated for apps that define `terms` in lib/apps.ts — the rest fall
 * back to the company-wide /terms, which is what their store listings already
 * point at. An app gets its own page when the general terms cannot carry the
 * disclaimers it needs: BankMates ships financial calculators whose output must
 * not be mistaken for a bank's own figures, and a space colleagues post into.
 */
export function generateStaticParams() {
  return APPS.filter((a) => a.terms).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const app = appBySlug((await params).slug);
  return {
    title: app?.terms
      ? `${app.name} — Terms of Service | Calecutech`
      : "Not found",
  };
}

export default async function AppTermsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const app = appBySlug((await params).slug);
  if (!app?.terms) notFound();
  const { terms } = app;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm text-black/50 dark:text-white/50">{app.name}</p>
      <h1 className="mt-1 text-3xl font-semibold">Terms of Service</h1>
      <p className="mt-2 text-sm text-black/50 dark:text-white/50">
        Last updated: {terms.updated} · Android {app.androidPackage}
      </p>

      <div className="mt-8 space-y-8 text-black/80 dark:text-white/80">
        <p>
          These terms are an agreement between you and {CONTACT.company}. By
          using {app.name} you accept them. If you do not, please do not use the
          app.
        </p>
        <p className="text-sm text-black/60 dark:text-white/60">{terms.intro}</p>

        {terms.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-xl font-medium">{section.heading}</h2>
            <div className="mt-2 space-y-2 text-sm">
              {section.body.map((paragraph, i) => (
                <p key={i}>{rich(paragraph)}</p>
              ))}
            </div>
          </section>
        ))}

        <section>
          <h2 className="text-xl font-medium">Changes to these terms</h2>
          <p className="mt-2 text-sm">
            We will update this page and the date above before a change takes
            effect. Continuing to use the app after that means you accept the
            change.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium">Related</h2>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <a className="underline" href={`/apps/${app.slug}`}>
              About {app.name}
            </a>
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
              Company terms
            </a>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-medium">Contact</h2>
          <p className="mt-2 text-sm">
            {CONTACT.company}
            <br />
            Operations office: Kozhikode (Calicut), Kerala, India
            <br />
            <a className="underline" href={`mailto:${CONTACT.email}`}>
              {CONTACT.email}
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
