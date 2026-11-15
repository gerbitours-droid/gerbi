import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { validateLead, normalizeIsraeliPhone } from '../dist/leads-validate.mjs';
import { tailorLinkFromSearch } from '../dist/leads.mjs';
import { handleLeads, tokenMatches } from '../backend/leads.mjs';
import { createStore } from '../backend/kv-store.mjs';
import serverDefault from '../server.mjs';
// These tests stand in for a trusted reverse proxy: clientOf() then keys limits on the right-most X-Forwarded-For hop.
process.env.TRUST_PROXY = '1';

const TODAY = '2026-11-15';
const contact = (extra = {}) => ({ type: 'contact', name: 'דנה כהן', phone: '050-123-4567', channel: 'whatsapp', consent: true, message: 'שלום', ...extra });
const tailor = (extra = {}) => ({ ...contact(), type: 'tailor', destinations: 'יפן', start: '2027-03-01', end: '2027-03-15', flexibility: 'days', adults: '2', children: '1', budget: '10to20', styles: ['nature', 'nature', 'bogus'], notes: '', ...extra });

test('Israeli phone numbers are normalized; foreign and malformed numbers are rejected', () => {
  for (const [input, expected] of [['050-123-4567', '0501234567'], ['+972 50 123 4567', '0501234567'], ['972501234567', '0501234567'], ['+972-0501234567', '0501234567'], ['03-1234567', '031234567'], ['077 123 4567', '0771234567'], ['(02) 6234567', '026234567']])
    assert.equal(normalizeIsraeliPhone(input), expected, input);
  for (const input of ['', '12345', '0601234567', '+1 212 555 0100', '05012345678', '050123456a', '0123456789']) assert.equal(normalizeIsraeliPhone(input), '', input);
});

test('contact lead validation: required fields, channel/email coupling, consent, lengths', () => {
  const ok = validateLead(contact(), { today: TODAY });
  assert.deepEqual(ok.errors, {});
  assert.equal(ok.lead.phone, '0501234567');
  assert.equal(ok.lead.marketing, false);
  const bad = validateLead(contact({ name: ' ', phone: '123', consent: 'yes', channel: 'fax' }), { today: TODAY }).errors;
  assert.deepEqual(Object.keys(bad).sort(), ['channel', 'consent', 'name', 'phone']);
  assert.ok(validateLead(contact({ channel: 'email' }), { today: TODAY }).errors.email, 'email channel needs an address');
  assert.ok(validateLead(contact({ email: 'not-an-email' }), { today: TODAY }).errors.email);
  assert.deepEqual(validateLead(contact({ channel: 'email', email: 'a@b.co' }), { today: TODAY }).errors, {});
  assert.ok(validateLead(contact({ message: 'x'.repeat(2001) }), { today: TODAY }).errors.message);
  assert.ok(validateLead(contact({ name: 'x'.repeat(81) }), { today: TODAY }).errors.name);
  assert.ok(validateLead({ type: 'other' }).errors.type);
  assert.ok(validateLead(null).errors.form);
});

test('tailor-made validation: dates, travelers, enums and styles are cleaned', () => {
  const { lead, errors } = validateLead(tailor(), { today: TODAY });
  assert.deepEqual(errors, {});
  assert.equal(lead.adults, 2);
  assert.equal(lead.children, 1);
  assert.deepEqual(lead.styles, ['nature']);
  assert.ok(validateLead(tailor({ start: '2020-01-01' }), { today: TODAY }).errors.start, 'past date');
  assert.ok(validateLead(tailor({ end: '2027-02-01' }), { today: TODAY }).errors.end, 'return before departure');
  assert.ok(validateLead(tailor({ start: '', end: '2027-02-01' }), { today: TODAY }).errors.start, 'return without departure');
  assert.ok(validateLead(tailor({ adults: '0' }), { today: TODAY }).errors.adults);
  assert.ok(validateLead(tailor({ destinations: '' }), { today: TODAY }).errors.destinations);
  assert.equal(validateLead(tailor({ budget: 'free', flexibility: 'never' }), { today: TODAY }).lead.budget, 'open');
  const dated = validateLead(tailor({ start: '', end: '' }), { today: TODAY });
  assert.deepEqual(dated.errors, {}, 'dates are optional');
  const withContext = validateLead(tailor({ context: { from: 'TLV', to: 'ATH', depart: '2027-03-01', adults: 2, results: 0, extra: '<script>' } }), { today: TODAY }).lead.context;
  assert.deepEqual(withContext, { from: 'TLV', to: 'ATH', depart: '2027-03-01', return: '', adults: 2, children: null, results: 0 });
});

