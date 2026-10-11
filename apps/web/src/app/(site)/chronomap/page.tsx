import Link from "next/link";
import type { Metadata } from "next";
import TimelinePreview from "@/components/chronomap/TimelinePreview";
import { SITE_ORIGIN, chronomap, policyLinks } from "@/lib/chronomap/content";

const title = "Chronomap — Interactive Historical Atlas | Calecutech";
const description =
  "Chronomap is an interactive historical atlas by Calecutech. Pick a region, drag the timeline and explore the empires, monuments, thinkers and ideas of that place and period.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_ORIGIN}/chronomap` },
  openGraph: {
    title: `Chronomap — ${chronomap.tagline}`,
    description,
    url: `${SITE_ORIGIN}/chronomap`,
    siteName: "Calecutech",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: `Chronomap — ${chronomap.tagline}`,
    description,
  },
};

const steps = [
  {
    n: "1",
    title: "Choose a region",
    body: "Select a place on the world map: a country, a region or a city's surroundings.",
  },
  {
    n: "2",
    title: "Move the timeline",
    body: "Drag the timeline at the bottom to move forward or back through the centuries.",
  },
  {
    n: "3",
    title: "Explore the layers",
    body: "See which dynasties ruled, which borders moved, and which monuments, thinkers, art and ideas belonged to that moment.",
  },
];

const features = [
  ["Changing empires and borders", "Watch dynasties and empires form, expand, fragment and fall."],
  ["Monuments", "Find the temples, mosques, churches, palaces and fortifications built in a region and period."],
  ["People and thinkers", "Meet the scholars, reformers, rulers and writers active where and when you are looking."],
  ["Art and literature", "Follow the texts, styles and traditions that emerged alongside political change."],
  ["Science and ideas", "Trace discoveries, schools of thought and technologies as they spread."],
  ["Trade and routes", "See the roads, sea lanes and markets that connected a region to the wider world."],
  ["Compare regions", "Hold two places side by side at the same moment and see how they differ."],
  ["Guided journeys", "Follow a curated path through one region and period, with the sources behind each stop."],
];

const audiences = [
  ["Students and teachers", "Build a sense of how a region's history connects across politics, religion, art and trade."],
  ["Travellers", "Read the history of a place before a visit, and see which sites belong to which period."],
  ["Writers and researchers", "Start from a region and period, then follow each entry to its sources."],
  ["Curious readers", "Explore a part of the world you know little about, one century at a time."],
];

const faqs = [
  [
    "Is Chronomap available now?",
    "Not yet. The site shows a preview. The web app at /chronomap/app is a demonstration state, and it does not yet offer the full historical data.",
  ],
  [
    "Is the example on this page real data?",
    "No. The South India example around 1000 CE is illustrative. Its dates are approximate and it is not generated from our dataset yet.",
  ],
  [
    "Where will the information come from?",
    "Every entry is meant to link to the sources behind it. Where scholars disagree, or a date is approximate, we intend to say so on the entry.",
  ],
  [
    "Do I need an account?",
    "The current preview does not ask for one. If accounts are added later, the privacy policy will be updated before they launch.",
  ],
  [
    "How do I report a mistake?",
    "Write to us through the contact page. We accept corrections and will credit a source where it helps.",
  ],
] as const;

