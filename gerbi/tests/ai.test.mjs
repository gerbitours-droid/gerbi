// Spec 22: AI gateway, grounded features, owner routes and the planner's multi-city detection — all without a real
// provider (a local mock server, an injected fetch or a fake Anthropic client).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { createGateway, redactPII, deepRedact, numbersGrounded, validateSchema, apiSchema, GUARD } from '../backend/ai-gateway.mjs';
import { TASKS } from '../backend/ai-tasks.mjs';
import { supportAnswer, tailorFill, flightExplain, leadBrief, leadFacts, blogDraft, digest, featureStatus } from '../backend/ai-features.mjs';
import { handleAi } from '../backend/ai-routes.mjs';
import { handleAdmin } from '../backend/admin.mjs';
import { createSearchStats } from '../backend/search-stats.mjs';
import { createStore } from '../backend/kv-store.mjs';
import { createSupport } from '../backend/support.mjs';
import { classify, newConversation } from '../backend/support-brain.mjs';
import { INTENTS } from '../backend/support-content.mjs';
import { startMockLlm } from '../scripts/mock-llm-server.mjs';
import { scoreLead, missingDetails, whatsappTemplate, fillName } from '../dist/lead-score.mjs';
import { tailorFromText, cleanTailor } from '../dist/tailor-fill.mjs';
import { detectLegs } from '../dist/multi-city-brief.mjs';
// These tests stand in for a trusted reverse proxy: clientOf() then keys limits on the right-most X-Forwarded-For hop.
process.env.TRUST_PROXY = '1';

const memoryStore = () => { const m = new Map(); return { get: async (k) => m.get(k) ?? null, set: async (k, v) => { m.set(k, v); }, push: async (k, v) => m.set(k, [v, ...(m.get(k) || [])]), list: async (k, n) => (m.get(k) || []).slice(0, n), m, kind: 'memory' }; };
const quiet = () => {};
const SOURCES = Object.entries(INTENTS).filter(([id]) => !['greeting', 'thanks', 'menu'].includes(id)).map(([id, i]) => ({ id, title: i.title, text: i.answer }));
// An OpenAI-compatible fake: answer(task, input, url) → object | Response-like failure.
const fakeFetch = (answer, calls = []) => async (url, init) => {
  const body = JSON.parse(init.body), task = body.response_format?.json_schema?.name || 'json', input = JSON.parse(body.messages[1].content);
  calls.push({ url, body, input });
  const out = await answer(task, input, url, body);
  if (out?.status) return { ok: false, status: out.status, json: async () => ({}) };
  return { ok: true, json: async () => ({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(out) } }], usage: { prompt_tokens: 1000, completion_tokens: 200 } }) };
};

test('PII redaction, grounding and schema helpers', () => {
  assert.equal(redactPII('דנה 050-1234567, +972 52 765 4321, dana@ex.co.il, כרטיס 4580 1234 5678 9012, ת"ז 123456782'), 'דנה [טלפון], [טלפון], [מייל], כרטיס [מספר הוסר], ת"ז [מספר הוסר]');
  assert.equal(redactPII('יציאה 2026-12-10, 3 לילות, ₪ 2,431'), 'יציאה 2026-12-10, 3 לילות, ₪ 2,431', 'dates and prices are not contact details');
  assert.deepEqual(deepRedact({ a: ['x 0501234567'], b: 3 }), { a: ['x [טלפון]'], b: 3 });
  assert.equal(numbersGrounded('הזולה עולה ₪ 2,431 ונמשכת 4 ש׳', ['{"price":"₪ 2,431","duration":"4 ש׳ 20 ד׳"}']), true);
  assert.equal(numbersGrounded('רק ₪ 1,999!', ['{"price":"₪ 2,431"}']), false, 'an invented price is caught');
  const schema = TASKS.flight_explain.schema;
  assert.deepEqual(validateSchema(schema, { summary: 'x', pick: 'A', tradeoffs: [] }), []);
  assert.ok(validateSchema(schema, { summary: 'x', pick: 'Z', tradeoffs: [], extra: 1 }).length >= 2);
  assert.ok(validateSchema(schema, { summary: 'x'.repeat(501), pick: '', tradeoffs: [] }).length, 'length limits enforced locally');
  assert.equal(JSON.stringify(apiSchema(schema)).includes('maxLength'), false, 'providers get the schema without limit keywords');
  for (const [id, def] of Object.entries(TASKS)) { assert.ok(['fast', 'smart', 'write'].includes(def.tier), id); assert.ok(def.dailyCalls > 0 && def.timeoutMs > 0, id); }
});

