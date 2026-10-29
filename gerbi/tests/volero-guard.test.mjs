import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validSearch, validAvailability, slimSearch, cachedSearch, withRetry, allow } from '../backend/volero-guard.mjs';
import { offerFacts } from '../dist/flight-view.mjs';
import { createServer } from '../server.mjs';

const today = '2026-10-29';
const leg = (o, d, date, type = 'a') => ({ origin: { code: o, type: 'a' }, destination: { code: d, type }, date });
const search = (legs, ptcList = [{ ptc: 'ADT', count: 2 }]) => ({ originDestinations: legs, passengers: { ptcList } });

test('only well-formed searches are forwarded with the agency credentials', () => {
  const ok = validSearch({ ...search([leg('TLV', 'PAR', '2027-06-10', 'c'), leg('PAR', 'TLV', '2027-06-15')]), timeout: 999, sellingChannel: 'B2C', extra: 'x' }, today);
  assert.deepEqual(ok, { originDestinations: [leg('TLV', 'PAR', '2027-06-10', 'c'), leg('PAR', 'TLV', '2027-06-15')], passengers: { ptcList: [{ ptc: 'ADT', count: 2 }] }, sellingChannel: 'B2B', language: 'en_GB', timeout: 10 });
  for (const bad of [search([]), search([leg('TLV', 'TLV', '2027-06-10')]), search([leg('TLV', 'FCO', '2026-01-01')]), search([leg('TLV', 'FCO', '2028-06-10')]),
    search([leg('TLV', 'FCO', '2027-06-15'), leg('FCO', 'TLV', '2027-06-10')]), search([leg('tlv', 'FCO', '2027-06-10')]), search([leg('TLV', 'FCO', '2027-06-10')], [{ ptc: 'CHD', count: 2 }]),
    search([leg('TLV', 'FCO', '2027-06-10')], [{ ptc: 'ADT', count: 8 }, { ptc: 'CHD', count: 2 }]), null])
    assert.equal(validSearch(bad, today), null, JSON.stringify(bad));
  assert.equal(validAvailability({ srk: 'a b', offerIndex: '1', searchToken: 't' }), null);
  assert.deepEqual(validAvailability({ srk: 'abc', offerIndex: 'x1', searchToken: 'tok.en', input: { itineraryIndex: 3 }, evil: 1 }), { srk: 'abc', offerIndex: 'x1', searchToken: 'tok.en', input: { itineraryIndex: 3 } });
});

test('trimming keeps every fact the site shows', () => {
  const service = (categoryCode, chargeType, name) => ({ categoryCode, chargeType, name, atpcoCode: 'x'.repeat(50), description: 'y'.repeat(200) });
  const raw = { srk: 's', tokens: { searchResults: 't' }, _links: {}, offers: [{ index: '1', upsellSupport: true, offerItems: [{ big: 'z'.repeat(500) }],
    flightsOverview: [{ itineraryIndex: 0, flightReferences: ['f'] }], baggageAllowanceList: [{ segmentReference: 's1', baggageAllowance: [{ ptc: 'ADT', quantity: '1', type: 'PC' }] }],
    fareDetails: { totalPrice: { selling: { value: 320, currency: 'USD' } }, nonRefundable: true, brandedFare: [{ name: 'Basic', departure: 'TLV', arrival: 'FCO', cabin: 'Economy',
      serviceList: [service('CY', 'included', '#0. 1 Carry-on bag up to 8Kg\nPhase: PreBooking'), service('ML', 'included', 'Meal'), service('BG', 'chargeable', 'HoldBag [40 USD]')] }] } }],
    dataLists: { flightList: [{ key: 'f', segmentReferences: ['s1'], flightDetails: { duration: '03:50' } }],
      flightSegmentList: [{ key: 's1', equipment: { code: '' }, departure: { airport: { code: 'TLV' }, date: '2027-06-10', time: '19:40', terminal: '' }, arrival: { airport: { code: 'FCO' }, city: { name: 'Rome' }, date: '2027-06-10', time: '22:30' },
        marketingCarrier: { airline: { code: 'W4', name: 'Wizz' }, flightNumber: 6034 }, operatingCarrier: { airline: { code: 'W4' } } }] } };
  const slim = slimSearch(raw);
  const a = offerFacts(raw.offers[0], raw), b = offerFacts(slim.offers[0], slim);
  for (const key of ['price', 'totalMinutes', 'stops', 'carriers', 'checked', 'trolley', 'refundable', 'airports']) assert.deepEqual(b[key], a[key], key);
  assert.equal(b.refundable, 'no');
  assert.equal(slim.offers[0].fareDetails.brandedFare[0].serviceList.length, 2, 'only baggage services travel');
  assert.ok(JSON.stringify(slim).length < JSON.stringify(raw).length / 2);
});

test('identical searches share one supplier call; a later one after the TTL calls again', async () => {
  let calls = 0, clock = 0; const run = async () => { calls++; await new Promise(r => setTimeout(r, 5)); return { offers: [] }; };
  const body = { x: Math.random() };
  const [first, second] = await Promise.all([cachedSearch(body, run, () => clock), cachedSearch(body, run, () => clock)]);
  assert.equal(calls, 1); assert.equal(first.cached, false); assert.equal(second.cached, false);
  clock += 60000; assert.equal((await cachedSearch(body, run, () => clock)).cached, true); assert.equal(calls, 1);
  clock += 5 * 60000; await cachedSearch(body, run, () => clock); assert.equal(calls, 2);
});

test('one retry for transient supplier failures only', async () => {
  let n = 0; const sleep = async () => {};
  assert.equal(await withRetry(async () => { if (n++ === 0) throw Object.assign(new Error('x'), { status: 503 }); return 'ok'; }, { sleep }), 'ok');
  n = 0; await assert.rejects(withRetry(async () => { n++; throw Object.assign(new Error('bad'), { status: 400 }); }, { sleep })); assert.equal(n, 1);
  n = 0; await assert.rejects(withRetry(async () => { n++; throw new Error('volero_timeout'); }, { sleep })); assert.equal(n, 1, 'a timeout already used the whole wait');
});

test('rate limits per client and route', () => {
  const client = 'test-' + Math.random(), t = 1_000_000;
  for (let i = 0; i < 12; i++) assert.equal(allow(client, 'search', t), true);
  assert.equal(allow(client, 'search', t), false);
  assert.equal(allow(client, 'availability', t), true, 'routes have separate buckets');
  assert.equal(allow(client, 'search', t + 10000), true, 'tokens refill over time');
});

test('the search endpoint rejects free-form input before any supplier call', async () => {
  const server = createServer(); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/volero/flights/search`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': 'guard-test' }, body: JSON.stringify({ anything: 'goes' }) });
    assert.equal(response.status, 400); assert.equal((await response.json()).error, 'search_input_invalid');
  } finally { await new Promise(resolve => server.close(resolve)); }
});
