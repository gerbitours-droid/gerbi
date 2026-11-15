// Spec 21: the customer-service bot and the customer AI features in English.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { classify, respond, newConversation, confirmation } from '../backend/support-brain.mjs';
import { INTENTS, CHIP_LABELS, mergeContent, localizeContent, hoursStatus, hoursTextEn, chipLabel, validateContentUpdate } from '../backend/support-content.mjs';
import { createSupport } from '../backend/support.mjs';
import { createStore } from '../backend/kv-store.mjs';
import { toWhatsApp, sign } from '../backend/whatsapp.mjs';
import { createGateway, ENGLISH_OUTPUT } from '../backend/ai-gateway.mjs';
import { TASKS } from '../backend/ai-tasks.mjs';
import { supportAnswer, tailorFill, flightExplain } from '../backend/ai-features.mjs';
import { handleAi } from '../backend/ai-routes.mjs';
import { startMockLlm } from '../scripts/mock-llm-server.mjs';
import { DICTS } from '../dist/i18n.mjs';

const HEBREW = /[֐-׿]/;
const fixture = (name) => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'));
const accuracy = (set) => set.filter(([text, expected]) => classify(text).intent === expected).length / set.length;
const contact = { whatsapp: '972500000000', email: 'info@example.co.il', phone: '030000000' };
const OPEN = new Date('2026-11-18T09:00:00Z'), CLOSED = new Date('2026-11-21T09:00:00Z');
const en = localizeContent(mergeContent(null), 'en');
const quiet = () => {};
const memoryStore = () => { const m = new Map(); return { get: async (k) => m.get(k) ?? null, set: async (k, v) => { m.set(k, v); }, m }; };
const textOf = (reply) => JSON.stringify([reply.messages.map((m) => [m.text, m.link?.label]), (reply.chips || []).map((c) => c.label)]);

test('English questions: every intent is understood (≥95% tuning, ≥90% held out), Hebrew sets untouched', () => {
  const tuning = fixture('support-intents-en.json'), holdout = fixture('support-intents-en-holdout.json');
  for (const id of Object.keys(INTENTS)) assert.ok(tuning.some(([, e]) => e === id), `English set covers ${id}`);
  assert.ok(accuracy(tuning) >= 0.95, `en tuning ${accuracy(tuning)}`);
  assert.ok(accuracy(holdout) >= 0.9, `en holdout ${accuracy(holdout)}`);
  assert.equal(accuracy(fixture('support-intents.json')), 1);
  assert.equal(accuracy(fixture('support-intents-holdout.json')), 1);
  assert.equal(classify('this is useless!').frustrated, true);
});

test('every built-in answer and chip has an English version; chips fit WhatsApp buttons; no prices', () => {
  for (const id of Object.keys(INTENTS)) {
    assert.ok(DICTS.en[`support.intent.${id}.answer`]?.length > 10, id);
    assert.doesNotMatch(en.answers[id], HEBREW, id);
    assert.doesNotMatch(en.answers[id], /₪|\$|€|volero/i, id);
  }
  for (const id of Object.keys(CHIP_LABELS)) { const label = chipLabel(id, 'en'); assert.ok(label && label.length <= 20 && !HEBREW.test(label), `${id}: ${label}`); }
  assert.equal(en.hours.text, 'Sun–Thu 09:00–18:00, Fri 09:00–13:00');
  assert.equal(hoursTextEn({ 0: ['10:00', '14:00'], 1: null, 2: ['10:00', '14:00'], 3: ['10:00', '14:00'] }), 'Sun 10:00–14:00, Tue–Wed 10:00–14:00');
  assert.match(hoursStatus(en.hours, CLOSED, 'en').next, /^Closed right now\. We open tomorrow at 09:00$/);
  assert.match(hoursStatus(en.hours, new Date('2026-11-20T12:30:00Z'), 'en').next, /on Sunday at 09:00/);
});

