// WhatsApp Cloud API channel adapter (spec 16 §7): signature check, inbound parsing and outbound message building.
// Transport only; the conversation logic is the same support brain the site uses.
import { createHmac, createHash, timingSafeEqual } from 'node:crypto';

export const WA_ENV = ['WHATSAPP_VERIFY_TOKEN', 'WHATSAPP_APP_SECRET', 'WHATSAPP_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID'];
export const whatsappEnabled = (env = process.env) => WA_ENV.every((key) => typeof env[key] === 'string' && env[key].trim());
export const WINDOW_MS = 24 * 3600 * 1000;

const sha = (value) => createHash('sha256').update(String(value)).digest();
export const sameSecret = (a, b) => Boolean(a) && Boolean(b) && timingSafeEqual(sha(a), sha(b));

// X-Hub-Signature-256: "sha256=" + hex HMAC-SHA256 of the raw body with the app secret.
export function validSignature(raw, header, secret) {
  const match = /^sha256=([a-f0-9]{64})$/i.exec(String(header || ''));
  if (!match || !secret) return false;
  const expected = createHmac('sha256', secret).update(raw).digest();
  return timingSafeEqual(Buffer.from(match[1].toLowerCase(), 'hex'), expected);
}
export const sign = (raw, secret) => 'sha256=' + createHmac('sha256', secret).update(raw).digest('hex');

// Meta's webhook payload -> flat list of inbound messages. Status updates (sent/delivered/read) are ignored.
export function parseInbound(payload) {
  const out = [];
  for (const entry of Array.isArray(payload?.entry) ? payload.entry : []) {
    for (const change of Array.isArray(entry?.changes) ? entry.changes : []) {
      const value = change?.value;
      if (change?.field !== 'messages' || !Array.isArray(value?.messages)) continue;
      const names = Object.fromEntries((Array.isArray(value.contacts) ? value.contacts : []).map((c) => [String(c?.wa_id || ''), String(c?.profile?.name || '').slice(0, 80)]));
      for (const m of value.messages) {
        const from = String(m?.from || '');
        if (!/^\d{6,15}$/.test(from) || typeof m?.id !== 'string') continue;
        const base = { id: m.id.slice(0, 128), from, name: names[from] || '', timestamp: Number(m.timestamp) || 0 };
        if (m.type === 'text' && typeof m.text?.body === 'string') out.push({ ...base, kind: 'text', text: m.text.body.slice(0, 600) });
        else if (m.type === 'interactive') { const r = m.interactive?.button_reply || m.interactive?.list_reply; out.push(r?.id ? { ...base, kind: 'chip', chip: String(r.id).slice(0, 40), text: String(r.title || '').slice(0, 40) } : { ...base, kind: 'other' }); }
        else if (m.type === 'button' && (m.button?.payload || m.button?.text)) out.push({ ...base, kind: 'chip', chip: String(m.button.payload || '').slice(0, 40), text: String(m.button.text || '').slice(0, 40) });
        else out.push({ ...base, kind: 'other' });
      }
    }
  }
  return out;
}

// Israeli wa_id (9725XXXXXXXX) -> 05X...; other countries keep the international form with '+'.
export const phoneFromWaId = (waId) => (/^972\d{8,9}$/.test(waId) ? '0' + waId.slice(3) : '+' + waId);

const clip = (text, max) => (text.length > max ? text.slice(0, max - 1) + '…' : text);
// A brain reply -> Cloud API message payloads. ≤3 chips: reply buttons (title ≤20); 4–10: a list (row title ≤24).
export function toWhatsApp(reply, to, { siteUrl = '' } = {}) {
  const site = String(siteUrl || '').replace(/\/$/, '');
  const lines = reply.messages.map((m) => {
    let text = m.text;
    if (m.link) { const href = m.link.href.startsWith('#') ? (site ? `${site}/${m.link.href}` : '') : m.link.href; if (href) text += `\n${m.link.label}: ${href}`; }
    return text;
  }).filter(Boolean);
  const body = lines.join('\n\n'), chips = (reply.chips || []).slice(0, 10), base = { messaging_product: 'whatsapp', recipient_type: 'individual', to };
  if (!body && !chips.length) return [];
  const payloads = [];
  let interactiveBody = body;
  if (!chips.length || body.length > 1024) { if (body) payloads.push({ ...base, type: 'text', text: { body: clip(body, 4096), preview_url: false } }); interactiveBody = 'אפשר לבחור:'; }
  if (chips.length && chips.length <= 3) payloads.push({ ...base, type: 'interactive', interactive: { type: 'button', body: { text: interactiveBody }, action: { buttons: chips.map((c) => ({ type: 'reply', reply: { id: c.id, title: clip(c.label, 20) } })) } } });
  else if (chips.length) payloads.push({ ...base, type: 'interactive', interactive: { type: 'list', body: { text: interactiveBody }, action: { button: 'בחירת נושא', sections: [{ title: 'נושאים', rows: chips.map((c) => ({ id: c.id, title: clip(c.label, 24) })) }] } } });
  return payloads;
}

export async function sendPayloads(payloads, env = process.env) {
  const url = `${(env.WHATSAPP_GRAPH_URL || 'https://graph.facebook.com/v21.0').replace(/\/$/, '')}/${encodeURIComponent(env.WHATSAPP_PHONE_NUMBER_ID)}/messages`;
  let sent = 0;
  for (const payload of payloads) {
    try {
      const response = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(5000) });
      if (!response.ok) { console.log(JSON.stringify({ evt: 'whatsapp_send', ok: false, status: response.status })); break; }
      sent++;
    } catch (error) { console.log(JSON.stringify({ evt: 'whatsapp_send', ok: false, error: error.name })); break; }
  }
  return sent;
}
