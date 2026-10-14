import { test } from 'node:test';
import assert from 'node:assert/strict';
import { band, pickDrill, pickMock, record, type TallyMap } from './stats.ts';
import { dailyQueue } from './queue.ts';
import { newCard } from './srs.ts';
import type { Question } from './types.ts';

const mk = (id: string, domain: Question['domain'], topic: string): Question => ({
  id, domain, topic, approach: 'agile', difficulty: 2, stem: id, options: ['a', 'b', 'c', 'd'], answer: 0, explanation: '',
});

const bank: Question[] = [
  ...Array.from({ length: 60 }, (_, i) => mk(`p${i}`, 'people', i % 2 ? 'Conflict' : 'Leadership')),
  ...Array.from({ length: 80 }, (_, i) => mk(`r${i}`, 'process', i % 2 ? 'Risk' : 'Scope')),
  ...Array.from({ length: 40 }, (_, i) => mk(`b${i}`, 'business', 'Ethics')),
];

test('mock exams follow domain weights and never repeat a question', () => {
  const m = pickMock(bank, 60, [
    { id: 'people', weight: 0.33 },
    { id: 'process', weight: 0.41 },
    { id: 'business', weight: 0.26 },
  ]);
  assert.equal(m.length, 60);
  assert.equal(new Set(m.map((q) => q.id)).size, 60);
  assert.equal(m.filter((q) => q.domain === 'people').length, 20);
  assert.equal(m.filter((q) => q.domain === 'process').length, 25);
  assert.equal(m.filter((q) => q.domain === 'business').length, 15);
});

test('drills start with the weakest topic and prefer questions last missed', () => {
  let topics: TallyMap = {};
  for (let i = 0; i < 4; i++) topics = record(topics, 'process:Risk', i === 0);
  for (let i = 0; i < 4; i++) topics = record(topics, 'people:Conflict', i < 2);
  for (let i = 0; i < 4; i++) topics = record(topics, 'process:Scope', true);
  const d = pickDrill(bank, topics, { r1: false }, 15);
  assert.equal(d.length, 15);
  assert.equal(d[0].id, 'r1');
  assert.ok(d.slice(0, 5).every((q) => q.topic === 'Risk'));
  assert.ok(d.slice(5, 10).every((q) => q.topic === 'Conflict'));
  assert.ok(!d.slice(0, 10).some((q) => q.topic === 'Scope'));
});

test('daily review puts due cards first, then new ones', () => {
  const now = new Date('2026-10-14T09:00:00');
  const cards = {
    p1: { ...newCard('p1'), repetitions: 1, due: '2026-10-10' },
    p2: { ...newCard('p2'), repetitions: 1, due: '2026-10-13' },
    p3: { ...newCard('p3'), repetitions: 1, due: '2026-10-30' },
  };
  const q = dailyQueue(bank, cards, {}, 20, now);
  assert.equal(q.length, 20);
  assert.deepEqual(q.slice(0, 2).map((x) => x.id), ['p1', 'p2']);
  assert.ok(!q.some((x) => x.id === 'p3'));
});

test('bands', () => {
  assert.equal(band(0.85), 'Above Target');
  assert.equal(band(0.7), 'Target');
  assert.equal(band(0.55), 'Below Target');
  assert.equal(band(0.3), 'Needs Improvement');
});
