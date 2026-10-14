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

/**
 * Weak-area drill: questions from topics answered below `threshold`, worst
 * topic first, wrong-before-unseen within a topic. Falls back to unseen
 * topics when there is not yet enough data to call anything weak.
 */
export function pickDrill(
  bank: Question[],
  topics: TallyMap,
  lastResult: Record<string, boolean>,
  size: number,
  threshold = 0.7,
): Question[] {
  const byTopic = new Map<string, Question[]>();
  for (const q of bank) {
    const k = topicKey(q);
    byTopic.set(k, [...(byTopic.get(k) ?? []), q]);
  }

  const scored = [...byTopic.keys()]
    .map((k) => ({ k, acc: accuracy(topics[k]) }))
    .filter((x) => x.acc !== null && x.acc < threshold)
    .sort((a, b) => (a.acc ?? 0) - (b.acc ?? 0));

  const rank = (q: Question) =>
    lastResult[q.id] === false ? 0 : lastResult[q.id] === undefined ? 1 : 2;

  const out: Question[] = [];
  for (const { k } of scored) {
    const qs = [...(byTopic.get(k) ?? [])].sort((a, b) => rank(a) - rank(b));
    for (const q of qs.slice(0, 5)) if (out.length < size) out.push(q);
  }
  if (out.length < size) {
    const seen = new Set(out.map((q) => q.id));
    const rest = bank
      .filter((q) => !seen.has(q.id))
      .sort((a, b) => rank(a) - rank(b) || Math.random() - 0.5);
    out.push(...rest.slice(0, size - out.length));
  }
  return out;
}

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
