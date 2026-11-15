// Spec 21: every public route in Hebrew and English at 1440 and 375. Reports horizontal overflow, Hebrew characters
// left on English pages (text + aria-label/placeholder/title/alt; owner content marked lang="he" is allowed),
// untranslated dictionary keys ("app.results.title" shown as text), and lang/dir. Screenshots: verification/21-english/.
//   PLAYWRIGHT_MODULE=… BASE_URL=http://127.0.0.1:4188 node tests/e2e/english.e2e.mjs
// Optional: WIDTHS=375  ROUTES=/,/contact  LANGS=en  LIVE=1 (adds a live flight search + results in both languages).
import { mkdir, writeFile } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const BASE = process.env.BASE_URL || 'http://localhost:4173';
const OUT = process.env.OUT || 'verification/21-english';
const WIDTHS = (process.env.WIDTHS || '1440,375').split(',').map(Number);
const LANGS = (process.env.LANGS || 'he,en').split(',');
const ROUTES = process.env.ROUTES ? process.env.ROUTES.split(',') : ['/', '/destinations', '/destination/rome', '/inspiration', '/planner', '/results', '/trip/rome', '/compare', '/blog', '/blog/__first', '/favorites', '/account', '/contact', '/tailor-made', '/support', '/converter', '/privacy', '/terms', '/accessibility', '/no-such-page'];
await mkdir(OUT, { recursive: true });

const scan = () => {
  const HE = /[֐-׿]/, KEY = /\b(core|home|app|search|pages|content|account|leads|support|ai|cms|planner)\.[a-z][\w-]*(\.[\w-]+)*\b/;
  const shown = (el) => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && !el.closest('[hidden]'); };
  const allowed = (el) => !!el.closest('[lang="he"], [data-allow-hebrew]');
  const hebrew = [], keys = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const text = n.textContent.trim(), el = n.parentElement;
    if (!text || !el || el.closest('script, style, svg, template') || !shown(el)) continue;
    if (HE.test(text) && !allowed(el)) hebrew.push(text.slice(0, 80));
    if (KEY.test(text)) keys.push(text.slice(0, 80));
  }
  for (const el of document.querySelectorAll('[aria-label], [placeholder], [title], img[alt], input[value]:not([type=hidden])')) {
    if (allowed(el) || (!shown(el) && !el.matches('img'))) continue;
    for (const attr of ['aria-label', 'placeholder', 'title', 'alt', 'value']) {
      const v = el.getAttribute(attr) || '';
      if (HE.test(v)) hebrew.push(`@${attr}: ${v.slice(0, 60)}`);
      if (KEY.test(v)) keys.push(`@${attr}: ${v.slice(0, 60)}`);
    }
  }
  if (HE.test(document.title)) hebrew.push(`<title>: ${document.title}`);
  return { lang: document.documentElement.lang, dir: document.documentElement.dir, title: document.title, overflow: document.documentElement.scrollWidth - window.innerWidth, hebrew: [...new Set(hebrew)], keys: [...new Set(keys)] };
};

const browser = await chromium.launch();
const results = [];
for (const width of WIDTHS) for (const lang of LANGS) {
  const context = await browser.newContext({ viewport: { width, height: width < 700 ? 812 : 900 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message || e)));
  const root = lang === 'en' ? '/en/' : '/';
  let first = '';
  for (const route of ROUTES) {
    let path = route;
    if (route === '/blog/__first') {
      if (!first) { await page.goto(`${BASE}${root}#/blog`); await page.waitForTimeout(600); first = await page.$eval('.article-card', (a) => a.getAttribute('href')).catch(() => '#/blog'); }
      path = first.slice(1);
    }
    await page.goto(`${BASE}${root}#${path}`, { waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(500);
    const r = await page.evaluate(scan);
    const name = `${lang}-${width}-${route.replace(/\W+/g, '_') || 'home'}`;
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: width < 700 ? false : true });
    results.push({ lang, width, route, ...r, errors: errors.splice(0) });
  }
  // Interactive states on the home page: date picker, travelers, support bot, mobile menu.
  const states = [
    ['dates', async () => { await page.click('#dates-button'); }],
    ['travelers', async () => { await page.click('#travelers-button'); }],
    ['place-list', async () => { await page.fill('#destination', lang === 'en' ? 'lo' : 'לו'); }],
    ['support-bot', async () => { await page.click('.sb-launcher'); }],
    ...(width < 700 ? [['mobile-menu', async () => { await page.click('#mobile-menu-button'); }]] : [])
  ];
  for (const [state, act] of states) {
    await page.goto(`${BASE}${root}`, { waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(300);
    try { await act(); } catch (e) { results.push({ lang, width, route: `state:${state}`, failed: String(e.message).slice(0, 120) }); continue; }
    await page.waitForTimeout(400);
    const r = await page.evaluate(scan);
    await page.screenshot({ path: `${OUT}/${lang}-${width}-state-${state}.png` });
    results.push({ lang, width, route: `state:${state}`, ...r, errors: errors.splice(0) });
  }
  if (process.env.LIVE) {
    await page.goto(`${BASE}${root}`, { waitUntil: 'networkidle' });
    await page.fill('#destination', lang === 'en' ? 'Rome' : 'רומא');
    await page.keyboard.press('Enter').catch(() => {});
    await page.click('#dates-button');
    await page.waitForTimeout(300);
    const days = await page.$$('.dp-grid button:not([disabled])');
    if (days.length > 30) { await days[20].click(); await days[25].click(); }
    await page.keyboard.press('Escape').catch(() => {});
    await page.click('.search-submit');
    await page.waitForSelector('#live-results:not([hidden]) .live-offer, #live-results:not([hidden]) .search-error, #live-results:not([hidden]) [role=alert]', { timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(800);
    const r = await page.evaluate(scan);
    await page.screenshot({ path: `${OUT}/${lang}-${width}-state-live-results.png`, fullPage: width >= 700 });
    results.push({ lang, width, route: 'state:live-results', ...r, errors: errors.splice(0) });
  }
  await context.close();
}
await browser.close();

const problems = results.filter((r) => r.failed || r.overflow > 1 || r.keys?.length || r.errors?.length || (r.lang === 'en' && (r.hebrew.length || r.dir !== 'ltr')) || (r.lang === 'he' && r.dir !== 'rtl'));
await writeFile(`${OUT}/report.json`, JSON.stringify({ base: BASE, checked: results.length, problems: problems.length, results }, null, 1));
for (const p of problems) console.log(`✖ ${p.lang} ${p.width} ${p.route}`, JSON.stringify({ failed: p.failed, overflow: p.overflow > 1 ? p.overflow : undefined, dir: p.dir, hebrew: p.lang === 'en' ? p.hebrew?.slice(0, 6) : undefined, keys: p.keys?.slice(0, 4), errors: p.errors?.slice(0, 2) }));
console.log(`${results.length} page states checked, ${problems.length} with problems → ${OUT}/report.json`);
process.exitCode = problems.length ? 1 : 0;
