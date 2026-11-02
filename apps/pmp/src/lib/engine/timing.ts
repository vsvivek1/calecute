// Minimum time on a card. Buttons unlock only after the learner has had time
// to read; the clock runs only while the page is visible.

import type { Question } from '../types.ts';

export const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

// Adults reading situational questions closely: about 4 words a second for
// the question and options, 3.5 for the explanation they need to take in.

/** Seconds before "Check answer" unlocks. */
export const readSeconds = (q: Question, slow = 1) =>
  Math.round(clamp(words(q.stem + ' ' + q.options.join(' ')) / 4, 5, 25) * slow);

/** Seconds after the answer shows before the rating buttons unlock. */
export const rateSeconds = (q: Question, slow = 1) =>
  Math.round(clamp(words(q.explanation) / 3.5, 4, 20) * slow);

/** Rough minutes a card takes, for the quota line. */
export const CARD_MINUTES = 1.2;
