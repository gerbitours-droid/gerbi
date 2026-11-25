// Spec 23: the destinations catalog in a real browser, Hebrew + English at 1440 and 375 (no supplier calls).
// Checks the "only Greece" regression (a Greek planner request must not collapse the home showcase), the destinations
// page (70 destinations, filters, search, "show more", URL state survives reload), the destination page (catalog
// sections + CTAs), inspiration, favorites/compare of a catalog-only destination, and horizontal overflow.
//   PLAYWRIGHT_MODULE=… BASE_URL=http://127.0.0.1:4191 node tests/e2e/destinations.e2e.mjs
// Screenshots: verification/23-destinations/ (OUT= to change).
import { mkdir } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const BASE = process.env.BASE_URL || 'http://localhost:4173';
const OUT = process.env.OUT || 'verification/23-destinations';
const WIDTHS = (process.env.WIDTHS || '1440,375').split(',').map(Number);
const LANGS = (process.env.LANGS || 'he,en').split(',');
await mkdir(OUT, { recursive: true });
const log = (...a) => console.log(...a);
const overflow = () => { const vw = document.documentElement.clientWidth; return [...document.querySelectorAll('body *')].filter((el) => { const r = el.getBoundingClientRect(); return r.width && (r.right > vw + 1 || r.left < -1) && getComputedStyle(el).position !== 'fixed' && !el.closest('.cards, .deals-strip, .dest-chips, .filter-chips, [data-scroller], .ds-track, .sb-chips'); }).slice(0, 3).map((el) => el.tagName + '.' + el.className); };
const browser = await chromium.launch();
let failures = 0;
const check = (ok, msg) => { if (!ok) { failures++; console.log('  ✗', msg); } else console.log('  ✓', msg); };
for (const lang of LANGS) for (const width of WIDTHS) {
  const root = BASE + (lang === 'en' ? '/en/' : '/');
  const tag = `${lang}-${width}`;
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('response', (r) => { if (r.status() >= 400 && r.url().includes('/assets/')) errors.push(`${r.status()} ${r.url()}`); });
  log(`\n== ${tag}`);
  // 1) "Only Greece" regression: a Greek planner request, then home.
  await page.goto(root + '#/planner'); await page.waitForSelector('#page-chat-input');
  await page.fill('#page-chat-input', lang === 'en' ? 'A couples holiday in Greece in August' : 'חופשה זוגית ביוון באוגוסט');
  await page.click('#page-chat-form button'); await page.waitForTimeout(500);
  await page.goto(root + '#/'); await page.waitForSelector('#cards .card');
  const home = await page.$$eval('#cards .card h3', (a) => a.map((x) => x.textContent));
  log('  home:', home.join(' | '));
  check(home.length === 8, 'home showcase has 8 destinations');
  check(home.filter((x) => /יוון|Greece|סנטוריני|Santorini|כרתים|Crete|אתונה|Athens/.test(x)).length <= 2, 'Greek request leads but does not take over the showcase');
  await page.$eval('#deals', (el) => el.scrollIntoView()); await page.waitForTimeout(400);
  await page.locator('#deals').screenshot({ path: `${OUT}/home-showcase-${tag}.png` });
  // 2) Destinations page.
  await page.goto(root + '#/destinations'); await page.waitForSelector('.dest-card');
  const count = await page.locator('#destination-count').innerText();
  log('  list:', count, '| cards', await page.locator('.dest-card').count());
  check(/70/.test(count) && await page.locator('.dest-card').count() === 12, '70 destinations, first 12 shown');
  await page.screenshot({ path: `${OUT}/destinations-${tag}.png`, fullPage: false });
  await page.click('[data-catalog-view="list"]');
  check(await page.locator('#destination-grid').getAttribute('data-layout') === 'list', 'list view changes the existing result cards');
  await page.reload();
  await page.waitForSelector('.dest-card');
  check(await page.locator('[data-catalog-view="list"]').getAttribute('aria-pressed') === 'true', 'list view survives reload');
  await page.screenshot({ path: `${OUT}/destinations-list-${tag}.png`, fullPage: false });
  await page.click('[data-catalog-view="grid"]');
  await page.click('#more-destinations'); await page.waitForTimeout(200);
  check(await page.locator('.dest-card').count() === 24, '"show more" adds 12');
  const filters = page.locator('.catalog-filters');
  if (!(await filters.evaluate(el => el.open))) await filters.locator('summary').click();
  await page.click('[data-chip-region="asia"]'); await page.waitForTimeout(200);
  await page.selectOption('[data-filter="month"]', '1');
  await page.click('[data-chip-style="beach"]'); await page.waitForTimeout(200);
  const asia = await page.$$eval('.dest-card h2', (a) => a.map((x) => x.textContent));
  log('  asia+beach+Jan:', asia.join(' | '), '|', page.url().split('#')[1]);
  check(asia.length > 0 && asia.length < 10, 'region + style + month filters combine');
  await page.reload(); await page.waitForSelector('.dest-card');
  check(await page.locator('[data-chip-region="asia"]').getAttribute('aria-pressed') === 'true' && await page.locator('.dest-card').count() === asia.length, 'filters survive a reload (URL state)');
  await page.screenshot({ path: `${OUT}/destinations-filtered-${tag}.png`, fullPage: false });
  await page.click('#reset-filters'); await page.waitForTimeout(150);
  await page.fill('#destination-filter input', lang === 'en' ? 'Japan' : 'יפן'); await page.click('#destination-filter button'); await page.waitForTimeout(200);
  check(await page.locator('.dest-card').count() === 1, 'search finds Japan');
  check((await page.evaluate(overflow)).length === 0, `no horizontal overflow on the list ${JSON.stringify(await page.evaluate(overflow))}`);
  // 3) Destination page (catalog-only) + favorite + compare.
  await page.goto(root + '#/destination/japan'); await page.waitForSelector('.dest-cta');
  const sections = await page.$$eval('.detail-layout h2', (a) => a.length);
  const ctas = await page.$$eval('.dest-cta a', (a) => a.map((x) => x.getAttribute('href')));
  log('  japan sections:', sections, '| ctas:', ctas.join(' '));
  check(ctas.includes('#/?to=TYO') && ctas.includes('#/build?dest=japan') && ctas.includes('#/tailor-made?dest=japan'), 'CTAs: flights, builder, tailor-made');
  check(await page.locator('.dest-attractions li').count() >= 8 && await page.locator('.dest-months li.best').count() > 0, 'attractions + best months shown');
  check(await page.locator('.photo-credit').count() === 1, 'photo credit shown');
  await page.screenshot({ path: `${OUT}/destination-japan-${tag}.png`, fullPage: true });
  await page.click('.dest-hero [data-page-favorite]'); await page.waitForTimeout(100);
  await page.goto(root + '#/favorites'); await page.waitForSelector('.dest-card');
  check((await page.$$eval('.dest-card h2', (a) => a.map((x) => x.textContent))).some((x) => /יפן|Japan/.test(x)), 'catalog-only destination saved to favorites');
  await page.check('[data-compare="japan"]');
  await page.goto(root + '#/destination/rome'); await page.waitForSelector('.dest-demo');
  check(await page.locator('.destination-guide dt').count() === 6 && await page.locator('.dest-demo .big-price').count() === 1, 'demo trip destination keeps its guide + sample package');
  await page.goto(root + '#/destinations?q=' + encodeURIComponent(lang === 'en' ? 'Rome' : 'רומא')); await page.waitForSelector('.dest-card');
  await page.check('[data-compare="rome"]');
  await page.goto(root + '#/compare'); await page.waitForSelector('.compare-column');
  check(await page.locator('.compare-column').count() === 2, 'compare a catalog destination with a demo trip');
  await page.screenshot({ path: `${OUT}/compare-${tag}.png`, fullPage: false });
  // 4) Flights CTA fills the search form.
  await page.goto(root + '#/?to=TYO'); await page.waitForTimeout(500);
  check(/TYO/.test(await page.inputValue('#destination')), 'flights CTA fills the destination field');
  // 5) Inspiration.
  await page.goto(root + '#/inspiration'); await page.waitForSelector('.dest-insp-grid .inspiration-tile');
  check(await page.locator('.dest-insp-grid .inspiration-tile').count() === 8 && await page.locator('.dest-card').count() === 6, 'inspiration: 8 style tiles + 6 seasonal picks');
  check((await page.evaluate(overflow)).length === 0, 'no horizontal overflow on inspiration');
  await page.screenshot({ path: `${OUT}/inspiration-${tag}.png`, fullPage: false });
  check(errors.length === 0, `no page errors / missing images ${errors.slice(0, 3).join(' ; ')}`);
  await page.close();
}
await browser.close();
console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed');
process.exitCode = failures ? 1 : 0;
