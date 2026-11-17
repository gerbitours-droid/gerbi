// 300 first messages written from the user's side only (scripts/eval-user-300.mjs): the builder must keep understanding
// them. 2026-11-17: 49% → 93%; the known misses are group size > 9 (one booking's limit) and budget-driven choices.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('user-300: ≥ 92% of natural first messages fully understood and planned where asked', () => {
  const out = execFileSync(process.execPath, [fileURLToPath(new URL('../scripts/eval-user-300.mjs', import.meta.url))], { encoding: 'utf8' });
  const [, ok, all] = out.match(/user-300: (\d+)\/(\d+)/);
  assert.ok(ok / all >= 0.92, out.split('\n').slice(0, 2).join('\n'));
});
