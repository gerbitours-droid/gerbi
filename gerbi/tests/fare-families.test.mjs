import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { offerFacts } from '../dist/flight-view.mjs';
import { flightsKey, physicalKey, groupFares, fareHighlights, fareNames, chosenFare } from '../dist/fare-families.mjs';

const payload = JSON.parse(readFileSync(new URL('./fixtures/booking/search-slim.json', import.meta.url))).data;
const facts = () => payload.offers.map(offer => offerFacts(offer, payload));
const SKY = 'df2eb3ac88fba79a1ed3f9b7637b0370c6aba7a6,d95d49530b3d2a47584916bba70cf770294c826d';

test('branded fares: 40 offers → 31 sets of flight references → 29 cards (same flights listed twice share a card), cheapest fare first', () => {
  const all = facts(), groups = groupFares(all);
  assert.equal(payload.offers.length, 40);
  assert.equal(new Set(payload.offers.map(flightsKey)).size, 31);
  // GQ721/GQ720 and A3927/A3924 come twice under other flight references (another content source): one card each.
  assert.equal(new Set(all.map(physicalKey)).size, 29);
  assert.equal(groups.length, 29);
  assert.equal(groups.reduce((n, g) => n + g.fares.length, 0), 40, 'every offer belongs to exactly one card');
  for (const g of groups) {
    assert.equal(g.fares[0], g, 'the card is its cheapest fare');
    assert.ok(g.fares.every((f, i) => !i || f.price.value >= g.fares[i - 1].price.value), 'cheapest first');
    assert.ok(g.fares.every(f => physicalKey(f) === g.groupKey), 'same flights only');
  }
  // Offers grouped by flight references never split across cards.
  for (const ref of new Set(payload.offers.map(flightsKey))) assert.equal(new Set(all.filter(f => flightsKey(f.offer) === ref).map(f => f.groupKey)).size, 1);
  const sky = groups.find(g => g.fares.some(f => flightsKey(f.offer) === SKY));
  assert.equal(sky.fares.length, 11);
  assert.deepEqual(groups.find(g => g.fares.some(f => fareNames(f).label === 'FLEX')).fares.map(f => fareNames(f).label), ['Light', 'FLEX']);
  assert.equal(sky.price.value, 1071.69);
  assert.deepEqual(sky.fares.map(f => fareNames(f).label).slice(0, 3), ['SKY Joy', 'SKY JOY', 'SKY Joy / SKY Joy+']);
  assert.equal(sky.fares.at(-1).price.value, 1499.97);
  assert.equal(fareNames(sky.fares.at(-1)).label, 'BLISS / SKY Joy');
  // Supplier order of the itineraries is kept (it is cheapest first already).
  assert.deepEqual(groups.slice(0, 3).map(g => g.price.value), [711.99, 744.81, 806.91]);
});

test('branded fares: what each fare includes, per direction names, and the chosen fare', () => {
  const sky = groupFares(facts()).find(g => g.fares.some(f => flightsKey(f.offer) === SKY));
  const joy = sky, enjoy = sky.fares.find(f => fareNames(f).label === 'SKY Enjoy');
  const states = f => Object.fromEntries(fareHighlights(f).map(x => [x.key, x.state]));
  assert.deepEqual(states(joy), { checked: 'paid', trolley: 'included', change: 'paid' });
  assert.deepEqual(states(enjoy), { checked: 'included', trolley: 'included', change: 'included', refund: 'paid' });
  const split = sky.fares.find(f => fareNames(f).label === 'SKY Joy / SKY Enjoy');
  assert.equal(fareNames(split).same, false);
  assert.deepEqual(fareNames(split).names, ['SKY Joy', 'SKY Enjoy']);
  assert.equal(states(split).checked, 'mixed', 'a bag on one direction only is never shown as included');
  assert.equal(chosenFare(sky, enjoy.index), enjoy);
  assert.equal(chosenFare(sky, 'not-an-offer'), sky, 'an unknown choice falls back to the cheapest');
  assert.equal(chosenFare(sky, null, { wantBag: true }).checked, 'included', 'the bag filter opens on the cheapest fare with a bag');
  const single = groupFares(facts()).find(g => g.fares.length === 1);
  assert.equal(chosenFare(single, null, { wantBag: true }), single);
});

test('branded fares: identical fares collapse to the cheaper; offers without flights or prices stay on their own cards', () => {
  const twin = groupFares([...facts(), ...facts().filter(f => f.index === '18a5e53c39c4d12fce841369893f167ca3993da5').map(f => ({ ...f, index: 'dup', price: { ...f.price, value: 1080 } }))]);
  assert.equal(twin.length, 29);
  assert.equal(twin.find(g => g.index === '18a5e53c39c4d12fce841369893f167ca3993da5').fares.length, 11, 'the same fare at a higher price is not offered');
  const f = (index, value, refs) => ({ index, offer: { index, flightsOverview: refs ? [{ flightReferences: refs }] : [] }, price: value == null ? null : { value, currency: 'USD' }, legs: [] });
  const groups = groupFares([f('a', 300, ['x']), f('b', null, ['x']), f('c', 200, ['x']), f('d', 100), f('e', 90)]);
  assert.deepEqual(groups.map(g => g.index), ['c', 'd', 'e']);
  assert.deepEqual(groups[0].fares.map(x => x.index), ['c', 'a', 'b'], 'no price sorts last');
});
