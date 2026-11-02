import { respondEvent } from '@/app/actions';
import BackField from '@/components/BackField';
import Flash from '@/components/Flash';
import { dayTime, rupees } from '@/lib/format';
import { translator } from '@/lib/i18n';
import { rpc } from '@/lib/rpc';
import { lang, requireChild } from '@/lib/session';
import type { EventItem } from '@/lib/types';

export const metadata = { title: 'Activities' };

export default async function Activities({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const { child } = await requireChild();
  const t = translator(await lang());
  const events = await rpc<EventItem[]>('child_events', { p_student: child.id });
  const now = new Date().toISOString();
  const upcoming = events.filter((e) => e.starts_at >= now);
  const past = events.filter((e) => e.starts_at < now).reverse();

  return (
    <>
      <Flash searchParams={searchParams} />
      <h1>{t('Activities')}</h1>
      <p className="sub">Events, trips and meetings for {child.name}. Permission slips are answered here; no paper form needed.</p>
      {upcoming.length === 0 && <p className="empty card">Nothing planned yet.</p>}
      {upcoming.map((e) => (
        <div key={e.id} className={`card ${e.needs_consent && !e.response ? 'attn' : ''}`}>
          <div className="row between">
            <h2 style={{ margin: 0 }}>{e.title}</h2>
            <span className="pill">{e.whole_school ? 'Whole school' : child.class}</span>
          </div>
          <p className="small muted" style={{ margin: '4px 0 8px' }}>
            {dayTime(e.starts_at)}{e.location && ` · ${e.location}`}{Number(e.fee_paise) > 0 && ` · ${rupees(e.fee_paise)}`}
          </p>
          {e.details && <p>{e.details}</p>}
          {e.needs_consent && (
            <form action={respondEvent} className="row">
              <BackField />
              <input type="hidden" name="event" value={e.id} />
              <input type="hidden" name="student" value={child.id} />
              <span className="small" style={{ fontWeight: 650 }}>
                {e.response ? `You said ${e.response === 'yes' ? 'yes' : 'no'}.` : `May ${child.name.split(' ')[0]} attend?`}
              </span>
              <button name="response" value="yes" className={`btn btn-sm ${e.response === 'yes' ? 'btn-green' : 'btn-ghost'}`}>{t('Yes')}</button>
              <button name="response" value="no" className={`btn btn-sm ${e.response === 'no' ? 'btn-red' : 'btn-ghost'}`}>{t('No')}</button>
            </form>
          )}
        </div>
      ))}
      {past.length > 0 && (
        <>
          <h2 style={{ marginTop: 20 }}>Recent</h2>
          <div className="card tight">
            <ul className="list">
              {past.map((e) => (
                <li key={e.id}><span className="grow title">{e.title}</span><span className="small muted">{dayTime(e.starts_at)}</span></li>
              ))}
            </ul>
          </div>
        </>
      )}
    </>
  );
}
