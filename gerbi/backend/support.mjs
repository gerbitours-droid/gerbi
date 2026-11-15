// Customer-service routes (spec 16 §6–7): the site chat, the owner's escalation inbox and content editor, and the
// WhatsApp Cloud API webhook. Storage through kv-store; escalations become `type: 'support'` leads.
import { createHash, randomUUID } from 'node:crypto';
import { createStore } from './kv-store.mjs';
import { recordLead, tokenMatches } from './leads.mjs';
import { allow, clientOf } from './volero-guard.mjs';
import { partnerClassify, scrub } from './llm-partner.mjs';
import { supportAnswer, gateway } from './ai-features.mjs';
import { faqs as builtinFaqs } from '../dist/pages.mjs';
import { classify, respond, confirmation, newConversation, contactContext } from './support-brain.mjs';
import { INTENTS, CHIP_LABELS, REASON_LABELS, mergeContent, validateContentUpdate, hoursStatus } from './support-content.mjs';
import { whatsappEnabled, sameSecret, validSignature, parseInbound, phoneFromWaId, toWhatsApp, sendPayloads, WINDOW_MS } from './whatsapp.mjs';
import { CONSENT_TEXT } from '../dist/leads-validate.mjs';
import { contact as siteContact } from '../dist/data.mjs';

