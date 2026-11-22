// Saved travellers (spec 25 §6.5): validation, encryption at rest, masking in every answer, "use the saved passport"
// resolved by the booking on the server, saving a booking's travellers with consent, deletion with the account.
// The order service runs with the fake supplier only; any network call other than the local test server fails.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createAccounts } from '../backend/accounts.mjs';
import { createOrders } from '../backend/orders.mjs';
import { fakeSupplier } from '../backend/booking-supplier.mjs';
import { createStore } from '../backend/kv-store.mjs';
import { validateTraveller, MAX_SAVED_TRAVELLERS } from '../dist/booking-core.mjs';

process.env.TRUST_PROXY = '1';
const KEY = 'b'.repeat(64);
const recorded = JSON.parse(readFileSync(new URL('./fixtures/booking/availability-raw.json', import.meta.url), 'utf8'));
const OFFER = { srk: 'fixture-srk-0001', offerIndex: recorded[1].offerIndex, searchToken: 'fixture-search-token', itineraryIndex: 0 };
const realFetch = globalThis.fetch;
before(() => { globalThis.fetch = async (url, init) => { if (/^http:\/\/127\.0\.0\.1:/.test(String(url))) return realFetch(url, init); throw new Error(`network call blocked in tests: ${url}`); }; });
after(() => { globalThis.fetch = realFetch; });

const passport = { number: 'X9876543', issuingCountry: 'IL', nationality: 'IL', issueDate: '2021-06-01', expiryDate: '2031-06-01' };
const dana = { gender: 'f', firstName: 'dana', lastName: 'levi', birthDate: '1990-05-01', document: passport, phone: '050-1234567', email: 'Dana@Example.com', self: true };

test('saved traveller validation: names, birth date, passport all-or-nothing, consent', () => {
  const ok = validateTraveller({ ...dana, consent: true }, { today: '2026-11-23' });
  assert.equal(ok.value.firstName, 'DANA'); assert.equal(ok.value.email, 'dana@example.com'); assert.equal(ok.value.phone, '0501234567');
  assert.deepEqual(ok.value.document, { type: 'passport', ...passport });
  assert.ok(validateTraveller({ ...dana }, { today: '2026-11-23' }).errors.consent, 'explicit consent');
  assert.equal(validateTraveller({ ...dana, document: undefined, consent: true }, { today: '2026-11-23' }).value.document, null, 'no passport is fine');
  const partial = validateTraveller({ ...dana, document: { number: 'X9876543' }, consent: true }, { today: '2026-11-23' }).errors;
  assert.ok(partial['document.expiryDate'] && partial['document.nationality'] && partial['document.issueDate'], 'a passport is all or nothing');
  assert.ok(validateTraveller({ ...dana, document: { ...passport, expiryDate: '2026-01-01', issueDate: '2016-03-01' }, consent: true }, { today: '2026-11-23' }).errors['document.expiryDate'], 'expired');
  assert.ok(validateTraveller({ ...dana, firstName: 'דנה', consent: true }, { today: '2026-11-23' }).errors.firstName);
  assert.ok(validateTraveller({ ...dana, document: { ...passport, number: '', keep: true }, consent: true }, { today: '2026-11-23' }).errors['document.number'], 'keep only when editing');
  assert.equal(validateTraveller({ ...dana, document: { ...passport, number: '', keep: true }, consent: true }, { today: '2026-11-23', keepNumber: true }).value.document.keep, true);
});