test('owner text: a Hebrew-only edit keeps the English default; an English edit is used', () => {
  const merged = mergeContent({ answers: { baggage: 'תשובה של הבעלים' }, answersEn: { price: 'Owner English price text' }, hours: { text: 'כל יום', textEn: 'Every day 9–5', days: {} } });
  assert.equal(merged.answers.baggage, 'תשובה של הבעלים');
  const local = localizeContent(merged, 'en');
  assert.equal(local.answers.baggage, DICTS.en['support.intent.baggage.answer']);
  assert.equal(local.answers.price, 'Owner English price text');
  assert.equal(local.hours.text, 'Every day 9–5');
  assert.equal(localizeContent(merged, 'he'), merged, 'Hebrew content is untouched');
  const update = validateContentUpdate({ answersEn: { baggage: 'New English baggage' } }, { answers: { price: 'x' } });
  assert.deepEqual(update.value.answersEn, { baggage: 'New English baggage' });
  assert.ok(validateContentUpdate({ answersEn: { nope: 'x' } }).error);
});

test('an English conversation: answers, chips, escalation and confirmation are all English', () => {
  const conv = Object.assign(newConversation('e', 'web'), { lang: 'en' }), opts = { content: en, contact, now: OPEN };
  let r = respond(conv, { chip: 'greeting' }, opts);
  assert.match(r.messages[0].text, /Gerbi Tours customer service/); assert.doesNotMatch(textOf(r), HEBREW);
  r = respond(conv, { text: 'What are your opening hours?' }, opts);
  assert.equal(r.intent, 'contact_hours'); assert.match(r.messages[0].text, /Sun–Thu 09:00–18:00/); assert.match(r.messages.at(-1).text, /^Open now, until 18:00\.$/);
  assert.equal(r.messages[0].link.label, 'Contact form'); assert.doesNotMatch(textOf(r), HEBREW);
  r = respond(conv, { text: 'I want to talk to an agent' }, opts);
  assert.equal(r.intent, 'human'); assert.equal(r.input, 'name'); assert.match(r.messages.at(-1).text, /What’s your name\?/);
  r = respond(conv, { text: 'My name is Dana' }, opts); assert.equal(conv.contact.name, 'Dana'); assert.equal(r.input, 'tel');
  r = respond(conv, { text: '123' }, opts); assert.match(r.messages[0].text, /valid Israeli number/);
  r = respond(conv, { text: '050-123-4567' }, opts); assert.match(r.messages[0].text, /I agree that Gerbi Tours/); assert.doesNotMatch(textOf(r), HEBREW);
  r = respond(conv, { text: 'yes' }, opts); assert.deepEqual(r.escalate, { reason: 'asked_human' });
  const done = confirmation(conv, 'abcd1234', en, OPEN);
  assert.match(done[0].text, /^Got it\. Your reference: abcd1234\. A representative will get back to you soon/); assert.doesNotMatch(done[0].text, HEBREW);
  r = respond(conv, { chip: 'enquiry_status' }, opts); assert.match(r.messages[0].text, /reference abcd1234\) was received on/); assert.doesNotMatch(textOf(r), HEBREW);
  // Two misses → offer of a person, in English.
  const lost = Object.assign(newConversation('m', 'web'), { lang: 'en' });
  respond(lost, { text: 'zzz' }, opts); r = respond(lost, { text: 'qqq' }, opts);
  assert.match(r.messages[0].text, /Would you like a representative/); assert.deepEqual(r.chips.map((c) => c.label), ['Yes, contact me', 'No, thanks']);
});

// ---- HTTP: site chat with lang and WhatsApp language detection ----
async function body(req) { let raw = ''; for await (const chunk of req) raw += chunk; return raw ? JSON.parse(raw) : {}; }
async function harness(env = {}) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'gerbi-support-en-'));
  const leadStore = createStore('leads', dir), graph = [];
  const graphServer = http.createServer(async (req, res) => { graph.push(await body(req)); res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('{}'); });
  await new Promise((r) => graphServer.listen(0, '127.0.0.1', r));
  const fullEnv = { ...env, ...(env.WHATSAPP_TOKEN ? { WHATSAPP_GRAPH_URL: `http://127.0.0.1:${graphServer.address().port}/v21.0` } : {}) };
  const support = createSupport({ dataDirectory: dir, leadStore, env: fullEnv, contact, now: () => OPEN });
  const server = http.createServer(async (req, res) => {
    const send = (code, data) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
    try { const url = new URL(req.url, 'http://x'); if (!(await support.handle(req, res, url, { send, body }))) send(404, {}); } catch (error) { send(500, { error: error.message }); }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return { base: `http://127.0.0.1:${server.address().port}`, graph, leadStore, close: async () => { server.close(); graphServer.close(); await rm(dir, { recursive: true, force: true }); } };
}
const post = (base, p, data, headers = {}) => fetch(base + p, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: typeof data === 'string' ? data : JSON.stringify(data) });

