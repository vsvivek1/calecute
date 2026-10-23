'use client';

// The Daily Feed: the app's only menu. One card at a time, chosen by the
// app; a rating is the only way forward.

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import BuyButton from '@/components/BuyButton';
import MockExam from '@/components/MockExam';
import Between from '@/components/feed/Between';
import CheckCard from '@/components/feed/CheckCard';
import FeedHeader from '@/components/feed/FeedHeader';
import Onboarding from '@/components/feed/Onboarding';
import ReportCard from '@/components/feed/ReportCard';
import { AfterCard, ExamDayCard, WelcomeCard } from '@/components/feed/SimpleCards';
import StudyCard from '@/components/feed/StudyCard';
import { IS_APP } from '@/lib/env';
import {
  currentUi, ensureDay, feedStatus, finishCheck, getLoop, mockOffer, nextItem, patchUi, rateCard, recordMockResult,
  slowFactor, snoozeMock, startSitting, streak, touchDay, useLoop,
} from '@/lib/feed';
import { dayKey } from '@/lib/engine/scheduler';
import { notifyQuotaComplete, scheduleAlerts } from '@/lib/platform/alerts';
import { pickMock } from '@/lib/stats';
import { useBank, useLicense } from '@/lib/store';
import { DOMAINS, type Question } from '@/lib/types';
import { clock } from '@/components/feed/FeedHeader';

const NOTIFIED = 'pmp.quotaNotified';

