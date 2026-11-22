// Spec 25 (online booking): state machine, validation, encryption, payment notification checks and the order flow
// over HTTP in every mode — with the fake supplier and the mock payment provider only. A guard below makes any
// network call from these tests fail, so nothing here can ever reach the supplier or a gateway.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { transition, canMove, TRANSITIONS, TERMINAL, EDITABLE } from '../backend/order-machine.mjs';
import { createSealer, keyFrom, bookingKey } from '../backend/booking-crypto.mjs';
import { validatePassenger, validatePassengers, validateContact, requirementsFrom, ageOn, ilsOf, titleOf, extraLabel, extraKind, extrasSelection, extrasTotal, cleanExtrasChoice, issueDateProblem, validateTraveller, maskedDocument } from '../dist/booking-core.mjs';
import { normalizeQuote, fakeSupplier, liveSupplier, extrasOf, extrasFor, bagChoice, travellersFor, liveWritesEnabled } from '../backend/booking-supplier.mjs';
import { mockPayments, paymePayments, notifyToken, hmac } from '../backend/payments.mjs';
import { createOrders, bookingMode } from '../backend/orders.mjs';
import { createStore } from '../backend/kv-store.mjs';
import { readFileSync } from 'node:fs';

process.env.TRUST_PROXY = '1';
const KEY = 'a'.repeat(64), SECRET = 'webhook-secret-for-tests-0123456789';
const recorded = JSON.parse(readFileSync(new URL('./fixtures/booking/availability-raw.json', import.meta.url), 'utf8'));
const OFFER = { srk: 'fixture-srk-0001', offerIndex: recorded[1].offerIndex, searchToken: 'fixture-search-token', itineraryIndex: 0 };
const BAG_OFFER = { ...OFFER, offerIndex: recorded[0].offerIndex };

// No real network from this file: the supplier, the gateway and the email provider are all fakes.
const realFetch = globalThis.fetch;
before(() => { globalThis.fetch = async (url, init) => { if (/^http:\/\/127\.0\.0\.1:/.test(String(url))) return realFetch(url, init); throw new Error(`network call blocked in tests: ${url}`); }; });
after(() => { globalThis.fetch = realFetch; });

// ---------------------------------------------------------------- state machine
test('state machine: allowed moves, refused moves, audit trail', () => {
  let order = { id: 'x', status: 'draft', timeline: [] };
  order = transition(order, 'details', { by: 'customer', at: '2026-11-15T10:00:00Z' });
  assert.equal(order.status, 'details');
  assert.deepEqual(order.timeline[0], { at: '2026-11-15T10:00:00Z', from: 'draft', to: 'details', by: 'customer' });
  assert.throws(() => transition(order, 'confirmed'), /invalid_transition/);
  assert.throws(() => transition(order, 'nope'), /unknown_state/);
  // Money never moves straight from a quote to confirmed; a booking failure after payment ends in voided or with an agent.
  assert.equal(canMove('priced', 'confirmed'), false);
  assert.deepEqual(TRANSITIONS.booking_failed, ['voided', 'needs_agent']);
  assert.ok(canMove('payment_authorized', 'price_changed'));
  for (const s of TERMINAL) assert.equal(TRANSITIONS[s].length, 0);
  for (const s of EDITABLE) assert.ok(canMove(s, 'cancelled') || s === 'payment_failed' && canMove(s, 'cancelled'));
  // Every target state is a known state.
  for (const targets of Object.values(TRANSITIONS)) for (const to of targets) assert.ok(to in TRANSITIONS, to);
});

// ---------------------------------------------------------------- encryption
test('passenger data: AES-256-GCM sealed, bound to the order id, tamper-evident', () => {
  const sealer = createSealer(KEY), data = { passengers: [{ firstName: 'DANA', document: { number: 'AB1234567' } }] };
  const sealed = sealer.seal(data, 'order-1');
  assert.match(sealed, /^v1\./);
  assert.equal(sealed.includes('AB1234567'), false);
  assert.deepEqual(sealer.open(sealed, 'order-1'), data);
  assert.throws(() => sealer.open(sealed, 'order-2'));
  const parts = sealed.split('.'); parts[2] = parts[2].slice(0, -2) + (parts[2].endsWith('A') ? 'B' : 'A') + parts[2].slice(-1);
  assert.throws(() => sealer.open(parts.join('.'), 'order-1'));
  assert.throws(() => createSealer('short').seal({}, 'x'), /booking_key_too_short/);
  assert.equal(keyFrom(KEY).length, 32);
  assert.notEqual(sealer.seal(data, 'order-1'), sealed, 'fresh IV per write');
  assert.equal(bookingKey({ VERCEL: '1' }, '/tmp'), null, 'production needs BOOKING_DATA_KEY');
  assert.equal(bookingKey({ BOOKING_DATA_KEY: KEY }).source, 'env');
});

// ---------------------------------------------------------------- validation
test('passenger validation: Latin names, DOB against the passenger type', () => {
  // Names and ages on their own (an older order without the passport requirement).
  const ctx = { requirements: { ...requirementsFrom(), document: false, birthDate: { ADT: false, CHD: true, INF: true } }, travelStart: '2027-01-10', travelEnd: '2027-01-15', today: '2026-11-15', lang: 'he' };
  const adult = { gender: 'f', firstName: ' dana ', lastName: "o'neil-cohen" };
  assert.deepEqual(validatePassenger(adult, { ...ctx, ptc: 'ADT' }).value, { ptc: 'ADT', type: 'adult', gender: 'f', firstName: 'DANA', lastName: "O'NEIL-COHEN", birthDate: '', document: null });
  assert.ok(validatePassenger({ ...adult, firstName: 'דנה' }, { ...ctx, ptc: 'ADT' }).errors.firstName, 'Hebrew name refused');
  assert.ok(validatePassenger({ ...adult, gender: '' }, { ...ctx, ptc: 'ADT' }).errors.gender);
  assert.ok(validatePassenger({ ...adult, birthDate: '2016-01-01' }, { ...ctx, ptc: 'ADT' }).errors.birthDate, 'a 11-year-old is not an adult');
  assert.equal(validatePassenger({ ...adult, birthDate: '2016-01-01' }, { ...ctx, ptc: 'CHD' }).value.birthDate, '2016-01-01');
  assert.ok(validatePassenger({ ...adult }, { ...ctx, ptc: 'CHD' }).errors.birthDate, 'child DOB required');
  assert.ok(validatePassenger({ ...adult, birthDate: '2025-02-01' }, { ...ctx, ptc: 'CHD' }).errors.birthDate, 'under 2 is an infant');
  assert.ok(validatePassenger({ ...adult, birthDate: '2025-01-14' }, { ...ctx, ptc: 'INF' }).errors.birthDate, 'turns 2 before the return flight');
  assert.equal(validatePassenger({ ...adult, birthDate: '2026-03-01' }, { ...ctx, ptc: 'INF' }).value.birthDate, '2026-03-01');
  assert.ok(validatePassenger({ ...adult, birthDate: '2027-01-01' }, { ...ctx, ptc: 'INF' }).errors.birthDate, 'born after departure');
  assert.equal(ageOn('2015-01-11', '2027-01-10'), 11);
  // The list: count per type, duplicates, infants ≤ adults.
  const pax = { ADT: 1, CHD: 0, INF: 0 };
  assert.ok(validatePassengers([], { pax, ...ctx }).errors.form);
  assert.ok(validatePassengers([adult, adult], { pax: { ADT: 2 }, ...ctx }).errors['1.firstName'], 'duplicate');
  assert.equal(titleOf('ADT', 'f'), 'ms'); assert.equal(titleOf('CHD', 'm'), 'mstr'); assert.equal(titleOf('INF', 'f'), 'miss');
  // English messages for the English page.
  assert.match(validatePassenger({ ...adult, firstName: 'דנה' }, { ...ctx, ptc: 'ADT', lang: 'en' }).errors.firstName, /Latin/);
});