let ip = 0;
async function withServer(env, run) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'gerbi-travellers-'));
  const store = createStore('accounts', directory), orderStore = createStore('orders', directory), leadStore = createStore('leads', directory);
  const accounts = createAccounts({ store, env, dataDirectory: directory });
  const orders = createOrders({ store: orderStore, leadStore, env: { BOOKING_MODE: 'request', BOOKING_DATA_KEY: KEY, ...env }, dataDirectory: directory, supplier: fakeSupplier(), payments: null, fx: { get: async () => ({ rates: { USD: 3.7 }, asOf: '2026-11-23' }) },
    userOf: accounts.leadHooks.userOf, leadCreated: accounts.leadHooks.created, travellers: accounts.travellerHooks, log: () => {}, mail: null });
  const body = async (req) => { let raw = ''; for await (const chunk of req) raw += chunk; return raw ? JSON.parse(raw) : {}; };
  const server = http.createServer(async (req, res) => {
    const send = (code, data) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
    const url = new URL(req.url, 'http://x');
    if (await orders.handle(req, res, url, { send, body })) return;
    if (await accounts.handle(req, res, url, { send, body })) return;
    send(404, {});
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const client = () => {
    let cookie = '';
    const forwarded = `10.8.${Math.floor(++ip / 250)}.${ip % 250}`;
    const call = async (method, route, payload, headers = {}) => {
      const response = await realFetch(base + route, { method, headers: { Origin: base, 'X-Forwarded-For': forwarded, ...(payload !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...headers }, body: payload !== undefined ? JSON.stringify(payload) : undefined });
      const set = response.headers.get('set-cookie');
      if (set) cookie = set.split(';')[0].endsWith('=') ? '' : set.split(';')[0];
      const text = await response.text();
      let data = null; try { data = JSON.parse(text); } catch { /* not JSON */ }
      return { status: response.status, data, text };
    };
    return { call };
  };
  try { await run({ client, store, orderStore }); } finally { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); await rm(directory, { recursive: true, force: true }); }
}
const signup = { name: 'דנה לוי', email: 'dana@example.com', password: 'sunny-beach-27', privacy: true };

test('saved travellers: sealed at rest, masked in every answer and the export, edit keeps the number, deleted with the account', async () => {
  await withServer({ BOOKING_DATA_KEY: KEY }, async ({ client, store }) => {
    const c = client();
    assert.equal((await c.call('GET', '/api/account/travellers')).status, 401, 'signed-in customers only');
    await c.call('POST', '/api/account/signup', signup);
    assert.equal((await c.call('POST', '/api/account/travellers', { traveller: dana })).status, 400, 'consent required');
    const saved = await c.call('POST', '/api/account/travellers', { traveller: dana, consent: true, lang: 'he' });
    assert.equal(saved.status, 200, JSON.stringify(saved.data));
    const [me] = saved.data.travellers;
    assert.deepEqual([me.firstName, me.self, me.document.number, me.document.expiryDate, me.document.issueDate], ['DANA', true, '•••543', '2031-06-01', '2021-06-01']);
    assert.ok(me.consentAt);
    // At rest: no name, no passport number in the stored user record.
    const raw = JSON.stringify(await store.get(`user:${(await store.get('email:' + (await import('node:crypto')).createHash('sha256').update('dana@example.com').digest('hex')))}`));
    assert.equal(raw.includes('X9876543'), false); assert.equal(raw.includes('DANA'), false);
    assert.match(raw, /"sealed":"v1\./);
    assert.match(raw, /שמור את פרטי הנוסעים/, 'the consent text the customer saw is recorded');
    // Every answer masks the number: list, export.
    const list = await c.call('GET', '/api/account/travellers');
    assert.equal(list.text.includes('X9876543'), false);
    const exported = await c.call('GET', '/api/account/export');
    assert.equal(exported.text.includes('X9876543'), false); assert.equal(exported.data.account.travellers[0].document.number, '•••543');
    assert.equal(exported.text.includes('"sealed"'), false);
    // Edit without retyping the number ("keep"): the stored number stays.
    const edited = await c.call('POST', '/api/account/travellers', { id: me.id, traveller: { ...dana, label: 'אני', document: { ...passport, number: '', keep: true, expiryDate: '2032-01-01' } }, consent: true });
    assert.equal(edited.status, 200, JSON.stringify(edited.data));
    assert.deepEqual([edited.data.travellers.length, edited.data.travellers[0].document.number, edited.data.travellers[0].document.expiryDate], [1, '•••543', '2032-01-01']);
    // A family member; delete; the limit.
    const kid = await c.call('POST', '/api/account/travellers', { traveller: { gender: 'm', firstName: 'NOAM', lastName: 'LEVI', birthDate: '2018-03-02', label: 'נועם' }, consent: true });
    assert.equal(kid.data.travellers.length, 2);
    assert.equal((await c.call('POST', '/api/account/travellers/delete', { id: kid.data.id })).data.travellers.length, 1);
    assert.equal((await c.call('POST', '/api/account/travellers/delete', { id: kid.data.id })).status, 404);
    assert.ok(MAX_SAVED_TRAVELLERS >= 9);
    // Another customer cannot read or delete them.
    const other = client();
    await other.call('POST', '/api/account/signup', { ...signup, email: 'roy@example.com' });
    assert.deepEqual((await other.call('GET', '/api/account/travellers')).data.travellers, []);
    assert.equal((await other.call('POST', '/api/account/travellers/delete', { id: me.id })).status, 404);
    // Deleting the account deletes the saved travellers with it.
    assert.equal((await c.call('POST', '/api/account/delete', { password: signup.password })).status, 200);
    const again = client();
    await again.call('POST', '/api/account/signup', signup);
    assert.deepEqual((await again.call('GET', '/api/account/travellers')).data.travellers, []);
  });
});

test('without an encryption key saved travellers are off (never stored in clear)', async () => {
  await withServer({ VERCEL: '1' }, async ({ client }) => {
    const c = client();
    await c.call('POST', '/api/account/signup', signup);
    assert.equal((await c.call('POST', '/api/account/travellers', { traveller: dana, consent: true })).status, 503);
  });
});

test('booking with a saved traveller: one click, the saved passport resolved on the server, booking travellers saved with consent', async () => {
  await withServer({ BOOKING_DATA_KEY: KEY }, async ({ client, orderStore }) => {
    const c = client();
    await c.call('POST', '/api/account/signup', signup);
    const me = (await c.call('POST', '/api/account/travellers', { traveller: dana, consent: true })).data.travellers[0];
    const created = await c.call('POST', '/api/orders', { offer: OFFER, lang: 'he' }, { 'Idempotency-Key': 'saved-traveller-key-0001' });
    assert.equal(created.status, 201, JSON.stringify(created.data));
    const id = created.data.id, auth = { 'x-order-token': created.data.token };
    const roy = { gender: 'm', firstName: 'ROY', lastName: 'LEVI', birthDate: '1988-02-02', document: { number: 'Y1234567', issuingCountry: 'IL', nationality: 'IL', issueDate: '2020-01-01', expiryDate: '2030-01-01' } };
    const noam = { gender: 'm', firstName: 'NOAM', lastName: 'LEVI', birthDate: '2018-03-02', document: { number: 'Z7654321', issuingCountry: 'IL', nationality: 'IL', issueDate: '2023-01-01', expiryDate: '2028-01-01' } };
    // Dana from her saved profile: the browser only knows •••543 and says "use the saved passport".
    const fromSaved = { gender: me.gender, firstName: me.firstName, lastName: me.lastName, birthDate: me.birthDate, savedId: me.id, document: { ...me.document, number: '', useSaved: true, savedId: me.id } };
    const contact = { name: 'Dana Levi', email: 'dana@example.com', phone: '0501234567' };
    // Saving the other two needs the consent box.
    const noConsent = await c.call('POST', `/api/orders/${id}/passengers`, { passengers: [fromSaved, roy, noam], contact, save: { travellers: [1, 2], consent: false } }, auth);
    assert.equal(noConsent.status, 200); assert.equal(noConsent.data.savedTravellers, 0);
    const done = await c.call('POST', `/api/orders/${id}/passengers`, { passengers: [fromSaved, roy, noam], contact, save: { travellers: [1, 2], consent: true } }, auth);
    assert.equal(done.status, 200, JSON.stringify(done.data));
    assert.equal(done.data.savedTravellers, 2);
    assert.equal(done.data.order.passengers[0].document.number, '•••543', 'the order holds the real (sealed) number, shows it masked');
    assert.equal(JSON.stringify(done.data).includes('X9876543'), false);
    const order = await orderStore.get(`order:${id}`);
    assert.equal(JSON.stringify(order).includes('X9876543'), false, 'sealed');
    const list = (await c.call('GET', '/api/account/travellers')).data.travellers;
    assert.deepEqual(list.map((x) => x.firstName).sort(), ['DANA', 'NOAM', 'ROY']);
    assert.equal(list.find((x) => x.firstName === 'ROY').document.number, '•••567');
    // Saving the same travellers again updates them instead of adding copies.
    await c.call('POST', `/api/orders/${id}/passengers`, { passengers: [fromSaved, roy, noam], contact, save: { travellers: [0, 1, 2], consent: true } }, auth);
    assert.equal((await c.call('GET', '/api/account/travellers')).data.travellers.length, 3);
    // Somebody else's saved id never resolves: the field asks for the number again.
    const stranger = client();
    await stranger.call('POST', '/api/account/signup', { ...signup, email: 'eve@example.com' });
    const theirs = await stranger.call('POST', '/api/orders', { offer: OFFER, lang: 'he' }, { 'Idempotency-Key': 'saved-traveller-key-0002' });
    const stolen = await stranger.call('POST', `/api/orders/${theirs.data.id}/passengers`, { passengers: [fromSaved, roy, noam], contact }, { 'x-order-token': theirs.data.token });
    assert.equal(stolen.status, 400); assert.ok(stolen.data.fields['0.document.number']);
  });
});
