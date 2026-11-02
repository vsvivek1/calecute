'use client';

// The learner's Spaced Loop state and every action the Daily Feed can take.
// All of it lives in localStorage on this device. The current sitting, the
// card on screen and its timers are saved too, so a reload, the back button
// or killing the app brings back the same card.

import { useSyncExternalStore } from 'react';
import { notify, read, subscribe } from './store';
import { addDays, dayKey, fromSm2, isDueOn, isNew, newRec, review, type CardRec, type Rating, type Sm2State } from './engine/scheduler';
import { dailyPlan, type Plan } from './engine/plan';
import { buildSitting, MAX_SITTING, type FeedItem } from './engine/sitting';
import {
  checkCards, focusSize, median, reportDue, retentionCards, type CheckResult, type LogKind, type LogRow, type MockResult,
} from './engine/report';
import { record, topicKey, type TallyMap } from './stats';
import type { Question } from './types';

const KEY = 'pmp.loop';
const V1_KEY = 'pmp.progress';

/** Minutes between quota sittings, so each recall takes some effort. */
export const QUOTA_GAP_MIN = 45;
/** Minutes after the quota before a bonus sitting opens; at most two a day. */
export const BONUS_GAP_MIN = 90;
export const MAX_BONUS = 2;
/** Cram mode: short breaks instead of gaps. */
export const CRAM_BREAK_MIN = 5;
/** No sittings open, and no alerts, in these hours. */
export const QUIET = { from: 22, to: 6 };

export interface Profile {
  examDate: string | null;
  /** Study times as HH:MM, local. */
  studyTimes: string[];
  minutesPerDay: number;
  onboarded: boolean;
}

export interface DayRec {
  plan: Plan;
  /** New cards still allowed today. */
  newBudget: number;
  done: number;
  sittings: number;
  bonus: number;
  lastEnd?: string;
  complete?: boolean;
  /** Cards rated "Didn't get it" today, still waiting to come back. */
  againToday: string[];
}

export interface CardUi {
  /** Option order on screen (indexes into q.options). */
  order: number[];
  chosen: number | null;
  revealed: boolean;
  /** Foreground ms spent reading before Check. */
  readMs: number;
  /** Foreground ms spent on the explanation. */
  rateMs: number;
  /** Multi-question cards (quick check): which question, and answers so far. */
  sub: number;
  subCorrect: boolean[];
  subMs: number[];
  /** Report card: the learner's guess at how much they remember. */
  self?: string;
}

export type SittingKind = 'quota' | 'bonus' | 'cram' | 'examday';

export interface Sitting {
  id: string;
  kind: SittingKind;
  day: string;
  items: FeedItem[];
  i: number;
  startedAt: string;
  ui: CardUi | null;
}

export interface LoopState {
  v: 2;
  profile: Profile;
  cards: Record<string, CardRec>;
  log: LogRow[];
  topics: TallyMap;
  domains: TallyMap;
  mocks: MockResult[];
  days: Record<string, DayRec>;
  sitting: Sitting | null;
  checks: CheckResult[];
  lastReportWeek?: string;
  lastCheckAt?: string;
  lastActive?: string;
  /** "Not today" on a mock offer. */
  mockSnooze?: string;
  retention?: { week: string; self?: string; correct?: number; total?: number };
  /** Minimum times are raised by 20% until this day (honesty rule). */
  slowUntil?: string;
  outcome?: 'passed' | 'retake' | 'unsure';
}

export const DEFAULT_TIMES = ['07:00', '12:30', '19:00'];

const empty = (): LoopState => ({
  v: 2,
  profile: { examDate: null, studyTimes: DEFAULT_TIMES, minutesPerDay: 30, onboarded: false },
  cards: {},
  log: [],
  topics: {},
  domains: {},
  mocks: [],
  days: {},
  sitting: null,
  checks: [],
});

// ---- storage -------------------------------------------------------------

/** v1 kept SM-2 states and tallies under pmp.progress. Carry them over once. */
function migrate(): LoopState {
  const s = empty();
  const v1 = read<{ cards?: Record<string, Sm2State>; topics?: TallyMap; domains?: TallyMap; mocks?: MockResult[] } | null>(V1_KEY, null);
  if (!v1) return s;
  for (const [id, c] of Object.entries(v1.cards ?? {})) s.cards[id] = fromSm2(c);
  s.topics = v1.topics ?? {};
  s.domains = v1.domains ?? {};
  s.mocks = (v1.mocks ?? []).map((m) => ({ at: m.at, size: m.size, correct: m.correct, minutes: m.minutes }));
  return s;
}

