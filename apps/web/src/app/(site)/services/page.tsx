import Link from "next/link";
import { pricingModels, services } from "@/lib/offerings";
import { serviceArt } from "@/components/site/ServiceArt";
import {
  Accent,
  CtaPanel,
  PageHero,
  SectionHeading,
  ghostButton,
  primaryButton,
} from "@/components/site/Bold";

export const metadata = {
  title: "Services | Calecutech",
  description:
    "Custom web development, mobile app development, SaaS product development, and backend & API systems for businesses worldwide.",
};

export default function ServicesPage() {
  return (
    <div className="font-sans">
      <PageHero
        eyebrow="Services"
        title={
          <>
            From a single site to a full <Accent onDark>product team.</Accent>
          </>
        }
        lede="We build web applications, mobile apps, and scalable SaaS platforms for international clients — from a single site to a full product team."
      >
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/contact" className={primaryButton}>
            Start a project
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
          <a href="#pricing" className={ghostButton}>
            See pricing
          </a>
        </div>
        <ul className="mt-14 flex flex-wrap gap-2">
          {services.map((s) => (
            <li
              key={s.title}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-sm text-white/75"
            >
              <span aria-hidden="true">{s.emoji}</span>
              {s.title}
            </li>
          ))}
        </ul>
      </PageHero>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <SectionHeading
          eyebrow="What we do"
          title={
            <>
              Four ways to <Accent>work</Accent> with us.
            </>
          }
        />
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {services.map((s, i) => (
            <div
              key={s.title}
              className="home-reveal group relative overflow-hidden rounded-[1.75rem] border border-black/[.08] bg-[linear-gradient(160deg,rgba(0,0,0,0.025),transparent_60%)] p-8 transition duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-[0_30px_60px_-30px_rgba(79,70,229,0.45)] dark:border-white/10 dark:bg-[linear-gradient(160deg,rgba(255,255,255,0.05),transparent_60%)] dark:hover:border-indigo-500/50"
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
                <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
                  {s.title}
                </h2>
              </div>
              <p className="mt-3 text-[15px] leading-relaxed text-black/60 dark:text-white/60">
                {s.desc}
              </p>
              <ul className="mt-6 grid gap-2 border-t border-black/[.06] pt-6 text-sm text-black/75 dark:border-white/10 dark:text-white/75">
                {s.details.map((d) => (
                  <li key={d} className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[linear-gradient(110deg,#6366f1,#d946ef)]"
                    />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl scroll-mt-24 px-6 pb-24">
        <SectionHeading
          eyebrow="Pricing"
          title="Our Pricing Model"
          lede="Every engagement is invoiced against one of these three models, agreed in writing before work begins."
        />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {pricingModels.map((p, i) => (
            <div
              key={p.title}
              className={`home-reveal relative flex flex-col overflow-hidden rounded-[1.75rem] p-8 transition hover:-translate-y-1 ${
                i === 0
                  ? "bg-[linear-gradient(150deg,#4f46e5,#9333ea_60%,#db2777)] text-white shadow-[0_30px_60px_-25px_rgba(147,51,234,0.6)]"
                  : "border border-black/10 dark:border-white/10"
              }`}
            >
              <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
                {p.title}
              </h3>
              <p className={`mt-3 text-[15px] font-medium leading-relaxed ${i === 0 ? "text-white/90" : "text-black/75 dark:text-white/80"}`}>
                {p.desc}
              </p>
              <p className={`mt-4 border-t pt-4 text-sm leading-relaxed ${i === 0 ? "border-white/20 text-white/75" : "border-black/[.06] text-black/60 dark:border-white/10 dark:text-white/60"}`}>
                {p.detail}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-black/60 dark:text-white/60">
          See our{" "}
          <Link href="/refund-policy" className="underline underline-offset-4">
            Refund &amp; Cancellation Policy
          </Link>{" "}
          for how cancellations and refunds are handled, and our{" "}
          <Link href="/terms" className="underline underline-offset-4">
            Terms of Service
          </Link>{" "}
          for the full engagement terms.
        </p>
      </section>

      <CtaPanel
        title={
          <>
            Start a <Accent onDark>project.</Accent>
          </>
        }
        lede="Tell us what you're building and we'll come back with a scope, a timeline, and a written quote."
        primary={{ href: "/contact", label: "Get in touch" }}
      />
    </div>
  );
}
