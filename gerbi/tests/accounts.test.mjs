import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createAccounts, hashPassword, verifyPassword, sameOrigin, emailSender } from '../backend/accounts.mjs';
import { handleLeads } from '../backend/leads.mjs';
import { createStore } from '../backend/kv-store.mjs';
import { validateSignup, passwordProblem, cleanSaved, mergeSaved, savedSignature, addSearch, cleanSearch } from '../dist/account-core.mjs';
// These tests stand in for a trusted reverse proxy: clientOf() then keys limits on the right-most X-Forwarded-For hop.
process.env.TRUST_PROXY = '1';

const flight = (id, savedAt = '2026-11-01T10:00:00.000Z') => ({ id, savedAt, checkedAt: savedAt, price: 1200, currency: 'ILS', destination: 'אתונה', trip: null, from: 'TLV', to: 'ATH', start: '2027-03-01', end: '2027-03-05', adults: 2, children: 0, carriers: ['Aegean'], checked: 'included', trolley: 'included',
  legs: [{ from: 'TLV', to: 'ATH', departDate: '2027-03-01', departTime: '08:00', arriveDate: '2027-03-01', arriveTime: '10:00', stops: 0, minutes: 120, dayOffset: 0 }] });
const plan = (updated, title = 'רומא שלנו') => ({ title, days: ['יום 1', 'יום 2'], request: '', nights: 4, adults: 2, children: 0, updated });

test('signup validation: name, email, password strength and privacy consent', () => {
  assert.deepEqual(validateSignup({ name: 'דנה', email: ' Dana@Example.COM ', password: 'sunny-beach-27', privacy: true }).value, { name: 'דנה', phone: '', marketing: false, email: 'dana@example.com' });
  const errors = validateSignup({ name: 'x', email: 'nope', password: '12345678', phone: '123', privacy: false }).errors;
  assert.deepEqual(Object.keys(errors).sort(), ['email', 'name', 'password', 'phone', 'privacy']);
  assert.ok(passwordProblem('short'));
  assert.ok(passwordProblem('aaaaaaaaaa'));
  assert.equal(passwordProblem('a-good-pass-9'), '');
  assert.equal(validateSignup({ name: 'דנה', email: 'd@e.co', password: 'sunny-beach-27', phone: '+972 50 123 4567', privacy: true }).value.phone, '0501234567');
});

test('passwords are scrypt hashed with a per-user salt', async () => {
  const [a, b] = [await hashPassword('same-password-1'), await hashPassword('same-password-1')];
  assert.match(a, /^scrypt\$32768\$8\$1\$/);
  assert.notEqual(a, b, 'unique salt');
  assert.equal(await verifyPassword('same-password-1', a), true);
  assert.equal(await verifyPassword('same-password-2', a), false);
  assert.equal(await verifyPassword('x', 'garbage'), false);
});

test('saved bundles are cleaned and merged (union, newer plan wins, max 10 flights)', () => {
  const dirty = cleanSaved({ flights: [flight('a'), { id: 'bad' }], trips: { rome: plan('2026-11-01'), nowhere: plan('2026-11-01') }, favorites: ['rome', 'rome', 'atlantis'], extra: 1 });
  assert.equal(dirty.flights.length, 1);
  assert.deepEqual(Object.keys(dirty.trips), ['rome']);
  assert.deepEqual(dirty.favorites, ['rome']);
  const merged = mergeSaved({ flights: [flight('a')], trips: { rome: plan('2026-11-02', 'מקומי') }, favorites: ['rome'] },
    { flights: [flight('b', '2026-11-03T00:00:00.000Z'), flight('a')], trips: { rome: plan('2026-11-01', 'ישן'), dubai: plan('2026-10-01') }, favorites: ['dubai'] });
  assert.deepEqual(merged.flights.map((f) => f.id), ['b', 'a']);
  assert.equal(merged.trips.rome.title, 'מקומי');
  assert.ok(merged.trips.dubai);
  assert.deepEqual(merged.favorites.sort(), ['dubai', 'rome']);
  assert.equal(mergeSaved({ flights: Array.from({ length: 8 }, (_, i) => flight('l' + i)) }, { flights: Array.from({ length: 8 }, (_, i) => flight('r' + i)) }).flights.length, 10);
  assert.equal(savedSignature({ favorites: ['rome', 'dubai'] }), savedSignature({ favorites: ['dubai', 'rome'] }));
  assert.notEqual(savedSignature({ trips: { rome: plan('1') } }), savedSignature({ trips: { rome: plan('2') } }));
});