let cachedRaw: string | null | undefined;
let cached: LoopState = empty();
const SERVER = empty();

function snapshot(): LoopState {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {}
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    if (raw) {
      try {
        cached = { ...empty(), ...(JSON.parse(raw) as LoopState) };
      } catch {
        cached = empty();
      }
    } else {
      cached = migrate();
    }
  }
  return cached;
}

function save(s: LoopState) {
  // Keep the log to 120 days and day records to 60, so storage stays small.
  const cutoff = Date.now() - 120 * 86_400_000;
  const dayCut = dayKey(new Date(Date.now() - 60 * 86_400_000));
  const trimmed: LoopState = {
    ...s,
    log: s.log.filter((r) => +new Date(r.at) >= cutoff),
    days: Object.fromEntries(Object.entries(s.days).filter(([d]) => d >= dayCut)),
    checks: s.checks.slice(-20),
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch {
    /* storage full or blocked: progress just won't persist */
  }
  notify();
}

export const getLoop = snapshot;
export const useLoop = () => useSyncExternalStore(subscribe, snapshot, () => SERVER);
const update = (fn: (s: LoopState) => LoopState) => save(fn(snapshot()));

export function resetLoop() {
  try {
    localStorage.removeItem(V1_KEY);
  } catch {}
  save({ ...empty(), profile: { ...snapshot().profile } });
}

export function saveProfile(patch: Partial<Profile>) {
  update((s) => {
    const profile = { ...s.profile, ...patch };
    // A new exam date changes today's plan.
    const days = patch.examDate !== undefined && patch.examDate !== s.profile.examDate ? withoutToday(s.days) : s.days;
    return { ...s, profile, days };
  });
}

const withoutToday = (days: Record<string, DayRec>) => {
  const k = dayKey(new Date());
  const { [k]: today, ...rest } = days;
  // Keep what was done today; only the plan is rebuilt.
  return today ? { ...rest, [`_${k}`]: today } : rest;
};

// ---- the day's plan ------------------------------------------------------

/** Today's record: the plan is fixed at the first open of the day. */
export function ensureDay(s: LoopState, bank: Question[], now = new Date()): { s: LoopState; day: DayRec } {
  const k = dayKey(now);
  if (s.days[k]) return { s, day: s.days[k] };
  const prior = s.days[`_${k}`];
  const newLeft = bank.filter((q) => isNew(s.cards[q.id])).length;
  const dueToday = bank.filter((q) => s.cards[q.id] && isDueOn(s.cards[q.id], now)).length;
  const plan = dailyPlan({ today: now, examDate: s.profile.examDate, newLeft, dueToday, minutesPerDay: s.profile.minutesPerDay });
  const day: DayRec = {
    plan,
    newBudget: Math.max(0, plan.quota - plan.reviewsToday - (prior ? prior.done : 0)),
    done: prior?.done ?? 0,
    sittings: prior?.sittings ?? 0,
    bonus: prior?.bonus ?? 0,
    lastEnd: prior?.lastEnd,
    complete: prior ? prior.done >= plan.quota : false,
    againToday: prior?.againToday ?? [],
  };
  const { [`_${k}`]: _drop, ...days } = s.days;
  return { s: { ...s, days: { ...days, [k]: day } }, day };
}

const inQuiet = (d: Date) => d.getHours() >= QUIET.from || d.getHours() < QUIET.to;

/** The next time outside quiet hours, at or after `d`. */
const outOfQuiet = (d: Date) => {
  if (!inQuiet(d)) return d;
  const x = new Date(d);
  if (x.getHours() >= QUIET.from) x.setDate(x.getDate() + 1);
  x.setHours(QUIET.to, 0, 0, 0);
  return x;
};

export type FeedStatus =
  | { kind: 'onboard' }
  | { kind: 'sitting'; sitting: Sitting }
  | { kind: 'ready'; next: SittingKind; day: DayRec }
  | { kind: 'wait'; until: Date; day: DayRec; reason: 'gap' | 'break' | 'quiet' }
  | { kind: 'done'; day: DayRec; bonusAt: Date | null }
  | { kind: 'after' };

export function feedStatus(s: LoopState, bank: Question[], now = new Date()): FeedStatus {
  if (!s.profile.onboarded) return { kind: 'onboard' };
  if (s.sitting) return { kind: 'sitting', sitting: s.sitting };
  const { day } = ensureDay(s, bank, now);
  const phase = day.plan.phase;
  if (phase === 'after') return { kind: 'after' };
  const last = day.lastEnd ? new Date(day.lastEnd) : null;

  if (phase === 'examDay') {
    return day.sittings ? { kind: 'done', day, bonusAt: null } : { kind: 'ready', next: 'examday', day };
  }
  if (phase === 'cram') {
    const until = last ? new Date(last.getTime() + CRAM_BREAK_MIN * 60_000) : now;
    if (until > now) return { kind: 'wait', until, day, reason: 'break' };
    if (inQuiet(now)) return { kind: 'wait', until: outOfQuiet(now), day, reason: 'quiet' };
    return { kind: 'ready', next: 'cram', day };
  }
  if (day.done < day.plan.quota) {
    const until = last ? new Date(last.getTime() + QUOTA_GAP_MIN * 60_000) : now;
    if (until > now) return { kind: 'wait', until, day, reason: 'gap' };
    if (inQuiet(now) && day.sittings > 0) return { kind: 'wait', until: outOfQuiet(now), day, reason: 'quiet' };
    return { kind: 'ready', next: 'quota', day };
  }
  if (day.bonus >= MAX_BONUS || !bonusPool(s, bank, now)) return { kind: 'done', day, bonusAt: null };
  const at = last ? new Date(last.getTime() + BONUS_GAP_MIN * 60_000) : now;
  if (inQuiet(at) || (at <= now && inQuiet(now))) return { kind: 'done', day, bonusAt: null };
  return { kind: 'done', day, bonusAt: at };
}

/** Anything for a bonus sitting: reviews due within two days or new cards. */
const bonusPool = (s: LoopState, bank: Question[], now: Date) =>
  bank.some((q) => isNew(s.cards[q.id]) || isDueOn(s.cards[q.id], addDays(now, 2)));

// ---- sittings ------------------------------------------------------------

/** Fix today's plan in storage (first open of the day). */
export function touchDay(bank: Question[], now = new Date()) {
  const s = snapshot();
  if (!s.profile.onboarded || s.days[dayKey(now)] || !bank.length) return;
  save(ensureDay(s, bank, now).s);
}

export function startSitting(bank: Question[], kind: SittingKind, now = new Date()) {
  update((s0) => {
    if (s0.sitting) return s0;
    const { s, day } = ensureDay(s0, bank, now);
    const specials: FeedItem[] = [];
    const away = s.lastActive ? Math.round((now.getTime() - new Date(s.lastActive).getTime()) / 86_400_000) : 0;
    let size = Math.min(MAX_SITTING, focusSize(s.checks));
    if (kind === 'quota' && away >= 2) {
      specials.push({ t: 'welcome', daysAway: away });
      size = Math.min(size, 6); // keep the first sitting back short
    }
    const week = kind === 'quota' || kind === 'bonus' ? reportDue(now, s.log, s.lastReportWeek) : null;
    if (week) {
      specials.push({ t: 'report', week });
      const ids = retentionCards(s.log, week);
      if (ids.length >= 3) specials.push({ t: 'check', ids, retention: true });
    } else if (kind === 'quota') {
      const ids = checkCards(bank, s.log, now, s.lastCheckAt);
      if (ids) specials.push({ t: 'check', ids });
    }
    const quotaLeft = Math.max(0, day.plan.quota - day.done);
    const slots = kind === 'quota' ? Math.min(size, quotaLeft + specials.length) : size;
    const items = buildSitting({
      bank,
      cards: s.cards,
      topics: s.topics,
      now,
      slots,
      newBudget: kind === 'bonus' ? 5 : day.newBudget,
      againToday: day.againToday,
      kind,
      specials,
    });
    if (!items.length) return s;
    return {
      ...s,
      sitting: { id: `${now.getTime()}`, kind, day: dayKey(now), items, i: 0, startedAt: now.toISOString(), ui: null },
      lastReportWeek: week ?? s.lastReportWeek,
      lastActive: now.toISOString(),
    };
  });
}

/** The saved state of the card on screen, created the first time it shows. */
export function currentUi(sitting: Sitting, q: Question | null): CardUi {
  return (
    sitting.ui ?? {
      order: q ? seededOrder(q.options.length, `${sitting.id}:${sitting.i}:${q.id}`) : [],
      chosen: null,
      revealed: false,
      readMs: 0,
      rateMs: 0,
      sub: 0,
      subCorrect: [],
      subMs: [],
    }
  );
}

/**
 * Save part of the on-screen card's state. `index` guards against a late
 * save (a timer flushing on unmount) landing on the next card.
 */
export function patchUi(index: number, patch: Partial<CardUi>, q: Question | null) {
  update((s) =>
    s.sitting && s.sitting.i === index ? { ...s, sitting: { ...s.sitting, ui: { ...currentUi(s.sitting, q), ...patch } } } : s,
  );
}

/** Option order for a card on screen: random, but the same on every render. */
export function seededOrder(n: number, seed: string) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const rand = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) / 4294967296);
  const a = Array.from({ length: n }, (_, k) => k);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const kindOf = (why: string, c: CardRec | undefined): LogKind =>
  why === 'honesty' ? 'honesty' : isNew(c) ? 'learn' : 'review';

