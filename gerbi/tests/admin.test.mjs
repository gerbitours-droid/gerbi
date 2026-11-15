// Spec 18: owner admin / CMS — Markdown safety, content validation, and the admin + public content API.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { renderMarkdown } from '../dist/markdown.mjs';
import { normalizeSite, normalizePost, mergeSite, slugFromTitle, isLive, SITE_DEFAULTS } from '../dist/content-model.mjs';
import { builtinPosts, BUILTIN_SLUGS } from '../dist/blog-posts.mjs';
import { mergedPosts } from '../dist/cms-public.mjs';
import { handleAdmin, bridgeAdminSession } from '../backend/admin.mjs';
import { handleLeads } from '../backend/leads.mjs';
import { createStore } from '../backend/kv-store.mjs';

test('markdown: allow-listed syntax renders, everything else is inert text', () => {
  const html = renderMarkdown('## כותרת\n\nשורה **מודגשת** ו*נטויה*\nשורה שנייה\n\n- א\n- ב\n\n1. ראשון\n\n> ציטוט\n\n[קישור](https://example.com/a?b=1&c=2) [פנימי](#/blog) ![תמונה](https://example.com/x.jpg)');
  assert.match(html, /<h2>כותרת<\/h2>/);
  assert.match(html, /<strong>מודגשת<\/strong>/);
  assert.match(html, /<em>נטויה<\/em>/);
  assert.match(html, /<br>שורה שנייה/);
  assert.match(html, /<ul><li>א<\/li><li>ב<\/li><\/ul>/);
  assert.match(html, /<ol><li>ראשון<\/li><\/ol>/);
  assert.match(html, /<blockquote>ציטוט<\/blockquote>/);
  assert.match(html, /<a href="https:\/\/example.com\/a\?b=1&amp;c=2" target="_blank" rel="noopener noreferrer nofollow">קישור<\/a>/);
  assert.match(html, /<a href="#\/blog">פנימי<\/a>/);
  assert.match(html, /<img src="https:\/\/example.com\/x.jpg" alt="תמונה" loading="lazy">/);
});

