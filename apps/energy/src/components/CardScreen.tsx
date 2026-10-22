'use client';

import { useEffect, useState } from 'react';
import type { FeedCard } from '@/lib/types';
import { minTime, useVisibleSeconds, words } from '@/lib/timing';

/** The four ratings, always the same buttons (FSRS Again / Hard / Good / Easy). */
export const RATINGS = [
  { r: 1, label: "Didn't get it", cls: 'again' },
  { r: 2, label: 'Tough', cls: 'hard' },
  { r: 3, label: 'Understood', cls: 'good' },
  { r: 4, label: 'So simple', cls: 'easy' },
] as const;

type Stage =
  | { k: 'think' } // recall: question only, a few seconds to answer in your head
  | { k: 'paper' } // problem review: solve on paper first
  | { k: 'intro' } // problem, first time: read the question
  | { k: 'step'; i: number; shown: boolean }
  | { k: 'rate' }
  | { k: 'again' }; // after "Didn't get it": the explanation, then move on

function firstStage(card: FeedCard, isProblem: boolean): Stage {
  if (isProblem) return card.view === 'learn' ? { k: 'intro' } : { k: 'paper' };
  return card.view === 'learn' ? { k: 'rate' } : { k: 'think' };
}

function speak(text: string) {
  if (typeof speechSynthesis === 'undefined') return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-IN';
  u.rate = 0.95;
  speechSynthesis.speak(u);
}

/**
 * One card, full screen. Buttons unlock after the card's minimum time (the
 * clock runs only while the tab is visible and survives a reload). The only
 * way forward is a rating.
 */
