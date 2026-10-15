// SM-2 spaced repetition, ported from the Spaced Loop scheduler in the USS
// Recallio app (app/lib/core/scheduler/sm2_scheduler.dart). Same constants,
// same behaviour; only the rating comes from a multiple-choice answer
// instead of a self-rating.

export type Rating = 'again' | 'hard' | 'good' | 'easy';

export interface CardState {
  id: string;
  repetitions: number;
  ease: number;
  intervalDays: number;
  /** Local date the card is next due, as YYYY-MM-DD. */
  due: string;
  lapses: number;
}

const QUALITY: Record<Rating, number> = { again: 0, hard: 3, good: 4, easy: 5 };

export const dayKey = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const addDays = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export const newCard = (id: string, now = new Date()): CardState => ({
  id,
  repetitions: 0,
  ease: 2.5,
  intervalDays: 0,
  due: dayKey(now),
  lapses: 0,
});

/** A wrong answer is "again"; a right one is "good", or "hard" if guessed. */
export const ratingFor = (correct: boolean, guessed: boolean): Rating =>
  !correct ? 'again' : guessed ? 'hard' : 'good';

export function review(state: CardState, rating: Rating, now = new Date()): CardState {
  const q = QUALITY[rating];
  let repetitions: number;
  let interval: number;
  let lapses = state.lapses;

  if (q < 3) {
    // Wrong: restart so the question comes back tomorrow.
    repetitions = 0;
    interval = 1;
    if (state.repetitions > 0) lapses += 1;
  } else {
    if (state.repetitions === 0) interval = 1;
    else if (state.repetitions === 1) interval = 6;
    else interval = Math.min(36500, Math.max(1, Math.round(state.intervalDays * state.ease)));
    repetitions = state.repetitions + 1;
  }

  const ease = Math.max(1.3, state.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

  return {
    id: state.id,
    repetitions,
    ease,
    intervalDays: interval,
    due: dayKey(addDays(now, interval)),
    lapses,
  };
}

export const isDue = (s: CardState, now = new Date()) => s.due <= dayKey(now);
