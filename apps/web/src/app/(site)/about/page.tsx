import Link from "next/link";
import { company, officeLines } from "@/lib/company";
import { Accent, CtaPanel, PageHero, SectionHeading } from "@/components/site/Bold";

export const metadata = {
  title: "About | Calecutech",
  description:
    "Calecute Technologies LLC builds web applications, mobile apps, and SaaS platforms for businesses worldwide.",
};

const ways = [
  {
    label: "Client work",
    title: "We build for you",
    body: (
      <>
        We take on client engagements &mdash; custom web and mobile builds,
        backend and API systems, and payment integrations &mdash; on
        fixed-price, subscription, or hourly terms.
      </>
    ),
    tint: "from-indigo-500/15",
  },
  {
    label: "Our products",
    title: "We build for ourselves",
    body: (
      <>
        We build and operate our own subscription products, which is where our
        engineering standards get tested in production every day.
      </>
    ),
    tint: "from-fuchsia-500/15",
  },
];

export default function AboutPage() {
  return (
    <div className="font-sans">
      <PageHero
        eyebrow="About"
        title={
          <>
            A studio that runs its own <Accent onDark>products.</Accent>
          </>
        }
        lede={
          <>
            {company.brand} is a software development studio operated by{" "}
            {company.legalName}, {company.jurisdiction}. We build web
            applications, mobile apps, and scalable SaaS platforms for
            businesses in India and international markets.
          </>
        }
      />

      <section className="mx-auto max-w-6xl px-6 py-24">
        <SectionHeading
          eyebrow="How we work"
          title={
            <>
              We work in <Accent>two</Accent> ways.
            </>
          }
        />
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {ways.map((w) => (
            <div
              key={w.label}
              className={`home-reveal rounded-[1.75rem] border border-black/[.08] bg-gradient-to-br ${w.tint} to-transparent p-8 sm:p-10 dark:border-white/10`}
            >
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-black/45 dark:text-white/45">
                {w.label}
              </p>
              <h3 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
                {w.title}
              </h3>
              <p className="mt-4 text-lg leading-relaxed text-black/65 dark:text-white/65">{w.body}</p>
            </div>
          ))}
        </div>

        <Link
          href="/products/dailydo"
          className="home-reveal group mt-4 grid items-center gap-8 overflow-hidden rounded-[1.75rem] bg-[linear-gradient(150deg,#1e3a8a,#0b1530)] p-8 text-white ring-1 ring-white/10 transition hover:ring-blue-400/50 sm:p-10 md:grid-cols-[auto_1fr]"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-500 text-4xl shadow-[0_20px_50px_-10px_rgba(59,130,246,0.7)]">
            ✓
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-300">Our flagship product</p>
            <p className="mt-2 text-lg leading-relaxed text-white/80">
              Our flagship product is{" "}
              <span className="font-semibold text-white underline decoration-blue-400 underline-offset-4">
                DailyDo
              </span>
              , a team task-management platform with offices, projects, task
              assignment, voice dictation, and daily reports. We designed,
              built, and run it end to end &mdash; authentication, subscription
              billing, real-time sync, and support.
            </p>
          </div>
        </Link>
      </section>

      <section className="px-3 sm:px-4">
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-[#07070c] px-6 py-20 text-white sm:py-24">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
            <div className="home-blob absolute -right-[5%] top-[-20%] h-[80%] w-[45%] rounded-full bg-[#a83a5e] opacity-40 blur-[120px]" />
            <div className="home-blob absolute -left-[5%] bottom-[-30%] h-[70%] w-[40%] rounded-full bg-[#4f46e5] opacity-40 blur-[120px] [animation-delay:-7s]" />
          </div>
          <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[1.3fr_1fr] md:items-end">
            <div className="home-reveal">
              <p className="text-sm font-semibold text-[#f2c46d]">Where we are</p>
              <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold tracking-[-0.035em] sm:text-6xl">
                Built in {company.office.city.split(" ")[0]},{" "}
                <Accent onDark>shipped worldwide.</Accent>
              </h2>
              <p className="mt-6 max-w-xl text-lg text-white/65">
                Our development team works from {company.office.city},{" "}
                {company.office.region}, {company.office.country}, and we serve
                clients remotely across time zones.
              </p>
            </div>

            <div className="home-reveal rounded-[1.5rem] border border-white/10 bg-white/[.04] p-7 text-sm backdrop-blur">
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                Company details
              </h3>
              <dl className="mt-5 grid gap-5">
              <div>
                <dt className="font-medium">Legal entity</dt>
                <dd className="mt-0.5 text-white/60">
                  {company.legalName}, {company.jurisdiction}
                </dd>
              </div>
              <div>
                <dt className="font-medium">Operations office</dt>
                <dd className="mt-0.5 text-white/60">{officeLines.join(", ")}</dd>
              </div>
              <div>
                <dt className="font-medium">Contact</dt>
                <dd className="mt-0.5 text-white/60">
                  <a className="underline underline-offset-4" href={`mailto:${company.email}`}>
                    {company.email}
                  </a>
                </dd>
              </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      <div className="h-4" />
      <CtaPanel
        title={
          <>
            Let&rsquo;s build <Accent onDark>together.</Accent>
          </>
        }
        lede="Tell us what you have in mind and we'll come back with a written scope and quote."
        secondary={{ href: "/services", label: "View services" }}
      />
    </div>
  );
}