test('site chat with lang "en": English replies and hours; the support lead stays Hebrew for the team but is marked English', async () => {
  const h = await harness();
  try {
    let r = await (await post(h.base, '/api/support/message', { chip: 'greeting', lang: 'en' })).json();
    assert.doesNotMatch(JSON.stringify([r.messages, r.chips, r.hours]), HEBREW); assert.equal(r.hours.text, 'Sun–Thu 09:00–18:00, Fri 09:00–13:00');
    const sessionId = r.sessionId;
    r = await (await post(h.base, '/api/support/message', { sessionId, lang: 'en', text: 'How many suitcases can I take?' })).json(); assert.equal(r.intent, 'baggage'); assert.match(r.messages[0].text, /airline/);
    r = await (await post(h.base, '/api/support/message', { sessionId, lang: 'en', text: 'Can I speak to a human?' })).json(); assert.equal(r.input, 'name');
    await post(h.base, '/api/support/message', { sessionId, lang: 'en', text: 'Dana Cohen' });
    await post(h.base, '/api/support/message', { sessionId, lang: 'en', text: '0501234567' });
    r = await (await post(h.base, '/api/support/message', { sessionId, lang: 'en', chip: 'consent_yes' })).json();
    assert.match(r.messages.at(-1).text, /Your reference: [0-9a-f]{8}/); assert.doesNotMatch(JSON.stringify(r.messages), HEBREW);
    const [lead] = await h.leadStore.list('all', 10);
    assert.equal(lead.lang, 'en'); assert.match(lead.message, /^\[ביקש\/ה נציג\]/, 'the team reads Hebrew'); assert.match(lead.consent.text, /^I agree/);
    // The Hebrew page (no lang) still gets Hebrew in the same API.
    r = await (await post(h.base, '/api/support/message', { chip: 'greeting' })).json(); assert.match(r.messages[0].text, /שירות הלקוחות של ג׳רבי טורס/);
  } finally { await h.close(); }
});

const WA = { WHATSAPP_VERIFY_TOKEN: 'v', WHATSAPP_APP_SECRET: 'app-secret', WHATSAPP_TOKEN: 't', WHATSAPP_PHONE_NUMBER_ID: '123456' };
let seq = 0;
const inbound = (message) => ({ object: 'whatsapp_business_account', entry: [{ changes: [{ field: 'messages', value: { metadata: { phone_number_id: '123456' }, contacts: [{ wa_id: '972521234567', profile: { name: 'Dana' } }], messages: [{ from: '972521234567', id: `wamid.en${++seq}`, timestamp: '1763456400', ...message }] } }] }] });
const deliver = (base, payload) => { const raw = JSON.stringify(payload); return post(base, '/api/whatsapp/webhook', raw, { 'X-Hub-Signature-256': sign(raw, WA.WHATSAPP_APP_SECRET) }); };

