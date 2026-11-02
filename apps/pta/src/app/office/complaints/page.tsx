import Link from 'next/link';

import Flash from '@/components/Flash';
import { ComplaintPill } from '@/components/Pill';
import { day, hoursSince } from '@/lib/format';
import { rpc } from '@/lib/rpc';
import { requireAdmin } from '@/lib/session';
import type { ComplaintListItem } from '@/lib/types';

export const metadata = { title: 'Complaints' };

export default async function OfficeComplaints({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const { school } = await requireAdmin();
  const list = await rpc<ComplaintListItem[]>('school_complaints', { p_school: school.school_id });
  return (
    <>
      <Flash searchParams={searchParams} />
      <h1>Complaints</h1>
      <p className="sub">Oldest unanswered first. A complaint closes only when the parent confirms it is sorted.</p>
      <div className="card tight">
        <ul className="list">
          {list.map((c) => {
            const waiting = !c.first_reply_at && c.status === 'open' ? hoursSince(c.created_at) : null;
            return (
              <li key={c.id} className={waiting != null && waiting >= 48 ? 'urgent' : ''}>
                <span className="grow">
                  <Link href={`/office/complaints/${c.id}`} className="title">{c.subject}</Link>
                  <br />
                  <span className="small muted">
                    {c.category} · {c.student ?? 'General'}{c.class && ` (${c.class})`} · {day(c.created_at)}
                    {waiting != null && <strong style={{ color: waiting >= 48 ? 'var(--red)' : undefined }}> · no reply for {waiting}h</strong>}
                  </span>
                </span>
                <ComplaintPill status={c.status} />
              </li>
            );
          })}
          {list.length === 0 && <li className="empty">No complaints.</li>}
        </ul>
      </div>
    </>
  );
}
