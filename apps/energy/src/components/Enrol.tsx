'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { browserClient } from '@/lib/supabase-browser';
import type { Exam, Paper } from '@/lib/types';
import Settings from './Settings';

/**
 * The only choice a student makes: which papers they are preparing for.
 * Some need one paper, others all four.
 */
export default function Enrol({
  catalog,
  initial,
  first = false,
  name,
  exam,
}: {
  catalog: Paper[];
  initial: number[];
  first?: boolean;
  name: string | null;
  exam?: Exam | null;
}) {
  const router = useRouter();
  const [picked, setPicked] = useState<number[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'papers' | 'plan'>('papers');

  const toggle = (id: number) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id].sort()));

  async function save() {
    setBusy(true);
    setError(null);
    const { error } = await browserClient().rpc('em_enrol', { p_papers: picked });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    // First time: one more screen for the exam date and study times.
    if (first && exam) {
      setBusy(false);
      setStep('plan');
      return;
    }
    router.push(first ? '/' : '/profile');
    router.refresh();
  }

  if (step === 'plan' && exam) {
    return (
      <>
        <h1>Your plan</h1>
        <p className="sub">
          Recallio works back from your exam date and opens a short sitting at each study time. You can change
          these later in your profile.
        </p>
        <Settings
          exam={exam}
          initial={{ studyTimes: ['07:00', '13:00', '20:00'], minutesPerDay: 30, examDate: null }}
          submitLabel="Start studying"
          onSaved={() => router.refresh()}
        />
      </>
    );
  }

  return (
    <>
      <h1>{first ? `Welcome${name ? `, ${name.split(' ')[0]}` : ''}` : 'My papers'}</h1>
      <p className="sub">
        {first
          ? 'Tick the papers you need to pass. Recallio will plan every day from here.'
          : 'Add or drop papers. Your progress on a dropped paper is kept if you come back to it.'}
      </p>
      {error && <div className="err">{error}</div>}
      <div className="papers">
        {catalog.map((p) => {
          const on = picked.includes(p.id);
          return (
            <button
              key={p.id}
              className={`card paper ${on ? 'on' : ''}`}
              onClick={() => toggle(p.id)}
              aria-pressed={on}
            >
              <span className="tick">{on ? '✓' : ''}</span>
              <span>
                <span className="pcode">Paper {p.id}</span>
                <span className="pname">{p.name}</span>
                <span className="pmeta">
                  {p.facts} cards · {p.problems} solved problems
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <button className="btn btn-primary btn-lg" disabled={busy || picked.length === 0} onClick={save}>
        {busy ? 'Saving…' : first ? 'Start' : 'Save'}
      </button>
    </>
  );
}
