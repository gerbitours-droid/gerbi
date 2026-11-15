// Spec 21: account and lead forms in English — validation messages, option labels, server field errors,
// emails to the customer, and the language stored on a lead. Hebrew stays the default everywhere.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { validateLead, optionLabel, consentText, CONSENT_TEXT, CHANNELS, FLEXIBILITY, BUDGETS, STYLES } from '../dist/leads-validate.mjs';
import { validateSignup, validateProfile, passwordProblem, marketingText, MARKETING_TEXT } from '../dist/account-core.mjs';
import { tailorFromText } from '../dist/tailor-fill.mjs';
import { createAccounts } from '../backend/accounts.mjs';
import { handleLeads } from '../backend/leads.mjs';
import { createStore } from '../backend/kv-store.mjs';

const HEBREW = /[֐-׿]/;
const TODAY = '2026-11-15';
const contact = (extra = {}) => ({ type: 'contact', name: 'Dana Cohen', phone: '050-123-4567', channel: 'whatsapp', consent: true, message: 'Hello', ...extra });
const allEnglish = (errors) => Object.values(errors).forEach((m) => assert.ok(m && !HEBREW.test(m), `English message: ${m}`));

test('lead validation messages follow the requested language; Hebrew stays the default', () => {
  const bad = { type: 'tailor', name: ' ', phone: '123', channel: 'fax', consent: false, destinations: '', start: '2020-01-01', end: '2019-01-01', adults: '0', children: '99', notes: 'x'.repeat(2001) };
  const en = validateLead(bad, { today: TODAY, lang: 'en' }).errors;
  assert.deepEqual(Object.keys(en).sort(), ['adults', 'channel', 'children', 'consent', 'destinations', 'end', 'name', 'notes', 'phone', 'start']);
  allEnglish(en);
  assert.equal(en.phone, 'That doesn’t look like a valid Israeli phone number. Example: 050-1234567.');
  const he = validateLead(bad, { today: TODAY }).errors;
  assert.equal(he.name, 'כתבו שם (לפחות 2 תווים).');
  assert.equal(he.phone, 'מספר הטלפון לא נראה ישראלי תקין. לדוגמה: ⁦050-1234567⁩.');
  allEnglish(validateLead(contact({ channel: 'email', message: 'x'.repeat(2001) }), { today: TODAY, lang: 'en' }).errors);
  allEnglish(validateLead(contact({ phone: '' }), { today: TODAY, lang: 'en' }).errors);
});

test('a lead remembers its language; unknown values fall back to Hebrew', () => {
  assert.equal(validateLead(contact({ lang: 'en' }), { today: TODAY }).lead.lang, 'en');
  assert.equal(validateLead(contact(), { today: TODAY }).lead.lang, 'he');
  assert.equal(validateLead(contact({ lang: 'fr' }), { today: TODAY }).lead.lang, 'he');
});

test('every form option has a label in both languages; the owner maps stay Hebrew', () => {
  for (const [group, map] of [['channel', CHANNELS], ['flex', FLEXIBILITY], ['budget', BUDGETS], ['style', STYLES]]) {
    for (const [key, hebrew] of Object.entries(map)) {
      assert.equal(optionLabel(group, key, 'he'), hebrew, `${group}.${key} Hebrew matches the owner map`);
      const en = optionLabel(group, key, 'en');
      assert.ok(en && !HEBREW.test(en) && en !== `leads.${group}.${key}`, `${group}.${key} English`);
    }
  }
  assert.equal(consentText('he'), CONSENT_TEXT);
  assert.ok(!HEBREW.test(consentText('en')));
  assert.equal(marketingText('he'), MARKETING_TEXT);
});

test('account validation in English', () => {
  allEnglish(validateSignup({ name: 'x', email: 'nope', password: '12345678', phone: '123', privacy: false }, 'en').errors);
  allEnglish(validateSignup({ name: 'Dana', email: '', password: 'x'.repeat(200), privacy: true }, 'en').errors);
  allEnglish(validateProfile({ name: 'x'.repeat(81) }, 'en').errors);
  assert.equal(passwordProblem('short', 'en'), 'Your password needs at least 8 characters.');
  assert.equal(passwordProblem('short'), 'הסיסמה צריכה לכלול לפחות 8 תווים.');
});

test('tailor-made notes from free text are written in the requested language', () => {
  const { fields } = tailorFromText('ירח דבש ביוון, כשר, שומרי שבת', TODAY, 'en');
  assert.ok(fields.notes && !HEBREW.test(fields.notes), fields.notes);
  assert.equal(fields.destinations, 'Greece');
  assert.match(tailorFromText('ירח דבש ביוון, כשר', TODAY).fields.notes, /כשר/);
});

