'use client';

// The study plan: 100 days from joining, or today to the exam date. Today's
// tasks on top, then every day of the plan on a calendar.

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import ExamDatePicker from '@/components/plan/ExamDatePicker';
import { PLAN_DAYS, type CalendarDay } from '@/lib/engine/plan';
import { isNew, parseDay } from '@/lib/engine/scheduler';
import { ensureDay, planCalendar, planStartOf, saveProfile, targetOf, useLoop } from '@/lib/feed';
import { accuracy } from '@/lib/stats';
import { useBank, useLicense } from '@/lib/store';

const KIND_LABEL: Record<CalendarDay['kind'], string> = {
  learn: 'Learn',
  revision: 'Final revision',
  cram: 'Cram',
  examDay: 'Exam day',
};

const nice = (key: string, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }) =>
  parseDay(key).toLocaleDateString('en-US', opts);

export default function PlanPage() {
  const license = useLicense();
  const bank = useBank();
  const s = useLoop();
  const [hydrated, setHydrated] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => setHydrated(true), []);
  const questions = bank.full ? bank.questions : [];
  const now = new Date();

  const cal = useMemo(() => (questions.length ? planCalendar(s, questions, now) : []), [s, questions]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hydrated) return <main className="page" />;
  if (!license || !s.profile.onboarded) {
    return (
      <main className="page">
        <div className="narrow card stack">
          <h2>Your study plan</h2>
          <p className="muted">Start in your feed first. Your plan builds from your first day.</p>
          <Link href="/study" className="btn btn-primary">Go to my feed</Link>
        </div>
      </main>
    );
  }
  if (!questions.length) {
    return <main className="page"><div className="narrow card muted">Loading your plan…</div></main>;
  }

  const target = targetOf(s, now);
  const day = ensureDay(s, questions, now).day;
  const today = cal.find((d) => d.today);
  const total = cal.length;
  const dayN = today?.n ?? total;
  const seen = questions.filter((q) => !isNew(s.cards[q.id])).length;
  const newLeft = questions.length - seen;
  const studied = cal.filter((d) => (d.past || d.today) && d.done > 0).length;
  const elapsed = cal.filter((d) => d.past || d.today).length;
  const mocksLeft = cal.filter((d) => !d.past && d.mock).length;
  const nextMock = cal.find((d) => !d.past && !d.today && d.mock);
  const revisionFrom = cal.find((d) => d.kind === 'revision');

  // Weakest topics with enough answers to judge, for today's focus.
  const weak = Object.entries(s.topics)
    .map(([k, t]) => ({ topic: k.split(':')[1] ?? k, acc: accuracy(t, 3) }))
    .filter((t): t is { topic: string; acc: number } => t.acc != null && t.acc < 0.7)
    .sort((a, b) => a.acc - b.acc)
    .slice(0, 3);

  const left = Math.max(0, day.plan.quota - day.done);

  // Calendar laid out in weeks, Sunday first.
  const pad = parseDay(cal[0].date).getDay();
  const cells: (CalendarDay | null)[] = [...Array(pad).fill(null), ...cal];

  return (
    <main className="page">
      <div className="narrow stack">
        <div className="spread">
          <h1 style={{ fontSize: '1.6rem', margin: 0 }}>
            {target.booked ? `Plan to exam on ${nice(target.date, { month: 'short', day: 'numeric', year: 'numeric' })}` : `Your ${PLAN_DAYS}-day plan`}
          </h1>
          <Link href="/study" className="btn btn-primary btn-sm">Back to my feed</Link>
        </div>

        <div className="stats">
          <div className="stat"><b>Day {dayN}</b><span>of {total}</span></div>
          <div className="stat"><b>{seen}/{questions.length}</b><span>questions learned</span></div>
          <div className="stat"><b>{studied}/{elapsed}</b><span>days studied</span></div>
          <div className="stat"><b>{mocksLeft}</b><span>mock tests ahead</span></div>
        </div>
        <div className="bar" aria-label={`${Math.round((dayN / total) * 100)}% through the plan`}>
          <i style={{ width: `${Math.min(100, (dayN / total) * 100)}%` }} />
        </div>

        <section className="card stack">
          <div className="spread">
            <h3 style={{ margin: 0 }}>Today</h3>
            <span className={`pill ${today?.kind === 'learn' ? '' : 'warn'}`}>{KIND_LABEL[today?.kind ?? 'learn']}</span>
          </div>
          <ul className="ticks" style={{ margin: 0 }}>
            <li style={day.done >= day.plan.quota ? undefined : { opacity: 0.85 }}>
              {day.plan.quota} cards: {day.plan.newToday} new, {day.plan.reviewsToday} review
              {left ? ` (${left} left, about ${Math.ceil(left * 1.2)} min)` : ' (done ✓)'}
            </li>
            {today?.mock && <li>Timed mock test: {today.mock} questions, about {Math.round((today.mock * 230) / 180)} min</li>}
            {weak.length > 0 && <li>Weak areas getting extra cards: {weak.map((w) => w.topic).join(', ')}</li>}
          </ul>
          {day.plan.behind && <p className="notice fine">Today’s plan needs more time than you set. Add minutes in your profile to stay on track.</p>}
          <Link href="/study" className="btn btn-primary btn-block">{left ? 'Study now' : 'Open my feed'}</Link>
        </section>

        <section className="card">
          <h3>Exam date</h3>
          <p className="muted fine">
            {target.booked
              ? `${Math.max(0, cal.length - dayN)} days to go. Change it any time; the daily load adjusts.`
              : `Not booked yet, so you get a ${PLAN_DAYS}-day plan ending ${nice(target.date)}. Pick your date and the plan fits to it.`}
          </p>
          <ExamDatePicker
            examDate={s.profile.examDate}
            newLeft={newLeft}
            minutesPerDay={s.profile.minutesPerDay}
            onChange={(examDate) => {
              saveProfile({ examDate });
              setSaved(true);
              setTimeout(() => setSaved(false), 1500);
            }}
          />
          {saved && <p className="fine">Saved. Your plan has updated.</p>}
        </section>

        <section className="card">
          <div className="spread" style={{ marginBottom: 10 }}>
            <h3 style={{ margin: 0 }}>Calendar</h3>
            <span className="fine">
              {nice(planStartOf(s, now))} – {nice(target.date)}
              {revisionFrom ? ` · revision from ${nice(revisionFrom.date)}` : ''}
              {nextMock ? ` · next mock ${nice(nextMock.date)}` : ''}
            </span>
          </div>
          <div className="plan-legend fine">
            <span><i className="k-learn" /> Learn</span>
            <span><i className="k-revision" /> Revision</span>
            <span><i className="k-cram" /> Cram / exam</span>
            <span>📝 Mock</span>
            <span>✓ Studied</span>
          </div>
          <div className="plan-cal" role="list">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, k) => <b key={k} className="plan-dow">{d}</b>)}
            {cells.map((d, k) =>
              d ? (
                <div
                  key={d.date}
                  role="listitem"
                  className={`plan-day k-${d.kind === 'examDay' ? 'cram' : d.kind}${d.today ? ' today' : ''}${d.past ? ' past' : ''}${d.past && !d.done ? ' missed' : ''}`}
                  title={dayTitle(d)}
                >
                  <span className="plan-date">{parseDay(d.date).getDate() === 1 || d.n === 1 ? nice(d.date) : parseDay(d.date).getDate()}</span>
                  <span className="plan-what">
                    {d.kind === 'examDay' ? '🎯' : d.done ? `✓${d.done}` : !d.past && d.newCards ? `+${d.newCards}` : ''}
                    {d.mock ? ' 📝' : ''}
                  </span>
                </div>
              ) : (
                <div key={`pad${k}`} />
              ),
            )}
          </div>
          <p className="fine" style={{ marginTop: 10 }}>
            “+N” is new questions planned that day. Reviews come on top, chosen by your spaced repetition schedule.
          </p>
        </section>
      </div>
    </main>
  );
}

function dayTitle(d: CalendarDay) {
  const parts = [`Day ${d.n}`, KIND_LABEL[d.kind]];
  if (d.past || d.today) parts.push(`${d.done} cards done`);
  if (!d.past && d.newCards) parts.push(`${d.newCards} new planned`);
  if (d.mock) parts.push(`${d.mock}-question mock`);
  return parts.join(' · ');
}
