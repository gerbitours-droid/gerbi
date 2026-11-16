import test from 'node:test';
import assert from 'node:assert/strict';
import { COUNTRY_OF, factsFor } from '../dist/did-you-know.mjs';
import { places } from '../dist/places.mjs';

const groups = await Promise.all(['a', 'b', 'c', 'd'].map(g => import(`../dist/facts/group-${g}.mjs`)));
const all = Object.assign({}, ...groups.map(m => m.default));

test('every searchable destination maps to a country with facts', () => {
  for (const p of places) if (!p.home && !/^(TLV|ETM|VDA|HFA|SDV)$/.test(p.code)) assert.ok(COUNTRY_OF[p.code], `no country for ${p.code}`);
  for (const cc of new Set(Object.values(COUNTRY_OF))) assert.ok(all[cc], `no facts for ${cc}`);
});

test('each country has 12–15 facts, he and en aligned, short, no label prefix', () => {
  for (const [cc, f] of Object.entries(all)) {
    assert.ok(f.he.length >= 12 && f.he.length <= 15, `${cc} count ${f.he.length}`);
    assert.equal(f.he.length, f.en.length, `${cc} he/en mismatch`);
    for (const s of [...f.he, ...f.en]) {
      assert.ok(s.trim().length > 20 && s.length <= 220, `${cc} length: ${s}`);
      assert.ok(!/^(הידעת|did you know)/i.test(s), `${cc} prefix: ${s}`);
    }
  }
});

test('unknown destination falls back to general facts', () => {
  assert.equal(factsFor(all, 'ZZZ'), all.XX);
  assert.equal(factsFor(all, 'cdg'), all.FR);
});