test('gateway without a key: nothing is called, cached answers are still served, status says why', async () => {
  const calls = [], gw = createGateway({ tasks: TASKS, env: {}, fetch: fakeFetch(() => ({}), calls), log: quiet });
  assert.equal(await gw.run('tiebreak', { brief: {}, offers: [] }), null);
  assert.equal(await gw.blockedReason('tiebreak'), 'no_provider');
  assert.equal(calls.length, 0);
  const cache = { get: async () => ({ pick: 1, reason: 'x' }), set: async () => {} };
  assert.deepEqual((await gw.run('tiebreak', {}, { cache })).value, { pick: 1, reason: 'x' });
  const s = await gw.status();
  assert.equal(s.configured, false); assert.ok(s.tasks.every((t) => t.blocked === 'no_provider'));
  assert.deepEqual(await featureStatus(gw), { understand: false, support_answer: false, tailor_fill: false, flight_explain: false });
});

test('gateway: only DeepSeek configured works; chain falls through a failing provider; usage and cost are logged without content', async () => {
  const calls = [], logs = [];
  const env = { DEEPSEEK_API_KEY: 'k1' };
  const gw = createGateway({ tasks: TASKS, env, fetch: fakeFetch(() => ({ pick: 0, reason: 'זולה יותר' }), calls), log: (e) => logs.push(e) });
  const r = await gw.run('tiebreak', { brief: { adults: 2 }, offers: [{ i: 0 }, { i: 1 }] });
  assert.equal(r.provider, 'deepseek'); assert.equal(calls[0].body.model, 'deepseek-chat');
  assert.equal(calls[0].body.response_format.type, 'json_object'); assert.match(calls[0].body.messages[0].content, /json object only/);
  assert.ok(calls[0].body.messages[0].content.includes(GUARD.trim().slice(0, 40)), 'injection guard in every system prompt');
  assert.deepEqual(Object.keys(logs[0]).sort(), ['evt', 'in', 'model', 'ms', 'out', 'outcome', 'provider', 'task', 'usd'].sort(), 'no content in the log line');
  assert.ok(logs[0].usd > 0);
  // Two providers: OpenRouter fails, DeepSeek answers.
  const env2 = { OPENROUTER_API_KEY: 'a', DEEPSEEK_API_KEY: 'b' }, calls2 = [];
  const gw2 = createGateway({ tasks: TASKS, env: env2, fetch: fakeFetch((task, input, url) => (url.includes('openrouter') ? { status: 500 } : { pick: 1, reason: 'ok' }), calls2), log: quiet });
  assert.equal((await gw2.run('tiebreak', { offers: [] })).provider, 'deepseek');
  assert.deepEqual(calls2.map((c) => new URL(c.url).host), ['openrouter.ai', 'api.deepseek.com']);
  // Per-provider breaker: three failures in a row skip OpenRouter for 10 minutes.
  await gw2.run('tiebreak', { offers: [1] }); await gw2.run('tiebreak', { offers: [2] });
  const before = calls2.length; await gw2.run('tiebreak', { offers: [3] });
  assert.deepEqual(calls2.slice(before).map((c) => new URL(c.url).host), ['api.deepseek.com']);
  const status = await gw2.status();
  assert.equal(status.tasks.find((t) => t.id === 'tiebreak').usage.errors, 3);
  assert.equal(status.providers.join(','), 'openrouter,deepseek');
  assert.deepEqual(createGateway({ tasks: TASKS, env: { ...env2, GERBI_AI_PROVIDERS: 'deepseek,openrouter' }, log: quiet }).providerOrder(), ['deepseek', 'openrouter']);
});

