'use client';

// Study-time alerts. Android: local notifications, loud heads-up channel,
// rescheduled for the next 14 days on every open. Web: a calendar file with
// a daily reminder at each study time (browsers cannot fire alarms when
// the site is closed).

import { IS_APP } from '../env';
import { addDays, parseDay } from '../engine/scheduler';
import { QUIET, type Profile } from '../feed';

const CHANNEL = 'study';
const DAYS_AHEAD = 14;

const at = (day: Date, hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m);
};

const quiet = (hhmm: string) => {
  const h = Number(hhmm.split(':')[0]);
  return h >= QUIET.from || h < QUIET.to;
};

async function plugin() {
  return (await import('@capacitor/local-notifications')).LocalNotifications;
}

/** Ask for notification permission. Returns true when alerts can show. */
export async function askAlertPermission(): Promise<boolean> {
  if (IS_APP) {
    const LN = await plugin();
    const r = await LN.requestPermissions();
    return r.display === 'granted';
  }
  if (typeof Notification === 'undefined') return false;
  if (Notification.permission === 'granted') return true;
  return (await Notification.requestPermission()) === 'granted';
}

/** Android 12+: exact alarms are off unless the learner allows them. */
export async function exactAlarmStatus(): Promise<'granted' | 'denied' | 'na'> {
  if (!IS_APP) return 'na';
  try {
    const r = await (await plugin()).checkExactNotificationSetting();
    return r.exact_alarm === 'granted' ? 'granted' : 'denied';
  } catch {
    return 'na';
  }
}

export async function openExactAlarmSetting() {
  if (IS_APP) await (await plugin()).changeExactNotificationSetting();
}

/**
 * Schedule one alert per study time for the next two weeks, skipping the
 * rest of today once the quota is done and anything after exam day.
 */
export async function scheduleAlerts(profile: Profile, quotaDoneToday: boolean, now = new Date()) {
  if (!IS_APP) return;
  try {
    const LN = await plugin();
    if ((await LN.checkPermissions()).display !== 'granted') return;
    await LN.createChannel({ id: CHANNEL, name: 'Study times', description: 'Your PMP study sittings', importance: 5, visibility: 1, vibration: true });
    const pending = await LN.getPending();
    if (pending.notifications.length) await LN.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });
    const exam = profile.examDate ? parseDay(profile.examDate) : null;
    const notifications = [];
    for (let d = 0; d < DAYS_AHEAD; d++) {
      const day = addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()), d);
      if (exam && day > exam) break;
      if (d === 0 && quotaDoneToday) continue;
      for (const [k, t] of profile.studyTimes.entries()) {
        const when = at(day, t);
        if (when <= now || quiet(t)) continue;
        notifications.push({
          id: 1000 + d * 10 + k,
          channelId: CHANNEL,
          title: 'Time for your PMP sitting',
          body: 'Up to 10 questions, about 12 minutes. The app has picked them for you.',
          schedule: { at: when, allowWhileIdle: true },
        });
      }
    }
    if (notifications.length) await LN.schedule({ notifications });
  } catch {
    /* alerts are a nicety; study works without them */
  }
}

/** One "quota complete" message per day. */
export async function notifyQuotaComplete(next: string | null) {
  const body = next ? `Nice work. Want more? A bonus set opens at ${next}.` : 'Nice work. See you at your next study time.';
  try {
    if (IS_APP) {
      const LN = await plugin();
      if ((await LN.checkPermissions()).display !== 'granted') return;
      await LN.schedule({ notifications: [{ id: 9, channelId: CHANNEL, title: "Today's quota is done", body, schedule: { at: new Date(Date.now() + 1000) } }] });
    } else if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.visibilityState !== 'visible') {
      new Notification("Today's quota is done", { body });
    }
  } catch {}
}

/** A calendar file with a daily event at each study time, until exam day. */
export function studyCalendar(profile: Profile, now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const local = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const stamp = now.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  const until = profile.examDate ? `;UNTIL=${profile.examDate.replace(/-/g, '')}T235959` : ';COUNT=90';
  const events = profile.studyTimes.map((t, k) => {
    let start = at(now, t);
    if (start < now) start = addDays(start, 1);
    const end = new Date(start.getTime() + 12 * 60_000);
    return [
      'BEGIN:VEVENT',
      `UID:pmp-sitting-${k}-${stamp}@calecutech.com`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${local(start)}`,
      `DTEND:${local(end)}`,
      `RRULE:FREQ=DAILY${until}`,
      'SUMMARY:PMP sitting (10 questions)',
      "DESCRIPTION:Open PMP Prep. The app has picked today's questions for you.",
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'DESCRIPTION:Time for your PMP sitting',
      'TRIGGER:PT0M',
      'END:VALARM',
      'END:VEVENT',
    ].join('\r\n');
  });
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Calecutech//PMP Prep//EN', 'CALSCALE:GREGORIAN', ...events, 'END:VCALENDAR'].join('\r\n');
}

export function downloadCalendar(profile: Profile) {
  const blob = new Blob([studyCalendar(profile)], { type: 'text/calendar' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'pmp-study-times.ics';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
