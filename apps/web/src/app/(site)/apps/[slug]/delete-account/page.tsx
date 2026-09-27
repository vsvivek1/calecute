import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { APPS, CONTACT, appBySlug } from "@/lib/apps";
import { rich } from "@/lib/rich";

export function generateStaticParams() {
  return APPS.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const app = appBySlug((await params).slug);
  return {
    title: app ? `${app.name} — Delete your account | Calecutech` : "Not found",
  };
}

/**
 * Google Play requires a deletion route reachable without installing the app,
 * and Apple requires one that is reachable from inside it. This page is the
 * former; both stores link here.
 */
export default async function DeleteAccountPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const app = appBySlug((await params).slug);
  if (!app) notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm text-black/50 dark:text-white/50">{app.name}</p>
      <h1 className="mt-1 text-3xl font-semibold">Delete your account</h1>
      <p className="mt-2 text-sm text-black/50 dark:text-white/50">
        Android {app.androidPackage}
      </p>

      <div className="mt-8 space-y-8 text-black/80 dark:text-white/80">
        <section>
          <h2 className="text-xl font-medium">How to request deletion</h2>
          <p className="mt-2 text-sm">
            Email{" "}
            <a className="underline" href={`mailto:${CONTACT.email}?subject=Delete my ${app.name} account`}>
              {CONTACT.email}
            </a>{" "}
            from the address registered on the account, with the subject
            &ldquo;Delete my {app.name} account&rdquo;. Include{" "}
            {app.deleteIdentifier}, so we can identify the account.
          </p>
          <p className="mt-2 text-sm">
            You do not need the app installed to make this request.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium">What happens next</h2>
          <p className="mt-2 text-sm">
            We verify the request is genuinely from the account holder, then
            delete the account within 30 days and confirm by email.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium">What is deleted</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {app.deletes.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-medium">What is kept, and why</h2>
          <p className="mt-2 text-sm">{rich(app.retainsOnDelete)}</p>
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
