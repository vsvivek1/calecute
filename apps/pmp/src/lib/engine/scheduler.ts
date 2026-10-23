// Spaced Loop scheduler for PMP Prep: FSRS (ts-fsrs) behind our own
// functions, so the rest of the app never touches the library directly.
//
// Four ratings, always the same buttons:
//   Didn't get it → Again · Tough → Hard · Understood → Good · So simple → Easy

import { createEmptyCard, fsrs, Rating as R, State, type Card } from 'ts-fsrs';

export type Rating = 'again' | 'hard' | 'good' | 'easy';

export const RATINGS: { id: Rating; label: string }[] = [
  { id: 'again', label: "Didn't get it" },
  { id: 'hard', label: 'Tough' },
  { id: 'good', label: 'Understood' },
  { id: 'easy', label: 'So simple' },
];

const GRADE = { again: R.Again, hard: R.Hard, good: R.Good, easy: R.Easy } as const;

// Day-based intervals only: a "Didn't get it" comes back at the end of the
// sitting (or first in the next one), handled by the sitting builder, not by
// minute-long learning steps.
const f = fsrs({ request_retention: 0.9, enable_fuzz: true, enable_short_term: false });

/** FSRS card with dates as ISO strings, so it survives JSON storage. */
export interface Memory {
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: number;
  last_review?: string;
}

export interface CardRec {
  id: string;
  mem: Memory;
  /** Last three ratings, oldest first. */
  last: Rating[];
  /** Rated Tough or Didn't get it at least once. */
  everTough: boolean;
  honestyMisses: number;
  /** A pending honesty check after a first-time "So simple". */
  honesty?: { due: string; keepDue: string };
}

const toMem = (c: Card): Memory => ({
  due: c.due.toISOString(),
  stability: c.stability,
  difficulty: c.difficulty,
  elapsed_days: c.elapsed_days,
  scheduled_days: c.scheduled_days,
  learning_steps: c.learning_steps,
  reps: c.reps,
  lapses: c.lapses,
  state: c.state,
  last_review: c.last_review?.toISOString(),
});

const toCard = (m: Memory): Card => ({
  ...m,
  due: new Date(m.due),
  last_review: m.last_review ? new Date(m.last_review) : undefined,
  state: m.state as State,
});

export const newRec = (id: string, now = new Date()): CardRec => ({
  id,
  mem: toMem(createEmptyCard(now)),
  last: [],
  everTough: false,
  honestyMisses: 0,
});

export const isNew = (c: CardRec | undefined) => !c || c.mem.reps === 0;

/** When the card next wants to be seen (an honesty check pulls it forward). */
export const dueAt = (c: CardRec) => new Date(c.honesty?.due ?? c.mem.due);

const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
export const isDueOn = (c: CardRec, day: Date) => !isNew(c) && dueAt(c) <= endOfDay(day);

/** Predicted chance of recalling the card at `at` (0–1). New cards: 0. */
export const recall = (c: CardRec | undefined, at = new Date()) =>
  !c || isNew(c) ? 0 : f.get_retrievability(toCard(c.mem), at, false);

/** Local midnight of a YYYY-MM-DD date. */
export const parseDay = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, d.getHours(), d.getMinutes());

/**
 * Never schedule a review after exam day − 3, so every card is seen once more
 * before cram mode. Inside the last three days, reviews come back tomorrow at
 * the latest.
 */
export function capForExam(due: Date, now: Date, examDate: string | null): Date {
  if (!examDate) return due;
  const cap = addDays(parseDay(examDate), -3);
  if (cap > now) return due > cap ? cap : due;
  const tomorrow = addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()), 1);
  return due > tomorrow ? tomorrow : due;
}

export type Classification = 'becameEasy' | 'stillTough' | 'slipped' | null;

const tough = (r: Rating) => r === 'again' || r === 'hard';
const fine = (r: Rating) => r === 'good' || r === 'easy';

