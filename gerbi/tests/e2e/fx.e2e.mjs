// Spec 13 browser check: ₪ prices, original currency, sort, compare, converter, saved flights, and the no-rate fallback.
// Run from gerbi/: PLAYWRIGHT_MODULE=… BASE_URL=http://localhost:4181 W=375 [NOFX=1] [LIVE=1] node tests/e2e/fx.e2e.mjs
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const OUT = process.env.OUT || 'verification/13-pricing', base = process.env.BASE_URL || 'http://localhost:4173';
const W = Number(process.env.W || 1440), LIVE = process.env.LIVE === '1';
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: W, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'] });
const page = await context.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
const log = (...a) => console.log(...a);
const names = { LY: 'El Al', W6: 'Wizz Air', A3: 'Aegean' };
const seg = (key, from, to, date, dep, arr, code) => ({ key, departure: { airport: { code: from }, date, time: dep }, arrival: { airport: { code: to }, date, time: arr }, marketingCarrier: { airline: { code, name: names[code] }, flightNumber: '315' } });
const mk = (i, value, currency) => ({ index: i, fareDetails: { totalPrice: { selling: { value, currency } } }, flightsOverview: [{ flightReferences: ['f' + i + 'a', 'f' + i + 'b'] }] });
const carriers = ['LY', 'W6', 'A3', 'LY'];
const fixture = { srk: 'fx', tokens: { searchResults: 'fx' }, offers: [mk(1, 812.4, 'USD'), mk(2, 699.9, 'EUR'), mk(3, 905, 'USD'), mk(4, 2650, 'ILS')],
  dataLists: { flightList: [1, 2, 3, 4].flatMap(i => [{ key: 'f' + i + 'a', segmentReferences: ['s' + i + 'a'], flightDetails: { duration: '05:' + (10 + i) } }, { key: 'f' + i + 'b', segmentReferences: ['s' + i + 'b'], flightDetails: { duration: '05:' + (30 + i) } }]),
    flightSegmentList: [1, 2, 3, 4].flatMap(i => [seg('s' + i + 'a', 'TLV', 'LHR', '2027-06-10', '0' + (5 + i) + ':00', '1' + i + ':00', carriers[i - 1]), seg('s' + i + 'b', 'LHR', 'TLV', '2027-06-15', '1' + i + ':00', '2' + i + ':00', carriers[i - 1])]) } };
