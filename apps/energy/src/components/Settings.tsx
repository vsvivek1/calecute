'use client';

import { useState } from 'react';
import { browserClient } from '@/lib/supabase-browser';
import type { Exam } from '@/lib/types';

const MINUTES = [15, 20, 30, 45, 60, 90, 120];
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

/**
 * Exam date, study times and minutes per day. Used once at onboarding and
 * in the profile. Recallio plans from these; the learner never picks cards.
 */
export default function Settings({
  exam,
  initial,
  submitLabel,
  onSaved,
}: {
  exam: Exam;
  initial: { studyTimes: string[]; minutesPerDay: number; examDate: string | null };
  submitLabel: string;
  onSaved: () => void;
}) {
  const [own, setOwn] = useState(Boolean(initial.examDate));
  const [date, setDate] = useState(initial.examDate ?? exam.official);
  const [times, setTimes] = useState<string[]>(initial.studyTimes.length ? initial.studyTimes : ['07:00']);
  const [minutes, setMinutes] = useState(initial.minutesPerDay);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save() {
    setBusy(true);
    setError(null);
    setSaved(false);
    const { error } = await browserClient().rpc('em_settings', {
      p_exam_date: own ? date : null,
      p_study_times: times,
      p_minutes: minutes,
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSaved(true);
    onSaved();
  }

  return (
    <div className="settings">
      {error && <div className="err">{error}</div>}

      <h3>Exam date</h3>
      <label className="row">
        <input type="radio" checked={!own} onChange={() => setOwn(false)} />
        <span>
          {fmtDate(exam.official)} <span className="note">({exam.status})</span>
          <span className="note block">{exam.source}</span>
        </span>
      </label>
      <label className="row">
        <input type="radio" checked={own} onChange={() => setOwn(true)} />
        <span>
          My own date{' '}
          <input type="date" value={date} disabled={!own} onChange={(e) => setDate(e.target.value)} />
        </span>
      </label>

      <h3>Study times</h3>
      <p className="note">Each sitting opens at one of these times (India time). Choose 1 to 6.</p>
      <div className="times">
        {times.map((t, i) => (
          <span key={i} className="time">
            <input
              type="time"
              value={t}
              onChange={(e) => setTimes((ts) => ts.map((x, j) => (j === i ? e.target.value : x)))}
            />
            {times.length > 1 && (
              <button
                className="link"
                aria-label="Remove this time"
                onClick={() => setTimes((ts) => ts.filter((_, j) => j !== i))}
              >
                ✕
              </button>
            )}
          </span>
        ))}
        {times.length < 6 && (
          <button className="btn btn-ghost btn-sm" onClick={() => setTimes((ts) => [...ts, '18:00'])}>
            + Add a time
          </button>
        )}
      </div>

      <h3>Minutes a day</h3>
      <select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
        {MINUTES.map((m) => (
          <option key={m} value={m}>
            {m} minutes
          </option>
        ))}
      </select>

      <div className="actions">
        <button className="btn btn-primary" disabled={busy} onClick={save}>
          {busy ? 'Saving…' : submitLabel}
        </button>
        {saved && <span className="note"> Saved. Recallio has re-planned.</span>}
      </div>
    </div>
  );
}
