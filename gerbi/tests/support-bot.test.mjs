import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { classify, respond, newConversation, normalize } from '../backend/support-brain.mjs';
import { INTENTS, CHIP_LABELS, mergeContent, hoursStatus, validateContentUpdate } from '../backend/support-content.mjs';
import { createSupport, redact } from '../backend/support.mjs';
import { createStore } from '../backend/kv-store.mjs';
import { sign, parseInbound, toWhatsApp, validSignature, phoneFromWaId } from '../backend/whatsapp.mjs';

const fixture = (name) => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'));
const content = mergeContent(null);
const contact = { whatsapp: '972500000000', email: 'info@example.co.il', phone: '030000000' };
// Wednesday 2026-11-18 11:00 Israel time (open) and Saturday 2026-11-21 11:00 (closed).
const OPEN = new Date('2026-11-18T09:00:00Z'), CLOSED = new Date('2026-11-21T09:00:00Z');

function accuracy(set) { return set.filter(([text, expected]) => classify(text).intent === expected).length / set.length; }

test('intent accuracy: ≥90% on the tuning set and on the held-out set', () => {
  const tuning = fixture('support-intents.json'), holdout = fixture('support-intents-holdout.json');
  assert.ok(tuning.length >= 80 && holdout.length >= 40);
  assert.ok(accuracy(tuning) >= 0.9, `tuning ${accuracy(tuning)}`);
  assert.ok(accuracy(holdout) >= 0.9, `holdout ${accuracy(holdout)}`);
  for (const id of Object.keys(INTENTS)) assert.ok(tuning.some(([, e]) => e === id), `tuning set covers ${id}`);
});

test('normalization: niqqud, geresh, final letters and punctuation', () => {
  assert.equal(normalize('שָׁלוֹם, ג׳רבי!'), 'שלומ גרבי !');
  assert.equal(classify('ESTA לארה"ב').intent, 'documents');
  assert.equal(classify('ומה עם המזוודות?').intent, 'baggage');
  assert.equal(classify('ביטול').intent, 'cancel_change', 'Bit (payment) does not swallow ביטול');
});

