// Leads from the contact and tailor-made forms: validated server-side, stored newest-first in the KV store,
// optionally forwarded to an owner webhook, and readable only with LEADS_ADMIN_TOKEN.
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { validateLead, CONSENT_TEXT } from '../dist/leads-validate.mjs';
import { allow, allowShared, clientOf } from './volero-guard.mjs';

const LIST_KEY = 'all', MAX_STORED = 5000;
const digest = (value) => createHash('sha256').update(String(value)).digest();

// Retention (privacy): leads older than LEADS_RETENTION_DAYS (default 730, minimum 30) are deleted, with their admin
// status/notes. Runs lazily when the owner lists leads, at most once a day (marker in the store, so once across instances).
export const DEFAULT_RETENTION_DAYS = 730;
export const retentionDays = (env = process.env) => { const n = Number.parseInt(env.LEADS_RETENTION_DAYS, 10); return Number.isInteger(n) ? Math.max(30, n) : DEFAULT_RETENTION_DAYS; };
let lastRetention = 0;
export async function applyRetention(store, { env = process.env, now = Date.now(), force = false } = {}) {
  if (!store?.trimOlder || (!force && now - lastRetention < 3600_000)) return { ran: false };
  lastRetention = now;
  try {
    if (!force && await store.get('retention:ran')) return { ran: false };
    await store.set('retention:ran', { at: new Date(now).toISOString() }, 86400);
    const days = retentionDays(env), removed = await store.trimOlder(LIST_KEY, new Date(now - days * 86400_000).toISOString());
    if (removed) {
      const meta = await store.get('meta'), ids = new Set((await store.list(LIST_KEY, MAX_STORED)).map((lead) => lead.id));
      if (meta) { for (const id of Object.keys(meta)) if (!ids.has(id)) delete meta[id]; await store.set('meta', meta); }
    }
    console.log(JSON.stringify({ evt: 'lead_retention', ok: true, days, removed }));
    return { ran: true, removed, days };
  } catch (error) { console.log(JSON.stringify({ evt: 'lead_retention', ok: false, error: error.message })); return { ran: false }; }
}

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

// Stores an already-validated lead built elsewhere (customer-service bot, spec 16) and notifies the owner webhook.
// Returns { stored, notified }; never throws.
export async function recordLead(store, record, env = process.env) {
  const webhook = env.LEADS_WEBHOOK_URL ? notify(env.LEADS_WEBHOOK_URL, record) : null;
  let stored = true;
  try { await store.push(LIST_KEY, record, MAX_STORED); } catch (error) { stored = false; console.log(JSON.stringify({ evt: 'lead_store', ok: false, error: error.message })); }
  if (webhook) await webhook;
  console.log(JSON.stringify({ evt: 'lead', type: record.type, source: record.source }));
  return { stored, notified: Boolean(webhook) };
}

// Returns true when the request was a leads route (and has been answered).
// hooks (optional, customer accounts): userOf(req) → user id of a signed-in customer; created(record) after storing.
export async function handleLeads(req, url, { send, body, store, env = process.env, hooks }) {
  if (url.pathname !== '/api/leads') return false;
  if (req.method === 'POST') {
    if (!(await allowShared(clientOf(req), 'leads'))) { send(429, { error: 'rate_limited', message: 'נשלחו כמה פניות בזמן קצר. נסו שוב בעוד כמה דקות, או פנו אלינו ישירות.' }); return true; }
    const input = await body(req, 16_000);
    // Honeypot: a hidden field people never see. Bots that fill it get a normal-looking success and nothing is stored.
    if (typeof input?.website === 'string' && input.website.trim()) { send(201, { ok: true, id: randomUUID().slice(0, 8) }); return true; }
    const { lead, errors } = validateLead(input);
    if (!lead) { send(400, { error: 'lead_invalid', fields: errors, message: 'חלק מהפרטים חסרים או לא תקינים.' }); return true; }
    const userId = await hooks?.userOf?.(req);
    const record = { id: randomUUID(), createdAt: new Date().toISOString(), status: 'new', ...lead, consent: { given: true, text: CONSENT_TEXT, at: new Date().toISOString() }, ...(userId ? { userId } : {}) };
    const webhook = env.LEADS_WEBHOOK_URL ? notify(env.LEADS_WEBHOOK_URL, record) : null;
    try { await store.push(LIST_KEY, record, MAX_STORED); }
    catch (error) {
      console.log(JSON.stringify({ evt: 'lead_store', ok: false, error: error.message }));
      // Without storage the webhook is the only copy; succeed only if it was configured.
      if (!webhook) { send(503, { error: 'lead_store_unavailable', message: 'לא הצלחנו לשמור את הפנייה כרגע. נסו שוב בעוד רגע או פנו אלינו בטלפון.' }); return true; }
    }
    if (webhook) await webhook; // bounded by its 3 s timeout and never throws
    try { await hooks?.created?.(record); } catch (error) { console.log(JSON.stringify({ evt: 'lead_account_link', ok: false, error: error.message })); }
    console.log(JSON.stringify({ evt: 'lead', type: record.type, source: record.source }));
    send(201, { ok: true, id: record.id.slice(0, 8) });
    return true;
  }
  if (req.method === 'GET') {
    // No token configured = the admin API does not exist.
    if (!env.LEADS_ADMIN_TOKEN) { send(404, { error: 'not_found' }); return true; }
    if (!allow(clientOf(req), 'leadsAdmin')) { send(429, { error: 'rate_limited' }); return true; }
    if (!tokenMatches(req.headers.authorization, env.LEADS_ADMIN_TOKEN)) { send(401, { error: 'unauthorized' }); return true; }
    await applyRetention(store, { env });
    const limit = Math.min(500, Math.max(1, Number.parseInt(url.searchParams.get('limit') || '200', 10) || 200));
    const leads = await store.list(LIST_KEY, limit);
    leads.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    send(200, { leads, count: leads.length, storage: store.kind });
    return true;
  }
  send(405, { error: 'method_not_allowed' });
  return true;
}
