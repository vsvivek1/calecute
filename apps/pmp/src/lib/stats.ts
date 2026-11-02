import type { Domain, Question } from './types.ts';

export interface Tally {
  total: number;
  correct: number;
}

export type TallyMap = Record<string, Tally>;

export const accuracy = (t: Tally | undefined, minSamples = 2) =>
  !t || t.total < minSamples ? null : t.correct / t.total;

export function record(map: TallyMap, key: string, correct: boolean): TallyMap {
  const t = map[key] ?? { total: 0, correct: 0 };
  return { ...map, [key]: { total: t.total + 1, correct: t.correct + (correct ? 1 : 0) } };
}

export const topicKey = (q: Pick<Question, 'domain' | 'topic'>) => `${q.domain}:${q.topic}`;

export function shuffle<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** A mock exam drawn in proportion to the exam's domain weights. */
export function pickMock(
  bank: Question[],
  size: number,
  weights: { id: Domain; weight: number }[],
): Question[] {
  const out: Question[] = [];
  weights.forEach((w, i) => {
    const pool = shuffle(bank.filter((q) => q.domain === w.id));
    const want =
      i === weights.length - 1 ? size - out.length : Math.round(size * w.weight);
    out.push(...pool.slice(0, want));
  });
  // Top up from anywhere if a domain ran short.
  if (out.length < size) {
    const have = new Set(out.map((q) => q.id));
    out.push(...shuffle(bank.filter((q) => !have.has(q.id))).slice(0, size - out.length));
  }
  return shuffle(out).slice(0, size);
}

/**
 * PMI reports four bands per domain rather than a pass mark. These cut-offs
 * are our estimate, not PMI's, and the UI says so.
 */
export function band(pct: number) {
  if (pct >= 0.8) return 'Above Target';
  if (pct >= 0.65) return 'Target';
  if (pct >= 0.5) return 'Below Target';
  return 'Needs Improvement';
}
