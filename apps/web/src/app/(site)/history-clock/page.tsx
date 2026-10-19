import Link from "next/link";
import type { Metadata } from "next";
import { Builder, ClockMascot, Emperor, Globe, Poet, SliderDoodle, Thinker } from "@/components/history-clock/Doodles";
import s from "@/components/history-clock/sketch.module.css";
import { SITE_ORIGIN, historyClock, policyLinks } from "@/lib/history-clock/content";
import { regions } from "@/lib/history-clock/regions";

const title = "History Clock: spin the clock, watch empires rise and fall | Calecutech";
const description =
  "History Clock is an interactive world history map by Calecutech. Pick a place, slide through time, and meet the dynasties, monuments, thinkers, arts and literature of that place and period.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_ORIGIN}/history-clock` },
  openGraph: {
    title: `History Clock: ${historyClock.tagline}`,
    description,
    url: `${SITE_ORIGIN}/history-clock`,
    siteName: "Calecutech",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: `History Clock: ${historyClock.tagline}`,
    description,
  },
};

const cast = [
  {
    Figure: Emperor,
    who: "The Emperors",
    what: "Dynasties and empires: when they rise, how far they reach, when they break.",
    colour: "#8a4f7d",
  },
  {
    Figure: Builder,
    who: "The Builders",
    what: "Temples, mosques, palaces, forts and pyramids, placed in their century.",
    colour: "#d9653b",
  },
  {
    Figure: Thinker,
    who: "The Thinkers",
    what: "Philosophers, mathematicians, reformers and scientists, where and when they worked.",
    colour: "#2f7f7a",
  },
  {
    Figure: Poet,
    who: "The Poets",
    what: "Epics, novels, theatre and art that grew up alongside the politics.",
    colour: "#e8b64c",
  },
];

const steps = [
  { Figure: Globe, title: "Pick a place", body: "Tap a coloured region on the world map, or pick one from the list." },
  { Figure: SliderDoodle, title: "Slide the clock", body: "Drag from 3200 BCE to today, jump to an era, or press Play and watch." },
  { Figure: Emperor, title: "Meet the cast", body: "See who rules, who is rising or breaking, and what is being built, thought and written." },
];

const faqs = [
  [
    "Is History Clock finished?",
    "No. The map is a first version with hand-picked entries for a dozen regions. We will add regions and entries over time.",
  ],
  [
    "Where do the dates come from?",
    "Each entry is written by hand from standard reference dates. Approximate dates are marked “c.” and disputed ones say so. We do not generate entries automatically.",
  ],
  [
    "Why are the borders on the map modern?",
    "They help you find your way. The map does not yet draw historical borders, so the panel below the map tells you who held power instead.",
  ],
  ["Do I need an account?", "No. The map and the quiz work without sign-in and save nothing about you."],
  ["How do I report a mistake?", "Write to us through the contact page. We review every correction."],
] as const;

