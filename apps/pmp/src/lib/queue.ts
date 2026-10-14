import { isDue, type CardState } from './srs.ts';
import { accuracy, pickDrill, shuffle, topicKey, type TallyMap } from './stats.ts';
import type { Domain, Question } from './types.ts';

export const DAILY_SIZE = 20;

export const dueCards = (bank: Question[], cards: Record<string, CardState>, now = new Date()) =>
  bank
    .filter((q) => cards[q.id] && isDue(cards[q.id], now))
    .sort((a, b) => cards[a.id].due.localeCompare(cards[b.id].due));

/**
 * Today's review, as in the USS app: overdue cards first (oldest first),
 * then new questions to fill the session, weak topics first.
 */
export function dailyQueue(
  bank: Question[],
  cards: Record<string, CardState>,
  topics: TallyMap,
  size = DAILY_SIZE,
  now = new Date(),
): Question[] {
  const due = dueCards(bank, cards, now).slice(0, size);
  const fresh = shuffle(bank.filter((q) => !cards[q.id])).sort(
    (a, b) => (accuracy(topics[topicKey(a)]) ?? 1) - (accuracy(topics[topicKey(b)]) ?? 1),
  );
  return [...due, ...fresh.slice(0, Math.max(0, size - due.length))];
}

export function buildSession(
  mode: string,
  bank: Question[],
  p: { cards: Record<string, CardState>; topics: TallyMap; last: Record<string, boolean> },
  arg?: string | null,
): Question[] {
  switch (mode) {
    case 'review':
      return dailyQueue(bank, p.cards, p.topics);
    case 'drill':
      return pickDrill(bank, p.topics, p.last, 15);
    case 'domain':
      return shuffle(bank.filter((q) => q.domain === (arg as Domain))).slice(0, 20);
    case 'topic':
      return shuffle(bank.filter((q) => topicKey(q) === arg));
    case 'missed':
      return shuffle(bank.filter((q) => p.last[q.id] === false)).slice(0, 25);
    default:
      return [];
  }
}
