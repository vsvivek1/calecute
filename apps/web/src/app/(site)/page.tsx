import Link from "next/link";
import { Bricolage_Grotesque } from "next/font/google";
import { company, entities } from "@/lib/company";
import { pricingModels, services } from "@/lib/offerings";
import { BANKERS_GOLD } from "@/lib/bankers-gold/content";
import { STATIC_APPS } from "@/lib/static-apps";

/*
 * Landing page.
 *
 * Idea: the strongest proof that a small Kozhikode studio is real is the
 * number of real apps it has shipped, so the hero IS the app shelf.
 * One accent idea: the kasavu border (gold double stripe of a Kerala saree)
 * marks the edge of the hero. Everything else stays quiet.
 *
 * Tokens: ink #13201B, backwater #0E5E4F, mist #EAF2EF, kasavu #B8892B.
 */

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  variable: "--font-display",
});

type ShelfApp = { name: string; href: string; image: string };

const SHELF: ShelfApp[] = [
  { name: BANKERS_GOLD.name, href: BANKERS_GOLD.path, image: "/bankers-gold/icon.png" },
  { name: "BankMates", href: "/apps/bankmates", image: "/bankmates/icon.png" },
  { name: "Recallio", href: "/apps/recallio", image: "/recallio/icon.png" },
  { name: "Work Force", href: "/apps/workforce", image: "/workforce/icon.png" },
  ...STATIC_APPS.map(({ name, href, image }) => ({ name, href, image })),
];

const featured = [
  {
    name: BANKERS_GOLD.name,
    line: "Bank gold-loan auctions on your phone. Browse lots, pay the EMD, bid live.",
    href: BANKERS_GOLD.path,
    image: "/bankers-gold/icon.png",
  },
  {
    name: "Muhurtham Clock",
    line: "The Kerala panchangam as a live clock: Rahu kalam, horas, Abhijit muhurtham.",
    href: "/muhurtham-clock",
    image: "/muhurtham-clock/assets/icon-192.png",
  },
  {
    name: "History Clock",
    line: "Slide through 5,000 years of world history on one dial.",
    href: "/history-clock/app",
    image: null,
  },
  {
    name: "DailyDo",
    line: "Task management for teams, with voice dictation and daily reports.",
    href: "/products/dailydo",
    image: null,
  },
];

