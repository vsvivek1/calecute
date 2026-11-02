import type { Metadata } from "next";
import { Accent, CtaPanel, PageHero } from "@/components/site/Bold";

/**
 * Paid self-study courses. Each course is its own deployment (PMP Prep lives
 * in apps/pmp), so links here are plain <a> tags to the course's own site.
 */

export const metadata: Metadata = {
  title: "Courses — Calecutech",
  description: "Self-paced exam prep courses from Calecutech, starting with PMP certification prep.",
};

type Course = {
  title: string;
  tagline: string;
  points: string[];
  price: string;
  href: string;
  sample?: string;
  emoji: string;
  look: string;
};

const PMP_SITE = "https://calecute-pmp.vercel.app";

const courses: Course[] = [
  {
    title: "PMP Exam Prep",
    tagline: "Practise for the PMP certification exam on the web and on Android.",
    points: [
      "180 exam-style questions across People, Process and Business Environment",
      "Timed full mock exams with domain scores",
      "Daily spaced review that brings back what you got wrong",
      "Weak-area drills and a progress dashboard",
    ],
    price: "$100 one-time",
    href: PMP_SITE,
    sample: `${PMP_SITE}/sample`,
    emoji: "🎯",
    look: "bg-[linear-gradient(150deg,#312e81,#0b0b1f)] hover:ring-indigo-400/60",
  },
];

export default function CoursesPage() {
  return (
    <div className="font-sans">
      <PageHero
        eyebrow="Courses"
        title={
          <>
            Learn and <Accent onDark>pass.</Accent>
          </>
        }
        lede="Self-paced exam prep. Practise anywhere, pay once."
      />

      <div className="mx-auto max-w-6xl px-6 pb-24 pt-16">
        <div className="grid gap-4 md:grid-cols-2">
          {courses.map((c) => (
            <article
              key={c.title}
              className={`home-reveal group relative flex flex-col overflow-hidden rounded-[1.75rem] p-8 text-white ring-1 ring-white/10 transition duration-300 hover:-translate-y-1 sm:p-10 ${c.look}`}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 -top-16 text-[12rem] leading-none opacity-15 transition duration-700 group-hover:rotate-12 group-hover:scale-110"
              >
                {c.emoji}
              </div>
              <div className="relative flex items-start justify-between gap-4">
                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-400">
                  Live
                </span>
                <span className="font-mono text-sm tabular-nums text-white/80">{c.price}</span>
              </div>
              <h2 className="relative mt-8 font-[family-name:var(--font-display)] text-4xl font-bold tracking-[-0.03em]">
                {c.title}
              </h2>
              <p className="relative mt-3 max-w-md text-white/75">{c.tagline}</p>
              <ul className="relative mt-6 space-y-2 text-sm text-white/75">
                {c.points.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span aria-hidden="true" className="text-indigo-300">✓</span>
                    {p}
                  </li>
                ))}
              </ul>
              <div className="relative mt-auto flex flex-wrap gap-3 pt-8">
                <a
                  href={c.href}
                  className="inline-flex h-11 items-center rounded-full bg-white px-6 text-sm font-semibold text-black transition hover:bg-white/90"
                >
                  View course →
                </a>
                {c.sample && (
                  <a
                    href={c.sample}
                    className="inline-flex h-11 items-center rounded-full border border-white/20 bg-white/5 px-6 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Free sample test
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
        <p className="mt-10 text-sm text-black/50 dark:text-white/50">
          PMP and PMBOK are registered marks of the Project Management Institute, Inc. Calecutech is
          not affiliated with or endorsed by PMI.
        </p>
      </div>

      <CtaPanel
        title={
          <>
            Want a course for your <Accent onDark>exam?</Accent>
          </>
        }
        lede="Tell us which exam you are preparing for."
        primary={{ href: "/contact", label: "Contact us" }}
      />
    </div>
  );
}