test('markdown: XSS attempts never produce markup or dangerous URLs', () => {
  const attacks = ['<script>alert(1)</script>', '<img src=x onerror=alert(1)>', '[x](javascript:alert(1))', '[x](JaVaScRiPt:alert(1))', '[x](data:text/html,<b>)', '![x](javascript:alert(1))',
    '![x](http://insecure.example/x.png)', '[x](https://a.com" onmouseover="alert(1))', '[x](//evil.com)', '**<b>**', '[a](https://ok.com)<svg onload=alert(1)>', '`<i>`', '# <iframe src=x>', '&lt;script&gt;'];
  for (const attack of attacks) {
    const html = renderMarkdown(attack);
    assert.doesNotMatch(html, /<(script|img src=x|svg|iframe|b>|i>)/i, attack);
    assert.doesNotMatch(html, /href="(javascript|data|\/\/)/i, attack);
    assert.doesNotMatch(html, /src="(javascript|http:)/i, attack);
    assert.doesNotMatch(html, /<[^>]*\son\w+=/i, attack);
  }
  assert.match(renderMarkdown('&lt;script&gt;'), /&amp;lt;script&amp;gt;/, 'entities stay literal');
});

test('site content validation keeps only real overrides and rejects bad values', () => {
  assert.deepEqual(normalizeSite({}).site, {});
  const { site } = normalizeSite({ hero: { title: ' שלום ', subtitle: '' }, contact: { whatsapp: '+972-50-123-4567', phone: '03-123 4567', email: 'a@b.co' }, banner: { enabled: true, text: 'מבצע', link: '#/tailor-made' }, faqs: [{ q: 'ש', a: 'ת' }, { q: '', a: '' }], guides: { rome: { fit: 'כולם' } } });
  assert.deepEqual(site, { hero: { title: 'שלום' }, contact: { whatsapp: '972501234567', phone: '031234567', email: 'a@b.co' }, banner: { enabled: true, text: 'מבצע', link: '#/tailor-made' }, faqs: [{ q: 'ש', a: 'ת' }], guides: { rome: { fit: 'כולם' } } });
  const bad = normalizeSite({ hero: { title: 'x'.repeat(500) }, contact: { whatsapp: 'abc', email: 'no' }, banner: { enabled: true, text: '', link: 'javascript:alert(1)' }, faqs: [{ q: 'רק שאלה' }], guides: { atlantis: { fit: 'x' } }, footer: { tagline: 5 } });
  assert.equal(bad.site, null);
  for (const key of ['hero.title', 'contact.whatsapp', 'contact.email', 'banner.text', 'banner.link', 'faqs.0', 'guides.atlantis', 'footer.tagline']) assert.ok(bad.errors[key], key);
  assert.ok(normalizeSite([]).errors.form);
  const merged = mergeSite({ hero: { title: 'חדש' } });
  assert.equal(merged.hero.title, 'חדש');
  assert.equal(merged.hero.subtitle, SITE_DEFAULTS.hero.subtitle);
  assert.equal(merged.contact.email, SITE_DEFAULTS.contact.email);
});

test('post validation, slugs and publish state', () => {
  const ok = normalizePost({ title: 'פוסט', body: 'גוף', tags: 'ים, ים ,זוגות', publishDate: '2026-11-01', status: 'published', cover: 'https://x.co/a.jpg' }, 'my-post');
  assert.deepEqual(ok.errors, {});
  assert.deepEqual(ok.post.tags, ['ים', 'זוגות']);
  const bad = normalizePost({ title: '', body: '', publishDate: '2026-13-45', cover: 'javascript:alert(1)', tags: Array(9).fill(0).map((_, i) => 't' + i) }, 'Bad Slug');
  for (const key of ['slug', 'title', 'body', 'publishDate', 'cover', 'tags']) assert.ok(bad.errors[key], key);
  assert.equal(normalizePost({ title: 'a', body: 'b', status: 'hacked' }, 'ok').post.status, 'draft');
  assert.equal(slugFromTitle('Rome in 3 Days!'), 'rome-in-3-days');
  assert.match(slugFromTitle('רומא בשלושה ימים', new Date('2026-11-15T10:00:00Z')), /^post-20261115-[a-z0-9]{1,4}$/);
  assert.equal(isLive({ status: 'published', publishDate: '2026-11-15' }, '2026-11-15'), true);
  assert.equal(isLive({ status: 'published', publishDate: '2026-11-16' }, '2026-11-15'), false);
  assert.equal(isLive({ status: 'draft', publishDate: '' }, '2026-11-15'), false);
});

test('built-in guides become editable posts; owner copies win and hidden ones disappear', () => {
  const builtins = builtinPosts();
  assert.deepEqual(builtins.map((p) => p.slug), BUILTIN_SLUGS);
  assert.match(builtins[0].body, /^## /);
  const merged = mergedPosts([{ slug: 'new-one', title: 'חדש', publishDate: '2026-11-10' }, { slug: 'family', title: 'נערך', publishDate: '2026-11-01' }], ['packing']);
  assert.deepEqual(merged.map((p) => p.slug), ['new-one', 'family', 'couple', 'compare']);
  assert.equal(merged[1].title, 'נערך');
});

// ---- API ----
const TOKEN = 'owner-pass-123';
async function withAdminServer(run, env = { LEADS_ADMIN_TOKEN: TOKEN }) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'gerbi-admin-'));
  const store = createStore('content', directory), sessions = createStore('admin', directory), leadStore = createStore('leads', directory);
  const body = async (req, limit = 32_000) => { let raw = ''; for await (const chunk of req) { raw += chunk; if (raw.length > limit) throw new Error('payload_too_large'); } return raw ? JSON.parse(raw) : {}; };
  const server = http.createServer(async (req, res) => {
    const send = (code, data) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
    try {
      const url = new URL(req.url, 'http://x');
      await bridgeAdminSession(req, url, { store: sessions, env });
      if (await handleLeads(req, url, { send, body, store: leadStore, env })) return;
      if (!(await handleAdmin(req, res, url, { send, body, store, sessions, leadStore, env }))) send(404, {});
    } catch (error) { send(error.message === 'payload_too_large' ? 413 : 400, { error: error.message }); }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try { await run(base, { leadStore, store }); } finally { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); await rm(directory, { recursive: true, force: true }); }
}
let ipSeq = 0;
function client(base) {
  const ip = `10.18.${Math.floor(++ipSeq / 250)}.${ipSeq % 250}`;
  let cookie = '';
  const call = async (method, route, payload, headers = {}) => {
    const response = await fetch(base + route, { method, redirect: 'manual', headers: { 'X-Forwarded-For': ip, ...(cookie ? { Cookie: cookie } : {}), ...(payload !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers }, body: payload === undefined ? undefined : JSON.stringify(payload) });
    const set = response.headers.get('set-cookie');
    if (set) cookie = set.split(';')[0].endsWith('=') ? '' : set.split(';')[0];
    return response;
  };
  return { call, login: (password = TOKEN) => call('POST', '/api/admin/login', { password }), get cookie() { return cookie; }, set cookie(v) { cookie = v; }, ip };
}

test('login issues an httpOnly SameSite=Strict session; logout really ends it; no cookie = 401', async () => {
  await withAdminServer(async (base) => {
    const c = client(base);
    assert.equal((await c.call('GET', '/api/admin/session')).status, 401);
    assert.equal((await c.login('wrong')).status, 401);
    const ok = await c.login();
    assert.equal(ok.status, 204);
    const setCookie = ok.headers.get('set-cookie');
    assert.match(setCookie, /^gerbi_admin=[A-Za-z0-9_-]{43}; HttpOnly; SameSite=Strict; Path=\/; Max-Age=43200$/);
    assert.equal((await c.call('GET', '/api/admin/session')).status, 200);
    const stolen = c.cookie;
    assert.equal((await c.call('POST', '/api/admin/logout', {})).status, 204);
    c.cookie = stolen;
    assert.equal((await c.call('GET', '/api/admin/session')).status, 401, 'the old cookie no longer works');
    assert.equal((await c.call('GET', '/api/admin/blog')).status, 401);
    c.cookie = 'gerbi_admin=' + 'A'.repeat(43);
    assert.equal((await c.call('GET', '/api/admin/leads')).status, 401, 'made-up session');
  });
});

test('login is rate limited; without LEADS_ADMIN_TOKEN the admin API does not exist', async () => {
  await withAdminServer(async (base) => {
    const c = client(base);
    const codes = [];
    for (let i = 0; i < 6; i++) codes.push((await c.login('nope')).status);
    assert.deepEqual(codes, [401, 401, 401, 401, 401, 429]);
    assert.equal((await c.login()).status, 429, 'even the right password waits');
  });
  await withAdminServer(async (base) => {
    const c = client(base);
    assert.equal((await c.login()).status, 404);
    assert.equal((await c.call('GET', '/api/admin/session')).status, 404);
    assert.equal((await c.call('GET', '/api/content/site')).status, 200, 'public content still works');
  }, {});
});

test('writes need JSON and a same-origin Origin header', async () => {
  await withAdminServer(async (base) => {
    const c = client(base);
    await c.login();
    assert.equal((await c.call('PUT', '/api/admin/site', { hero: { title: 'x' } }, { Origin: 'https://evil.example' })).status, 403);
    const form = await fetch(base + '/api/admin/site', { method: 'PUT', headers: { Cookie: c.cookie, 'X-Forwarded-For': c.ip, 'Content-Type': 'text/plain' }, body: '{}' });
    assert.equal(form.status, 415);
    assert.equal((await c.call('PUT', '/api/admin/site', { hero: { title: 'x' } }, { Origin: base })).status, 200);
  });
});

test('leads: status, notes, filters, counts and a safe CSV export; the session also unlocks GET /api/leads', async () => {
  await withAdminServer(async (base, { leadStore }) => {
    await leadStore.push('all', { id: 'aaaaaaaa-1111', createdAt: '2026-11-14T10:00:00Z', status: 'new', type: 'contact', name: 'דנה', phone: '0501234567', message: '=HYPERLINK("http://evil")', channel: 'whatsapp' });
    await leadStore.push('all', { id: 'bbbbbbbb-2222', createdAt: '2026-11-15T10:00:00Z', status: 'new', type: 'tailor', name: 'יוסי, "הגדול"', phone: '0521111111', destinations: 'יפן', channel: 'phone' });
    const c = client(base);
    await c.login();
    let data = await (await c.call('GET', '/api/admin/leads')).json();
    assert.deepEqual(data.leads.map((l) => l.name), ['יוסי, "הגדול"', 'דנה']);
    assert.deepEqual(data.counts, { all: 2, new: 2, progress: 0, closed: 0 });
    assert.equal((await c.call('PATCH', '/api/admin/leads/aaaaaaaa-1111', { status: 'progress' })).status, 200);
    assert.equal((await c.call('PATCH', '/api/admin/leads/aaaaaaaa-1111', { note: 'התקשרתי, תחזור מחר' })).status, 200);
    assert.equal((await leadStore.list('all', 10)).find((l) => l.id === 'aaaaaaaa-1111').status, 'progress', 'status stored on the lead record too');
    assert.equal((await c.call('PATCH', '/api/admin/leads/aaaaaaaa-1111', { status: 'bogus' })).status, 400);
    assert.equal((await c.call('PATCH', '/api/admin/leads/aaaaaaaa-1111', { note: 'x'.repeat(1001) })).status, 400);
    assert.equal((await c.call('PATCH', '/api/admin/leads/zzzzzzzz-9999', { status: 'closed' })).status, 404);
    data = await (await c.call('GET', '/api/admin/leads?status=progress')).json();
    assert.equal(data.leads.length, 1);
    assert.equal(data.leads[0].adminNotes[0].text, 'התקשרתי, תחזור מחר');
    assert.deepEqual(data.counts, { all: 2, new: 1, progress: 1, closed: 0 });
    assert.equal((await (await c.call('GET', '/api/admin/leads?q=' + encodeURIComponent('יפן'))).json()).leads[0].id, 'bbbbbbbb-2222');
    assert.equal((await (await c.call('GET', '/api/admin/leads?type=tailor')).json()).total, 1);
    const csv = await c.call('GET', '/api/admin/leads.csv');
    assert.equal(csv.status, 200);
    assert.match(csv.headers.get('content-type'), /text\/csv/);
    assert.match(csv.headers.get('content-disposition'), /attachment; filename="gerbi-leads-\d{4}-\d{2}-\d{2}\.csv"/);
    const bytes = Buffer.from(await csv.arrayBuffer()), text = bytes.toString('utf8');
    assert.deepEqual([...bytes.subarray(0, 3)], [0xef, 0xbb, 0xbf], 'BOM so Excel reads Hebrew');
    assert.match(text, /^﻿תאריך,סוג,סטטוס,שם/);
    assert.match(text, /"'=HYPERLINK\(""http:\/\/evil""\)"/, 'formula neutralised and quoted');
    assert.match(text, /"יוסי, ""הגדול"""/);
    assert.match(text, /בטיפול/);
    const legacy = await c.call('GET', '/api/leads');
    assert.equal(legacy.status, 200, 'session bridged to the token-protected endpoint');
    assert.equal((await fetch(base + '/api/leads', { headers: { 'X-Forwarded-For': '10.99.0.1' } })).status, 401, 'no cookie, no bridge');
  });
});

test('blog: draft → publish → unpublish → delete, scheduled posts stay hidden, slugs are unique', async () => {
  await withAdminServer(async (base) => {
    const c = client(base);
    await c.login();
    const post = { title: 'פוסט חדש', body: '## שלום\n\nטקסט', excerpt: 'תקציר', tags: ['ים'], publishDate: '2026-01-01', status: 'draft', create: true };
    assert.equal((await c.call('PUT', '/api/admin/blog/new-post', post)).status, 201);
    assert.equal((await c.call('PUT', '/api/admin/blog/new-post', post)).status, 409, 'create on an existing slug');
    assert.equal((await c.call('PUT', '/api/admin/blog/family', { ...post })).status, 409, 'a built-in slug is not a new post');
    assert.equal((await c.call('PUT', '/api/admin/blog/Bad_Slug', { ...post, create: false })).status, 404);
    let pub = await (await c.call('GET', '/api/content/blog')).json();
    assert.equal(pub.posts.length, 0, 'drafts are not public');
    assert.equal((await c.call('GET', '/api/content/blog/new-post')).status, 404);
    assert.equal((await c.call('PUT', '/api/admin/blog/new-post', { ...post, status: 'published', create: false })).status, 200);
    pub = await (await c.call('GET', '/api/content/blog')).json();
    assert.deepEqual(pub.posts.map((p) => p.slug), ['new-post']);
    assert.equal(pub.posts[0].body, undefined, 'the list has no bodies');
    assert.equal((await (await c.call('GET', '/api/content/blog/new-post')).json()).post.body, '## שלום\n\nטקסט');
    assert.equal((await c.call('PUT', '/api/admin/blog/later', { ...post, status: 'published', publishDate: '2099-01-01' })).status, 201);
    assert.equal((await c.call('GET', '/api/content/blog/later')).status, 404, 'scheduled');
    assert.equal((await (await c.call('GET', '/api/admin/blog')).json()).posts.length, 2, 'the owner sees everything');
    assert.equal((await c.call('PUT', '/api/admin/blog/new-post', { ...post, status: 'draft', create: false })).status, 200);
    assert.equal((await (await c.call('GET', '/api/content/blog')).json()).posts.length, 0, 'unpublished');
    const versions = await (await c.call('GET', '/api/admin/blog/new-post/versions')).json();
    assert.equal(versions.versions.length, 2);
    assert.equal(versions.versions[0].status, 'published');
    assert.equal((await c.call('POST', '/api/admin/blog/new-post/restore', { index: 0 })).status, 200);
    assert.equal((await (await c.call('GET', '/api/content/blog')).json()).posts.length, 1, 'restored the published version');
    assert.equal((await c.call('DELETE', '/api/admin/blog/new-post')).status, 200);
    assert.equal((await c.call('GET', '/api/content/blog/new-post')).status, 404);
    assert.equal((await c.call('DELETE', '/api/admin/blog/new-post')).status, 404);
    const invalid = await c.call('PUT', '/api/admin/blog/x-post', { title: '', body: '', publishDate: 'tomorrow' });
    assert.equal(invalid.status, 400);
    assert.deepEqual(Object.keys((await invalid.json()).fields).sort(), ['body', 'publishDate', 'title']);
  });
});

test('built-in guides: edit creates a copy, hide/unhide, reset to original', async () => {
  await withAdminServer(async (base) => {
    const c = client(base);
    await c.login();
    const original = builtinPosts().find((p) => p.slug === 'family');
    assert.equal((await c.call('PUT', '/api/admin/blog/family', { ...original, title: 'משפחה — נערך', builtin: true })).status, 201);
    const pub = await (await c.call('GET', '/api/content/blog')).json();
    assert.equal(pub.posts[0].title, 'משפחה — נערך');
    assert.equal(pub.posts[0].builtin, true);
    assert.equal((await c.call('DELETE', '/api/admin/blog/family')).status, 200, 'reset to the original');
    assert.equal((await (await c.call('GET', '/api/content/blog')).json()).posts.length, 0);
    assert.equal((await c.call('DELETE', '/api/admin/blog/packing?hide=1')).status, 200);
    assert.deepEqual((await (await c.call('GET', '/api/content/blog')).json()).hidden, ['packing']);
    assert.equal((await c.call('POST', '/api/admin/blog/packing/unhide', {})).status, 200);
    assert.deepEqual((await (await c.call('GET', '/api/content/blog')).json()).hidden, []);
  });
});

test('cover upload: only small JPEG/PNG/WebP data URLs, served back as an image', async () => {
  await withAdminServer(async (base) => {
    const c = client(base);
    await c.login();
    const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const post = { title: 'עם תמונה', body: 'גוף', status: 'published', publishDate: '2026-01-01' };
    assert.equal((await c.call('PUT', '/api/admin/blog/svg', { ...post, coverData: 'data:image/svg+xml;base64,PHN2Zz4=' })).status, 400);
    assert.equal((await c.call('PUT', '/api/admin/blog/big', { ...post, coverData: 'data:image/jpeg;base64,' + 'A'.repeat(360_000) })).status, 400);
    const saved = await (await c.call('PUT', '/api/admin/blog/pic', { ...post, coverData: png })).json();
    assert.match(saved.post.cover, /^\/api\/content\/cover\/pic\?v=[0-9a-f]{10}$/);
    const image = await fetch(base + saved.post.cover);
    assert.equal(image.status, 200);
    assert.equal(image.headers.get('content-type'), 'image/png');
    assert.equal(Buffer.from(await image.arrayBuffer()).subarray(1, 4).toString(), 'PNG');
    assert.equal((await fetch(base + '/api/content/cover/none')).status, 404);
    const huge = await c.call('PUT', '/api/admin/blog/huge', { ...post, body: 'x'.repeat(2_000_000) });
    assert.equal(huge.status, 413);
  });
});

test('site content: validated save, public read with cache headers, versions and restore', async () => {
  await withAdminServer(async (base) => {
    const c = client(base);
    await c.login();
    const empty = await c.call('GET', '/api/content/site');
    assert.match(empty.headers.get('cache-control'), /public, max-age=60/);
    assert.deepEqual((await empty.json()).site, {});
    const bad = await c.call('PUT', '/api/admin/site', { contact: { email: 'nope' }, banner: { enabled: true, link: 'javascript:x' } });
    assert.equal(bad.status, 400);
    assert.ok((await bad.json()).fields['contact.email']);
    assert.equal((await c.call('PUT', '/api/admin/site', { hero: { title: 'גרסה 1' }, contact: { whatsapp: '972541112222' } })).status, 200);
    assert.equal((await c.call('PUT', '/api/admin/site', { hero: { title: 'גרסה 2' }, banner: { enabled: true, text: 'מבצע חורף' } })).status, 200);
    let site = (await (await c.call('GET', '/api/content/site')).json()).site;
    assert.deepEqual(site, { hero: { title: 'גרסה 2' }, banner: { enabled: true, text: 'מבצע חורף', link: '' } });
    const versions = (await (await c.call('GET', '/api/admin/site/versions')).json()).versions;
    assert.equal(versions.length, 1);
    assert.equal((await c.call('POST', '/api/admin/site/restore', { index: 0 })).status, 200);
    site = (await (await c.call('GET', '/api/content/site')).json()).site;
    assert.equal(site.hero.title, 'גרסה 1');
    assert.equal(site.contact.whatsapp, '972541112222');
    assert.equal((await c.call('POST', '/api/admin/site/restore', { index: 9 })).status, 404);
    assert.equal((await fetch(base + '/api/content/site', { method: 'POST' })).status, 405);
  });
});
