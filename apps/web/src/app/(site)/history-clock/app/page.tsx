import Link from "next/link";
import type { Metadata } from "next";
import HistoryMap from "@/components/history-clock/HistoryMap";
import s from "@/components/history-clock/sketch.module.css";
import { SITE_ORIGIN, contactEmail, historyClock } from "@/lib/history-clock/content";
import { regions } from "@/lib/history-clock/regions";
import { worldShapes } from "@/lib/history-clock/world";

const description =
  "Pick a place on the world map, slide through 5,000 years, and see the dynasties, monuments, thinkers, arts and literature of that place and time.";

export const metadata: Metadata = {
  title: "History Clock map: try it | Calecutech",
  description,
  alternates: { canonical: `${SITE_ORIGIN}${historyClock.appPath}` },
  openGraph: {
    title: "History Clock map",
    description,
    url: `${SITE_ORIGIN}${historyClock.appPath}`,
    siteName: "Calecutech",
    type: "website",
  },
};

export default function HistoryClockMapPage() {
  const { countries, pins } = worldShapes();
  const entryCount = regions.reduce((n, r) => n + r.entries.length, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="inline-block rounded-full border-2 border-[#1f2433] bg-[#e8b64c] px-3 py-1 text-sm font-semibold">
        First version · {regions.length} regions · {entryCount} hand-picked entries
      </p>
      <h1 className={`${s.hand} mt-4 text-5xl leading-tight sm:text-6xl`}>
        Spin the <span className={s.scribble}>History Clock</span>
      </h1>
      <p className="mt-3 max-w-2xl text-lg leading-8 text-[#4a4f5e]">
        Pick a place, slide the clock, and watch who rules, what gets built, who is thinking and what is
        being written there.
      </p>

      <div className="mt-8">
        <HistoryMap countries={countries} pins={pins} />
      </div>

      <aside className={`${s.card} mt-10 p-6 text-sm leading-6`}>
        <h2 className={`${s.hand} text-2xl`}>About these entries</h2>
        <p className="mt-2">
          Every entry is written by hand from standard reference dates. &ldquo;c.&rdquo; marks an approximate
          date, and the note says when historians disagree. Each region shows a sample, not everything that
          happened there, and many places have no entries yet. Spotted a mistake? Email{" "}
          <a className="underline underline-offset-2" href={`mailto:${contactEmail}?subject=History%20Clock%20correction`}>
            {contactEmail}
          </a>
          .
        </p>
        <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/history-clock" className="font-semibold underline underline-offset-4">
            ← Back to {historyClock.name}
          </Link>
          <Link href={historyClock.quizPath} className="font-semibold underline underline-offset-4">
            Try the Kerala history quiz →
          </Link>
        </p>
      </aside>
    </div>
  );
}
