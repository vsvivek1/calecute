'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import StudyTimes from '@/components/feed/StudyTimes';
import { IS_APP } from '@/lib/env';
import { resetLoop, saveProfile, useLoop } from '@/lib/feed';
import { askAlertPermission, downloadCalendar, exactAlarmStatus, openExactAlarmSetting } from '@/lib/platform/alerts';
import { useLicense } from '@/lib/store';

/** Profile: exam date, study times, alerts, account and privacy. */
export default function Profile() {
  const s = useLoop();
  const license = useLicense();
  const p = s.profile;
  const [exact, setExact] = useState<'granted' | 'denied' | 'na'>('na');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    exactAlarmStatus().then(setExact);
  }, []);

  const set = (patch: Parameters<typeof saveProfile>[0]) => {
    saveProfile(patch);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <main className="page">
      <div className="narrow stack">
        <div className="spread">
          <h1 style={{ fontSize: '1.6rem', margin: 0 }}>Profile</h1>
          <Link href="/study" className="btn btn-primary btn-sm">Back to my feed</Link>
        </div>
        {saved && <div className="notice fine">Saved. Your plan has updated.</div>}

        <section className="card">
          <h3>Exam date</h3>
          <p className="muted fine">The plan works back from this date. The last two days are cram mode.</p>
          <div className="row">
            <input
              className="text"
              style={{ maxWidth: 200 }}
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              value={p.examDate ?? ''}
              onChange={(e) => e.target.value && set({ examDate: e.target.value })}
            />
            {p.examDate && <button className="btn btn-ghost btn-sm" onClick={() => set({ examDate: null })}>Not booked yet</button>}
          </div>
          {!p.examDate && <p className="fine">No date yet: planning for 8 weeks at a time.</p>}
        </section>

        <section className="card">
          <h3>Study times</h3>
          <StudyTimes value={p.studyTimes} onChange={(studyTimes) => set({ studyTimes })} />
          <h3 style={{ marginTop: 18 }}>Minutes a day</h3>
          <div className="chips">
            {[15, 30, 45, 60, 90].map((m) => (
              <button key={m} className={`chip ${p.minutesPerDay === m ? 'on' : ''}`} onClick={() => set({ minutesPerDay: m })}>{m} min</button>
            ))}
          </div>
        </section>

        <section className="card">
          <h3>Reminders</h3>
          {IS_APP ? (
            <div className="stack">
              <button className="btn btn-ghost" onClick={() => askAlertPermission()}>Allow alerts</button>
              {exact === 'denied' && (
                <div>
                  <p className="fine">Alerts arriving late? Allow exact alarms so they come on time.</p>
                  <button className="btn btn-ghost btn-sm" onClick={() => openExactAlarmSetting()}>Allow exact alarms</button>
                </div>
              )}
              <p className="fine">
                Alerts not coming at all? Some phones (Xiaomi, Vivo, Oppo, Samsung) stop apps in the background. In
                Settings → Apps → PMP Prep → Battery, choose “No restrictions” or “Unrestricted”.
              </p>
            </div>
          ) : (
            <div className="stack">
              <button className="btn btn-ghost" onClick={() => downloadCalendar(p)}>Add study times to my calendar</button>
              <p className="fine">Re-download after changing your study times or exam date.</p>
            </div>
          )}
        </section>

        <section className="card">
          <h3>Account and data</h3>
          <p className="fine">Your progress stays on this device. Nothing about your study is sent to us.</p>
          <div className="row">
            {license && <Link href="/unlock" className="btn btn-ghost btn-sm">Licence</Link>}
            <a className="btn btn-ghost btn-sm" href="https://calecutech.com/privacy">Privacy</a>
            <a className="btn btn-ghost btn-sm" href="https://calecutech.com/terms">Terms</a>
            <a className="btn btn-ghost btn-sm" href="https://calecutech.com/contact">Help</a>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginTop: 14, color: 'var(--bad)' }}
            onClick={() => confirm('Erase all study progress on this device? This cannot be undone.') && resetLoop()}
          >
            Delete my progress
          </button>
        </section>
      </div>
    </main>
  );
}
