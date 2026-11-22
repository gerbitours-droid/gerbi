// A named catalog destination is never "missing" (the Paris bug, 2026-11-23); Gerbi's follow-up edits keep the brief;
// the livelier destination page sections.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { destinations, byId } from '../dist/catalog.mjs';
import { places } from '../dist/places.mjs';
import { trips } from '../dist/data.mjs';
import { tripsEn } from '../dist/locales/data-en.mjs';
import { constraintSummary, requestedDestinations, rankInspirations } from '../dist/personalization.mjs';
import { understandRequest } from '../dist/brief-engine.mjs';
import { destinationMain, areaPrice, areaTags } from '../dist/destinations-ui.mjs';

const today = '2026-11-23';

test('Paris and London are catalog destinations: not "missing", and they lead the request', () => {
  for (const [code, id] of [['PAR', 'paris'], ['LON', 'london'], ['CDG', 'paris'], ['LHR', 'london']]) {
    const s = constraintSummary({ want: [code] });
    assert.deepEqual(s.missing, [], code);
    assert.equal(s.requested[0], id, code);
  }
  const brief = understandRequest('2 מבוגרים 2 ילדים ביוני 5 לילות פריז', {}, { today }).brief;
  assert.deepEqual(constraintSummary(brief).missing, []);
  assert.deepEqual(requestedDestinations(brief).map((d) => d.id), ['paris']);
});

test('every one of the 70 catalog destinations, asked for by its code, is requested and never missing', () => {
  assert.equal(destinations.length, 70);
  for (const d of destinations) {
    const s = constraintSummary({ want: [d.code] });
    assert.deepEqual(s.missing, [], d.id);
    assert.equal(s.requested[0], d.id, d.id);
  }
});

test('the "missing" note stays for places that really are not in the catalog, and exclusions win', () => {
  const outside = places.find((p) => !p.home && !p.trip && !p.city && !destinations.some((d) => d.code === p.code || (d.airports || []).includes(p.code)));
  assert.ok(outside, 'a searchable place outside the catalog exists');
  assert.equal(constraintSummary({ want: [outside.code] }).missing.length, 1);
  assert.deepEqual(requestedDestinations({ want: ['PAR', 'LON'], exclude: ['PAR'] }).map((d) => d.id), ['london']);
});

test('Paris is a full demo trip idea (image, nights, price, days, English text) and ranks first when asked for', () => {
  const paris = trips.find((t) => t.id === 'paris');
  assert.ok(paris && paris.image && paris.nights === 4 && paris.price > 0 && paris.days.length === paris.nights + 1);
  assert.equal(byId('paris').trip, 'paris');
  assert.equal(tripsEn.paris.days.length, paris.days.length);
  const ranked = rankInspirations(trips, { want: ['PAR'], adults: 2, children: 2, nights: 5 });
  assert.deepEqual(ranked.map((x) => x.trip.id), ['paris']);
  assert.ok(ranked[0].reasons.length > 0);
});

test('follow-up edits in free text change only what they say and keep the rest of the brief', () => {
  let p = understandRequest('2 מבוגרים 2 ילדים ביוני 5 לילות פריז', {}, { today }).brief;
  const step = (text) => { const r = understandRequest(text, p, { today }); p = r.brief; return r; };
  step('בלי ילדים'); assert.equal(p.children, 0); assert.equal(p.nights, 5); assert.deepEqual(p.want, ['PAR']);
  const plus = step('תוסיף יומיים'); assert.equal(p.nights, 7); assert.equal(plus.understood.length, 1);
  step('משהו יותר זול'); assert.equal(p.cheaper, true); assert.equal(p.nights, 7);
  step('דווקא ביולי'); assert.equal(p.month, 'יולי'); assert.deepEqual(p.want, ['PAR']); assert.equal(p.adults, 2);
  step('עוד 2 לילות'); assert.equal(p.nights, 9);
  step('לילה פחות'); assert.equal(p.nights, 8);
  step('משהו יותר יקר'); assert.equal(p.cheaper, undefined);
  step('אולי לונדון במקום'); assert.deepEqual(p.want, ['LON']); assert.equal(p.nights, 8);
  // "בלי ילדים" read by two rules is said once
  assert.equal(understandRequest('בלי ילדים', { adults: 2, children: 2 }, { today }).understood.filter((u) => u.field === 'children').length, 1);
});

test('English follow-ups: add 2 days, one night less; a first message length stays absolute', () => {
  let p = understandRequest('2 adults, 5 nights in Paris in June', {}, { today, lang: 'en' }).brief;
  assert.equal(p.nights, 5);
  p = understandRequest('add 2 days', p, { today, lang: 'en' }).brief; assert.equal(p.nights, 7);
  p = understandRequest('one night less', p, { today, lang: 'en' }).brief; assert.equal(p.nights, 6);
  p = understandRequest('something cheaper', p, { today, lang: 'en' }).brief; assert.equal(p.cheaper, true); assert.equal(p.nights, 6);
  // no earlier length: "5 ימים" keeps its meaning (4 nights); "תוריד לילה" shortens, it is not "cheaper"
  assert.equal(understandRequest('5 ימים ברומא', {}, { today }).brief.nights, 4);
  assert.equal(understandRequest('תוריד לילה', { nights: 5 }, { today }).brief.cheaper, undefined);
});

test('destination page: top attractions, things to do by kind, day trips and where-to-stay cards', () => {
  for (const id of ['paris', 'japan', 'athens', 'iceland']) {
    const d = byId(id), html = destinationMain(d).body;
    assert.match(html, /class="dest-section dest-sec-top"/, id);
    assert.match(html, /id="dest-todo-list"/, id);
    assert.match(html, /class="area-card"/, id);
    assert.equal((html.match(/class="attr-card /g) || []).length, d.attractions.length + d.dayTrips.length, `${id}: one card per attraction and day trip`);
    // every card carries the alt text its photo gets once the photo list arrives, and a kind label
    for (const m of html.matchAll(/data-alt="([^"]*)"/g)) assert.ok(m[1].length > 1, id);
    // heading order: section h2, area h3 — no h4 jumps
    assert.doesNotMatch(html, /<h4/);
  }
  const paris = destinationMain(byId('paris')).body;
  assert.match(paris, /data-attr-kind="museum"/);
  assert.match(paris, /area-price p3/);
  assert.match(paris, /area-proscons/);
  assert.deepEqual(byId('paris').areas.map(areaPrice), [3, 3, 2, 3, 1]);
  assert.ok(areaTags(byId('paris').areas[3]).includes('family'));
  assert.equal(areaPrice({ forWhom: { en: 'Backpackers on a budget' } }), 1);
  assert.equal(areaPrice({ forWhom: { en: 'Old town lanes' } }), 0, 'no price level is invented');
});
