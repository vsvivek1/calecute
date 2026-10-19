'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { browserClient } from '@/lib/supabase-browser';
import type { Card, Paper, Today } from '@/lib/types';

const GRADES = [
  { g: 1, label: 'Again', cls: 'again' },
  { g: 2, label: 'Hard', cls: 'hard' },
  { g: 3, label: 'Good', cls: 'good' },
  { g: 4, label: 'Easy', cls: 'easy' },
] as const;

/**
 * Today's plan, as decided by the engine: due revision first, then new cards
 * and solved problems. "Again" puts a card back at the end of today's queue.
 */
export default function Study({
  today,
  catalog,
  name,
}: {
  today: Today;
  catalog: Paper[];
  name: string | null;
}) {
  const paperName = useMemo(
    () => Object.fromEntries(catalog.map((p) => [p.id, `Paper ${p.id} · ${p.short}`])),
    [catalog],
  );
  const [queue, setQueue] = useState<Card[]>(() => [...today.review, ...today.new]);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const reviewLeft = queue.filter((c) => c.mode === 'review').length;
  const newLeft = queue.length - reviewLeft;
  const card = queue[0];

  async function grade(g: number) {
    if (!card) return;
    setError(null);
    const { error } = await browserClient().rpc('em_review', { p_card: card.id, p_grade: g });
    if (error) {
      setError(error.message);
      return;
    }
    setDone((n) => n + 1);
    setQueue((q) => {
      const [head, ...rest] = q;
      // Forgotten cards come back later in this session.
      return g === 1 ? [...rest, { ...head, mode: 'review' }] : rest;
    });
  }

  if (!started) {
    return (
      <>
        <h1>Today{name ? `, ${name.split(' ')[0]}` : ''}</h1>
        <p className="sub">
          {today.streak > 0 ? `🔥 ${today.streak}-day streak. ` : ''}
          {queue.length === 0
            ? 'Nothing left for today. Come back tomorrow for your next set.'
            : 'Your plan is ready. Just start.'}
        </p>
        <div className="plan card">
          <div>
            <p className="big">{today.review.length}</p>
            <p>revision due</p>
          </div>
          <div>
            <p className="big">{today.new.filter((c) => c.kind === 'fact').length}</p>
            <p>new cards</p>
          </div>
          <div>
            <p className="big">{today.new.filter((c) => c.kind === 'problem').length}</p>
            <p>solved problems</p>
          </div>
        </div>
        {queue.length > 0 && (
          <button className="btn btn-primary btn-lg" onClick={() => setStarted(true)}>
            Start
          </button>
        )}
        <Progress today={today} paperName={paperName} />
      </>
    );
  }

  if (!card) {
    return (
      <>
        <h1>Done for today 🎉</h1>
        <p className="sub">
          You worked through {done} card{done === 1 ? '' : 's'}. Recallio will bring each one back
          when it is due. See you tomorrow.
        </p>
        <Progress today={today} paperName={paperName} />
      </>
    );
  }

  return (
    <>
      <div className="queue">
        <span>{reviewLeft} revision</span>
        <span>{newLeft} new</span>
        <span className="spacer" />
        <span>{done} done</span>
      </div>
      {error && <div className="err">{error}</div>}
      <CardView key={`${card.id}-${done}`} card={card} paper={paperName[card.paper]} onGrade={grade} />
    </>
  );
}

function CardView({
  card,
  paper,
  onGrade,
}: {
  card: Card;
  paper: string;
  onGrade: (g: number) => void;
}) {
  // Facts: 0 = question, 1 = answer. Problems: 0 = statement, 1..n = steps
  // revealed one at a time, n + 1 = final answer.
  const isProblem = card.kind === 'problem' && card.steps.length > 0;
  const last = isProblem ? card.steps.length + 1 : 1;
  const [stage, setStage] = useState(0);
  const [stepShown, setStepShown] = useState(false);
  const [more, setMore] = useState<Record<number, boolean>>({});
  const [busy, setBusy] = useState(false);

  const toggleMore = (i: number) => setMore((m) => ({ ...m, [i]: !m[i] }));

  return (
    <article className="card study">
      <p className="meta">
        <span className={`pill ${card.mode}`}>{card.mode === 'review' ? 'Revision' : 'New'}</span>
        <span>{paper}</span>
        <span>· {card.topic}</span>
      </p>
      <div className="front">{card.front}</div>

      {isProblem &&
        card.steps.slice(0, Math.max(0, Math.min(stage, card.steps.length))).map((s, i) => {
          const current = i === stage - 1 && stage <= card.steps.length;
          const reveal = !current || stepShown;
          return (
            <div className="step" key={i}>
              <p className="step-n">
                Step {i + 1} of {card.steps.length}
              </p>
              <p className="step-q">{s.prompt}</p>
              {reveal ? (
                <>
                  <p className="step-a">{s.answer}</p>
                  {s.explain && (
                    <>
                      <button className="link" onClick={() => toggleMore(i + 1)}>
                        {more[i + 1] ? 'Hide explanation' : 'Explain more'}
                      </button>
                      {more[i + 1] && <p className="explain">{s.explain}</p>}
                    </>
                  )}
                </>
              ) : (
                <button className="btn btn-ghost" onClick={() => setStepShown(true)}>
                  Show this step
                </button>
              )}
            </div>
          );
        })}

      {stage === last && (
        <div className="answer">
          <p className="label">{isProblem ? 'Final answer' : 'Answer'}</p>
          <p>{card.back}</p>
          {card.explain && (
            <>
              <button className="link" onClick={() => toggleMore(0)}>
                {more[0] ? 'Hide explanation' : 'Explain more'}
              </button>
              {more[0] && <p className="explain">{card.explain}</p>}
            </>
          )}
          {card.source && card.source !== 'syllabus' && <p className="src">Based on {card.source}</p>}
        </div>
      )}

      <div className="actions">
        {stage === 0 && (
          <button
            className="btn btn-primary"
            onClick={() => {
              setStage(1);
              setStepShown(false);
            }}
          >
            {isProblem ? 'Start step 1' : 'Show answer'}
          </button>
        )}
        {isProblem && stage > 0 && stage < last && stepShown && (
          <button
            className="btn btn-primary"
            onClick={() => {
              setStage(stage + 1);
              setStepShown(false);
            }}
          >
            {stage < card.steps.length ? `Next: step ${stage + 1}` : 'Show final answer'}
          </button>
        )}
        {stage === last && (
          <div className="grades">
            {GRADES.map(({ g, label, cls }) => (
              <button
                key={g}
                className={`btn grade ${cls}`}
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  await onGrade(g);
                  setBusy(false);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function Progress({
  today,
  paperName,
}: {
  today: Today;
  paperName: Record<number, string>;
}) {
  return (
    <section className="progress">
      <h2>Your papers</h2>
      {today.progress.map((p) => {
        const seen = p.total ? Math.round((100 * p.seen) / p.total) : 0;
        const mastered = p.total ? Math.round((100 * p.mastered) / p.total) : 0;
        return (
          <div className="card mini" key={p.paper}>
            <p className="pname">{paperName[p.paper]}</p>
            <div className="bar2" aria-label={`${seen}% started, ${mastered}% mastered`}>
              <span className="seen" style={{ width: `${seen}%` }} />
              <span className="mastered" style={{ width: `${mastered}%` }} />
            </div>
            <p className="pmeta">
              {p.seen} of {p.total} started · {p.mastered} mastered
            </p>
          </div>
        );
      })}
      <p className="note">
        <Link href="/papers">Change my papers</Link>
      </p>
    </section>
  );
}
