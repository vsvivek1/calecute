import Link from 'next/link';

import { decideLeave, saveRegister } from '@/app/actions';
import BackField from '@/components/BackField';
import ClassPicker from '@/components/ClassPicker';
import Flash from '@/components/Flash';
import { day, todayIST } from '@/lib/format';
import { rpc } from '@/lib/rpc';
import { requireTeacher } from '@/lib/session';
import { pickClass } from '@/lib/teach';
import type { Register } from '@/lib/types';

export const metadata = { title: 'Register' };

const OPTS = [
  ['present', 'P', 'p'], ['absent', 'A', 'a'], ['late', 'L', 'l'], ['leave', 'Leave', 'v'],
] as const;

/**
 * Taking the roll. Everyone starts as present, so a normal day is one tap on
 * Save; the teacher only touches the children who are not there. Children on
 * approved leave start as leave.
 */
export default async function RegisterPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const me = await requireTeacher();
  const sp = await searchParams;
  const k = pickClass(me, sp.class);
  const today = todayIST();
  const dayWanted = /^\d{4}-\d{2}-\d{2}$/.test(sp.day ?? '') && sp.day! <= today ? sp.day! : today;
  const r = await rpc<Register>('class_register', { p_class: k.id, p_day: dayWanted });
  const marked = r.students.some((s) => s.status);

  return (
    <>
      <Flash searchParams={searchParams} />
      <ClassPicker classes={me.classes} current={k.id} base="/teach" />
      <div className="row between">
        <h1>{r.class} register</h1>
        <form className="row">
          <input type="hidden" name="class" value={k.id} />
          <input type="date" name="day" defaultValue={dayWanted} max={today} style={{ width: 'auto' }} />
          <button className="btn btn-ghost btn-sm">Go</button>
        </form>
      </div>
      <p className="sub">
        {day(dayWanted, { weekday: 'long', day: 'numeric', month: 'long' })} ·{' '}
        {marked ? 'Already marked. Changes overwrite it.' : 'Not marked yet. Everyone starts as present.'}
      </p>

      {r.leave_pending.length > 0 && (
        <div className="card attn">
          <h2>Leave requests</h2>
          <ul className="list" style={{ margin: '0 -16px -16px' }}>
            {r.leave_pending.map((l) => (
              <li key={l.id}>
                <span className="grow">
                  <span className="title">{l.student}</span>
                  <span className="muted"> · {day(l.from_day)}{l.to_day !== l.from_day && `–${day(l.to_day)}`} · {l.reason}</span>
                </span>
                <form action={decideLeave} className="row">
                  <BackField />
                  <input type="hidden" name="id" value={l.id} />
                  <button name="approve" value="1" className="btn btn-green btn-sm">Approve</button>
                  <button name="approve" value="0" className="btn btn-red btn-sm">Decline</button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form action={saveRegister} className="card tight">
        <BackField />
        <input type="hidden" name="class" value={k.id} />
        <input type="hidden" name="day" value={dayWanted} />
        <ul className="list">
          {r.students.map((s) => {
            const initial = s.status ?? (s.on_leave ? 'leave' : 'present');
            return (
              <li key={s.id}>
                <input type="hidden" name="student" value={s.id} />
                <span className="muted small" style={{ width: 24 }}>{s.roll_no}</span>
                <span className="grow title">{s.name}</span>
                <span className="seg" role="radiogroup" aria-label={s.name}>
                  {OPTS.map(([v, l, c]) => (
                    <span key={v} style={{ display: 'contents' }}>
                      <input type="radio" id={`${s.id}_${v}`} name={`status_${s.id}`} value={v} defaultChecked={initial === v} />
                      <label htmlFor={`${s.id}_${v}`} className={c}>{l}</label>
                    </span>
                  ))}
                </span>
              </li>
            );
          })}
          {r.students.length === 0 && <li className="empty">No students in this class yet.</li>}
        </ul>
        {r.students.length > 0 && (
          <div style={{ padding: 16 }}>
            <button className="btn btn-primary">Save register</button>
            <span className="small muted" style={{ marginLeft: 10 }}>Parents of absent children see it on their Today page.</span>
          </div>
        )}
      </form>
      <p className="small muted"><Link href="/teach/homework">Post homework →</Link></p>
    </>
  );
}
