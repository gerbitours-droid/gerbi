// Owner-edited content on the public site (spec 18): site texts and contact details from GET /api/content/site,
// blog posts from GET /api/content/blog merged with the built-in guides. Built-in defaults always render first,
// so the site works the same when the API is down; the last good copy of the site texts is kept on the device.
import { SITE_DEFAULTS, mergeSite, normalizeSite } from './content-model.mjs';
import { builtinPosts } from './blog-posts.mjs';
import { renderMarkdown, safeImage, safeLink, readingMinutes } from './markdown.mjs';

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const CACHE_KEY = 'gerbi-site-content-v1';
const $ = (s) => document.querySelector(s);

// Live, mutated in place: pages.mjs reads it at render time.
export const site = mergeSite({});
function replaceSite(overrides) { const merged = mergeSite(overrides); for (const key of Object.keys(merged)) site[key] = merged[key]; }

function applyHome() {
  const hero = $('#hero-title');
  if (hero) { hero.textContent = site.hero.title; const sub = hero.nextElementSibling; if (sub?.tagName === 'P') sub.textContent = site.hero.subtitle; }
  const spans = document.querySelectorAll('#home > footer > span');
  if (spans[0]) spans[0].textContent = `© 2026 ג׳רבי טורס. ${site.footer.tagline}`;
  if (spans[1]) spans[1].textContent = site.footer.note;
  let banner = $('#site-banner');
  const on = site.banner.enabled && site.banner.text;
  if (!on) { banner?.remove(); return; }
  if (!banner) { banner = document.createElement('div'); banner.id = 'site-banner'; banner.className = 'site-banner'; banner.setAttribute('role', 'note'); $('.header')?.after(banner); }
  const link = safeLink(site.banner.link);
  const external = /^https?:/i.test(link);
  banner.innerHTML = `<span>${esc(site.banner.text)}</span>${link ? ` <a href="${esc(link)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>לפרטים</a>` : ''}`;
}

// contact: the shared object from data.mjs (mutated in place so every consumer sees the owner's details).
// rerender: redraws the current inner page when fresh content differs from what was shown.
export function initSiteContent({ contact, rerender = () => {}, fetchImpl = globalThis.fetch } = {}) {
  let shown = '{}';
  const use = (overrides) => { replaceSite(overrides); Object.assign(contact, site.contact); applyHome(); shown = JSON.stringify(overrides); };
  try { const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); if (cached && normalizeSite(cached).site) use(cached); } catch { /* no storage: defaults */ }
  applyHome();
  return fetchImpl('/api/content/site', { signal: AbortSignal.timeout(5000) }).then((r) => (r.ok ? r.json() : null)).then((data) => {
    const { site: overrides } = normalizeSite(data?.site || {});
    if (!overrides || JSON.stringify(overrides) === shown) return;
    Object.assign(contact, SITE_DEFAULTS.contact);
    use(overrides);
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(overrides)); } catch {}
    if ((location.hash.slice(1) || '/').split('?')[0] !== '/') rerender();
  }).catch(() => {});
}

// ---- Blog ----
const remote = { posts: [], hidden: [], loaded: false, failed: false }, bodies = new Map();
let loading = null;
const defaultDescription = typeof document !== 'undefined' ? document.querySelector('meta[name="description"]')?.content || '' : '';
const setDescription = (text) => document.querySelector('meta[name="description"]')?.setAttribute('content', text || defaultDescription);

function loadIndex() {
  return loading ||= fetch('/api/content/blog').then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status))))).then((data) => {
    remote.posts = Array.isArray(data.posts) ? data.posts : [];
    remote.hidden = Array.isArray(data.hidden) ? data.hidden : [];
  }).catch(() => { remote.failed = true; }).finally(() => { remote.loaded = true; });
}

export function mergedPosts(remotePosts = remote.posts, hidden = remote.hidden) {
  const own = new Set(remotePosts.map((p) => p.slug));
  const dated = [...remotePosts].sort((a, b) => String(b.publishDate || b.updatedAt || '').localeCompare(String(a.publishDate || a.updatedAt || '')));
  const builtins = builtinPosts().filter((p) => !hidden.includes(p.slug));
  // Built-ins keep their place at the end, unless the owner edited one (then the edited copy is listed with the dated posts).
  return [...dated, ...builtins.filter((p) => !own.has(p.slug))];
}

const minutes = (post) => post.minutes || (post.body ? readingMinutes(post.body) : 3);
const cover = (post) => safeImage(post.cover || '') || '/assets/santorini.jpg';
const eyebrow = (post) => [post.category, `${minutes(post)} דקות קריאה`].filter(Boolean).map(esc).join(' · ');

