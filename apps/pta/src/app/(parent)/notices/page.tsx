import { readNotice } from '@/app/actions';
import BackField from '@/components/BackField';
import Flash from '@/components/Flash';
import { dayTime } from '@/lib/format';
import { translator } from '@/lib/i18n';
import { rpc } from '@/lib/rpc';
import { lang, requireChild } from '@/lib/session';
import type { Notice } from '@/lib/types';

export const metadata = { title: 'Notices' };

export default async function Notices({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  await requireChild();
  const t = translator(await lang());
  const list = await rpc<Notice[]>('my_notices');
  return (
    <>
      <Flash searchParams={searchParams} />
      <h1>{t('Notices')}</h1>
      <p className="sub">Only urgent notices interrupt you. Everything else waits here and on the Today page.</p>
      {list.length === 0 && <p className="empty card">No notices.</p>}
      {list.map((n) => (
        <div key={n.id} className={`card ${n.priority === 'urgent' ? 'urgent' : ''}`} style={{ opacity: n.read ? 0.75 : 1 }}>
          <div className="row between">
            <h2 style={{ margin: 0 }}>{n.title}</h2>
            <span className="row">
              {n.priority === 'urgent' && <span className="pill red">Urgent</span>}
              <span className="pill">{n.class ?? 'Whole school'}</span>
            </span>
          </div>
          <p className="small muted" style={{ margin: '4px 0 8px' }}>{dayTime(n.created_at)}</p>
          <p style={{ whiteSpace: 'pre-wrap' }}>{n.body}</p>
          {!n.read && (
            <form action={readNotice}>
              <BackField />
              <input type="hidden" name="notice" value={n.id} />
              <button className="btn btn-ghost btn-sm">Got it</button>
            </form>
          )}
        </div>
      ))}
    </>
  );
}