export default function HistoryClockPage() {
  const entryCount = regions.reduce((n, r) => n + r.entries.length, 0);

  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="px-4 pb-16 pt-10 sm:px-6 sm:pt-16">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className={`${s.chip} inline-block bg-[#bfe0dc]`}>A Calecutech project · first version, free to try</p>
            <h1 className={`${s.hand} mt-5 text-6xl leading-[0.95] sm:text-7xl lg:text-8xl`}>
              History <span className={s.scribble}>Clock</span>
            </h1>
            <p className={`${s.hand} mt-4 text-3xl leading-tight text-[#d9653b] sm:text-4xl`}>
              {historyClock.tagline}
            </p>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[#4a4f5e]">
              Pick any corner of the world, wind the clock back a few thousand years, and watch the dynasties,
              monuments, thinkers and poets of that place come and go.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href={historyClock.appPath} className={`${s.btn} ${s.btnPrimary} text-lg`}>
                Try the history map →
              </Link>
              <Link href={historyClock.quizPath} className={`${s.btn} ${s.btnTeal} text-lg`}>
                Try now: Kerala quiz
              </Link>
            </div>
            <p className="mt-5 text-sm text-[#4a4f5e]">
              {regions.length} regions · {entryCount} hand-picked entries · 5,000 years · no sign-in
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-sm">
            <div className={`${s.card} ${s.tiltRight} absolute -left-2 top-6 z-10 px-3 py-2 sm:-left-8`}>
              <p className={`${s.hand} text-xl leading-none`}>1500 CE, Kerala</p>
              <p className="text-xs text-[#4a4f5e]">Zamorins rule Calicut</p>
            </div>
            <ClockMascot className={`${s.wobble} h-auto w-full`} />
            <div className={`${s.card} ${s.tiltLeft} absolute -right-1 bottom-10 px-3 py-2 sm:-right-6`}>
              <p className={`${s.hand} text-xl leading-none`}>1453 CE, Istanbul</p>
              <p className="text-xs text-[#4a4f5e]">Byzantium breaks</p>
            </div>
          </div>
        </div>
      </section>

      {/* The cast */}
      <section className="border-y-[3px] border-[#1f2433] bg-[#f3e6c8] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className={`${s.hand} text-5xl leading-tight`}>Meet the cast of every century</h2>
          <p className="mt-3 max-w-2xl text-lg text-[#4a4f5e]">
            Every place on the map has the same four kinds of characters. Move the clock and a new crowd
            walks on stage.
          </p>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {cast.map(({ Figure, who, what, colour }, i) => (
              <li key={who} className={`${s.card} ${i % 2 ? s.tiltRight : s.tiltLeft} p-5`}>
                <div className="flex h-32 items-end justify-center rounded-xl border-2 border-[#1f2433]" style={{ background: `${colour}33` }}>
                  <Figure className="h-28 w-28" />
                </div>
                <h3 className={`${s.hand} mt-4 text-3xl`}>{who}</h3>
                <p className="mt-1 leading-7 text-[#4a4f5e]">{what}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-8 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className={`${s.hand} text-5xl leading-tight`}>How it works</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {steps.map(({ Figure, title, body }, i) => (
              <li key={title} className={`${s.card} p-6`}>
                <div className="flex items-center gap-4">
                  <span className={`${s.hand} flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-[2.5px] border-[#1f2433] bg-[#e8b64c] text-3xl`}>
                    {i + 1}
                  </span>
                  <h3 className={`${s.hand} text-3xl`}>{title}</h3>
                </div>
                <Figure className="mx-auto mt-4 h-24 w-auto" />
                <p className="mt-4 leading-7 text-[#4a4f5e]">{body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 text-center">
            <Link href={historyClock.appPath} className={`${s.btn} ${s.btnPrimary} text-lg`}>
              Spin the clock now →
            </Link>
          </div>
        </div>
      </section>

      {/* Quiz teaser */}
      <section className="px-4 pb-16 sm:px-6">
        <div className={`${s.card} mx-auto grid max-w-6xl items-center gap-8 bg-[#2f7f7a] p-6 text-white sm:p-10 md:grid-cols-[1fr_auto]`} style={{ background: "#2f7f7a" }}>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#fbf3e0]">Try now</p>
            <h2 className={`${s.hand} mt-2 text-5xl leading-tight`}>The Kerala history quiz</h2>
            <p className="mt-3 max-w-xl text-lg leading-8 text-[#eef6f5]">
              From Muziris pepper to the Vaikom Satyagraha. Ten questions, each with the story behind the
              answer. Can you make royal historian of the Zamorin?
            </p>
          </div>
          <Link href={historyClock.quizPath} className={`${s.btn} ${s.btnPrimary} justify-center text-lg`}>
            Take the quiz →
          </Link>
        </div>
      </section>

      {/* Honest history */}
      <section className="border-y-[3px] border-[#1f2433] bg-[#1f2433] px-4 py-16 text-[#fbf3e0] sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className={`${s.hand} text-5xl leading-tight`}>Playful look, honest dates</h2>
          <ul className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              ["Written by hand", "Every entry is checked against standard reference dates. Nothing is generated."],
              ["“c.” means circa", "Approximate dates are marked, and the note says when historians disagree."],
              ["Gaps are gaps", "If a region has no entry for a year, the map says so instead of inventing one."],
            ].map(([head, body]) => (
              <li key={head} className="rounded-2xl border-2 border-dashed border-[#e8b64c] p-6">
                <h3 className={`${s.hand} text-3xl text-[#e8b64c]`}>{head}</h3>
                <p className="mt-2 leading-7 text-[#e6e2d6]">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className={`${s.hand} text-5xl leading-tight`}>Questions people ask</h2>
          <div className="mt-8 space-y-4">
            {faqs.map(([q, a]) => (
              <details key={q} className={`${s.card} group p-5`}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d9653b]">
                  {q}
                  <span aria-hidden="true" className={`${s.hand} text-3xl leading-none transition-transform group-open:rotate-45`}>
                    +
                  </span>
                </summary>
                <p className="mt-3 leading-7 text-[#4a4f5e]">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20 text-center sm:px-6">
        <div className="mx-auto max-w-2xl">
          <ClockMascot className="mx-auto h-36 w-auto" />
          <h2 className={`${s.hand} mt-4 text-5xl leading-tight`}>Start with a place you know</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link href={historyClock.appPath} className={`${s.btn} ${s.btnPrimary} text-lg`}>
              Try the history map →
            </Link>
            <Link href={historyClock.quizPath} className={`${s.btn} ${s.btnPlain} text-lg`}>
              Kerala quiz
            </Link>
          </div>
          <p className="mt-6">
            <Link href={historyClock.supportPath} className="underline underline-offset-2 hover:text-[#d9653b]">
              Like it? Support History Clock
            </Link>
          </p>
          <p className="mt-8 text-sm text-[#4a4f5e]">
            {policyLinks.map((link, i) => (
              <span key={link.href}>
                {i > 0 && " · "}
                <Link href={link.href} className="underline underline-offset-2 hover:text-[#1f2433]">
                  {link.label}
                </Link>
              </span>
            ))}
          </p>
        </div>
      </section>
    </div>
  );
}
