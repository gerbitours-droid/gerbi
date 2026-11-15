// HTTP routes of the AI features (spec 22 §6). Public: /api/ai/features | tailor-fill | explain-flights.
// Owner (admin session cookie, same-origin writes): /api/admin/ai/lead/:id | blog-draft | insights | usage | flags.
// Returns true when the request was handled.
import { allow, clientOf, LIMITS as RATE } from './volero-guard.mjs';
import { sessionValid } from './admin.mjs';
import { gateway, featureStatus, tailorFill, flightExplain, leadBrief, blogDraft, blogSkeleton, digest } from './ai-features.mjs';

RATE.aiFill ??= [10, 60_000];
RATE.aiExplain ??= [10, 60_000];
RATE.aiAdmin ??= [30, 60_000];
RATE.admin ??= [120, 60_000];

const sameOrigin = (req) => { const origin = req.headers.origin; if (!origin) return true; try { return new URL(origin).host === req.headers.host; } catch { return false; } };
const short = (v, max) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, max) : '');
const LABELS = ['A', 'B', 'C'];

async function leadsWithMeta(leadStore) {
  const [leads, meta] = await Promise.all([leadStore.list('all', 5000), leadStore.get('meta')]);
  return leads.map((lead) => { const m = meta?.[lead.id]; return { ...lead, status: m?.status || lead.status || 'new', adminNotes: m?.notes || [] }; });
}

