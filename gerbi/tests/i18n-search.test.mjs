// Spec 21: the search widgets, multi-city, deals strip, FX and converter in English (the page language comes from
// the path, so the modules are imported after pretending to be on /en/).
import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.location = { pathname: '/en/', hash: '', origin: 'http://x' };
const { travelersText } = await import('../dist/search-form.mjs');
const { validateLegs, gapText, legName, routeText } = await import('../dist/multi-city-core.mjs');
const { detectLegs } = await import('../dist/multi-city-brief.mjs');
const { dealCard } = await import('../dist/deals-strip.mjs');
const { setFx, resetFx, fxNote, fareText, originalHtml, formatIls } = await import('../dist/fx.mjs');
const { parseAmount, converterHtml, MAIN_CURRENCIES, formatAgorot } = await import('../dist/converter.mjs');
const HEBREW = /[֐-׿]/;
const today = '2026-11-15';

test('travelers: English plurals', () => {
  assert.equal(travelersText(1, 0), '1 traveler');
  assert.equal(travelersText(2, 0), '2 travelers');
  assert.equal(travelersText(3, 1), '4 travelers · incl. 1 child');
  assert.equal(travelersText(4, 2), '6 travelers · incl. 2 children');
});

test('multi-city: English errors, leg names, gaps and route text', () => {
  assert.throws(() => validateLegs([{ from: 'TLV', to: 'FCO', date: '2026-12-01' }], today), /at least 2 flights/);
  assert.throws(() => validateLegs([{ from: 'TLV', to: 'FCO', date: '2026-12-01' }, { from: 'FCO', to: 'FCO', date: '2026-12-05' }], today), /Flight 2 has the same origin and destination/);
  assert.throws(() => validateLegs([{ from: 'TLV', to: 'Atlantis', date: '2026-12-01' }, { from: 'FCO', to: 'PAR', date: '2026-12-05' }], today), /We didn’t recognize “Atlantis” in flight 1/);
  assert.equal(legName(0, false), 'Outbound');
  assert.equal(legName(1, false), 'Return');
  assert.equal(legName(2, true), 'Flight 3');
  assert.equal(gapText({ from: 'FCO', to: 'PAR' }), 'There’s no flight from Rome to Paris in this route: you’ll need to get there on your own.');
  assert.equal(routeText([{ from: 'TLV', to: 'FCO' }, { from: 'FCO', to: 'PAR' }, { from: 'PAR', to: 'TLV' }]), 'Tel Aviv → Rome → Paris → Tel Aviv');
});

test('multi-city from English free text', () => {
  assert.deepEqual(detectLegs('from Tel Aviv to Rome on 12 June, then Paris on 18 June and back home on 25 June', { today }).legs,
    [{ from: 'TLV', to: 'FCO', date: '2027-06-12' }, { from: 'FCO', to: 'PAR', date: '2027-06-18' }, { from: 'PAR', to: 'TLV', date: '2027-06-25' }]);
  assert.deepEqual(detectLegs('Rome on June 3rd, then Paris on June 8th, then Barcelona on June 12', { today }).legs.map((l) => l.to), ['FCO', 'PAR', 'BCN']);
  assert.deepEqual(detectLegs('fly to Rome on 3 March and fly back from Paris on 10 March', { today }).legs,
    [{ from: 'TLV', to: 'FCO', date: '2027-03-03' }, { from: 'PAR', to: 'TLV', date: '2027-03-10' }], 'open jaw');
  assert.equal(detectLegs('London 5/1 then Berlin 9/1 then Amsterdam 12/1 and back home 15/1', { today }).legs.length, 4);
  assert.deepEqual(detectLegs('I saw Rome on 12 June then Paris on 20 June', { today }).legs.map((l) => l.to), ['FCO', 'PAR'], '"saw" is a word, not the SAW airport');
  assert.equal(detectLegs('to Rome on 10 Dec and back on 15 Dec', { today }), null, 'one destination is a round trip');
  assert.equal(detectLegs('Rome and Paris in August, then home', { today }), null, 'no exact dates');
});

test('deals strip card is English', () => {
  const html = dealCard({ destination: 'FCO', depart: '2026-12-10', back: '2026-12-15', stops: 0, carrier: 'LY', price: { value: 900, currency: 'ILS' } }, 0);
  assert.ok(!HEBREW.test(html), html);
  assert.match(html, /Search flights Tel Aviv–Rome, 10\/12 to 15\/12, from ₪900 per traveler/);
  assert.match(html, /5 nights/);
  assert.match(html, /Direct/);
});

test('FX notes and fare text are English with en-GB dates', () => {
  setFx({ ok: true, asOf: '2026-11-13', method: 'leumi', rates: { USD: 3.7 } });
  assert.equal(fxNote(), 'at the bank transfer selling rate, as of 13 Nov 2026');
  assert.equal(fareText({ value: 100, currency: 'USD' }), '₪370 (originally US$100.00, at the bank transfer selling rate, as of 13 Nov 2026)');
  assert.ok(!HEBREW.test(originalHtml({ value: 100, currency: 'USD' })));
  assert.equal(formatIls(1234), '₪1,234');
  resetFx();
});

test('converter is English', () => {
  assert.deepEqual(MAIN_CURRENCIES.map((c) => c[1]), ['US dollar', 'Euro', 'British pound']);
  assert.match(parseAmount('abc').error, /Enter an amount/);
  assert.ok(!HEBREW.test(converterHtml()));
  assert.equal(formatAgorot(1234.5), '₪1,234.50');
});
