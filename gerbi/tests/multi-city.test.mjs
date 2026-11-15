// Spec 10: multi-city / open jaw + fare extras (docs/specs/10-multi-city-he.md).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateLegs, multiRequest, routeText, groundGaps, isRoundShape, legName, cleanRoute, multiLink, parseMultiLink, MAX_LEGS } from '../dist/multi-city-core.mjs';
import { perPassenger, seatsLeft, fareInclusions, layoverAirports } from '../dist/fare-extras.mjs';
import { offerFacts, emptyFilters, matchesFilters } from '../dist/flight-view.mjs';
import { searchLink, parseSearchLink, flightSnapshot, restoreSavedFlights, followUpText } from '../dist/saved-flights.mjs';
import { validSearch, isMultiCity, slimSearch, allow, LIMITS } from '../backend/volero-guard.mjs';

const today = '2026-11-15';
const L = (from, to, date) => ({ from, to, date });

test('legs: codes out, Hebrew errors that point at the leg and field', () => {
  assert.deepEqual(validateLegs([L('תל אביב', 'רומא', '2026-12-10'), L('FCO', 'פריז · PAR', '2026-12-14'), L('paris', 'TLV', '2026-12-14')], today),
    [L('TLV', 'FCO', '2026-12-10'), L('FCO', 'PAR', '2026-12-14'), L('PAR', 'TLV', '2026-12-14')]);
  const error = (legs, field) => assert.throws(() => validateLegs(legs, today), e => e.field === field && /[א-ת]/.test(e.message), field);
  error([L('TLV', 'FCO', '2026-12-10')], '[data-leg="0"] [data-part="from"]');
  error(Array.from({ length: MAX_LEGS + 1 }, (_, i) => L('TLV', 'FCO', `2026-12-1${i}`)), `[data-leg="${MAX_LEGS - 1}"] [data-part="from"]`);
  error([L('TLV', 'FCO', '2026-12-10'), L('', 'TLV', '2026-12-14')], '[data-leg="1"] [data-part="from"]');
  error([L('TLV', 'גבעתיים', '2026-12-10'), L('FCO', 'TLV', '2026-12-14')], '[data-leg="0"] [data-part="to"]');
  error([L('TLV', 'TLV', '2026-12-10'), L('FCO', 'TLV', '2026-12-14')], '[data-leg="0"] [data-part="to"]');
  error([L('TLV', 'FCO', ''), L('FCO', 'TLV', '2026-12-14')], '[data-leg="0"] [data-part="date"]');
  error([L('TLV', 'FCO', '2026-11-01'), L('FCO', 'TLV', '2026-12-14')], '[data-leg="0"] [data-part="date"]');
  error([L('TLV', 'FCO', '2027-12-10'), L('FCO', 'TLV', '2027-12-14')], '[data-leg="0"] [data-part="date"]');
  error([L('TLV', 'FCO', '2026-12-10'), L('FCO', 'TLV', '2026-12-09')], '[data-leg="1"] [data-part="date"]');
});

test('one supplier request for all legs; the server accepts it and keeps the order rules', () => {
  const legs = [L('TLV', 'FCO', '2026-12-10'), L('FCO', 'PAR', '2026-12-14'), L('PAR', 'TLV', '2026-12-18')];
  const request = multiRequest(legs, 2, 1);
  assert.deepEqual(request.originDestinations.map(o => [o.origin.code, o.destination.code, o.destination.type]), [['TLV', 'FCO', 'a'], ['FCO', 'PAR', 'c'], ['PAR', 'TLV', 'a']]);
  assert.deepEqual(request.passengers.ptcList, [{ ptc: 'ADT', count: 2 }, { ptc: 'CHD', count: 1 }]);
  assert.equal(validSearch(request, today).originDestinations.length, 3);
  const five = multiRequest(Array.from({ length: 5 }, (_, i) => L(['TLV', 'FCO', 'PAR', 'LON', 'BER'][i], ['FCO', 'PAR', 'LON', 'BER', 'TLV'][i], `2026-12-1${i}`)), 1, 0);
  assert.ok(validSearch(five, today));
  const six = { ...five, originDestinations: [...five.originDestinations, { origin: { code: 'TLV', type: 'a' }, destination: { code: 'ATH', type: 'a' }, date: '2026-12-20' }] };
  assert.equal(validSearch(six, today), null, 'the supplier answers no more than 5 legs');
  const down = multiRequest([L('TLV', 'FCO', '2026-12-10'), L('FCO', 'PAR', '2026-12-14'), L('PAR', 'TLV', '2026-12-12')], 1, 0);
  assert.equal(validSearch(down, today), null, 'dates never go back');
  const twice = multiRequest([L('TLV', 'FCO', '2026-12-10'), L('TLV', 'FCO', '2026-12-10'), L('FCO', 'TLV', '2026-12-12')], 1, 0);
  assert.equal(validSearch(twice, today), null, 'the same leg twice');
});

