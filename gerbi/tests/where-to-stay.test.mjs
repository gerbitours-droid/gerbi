import test from 'node:test';
import assert from 'node:assert/strict';
import { destinations } from '../dist/catalog.mjs';

// Every "where to stay" area carries a price level and an honest pro/con in both languages, with a Hebrew name.
test('every destination area has price, pros and cons (he+en)', () => {
  const bad = destinations.flatMap((d) => (d.areas || []).filter((a) => ![1, 2, 3].includes(a.price)
    || !a.pros?.he || !a.pros?.en || !a.cons?.he || !a.cons?.en || !/[֐-׿]/.test(a.name?.he || '')).map((a) => `${d.id}:${a.name?.en}`));
  assert.deepEqual(bad, []);
  assert.ok(destinations.every((d) => (d.areas || []).length >= 2), 'each destination offers at least two areas');
});