export default function ChronomapPage() {
  return (
    <div className="bg-[#f5efe2] text-[#1d2538]">
      {/* 1 · Hero */}
      <section className="bg-[#101c33] text-[#f5efe2]">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-28">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#c9a86a]">
              A Calecutech product · Preview
            </p>
            <h1 className="mt-5 font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              {chronomap.tagline}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#dfe4ee]">
              Chronomap is an interactive historical atlas. Choose a region, drag the timeline, and see
              the empires, borders, monuments, thinkers and ideas tied to that place and period.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href={chronomap.appPath}
                className="rounded-full bg-[#c9a86a] px-6 py-3 font-medium text-[#101c33] transition-colors hover:bg-[#d9b97f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5efe2]"
              >
                Try Chronomap
              </Link>
              <a
                href="#how-it-works"
                className="rounded-full border border-[#c9a86a] px-6 py-3 font-medium text-[#f5efe2] transition-colors hover:bg-[#c9a86a]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a86a]"
              >
                Explore how it works
              </a>
            </div>
          </div>

          {/* 2 · Product preview: a static picture, not a live map */}
          <div>
            <TimelinePreview />
            <p className="mt-4 text-center text-sm text-[#c9cfdb]">
              Illustrative preview of the interface. Not live data.
            </p>
          </div>
        </div>
      </section>

      {/* 3 · How it works */}
      <section id="how-it-works" className="scroll-mt-8 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm uppercase tracking-[0.2em] text-[#7d5e22]">How it works</p>
          <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-[#101c33] sm:text-4xl">
            Three steps from a place to its history
          </h2>
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <li key={step.n} className="rounded-2xl border border-[#1d2538]/10 bg-white/60 p-8">
                <span className="font-serif text-3xl text-[#7d5e22]" aria-hidden="true">
                  {step.n}
                </span>
                <h3 className="mt-4 text-xl font-semibold text-[#101c33]">{step.title}</h3>
                <p className="mt-3 leading-7 text-[#4a5264]">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 4 · Features */}
      <section className="border-y border-[#1d2538]/10 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm uppercase tracking-[0.2em] text-[#7d5e22]">What you can explore</p>
          <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-[#101c33] sm:text-4xl">
            Every layer of a place&rsquo;s history
          </h2>
          <ul className="mt-12 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(([name, body]) => (
              <li key={name} className="border-t border-[#c9a86a] pt-5">
                <h3 className="font-semibold text-[#101c33]">{name}</h3>
                <p className="mt-2 text-sm leading-6 text-[#4a5264]">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 5 · Example journey */}
      <section className="px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#7d5e22]">Example journey</p>
            <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-[#101c33] sm:text-4xl">
              South India, around 1000 CE
            </h2>
            <p className="mt-5 leading-7 text-[#4a5264]">
              In this period the Chola dynasty was expanding its power under Rajaraja I, while the
              Western Chalukyas held much of the Deccan plateau. Monuments such as the Brihadisvara
              Temple at Thanjavur show how rulers used architecture to claim legitimacy.
            </p>
            <p className="mt-5 rounded-lg bg-[#101c33]/5 p-4 text-sm leading-6 text-[#4a5264]">
              <strong className="text-[#101c33]">Illustrative example.</strong> Dates are approximate,
              and this journey is written by hand. It is not yet generated from our dataset.
            </p>
          </div>
          <ol className="space-y-4">
            {[
              ["c. 985 CE", "Rajaraja I begins his reign and the Chola state grows.", "Empire"],
              ["c. 1000 CE", "The Western Chalukyas hold the Deccan plateau to the north.", "Empire"],
              ["c. 1010 CE", "The Brihadisvara Temple at Thanjavur is completed.", "Monument"],
              ["c. 1000 CE", "Trade links run across the Bay of Bengal and the Indian Ocean.", "Trade"],
            ].map(([when, what, kind]) => (
              <li key={`${when}-${what}`} className="flex gap-5 rounded-xl border border-[#1d2538]/10 bg-white/60 p-5">
                <div className="w-24 shrink-0">
                  <p className="font-serif text-lg font-semibold text-[#101c33]">{when}</p>
                  <p className="text-xs uppercase tracking-[0.14em] text-[#7d5e22]">{kind}</p>
                </div>
                <p className="leading-7">{what}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 6 · Data integrity */}
      <section className="bg-[#101c33] px-6 py-20 text-[#f5efe2]">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm uppercase tracking-[0.2em] text-[#c9a86a]">Data integrity</p>
          <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            History with its sources showing
          </h2>
          <ul className="mt-12 grid gap-6 md:grid-cols-2">
            {[
              ["Source-linked entries", "Each entry is meant to link to the scholarly or primary sources it relies on."],
              ["Dates labelled honestly", "Approximate dates, and dates that historians dispute, are marked as such on the entry itself."],
              ["Corrections accepted", "If an entry is wrong or out of date, tell us through the contact page and we will review it."],
              ["No invented detail", "We do not publish records without a source. Where the evidence is thin, we say that."],
            ].map(([head, body]) => (
              <li key={head} className="rounded-2xl border border-[#c9a86a]/30 p-6">
                <h3 className="font-semibold text-[#f5efe2]">{head}</h3>
                <p className="mt-2 leading-7 text-[#c9cfdb]">{body}</p>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm text-[#c9cfdb]">
            The data integrity commitments above describe how we intend to publish. The current preview
            contains sample entries only.
          </p>
        </div>
      </section>

      {/* 7 · Audience */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm uppercase tracking-[0.2em] text-[#7d5e22]">Who it is for</p>
          <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-[#101c33] sm:text-4xl">
            Anyone who wants history with a place attached
          </h2>
          <dl className="mt-12 grid gap-8 sm:grid-cols-2">
            {audiences.map(([who, body]) => (
              <div key={who} className="border-l-2 border-[#c9a86a] pl-6">
                <dt className="text-lg font-semibold text-[#101c33]">{who}</dt>
                <dd className="mt-2 leading-7 text-[#4a5264]">{body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 8 · FAQ */}
      <section className="border-t border-[#1d2538]/10 px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm uppercase tracking-[0.2em] text-[#7d5e22]">Questions</p>
          <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-[#101c33] sm:text-4xl">
            Frequently asked
          </h2>
          <div className="mt-10 divide-y divide-[#1d2538]/10 border-y border-[#1d2538]/10">
            {faqs.map(([q, a]) => (
              <details key={q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium text-[#101c33] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7d5e22]">
                  {q}
                  <span aria-hidden="true" className="text-[#7d5e22] transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 leading-7 text-[#4a5264]">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 9 · CTA */}
      <section className="bg-[#101c33] px-6 py-20 text-center text-[#f5efe2]">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            Start with a place you know
          </h2>
          <p className="mt-4 leading-7 text-[#dfe4ee]">
            Open the Chronomap preview and see how a region changes as you move through time.
          </p>
          <Link
            href={chronomap.appPath}
            className="mt-8 inline-block rounded-full bg-[#c9a86a] px-7 py-3 font-medium text-[#101c33] transition-colors hover:bg-[#d9b97f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5efe2]"
          >
            Try Chronomap
          </Link>
          <p className="mt-6 text-sm text-[#c9cfdb]">
            {policyLinks.map((link, i) => (
              <span key={link.href}>
                {i > 0 && " · "}
                <Link href={link.href} className="underline underline-offset-2 hover:text-[#f5efe2]">
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
