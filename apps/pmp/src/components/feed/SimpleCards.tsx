'use client';

import { useState } from 'react';
import { saveProfile, setOutcome } from '@/lib/feed';

export function WelcomeCard({ daysAway, onDone }: { daysAway: number; onDone: () => void }) {
  return (
    <div className="study-card center-card">
      <div className="big-emoji" aria-hidden>👋</div>
      <h2>Welcome back!</h2>
      <p className="muted">
        {daysAway > 6 ? 'It’s been a while.' : `It’s been ${daysAway} days.`} Let’s start with a few quick ones. Your plan
        has already adjusted, so there’s nothing to catch up on by hand.
      </p>
      <button className="btn btn-primary btn-block" onClick={onDone}>Let’s go</button>
    </div>
  );
}

const CHECKLIST = [
  'Government ID with the exact name on your PMI record',
  'Test centre: arrive 30 minutes early. Online: start check-in 30 minutes early, desk cleared',
  'Water and a snack for the two optional breaks',
  'Read the last line of each question first: what is it asking?',
  'Pick the answer a servant leader following PMI’s process would choose',
];

export function ExamDayCard({ onDone }: { onDone: () => void }) {
  return (
    <div className="study-card">
      <span className="pill good">Exam day</span>
      <h2 style={{ marginTop: 10 }}>You’re ready. Good luck today.</h2>
      <ul className="ticks">
        {CHECKLIST.map((c) => <li key={c}>{c}</li>)}
      </ul>
      <p className="muted fine">No more study today. Rest your mind.</p>
      <div className="study-actions">
        <button className="btn btn-primary btn-block" onClick={onDone}>Done</button>
      </div>
    </div>
  );
}

/** After exam day: how did it go? A retake sets a new date and the plan restarts. */
export function AfterCard({ outcome }: { outcome?: 'passed' | 'retake' | 'unsure' }) {
  const [date, setDate] = useState('');
  if (outcome === 'passed') {
    return (
      <div className="study-card center-card">
        <div className="big-emoji" aria-hidden>🎉</div>
        <h2>Congratulations, PMP!</h2>
        <p className="muted">Well earned. Tell a colleague who’s studying about the free sample test.</p>
      </div>
    );
  }
  if (outcome === 'retake') {
    return (
      <div className="study-card">
        <h2>Let’s plan the retake</h2>
        <p className="muted">Pick your new exam date. Everything you learned stays; the plan rebuilds from your weakest cards.</p>
        <input className="text" type="date" min={new Date().toISOString().slice(0, 10)} value={date} onChange={(e) => setDate(e.target.value)} />
        <div className="study-actions">
          <button className="btn btn-primary btn-block" disabled={!date} onClick={() => { saveProfile({ examDate: date }); setOutcome(undefined); }}>
            Rebuild my plan
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="study-card center-card">
      <h2>How did the exam go?</h2>
      <div className="stack" style={{ width: '100%' }}>
        <button className="btn btn-primary btn-block" onClick={() => setOutcome('passed')}>I passed</button>
        <button className="btn btn-ghost btn-block" onClick={() => setOutcome('retake')}>I need a retake</button>
        <button className="btn btn-ghost btn-block" onClick={() => setOutcome('unsure')}>Waiting for my result</button>
      </div>
      {outcome === 'unsure' && <p className="muted fine" style={{ marginTop: 12 }}>Fingers crossed. Come back and tell us.</p>}
    </div>
  );
}
