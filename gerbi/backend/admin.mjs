// Owner admin + CMS API (spec 18): session login, leads workflow (status, notes, CSV), blog posts and site content
// with versions, and the public read endpoints the site uses. Storage is the KV store only.
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { allow, allowShared, clientOf, counters, LIMITS as RATE } from './volero-guard.mjs';
import { normalizePost, normalizeSite, isLive, COVER_DATA_RE, LIMITS } from '../dist/content-model.mjs';
import { BUILTIN_SLUGS } from '../dist/blog-posts.mjs';
import { applyRetention } from './leads.mjs';

RATE.adminLogin ??= [5, 600_000];
RATE.admin ??= [120, 60_000];

export const COOKIE = 'gerbi_admin';
const SESSION_SECONDS = 12 * 3600, VERSIONS = 10, MAX_POSTS = 200, LEAD_STATUSES = ['new', 'progress', 'closed'];
const sha = (value) => createHash('sha256').update(String(value)).digest();
const hex = (value) => sha(value).toString('hex');
// Progressive lockout for owner login, shared across instances (KV counters, see volero-guard.mjs):
//   per IP: from the 5th failure in 24 h, locked for 1, 2, 4 … up to 60 minutes (doubling per further failure);
//   global: 100 failures from all addresses within 15 minutes lock the login for 15 minutes (distributed guessing).
export const LOCKOUT = { freeFailures: 4, baseSeconds: 60, maxSeconds: 3600, failWindow: 86400, globalFailures: 100, globalWindow: 900, globalSeconds: 900 };
const lockSeconds = (failures) => Math.min(LOCKOUT.maxSeconds, LOCKOUT.baseSeconds * 2 ** (failures - LOCKOUT.freeFailures - 1));
async function loginLocked(client) { return (await counters.peek('adminlock:global')) > 0 || (await counters.peek(`adminlock:${client}`)) > 0; }
async function loginFailed(client) {
  const failures = await counters.hit(`adminfail:${client}`, LOCKOUT.failWindow), all = await counters.hit('adminfail:global', LOCKOUT.globalWindow);
  if (failures > LOCKOUT.freeFailures) await counters.lock(`adminlock:${client}`, lockSeconds(failures));
  if (all >= LOCKOUT.globalFailures) { await counters.lock('adminlock:global', LOCKOUT.globalSeconds); console.log(JSON.stringify({ evt: 'admin_login', ok: false, error: 'global_lockout' })); }
}

// The owner password (LEADS_ADMIN_TOKEN) is the only secret in front of every lead. A short one is refused in
// production (NODE_ENV=production or on Vercel) unless ALLOW_WEAK_ADMIN_TOKEN=1; local development keeps any value.
export const MIN_ADMIN_TOKEN = 16;
export function enforceAdminToken(env = process.env, log = (entry) => console.error(JSON.stringify(entry))) {
  const token = env.LEADS_ADMIN_TOKEN;
  if (!token || token.length >= MIN_ADMIN_TOKEN || !(env.NODE_ENV === 'production' || env.VERCEL)) return 'ok';
  if (env.ALLOW_WEAK_ADMIN_TOKEN === '1') { log({ evt: 'admin_token', level: 'warn', error: 'weak_token', minLength: MIN_ADMIN_TOKEN, allowed: true }); return 'weak_allowed'; }
  delete env.LEADS_ADMIN_TOKEN; // every owner endpoint then answers 404, as if no admin were configured
  log({ evt: 'admin_token', level: 'error', error: 'weak_token_refused', minLength: MIN_ADMIN_TOKEN, hint: 'set a random LEADS_ADMIN_TOKEN of 32+ characters, or ALLOW_WEAK_ADMIN_TOKEN=1' });
  return 'refused';
}

const passwordMatches = (given, expected) => Boolean(expected) && typeof given === 'string' && timingSafeEqual(sha(given), sha(expected));

function cookieOf(req) {
  for (const part of String(req.headers.cookie || '').split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === COOKIE) return rest.join('=');
  }
  return '';
}
const secure = (req) => req.headers['x-forwarded-proto'] === 'https' || Boolean(process.env.VERCEL);
const cookie = (req, value, maxAge) => `${COOKIE}=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure(req) ? '; Secure' : ''}`;