test('full passport for every traveller, whatever the offer asks; issue date validated; references resolved on the server only', () => {
  // The recorded offers do not require a document: the site collects it anyway (owner decision 23.11.2026).
  const req = requirementsFrom(recorded[0].raw.pricedOffer.offerConfiguration);
  assert.deepEqual([req.document, req.documentIssueDate, req.supplierDocument, req.birthDate.ADT], [true, true, false, true]);
  const ctx = { ptc: 'ADT', requirements: req, travelStart: '2027-01-10', travelEnd: '2027-01-15', today: '2026-11-15', lang: 'he' };
  const person = { gender: 'f', firstName: 'DANA', lastName: 'LEVI', birthDate: '1990-05-01' };
  const passport = { number: 'ab 123-4567', issuingCountry: 'il', nationality: 'il', issueDate: '2022-02-01', expiryDate: '2031-02-01' };
  const ok = validatePassenger({ ...person, document: passport }, ctx);
  assert.deepEqual(ok.value.document, { type: 'passport', number: 'AB1234567', expiryDate: '2031-02-01', nationality: 'IL', issuingCountry: 'IL', issueDate: '2022-02-01' });
  assert.ok(validatePassenger(person, ctx).errors['document.number'], 'no passport → refused');
  const withDoc = (patch) => validatePassenger({ ...person, document: { ...passport, ...patch } }, ctx);
  assert.ok(withDoc({ expiryDate: '2027-01-12' }).errors['document.expiryDate'], 'expires during the trip');
  assert.ok(withDoc({ expiryDate: '2027-04-01', issueDate: '2017-05-01' }).warnings['document.expiryDate'], 'less than 6 months after the return: warning');
  assert.equal(withDoc({ expiryDate: '2027-04-01', issueDate: '2017-05-01' }).value?.document.expiryDate, '2027-04-01', 'a warning does not block');
  assert.ok(withDoc({ number: '12' }).errors['document.number']);
  assert.ok(withDoc({ nationality: 'ISR' }).errors['document.nationality']);
  assert.equal(withDoc({ issuingCountry: '' }).value.document.issuingCountry, 'IL', 'issuing country defaults to the nationality');
  // Issue date: required, real, not in the future, after birth, before expiry, at most ~10 years before expiry.
  assert.match(withDoc({ issueDate: '' }).errors['document.issueDate'], /הנפקה/);
  assert.ok(withDoc({ issueDate: '2026-12-01' }).errors['document.issueDate'], 'future');
  assert.ok(withDoc({ issueDate: '1989-01-01' }).errors['document.issueDate'], 'before birth');
  assert.ok(withDoc({ issueDate: '2031-03-01' }).errors['document.issueDate'], 'after expiry');
  assert.ok(withDoc({ issueDate: '2015-01-01' }).errors['document.issueDate'], 'longer than 10 years');
  assert.equal(issueDateProblem('2022-02-30'), 'booking.v.docIssue');
  assert.equal(issueDateProblem('2022-02-01', { expiryDate: '2032-02-01', birthDate: '1990-05-01', today: '2026-11-15' }), '');
  assert.match(validatePassenger({ ...person, document: { ...passport, issueDate: '2026-12-01' } }, { ...ctx, lang: 'en' }).errors['document.issueDate'], /future/);
  // "Use the saved passport": only the browser may skip the number (allowReference); the server never does.
  const ref = { ...person, document: { ...passport, number: '', useSaved: true, savedId: 'abc' } };
  assert.equal(validatePassenger(ref, { ...ctx, allowReference: true }).errors['document.number'], undefined);
  assert.ok(validatePassenger(ref, ctx).errors['document.number']);
  // Masking: every field but the number.
  assert.deepEqual(maskedDocument(ok.value.document), { type: 'passport', number: '•••567', expiryDate: '2031-02-01', nationality: 'IL', issuingCountry: 'IL', issueDate: '2022-02-01' });
  // Sent to the supplier: exactly the identificationDocument fields its API accepts.
  const [lead] = travellersFor([{ ...ok.value, title: 'ms' }], { email: 'd@e.co', phone: '0501234567' }, 'GBX-1');
  assert.deepEqual(lead.identificationDocument, { documentType: 'passport', number: 'AB1234567', expiryDate: '2031-02-01', issuingCountry: 'IL', nationality: 'IL', issuingDate: '2022-02-01' });
  assert.equal('gender' in lead || 'document' in lead || 'savedId' in lead, false);
});

