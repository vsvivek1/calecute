import { homeworkDone } from '@/app/actions';
import BackField from '@/components/BackField';
import Flash from '@/components/Flash';
import MarkSeen from '@/components/MarkSeen';
import { day, relative, todayIST } from '@/lib/format';
import { translator } from '@/lib/i18n';
import { rpc } from '@/lib/rpc';
import { lang, requireChild } from '@/lib/session';
import type { Homework } from '@/lib/types';

export const metadata = { title: 'Homework' };

export default async function HomeworkPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const { child } = await requireChild();
  const t = translator(await lang());
  const list = await rpc<Homework[]>('child_homework', { p_student: child.id });
  const today = todayIST();
  const upcoming = list.filter((h) => h.due_date >= today).reverse();
  const past = list.filter((h) => h.due_date < today);

  const item = (h: Homework) => (
    <li key={h.id} style={{ alignItems: 'flex-start' }}>
      <span className="pill blue">{h.subject}</span>
      <span className="grow">
        <span className="title" style={{ textDecoration: h.done ? 'line-through' : undefined }}>{h.title}</span>
        {h.details && <><br /><span className="small">{h.details}</span></>}
        {h.link && <><br /><a className="small" href={h.link} target="_blank" rel="noopener noreferrer">Open attachment</a></>}
        <br />
        <span className="small muted">Due {day(h.due_date)} ({relative(h.due_date)})</span>
      </span>
      <form action={homeworkDone}>
        <BackField />
        <input type="hidden" name="homework" value={h.id} />
        <input type="hidden" name="student" value={child.id} />
        <input type="hidden" name="done" value={h.done ? '0' : '1'} />
        <button className={`btn btn-sm ${h.done ? 'btn-ghost' : 'btn-green'}`}>{h.done ? `✓ ${t('Done')}` : t('Mark done')}</button>
      </form>
    </li>
  );

  return (
    <>
      <MarkSeen student={child.id} />
      <Flash searchParams={searchParams} />
      <h1>{t('Homework')}</h1>
      <p className="sub">{child.name} · {child.class}. The teacher can see which families have opened it and which children are done.</p>
      <h2>Due</h2>
      <div className="card tight"><ul className="list">{upcoming.length ? upcoming.map(item) : <li className="empty">Nothing due.</li>}</ul></div>
      {past.length > 0 && (
        <>
          <h2 style={{ marginTop: 20 }}>Last 30 days</h2>
          <div className="card tight"><ul className="list">{past.map(item)}</ul></div>
        </>
      )}
    </>
  );
}
