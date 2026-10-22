'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Milliseconds spent on a card while the page is visible. Starts from the
 * saved value and saves itself every two seconds, when hidden and on unmount,
 * so neither a reload nor time in the background changes the count.
 */
export function useForegroundTimer(initial: number, running: boolean, persist: (ms: number) => void) {
  const [ms, setMs] = useState(initial);
  const acc = useRef(initial);
  const since = useRef<number | null>(null);
  const save = useRef(persist);
  save.current = persist;

  useEffect(() => {
    if (!running) return;
    const visible = () => document.visibilityState === 'visible';
    const start = () => {
      if (since.current === null && visible()) since.current = Date.now();
    };
    const stop = () => {
      if (since.current !== null) {
        acc.current += Date.now() - since.current;
        since.current = null;
      }
    };
    const now = () => acc.current + (since.current !== null ? Date.now() - since.current : 0);
    start();
    const tick = setInterval(() => setMs(now()), 250);
    const flush = setInterval(() => save.current(now()), 2000);
    const onVis = () => {
      if (visible()) start();
      else {
        stop();
        save.current(acc.current);
      }
      setMs(now());
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', onVis);
    return () => {
      stop();
      save.current(acc.current);
      clearInterval(tick);
      clearInterval(flush);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', onVis);
    };
  }, [running]);

  return ms;
}