export async function sessionValid(req, store) {
  const id = cookieOf(req);
  if (!/^[A-Za-z0-9_-]{43}$/.test(id)) return false;
  try { return Boolean(await store.get(`session:${hex(id)}`)); } catch { return false; }
}

// A valid owner session lets the admin page call token-protected endpoints of other modules (/api/leads,
// /api/fx/override, /api/support/escalations) without the raw token ever reaching the browser.
export async function bridgeAdminSession(req, url, { store, env = process.env }) {
  if (!env.LEADS_ADMIN_TOKEN || req.headers.authorization || !url.pathname.startsWith('/api/') || url.pathname.startsWith('/api/admin/') || !cookieOf(req)) return;
  if (!['GET', 'HEAD'].includes(req.method) && !sameOrigin(req)) return;
  if (await sessionValid(req, store)) req.headers.authorization = `Bearer ${env.LEADS_ADMIN_TOKEN}`;
}

function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try { return new URL(origin).host === req.headers.host; } catch { return false; }
}

// Keeps the last N copies of an item; newest first.
async function remember(store, key, previous) {
  if (!previous) return;
  const list = (await store.get(`${key}:versions`)) || [];
  await store.set(`${key}:versions`, [{ savedAt: new Date().toISOString(), value: previous }, ...list].slice(0, VERSIONS));
}