test('WhatsApp: an English message gets an English reply; one Latin word inside a Hebrew chat does not switch it', async () => {
  const h = await harness(WA);
  try {
    await deliver(h.base, inbound({ type: 'text', text: { body: 'How many suitcases can I take?' } }));
    assert.match(h.graph.at(-1).interactive.body.text, /airline/); assert.doesNotMatch(JSON.stringify(h.graph.at(-1)), HEBREW);
    await deliver(h.base, inbound({ type: 'text', text: { body: 'כמה מזוודות?' } }));
    assert.match(h.graph.at(-1).interactive.body.text, /חברת התעופה/);
    await deliver(h.base, inbound({ type: 'text', text: { body: 'ok' } }));
    assert.match(JSON.stringify(h.graph.at(-1)), /[֐-׿]/, 'still Hebrew');
  } finally { await h.close(); }
  const [list] = toWhatsApp({ messages: [{ text: 'x', link: { href: '#/contact', label: 'Contact form' } }], chips: Array.from({ length: 5 }, (_, i) => ({ id: `c${i}`, label: `Topic ${i}` })) }, '1', { siteUrl: 'https://gerbi.example', lang: 'en' });
  assert.equal(list.interactive.action.button, 'Choose a topic'); assert.match(list.interactive.body.text, /https:\/\/gerbi\.example\/en\/#\/contact/);
});

test('AI: lang "en" appends the English-output note, has its own cache key, and features answer in English', async () => {
  const mock = await startMockLlm();
  try {
    const gw = createGateway({ tasks: TASKS, env: { GERBI_AI_MOCK_URL: mock.url }, log: quiet }), cache = memoryStore();
    const offers = [{ label: 'A', price: '₪2,431', duration: '9h', stops: 1 }, { label: 'B', price: '₪2,690', duration: '4h', stops: 0 }];
    const he = await flightExplain(offers, { adults: 2, children: 0 }, { gw, store: cache });
    const enTake = await flightExplain(offers, { adults: 2, children: 0 }, { gw, store: cache, lang: 'en' });
    assert.equal(mock.requests.length, 2, 'Hebrew and English are cached separately');
    assert.match(he.summary, /^הטיסה הראשונה/);
    assert.match(enTake.summary, /^The first flight costs ₪2,431/); assert.match(enTake.summary, /the second flight costs/); assert.doesNotMatch(enTake.summary + enTake.tradeoffs.join(' '), /\b[BC]\b|[֐-׿]/);
    assert.ok(mock.requests[1].body.messages[0].content.includes(ENGLISH_OUTPUT.trim().slice(0, 40)));
    assert.ok(!mock.requests[0].body.messages[0].content.includes('English version of the site'));
    await flightExplain(offers, { adults: 2, children: 0 }, { gw, store: cache, lang: 'en' });
    assert.equal(mock.requests.length, 2, 'the English answer is served from its cache');
    const fill = await tailorFill('Honeymoon in Japan in April, food and wine', { gw, today: '2026-11-15', lang: 'en' });
    assert.equal(fill.source, 'ai'); assert.equal(fill.fields.destinations, 'Japan'); assert.ok(fill.fields.styles.includes('romantic'));
    const sources = Object.keys(INTENTS).filter((id) => !['greeting', 'thanks', 'menu'].includes(id)).map((id) => ({ id, title: DICTS.en[`support.intent.${id}.title`], text: en.answers[id] }));
    const answer = await supportAnswer('Can I pay with cash at the office?', sources, { gw, lang: 'en' });
    assert.equal(answer.answerable, true); assert.doesNotMatch(answer.answer, HEBREW);
    assert.ok(mock.requests.at(-1).body.messages[0].content.includes('English version of the site'));
  } finally { await mock.close(); }
});

test('AI routes: lang travels from the request; errors and fallbacks are English', async () => {
  const mock = await startMockLlm({ broken: new Set(['flight_explain']) });
  const gw = createGateway({ tasks: TASKS, env: { GERBI_AI_MOCK_URL: mock.url }, log: quiet, flagStore: memoryStore(), usageStore: memoryStore() });
  const server = http.createServer(async (req, res) => {
    const send = (code, data) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
    if (!(await handleAi(req, res, new URL(req.url, 'http://x'), { send, body, leadStore: null, sessions: null, llmCache: null, searchStats: null, env: {}, gw }))) send(404, {});
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`, headers = { 'X-Forwarded-For': '10.31.0.7' };
  try {
    let r = await post(base, '/api/ai/tailor-fill', { text: 'x', lang: 'en' }, headers);
    assert.equal(r.status, 400); assert.equal((await r.json()).message, DICTS.en['ai.err.text_required']);
    r = await post(base, '/api/ai/tailor-fill', { text: 'Honeymoon in Japan in April', lang: 'en' }, headers);
    assert.equal((await r.json()).fields.destinations, 'Japan');
    const offers = [{ price: '₪2,431', stops: 1 }, { price: '₪2,690', stops: 0 }];
    r = await post(base, '/api/ai/explain-flights', { offers, brief: { adults: 1 }, lang: 'en' }, headers);
    const data = await r.json(); assert.equal(data.ok, false); assert.equal(data.message, DICTS.en['ai.take.unavailable']);
    r = await post(base, '/api/ai/explain-flights', { offers, brief: { adults: 1 } }, headers);
    assert.equal((await r.json()).message, DICTS.he['ai.take.unavailable']);
  } finally { server.close(); await mock.close(); }
});
