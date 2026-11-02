'use client';

import { clock } from './FeedHeader';
import type { FeedStatus } from '@/lib/feed';

/** The calm screen between sittings. One button at most. */
export default function Between({
  status,
  mockSize,
  onStart,
  onMock,
  onSnoozeMock,
}: {
  status: Exclude<FeedStatus, { kind: 'onboard' } | { kind: 'sitting' } | { kind: 'after' }>;
  mockSize: number | null;
  onStart: (kind: 'quota' | 'bonus' | 'cram' | 'examday') => void;
  onMock: () => void;
  onSnoozeMock: () => void;
}) {
  const now = new Date();
  const day = status.day;
  const mock = mockSize ? (
    <div className="mock-offer">
      <b>Mock exam day</b>
      <p className="fine">
        {mockSize} questions, {Math.round((mockSize * 230) / 180)} minutes, timed like the real exam. Best done in one go.
      </p>
      <div className="row">
        <button className="btn btn-accent btn-sm" onClick={onMock}>Start the mock</button>
        <button className="btn btn-ghost btn-sm" onClick={onSnoozeMock}>Not today</button>
      </div>
    </div>
  ) : null;

  if (status.kind === 'ready') {
    const label =
      status.next === 'examday' ? 'Exam-day warm-up' : status.next === 'cram' ? 'Next cram set' : day.sittings ? 'Next sitting' : 'Today’s first sitting';
    return (
      <div className="study-card center-card">
        <div className="big-emoji" aria-hidden>{status.next === 'cram' ? '🔥' : status.next === 'examday' ? '🎯' : '☕'}</div>
        <h2>{label} is ready</h2>
        <p className="muted">
          {status.next === 'examday'
            ? '10 questions you know well, to warm up. Then a short checklist.'
            : status.next === 'cram'
              ? 'Your toughest cards first. 10 at a time with short breaks.'
              : `Up to 10 questions, about ${Math.min(12, Math.ceil(Math.max(1, day.plan.quota - day.done) * 1.2))} minutes.`}
        </p>
        {day.plan.behind && status.next === 'quota' && (
          <p className="notice fine">Your plan has more than fits your study time. Add a study time in your profile to stay on track.</p>
        )}
        <button className="btn btn-primary btn-block btn-lg" onClick={() => onStart(status.next)}>Start</button>
        {mock}
      </div>
    );
  }

  if (status.kind === 'wait') {
    return (
      <div className="study-card center-card">
        <div className="big-emoji" aria-hidden>{status.reason === 'quiet' ? '🌙' : '⏳'}</div>
        <h2>{status.reason === 'break' ? 'Short break' : status.reason === 'quiet' ? 'Rest now' : 'Sitting done'}</h2>
        <p className="muted">
          {status.reason === 'quiet'
            ? 'Sleep locks in what you learned today.'
            : status.reason === 'break'
              ? 'Stretch, get water. Breaks keep cram sets sharp.'
              : 'A gap before the next set makes the next recall take effort, and that effort builds memory.'}
        </p>
        <p className="next-time">
          Next set opens at <b>{clock(status.until)}</b>
          {status.until.toDateString() !== now.toDateString() ? ' tomorrow' : ''}
        </p>
        {mock}
      </div>
    );
  }

  // Quota complete.
  return (
    <div className="study-card center-card">
      <div className="big-emoji" aria-hidden>✅</div>
      <h2>{day.plan.phase === 'examDay' ? 'All set. Good luck!' : 'Today’s quota is done'}</h2>
      <p className="muted">
        {day.done} cards today. {status.bonusAt ? 'Want more? Extra sets come spaced out, never back to back.' : 'See you at your next study time.'}
      </p>
      {status.bonusAt &&
        (status.bonusAt <= now ? (
          <button className="btn btn-ghost btn-block" onClick={() => onStart('bonus')}>Start a bonus set</button>
        ) : (
          <p className="next-time">Bonus set opens at <b>{clock(status.bonusAt)}</b></p>
        ))}
      {mock}
    </div>
  );
}
