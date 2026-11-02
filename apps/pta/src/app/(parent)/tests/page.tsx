import { translator } from '@/lib/i18n';
import { rpc } from '@/lib/rpc';
import { lang, requireChild } from '@/lib/session';
import type { Resource } from '@/lib/types';

export const metadata = { title: 'Sample tests' };

const KIND = { sample_test: 'Sample test', model_paper: 'Model paper', notes: 'Notes' } as const;

export default async function Tests() {
  const { child } = await requireChild();
  const t = translator(await lang());
  const list = await rpc<Resource[]>('child_resources', { p_student: child.id });
  const bySubject = Map.groupBy(list, (r) => r.subject);

  return (
    <>
      <h1>{t('Sample tests')}</h1>
      <p className="sub">Practice papers and notes shared by {child.class} teachers.</p>
      {list.length === 0 && <p className="empty card">Nothing shared yet.</p>}
      {[...bySubject].map(([subject, items]) => (
        <div key={subject} className="card tight">
          <h2 style={{ padding: '14px 16px 0' }}>{subject}</h2>
          <ul className="list">
            {items.map((r) => (
              <li key={r.id}>
                <span className={`pill ${r.kind === 'notes' ? '' : 'blue'}`}>{KIND[r.kind]}</span>
                <span className="grow title">{r.title}</span>
                <a className="btn btn-ghost btn-sm" href={r.url} target="_blank" rel="noopener noreferrer">Open</a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}
