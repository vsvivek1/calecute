import Link from "next/link";
import { company, entities, officeLines } from "@/lib/company";
import { pricingModels, services } from "@/lib/offerings";
import { BANKERS_GOLD } from "@/lib/bankers-gold/content";

const products = [
  { name: BANKERS_GOLD.name, href: BANKERS_GOLD.path, icon: "/bankers-gold/icon.png" },
  { name: "DailyDo", href: "/products/dailydo", glyph: "✓" },
  { name: "QuizKerala", href: "/quizkerala", icon: "/quizkerala/logo-192.png" },
  { name: "History Clock", href: "/history-clock/app", glyph: "🕰" },
];

const steps = [
  { title: "Scope", desc: "We agree what gets built, the price, and the milestones in writing." },
  { title: "Build", desc: "Working builds you can click through at every milestone, not just at the end." },
  { title: "Launch", desc: "Deployment, store submission, and monitoring handled by the same team." },
  { title: "Operate", desc: "Hosting, updates, and support for as long as you need them." },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
      {children}
    </p>
  );
}

export default function Home() {
  return (
    <div className="font-sans">
      {/* DailyDo floating bubble */}
      <div className="group fixed bottom-6 right-6 z-50">
        <Link
          href="/products/dailydo"
          className="flex items-center gap-2.5 rounded-full bg-foreground py-2.5 pl-2.5 pr-5 text-sm font-medium text-background shadow-[0_8px_30px_rgba(0,0,0,0.18)] ring-1 ring-black/10 transition-transform hover:scale-[1.03] active:scale-95 dark:ring-white/15"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
            ✓
          </span>
          Try DailyDo
        </Link>
        <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
          <div className="w-52 rounded-xl border border-black/10 bg-white p-3 text-xs text-black/70 shadow-xl dark:border-white/10 dark:bg-zinc-900 dark:text-white/70">
            Task management for teams — plan, assign, and track daily work.
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(0,0,0,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.06)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_40%,transparent_100%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.07)_1px,transparent_1px)]"
        />
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-[-12rem] -z-10 h-[32rem] w-[64rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(99,102,241,0.28),rgba(236,72,153,0.12),transparent)] blur-2xl"
        />

        <div className="mx-auto max-w-5xl px-6 pb-20 pt-20 text-center sm:pt-28">
          <Link
            href={BANKERS_GOLD.path}
            className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 py-1 pl-1 pr-3 text-sm text-black/70 shadow-sm backdrop-blur transition-colors hover:border-black/20 dark:border-white/15 dark:bg-white/5 dark:text-white/70 dark:hover:border-white/30"
          >
            <span className="rounded-full bg-[#a83a5e] px-2 py-0.5 text-xs font-medium text-white">
              New
            </span>
            {BANKERS_GOLD.name}, bank gold auctions on your phone
            <span aria-hidden="true">→</span>
          </Link>

          <h1 className="mx-auto mt-8 max-w-4xl text-balance text-5xl font-semibold tracking-[-0.035em] sm:text-7xl">
            Software Development &amp;{" "}
            <span className="bg-[linear-gradient(110deg,#4f46e5,#9333ea_45%,#db2777)] bg-clip-text text-transparent dark:bg-[linear-gradient(110deg,#818cf8,#c084fc_45%,#f472b6)]">
              SaaS Solutions
            </span>{" "}
            for Global Businesses
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-black/60 sm:text-xl dark:text-white/60">
            We build web applications, mobile apps, and scalable SaaS platforms
            for international clients.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              href="/contact"
              className="inline-flex h-12 items-center rounded-full bg-foreground px-6 text-sm font-medium text-background shadow-lg shadow-black/10 transition hover:opacity-90"
            >
              Start a project
              <span aria-hidden="true" className="ml-2">→</span>
            </Link>
            <Link
              href="/services"
              className="inline-flex h-12 items-center rounded-full border border-black/10 bg-white/60 px-6 text-sm font-medium backdrop-blur transition hover:bg-black/[.04] dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/[.08]"
            >
              View services
            </Link>
          </div>
          <p className="mt-6 text-sm text-black/45 dark:text-white/45">
            {company.legalName} &middot; {officeLines.join(", ")}
          </p>

          {/* Product strip */}
          <div className="mt-16">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-black/40 dark:text-white/40">
              Products we built and run
            </p>
            <ul className="mt-5 flex flex-wrap justify-center gap-3">
              {products.map((p) => (
                <li key={p.name}>
                  <Link
                    href={p.href}
                    className="inline-flex items-center gap-2.5 rounded-xl border border-black/[.08] bg-white/70 px-3.5 py-2 text-sm font-medium text-black/75 backdrop-blur transition hover:-translate-y-0.5 hover:border-black/20 hover:text-black dark:border-white/10 dark:bg-white/[.04] dark:text-white/75 dark:hover:border-white/25 dark:hover:text-white"
                  >
                    {p.icon ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.icon} alt="" width={24} height={24} className="h-6 w-6 rounded-md bg-white" />
                    ) : (
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-black/[.05] text-xs dark:bg-white/10">
                        {p.glyph}
                      </span>
                    )}
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>Services</Eyebrow>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Everything you need to ship software.
            </h2>
            <p className="mt-3 max-w-xl text-black/60 dark:text-white/60">
              Four ways we work with clients, from a single site to a full
              product team.
            </p>
          </div>
          <Link
            href="/services"
            className="text-sm font-medium text-black/70 hover:text-black dark:text-white/70 dark:hover:text-white"
          >
            All services →
          </Link>
        </div>
        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-black/10 bg-black/10 sm:grid-cols-2 dark:border-white/10 dark:bg-white/10">
          {services.map((s, i) => (
            <div
              key={s.title}
              className="group relative bg-background p-8 transition-colors hover:bg-black/[.015] dark:hover:bg-white/[.03]"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${s.color}`}
                >
                  {s.emoji}
                </div>
                <span className="font-mono text-xs text-black/30 dark:text-white/30">
                  0{i + 1}
                </span>
              </div>
              <h3 className="mt-6 text-lg font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-black/60 dark:text-white/60">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* What we've built */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <Eyebrow>What we&rsquo;ve built</Eyebrow>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Our own products, live in production.
        </h2>
        <p className="mt-3 max-w-xl text-black/60 dark:text-white/60">
          Our own products are the clearest example of how we work.
        </p>

        <div className="relative mt-10 overflow-hidden rounded-3xl bg-[linear-gradient(150deg,#1d0912_0%,#3b0f24_55%,#5a1838_100%)] p-8 text-[#f6e3d6] sm:p-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full border-[22px] border-[#e3b19a]/70 shadow-[0_0_100px_rgba(217,79,122,0.45)]"
          />
          <div className="relative flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/bankers-gold/icon.png" alt="" width={56} height={56} className="h-14 w-14 shrink-0 rounded-2xl bg-white" />
            <div>
              <span className="rounded-full bg-[#e3b19a]/20 px-2.5 py-0.5 text-xs font-medium text-[#f2c46d]">
                New
              </span>
              <h3 className="mt-1.5 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {BANKERS_GOLD.name}
              </h3>
            </div>
          </div>
          <p className="relative mt-5 max-w-xl text-lg text-[#f6e3d6]/80">
            Bank gold-loan auctions on your phone: browse lots, pay the EMD and
            bid live. Banks keep full control of their auctions.
          </p>
          <div className="relative mt-8 flex flex-wrap items-center gap-3">
            <a
              href={BANKERS_GOLD.playStoreUrl}
              target="_blank"
              rel="noopener"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#e3b19a]/50 bg-black px-4 text-sm font-semibold text-white hover:border-[#f2c46d]"
            >
              <span aria-hidden="true">▶</span> Get it on Google Play
            </a>
            {BANKERS_GOLD.appStoreUrl ? (
              <a
                href={BANKERS_GOLD.appStoreUrl}
                target="_blank"
                rel="noopener"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#e3b19a]/50 bg-black px-4 text-sm font-semibold text-white hover:border-[#f2c46d]"
              >
                Download on the App Store
              </a>
            ) : (
              <span className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-dashed border-[#e3b19a]/50 px-4 text-sm font-semibold text-white/60">
                App Store: coming soon
              </span>
            )}
            <Link
              href={BANKERS_GOLD.path}
              className="ml-1 text-sm font-medium text-[#f2c46d] hover:underline hover:underline-offset-4"
            >
              See the product →
            </Link>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Link
            href="/products/dailydo"
            className="group flex flex-col rounded-3xl border border-black/10 bg-gradient-to-b from-blue-50 to-transparent p-8 transition hover:border-blue-300 md:col-span-2 dark:border-white/10 dark:from-blue-950/40 dark:hover:border-blue-700"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-xl text-white shadow-lg shadow-blue-600/30">
                ✓
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-400">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Live
              </span>
            </div>
            <h3 className="mt-6 text-2xl font-semibold tracking-tight">DailyDo</h3>
            <p className="mt-2 text-black/65 dark:text-white/65">
              A subscription task-management platform for teams — offices,
              projects, task assignment, voice dictation, and daily reports,
              with free and paid monthly plans. Designed, built, and operated
              by us, including authentication, billing, and real-time sync.
            </p>
            <span className="mt-auto pt-6 text-sm font-medium text-blue-700 group-hover:underline group-hover:underline-offset-4 dark:text-blue-400">
              See the product →
            </span>
          </Link>

          <div className="grid gap-4">
            <Link
              href="/quizkerala"
              className="group rounded-3xl border border-black/10 p-6 transition hover:border-black/25 dark:border-white/10 dark:hover:border-white/25"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/quizkerala/logo-192.png" alt="" width={44} height={44} className="h-11 w-11 rounded-xl" />
              <h3 className="mt-4 text-lg font-semibold tracking-tight">QuizKerala</h3>
              <p className="mt-1 text-sm text-black/60 dark:text-white/60">
                Timed online quizzes with Google sign-in, join-by-code and a
                live leaderboard where the faster player wins ties.
              </p>
              <span className="mt-3 inline-block text-sm font-medium group-hover:underline group-hover:underline-offset-4">
                Visit QuizKerala →
              </span>
            </Link>
            <Link
              href="/history-clock/app"
              className="group rounded-3xl border-2 border-[#1f2433] bg-[#e8b64c] p-6 text-[#1f2433] shadow-[4px_4px_0_#1f2433] transition hover:-translate-y-0.5 hover:bg-[#f0c868]"
            >
              <span aria-hidden="true" className="text-2xl">🕰</span>
              <h3 className="mt-2 text-lg font-semibold tracking-tight">History Clock</h3>
              <p className="mt-1 text-sm text-[#1f2433]/80">
                Slide through 5,000 years of world history.
              </p>
              <span className="mt-3 inline-block text-sm font-semibold">
                Try it →
              </span>
            </Link>
          </div>
        </div>

        <p className="mt-8 text-sm text-black/60 dark:text-white/60">
          We currently work with clients across India and international markets
          on web, mobile, and SaaS projects. Want to see work relevant to your
          industry?{" "}
          <Link href="/contact" className="font-medium text-foreground underline underline-offset-4">
            Ask us for examples
          </Link>
          .
        </p>
      </section>

      {/* How we work */}
      <section className="border-y border-black/[.06] bg-black/[.015] dark:border-white/[.08] dark:bg-white/[.02]">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <Eyebrow>How we work</Eyebrow>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            One team from first call to production.
          </h2>
          <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="relative border-t border-black/15 pt-5 dark:border-white/15">
                <span className="absolute -top-px left-0 h-px w-10 bg-indigo-500" />
                <span className="font-mono text-xs text-black/40 dark:text-white/40">
                  Step {i + 1}
                </span>
                <h3 className="mt-2 font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-sm text-black/60 dark:text-white/60">{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Pricing model */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <Eyebrow>Pricing</Eyebrow>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Our Pricing Model
        </h2>
        <p className="mt-3 max-w-xl text-black/60 dark:text-white/60">
          How we charge, stated up front. Every engagement is invoiced against
          one of these three models.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {pricingModels.map((p, i) => (
            <div
              key={p.title}
              className={`relative rounded-3xl border p-7 ${
                i === 0
                  ? "border-transparent bg-foreground text-background"
                  : "border-black/10 dark:border-white/10"
              }`}
            >
              <h3 className="text-lg font-semibold tracking-tight">{p.title}</h3>
              <p className={`mt-3 text-sm leading-relaxed ${i === 0 ? "opacity-70" : "text-black/60 dark:text-white/60"}`}>
                {p.desc}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-black/60 dark:text-white/60">
          All prices are quoted in writing before work begins. See our{" "}
          <Link href="/refund-policy" className="underline underline-offset-4">
            Refund &amp; Cancellation Policy
          </Link>{" "}
          for how cancellations and refunds are handled.
        </p>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6">
        <div className="relative isolate overflow-hidden rounded-3xl bg-[#0b0b12] px-8 py-16 text-center text-white sm:px-16">
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-0 -z-10 h-72 w-[48rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(129,140,248,0.55),rgba(236,72,153,0.25),transparent)] blur-2xl"
          />
          <h2 className="mx-auto max-w-2xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Have something to build? Let&rsquo;s talk.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-white/60">
            Tell us what you have in mind and we&rsquo;ll come back with a
            written scope and quote.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/contact"
              className="inline-flex h-12 items-center rounded-full bg-white px-6 text-sm font-medium text-black transition hover:bg-white/90"
            >
              Start a project →
            </Link>
            <a
              href={`mailto:${company.email}`}
              className="inline-flex h-12 items-center rounded-full border border-white/20 px-6 text-sm font-medium text-white transition hover:bg-white/10"
            >
              {company.email}
            </a>
          </div>
        </div>
      </section>

      {/* Company details */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-black/45 dark:text-white/45">
          Company details
        </h2>
        <div className="mt-6 grid gap-8 text-sm sm:grid-cols-3">
          {entities.map((e) => (
            <div key={e.key}>
              <p className="font-medium">{e.legalName}</p>
              <p className="mt-1 text-black/60 dark:text-white/60">
                {e.addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
                {e.ids.map((id) => (
                  <span key={id} className="block">
                    {id}
                  </span>
                ))}
                <span className="mt-2 block">{e.role}</span>
              </p>
            </div>
          ))}
          <div>
            <p className="font-medium">Contact</p>
            <p className="mt-1 text-black/60 dark:text-white/60">
              <a
                className="underline underline-offset-4"
                href={`mailto:${company.email}`}
              >
                {company.email}
              </a>
              <br />
              <a className="underline underline-offset-4" href="tel:+918547985289">
                +91 85479 85289
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