test('multi-city has its own, tighter rate bucket; a plain round trip does not count as multi', () => {
  const req = legs => ({ originDestinations: legs.map(([o, d]) => ({ origin: { code: o }, destination: { code: d } })) });
  assert.equal(isMultiCity(req([['TLV', 'FCO'], ['FCO', 'TLV']])), false);
  assert.equal(isMultiCity(req([['TLV', 'FCO']])), false);
  assert.equal(isMultiCity(req([['TLV', 'FCO'], ['PAR', 'TLV']])), true, 'open jaw');
  assert.equal(isMultiCity(req([['TLV', 'FCO'], ['FCO', 'PAR'], ['PAR', 'TLV']])), true);
  const client = 'multi-test-' + Math.random(), [capacity] = LIMITS.searchMulti;
  assert.ok(capacity < LIMITS.search[0]);
  for (let i = 0; i < capacity; i++) assert.equal(allow(client, 'searchMulti', 1000), true);
  assert.equal(allow(client, 'searchMulti', 1000), false);
});

test('route text, ground gaps, open jaw vs round trip, leg names', () => {
  const route = [L('TLV', 'FCO', '2026-12-10'), L('FCO', 'PAR', '2026-12-14'), L('PAR', 'TLV', '2026-12-18')];
  assert.equal(routeText(route), 'תל אביב → רומא → פריז → תל אביב');
  assert.deepEqual(groundGaps(route), []);
  const jaw = [L('TLV', 'FCO', '2026-12-10'), L('PAR', 'TLV', '2026-12-18')];
  assert.equal(routeText(jaw), 'תל אביב → רומא · פריז → תל אביב');
  assert.deepEqual(groundGaps(jaw), [{ index: 1, from: 'FCO', to: 'PAR' }]);
  assert.deepEqual(groundGaps([L('TLV', 'CDG', '2026-12-10'), L('PAR', 'TLV', '2026-12-18')]), [], 'an airport and its city are the same place');
  assert.equal(isRoundShape([L('TLV', 'FCO', 'x'), L('FCO', 'TLV', 'y')]), true);
  assert.equal(isRoundShape(jaw), false);
  assert.deepEqual([legName(0, false), legName(1, false), legName(2, true)], ['הלוך', 'חזור', 'טיסה 3']);
});

test('share link: multi round-trips, bad links are ignored, old links still parse', () => {
  const legs = [L('TLV', 'FCO', '2026-12-10'), L('FCO', 'PAR', '2026-12-14'), L('PAR', 'TLV', '2026-12-18')];
  const link = searchLink({ type: 'multi', legs, adults: 2, children: 1 });
  assert.match(link, /type=multi/); assert.ok(!/price|srk/i.test(link));
  assert.equal(multiLink({ legs, adults: 2, children: 1 }), link);
  const back = parseSearchLink(link);
  assert.deepEqual([back.type, back.legs, back.adults, back.children, back.destination], ['multi', legs, 2, 1, 'תל אביב → רומא → פריז → תל אביב']);
  for (const bad of ['#/?type=multi&legs=TLV-FCO-2026-12-10&adults=1', '#/?type=multi&legs=TLV-FCO-2026-12-10,FCO-TLV-2026-12-01&adults=1', '#/?type=multi&legs=TLV-TLV-2026-12-10,FCO-TLV-2026-12-11&adults=1', '#/?type=multi&legs=x&adults=1', '#/?type=multi&legs=TLV-FCO-2026-12-10,FCO-TLV-2026-12-11&adults=0'])
    assert.equal(parseSearchLink(bad), null, bad);
  assert.equal(parseSearchLink('#/?type=multi&' + new URLSearchParams({ legs: Array(6).fill('TLV-FCO-2026-12-10').join(','), adults: '1' })), null);
  const round = parseSearchLink(searchLink({ origin: 'TLV', destination: 'FCO', start: '2026-12-10', end: '2026-12-14', type: 'round', adults: 2, children: 0 }));
  assert.deepEqual([round.type, round.to, round.end], ['round', 'FCO', '2026-12-14']);
  assert.equal(parseSearchLink('#/?from=TLV&to=FCO&depart=2026-12-10&type=oneway&adults=1&children=0').type, 'oneway');
  assert.equal(cleanRoute([L('TLV', 'FCO', '2026-12-10')]), null);
});

