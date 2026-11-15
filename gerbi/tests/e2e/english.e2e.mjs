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
  // Interactive states: pickers, support bot (incl. an answer), planner chat, form validation, mobile menu.
  const en = lang === 'en';
  const states = [
    ['dates', '/', async () => { await page.click('#dates-button'); }],
    ['travelers', '/', async () => { await page.click('#travelers-button'); }],
    ['place-list', '/', async () => { await page.fill('#destination', en ? 'lo' : 'לו'); }],
    ['support-bot', '/', async () => { await page.click('.sb-launcher'); }],
    ['support-answer', '/', async () => { await page.click('.sb-launcher'); await page.waitForTimeout(300); await page.keyboard.type(en ? 'How much luggage can I take?' : 'כמה מזוודות מותר?'); await page.keyboard.press('Enter'); await page.waitForTimeout(1200); }],
    ['planner-chat', '/planner', async () => { await page.fill('#page-chat-input', en ? 'from Tel Aviv to Rome in June, 2 adults 1 child 5 nights' : 'מתל אביב לרומא ביוני, 2 מבוגרים וילד, 5 לילות'); await page.click('#page-chat-form button[type=submit], #page-chat-form button'); await page.waitForTimeout(1500); }],
    ['contact-invalid', '/contact', async () => { await page.click('form.lead-form [type=submit]'); }],
    ['tailor-invalid', '/tailor-made', async () => { await page.click('form.lead-form [type=submit]'); }],
    ['signup-invalid', '/account', async () => { await page.click('#signup-form [type=submit], #login-form [type=submit]'); }],
    ['multi-city', '/', async () => { await page.check('[name=trip-type][value=multi]', { force: true }); }],
    ...(width < 700 ? [['mobile-menu', '/', async () => { await page.click('#mobile-menu-button'); }]] : [])
  ];
  if (process.env.LIVE) states.push(['live-results', '/', async () => {
    await page.fill('#destination', en ? 'Rome' : 'רומא');
    await page.click('#dates-button'); await page.fill('#start-date', '2027-03-10'); await page.fill('#end-date', '2027-03-15'); await page.click('#date-form button');
    await page.click('.search-submit');
    await page.waitForSelector('#live-results:not([hidden]) .flight-card, #live-results:not([hidden]) .empty-panel', { timeout: 60000 });
    await page.waitForTimeout(800);
  }], ['price-check', '/', async () => {
    await page.fill('#destination', en ? 'Rome' : 'רומא');
    await page.click('#dates-button'); await page.fill('#start-date', '2027-03-10'); await page.fill('#end-date', '2027-03-15'); await page.click('#date-form button');
    await page.click('.search-submit');
    await page.waitForSelector('#live-results:not([hidden]) .flight-card', { timeout: 60000 });
    await page.locator('.flight-card').first().locator('[data-volero-offer]').click();
    await page.waitForSelector('#modal[open]', { timeout: 60000 }); await page.waitForTimeout(2500);
  }]);
  for (const [state, path, act] of states) {
    await page.goto(`${BASE}${root}#${path}`, { waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(400);
    try { await act(); } catch (e) { results.push({ lang, width, route: `state:${state}`, failed: String(e.message).slice(0, 120) }); continue; }
    await page.waitForTimeout(400);
    const r = await page.evaluate(scan);
    await page.screenshot({ path: `${OUT}/${lang}-${width}-state-${state}.png`, fullPage: state === 'live-results' && width >= 700 });
    results.push({ lang, width, route: `state:${state}`, ...r, errors: errors.splice(0) });
  }
  await context.close();
}
// Language switch: keeps the inner route, is remembered for a bare homepage visit, never redirects an inner Hebrew link.
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const check = (name, ok, detail) => results.push({ lang: 'switch', width: 1440, route: `switch:${name}`, failed: ok ? undefined : detail, overflow: 0, hebrew: [], keys: [] });
  await page.goto(`${BASE}/#/contact`, { waitUntil: 'load' });
  await Promise.all([page.waitForURL(/\/en\/#\/contact$/), page.click('.header-actions .lang-switch')]);
  check('keeps-route', page.url().endsWith('/en/#/contact'), page.url());
  await page.goto(`${BASE}/`, { waitUntil: 'load' }); await page.waitForTimeout(300);
  check('remembered', new URL(page.url()).pathname === '/en/', page.url());
  await page.goto(`${BASE}/#/destinations`, { waitUntil: 'load' }); await page.waitForTimeout(300);
  check('inner-link-stays-hebrew', new URL(page.url()).pathname === '/' && (await page.evaluate(() => document.documentElement.lang)) === 'he', page.url());
  await Promise.all([page.waitForURL(/\/en\/#\/destinations$/), page.click('.header-actions .lang-switch')]);
  await Promise.all([page.waitForURL((u) => new URL(u).pathname === '/'), page.click('.header-actions .lang-switch')]);
  await page.goto(`${BASE}/`, { waitUntil: 'load' }); await page.waitForTimeout(300);
  check('back-to-hebrew-remembered', new URL(page.url()).pathname === '/', page.url());
  const head = await (await fetch(`${BASE}/en/`)).text();
  check('server-en-head', /<html lang="en" dir="ltr">/.test(head) && /hreflang="he"/.test(head) && /<title[^>]*>Gerbi Tours/.test(head), head.slice(0, 200));
  await context.close();
}
await browser.close();

const problems = results.filter((r) => r.failed || r.overflow > 1 || r.keys?.length || r.errors?.length || (r.lang === 'en' && (r.hebrew.length || r.dir !== 'ltr')) || (r.lang === 'he' && r.dir !== 'rtl'));
await writeFile(`${OUT}/report.json`, JSON.stringify({ base: BASE, checked: results.length, problems: problems.length, results }, null, 1));
for (const p of problems) console.log(`✖ ${p.lang} ${p.width} ${p.route}`, JSON.stringify({ failed: p.failed, overflow: p.overflow > 1 ? p.overflow : undefined, dir: p.dir, hebrew: p.lang === 'en' ? p.hebrew?.slice(0, 6) : undefined, keys: p.keys?.slice(0, 4), errors: p.errors?.slice(0, 2) }));
console.log(`${results.length} page states checked, ${problems.length} with problems → ${OUT}/report.json`);
process.exitCode = problems.length ? 1 : 0;
