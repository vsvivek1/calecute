import Link from 'next/link';

import { requestLeave } from '@/app/actions';
import BackField from '@/components/BackField';
import Flash from '@/components/Flash';
import { day, todayIST } from '@/lib/format';
import { translator } from '@/lib/i18n';
import { rpc } from '@/lib/rpc';
import { lang, requireChild } from '@/lib/session';
import type { AttendanceMonth } from '@/lib/types';

export const metadata = { title: 'Attendance' };

function shift(month: string, by: number) {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return d.toISOString().slice(0, 7);
}

export default async function Attendance({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const { child } = await requireChild();
  const t = translator(await lang());
  const sp = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(sp.m ?? '') ? sp.m! : todayIST().slice(0, 7);
  const a = await rpc<AttendanceMonth>('child_attendance', { p_student: child.id, p_month: `${month}-01` });

  const byDay = new Map(a.days.map((d) => [d.day, d]));
  const [y, m] = month.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lead = (first.getUTCDay() + 6) % 7; // Monday first
  const today = todayIST();
  const count = (s: string) => a.days.filter((d) => d.status === s).length;
  const yearPct = a.year.marked ? Math.round((100 * a.year.present) / a.year.marked) : null;

  return (
    <>
      <Flash searchParams={searchParams} />
      <h1>{t('Attendance')}</h1>
      <p className="sub">{child.name} · last 12 months: {yearPct == null ? '—' : `${yearPct}%`}</p>

      <div className="card">
        <div className="row between" style={{ marginBottom: 12 }}>
          <Link href={`?m=${shift(month, -1)}`} className="btn btn-ghost btn-sm">←</Link>
          <h2 style={{ margin: 0 }}>{first.toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</h2>
          <Link href={`?m=${shift(month, 1)}`} className="btn btn-ghost btn-sm">→</Link>
        </div>
        <div className="cal">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((h, i) => <div key={i} className="h">{h}</div>)}
          {Array.from({ length: lead }, (_, i) => <div key={`x${i}`} />)}
          {Array.from({ length: days }, (_, i) => {
            const iso = `${month}-${String(i + 1).padStart(2, '0')}`;
            const rec = byDay.get(iso);
            return (
              <div key={iso} className={`d ${rec?.status ?? ''} ${iso === today ? 'today' : ''}`}
                title={rec ? `${rec.status}${rec.note ? `: ${rec.note}` : ''}` : 'Not marked'}>
                {i + 1}
              </div>
            );
          })}
        </div>
        <div className="row small" style={{ marginTop: 12 }}>
          <span className="pill green">{t('present')} {count('present')}</span>
          <span className="pill red">{t('absent')} {count('absent')}</span>
          <span className="pill amber">{t('late')} {count('late')}</span>
          <span className="pill blue">{t('leave')} {count('leave')}</span>
        </div>
      </div>

      <div className="card">
        <h2>{t('Request leave')}</h2>
        <p className="small muted">Tell the class teacher before the day. Once approved, the days show as leave, not absent.</p>
        <form action={requestLeave}>
          <BackField />
          <input type="hidden" name="student" value={child.id} />
          <div className="fields">
            <div className="field"><label htmlFor="from">From</label><input id="from" type="date" name="from" min={today} required /></div>
            <div className="field"><label htmlFor="to">To</label><input id="to" type="date" name="to" min={today} /></div>
          </div>
          <div className="field" style={{ marginTop: 12 }}>
            <label htmlFor="reason">Reason</label>
            <input id="reason" name="reason" required maxLength={300} placeholder="e.g. Family function in Thrissur" />
          </div>
          <button className="btn btn-primary">Send to teacher</button>
        </form>

        {a.leave_requests.length > 0 && (
          <ul className="list" style={{ margin: '14px -16px -16px', borderTop: '1px solid var(--line)' }}>
            {a.leave_requests.map((l) => (
              <li key={l.id}>
                <span className="grow">
                  <span className="title">{day(l.from_day)}{l.to_day !== l.from_day && ` – ${day(l.to_day)}`}</span>
                  <span className="muted"> · {l.reason}</span>
                </span>
                <span className={`pill ${l.status === 'approved' ? 'green' : l.status === 'declined' ? 'red' : 'amber'}`}>{l.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
