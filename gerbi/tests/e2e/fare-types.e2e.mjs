// Branded fares (one card per itinerary, fare-type switcher), route direction (origin on the reading start) and the
// loading animation of the search and the offer check. LIVE search (no booking). W=390 for phone width, /en/ with EN=1.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const OUT = process.env.OUT || 'verification/flights-2026-11-23', base = process.env.BASE_URL || 'http://localhost:4173', W = Number(process.env.W || 1440);
const EN = process.env.EN === '1', TO = process.env.TO || 'ATH', tag = `${EN ? 'en' : 'he'}-${W}`;
const browser = await chromium.launch(); const page = await (await browser.newContext({ viewport: { width: W, height: 1000 } })).newPage();
const errors = []; page.on('pageerror', e => errors.push(e.message)); const log = (...a) => console.log(...a);
const fails = []; const check = (ok, what) => { log(ok ? 'ok  ' : 'FAIL', what); if (!ok) fails.push(what); };
const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
// The offer check is slowed down by 4s so the loading state can be looked at (the request itself is the real one).
await page.route('**/api/volero/flights/availability', async route => { await new Promise(r => setTimeout(r, 4000)); await route.continue(); });
await page.route('**/api/volero/flights/search', async route => { await new Promise(r => setTimeout(r, 1500)); await route.continue(); });
await page.goto(base + (EN ? '/en/' : '/') + `#/?from=TLV&to=${TO}&depart=${day(40)}&return=${day(45)}&adults=2`); await page.waitForTimeout(400);
await page.locator('.search-submit').click();
await page.waitForSelector('#search-feedback .route-loader', { timeout: 5000 });
const loader = page.locator('#search-feedback .route-loader');
const pos = async sel => (await loader.locator(sel).boundingBox())?.x ?? NaN;
check(EN ? await pos('.rl-from') < await pos('.rl-to') : await pos('.rl-from') > await pos('.rl-to'), `search loader: origin on the ${EN ? 'left' : 'right'}`);
await page.locator('#search-feedback').screenshot({ path: `${OUT}/search-loader-${tag}.png` });
await page.waitForSelector('#live-results:not([hidden]) .flight-card', { timeout: 60000 });
const cards = await page.locator('.flight-card').count(), switchers = await page.locator('.flight-card .fare-switch').count();
log('cards:', cards, '| cards with fare types:', switchers);
// One card per itinerary: no two cards with the same itinerary key.
const keys = await page.locator('.flight-card').evaluateAll(list => list.map(c => c.dataset.itinerary));
check(new Set(keys).size === keys.length, 'one card per itinerary');
// Direction: first route row, origin end vs destination end.
const row = page.locator('.flight-card .fc-route').first();
const fx = (await row.locator('.fc-from').boundingBox()).x, tx = (await row.locator('.fc-to').boundingBox()).x;
check(EN ? fx < tx : fx > tx, `card route: origin on the ${EN ? 'left' : 'right'}`);
if (switchers) {
  const card = page.locator('.flight-card').filter({ has: page.locator('.fare-switch') }).first();
  await card.scrollIntoViewIfNeeded();
  const before = await card.locator('.flight-price strong').innerText(), offerBefore = await card.locator('[data-volero-offer]').getAttribute('data-volero-offer');
  log('fare options:', (await card.locator('.fare-option').allInnerTexts()).slice(0, 4).map(t => t.replace(/\s+/g, ' ')));
  check(await card.locator('.fare-option').first().locator('input').isChecked(), 'cheapest fare chosen by default');
  check((await card.locator('.fare-option').first().innerText()).includes(EN ? 'Lowest' : 'הכי זול'), 'cheapest marked');
  await card.screenshot({ path: `${OUT}/fare-card-${tag}.png` });
  const id = await card.getAttribute('data-offer-card');
  await card.locator('.fare-option').nth(1).click();
  const again = page.locator(`[data-offer-card="${id}"]`);
  const after = await again.locator('.flight-price strong').innerText(), offerAfter = await again.locator('[data-volero-offer]').getAttribute('data-volero-offer');
  check(offerAfter !== offerBefore && after !== before, `switch fare: offer ${offerBefore.slice(0, 6)} → ${offerAfter.slice(0, 6)}, price ${before} → ${after}`);
  check(await again.locator('.fare-option').nth(1).locator('input').isChecked(), 'switched fare stays selected after re-render');
  await again.screenshot({ path: `${OUT}/fare-card-switched-${tag}.png` });
  // The check uses the chosen fare.
  const req = page.waitForRequest('**/api/volero/flights/availability');
  await again.locator('[data-volero-offer]').click();
  const body = JSON.parse((await req).postData());
  check(body.offerIndex === offerAfter, 'availability check sends the chosen fare');
  await page.waitForSelector('#modal[open] .bp-stub .route-loader');
  const m = page.locator('#modal .route-loader');
  const mf = (await m.locator('.rl-from').boundingBox()).x, mt = (await m.locator('.rl-to').boundingBox()).x;
  check(EN ? mf < mt : mf > mt, 'pass loader: origin at the reading start');
  await page.waitForTimeout(1900);
  await page.locator('#modal').screenshot({ path: `${OUT}/check-loader-${tag}.png` });
  await page.waitForSelector('#modal[open] [data-close-availability]', { timeout: 60000 });
  log('pass sub:', await page.locator('#modal .bp-sub').innerText());
  await page.locator('[data-close-availability]').first().click();
  check(await page.locator(`[data-offer-card="${id}"] .verified-stamp`).count() === 1, 'verified stamp on the switched fare');
  // Compare keeps the chosen fare.
  await page.locator(`[data-offer-card="${id}"] [data-compare-offer]`).check();
  const other = await page.locator('.flight-card').evaluateAll((list, id) => list.find(c => c.dataset.offerCard !== id).dataset.offerCard, id);
  await page.locator(`[data-offer-card="${other}"] [data-compare-offer]`).check();
  await page.locator('[data-open-compare]').click(); await page.waitForSelector('.flight-compare');
  log('compare fare row:', (await page.locator('.flight-compare tbody tr').allInnerTexts()).map(t => t.replace(/\s+/g, ' ')).find(t => /סוג כרטיס|Fare type/.test(t)) || '-');
  await page.locator('#modal .modal-close').click();
}
// Sort by price still works with grouped cards.
await page.locator('#flight-sort').selectOption('price');
log('price order:', (await page.locator('.flight-card .flight-price strong').allInnerTexts()).slice(0, 6).join(' · '));
check(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 0, 'no horizontal page scroll');
check(!errors.length, 'no page errors ' + errors.join(' | '));
log(fails.length ? `FAILED ${fails.length}` : 'ALL PASS'); await browser.close(); process.exit(fails.length ? 1 : 0);