export function classify(c: CardRec): Classification {
  const l = c.last;
  if (l.length >= 2 && l.slice(-3).filter(tough).length >= 2) return 'stillTough';
  if (l.length >= 2 && l.at(-1) === 'again' && fine(l.at(-2)!)) return 'slipped';
  if (c.everTough && l.length >= 2 && fine(l.at(-1)!) && fine(l.at(-2)!)) return 'becameEasy';
  return null;
}

export interface ReviewOpts {
  examDate: string | null;
  /** Random source, injectable for tests. */
  rand?: () => number;
}

export interface ReviewResult {
  rec: CardRec;
  /** Set when this review was an honesty check. */
  honesty?: 'passed' | 'missed';
}

export function review(prev: CardRec, rating: Rating, now: Date, opts: ReviewOpts): ReviewResult {
  const rand = opts.rand ?? Math.random;
  const base = {
    ...prev,
    last: [...prev.last, rating].slice(-3),
    everTough: prev.everTough || tough(rating),
  };

  // An honesty check: right keeps the long "So simple" interval, wrong
  // resets the card.
  if (prev.honesty) {
    if (tough(rating)) {
      const next = f.next(toCard(prev.mem), now, R.Again).card;
      next.due = capForExam(next.due, now, opts.examDate);
      return {
        rec: { ...base, mem: toMem(next), honesty: undefined, honestyMisses: prev.honestyMisses + 1 },
        honesty: 'missed',
      };
    }
    return { rec: { ...base, mem: { ...prev.mem, due: prev.honesty.keepDue }, honesty: undefined }, honesty: 'passed' };
  }

  // A card that keeps being tough gets a shorter interval once more.
  const grade = rating === 'hard' && classify(prev) === 'stillTough' ? R.Again : GRADE[rating];
  const next = f.next(toCard(prev.mem), now, grade).card;
  next.due = capForExam(next.due, now, opts.examDate);
  const rec: CardRec = { ...base, mem: toMem(next) };

  // About 1 in 5 first-time "So simple" ratings come back in 1–3 days as a check.
  if (rating === 'easy' && prev.mem.reps === 0 && rand() < 0.2) {
    const checkDue = addDays(now, 1 + Math.floor(rand() * 3));
    if (checkDue < next.due) rec.honesty = { due: checkDue.toISOString(), keepDue: rec.mem.due };
  }
  return { rec };
}

/** Old SM-2 state from PMP Prep v1. */
export interface Sm2State {
  id: string;
  repetitions: number;
  ease: number;
  intervalDays: number;
  due: string;
  lapses: number;
}

/**
 * Carry v1 progress over: interval becomes stability, ease becomes FSRS
 * difficulty, the due date is kept. Nothing a learner earned is lost.
 */
export function fromSm2(s: Sm2State, now = new Date()): CardRec {
  const rec = newRec(s.id, now);
  if (s.repetitions === 0 && s.lapses === 0) {
    // Answered once and wrong: treat as a lapsed card due on its old date.
    const due = parseDay(s.due);
    return {
      ...rec,
      mem: { ...rec.mem, state: State.Relearning, reps: 1, stability: 0.5, difficulty: 7, due: due.toISOString(), last_review: addDays(due, -1).toISOString(), scheduled_days: 1 },
      last: ['again'],
      everTough: true,
    };
  }
  const due = parseDay(s.due);
  const interval = Math.max(1, s.intervalDays);
  const difficulty = Math.min(10, Math.max(1, 5 + (2.5 - s.ease) * 2.5));
  const wasWrong = s.repetitions === 0;
  return {
    ...rec,
    mem: {
      ...rec.mem,
      state: wasWrong ? State.Relearning : State.Review,
      reps: Math.max(1, s.repetitions + s.lapses),
      lapses: s.lapses,
      stability: wasWrong ? 1 : interval,
      difficulty,
      scheduled_days: interval,
      due: due.toISOString(),
      last_review: addDays(due, -interval).toISOString(),
    },
    last: wasWrong ? ['again'] : ['good'],
    everTough: s.lapses > 0 || s.ease < 2.5,
  };
}
