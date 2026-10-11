import Link from "next/link";
import type { Metadata } from "next";
import KeralaQuiz from "@/components/history-clock/KeralaQuiz";
import { Emperor, Poet, Thinker } from "@/components/history-clock/Doodles";
import s from "@/components/history-clock/sketch.module.css";
import { SITE_ORIGIN, historyClock } from "@/lib/history-clock/content";

const description =
  "A ten-question quiz on Kerala history: Muziris, the Zamorins, Travancore, the Kerala school of mathematics, reformers and poets.";

export const metadata: Metadata = {
  title: "Kerala history quiz | History Clock",
  description,
  alternates: { canonical: `${SITE_ORIGIN}${historyClock.quizPath}` },
  openGraph: {
    title: "Kerala history quiz",
    description,
    url: `${SITE_ORIGIN}${historyClock.quizPath}`,
    siteName: "Calecutech",
    type: "website",
  },
};

export default function KeralaQuizPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="inline-block rounded-full border-2 border-[#1f2433] bg-[#bfe0dc] px-3 py-1 text-sm font-semibold">
            {historyClock.name} · Try now
          </p>
          <h1 className={`${s.hand} mt-4 text-5xl leading-tight sm:text-6xl`}>
            How well do you know <span className={s.scribble}>Kerala</span>?
          </h1>
        </div>
        <div className="hidden shrink-0 gap-1 sm:flex" aria-hidden="true">
          <Emperor className={`h-20 w-20 ${s.tiltLeft}`} />
          <Thinker className="h-20 w-20" />
          <Poet className={`h-20 w-20 ${s.tiltRight}`} />
        </div>
      </div>

      <div className="mt-8">
        <KeralaQuiz mapPath={historyClock.appPath} />
      </div>

      <p className="mt-8 text-sm leading-6 text-[#4a4f5e]">
        Questions are written by hand from standard histories of Kerala. Where a date is traditional or
        debated, the answer says so.{" "}
        <Link href="/history-clock" className="font-semibold underline underline-offset-4">
          Back to {historyClock.name}
        </Link>
      </p>
    </div>
  );
}