function listHtml(posts, { footer, bread, heading }) {
  return `<div class="route-width">${bread('מדריכים')}${heading('קצת השראה, הרבה פחות התלבטויות', 'המדריכים של ג׳רבי טורס', 'רעיונות פשוטים לתכנון חופשה נוחה, אישית ובקצב הנכון.')}<div class="article-grid">${posts.map((p, i) => `<a class="article-card ${i === 0 ? 'featured' : ''}" href="#/blog/${esc(p.slug)}"><img src="${esc(cover(p))}" alt="" loading="lazy"><div><span class="eyebrow">${eyebrow(p)}</span><h2>${esc(p.title)}</h2><p>${esc(p.excerpt)}</p><b>ממשיכים לקרוא ←</b></div></a>`).join('')}</div></div>${footer}`;
}

function postHtml(post, { footer, bread }) {
  const tags = (post.tags || []).length ? `<p class="article-tags">${post.tags.map((t) => `<span class="understood-chip">${esc(t)}</span>`).join('')}</p>` : '';
  return `<div class="article-width">${bread('המדריכים של ג׳רבי טורס')}<a class="back-link" href="#/blog">→ לכל המדריכים</a><span class="eyebrow">${eyebrow(post)}</span><h1 tabindex="-1">${esc(post.title)}</h1>${post.excerpt ? `<p class="article-lead">${esc(post.excerpt)}</p>` : ''}<img class="article-cover" src="${esc(cover(post))}" alt="השראה לחופשה"><div class="article-body cms-body">${renderMarkdown(post.body)}${tags}<aside class="editor-note">המדריכים כוללים עקרונות תכנון כלליים. שירותים, מחירים ותנאי נסיעה ספציפיים דורשים בדיקה עדכנית לפני הזמנה.</aside></div><div class="article-cta"><h2>עכשיו הופכים רעיון לתוכנית</h2><a class="button yellow" href="#/planner">מתחילים עם ג׳רבי</a></div></div>${footer}`;
}

const notFoundHtml = ({ footer, heading }) => `<div class="article-width">${heading('הדף לא נמצא', 'נראה שלקחנו פנייה אחרת', 'אפשר לחזור לבלוג או לדף הבית.')}<div class="empty-panel"><h2>המדריך לא נמצא</h2><p>ייתכן שהוסר או שעדיין לא פורסם.</p><a class="button yellow" href="#/blog">לכל המדריכים</a></div></div>${footer}`;
const loadingHtml = ({ footer }) => `<div class="article-width"><p class="micro-copy" role="status">טוענים את המדריך…</p><h1 tabindex="-1" class="sr-only">המדריכים של ג׳רבי טורס</h1></div>${footer}`;

function setMeta(post) {
  // After the router's own title update (it runs right after the route returns).
  queueMicrotask(() => { document.title = `${post ? post.seoTitle || post.title : 'המדריכים של ג׳רבי טורס'} | ג׳רבי טורס`; setDescription(post ? post.seoDescription || post.excerpt : ''); });
}

export function cmsRoutes() {
  if (typeof window !== 'undefined') window.addEventListener('hashchange', () => { if (!location.hash.startsWith('#/blog/')) setDescription(''); });
  // An async re-render replaces the h1 the router focused; keep focus on the new heading (WCAG 2.4.3, spec 20).
  function refocus(paint) {
    const active = document.activeElement, had = !active || active === document.body || !active.isConnected || active.matches('#page-view h1');
    paint();
    const h = had && document.querySelector('#page-view h1');
    if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
  }
  function blog(args) {
    const path = (location.hash.slice(1) || '/').split('?')[0], slug = path.split('/')[2] || '';
    const still = () => (location.hash.slice(1) || '/').split('?')[0] === path;
    const view = args.view;
    if (!remote.loaded) loadIndex().then(() => { if (still()) { refocus(() => blog(args)); } });
    const posts = mergedPosts(), known = posts.find((p) => p.slug === slug);
    if (!slug) { view.innerHTML = listHtml(posts, args); setMeta(null); return; }
    if (!known) { view.innerHTML = remote.loaded ? notFoundHtml(args) : loadingHtml(args); if (remote.loaded) setMeta({ title: 'הדף לא נמצא' }); return; }
    if (known.builtin && !remote.posts.some((p) => p.slug === slug)) { view.innerHTML = postHtml(known, args); setMeta(known); return; }
    const full = bodies.get(slug);
    if (full) { view.innerHTML = postHtml(full, args); setMeta(full); return; }
    view.innerHTML = loadingHtml(args);
    fetch(`/api/content/blog/${encodeURIComponent(slug)}`).then((r) => (r.ok ? r.json() : null)).then((data) => {
      if (data?.post) bodies.set(slug, data.post);
      if (!still()) return;
      const post = data?.post || builtinPosts().find((p) => p.slug === slug);
      view.innerHTML = post ? postHtml(post, args) : notFoundHtml(args);
      setMeta(post || { title: 'הדף לא נמצא' });
      view.querySelector('h1')?.focus({ preventScroll: true });
    }).catch(() => { if (still()) view.innerHTML = notFoundHtml(args); });
  }
  return { blog };
}
