import Link from "next/link";
import { Bricolage_Grotesque, Instrument_Serif } from "next/font/google";
import { company, entities, officeLines } from "@/lib/company";
import { pricingModels, services } from "@/lib/offerings";
import { BANKERS_GOLD } from "@/lib/bankers-gold/content";
import {
  AuctionScreen,
  HeroStage,
  LeaderboardScreen,
  TasksScreen,
} from "@/components/home/Mockups";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
});

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  variable: "--font-serif",
});

/** Rotating hero words. The first repeats at the end so the loop is seamless. */
const heroWords = ["web apps.", "mobile apps.", "SaaS products.", "APIs.", "web apps."];

const marquee = [
  "Marketing sites",
  "Customer portals",
  "iOS & Android apps",
  "Play Store releases",
  "Subscription billing",
  "Payment gateways",
  "Real-time sync",
  "Dashboards",
  "REST APIs",
  "Cloud deployment",
];

const steps = [
  { title: "Scope", desc: "We agree what gets built, the price, and the milestones in writing." },
  { title: "Build", desc: "Working builds you can click through at every milestone, not just at the end." },
  { title: "Launch", desc: "Deployment, store submission, and monitoring handled by the same team." },
  { title: "Operate", desc: "Hosting, updates, and support for as long as you need them." },
];

/** A small picture for each service card, in the same order as `services`. */
const serviceArt = [
  // Web
  <div key="web" className="rounded-xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900">
    <div className="flex gap-1 border-b border-black/5 px-3 py-2 dark:border-white/5">
      <span className="h-2 w-2 rounded-full bg-red-400" />
      <span className="h-2 w-2 rounded-full bg-amber-400" />
      <span className="h-2 w-2 rounded-full bg-green-400" />
    </div>
    <div className="grid grid-cols-3 gap-2 p-3">
      <div className="col-span-3 h-10 rounded-md bg-[linear-gradient(110deg,#6366f1,#a855f7,#ec4899)]" />
      <div className="h-8 rounded-md bg-black/5 dark:bg-white/10" />
      <div className="h-8 rounded-md bg-black/5 dark:bg-white/10" />
      <div className="h-8 rounded-md bg-black/5 dark:bg-white/10" />
    </div>
  </div>,
  // Mobile
  <div key="mobile" className="mx-auto flex w-24 flex-col gap-1.5 rounded-[1.2rem] border-4 border-zinc-900 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900">
    <div className="h-10 rounded-lg bg-[linear-gradient(140deg,#ec4899,#f97316)]" />
    <div className="h-2 w-3/4 rounded bg-black/10 dark:bg-white/15" />
    <div className="h-2 w-1/2 rounded bg-black/10 dark:bg-white/15" />
    <div className="mt-1 h-5 rounded-md bg-zinc-900 dark:bg-white/80" />
  </div>,
  // SaaS
  <div key="saas" className="flex items-end gap-1.5">
    {[30, 42, 38, 55, 61, 58, 74, 82, 90].map((h, i) => (
      <div
        key={i}
        style={{ height: `${h}px` }}
        className="w-4 rounded-t-md bg-[linear-gradient(to_top,#7c3aed,#c084fc)] opacity-90"
      />
    ))}
  </div>,
  // Backend
  <pre key="api" className="overflow-hidden rounded-xl bg-zinc-950 p-3 font-mono text-[11px] leading-relaxed text-zinc-300">
    <span className="text-teal-400">POST</span> /v1/orders{"\n"}
    <span className="text-zinc-500">→</span> <span className="text-green-400">201</span> Created{"\n"}
    <span className="text-zinc-500">{"{"}</span> <span className="text-sky-300">&quot;status&quot;</span>: <span className="text-amber-300">&quot;paid&quot;</span> <span className="text-zinc-500">{"}"}</span>
  </pre>,
];

