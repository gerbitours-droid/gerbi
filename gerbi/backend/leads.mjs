// Leads from the contact and tailor-made forms: validated server-side, stored newest-first in the KV store,
// optionally forwarded to an owner webhook, and readable only with LEADS_ADMIN_TOKEN.
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { validateLead, CONSENT_TEXT } from '../dist/leads-validate.mjs';
import { allow, clientOf } from './volero-guard.mjs';

const LIST_KEY = 'all', MAX_STORED = 5000;
const digest = (value) => createHash('sha256').update(String(value)).digest();

// Constant-time: compare fixed-length hashes, so neither content nor length leaks through timing.
export function tokenMatches(header, expected) {
  if (!expected) return false;
  const match = /^Bearer\s+(.+)$/i.exec(String(header || ''));
  return Boolean(match) && timingSafeEqual(digest(match[1].trim()), digest(expected));
}

async function notify(url, lead) {
  if (!/^https?:\/\//i.test(url || '')) return;
  try {
    await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event: 'lead.created', lead }), signal: AbortSignal.timeout(3000) });
  } catch (error) { console.log(JSON.stringify({ evt: 'lead_webhook', ok: false, error: error.name })); }
}

// Returns true when the request was a leads route (and has been answered).
export async function handleLeads(req, url, { send, body, store, env = process.env }) {
  if (url.pathname !== '/api/leads') return false;
  if (req.method === 'POST') {
    if (!allow(clientOf(req), 'leads')) { send(429, { error: 'rate_limited', message: 'נשלחו כמה פניות בזמן קצר. נסו שוב בעוד כמה דקות, או פנו אלינו ישירות.' }); return true; }
    const input = await body(req, 16_000);
    // Honeypot: a hidden field people never see. Bots that fill it get a normal-looking success and nothing is stored.
    if (typeof input?.website === 'string' && input.website.trim()) { send(201, { ok: true, id: randomUUID().slice(0, 8) }); return true; }
    const { lead, errors } = validateLead(input);
    if (!lead) { send(400, { error: 'lead_invalid', fields: errors, message: 'חלק מהפרטים חסרים או לא תקינים.' }); return true; }
    const record = { id: randomUUID(), createdAt: new Date().toISOString(), status: 'new', ...lead, consent: { given: true, text: CONSENT_TEXT, at: new Date().toISOString() } };
    const webhook = env.LEADS_WEBHOOK_URL ? notify(env.LEADS_WEBHOOK_URL, record) : null;
    try { await store.push(LIST_KEY, record, MAX_STORED); }
    catch (error) {
      console.log(JSON.stringify({ evt: 'lead_store', ok: false, error: error.message }));
      // Without storage the webhook is the only copy; succeed only if it was configured.
      if (!webhook) { send(503, { error: 'lead_store_unavailable', message: 'לא הצלחנו לשמור את הפנייה כרגע. נסו שוב בעוד רגע או פנו אלינו בטלפון.' }); return true; }
    }
    if (webhook) await webhook; // bounded by its 3 s timeout and never throws
    console.log(JSON.stringify({ evt: 'lead', type: record.type, source: record.source }));
    send(201, { ok: true, id: record.id.slice(0, 8) });
    return true;
  }
  if (req.method === 'GET') {
    // No token configured = the admin API does not exist.
    if (!env.LEADS_ADMIN_TOKEN) { send(404, { error: 'not_found' }); return true; }
    if (!allow(clientOf(req), 'leadsAdmin')) { send(429, { error: 'rate_limited' }); return true; }
    if (!tokenMatches(req.headers.authorization, env.LEADS_ADMIN_TOKEN)) { send(401, { error: 'unauthorized' }); return true; }
    const limit = Math.min(500, Math.max(1, Number.parseInt(url.searchParams.get('limit') || '200', 10) || 200));
    const leads = await store.list(LIST_KEY, limit);
    leads.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    send(200, { leads, count: leads.length, storage: store.kind });
    return true;
  }
  send(405, { error: 'method_not_allowed' });
  return true;
}
