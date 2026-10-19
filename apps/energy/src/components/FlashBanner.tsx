'use client';

import { useEffect, useState } from 'react';
import type { Flash } from '@/lib/types';

const NOON_IST_UTC_MIN = 6 * 60 + 30; // 12:00 IST = 06:30 UTC
const REMIND_IST_UTC_MIN = 13 * 60 + 30; // 19:00 IST = 13:30 UTC

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

async function notify(title: string, body: string, tag: string) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  const reg = await navigator.serviceWorker?.getRegistration();
  if (reg) await reg.showNotification(title, { body, tag, icon: '/icon.svg' });
  else new Notification(title, { body, tag });
}

/**
 * Noon flash: one or two facts per enrolled paper at 12:00 IST, shown as a
 * banner and (when allowed) a browser notification. Also the evening
 * reminder while the app is open.
 */
export default function FlashBanner({ flash, preview = false }: { flash: Flash[]; preview?: boolean }) {
  const [afterNoon, setAfterNoon] = useState(preview);
  const [hidden, setHidden] = useState(false);
  const [perm, setPerm] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    setPerm(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission);
    if (preview) return;
    navigator.serviceWorker?.register('/sw.js').catch(() => {});
    const day = istDay();
    setHidden(store('em-flash-hidden') === day);

    const tick = () => {
      const m = utcMinutes();
      const noon = m >= NOON_IST_UTC_MIN;
      setAfterNoon(noon);
      if (noon && flash.length && store('em-flash-notified') !== istDay()) {
        store('em-flash-notified', istDay());
        const f = flash[0];
        notify('⚡ Noon flash', `${f.question} ${f.answer}`, 'em-flash');
      }
      if (m >= REMIND_IST_UTC_MIN && store('em-remind-notified') !== istDay()) {
        store('em-remind-notified', istDay());
        notify('Recallio', "Today's plan is waiting. A few minutes keeps your streak going.", 'em-remind');
      }
    };
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
      {!preview && perm === 'default' && (
        <button
          className="btn btn-ghost btn-sm"
          onClick={async () => setPerm(await Notification.requestPermission())}
        >
          Turn on noon alerts and daily reminders
        </button>
      )}
    </section>
  );
}
