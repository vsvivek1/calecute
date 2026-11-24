// The daily plan: works back from the exam date to today's quota.

import { CARD_MINUTES } from './timing.ts';
import { addDays, dayKey, parseDay } from './scheduler.ts';

export type Phase = 'learn' | 'revision' | 'cram' | 'examDay' | 'after';

export interface PlanInput {
  today: Date;
  examDate: string | null;
  newLeft: number;
  dueToday: number;
  minutesPerDay: number;
}

export interface Plan {
  daysLeft: number;
  phase: Phase;
  newToday: number;
  reviewsToday: number;
  quota: number;
  minutes: number;
  /** Today's cards don't fit the learner's free time. */
  behind: boolean;
}

/** Without an exam date the plan assumes eight weeks. */
export const DEFAULT_DAYS = 56;

export const daysBetween = (a: Date, b: Date) =>
  Math.round((parseDay(dayKey(b)).getTime() - parseDay(dayKey(a)).getTime()) / 86_400_000);

export function dailyPlan(p: PlanInput): Plan {
  const daysLeft = p.examDate ? daysBetween(p.today, parseDay(p.examDate)) : DEFAULT_DAYS;
  const phase: Phase =
    daysLeft < 0 ? 'after' : daysLeft === 0 ? 'examDay' : daysLeft <= 2 ? 'cram' : daysLeft - 2 <= revisionWindow(daysLeft) ? 'revision' : 'learn';

  if (phase === 'after') return { daysLeft, phase, newToday: 0, reviewsToday: 0, quota: 0, minutes: 0, behind: false };
  if (phase === 'examDay') return { daysLeft, phase, newToday: 0, reviewsToday: 10, quota: 10, minutes: 12, behind: false };

  const rw = revisionWindow(daysLeft);
  const learnDays = phase === 'learn' ? Math.max(1, daysLeft - rw - 2) : Math.max(1, daysLeft - 2);
  let newToday = phase === 'cram' ? 0 : Math.ceil(p.newLeft / learnDays);
  const reviewCap = 2 * newToday + 20;
  const reviewsToday = phase === 'cram' ? Math.max(30, p.dueToday) : Math.min(p.dueToday, reviewCap);

  let behind = false;
  const fit = Math.floor(p.minutesPerDay / CARD_MINUTES);
  if (phase !== 'cram' && newToday + reviewsToday > fit) {
    behind = newToday > 0;
    newToday = Math.max(0, Math.min(newToday, fit - reviewsToday));
  }
  // Daily minimum: one sitting's worth whenever anything is left to do.
  let quota = newToday + reviewsToday;
  if (quota > 0 && quota < 5) quota = Math.min(5, p.newLeft + p.dueToday) || quota;
  return { daysLeft, phase, newToday, reviewsToday, quota, minutes: Math.ceil(quota * CARD_MINUTES), behind };
}

export const revisionWindow = (daysLeft: number) => Math.min(14, Math.round(daysLeft * 0.15));

// ---- the study calendar ---------------------------------------------------
//
// A new learner gets a 100-day plan from the day they join. Picking an exam
// date replaces it: the plan then runs from today to that date, and the daily
// load grows or shrinks to fit.

/** Length of the default plan, from the day the learner joins. */
export const PLAN_DAYS = 100;
/** A default plan that has run out keeps at least this many days ahead. */
const MIN_AHEAD = 14;
/** Mocks need this many cards seen before they say anything useful. */
export const MOCK_MIN_SEEN = 40;
const MOCK_EVERY = 7;

/**
 * The day the plan works back from: the exam date, or the end of the
 * 100-day plan. A default plan never runs out: past its end it rolls on.
 */
export function planTarget(examDate: string | null, planStart: string, today: Date): { date: string; booked: boolean } {
  if (examDate) return { date: examDate, booked: true };
  const end = addDays(parseDay(planStart), PLAN_DAYS - 1); // day 100 is the last
  const floor = addDays(parseDay(dayKey(today)), MIN_AHEAD);
  return { date: dayKey(end > floor ? end : floor), booked: false };
}

export type DateWarning = { level: 'bad' | 'warn'; text: string } | null;

