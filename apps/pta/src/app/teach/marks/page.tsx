import Link from 'next/link';

import { createExam } from '@/app/actions';
import ClassPicker from '@/components/ClassPicker';
import Flash from '@/components/Flash';
import { Percent } from '@/components/Pill';
import { day, todayIST } from '@/lib/format';
import { rpc } from '@/lib/rpc';
import { requireTeacher } from '@/lib/session';
import { pickClass } from '@/lib/teach';
import type { ClassExam } from '@/lib/types';

export const metadata = { title: 'Marks' };

export default async function Marks({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const me = await requireTeacher();
  const k = pickClass(me, (await searchParams).class);
  const exams = await rpc<ClassExam[]>('class_exams', { p_class: k.id });
  return (
    <>
      <Flash searchParams={searchParams} />
      <ClassPicker classes={me.classes} current={k.id} base="/teach/marks" />
      <h1>{k.name} marks</h1>
      <p className="sub">Enter marks at your pace. Parents see an exam only once you publish it.</p>
      <form action={createExam} className="card row">
        <input type="hidden" name="class" value={k.id} />
        <div className="field" style={{ flex: 2, margin: 0 }}><label htmlFor="name">New exam</label><input id="name" name="name" required placeholder="e.g. Unit test 2" /></div>
        <div className="field" style={{ flex: 1, margin: 0 }}><label htmlFor="held_on">Held on</label><input id="held_on" type="date" name="held_on" required defaultValue={todayIST()} /></div>
        <button className="btn btn-primary" style={{ alignSelf: 'flex-end' }}>Create</button>
      </form>
      <div className="card tight">
        <ul className="list">
          {exams.map((e) => (
            <li key={e.id}>
              <span className="grow">
                <Link href={`/teach/marks/${e.id}`} className="title">{e.name}</Link>
                <br />
                <span className="small muted">{day(e.held_on, { day: 'numeric', month: 'short', year: 'numeric' })} · {e.entered}/{k.students} entered</span>
              </span>
              <Percent value={e.average} />
              <span className={`pill ${e.published ? 'green' : 'amber'}`}>{e.published ? 'Published' : 'Draft'}</span>
            </li>
          ))}
          {exams.length === 0 && <li className="empty">No exams yet.</li>}
        </ul>
      </div>
    </>
  );
}
