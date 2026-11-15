// Hardening regressions (QA report 15.11.2026, O3–O8, O14, O15 + lead retention): client address, shared rate limits,
// owner-login lockout, weak owner token, booking auth, public status, security headers, FX override propagation, retention.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { clientOf, configureLimits, counters, allowShared } from '../backend/volero-guard.mjs';
import { createStore } from '../backend/kv-store.mjs';
import { handleAdmin, enforceAdminToken, LOCKOUT } from '../backend/admin.mjs';
import { applyRetention, retentionDays, handleLeads } from '../backend/leads.mjs';
import { createFx, handleFx, FX_CACHE_CONTROL } from '../backend/fx-rates.mjs';

const tmp = () => mkdtemp(path.join(os.tmpdir(), 'gerbi-hardening-'));
const req = (headers = {}, remoteAddress = '203.0.113.9') => ({ headers, socket: { remoteAddress } });

test('clientOf ignores a spoofed X-Forwarded-For; trusts only platform / proxy-appended addresses', () => {
  const spoof = { 'x-forwarded-for': '1.1.1.1, 198.51.100.7' };
  assert.equal(clientOf(req(spoof), {}), '203.0.113.9', 'direct: the socket address');
  assert.equal(clientOf(req(spoof), { TRUST_PROXY: '1' }), '198.51.100.7', 'own proxy: the right-most hop it appended');
  const vercel = { ...spoof, 'x-vercel-forwarded-for': '192.0.2.44', 'x-real-ip': '192.0.2.45' };
  assert.equal(clientOf(req(vercel), { VERCEL: '1' }), '192.0.2.44');
  assert.equal(clientOf(req({ ...spoof, 'x-real-ip': '192.0.2.45' }), { VERCEL: '1' }), '192.0.2.45');
  assert.equal(clientOf(req(spoof), { VERCEL: '1' }), '198.51.100.7', 'no platform header: right-most hop, never the left-most');
  assert.equal(clientOf(req({ 'x-vercel-forwarded-for': 'not an ip' }), { VERCEL: '1' }), '203.0.113.9');
});

test('KV counters: INCR + expiry in the file store, shared by two store instances, and the memory fallback', async () => {
  const directory = await tmp();
  try {
    const a = createStore('ratelimit', directory);
    assert.equal(await a.incr('k', 60), 1); assert.equal(await a.incr('k', 60), 2);
    const raw = JSON.parse(await readFile(path.join(directory, 'ratelimit.json'), 'utf8'));
    assert.equal(raw.k.value, 2); assert.ok(raw.k.expires > Date.now());
    raw.k.expires = Date.now() - 1; await writeFile(path.join(directory, 'ratelimit.json'), JSON.stringify(raw));
    assert.equal(await createStore('ratelimit', directory).incr('k', 60), 1, 'an expired window starts again');

    configureLimits(createStore('ratelimit', directory));
    for (let i = 0; i < 5; i++) assert.equal(await allowShared('198.51.100.1', 'leads'), true);
    assert.equal(await allowShared('198.51.100.1', 'leads'), false, 'leads: 6th within the window is refused');
    assert.equal(await allowShared('198.51.100.2', 'leads'), true, 'per client');
    configureLimits(createStore('ratelimit', directory)); // a second instance reading the same store
    assert.equal(await allowShared('198.51.100.1', 'leads'), false, 'the count holds across instances');

    configureLimits({ incr: async () => { throw new Error('kv_down'); }, get: async () => { throw new Error('kv_down'); }, set: async () => { throw new Error('kv_down'); }, del: async () => {} });
    assert.equal(await allowShared('198.51.100.1', 'leads'), true, 'a KV outage falls back to memory, never locks everyone out');
  } finally { configureLimits(null); await rm(directory, { recursive: true, force: true }); }
});

