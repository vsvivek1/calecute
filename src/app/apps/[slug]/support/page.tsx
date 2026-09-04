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
  return { title: app ? `${app.name} — Support | Calecutech` : "Not found" };
}

export default async function AppSupportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const app = appBySlug((await params).slug);
  if (!app) notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm text-black/50 dark:text-white/50">{app.name}</p>
      <h1 className="mt-1 text-3xl font-semibold">Support</h1>

      <div className="mt-8 space-y-8 text-black/80 dark:text-white/80">
        <p>{app.summary}</p>

        {app.isDemo && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
            This is a demonstration build for evaluation and staff training. The
            cases and properties shown are fictional sample data.
          </div>
        )}

        <section>
          <h2 className="text-xl font-medium">Getting help</h2>
          <p className="mt-2 text-sm">
            Email{" "}
            <a className="underline" href={`mailto:${CONTACT.email}`}>
              {CONTACT.email}
            </a>
            . Tell us the app name, what you were doing, and what happened. We
            reply within two working days.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium">Signing in</h2>
          <p className="mt-2 text-sm">
            {app.slug.includes("field")
              ? "Credentials are issued by the bank you work for, not by us. If you cannot sign in, contact your branch IT helpdesk first — we cannot create or reset officer accounts."
              : "Sign in with your mobile number or a Google account. If a one-time code does not arrive, check the number and try again after a minute."}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium">Deleting your account</h2>
          <p className="mt-2 text-sm">
            See{" "}
            <a className="underline" href={`/apps/${app.slug}/delete-account`}>
              account deletion
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium">Privacy</h2>
          <p className="mt-2 text-sm">
            What the app collects and why is set out in its{" "}
            <a className="underline" href={`/apps/${app.slug}/privacy`}>
              privacy policy
            </a>
            .
          </p>
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
