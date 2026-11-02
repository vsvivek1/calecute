'use client';

import { useMemo } from 'react';
import { shuffle } from '@/lib/stats';
import { domainLabel, type Question } from '@/lib/types';

const KEYS = ['A', 'B', 'C', 'D'];

/** Options in a per-showing random order, so position never gives it away. */
export function useOrder(q: Question) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => shuffle(q.options.map((_, i) => i)), [q.id]);
}

export default function QuestionCard({
  q,
  order,
  chosen,
  onChoose,
  reveal,
}: {
  q: Question;
  order: number[];
  /** Original option index the learner picked. */
  chosen: number | null;
  onChoose?: (i: number) => void;
  reveal: boolean;
}) {
  return (
    <div>
      <div className="qmeta">
        <span className="pill">{domainLabel(q.domain)}</span>
        <span className="pill">{q.topic}</span>
        <span className="pill">{q.approach[0].toUpperCase() + q.approach.slice(1)}</span>
      </div>
      <div className="stem">{q.stem}</div>
      <div className="opts">
        {order.map((orig, pos) => {
          const cls = reveal
            ? orig === q.answer
              ? 'right'
              : orig === chosen
                ? 'wrong'
                : ''
            : orig === chosen
              ? 'sel'
              : '';
          return (
            <button
              key={orig}
              className={`opt ${cls}`}
              disabled={reveal || !onChoose}
              onClick={() => onChoose?.(orig)}
            >
              <span className="key">{KEYS[pos]}</span>
              <span>{q.options[orig]}</span>
            </button>
          );
        })}
      </div>
      {reveal && (
        <div className={`explain ${chosen === q.answer ? 'ok' : 'no'}`}>
          <b>
            {chosen === q.answer ? 'Correct.' : chosen === null ? 'Not answered.' : 'Not quite.'} The
            answer is {KEYS[order.indexOf(q.answer)]}.
          </b>
          {q.explanation}
        </div>
      )}
    </div>
  );
}
