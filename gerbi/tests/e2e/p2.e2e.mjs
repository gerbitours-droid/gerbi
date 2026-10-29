const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const OUT = process.env.OUT || 'verification/e2e', base = process.env.BASE_URL || 'http://localhost:4173', W = Number(process.env.W || 1440);
const browser = await chromium.launch(); const context = await browser.newContext({ viewport: { width: W, height: 1000 } }); const page = await context.newPage();
const errors = []; page.on('pageerror', e => errors.push(e.message)); const log = (...a) => console.log(...a);
await page.goto(base + '/#/');
await page.locator('#dates-button').click(); await page.locator('#start-date').fill('2027-06-10'); await page.locator('#end-date').fill('2027-06-15'); await page.locator('#date-form button').click();
await page.locator('#destination').fill('Rome'); await page.locator('.search-submit').click();
await page.waitForSelector('#live-results .flight-card', { timeout: 60000 });
const status = () => page.locator('#live-results [role=status]').first().innerText();
log('header:', await page.locator('.live-heading p').innerText(), '| photos in cards:', await page.locator('.flight-card img').count());
log('status:', await status());
if (W < 800) await page.locator('#flight-filters summary').click();
await page.locator('[data-filter="stops"][data-value="0"]').click(); log('direct:', await status());
await page.locator('[data-filter="checkedBag"]').click(); log('direct+bag:', await status(), '| chips:', await page.locator('.filter-chips .filter-chip').allInnerTexts());
await page.locator('.filter-chip').first().click(); log('removed stops chip:', await status());
await page.locator('[data-clear-filters]').click(); log('cleared:', await status());
// F03: open details on card 2, add more, sort – stays open
await page.locator('.flight-card').nth(1).locator('details.flight-segments summary').first().click();
const key = await page.locator('.flight-card').nth(1).locator('details.flight-segments').first().getAttribute('data-detail');
await page.locator('#more-flights').click(); log('after more – cards:', await page.locator('.flight-card').count(), 'detail still open:', await page.locator(`details[data-detail="${key}"]`).evaluate(d => d.open));
await page.locator('#flight-sort').selectOption('duration');
log('sorted by duration – first:', (await page.locator('.flight-card').first().locator('.flight-leg small').first().innerText()), '| detail open:', await page.locator(`details[data-detail="${key}"]`).evaluate(d => d.open).catch(() => 'not visible'));
log('bag pills on first card:', await page.locator('.flight-card').first().locator('.bag-line .bag').allInnerTexts());
// compare
await page.locator('#flight-sort').selectOption('price');
for (const i of [0, 1, 2]) await page.locator('.flight-card').nth(i).locator('[data-compare-offer]').check();
log('tray:', await page.locator('.flight-compare-tray').innerText());
await page.locator('[data-filter="stops"][data-value="0"]').click().catch(async () => { await page.locator('#flight-filters summary').click(); await page.locator('[data-filter="stops"][data-value="0"]').click(); });
log('tray after filter:', (await page.locator('.flight-compare-tray strong').innerText()));
await page.locator('[data-open-compare]').click(); await page.waitForSelector('.flight-compare');
log('compare rows:', (await page.locator('.flight-compare tbody tr').allInnerTexts()).slice(0, 4).map(t => t.replace(/\s+/g, ' ')));
await page.screenshot({ path: `${OUT}/compare-${W}.png` });
await page.locator('.modal-close').click();
await page.locator('#live-results').scrollIntoViewIfNeeded(); await page.screenshot({ path: `${OUT}/results-${W}.png` });
const scrollW = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); log('horizontal overflow px:', scrollW);
// F02
await page.reload(); await page.waitForTimeout(500);
log('after reload:', await page.locator('#destination').inputValue(), '|', await page.locator('#dates-value').innerText(), '|', await page.locator('#search-feedback').innerText(), '| results shown:', await page.locator('#live-results').isVisible());
log('errors:', errors); await browser.close();