test('gateway: invalid JSON is rejected, kill switches (env + KV) and the daily budget fall back to rules', async () => {
  const flags = memoryStore(), usage = memoryStore();
  const gw = createGateway({ tasks: TASKS, env: { DEEPSEEK_API_KEY: 'k' }, fetch: fakeFetch((task) => (task === 'json' ? { pick: 'zero' } : {})), usageStore: usage, flagStore: flags, log: quiet });
  assert.equal(await gw.run('tiebreak', { a: 1 }), null, 'schema violation → no answer');
  await gw.flush();
  const doc = [...usage.m.values()][0];
  assert.equal(doc.tasks.tiebreak.errors, 1);
  await gw.setFlag('tiebreak', false);
  assert.equal(await gw.blockedReason('tiebreak'), 'switched_off');
  assert.deepEqual(await flags.get('flags'), { tiebreak: false });
  await gw.setFlag('tiebreak', true);
  assert.equal(await gw.blockedReason('tiebreak'), '');
  await assert.rejects(gw.setFlag('nope', false));
  const envOff = createGateway({ tasks: TASKS, env: { DEEPSEEK_API_KEY: 'k', GERBI_AI_DISABLED: 'support_answer' }, log: quiet });
  assert.equal(await envOff.blockedReason('support_answer'), 'env_disabled'); assert.equal(await envOff.blockedReason('tiebreak'), '');
  // A tiny daily cap: the first call spends it, the second is refused before any request.
  const calls = [], capped = createGateway({ tasks: TASKS, env: { DEEPSEEK_API_KEY: 'k', GERBI_AI_DAILY_USD: '0.0001' }, fetch: fakeFetch(() => ({ pick: 0, reason: 'x' }), calls), log: quiet });
  assert.ok(await capped.run('tiebreak', { n: 1 }));
  assert.equal(await capped.run('tiebreak', { n: 2 }), null);
  assert.equal(calls.length, 1); assert.equal(await capped.blockedReason('tiebreak'), 'daily_budget');
  // Mock provider is refused in production.
  assert.deepEqual(createGateway({ tasks: TASKS, env: { GERBI_AI_MOCK_URL: 'http://x', VERCEL: '1' }, log: quiet }).providerOrder(), []);
});

test('gateway → Anthropic: model per tier, structured output, cached system prompt, fallbacks only where supported', async () => {
  const requests = [], anthropic = { beta: { messages: { create: async (req) => { requests.push(req); return { stop_reason: 'end_turn', usage: { input_tokens: 800, output_tokens: 100, cache_read_input_tokens: 400 }, content: [{ type: 'text', text: req.model.includes('haiku') ? '{"pick":1,"reason":"ok"}' : '{"summary":"x","intent":"planning","missing":[],"nextStep":"y","whatsapp":"היי {שם},"}' }] }; } } } };
  const gw = createGateway({ tasks: TASKS, env: { ANTHROPIC_API_KEY: 'sk' }, anthropic, log: quiet });
  await gw.run('tiebreak', { o: 1 });
  await gw.run('lead_brief', { lead: { type: 'tailor' } });
  assert.equal(requests[0].model, 'claude-haiku-5-5'); assert.equal(requests[0].fallbacks, undefined, 'Haiku has no server-side fallback');
  assert.equal(requests[1].model, 'claude-sonnet-5-5'); assert.equal(requests[1].fallbacks, 'default');
  assert.equal(requests[0].output_config.format.type, 'json_schema'); assert.equal(requests[0].system[0].cache_control.type, 'ephemeral');
  assert.equal(gw.modelFor('anthropic', 'write'), 'claude-opus-5-5');
  assert.equal(createGateway({ tasks: TASKS, env: { ANTHROPIC_API_KEY: 'x', GERBI_ANTHROPIC_MODEL_FAST: 'claude-sonnet-5-5' }, log: quiet }).modelFor('anthropic', 'fast'), 'claude-sonnet-5-5');
});

