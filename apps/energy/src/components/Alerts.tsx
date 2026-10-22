'use client';

import { useEffect, useState } from 'react';
import type { Flash } from '@/lib/types';
import { inQuietHours, istDay, istMinutes, store } from '@/lib/timing';

const NOON = 12 * 60;
const FOLLOW_UP_MIN = 30;

export async function notify(title: string, body: string, tag: string) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  const reg = await navigator.serviceWorker?.getRegistration();
  if (reg) await reg.showNotification(title, { body, tag, icon: '/icon.svg', requireInteraction: true });
  else new Notification(title, { body, tag });
}

const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Study-time alerts, the noon flash and one gentle follow-up, while a tab or
 * the installed app is open. No alerts in quiet hours (21:30 to 06:30 IST).
 * Renders nothing.
 */
export default function Alerts({
  studyTimes,
  flash,
  sittingOpen,
  quotaLeft,
}: {
  studyTimes: string[];
  flash: Flash[];
  sittingOpen: boolean;
  quotaLeft: number;
}) {
  useEffect(() => {
    navigator.serviceWorker?.register('/sw.js').catch(() => {});
  }, []);

  useEffect(() => {
    const tick = () => {
      const day = istDay();
      const m = istMinutes();
      if (inQuietHours()) return;

      if (m >= NOON && m < NOON + 60 && flash.length && store('em-flash-notified') !== day) {
        store('em-flash-notified', day);
        const f = flash[0];
        notify('⚡ Noon flash', `${f.question} ${f.answer}`, 'em-flash');
      }
      if (quotaLeft <= 0 || sittingOpen) return;

      for (const t of studyTimes) {
        const at = toMin(t);
        const key = `em-alert-${day}-${t}`;
        // Ring at the study time (or within the hour after, if the tab opened late).
        if (m >= at && m < at + 60 && !store(key)) {
          store(key, String(Date.now()));
          const n = Math.min(10, quotaLeft);
          notify('📚 Study time', `${n} cards, about ${Math.max(3, Math.round(n * 0.6))} minutes.`, 'em-study');
        }
        // At most one follow-up, 30 minutes later, if the sitting did not start.
        const rang = Number(store(key));
        const fu = `${key}-fu`;
        if (rang && !store(fu) && Date.now() - rang >= FOLLOW_UP_MIN * 60_000) {
          store(fu, '1');
          const started = Number(store('em-last-start')) || 0;
          if (started < rang) notify('Recallio', 'Your sitting is still waiting. A few minutes is enough.', 'em-study');
        }
      }
    };
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, [studyTimes, flash, sittingOpen, quotaLeft]);

  return null;
}

/** "Alerts off — turn on" (feed) or the alerts row in the profile. */
export function AlertsToggle({ compact = false }: { compact?: boolean }) {
  const [perm, setPerm] = useState<NotificationPermission | 'unsupported' | null>(null);
  useEffect(() => {
    setPerm(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission);
  }, []);
  if (perm === null || (compact && perm === 'granted')) return null;
  if (perm === 'unsupported') return compact ? null : <p className="note">This browser cannot show alerts.</p>;
  if (perm === 'granted') return <p className="note">Alerts are on for this browser.</p>;
  if (perm === 'denied')
    return <p className="note">Alerts are blocked. Allow notifications for this site in your browser settings.</p>;
  return (
    <button
      className={`btn btn-ghost ${compact ? 'btn-sm' : ''}`}
      onClick={async () => setPerm(await Notification.requestPermission())}
    >
      🔔 {compact ? 'Alerts off: turn on' : 'Turn on study-time alerts'}
    </button>
  );
}
