import { test } from 'node:test';
import assert from 'node:assert/strict';
import { understandRequest } from '../dist/brief-engine.mjs';
import { offerFacts, matchesFilters, emptyFilters } from '../dist/flight-view.mjs';
import { resolvePlace, placeType } from '../dist/places.mjs';

const today = '2026-10-29';
const u = (text, previous = {}) => understandRequest(text, previous, { today });
const labels = result => result.understood.map(item => item.label);

test('a full family request: travelers, ages, nights, budget, places and negations', () => {
  const r = u('זוג עם שני ילדים בני 4 ו-9, חמישה לילות בפריז ביוני, תקציב 12000 שקל, בלי ים ובלי דובאי');
  assert.equal(r.brief.adults, 2); assert.equal(r.brief.children, 2); assert.deepEqual(r.brief.childAges, [4, 9]);
  assert.equal(r.brief.nights, 5); assert.equal(r.brief.month, 'יוני'); assert.equal(r.brief.budget, 12000);
  assert.deepEqual(r.brief.want, ['PAR']); assert.deepEqual(r.brief.exclude, ['DXB']);
  assert.equal(r.brief.beach, false); assert.equal(r.brief.couple, false);
  assert.equal(r.flightSearch, null, 'a month is not a date: no live search without exact dates');
  assert.equal(r.questions[0].id, 'exact-dates');
});

test('a concrete request becomes a live search with its preferences as filters', () => {
  const r = u('אנחנו 4 חברים, 10-15 ביוני ללונדון, טיסה ישירה עם מזוודה, עד 800 דולר לאדם');
  assert.deepEqual(r.flightSearch, { origin: 'TLV', destination: 'LON', start: '2027-06-10', end: '2027-06-15', type: 'round', adults: 4, children: 0,
    filters: { stops: '0', out: [], back: [], checkedBag: true, carrier: null } });
  assert.equal(r.brief.budget, undefined, 'a dollar budget is never silently treated as shekels');
  assert.equal(r.questions[0].id, 'budget-currency');
  assert.ok(labels(r).includes('800 לאדם = 3,200 USD לכולם'));
});

test('origin, numeric dates, time preference and airline', () => {
  const r = u('מאילת לרומא ב-3.7 עד 8.7, לא לקום מוקדם, באל על');
  assert.equal(r.flightSearch.origin, 'ETM'); assert.equal(r.flightSearch.destination, 'FCO');
  assert.equal(r.flightSearch.start, '2027-07-03'); assert.equal(r.flightSearch.end, '2027-07-08');
  assert.deepEqual(r.flightSearch.filters.out, ['afternoon', 'evening']); assert.equal(r.flightSearch.filters.carrier, 'el al');
});

test('one-way, a single traveler and a date before today rolls to next year', () => {
  const r = u('רק אני, כיוון אחד לברצלונה ב-12 בדצמבר');
  assert.equal(r.brief.adults, 1); assert.equal(r.flightSearch.type, 'oneway'); assert.equal(r.flightSearch.start, '2026-12-12');
  assert.equal(u('ב-10 במרץ לאתונה').brief.start, '2027-03-10');
  assert.ok(!r.questions.some(q => q.id === 'nights'), 'one-way trips are not asked for nights');
});

test('relative dates are when, not how long; days count one night less, and that is said', () => {
  const weekend = u('סופ"ש זוגי בעוד שבועיים');
  assert.equal(weekend.brief.nights, 3); assert.equal(weekend.brief.start, '2026-11-12'); assert.equal(weekend.brief.couple, true);
  const days = u('5 ימים בפסח עם הילדים, משהו זול');
  assert.equal(days.brief.nights, 4); assert.ok(labels(days).includes('5 ימים = 4 לילות'));
  assert.equal(days.brief.month, 'אפריל'); assert.equal(days.brief.cheaper, true);
  assert.deepEqual(days.questions.map(q => q.id), ['exact-dates', 'children']);
});

test('a country widens the wish and asks which city; ruling a country out removes its places', () => {
  const r = u('משפחה של 5 ביוון בקיץ');
  assert.equal(r.brief.adults, 2); assert.equal(r.brief.children, 3);
  assert.ok(r.brief.want.includes('JTR') && r.brief.want.includes('ATH'));
  assert.equal(r.questions[0].id, 'city');
  assert.ok(u('בלי איטליה').brief.exclude.includes('FCO'));
});

test('assumptions are explicit, follow-ups edit the previous brief', () => {
  const first = u('שבוע ברומא');
  assert.deepEqual(first.assumed, ['2 מבוגרים']);
  const next = u('עוד לילה ועוד ילד', first.brief);
  assert.equal(next.brief.nights, 8); assert.equal(next.brief.children, 1); assert.deepEqual(next.brief.want, ['FCO']);
  assert.deepEqual(u('תוריד את המחיר עד 9 אלף', { budget: 18000, nights: 7 }).brief.budget, 9000);
});

test('nothing is invented from numbers that are not money or dates', () => {
  const r = u('2 מבוגרים ו-3 ילדים, טיסה של 2027');
  assert.equal(r.brief.budget, undefined); assert.equal(r.brief.start, undefined); assert.equal(r.brief.children, 3);
  assert.equal(u('ילד אחד ולילה אחד ברודוס').brief.children, 1);
  assert.equal(u('ילד אחד ולילה אחד ברודוס').brief.nights, 1);
});

test('city codes search every airport, and results can be filtered by airport', () => {
  assert.equal(resolvePlace('פריז').code, 'PAR'); assert.equal(placeType('PAR'), 'c'); assert.equal(placeType('CDG'), 'a');
  assert.equal(resolvePlace('גטוויק').code, 'LGW'); assert.equal(resolvePlace('לונדון').code, 'LON');
  const seg = (key, from, to, date, depart, arrive) => ({ key, departure: { airport: { code: from }, date, time: depart }, arrival: { airport: { code: to }, date, time: arrive } });
  const payload = { dataLists: { flightSegmentList: [seg('a', 'TLV', 'CDG', '2027-06-10', '08:00', '12:00'), seg('b', 'ORY', 'TLV', '2027-06-15', '10:00', '15:00')],
    flightList: [{ key: 'o', segmentReferences: ['a'] }, { key: 'r', segmentReferences: ['b'] }] } };
  const facts = offerFacts({ index: '1', flightsOverview: [{ flightReferences: ['o', 'r'] }], fareDetails: {} }, payload);
  assert.deepEqual(facts.airports, ['CDG', 'ORY']); assert.equal(facts.airportChange, true);
  assert.equal(matchesFilters(facts, { ...emptyFilters(), airports: ['ORY'] }), true);
  assert.equal(matchesFilters(facts, { ...emptyFilters(), airports: ['LHR'] }), false);
});

test('a new destination replaces the earlier one; a whole-group statement resets children', () => {
  const first = u('זוג עם שני ילדים, חמישה לילות בפריז ביוני');
  const next = u('אנחנו 4 חברים, 10-15 ביוני ללונדון', first.brief);
  assert.deepEqual(next.brief.want, ['LON']); assert.equal(next.brief.children, 0); assert.ok(next.flightSearch);
  assert.deepEqual(u('וגם רומא', { want: ['PAR'] }).brief.want.sort(), ['FCO', 'PAR']);
});
