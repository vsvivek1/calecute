'use client';

import { useState } from 'react';
import { dateWarning, PLAN_DAYS } from '@/lib/engine/plan';
import { dayKey } from '@/lib/engine/scheduler';

/**
 * Exam date, or the default 100-day plan. Shows a warning as soon as a date
 * is picked that is too close, too tight for the daily time, or very far.
 */
export default function ExamDatePicker({
  examDate,
  newLeft,
  minutesPerDay,
  onChange,
}: {
  examDate: string | null;
  newLeft: number;
  minutesPerDay: number;
  onChange: (examDate: string | null) => void;
}) {
  const [draft, setDraft] = useState(examDate ?? '');
  const today = dayKey(new Date());
  const warn = draft ? dateWarning({ today: new Date(), examDate: draft, newLeft, minutesPerDay }) : null;

  return (
    <div className="stack">
      <div className="row">
        <input
          className="text"
          style={{ maxWidth: 200 }}
          type="date"
          min={today}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (e.target.value) onChange(e.target.value);
          }}
        />
        {examDate && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setDraft(''); onChange(null); }}>
            Not booked yet ({PLAN_DAYS}-day plan)
          </button>
        )}
      </div>
      {warn && <p className={`pill ${warn.level}`} style={{ whiteSpace: 'normal', lineHeight: 1.4 }}>{warn.text}</p>}
    </div>
  );
}
