// Regressions for the bugs found in the QA pass of 15.11.2026 (docs/qa/QA-REPORT-2026-11-15-he.md).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { LearningStore } from '../backend/learning-store.mjs';
import { createSupport } from '../backend/support.mjs';
import { createStore } from '../backend/kv-store.mjs';
import { redactPII } from '../backend/ai-gateway.mjs';
import { safeLink } from '../dist/markdown.mjs';
import { createDeals } from '../backend/deals.mjs';

test('learning store: "__proto__"/"constructor" tokens neither pollute Object.prototype nor wedge later writes', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'gerbi-qa-'));
  try {
    const store = new LearningStore(dir);
    await store.learnQuery({ text: '__proto__ constructor beach family', tags: ['beach', 'family', '__proto__'], consent: true });
    assert.equal(({}).beach, undefined); assert.equal(({}).family, undefined);
    await store.feedback({ event: 'save', destinationId: 'rome', tags: ['__proto__', 'constructor', 'beach'] });
    const summary = await store.learnQuery({ text: 'חופשה בים', tags: ['beach'], consent: true });
    assert.equal(summary.totals.understood, 2, 'the store keeps working after the hostile request');
  } finally { await rm(dir, { recursive: true, force: true }); }
});

async function supportHarness(siteStore) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'gerbi-qa-support-'));
  const support = createSupport({ dataDirectory: dir, leadStore: createStore('leads', dir), env: {}, contact: { whatsapp: '972500000000', email: 'info@example.co.il', phone: '030000000' }, siteStore, now: () => new Date('2026-11-18T09:00:00Z') });
  const body = async (req) => { let raw = ''; for await (const c of req) raw += c; return raw ? JSON.parse(raw) : {}; };
  const server = http.createServer(async (req, res) => {
    const send = (code, data) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
    try { if (!(await support.handle(req, res, new URL(req.url, 'http://x'), { send, body }))) send(404, {}); } catch (error) { send(500, { error: error.message }); }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const post = (data) => fetch(`http://127.0.0.1:${server.address().port}/api/support/message`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  return { post, close: async () => { server.close(); await rm(dir, { recursive: true, force: true }); } };
}

test('support bot: contact details edited in /admin replace the built-in ones; prototype keys are not chips', async () => {
  const site = { get: async (key) => (key === 'site' ? { contact: { phone: '037654321', whatsapp: '972541112233', email: 'owner@example.com' } } : null) };
  const h = await supportHarness(site);
  try {
    const r = await (await h.post({ chip: 'contact_hours' })).json();
    const text = r.messages.map((m) => m.text).join(' ');
    assert.match(text, /03-7654321/); assert.match(text, /054-1112233/); assert.match(text, /owner@example\.com/);
    assert.doesNotMatch(text, /0000000/);
    for (const chip of ['__proto__', 'constructor']) assert.equal((await h.post({ chip })).status, 400, chip);
  } finally { await h.close(); }
});

test('AI gateway: loosely formatted phones, dotted cards and IDs with a check digit are redacted; dates/prices are not', () => {
  for (const s of ['(054) 123-4567', '054.123.4567', '+972(0)54-1234567', '054-12-34-567']) assert.equal(redactPII(s), '[טלפון]', s);
  assert.equal(redactPII('4580.1234.5678.9012'), '[מספר הוסר]');
  assert.equal(redactPII('12345678-9'), '[מספר הוסר]');
  for (const s of ['יציאה 2026-12-10, 3 לילות, ₪ 2,431', '05.12.2026 ב-10:30', 'מחיר 1,234.56 דולר']) assert.equal(redactPII(s), s);
});

test('markdown links: "/\\host" (a protocol-relative link to another site in browsers) is refused', () => {
  assert.equal(safeLink('/\\evil.example'), ''); assert.equal(safeLink('//evil.example'), '');
  assert.equal(safeLink('/blog/x'), '/blog/x'); assert.equal(safeLink('#/contact'), '#/contact');
});

test('deals: a refresh that found nothing is not repeated by every visitor while the store is down', async () => {
  let clock = Date.parse('2026-11-15T10:00:00Z'), calls = 0;
  const down = { get: async () => { throw new Error('kv down'); }, set: async () => { throw new Error('kv down'); } };
  const deals = createDeals({ search: async () => { calls++; throw Object.assign(new Error('down'), { status: 503 }); }, store: down, now: () => clock, today: () => '2026-11-15' });
  const pending = [], background = (p) => { pending.push(p); return p; };
  await deals.get({ background }); await Promise.all(pending);
  const first = calls;
  for (let i = 0; i < 5; i++) { clock += 1000; await deals.get({ background }); await Promise.all(pending); }
  assert.equal(calls, first, 'no new supplier calls within the cool-down');
  clock += 10 * 60_000; await deals.get({ background }); await Promise.all(pending);
  assert.ok(calls > first, 'retried after the cool-down');
});
