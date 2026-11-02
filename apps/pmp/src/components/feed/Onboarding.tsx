'use client';

import { useState } from 'react';
import StudyTimes from './StudyTimes';
import { DEFAULT_TIMES, saveProfile, type Profile } from '@/lib/feed';
import { IS_APP } from '@/lib/env';
import { askAlertPermission, downloadCalendar } from '@/lib/platform/alerts';

/** Three short screens, then the first sitting starts. */
export default function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [examDate, setExamDate] = useState('');
  const [noDate, setNoDate] = useState(false);
  const [times, setTimes] = useState<string[]>(DEFAULT_TIMES);
  const [minutes, setMinutes] = useState(30);
  const [alerts, setAlerts] = useState<'idle' | 'on' | 'off'>('idle');
  const today = new Date().toISOString().slice(0, 10);
  const profile: Profile = { examDate: noDate ? null : examDate || null, studyTimes: times, minutesPerDay: minutes, onboarded: true };

  return (
    <div className="study-card">
      <div className="dots" aria-hidden>{[0, 1, 2].map((k) => <i key={k} className={k <= step ? 'on' : ''} />)}</div>

      {step === 0 && (
        <>
          <h2>When is your PMP exam?</h2>
          <p className="muted">Your daily plan works back from this date. The last two days switch to cram mode on their own.</p>
          <input className="text" type="date" min={today} value={examDate} disabled={noDate} onChange={(e) => setExamDate(e.target.value)} />
          <label className="check" style={{ marginTop: 12 }}>
            <input type="checkbox" checked={noDate} onChange={(e) => setNoDate(e.target.checked)} />
            I haven’t booked it yet (plan for 8 weeks; change it any time)
          </label>
          <div className="study-actions">
            <button className="btn btn-primary btn-block" disabled={!examDate && !noDate} onClick={() => setStep(1)}>Next</button>
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <h2>When can you study?</h2>
          <p className="muted">Short sittings at set times work better than long sessions. We’ll remind you at each one.</p>
          <StudyTimes value={times} onChange={setTimes} />
          <h3 style={{ marginTop: 18 }}>Minutes a day</h3>
          <div className="chips">
            {[15, 30, 45, 60].map((m) => (
              <button key={m} className={`chip ${minutes === m ? 'on' : ''}`} onClick={() => setMinutes(m)}>{m} min</button>
            ))}
          </div>
          <div className="study-actions">
            <button className="btn btn-primary btn-block" disabled={!times.length} onClick={() => setStep(2)}>Next</button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h2>Reminders</h2>
          {IS_APP ? (
            <p className="muted">Allow alerts so each sitting arrives like an alarm. You can dismiss them; your progress for the day always shows in the app.</p>
          ) : (
            <p className="muted">Add your study times to your calendar so each sitting reminds you, even when this tab is closed.</p>
          )}
          <div className="stack">
            {IS_APP ? (
              <button className="btn btn-ghost btn-block" disabled={alerts !== 'idle'} onClick={async () => setAlerts((await askAlertPermission()) ? 'on' : 'off')}>
                {alerts === 'on' ? 'Alerts on ✓' : alerts === 'off' ? 'Alerts blocked (turn on in Settings)' : 'Allow alerts'}
              </button>
            ) : (
              <>
                <button className="btn btn-ghost btn-block" onClick={() => downloadCalendar(profile)}>Add to my calendar</button>
                <button className="btn btn-ghost btn-block" disabled={alerts !== 'idle'} onClick={async () => setAlerts((await askAlertPermission()) ? 'on' : 'off')}>
                  {alerts === 'on' ? 'Browser notifications on ✓' : alerts === 'off' ? 'Notifications blocked' : 'Also allow browser notifications'}
                </button>
              </>
            )}
          </div>
          <div className="study-actions">
            <button className="btn btn-primary btn-block" onClick={() => { saveProfile(profile); onDone(); }}>
              Start my first sitting
            </button>
          </div>
        </>
      )}
    </div>
  );
}
