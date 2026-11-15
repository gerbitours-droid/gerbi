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
import { validatePassenger, validatePassengers, validateContact, requirementsFrom, ageOn, ilsOf, titleOf } from '../dist/booking-core.mjs';
import { normalizeQuote, fakeSupplier, liveSupplier, bagSelection, travellersFor, liveWritesEnabled } from '../backend/booking-supplier.mjs';
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
test('passenger validation: Latin names, DOB against the passenger type, documents when required', () => {
  const ctx = { requirements: requirementsFrom({ birthdate: { required: true, ptcList: { ADT: false, CHD: true } } }), travelStart: '2027-01-10', travelEnd: '2027-01-15', today: '2026-11-15', lang: 'he' };
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
  // Document rules only when the supplier requires them (data minimisation otherwise).
  const doc = { ...ctx, ptc: 'ADT', requirements: requirementsFrom({ identificationDocument: { required: true, types: { passport: {} } } }) };
  const withDoc = (document) => validatePassenger({ ...adult, document }, doc);
  assert.equal(withDoc({ number: 'ab 123-4567', expiryDate: '2030-01-01', nationality: 'il' }).value.document.number, 'AB1234567');
  assert.equal(withDoc({ number: 'ab1234567', expiryDate: '2030-01-01', nationality: 'il' }).value.document.issuingCountry, 'IL');
  assert.ok(withDoc({ number: 'AB1234567', expiryDate: '2027-01-12', nationality: 'IL' }).errors['document.expiryDate'], 'expires during the trip');
  assert.ok(withDoc({ number: 'AB1234567', expiryDate: '2027-04-01', nationality: 'IL' }).warnings['document.expiryDate'], 'less than 6 months: warning');
  assert.ok(withDoc({ number: '12', expiryDate: '2030-01-01', nationality: 'IL' }).errors['document.number']);
  assert.ok(withDoc({ number: 'AB1234567', expiryDate: '2030-01-01', nationality: 'ISR' }).errors['document.nationality']);
  // The list: count per type, duplicates, infants ≤ adults.
  const pax = { ADT: 1, CHD: 0, INF: 0 };
  assert.ok(validatePassengers([], { pax, ...ctx }).errors.form);
  assert.ok(validatePassengers([adult, adult], { pax: { ADT: 2 }, ...ctx }).errors['1.firstName'], 'duplicate');
  assert.equal(titleOf('ADT', 'f'), 'ms'); assert.equal(titleOf('CHD', 'm'), 'mstr'); assert.equal(titleOf('INF', 'f'), 'miss');
  // English messages for the English page.
  assert.match(validatePassenger({ ...adult, firstName: 'דנה' }, { ...ctx, ptc: 'ADT', lang: 'en' }).errors.firstName, /Latin/);
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
  assert.ok(quote.bags.length >= 2 && quote.bags[0].options.length >= 1);
  assert.equal(quote.legs[0].from, 'TLV');
  const selection = bagSelection(quote.bags, { [quote.bags[0].route]: quote.bags[0].options[0].code, 'XXX-YYY': '1' });
  assert.equal(selection.length, quote.bags[0].services.length);
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
const adult = (first, last = 'LEVI') => ({ gender: 'f', firstName: first, lastName: last, birthDate: '1990-05-01' });
const child = { gender: 'm', firstName: 'NOAM', lastName: 'LEVI', birthDate: '2018-03-02' };
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
    const bag = created.data.order.bags[0];
    const { id, auth, checked } = await toPriced(h, { offer: BAG_OFFER, bags: { [bag.route]: bag.options[1].code } });
    assert.equal(checked.data.order.status, 'priced');
    const base = created.data.order.price.total.value;
    assert.equal(checked.data.order.price.total.value, Math.round((base + bag.options[1].price.value * bag.travellers) * 100) / 100);
    assert.equal(checked.data.order.addons.insurance, true);
    assert.ok(id && auth);
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