test('results call to action carries the search into the tailor-made form', () => {
  const href = tailorLinkFromSearch({ origin: 'TLV', to: 'ATH', start: '2027-03-01', end: '', adults: 2, children: 0 }, 1);
  const params = new URLSearchParams(href.split('?')[1]);
  assert.ok(href.startsWith('#/tailor-made?'));
  assert.equal(params.get('src'), 'flight-results');
  assert.equal(params.get('to'), 'ATH');
  assert.equal(params.has('return'), false);
  assert.equal(params.get('results'), '1');
  assert.equal(tailorLinkFromSearch(null, 0), '#/tailor-made?src=flight-results&results=0');
});

test('admin token comparison', () => {
  assert.equal(tokenMatches('Bearer s3cret', 's3cret'), true);
  assert.equal(tokenMatches('bearer  s3cret ', 's3cret'), true);
  assert.equal(tokenMatches('Bearer s3cre', 's3cret'), false);
  assert.equal(tokenMatches('s3cret', 's3cret'), false);
  assert.equal(tokenMatches('Bearer ', ''), false);
  assert.equal(tokenMatches(undefined, 's3cret'), false);
});

test('file store keeps every lead when pushes run concurrently', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'gerbi-leads-store-'));
  try {
    const store = createStore('leads', directory);
    await Promise.all(Array.from({ length: 20 }, (_, i) => store.push('all', { i }, 15)));
    const list = await store.list('all', 100);
    assert.equal(list.length, 15, 'capped');
    const fresh = createStore('leads', directory);
    assert.equal((await fresh.list('all', 100)).length, 15, 'persisted to disk');
    assert.equal((await readFile(path.join(directory, 'leads.json'), 'utf8')).includes('"i"'), true);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

async function withLeadServer(env, run) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'gerbi-leads-api-'));
  const store = createStore('leads', directory);
  const body = async (req) => { let raw = ''; for await (const chunk of req) raw += chunk; return raw ? JSON.parse(raw) : {}; };
  const server = http.createServer(async (req, res) => {
    const send = (code, data) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
    if (!(await handleLeads(req, new URL(req.url, 'http://x'), { send, body, store, env }))) send(404, {});
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/leads`;
  try { await run(base, store); } finally { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); await rm(directory, { recursive: true, force: true }); }
}
const post = (base, payload, ip) => fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip }, body: JSON.stringify(payload) });

test('POST /api/leads stores valid leads, rejects invalid ones with field errors, and drops honeypot hits', async () => {
  await withLeadServer({}, async (base, store) => {
    const created = await post(base, { ...contact(), source: '/contact', status: 'hacked', id: 'mine' }, '10.0.0.1');
    assert.equal(created.status, 201);
    const reply = await created.json();
    assert.match(reply.id, /^[0-9a-f]{8}$/);
    const invalid = await post(base, contact({ phone: 'abc', consent: false }), '10.0.0.1');
    assert.equal(invalid.status, 400);
    assert.deepEqual(Object.keys((await invalid.json()).fields).sort(), ['consent', 'phone']);
    const bot = await post(base, { ...contact(), website: 'http://spam' }, '10.0.0.1');
    assert.equal(bot.status, 201);
    const stored = await store.list('all', 10);
    assert.equal(stored.length, 1);
    assert.equal(stored[0].status, 'new');
    assert.notEqual(stored[0].id, 'mine');
    assert.equal(stored[0].source, '/contact');
    assert.equal(stored[0].consent.given, true);
    assert.equal(stored[0].phone, '0501234567');
  });
});

test('POST /api/leads is rate limited per client', async () => {
  await withLeadServer({}, async (base) => {
    const codes = [];
    for (let i = 0; i < 7; i++) codes.push((await post(base, contact(), '10.0.0.2')).status);
    assert.deepEqual(codes.slice(0, 5), [201, 201, 201, 201, 201]);
    assert.equal(codes[6], 429);
    assert.equal((await post(base, contact(), '10.0.0.3')).status, 201, 'other clients are unaffected');
  });
});

test('GET /api/leads: 404 without a configured token, 401 on a wrong one, newest first on the right one', async () => {
  await withLeadServer({}, async (base) => assert.equal((await fetch(base, { headers: { 'X-Forwarded-For': '10.0.1.1' } })).status, 404));
  await withLeadServer({ LEADS_ADMIN_TOKEN: 'owner-token-123' }, async (base) => {
    await post(base, contact({ name: 'ראשון' }), '10.0.1.2');
    await new Promise((resolve) => setTimeout(resolve, 5));
    await post(base, tailor({ name: 'שני' }), '10.0.1.2');
    assert.equal((await fetch(base, { headers: { 'X-Forwarded-For': '10.0.1.3' } })).status, 401);
    assert.equal((await fetch(base, { headers: { Authorization: 'Bearer wrong', 'X-Forwarded-For': '10.0.1.3' } })).status, 401);
    const ok = await fetch(base, { headers: { Authorization: 'Bearer owner-token-123', 'X-Forwarded-For': '10.0.1.3' } });
    assert.equal(ok.status, 200);
    const data = await ok.json();
    assert.deepEqual(data.leads.map((lead) => lead.name), ['שני', 'ראשון']);
    assert.equal(data.leads[0].type, 'tailor');
    assert.equal((await fetch(base, { method: 'DELETE' })).status, 405);
  });
});

test('LEADS_WEBHOOK_URL receives the lead; a failing webhook never fails the request', async () => {
  const received = [];
  const hook = http.createServer(async (req, res) => { let raw = ''; for await (const chunk of req) raw += chunk; received.push(JSON.parse(raw)); res.end('ok'); });
  await new Promise((resolve) => hook.listen(0, '127.0.0.1', resolve));
  try {
    await withLeadServer({ LEADS_WEBHOOK_URL: `http://127.0.0.1:${hook.address().port}/hook` }, async (base) => {
      assert.equal((await post(base, contact(), '10.0.2.1')).status, 201);
    });
    assert.equal(received.length, 1);
    assert.equal(received[0].event, 'lead.created');
    assert.equal(received[0].lead.phone, '0501234567');
    await withLeadServer({ LEADS_WEBHOOK_URL: 'http://127.0.0.1:1/unreachable' }, async (base) => {
      assert.equal((await post(base, contact(), '10.0.2.2')).status, 201);
    });
  } finally { hook.closeAllConnections(); await new Promise((resolve) => hook.close(resolve)); }
});

