// Writes src/data/sample.json: the free questions anyone can try without
// paying. It is the only part of the bank shipped to the browser; the rest is
// served by /api/bank to licence holders.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const load = (d) => JSON.parse(readFileSync(join(root, 'src/data/questions', `${d}.json`), 'utf8'));

// Per domain, roughly in exam proportion: 15 questions.
const PICK = { people: 5, process: 6, business: 4 };

const sample = Object.entries(PICK).flatMap(([d, n]) => {
  const qs = load(d);
  // Spread across topics rather than taking the first n.
  const seen = new Set();
  const out = [];
  for (const q of qs) if (out.length < n && !seen.has(q.topic)) (seen.add(q.topic), out.push(q));
  for (const q of qs) if (out.length < n && !out.includes(q)) out.push(q);
  return out;
});

writeFileSync(join(root, 'src/data/sample.json'), JSON.stringify(sample, null, 2) + '\n');
console.log(`sample.json: ${sample.length} questions`);
