import { notFound } from 'next/navigation';

import { saveMarks } from '@/app/actions';
import BackField from '@/components/BackField';
import Flash from '@/components/Flash';
import { rpc } from '@/lib/rpc';
import type { ExamSheet } from '@/lib/types';

export const metadata = { title: 'Enter marks' };

const DEFAULT_SUBJECTS = ['Maths', 'English', 'Science', 'Malayalam', 'Social'];

export default async function Sheet({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const sp = await searchParams;
  const x = await rpc<ExamSheet | null>('exam_sheet', { p_exam: id });
  if (!x) notFound();

  const entered = [...new Set(x.students.flatMap((s) => Object.keys(s.marks)))];
  const subjects = sp.subjects
    ? sp.subjects.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 10)
    : entered.length ? entered.sort() : DEFAULT_SUBJECTS;
  const max = Number(sp.max) || Object.values(x.students[0]?.marks ?? {})[0]?.max_score || 50;

  return (
    <>
      <Flash searchParams={searchParams} />
      <h1>{x.name} · {x.class}</h1>
      <p className="sub">{x.published ? 'Published: parents can see these marks.' : 'Draft: parents cannot see these yet.'} Leave a box blank to skip it.</p>

      <form className="card row">
        <div className="field" style={{ flex: 3, margin: 0 }}><label htmlFor="subjects">Subjects (comma separated)</label><input id="subjects" name="subjects" defaultValue={subjects.join(', ')} /></div>
        <div className="field" style={{ flex: 1, margin: 0 }}><label htmlFor="max">Out of</label><input id="max" type="number" name="max" min={1} defaultValue={max} /></div>
        <button className="btn btn-ghost" style={{ alignSelf: 'flex-end' }}>Update columns</button>
      </form>

      <form action={saveMarks} className="card tight">
        <BackField />
        <input type="hidden" name="exam" value={x.id} />
        <input type="hidden" name="subjects" value={subjects.join(',')} />
        <input type="hidden" name="max" value={max} />
        <div className="scroll">
          <table>
            <thead><tr><th>#</th><th>Student</th>{subjects.map((s) => <th key={s} className="num">{s}</th>)}</tr></thead>
            <tbody>
              {x.students.map((st) => (
                <tr key={st.id}>
                  <td className="muted">{st.roll_no}</td>
                  <td>{st.name}<input type="hidden" name="student" value={st.id} /></td>
                  {subjects.map((s) => (
                    <td key={s} className="num">
                      <input type="number" name={`m_${st.id}_${s}`} min={0} max={max} step="0.5"
                        defaultValue={st.marks[s]?.score ?? ''} style={{ width: 70, textAlign: 'right' }} aria-label={`${st.name} ${s}`} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="row" style={{ padding: 16 }}>
          <button className="btn btn-ghost" name="publish" value="0">Save draft</button>
          <button className="btn btn-primary" name="publish" value="1">Save and publish to parents</button>
        </div>
      </form>
    </>
  );
}