test('every FAQ answer comes from the content file, without prices or the supplier name', () => {
  for (const [id, intent] of Object.entries(INTENTS)) {
    assert.ok(intent.answer.length > 10, id);
    assert.doesNotMatch(intent.answer, /volero/i);
    assert.doesNotMatch(intent.answer, /₪|\$|€|\d+\s*(ש"ח|שקל|דולר)/, `${id} quotes no price`);
    for (const chip of intent.chips) assert.ok(CHIP_LABELS[chip] && CHIP_LABELS[chip].length <= 20, `${chip} label fits a WhatsApp button`);
  }
  for (const id of ['baggage', 'cancel_change', 'how_booking', 'payment', 'documents', 'contact_hours', 'enquiry_status', 'tailor', 'price']) {
    const conv = newConversation('t', 'web');
    const reply = respond(conv, { chip: id }, { content, contact, now: OPEN });
    assert.equal(reply.intent, id); assert.ok(reply.messages[0].text.length > 20); assert.ok(reply.chips.some((c) => c.id === 'human' || c.id === 'menu'));
    assert.doesNotMatch(reply.messages.map((m) => m.text).join(' '), /\{(hours|phone|whatsapp|email)\}/, 'placeholders filled');
  }
});

test('owner overrides: known intents only, length-capped, empty = default, hours validated', () => {
  const merged = mergeContent({ answers: { baggage: 'תשובה של הבעלים', bogus: 'x', price: 42 }, hours: { text: 'כל יום', days: { 0: ['10:00', '12:00'], 6: ['bad', 'x'] } } });
  assert.equal(merged.answers.baggage, 'תשובה של הבעלים');
  assert.equal(merged.answers.price, INTENTS.price.answer);
  assert.equal(merged.answers.bogus, undefined);
  assert.deepEqual(merged.hours.days[0], ['10:00', '12:00']);
  assert.equal(merged.hours.days[6], null, 'malformed slot falls back to the default (closed Saturday)');
  assert.ok(validateContentUpdate({ answers: { nope: 'x' } }).error);
  assert.ok(validateContentUpdate({ answers: { baggage: 'x'.repeat(1201) } }).error);
  assert.deepEqual(validateContentUpdate({ answers: { baggage: '' } }, { answers: { baggage: 'old' } }).value.answers, {});
});

test('business hours in Israel time', () => {
  assert.equal(hoursStatus(content.hours, OPEN).open, true);
  const closed = hoursStatus(content.hours, CLOSED);
  assert.equal(closed.open, false); assert.match(closed.next, /מחר ב־09:00/);
  assert.match(hoursStatus(content.hours, new Date('2026-11-20T12:30:00Z')).next, /ראשון/, 'Friday afternoon → Sunday');
});

test('asking for a person: name → phone (validated) → consent → escalate', () => {
  const conv = newConversation('a', 'web'), opts = { content, contact, now: OPEN };
  let r = respond(conv, { text: 'אני רוצה לדבר עם נציג' }, opts);
  assert.equal(r.intent, 'human'); assert.equal(r.input, 'name');
  r = respond(conv, { text: 'דנה' }, opts); assert.equal(r.input, 'tel');
  r = respond(conv, { text: '12345' }, opts); assert.equal(r.input, 'tel'); assert.match(r.messages[0].text, /לא נראה ישראלי/);
  r = respond(conv, { text: '050-123-4567' }, opts); assert.ok(r.chips.some((c) => c.id === 'consent_yes'));
  assert.equal(conv.contact.phone, '0501234567');
  r = respond(conv, { chip: 'consent_yes' }, opts);
  assert.deepEqual(r.escalate, { reason: 'asked_human' });
  assert.equal(conv.collect, null);
});

test('escalation triggers: complaint, frustration, booking issue, two misses; cancel leaves without a lead', () => {
  const opts = { content, contact, now: OPEN };
  for (const [text, reason] of [['אני רוצה להגיש תלונה', 'complaint'], ['חויבתי פעמיים על הטיסה', 'booking_issue'], ['נמאס לי, זה לא עובד', 'frustration'], ['איפה המזוודה שלי???', 'frustration']]) {
    const conv = newConversation('x', 'web'); respond(conv, { text }, opts);
    assert.equal(conv.collect?.reason, reason, text);
  }
  const conv = newConversation('m', 'web');
  assert.match(respond(conv, { text: 'בננה' }, opts).messages[0].text, /לא בטוח שהבנתי/);
  const offer = respond(conv, { text: 'קלמנטינה' }, opts);
  assert.ok(offer.chips.some((c) => c.id === 'yes_escalate'));
  respond(conv, { chip: 'yes_escalate' }, opts); assert.equal(conv.collect.reason, 'not_understood');
  const out = respond(conv, { text: 'ביטול' }, opts);
  assert.equal(conv.collect, null); assert.equal(out.escalate, undefined); assert.match(out.messages[0].text, /לא נשמרה פנייה/);
  // Two bad phone numbers end the collection with direct contact details.
  const c2 = newConversation('p', 'web'); respond(c2, { text: 'נציג' }, opts); respond(c2, { text: 'יוסי' }, opts); respond(c2, { text: '1' }, opts);
  const giveUp = respond(c2, { text: '2' }, opts); assert.equal(c2.collect, null); assert.match(giveUp.messages[0].text, /03-0000000/);
});

test('known WhatsApp contact skips straight to consent', () => {
  const conv = newConversation('w', 'whatsapp'); conv.contact = { name: 'רון', phone: '0521112233' };
  const r = respond(conv, { text: 'נציג בבקשה' }, { content, contact, now: OPEN });
  assert.ok(r.chips.some((c) => c.id === 'consent_yes')); assert.match(r.messages.at(-1).text, /בוואטסאפ/);
});

test('PII minimisation in transcripts', () => {
  assert.equal(redact('הכרטיס 4580 1234 5678 9012 נכשל'), 'הכרטיס [מספר הוסר] נכשל');
  assert.match(redact('תתקשרו 050-1234567 או a@b.com'), /\[טלפון\].*\[מייל\]/);
});

// ---- HTTP: the site chat, the escalation inbox and the WhatsApp webhook ----
async function body(req, limit = 32_000) { let raw = ''; for await (const chunk of req) { raw += chunk; if (raw.length > limit) throw new Error('payload_too_large'); } return raw ? JSON.parse(raw) : {}; }
async function harness(env) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'gerbi-support-'));
  const leadStore = createStore('leads', dir), graph = [];
  const graphServer = http.createServer(async (req, res) => { graph.push({ url: req.url, auth: req.headers.authorization, payload: await body(req) }); res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('{"messages":[{"id":"wamid.out"}]}'); });
  await new Promise((r) => graphServer.listen(0, '127.0.0.1', r));
  const fullEnv = { ...env, ...(env.WHATSAPP_TOKEN ? { WHATSAPP_GRAPH_URL: `http://127.0.0.1:${graphServer.address().port}/v21.0` } : {}) };
  const support = createSupport({ dataDirectory: dir, leadStore, env: fullEnv, contact, now: () => OPEN });
  const server = http.createServer(async (req, res) => {
    const send = (code, data) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
    try { const url = new URL(req.url, 'http://x'); if (!(await support.handle(req, res, url, { send, body }))) send(404, { error: 'not_found' }); } catch (error) { send(500, { error: error.message }); }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  return { base, graph, leadStore, dir, close: async () => { server.close(); graphServer.close(); await rm(dir, { recursive: true, force: true }); } };
}
const post = (base, p, data, headers = {}) => fetch(base + p, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: typeof data === 'string' ? data : JSON.stringify(data) });

