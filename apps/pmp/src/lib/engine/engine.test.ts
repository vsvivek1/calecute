import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addDays, capForExam, classify, dayKey, dueAt, fromSm2, isDueOn, newRec, recall, review, type CardRec, type Rating } from './scheduler.ts';
import { dailyPlan } from './plan.ts';
import { arrange, buildSitting, MAX_SITTING, orderNew } from './sitting.ts';
import { focusSize, reportDue, weekKey, weeklyReport, type LogRow } from './report.ts';
import { rateSeconds, readSeconds } from './timing.ts';
import type { Question } from '../types.ts';

const mk = (id: string, domain: Question['domain'], topic: string, difficulty: 1 | 2 | 3 = 2): Question => ({
  id, domain, topic, approach: 'agile', difficulty, stem: 'word '.repeat(60), options: ['a', 'b', 'c', 'd'], answer: 0, explanation: 'word '.repeat(40),
});

const bank: Question[] = [
  ...Array.from({ length: 60 }, (_, i) => mk(`p${i}`, 'people', i % 2 ? 'Conflict' : 'Leadership', ((i % 3) + 1) as 1 | 2 | 3)),
  ...Array.from({ length: 80 }, (_, i) => mk(`r${i}`, 'process', i % 2 ? 'Risk' : 'Scope', ((i % 3) + 1) as 1 | 2 | 3)),
  ...Array.from({ length: 40 }, (_, i) => mk(`b${i}`, 'business', 'Ethics', ((i % 3) + 1) as 1 | 2 | 3)),
];

const now = new Date('2026-10-20T09:00:00');
const exam = '2026-12-20';
const rate = (c: CardRec, r: Rating, at: Date, rand = () => 0.99) => review(c, r, at, { examDate: exam, rand }).rec;

test('ratings give sane, growing intervals', () => {
  const days = (c: CardRec, from: Date) => Math.round((dueAt(c).getTime() - from.getTime()) / 86_400_000);
  const easy = rate(newRec('x', now), 'easy', now);
  const good = rate(newRec('x', now), 'good', now);
  const hard = rate(newRec('x', now), 'hard', now);
  const again = rate(newRec('x', now), 'again', now);
  assert.ok(days(easy, now) > days(good, now), 'easy beyond good');
  assert.ok(days(good, now) >= days(hard, now), 'good at least hard');
  assert.ok(days(again, now) <= 1, 'again comes back within a day');
  // A second Good grows the interval.
  const later = dueAt(good);
  const good2 = rate(good, 'good', later);
  assert.ok(days(good2, later) > days(good, now));
});

test('no review is scheduled after exam day minus 3', () => {
  let c = newRec('x', now);
  let at = now;
  const cap = new Date('2026-12-17T00:00:00');
  while (at < cap) {
    c = rate(c, 'easy', at);
    at = dueAt(c);
  }
  assert.ok(dayKey(dueAt(c)) <= '2026-12-17', `due ${dayKey(dueAt(c))}`);
  // Inside the last three days, tomorrow at the latest.
  const close = new Date('2026-12-18T10:00:00');
  assert.equal(dayKey(capForExam(new Date('2027-03-01'), close, exam)), '2026-12-19');
});

test('first-time "So simple" sometimes gets an honesty check; a miss resets the card', () => {
  const checked = review(newRec('x', now), 'easy', now, { examDate: exam, rand: () => 0.1 }).rec;
  assert.ok(checked.honesty, 'check scheduled');
  assert.ok(dueAt(checked) < new Date(checked.mem.due));
  const at = dueAt(checked);
  const passed = review(checked, 'good', at, { examDate: exam });
  assert.equal(passed.honesty, 'passed');
  assert.equal(passed.rec.mem.due, checked.honesty!.keepDue);
  const missed = review(checked, 'again', at, { examDate: exam });
  assert.equal(missed.honesty, 'missed');
  assert.equal(missed.rec.honestyMisses, 1);
  assert.ok(dueAt(missed.rec).getTime() - at.getTime() <= 86_400_000 * 1.5);
  const unchecked = review(newRec('x', now), 'easy', now, { examDate: exam, rand: () => 0.9 }).rec;
  assert.equal(unchecked.honesty, undefined);
});

test('tough → easy classification', () => {
  let c = newRec('x', now);
  c = rate(c, 'hard', now);
  c = rate(c, 'again', addDays(now, 1));
  assert.equal(classify(c), 'stillTough');
  c = rate(c, 'good', addDays(now, 3));
  c = rate(c, 'easy', addDays(now, 8));
  assert.equal(classify(c), 'becameEasy');
  c = rate(c, 'again', addDays(now, 30));
  assert.equal(classify(c), 'slipped');
});

test('v1 SM-2 progress migrates without losing due dates', () => {
  const r = fromSm2({ id: 'p1', repetitions: 3, ease: 2.6, intervalDays: 15, due: '2026-11-01', lapses: 0 });
  assert.equal(dayKey(new Date(r.mem.due)), '2026-11-01');
  assert.ok(r.mem.stability >= 15);
  assert.ok(recall(r, now) > 0.5);
  const wrong = fromSm2({ id: 'p2', repetitions: 0, ease: 2.3, intervalDays: 1, due: '2026-10-19', lapses: 0 });
  assert.ok(isDueOn(wrong, now));
  assert.equal(wrong.everTough, true);
});