const csvCell = (value) => {
  let s = Array.isArray(value) ? value.join(' | ') : String(value ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const STATUS_LABEL = { new: 'חדש', progress: 'בטיפול', closed: 'נסגר' };
function leadsCsv(leads) {
  const head = ['תאריך', 'סוג', 'סטטוס', 'שם', 'טלפון', 'מייל', 'ערוץ', 'יעד', 'מתאריך', 'עד תאריך', 'מבוגרים', 'ילדים', 'תקציב', 'הודעה / הערות לקוח', 'הערות פנימיות', 'מקור', 'מזהה'];
  const rows = leads.map((l) => [l.createdAt, ({ tailor: 'בהתאמה אישית', support: 'שירות לקוחות' })[l.type] || 'צור קשר', STATUS_LABEL[l.status] || l.status, l.name, l.phone, l.email, l.channel, l.destinations, l.start, l.end, l.adults, l.children, l.budget,
    l.message || l.notes, (l.adminNotes || []).map((n) => `${n.at.slice(0, 10)}: ${n.text}`), l.source, l.id]);
  return '﻿' + [head, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

function filterLeads(leads, params) {
  const status = params.get('status'), type = params.get('type'), q = (params.get('q') || '').trim().toLowerCase().slice(0, 100);
  return leads.filter((l) => (!LEAD_STATUSES.includes(status) || l.status === status) && (!['contact', 'tailor', 'support'].includes(type) || l.type === type)
    && (!q || [l.name, l.phone, l.email, l.destinations, l.message, l.notes, ...(l.adminNotes || []).map((n) => n.text)].some((v) => String(v || '').toLowerCase().includes(q))));
}

async function allLeads(leadStore, env) {
  await applyRetention(leadStore, { env });
  const [leads, meta] = await Promise.all([leadStore.list('all', 5000), leadStore.get('meta')]);
  return leads.map((lead) => { const m = meta?.[lead.id]; return { ...lead, status: m?.status || (LEAD_STATUSES.includes(lead.status) ? lead.status : 'new'), adminNotes: m?.notes || [], adminUpdatedAt: m?.updatedAt || null }; })
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

// The blog index keeps no bodies; the English version (spec 21) keeps its fields minus the body.
const summary = ({ body, ...post }) => (post.en?.body ? { ...post, en: (({ body: enBody, ...en }) => en)(post.en) } : post);
const blogIndex = async (store) => { const index = await store.get('blog:index'); return { posts: Array.isArray(index?.posts) ? index.posts : [], hidden: Array.isArray(index?.hidden) ? index.hidden : [] }; };
const coverResponse = (dataUrl) => { const [, type, data] = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(dataUrl) || []; return type ? { type, buffer: Buffer.from(data, 'base64') } : null; };

// Public, read-only content for the site. Returns true when handled.
async function handlePublic(req, res, url, { send, store }) {
  const path = url.pathname;
  if (!path.startsWith('/api/content/')) return false;
  if (!['GET', 'HEAD'].includes(req.method)) { send(405, { error: 'method_not_allowed' }); return true; }
  const cached = (code, data, seconds = 60) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': `public, max-age=${seconds}, s-maxage=${seconds}, stale-while-revalidate=600` }); res.end(JSON.stringify(data)); };
  if (path === '/api/content/site') { cached(200, { site: (await store.get('site').catch(() => null)) || {} }); return true; }
  if (path === '/api/content/blog') {
    const { posts, hidden } = await blogIndex(store).catch(() => ({ posts: [], hidden: [] }));
    cached(200, { posts: posts.filter((p) => isLive(p)), hidden }); return true;
  }
  let match = /^\/api\/content\/blog\/([a-z0-9-]+)$/.exec(path);
  if (match) {
    const post = await store.get(`post:${match[1]}`).catch(() => null);
    if (!isLive(post)) { send(404, { error: 'not_found' }); return true; }
    cached(200, { post }); return true;
  }
  match = /^\/api\/content\/cover\/([a-z0-9-]+)$/.exec(path);
  if (match) {
    const image = coverResponse((await store.get(`cover:${match[1]}`).catch(() => null))?.dataUrl || '');
    if (!image) { send(404, { error: 'not_found' }); return true; }
    res.writeHead(200, { 'Content-Type': image.type, 'Cache-Control': 'public, max-age=86400', 'Content-Length': image.buffer.length });
    res.end(req.method === 'HEAD' ? undefined : image.buffer); return true;
  }
  send(404, { error: 'not_found' }); return true;
}

export async function handleAdmin(req, res, url, options) {
  if (!url.pathname.startsWith('/api/admin/') && !url.pathname.startsWith('/api/content/')) return false;
  try { return await route(req, res, url, options); }
  catch (error) {
    if (['payload_too_large', 'invalid_json'].includes(error.message)) throw error; // answered by the server (413 / 400)
    console.log(JSON.stringify({ evt: 'admin', ok: false, error: String(error.message).slice(0, 80) }));
    options.send(503, { error: 'storage_unavailable', message: 'האחסון לא זמין כרגע. נסו שוב בעוד רגע.' }); return true;
  }
}

async function route(req, res, url, { send, body, store, sessions, leadStore, env = process.env }) {
  if (await handlePublic(req, res, url, { send, store })) return true;
  const path = url.pathname;
  if (!path.startsWith('/api/admin/')) return false;
  // No password configured = no admin area at all.
  if (!env.LEADS_ADMIN_TOKEN) { send(404, { error: 'not_found' }); return true; }
  const client = clientOf(req), write = !['GET', 'HEAD'].includes(req.method);
  if (write && !sameOrigin(req)) { send(403, { error: 'bad_origin' }); return true; }
  if (write && req.method !== 'DELETE' && !/^application\/json\b/i.test(req.headers['content-type'] || '')) { send(415, { error: 'json_required' }); return true; }

  if (path === '/api/admin/login') {
    if (req.method !== 'POST') { send(405, { error: 'method_not_allowed' }); return true; }
    const tooMany = () => send(429, { error: 'rate_limited', message: 'יותר מדי ניסיונות כניסה. נסו שוב בעוד כמה דקות.' });
    if (!(await allowShared(client, 'adminLogin')) || await loginLocked(client)) { tooMany(); return true; }
    const input = await body(req, 2_000);
    if (!passwordMatches(input?.password, env.LEADS_ADMIN_TOKEN)) { await loginFailed(client); send(401, { error: 'unauthorized', message: 'הסיסמה שגויה.' }); return true; }
    await counters.clear(`adminfail:${client}`);
    const id = randomBytes(32).toString('base64url');
    try { await sessions.set(`session:${hex(id)}`, { createdAt: new Date().toISOString(), ua: String(req.headers['user-agent'] || '').slice(0, 120) }, SESSION_SECONDS); }
    catch { send(503, { error: 'storage_unavailable', message: 'האחסון לא זמין כרגע. נסו שוב בעוד רגע.' }); return true; }
    res.setHeader('Set-Cookie', cookie(req, id, SESSION_SECONDS));
    res.writeHead(204, { 'Cache-Control': 'no-store' }); res.end(); return true;
  }
  if (path === '/api/admin/logout') {
    if (req.method !== 'POST') { send(405, { error: 'method_not_allowed' }); return true; }
    const id = cookieOf(req);
    if (id) await sessions.set(`session:${hex(id)}`, null, 1).catch(() => {});
    res.setHeader('Set-Cookie', cookie(req, '', 0));
    res.writeHead(204, { 'Cache-Control': 'no-store' }); res.end(); return true;
  }
  if (!allow(client, 'admin')) { send(429, { error: 'rate_limited' }); return true; }
  if (!(await sessionValid(req, sessions))) { send(401, { error: 'unauthorized' }); return true; }

  if (path === '/api/admin/session' && req.method === 'GET') { send(200, { ok: true, storage: store.kind }); return true; }

  // ---- Leads ----
  if (path === '/api/admin/leads' && req.method === 'GET') {
    const leads = await allLeads(leadStore, env);
    const counts = Object.fromEntries(['all', ...LEAD_STATUSES].map((s) => [s, s === 'all' ? leads.length : leads.filter((l) => l.status === s).length]));
    const filtered = filterLeads(leads, url.searchParams);
    send(200, { leads: filtered.slice(0, 500), total: filtered.length, counts, storage: leadStore.kind }); return true;
  }
  if (path === '/api/admin/leads.csv' && req.method === 'GET') {
    const csv = leadsCsv(filterLeads(await allLeads(leadStore, env), url.searchParams));
    res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="gerbi-leads-${new Date().toISOString().slice(0, 10)}.csv"`, 'Cache-Control': 'no-store' });
    res.end(csv); return true;
  }
  let match = /^\/api\/admin\/leads\/([A-Za-z0-9-]{8,64})$/.exec(path);
  if (match && req.method === 'PATCH') {
    const input = await body(req, 4_000), errors = {};
    if (input.status !== undefined && !LEAD_STATUSES.includes(input.status)) errors.status = 'סטטוס לא מוכר';
    const note = typeof input.note === 'string' ? input.note.trim() : input.note === undefined ? '' : null;
    if (note === null || note.length > 1000) errors.note = 'עד 1000 תווים';
    if (input.status === undefined && !note && !errors.note) errors.form = 'אין מה לעדכן';
    if (Object.keys(errors).length) { send(400, { error: 'invalid', fields: errors }); return true; }
    const leads = await leadStore.list('all', 5000);
    if (!leads.some((l) => l.id === match[1])) { send(404, { error: 'not_found' }); return true; }
    const meta = (await leadStore.get('meta')) || {}, ids = new Set(leads.map((l) => l.id));
    for (const id of Object.keys(meta)) if (!ids.has(id)) delete meta[id]; // leads trimmed from the list
    const entry = meta[match[1]] || { status: 'new', notes: [] };
    if (input.status) entry.status = input.status;
    if (note) entry.notes = [...entry.notes, { at: new Date().toISOString(), text: note.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '') }].slice(-20);
    entry.updatedAt = new Date().toISOString();
    meta[match[1]] = entry;
    await leadStore.set('meta', meta);
    // The status also lives on the lead record itself, so other readers (the customer area) see it.
    if (input.status && /^[A-Za-z0-9-]+$/.test(match[1])) await leadStore.setListStatus?.('all', match[1], input.status);
    send(200, { ok: true, status: entry.status, notes: entry.notes }); return true;
  }

  // ---- Blog ----
  if (path === '/api/admin/blog' && req.method === 'GET') { send(200, await blogIndex(store)); return true; }
  // Spec 18 #20: a malformed slug is invalid input (400 with the field), not a missing post.
  const raw = /^\/api\/admin\/blog\/([^/]*)/.exec(path)?.[1];
  if (raw !== undefined && !/^[a-z0-9-]{1,60}$/.test(raw)) { send(400, { error: 'invalid', fields: { slug: normalizePost({}, raw).errors.slug } }); return true; }
  match = /^\/api\/admin\/blog\/([a-z0-9-]{1,60})(\/versions|\/restore|\/unhide)?$/.exec(path);
  if (match) {
    const [, slug, action] = match, key = `post:${slug}`;
    const index = await blogIndex(store);
    const saveIndex = (post) => store.set('blog:index', { posts: [summary(post), ...index.posts.filter((p) => p.slug !== post.slug)].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))), hidden: index.hidden.filter((s) => s !== post.slug) });
    if (!action && req.method === 'GET') { const post = await store.get(key); if (!post) send(404, { error: 'not_found' }); else send(200, { post }); return true; }
    if (action === '/versions' && req.method === 'GET') { send(200, { versions: ((await store.get(`${key}:versions`)) || []).map((v, i) => ({ index: i, savedAt: v.savedAt, title: v.value?.title, status: v.value?.status })) }); return true; }
    if (action === '/unhide' && req.method === 'POST') { await store.set('blog:index', { posts: index.posts, hidden: index.hidden.filter((s) => s !== slug) }); send(200, { ok: true }); return true; }
    if (action === '/restore' && req.method === 'POST') {
      const input = await body(req, 1_000), versions = (await store.get(`${key}:versions`)) || [], chosen = versions[Number.isInteger(input.index) ? input.index : -1];
      if (!chosen?.value) { send(404, { error: 'version_not_found' }); return true; }
      const current = await store.get(key);
      await remember(store, key, current);
      const post = { ...chosen.value, updatedAt: new Date().toISOString() };
      await store.set(key, post); await saveIndex(post);
      send(200, { post }); return true;
    }
    if (!action && req.method === 'PUT') {
      const input = await body(req, LIMITS.coverData + LIMITS.body * 8 + 20_000);
      const { post, errors } = normalizePost(input, slug);
      if (input.coverData !== undefined && input.coverData !== null && (typeof input.coverData !== 'string' || input.coverData.length > LIMITS.coverData || !COVER_DATA_RE.test(input.coverData)))
        Object.assign(errors, { coverData: `תמונה מסוג JPEG/PNG/WebP בלבד, עד ${Math.round(LIMITS.coverData / 1000)}KB` });
      if (Object.keys(errors).length) { send(400, { error: 'invalid', fields: errors }); return true; }
      const current = await store.get(key);
      if (input.create === true && (current || (BUILTIN_SLUGS.includes(slug) && !post.builtin))) { send(409, { error: 'slug_taken', fields: { slug: 'הכתובת כבר בשימוש' } }); return true; }
      if (!current && index.posts.length >= MAX_POSTS) { send(400, { error: 'invalid', fields: { form: `עד ${MAX_POSTS} פוסטים` } }); return true; }
      post.builtin = BUILTIN_SLUGS.includes(slug);
      if (typeof input.coverData === 'string') {
        await store.set(`cover:${slug}`, { dataUrl: input.coverData });
        post.cover = `/api/content/cover/${slug}?v=${hex(input.coverData).slice(0, 10)}`;
      }
      const now = new Date().toISOString();
      Object.assign(post, { createdAt: current?.createdAt || now, updatedAt: now });
      await remember(store, key, current);
      await store.set(key, post); await saveIndex(post);
      send(current ? 200 : 201, { post }); return true;
    }
    if (!action && req.method === 'DELETE') {
      const current = await store.get(key), hide = url.searchParams.get('hide') === '1' && BUILTIN_SLUGS.includes(slug);
      if (!current && !hide) { send(404, { error: 'not_found' }); return true; }
      if (current) { await remember(store, key, current); await store.set(key, null, 1); } // the cover stays, so a restored version keeps its image
      await store.set('blog:index', { posts: index.posts.filter((p) => p.slug !== slug), hidden: hide ? [...new Set([...index.hidden, slug])] : index.hidden });
      send(200, { ok: true, hidden: hide }); return true;
    }
  }

  // ---- Site content ----
  if (path === '/api/admin/site') {
    if (req.method === 'GET') { send(200, { site: (await store.get('site')) || {} }); return true; }
    if (req.method === 'PUT') {
      const { site, errors } = normalizeSite(await body(req, LIMITS.siteJson * 4));
      if (!site) { send(400, { error: 'invalid', fields: errors }); return true; }
      await remember(store, 'site', await store.get('site'));
      await store.set('site', site);
      send(200, { site }); return true;
    }
  }
  if (path === '/api/admin/site/versions' && req.method === 'GET') { send(200, { versions: ((await store.get('site:versions')) || []).map((v, i) => ({ index: i, savedAt: v.savedAt })) }); return true; }
  if (path === '/api/admin/site/restore' && req.method === 'POST') {
    const input = await body(req, 1_000), versions = (await store.get('site:versions')) || [], chosen = versions[Number.isInteger(input.index) ? input.index : -1];
    if (!chosen?.value) { send(404, { error: 'version_not_found' }); return true; }
    await remember(store, 'site', await store.get('site'));
    await store.set('site', chosen.value);
    send(200, { site: chosen.value }); return true;
  }
  send(404, { error: 'not_found' }); return true;
}

