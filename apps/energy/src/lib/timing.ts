'use client';

import { useEffect, useState } from 'react';

/** Minimum seconds on a screen before its buttons unlock (Recallio learning engine §2). */
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
export const words = (...parts: (string | null | undefined)[]) =>
  parts.join(' ').split(/\s+/).filter(Boolean).length;

export const minTime = {
  learn: (w: number) => clamp(w / 2 + 2, 5, 25),
  think: 4,
  recall: (w: number) => clamp(w / 2.5, 3, 15),
  step: (w: number) => clamp(w / 2 + 6, 8, 40),
  explain: (w: number) => clamp(w / 2, 3, 20),
  paper: 45,
};

export function store(key: string, value?: string | null): string | null {
  try {
    if (value === null) localStorage.removeItem(key);
    else if (value !== undefined) localStorage.setItem(key, value);
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Drop saved timers of finished sittings. */
export function clearTimers(prefix: string) {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k?.startsWith(prefix)) localStorage.removeItem(k);
    }
  } catch {
    /* storage blocked */
  }
}

/**
 * Seconds this card has been on screen with the tab visible. Saved per card,
 * so a reload neither resets the clock nor lets time pass unseen.
 */
export function useVisibleSeconds(key: string): number {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    let s = Number(store(key)) || 0;
    setSecs(s);
    let last = performance.now();
    let saved = s;
    const t = setInterval(() => {
      const now = performance.now();
      if (document.visibilityState === 'visible') {
        // Cap a single tick so a sleeping laptop does not count as study.
        s += Math.min(1, (now - last) / 1000);
        setSecs(s);
        if (s - saved >= 1) {
          store(key, s.toFixed(1));
          saved = s;
        }
      }
      last = now;
    }, 250);
    return () => clearInterval(t);
  }, [key]);
  return secs;
}

/** "1:00 PM" in IST. */
export function istTime(iso: string | null | undefined) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });
}

export function istDay(d = new Date()) {
  return new Date(d.getTime() + 330 * 60_000).toISOString().slice(0, 10);
}

/** Minutes since midnight IST. */
export function istMinutes(d = new Date()) {
  const m = d.getUTCHours() * 60 + d.getUTCMinutes() + 330;
  return m % 1440;
}

export function inQuietHours(d = new Date()) {
  const m = istMinutes(d);
  return m >= 21 * 60 + 30 || m < 6 * 60 + 30;
}
