import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { understandRequest } from '../dist/brief-engine.mjs';

// Labeled Hebrew requests (tests/fixtures). The holdout set was written after tuning on the first one.
const same = (a, b) => JSON.stringify(Array.isArray(a) ? [...a].sort() : a) === JSON.stringify(Array.isArray(b) ? [...b].sort() : b);
for (const [name, file, floor] of [['tuning', 'requests-he.json', 1], ['holdout', 'requests-he-holdout.json', 0.95]]) {
  test(`understanding corpus (${name}) stays at ≥ ${floor * 100}% field accuracy`, async () => {
    const corpus = JSON.parse(await readFile(new URL(`./fixtures/${file}`, import.meta.url), 'utf8'));
    let fields = 0, correct = 0; const misses = [];
    for (const { text, expect } of corpus) {
      const { brief } = understandRequest(text, {}, { today: '2026-10-29' });
      for (const [field, value] of Object.entries(expect)) { fields++; if (same(brief[field], value)) correct++; else misses.push(`${field} ← ${text}`); }
    }
    assert.ok(correct / fields >= floor, `${correct}/${fields}: ${misses.join(' | ')}`);
  });
}
