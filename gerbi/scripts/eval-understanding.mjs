// Field-level accuracy of the understanding engine on a labeled corpus (tests/fixtures/requests-he.json).
//   node scripts/eval-understanding.mjs [--holdout | --en] [--failures]
import { readFile } from 'node:fs/promises';
import { understandRequest } from '../dist/brief-engine.mjs';

// --en: the English corpus (spec 21); brief.month stays the canonical Hebrew month name in both languages.
const file = process.argv.includes('--en') ? 'requests-en.json' : process.argv.includes('--holdout') ? 'requests-he-holdout.json' : 'requests-he.json';
const corpus = JSON.parse(await readFile(new URL(`../tests/fixtures/${file}`, import.meta.url), 'utf8'));
const same = (a, b) => JSON.stringify(Array.isArray(a) ? [...a].sort() : a) === JSON.stringify(Array.isArray(b) ? [...b].sort() : b);
let fields = 0, correct = 0, perfect = 0;
const failures = [], byField = {};
for (const { text, expect } of corpus) {
  const { brief } = understandRequest(text, {}, { today: '2026-10-29' });
  let ok = true;
  for (const [field, value] of Object.entries(expect)) {
    fields++; byField[field] ||= [0, 0]; byField[field][1]++;
    if (same(brief[field], value)) { correct++; byField[field][0]++; }
    else { ok = false; failures.push(`${field}: got ${JSON.stringify(brief[field])} want ${JSON.stringify(value)}  ← ${text}`); }
  }
  if (ok) perfect++;
}
export const result = { fieldAccuracy: correct / fields, requestAccuracy: perfect / corpus.length, fields, requests: corpus.length };
console.log(`fields ${correct}/${fields} (${(100 * correct / fields).toFixed(1)}%) · requests fully right ${perfect}/${corpus.length} (${(100 * perfect / corpus.length).toFixed(1)}%)`);
console.log(Object.entries(byField).map(([f, [c, n]]) => `${f} ${c}/${n}`).join(' · '));
if (process.argv.includes('--failures')) console.log(failures.join('\n'));