export default function CardScreen({
  card,
  timerKey,
  paper,
  onRate,
  onNext,
}: {
  card: FeedCard;
  timerKey: string;
  paper: string;
  onRate: (rating: number, seconds: number) => Promise<boolean>;
  onNext: () => void;
}) {
  const isProblem = card.kind === 'problem' && card.steps.length > 0;
  const secs = useVisibleSeconds(timerKey);
  const [stage, setStage] = useState<Stage>(() => firstStage(card, isProblem));
  const [stageAt, setStageAt] = useState(0);
  const [extra, setExtra] = useState(0);
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    // A card that is still tough shows its explanation straight away.
    card.stillTough && card.explain ? { card: true } : ({} as Record<string, boolean>),
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => () => {
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
  }, []);

  const go = (s: Stage) => {
    setStage(s);
    setStageAt(secs);
    setExtra(0);
  };
  const toggle = (id: string, text: string | null | undefined) => {
    setOpen((o) => {
      if (!o[id]) setExtra((e) => e + minTime.explain(words(text)));
      return { ...o, [id]: !o[id] };
    });
  };

  // Minimum time for the current screen.
  let need = 0;
  if (stage.k === 'think') need = minTime.think;
  else if (stage.k === 'paper') need = minTime.paper;
  else if (stage.k === 'intro') need = minTime.learn(words(card.front));
  else if (stage.k === 'step') {
    const s = card.steps[stage.i];
    need = card.view === 'learn' || stage.shown ? minTime.step(words(s.prompt, s.answer)) : minTime.think;
  } else if (stage.k === 'rate') {
    need = !isProblem && card.view === 'learn' ? minTime.learn(words(card.front, card.back)) : minTime.recall(words(card.back));
    // A still-tough card opens its explanation by itself; give time to read it.
    if (card.stillTough && card.explain) need += minTime.explain(words(card.explain));
  } else if (stage.k === 'again') need = minTime.explain(words(card.explain));
  need += extra;
  const elapsed = secs - stageAt;
  const ready = elapsed >= need;
  const fill = need > 0 ? Math.min(1, elapsed / need) : 1;

  async function rate(r: number) {
    if (!ready || busy) return;
    setBusy(true);
    const ok = await onRate(r, Math.round(secs));
    setBusy(false);
    if (!ok) return;
    if (r === 1 && card.explain && !open.card) go({ k: 'again' });
    else onNext();
  }

  const showAnswer = stage.k === 'rate' || stage.k === 'again';
  const stepsShown = stage.k === 'step' ? stage.i + 1 : showAnswer && isProblem ? card.steps.length : 0;
  const readable = [card.front, showAnswer ? card.back : '', open.card || stage.k === 'again' ? card.explain : '']
    .filter(Boolean)
    .join('. ');

  return (
    <article className="card study">
      <p className="meta">
        <span className={`pill ${card.mode}`}>{card.view === 'learn' ? 'New' : 'Revision'}</span>
        {card.stillTough && <span className="pill tough">Tough one</span>}
        <span>{paper}</span>
        <span>· {card.topic}</span>
        <span className="spacer" />
        <button className="icon" aria-label="Read aloud" title="Read aloud" onClick={() => speak(readable)}>
          🔊
        </button>
      </p>

      <div className="front">{card.front}</div>
      {stage.k === 'paper' && <p className="hint">✏️ Solve it on paper first. The steps open in a moment.</p>}
      {stage.k === 'think' && <p className="hint">Answer it in your head first.</p>}

      {isProblem &&
        card.steps.slice(0, stepsShown).map((s, i) => {
          const current = stage.k === 'step' && stage.i === i;
          const reveal = card.view === 'learn' || !current || stage.shown;
          return (
            <div className="step" key={i}>
              <p className="step-n">
                Step {i + 1} of {card.steps.length}
              </p>
              <p className="step-q">{s.prompt}</p>
              {reveal && (
                <>
                  <p className="step-a">{s.answer}</p>
                  {s.explain && (
                    <>
                      <button className="link" onClick={() => toggle(`s${i}`, s.explain)}>
                        {open[`s${i}`] ? 'Hide explanation' : 'Explain'}
                      </button>
                      {open[`s${i}`] && <p className="explain">{s.explain}</p>}
                    </>
                  )}
                </>
              )}
            </div>
          );
        })}

      {showAnswer && (
        <div className="answer">
          <p className="label">{isProblem ? 'Final answer' : 'Answer'}</p>
          <p className="key">{card.back}</p>
          {card.explain && stage.k !== 'again' && (
            <>
              <button className="link" onClick={() => toggle('card', card.explain)}>
                {open.card ? 'Hide explanation' : 'Explain more'}
              </button>
              {open.card && <p className="explain">{card.explain}</p>}
            </>
          )}
          {stage.k === 'again' && (
            <>
              <p className="label again-label">Here is the idea in plain words</p>
              <p className="explain">{card.explain}</p>
            </>
          )}
          {card.source && card.source !== 'syllabus' && <p className="src">From {card.source}</p>}
        </div>
      )}

      <div className="actions">
        <div className="unlock" aria-hidden>
          <span style={{ width: `${fill * 100}%` }} />
        </div>
        {stage.k === 'think' && (
          <TimedButton ready={ready} onClick={() => go({ k: 'rate' })}>
            Show answer
          </TimedButton>
        )}
        {(stage.k === 'intro' || stage.k === 'paper') && (
          <TimedButton ready={ready} onClick={() => go({ k: 'step', i: 0, shown: false })}>
            {stage.k === 'paper' ? 'Show step 1' : 'Start step 1'}
          </TimedButton>
        )}
        {stage.k === 'step' && card.view === 'recall' && !stage.shown && (
          <TimedButton ready={ready} onClick={() => go({ ...stage, shown: true })}>
            Show this step
          </TimedButton>
        )}
        {stage.k === 'step' && (card.view === 'learn' || stage.shown) && (
          <TimedButton
            ready={ready}
            onClick={() =>
              go(stage.i + 1 < card.steps.length ? { k: 'step', i: stage.i + 1, shown: false } : { k: 'rate' })
            }
          >
            {stage.i + 1 < card.steps.length ? `Next step` : 'Show final answer'}
          </TimedButton>
        )}
        {stage.k === 'rate' && (
          <div className="grades">
            {RATINGS.map(({ r, label, cls }) => (
              <button key={r} className={`btn grade ${cls}`} disabled={!ready || busy} onClick={() => rate(r)}>
                {label}
              </button>
            ))}
          </div>
        )}
        {stage.k === 'again' && (
          <TimedButton ready={ready} onClick={onNext}>
            Next card
          </TimedButton>
        )}
      </div>
    </article>
  );
}

function TimedButton({
  ready,
  onClick,
  children,
}: {
  ready: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button className="btn btn-primary" disabled={!ready} onClick={onClick}>
      {children}
    </button>
  );
}