test('site chat end to end: escalation stores a support lead and shows in the owner inbox', async () => {
  const h = await harness({ LEADS_ADMIN_TOKEN: 'secret-token' });
  try {
    let r = await (await post(h.base, '/api/support/message', { chip: 'greeting' })).json();
    assert.ok(r.sessionId && r.chips.length >= 5); assert.equal(r.hours.open, true);
    const sessionId = r.sessionId;
    assert.equal((await post(h.base, '/api/support/message', {})).status, 400);
    r = await (await post(h.base, '/api/support/message', { sessionId, text: 'כמה מזוודות מותר?' })).json(); assert.equal(r.intent, 'baggage');
    r = await (await post(h.base, '/api/support/message', { sessionId, text: 'אפשר בן אדם?' })).json(); assert.equal(r.input, 'name');
    r = await (await post(h.base, '/api/support/message', { sessionId, text: 'דנה כהן' })).json(); assert.equal(r.input, 'tel');
    r = await (await post(h.base, '/api/support/message', { sessionId, text: '0501234567' })).json();
    r = await (await post(h.base, '/api/support/message', { sessionId, chip: 'consent_yes' })).json();
    assert.match(r.messages.at(-1).text, /מספר הפנייה: [0-9a-f]{8}/); assert.equal(r.escalation.status, 'open');
    // Asking again does not open a second escalation.
    r = await (await post(h.base, '/api/support/message', { sessionId, text: 'נציג' })).json(); assert.match(r.messages.at(-1).text, /כבר העברנו/);
    const [lead] = await h.leadStore.list('all', 10);
    assert.equal(lead.type, 'support'); assert.equal(lead.phone, '0501234567'); assert.equal(lead.channel, 'phone'); assert.ok(lead.transcript.length >= 4); assert.equal(lead.consent.given, true);
    // Owner inbox.
    assert.equal((await fetch(h.base + '/api/support/escalations')).status, 401);
    assert.equal((await fetch(h.base + '/api/support/escalations', { headers: { Authorization: 'Bearer wrong' } })).status, 401);
    const inbox = await (await fetch(h.base + '/api/support/escalations', { headers: { Authorization: 'Bearer secret-token' } })).json();
    assert.equal(inbox.count, 1); assert.equal(inbox.open, 1); assert.equal(inbox.retentionDays, 90);
    const e = inbox.escalations[0];
    for (const key of ['id', 'ref', 'createdAt', 'status', 'channel', 'reason', 'reasonLabel', 'name', 'phone', 'leadId', 'conversationId', 'summary', 'transcript', 'handoff']) assert.ok(key in e, key);
    assert.equal(e.reason, 'asked_human'); assert.equal(e.leadId, lead.id); assert.match(e.summary, /מזוודות/);
    const done = await (await post(h.base, `/api/support/escalations/${e.ref}`, { status: 'handled' }, { Authorization: 'Bearer secret-token' })).json();
    assert.equal(done.escalation.status, 'handled');
    assert.equal((await (await fetch(h.base + '/api/support/escalations?status=open', { headers: { Authorization: 'Bearer secret-token' } })).json()).count, 0);
    // Content editing.
    assert.equal((await fetch(h.base + '/api/support/content', { method: 'PUT', headers: { Authorization: 'Bearer secret-token' }, body: JSON.stringify({ answers: { baggage: 'נוסח חדש לכבודה' } }) })).status, 200);
    r = await (await post(h.base, '/api/support/message', { sessionId, chip: 'baggage' })).json(); assert.equal(r.messages[0].text, 'נוסח חדש לכבודה');
  } finally { await h.close(); }
});