test('the site server routes /api/leads and serves the noindex owner page', async () => {
  const saved = process.env.LEADS_ADMIN_TOKEN;
  delete process.env.LEADS_ADMIN_TOKEN;
  await new Promise((resolve) => serverDefault.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${serverDefault.address().port}`;
  try {
    assert.equal((await fetch(`${base}/api/leads`)).status, 404);
    const invalid = await fetch(`${base}/api/leads`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.0.3.1' }, body: JSON.stringify({ type: 'contact' }) });
    assert.equal(invalid.status, 400);
    const legacy = await fetch(`${base}/leads-admin`, { redirect: 'manual' });
    assert.equal(legacy.status, 301);
    assert.equal(legacy.headers.get('location'), '/admin');
    const page = await fetch(`${base}/admin`);
    assert.equal(page.status, 200);
    assert.equal(page.headers.get('x-robots-tag'), 'noindex, nofollow');
    assert.match(await page.text(), /<meta name="robots" content="noindex, nofollow">/);
    for (const file of ['/leads.mjs', '/leads-validate.mjs', '/leads.css', '/admin.mjs']) assert.equal((await fetch(base + file)).status, 200, file);
  } finally {
    if (saved !== undefined) process.env.LEADS_ADMIN_TOKEN = saved;
    serverDefault.closeAllConnections(); await new Promise((resolve) => serverDefault.close(resolve));
  }
});
