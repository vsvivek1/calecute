import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { APPS, CONTACT, PROCESSORS, appBySlug } from "@/lib/apps";

export function generateStaticParams() {
  return APPS.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const app = appBySlug((await params).slug);
  return { title: app ? `${app.name} — Privacy Policy | Calecutech` : "Not found" };
}

export default async function AppPrivacyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const app = appBySlug((await params).slug);
  if (!app) notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm text-black/50 dark:text-white/50">{app.name}</p>
      <h1 className="mt-1 text-3xl font-semibold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-black/50 dark:text-white/50">
        Last updated: September 4, 2026 · Android {app.androidPackage}
      </p>

      <div className="mt-8 space-y-8 text-black/80 dark:text-white/80">
        {app.isDemo && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
            <strong className="font-medium">This is a demonstration build.</strong>{" "}
            It is published so banks can evaluate and train staff on the product.
            The cases and properties it shows are fictional sample data and do not
            describe any real borrower, loan, or property. Where the app takes a
            payment, the payment is genuine but the amount is capped at ₹1.
          </div>
        )}

        <p>
          This policy describes how <strong>{app.name}</strong>, a mobile
          application published by {CONTACT.company}, handles personal data.
          It applies to the Android application{" "}
          <code className="rounded bg-black/5 px-1.5 py-0.5 text-xs dark:bg-white/10">
            {app.androidPackage}
          </code>{" "}
          and its iOS equivalent, and to the Sarfez service they connect to.
        </p>
        <p>{app.summary}</p>
        <p className="text-sm text-black/60 dark:text-white/60">
          Who it is for: {app.audience}
        </p>

        <section>
          <h2 className="text-xl font-medium">What we collect, and why</h2>
          <div className="mt-4 space-y-5">
            {app.collects.map((c) => (
              <div key={c.category}>
                <h3 className="font-medium">
                  {c.category}
                  {c.optional && (
                    <span className="ml-2 text-xs font-normal text-black/50 dark:text-white/50">
                      optional
                    </span>
                  )}
                </h3>
                <ul className="mt-1 list-disc pl-5 text-sm">
                  {c.items.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
                <p className="mt-1 text-sm text-black/60 dark:text-white/60">
                  {c.purpose}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-medium">Permissions the app requests</h2>
          <dl className="mt-3 space-y-3 text-sm">
            {app.permissions.map((p) => (
              <div key={p.name}>
                <dt className="font-medium">{p.name}</dt>
                <dd className="text-black/60 dark:text-white/60">{p.why}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <h2 className="text-xl font-medium">Who we share it with</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {app.sharedWith.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm">
            We do not sell personal data, and we do not use it for advertising or
            share it with data brokers.
          </p>
        </section>

        {app.thirdPartyData && (
          <section>
            <h2 className="text-xl font-medium">
              Information about people who do not use the app
            </h2>
            <p className="mt-2 text-sm">{app.thirdPartyData}</p>
          </section>
        )}

        <section>
          <h2 className="text-xl font-medium">How long we keep it</h2>
          <p className="mt-2 text-sm">{app.retention}</p>
        </section>

        <section>
          <h2 className="text-xl font-medium">Security</h2>
          <p className="mt-2 text-sm">
            Data is transmitted over TLS and stored on access-controlled servers.
            Passwords are stored only as salted hashes, never in a readable form.
            An officer or buyer can only reach records belonging to them.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium">What we do not collect</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            <li>We do not collect your contacts, calendar, call logs or SMS.</li>
            <li>We do not track you across other apps or websites.</li>
            <li>We do not use advertising identifiers and show no advertising.</li>
            <li>
              We do not record audio or use the camera except at the moment you
              tap to capture something.
            </li>
            <li>
              We never receive your Google password, and — where the app takes
              payments — never your card, UPI or netbanking credentials.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-medium">Services that process data for us</h2>
          <p className="mt-2 text-sm">
            We use the following providers. They act on our instructions and may
            not use your data for their own purposes.
          </p>
          <div className="mt-3 space-y-3">
            {app.processors
              .flatMap((key) => PROCESSORS[key] ?? [])
              .map((proc) => (
                <div key={proc.name} className="text-sm">
                  <h3 className="font-medium">{proc.name}</h3>
                  <p className="text-black/60 dark:text-white/60">{proc.role}</p>
                  <a
                    className="text-xs underline"
                    href={proc.policy}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Their privacy policy
                  </a>
                </div>
              ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-medium">Where your data is held</h2>
          <p className="mt-2 text-sm">
            Data is stored on servers operated by our hosting providers. Some of
            those servers are outside India, and the providers named above may
            process data in other countries under their own contractual
            safeguards. By using the app you consent to that transfer.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium">Why we are allowed to hold it</h2>
          <p className="mt-2 text-sm">
            {app.slug.includes("field")
              ? "We process this data on the instructions of the lending institution that assigned the visit, so that it can discharge obligations placed on it by the SARFAESI Act, 2002. That institution is the data fiduciary; we are its processor."
              : "We process your data to provide the service you asked for — searching listings, registering interest, and completing a deposit — and, for deposit and refund records, to meet obligations under Indian financial and tax law. You give consent when you create an account, and you may withdraw it by deleting the account."}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium">Your rights</h2>
          <p className="mt-2 text-sm">
            You may ask us what personal data we hold about you, ask us to correct
            it, or ask us to delete it. Write to{" "}
            <a className="underline" href={`mailto:${CONTACT.email}`}>
              {CONTACT.email}
            </a>
            , or follow the{" "}
            <a className="underline" href={`/apps/${app.slug}/delete-account`}>
              account deletion instructions
            </a>
            . Under India&rsquo;s Digital Personal Data Protection Act, 2023 you
            may also raise a grievance with us at the same address; we respond
            within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium">Raising a grievance</h2>
          <p className="mt-2 text-sm">
            If you are unhappy with how we have handled your data, write to{" "}
            {CONTACT.grievanceOfficer} at{" "}
            <a className="underline" href={`mailto:${CONTACT.email}`}>
              {CONTACT.email}
            </a>
            , {CONTACT.company}, {CONTACT.address}. We acknowledge within 7 days
            and respond within 30. If you remain dissatisfied you may complain
            to the Data Protection Board of India.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium">Children</h2>
          <p className="mt-2 text-sm">
            The app is not directed at children and we do not knowingly collect
            data from anyone under 18.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium">Changes</h2>
          <p className="mt-2 text-sm">
            If we change what we collect, we will update this page and the date
            above before the change takes effect.
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
