// Weekly report, quick checks and readiness. Every number comes from the
// learner's own review log on this device.

import { classify, isNew, parseDay, recall, type CardRec, type Rating } from './scheduler.ts';
import { daysBetween, DEFAULT_DAYS } from './plan.ts';
import type { Question } from '../types.ts';

export type LogKind = 'learn' | 'review' | 'honesty' | 'check' | 'retention' | 'mock';

export interface LogRow {
  id: string;
  at: string;
  kind: LogKind;
  correct: boolean;
  rating?: Rating;
  /** Time on the card, foreground only. */
  ms: number;
  honesty?: 'passed' | 'missed';
  /** Rated within a second of the buttons unlocking. */
  instant?: boolean;
}

export interface CheckResult {
  at: string;
  correct: number;
  total: number;
  medianMs: number;
  instantRate: number;
}

export interface MockResult {
  at: string;
  size: number;
  correct: number;
  minutes: number;
}

/** Monday of the week containing `d`, as YYYY-MM-DD. */
export function weekKey(d: Date) {
  const m = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
  return `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}-${String(m.getDate()).padStart(2, '0')}`;
}

/** Report due: once a week, from Sunday, for a week with study in it. */
export function reportDue(now: Date, log: LogRow[], lastReportWeek: string | undefined) {
  const thisWeek = weekKey(now);
  const lastWeek = weekKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7));
  const target = now.getDay() === 0 ? thisWeek : lastWeek;
  if (lastReportWeek && lastReportWeek >= target) return null;
  const studied = log.some((r) => weekKey(new Date(r.at)) === target);
  return studied ? target : null;
}

/** Readiness = share of cards seen × average predicted recall on exam day. */
export function readiness(bank: Question[], cards: Record<string, CardRec>, examDate: string | null, now: Date) {
  if (!bank.length) return 0;
  const at = examDate ? parseDay(examDate) : new Date(now.getTime() + DEFAULT_DAYS * 86_400_000);
  const seen = bank.filter((q) => !isNew(cards[q.id]));
  if (!seen.length) return 0;
  const avg = seen.reduce((s, q) => s + recall(cards[q.id], at), 0) / seen.length;
  return (seen.length / bank.length) * avg;
}

/** "about 60%": readiness is an estimate, so it is shown rounded. */
export const band = (x: number) => `about ${Math.round((x * 100) / 5) * 5}%`;

export interface TopicCount {
  topic: string;
  n: number;
}

const countTopics = (ids: string[], bank: Map<string, Question>): TopicCount[] => {
  const m = new Map<string, number>();
  for (const id of ids) {
    const t = bank.get(id)?.topic;
    if (t) m.set(t, (m.get(t) ?? 0) + 1);
  }
  return [...m].map(([topic, n]) => ({ topic, n })).sort((a, b) => b.n - a.n);
};

export interface WeeklyReport {
  week: string;
  daysStudied: number;
  minutes: number;
  cards: number;
  sittings: number;
  becameEasy: TopicCount[];
  stillTough: TopicCount[];
  slipped: number;
  simpleMissed: number;
  mocks: MockResult[];
  focus: 'steady' | 'improving' | 'dipping' | null;
  readiness: string;
  daysLeft: number | null;
  teachBack: string | null;
}

export function weeklyReport(a: {
  week: string;
  bank: Question[];
  cards: Record<string, CardRec>;
  log: LogRow[];
  sittings: number;
  mocks: MockResult[];
  checks: CheckResult[];
  examDate: string | null;
  now: Date;
}): WeeklyReport {
  const qs = new Map(a.bank.map((q) => [q.id, q]));
  const rows = a.log.filter((r) => weekKey(new Date(r.at)) === a.week);
  const ids = [...new Set(rows.map((r) => r.id))];
  const kinds = (k: ReturnType<typeof classify>) => ids.filter((id) => a.cards[id] && classify(a.cards[id]) === k);
  const easy = countTopics(kinds('becameEasy'), qs);
  const daysLeft = a.examDate ? daysBetween(a.now, parseDay(a.examDate)) : null;
  return {
    week: a.week,
    daysStudied: new Set(rows.map((r) => r.at.slice(0, 10))).size,
    minutes: Math.round(rows.reduce((s, r) => s + r.ms, 0) / 60000),
    cards: rows.filter((r) => r.rating).length,
    sittings: a.sittings,
    becameEasy: easy,
    stillTough: countTopics(kinds('stillTough'), qs),
    slipped: kinds('slipped').length,
    simpleMissed: rows.filter((r) => r.honesty === 'missed').length,
    mocks: a.mocks.filter((m) => weekKey(new Date(m.at)) === a.week),
    focus: focusTrend(a.checks),
    readiness: band(readiness(a.bank, a.cards, a.examDate, a.now)),
    daysLeft,
    teachBack: easy[0]?.topic ?? null,
  };
}

// ---- quick checks --------------------------------------------------------

export function focusTrend(checks: CheckResult[]): WeeklyReport['focus'] {
  if (checks.length < 2) return checks.length ? 'steady' : null;
  const [a, b] = checks.slice(-2).map((c) => c.correct / c.total);
  return b - a > 0.15 ? 'improving' : a - b > 0.15 ? 'dipping' : 'steady';
}

/** Sitting size from quick checks: 10 by default, smaller when focus dips. */
export function focusSize(checks: CheckResult[]) {
  const last = checks.at(-1);
  if (!last) return 10;
  const acc = last.correct / last.total;
  if (acc < 0.4 || last.instantRate > 0.6) return 5;
  if (acc < 0.6 || last.instantRate > 0.4) return 7;
  return 10;
}

/** A quick check about every two days, from cards studied 1–7 days ago. */
export function checkCards(bank: Question[], log: LogRow[], now: Date, lastCheckAt: string | undefined): string[] | null {
  if (lastCheckAt && now.getTime() - new Date(lastCheckAt).getTime() < 2 * 86_400_000) return null;
  const lo = now.getTime() - 7 * 86_400_000;
  const hi = now.getTime() - 86_400_000;
  const ids = [...new Set(log.filter((r) => r.rating && +new Date(r.at) >= lo && +new Date(r.at) <= hi).map((r) => r.id))];
  const known = ids.filter((id) => bank.some((q) => q.id === id));
  if (known.length < 3) return null;
  return known.sort(() => Math.random() - 0.5).slice(0, 3);
}

/** Five cards from this week for the report's retention review. */
export function retentionCards(log: LogRow[], week: string): string[] {
  const ids = [...new Set(log.filter((r) => r.rating && weekKey(new Date(r.at)) === week).map((r) => r.id))];
  return ids.sort(() => Math.random() - 0.5).slice(0, 5);
}

export const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};
