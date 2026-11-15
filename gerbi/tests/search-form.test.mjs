import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolvePlace, searchPlaces, placeText, placeSuggestions, places } from '../dist/places.mjs';
import { monthGrid, pickDate, dayState, addDays, nightsBetween, selectable } from '../dist/date-range.mjs';
import { understandRequest } from '../dist/brief-engine.mjs';
import { travelersText, countText } from '../dist/search-form.mjs';
import { dealRequests, cheapestDeal, pickDeals, createDeals, DEALS_FRESH_MS, DEALS_MAX_AGE_MS } from '../backend/deals.mjs';

test('one place answers to Hebrew, English (any case) and its IATA code', () => {
  for (const input of ['לונדון', 'London', 'london', 'LON', 'lon', 'לונדון · LON', 'לונדון – כל שדות התעופה']) assert.equal(resolvePlace(input)?.code, 'LON', input);
  for (const input of ['הית׳רו', "הית'רו", 'Heathrow', 'LHR', 'הית׳רו · LHR']) assert.equal(resolvePlace(input)?.code, 'LHR', input);
  assert.equal(resolvePlace('JFK').code, 'JFK');
  assert.equal(resolvePlace('ניו יורק – JFK').code, 'JFK');
  assert.equal(resolvePlace('osl').code, 'OSL', 'an unknown code is trusted as typed');
  assert.equal(resolvePlace('Copenhagen').code, 'CPH');
  for (const place of places) { assert.ok(place.en && place.name, place.code); assert.equal(resolvePlace(placeText(place)).code, place.code); assert.equal(resolvePlace(place.label).code, place.code); }
});

test('autocomplete ranks code and prefix matches in both languages; a city brings its airports', () => {
  assert.deepEqual(searchPlaces('lond').slice(0, 3).map(p => p.code), ['LON', 'LHR', 'LGW']);
  assert.deepEqual(searchPlaces('לונ').slice(0, 2).map(p => p.code), ['LON', 'LHR']);
  assert.equal(searchPlaces('LHR')[0].code, 'LHR');
  assert.equal(searchPlaces('jfk')[0].code, 'JFK');
  assert.equal(searchPlaces('bar')[0].code, 'BCN');
  assert.equal(searchPlaces('paris', { exclude: 'PAR' }).some(p => p.code === 'PAR'), false);
  assert.equal(placeSuggestions('ברצ')[0].code, 'BCN');
  assert.equal(placeText(resolvePlace('london')), 'לונדון · LON');
});

test('free-text understanding reads English names and capitalised IATA codes, not lower-case words', () => {
  assert.deepEqual(understandRequest('flight to London from Tel Aviv').brief.want, ['LON']);
  assert.equal(understandRequest('flight to London from Tel Aviv').brief.origin, 'TLV');
  assert.deepEqual(understandRequest('טיסה ל-LHR במרץ').brief.want, ['LHR']);
  assert.deepEqual(understandRequest('we take the bus').brief.want, []);
});

test('range picker: weeks start on Sunday, clicks build a range, past and far dates are disabled', () => {
  const weeks = monthGrid(2026, 10); // November 2026 starts on a Sunday
  assert.equal(weeks[0][0], '2026-11-01'); assert.equal(weeks.flat().filter(Boolean).length, 30);
  assert.equal(monthGrid(2026, 11)[0][2], '2026-12-01'); // Tuesday
  let range = pickDate({}, '2026-12-10');
  assert.deepEqual(range, { start: '2026-12-10', end: '' });
  range = pickDate(range, '2026-12-15'); assert.deepEqual(range, { start: '2026-12-10', end: '2026-12-15' });
  assert.deepEqual(pickDate(range, '2026-12-20'), { start: '2026-12-20', end: '' }, 'a third click starts over');
  assert.deepEqual(pickDate({ start: '2026-12-10', end: '' }, '2026-12-05'), { start: '2026-12-05', end: '' });
  assert.deepEqual(pickDate({ start: '2026-12-10', end: '' }, '2026-12-10'), { start: '2026-12-10', end: '2026-12-10' }, 'same-day return');
  assert.deepEqual(pickDate({ start: '2026-12-10', end: '' }, '2026-12-12', { oneWay: true }), { start: '2026-12-12', end: '' });
  const today = '2026-11-15';
  assert.equal(dayState('2026-11-14', {}, today).disabled, true);
  assert.equal(selectable(addDays(today, 365), today), true); assert.equal(selectable(addDays(today, 366), today), false);
  assert.equal(dayState('2026-12-12', { start: '2026-12-10', end: '2026-12-15' }, today).inRange, true);
  assert.equal(dayState('2026-12-12', { start: '2026-12-10', hover: '2026-12-13' }, today).preview, true);
  assert.equal(nightsBetween('2026-12-10', '2026-12-15'), 5);
});

