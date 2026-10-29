import { test } from 'node:test';
import assert from 'node:assert/strict';
import { offerFacts, matchesFilters, emptyFilters, sortFacts, parseDuration, timeBucket } from '../dist/flight-view.mjs';

const point = (code, date, time) => ({ airport: { code }, date, time });
const segment = (key, from, to, depart, arrive, airline = { code: 'W4', name: 'Wizz Air' }) =>
  ({ key, departure: point(from, '2027-06-10', depart), arrival: point(to, '2027-06-10', arrive), marketingCarrier: { airline, flightNumber: 1 } });
const payload = {
  dataLists: {
    flightSegmentList: [segment('a', 'TLV', 'FCO', '06:00', '09:00'), segment('b', 'FCO', 'TLV', '19:00', '23:30'),
      segment('c', 'TLV', 'ATH', '13:00', '15:00', { code: 'A3', name: 'Aegean' }), segment('d', 'ATH', 'FCO', '16:00', '17:30', { code: 'A3', name: 'Aegean' })],
    flightList: [{ key: 'out1', segmentReferences: ['a'], flightDetails: { duration: '03:50' } }, { key: 'back1', segmentReferences: ['b'], flightDetails: { duration: '03:30' } },
      { key: 'out2', segmentReferences: ['c', 'd'], flightDetails: { duration: '05:30' } }]
  }
};
const fare = (from, to, services) => ({ name: 'Basic', departure: from, arrival: to, serviceList: services });
const direct = { index: 'd1', flightsOverview: [{ flightReferences: ['out1', 'back1'] }],
  baggageAllowanceList: [{ segmentReference: 'a', baggageAllowance: [{ ptc: 'ADT', quantity: '0', type: 'PC' }] }, { segmentReference: 'b', baggageAllowance: [] }],
  fareDetails: { totalPrice: { selling: { value: 320, currency: 'USD' } }, brandedFare: [
    fare('TLV', 'FCO', [{ categoryCode: 'BG', chargeType: 'chargeable', name: 'HoldBag [40 USD]' }, { categoryCode: 'CY', chargeType: 'included', name: 'SmallCabinBag' }, { categoryCode: 'CY', chargeType: 'chargeable', name: 'LargeCabinBag' }]),
    fare('FCO', 'TLV', [])] } };
const connecting = { index: 'c1', flightsOverview: [{ flightReferences: ['out2', 'back1'] }],
  baggageAllowanceList: [{ segmentReference: 'c', baggageAllowance: [{ ptc: 'ADT', quantity: '1', type: 'PC' }] }, { segmentReference: 'b', baggageAllowance: [{ ptc: 'ADT', quantity: '1', type: 'PC' }] }],
  fareDetails: { totalPrice: { selling: { value: 280, currency: 'USD' } }, brandedFare: [fare('TLV', 'FCO', [{ categoryCode: 'CY', chargeType: 'included', name: '1 Carry-on bag up to 8Kg' }])] } };

test('supplier durations and departure buckets', () => {
  assert.equal(parseDuration('07:20'), 440);
  assert.equal(parseDuration(null), null);
  assert.equal(timeBucket('05:40'), 'morning');
  assert.equal(timeBucket('23:10'), 'evening');
  assert.equal(timeBucket('02:00'), 'night');
});

test('baggage comes from supplier data, and missing data stays "unknown" rather than included or excluded', () => {
  const a = offerFacts(direct, payload), b = offerFacts(connecting, payload);
  assert.equal(a.legs[0].baggage.checked, 'paid');
  assert.equal(a.legs[1].baggage.checked, 'unknown');
  assert.equal(a.checked, 'unknown');
  assert.equal(a.legs[0].baggage.trolley, 'paid');
  assert.equal(b.checked, 'included');
  assert.equal(b.legs[0].baggage.trolley, 'included');
  assert.equal(a.totalMinutes, 440);
  assert.equal(b.stops, 1);
  assert.deepEqual(b.carriers, ['Aegean', 'Wizz Air']);
});

test('filters, counts per option and both sorts', () => {
  const facts = [offerFacts(direct, payload), offerFacts(connecting, payload)];
  const only = patch => facts.filter(f => matchesFilters(f, { ...emptyFilters(), ...patch })).map(f => f.index);
  assert.deepEqual(only({ stops: '0' }), ['d1']);
  assert.deepEqual(only({ out: ['afternoon'] }), ['c1']);
  assert.deepEqual(only({ back: ['evening'] }), ['d1', 'c1']);
  assert.deepEqual(only({ carriers: ['Aegean'] }), ['c1']);
  assert.deepEqual(only({ checkedBag: true }), ['c1']);
  assert.deepEqual(only({ carriers: ['Aegean', 'Wizz Air'] }), ['d1', 'c1']);
  assert.deepEqual(sortFacts(facts, 'price').map(f => f.index), ['c1', 'd1']);
  assert.deepEqual(sortFacts(facts, 'duration').map(f => f.index), ['d1', 'c1']);
  const mixed = [facts[0], { ...facts[1], price: { value: 1, currency: 'EUR' } }];
  assert.deepEqual(sortFacts(mixed, 'price').map(f => f.index), ['d1', 'c1']);
});
