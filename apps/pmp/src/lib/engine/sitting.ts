// Building one sitting: at most 10 cards, chosen by the app.

import { classify, dueAt, isDueOn, isNew, recall, type CardRec } from './scheduler.ts';
import { accuracy, shuffle, topicKey, type TallyMap } from '../stats.ts';
import { DOMAINS, type Question } from '../types.ts';

export type Why = 'new' | 'review' | 'again' | 'honesty' | 'cram' | 'win' | 'bonus';

export type FeedItem =
  | { t: 'q'; id: string; why: Why }
  | { t: 'welcome'; daysAway: number }
  | { t: 'report'; week: string }
  | { t: 'check'; ids: string[]; retention?: boolean }
  | { t: 'examday' }
  | { t: 'after' };

export const MAX_SITTING = 10;

export interface SittingInput {
  bank: Question[];
  cards: Record<string, CardRec>;
  topics: TallyMap;
  now: Date;
  /** Cards still to do today for the quota (or the bonus/cram size). */
  slots: number;
  /** New cards still allowed today. */
  newBudget: number;
  /** Cards rated "Didn't get it" earlier today and not yet seen again. */
  againToday: string[];
  kind: 'quota' | 'bonus' | 'cram' | 'examday';
  /** Special one-slot cards to fit in (report, quick check, welcome). */
  specials?: FeedItem[];
}

const byId = (bank: Question[]) => new Map(bank.map((q) => [q.id, q]));

/**
 * New cards in the order the exam weights them: each pick goes to the domain
 * furthest below its share of what the learner has seen, then the weakest
 * topic in it, then the easiest question.
 */
export function orderNew(bank: Question[], cards: Record<string, CardRec>, topics: TallyMap, n: number): Question[] {
  const seenByDomain: Record<string, number> = {};
  for (const q of bank) if (!isNew(cards[q.id])) seenByDomain[q.domain] = (seenByDomain[q.domain] ?? 0) + 1;
  const pools = new Map(
    DOMAINS.map((d) => [
      d.id,
      shuffle(bank.filter((q) => q.domain === d.id && isNew(cards[q.id]))).sort(
        (a, b) =>
          (accuracy(topics[topicKey(a)]) ?? 0.75) - (accuracy(topics[topicKey(b)]) ?? 0.75) || a.difficulty - b.difficulty,
      ),
    ]),
  );
  const out: Question[] = [];
  while (out.length < n) {
    const total = Object.values(seenByDomain).reduce((s, x) => s + x, 0) + 1;
    const open = DOMAINS.filter((d) => pools.get(d.id)!.length);
    if (!open.length) break;
    const d = open.sort((a, b) => (seenByDomain[a.id] ?? 0) / total - a.weight - ((seenByDomain[b.id] ?? 0) / total - b.weight))[0];
    out.push(pools.get(d.id)!.shift()!);
    seenByDomain[d.id] = (seenByDomain[d.id] ?? 0) + 1;
  }
  return out;
}

/** Due reviews, most at risk first; cards with a tough history ahead of ties. */
export function dueReviews(bank: Question[], cards: Record<string, CardRec>, now: Date): Question[] {
  return bank
    .filter((q) => cards[q.id] && isDueOn(cards[q.id], now))
    .sort((a, b) => {
      const ca = cards[a.id], cb = cards[b.id];
      return recall(ca, now) - recall(cb, now) || Number(cb.everTough) - Number(ca.everTough);
    });
}

/** How likely a card is to be an easy win (higher is easier). */
export function ease(q: Question, c: CardRec | undefined, now: Date) {
  if (!c || isNew(c)) return (4 - q.difficulty) / 4;
  return recall(c, now) * (1 - c.mem.difficulty / 12);
}

/**
 * Easiest card first and last, harder ones in between, and no two cards
 * from the same topic back to back where it can be avoided.
 */