test('features with the mock provider: grounded support answer, tailor fill, flight comparison; no contact details reach the provider', async () => {
  const mock = await startMockLlm();
  try {
    const gw = createGateway({ tasks: TASKS, env: { GERBI_AI_MOCK_URL: mock.url }, log: quiet });
    const answer = await supportAnswer('אפשר לשלם במזומן? הטלפון שלי 050-1234567 והמייל dana@example.com', SOURCES, { gw });
    assert.equal(answer.answerable, true); assert.ok(answer.topics.length >= 1); assert.ok(answer.answer.length > 10);
    const sent = JSON.stringify(mock.requests.map((r) => r.body));
    assert.equal(/050-1234567|dana@example\.com/.test(sent), false, 'contact details never sent');
    const fill = await tailorFill('ירח דבש ביפן באפריל, תקציב 40 אלף, אוכל ויין', { gw, today: '2026-11-15' });
    assert.equal(fill.source, 'ai'); assert.equal(fill.fields.destinations, 'יפן'); assert.equal(fill.fields.budget, '20to40', 'rules win on the budget');
    assert.ok(fill.fields.styles.includes('culinary') && fill.fields.styles.includes('romantic'));
    const offers = [{ label: 'A', price: '₪ 2,431', duration: '9 ש׳', stops: 1 }, { label: 'B', price: '₪ 2,690', duration: '4 ש׳', stops: 0 }];
    const take = await flightExplain(offers, { adults: 2, children: 0 }, { gw });
    assert.match(take.summary, /2,431/); assert.equal(take.pick, 'A'); assert.match(take.summary, /^הטיסה הראשונה/); assert.equal(/\bA\b/.test(take.summary + take.tradeoffs.join(' ')), false);
    const ok = await gw.status();
    assert.ok(ok.tasks.find((t) => t.id === 'support_answer').usage.ok === 1);
  } finally { await mock.close(); }
});

test('grounding rejects invented facts: support answer with a new number, flight comparison with a new price', async () => {
  const gw = createGateway({ tasks: TASKS, env: { DEEPSEEK_API_KEY: 'k' }, log: quiet, fetch: fakeFetch((task) => (task === 'json' ? {} : {})) });
  const answering = (out) => createGateway({ tasks: TASKS, env: { DEEPSEEK_API_KEY: 'k' }, log: quiet, fetch: fakeFetch(() => out) });
  const bad = await supportAnswer('כמה עולה מזוודה?', SOURCES, { gw: answering({ answerable: true, answer: 'מזוודה עולה 45 דולר.', topics: ['baggage'], escalate: false }) });
  assert.equal(bad.answerable, false); assert.deepEqual(bad.topics, ['baggage'], 'falls back to the owner\'s own answer for the topic');
  const unknownTopic = await supportAnswer('x', SOURCES, { gw: answering({ answerable: true, answer: 'אפשר להשאיר פרטים כאן.', topics: ['nope'], escalate: false }) });
  assert.deepEqual(unknownTopic.topics, []);
  const offers = [{ label: 'A', price: '₪ 2,431' }, { label: 'B', price: '₪ 2,690' }];
  assert.equal(await flightExplain(offers, {}, { gw: answering({ summary: 'A עולה רק ₪ 1,999 והיא הכי טובה', pick: 'A', tradeoffs: [] }) }), null);
  assert.equal(await flightExplain([offers[0]], {}, { gw }), null, 'needs two offers');
});

test('lead priority, missing details and WhatsApp template (no AI); AI lead brief never sees name, phone or e-mail', async () => {
  const now = new Date('2026-11-15T10:00:00Z');
  const hot = { id: 'a1b2c3d4', type: 'tailor', status: 'new', createdAt: '2026-11-14T06:00:00Z', name: 'דנה כהן', phone: '0501234567', email: 'dana@example.com', destinations: 'יוון', start: '2026-12-05', end: '2026-12-12', adults: 2, children: 2, budget: '20to40', styles: ['family'], notes: 'מלון עם בריכה. אפשר לחזור אליי ב־052-7654321' };
  const p = scoreLead(hot, now);
  assert.equal(p.level, 'high'); assert.ok(p.score >= 60); assert.ok(p.reasons.some((r) => r.includes('יציאה בעוד 20 ימים')));
  assert.equal(scoreLead({ ...hot, status: 'closed' }, now).level, 'done');
  assert.equal(scoreLead({ id: 'x', type: 'contact', status: 'progress', createdAt: '2026-11-15T09:00:00Z', message: 'שאלה' }, now).level, 'low');
  assert.deepEqual(missingDetails({ type: 'tailor', destinations: 'עוד לא יודעים', budget: 'open', children: 1 }).length, 3);
  assert.match(fillName(whatsappTemplate(hot), hot.name), /^היי דנה, כאן ג׳רבי טורס/);
  const rules = await leadBrief(hot, { now, useAi: false });
  assert.equal(rules.source, 'rules'); assert.ok(rules.whatsapp.includes('{שם}'));
  const facts = JSON.stringify(leadFacts(hot, now));
  assert.equal(/דנה|0501234567|dana@|כהן/.test(facts), false, 'no name/phone/email in the facts');
  const mock = await startMockLlm();
  try {
    const gw = createGateway({ tasks: TASKS, env: { GERBI_AI_MOCK_URL: mock.url }, log: quiet });
    const ai = await leadBrief(hot, { now, gw });
    assert.equal(ai.source, 'ai'); assert.ok(ai.whatsapp.startsWith('היי {שם},')); assert.equal(ai.priority.level, 'high');
    const sent = JSON.stringify(mock.requests.map((r) => r.body));
    assert.equal(/דנה|0501234567|052-7654321|dana@/.test(sent), false);
  } finally { await mock.close(); }
});