test('file store purges expired entries from disk on the next write (90-day bot conversations really go)', async () => {
  const directory = await tmp();
  try {
    const file = path.join(directory, 'support-conversations.json');
    await writeFile(file, JSON.stringify({ old: { value: { transcript: ['hi'] }, expires: Date.now() - 1000 }, live: { value: { transcript: [] }, expires: Date.now() + 86400_000 } }));
    const store = createStore('support-conversations', directory);
    await store.set('new', { transcript: [] }, 90 * 86400);
    const raw = JSON.parse(await readFile(file, 'utf8'));
    assert.deepEqual(Object.keys(raw).sort(), ['live', 'new']);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

async function withAdmin(env, run) {
  const directory = await tmp();
  const store = createStore('content', directory), sessions = createStore('admin', directory), leadStore = createStore('leads', directory);
  const server = http.createServer(async (req, res) => {
    const send = (code, data) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
    const body = async (r) => { let raw = ''; for await (const c of r) raw += c; return raw ? JSON.parse(raw) : {}; };
    const url = new URL(req.url, 'http://x');
    if (!(await handleAdmin(req, res, url, { send, body, store, sessions, leadStore, env }))) send(404, {});
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try { await run(base, { leadStore }); } finally { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); await rm(directory, { recursive: true, force: true }); }
}
const login = (base, password, ip) => fetch(base + '/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip }, body: JSON.stringify({ password }) });

test('owner login: progressive lockout per IP (even the right password waits), reset on success, global lockout', async () => {
  process.env.TRUST_PROXY = '1';
  const directory = await tmp();
  configureLimits(createStore('ratelimit', directory));
  const saved = { ...LOCKOUT };
  try {
    await withAdmin({ LEADS_ADMIN_TOKEN: 'a-long-owner-password-1234' }, async (base) => {
      // A correct login resets the failure count.
      for (let i = 0; i < 3; i++) assert.equal((await login(base, 'wrong', '10.40.0.1')).status, 401);
      assert.equal((await login(base, 'a-long-owner-password-1234', '10.40.0.1')).status, 204);
      assert.equal(await counters.peek('adminfail:10.40.0.1'), 0);
      // 5th failure locks this IP: even the right password is refused for now; other IPs are not affected.
      for (let i = 0; i < 4; i++) assert.equal((await login(base, 'wrong', '10.40.0.2')).status, 401);
      assert.equal(await counters.peek('adminlock:10.40.0.2'), 0, 'four free failures');
      // The per-IP request limit (5 per 10 min) is separate; clear it so the lockout itself is what we observe.
      await counters.clear('adminLogin:10.40.0.2');
      assert.equal((await login(base, 'wrong', '10.40.0.2')).status, 401);
      assert.equal(await counters.peek('adminlock:10.40.0.2'), 1);
      await counters.clear('adminLogin:10.40.0.2');
      assert.equal((await login(base, 'a-long-owner-password-1234', '10.40.0.2')).status, 429, 'locked');
      assert.equal((await login(base, 'a-long-owner-password-1234', '10.40.0.3')).status, 204);
      // Global: many addresses guessing together lock the login for everyone for a while.
      Object.assign(LOCKOUT, { globalFailures: 3 }); await counters.clear('adminfail:global');
      for (const ip of ['10.41.0.1', '10.41.0.2', '10.41.0.3']) assert.equal((await login(base, 'wrong', ip)).status, 401);
      assert.equal((await login(base, 'a-long-owner-password-1234', '10.41.0.9')).status, 429, 'global lockout');
    });
  } finally { Object.assign(LOCKOUT, saved); configureLimits(null); await rm(directory, { recursive: true, force: true }); }
});

test('weak LEADS_ADMIN_TOKEN: refused in production unless ALLOW_WEAK_ADMIN_TOKEN=1; local dev keeps it', () => {
  const logs = [], log = (entry) => logs.push(entry);
  const dev = { LEADS_ADMIN_TOKEN: '123456' };
  assert.equal(enforceAdminToken(dev, log), 'ok'); assert.equal(dev.LEADS_ADMIN_TOKEN, '123456'); assert.equal(logs.length, 0);
  const prod = { LEADS_ADMIN_TOKEN: '123456', NODE_ENV: 'production' };
  assert.equal(enforceAdminToken(prod, log), 'refused'); assert.equal(prod.LEADS_ADMIN_TOKEN, undefined); assert.equal(logs.at(-1).error, 'weak_token_refused');
  const vercel = { LEADS_ADMIN_TOKEN: 'short', VERCEL: '1', ALLOW_WEAK_ADMIN_TOKEN: '1' };
  assert.equal(enforceAdminToken(vercel, log), 'weak_allowed'); assert.equal(vercel.LEADS_ADMIN_TOKEN, 'short'); assert.equal(logs.at(-1).level, 'warn');
  const strong = { LEADS_ADMIN_TOKEN: 'x'.repeat(32), VERCEL: '1' };
  assert.equal(enforceAdminToken(strong, log), 'ok'); assert.ok(!JSON.stringify(logs).includes('123456'), 'the token never reaches the log');
});

test('blog API: an invalid slug is a 400 with the field (spec 18 #20)', async () => {
  process.env.TRUST_PROXY = '1';
  await withAdmin({ LEADS_ADMIN_TOKEN: 'a-long-owner-password-1234' }, async (base) => {
    const cookie = (await login(base, 'a-long-owner-password-1234', '10.42.0.1')).headers.get('set-cookie').split(';')[0];
    for (const [method, route] of [['PUT', '/api/admin/blog/BAD_SLUG'], ['GET', '/api/admin/blog/x%20y'], ['DELETE', '/api/admin/blog/' + 'a'.repeat(61)]]) {
      const response = await fetch(base + route, { method, headers: { Cookie: cookie, 'X-Forwarded-For': '10.42.0.1', 'Content-Type': 'application/json' }, body: method === 'PUT' ? '{"title":"x"}' : undefined });
      assert.equal(response.status, 400, route);
      assert.equal(typeof (await response.json()).fields.slug, 'string');
    }
  });
});

test('lead retention: older than LEADS_RETENTION_DAYS are deleted (with their admin notes), once a day, lazily on the owner list', async () => {
  const directory = await tmp();
  try {
    assert.equal(retentionDays({}), 730); assert.equal(retentionDays({ LEADS_RETENTION_DAYS: '365' }), 365); assert.equal(retentionDays({ LEADS_RETENTION_DAYS: '3' }), 30, 'floor of 30 days');
    const store = createStore('leads', directory), now = Date.parse('2026-11-15T12:00:00Z'), day = 86400_000;
    // Newest first, as the site pushes them.
    for (const age of [800, 731, 400, 10]) await store.push('all', { id: `lead-${age}-0000`, createdAt: new Date(now - age * day).toISOString(), name: 'x' }, 5000);
    await store.set('meta', { 'lead-800-0000': { status: 'closed', notes: [{ text: 'old' }] }, 'lead-10-0000': { status: 'progress', notes: [] } });
    const result = await applyRetention(store, { env: {}, now, force: true });
    assert.deepEqual([result.ran, result.removed, result.days], [true, 2, 730]);
    assert.deepEqual((await store.list('all', 10)).map((l) => l.id), ['lead-10-0000', 'lead-400-0000']);
    assert.deepEqual(Object.keys(await store.get('meta')), ['lead-10-0000']);
    assert.equal((await applyRetention(store, { env: {}, now: now + 2 * 3600_000 })).ran, false, 'the daily marker stops a second run');

    // Wired into GET /api/leads (owner): the expired lead is gone before the list is read.
    await store.del('retention:ran'); await store.del('all');
    await store.push('all', { id: 'lead-old-9999', createdAt: '2020-01-01T00:00:00.000Z' }, 5000);
    await store.push('all', { id: 'lead-new-9999', createdAt: new Date().toISOString() }, 5000);
    let reply;
    await handleLeads({ method: 'GET', headers: { authorization: 'Bearer owner-token-123456789' }, socket: {} }, new URL('http://x/api/leads'),
      { send: (code, data) => { reply = { code, data }; }, body: async () => ({}), store, env: { LEADS_ADMIN_TOKEN: 'owner-token-123456789' } });
    assert.equal(reply.code, 200);
    assert.deepEqual(reply.data.leads.map((l) => l.id), ['lead-new-9999']);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('FX: a manual override set on one instance reaches the others within the recheck window; /api/fx caches ≤ 60 s', async () => {
  const data = new Map(), store = { get: async (k) => data.get(k) ?? null, set: async (k, v) => { data.set(k, v); } };
  let clock = Date.parse('2026-11-15T10:00:00Z');
  const table = { asOf: '2026-11-15', source: 'leumi', method: 'transfer-sale', markupPct: 0, rates: { USD: 3.7, EUR: 4 } };
  const source = [{ name: 'leumi', load: async () => table }];
  const a = createFx({ store, sources: source, now: () => clock }), b = createFx({ store, sources: source, now: () => clock });
  assert.equal((await b.get()).isOverride, false);
  await a.setOverride({ rates: { USD: 3.5 }, note: '', setAt: new Date(clock).toISOString(), expiresAt: null });
  clock += 31_000;
  assert.equal((await b.get()).rates.USD, 3.5, 'instance b sees the override after the 30 s recheck');
  await a.clearOverride(); clock += 31_000;
  assert.equal((await b.get()).isOverride, false, 'and the clearing too');
  assert.match(FX_CACHE_CONTROL, /max-age=60\b/); assert.match(FX_CACHE_CONTROL, /s-maxage=60\b/);
  let head = null;
  const res = { writeHead: (code, headers) => { head = headers; }, end: () => {} };
  await handleFx({ method: 'GET', headers: {} }, new URL('http://x/api/fx'), { send: () => {}, fx: a, res });
  assert.equal(head['Cache-Control'], FX_CACHE_CONTROL);
});

test('site server: security headers on pages and API, public /api/status is minimal, booking needs the owner', async () => {
  const saved = { token: process.env.LEADS_ADMIN_TOKEN, booking: process.env.VOLERO_BOOKING_ENABLED };
  process.env.LEADS_ADMIN_TOKEN = 'status-owner-token-1234567890';
  const { createServer, CSP } = await import('../server.mjs');
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`, owner = { Authorization: `Bearer ${process.env.LEADS_ADMIN_TOKEN}` };
  try {
    for (const route of ['/', '/admin', '/assets/hero.webp', '/api/status', '/api/nope']) {
      const h = (await fetch(base + route)).headers;
      assert.equal(h.get('content-security-policy'), CSP, route);
      assert.match(CSP, /frame-ancestors 'none'/); assert.match(CSP, /script-src 'self'(;|$)/);
      assert.equal(h.get('x-content-type-options'), 'nosniff', route);
      assert.equal(h.get('x-frame-options'), 'DENY', route);
      assert.ok(h.get('referrer-policy'), route); assert.match(h.get('permissions-policy'), /camera=\(\)/, route);
      assert.equal(h.get('strict-transport-security'), null, 'no HSTS on plain local http');
    }
    assert.match((await fetch(base + '/', { headers: { 'X-Forwarded-Proto': 'https' } })).headers.get('strict-transport-security'), /max-age=31536000/);
    const pub = await (await fetch(base + '/api/status')).json();
    assert.deepEqual(Object.keys(pub).sort(), ['ok', 'partner', 'version']);
    const full = await (await fetch(base + '/api/status', { headers: owner })).json();
    assert.ok('supplier' in full && 'booking' in full && 'storage' in full);
    process.env.VOLERO_BOOKING_ENABLED = 'true';
    const book = (headers = {}) => fetch(base + '/api/volero/flights/book', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ confirm: true }) });
    assert.equal((await book()).status, 401, 'enabled booking still needs the owner');
    assert.equal((await book(owner)).status, 400, 'the owner gets through to input validation');
    process.env.VOLERO_BOOKING_ENABLED = 'false';
    assert.equal((await book(owner)).status, 403, 'disabled stays disabled');
  } finally {
    server.closeAllConnections(); await new Promise((resolve) => server.close(resolve));
    if (saved.token === undefined) delete process.env.LEADS_ADMIN_TOKEN; else process.env.LEADS_ADMIN_TOKEN = saved.token;
    if (saved.booking === undefined) delete process.env.VOLERO_BOOKING_ENABLED; else process.env.VOLERO_BOOKING_ENABLED = saved.booking;
  }
});

test('vercel.json sends the same security headers (and HSTS) for CDN-served files', async () => {
  const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
  const { CSP } = await import('../server.mjs');
  const all = config.headers.find((rule) => rule.source === '/(.*)'), get = (key) => all.headers.find((h) => h.key === key)?.value;
  assert.equal(get('Content-Security-Policy'), CSP, 'keep vercel.json in sync with server.mjs CSP');
  assert.match(get('Strict-Transport-Security'), /max-age=31536000/);
  for (const key of ['X-Content-Type-Options', 'Referrer-Policy', 'Permissions-Policy', 'X-Frame-Options']) assert.ok(get(key), key);
});