const deal = (destination, value, currency, carrier, stops) => ({ origin: 'TLV', destination, depart: '2026-11-29', back: '2026-12-03', price: { value, currency }, carrier, stops, airports: [] });
if (!LIVE) await context.route('**/api/deals', r => r.fulfill({ json: { deals: [deal('ATH', 142.5, 'USD', 'Aegean', 0), deal('LON', 219, 'USD', 'Wizz Air', 0), deal('PAR', 199, 'EUR', 'Transavia', 0), deal('LCA', 89, 'USD', 'Tus Airways', 0)], updatedAt: new Date(Date.now() - 2 * 3600e3).toISOString(), stale: false, refreshing: false } }));
if (!LIVE) { await context.route('**/api/volero/flights/search', r => r.fulfill({ json: { data: fixture } })); await context.route('**/api/volero/flights/availability', r => r.fulfill({ json: { data: { pricedOffer: fixture.offers[0] } } })); }
if (process.env.NOFX === '1') await context.route('**/api/fx', r => r.fulfill({ status: 200, json: { ok: false, error: 'fx_unavailable', rates: null } }));
const tag = `${process.env.NOFX === '1' ? 'nofx-' : ''}${LIVE ? 'live-' : ''}${W}`;
await page.goto(base + '/#/');
const fx = await page.evaluate(() => fetch('/api/fx').then(r => r.json()).catch(() => null)); log('fx', fx?.source, fx?.asOf, fx?.rates?.USD);
await page.waitForTimeout(3000);
const deals = await page.locator('#fare-deals').isVisible(); log('deals visible', deals);
if (deals) { log('deal 1:', (await page.locator('.fare-deal').first().innerText()).replace(/\n+/g, ' / ')); log('deals head:', await page.locator('.fare-deals-head p').innerText()); await page.locator('#fare-deals').scrollIntoViewIfNeeded(); await page.screenshot({ path: `${OUT}/deals-${tag}.png` }); }
await page.locator('#destination').fill('לונדון'); await page.keyboard.press('Escape');
await page.locator('#dates-button').click(); await page.locator('#start-date').fill('2027-06-10'); await page.locator('#end-date').fill('2027-06-15'); await page.locator('#date-form button').click();
await page.locator('.search-submit').click(); await page.waitForSelector('#live-results .flight-card', { timeout: 90000 });
await page.waitForTimeout(800);
log('status:', await page.locator('#live-results [role=status]').first().innerText());
log('fx line:', await page.locator('.fx-line').innerText().catch(() => '-'));
log('first card price:', (await page.locator('.flight-card .flight-price').first().innerText()).replace(/\n+/g, ' / '));
await page.locator('#live-results').scrollIntoViewIfNeeded(); await page.screenshot({ path: `${OUT}/results-${tag}.png` });
const sortDisabled = await page.evaluate(() => document.querySelector('#flight-sort option[value=price]').disabled);
if (!sortDisabled) { await page.selectOption('#flight-sort', 'price'); await page.waitForTimeout(300); }
const prices = await page.locator('.flight-card .flight-price strong').allInnerTexts(); log('order:', prices.slice(0, 6).join(' | '), '| price sort disabled?', sortDisabled);
await page.locator('.flight-card').first().scrollIntoViewIfNeeded(); await page.screenshot({ path: `${OUT}/results-sorted-${tag}.png` });
const checks = page.locator('[data-compare-offer]'); await checks.nth(0).check(); await checks.nth(1).check(); if (await checks.count() > 2) await checks.nth(2).check();
await page.locator('[data-open-compare]').click(); await page.waitForSelector('.flight-compare');
log('compare price row:', (await page.locator('.flight-compare tbody tr').first().innerText()).replace(/\s+/g, ' '));
await page.screenshot({ path: `${OUT}/compare-${tag}.png` }); await page.locator('#modal .modal-close').click();
await page.locator('[data-open-converter]').click(); await page.waitForSelector('#modal [data-fx-converter]');
await page.locator('#fx-modal-amount').fill('250'); await page.selectOption('#fx-modal-currency', 'EUR'); await page.waitForTimeout(200);
log('converter modal:', (await page.locator('#modal .fx-result').innerText()).replace(/\n+/g, ' / '), '|', await page.locator('#modal .fx-note').innerText());
await page.screenshot({ path: `${OUT}/converter-modal-${tag}.png` }); await page.locator('#modal .modal-close').click();
if (!LIVE || process.env.VERIFY === '1') {
  await page.locator('.flight-card').first().locator('[data-volero-offer]').click(); await page.waitForSelector('[data-save-flight]', { timeout: 60000 });
  log('verify modal price:', (await page.locator('.verified-price').innerText()).replace(/\n+/g, ' / '));
  await page.screenshot({ path: `${OUT}/verify-${tag}.png` });
  await page.locator('[data-save-flight]').click(); await page.locator('#save-flight-status a[href="#/account"]').click(); await page.waitForSelector('.saved-flight');
  log('saved:', (await page.locator('.saved-flight').first().innerText()).replace(/\n+/g, ' / ').slice(0, 400));
  await page.locator('.saved-flight').first().scrollIntoViewIfNeeded(); await page.screenshot({ path: `${OUT}/saved-${tag}.png` });
  await page.locator('[data-copy-flight]').first().click().catch(() => {}); await page.waitForTimeout(200);
  log('copied:', (await page.evaluate(() => navigator.clipboard.readText()).catch(() => '')).split('\n').slice(-1)[0]);
}
await page.goto(base + '/#/converter'); await page.waitForSelector('#fx-page-amount'); await page.waitForTimeout(400);
log('converter page default:', (await page.locator('.fx-result').innerText()).replace(/\n+/g, ' / '), '| note:', await page.locator('.fx-converter .fx-note').innerText());
await page.locator('#fx-page-amount').fill('abc'); log('invalid:', await page.locator('.fx-error').innerText());
await page.locator('#fx-page-amount').fill('1,250.50'); log('1,250.50 USD:', await page.locator('.fx-result output').innerText());
await page.screenshot({ path: `${OUT}/converter-page-${tag}.png`, fullPage: true });
log('footer link:', await page.locator('footer a[href="#/converter"]').count());
log('Volero in UI:', (await page.evaluate(() => document.body.innerText)).includes('Volero'));
log('errors:', errors.length ? errors : 'none');
await browser.close();