test('owner endpoints do not exist without LEADS_ADMIN_TOKEN; WhatsApp webhook 404 without its env', async () => {
  const h = await harness({});
  try {
    assert.equal((await fetch(h.base + '/api/support/escalations', { headers: { Authorization: 'Bearer x' } })).status, 404);
    assert.equal((await fetch(h.base + '/api/support/content', { headers: { Authorization: 'Bearer x' } })).status, 404);
    assert.equal((await fetch(h.base + '/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=x&hub.challenge=1')).status, 404);
    assert.equal((await post(h.base, '/api/whatsapp/webhook', {})).status, 404);
  } finally { await h.close(); }
});

const WA = { WHATSAPP_VERIFY_TOKEN: 'verify-me', WHATSAPP_APP_SECRET: 'app-secret', WHATSAPP_TOKEN: 'graph-token', WHATSAPP_PHONE_NUMBER_ID: '123456', LEADS_ADMIN_TOKEN: 'secret-token' };
let seq = 0;
const inbound = (message, name = 'מיכל') => ({ object: 'whatsapp_business_account', entry: [{ id: 'WABA', changes: [{ field: 'messages', value: { messaging_product: 'whatsapp', metadata: { phone_number_id: '123456' }, contacts: [{ wa_id: '972521234567', profile: { name } }], messages: [{ from: '972521234567', id: `wamid.${++seq}`, timestamp: '1763456400', ...message }] } }] }] });
const deliver = (base, payload, secret = WA.WHATSAPP_APP_SECRET) => { const raw = JSON.stringify(payload); return post(base, '/api/whatsapp/webhook', raw, { 'X-Hub-Signature-256': sign(raw, secret) }); };

