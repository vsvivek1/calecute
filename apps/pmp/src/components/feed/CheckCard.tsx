'use client';

import { useEffect, useMemo, useRef } from 'react';
import { seededOrder, type CardUi } from '@/lib/feed';
import type { Question } from '@/lib/types';

interface Item {
  stem: string;
  options: string[];
  answer: number;
}

/**
 * Quick check: three fast recall questions and one attention item, under a
 * minute and a half. Or the weekly retention review: five questions from
 * this week. Never scored as anything but right answers.
 */
export default function CheckCard({
  questions,
  prevTopic,
  topics,
  retention,
  self,
  seed,
  ui,
  onPatch,
  onDone,
}: {
  questions: Question[];
  /** Topic of the card just before this check, for the attention item. */
  prevTopic: string | null;
  topics: string[];
  retention: boolean;
  self?: string;
  seed: string;
  ui: CardUi;
  onPatch: (p: Partial<CardUi>) => void;
  onDone: (correct: boolean[], ms: number[]) => void;
}) {
  const items: Item[] = useMemo(() => {
    const qs: Item[] = questions.map((q) => ({ stem: q.stem, options: q.options, answer: q.answer }));
    if (!retention && prevTopic) {
      const others = topics.filter((t) => t !== prevTopic);
      const picks = seededOrder(others.length, seed).slice(0, 3).map((k) => others[k]);
      if (picks.length === 3) qs.push({ stem: 'Attention check: which topic was the question just before this check about?', options: [prevTopic, ...picks], answer: 0 });
    }
    return qs;
  }, [questions, retention, prevTopic, topics, seed]);

  const sub = ui.sub;
  const finished = sub >= items.length;
  const item = items[Math.min(sub, items.length - 1)];
  const order = useMemo(() => seededOrder(item.options.length, `${seed}:${sub}`), [item, seed, sub]);
  const answered = ui.chosen !== null;
  const shownAt = useRef(Date.now());
  useEffect(() => {
    shownAt.current = Date.now();
  }, [sub]);

  if (finished) {
    const n = ui.subCorrect.filter(Boolean).length;
    return (
      <div className="study-card center-card">
        <div className="big-emoji" aria-hidden>{retention ? '🧠' : '✓'}</div>
        <h2>{n} of {items.length} right</h2>
        {retention && self && <p className="muted">You guessed {self} before you started.</p>}
        {!retention && <p className="muted">Thanks. This tunes how many cards each sitting holds.</p>}
        <button className="btn btn-primary btn-block" onClick={() => onDone(ui.subCorrect, ui.subMs)}>Continue</button>
      </div>
    );
  }

  return (
    <div className="study-card">
      <div className="spread" style={{ marginBottom: 10 }}>
        <span className="pill warn">{retention ? 'Retention review' : 'Quick check'}</span>
        <span className="muted fine">{sub + 1} / {items.length}</span>
      </div>
      <div className="stem">{item.stem}</div>
      <div className="opts">
        {order.map((o, pos) => {
          const cls = answered ? (o === item.answer ? 'right' : o === ui.chosen ? 'wrong' : '') : '';
          return (
            <button
              key={o}
              className={`opt ${cls}`}
              disabled={answered}
              onClick={() => onPatch({ chosen: o, subCorrect: [...ui.subCorrect, o === item.answer], subMs: [...ui.subMs, Date.now() - shownAt.current] })}
            >
              <span className="key">{'ABCD'[pos]}</span>
              <span>{item.options[o]}</span>
            </button>
          );
        })}
      </div>
      <div className="study-actions">
        <button className="btn btn-primary btn-block" disabled={!answered} onClick={() => onPatch({ sub: sub + 1, chosen: null })}>
          Next
        </button>
      </div>
    </div>
  );
}
