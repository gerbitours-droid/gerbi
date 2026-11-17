// Routes (17.11.2026): country-sized trips sleep in bases, near cities go by land, "+ islands" and per-place lengths.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTrip, planPackage, L } from '../dist/trip-builder.mjs';

const TODAY = '2026-11-17';
const plan = (text, lang = 'he') => planPackage(parseTrip(text, { today: TODAY, lang }), { today: TODAY });
const legs = (p) => p.flightSearch.originDestinations.map((o) => `${o.origin.code}-${o.destination.code}`);
const route = (p) => (p.stops.length ? p.stops : [p.destination]).map((s) => `${L(s.name, 'en')}:${s.nights}`);

test('country-sized: bases by length, open-jaw flight, one hotel search per base, day trips from their own base', () => {
  const j = plan('יפן בפריחת הדובדבן, זוג, 12 לילות');
  assert.deepEqual(route(j), ['Tokyo:6', 'Kyoto:4', 'Osaka:2']);
  assert.deepEqual(legs(j), ['TLV-TYO', 'OSA-TLV']);
  assert.deepEqual(j.hotelSearches.map((h) => h.city), ['TYO', 'UKY', 'OSA']);
  const nara = j.itinerary.find((d) => d.kind === 'daytrip' && /נארה/.test(d.items[0].name));
  assert.equal(L(j.stops[nara.stop].name, 'en'), 'Kyoto');
  assert.deepEqual(route(plan('יפן 4 לילות זוג אפריל')), ['יפן:4'.replace('יפן', 'Japan')], 'a short trip stays one base');
  assert.deepEqual(legs(plan('וייטנאם שבועיים בנובמבר זוג')), ['TLV-HAN', 'SGN-TLV']);
});

test('near cities by land (no internal flight), islands fly; "+ islands"; a length per place', () => {
  const rf = plan('רומא ואז פירנצה, 7 לילות');
  assert.deepEqual(legs(rf), ['TLV-FCO', 'FLR-TLV']); assert.ok(rf.assumed.some((a) => /ברכבת או ברכב/.test(a)));
  assert.deepEqual(legs(plan('אמסטרדם ואז פריז ואז לונדון, 10 ימים, אוקטובר')), ['TLV-AMS', 'LON-TLV']);
  const gr = plan('אתונה + איים 9 לילות יוני זוג');
  assert.deepEqual(gr.stops.map((s) => s.id), ['athens', 'santorini']); assert.equal(legs(gr).length, 3);
  assert.deepEqual(route(plan('3 לילות ברומא ואז 4 לילות בפירנצה, זוג, מאי')).map((x) => x.split(':')[1]), ['3', '4']);
  assert.equal(plan('שבוע בוייטנאם ואז שבוע בפוקט, זוג, דצמבר').request.nights, 14);
});

test('a car changes the choice: Italy by car is Tuscany, not Rome; Europe by car between places is a route, never Georgia', () => {
  assert.equal(plan('שבוע באיטליה לזוג באוגוסט עם רכב').destination.id, 'florence-tuscany');
  const eu = plan('שבוע באירופה עם רכב שכור בין כמה מקומות, זוג, ספטמבר');
  assert.ok(eu.stops.length >= 2 && eu.stops.every((s) => s.id !== 'georgia'));
});
