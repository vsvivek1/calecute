import Link from 'next/link';

import Flash from '@/components/Flash';
import { ComplaintPill } from '@/components/Pill';
import { day } from '@/lib/format';
import { translator } from '@/lib/i18n';
import { rpc } from '@/lib/rpc';
import { lang, requireChild } from '@/lib/session';
import type { ComplaintListItem } from '@/lib/types';

export const metadata = { title: 'Complaints' };

export default async function Complaints({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  await requireChild();
  const t = translator(await lang());
  const list = (await rpc<ComplaintListItem[]>('my_complaints'));
  return (
    <>
      <Flash searchParams={searchParams} />
      <div className="row between">
        <h1>{t('Complaints')}</h1>
        <Link href="/complaints/new" className="btn btn-primary">{t('Raise a complaint')}</Link>
      </div>
      <p className="sub">
        Each complaint is a ticket with a named owner at school. It stays open until <em>you</em> confirm
        it is sorted; if you are not satisfied, reopen it.
      </p>
      <div className="card tight">
        <ul className="list">
          {list.map((c) => (
            <li key={c.id}>
              <span className="grow">
                <Link href={`/complaints/${c.id}`} className="title">{c.subject}</Link>
                <br />
                <span className="small muted">
                  {c.category} · {c.student} · raised {day(c.created_at)}
                  {c.first_reply_at ? ` · school replied ${day(c.first_reply_at)}` : ' · awaiting first reply'}
                </span>
              </span>
              <ComplaintPill status={c.status} />
            </li>
          ))}
          {list.length === 0 && <li className="empty">No complaints raised.</li>}
        </ul>
      </div>
    </>
  );
}
