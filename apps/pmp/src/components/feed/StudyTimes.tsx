'use client';

const PRESETS = [
  { label: 'Morning', time: '07:00' },
  { label: 'Lunch', time: '12:30' },
  { label: 'Evening', time: '19:00' },
  { label: 'Night', time: '21:30' },
];

/** Pick study times: tap a preset, then adjust its time if needed. */
export default function StudyTimes({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const sorted = (v: string[]) => [...new Set(v)].sort();
  return (
    <div className="stack">
      <div className="chips">
        {PRESETS.map((p) => {
          const on = value.includes(p.time);
          return (
            <button key={p.time} className={`chip ${on ? 'on' : ''}`} onClick={() => onChange(sorted(on ? value.filter((t) => t !== p.time) : [...value, p.time]))}>
              {p.label}
            </button>
          );
        })}
      </div>
      {value.map((t, k) => (
        <div className="row" key={k}>
          <input
            className="text"
            style={{ maxWidth: 160 }}
            type="time"
            value={t}
            onChange={(e) => onChange(sorted(value.map((x, j) => (j === k ? e.target.value : x))))}
          />
          <button className="btn btn-ghost btn-sm" onClick={() => onChange(value.filter((_, j) => j !== k))}>Remove</button>
        </div>
      ))}
      <p className="fine" style={{ margin: 0 }}>No alerts between 10 PM and 6 AM.</p>
    </div>
  );
}
