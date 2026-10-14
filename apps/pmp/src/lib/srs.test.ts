import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isDue, newCard, ratingFor, review } from './srs.ts';

const day = (s: string) => new Date(`${s}T09:00:00`);

test('a right answer walks the SM-2 ladder 1 → 6 → 6×ease days', () => {
  let c = newCard('q', day('2026-10-14'));
  c = review(c, 'good', day('2026-10-14'));
  assert.equal(c.intervalDays, 1);
  assert.equal(c.due, '2026-10-15');
  c = review(c, 'good', day('2026-10-15'));
  assert.equal(c.intervalDays, 6);
  assert.equal(c.due, '2026-10-21');
  c = review(c, 'good', day('2026-10-21'));
  assert.equal(c.intervalDays, 15); // 6 × 2.5
});

test('a wrong answer resets to tomorrow and counts a lapse once learned', () => {
  let c = newCard('q', day('2026-10-14'));
  c = review(c, 'good', day('2026-10-14'));
  c = review(c, 'again', day('2026-10-15'));
  assert.equal(c.repetitions, 0);
  assert.equal(c.intervalDays, 1);
  assert.equal(c.lapses, 1);
  assert.equal(c.due, '2026-10-16');
});

test('ease never drops below 1.3', () => {
  let c = newCard('q');
  for (let i = 0; i < 20; i++) c = review(c, 'again');
  assert.equal(c.ease, 1.3);
});

test('guessing a right answer is rated hard, not good', () => {
  assert.equal(ratingFor(true, true), 'hard');
  assert.equal(ratingFor(true, false), 'good');
  assert.equal(ratingFor(false, false), 'again');
  assert.equal(ratingFor(false, true), 'again');
});

test('a card is due on and after its due date', () => {
  const c = { ...newCard('q'), due: '2026-10-15' };
  assert.equal(isDue(c, day('2026-10-14')), false);
  assert.equal(isDue(c, day('2026-10-15')), true);
  assert.equal(isDue(c, day('2026-10-20')), true);
});