test('search history keeps clean, de-duplicated, recent searches', () => {
  const s = { origin: 'TLV', to: 'ATH', start: '2027-03-01', end: '2027-03-05', type: 'round', adults: 2, children: 0 };
  assert.equal(cleanSearch({ ...s, to: '<x>' }), null);
  let list = addSearch([], s, '1');
  list = addSearch(list, { ...s, price: 99 }, '2');
  assert.equal(list.length, 1);
  assert.equal(list[0].at, '2');
  assert.equal('price' in list[0], false);
  for (let i = 0; i < 30; i++) list = addSearch(list, { ...s, start: `2027-04-${String(i % 28 + 1).padStart(2, '0')}` });
  assert.equal(list.length, 20);
});

test('origin check: same host or a trusted origin only', () => {
  const req = (headers) => ({ headers: { host: 'gerbi.test', ...headers } });
  assert.equal(sameOrigin(req({ origin: 'https://gerbi.test' })), true);
  assert.equal(sameOrigin(req({ referer: 'https://gerbi.test/#/account' })), true);
  assert.equal(sameOrigin(req({ origin: 'https://evil.test' })), false);
  assert.equal(sameOrigin(req({})), false);
  assert.equal(sameOrigin(req({ origin: 'null' })), false);
  assert.equal(sameOrigin(req({ origin: 'https://www.gerbi.co.il' }), { ACCOUNT_TRUSTED_ORIGINS: 'https://www.gerbi.co.il/' }), true);
  assert.equal(emailSender({}), null);
  assert.equal(emailSender({ EMAIL_PROVIDER: 'resend', EMAIL_API_KEY: 'k' }), null, 'needs a from address');
});