test('WhatsApp: verify handshake, signature, same brain, hand-off silences the bot, handled resumes it', async () => {
  const h = await harness(WA);
  try {
    let res = await fetch(h.base + '/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=4242');
    assert.equal(res.status, 200); assert.equal(await res.text(), '4242');
    assert.equal((await fetch(h.base + '/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=nope&hub.challenge=1')).status, 403);
    assert.equal((await deliver(h.base, inbound({ type: 'text', text: { body: 'היי' } }), 'wrong-secret')).status, 401);
    assert.equal(h.graph.length, 0);
    res = await deliver(h.base, inbound({ type: 'text', text: { body: 'כמה מזוודות מותר?' } }));
    assert.equal(res.status, 200);
    assert.equal(h.graph.length, 1); assert.equal(h.graph[0].auth, 'Bearer graph-token'); assert.equal(h.graph[0].url, '/v21.0/123456/messages');
    assert.equal(h.graph[0].payload.to, '972521234567'); assert.equal(h.graph[0].payload.interactive.type, 'button'); assert.match(h.graph[0].payload.interactive.body.text, /חברת התעופה/);
    // Duplicate delivery of the same message is ignored.
    const dup = inbound({ type: 'text', text: { body: 'תודה' } }), before = h.graph.length;
    await deliver(h.base, dup); await deliver(h.base, dup); assert.equal(h.graph.length, before + 1);
    // Ask for a person: name and phone are known, so only consent is asked (button reply).
    await deliver(h.base, inbound({ type: 'text', text: { body: 'נציג בבקשה' } }));
    assert.ok(h.graph.at(-1).payload.interactive.action.buttons.some((b) => b.reply.id === 'consent_yes'));
    await deliver(h.base, inbound({ type: 'interactive', interactive: { type: 'button_reply', button_reply: { id: 'consent_yes', title: 'כן' } } }));
    assert.match(JSON.stringify(h.graph.at(-1).payload), /מספר הפנייה/);
    const [lead] = await h.leadStore.list('all', 5);
    assert.equal(lead.channel, 'whatsapp'); assert.equal(lead.phone, '0521234567'); assert.equal(lead.name, 'מיכל');
    // Handed off: the bot stays silent but keeps the message for the owner.
    const sent = h.graph.length;
    await deliver(h.base, inbound({ type: 'text', text: { body: 'עוד פרט: הטיסה ב-12.12' } }));
    assert.equal(h.graph.length, sent);
    const auth = { Authorization: 'Bearer secret-token' };
    const inbox = await (await fetch(h.base + '/api/support/escalations', { headers: auth })).json();
    assert.equal(inbox.escalations[0].channel, 'whatsapp'); assert.equal(inbox.escalations[0].handoff, true);
    assert.match(JSON.stringify(inbox.escalations[0].transcript), /עוד פרט/);
    await post(h.base, `/api/support/escalations/${inbox.escalations[0].id}`, { status: 'handled' }, auth);
    await deliver(h.base, inbound({ type: 'text', text: { body: 'מה שעות הפעילות?' } }));
    assert.equal(h.graph.length, sent + 1, 'bot answers again after the owner marked it handled');
    // Non-text messages get a polite text-only note with the topic list.
    await deliver(h.base, inbound({ type: 'image', image: { id: 'x' } }));
    assert.equal(h.graph.at(-1).payload.interactive.type, 'list');
  } finally { await h.close(); }
});

test('WhatsApp adapter units: parsing, payload limits, phone mapping', () => {
  assert.equal(validSignature(Buffer.from('{}'), sign('{}', 's'), 's'), true);
  assert.equal(validSignature(Buffer.from('{}'), 'sha256=' + '0'.repeat(64), 's'), false);
  assert.equal(validSignature(Buffer.from('{}'), undefined, 's'), false);
  const msgs = parseInbound(inbound({ type: 'text', text: { body: 'שלום' } }));
  assert.equal(msgs.length, 1); assert.equal(msgs[0].name, 'מיכל');
  assert.deepEqual(parseInbound({ entry: [{ changes: [{ field: 'messages', value: { statuses: [{ id: 'x' }] } }] }] }), []);
  const list = toWhatsApp({ messages: [{ text: 'בחרו', link: { href: '#/contact', label: 'צור קשר' } }], chips: Object.keys(CHIP_LABELS).slice(0, 12).map((id) => ({ id, label: CHIP_LABELS[id] })) }, '972500000000', { siteUrl: 'https://gerbi.example' });
  assert.equal(list.at(-1).interactive.action.sections[0].rows.length, 10);
  assert.ok(list.at(-1).interactive.action.sections[0].rows.every((r) => r.title.length <= 24));
  assert.match(list.at(-1).interactive.body.text, /https:\/\/gerbi\.example\/#\/contact/);
  assert.equal(toWhatsApp({ messages: [{ text: 'x'.repeat(1100) }], chips: [{ id: 'menu', label: 'תפריט' }] }, '1').length, 2, 'long body goes as text first');
  assert.equal(phoneFromWaId('972521234567'), '0521234567'); assert.equal(phoneFromWaId('14155550100'), '+14155550100');
});