export const RETENTION_DAYS = 90;
const TTL = RETENTION_DAYS * 86400, MAX_TRANSCRIPT = 40, MAX_INDEX = 2000, HANDOFF_IDLE_MS = 72 * 3600 * 1000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Card-like digit runs never reach storage; phones and e-mails in free text are masked too (names/phones collected
// for the escalation live only in conv.contact and the lead).
export const redact = (text) => scrub(String(text || '').replace(/\b(?:\d[ -]?){13,19}\b/g, '[מספר הוסר]')).slice(0, 500);

async function readRaw(req, limit = 256_000) {
  const chunks = []; let size = 0;
  for await (const chunk of req) { size += chunk.length; if (size > limit) throw new Error('payload_too_large'); chunks.push(chunk); }
  return Buffer.concat(chunks);
}

export function createSupport({ dataDirectory, leadStore, llmCache = null, env = process.env, contact = siteContact, now = () => new Date(), stores = {}, siteStore = null, gw = gateway }) {
  const conversations = stores.conversations || createStore('support-conversations', dataDirectory);
  const escalations = stores.escalations || createStore('support-escalations', dataDirectory);
  const contentStore = stores.content || createStore('support-content', dataDirectory);
  const waStore = stores.whatsapp || createStore('support-whatsapp', dataDirectory);
  let contentCache = { at: 0, value: null };

  async function content() {
    if (contentCache.value && Date.now() - contentCache.at < 60_000) return contentCache.value;
    const override = await contentStore.get('faq').catch(() => null);
    contentCache = { at: Date.now(), value: mergeContent(override) };
    return contentCache.value;
  }
  const loadConv = async (key) => { try { return await conversations.get(key); } catch { return null; } };
  const saveConv = async (conv) => { conv.updatedAt = now().toISOString(); conv.transcript = conv.transcript.slice(-MAX_TRANSCRIPT); try { await conversations.set(conv.key, conv, TTL); } catch (error) { console.log(JSON.stringify({ evt: 'support_store', ok: false, error: error.message })); } };
  const log = (conv, from, text, intent) => { if (text) conv.transcript.push({ from, text: from === 'user' ? redact(text) : String(text).slice(0, 500), at: now().toISOString(), ...(intent ? { intent } : {}) }); };

  async function createEscalation(conv, reason, intent, clientKey) {
    if (!allow(clientKey, 'leads')) return { error: 'rate_limited' };
    const at = now().toISOString(), id = randomUUID(), ref = id.slice(0, 8);
    const transcript = conv.transcript.slice(-20);
    const summary = conv.transcript.filter((m) => m.from === 'user' && !m.meta).slice(-3).map((m) => m.text).join(' · ').slice(0, 300);
    const lead = { id: randomUUID(), createdAt: at, status: 'new', type: 'support', name: conv.contact.name || '', phone: conv.contact.phone || '', email: '',
      channel: conv.channel === 'whatsapp' ? 'whatsapp' : 'phone', marketing: false, source: conv.channel === 'whatsapp' ? '/whatsapp' : '/support', context: null,
      message: `[${REASON_LABELS[reason] || reason}] ${summary || '(ללא טקסט חופשי)'}`.slice(0, 2000), escalationRef: ref, transcript, consent: { given: true, text: CONSENT_TEXT, at } };
    const { stored, notified } = await recordLead(leadStore, lead, env);
    const record = { id, ref, createdAt: at, status: 'open', handledAt: null, channel: conv.channel, reason, name: lead.name, phone: lead.phone, leadId: stored ? lead.id : null,
      conversationId: conv.key, lastIntent: intent || null, summary, transcript };
    let indexed = true;
    try { await escalations.set(`esc:${id}`, record, TTL); await escalations.push('ids', id, MAX_INDEX); } catch { indexed = false; }
    if (!stored && !notified && !indexed) return { error: 'store_unavailable' };
    conv.escalationId = id; conv.handoff = conv.channel === 'whatsapp';
    console.log(JSON.stringify({ evt: 'support_escalation', channel: conv.channel, reason }));
    return { record };
  }

  // Sources for grounded answers: the bot's answers (as edited by the owner, placeholders filled) and the site FAQs.
  async function groundedAnswer(text, c) {
    if (!(await gw.enabled('support_answer'))) return null;
    const ctx = contactContext(c, contact), fillCtx = (t) => String(t || '').replace(/\{(hours|phone|whatsapp|email)\}/g, (_, k) => ctx[k] || '').replace(/[\u2066\u2069]/g, '');
    const sources = Object.entries(INTENTS).filter(([id]) => !['greeting', 'thanks', 'menu'].includes(id)).map(([id, i]) => ({ id, title: i.title, text: fillCtx(c.answers[id]) }));
    const site = siteStore ? await siteStore.get('site').catch(() => null) : null;
    const faqList = Array.isArray(site?.faqs) && site.faqs.length ? site.faqs.map((f) => [f.q, f.a]) : builtinFaqs;
    faqList.slice(0, 30).forEach(([q, a], i) => sources.push({ id: `faq${i + 1}`, title: String(q).slice(0, 200), text: String(a).slice(0, 1500) }));
    return supportAnswer(text, sources, { store: llmCache, gw });
  }

  // One customer turn through the brain, with the optional LLM router and the escalation side effects.
  async function turn(conv, input, clientKey) {
    const c = await content(), at = now();
    conv.lastInboundAt = at.toISOString();
    const chipLabel = input.chip ? CHIP_LABELS[input.chip] || INTENTS[input.chip]?.title : '';
    // Details typed for the escalation live in conv.contact and the lead only; the transcript keeps a placeholder.
    const step = conv.collect?.step, typed = step === 'name' && input.text ? '[שם]' : step === 'phone' && input.text ? '[טלפון]' : input.text;
    if (typed || chipLabel) { log(conv, 'user', typed || chipLabel); if (!input.text || typed !== input.text) conv.transcript.at(-1).meta = true; }
    let routed = input;
    if (input.text && !input.chip && !conv.collect && !conv.offer && !classify(input.text).intent && !classify(input.text).frustrated) {
      // Spec 22 §4.1: an answer composed only from the owner's approved texts; otherwise route to one topic (spec 16 §8).
      const grounded = await groundedAnswer(input.text, c).catch(() => null);
      if (grounded?.answerable) {
        conv.missCount = 0;
        const reply = { messages: [{ text: grounded.answer, ai: true, sources: grounded.topics.map((id) => INTENTS[id]?.title || null).filter(Boolean) }],
          chips: [...grounded.topics.filter((id) => INTENTS[id] && !INTENTS[id].escalate), 'human'].slice(0, 4).map((id) => ({ id, label: CHIP_LABELS[id] || INTENTS[id]?.title || id })), input: 'text', intent: grounded.topics.find((id) => INTENTS[id]) || null };
        if (conv.transcript.at(-1)?.from === 'user' && reply.intent) conv.transcript.at(-1).intent = reply.intent;
        log(conv, 'bot', grounded.answer);
        return { reply, content: c, at };
      }
      if (grounded?.escalate) routed = { chip: 'human' };
      else if (grounded?.topics?.[0] && INTENTS[grounded.topics[0]]) routed = { chip: grounded.topics[0] };
      else if (!grounded) {
        const topics = Object.entries(INTENTS).filter(([id]) => !['greeting', 'thanks', 'menu'].includes(id)).map(([id, i]) => ({ id, title: i.title }));
        const pick = await partnerClassify(llmCache, input.text, topics).catch(() => null);
        if (pick) routed = { chip: pick.topic };
      }
    }
    const reply = respond(conv, routed, { content: c, contact, now: at });
    if (reply.intent && conv.transcript.length && conv.transcript.at(-1).from === 'user') conv.transcript.at(-1).intent = reply.intent;
    if (reply.escalate) {
      const result = await createEscalation(conv, reply.escalate.reason, conv.transcript.findLast((m) => m.intent)?.intent, clientKey);
      const ctx = contactContext(c, contact);
      if (result.record) { reply.messages.push(...confirmation(conv, result.record.ref, c, at)); reply.chips = conv.channel === 'whatsapp' ? [] : [{ id: 'menu', label: CHIP_LABELS.menu }]; }
      else if (result.error === 'rate_limited') reply.messages.push({ text: `נשלחו כמה פניות בזמן קצר, ולכן לא שמרנו את זו. נסו שוב בעוד כמה דקות, או פנו אלינו ישירות: טלפון ${ctx.phone}, וואטסאפ ${ctx.whatsapp}.` });
      else reply.messages.push({ text: `לא הצלחנו לשמור את הפנייה כרגע. אפשר לפנות אלינו ישירות: טלפון ${ctx.phone}, וואטסאפ ${ctx.whatsapp}.`, link: { href: '#/contact', label: 'טופס צור קשר' } });
    }
    log(conv, 'bot', reply.messages.map((m) => m.text).join('\n'));
    return { reply, content: c, at };
  }

  async function webMessage(req, send, body) {
    if (!allow(clientOf(req), 'support')) return send(429, { error: 'rate_limited', message: 'יותר מדי הודעות בזמן קצר. נסו שוב בעוד דקה.' });
    const input = await body(req, 8_000);
    const text = typeof input?.text === 'string' ? input.text.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim().slice(0, 600) : '';
    const chip = typeof input?.chip === 'string' && /^[a-z_]{2,20}$/.test(input.chip) && (INTENTS[input.chip] || CHIP_LABELS[input.chip]) ? input.chip : '';
    if (!text && !chip) return send(400, { error: 'text_required', message: 'כתבו שאלה או בחרו נושא.' });
    const sessionId = typeof input.sessionId === 'string' && UUID.test(input.sessionId) ? input.sessionId : randomUUID();
    const key = `web:${sessionId}`;
    const conv = (await loadConv(key)) || Object.assign(newConversation(sessionId, 'web', now()), { key });
    const fresh = !conv.transcript.length;
    const { reply, content: c, at } = await turn(conv, { text, chip }, `support:${clientOf(req)}`);
    // Opening the widget alone (the greeting chip) stores nothing.
    if (!(fresh && chip === 'greeting' && !text)) await saveConv(conv);
    const status = hoursStatus(c.hours, at);
    return send(200, { sessionId, messages: reply.messages, chips: reply.chips || [], input: reply.input || 'text', intent: reply.intent || null,
      escalation: conv.escalationRef ? { ref: conv.escalationRef, status: 'open' } : null, hours: { open: status.open, text: status.text, next: status.next } });
  }

  // ---- Owner API (LEADS_ADMIN_TOKEN, same constant-time compare as /api/leads) ----
  function admin(req, send) {
    if (!env.LEADS_ADMIN_TOKEN) { send(404, { error: 'not_found' }); return false; }
    if (!allow(clientOf(req), 'leadsAdmin')) { send(429, { error: 'rate_limited' }); return false; }
    if (!tokenMatches(req.headers.authorization, env.LEADS_ADMIN_TOKEN)) { send(401, { error: 'unauthorized' }); return false; }
    return true;
  }
  async function listEscalations(url, send) {
    const limit = Math.min(500, Math.max(1, Number.parseInt(url.searchParams.get('limit') || '200', 10) || 200));
    const statusFilter = ['open', 'handled'].includes(url.searchParams.get('status')) ? url.searchParams.get('status') : '';
    const ids = [...new Set(await escalations.list('ids', MAX_INDEX).catch(() => []))];
    const cutoff = now().getTime() - TTL * 1000, out = [];
    for (let i = 0; i < ids.length && out.length < limit; i += 25) {
      const batch = await Promise.all(ids.slice(i, i + 25).map((id) => escalations.get(`esc:${id}`).catch(() => null)));
      for (const record of batch) {
        if (!record || Date.parse(record.createdAt) < cutoff || (statusFilter && record.status !== statusFilter)) continue;
        if (out.length < limit) out.push(record);
      }
    }
    const withLive = await Promise.all(out.map(async (record) => {
      const conv = record.conversationId ? await loadConv(record.conversationId) : null;
      return { ...record, reasonLabel: REASON_LABELS[record.reason] || record.reason, handoff: Boolean(conv?.handoff), transcript: conv?.transcript?.length ? conv.transcript : record.transcript || [] };
    }));
    withLive.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    return send(200, { escalations: withLive, count: withLive.length, open: withLive.filter((r) => r.status === 'open').length, storage: escalations.kind, retentionDays: RETENTION_DAYS });
  }
  async function updateEscalation(id, req, send, body) {
    const input = await body(req, 2_000);
    if (!['open', 'handled'].includes(input?.status)) return send(400, { error: 'status_invalid' });
    let record = UUID.test(id) ? await escalations.get(`esc:${id}`).catch(() => null) : null;
    if (!record && /^[0-9a-f]{8}$/i.test(id)) {
      const ids = await escalations.list('ids', MAX_INDEX).catch(() => []), full = ids.find((x) => x.startsWith(id.toLowerCase()));
      record = full ? await escalations.get(`esc:${full}`).catch(() => null) : null;
    }
    if (!record) return send(404, { error: 'not_found' });
    record.status = input.status; record.handledAt = input.status === 'handled' ? now().toISOString() : null;
    await escalations.set(`esc:${record.id}`, record, TTL);
    const conv = record.conversationId ? await loadConv(record.conversationId) : null;
    if (conv) { conv.handoff = input.status === 'open' && conv.channel === 'whatsapp'; if (input.status === 'handled') { conv.escalationRef = null; conv.escalationId = null; } await saveConv(conv); }
    return send(200, { ok: true, escalation: { ...record, reasonLabel: REASON_LABELS[record.reason] || record.reason } });
  }
  async function contentRoute(req, send, body) {
    if (req.method === 'GET') {
      const c = await content();
      return send(200, { intents: Object.entries(INTENTS).map(([id, i]) => ({ id, title: i.title, answer: c.answers[id], default: c.answers[id] === i.answer })), hours: c.hours, key: 'support-content/faq' });
    }
    const current = (await contentStore.get('faq').catch(() => null)) || {};
    const { value, error } = validateContentUpdate(await body(req, 32_000), current);
    if (error) return send(400, { error });
    await contentStore.set('faq', value);
    contentCache = { at: 0, value: null };
    return send(200, { ok: true });
  }

  // ---- WhatsApp Cloud API ----
  async function whatsappWebhook(req, res, url, send) {
    if (!whatsappEnabled(env)) return send(404, { error: 'not_found' });
    if (req.method === 'GET') {
      const ok = url.searchParams.get('hub.mode') === 'subscribe' && sameSecret(url.searchParams.get('hub.verify_token'), env.WHATSAPP_VERIFY_TOKEN);
      if (!ok) return send(403, { error: 'forbidden' });
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(String(url.searchParams.get('hub.challenge') || '').slice(0, 200));
    }
    if (req.method !== 'POST') return send(405, { error: 'method_not_allowed' });
    const raw = await readRaw(req);
    if (!validSignature(raw, req.headers['x-hub-signature-256'], env.WHATSAPP_APP_SECRET)) return send(401, { error: 'invalid_signature' });
    let payload; try { payload = JSON.parse(raw.toString('utf8')); } catch { return send(400, { error: 'invalid_json' }); }
    let handled = 0;
    for (const message of parseInbound(payload)) {
      try { if (await whatsappMessage(message)) handled++; } catch (error) { console.log(JSON.stringify({ evt: 'whatsapp_inbound', ok: false, error: error.message })); }
    }
    // Always 200 after a valid signature, or Meta retries the same delivery.
    return send(200, { ok: true, handled });
  }
  async function whatsappMessage(message) {
    if (await waStore.get(`seen:${message.id}`).catch(() => null)) return false;
    await waStore.set(`seen:${message.id}`, 1, 86400).catch(() => {});
    const key = `wa:${createHash('sha256').update(message.from).digest('hex').slice(0, 24)}`, at = now();
    const conv = (await loadConv(key)) || Object.assign(newConversation(key.slice(3), 'whatsapp', at), { key });
    const previousInbound = conv.lastInboundAt ? Date.parse(conv.lastInboundAt) : 0;
    conv.contact.waId = message.from; conv.contact.phone ||= phoneFromWaId(message.from);
    if (message.name && !conv.contact.name) conv.contact.name = message.name.replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 80);
    // Handed off: a person answers now. Messages are kept for the owner; the bot stays silent (72 h idle resumes it).
    if (conv.handoff && at.getTime() - previousInbound < HANDOFF_IDLE_MS) {
      conv.lastInboundAt = at.toISOString(); log(conv, 'user', message.text || '[הודעה שאינה טקסט]'); await saveConv(conv); return true;
    }
    if (conv.handoff) { conv.handoff = false; conv.escalationRef = null; conv.escalationId = null; }
    let reply;
    if (message.kind === 'other') { conv.lastInboundAt = at.toISOString(); log(conv, 'user', '[הודעה שאינה טקסט]'); reply = { messages: [{ text: 'כרגע אני מבין רק הודעות טקסט. אפשר לכתוב את השאלה או לבחור נושא.' }], chips: INTENTS.menu.chips.slice(0, 10).map((id) => ({ id, label: CHIP_LABELS[id] })) }; log(conv, 'bot', reply.messages[0].text); }
    else {
      const chip = message.kind === 'chip' && (INTENTS[message.chip] || CHIP_LABELS[message.chip]) ? message.chip : '';
      const text = chip ? '' : (message.text || '').trim();
      // A first message the bot cannot place ("היי, שאלה") gets the welcome menu instead of "did not understand".
      const first = !conv.transcript.length && !chip && !classify(text).intent && !classify(text).frustrated;
      ({ reply } = await turn(conv, chip ? { chip } : first ? { text, chip: 'greeting' } : { text }, `wa:${key}`));
    }
    // Free-form replies only inside the 24 h customer-service window (always true when replying to this inbound).
    if (at.getTime() - Date.parse(conv.lastInboundAt || 0) < WINDOW_MS) await sendPayloads(toWhatsApp(reply, message.from, { siteUrl: env.PUBLIC_SITE_URL }), env);
    await saveConv(conv);
    return true;
  }

  // Returns true when the request was a support/WhatsApp route (and has been answered).
  async function handle(req, res, url, { send, body }) {
    const p = url.pathname;
    if (p === '/api/support/message') { if (req.method !== 'POST') send(405, { error: 'method_not_allowed' }); else await webMessage(req, send, body); return true; }
    if (p === '/api/support/escalations' || p.startsWith('/api/support/escalations/')) {
      const id = p.slice('/api/support/escalations/'.length);
      if (p === '/api/support/escalations' ? req.method !== 'GET' : req.method !== 'POST') { send(405, { error: 'method_not_allowed' }); return true; }
      if (!admin(req, send)) return true;
      if (p === '/api/support/escalations') await listEscalations(url, send); else await updateEscalation(id, req, send, body);
      return true;
    }
    if (p === '/api/support/content') {
      if (!['GET', 'PUT'].includes(req.method)) { send(405, { error: 'method_not_allowed' }); return true; }
      if (admin(req, send)) await contentRoute(req, send, body);
      return true;
    }
    if (p === '/api/whatsapp/webhook') { await whatsappWebhook(req, res, url, send); return true; }
    return false;
  }
  return { handle, content, turn };
}
