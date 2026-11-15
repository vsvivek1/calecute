import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { APPS, appBySlug } from "@/lib/apps";
import { company as opc } from "@/lib/agents/content";
import { entities } from "@/lib/company";

/**
 * Trader status declaration.
 *
 * Under the EU Digital Services Act, an app store lists the publisher of an
 * app as a trader and shows its contact details. This page states who that
 * is, for apps that set `trader` in lib/apps.ts. The publisher is the Indian
 * OPC (the Google Play developer of record), not the Wyoming LLC.
 */
export function generateStaticParams() {
  return APPS.filter((a) => a.trader).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const app = appBySlug((await params).slug);
  return {
    title: app?.trader
      ? `${app.name} — Trader status declaration | Calecutech`
      : "Not found",
  };
}

export default async function AppTraderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const app = appBySlug((await params).slug);
  if (!app?.trader) notFound();
  const publisher = entities.find((e) => e.key === "in")!;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm text-black/50 dark:text-white/50">{app.name}</p>
      <h1 className="mt-1 text-3xl font-semibold">
        Trader status declaration
      </h1>
      <p className="mt-2 text-sm text-black/50 dark:text-white/50">
        Last updated: {app.trader.updated} · Android {app.androidPackage}
      </p>

      <div className="mt-8 space-y-8 text-black/80 dark:text-white/80">
        <section>
          <h2 className="text-xl font-medium">Our status</h2>
          <p className="mt-2 text-sm">
            {publisher.legalName} publishes {app.name} and acts as a{" "}
            <strong>trader</strong>. We offer the app in the course of our
            business, not as a private individual. We make this declaration
            under the EU Digital Services Act, which asks app stores to show who
            is behind each app.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium">Who the trader is</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="font-medium">Name</dt>
              <dd>{publisher.legalName}</dd>
            </div>
            <div>
              <dt className="font-medium">Registered office</dt>
              <dd>{opc.registeredOffice}</dd>
            </div>
            <div>
              <dt className="font-medium">Email</dt>
              <dd>
                <a className="underline" href={`mailto:${opc.email}`}>
                  {opc.email}
                </a>
              </dd>
            </div>
            {publisher.phone && (
              <div>
                <dt className="font-medium">Phone</dt>
                <dd>{publisher.phone}</dd>
              </div>
            )}
            {publisher.ids.map((id) => (
              <div key={id}>
                <dt className="font-medium">
                  {id.split(":")[0]}
                </dt>
                <dd>{id.split(":").slice(1).join(":").trim()}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <h2 className="text-xl font-medium">What we offer</h2>
          <p className="mt-2 text-sm">
            {app.name} is a directory and job board. Workers list themselves,
            customers post jobs, and the two can contact each other. We do not
            employ, vet or supervise the workers, and we are not a party to the
            work they agree between themselves. Any fee we charge is shown
            before you pay.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium">Our declaration</h2>
          <p className="mt-2 text-sm">
            We declare that we only offer products and services that comply
            with the rules of EU law that apply to them.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium">Questions and complaints</h2>
          <p className="mt-2 text-sm">
            Write to{" "}
            <a className="underline" href={`mailto:${opc.email}`}>
              {opc.email}
            </a>{" "}
            and we will reply. You can also use the{" "}
            <a className="underline" href={`/apps/${app.slug}/support`}>
              support page
            </a>
            .
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
            <a className="underline" href={`/apps/${app.slug}/terms`}>
              Terms of service
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
