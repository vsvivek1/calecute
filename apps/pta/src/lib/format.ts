// Indian formats: rupees with lakh grouping, dates as "15 Oct".

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2, minimumFractionDigits: 0 });

export function rupees(paise: number | string | null | undefined) {
  return inr.format(Number(paise ?? 0) / 100);
}

export function day(d: string | null | undefined, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) {
  if (!d) return '';
  // A bare date is a calendar day, not an instant: never shift it by timezone.
  const v = d.length === 10 ? new Date(`${d}T00:00:00+05:30`) : new Date(d);
  return v.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', ...opts });
}

export function dayTime(d: string) {
  return new Date(d).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  });
}

export function todayIST() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

/** "today", "tomorrow", "in 3 days", "2 days ago". */
export function relative(d: string) {
  const a = new Date(`${todayIST()}T00:00:00Z`).getTime();
  const b = new Date(`${d.slice(0, 10)}T00:00:00Z`).getTime();
  const n = Math.round((b - a) / 86400000);
  if (n === 0) return 'today';
  if (n === 1) return 'tomorrow';
  if (n === -1) return 'yesterday';
  return n > 0 ? `in ${n} days` : `${-n} days ago`;
}

export function hoursSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 3600000);
}
