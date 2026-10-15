'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import MockExam from '@/components/MockExam';
import { pickMock } from '@/lib/stats';
import { useBank } from '@/lib/store';
import { DOMAINS, type Question } from '@/lib/types';

export default function MockPage() {
  const router = useRouter();
  const bank = useBank();
  const [size, setSize] = useState(60);
  const [exam, setExam] = useState<Question[] | null>(null);

  useEffect(() => {
    const n = Number(new URLSearchParams(window.location.search).get('size'));
    if (n === 180 || n === 60) setSize(n);
  }, []);

  if (bank.status === 'sample' || bank.status === 'error') {
    return (
      <main className="page">
        <div className="narrow card">
          <h2>Mock exams need full access</h2>
          <Link href="/study" className="btn btn-primary">Back to dashboard</Link>
        </div>
      </main>
    );
  }

  const n = Math.min(size, bank.questions.length);
  const minutes = Math.round((n * 230) / 180);

  return (
    <main className="page">
      <div className="narrow">
        {!exam ? (
          <div className="card stack">
            <h1 style={{ fontSize: '1.6rem' }}>{n}-question mock exam</h1>
            <p>
              {minutes} minutes. Domains are weighted like the real exam:{' '}
              {DOMAINS.map((d) => `${d.label} ${Math.round(d.weight * 100)}%`).join(', ')}. No feedback until
              you submit; you can flag questions and move freely between them.
            </p>
            {size === 180 && (
              <p className="muted">
                The real exam offers two 10-minute breaks. This mock runs straight through; pause your own
                breaks between questions if you want to practise them.
              </p>
            )}
            <div className="row">
              <button className="btn btn-primary" disabled={!bank.full} onClick={() => setExam(pickMock(bank.questions, n, DOMAINS))}>
                {bank.full ? 'Start the clock' : 'Loading questions…'}
              </button>
              <Link href="/study" className="btn btn-ghost">Cancel</Link>
            </div>
          </div>
        ) : (
          <MockExam questions={exam} onExit={() => router.push('/study')} />
        )}
      </div>
    </main>
  );
}