test('flight extras: every optional service category, per passenger, readable Hebrew, priced selection', () => {
  const quote = normalizeQuote(recorded[0].raw), extras = quote.extras;
  // 3 travellers × (cabin bundle + sport + outbound bag + return bag) = 12; none dropped, none unknown.
  assert.equal(extras.length, 12);
  assert.deepEqual([...new Set(extras.map((x) => x.kind))].sort(), ['bags', 'cabin', 'sport']);
  assert.deepEqual([...new Set(extras.map((x) => x.pax))].sort(), [0, 1, 2], 'ADT 0, ADT 1, CHD 0 → positions 0, 1, 2');
  assert.equal(extras.find((x) => x.target === 'CHD').pax, 2);
  const cabin = extras.find((x) => x.kind === 'cabin' && x.pax === 0), sport = extras.find((x) => x.kind === 'sport' && x.pax === 0);
  assert.deepEqual([cabin.from, cabin.to], ['TLV', 'TLV'], 'whole trip');
  assert.equal(extraLabel(cabin.options[1].description, 'he').text, 'הלוך וחזור: תיק אישי קטן (40×30×20 ס״מ) + טרולי לתא הנוסעים עד 10 ק״ג (55×40×23 ס״מ) + עלייה מועדפת למטוס');
  assert.equal(extraLabel(sport.options[0].description, 'he').text, 'ציוד ספורט');
  assert.equal(extraLabel('1 bags - 20Kg total(63.8 USD)', 'he').text, 'מזוודה אחת · עד 20 ק״ג');
  assert.equal(extraLabel('3 bags - 26Kg+26Kg+26Kg(232.81 USD)', 'he').text, '3 מזוודות · 26 ק״ג כל אחת');
  assert.equal(extraLabel('2 bags - 20Kg+20Kg(1 USD)', 'en').text, '2 bags · 20 kg each');
  // Unknown wording falls back to the supplier's own text, cleaned of the price and markup; unknown categories → 'other'.
  assert.deepEqual(extraLabel('<b>Lounge Access</b>(30 EUR)', 'he'), { text: 'Lounge Access', known: false });
  assert.equal(extraKind({ name: 'Lounge', categoryCode: 'LG', options: [{ description: 'Lounge Access' }] }), 'other');
  assert.equal(extraKind({ name: 'Seat Map', categoryCode: 'SE' }), 'seat');
  const generic = extrasOf([{ bookingCode: 'x-1', route: { departureCode: 'TLV', arrivalCode: 'ATH' }, target: 'ADT', passengerIndex: '0', service: { name: 'Lounge', categoryCode: 'LG' }, options: [{ code: 'L', description: 'Lounge Access(30 EUR)', price: { amount: 30, currency: 'EUR' } }] },
    { bookingCode: 'x-2', included: true, target: 'ADT', passengerIndex: '0', options: [{ code: '1', price: { amount: 0, currency: 'EUR' } }] },
    { bookingCode: 'x-3', target: 'ADT', passengerIndex: '5', options: [{ code: '1', price: { amount: 1, currency: 'EUR' } }] }], { ADT: 1 });
  assert.deepEqual(generic.map((x) => [x.bookingCode, x.kind]), [['x-1', 'other']], 'included and unknown-passenger services dropped');
  // Selection → optionalServiceList (unknown booking codes / option codes dropped) and the total in the supplier currency.
  const bagOut = extras.find((x) => x.kind === 'bags' && x.pax === 1 && x.to === 'ATH');
  const choice = { [cabin.bookingCode]: '1', [sport.bookingCode]: 'SportEquipment', [bagOut.bookingCode]: '2', nope: '1', [cabin.bookingCode + 'x']: '1' };
  assert.deepEqual(extrasFor(extras, choice), [{ bookingCode: cabin.bookingCode, selectedOptionCode: '1' }, { bookingCode: sport.bookingCode, selectedOptionCode: 'SportEquipment' }, { bookingCode: bagOut.bookingCode, selectedOptionCode: '2' }]);
  assert.equal(extrasTotal(extras, choice, 'USD'), Math.round((81.55 + 142.1 + 63.8) * 100) / 100);
  assert.equal(extrasTotal(extras, { [cabin.bookingCode]: '99' }, 'USD'), 0, 'unknown option');
  assert.deepEqual(Object.keys(cleanExtrasChoice(extras, choice)).length, 3);
  assert.equal(extrasSelection(extras, { [cabin.bookingCode]: '' }).length, 0, 'empty = no extra');
  // Older clients: one bag choice per direction for everyone.
  assert.equal(Object.keys(bagChoice(extras, { 'TLV-ATH': '2' })).length, 3);
});

test('contact validation and shekel conversion', () => {
  assert.deepEqual(validateContact({ name: 'Dana', email: 'D@Example.com', phone: '050-123 4567' }).value, { name: 'Dana', email: 'd@example.com', phone: '0501234567' });
  assert.equal(validateContact({ name: 'Dana', email: 'd@e.co', phone: '+972 50 123 4567' }).value.phone, '0501234567');
  assert.equal(validateContact({ name: 'Dana', email: 'd@e.co', phone: '+44 20 7946 0958' }).value.phone, '+442079460958');
  assert.deepEqual(Object.keys(validateContact({ name: 'D', email: 'x', phone: '12' }).errors).sort(), ['email', 'name', 'phone']);
  assert.equal(ilsOf({ value: 744.81, currency: 'USD' }, 3.7), 2756, 'rounded up');
  assert.equal(ilsOf({ value: 100, currency: 'ILS' }), 100);
  assert.equal(ilsOf({ value: 100, currency: 'USD' }, null), null);
});

// ---------------------------------------------------------------- supplier normalisation
test('a recorded supplier answer becomes a quote: requirements, time limits, bags, legs', () => {
  const quote = normalizeQuote(recorded[0].raw);
  assert.deepEqual(quote.pax, { ADT: 2, CHD: 1, INF: 0 });
  assert.equal(quote.total.currency, 'USD');
  assert.equal(quote.requirements.birthDate.ADT, true);
  assert.equal(quote.autoTicketable, true);
  assert.equal(quote.paymentAvailable, false, 'the recorded account had no credit payment method');
  assert.ok(quote.extras.length >= 6 && quote.extras.every((x) => x.options.length >= 1));
  assert.equal(quote.legs[0].from, 'TLV');
  const second = normalizeQuote(recorded[1].raw);
  assert.equal(second.autoTicketable, false);
  assert.ok(second.timeLimits.ticketingTimeLimit);
  assert.throws(() => normalizeQuote({}), /offer_unavailable/);
  const travellers = travellersFor([{ ptc: 'ADT', type: 'adult', title: 'ms', firstName: 'DANA', lastName: 'LEVI', birthDate: '1990-01-01', document: null }], { email: 'd@e.co', phone: '0501234567' }, 'GBABC123-1');
  assert.deepEqual(travellers[0], { ptc: 'ADT', reference: 'gbabc123-1-1', type: 'adult', lead: true, title: 'ms', firstName: 'DANA', lastName: 'LEVI', email: 'd@e.co', phonePrefix: '+972', phone: '501234567', birthDate: '1990-01-01' });
});