test('counts read naturally in Hebrew', () => {
  assert.equal(travelersText(1, 0), 'נוסע אחד');
  assert.equal(travelersText(2, 0), '2 נוסעים');
  assert.equal(travelersText(1, 1), '2 נוסעים · מתוכם ילד אחד');
  assert.equal(countText(1, 'לילה אחד', 'לילות'), 'לילה אחד');
  assert.equal(countText(4, 'לילה אחד', 'לילות'), '4 לילות');
});

const offer = (index, value, currency = 'USD') => ({ index, fareDetails: { totalPrice: { selling: { value, currency } } }, flightsOverview: [{ flightReferences: ['F1'] }] });
const payload = offers => ({ offers, dataLists: { flightList: [{ key: 'F1', segmentReferences: ['S1'], flightDetails: { duration: '05:00' } }],
  flightSegmentList: [{ key: 'S1', departure: { airport: { code: 'TLV' } }, arrival: { airport: { code: 'LGW' } }, marketingCarrier: { airline: { code: 'W6', name: 'Wizz Air' } } }] } });

test('deals: validated probes, cheapest offer per route', () => {
  const requests = dealRequests('2026-11-15');
  assert.equal(requests.length, 12);
  assert.ok(requests.every(r => r.request && r.request.passengers.ptcList[0].count === 1 && r.request.originDestinations.length === 2));
  assert.equal(requests.find(r => r.destination === 'LON').request.originDestinations[0].destination.type, 'c');
  const deal = cheapestDeal(payload([offer('a', 300), offer('b', 120), offer('c', 0)]), requests[0]);
  assert.equal(deal.price.value, 120); assert.equal(deal.carrier, 'Wizz Air'); assert.equal(deal.stops, 0);
  assert.equal(cheapestDeal(payload([]), requests[0]), null);
  const picked = pickDeals([{ ...deal, price: { value: 200, currency: 'USD' } }, deal, null]);
  assert.equal(picked.length, 1); assert.equal(picked[0].price.value, 120);
});

function memoryStore() { const data = new Map(); return { data, get: async key => data.get(key) ?? null, set: async (key, value) => { data.set(key, value); } }; }

test('deals: never wait for the supplier, refresh once in the background, serve stale, keep old data on failure', async () => {
  let clock = Date.parse('2026-11-15T10:00:00Z'), calls = 0, fail = false;
  const store = memoryStore();
  const search = async () => { calls++; if (fail) throw Object.assign(new Error('down'), { status: 503 }); return payload([offer('a', 99)]); };
  const deals = createDeals({ search, store, now: () => clock, today: () => '2026-11-15' });
  const pending = [];
  const background = p => { pending.push(p); return p; };
  const cold = await deals.get({ background });
  assert.deepEqual(cold.deals, []); assert.equal(cold.refreshing, true);
  await deals.get({ background }); // a second visitor during the refresh adds no calls
  await Promise.all(pending);
  assert.equal(calls, 12); assert.equal(pending.length, 1);
  const warm = await deals.get({ background });
  assert.equal(warm.deals.length, 6); assert.equal(warm.stale, false); assert.equal(pending.length, 1);
  // Hours later: served stale at once while one refresh runs; the lock in the store is cleared by TTL in real stores.
  store.data.delete('lock'); clock += DEALS_FRESH_MS + 1; fail = true;
  const stale = await deals.get({ background });
  assert.equal(stale.deals.length, 6); assert.equal(stale.stale, true); assert.equal(stale.refreshing, true);
  await Promise.all(pending);
  assert.ok(calls < 24, 'a supplier that refuses everything gets no more calls this round');
  assert.equal((await deals.get({ background: p => p.catch(() => {}) })).deals.length, 6, 'failed refresh keeps the previous strip');
  clock += DEALS_MAX_AGE_MS;
  assert.deepEqual((await deals.get({ background: p => p.catch(() => {}) })).deals, [], 'too old is never shown');
});
