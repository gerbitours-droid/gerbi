// Spec 21 §6: owner-editable content in English — optional en fields, validation, fallback precedence, admin API round trip.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { normalizeSite, normalizePost, localizeSite, localizePost, mergeSite, siteDefaultsEn, SITE_DEFAULTS } from '../dist/content-model.mjs';
import { builtinPosts } from '../dist/blog-posts.mjs';
import { handleAdmin, bridgeAdminSession } from '../backend/admin.mjs';
import { createStore } from '../backend/kv-store.mjs';

test('site: English fields are optional, validated with the same limits, and stored under en', () => {
  const { site, errors } = normalizeSite({ hero: { title: 'שלום' }, en: { hero: { title: ' Hello ', subtitle: '' }, footer: { tagline: 'Smile' }, banner: { text: 'Sale' }, faqs: [{ q: 'Q?', a: 'A.' }, { q: '', a: '' }], guides: { rome: { fit: 'Couples' } } } });
  assert.deepEqual(errors, {});
  assert.deepEqual(site.en, { hero: { title: 'Hello' }, footer: { tagline: 'Smile' }, banner: { text: 'Sale' }, faqs: [{ q: 'Q?', a: 'A.' }], guides: { rome: { fit: 'Couples' } } });
  assert.equal(normalizeSite({ en: {} }).site.en, undefined, 'an empty English group is not stored');
  const bad = normalizeSite({ en: { hero: { title: 'x'.repeat(500) }, faqs: [{ q: 'only a question' }], guides: { atlantis: { fit: 'x' } }, footer: { note: 'y'.repeat(300) } } });
  assert.equal(bad.site, null);
  for (const key of ['en.hero.title', 'en.faqs.0', 'en.guides.atlantis', 'en.footer.note']) assert.ok(bad.errors[key], key);
  assert.ok(normalizeSite({ en: 'nope' }).errors.en);
  assert.ok(normalizeSite({ en: { faqs: 'nope' } }).errors['en.faqs']);
});

test('site: English precedence is owner English → owner Hebrew (flagged) → built-in English', () => {
  const he = localizeSite({ hero: { title: 'חדש' } }, 'he');
  assert.equal(he.hero.title, 'חדש');
  assert.equal(he.hero.subtitle, SITE_DEFAULTS.hero.subtitle);
  assert.deepEqual(he.he, []);
  assert.deepEqual(localizeSite({}, 'he').hero, mergeSite({}).hero, 'Hebrew is unchanged');

  const defaults = siteDefaultsEn();
  const plain = localizeSite({}, 'en');
  assert.equal(plain.hero.title, defaults.hero.title);
  assert.equal(plain.footer.note, defaults.footer.note);
  assert.deepEqual(plain.faqs, []);
  assert.deepEqual(plain.he, []);
  assert.doesNotMatch(JSON.stringify({ hero: plain.hero, footer: plain.footer }), /[֐-׿]/);

  const mixed = localizeSite({ hero: { title: 'כותרת', subtitle: 'תת' }, footer: { tagline: 'סלוגן' }, banner: { enabled: true, text: 'מבצע', link: '#/x' },
    faqs: [{ q: 'ש', a: 'ת' }], guides: { rome: { fit: 'זוגות', stay: 'מרכז' } },
    en: { hero: { title: 'Title' }, guides: { rome: { fit: 'Couples' } } } }, 'en');
  assert.equal(mixed.hero.title, 'Title');
  assert.equal(mixed.hero.subtitle, 'תת');
  assert.equal(mixed.footer.tagline, 'סלוגן');
  assert.equal(mixed.footer.blurb, defaults.footer.blurb);
  assert.equal(mixed.banner.text, 'מבצע');
  assert.equal(mixed.banner.link, '#/x');
  assert.deepEqual(mixed.faqs, [{ q: 'ש', a: 'ת', he: true }]);
  assert.deepEqual(mixed.guides.rome, { fit: 'Couples', stay: 'מרכז' });
  assert.deepEqual([...mixed.he].sort(), ['banner.text', 'faqs', 'footer.tagline', 'guides.rome.stay', 'hero.subtitle'].sort());

  const english = localizeSite({ faqs: [{ q: 'ש', a: 'ת' }], banner: { enabled: true, text: 'מבצע' }, en: { faqs: [{ q: 'Q', a: 'A' }], banner: { text: 'Sale' } } }, 'en');
  assert.deepEqual(english.faqs, [{ q: 'Q', a: 'A' }]);
  assert.equal(english.banner.text, 'Sale');
  assert.deepEqual(english.he, []);
});

