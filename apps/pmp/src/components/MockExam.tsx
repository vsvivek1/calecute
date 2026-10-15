'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import QuestionCard from './QuestionCard';
import Summary from './Summary';
import { recordAnswer, recordMock } from '@/lib/store';
import { record, shuffle, type TallyMap } from '@/lib/stats';
import type { Question } from '@/lib/types';

// The real exam allows 230 minutes for 180 questions. Shorter mocks keep
// the same pace: about 76.7 seconds a question.
const SECONDS_PER_Q = (230 * 60) / 180;

const fmt = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h ? `${h}:` : ''}${String(m).padStart(h ? 2 : 1, '0')}:${String(sec).padStart(2, '0')}`;
};

export default function MockExam({ questions, onExit }: { questions: Question[]; onExit: () => void }) {
  const total = Math.round(questions.length * SECONDS_PER_Q);
  const orders = useMemo(() => questions.map((q) => shuffle(q.options.map((_, i) => i))), [questions]);
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [flags, setFlags] = useState<boolean[]>(() => questions.map(() => false));
  const [i, setI] = useState(0);
  const [left, setLeft] = useState(total);
  const [done, setDone] = useState(false);
  const [reviewI, setReviewI] = useState<number | null>(null);
  const started = useRef(Date.now());

  useEffect(() => {
    if (done) return;
    const t = setInterval(() => {
      const l = total - Math.floor((Date.now() - started.current) / 1000);
      setLeft(Math.max(0, l));
    }, 1000);
    return () => clearInterval(t);
  }, [done, total]);

  const finish = () => {
    if (done) return;
    let byDomain: TallyMap = {};
    questions.forEach((q, k) => {
      const ok = answers[k] === q.answer;
      byDomain = record(byDomain, q.domain, ok);
      // Mock answers count toward weak-area stats, and wrong ones enter the
      // review schedule; right ones are left to normal practice.
      recordAnswer(q, ok, false, { schedule: !ok });
    });
    recordMock({
      at: new Date().toISOString(),
      size: questions.length,
      correct: questions.filter((q, k) => answers[k] === q.answer).length,
      byDomain,
      minutes: Math.round((Date.now() - started.current) / 60000),
    });
    setDone(true);
  };

  useEffect(() => {
    if (left === 0 && !done) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left]);

  const answered = answers.filter((a) => a !== null).length;

  if (done) {
    const results = questions.map((q, k) => ({ q, correct: answers[k] === q.answer }));
    return (
      <div className="stack">
        <div className="card">
          <h2>Mock exam result</h2>
          <Summary results={results} showBands />
          <div className="row" style={{ marginTop: 16 }}>
            <button className="btn btn-primary" onClick={onExit}>Back to dashboard</button>
          </div>
        </div>
        <div className="card">
          <h3>Review your answers</h3>
          <p className="muted">Tap a question to see the explanation. Red were wrong or unanswered.</p>
          <div className="navgrid">
            {questions.map((q, k) => (
              <button
                key={q.id}
                className={reviewI === k ? 'cur' : ''}
                style={{
                  background: answers[k] === q.answer ? 'var(--good-bg)' : 'var(--bad-bg)',
                  borderColor: answers[k] === q.answer ? '#b6e2c9' : '#f2c4be',
                }}
                onClick={() => setReviewI(k)}
              >
                {k + 1}
              </button>
            ))}
          </div>
          {reviewI !== null && (
            <div style={{ marginTop: 20 }}>
              <QuestionCard q={questions[reviewI]} order={orders[reviewI]} chosen={answers[reviewI]} reveal />
            </div>
          )}
        </div>
      </div>
    );
  }

  const q = questions[i];
  return (
    <div className="stack">
      <div className="card">
        <div className="spread" style={{ marginBottom: 14 }}>
          <span className="muted">
            Question {i + 1} of {questions.length} · {answered} answered
          </span>
          <span className={`timer ${left < 300 ? 'low' : ''}`}>{fmt(left)}</span>
        </div>
        <QuestionCard
          q={q}
          order={orders[i]}
          chosen={answers[i]}
          onChoose={(c) => setAnswers((a) => a.map((x, k) => (k === i ? c : x)))}
          reveal={false}
        />
        <div className="spread" style={{ marginTop: 18 }}>
          <label className="check">
            <input
              type="checkbox"
              checked={flags[i]}
              onChange={() => setFlags((f) => f.map((x, k) => (k === i ? !x : x)))}
            />
            Flag for review
          </label>
          <div className="row">
            <button className="btn btn-ghost" disabled={i === 0} onClick={() => setI(i - 1)}>Back</button>
            {i + 1 < questions.length ? (
              <button className="btn btn-primary" onClick={() => setI(i + 1)}>Next</button>
            ) : (
              <button
                className="btn btn-accent"
                onClick={() => {
                  const missing = questions.length - answered;
                  if (!missing || confirm(`${missing} unanswered. Submit anyway?`)) finish();
                }}
              >
                Submit exam
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="card">
        <div className="spread" style={{ marginBottom: 10 }}>
          <b>Navigator</b>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              const missing = questions.length - answered;
              if (confirm(missing ? `${missing} unanswered. Submit anyway?` : 'Submit the exam?')) finish();
            }}
          >
            Submit now
          </button>
        </div>
        <div className="navgrid">
          {questions.map((x, k) => (
            <button
              key={x.id}
              className={`${answers[k] !== null ? 'done' : ''} ${flags[k] ? 'flag' : ''} ${k === i ? 'cur' : ''}`}
              onClick={() => setI(k)}
            >
              {k + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