test('the live adapter refuses every write unless BOOKING_MODE=live and VOLERO_BOOKING_ENABLED=true', async () => {
  for (const env of [{}, { BOOKING_MODE: 'live' }, { VOLERO_BOOKING_ENABLED: 'true' }, { BOOKING_MODE: 'request', VOLERO_BOOKING_ENABLED: 'true' }]) {
    const live = liveSupplier({ env });
    assert.equal(liveWritesEnabled(env), false);
    for (const op of ['book', 'issue', 'voidTickets', 'cancel']) await assert.rejects(live[op]({ reservationId: '1', srk: 's', offerIndex: 'o', searchToken: 't', travellers: [] }), /live_booking_disabled/);
  }
});

test('modes: request by default; live falls back to request unless fully configured; mock refused in production', () => {
  assert.equal(bookingMode({}).mode, 'request');
  assert.deepEqual(bookingMode({ BOOKING_MODE: 'live' }).mode, 'request');
  assert.ok(bookingMode({ BOOKING_MODE: 'live', VOLERO_BOOKING_ENABLED: 'true' }).missing.includes('PAYME_SELLER_ID'));
  assert.equal(bookingMode({ BOOKING_MODE: 'live', VOLERO_BOOKING_ENABLED: 'true', PAYMENT_PROVIDER: 'payme', PAYME_SELLER_ID: 'x', PAYMENT_WEBHOOK_SECRET: 'y', BOOKING_DATA_KEY: KEY, SITE_URL: 'https://gerbi.example' }).mode, 'live');
  assert.equal(bookingMode({ BOOKING_MODE: 'mock' }).mode, 'mock');
  assert.equal(bookingMode({ BOOKING_MODE: 'mock', VERCEL_ENV: 'production' }).mode, 'request');
});

