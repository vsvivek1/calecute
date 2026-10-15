import { addClass, addGuardian, addStaff, addStudent } from '@/app/actions';
import BackField from '@/components/BackField';
import Flash from '@/components/Flash';
import { rpc } from '@/lib/rpc';
import { requireAdmin } from '@/lib/session';
import type { SchoolStudents } from '@/lib/types';

export const metadata = { title: 'Students & staff' };

/**
 * Onboarding is by email. Add a child with a parent's email address and that
 * parent sees the child the first time they sign in; there are no codes to
 * hand out and nothing for the parent to type.
 */
export default async function Students({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const { school } = await requireAdmin();
  const d = await rpc<SchoolStudents>('school_students', { p_school: school.school_id });
  const byClass = Map.groupBy(d.students, (s) => s.class ?? 'No class');

  return (
    <>
      <Flash searchParams={searchParams} />
      <h1>Students & staff</h1>
      <p className="sub">Parents and teachers sign in with the email address you enter here.</p>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        <details className="card" open={d.students.length === 0}>
          <summary>Add a student</summary>
          <form action={addStudent}>
            <BackField />
            <input type="hidden" name="school" value={school.school_id} />
            <div className="field"><label htmlFor="sname">Name</label><input id="sname" name="name" required /></div>
            <div className="fields">
              <div className="field"><label htmlFor="sclass">Class</label>
                <select id="sclass" name="class">{d.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              </div>
              <div className="field"><label htmlFor="roll">Roll no.</label><input id="roll" type="number" name="roll" min={1} /></div>
            </div>
            <div className="field" style={{ marginTop: 12 }}><label htmlFor="email">Parent’s email</label><input id="email" type="email" name="email" required /></div>
            <div className="fields">
              <div className="field"><label htmlFor="guardian">Parent’s name</label><input id="guardian" name="guardian" /></div>
              <div className="field"><label htmlFor="relation">Relation</label>
                <select id="relation" name="relation"><option>mother</option><option>father</option><option>guardian</option></select>
              </div>
            </div>
            <button className="btn btn-primary" style={{ marginTop: 12 }}>Add student</button>
          </form>
        </details>
        <details className="card">
          <summary>Add a class</summary>
          <form action={addClass}>
            <BackField />
            <input type="hidden" name="school" value={school.school_id} />
            <div className="field"><label htmlFor="cname">Name</label><input id="cname" name="name" required placeholder="Grade 6 A" /></div>
            <div className="field"><label htmlFor="teacher">Class teacher’s email</label><input id="teacher" type="email" name="teacher" /></div>
            <button className="btn btn-primary">Add class</button>
          </form>
        </details>
        <details className="card">
          <summary>Add a teacher or office staff</summary>
          <form action={addStaff}>
            <BackField />
            <input type="hidden" name="school" value={school.school_id} />
            <div className="field"><label htmlFor="stname">Name</label><input id="stname" name="name" required /></div>
            <div className="field"><label htmlFor="stemail">Email</label><input id="stemail" type="email" name="email" required /></div>
            <div className="field"><label htmlFor="role">Role</label>
              <select id="role" name="role"><option value="teacher">Teacher</option><option value="admin">Office admin (full access)</option></select>
            </div>
            <button className="btn btn-primary">Add</button>
          </form>
        </details>
      </div>

      {[...byClass].map(([name, list]) => {
        const teacher = d.classes.find((c) => c.name === name)?.teacher_email;
        return (
          <div key={name} className="card tight">
            <div className="row between" style={{ padding: '14px 16px 0' }}>
              <h2 style={{ margin: 0 }}>{name}</h2>
              <span className="small muted">{teacher ? `Class teacher: ${teacher}` : 'No class teacher'} · {list.length} students</span>
            </div>
            <ul className="list">
              {list.map((s) => (
                <li key={s.id} style={{ alignItems: 'flex-start' }}>
                  <span className="muted small" style={{ width: 24 }}>{s.roll_no}</span>
                  <span className="grow">
                    <span className="title">{s.name}</span>
                    <br />
                    <span className="small muted">
                      {s.guardians.length
                        ? s.guardians.map((g) => `${g.name ?? g.email} (${g.relation ?? 'guardian'}) ${g.email}`).join(' · ')
                        : 'No parent linked: nobody can see this child yet'}
                    </span>
                  </span>
                  <details>
                    <summary className="small">+ parent</summary>
                    <form action={addGuardian} style={{ minWidth: 220 }}>
                      <BackField />
                      <input type="hidden" name="student" value={s.id} />
                      <input type="email" name="email" placeholder="Email" required aria-label="Email" style={{ marginBottom: 6 }} />
                      <input name="name" placeholder="Name" aria-label="Name" style={{ marginBottom: 6 }} />
                      <select name="relation" aria-label="Relation" style={{ marginBottom: 6 }}><option>mother</option><option>father</option><option>guardian</option></select>
                      <button className="btn btn-primary btn-sm">Add</button>
                    </form>
                  </details>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </>
  );
}
