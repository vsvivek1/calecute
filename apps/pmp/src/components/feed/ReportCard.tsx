'use client';

import { useMemo, useState } from 'react';
import type { LoopState } from '@/lib/feed';
import { weeklyReport } from '@/lib/engine/report';
import type { Question } from '@/lib/types';

const FACES = ['😀', '🙂', '😐'];

const fmtWeek = (w: string) => {
  const [y, m, d] = w.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/** The weekly report, shown as a card at the start of a sitting. */
export default function ReportCard({
  week,
  s,
  bank,
  hasRetention,
  onDone,
}: {
  week: string;
  s: LoopState;
  bank: Question[];
  hasRetention: boolean;
  onDone: (self: string | undefined) => void;
}) {
  const [self, setSelf] = useState<string | undefined>();
  const r = useMemo(() => {
    const [y, m, d] = week.split('-').map(Number);
    const sittings = Array.from({ length: 7 }, (_, k) => {
      const day = new Date(y, m - 1, d + k);
      const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
      return (s.days[key]?.sittings ?? 0) + (s.days[key]?.bonus ?? 0);
    }).reduce((a, b) => a + b, 0);
    return weeklyReport({ week, bank, cards: s.cards, log: s.log, sittings, mocks: s.mocks, checks: s.checks, examDate: s.profile.examDate, now: new Date() });
  }, [week, s, bank]);
  const last = s.retention && s.retention.total ? s.retention : null;

  const text = [
    `PMP Prep · week of ${fmtWeek(week)}`,
    `Studied ${r.daysStudied} of 7 days · ${r.cards} cards · ${r.minutes} min`,
    r.daysLeft !== null ? `${r.daysLeft} days to the exam · readiness ${r.readiness}` : `Readiness ${r.readiness}`,
    r.becameEasy.length ? `Became easy: ${r.becameEasy.map((t) => `${t.topic} (${t.n})`).join(', ')}` : '',
    r.stillTough.length ? `Still tough: ${r.stillTough.map((t) => `${t.topic} (${t.n})`).join(', ')}` : '',
  ].filter(Boolean).join('\n');

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ text });
      else await navigator.clipboard.writeText(text);
    } catch {}
  };

  return (
    <div className="study-card report">
      <div className="spread">
        <span className="pill">Weekly report</span>
        <button className="btn btn-ghost btn-sm" onClick={share}>Share</button>
      </div>
      <h2 style={{ marginTop: 10 }}>Your week from {fmtWeek(week)}</h2>
      <div className="report-grid">
        <div><b>{r.daysStudied}/7</b><span>days studied</span></div>
        <div><b>{r.cards}</b><span>cards</span></div>
        <div><b>{r.minutes}</b><span>minutes</span></div>
        <div><b>{r.readiness.replace('about ', '~')}</b><span>readiness</span></div>
      </div>
      {r.daysLeft !== null && <p className="muted fine">{r.daysLeft} days to your exam. Readiness is an estimate: share of the bank seen × how much of it you’re likely to recall on exam day.</p>}

      <h3>Became easy ✅</h3>
      {r.becameEasy.length ? <ul className="tight">{r.becameEasy.slice(0, 4).map((t) => <li key={t.topic}>{t.topic}: {t.n}</li>)}</ul> : <p className="muted fine">Nothing moved from tough to easy yet. It takes a couple of reviews.</p>}

      <h3>Still tough ⚠️</h3>
      {r.stillTough.length ? (
        <>
          <ul className="tight">{r.stillTough.slice(0, 4).map((t) => <li key={t.topic}>{t.topic}: {t.n}</li>)}</ul>
          <p className="muted fine">These come back sooner, with the explanation first.</p>
        </>
      ) : <p className="muted fine">None. Nice.</p>}

      {(r.slipped > 0 || r.simpleMissed > 0) && (
        <p className="fine">
          {r.slipped > 0 && <>Slipped back: {r.slipped}. </>}
          {r.simpleMissed > 0 && <>Marked “So simple” but missed later: {r.simpleMissed}.</>}
        </p>
      )}
      {r.mocks.length > 0 && <p className="fine">Mocks: {r.mocks.map((m) => `${Math.round((m.correct / m.size) * 100)}% on ${m.size}`).join(', ')}</p>}
      {r.focus && <p className="fine">Focus: {r.focus}</p>}
      {r.teachBack && <p className="fine">Tip: explain <b>{r.teachBack}</b> out loud to a colleague this week. Explaining is strong revision.</p>}
      {last && <p className="fine">Last week’s retention review: you guessed {last.self ?? '–'} and got {last.correct}/{last.total}.</p>}

      {hasRetention ? (
        <>
          <h3>Retention review</h3>
          <p className="fine">Next: 5 questions from this week. How much do you think you remember?</p>
          <div className="row">
            {FACES.map((f) => (
              <button key={f} className={`face ${self === f ? 'on' : ''}`} onClick={() => setSelf(f)} aria-label={f}>{f}</button>
            ))}
          </div>
        </>
      ) : null}
      <div className="study-actions">
        <button className="btn btn-primary btn-block" disabled={hasRetention && !self} onClick={() => onDone(self)}>Continue</button>
      </div>
    </div>
  );
}
