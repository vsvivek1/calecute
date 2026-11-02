// The daily plan: works back from the exam date to today's quota.

import { CARD_MINUTES } from './timing.ts';
import { dayKey, parseDay } from './scheduler.ts';

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