/** Is the exam date workable for what is left and the time given each day? */
export function dateWarning(a: { today: Date; examDate: string; newLeft: number; minutesPerDay: number }): DateWarning {
  const days = daysBetween(a.today, parseDay(a.examDate));
  if (days < 0) return { level: 'bad', text: 'This date has passed. Pick a new one.' };
  if (days < 7) return { level: 'bad', text: `Only ${days} days left. There is no time to learn new topics, so the plan goes straight to revision and cram.` };
  const p = dailyPlan({ today: a.today, examDate: a.examDate, newLeft: a.newLeft, dueToday: 0, minutesPerDay: a.minutesPerDay });
  const learnDays = Math.max(1, days - revisionWindow(days) - 2);
  const need = Math.ceil(a.newLeft / learnDays);
  if (p.behind || need * 3 * CARD_MINUTES > a.minutesPerDay) {
    const mins = Math.ceil((need * 3 * CARD_MINUTES) / 15) * 15;
    return { level: 'warn', text: `Tight: about ${need} new questions a day plus reviews. Plan for ${mins} minutes a day to keep up.` };
  }
  if (days < 30) return { level: 'warn', text: `Less than a month. Daily load is higher, and the revision window is short.` };
  if (days > 180) return { level: 'warn', text: `${days} days away. The plan is light each day. Most people do best with 2 to 4 months; you can move the date later.` };
  return null;
}

export type CalendarKind = 'learn' | 'revision' | 'cram' | 'examDay';

export interface CalendarDay {
  date: string;
  kind: CalendarKind;
  /** Planned new questions (past days: what was actually rated). */
  newCards: number;
  /** Cards rated that day (past and today). */
  done: number;
  /** Size of the timed mock planned for this day, if any. */
  mock: number | null;
  /** Day number in the plan, from 1. */
  n: number;
  past: boolean;
  today: boolean;
}

export interface CalendarInput {
  today: Date;
  start: string;
  target: string;
  booked: boolean;
  newLeft: number;
  seen: number;
  minutesPerDay: number;
  lastMockAt: string | null;
  /** Rated cards per day key, from the log. */
  doneByDay: Record<string, number>;
  /** New cards learned per day key, from the log. */
  newByDay: Record<string, number>;
}

/**
 * Every day from the plan's start to the target: what has been done, and what
 * is planned. New cards spread evenly over the learning days (as the daily
 * plan does); a 60-question mock every week once enough is seen, a full
 * 180-question mock in revision, and a short one two days before the exam.
 */
export function buildCalendar(c: CalendarInput): CalendarDay[] {
  const start = parseDay(c.start);
  const end = parseDay(c.target);
  const todayKey = dayKey(c.today);
  const total = Math.max(0, daysBetween(start, end));
  const daysLeft = Math.max(0, daysBetween(c.today, end));
  const rw = revisionWindow(daysLeft);
  const learnLeft = Math.max(1, daysLeft - rw - 2);

  const out: CalendarDay[] = [];
  let newLeft = c.newLeft;
  let seen = c.seen;
  let lastMock = c.lastMockAt ? parseDay(dayKey(new Date(c.lastMockAt))) : null;
  let fullMock = false;
  let futureLearn = 0;

  for (let i = 0; i <= total; i++) {
    const d = addDays(start, i);
    const key = dayKey(d);
    const past = key < todayKey;
    const isToday = key === todayKey;
    const left = daysBetween(d, end);
    const kind: CalendarKind = !c.booked
      ? left <= rw ? 'revision' : 'learn'
      : left === 0 ? 'examDay' : left <= 2 ? 'cram' : left - 2 <= rw ? 'revision' : 'learn';

    let newCards = c.newByDay[key] ?? 0;
    let mock: number | null = null;
    if (!past) {
      if (kind === 'learn' && newLeft > 0) {
        newCards = Math.min(newLeft, Math.ceil(newLeft / Math.max(1, learnLeft - futureLearn)));
        futureLearn++;
      } else newCards = 0;
      newLeft -= newCards;
      const since = lastMock ? daysBetween(lastMock, d) : Infinity;
      if (kind === 'cram' && left === 2 && seen >= MOCK_MIN_SEEN) mock = 60;
      else if (kind === 'revision' && !fullMock && seen >= MOCK_MIN_SEEN && since >= 3) {
        mock = 180;
        fullMock = true;
      } else if ((kind === 'learn' || kind === 'revision') && seen >= MOCK_MIN_SEEN && since >= MOCK_EVERY) mock = 60;
      if (mock) lastMock = d;
      seen += newCards;
    }
    out.push({ date: key, kind, newCards, done: c.doneByDay[key] ?? 0, mock, n: i + 1, past, today: isToday });
  }
  return out;
}
