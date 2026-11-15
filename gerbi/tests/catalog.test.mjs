// Spec 23: the destinations catalog — inventory, schema, wiring to places/tags/CMS, images, and the "only Greece" regression.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { destinations, byId, byCode, search, rank, curatedPicks, validateDestination, REGIONS, ALLOWED_TAGS } from '../dist/catalog.mjs';
import { places } from '../dist/places.mjs';
import { trips } from '../dist/data.mjs';
import { flatTags, destinationTags } from '../backend/tag-catalog.mjs';
import { GUIDE_IDS, normalizeSite } from '../dist/content-model.mjs';
import { cleanSaved } from '../dist/account-core.mjs';
import { readFilters, applyFilters, homePicks, monthsText } from '../dist/destinations-ui.mjs';

const GREECE = ['JTR', 'ATH', 'HER', 'RHO'];

test('inventory: 50–70 destinations across at least 6 regions, every one valid', () => {
  assert.ok(destinations.length >= 50 && destinations.length <= 70, `count ${destinations.length}`);
  assert.ok(new Set(destinations.map((d) => d.region)).size >= 6);
  assert.deepEqual(destinations.flatMap(validateDestination), []);
  assert.equal(new Set(destinations.map((d) => d.id)).size, destinations.length, 'unique ids');
  for (const r of REGIONS) assert.ok(destinations.some((d) => d.region === r), r);
});

test('every code and airport resolves in places.mjs; every tag is in the tag catalog', () => {
  const codes = new Set(places.map((p) => p.code)), tagIds = new Set(flatTags().map((t) => t.id));
  for (const d of destinations) for (const c of [d.code, ...d.airports]) assert.ok(codes.has(c), `${d.id}: ${c}`);
  assert.deepEqual(ALLOWED_TAGS.filter((t) => !tagIds.has(t)), []);
  for (const d of destinations) assert.deepEqual(destinationTags[d.id], d.tags);
});

test('the 4 demo trips stay linked to their catalog destinations (saved plans and links keep working)', () => {
  for (const t of trips) { assert.equal(byId(t.id)?.trip, t.id, t.id); }
  assert.deepEqual(destinationTags.dubai.filter((x) => ['city', 'beach', 'family', 'with_children', 'water_slides'].includes(x)).length, 5);
});

test('every destination has a local photo (1200px ≤ 120KB + 600px thumb) credited in ASSETS.md', async () => {
  const assets = await readFile(new URL('../ASSETS.md', import.meta.url), 'utf8');
  for (const d of destinations) {
    const big = await stat(new URL(`../dist${d.image.src}`, import.meta.url)), small = await stat(new URL(`../dist${d.image.thumb}`, import.meta.url));
    assert.ok(big.size <= 120 * 1024, `${d.id}: ${big.size}`);
    assert.ok(small.size < big.size, `${d.id} thumb`);
    assert.ok(d.image.credit && d.image.license && /^https:\/\/commons\.wikimedia\.org\//.test(d.image.source), `${d.id} credit`);
    assert.ok(d.image.alt.he && d.image.alt.en, `${d.id} alt`);
    assert.ok(assets.includes(`destinations/${d.id}.webp`), `${d.id} in ASSETS.md`);
  }
});

test('lookup helpers: byCode by city or airport, search in both languages', () => {
  assert.equal(byCode('JTR').id, 'santorini');
  assert.equal(byCode('CDG').id, 'paris');
  assert.equal(byCode('nrt').id, 'japan');
  assert.equal(byCode('XXX'), null);
  assert.equal(search('Rome', 'en')[0].id, 'rome');
  assert.deepEqual(search('רומא').map((d) => d.id), ['rome']);
  const greece = search('ביוון');
  assert.ok(greece.length >= 4 && greece.every((d) => d.country.en === 'Greece'), greece.map((d) => d.id).join());
  assert.ok(search('קולוסיאום').some((d) => d.id === 'rome'));
  assert.ok(search('ski', 'en').some((d) => d.id === 'austrian-alps'));
});

test('rank: a wanted place leads but never hides the rest; exclude and hard limits filter', () => {
  const ranked = rank({ want: GREECE, couple: true, month: 'אוגוסט' });
  assert.equal(ranked.length, destinations.length);
  assert.equal(ranked[0].destination.country.en, 'Greece');
  assert.ok(ranked[0].reasons.some((r) => /asked/.test(r.en)));
  assert.ok(!rank({ exclude: ['DXB'] }).some((x) => x.destination.id === 'dubai'));
  assert.ok(rank({ maxFlightHours: 4 }).every((x) => x.destination.flightHours <= 4));
  assert.ok(rank({ direct: true }).every((x) => x.destination.direct));
  assert.ok(rank({ region: 'asia' }).every((x) => x.destination.region === 'asia'));
  const ski = rank({ tags: ['ski'], month: 1 });
  assert.ok(ski[0].destination.tags.includes('ski'));
});

test('regression "only Greece": after a Greek request the home showcase still spans regions', () => {
  for (const month of [1, 4, 8, 11]) {
    const picks = curatedPicks({ month, preferences: { want: GREECE, couple: true } });
    assert.equal(picks.length, 8);
    assert.ok(new Set(picks.map((x) => x.destination.region)).size >= 3, `month ${month}`);
    assert.equal(picks[0].destination.country.en, 'Greece');
    assert.ok(picks.filter((x) => x.destination.country.en === 'Greece').length <= 2);
    assert.ok(picks.every((x) => !x.destination.advisory));
  }
  const plain = homePicks({}, { today: new Date('2026-08-10') });
  assert.ok(new Set(plain.map((x) => x.destination.region)).size >= 3);
  assert.ok(plain.filter((x) => x.destination.bestMonths.includes(8)).length >= 6, 'mostly in season');
});

test('destinations page filters read from the URL and combine', () => {
  const f = readFilters('#/destinations?region=asia&style=beach&month=1&direct=1&n=500&sort=flight');
  assert.equal(f.n, 200);
  const list = applyFilters(f);
  assert.ok(list.length > 0 && list.every((d) => d.region === 'asia' && d.tags.includes('beach') && d.bestMonths.includes(1) && d.direct));
  assert.deepEqual(list.map((d) => d.flightHours), [...list.map((d) => d.flightHours)].sort((a, b) => a - b));
  assert.equal(readFilters('#/destinations?region=mars&style=<x>').region, 'all');
  assert.equal(applyFilters(readFilters('#/destinations'), { source: ['rome', 'japan'] }).length, 2);
  assert.equal(monthsText([5, 6, 9, 10]), 'מאי–יוני, ספטמבר–אוקטובר');
  assert.equal(monthsText([11, 12, 1, 2]), 'נובמבר–פברואר');
});

test('CMS guides and favorites accept every catalog destination', () => {
  assert.deepEqual([...GUIDE_IDS].sort(), destinations.map((d) => d.id).sort());
  assert.equal(normalizeSite({ guides: { japan: { fit: 'משפחות וזוגות' } } }).site.guides.japan.fit, 'משפחות וזוגות');
  assert.ok(normalizeSite({ guides: { nowhere: { fit: 'x' } } }).errors['guides.nowhere']);
  assert.deepEqual(cleanSaved({ favorites: ['japan', 'rome', 'nowhere'] }).favorites, ['japan', 'rome']);
});
