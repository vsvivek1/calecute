'use client';

import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import BuyButton from '@/components/BuyButton';
import Summary, { type PracticeResult } from '@/components/Summary';
import StudyCard from '@/components/feed/StudyCard';
import { arrange, MAX_SITTING } from '@/lib/engine/sitting';
import { RATINGS, type Rating } from '@/lib/engine/scheduler';
import { IS_APP } from '@/lib/env';
import { seededOrder, type CardUi } from '@/lib/feed';
import { shuffle } from '@/lib/stats';
import { SAMPLE, useLicense } from '@/lib/store';

const freshUi = (n: number, seed: string): CardUi => ({
  order: seededOrder(n, seed),
  chosen: null,
  revealed: false,
  readMs: 0,
  rateMs: 0,
  sub: 0,
  subCorrect: [],
  subMs: [],
});

/** A free sitting: 10 sample questions, exactly as the full app runs them. */
export default function SamplePage() {
  const license = useLicense();
  const [run, setRun] = useState(0);
  const cards = useMemo(
    () => arrange(shuffle(SAMPLE).slice(0, MAX_SITTING).map((q) => ({ q, why: 'new' as const })), {}, new Date()).map((x) => x.q),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [run],
  );
  const [started, setStarted] = useState(false);
  const [i, setI] = useState(0);
  const [ui, setUi] = useState<CardUi | null>(null);
  const [results, setResults] = useState<(PracticeResult & { rating: Rating })[]>([]);
  const at = useRef(i);
  at.current = i;
  const done = started && i >= cards.length;
  const q = cards[i];
  const cur = ui ?? (q ? freshUi(q.options.length, `${run}:${i}:${q.id}`) : null);

  if (!started) {
    return (
      <main className="feed">
        <div className="study-card">
          <span className="pill">Free sitting</span>
          <h1 style={{ fontSize: '1.7rem', marginTop: 10 }}>Try one PMP sitting</h1>
          <p>
            10 original situational questions, one at a time. Pick an answer, read why it wins, then tell us how it
            felt: <b>Didn’t get it</b>, <b>Tough</b>, <b>Understood</b> or <b>So simple</b>. In the full app that rating
            decides when the question comes back.
          </p>
          <p className="muted fine">Buttons unlock after a few seconds. That pause is on purpose: understanding needs it.</p>
          <div className="study-actions">
            <button className="btn btn-primary btn-block" onClick={() => setStarted(true)}>Start</button>
          </div>
        </div>
      </main>
    );
  }

  if (done) {
    const count = (r: Rating) => results.filter((x) => x.rating === r).length;
    return (
      <main className="feed">
        <div className="study-card">
          <h2>Sitting done</h2>
          <div className="report-grid">
            {RATINGS.map((r) => <div key={r.id}><b>{count(r.id)}</b><span>{r.label}</span></div>)}
          </div>
          <p className="muted fine">
            In the full app, “Didn’t get it” comes back today, “Tough” in a day or two, “Understood” in about a week and
            “So simple” much later, and nothing is scheduled after your exam date.
          </p>
          <Summary results={results} />
        </div>
        {!license && (
          <div className="study-card">
            <h2>Let the app plan your PMP prep</h2>
            <ul className="ticks">
              <li>The full question bank across People, Process and Business Environment</li>
              <li>10-question sittings at the times you choose, with reminders</li>
              <li>A plan that works back from your exam date, then 2-day cram mode</li>
              <li>A weekly report: what became easy, what’s still tough</li>
              <li>Timed mock exams when you’re ready for them</li>
            </ul>
            {IS_APP ? (
              <Link href="/unlock" className="btn btn-primary btn-block">I already have access</Link>
            ) : (
              <div className="stack">
                <BuyButton className="btn btn-accent btn-block" />
                <Link href="/#pricing" className="btn btn-ghost btn-block">What’s included</Link>
              </div>
            )}
          </div>
        )}
        <button className="btn btn-ghost" onClick={() => { setRun(run + 1); setI(0); setUi(null); setResults([]); }}>
          Try another sitting
        </button>
      </main>
    );
  }

  const shown = i;
  return (
    <main className="feed">
      <div className="sit-progress" aria-label={`Card ${i + 1} of ${cards.length}`}>
        {cards.map((_, k) => <i key={k} className={k < i ? 'done' : k === i ? 'cur' : ''} />)}
      </div>
      <StudyCard
        key={`${run}:${i}`}
        q={q}
        ui={cur!}
        why="new"
        onPatch={(p) => {
          // A timer saving as the old card unmounts must not touch the next one.
          if (at.current !== shown) return;
          setUi((u) => ({ ...(u ?? cur!), ...p }));
        }}
        onRate={(rating, correct) => {
          setResults((r) => [...r, { q, correct, rating }]);
          setUi(null);
          setI(i + 1);
        }}
      />
    </main>
  );
}