let ip = 0;
async function withServer(env, run) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'gerbi-i18n-acc-'));
  const store = createStore('accounts', directory), leadStore = createStore('leads', directory);
  const accounts = createAccounts({ store, leadStore, env });
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
    const forwarded = `10.21.${Math.floor(++ip / 250)}.${ip % 250}`;
    return async (method, route, payload) => {
      const response = await fetch(base + route, { method, headers: { Origin: base, 'X-Forwarded-For': forwarded, ...(payload !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) }, body: payload !== undefined ? JSON.stringify(payload) : undefined });
      const set = response.headers.get('set-cookie');
      if (set) cookie = set.split(';')[0];
      return { status: response.status, data: await response.json().catch(() => null) };
    };
  };
  try { await run({ client, leadStore, store }); } finally { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); await rm(directory, { recursive: true, force: true }); }
}

test('server: English leads keep lang + the English consent text, field errors come back in English', async () => {
  await withServer({}, async ({ client, leadStore }) => {
    const call = client();
    const invalid = await call('POST', '/api/leads', contact({ phone: 'abc', consent: false, lang: 'en' }));
    assert.equal(invalid.status, 400);
    assert.equal(invalid.data.error, 'lead_invalid');
    allEnglish(invalid.data.fields);
    assert.equal((await call('POST', '/api/leads', contact({ lang: 'en' }))).status, 201);
    assert.equal((await call('POST', '/api/leads', contact({ name: 'דנה' }))).status, 201);
    const [hebrew, english] = await leadStore.list('all', 10);
    assert.equal(english.lang, 'en');
    assert.equal(english.consent.text, consentText('en'));
    assert.equal(hebrew.lang, 'he');
    assert.equal(hebrew.consent.text, CONSENT_TEXT);
  });
});

test('server: account field errors, success messages and emails follow the request language', async () => {
  const sent = [];
  const hook = http.createServer(async (req, res) => { let raw = ''; for await (const chunk of req) raw += chunk; sent.push(JSON.parse(raw)); res.end('ok'); });
  await new Promise((resolve) => hook.listen(0, '127.0.0.1', resolve));
  try {
    await withServer({ EMAIL_PROVIDER: 'webhook', EMAIL_WEBHOOK_URL: `http://127.0.0.1:${hook.address().port}/mail`, SITE_URL: 'https://gerbi.example' }, async ({ client, store, leadStore }) => {
      const me = client();
      const bad = await me('POST', '/api/account/signup', { name: 'x', email: 'nope', password: '1', lang: 'en' });
      assert.equal(bad.data.error, 'signup_invalid');
      allEnglish(bad.data.fields);
      assert.equal((await me('POST', '/api/account/signup', { name: 'Dana Cohen', email: 'dana@example.com', password: 'sunny-beach-27', privacy: true, marketing: true, lang: 'en' })).status, 201);
      const wrong = await me('POST', '/api/account/password/change', { current: 'nope-nope-1', password: 'new-pass-word-9', lang: 'en' });
      assert.equal(wrong.data.fields.current, 'Your current password is incorrect.');
      const forgot = await client()('POST', '/api/account/password/forgot', { email: 'dana@example.com', lang: 'en' });
      assert.equal(forgot.data.message, 'If there’s an account with this email, we’ve sent it a password reset link.');
      assert.equal(sent.at(-1).subject, 'Reset your Gerbi Tours password');
      assert.match(sent.at(-1).text, /https:\/\/gerbi\.example\/en\/#\/account\?reset=/);
      await client()('POST', '/api/account/password/forgot', { email: 'dana@example.com' });
      assert.match(sent.at(-1).text, /https:\/\/gerbi\.example\/#\/account\?reset=/);
      assert.equal(sent.at(-1).subject, 'איפוס הסיסמה בג׳רבי טורס');
      // A general enquiry gets a server-made title; the English page is told so it can show its own wording.
      assert.equal((await me('POST', '/api/leads', contact({ lang: 'en' }))).status, 201);
      const leads = (await me('GET', '/api/account/leads')).data.leads;
      assert.equal(leads[0].generic, true);
      // The owner's handling status (admin) shows in the customer's list.
      assert.equal(leads[0].status, 'new');
      const [record] = await leadStore.list('all', 1);
      await leadStore.setListStatus('all', record.id, 'progress');
      assert.equal((await me('GET', '/api/account/leads')).data.leads[0].status, 'progress');
    });
  } finally { hook.closeAllConnections(); await new Promise((resolve) => hook.close(resolve)); }
});