export default function Home() {
  return (
    <div className={`${display.variable} home text-[#13201B] dark:text-[#E8EFEC]`}>
      {/* Hero: headline left, app shelf right */}
      <section className="mx-auto grid max-w-5xl gap-12 px-6 pb-16 pt-16 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:pt-24">
        <div>
          <h1
            className="font-[family-name:var(--font-display)] text-[clamp(2.75rem,7vw,5.25rem)] font-extrabold leading-[0.95] tracking-[-0.03em]"
          >
            Apps for Kerala, built in Kozhikode.
          </h1>
          <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-[#13201B]/75 dark:text-[#E8EFEC]/75">
            We make mobile apps and web software for students, banks, farmers
            and small businesses. We build the same for clients in India and
            abroad.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
            <Link
              href="/contact"
              className="rounded-full bg-[#0E5E4F] px-6 py-3.5 text-sm font-semibold text-white hover:bg-[#0B4C40] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E5E4F]"
            >
              Start a project
            </Link>
            <Link
              href="/apps"
              className="text-sm font-semibold underline decoration-[#B8892B] decoration-2 underline-offset-[6px] hover:decoration-[#0E5E4F]"
            >
              See all {SHELF.length} apps
            </Link>
          </div>
        </div>

        <div>
          <ul className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-5" aria-label="Apps we have published">
            {SHELF.map((app, i) => (
              <li key={app.href} className="shelf-item" style={{ animationDelay: `${i * 40}ms` }}>
                <Link
                  href={app.href}
                  title={app.name}
                  className="block rounded-[22%] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E5E4F]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={app.image}
                    alt={app.name}
                    width={96}
                    height={96}
                    loading={i < 10 ? "eager" : "lazy"}
                    className="aspect-square w-full rounded-[22%] bg-white object-cover ring-1 ring-black/5 transition-transform hover:-translate-y-0.5 dark:ring-white/10"
                  />
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-[#13201B]/60 dark:text-[#E8EFEC]/60">
            Every icon here is a live app or site we built and run.
          </p>
        </div>
      </section>

      {/* Kasavu border */}
      <div aria-hidden="true" className="mx-auto max-w-5xl px-6">
        <div className="h-[5px] bg-[#B8892B]" />
        <div className="mt-[3px] h-px bg-[#B8892B]" />
      </div>

      <div className="mx-auto max-w-5xl px-6">
        {/* New and notable */}
        <section className="grid gap-10 py-20 lg:grid-cols-[1fr_2fr]">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
            New and notable
          </h2>
          <ul className="divide-y divide-[#13201B]/10 dark:divide-white/10">
            {featured.map((f) => (
              <li key={f.href}>
                <Link href={f.href} className="group flex items-center gap-5 py-5">
                  {f.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.image} alt="" width={56} height={56} className="h-14 w-14 shrink-0 rounded-2xl bg-white ring-1 ring-black/5" />
                  ) : (
                    <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EAF2EF] font-[family-name:var(--font-display)] text-xl font-bold text-[#0E5E4F] dark:bg-[#0E5E4F]/30 dark:text-[#CFE6DF]">
                      {f.name.charAt(0)}
                    </span>
                  )}
                  <span>
                    <span className="block text-lg font-semibold group-hover:text-[#0E5E4F] dark:group-hover:text-[#7FC4B4]">
                      {f.name}
                    </span>
                    <span className="block text-[#13201B]/70 dark:text-[#E8EFEC]/70">{f.line}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Services */}
        <section className="grid gap-10 border-t border-[#13201B]/10 py-20 dark:border-white/10 lg:grid-cols-[1fr_2fr]">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
              Build with us
            </h2>
            <p className="mt-3 max-w-xs text-[#13201B]/70 dark:text-[#E8EFEC]/70">
              The team that ships our own apps can build yours.
            </p>
          </div>
          <dl className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {services.map((s) => (
              <div key={s.title}>
                <dt className="font-semibold">{s.title}</dt>
                <dd className="mt-1.5 text-[#13201B]/70 dark:text-[#E8EFEC]/70">{s.desc}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Pricing */}
        <section className="grid gap-10 border-t border-[#13201B]/10 py-20 dark:border-white/10 lg:grid-cols-[1fr_2fr]">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
              How we charge
            </h2>
            <p className="mt-3 max-w-xs text-[#13201B]/70 dark:text-[#E8EFEC]/70">
              Every price is quoted in writing before work begins.
            </p>
          </div>
          <div>
            <dl className="grid gap-x-10 gap-y-8 sm:grid-cols-3">
              {pricingModels.map((p) => (
                <div key={p.title}>
                  <dt className="font-semibold">{p.title}</dt>
                  <dd className="mt-1.5 text-sm text-[#13201B]/70 dark:text-[#E8EFEC]/70">{p.desc}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-8 text-sm text-[#13201B]/70 dark:text-[#E8EFEC]/70">
              Cancellations and refunds follow our{" "}
              <Link href="/refund-policy" className="underline underline-offset-2">
                Refund &amp; Cancellation Policy
              </Link>
              .
            </p>
          </div>
        </section>

        {/* Company details */}
        <section className="grid gap-10 border-t border-[#13201B]/10 py-20 dark:border-white/10 lg:grid-cols-[1fr_2fr]">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
            Company details
          </h2>
          <div className="grid gap-8 text-sm sm:grid-cols-3">
            {entities.map((e) => (
              <div key={e.key}>
                <p className="font-semibold">{e.legalName}</p>
                <p className="mt-1.5 text-[#13201B]/70 dark:text-[#E8EFEC]/70">
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
              <p className="font-semibold">Contact</p>
              <p className="mt-1.5 text-[#13201B]/70 dark:text-[#E8EFEC]/70">
                <a className="block underline underline-offset-2" href={`mailto:${company.email}`}>
                  {company.email}
                </a>
                <a className="block underline underline-offset-2" href="tel:+918547985289">
                  +91 85479 85289
                </a>
              </p>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        .home .shelf-item { animation: shelf-in 420ms cubic-bezier(.2,.7,.2,1) both; }
        @keyframes shelf-in { from { opacity: 0; transform: translateY(8px) scale(.96); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .home .shelf-item { animation: none; } }
      `}</style>
    </div>
  );
}
