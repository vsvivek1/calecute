'use client';

import { RATINGS, type Rating } from '@/lib/engine/scheduler';

/** The four ratings, always the same buttons in the same place. */
export default function RatingBar({
  progress,
  allowed,
  onRate,
}: {
  progress: number;
  allowed: Rating[];
  onRate: (r: Rating) => void;
}) {
  const locked = progress < 1;
  return (
    <div>
      <div className="unlock" aria-hidden>
        <i style={{ width: `${progress * 100}%` }} />
      </div>
      <div className="ratings">
        {RATINGS.map((r) => (
          <button
            key={r.id}
            className={`rate rate-${r.id}`}
            disabled={locked || !allowed.includes(r.id)}
            onClick={() => onRate(r.id)}
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
}