export function arrange(items: { q: Question; why: Why }[], cards: Record<string, CardRec>, now: Date) {
  if (items.length <= 2) return items;
  const sorted = [...items].sort((a, b) => ease(b.q, cards[b.q.id], now) - ease(a.q, cards[a.q.id], now));
  const first = sorted.shift()!;
  const last = sorted.shift()!;
  const middle: typeof items = [];
  const rest = sorted.reverse();
  while (rest.length) {
    const prev = middle.at(-1) ?? first;
    const k = rest.findIndex((x) => topicKey(x.q) !== topicKey(prev.q));
    middle.push(rest.splice(k === -1 ? 0 : k, 1)[0]);
  }
  return [first, ...middle, last];
}

export function buildSitting(inp: SittingInput): FeedItem[] {
  const { bank, cards, now } = inp;
  const qs = byId(bank);
  const specials = inp.specials ?? [];

  if (inp.kind === 'examday') {
    const wins = bank
      .filter((q) => !isNew(cards[q.id]))
      .sort((a, b) => ease(b, cards[b.id], now) - ease(a, cards[a.id], now))
      .slice(0, MAX_SITTING);
    return [...wins.map((q) => ({ t: 'q' as const, id: q.id, why: 'win' as const })), { t: 'examday' as const }];
  }

  const slots = Math.max(0, Math.min(MAX_SITTING, inp.slots) - specials.length);
  const picked: { q: Question; why: Why }[] = [];
  const has = (id: string) => picked.some((p) => p.q.id === id);
  const add = (q: Question | undefined, why: Why) => {
    if (q && !has(q.id) && picked.length < slots) picked.push({ q, why });
  };

  if (inp.kind === 'cram') {
    // Still-tough cards, then anything ever tough, then the least remembered.
    const seen = bank.filter((q) => !isNew(cards[q.id]));
    const rank = (q: Question) => {
      const c = cards[q.id];
      return (classify(c) === 'stillTough' ? 0 : c.everTough ? 1 : 2) + recall(c, now);
    };
    inp.againToday.slice(0, 2).forEach((id) => add(qs.get(id), 'again'));
    seen.sort((a, b) => rank(a) - rank(b)).forEach((q) => add(q, 'cram'));
  } else {
    inp.againToday.slice(0, 2).forEach((id) => add(qs.get(id), 'again'));
    const due = dueReviews(bank, cards, now);
    const reviewShare = inp.kind === 'bonus' ? slots : Math.ceil(slots * 0.6);
    for (const q of due) {
      if (picked.length >= reviewShare) break;
      add(q, cards[q.id].honesty && dueAt(cards[q.id]) <= now ? 'honesty' : 'review');
    }
    const newMax = Math.min(inp.newBudget, inp.kind === 'bonus' ? 5 : slots);
    orderNew(bank, cards, inp.topics, newMax).forEach((q) => add(q, 'new'));
    due.forEach((q) => add(q, cards[q.id].honesty ? 'honesty' : 'review'));
    if (inp.kind === 'bonus') {
      // Pull reviews due in the next two days slightly early.
      const soon = new Date(now.getTime() + 2 * 86_400_000);
      bank
        .filter((q) => cards[q.id] && !isNew(cards[q.id]) && dueAt(cards[q.id]) <= soon)
        .sort((a, b) => dueAt(cards[a.id]).getTime() - dueAt(cards[b.id]).getTime())
        .forEach((q) => add(q, 'bonus'));
    }
  }

  const cardsOut: FeedItem[] = arrange(picked, cards, now).map((p) => ({ t: 'q', id: p.q.id, why: p.why }));
  // Report and welcome open the sitting; a quick check sits in the middle.
  const lead = specials.filter((s) => s.t === 'welcome' || s.t === 'report' || (s.t === 'check' && s.retention));
  const mid = specials.filter((s) => s.t === 'check' && !s.retention);
  const half = Math.ceil(cardsOut.length / 2);
  return [...lead, ...cardsOut.slice(0, half), ...mid, ...cardsOut.slice(half)];
}