// A 3-leg offer, built like the supplier's (trimmed) answer.
const seg = (key, from, fromCity, to, toCity, date, dep, arr, carrier = 'AZ') => ({ key, departure: { airport: { code: from }, city: { code: fromCity }, date, time: dep }, arrival: { airport: { code: to }, city: { code: toCity }, date, time: arr }, marketingCarrier: { airline: { code: carrier, name: carrier }, flightNumber: 1 } });
const svc = (categoryCode, chargeType) => ({ categoryCode, chargeType, name: 'x' });
function payload({ secondFrom = 'ORY', items } = {}) {
  return {
    srk: 's', offers: [{ index: '1', flightsOverview: [{ itineraryIndex: 0, flightReferences: ['f1', 'f2', 'f3'] }], baggageAllowanceList: [],
      offerItems: items ?? [{ ptc: 'ADT', count: 2, price: { currency: 'USD', fullFare: 300, serviceFee: 10 }, seats: 3 }, { ptc: 'CHD', count: 1, price: { currency: 'USD', fullFare: 250, serviceFee: 10 }, seats: 7 }],
      fareDetails: { totalPrice: { selling: { value: 880, currency: 'USD' } }, nonRefundable: true,
        brandedFare: [{ name: 'Light', departure: 'TLV', arrival: 'ROM', serviceList: [svc('VC', 'chargeable'), svc('VR', 'notOffered'), svc('VR', 'chargeable'), svc('SE', 'chargeable'), svc('ML', 'included')] }] } }],
    dataLists: { flightList: [{ key: 'f1', segmentReferences: ['a', 'b'], flightDetails: { duration: '05:00' } }, { key: 'f2', segmentReferences: ['c'], flightDetails: { duration: '02:10' } }, { key: 'f3', segmentReferences: ['d'], flightDetails: { duration: '04:30' } }],
      flightSegmentList: [seg('a', 'TLV', 'TLV', 'IST', 'IST', '2026-12-10', '06:00', '08:00', 'TK'), seg('b', 'IST', 'IST', 'FCO', 'ROM', '2026-12-10', '09:30', '11:00', 'TK'),
        seg('c', 'FCO', 'ROM', 'ORY', 'PAR', '2026-12-14', '10:00', '12:10'), seg('d', secondFrom, 'PAR', 'TLV', 'TLV', '2026-12-18', '20:00', '01:30')] }
  };
}

test('offer facts for 3 legs: total time, airports on the way, real airport changes only', () => {
  const p = payload(), f = offerFacts(p.offers[0], p);
  assert.equal(f.legs.length, 3); assert.equal(f.totalMinutes, 700);
  assert.deepEqual(f.airports, ['FCO', 'ORY']);
  assert.equal(f.airportChange, false, 'leaving Rome after landing in Rome; then leaving Paris from where we landed');
  const changed = payload({ secondFrom: 'CDG' }); assert.equal(offerFacts(changed.offers[0], changed).airportChange, true, 'landed ORY, leaves CDG');
  // Open jaw: land in Rome (ROM), leave from Paris (PAR) – the plan, not an airport change.
  const jaw = { ...p, offers: [{ ...p.offers[0], flightsOverview: [{ itineraryIndex: 0, flightReferences: ['f1', 'f3'] }] }] };
  assert.equal(offerFacts(jaw.offers[0], jaw).airportChange, false);
});

test('filters: last-flight time on multi, avoid a layover airport', () => {
  const p = payload(), f = offerFacts(p.offers[0], p);
  assert.equal(matchesFilters(f, { ...emptyFilters(), back: ['evening'] }), true, 'the last leg leaves at 20:00');
  assert.equal(matchesFilters(f, { ...emptyFilters(), back: ['morning'] }), false, 'not the second leg at 10:00');
  assert.equal(matchesFilters(f, { ...emptyFilters(), avoid: ['IST'] }), false);
  assert.equal(matchesFilters(f, { ...emptyFilters(), avoid: ['AMS'] }), true);
  assert.deepEqual(emptyFilters().avoid, []);
  assert.deepEqual(layoverAirports([f, f]), [['IST', 2]]);
});

