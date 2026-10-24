'use client';

import { useEffect, useState } from 'react';
import type { Flash } from '@/lib/types';

const NOON_IST_UTC_MIN = 6 * 60 + 30; // 12:00 IST = 06:30 UTC

function istDay(d = new Date()) {
  return new Date(d.getTime() + 330 * 60_000).toISOString().slice(0, 10);
}
function utcMinutes(d = new Date()) {
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}
function store(key: string, value?: string): string | null {
  try {
    if (value !== undefined) localStorage.setItem(key, value);
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Noon flash: one or two facts per enrolled paper from 12:00 IST, shown
 * between sittings (never over a card). The notification lives in Alerts.
 */
export default function FlashBanner({ flash, preview = false }: { flash: Flash[]; preview?: boolean }) {
  const [afterNoon, setAfterNoon] = useState(preview);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (preview) return;
    setHidden(store('em-flash-hidden') === istDay());
    const tick = () => setAfterNoon(utcMinutes() >= NOON_IST_UTC_MIN);
    tick();
    const t = setInterval(tick, 60_000);
    return () => clearInterval(t);
  }, [flash, preview]);

  if (!flash.length || hidden || !afterNoon) return null;

  return (
    <section className="flash card">
      <p className="label">
        ⚡ {preview ? "Today's flash facts" : 'Noon flash'}
        {!preview && (
          <button
            className="link close"
            aria-label="Hide until tomorrow"
            onClick={() => {
              store('em-flash-hidden', istDay());
              setHidden(true);
            }}
          >
            ✕
          </button>
        )}
      </p>
      <ul>
        {flash.map((f) => (
          <li key={f.id}>
            <span className="ptag">P{f.paper}</span> <b>{f.question}</b> {f.answer}
          </li>
        ))}
      </ul>
    </section>
  );
}
