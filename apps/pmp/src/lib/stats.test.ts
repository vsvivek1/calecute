import { test } from 'node:test';
import assert from 'node:assert/strict';
import { band, pickMock } from './stats.ts';
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

test('bands', () => {
  assert.equal(band(0.85), 'Above Target');
  assert.equal(band(0.7), 'Target');
  assert.equal(band(0.55), 'Below Target');
  assert.equal(band(0.3), 'Needs Improvement');
});