test('fare extras: per-passenger prices that add up, seats left, what the fare includes', () => {
  const p = payload(), offer = p.offers[0], total = { value: 880, currency: 'USD' };
  assert.deepEqual(perPassenger(offer, total), [{ ptc: 'ADT', count: 2, value: 310, currency: 'USD' }, { ptc: 'CHD', count: 1, value: 260, currency: 'USD' }]);
  assert.equal(perPassenger(offer, { value: 900, currency: 'USD' }), null, 'never shown when it does not add up');
  assert.equal(perPassenger(offer, { value: 880, currency: 'EUR' }), null);
  assert.equal(perPassenger({}, total), null);
  assert.equal(seatsLeft(offer), 3);
  assert.equal(seatsLeft({ offerItems: [{ seats: null }] }), null);
  const f = offerFacts(offer, p);
  assert.deepEqual(fareInclusions(offer, f.legs[0]).map(x => [x.key, x.state]), [['change', 'paid'], ['refund', 'paid'], ['seat', 'paid'], ['meal', 'included']], 'matched by city code; best charge wins');
  assert.deepEqual(fareInclusions(offer, f.legs[1]), [], 'no fare family for this leg: nothing is guessed');
});

test('trimming keeps per-passenger prices, seats and one fare service per category', () => {
  const raw = payload(); raw.offers[0].offerItems = [{ ptc: 'ADT', count: 1, fareBasis: ['X'], price: { currency: 'USD', fullFare: 100, serviceFee: 5, taxes: [] }, fareComponents: [{ numberOfSeats: 4 }, { numberOfSeats: 2 }] }];
  raw.offers[0].fareDetails.brandedFare[0].serviceList.push(svc('VC', 'chargeable'), { categoryCode: 'OTHER', atpcoSubGroup: 'RF', chargeType: 'included', name: 'REFUNDABLE TICKET' }, { categoryCode: 'FF', chargeType: 'included', name: 'MILES' });
  const slim = slimSearch(raw).offers[0];
  assert.deepEqual(slim.offerItems, [{ ptc: 'ADT', count: 1, price: { currency: 'USD', fullFare: 100, serviceFee: 5 }, seats: 2 }]);
  const codes = slim.fareDetails.brandedFare[0].serviceList.map(s => `${s.categoryCode}:${s.chargeType}`);
  assert.deepEqual(codes, ['VC:chargeable', 'VR:notOffered', 'VR:chargeable', 'SE:chargeable', 'ML:included', 'VR:included']);
});

test('saved multi flight keeps every leg and its route; old saved flights still load', () => {
  const p = payload(), facts = offerFacts(p.offers[0], p);
  const legs = [L('TLV', 'FCO', '2026-12-10'), L('FCO', 'PAR', '2026-12-14'), L('PAR', 'TLV', '2026-12-18')];
  const search = { type: 'multi', legs, origin: 'TLV', destination: routeText(legs), start: '2026-12-10', end: '', adults: 2, children: 1 };
  const snap = flightSnapshot(facts, search, { price: { value: 880, currency: 'USD' }, at: new Date(), changed: false });
  const [restored] = restoreSavedFlights(JSON.stringify([snap]));
  assert.equal(restored.legs.length, 3); assert.deepEqual(restored.route, legs); assert.equal(restored.to, 'TLV');
  assert.match(followUpText(restored, x => `${x.value} ${x.currency}`), /טיסה 3: ORY→TLV/);
  const old = { ...snap, legs: snap.legs.slice(0, 2) }; delete old.route;
  const [legacy] = restoreSavedFlights(JSON.stringify([old]));
  assert.equal(legacy.route, undefined); assert.match(followUpText(legacy, x => String(x.value)), /חזור: /);
  const [tampered] = restoreSavedFlights(JSON.stringify([{ ...snap, route: [L('TLV', 'TLV', '2026-12-10'), L('x', 'y', 'z')] }]));
  assert.equal(tampered.route, undefined, 'a broken route is dropped, the flight kept');
});
