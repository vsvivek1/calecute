import { postResource } from '@/app/actions';
import BackField from '@/components/BackField';
import ClassPicker from '@/components/ClassPicker';
import Flash from '@/components/Flash';
import { rpc } from '@/lib/rpc';
import { requireTeacher } from '@/lib/session';
import { pickClass } from '@/lib/teach';
import type { Resource } from '@/lib/types';

export const metadata = { title: 'Sample tests' };

export default async function TeachTests({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const me = await requireTeacher();
  const k = pickClass(me, (await searchParams).class);
  const list = await rpc<Resource[]>('class_resources', { p_class: k.id });
  return (
    <>
      <Flash searchParams={searchParams} />
      <ClassPicker classes={me.classes} current={k.id} base="/teach/tests" />
      <h1>{k.name} sample tests and notes</h1>
      <p className="sub">Share a link to a PDF or a Google Drive file. Parents open it from the Sample tests page.</p>
      <form action={postResource} className="card">
        <BackField />
        <input type="hidden" name="class" value={k.id} />
        <div className="fields">
          <div className="field"><label htmlFor="subject">Subject</label><input id="subject" name="subject" required /></div>
          <div className="field"><label htmlFor="kind">Type</label>
            <select id="kind" name="kind"><option value="sample_test">Sample test</option><option value="model_paper">Model paper</option><option value="notes">Notes</option></select>
          </div>
        </div>
        <div className="field" style={{ marginTop: 12 }}><label htmlFor="title">Title</label><input id="title" name="title" required /></div>
        <div className="field"><label htmlFor="url">Link</label><input id="url" type="url" name="url" required placeholder="https://" /></div>
        <button className="btn btn-primary">Share</button>
      </form>
      <div className="card tight">
        <ul className="list">
          {list.map((r) => (
            <li key={r.id}>
              <span className="pill blue">{r.subject}</span>
              <span className="grow title">{r.title}</span>
              <a href={r.url} target="_blank" rel="noopener noreferrer" className="small">Open</a>
            </li>
          ))}
          {list.length === 0 && <li className="empty">Nothing shared yet.</li>}
        </ul>
      </div>
    </>
  );
}