test('post: optional English version; title and body are required together', () => {
  const base = { title: 'פוסט', body: 'גוף' };
  assert.equal(normalizePost(base, 'p').post.en, undefined);
  assert.equal(normalizePost({ ...base, en: { title: '', body: '', tags: '' } }, 'p').post.en, undefined, 'all-empty English is not stored');
  const ok = normalizePost({ ...base, en: { title: ' Post ', body: 'Body', tags: 'sea, sea ,couples', excerpt: 'Short', seoTitle: '' } }, 'p');
  assert.deepEqual(ok.errors, {});
  assert.deepEqual(ok.post.en, { title: 'Post', excerpt: 'Short', body: 'Body', tags: ['sea', 'couples'] });
  const half = normalizePost({ ...base, en: { title: 'Only a title' } }, 'p');
  assert.equal(half.post, null);
  assert.ok(half.errors['en.body']);
  assert.ok(normalizePost({ ...base, en: { body: 'Only a body' } }, 'p').errors['en.title']);
  assert.ok(normalizePost({ ...base, en: { title: 'x'.repeat(500), body: 'b' } }, 'p').errors['en.title']);
  assert.ok(normalizePost({ ...base, en: [] }, 'p').errors.en);
});

test('post: English page shows the English version or the Hebrew post flagged', () => {
  const post = { slug: 'p', title: 'פוסט', excerpt: 'תקציר', body: 'גוף', category: 'קט', tags: ['ים'], en: { title: 'Post', body: 'Body', tags: ['sea'] } };
  assert.equal(localizePost(post, 'he').title, 'פוסט');
  assert.equal(localizePost(post, 'he').he, false);
  const en = localizePost(post, 'en');
  assert.deepEqual([en.title, en.body, en.excerpt, en.category, en.tags, en.he], ['Post', 'Body', '', '', ['sea'], false]);
  assert.equal(localizePost({ ...post, en: undefined }, 'en').he, true);
  assert.equal(localizePost({ ...post, en: undefined }, 'en').title, 'פוסט');
  const summary = { slug: 'p', title: 'פוסט', en: { title: 'Post' } };
  assert.equal(localizePost(summary, 'en').title, 'Post', 'a blog-index summary has no bodies; the English title is enough');
  for (const p of builtinPosts()) { const shown = localizePost(p, 'en'); assert.equal(shown.he, false, p.slug); assert.doesNotMatch(shown.title + shown.body, /[֐-׿]/, p.slug); }
});

// ---- Admin API round trip ----
const TOKEN = 'owner-pass-123';
async function withAdminServer(run) {
  const env = { LEADS_ADMIN_TOKEN: TOKEN };
  const directory = await mkdtemp(path.join(os.tmpdir(), 'gerbi-admin-en-'));
  const store = createStore('content', directory), sessions = createStore('admin', directory), leadStore = createStore('leads', directory);
  const body = async (req, limit = 32_000) => { let raw = ''; for await (const chunk of req) { raw += chunk; if (raw.length > limit) throw new Error('payload_too_large'); } return raw ? JSON.parse(raw) : {}; };
  const server = http.createServer(async (req, res) => {
    const send = (code, data) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
    try {
      const url = new URL(req.url, 'http://x');
      await bridgeAdminSession(req, url, { store: sessions, env });
      if (!(await handleAdmin(req, res, url, { send, body, store, sessions, leadStore, env }))) send(404, {});
    } catch (error) { send(400, { error: error.message }); }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  let cookie = '';
  const call = async (method, route, payload) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}${route}`, { method, headers: { 'X-Forwarded-For': '10.77.0.1', ...(cookie ? { Cookie: cookie } : {}), ...(payload !== undefined ? { 'Content-Type': 'application/json' } : {}) }, body: payload === undefined ? undefined : JSON.stringify(payload) });
    const set = response.headers.get('set-cookie'); if (set) cookie = set.split(';')[0];
    return response;
  };
  try { await run(call); } finally { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); await rm(directory, { recursive: true, force: true }); }
}

test('admin API stores English site texts and posts; the public endpoints return them (index without bodies)', async () => {
  await withAdminServer(async (call) => {
    assert.ok((await call('POST', '/api/admin/login', { password: TOKEN })).ok);
    assert.equal((await call('PUT', '/api/admin/site', { hero: { title: 'שלום' }, en: { hero: { title: 'Hello' }, faqs: [{ q: 'Q', a: 'A' }] } })).status, 200);
    const site = (await (await call('GET', '/api/content/site')).json()).site;
    assert.deepEqual(site.en, { hero: { title: 'Hello' }, faqs: [{ q: 'Q', a: 'A' }] });
    assert.equal(localizeSite(site, 'en').hero.title, 'Hello');
    assert.equal((await call('PUT', '/api/admin/site', { en: { hero: { title: 'x'.repeat(500) } } })).status, 400);

    const post = { title: 'פוסט', body: 'גוף', status: 'published', publishDate: '2026-01-01', create: true, en: { title: 'Post', body: 'English body', excerpt: 'Short' } };
    assert.equal((await call('PUT', '/api/admin/blog/en-post', post)).status, 201);
    const index = (await (await call('GET', '/api/content/blog')).json()).posts;
    const listed = index.find((p) => p.slug === 'en-post');
    assert.deepEqual(listed.en, { title: 'Post', excerpt: 'Short' }, 'the index keeps English fields but no body');
    const full = (await (await call('GET', '/api/content/blog/en-post')).json()).post;
    assert.equal(full.en.body, 'English body');
    assert.equal((await call('PUT', '/api/admin/blog/en-post', { ...post, create: false, en: { title: 'No body' } })).status, 400);
  });
});
