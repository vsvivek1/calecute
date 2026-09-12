import Link from "next/link";
import { company, officeLines } from "@/lib/company";

export const metadata = {
  title: "About | Calecutech",
  description:
    "Calecute Technologies LLC builds web applications, mobile apps, and SaaS platforms for businesses worldwide.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold">About</h1>

      <div className="mt-6 space-y-5 text-black/80 dark:text-white/80">
        <p>
          {company.brand} is a software development studio operated by{" "}
          {company.legalName}, {company.jurisdiction}. We build web
          applications, mobile apps, and scalable SaaS platforms for businesses
          in India and international markets.
        </p>
        <p>
          We work in two ways. We take on client engagements &mdash; custom web
          and mobile builds, backend and API systems, and payment integrations
          &mdash; on fixed-price, subscription, or hourly terms. And we build
          and operate our own subscription products, which is where our
          engineering standards get tested in production every day.
        </p>
        <p>
          Our flagship product is{" "}
          <Link href="/products/dailydo" className="underline underline-offset-2">
            DailyDo
          </Link>
          , a team task-management platform with offices, projects, task
          assignment, voice dictation, and daily reports. We designed, built,
          and run it end to end &mdash; authentication, subscription billing,
          real-time sync, and support.
        </p>
        <p>
          Our development team works from {company.office.city},{" "}
          {company.office.region}, {company.office.country}, and we serve
          clients remotely across time zones.
        </p>
      </div>

      <div className="mt-10 rounded-xl border border-black/10 p-6 dark:border-white/15">
        <h2 className="text-lg font-medium">Company details</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="font-medium">Legal entity</dt>
            <dd className="text-black/60 dark:text-white/60">
              {company.legalName}, {company.jurisdiction}
            </dd>
          </div>
          <div>
            <dt className="font-medium">Operations office</dt>
            <dd className="text-black/60 dark:text-white/60">
              {officeLines.join(", ")}
            </dd>
          </div>
          <div>
            <dt className="font-medium">Contact</dt>
            <dd className="text-black/60 dark:text-white/60">
              <a
                className="underline underline-offset-2"
                href={`mailto:${company.email}`}
              >
                {company.email}
              </a>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
