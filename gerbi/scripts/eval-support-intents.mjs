// Intent accuracy of the customer-service brain on the labelled set (spec 16 §11.4). Usage: node scripts/eval-support-intents.mjs
import { readFileSync } from 'node:fs';
import { classify } from '../backend/support-brain.mjs';

const set = JSON.parse(readFileSync(new URL('../tests/fixtures/support-intents' + (process.argv[2] === 'holdout' ? '-holdout' : '') + '.json', import.meta.url), 'utf8'));
let ok = 0;
for (const [text, expected] of set) {
  const result = classify(text);
  if (result.intent === expected) ok++;
  else console.log('MISS', JSON.stringify(text), 'expected', expected, 'got', result.intent, JSON.stringify(result.scores));
}
console.log(`${ok}/${set.length} = ${((ok / set.length) * 100).toFixed(1)}%`);
