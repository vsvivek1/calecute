import Link from "next/link";
import { company, officeLines } from "@/lib/company";
import { pricingModels, services } from "@/lib/offerings";

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      {/* DailyDo floating bubble */}
      <div className="fixed bottom-6 right-6 z-50 group">
        <Link
          href="/products/dailydo"
          className="flex items-center gap-3 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-blue-700 transition-all hover:scale-105 active:scale-95"
        >
          <span className="text-base">✓</span>
          Try DailyDo
        </Link>
        <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
          <div className="rounded-xl bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 shadow-xl p-3 w-52 text-xs text-black/70 dark:text-white/70">
            Task management for teams — plan, assign, and track daily work.
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Software Development &amp; SaaS Solutions for Global Businesses
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-black/60 dark:text-white/60">
          We build web applications, mobile apps, and scalable SaaS platforms
          for international clients.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/contact"
            className="rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background hover:opacity-90"
          >
            Start a project
          </Link>
          <Link
            href="/services"
            className="rounded-full border border-black/10 px-5 py-3 text-sm font-medium hover:bg-black/[.04] dark:border-white/15 dark:hover:bg-white/[.06]"
          >
            View services
          </Link>
        </div>
        <p className="mt-6 text-sm text-black/50 dark:text-white/50">
          {company.legalName} &middot; {officeLines.join(", ")}
        </p>
      </section>

      {/* Services */}
      <section className="mt-24">
        <h2 className="text-2xl font-semibold">Services</h2>
        <p className="mt-2 text-black/60 dark:text-white/60">
          Four ways we work with clients, from a single site to a full product
          team.
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {services.map((s) => (
            <div
              key={s.title}
              className="rounded-xl border border-black/10 p-6 dark:border-white/15"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-lg text-2xl ${s.color}`}
              >
                {s.emoji}
              </div>
              <h3 className="mt-4 text-lg font-medium">{s.title}</h3>
              <p className="mt-2 text-sm text-black/60 dark:text-white/60">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* What we've built */}
      <section className="mt-24">
        <h2 className="text-2xl font-semibold">What we&rsquo;ve built</h2>
        <p className="mt-2 text-black/60 dark:text-white/60">
          Our own products are the clearest example of how we work.
        </p>
        <div className="mt-8 rounded-xl border border-black/10 p-6 dark:border-white/15 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-2xl dark:bg-blue-900/30">
              ✅
            </div>
            <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-400">
              Live
            </span>
          </div>
          <h3 className="mt-4 text-xl font-medium">DailyDo</h3>
          <p className="mt-2 text-black/70 dark:text-white/70">
            A subscription task-management platform for teams — offices,
            projects, task assignment, voice dictation, and daily reports, with
            free and paid monthly plans. Designed, built, and operated by us,
            including authentication, billing, and real-time sync.
          </p>
          <Link
            href="/products/dailydo"
            className="mt-4 inline-block text-sm font-medium underline underline-offset-2"
          >
            See the product →
          </Link>
        </div>
        <p className="mt-6 text-sm text-black/60 dark:text-white/60">
          We currently work with clients across India and international markets
          on web, mobile, and SaaS projects. Want to see work relevant to your
          industry?{" "}
          <Link href="/contact" className="underline underline-offset-2">
            Ask us for examples
          </Link>
          .
        </p>
      </section>

      {/* Pricing model */}
      <section className="mt-24">
        <h2 className="text-2xl font-semibold">Our Pricing Model</h2>
        <p className="mt-2 text-black/60 dark:text-white/60">
          How we charge, stated up front. Every engagement is invoiced against
          one of these three models.
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {pricingModels.map((p) => (
            <div
              key={p.title}
              className="rounded-xl border border-black/10 p-6 dark:border-white/15"
            >
              <h3 className="text-lg font-medium">{p.title}</h3>
              <p className="mt-2 text-sm text-black/60 dark:text-white/60">
                {p.desc}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-black/60 dark:text-white/60">
          All prices are quoted in writing before work begins. See our{" "}
          <Link href="/refund-policy" className="underline underline-offset-2">
            Refund &amp; Cancellation Policy
          </Link>{" "}
          for how cancellations and refunds are handled.
        </p>
      </section>

      {/* Company details */}
      <section className="mt-24 rounded-xl border border-black/10 p-6 dark:border-white/15 sm:p-8">
        <h2 className="text-2xl font-semibold">Company details</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3 text-sm">
          <div>
            <p className="font-medium">Registered entity</p>
            <p className="mt-1 text-black/60 dark:text-white/60">
              {company.legalName}
              <br />
              {company.jurisdiction}
            </p>
          </div>
          <div>
            <p className="font-medium">Operations office</p>
            <p className="mt-1 text-black/60 dark:text-white/60">
              {officeLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
          </div>
          <div>
            <p className="font-medium">Contact</p>
            <p className="mt-1 text-black/60 dark:text-white/60">
              <a
                className="underline underline-offset-2"
                href={`mailto:${company.email}`}
              >
                {company.email}
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
