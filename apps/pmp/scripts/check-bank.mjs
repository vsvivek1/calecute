// Structural checks on the question bank. Run before shipping new questions.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const all = ['people', 'process', 'business'].flatMap((d) =>
  JSON.parse(readFileSync(join(root, 'src/data/questions', `${d}.json`), 'utf8')),
);

const problems = [];
const ids = new Set();
const stems = new Set();
for (const q of all) {
  const where = q.id ?? '(no id)';
  if (ids.has(q.id)) problems.push(`${where}: duplicate id`);
  ids.add(q.id);
  const stem = q.stem?.trim().toLowerCase();
  if (stems.has(stem)) problems.push(`${where}: duplicate stem`);
  stems.add(stem);
  if (!['people', 'process', 'business'].includes(q.domain)) problems.push(`${where}: bad domain`);
  if (!['predictive', 'agile', 'hybrid'].includes(q.approach)) problems.push(`${where}: bad approach`);
  if (!Array.isArray(q.options) || q.options.length !== 4) problems.push(`${where}: needs 4 options`);
  else if (new Set(q.options.map((o) => o.trim().toLowerCase())).size !== 4) problems.push(`${where}: repeated option`);
  if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) problems.push(`${where}: bad answer index`);
  if (!q.explanation || q.explanation.length < 40) problems.push(`${where}: explanation too short`);
  if (!q.topic) problems.push(`${where}: no topic`);
}

const dist = [0, 1, 2, 3].map((i) => all.filter((q) => q.answer === i).length);
console.log(`${all.length} questions; answer positions A-D: ${dist.join(' / ')}`);
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
