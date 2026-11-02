import { raiseComplaint } from '@/app/actions';
import Flash from '@/components/Flash';
import { CATEGORIES } from '@/lib/constants';
import { translator } from '@/lib/i18n';
import { lang, requireChild } from '@/lib/session';

export const metadata = { title: 'Raise a complaint' };


export default async function NewComplaint({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const { me, child } = await requireChild();
  const t = translator(await lang());
  return (
    <>
      <Flash searchParams={searchParams} />
      <h1>{t('Raise a complaint')}</h1>
      <p className="sub">Goes straight to the school office, not to a group chat. Only you and school staff can read it.</p>
      <form action={raiseComplaint} className="card">
        <div className="fields">
          <div className="field">
            <label htmlFor="student">About</label>
            <select id="student" name="student" defaultValue={child.id}>
              {me.children.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.class})</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="category">Category</label>
            <select id="category" name="category" required>
              {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>
        <div className="field" style={{ marginTop: 12 }}>
          <label htmlFor="subject">Subject</label>
          <input id="subject" name="subject" required maxLength={120} placeholder="One line: what is wrong" />
        </div>
        <div className="field">
          <label htmlFor="body">Details</label>
          <textarea id="body" name="body" required maxLength={4000} placeholder="What happened, when, and what you would like the school to do." />
        </div>
        <button className="btn btn-primary">Send to school</button>
      </form>
    </>
  );
}
