'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Practice, { type PracticeResult } from '@/components/Practice';
import Summary from '@/components/Summary';
import { buildSession } from '@/lib/queue';
import { useBank, useProgress } from '@/lib/store';
import type { Question } from '@/lib/types';

const TITLES: Record<string, string> = {
  review: 'Daily review',
  drill: 'Weak-area drill',
  domain: 'Domain practice',
  topic: 'Topic practice',
  missed: 'Retry missed questions',
};

export default function PracticePage() {
  const bank = useBank();
  const p = useProgress();
  const [mode, setMode] = useState<string | null>(null);
  const [session, setSession] = useState<Question[] | null>(null);
  const [results, setResults] = useState<PracticeResult[] | null>(null);

  useEffect(() => {
    setMode(new URLSearchParams(window.location.search).get('mode'));
  }, []);

  // Build the session once, when the full bank is ready. Progress changes
  // during the session must not reshuffle it.
  useEffect(() => {
    if (session || !mode || !bank.full) return;
    const arg = new URLSearchParams(window.location.search).get('arg');
    setSession(buildSession(mode, bank.questions, p, arg));
  }, [bank.full, bank.questions, mode, p, session]);

  if (bank.status === 'sample' || bank.status === 'error') {
    return (
      <main className="page">
        <div className="narrow card">
          <h2>This needs full access</h2>
          <Link href="/study" className="btn btn-primary">Back to dashboard</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="narrow stack">
        <div className="spread">
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>{TITLES[mode ?? ''] ?? 'Practice'}</h1>
          <Link href="/study" className="btn btn-ghost btn-sm">Exit</Link>
        </div>
        {!session && <div className="card muted">Preparing your questions…</div>}
        {session && session.length === 0 && (
          <div className="card">
            <p>Nothing to practise here right now.</p>
            <Link href="/study" className="btn btn-primary">Back to dashboard</Link>
          </div>
        )}
        {session && session.length > 0 && !results && <Practice questions={session} onDone={setResults} />}
        {results && (
          <div className="card">
            <h2>Session complete</h2>
            <Summary results={results} />
            <div className="row" style={{ marginTop: 16 }}>
              <Link href="/study" className="btn btn-primary">Back to dashboard</Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
