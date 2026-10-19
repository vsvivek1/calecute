import Link from 'next/link';

import Flash from '@/components/Flash';
import Icon from '@/components/Icon';
import { officeToday } from '@/lib/data';
import { rupees } from '@/lib/format';
import { requireAdmin } from '@/lib/session';

export const metadata = { title: 'Dashboard' };

export default async function Office({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const { school } = await requireAdmin();
  const d = await officeToday(school.school_id);
  if (!d) return null;
  const a = d.attendance;
  const collected = d.fees.billed_paise ? Math.round((100 * d.fees.collected_paise) / d.fees.billed_paise) : 0;

  return (
    <>
      <Flash searchParams={searchParams} />
      <section className="hero">
        <div className="eyebrow">{new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'long' })}</div>
        <h1>{d.school}</h1>
        <p className="sub">{d.students} students</p>
        <div className="chips">
          <Link href="/office/students" className="chip"><Icon name="users" size={15} />Students &amp; staff</Link>
          <Link href="/office/notices" className="chip"><Icon name="megaphone" size={15} />Post a notice</Link>
        </div>
      </section>

      <div className="grid">
        <div className="card stat">
          <div className="label"><span className="icon-chip green"><Icon name="calendar" /></span>Attendance today</div>
          <div className="value">{a.marked ? `${Math.round((100 * a.present) / a.marked)}%` : '—'}</div>
          <div className="hint">{a.present} present · {a.absent} absent · {a.leave} on leave</div>
        </div>
        <Link href="/office/fees" className="card stat">
          <div className="label"><span className="icon-chip"><Icon name="wallet" /></span>Fees collected</div>
          <div className="value">{collected}%</div>
          <div className="bar green"><span style={{ width: `${collected}%` }} /></div>
          <div className="hint" style={{ marginTop: 6 }}>{rupees(d.fees.collected_paise)} of {rupees(d.fees.billed_paise)}</div>
        </Link>
        <Link href="/office/fees?overdue=1" className="card stat">
          <div className="label"><span className="icon-chip red"><Icon name="alert" /></span>Overdue</div>
          <div className="value" style={{ color: d.fees.overdue_paise ? 'var(--red)' : undefined }}>{rupees(d.fees.overdue_paise)}</div>
          <div className="hint">{d.fees.overdue_families} students</div>
        </Link>
        <Link href="/office/complaints" className="card stat">
          <div className="label"><span className="icon-chip violet"><Icon name="chat" /></span>Complaints</div>
          <div className="value">{d.complaints.open + d.complaints.in_progress}</div>
          <div className="hint">
            {d.complaints.unanswered_48h > 0
              ? <span style={{ color: 'var(--red)', fontWeight: 650 }}>{d.complaints.unanswered_48h} unanswered for 48h+</span>
              : 'None waiting over 48h'}
            {d.complaints.median_first_reply_hours != null && ` · median first reply ${d.complaints.median_first_reply_hours}h`}
          </div>
        </Link>
      </div>

      {d.classes_unmarked.length > 0 && (
        <div className="card attn">
          <h2>Register not taken yet today</h2>
          <p style={{ margin: 0 }}>{d.classes_unmarked.join(', ')}</p>
        </div>
      )}
    </>
  );
}
