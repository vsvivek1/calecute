'use client';

import { useState } from 'react';
import QuestionCard, { useOrder } from './QuestionCard';
import { recordAnswer } from '@/lib/store';
import type { Question } from '@/lib/types';

export interface PracticeResult {
  q: Question;
  correct: boolean;
}

/**
 * One question at a time with immediate feedback. Each answer feeds the
 * spaced-repetition schedule and the per-topic accuracy behind the drills.
 */
export default function Practice({
  questions,
  onDone,
  schedule = true,
}: {
  questions: Question[];
  onDone: (results: PracticeResult[]) => void;
  schedule?: boolean;
}) {
  const [i, setI] = useState(0);
  const [results, setResults] = useState<PracticeResult[]>([]);
  const q = questions[i];
  return (
    <PracticeStep
      key={q.id + i}
      q={q}
      index={i}
      total={questions.length}
      onAnswered={(correct, guessed) => {
        recordAnswer(q, correct, guessed, { schedule });
        setResults((r) => [...r, { q, correct }]);
      }}
      onNext={() => {
        if (i + 1 < questions.length) setI(i + 1);
        else onDone([...results]);
      }}
      last={i + 1 === questions.length}
    />
  );
}

function PracticeStep({
  q,
  index,
  total,
  onAnswered,
  onNext,
  last,
}: {
  q: Question;
  index: number;
  total: number;
  onAnswered: (correct: boolean, guessed: boolean) => void;
  onNext: () => void;
  last: boolean;
}) {
  const order = useOrder(q);
  const [chosen, setChosen] = useState<number | null>(null);
  const [guessed, setGuessed] = useState(false);
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="card">
      <div className="progress-top">
        <span className="muted">
          {index + 1} / {total}
        </span>
        <div className="bar">
          <i style={{ width: `${((index + (revealed ? 1 : 0)) / total) * 100}%` }} />
        </div>
      </div>
      <QuestionCard q={q} order={order} chosen={chosen} onChoose={setChosen} reveal={revealed} />
      <div className="spread" style={{ marginTop: 18 }}>
        {!revealed ? (
          <>
            <label className="check">
              <input type="checkbox" checked={guessed} onChange={(e) => setGuessed(e.target.checked)} />
              I&apos;m guessing
            </label>
            <button
              className="btn btn-primary"
              disabled={chosen === null}
              onClick={() => {
                setRevealed(true);
                onAnswered(chosen === q.answer, guessed);
              }}
            >
              Check answer
            </button>
          </>
        ) : (
          <>
            <span className="muted">
              {chosen === q.answer ? (guessed ? 'Right, but guessed: it will come back sooner.' : 'Scheduled for later review.') : 'It will come back tomorrow.'}
            </span>
            <button className="btn btn-primary" onClick={onNext}>
              {last ? 'See results' : 'Next question'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
