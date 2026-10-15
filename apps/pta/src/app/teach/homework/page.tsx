import { postHomework } from '@/app/actions';
import BackField from '@/components/BackField';
import ClassPicker from '@/components/ClassPicker';
import Flash from '@/components/Flash';
import { day, relative, todayIST } from '@/lib/format';
import { rpc } from '@/lib/rpc';
import { requireTeacher } from '@/lib/session';
import { pickClass } from '@/lib/teach';
import type { ClassHomework } from '@/lib/types';

export const metadata = { title: 'Homework' };

export default async function TeachHomework({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const me = await requireTeacher();
  const k = pickClass(me, (await searchParams).class);
  const list = await rpc<ClassHomework[]>('class_homework', { p_class: k.id });
  const tomorrow = new Date(Date.now() + 86400000).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

  return (
    <>
      <Flash searchParams={searchParams} />
      <ClassPicker classes={me.classes} current={k.id} base="/teach/homework" />
      <h1>{k.name} homework</h1>
      <p className="sub">Parents see it on their Today page. You see who has opened it and who has finished.</p>

      <details className="card" open={list.length === 0}>
        <summary>Post homework</summary>
        <form action={postHomework}>
          <BackField />
          <input type="hidden" name="class" value={k.id} />
          <div className="fields">
            <div className="field"><label htmlFor="subject">Subject</label><input id="subject" name="subject" required list="subjects" /></div>
            <div className="field"><label htmlFor="due">Due</label><input id="due" type="date" name="due" required min={todayIST()} defaultValue={tomorrow} /></div>
          </div>
          <datalist id="subjects">{['Maths', 'English', 'Science', 'Malayalam', 'Hindi', 'Social', 'EVS'].map((s) => <option key={s} value={s} />)}</datalist>
          <div className="field" style={{ marginTop: 12 }}><label htmlFor="title">Title</label><input id="title" name="title" required maxLength={120} /></div>
          <div className="field"><label htmlFor="details">Details</label><textarea id="details" name="details" maxLength={2000} /></div>
          <div className="field"><label htmlFor="link">Link to a worksheet (optional)</label><input id="link" type="url" name="link" placeholder="https://" /></div>
          <button className="btn btn-primary">Post</button>
        </form>
      </details>

      <div className="card tight">
        <table>
          <thead><tr><th>Homework</th><th>Due</th><th className="num">Seen</th><th className="num">Done</th></tr></thead>
          <tbody>
            {list.map((h) => (
              <tr key={h.id}>
                <td><span className="pill blue">{h.subject}</span> {h.title}</td>
                <td className="small">{day(h.due_date)}<br /><span className="muted">{relative(h.due_date)}</span></td>
                <td className="num">{h.seen}/{h.students}</td>
                <td className="num">
                  {h.done}/{h.students}
                  <div className="bar green" style={{ marginTop: 4 }}><span style={{ width: `${h.students ? (100 * h.done) / h.students : 0}%` }} /></div>
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={4} className="empty">Nothing posted in the last 30 days.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