test('blog draft: template without AI; AI draft flags money for checking; digest numbers come from the data', async () => {
  const skeleton = await blogDraft({ topic: 'סופ״ש ברומא', keywords: [], audience: 'families' }, { gw: createGateway({ tasks: TASKS, env: {}, log: quiet }) });
  assert.equal(skeleton.source, 'template'); assert.ok(skeleton.body.includes('## '));
  const body = '## למה רומא\n\n' + 'טקסט על רומא. '.repeat(30) + '\n\nכניסה לקולוסיאום עולה 18 יורו.';
  const gw = createGateway({ tasks: TASKS, env: { DEEPSEEK_API_KEY: 'k' }, log: quiet, fetch: fakeFetch(() => ({ title: 'רומא', seoTitle: 'רומא עם ילדים', seoDescription: 'מדריך', excerpt: 'תקציר', slug: 'Rome With Kids!', category: 'מדריכים', tags: ['רומא'], outline: ['למה רומא'], body: body + ' [קישור](https://evil.example)', factsToVerify: [] })) });
  const draft = await blogDraft({ topic: 'רומא', keywords: [], audience: 'families' }, { gw });
  assert.equal(draft.source, 'ai'); assert.equal(draft.slug, 'rome-with-kids');
  assert.match(draft.factsToVerify[0], /סכומים/); assert.equal(draft.body.includes('https://'), false);
  const leads = [{ id: '1', type: 'tailor', status: 'new', createdAt: '2026-11-10T08:00:00Z', destinations: 'יוון', budget: '10to20' }, { id: '2', type: 'contact', status: 'closed', createdAt: '2026-11-14T08:00:00Z', message: 'x' }];
  const searches = { searches: 9, zero: 2, multi: 1, oneway: 1, routes: { 'TLV-ATH': 5 }, months: { '2026-12': 9 }, party: { 2: 9 } };
  const d = await digest(leads, searches, { days: 7, now: new Date('2026-11-15T10:00:00Z') });
  assert.equal(d.source, 'rules'); assert.equal(d.facts.leads.total, 2); assert.equal(d.facts.leads.waitingOver24h, 1);
  assert.ok(d.actions[0].includes('1'));
  assert.equal(JSON.stringify(d.facts).includes('x'), false, 'no customer text in the digest facts');
});

test('tailor form rules: Hebrew sentence → fields; AI values re-checked like typed input', () => {
  const { fields } = tailorFromText('זוג עם שני ילדים בני 5 ו-9, איטליה ויוון, 10 לילות באוגוסט, עד 30 אלף שקל, ים וכשר', '2026-11-15');
  assert.equal(fields.adults, 2); assert.equal(fields.children, 2); assert.equal(fields.budget, '20to40'); assert.equal(fields.flexibility, 'month');
  assert.match(fields.destinations, /איטליה/); assert.ok(fields.styles.includes('family')); assert.match(fields.notes, /כשר/);
  assert.equal(tailorFromText('ירח דבש ביפן 12-24 באפריל', '2026-11-15').fields.destinations, 'יפן');
  assert.deepEqual(cleanTailor({ destinations: 'x', start: '2020-01-01', adults: 99, budget: 'million', styles: ['beach', 'evil'], notes: '<b>hi</b>' }, '2026-11-15'), { styles: ['beach'], notes: 'bhi/b' });
});

