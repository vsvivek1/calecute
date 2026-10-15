import { Percent } from '@/components/Pill';
import { day } from '@/lib/format';
import { translator } from '@/lib/i18n';
import { rpc } from '@/lib/rpc';
import { lang, requireChild } from '@/lib/session';
import type { Exam } from '@/lib/types';

export const metadata = { title: 'Grades' };

// Kerala-style grade bands.
function grade(p: number) {
  return p >= 90 ? 'A+' : p >= 80 ? 'A' : p >= 70 ? 'B+' : p >= 60 ? 'B' : p >= 50 ? 'C+' : p >= 40 ? 'C' : p >= 30 ? 'D+' : 'D';
}

export default async function Grades() {
  const { child } = await requireChild();
  const t = translator(await lang());
  const exams = await rpc<Exam[]>('child_grades', { p_student: child.id });

  // Subject trend across exams, oldest first.
  const subjects = [...new Set(exams.flatMap((e) => e.subjects.map((s) => s.subject)))].sort();
  const chrono = [...exams].reverse();

  return (
    <>
      <h1>{t('Grades')}</h1>
      <p className="sub">{child.name} · published results only</p>
      {exams.length === 0 && <p className="empty card">No results published yet.</p>}

      {exams.length > 1 && (
        <div className="card">
          <h2>Trend by subject</h2>
          <div className="scroll">
            <table>
              <thead><tr><th>Subject</th>{chrono.map((e) => <th key={e.id} className="num">{e.name}</th>)}</tr></thead>
              <tbody>
                {subjects.map((s) => (
                  <tr key={s}>
                    <td>{s}</td>
                    {chrono.map((e) => {
                      const m = e.subjects.find((x) => x.subject === s);
                      return <td key={e.id} className="num">{m ? `${Math.round((100 * m.score) / m.max_score)}%` : '—'}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {exams.map((e) => (
        <div key={e.id} className="card">
          <div className="row between">
            <h2 style={{ margin: 0 }}>{e.name}</h2>
            <span className="row">
              <Percent value={e.percent} />
              <span className="pill">Grade {grade(e.percent)}</span>
            </span>
          </div>
          <p className="small muted" style={{ margin: '4px 0 10px' }}>
            {day(e.held_on, { day: 'numeric', month: 'short', year: 'numeric' })}
            {e.class_average != null && ` · class average ${e.class_average}%`}
          </p>
          <table>
            <thead><tr><th>Subject</th><th className="num">Marks</th><th className="num">%</th><th className="hide-sm">Remark</th></tr></thead>
            <tbody>
              {e.subjects.map((s) => {
                const p = Math.round((100 * s.score) / s.max_score);
                return (
                  <tr key={s.subject}>
                    <td>{s.subject}</td>
                    <td className="num">{Number(s.score)} / {Number(s.max_score)}</td>
                    <td className="num"><Percent value={p} /></td>
                    <td className="hide-sm small muted">{s.remark}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </>
  );
}