let ip = 0;
// A real HTTP server around the account + lead handlers, with a throwaway file store.
async function withServer(env, run) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'gerbi-accounts-'));
  const store = createStore('accounts', directory), leadStore = createStore('leads', directory);
  const accounts = createAccounts({ store, env });
  const body = async (req) => { let raw = ''; for await (const chunk of req) raw += chunk; return raw ? JSON.parse(raw) : {}; };
  const server = http.createServer(async (req, res) => {
    const send = (code, data) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
    const url = new URL(req.url, 'http://x');
    if (await accounts.handle(req, res, url, { send, body })) return;
    if (await handleLeads(req, url, { send, body, store: leadStore, env, hooks: accounts.leadHooks })) return;
    send(404, {});
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const client = () => {
    let cookie = '';
    const forwarded = `10.9.${Math.floor(++ip / 250)}.${ip % 250}`;
    const call = async (method, route, payload, headers = {}) => {
      const response = await fetch(base + route, { method, headers: { Origin: base, 'X-Forwarded-For': forwarded, ...(payload !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...headers }, body: payload !== undefined ? JSON.stringify(payload) : undefined });
      const set = response.headers.get('set-cookie');
      if (set) cookie = set.split(';')[0].endsWith('=') ? '' : set.split(';')[0];
      return { status: response.status, data: await response.json().catch(() => null), headers: response.headers };
    };
    return { call, get cookie() { return cookie; }, set cookie(value) { cookie = value; } };
  };
  try { await run({ base, client, store }); } finally { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); await rm(directory, { recursive: true, force: true }); }
}
const account = { name: 'דנה כהן', email: 'dana@example.com', password: 'sunny-beach-27', privacy: true };

test('sign up, session cookie, me, logout invalidates the session', async () => {
  await withServer({}, async ({ client }) => {
    const c = client();
    assert.deepEqual((await c.call('GET', '/api/account/me')).data, { user: null });
    const signup = await c.call('POST', '/api/account/signup', { ...account, marketing: true });
    assert.equal(signup.status, 201);
    const cookie = signup.headers.get('set-cookie');
    assert.match(cookie, /^gerbi_sid=[A-Za-z0-9_-]{40,}; Path=\/; HttpOnly; SameSite=Lax; Max-Age=2592000$/);
    assert.equal(signup.data.user.email, 'dana@example.com');
    assert.equal(signup.data.user.marketing, true);
    assert.equal(JSON.stringify(signup.data).includes('scrypt'), false);
    assert.equal((await c.call('GET', '/api/account/me')).data.user.name, 'דנה כהן');
    const stolen = c.cookie;
    assert.equal((await c.call('POST', '/api/account/logout', {})).status, 200);
    c.cookie = stolen;
    assert.deepEqual((await c.call('GET', '/api/account/me')).data, { user: null }, 'the old cookie no longer works');
    assert.equal((await c.call('GET', '/api/account/saved')).status, 401);
    assert.equal((await client().call('POST', '/api/account/signup', { ...account, email: 'DANA@example.com ' })).status, 409, 'one account per email');
  });
});

test('production cookies are Secure with the __Host- prefix', async () => {
  await withServer({ NODE_ENV: 'production' }, async ({ client }) => {
    const signup = await client().call('POST', '/api/account/signup', account);
    assert.match(signup.headers.get('set-cookie'), /^__Host-gerbi_sid=.+; Secure$/);
  });
});

test('login errors are generic; repeated failures lock the email temporarily', async () => {
  await withServer({}, async ({ client }) => {
    await client().call('POST', '/api/account/signup', account);
    const wrong = await client().call('POST', '/api/account/login', { email: account.email, password: 'wrong-password' });
    const unknown = await client().call('POST', '/api/account/login', { email: 'nobody@example.com', password: 'wrong-password' });
    assert.equal(wrong.status, 401);
    assert.deepEqual(wrong.data, unknown.data);
    const ok = await client().call('POST', '/api/account/login', { email: ' DANA@example.com', password: account.password });
    assert.equal(ok.status, 200);
    for (let i = 0; i < 8; i++) await client().call('POST', '/api/account/login', { email: account.email, password: 'nope-nope-' + i });
    assert.equal((await client().call('POST', '/api/account/login', { email: account.email, password: account.password })).status, 429);
  });
});

test('per-client limit on authentication attempts', async () => {
  await withServer({}, async ({ client }) => {
    const c = client(), codes = [];
    for (let i = 0; i < 11; i++) codes.push((await c.call('POST', '/api/account/login', { email: `x${i}@example.com`, password: 'whatever-1' })).status);
    assert.equal(codes.at(-1), 429);
  });
});

test('CSRF: state changes need a same-site Origin and JSON', async () => {
  await withServer({}, async ({ client }) => {
    const c = client();
    assert.equal((await c.call('POST', '/api/account/signup', account, { Origin: 'https://evil.test' })).status, 403);
    assert.equal((await c.call('POST', '/api/account/signup', account, { Origin: '' })).status, 403);
    assert.equal((await c.call('POST', '/api/account/signup', account, { 'Content-Type': 'text/plain' })).status, 415);
    assert.equal((await c.call('PUT', '/api/account/saved', {})).status, 405);
  });
});

test('saved items sync: cleaned on the server and visible from a second device', async () => {
  await withServer({}, async ({ client }) => {
    const phone = client(), laptop = client();
    await phone.call('POST', '/api/account/signup', account);
    const put = await phone.call('POST', '/api/account/saved', { flights: [flight('a'), { id: 'junk' }], trips: { rome: plan('2026-11-02') }, favorites: ['rome', 'nope'] });
    assert.equal(put.status, 200);
    assert.equal(put.data.flights.length, 1);
    await laptop.call('POST', '/api/account/login', { email: account.email, password: account.password });
    const got = (await laptop.call('GET', '/api/account/saved')).data;
    assert.deepEqual(got.favorites, ['rome']);
    assert.equal(got.trips.rome.title, 'רומא שלנו');
    assert.ok(got.updatedAt);
  });
});

test('profile, marketing consent record, password change signs out other devices', async () => {
  await withServer({}, async ({ client, store }) => {
    const a = client(), b = client();
    await a.call('POST', '/api/account/signup', account);
    await b.call('POST', '/api/account/login', { email: account.email, password: account.password });
    assert.equal((await a.call('POST', '/api/account/profile', { name: 'ד', phone: '' })).status, 400);
    const profile = await a.call('POST', '/api/account/profile', { name: 'דנה לוי', phone: '052-7654321', marketing: true });
    assert.deepEqual([profile.data.user.name, profile.data.user.phone, profile.data.user.marketing], ['דנה לוי', '0527654321', true]);
    assert.equal((await a.call('POST', '/api/account/password/change', { current: 'wrong-one-1', password: 'brand-new-pass-1' })).status, 401);
    assert.equal((await a.call('POST', '/api/account/password/change', { current: account.password, password: 'brand-new-pass-1' })).status, 200);
    assert.equal((await a.call('GET', '/api/account/me')).data.user.name, 'דנה לוי', 'this device stays signed in');
    assert.equal((await b.call('GET', '/api/account/me')).data.user, null, 'other devices are signed out');
    const exported = await a.call('GET', '/api/account/export');
    assert.match(exported.headers.get('content-disposition'), /attachment/);
    assert.equal(exported.data.account.marketing.given, true);
    assert.ok(exported.data.account.marketing.at && exported.data.account.marketing.text);
    assert.equal(JSON.stringify(exported.data).includes('scrypt'), false);
  });
});

test('enquiries: linked when signed in; guest enquiries by email only once the email is verified', async () => {
  const sent = [];
  const hook = http.createServer(async (req, res) => { let raw = ''; for await (const chunk of req) raw += chunk; sent.push(JSON.parse(raw)); res.end('ok'); });
  await new Promise((resolve) => hook.listen(0, '127.0.0.1', resolve));
  const lead = (extra) => ({ type: 'contact', name: 'דנה כהן', phone: '050-123-4567', channel: 'whatsapp', consent: true, message: 'סוד', ...extra });
  try {
    await withServer({ EMAIL_PROVIDER: 'webhook', EMAIL_WEBHOOK_URL: `http://127.0.0.1:${hook.address().port}/mail` }, async ({ client }) => {
      const guest = client();
      assert.equal((await guest.call('POST', '/api/leads', lead({ email: 'dana@example.com' }))).status, 201);
      const me = client();
      await me.call('POST', '/api/account/signup', account);
      assert.equal((await me.call('POST', '/api/leads', lead({ type: 'tailor', destinations: 'יפן', adults: '2', children: '0', flexibility: 'open', budget: 'open' }))).status, 201);
      let leads = (await me.call('GET', '/api/account/leads')).data.leads;
      assert.equal(leads.length, 1, 'unverified email: only the enquiry sent while signed in');
      assert.equal(leads[0].title, 'יפן');
      assert.equal(JSON.stringify(leads).includes('סוד'), false, 'no message text in summaries');
      // Verify the email by signing in with a code.
      assert.deepEqual((await client().call('GET', '/api/account/config')).data, { emailLogin: true, passwordReset: false });
      const other = client();
      assert.equal((await other.call('POST', '/api/account/code/request', { email: 'nobody@example.com' })).status, 200);
      assert.equal(sent.length, 0, 'no mail for unknown addresses');
      await other.call('POST', '/api/account/code/request', { email: account.email });
      const code = /(\d{6})/.exec(sent[0].text)[1];
      assert.equal(sent[0].to, 'dana@example.com');
      assert.equal((await other.call('POST', '/api/account/code/verify', { email: account.email, code: code === '000000' ? '111111' : '000000' })).status, 401);
      const verified = await other.call('POST', '/api/account/code/verify', { email: account.email, code });
      assert.equal(verified.status, 200);
      assert.equal(verified.data.user.emailVerified, true);
      leads = (await other.call('GET', '/api/account/leads')).data.leads;
      assert.deepEqual(leads.map((l) => l.type).sort(), ['contact', 'tailor']);
      assert.equal((await other.call('POST', '/api/account/code/verify', { email: account.email, code })).status, 401, 'codes are single use');
    });
  } finally { hook.closeAllConnections(); await new Promise((resolve) => hook.close(resolve)); }
});

test('a code is burned after 5 wrong guesses', async () => {
  const sent = [];
  const hook = http.createServer(async (req, res) => { let raw = ''; for await (const chunk of req) raw += chunk; sent.push(JSON.parse(raw)); res.end('ok'); });
  await new Promise((resolve) => hook.listen(0, '127.0.0.1', resolve));
  try {
    await withServer({ EMAIL_PROVIDER: 'webhook', EMAIL_WEBHOOK_URL: `http://127.0.0.1:${hook.address().port}/mail` }, async ({ client }) => {
      await client().call('POST', '/api/account/signup', account);
      await client().call('POST', '/api/account/code/request', { email: account.email });
      const code = /(\d{6})/.exec(sent[0].text)[1], wrong = code === '123456' ? '654321' : '123456';
      for (let i = 0; i < 5; i++) await client().call('POST', '/api/account/code/verify', { email: account.email, code: wrong });
      assert.equal((await client().call('POST', '/api/account/code/verify', { email: account.email, code })).status, 401);
    });
  } finally { hook.closeAllConnections(); await new Promise((resolve) => hook.close(resolve)); }
});

test('password reset: off without an email sender; with one, the link is single use and signs everyone out', async () => {
  await withServer({}, async ({ client }) => {
    assert.deepEqual((await client().call('GET', '/api/account/config')).data, { emailLogin: false, passwordReset: false });
    assert.equal((await client().call('POST', '/api/account/password/forgot', { email: account.email })).status, 404);
    assert.equal((await client().call('POST', '/api/account/code/request', { email: account.email })).status, 404);
  });
  const sent = [];
  const hook = http.createServer(async (req, res) => { let raw = ''; for await (const chunk of req) raw += chunk; sent.push(JSON.parse(raw)); res.end('ok'); });
  await new Promise((resolve) => hook.listen(0, '127.0.0.1', resolve));
  try {
    await withServer({ EMAIL_PROVIDER: 'webhook', EMAIL_WEBHOOK_URL: `http://127.0.0.1:${hook.address().port}/mail`, SITE_URL: 'https://gerbi.example/' }, async ({ client }) => {
      const old = client();
      await old.call('POST', '/api/account/signup', account);
      assert.equal((await client().call('POST', '/api/account/password/forgot', { email: account.email }, { 'X-Forwarded-Host': 'evil.test', Origin: 'http://evil.test' })).status, 200);
      const link = /(https:\/\/\S+)/.exec(sent[0].text)[1];
      assert.ok(link.startsWith('https://gerbi.example/#/account?reset='), 'link built from SITE_URL, never the Host header');
      const token = new URLSearchParams(link.split('?')[1]).get('reset');
      assert.equal((await client().call('POST', '/api/account/password/reset', { token, password: 'short' })).status, 400);
      assert.equal((await client().call('POST', '/api/account/password/reset', { token, password: 'fresh-pass-2027' })).status, 200);
      assert.equal((await client().call('POST', '/api/account/password/reset', { token, password: 'other-pass-2027' })).status, 400, 'single use');
      assert.equal((await old.call('GET', '/api/account/me')).data.user, null, 'existing sessions revoked');
      assert.equal((await client().call('POST', '/api/account/login', { email: account.email, password: 'fresh-pass-2027' })).status, 200);
    });
  } finally { hook.closeAllConnections(); await new Promise((resolve) => hook.close(resolve)); }
});

test('delete account needs the password, removes the data and the email can sign up again', async () => {
  await withServer({}, async ({ client }) => {
    const c = client();
    await c.call('POST', '/api/account/signup', account);
    await c.call('POST', '/api/account/searches', { search: { origin: 'TLV', to: 'ATH', start: '2027-03-01', end: '2027-03-05', adults: 2, children: 0 } });
    assert.equal((await c.call('GET', '/api/account/searches')).data.searches.length, 1);
    const kept = c.cookie;
    assert.equal((await c.call('POST', '/api/account/delete', { password: 'wrong-pass-1' })).status, 401);
    assert.equal((await c.call('POST', '/api/account/delete', { password: account.password })).status, 200);
    c.cookie = kept;
    assert.equal((await c.call('GET', '/api/account/saved')).status, 401);
    assert.equal((await client().call('POST', '/api/account/login', { email: account.email, password: account.password })).status, 401);
    const again = await client().call('POST', '/api/account/signup', account);
    assert.equal(again.status, 201);
  });
});