/** Rate the card on screen and move on. Every rating moves forward. */
export function rateCard(q: Question, rating: Rating, correct: boolean, instant: boolean, now = new Date()) {
  update((s0) => {
    const sit = s0.sitting;
    if (!sit) return s0;
    const item = sit.items[sit.i];
    if (item?.t !== 'q' || item.id !== q.id) return s0;
    const { s, day } = ensureDay(s0, [], now);
    const ui = currentUi(sit, q);
    const prev = s.cards[q.id] ?? newRec(q.id, now);
    const wasNew = isNew(prev);
    const res = review(prev, rating, now, { examDate: s.profile.examDate });

    const row: LogRow = {
      id: q.id, at: now.toISOString(), kind: kindOf(item.why, prev), correct, rating,
      ms: ui.readMs + ui.rateMs, honesty: res.honesty, instant,
    };

    // "Didn't get it": back once at the end of this sitting if there is room,
    // otherwise first in the next sitting.
    let items = sit.items;
    let againToday = day.againToday.filter((id) => id !== q.id);
    if (rating === 'again') {
      const cardsIn = items.filter((x) => x.t === 'q').length;
      const alreadyBack = items.slice(sit.i + 1).some((x) => x.t === 'q' && x.id === q.id);
      if (cardsIn < MAX_SITTING && !alreadyBack && item.why !== 'again') items = [...items, { t: 'q', id: q.id, why: 'again' }];
      else againToday = [...againToday, q.id];
    }

    const counts = sit.kind !== 'bonus' && item.why !== 'again';
    const nextDay: DayRec = {
      ...day,
      done: day.done + (counts ? 1 : 0),
      newBudget: wasNew && sit.kind !== 'bonus' ? Math.max(0, day.newBudget - 1) : day.newBudget,
      againToday,
    };
    return advance({
      ...s,
      cards: { ...s.cards, [q.id]: res.rec },
      log: [...s.log, row],
      topics: record(s.topics, topicKey(q), correct),
      domains: record(s.domains, q.domain, correct),
      days: { ...s.days, [dayKey(now)]: nextDay },
      sitting: { ...sit, items },
    }, now);
  });
}

