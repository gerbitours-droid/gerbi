import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePreferences, rankDemoTrips } from '../dist/planner.mjs';
import { trips } from '../dist/data.mjs';
import { extractSignals } from '../backend/understanding.mjs';
import { resolvePlace, placeSuggestions } from '../dist/places.mjs';
import { carrierOf, legSummary, hoursText } from '../dist/flight-view.mjs';
import { restoreJourney } from '../dist/journey.mjs';
import { createServer } from '../server.mjs';

const brief = 'זוג עם שני ילדים, חמישה לילות בפריז ביוני, תקציב 12000 שקל, בלי ים ובלי דובאי';

test('a ruled-out destination is never recommended, and an unsupported one is kept as a stated limit', () => {
  const p = parsePreferences(brief);
  assert.deepEqual(p.want, ['CDG']);
  assert.deepEqual(p.exclude, ['DXB']);
  assert.equal(rankDemoTrips(trips, p).some(item => item.trip.id === 'dubai'), false);
  const followUp = parsePreferences('לא דובאי. רק פריז', p);
  assert.deepEqual(followUp.want, ['CDG']);
  assert.equal(rankDemoTrips(trips, followUp).some(item => item.trip.id === 'dubai'), false);
});

test('a supported destination narrows the ideas to it; mentioning it again lifts an earlier exclusion', () => {
  const only = parsePreferences('רק רומא', {});
  assert.deepEqual(rankDemoTrips(trips, { ...only, adults: 2 }).map(item => item.trip.id), ['rome']);
  assert.deepEqual(parsePreferences('חוץ מרומא', {}).exclude, ['FCO']);
  assert.deepEqual(parsePreferences('בעצם כן לרומא', { exclude: ['FCO'] }).exclude, []);
});

test('a couple travelling with children is not a couples-only holiday, in the browser and on the server', () => {
  const p = parsePreferences(brief);
  assert.equal(p.couple, false);
  assert.equal(rankDemoTrips(trips, p).some(item => item.reasons.includes('רק שנינו')), false);
  const server = extractSignals(brief);
  assert.equal(server.couple, false);
  assert.equal(server.tags.includes('couple'), false);
  assert.equal(parsePreferences('לא חופשה זוגית', { couple: true }).couple, false);
  assert.equal(parsePreferences('ירח דבש לשנינו').couple, true);
});

test('destination field understands short Hebrew and English names and suggests near misses', () => {
  assert.equal(resolvePlace('רומא').code, 'FCO');
  assert.equal(resolvePlace('Rome').code, 'FCO');
  assert.equal(resolvePlace('רומא, איטליה').code, 'FCO');
  assert.equal(resolvePlace('פריז').code, 'CDG');
  assert.equal(resolvePlace('cdg').code, 'CDG');
  assert.equal(resolvePlace('עיר שלא קיימת'), null);
  assert.equal(placeSuggestions('ברצ')[0].code, 'BCN');
});

test('a connection that waits overnight and lands the next day is spelled out', () => {
  const at = (code, date, time, city) => ({ airport: { code }, city: { name: city }, date, time });
  const segments = [
    { departure: at('FCO', '2027-06-15', '19:05'), arrival: at('WAW', '2027-06-15', '21:30', 'Warsaw'),
      marketingCarrier: { airline: { code: 'LO', name: 'LOT' }, flightNumber: 320 }, operatingCarrier: { airline: { code: 'LO' } } },
    { departure: at('WAW', '2027-06-16', '15:00'), arrival: at('TLV', '2027-06-16', '19:50'),
      marketingCarrier: { airline: { code: 'LO', name: 'LOT' }, flightNumber: 151 }, operatingCarrier: { airline: { code: 'LY', name: 'El Al' } } }
  ];
  const leg = legSummary(segments);
  assert.equal(leg.dayOffset, 1);
  assert.equal(leg.stops, 1);
  assert.deepEqual(leg.layovers[0], { airport: 'WAW', city: 'Warsaw', minutes: 17 * 60 + 30, overnight: true });
  assert.equal(hoursText(17 * 60 + 30), '17 שע׳ ו־30 דק׳');
  assert.deepEqual(carrierOf(segments[1]), { name: 'LOT', number: 'LO151', operator: 'El Al' });
  assert.equal(carrierOf({}).name, null);
});

test('destination constraints survive a reload, and only valid airport codes are restored', () => {
  const restored = restoreJourney(JSON.stringify({ brief: { want: ['CDG', 'bad', 'CDG'], exclude: ['DXB'] } }), ['rome']);
  assert.deepEqual(restored.brief.want, ['CDG']);
  assert.deepEqual(restored.brief.exclude, ['DXB']);
});

test('live booking is refused unless an operator enables it', async () => {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const previous = process.env.VOLERO_BOOKING_ENABLED;
  delete process.env.VOLERO_BOOKING_ENABLED;
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/volero/flights/book`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: true, srk: 'x', searchToken: 'y', offerIndex: '1', input: {} })
    });
    assert.equal(response.status, 403);
    assert.equal((await response.json()).error, 'booking_disabled');
  } finally {
    if (previous === undefined) delete process.env.VOLERO_BOOKING_ENABLED; else process.env.VOLERO_BOOKING_ENABLED = previous;
    await new Promise(resolve => server.close(resolve));
  }
});
