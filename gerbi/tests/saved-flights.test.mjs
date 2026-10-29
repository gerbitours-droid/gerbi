import { test } from 'node:test';
import assert from 'node:assert/strict';
import { flightSnapshot, restoreSavedFlights, addSavedFlight, searchLink, parseSearchLink, followUpText, contactActions } from '../dist/saved-flights.mjs';

const facts = { carriers: ['Wizz Air'], checked: 'unknown', trolley: 'paid', legs: [
  { segments: [{ departure: { airport: { code: 'TLV' }, date: '2027-06-10', time: '19:40' }, arrival: { airport: { code: 'FCO' }, date: '2027-06-10', time: '22:30' } }], minutes: 230, summary: { stops: 0, dayOffset: 0 } },
  { segments: [{ departure: { airport: { code: 'FCO' }, date: '2027-06-15', time: '05:40' }, arrival: { airport: { code: 'TLV' }, date: '2027-06-15', time: '10:10' } }], minutes: 210, summary: { stops: 0, dayOffset: 0 } }] };
const search = { origin: 'TLV', destination: 'רומא, איטליה', start: '2027-06-10', end: '2027-06-15', adults: 2, children: 1 };
const check = { price: { value: 319.82, currency: 'USD' }, at: new Date('2026-10-29T12:00:00Z'), changed: false };

test('a saved flight is a validated snapshot linked to its demo destination', () => {
  const saved = flightSnapshot(facts, search, check);
  assert.equal(saved.trip, 'rome');
  assert.equal(saved.to, 'FCO');
  const [restored] = restoreSavedFlights(JSON.stringify([saved]));
  assert.equal(restored.price, 319.82);
  assert.deepEqual(restored.legs[1], { from: 'FCO', to: 'TLV', departDate: '2027-06-15', departTime: '05:40', arriveDate: '2027-06-15', arriveTime: '10:10', stops: 0, minutes: 210, dayOffset: 0 });
  assert.deepEqual(restoreSavedFlights('{"not":"a list"}'), []);
  assert.deepEqual(restoreSavedFlights(JSON.stringify([{ ...saved, price: 'free' }, { ...saved, trip: 'atlantis', id: 'b' }])).map(f => f.trip), [null]);
  const many = Array.from({ length: 12 }, (_, i) => ({ ...saved, id: 'f' + i })).reduce(addSavedFlight, []);
  assert.equal(many.length, 10);
  assert.equal(many[0].id, 'f11');
});

test('share links carry search conditions only, and malformed links are ignored', () => {
  const link = searchLink(search);
  assert.equal(link, '#/?from=TLV&to=FCO&depart=2027-06-10&return=2027-06-15&adults=2&children=1');
  assert.deepEqual(parseSearchLink(link), { origin: 'TLV', to: 'FCO', start: '2027-06-10', end: '2027-06-15', type: 'round', adults: 2, children: 1, destination: 'רומא, איטליה' });
  const oneWay = searchLink({ ...search, origin: 'CDG', end: '', type: 'oneway' });
  assert.equal(oneWay, '#/?from=CDG&to=FCO&depart=2027-06-10&type=oneway&adults=2&children=1');
  assert.equal(parseSearchLink(oneWay).type, 'oneway');
  assert.equal(parseSearchLink(oneWay).end, '');
  assert.equal(parseSearchLink('#/?from=TLV&to=LCA&depart=2027-06-10&return=2027-06-10&adults=1').type, 'round');
  assert.equal(parseSearchLink('#/?from=TLV&to=FCO&depart=2027-06-15&return=2027-06-10&adults=2'), null);
  assert.equal(parseSearchLink('#/?from=TLV&to=FCO&depart=2027-06-10&return=2027-06-15&adults=8&children=2'), null);
  assert.equal(parseSearchLink('#/destinations?from=TLV'), null);
  assert.equal(parseSearchLink('#/'), null);
});

test('follow-up message and channels: nothing is offered until a channel is configured', () => {
  const text = followUpText(flightSnapshot(facts, search, check), p => `${p.value} ${p.currency}`);
  assert.match(text, /הלוך: TLV→FCO 2027-06-10 19:40–22:30, ישירה/);
  assert.match(text, /לא הוזמן/);
  assert.deepEqual(contactActions({ whatsapp: '', email: '' }, text), []);
  const actions = contactActions({ whatsapp: '972501234567', email: 'agent@example.com' }, 'שלום');
  assert.equal(actions[0].href, 'https://wa.me/972501234567?text=%D7%A9%D7%9C%D7%95%D7%9D');
  assert.match(actions[1].href, /^mailto:agent@example\.com\?subject=/);
  assert.deepEqual(contactActions({ whatsapp: '+972-50', email: 'not-an-email' }, 'x'), []);
});