/** Finish a quick check or retention review. */
export function finishCheck(bank: Question[], ids: string[], correct: boolean[], ms: number[], instant: number, retention: boolean, now = new Date()) {
  update((s) => {
    const qs = new Map(bank.map((q) => [q.id, q]));
    const rows: LogRow[] = ids.map((id, k) => ({ id, at: now.toISOString(), kind: retention ? 'retention' : 'check', correct: !!correct[k], ms: ms[k] ?? 0 }));
    // A miss makes the card due now; it shows in the next sitting.
    const cards = { ...s.cards };
    ids.forEach((id, k) => {
      if (!correct[k] && cards[id]) cards[id] = { ...cards[id], mem: { ...cards[id].mem, due: now.toISOString() }, honesty: undefined };
    });
    let topics = s.topics;
    ids.forEach((id, k) => {
      const q = qs.get(id);
      if (q) topics = record(topics, topicKey(q), !!correct[k]);
    });
    const n = correct.filter(Boolean).length;
    const next: LoopState = { ...s, cards, topics, log: [...s.log, ...rows] };
    if (retention) {
      next.retention = { ...(s.retention ?? { week: s.lastReportWeek ?? '' }), correct: n, total: ids.length };
    } else {
      next.checks = [...s.checks, { at: now.toISOString(), correct: n, total: correct.length, medianMs: median(ms), instantRate: instant }];
      next.lastCheckAt = now.toISOString();
    }
    return advance(next, now);
  });
}

/** Move past a card that needs no rating (report, welcome, exam-day). */
export function nextItem(extra?: Partial<LoopState>) {
  update((s) => advance({ ...s, ...extra }, new Date()));
}