test('planner multi-city: route cues + one date per flight → validated legs; otherwise null', () => {
  const today = '2026-11-15';
  assert.deepEqual(detectLegs('מתל אביב לרומא ב-10.12, משם לפריז ב-14.12 וחוזרים הביתה ב-18.12', { today }).legs,
    [{ from: 'TLV', to: 'FCO', date: '2026-12-10' }, { from: 'FCO', to: 'PAR', date: '2026-12-14' }, { from: 'PAR', to: 'TLV', date: '2026-12-18' }]);
  assert.deepEqual(detectLegs('טסים לרומא ב-3 במרץ וחוזרים מפריז ב-10 במרץ', { today }).legs, [{ from: 'TLV', to: 'FCO', date: '2027-03-03' }, { from: 'PAR', to: 'TLV', date: '2027-03-10' }], 'open jaw');
  assert.equal(detectLegs('לונדון ב 5/1 ואז ברלין ב 9/1 ואז אמסטרדם ב 12/1 וחזרה ב 15/1', { today }).legs.length, 4);
  assert.equal(detectLegs('לרומא ב-10.12 וחוזרים ב-15.12', { today }), null, 'one destination is a round trip, not multi-city');
  assert.equal(detectLegs('רומא ופריז באוגוסט, משם הביתה', { today }), null, 'no exact dates');
  assert.equal(detectLegs('לרומא ב-14.12 ומשם לפריז ב-10.12', { today }), null, 'dates going back are refused');
});

test('support bot: a question the rules miss gets an answer composed from the owner\'s texts, marked as AI with its sources', async () => {
  const mock = await startMockLlm(), dir = await mkdtemp(path.join(os.tmpdir(), 'gerbi-ai-sb-'));
  try {
    const gw = createGateway({ tasks: TASKS, env: { GERBI_AI_MOCK_URL: mock.url }, log: quiet });
    const text = 'האם אתם עובדים גם עם חברות תעופה זולות?';
    assert.equal(classify(text).intent, null, 'precondition: the rules do not understand it');
    const support = createSupport({ dataDirectory: dir, leadStore: createStore('leads', dir), env: {}, gw });
    const conv = Object.assign(newConversation('t1', 'web'), { key: 'web:t1' });
    const { reply } = await support.turn(conv, { text }, 'support:test');
    assert.equal(reply.messages[0].ai, true); assert.ok(reply.messages[0].sources.length >= 1);
    assert.ok(reply.chips.some((c) => c.id === 'human'), 'a human is always one tap away');
    // Switched off → the old behaviour (no AI text).
    await gw.setFlag('support_answer', false);
    const conv2 = Object.assign(newConversation('t2', 'web'), { key: 'web:t2' });
    const { reply: plain } = await support.turn(conv2, { text }, 'support:test');
    assert.equal(plain.messages[0].ai, undefined);
  } finally { await mock.close(); await rm(dir, { recursive: true, force: true }); }
});