export default function Feed() {
  const license = useLicense();
  const bank = useBank();
  const s = useLoop();
  const [now, setNow] = useState(() => new Date());
  const [mock, setMock] = useState<Question[] | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const questions = bank.full ? bank.questions : [];

  // A clock, so "next set at 5:30" turns into a Start button on its own.
  useEffect(() => {
    setHydrated(true);
    const t = setInterval(() => setNow(new Date()), 20_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (questions.length) touchDay(questions);
  }, [questions, s.profile.onboarded, now]);

  const status = questions.length ? feedStatus(s, questions, now) : null;
  const day = questions.length && s.profile.onboarded ? ensureDay(s, questions, now).day : null;

  // Alerts: reschedule on open and whenever the day's quota completes.
  const complete = !!day && day.done >= day.plan.quota;
  useEffect(() => {
    if (s.profile.onboarded) scheduleAlerts(s.profile, complete);
  }, [s.profile, complete]);

  // "Quota complete", once a day.
  const notified = useRef(false);
  useEffect(() => {
    if (!complete || !day || notified.current || day.plan.phase !== 'learn' && day.plan.phase !== 'revision') return;
    const today = dayKey(new Date());
    try {
      if (localStorage.getItem(NOTIFIED) === today) return;
      localStorage.setItem(NOTIFIED, today);
    } catch {}
    notified.current = true;
    const st = feedStatus(getLoop(), questions);
    notifyQuotaComplete(st.kind === 'done' && st.bonusAt ? clock(st.bonusAt) : null);
  }, [complete, day, questions]);

  if (!hydrated) return <main className="feed" />;

  if (!license) {
    return (
      <main className="feed">
        <div className="study-card center-card">
          <h2>Unlock your PMP study plan</h2>
          <p className="muted">
            The app picks 10 questions at a time from the full bank, at the times you choose, and plans backwards
            from your exam date.
            {IS_APP ? ' Already bought on the web? Sign in with the same Google account.' : ''}
          </p>
          <div className="stack" style={{ width: '100%' }}>
            {!IS_APP && <BuyButton className="btn btn-accent btn-block" />}
            <Link href="/unlock" className="btn btn-ghost btn-block">I already paid</Link>
            <Link href="/sample" className="btn btn-ghost btn-block">Try a free sitting</Link>
          </div>
        </div>
      </main>
    );
  }

  if (bank.status === 'error') {
    return (
      <main className="feed">
        <div className="study-card center-card">
          <p>{bank.error}</p>
          <button className="btn btn-primary" onClick={bank.reload}>Try again</button>
        </div>
      </main>
    );
  }

  if (!status) {
    return (
      <main className="feed">
        <div className="study-card center-card muted">Loading your questions…</div>
      </main>
    );
  }

  if (mock) {
    return (
      <main className="page">
        <div className="narrow">
          <MockExam
            questions={mock}
            onFinish={(answers, minutes) => recordMockResult(mock, answers, minutes)}
            onExit={() => setMock(null)}
          />
        </div>
      </main>
    );
  }

  const qs = new Map(questions.map((q) => [q.id, q]));
  const nextAt = status.kind === 'wait' ? status.until : status.kind === 'done' ? status.bonusAt : null;
  const offer = status.kind === 'ready' || status.kind === 'wait' || status.kind === 'done' ? mockOffer(s, questions, now) : null;

  return (
    <main className="feed">
      {status.kind !== 'onboard' && status.kind !== 'after' && (
        <FeedHeader day={day} next={nextAt && nextAt > now ? nextAt : null} streak={streak(s, now)} hasExam={!!s.profile.examDate} />
      )}
      {status.kind === 'onboard' && <Onboarding onDone={() => startSitting(questions, 'quota')} />}
      {status.kind === 'after' && <AfterCard outcome={s.outcome} />}
      {(status.kind === 'ready' || status.kind === 'wait' || status.kind === 'done') && (
        <Between
          status={status}
          mockSize={offer}
          onStart={(kind) => startSitting(questions, kind)}
          onMock={() => setMock(pickMock(questions, Math.min(offer ?? 60, questions.length), DOMAINS))}
          onSnoozeMock={snoozeMock}
        />
      )}
      {status.kind === 'sitting' && <SittingView questions={questions} qs={qs} />}
    </main>
  );
}

function SittingView({ questions, qs }: { questions: Question[]; qs: Map<string, Question> }) {
  const s = useLoop();
  const sit = s.sitting!;
  const item = sit.items[sit.i];
  const progress = (
    <div className="sit-progress" aria-label={`Card ${sit.i + 1} of ${sit.items.length}`}>
      {sit.items.map((_, k) => <i key={k} className={k < sit.i ? 'done' : k === sit.i ? 'cur' : ''} />)}
    </div>
  );

  if (!item) {
    // A card that no longer exists in the bank: move on.
    queueMicrotask(() => nextItem());
    return null;
  }

  let body: React.ReactNode = null;
  if (item.t === 'q') {
    const q = qs.get(item.id);
    if (!q) {
      queueMicrotask(() => nextItem());
      return null;
    }
    const ui = currentUi(sit, q);
    body = (
      <StudyCard
        key={`${sit.id}:${sit.i}`}
        q={q}
        ui={ui}
        why={item.why}
        slow={slowFactor(s)}
        onPatch={(p) => patchUi(sit.i, p, q)}
        onRate={(r, correct, instant) => rateCard(q, r, correct, instant)}
      />
    );
  } else if (item.t === 'check') {
    const list = item.ids.map((id) => qs.get(id)).filter(Boolean) as Question[];
    const prev = sit.items[sit.i - 1];
    const prevTopic = prev?.t === 'q' ? qs.get(prev.id)?.topic ?? null : null;
    const recent = s.log.filter((r) => r.rating).slice(-20);
    const instantRate = recent.length ? recent.filter((r) => r.instant).length / recent.length : 0;
    body = (
      <CheckCard
        key={`${sit.id}:${sit.i}`}
        questions={list}
        prevTopic={prevTopic}
        topics={[...new Set(questions.map((q) => q.topic))]}
        retention={!!item.retention}
        self={s.retention?.self}
        seed={`${sit.id}:${sit.i}`}
        ui={currentUi(sit, null)}
        onPatch={(p) => patchUi(sit.i, p, null)}
        onDone={(correct, ms) => finishCheck(questions, list.map((q) => q.id), correct, ms, instantRate, !!item.retention)}
      />
    );
  } else if (item.t === 'report') {
    const hasRetention = sit.items[sit.i + 1]?.t === 'check';
    body = (
      <ReportCard
        key={`${sit.id}:${sit.i}`}
        week={item.week}
        s={s}
        bank={questions}
        hasRetention={hasRetention}
        onDone={(self) => nextItem(hasRetention ? { retention: { week: item.week, self } } : {})}
      />
    );
  } else if (item.t === 'welcome') {
    body = <WelcomeCard daysAway={item.daysAway} onDone={() => nextItem()} />;
  } else if (item.t === 'examday') {
    body = <ExamDayCard onDone={() => nextItem()} />;
  }

  return (
    <>
      {progress}
      {body}
    </>
  );
}