function advance(s: LoopState, now: Date): LoopState {
  const sit = s.sitting;
  if (!sit) return s;
  if (sit.i + 1 < sit.items.length) return { ...s, sitting: { ...sit, i: sit.i + 1, ui: null }, lastActive: now.toISOString() };
  // Sitting over.
  const { s: s1, day } = ensureDay(s, [], now);
  const k = dayKey(now);
  const nextDay: DayRec = {
    ...day,
    sittings: day.sittings + (sit.kind === 'bonus' ? 0 : 1),
    bonus: day.bonus + (sit.kind === 'bonus' ? 1 : 0),
    lastEnd: now.toISOString(),
    complete: day.complete || day.done >= day.plan.quota,
  };
  return { ...honestyNote(s1, now), sitting: null, lastActive: now.toISOString(), days: { ...s1.days, [k]: nextDay } };
}

/**
 * If most new cards today were "So simple" and many honesty checks were
 * missed, slow the buttons down by 20% for a week.
 */
function honestyNote(s: LoopState, now: Date): LoopState {
  const today = dayKey(now);
  const rows = s.log.filter((r) => dayKey(new Date(r.at)) === today);
  const learned = rows.filter((r) => r.kind === 'learn');
  const checks = s.log.filter((r) => r.honesty && +new Date(r.at) > now.getTime() - 7 * 86_400_000);
  const easyShare = learned.length >= 5 ? learned.filter((r) => r.rating === 'easy').length / learned.length : 0;
  const missShare = checks.length >= 3 ? checks.filter((r) => r.honesty === 'missed').length / checks.length : 0;
  if (easyShare > 0.6 && missShare > 0.3) return { ...s, slowUntil: dayKey(addDays(now, 7)) };
  return s;
}

export const slowFactor = (s: LoopState, now = new Date()) => (s.slowUntil && s.slowUntil >= dayKey(now) ? 1.2 : 1);

// ---- mocks ---------------------------------------------------------------

/** A timed mock is offered weekly once there is enough seen to test. */
export function mockOffer(s: LoopState, bank: Question[], now = new Date()): number | null {
  const phase = ensureDay(s, bank, now).day.plan.phase;
  if (phase === 'examDay' || phase === 'after') return null;
  if (s.mockSnooze === dayKey(now)) return null;
  const seen = bank.filter((q) => !isNew(s.cards[q.id])).length;
  const lastMock = s.mocks.at(-1);
  const sinceLast = lastMock ? (now.getTime() - new Date(lastMock.at).getTime()) / 86_400_000 : Infinity;
  if (phase === 'cram') {
    // One mock on the morning of exam day − 2.
    return ensureDay(s, bank, now).day.plan.daysLeft === 2 && sinceLast >= 1 && now.getHours() < 13 ? 60 : null;
  }
  if (seen < 40 || sinceLast < 7) return null;
  return phase === 'revision' ? 180 : 60;
}

export const snoozeMock = () => update((s) => ({ ...s, mockSnooze: dayKey(new Date()) }));

/**
 * Mock answers feed the schedule: a wrong answer makes the card due now; a
 * right answer on a card due within three days counts as a Good review.
 */
export function recordMockResult(questions: Question[], answers: (number | null)[], minutes: number, now = new Date()) {
  update((s) => {
    const cards = { ...s.cards };
    let topics = s.topics;
    let domains = s.domains;
    const rows: LogRow[] = [];
    questions.forEach((q, k) => {
      const ok = answers[k] === q.answer;
      topics = record(topics, topicKey(q), ok);
      domains = record(domains, q.domain, ok);
      rows.push({ id: q.id, at: now.toISOString(), kind: 'mock', correct: ok, ms: 0 });
      const c = cards[q.id];
      if (!c || isNew(c)) return;
      if (!ok) cards[q.id] = { ...c, mem: { ...c.mem, due: now.toISOString() }, honesty: undefined };
      else if (new Date(c.mem.due) <= addDays(now, 3)) cards[q.id] = review(c, 'good', now, { examDate: s.profile.examDate }).rec;
    });
    const correct = questions.filter((q, k) => answers[k] === q.answer).length;
    return { ...s, cards, topics, domains, log: [...s.log, ...rows], mocks: [...s.mocks, { at: now.toISOString(), size: questions.length, correct, minutes }] };
  });
}

export function setOutcome(outcome: LoopState['outcome']) {
  update((s) => ({ ...s, outcome }));
}

/** Days in a row with at least one rated card, counting today if studied. */
export function streak(s: LoopState, now = new Date()) {
  const days = new Set(s.log.filter((r) => r.rating).map((r) => dayKey(new Date(r.at))));
  let n = 0;
  let d = new Date(now);
  if (!days.has(dayKey(d))) d = addDays(d, -1);
  while (days.has(dayKey(d))) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}