export async function handleAi(req, res, url, { send, body, leadStore, sessions, llmCache, searchStats, env = process.env, gw = gateway, now = () => new Date() }) {
  const path = url.pathname;
  if (path === '/api/ai/features' && req.method === 'GET') { send(200, { features: await featureStatus(gw) }); return true; }

  if (path === '/api/ai/tailor-fill') {
    if (req.method !== 'POST') { send(405, { error: 'method_not_allowed' }); return true; }
    if (!allow(clientOf(req), 'aiFill')) { send(429, { error: 'rate_limited', message: 'יותר מדי בקשות בזמן קצר. נסו שוב בעוד דקה.' }); return true; }
    const text = short((await body(req, 6_000))?.text, 1500);
    if (text.length < 5) { send(400, { error: 'text_required', message: 'ספרו במשפט על הטיול שאתם מחפשים.' }); return true; }
    send(200, await tailorFill(text, { store: llmCache, gw, today: now().toISOString().slice(0, 10) })); return true;
  }

  if (path === '/api/ai/explain-flights') {
    if (req.method !== 'POST') { send(405, { error: 'method_not_allowed' }); return true; }
    if (!allow(clientOf(req), 'aiExplain')) { send(429, { error: 'rate_limited', message: 'יותר מדי בקשות בזמן קצר. נסו שוב בעוד דקה.' }); return true; }
    const input = await body(req, 8_000);
    // Only display facts of up to three offers; free-form fields are short strings, never tokens or ids.
    const offers = (Array.isArray(input?.offers) ? input.offers : []).slice(0, 3).map((o, i) => ({ label: LABELS[i], price: short(o?.price, 40), duration: short(o?.duration, 40),
      stops: Number.isInteger(o?.stops) && o.stops >= 0 && o.stops <= 6 ? o.stops : null, longestWait: short(o?.longestWait, 40),
      departs: (Array.isArray(o?.departs) ? o.departs : []).filter((t) => /^\d{2}:\d{2}$/.test(t)).slice(0, 5), arrives: (Array.isArray(o?.arrives) ? o.arrives : []).filter((t) => /^\d{2}:\d{2}(\s?\+\d)?$/.test(t)).slice(0, 5),
      bag: short(o?.bag, 60), carrier: short(o?.carrier, 60), tags: (Array.isArray(o?.tags) ? o.tags : []).map((t) => short(t, 30)).filter(Boolean).slice(0, 3) })).filter((o) => o.price);
    const b = input?.brief || {}, int = (v, max) => (Number.isInteger(v) && v >= 0 && v <= max ? v : 0);
    const brief = { adults: int(b.adults, 9) || 1, children: int(b.children, 8), route: short(b.route, 120), prefs: (Array.isArray(b.prefs) ? b.prefs : []).map((p) => short(p, 40)).filter(Boolean).slice(0, 6) };
    if (offers.length < 2) { send(400, { error: 'offers_required' }); return true; }
    const result = await flightExplain(offers, brief, { store: llmCache, gw });
    send(200, result ? { ok: true, ...result } : { ok: false, message: 'לא הצלחנו להשוות כרגע. ההסבר הקצר בכל כרטיס עדיין תקף.' }); return true;
  }

  if (!path.startsWith('/api/admin/ai/')) return false;
  if (!env.LEADS_ADMIN_TOKEN) { send(404, { error: 'not_found' }); return true; }
  const write = !['GET', 'HEAD'].includes(req.method);
  if (write && !sameOrigin(req)) { send(403, { error: 'bad_origin' }); return true; }
  if (write && !/^application\/json\b/i.test(req.headers['content-type'] || '')) { send(415, { error: 'json_required' }); return true; }
  if (!allow(clientOf(req), 'admin')) { send(429, { error: 'rate_limited' }); return true; }
  if (!(await sessionValid(req, sessions))) { send(401, { error: 'unauthorized' }); return true; }
  const modelCall = () => allow(clientOf(req), 'aiAdmin') || (send(429, { error: 'rate_limited', message: 'יותר מדי בקשות AI בדקה. נסו שוב עוד מעט.' }), false);

  let match = /^\/api\/admin\/ai\/lead\/([A-Za-z0-9-]{8,64})$/.exec(path);
  if (match && req.method === 'POST') {
    const input = await body(req, 1_000);
    const lead = (await leadsWithMeta(leadStore)).find((l) => l.id === match[1]);
    if (!lead) { send(404, { error: 'not_found' }); return true; }
    const useAi = input?.ai !== false;
    if (useAi && !modelCall()) return true;
    send(200, await leadBrief(lead, { store: llmCache, gw, now: now(), useAi })); return true;
  }
  if (path === '/api/admin/ai/blog-draft' && req.method === 'POST') {
    const input = await body(req, 4_000), topic = short(input?.topic, 160);
    if (topic.length < 3) { send(400, { error: 'invalid', fields: { topic: 'כתבו נושא (לפחות 3 תווים)' } }); return true; }
    const keywords = (typeof input.keywords === 'string' ? input.keywords.split(',') : Array.isArray(input.keywords) ? input.keywords : []).map((k) => short(k, 40)).filter(Boolean).slice(0, 8);
    const request = { topic, keywords, audience: ['families', 'couples', 'general'].includes(input.audience) ? input.audience : 'general', length: ['short', 'medium', 'long'].includes(input.length) ? input.length : 'medium' };
    if (input.ai !== false && !modelCall()) return true;
    send(200, input.ai === false ? blogSkeleton(request) : await blogDraft(request, { store: llmCache, gw })); return true;
  }
  if (path === '/api/admin/ai/insights' && ['GET', 'POST'].includes(req.method)) {
    const days = [1, 7, 30].includes(Number(url.searchParams.get('days'))) ? Number(url.searchParams.get('days')) : 7;
    const useAi = req.method === 'POST';
    if (useAi) { await body(req, 500); if (!modelCall()) return true; }
    const [leads, searches] = await Promise.all([leadsWithMeta(leadStore), searchStats.summary(days)]);
    send(200, await digest(leads, searches, { days, now: now(), useAi, store: llmCache, gw })); return true;
  }
  if (path === '/api/admin/ai/usage' && req.method === 'GET') { send(200, { ...(await gw.status()), history: await gw.history(7) }); return true; }
  if (path === '/api/admin/ai/flags' && req.method === 'PUT') {
    const input = await body(req, 500);
    if (typeof input?.on !== 'boolean' || typeof input?.task !== 'string') { send(400, { error: 'invalid' }); return true; }
    try { send(200, { flags: await gw.setFlag(input.task, input.on) }); } catch { send(400, { error: 'unknown_task' }); }
    return true;
  }
  send(404, { error: 'not_found' }); return true;
}
