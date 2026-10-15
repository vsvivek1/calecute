import Link from 'next/link';

import Flash from '@/components/Flash';
import { Percent, StatusPill } from '@/components/Pill';
import { childToday } from '@/lib/data';
import { dayTime, relative, rupees } from '@/lib/format';
import { translator } from '@/lib/i18n';
import { lang, requireChild } from '@/lib/session';

export const metadata = { title: 'Today' };

/**
 * The daily digest. The market's most common complaint is too many
 * notifications about too many things; this page is the alternative. Anything
 * that needs the parent comes first, then today's facts, and that is all.
 */
export default async function Today({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const { child } = await requireChild();
  const t = translator(await lang());
  const d = await childToday(child.id);
  if (!d) return <p className="empty">Nothing to show for {child.name}.</p>;

  const first = child.name.split(' ')[0];
  const m = d.attendance_month;
  const monthPct = m.marked ? Math.round((100 * m.present) / (m.marked - m.leave || 1)) : null;
  const consent = d.events.filter((e) => e.needs_consent && !e.response);
  const urgent = d.notices_unread.filter((n) => n.priority === 'urgent');

  const needs: { href: string; text: string; tone: 'urgent' | 'attn' }[] = [
    ...urgent.map((n) => ({ href: '/notices', text: `Urgent: ${n.title}`, tone: 'urgent' as const })),
    ...(d.fees.overdue_paise > 0
      ? [{ href: '/fees', text: `${rupees(d.fees.overdue_paise)} in fees is overdue`, tone: 'urgent' as const }]
      : []),
    ...consent.map((e) => ({ href: '/activities', text: `Permission needed: ${e.title}`, tone: 'attn' as const })),
    ...(d.quizzes_open ? [{ href: '/quizzes', text: `${d.quizzes_open} quiz${d.quizzes_open > 1 ? 'zes' : ''} to take`, tone: 'attn' as const }] : []),
  ];

  return (
    <>
      <Flash searchParams={searchParams} />
      <h1>{first}’s day</h1>
      <p className="sub">{d.student.class} · {new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'long' })}</p>

      <section className="card">
        <h2>{t('Needs your reply')}</h2>
        {needs.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>✓ {t('Nothing needs you today')}</p>
        ) : (
          <ul className="list" style={{ margin: '0 -16px -16px' }}>
            {needs.map((n) => (
              <li key={n.text} className={n.tone}>
                <span className="grow title">{n.text}</span>
                <Link href={n.href} className="btn btn-ghost btn-sm">Open</Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid">
        <Link href="/attendance" className="card stat">
          <div className="label">{t('Attendance')} today</div>
          <div className="value"><StatusPill status={d.attendance_today} label={d.attendance_today ? t(d.attendance_today) : t('Not marked yet')} /></div>
          <div className="hint">This month: {monthPct == null ? '—' : `${monthPct}%`} ({m.absent} absent)</div>
        </Link>
        <Link href="/fees" className="card stat">
          <div className="label">{t('Fees')} {t('Due').toLowerCase()}</div>
          <div className="value">{rupees(d.fees.due_paise)}</div>
          <div className="hint">
            {!d.fees.next_due_date ? 'All paid' : d.fees.overdue_paise > 0 ? `${rupees(d.fees.overdue_paise)} overdue` : `Next due ${relative(d.fees.next_due_date)}`}
          </div>
        </Link>
        <Link href="/grades" className="card stat">
          <div className="label">Latest exam</div>
          <div className="value">{d.latest_exam ? <Percent value={d.latest_exam.percent} /> : '—'}</div>
          <div className="hint">{d.latest_exam?.name ?? 'No results published yet'}</div>
        </Link>
      </div>

      <section className="card tight">
        <div className="row between" style={{ padding: '14px 16px 4px' }}>
          <h2 style={{ margin: 0 }}>{t('Homework')} due this week</h2>
          <Link href="/homework" className="small">All homework</Link>
        </div>
        {d.homework_due.length === 0 ? (
          <p className="empty">No homework pending.</p>
        ) : (
          <ul className="list">
            {d.homework_due.map((h) => (
              <li key={h.id}>
                <span className="pill blue">{h.subject}</span>
                <span className="grow title">{h.title}</span>
                <span className="small muted">due {relative(h.due_date)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card tight">
        <div className="row between" style={{ padding: '14px 16px 4px' }}>
          <h2 style={{ margin: 0 }}>{t('Upcoming')}</h2>
          <Link href="/activities" className="small">{t('Activities')}</Link>
        </div>
        {d.events.length === 0 ? (
          <p className="empty">Nothing in the next two weeks.</p>
        ) : (
          <ul className="list">
            {d.events.map((e) => (
              <li key={e.id}>
                <span className="grow">
                  <span className="title">{e.title}</span>
                  <br />
                  <span className="small muted">{dayTime(e.starts_at)}</span>
                </span>
                {e.needs_consent && (e.response
                  ? <span className={`pill ${e.response === 'yes' ? 'green' : ''}`}>{e.response === 'yes' ? 'Attending' : 'Not attending'}</span>
                  : <span className="pill amber">Reply needed</span>)}
              </li>
            ))}
          </ul>
        )}
      </section>

      {d.complaints_open > 0 && (
        <p className="small muted">
          You have {d.complaints_open} complaint{d.complaints_open > 1 ? 's' : ''} open. <Link href="/complaints">Follow up</Link>
        </p>
      )}
    </>
  );
}