// ---------------------------------------------------------------- payment notifications
test('mock notifications: HMAC signature, amount and intent must match; PayMe callback token per order', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'gerbi-pay-'));
  try {
    const store = createStore('payments-test', dir), pay = mockPayments({ store, secret: SECRET });
    const { intentId, redirectUrl } = await pay.createPayment({ orderId: '00000000-0000-4000-8000-000000000001', amount: 100000, returnUrl: '/', notifyUrl: '/n' });
    assert.match(redirectUrl, /^\/api\/payments\/mock\//);
    const good = pay.sign({ eventId: 'e1', intentId, status: 'authorized', amount: 100000 });
    assert.equal((await pay.verifyNotification({ headers: { 'x-mock-signature': good.signature }, rawBody: good.body })).status, 'authorized');
    assert.equal(await pay.verifyNotification({ headers: { 'x-mock-signature': good.signature }, rawBody: good.body.replace('100000', '1') }), null, 'tampered body');
    assert.equal(await pay.verifyNotification({ headers: { 'x-mock-signature': hmac('other', good.body) }, rawBody: good.body }), null, 'wrong secret');
    const cheap = pay.sign({ eventId: 'e2', intentId, status: 'authorized', amount: 1 });
    assert.equal(await pay.verifyNotification({ headers: { 'x-mock-signature': cheap.signature }, rawBody: cheap.body }), null, 'amount must match the intent');
    assert.notEqual(notifyToken(SECRET, 'a'), notifyToken(SECRET, 'b'));
    // PayMe: the callback is only a trigger; the sale is re-read from PayMe (get-sales) before anything moves.
    const calls = [];
    const payme = paymePayments({ env: { PAYME_SELLER_ID: 'seller', PAYMENT_WEBHOOK_SECRET: SECRET }, fetcher: async (url, init) => { calls.push([url, JSON.parse(init.body)]); return { ok: true, json: async () => ({ items: [{ sale_status: 'authorized', sale_price: 5000, transaction_id: 'order-1', installments: 3 }] }) }; } });
    const event = await payme.verifyNotification({ form: { payme_sale_id: 'SALE-12345', sale_status: 'completed' } });
    assert.deepEqual([event.status, event.amount, event.orderId], ['authorized', 5000, 'order-1'], 'status comes from get-sales, not the callback body');
    assert.match(calls[0][0], /sandbox\.payme\.io\/api\/get-sales$/);
    assert.equal(await payme.verifyNotification({ form: { payme_sale_id: '<x>' } }), null);
    assert.equal(paymePayments({ env: {} }).configured, false);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

// ---------------------------------------------------------------- the order flow over HTTP
async function harness({ mode = 'mock', scenario = null, payFailures = {}, env: extra = {} } = {}) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'gerbi-orders-'));
  const env = { BOOKING_MODE: mode, BOOKING_DATA_KEY: KEY, PAYMENT_WEBHOOK_SECRET: SECRET, LEADS_ADMIN_TOKEN: 'admin-token-for-tests-123456', ...extra };
  const store = createStore('orders', dir), leadStore = createStore('leads', dir), mails = [], logs = [], pending = [];
  const supplier = fakeSupplier({ scenario });
  const payments = mode === 'request' ? null : mockPayments({ store: createStore('payments', dir), secret: SECRET, failures: payFailures });
  const orders = createOrders({ store, leadStore, env, dataDirectory: dir, supplier, payments, fx: { get: async () => ({ rates: { USD: 3.7 }, asOf: '2026-11-15' }) },
    background: (p) => { pending.push(p); return p; }, log: (e) => logs.push(e), mail: async (m) => mails.push(m) });
  const server = http.createServer(async (req, res) => {
    const send = (code, data) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
    const body = async (r, limit = 32000) => { let raw = ''; for await (const c of r) { raw += c; if (raw.length > limit) throw new Error('payload_too_large'); } return raw ? JSON.parse(raw) : {}; };
    try { if (!(await orders.handle(req, res, new URL(req.url, 'http://x'), { send, body }))) send(404, { error: 'not_found' }); } catch (e) { send(500, { error: e.message }); }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`, ip = `10.9.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
  const call = async (method, p, data, headers = {}) => {
    const response = await realFetch(base + p, { method, redirect: 'manual', headers: { Origin: base, 'X-Forwarded-For': ip, ...(data !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers }, body: data === undefined ? undefined : JSON.stringify(data) });
    const text = await response.text(); let json = null; try { json = JSON.parse(text); } catch {}
    return { status: response.status, data: json, text, headers: response.headers };
  };
  const settle = async () => { while (pending.length) await pending.shift(); };
  return { orders, store, leadStore, supplier, payments, mails, logs, call, settle, base, env, close: async () => { await settle(); server.close(); await rm(dir, { recursive: true, force: true }); } };
}
const passport = (n) => ({ number: `AB12345${n}`, issuingCountry: 'IL', nationality: 'IL', issueDate: '2022-02-01', expiryDate: '2031-02-01' });
const adult = (first, last = 'LEVI') => ({ gender: 'f', firstName: first, lastName: last, birthDate: '1990-05-01', document: passport(first.length + last.length) });
const child = { gender: 'm', firstName: 'NOAM', lastName: 'LEVI', birthDate: '2018-03-02', document: { ...passport(9), issueDate: '2023-01-01', expiryDate: '2028-01-01' } };
const contact = { name: 'Dana Levi', email: 'dana@example.com', phone: '050-1234567' };
async function toPriced(h, { last = 'LEVI', offer = OFFER, bags } = {}) {
  const created = await h.call('POST', '/api/orders', { offer, source: 'flights', lang: 'he' }, { 'Idempotency-Key': 'key-' + Math.random().toString(36).slice(2, 14) + '-abcdef' });
  assert.equal(created.status, 201, JSON.stringify(created.data));
  const auth = { 'x-order-token': created.data.token }, id = created.data.id;
  const saved = await h.call('POST', `/api/orders/${id}/passengers`, { passengers: [adult('DANA', last), adult('ROY'), child], contact, lang: 'he' }, auth);
  assert.equal(saved.status, 200, JSON.stringify(saved.data));
  if (bags) assert.equal((await h.call('POST', `/api/orders/${id}/addons`, { bags, insurance: true }, auth)).status, 200);
  const checked = await h.call('POST', `/api/orders/${id}/recheck`, {}, auth);
  return { id, auth, created, checked };
}
async function payAndApprove(h, id, auth, total, approve = true) {
  const paid = await h.call('POST', `/api/orders/${id}/pay`, { terms: true, cancellation: true, expectedTotal: total, installments: 3 }, auth);
  assert.equal(paid.status, 200, JSON.stringify(paid.data));
  assert.equal(paid.data.order.status, 'payment_pending');
  const page = await h.call('GET', paid.data.redirectUrl);
  assert.match(page.text, /<form method="post">/);
  const response = await realFetch(h.base + paid.data.redirectUrl, { method: 'POST', redirect: 'manual', headers: { Origin: h.base, 'Content-Type': 'application/x-www-form-urlencoded' }, body: `action=${approve ? 'approve' : 'decline'}&installments=3` });
  assert.equal(response.status, 303);
  assert.match(response.headers.get('location'), new RegExp(`#/book/${id}$`));
  await h.settle();
  return (await h.call('GET', `/api/orders/${id}`, undefined, auth)).data.order;
}

test('mock mode, happy path: details → re-check → hold → book → ticket → capture → confirmed', async () => {
  const h = await harness();
  try {
    const { id, auth, created, checked } = await toPriced(h);
    assert.equal(created.data.order.status, 'draft');
    assert.equal(created.data.order.price.ils, Math.ceil(744.81 * 3.7));
    assert.equal(checked.data.order.status, 'priced');
    // PII never comes back in full.
    const view = (await h.call('GET', `/api/orders/${id}`, undefined, auth)).data.order;
    assert.equal(view.passengers[0].firstName, 'DANA');
    const stored = await h.store.get(`order:${id}`);
    assert.equal(JSON.stringify(stored).includes('DANA'), false, 'stored encrypted');
    const final = await payAndApprove(h, id, auth, view.price.ils);
    assert.equal(final.status, 'confirmed');
    assert.equal(final.payment.status, 'captured');
    assert.equal(final.payment.installments, 3);
    assert.match(final.supplier.pnr, /^FK/);
    assert.equal(final.supplier.tickets.length, 1, 'non-auto-ticketable offer: tickets issued after the booking');
    assert.deepEqual(h.supplier.calls.map((c) => c.op).filter((op) => op !== 'price'), ['retrieve', 'book', 'issue']);
    assert.deepEqual(final.timeline.map((e) => e.to), ['draft', 'details', 'priced', 'payment_pending', 'payment_authorized', 'booking', 'booked', 'ticketed', 'confirmed']);
    assert.equal(h.mails.length, 1, 'confirmation email');
    assert.match(h.mails[0].subject, /GB/);
  } finally { await h.close(); }
});

test('price change at the re-check: the customer must accept the new price before paying', async () => {
  const h = await harness();
  try {
    const run = await toPriced(h, { last: 'PRICECHANGE' }), again = run.checked, { id, auth } = run;
    assert.equal(again.data.order.status, 'price_changed');
    assert.ok(again.data.order.priceChange.toOriginal.value > again.data.order.priceChange.fromOriginal.value);
    const refused = await h.call('POST', `/api/orders/${id}/pay`, { terms: true, cancellation: true, expectedTotal: again.data.order.price.ils }, auth);
    assert.equal(refused.status, 409, 'cannot pay while the change is unaccepted');
    const accepted = await h.call('POST', `/api/orders/${id}/accept-price`, {}, auth);
    assert.equal(accepted.data.order.status, 'priced');
    const stale = await h.call('POST', `/api/orders/${id}/pay`, { terms: true, cancellation: true, expectedTotal: 1 }, auth);
    assert.equal(stale.status, 409, 'the shown total must match');
    assert.equal(stale.data.error, 'price_mismatch');
  } finally { await h.close(); }
});

test('seat gone at the re-check: unavailable, nothing authorized', async () => {
  const h = await harness();
  try {
    const { id, auth } = await toPriced(h, { last: 'SOLDOUT' });
    const order = (await h.call('GET', `/api/orders/${id}`, undefined, auth)).data.order;
    assert.equal(order.status, 'unavailable');
    assert.equal(order.payment, null);
  } finally { await h.close(); }
});

test('supplier failure after the payment hold: the authorization is voided automatically', async () => {
  const h = await harness();
  try {
    const { id, auth, checked } = await toPriced(h, { last: 'SUPPLIERFAIL' });
    const final = await payAndApprove(h, id, auth, checked.data.order.price.ils);
    assert.equal(final.status, 'voided');
    assert.equal(final.payment.status, 'voided');
    assert.deepEqual(final.timeline.map((e) => e.to).slice(-3), ['booking', 'booking_failed', 'voided']);
    assert.equal(await h.payments.status({ intentId: (await h.store.get(`order:${id}`)).payment.intentId }), 'voided');
  } finally { await h.close(); }
});

test('supplier failure and the void fails too: an agent takes over (never a silent charge)', async () => {
  const h = await harness({ payFailures: { void: true } });
  try {
    const { id, auth, checked } = await toPriced(h, { last: 'SUPPLIERFAIL' });
    const final = await payAndApprove(h, id, auth, checked.data.order.price.ils);
    assert.equal(final.status, 'needs_agent');
    const admin = await h.call('GET', `/api/orders/admin/${id}`, undefined, { Authorization: `Bearer ${h.env.LEADS_ADMIN_TOKEN}` });
    assert.ok(admin.data.order.flags.includes('void_failed'));
    assert.ok((await h.leadStore.list('all', 10)).some((l) => l.type === 'booking' && l.orderId === id), 'the agent gets a lead');
  } finally { await h.close(); }
});

test('ticketing fails: booked but not charged, flagged for an agent; capture failure likewise', async () => {
  const h = await harness();
  try {
    const { id, auth, checked } = await toPriced(h, { last: 'TICKETFAIL' });
    const final = await payAndApprove(h, id, auth, checked.data.order.price.ils);
    assert.equal(final.status, 'needs_agent');
    assert.equal(final.payment.status, 'authorized', 'not captured');
    const stored = await h.store.get(`order:${id}`);
    assert.ok(stored.flags.includes('ticketing_failed'));
  } finally { await h.close(); }
  const h2 = await harness({ payFailures: { capture: true } });
  try {
    const { id, auth, checked } = await toPriced(h2);
    const final = await payAndApprove(h2, id, auth, checked.data.order.price.ils);
    assert.equal(final.status, 'needs_agent');
    assert.ok((await h2.store.get(`order:${id}`)).flags.includes('capture_failed'));
  } finally { await h2.close(); }
});

test('supplier timeout with an unknown outcome: found by clientRef, never booked twice', async () => {
  const h = await harness();
  try {
    const { id, auth, checked } = await toPriced(h, { last: 'TIMEOUT' });
    const final = await payAndApprove(h, id, auth, checked.data.order.price.ils);
    assert.equal(final.status, 'confirmed');
    assert.equal(h.supplier.calls.filter((c) => c.op === 'book').length, 1);
    assert.equal(h.supplier.reservations.size, 1);
  } finally { await h.close(); }
});

test('declined payment: payment_failed, then a retry with the same order', async () => {
  const h = await harness();
  try {
    const { id, auth, checked } = await toPriced(h);
    const failed = await payAndApprove(h, id, auth, checked.data.order.price.ils, false);
    assert.equal(failed.status, 'payment_failed');
    const again = await payAndApprove(h, id, auth, checked.data.order.price.ils, true);
    assert.equal(again.status, 'confirmed');
    assert.equal((await h.store.get(`order:${id}`)).payment.attempt, 2);
  } finally { await h.close(); }
});

test('notifications: forged, replayed or for another order are refused; duplicates are idempotent', async () => {
  const h = await harness();
  try {
    const { id, auth, checked } = await toPriced(h);
    const paid = await h.call('POST', `/api/orders/${id}/pay`, { terms: true, cancellation: true, expectedTotal: checked.data.order.price.ils }, auth);
    const intentId = (await h.store.get(`order:${id}`)).payment.intentId, token = notifyToken(SECRET, id);
    const event = await h.payments.complete(intentId, true); // the customer approved on the hosted page; this is the provider's signed notice
    const post = (p, body, signature) => realFetch(h.base + p, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-mock-signature': signature }, body });
    assert.equal((await post(`/api/payments/notify/mock/${id}/${'0'.repeat(32)}`, event.body, event.signature)).status, 404, 'wrong URL token');
    assert.equal((await post(`/api/payments/notify/mock/${id}/${token}`, event.body, 'f'.repeat(64))).status, 400, 'bad signature');
    assert.equal((await post(`/api/payments/notify/mock/${id}/${token}`, event.body, event.signature)).status, 200);
    await h.settle();
    assert.equal((await post(`/api/payments/notify/mock/${id}/${token}`, event.body, event.signature)).status, 200, 'duplicate acknowledged');
    await h.settle();
    assert.equal(h.supplier.calls.filter((c) => c.op === 'book').length, 1, 'one booking for two notifications');
    const final = (await h.call('GET', `/api/orders/${id}`, undefined, auth)).data.order;
    assert.equal(final.status, 'confirmed', JSON.stringify((await h.store.get(`order:${id}`)).timeline));
    assert.ok(paid.data.redirectUrl);
  } finally { await h.close(); }
});

test('access, CSRF and idempotency: token or owner only, same-origin JSON, one order per key', async () => {
  const h = await harness();
  try {
    const key = { 'Idempotency-Key': 'same-key-1234567890abcdef' };
    const a = await h.call('POST', '/api/orders', { offer: OFFER }, key), b = await h.call('POST', '/api/orders', { offer: OFFER }, key);
    assert.equal(a.data.id, b.data.id); assert.equal(b.data.repeated, true);
    assert.equal((await h.call('GET', `/api/orders/${a.data.id}`)).status, 404, 'no token');
    assert.equal((await h.call('GET', `/api/orders/${a.data.id}`, undefined, { 'x-order-token': 'x'.repeat(32) })).status, 404, 'wrong token');
    assert.equal((await h.call('POST', '/api/orders', { offer: OFFER }, { Origin: 'https://evil.example' })).status, 403);
    assert.equal((await realFetch(h.base + '/api/orders', { method: 'POST', headers: { Origin: h.base, 'Content-Type': 'text/plain' }, body: '{}' })).status, 415);
    assert.equal((await h.call('POST', '/api/orders', { offer: { srk: '<x>' } })).status, 400);
    assert.equal((await h.call('POST', '/api/orders', { kind: 'hotel', offer: OFFER })).status, 501, 'hotel booking stays off');
    assert.equal((await h.call('GET', '/api/orders/admin')).status, 401);
    const lookup = await h.call('POST', '/api/orders/lookup', { items: [{ id: a.data.id, token: a.data.token }, { id: a.data.id, token: 'y'.repeat(32) }] });
    assert.equal(lookup.data.orders.length, 1);
    const invalid = await h.call('POST', `/api/orders/${a.data.id}/passengers`, { passengers: [{ firstName: 'דנה' }], contact: {} }, { 'x-order-token': a.data.token });
    assert.equal(invalid.status, 400);
  } finally { await h.close(); }
});

test('request mode (default): the wizard authorizes nothing and the order becomes a lead for a representative', async () => {
  const h = await harness({ mode: 'request' });
  try {
    assert.equal(h.orders.mode, 'request');
    const config = await h.call('GET', '/api/orders/config');
    assert.deepEqual([config.data.enabled, config.data.mode, config.data.online], [true, 'request', false]);
    const { id, auth, checked } = await toPriced(h, { offer: BAG_OFFER, bags: {} });
    assert.equal((await h.call('POST', `/api/orders/${id}/pay`, { terms: true, cancellation: true, expectedTotal: checked.data.order.price.ils }, auth)).status, 409, 'no payment in request mode');
    assert.equal((await h.call('POST', `/api/orders/${id}/submit`, { terms: false, cancellation: true, expectedTotal: checked.data.order.price.ils }, auth)).status, 400, 'terms required');
    const sent = await h.call('POST', `/api/orders/${id}/submit`, { terms: true, cancellation: true, expectedTotal: checked.data.order.price.ils }, auth);
    assert.equal(sent.data.order.status, 'requested');
    assert.equal(sent.data.order.payment, null);
    assert.deepEqual(h.supplier.calls.map((c) => c.op), ['price', 'price'], 'only price checks: no booking call');
    const [lead] = await h.leadStore.list('all', 5);
    assert.equal(lead.type, 'booking'); assert.equal(lead.orderId, id); assert.match(lead.message, /הראל/); assert.equal(JSON.stringify(lead).includes('1990-05-01'), false, 'no passenger data in the lead');
    assert.equal(h.mails.length, 1);
    // Admin completes it by hand.
    const admin = { Authorization: `Bearer ${h.env.LEADS_ADMIN_TOKEN}` };
    assert.equal((await h.call('POST', `/api/orders/admin/${id}/action`, { action: 'in_progress' }, admin)).data.order.status, 'in_progress');
    assert.equal((await h.call('POST', `/api/orders/admin/${id}/action`, { action: 'confirm', pnr: 'x' }, admin)).status, 400);
    const done = await h.call('POST', `/api/orders/admin/${id}/action`, { action: 'confirm', pnr: 'abc123', tickets: '1142345678901' }, admin);
    assert.equal(done.data.order.status, 'confirmed'); assert.equal(done.data.order.supplier.pnr, 'ABC123');
    const list = await h.call('GET', '/api/orders/admin?status=confirmed', undefined, admin);
    assert.equal(list.data.orders.length, 1); assert.equal(list.data.orders[0].contact.name, 'Dana Levi');
    const csv = await realFetch(h.base + '/api/orders/admin/export.csv', { headers: admin }).then((r) => r.text());
    assert.match(csv, /ABC123/); assert.equal(csv.includes('1990-05-01'), false, 'no birth dates / passports in the export');
  } finally { await h.close(); }
});

test('bags re-price the offer; the expected total follows the selection (no false price change)', async () => {
  const h = await harness();
  try {
    const created = await h.call('POST', '/api/orders', { offer: BAG_OFFER }, {});
    assert.equal(created.status, 201, JSON.stringify(created.data));
    const bags = created.data.order.extras.filter((x) => x.kind === 'bags' && x.to === 'ATH');
    // Older clients still send one bag per direction: it applies to every traveller.
    const { id, auth, checked } = await toPriced(h, { offer: BAG_OFFER, bags: { 'TLV-ATH': bags[0].options[1].code } });
    assert.equal(checked.data.order.status, 'priced');
    const base = created.data.order.price.total.value;
    assert.equal(checked.data.order.price.total.value, Math.round((base + bags[0].options[1].price.value * bags.length) * 100) / 100);
    assert.equal(checked.data.order.addons.insurance, true);
    assert.ok(id && auth);
  } finally { await h.close(); }
});

test('extras per traveller: chosen options go to the supplier, the re-checked total includes them, the summary keeps them', async () => {
  const h = await harness();
  try {
    const { id, auth, created } = await toPriced(h, { offer: BAG_OFFER });
    const extras = created.data.order.extras, base = created.data.order.price.total.value;
    assert.ok(extras.every((x) => typeof x.bookingCode === 'string' && Number.isInteger(x.pax)), 'the wizard gets booking codes and passenger positions');
    const pick = (kind, pax, to) => extras.find((x) => x.kind === kind && x.pax === pax && (!to || x.to === to));
    const choice = { [pick('cabin', 0).bookingCode]: '1', [pick('sport', 1).bookingCode]: 'SportEquipment', [pick('bags', 2, 'ATH').bookingCode]: '2', [pick('bags', 2, 'TLV').bookingCode]: '3', 'not-a-code': '1' };
    const added = await h.call('POST', `/api/orders/${id}/addons`, { extras: choice, insurance: false }, auth);
    assert.equal(added.status, 200);
    assert.equal(Object.keys(added.data.order.addons.extras).length, 4, 'unknown codes dropped');
    const checked = await h.call('POST', `/api/orders/${id}/recheck`, {}, auth);
    assert.equal(checked.data.order.status, 'priced', 'no false price change: the expected total already had the extras');
    const sum = 81.55 + 142.1 + 63.8 + 70.49;
    assert.equal(checked.data.order.price.total.value, Math.round((base + sum) * 100) / 100);
    assert.equal(checked.data.order.price.extras, Math.round(sum * 100) / 100);
    assert.equal(checked.data.order.price.ils, Math.ceil(checked.data.order.price.total.value * 3.7));
    // The final check before the booking re-prices with the same optionalServiceList.
    const final = await payAndApprove(h, id, auth, checked.data.order.price.ils);
    assert.equal(final.status, 'confirmed');
    const stored = await h.store.get(`order:${id}`);
    assert.deepEqual(Object.keys(stored.addons.extras).sort(), Object.keys(choice).filter((k) => k !== 'not-a-code').sort());
  } finally { await h.close(); }
});

test('passports: masked in every view (customer + admin), full numbers only on the audited admin request, "keep" re-uses the stored number', async () => {
  const h = await harness({ mode: 'request' });
  try {
    const { id, auth } = await toPriced(h);
    const stored = await h.store.get(`order:${id}`);
    assert.equal(JSON.stringify(stored).includes('AB12345'), false, 'sealed at rest');
    const view = (await h.call('GET', `/api/orders/${id}`, undefined, auth)).data.order;
    assert.equal(view.passengers[0].document.number, '•••458');
    assert.equal(view.passengers[0].document.issueDate, '2022-02-01');
    assert.equal(JSON.stringify(view).includes('AB12345'), false);
    const admin = { Authorization: `Bearer ${h.env.LEADS_ADMIN_TOKEN}` };
    const adminView = (await h.call('GET', `/api/orders/admin/${id}`, undefined, admin)).data.order;
    assert.equal(JSON.stringify(adminView.passengers).includes('AB12345'), false, 'admin view masked too');
    assert.equal((await h.call('GET', `/api/orders/admin/${id}/documents`)).status, 401);
    const docs = await h.call('GET', `/api/orders/admin/${id}/documents`, undefined, admin);
    assert.equal(docs.data.documents[0].number, 'AB123458');
    assert.ok((await h.store.get(`order:${id}`)).timeline.some((e) => e.event === 'documents_viewed'), 'audited');
    // Editing the travellers again: "keep" uses the number already in the order; nothing typed, nothing returned.
    const again = [adult('DANA'), adult('ROY'), child].map((p) => ({ ...p, document: { ...p.document, number: '', keep: true } }));
    const kept = await h.call('POST', `/api/orders/${id}/passengers`, { passengers: again, contact }, auth);
    assert.equal(kept.status, 200, JSON.stringify(kept.data));
    assert.equal((await h.call('GET', `/api/orders/admin/${id}/documents`, undefined, admin)).data.documents[1].number, 'AB123457');
    // Without "keep" and without a number: refused, next to the field.
    const missing = await h.call('POST', `/api/orders/${id}/passengers`, { passengers: [{ ...adult('DANA'), document: { ...passport(1), number: '' } }, adult('ROY'), child], contact }, auth);
    assert.equal(missing.status, 400); assert.ok(missing.data.fields['0.document.number']);
    // "use the saved passport" with no accounts behind it cannot be resolved.
    const saved = await h.call('POST', `/api/orders/${id}/passengers`, { passengers: [{ ...adult('DANA'), document: { ...passport(1), number: '', useSaved: true, savedId: 'abc' } }, adult('ROY'), child], contact }, auth);
    assert.equal(saved.status, 400); assert.ok(saved.data.fields['0.document.number']);
  } finally { await h.close(); }
});

test('hotel in one click after the flight request: same lead traveller + contact, one lead, no retyping', async () => {
  const h = await harness({ mode: 'request' });
  try {
    const { id, auth, checked } = await toPriced(h);
    assert.equal((await h.call('POST', `/api/orders/${id}/hotel-request`, {}, auth)).status, 409, 'only after the flight request');
    await h.call('POST', `/api/orders/${id}/submit`, { terms: true, cancellation: true, expectedTotal: checked.data.order.price.ils }, auth);
    const sent = await h.call('POST', `/api/orders/${id}/hotel-request`, { stars: '4', board: 'breakfast', note: 'quiet room' }, auth);
    assert.equal(sent.status, 200); assert.equal(sent.data.order.hotelRequested, true);
    const leads = await h.leadStore.list('all', 10), hotel = leads.find((l) => l.source === 'booking:hotel');
    assert.ok(hotel, 'a hotel lead');
    assert.equal(hotel.email, 'dana@example.com'); assert.equal(hotel.phone, '0501234567');
    assert.match(hotel.message, /DANA LEVI/); assert.match(hotel.message, /4 כוכבים/); assert.match(hotel.message, /ארוחת בוקר/); assert.match(hotel.message, /צ׳ק־אין/);
    assert.equal(hotel.message.includes('AB12345'), false, 'no passport in the lead');
    assert.equal((await h.call('POST', `/api/orders/${id}/hotel-request`, {}, auth)).data.repeated, true);
    assert.equal((await h.leadStore.list('all', 10)).filter((l) => l.source === 'booking:hotel').length, 1);
  } finally { await h.close(); }
});

test('reconciliation: stale drafts expire with their personal data, stuck orders advance', async () => {
  let clock = Date.parse('2026-11-15T10:00:00Z');
  const h = await harness();
  try {
    const { id, auth } = await toPriced(h);
    const order = await h.store.get(`order:${id}`);
    await h.store.set(`order:${id}`, { ...order, updatedAt: '2026-11-01T10:00:00Z' });
    const report = await h.orders.reconcile();
    assert.equal(report.expired, 1);
    const after = await h.store.get(`order:${id}`);
    assert.equal(after.status, 'expired'); assert.equal(after.sealed, null);
    assert.ok(auth && clock);
  } finally { await h.close(); }
});

test('booking without an encryption key in production is off (no passenger data stored in clear)', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'gerbi-orders-'));
  try {
    const orders = createOrders({ store: createStore('orders', dir), env: { VERCEL: '1' }, dataDirectory: dir, supplier: fakeSupplier(), log: () => {} });
    assert.equal(orders.enabled, false);
    assert.equal(orders.status().encryption, null);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('auto-ticketable fare: tickets come with the booking, no separate issue call, then capture', async () => {
  const h = await harness();
  try {
    const { id, auth, checked } = await toPriced(h, { offer: BAG_OFFER });
    const final = await payAndApprove(h, id, auth, checked.data.order.price.ils);
    assert.equal(final.status, 'confirmed');
    assert.equal(final.supplier.tickets.length, 3);
    assert.equal(h.supplier.calls.some((c) => c.op === 'issue'), false);
  } finally { await h.close(); }
});

test('trip builder entry: flight picks carry what the booking wizard needs (spec 25 §9)', async () => {
  const { flightPicks } = await import('../backend/build.mjs');
  const data = JSON.parse(readFileSync(new URL('./fixtures/build/flights.json', import.meta.url), 'utf8'));
  const picks = flightPicks(data, { adults: 2, children: 0 });
  assert.ok(picks.length);
  for (const p of picks) { assert.match(p.offerIndex, /\S/); assert.ok(Number.isInteger(p.itineraryIndex)); assert.ok(data.offers.some((o) => String(o.index) === p.offerIndex)); }
});
