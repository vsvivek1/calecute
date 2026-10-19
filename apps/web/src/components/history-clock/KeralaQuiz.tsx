"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import s from "./sketch.module.css";
import { OurProducts } from "@/components/site/OurProducts";
import { ROUND_SIZE, keralaQuestions, rankFor } from "@/lib/history-clock/kerala-quiz";

type Asked = { q: string; options: string[]; answer: string; why: string };

function shuffle<T>(items: T[]): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function newRound(): Asked[] {
  return shuffle(keralaQuestions)
    .slice(0, ROUND_SIZE)
    .map((item) => ({ q: item.q, options: shuffle(item.options), answer: item.options[0], why: item.why }));
}

export default function KeralaQuiz({ mapPath }: { mapPath: string }) {
  // The round is drawn on Start, in the browser, so server and client render the same intro.
  const [round, setRound] = useState<Asked[] | null>(null);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const start = () => {
    setRound(newRound());
    setIndex(0);
    setPicked(null);
    setScore(0);
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  if (!round) {
    return (
      <div className={`${s.card} p-6 text-center sm:p-10`}>
        <p className={`${s.hand} text-3xl sm:text-4xl`}>{ROUND_SIZE} questions. No sign-in. No timer.</p>
        <p className="mx-auto mt-3 max-w-md text-[#4a4f5e]">
          Spice ports, kings, reformers, poets and mathematicians. Each answer comes with the story behind it.
        </p>
        <button type="button" onClick={start} className={`${s.btn} ${s.btnPrimary} mt-6 text-lg`}>
          Start the quiz →
        </button>
      </div>
    );
  }

  if (index >= round.length) {
    const rank = rankFor(score, round.length);
    return (
      <>
      <div className={`${s.card} p-6 text-center sm:p-10`} aria-live="polite">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4a4f5e]">Your score</p>
        <h2 ref={headingRef} tabIndex={-1} className={`${s.hand} mt-2 text-6xl outline-none`}>
          {score} / {round.length}
        </h2>
        <p className={`${s.hand} mt-3 text-3xl text-[#2f7f7a]`}>{rank.title}</p>
        <p className="mt-2 text-[#4a4f5e]">{rank.line}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <button type="button" onClick={start} className={`${s.btn} ${s.btnPrimary}`}>
            Play another round
          </button>
          <Link href={mapPath} className={`${s.btn} ${s.btnTeal}`}>
            Explore Kerala on the map
          </Link>
        </div>
      </div>
      <OurProducts
        tone="light"
        className="mt-14"
        heading="Our products"
        intro="Enjoyed the quiz? Calecute Technologies makes apps for learners and families in Kerala: exam prep for PSC, USS, LSS and Plus One and Two, live quizzes, bus tracking, panchangam and more. Here is everything we publish."
      />
      </>
    );
  }

  const item = round[index];
  const answered = picked !== null;
  const correct = picked === item.answer;

  return (
    <div className={`${s.card} p-5 sm:p-8`}>
      <div className="flex items-center justify-between gap-4 text-sm font-semibold text-[#4a4f5e]">
        <span>
          Question {index + 1} of {round.length}
        </span>
        <span>Score {score}</span>
      </div>
      <div className="mt-3 h-3 rounded-full border-2 border-[#1f2433] bg-[#fffaf0]" aria-hidden="true">
        <div className="h-full rounded-full bg-[#e8b64c]" style={{ width: `${(index / round.length) * 100}%` }} />
      </div>

      <h2 ref={headingRef} tabIndex={-1} className={`${s.hand} mt-6 text-3xl leading-tight outline-none sm:text-4xl`}>
        {item.q}
      </h2>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {item.options.map((option) => {
          const isAnswer = option === item.answer;
          const isPicked = option === picked;
          let tone = "bg-[#fffaf0]";
          if (answered && isAnswer) tone = "bg-[#bfe0dc]";
          else if (answered && isPicked) tone = "bg-[#f4c3b0]";
          return (
            <li key={option}>
              <button
                type="button"
                disabled={answered}
                onClick={() => {
                  setPicked(option);
                  if (option === item.answer) setScore((n) => n + 1);
                }}
                className={`${s.btn} ${tone} w-full justify-between text-left disabled:cursor-default`}
              >
                <span>{option}</span>
                {answered && isAnswer && <span aria-label="correct answer">✓</span>}
                {answered && isPicked && !isAnswer && <span aria-label="your answer, incorrect">✗</span>}
              </button>
            </li>
          );
        })}
      </ul>

      <div aria-live="polite">
        {answered && (
          <div className="mt-6 rounded-xl border-2 border-dashed border-[#1f2433] bg-[#fbf3e0] p-4">
            <p className={`${s.hand} text-2xl`}>{correct ? "Correct!" : `Not quite. It was ${item.answer}.`}</p>
            <p className="mt-1 leading-7">{item.why}</p>
          </div>
        )}
      </div>

      {answered && (
        <div className="mt-6 text-right">
          <button
            type="button"
            className={`${s.btn} ${s.btnPrimary}`}
            onClick={() => {
              setIndex((i) => i + 1);
              setPicked(null);
              requestAnimationFrame(() => headingRef.current?.focus());
            }}
          >
            {index + 1 === round.length ? "See my score" : "Next question →"}
          </button>
        </div>
      )}
    </div>
  );
}