test('routes: public features/tailor/explain; owner endpoints need a session; brief, digest, usage and switches work', async () => {
  const TOKEN = 'owner-pass-123', mock = await startMockLlm(), dir = await mkdtemp(path.join(os.tmpdir(), 'gerbi-ai-routes-'));
  const env = { LEADS_ADMIN_TOKEN: TOKEN };
  const gw = createGateway({ tasks: TASKS, env: { GERBI_AI_MOCK_URL: mock.url }, log: quiet, flagStore: memoryStore(), usageStore: memoryStore() });
  const sessions = createStore('admin', dir), leadStore = createStore('leads', dir), content = createStore('content', dir), searchStats = createSearchStats(createStore('search-stats', dir));
  await leadStore.push('all', { id: 'abcdef12-0000', type: 'tailor', status: 'new', createdAt: new Date().toISOString(), name: 'רון לוי', phone: '0521112233', destinations: 'יפן', start: new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10), adults: 2, children: 0, budget: 'over40', styles: [] }, 5000);
  await searchStats.record({ originDestinations: [{ origin: { code: 'TLV' }, destination: { code: 'ATH' }, date: '2026-12-10' }], passengers: { ptcList: [{ ptc: 'ADT', count: 2 }] } }, 0);
  const body = async (req) => { let raw = ''; for await (const c of req) raw += c; return raw ? JSON.parse(raw) : {}; };
  const server = http.createServer(async (req, res) => {
    const send = (code, data) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
    const url = new URL(req.url, 'http://x');
    if (await handleAi(req, res, url, { send, body, leadStore, sessions, llmCache: null, searchStats, env, gw })) return;
    if (!(await handleAdmin(req, res, url, { send, body, store: content, sessions, leadStore, env }))) send(404, {});
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  let cookie = '';
  const call = async (method, route, payload) => {
    const r = await fetch(base + route, { method, headers: { 'X-Forwarded-For': '10.22.0.1', ...(cookie ? { Cookie: cookie } : {}), ...(payload !== undefined ? { 'Content-Type': 'application/json' } : {}) }, body: payload === undefined ? undefined : JSON.stringify(payload) });
    const set = r.headers.get('set-cookie'); if (set) cookie = set.split(';')[0];
    return { status: r.status, data: await r.json().catch(() => null) };
  };
  try {
    assert.deepEqual((await call('GET', '/api/ai/features')).data.features, { understand: true, support_answer: true, tailor_fill: true, flight_explain: true });
    const fill = await call('POST', '/api/ai/tailor-fill', { text: 'ירח דבש ביפן, אוכל ויין' });
    assert.equal(fill.status, 200); assert.equal(fill.data.fields.destinations, 'יפן');
    assert.equal((await call('POST', '/api/ai/tailor-fill', { text: 'x' })).status, 400);
    assert.equal((await call('POST', '/api/ai/explain-flights', { offers: [{ price: '1' }] })).status, 400);
    const take = await call('POST', '/api/ai/explain-flights', { offers: [{ price: '₪ 2,431', duration: '9 ש׳', stops: 1, departs: ['05:40', 'bad'] }, { price: '₪ 2,690', duration: '4 ש׳', stops: 0 }], brief: { adults: 2 } });
    assert.equal(take.data.ok, true);
    assert.equal((await call('POST', '/api/admin/ai/lead/abcdef12-0000', {})).status, 401, 'no session');
    assert.equal((await call('GET', '/api/admin/ai/usage')).status, 401);
    assert.equal((await call('POST', '/api/admin/login', { password: TOKEN })).status, 204);
    const brief = await call('POST', '/api/admin/ai/lead/abcdef12-0000', {});
    assert.equal(brief.status, 200); assert.equal(brief.data.source, 'ai'); assert.equal(brief.data.priority.level, 'high');
    assert.equal((await call('POST', '/api/admin/ai/lead/ffffffff-0000', {})).status, 404);
    const insights = await call('GET', '/api/admin/ai/insights?days=7');
    assert.equal(insights.data.source, 'rules'); assert.equal(insights.data.facts.searches.total, 1); assert.equal(insights.data.facts.searches.noResults, 1);
    assert.equal((await call('POST', '/api/admin/ai/insights?days=7', {})).data.source, 'ai');
    const draft = await call('POST', '/api/admin/ai/blog-draft', { topic: 'אתונה עם ילדים', keywords: 'אתונה, athens-kids', audience: 'families' });
    assert.equal(draft.data.source, 'ai'); assert.equal((await call('POST', '/api/admin/ai/blog-draft', { topic: '' })).status, 400);
    assert.equal((await call('POST', '/api/admin/ai/blog-draft', { topic: 'אתונה', ai: false })).data.source, 'template');
    assert.equal((await call('PUT', '/api/admin/ai/flags', { task: 'flight_explain', on: false })).status, 200);
    assert.equal((await call('GET', '/api/ai/features')).data.features.flight_explain, false);
    const usage = await call('GET', '/api/admin/ai/usage');
    assert.equal(usage.data.configured, true); assert.ok(usage.data.tasks.find((t) => t.id === 'lead_brief').usage.ok >= 1);
    assert.equal(usage.data.tasks.find((t) => t.id === 'flight_explain').blocked, 'switched_off'); assert.equal(usage.data.history.length, 7);
    assert.equal((await call('PUT', '/api/admin/ai/flags', { task: 'nope', on: false })).status, 400);
  } finally { server.closeAllConnections(); await new Promise((r) => server.close(r)); await mock.close(); await rm(dir, { recursive: true, force: true }); }
});
