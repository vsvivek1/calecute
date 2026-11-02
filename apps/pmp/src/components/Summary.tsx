import { band } from '@/lib/stats';
import { DOMAINS } from '@/lib/types';
import type { Question } from '@/lib/types';

export interface PracticeResult {
  q: Question;
  correct: boolean;
}

export function barClass(pct: number) {
  return pct >= 0.75 ? 'good' : pct >= 0.6 ? 'mid' : 'bad';
}

export default function Summary({ results, showBands = false }: { results: PracticeResult[]; showBands?: boolean }) {
  const correct = results.filter((r) => r.correct).length;
  const pct = results.length ? correct / results.length : 0;
  return (
    <div className="stack">
      <div>
        <div className="price">{Math.round(pct * 100)}%</div>
        <p className="muted">
          {correct} of {results.length} correct
        </p>
      </div>
      {DOMAINS.map((d) => {
        const rs = results.filter((r) => r.q.domain === d.id);
        if (!rs.length) return null;
        const c = rs.filter((r) => r.correct).length;
        const p = c / rs.length;
        return (
          <div key={d.id}>
            <div className="spread">
              <b>{d.label}</b>
              <span className="muted">
                {c}/{rs.length}
                {showBands && <> · <span className={`pill ${barClass(p) === 'good' ? 'good' : barClass(p) === 'bad' ? 'bad' : 'warn'}`}>{band(p)}</span></>}
              </span>
            </div>
            <div className={`bar ${barClass(p)}`} style={{ marginTop: 6 }}>
              <i style={{ width: `${p * 100}%` }} />
            </div>
          </div>
        );
      })}
      {showBands && (
        <p className="fine">
          PMI reports each domain as Above Target, Target, Below Target or Needs Improvement and does not
          publish its cut-offs. The bands here are our estimate.
        </p>
      )}
    </div>
  );
}
