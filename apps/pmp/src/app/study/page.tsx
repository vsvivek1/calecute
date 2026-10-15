'use client';

import Link from 'next/link';
import BuyButton from '@/components/BuyButton';
import { barClass } from '@/components/Summary';
import { IS_APP } from '@/lib/env';
import { dueCards } from '@/lib/queue';
import { accuracy, topicKey } from '@/lib/stats';
import { resetProgress, useBank, useLicense, useProgress } from '@/lib/store';
import { DOMAINS, domainLabel, type Domain } from '@/lib/types';

function streak(days: string[]) {
  const set = new Set(days);
  let n = 0;
  const d = new Date();
  const key = (x: Date) =>
    `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  if (!set.has(key(d))) d.setDate(d.getDate() - 1); // today not studied yet still keeps yesterday's streak
  while (set.has(key(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export default function StudyHome() {
  const license = useLicense();
  const bank = useBank();
  const p = useProgress();
  const locked = !license;

  const due = bank.full ? dueCards(bank.questions, p.cards).length : 0;
  const seen = Object.keys(p.last).length;
  const allTotal = Object.values(p.domains).reduce((s, t) => s + t.total, 0);
  const allCorrect = Object.values(p.domains).reduce((s, t) => s + t.correct, 0);
  const missed = Object.values(p.last).filter((x) => !x).length;

  const topics = [...new Set(bank.questions.map(topicKey))]
    .map((k) => ({ k, t: p.topics[k], acc: accuracy(p.topics[k], 1) }))
    .filter((x) => x.t)
    .sort((a, b) => (a.acc ?? 1) - (b.acc ?? 1));

  const lastMock = p.mocks.at(-1);

  return (
    <main className="page">
      <div className="wrap stack">
        <div className="spread">
          <div>
            <h1 style={{ fontSize: '1.8rem', marginBottom: 4 }}>Your PMP study plan</h1>
            <p className="muted" style={{ margin: 0 }}>
              {locked
                ? 'Free preview: the sample questions only.'
                : bank.status === 'loading'
                  ? 'Loading your question bank…'
                  : `${bank.questions.length} questions in your bank.`}
            </p>
          </div>
        </div>

        {bank.status === 'error' && (
          <div className="notice">
            {bank.error} <button className="btn btn-ghost btn-sm" onClick={bank.reload}>Retry</button>
          </div>
        )}

        {locked && (
          <div className="card">
            <h3>Unlock the full prep</h3>
            <p className="muted">
              The full bank, timed mocks, daily spaced review and weak-area drills.
              {IS_APP ? ' Already bought on the web? Sign in with the same email.' : ''}
            </p>
            <div className="row">
              {!IS_APP && <BuyButton />}
              <Link href="/unlock" className="btn btn-ghost">I already paid</Link>
              <Link href="/sample" className="btn btn-ghost">Free sample test</Link>
            </div>
          </div>
        )}

        <div className="stats">
          <div className="stat"><b>{due}</b><span>due for review today</span></div>
          <div className="stat"><b>{allTotal ? `${Math.round((allCorrect / allTotal) * 100)}%` : '–'}</b><span>overall accuracy</span></div>
          <div className="stat"><b>{seen}{bank.full ? <small className="muted" style={{ fontSize: '0.9rem' }}> / {bank.questions.length}</small> : null}</b><span>questions seen</span></div>
          <div className="stat"><b>{streak(p.days)}</b><span>day streak</span></div>
        </div>

        <div className="modes">
          <Mode
            href="/study/practice?mode=review"
            locked={locked}
            title="Daily review"
            body={due ? `${due} questions due, topped up with new ones from your weakest topics.` : 'Nothing due. Learn 20 new questions, weakest topics first.'}
          />
          <Mode
            href="/study/practice?mode=drill"
            locked={locked}
            title="Weak-area drill"
            body={topics.some((t) => (t.acc ?? 1) < 0.7) ? `15 questions from the topics you score worst on, starting with ${topics[0].k.split(':')[1]}.` : 'Answer a few more questions and this will target your weakest topics.'}
          />
          <Mode
            href="/study/mock?size=60"
            locked={locked}
            title="Mini mock · 60 questions"
            body="77 minutes, exam-weighted domains, scored by domain at the end."
          />
          <Mode
            href="/study/mock?size=180"
            locked={locked}
            title="Full mock · 180 questions"
            body="230 minutes, the real exam’s length and pace. Take one a week before test day."
          />
        </div>

        <div className="grid2">
          <div className="card">
            <h3>By domain</h3>
            {DOMAINS.map((d) => {
              const t = p.domains[d.id];
              const acc = t ? t.correct / t.total : 0;
              return (
                <div key={d.id} style={{ marginBottom: 14 }}>
                  <div className="spread">
                    <span>{d.label} <span className="muted">· {Math.round(d.weight * 100)}% of exam</span></span>
                    <span className="muted">{t ? `${Math.round(acc * 100)}%` : '–'}</span>
                  </div>
                  <div className={`bar ${t ? barClass(acc) : ''}`} style={{ marginTop: 6 }}>
                    <i style={{ width: `${t ? acc * 100 : 0}%` }} />
                  </div>
                  {!locked && (
                    <Link href={`/study/practice?mode=domain&arg=${d.id}`} className="fine">
                      Practise 20 {d.label} questions →
                    </Link>
                  )}
                </div>
              );
            })}
            {!locked && missed > 0 && (
              <Link href="/study/practice?mode=missed" className="btn btn-ghost btn-sm">
                Retry {missed} questions you last got wrong
              </Link>
            )}
          </div>
          <div className="card">
            <h3>Weakest topics</h3>
            {topics.length === 0 && <p className="muted">Answer some questions to see your topic breakdown.</p>}
            {topics.slice(0, 8).map(({ k, t, acc }) => {
              const [d, name] = k.split(':');
              return (
                <div className="topic-row" key={k}>
                  <span>
                    {locked ? name : <Link href={`/study/practice?mode=topic&arg=${encodeURIComponent(k)}`}>{name}</Link>}{' '}
                    <span className="muted fine">{domainLabel(d as Domain)}</span>
                  </span>
                  <div className={`bar ${barClass(acc ?? 0)}`}><i style={{ width: `${(acc ?? 0) * 100}%` }} /></div>
                  <span className="muted fine">{t!.correct}/{t!.total}</span>
                </div>
              );
            })}
          </div>
        </div>

        {lastMock && (
          <div className="card">
            <h3>Mock exams</h3>
            {p.mocks.slice(-5).reverse().map((m) => (
              <div className="topic-row" key={m.at}>
                <span>{new Date(m.at).toLocaleDateString()} · {m.size} questions · {m.minutes} min</span>
                <div className={`bar ${barClass(m.correct / m.size)}`}><i style={{ width: `${(m.correct / m.size) * 100}%` }} /></div>
                <span className="muted fine">{Math.round((m.correct / m.size) * 100)}%</span>
              </div>
            ))}
          </div>
        )}

        <div className="row">
          {license && <Link href="/unlock" className="fine">Account</Link>}
          <button
            className="fine"
            style={{ background: 'none', border: 0, color: 'var(--ink-3)', cursor: 'pointer', padding: 0 }}
            onClick={() => confirm('Erase all progress on this device?') && resetProgress()}
          >
            Reset progress
          </button>
        </div>
      </div>
    </main>
  );
}

function Mode({ href, title, body, locked }: { href: string; title: string; body: string; locked: boolean }) {
  if (locked) {
    return (
      <div className="mode locked">
        <h3>🔒 {title}</h3>
        <p>{body}</p>
      </div>
    );
  }
  return (
    <Link href={href} className="mode">
      <h3>{title}</h3>
      <p>{body}</p>
    </Link>
  );
}
