// Intent accuracy of the customer-service brain on the labelled set (spec 16 §11.4). Usage: node scripts/eval-support-intents.mjs
import { readFileSync } from 'node:fs';
import { classify } from '../backend/support-brain.mjs';

// node scripts/eval-support-intents.mjs [holdout|en|en-holdout] — en: the English sets (spec 21).
const set = JSON.parse(readFileSync(new URL('../tests/fixtures/support-intents' + ({ holdout: '-holdout', en: '-en', 'en-holdout': '-en-holdout' }[process.argv[2]] || '') + '.json', import.meta.url), 'utf8'));
let ok = 0;
for (const [text, expected] of set) {
  const result = classify(text);
  if (result.intent === expected) ok++;
  else console.log('MISS', JSON.stringify(text), 'expected', expected, 'got', result.intent, JSON.stringify(result.scores));
}
console.log(`${ok}/${set.length} = ${((ok / set.length) * 100).toFixed(1)}%`);