export default function Home() {
  return (
    <div className={`${display.variable} ${serif.variable} font-sans`}>
      {/* DailyDo floating bubble */}
      <div className="group fixed bottom-6 right-6 z-50">
        <Link
          href="/products/dailydo"
          className="flex items-center gap-2.5 rounded-full bg-zinc-950 py-2.5 pl-2.5 pr-5 text-sm font-medium text-white shadow-[0_8px_30px_rgba(0,0,0,0.25)] ring-1 ring-white/15 transition-transform hover:scale-[1.04] active:scale-95"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs">
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
      <section className="px-3 pt-3 sm:px-4 sm:pt-4">
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-[#07070c] text-white">
          {/* Aurora */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
            <div className="home-blob absolute -left-[10%] -top-[30%] h-[70%] w-[60%] rounded-full bg-[#4f46e5] opacity-50 blur-[120px]" />
            <div className="home-blob absolute -right-[10%] top-[-20%] h-[60%] w-[55%] rounded-full bg-[#c026d3] opacity-40 blur-[120px] [animation-delay:-6s]" />
            <div className="home-blob absolute bottom-[-10%] left-[25%] h-[50%] w-[50%] rounded-full bg-[#a83a5e] opacity-40 blur-[120px] [animation-delay:-12s]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_30%,#000_30%,transparent_100%)]" />
          </div>

          <div className="mx-auto max-w-6xl px-6 pt-16 text-center sm:pt-24">
            <Link
              href={BANKERS_GOLD.path}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 py-1 pl-1 pr-3 text-sm text-white/80 backdrop-blur transition-colors hover:border-white/30 hover:bg-white/10"
            >
              <span className="rounded-full bg-[linear-gradient(110deg,#f2c46d,#e3b19a)] px-2 py-0.5 text-xs font-semibold text-[#3b0f24]">
                New
              </span>
              {BANKERS_GOLD.name}, bank gold auctions on your phone
              <span aria-hidden="true">→</span>
            </Link>

            <h1 className="mx-auto mt-8 max-w-5xl font-[family-name:var(--font-display)] text-[clamp(2.75rem,8vw,6.5rem)] font-bold leading-[0.95] tracking-[-0.045em]">
              <span className="sr-only">
                Software Development &amp; SaaS Solutions for Global Businesses.
              </span>
              <span aria-hidden="true" className="block">We design &amp; build</span>
              <span
                aria-hidden="true"
                className="relative mt-1 block h-[1.1em] overflow-hidden"
              >
                <span className="home-words block">
                  {heroWords.map((w, i) => (
                    <span
                      key={i}
                      className="home-shine block h-[1.1em] bg-[linear-gradient(110deg,#a5b4fc,#e879f9,#f9a8d4,#fcd34d,#a5b4fc)] bg-clip-text pb-[0.1em] font-[family-name:var(--font-serif)] font-normal italic tracking-[-0.02em] text-transparent"
                    >
                      {w}
                    </span>
                  ))}
                </span>
              </span>
            </h1>

            <p className="mx-auto mt-8 max-w-2xl text-pretty text-lg text-white/65 sm:text-xl">
              Software development &amp; SaaS solutions for global businesses. We
              build web applications, mobile apps, and scalable SaaS platforms
              for international clients.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link
                href="/contact"
                className="group inline-flex h-13 items-center gap-2 rounded-full bg-white px-7 text-sm font-semibold text-black shadow-[0_0_40px_rgba(165,180,252,0.45)] transition hover:shadow-[0_0_60px_rgba(232,121,249,0.6)]"
              >
                Start a project
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <Link
                href="/services"
                className="inline-flex h-13 items-center rounded-full border border-white/20 bg-white/5 px-7 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
              >
                View services
              </Link>
            </div>
            <p className="mt-6 text-sm text-white/40">
              {company.legalName} &middot; {officeLines.join(", ")}
            </p>

            <div className="mt-14">
              <HeroStage />
            </div>
          </div>

          {/* Fade the phones into the panel edge */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(to_top,#07070c,transparent)]" />
        </div>
      </section>

      {/* Marquee */}
      <div className="relative overflow-hidden py-8 [mask-image:linear-gradient(to_right,transparent,#000_10%,#000_90%,transparent)]">
        <ul className="home-marquee flex w-max gap-10 whitespace-nowrap">
          {[...marquee, ...marquee].map((m, i) => (
            <li
              key={i}
              aria-hidden={i >= marquee.length}
              className="flex items-center gap-10 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-black/25 dark:text-white/25"
            >
              {m}
              <span className="text-indigo-500/60">✦</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Services */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="home-reveal flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Services</p>
            <h2 className="mt-3 max-w-2xl font-[family-name:var(--font-display)] text-4xl font-bold tracking-[-0.035em] sm:text-6xl">
              Everything you need to{" "}
              <span className="font-[family-name:var(--font-serif)] font-normal italic text-indigo-600 dark:text-indigo-400">
                ship
              </span>{" "}
              software.
            </h2>
            <p className="mt-4 max-w-xl text-lg text-black/60 dark:text-white/60">
              Four ways we work with clients, from a single site to a full
              product team.
            </p>
          </div>
          <Link
            href="/services"
            className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-medium transition hover:bg-black/[.04] dark:border-white/15 dark:hover:bg-white/[.06]"
          >
            All services →
          </Link>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-5">
          {services.map((s, i) => (
            <div
              key={s.title}
              className={`home-reveal group relative overflow-hidden rounded-[1.75rem] border border-black/[.08] bg-[linear-gradient(160deg,rgba(0,0,0,0.025),transparent_60%)] p-8 transition duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-[0_30px_60px_-30px_rgba(79,70,229,0.45)] dark:border-white/10 dark:bg-[linear-gradient(160deg,rgba(255,255,255,0.05),transparent_60%)] dark:hover:border-indigo-500/50 ${
                i === 0 || i === 3 ? "md:col-span-3" : "md:col-span-2"
              }`}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-indigo-400/0 blur-3xl transition duration-500 group-hover:bg-indigo-400/25"
              />
              <div className="flex h-36 items-center justify-center" aria-hidden="true">
                <div className="w-full max-w-[260px] transition duration-500 group-hover:scale-105">
                  {serviceArt[i]}
                </div>
              </div>
              <div className="mt-8 flex items-center gap-3">
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg ${s.color}`}>
                  {s.emoji}
                </span>
                <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight">
                  {s.title}
                </h3>
              </div>
              <p className="mt-3 text-[15px] leading-relaxed text-black/60 dark:text-white/60">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* What we've built */}
      <section className="px-3 sm:px-4">
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-[#07070c] py-24 text-white">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
            <div className="home-blob absolute right-[-10%] top-[10%] h-[40%] w-[40%] rounded-full bg-[#4f46e5] opacity-25 blur-[140px]" />
            <div className="home-blob absolute bottom-[0%] left-[-10%] h-[40%] w-[40%] rounded-full bg-[#a83a5e] opacity-30 blur-[140px] [animation-delay:-9s]" />
          </div>
          <div className="mx-auto max-w-6xl px-6">
            <div className="home-reveal">
              <p className="text-sm font-semibold text-[#f2c46d]">What we&rsquo;ve built</p>
              <h2 className="mt-3 max-w-3xl font-[family-name:var(--font-display)] text-4xl font-bold tracking-[-0.035em] sm:text-6xl">
                Our own products,{" "}
                <span className="font-[family-name:var(--font-serif)] font-normal italic text-[#f2c46d]">
                  live
                </span>{" "}
                in production.
              </h2>
              <p className="mt-4 max-w-xl text-lg text-white/60">
                Our own products are the clearest example of how we work.
              </p>
            </div>

            {/* Bankers Gold */}
            <div className="home-reveal relative mt-14 grid items-center gap-10 overflow-hidden rounded-[1.75rem] bg-[linear-gradient(150deg,#1d0912_0%,#3b0f24_55%,#5a1838_100%)] p-8 text-[#f6e3d6] ring-1 ring-[#e3b19a]/20 sm:p-12 lg:grid-cols-[1.2fr_1fr]">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full border-[22px] border-[#e3b19a]/40 shadow-[0_0_100px_rgba(217,79,122,0.35)]"
              />
              <div className="relative">
                <div className="flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/bankers-gold/icon.png" alt="" width={56} height={56} className="h-14 w-14 shrink-0 rounded-2xl bg-white" />
                  <div>
                    <span className="rounded-full bg-[#e3b19a]/20 px-2.5 py-0.5 text-xs font-medium text-[#f2c46d]">
                      New
                    </span>
                    <h3 className="mt-1.5 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-white sm:text-4xl">
                      {BANKERS_GOLD.name}
                    </h3>
                  </div>
                </div>
                <p className="mt-6 max-w-md text-lg text-[#f6e3d6]/80">
                  Bank gold-loan auctions on your phone: browse lots, pay the
                  EMD and bid live. Banks keep full control of their auctions.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
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
              <div className="relative hidden justify-center lg:flex" aria-hidden="true">
                <div className="home-float w-[230px] rounded-[2.4rem] border border-white/15 bg-[#0d0d14] p-2 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.7)] [transform:rotate(4deg)]">
                  <div className="h-[440px] overflow-hidden rounded-[2rem]">
                    <AuctionScreen />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              {/* DailyDo */}
              <Link
                href="/products/dailydo"
                className="home-reveal group relative overflow-hidden rounded-[1.75rem] bg-[linear-gradient(160deg,#1e3a8a,#0b1530)] p-8 ring-1 ring-white/10 transition hover:ring-blue-400/50 lg:col-span-2"
              >
                <div className="grid gap-8 sm:grid-cols-[1fr_200px]">
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500 text-xl text-white shadow-lg shadow-blue-500/40">
                        ✓
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-400/15 px-2.5 py-0.5 text-xs font-medium text-green-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                        Live
                      </span>
                    </div>
                    <h3 className="mt-6 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
                      DailyDo
                    </h3>
                    <p className="mt-3 text-white/70">
                      A subscription task-management platform for teams —
                      offices, projects, task assignment, voice dictation, and
                      daily reports, with free and paid monthly plans.
                      Designed, built, and operated by us, including
                      authentication, billing, and real-time sync.
                    </p>
                    <span className="mt-auto pt-6 text-sm font-semibold text-blue-300 group-hover:underline group-hover:underline-offset-4">
                      See the product →
                    </span>
                  </div>
                  <div className="relative hidden h-[300px] overflow-hidden rounded-[1.6rem] border border-white/15 sm:block" aria-hidden="true">
                    <div className="h-[420px] origin-top transition duration-700 group-hover:-translate-y-16">
                      <TasksScreen />
                    </div>
                  </div>
                </div>
              </Link>

              <div className="grid gap-4">
                {/* QuizKerala */}
                <Link
                  href="/quizkerala"
                  className="home-reveal group relative overflow-hidden rounded-[1.75rem] bg-[linear-gradient(160deg,#065f46,#022c22)] p-7 ring-1 ring-white/10 transition hover:ring-emerald-400/50"
                >
                  <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -right-16 w-[180px] rotate-[-8deg] overflow-hidden rounded-[1.4rem] opacity-40 transition duration-500 group-hover:-translate-y-6 group-hover:opacity-70">
                    <div className="h-[360px]">
                      <LeaderboardScreen />
                    </div>
                  </div>
                  <div className="relative max-w-[70%]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/quizkerala/logo-192.png" alt="" width={44} height={44} className="h-11 w-11 rounded-xl" />
                    <h3 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
                      QuizKerala
                    </h3>
                    <p className="mt-2 text-sm text-white/70">
                      Timed online quizzes with Google sign-in, join-by-code
                      and a live leaderboard where the faster player wins ties.
                    </p>
                    <span className="mt-3 inline-block text-sm font-semibold text-emerald-300 group-hover:underline group-hover:underline-offset-4">
                      Visit QuizKerala →
                    </span>
                  </div>
                </Link>

                {/* History Clock */}
                <Link
                  href="/history-clock/app"
                  className="home-reveal group relative overflow-hidden rounded-[1.75rem] border-2 border-[#1f2433] bg-[#e8b64c] p-7 text-[#1f2433] shadow-[5px_5px_0_#f6e3d6] transition hover:-translate-y-1 hover:bg-[#f0c868]"
                >
                  <div
                    aria-hidden="true"
                    className="absolute -right-8 -top-8 h-32 w-32 rounded-full border-[6px] border-[#1f2433]"
                  >
                    <div className="absolute left-1/2 top-1/2 h-12 w-1.5 origin-top -translate-x-1/2 rotate-[200deg] rounded-full bg-[#1f2433] transition duration-1000 group-hover:rotate-[560deg]" />
                    <div className="absolute left-1/2 top-1/2 h-8 w-1.5 origin-top -translate-x-1/2 rotate-[110deg] rounded-full bg-[#1f2433]" />
                  </div>
                  <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
                    History Clock
                  </h3>
                  <p className="mt-2 max-w-[75%] text-sm text-[#1f2433]/80">
                    Slide through 5,000 years of world history.
                  </p>
                  <span className="mt-3 inline-block text-sm font-bold">Try it →</span>
                </Link>
              </div>
            </div>

            <p className="mt-10 text-sm text-white/55">
              We currently work with clients across India and international
              markets on web, mobile, and SaaS projects. Want to see work
              relevant to your industry?{" "}
              <Link href="/contact" className="font-semibold text-white underline underline-offset-4">
                Ask us for examples
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* How we work */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="home-reveal">
          <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">How we work</p>
          <h2 className="mt-3 max-w-3xl font-[family-name:var(--font-display)] text-4xl font-bold tracking-[-0.035em] sm:text-6xl">
            One team from first call to{" "}
            <span className="font-[family-name:var(--font-serif)] font-normal italic text-indigo-600 dark:text-indigo-400">
              production.
            </span>
          </h2>
        </div>
        <ol className="relative mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div aria-hidden="true" className="absolute left-0 right-0 top-7 hidden h-px bg-[linear-gradient(90deg,#6366f1,#d946ef,#f59e0b)] lg:block" />
          {steps.map((s, i) => (
            <li key={s.title} className="home-reveal relative">
              <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-black/10 bg-background font-[family-name:var(--font-display)] text-xl font-bold shadow-sm dark:border-white/15">
                {i + 1}
              </span>
              <h3 className="mt-6 font-[family-name:var(--font-display)] text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-[15px] text-black/60 dark:text-white/60">{s.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Pricing model */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="home-reveal">
          <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Pricing</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold tracking-[-0.035em] sm:text-6xl">
            Our Pricing Model
          </h2>
          <p className="mt-4 max-w-xl text-lg text-black/60 dark:text-white/60">
            How we charge, stated up front. Every engagement is invoiced
            against one of these three models.
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {pricingModels.map((p, i) => (
            <div
              key={p.title}
              className={`home-reveal relative overflow-hidden rounded-[1.75rem] p-8 transition hover:-translate-y-1 ${
                i === 0
                  ? "bg-[linear-gradient(150deg,#4f46e5,#9333ea_60%,#db2777)] text-white shadow-[0_30px_60px_-25px_rgba(147,51,234,0.6)]"
                  : "border border-black/10 dark:border-white/10"
              }`}
            >
              <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
                {p.title}
              </h3>
              <p className={`mt-3 text-[15px] leading-relaxed ${i === 0 ? "text-white/80" : "text-black/60 dark:text-white/60"}`}>
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
      <section className="px-3 sm:px-4">
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-[#07070c] px-6 py-24 text-center text-white sm:py-32">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
            <div className="home-blob absolute left-[10%] top-[20%] h-[60%] w-[40%] rounded-full bg-[#4f46e5] opacity-45 blur-[120px]" />
            <div className="home-blob absolute right-[10%] top-[30%] h-[60%] w-[40%] rounded-full bg-[#db2777] opacity-35 blur-[120px] [animation-delay:-8s]" />
          </div>
          <h2 className="home-reveal mx-auto max-w-4xl font-[family-name:var(--font-display)] text-[clamp(3rem,10vw,8rem)] font-bold leading-[0.9] tracking-[-0.05em]">
            Let&rsquo;s build{" "}
            <span className="home-shine bg-[linear-gradient(110deg,#a5b4fc,#e879f9,#f9a8d4,#fcd34d,#a5b4fc)] bg-clip-text font-[family-name:var(--font-serif)] font-normal italic tracking-[-0.02em] text-transparent">
              yours.
            </span>
          </h2>
          <p className="mx-auto mt-8 max-w-lg text-lg text-white/60">
            Tell us what you have in mind and we&rsquo;ll come back with a
            written scope and quote.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              href="/contact"
              className="inline-flex h-13 items-center rounded-full bg-white px-7 text-sm font-semibold text-black shadow-[0_0_40px_rgba(165,180,252,0.45)] transition hover:shadow-[0_0_60px_rgba(232,121,249,0.6)]"
            >
              Start a project →
            </Link>
            <a
              href={`mailto:${company.email}`}
              className="inline-flex h-13 items-center rounded-full border border-white/20 bg-white/5 px-7 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
            >
              {company.email}
            </a>
          </div>
        </div>
      </section>

      {/* Company details */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45 dark:text-white/45">
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
              <a className="underline underline-offset-4" href={`mailto:${company.email}`}>
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
