import Link from 'next/link';

import ClassPicker from '@/components/ClassPicker';
import Flash from '@/components/Flash';
import { Percent } from '@/components/Pill';
import { day } from '@/lib/format';
import { rpc } from '@/lib/rpc';
import { requireTeacher } from '@/lib/session';
import { pickClass } from '@/lib/teach';
import type { ClassQuiz } from '@/lib/types';

export const metadata = { title: 'Quizzes' };

export default async function TeachQuizzes({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const me = await requireTeacher();
  const k = pickClass(me, (await searchParams).class);
  const list = await rpc<ClassQuiz[]>('class_quizzes', { p_class: k.id });
  return (
    <>
      <Flash searchParams={searchParams} />
      <ClassPicker classes={me.classes} current={k.id} base="/teach/quizzes" />
      <div className="row between">
        <h1>{k.name} quizzes</h1>
        <Link href={`/teach/quizzes/new?class=${k.id}`} className="btn btn-primary">New quiz</Link>
      </div>
      <p className="sub">Multiple choice, marked automatically. The answer key never leaves the server, so it cannot be read off a phone.</p>
      <div className="card tight">
        <table>
          <thead><tr><th>Quiz</th><th>Due</th><th className="num">Taken</th><th className="num">Average</th></tr></thead>
          <tbody>
            {list.map((q) => (
              <tr key={q.id}>
                <td><span className="pill blue">{q.subject}</span> {q.title} <span className="small muted">· {q.questions} Qs</span></td>
                <td className="small">{q.due_date ? day(q.due_date) : '—'}</td>
                <td className="num">{q.attempts}/{q.students}</td>
                <td className="num"><Percent value={q.average} /></td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={4} className="empty">No quizzes yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
