'use client';

import Link from 'next/link';
import { useState } from 'react';
import BuyButton from '@/components/BuyButton';
import Practice, { type PracticeResult } from '@/components/Practice';
import Summary from '@/components/Summary';
import { IS_APP } from '@/lib/env';
import { SAMPLE, useLicense } from '@/lib/store';

export default function SamplePage() {
  const [started, setStarted] = useState(false);
  const [results, setResults] = useState<PracticeResult[] | null>(null);
  const license = useLicense();

  return (
    <main className="page">
      <div className="narrow stack">
        {!started && (
          <div className="card">
            <h1>Free PMP sample test</h1>
            <p>
              {SAMPLE.length} original questions across People, Process and Business Environment, with a full
              explanation after each one. Untimed, no sign-up.
            </p>
            <button className="btn btn-primary" onClick={() => setStarted(true)}>Start</button>
          </div>
        )}
        {started && !results && <Practice questions={SAMPLE} onDone={setResults} schedule={false} />}
        {results && (
          <>
            <div className="card">
              <h2>Your sample result</h2>
              <Summary results={results} />
            </div>
            {!license && (
              <div className="card">
                <h2>Ready for the full prep?</h2>
                <p>
                  The full product adds the complete question bank, 60- and 180-question timed mocks, a daily
                  spaced-repetition review and drills built from your weakest topics.
                </p>
                {IS_APP ? (
                  <Link href="/unlock" className="btn btn-primary">I already have access</Link>
                ) : (
                  <div className="row">
                    <BuyButton />
                    <Link href="/#pricing" className="btn btn-ghost">What’s included</Link>
                  </div>
                )}
              </div>
            )}
            <button className="btn btn-ghost" onClick={() => { setResults(null); setStarted(true); }}>
              Retake sample
            </button>
          </>
        )}
      </div>
    </main>
  );
}