test('plan works back from the exam date', () => {
  const p = dailyPlan({ today: now, examDate: exam, newLeft: 180, dueToday: 0, minutesPerDay: 60 });
  assert.equal(p.phase, 'learn');
  assert.equal(p.daysLeft, 61);
  assert.ok(p.newToday >= 3 && p.newToday <= 5, `new ${p.newToday}`);
  const cram = dailyPlan({ today: new Date('2026-12-18T08:00'), examDate: exam, newLeft: 10, dueToday: 4, minutesPerDay: 60 });
  assert.equal(cram.phase, 'cram');
  assert.equal(cram.newToday, 0);
  assert.equal(dailyPlan({ today: new Date('2026-12-20T07:00'), examDate: exam, newLeft: 0, dueToday: 0, minutesPerDay: 30 }).phase, 'examDay');
  assert.equal(dailyPlan({ today: new Date('2026-12-22T07:00'), examDate: exam, newLeft: 0, dueToday: 0, minutesPerDay: 30 }).phase, 'after');
  const tight = dailyPlan({ today: now, examDate: '2026-10-30', newLeft: 180, dueToday: 10, minutesPerDay: 15 });
  assert.equal(tight.behind, true);
  assert.ok(tight.quota <= 13);
});

test('a sitting never holds more than 10 cards and never repeats one', () => {
  const s = buildSitting({ bank, cards: {}, topics: {}, now, slots: 30, newBudget: 30, againToday: [], kind: 'quota' });
  assert.equal(s.length, MAX_SITTING);
  const ids = s.flatMap((x) => (x.t === 'q' ? [x.id] : []));
  assert.equal(new Set(ids).size, ids.length);
});

test('sittings put earlier misses and due cards first, and respect the new-card budget', () => {
  const cards: Record<string, CardRec> = {};
  for (const id of ['p1', 'p2', 'p3', 'r1', 'r2', 'r3', 'b1']) {
    cards[id] = rate(newRec(id, addDays(now, -10)), 'good', addDays(now, -10));
  }
  const s = buildSitting({ bank, cards, topics: {}, now, slots: 10, newBudget: 2, againToday: ['r5'], kind: 'quota' });
  const qs = s.filter((x) => x.t === 'q') as { id: string; why: string }[];
  assert.ok(qs.some((x) => x.id === 'r5' && x.why === 'again'));
  assert.equal(qs.filter((x) => x.why === 'new').length, 2);
  assert.equal(qs.filter((x) => x.why === 'review').length, 7);
});

test('sittings start and end with the easiest card', () => {
  const qs = [mk('a', 'people', 'A', 3), mk('b', 'people', 'B', 1), mk('c', 'process', 'C', 2), mk('d', 'process', 'D', 1), mk('e', 'business', 'E', 3)];
  const out = arrange(qs.map((q) => ({ q, why: 'new' as const })), {}, now);
  assert.equal(out[0].q.difficulty, 1);
  assert.equal(out.at(-1)!.q.difficulty, 1);
});

test('new cards follow exam domain weights', () => {
  const picked = orderNew(bank, {}, {}, 100);
  const n = (d: string) => picked.filter((q) => q.domain === d).length;
  assert.ok(Math.abs(n('people') - 33) <= 2);
  assert.ok(Math.abs(n('process') - 41) <= 2);
  assert.ok(Math.abs(n('business') - 26) <= 2);
});

test('exam day: easy wins and the checklist', () => {
  const cards: Record<string, CardRec> = {};
  for (const q of bank.slice(0, 20)) cards[q.id] = rate(newRec(q.id, now), 'good', now);
  const s = buildSitting({ bank, cards, topics: {}, now, slots: 10, newBudget: 0, againToday: [], kind: 'examday' });
  assert.equal(s.at(-1)!.t, 'examday');
  assert.equal(s.filter((x) => x.t === 'q').length, 10);
});

test('weekly report: due from Sunday, once per week', () => {
  const sunday = new Date('2026-10-25T18:00:00');
  const log: LogRow[] = [{ id: 'p1', at: '2026-10-21T08:00:00.000Z', kind: 'learn', correct: true, rating: 'good', ms: 60000 }];
  assert.equal(reportDue(sunday, log, undefined), weekKey(sunday));
  assert.equal(reportDue(sunday, log, weekKey(sunday)), null);
  const monday = new Date('2026-10-26T08:00:00');
  assert.equal(reportDue(monday, log, undefined), '2026-10-19');
  const r = weeklyReport({ week: '2026-10-19', bank, cards: {}, log, sittings: 1, mocks: [], checks: [], examDate: exam, now: sunday });
  assert.equal(r.daysStudied, 1);
  assert.equal(r.minutes, 1);
  assert.equal(r.daysLeft, 56);
});

test('quick checks shrink the sitting when focus dips', () => {
  assert.equal(focusSize([]), 10);
  assert.equal(focusSize([{ at: '', correct: 1, total: 4, medianMs: 2000, instantRate: 0 }]), 5);
  assert.equal(focusSize([{ at: '', correct: 4, total: 4, medianMs: 9000, instantRate: 0.1 }]), 10);
});

test('minimum times stay within bounds', () => {
  const q = bank[0];
  assert.equal(readSeconds(q), 16);
  assert.equal(rateSeconds(q), 11);
  assert.equal(readSeconds({ ...q, stem: 'x' }), 5);
});
