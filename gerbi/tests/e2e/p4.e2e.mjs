const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const OUT = process.env.OUT || 'verification/e2e', base = process.env.BASE_URL || 'http://localhost:4173', W = Number(process.env.W || 1440);
const browser = await chromium.launch(); const context = await browser.newContext({ viewport: { width: W, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'] }); const page = await context.newPage();
const errors = []; page.on('pageerror', e => errors.push(e.message)); const log = (...a) => console.log(...a);
const bodies = []; page.on('request', r => { if (r.url().includes('/flights/search')) bodies.push(JSON.parse(r.postData())); });
const dates = async (start, end) => { await page.locator('#dates-button').click(); await page.locator('#start-date').fill(start); if (end) await page.locator('#end-date').fill(end); await page.locator('#date-form button').click(); };
const search = async () => { await page.locator('.search-submit').click(); await page.waitForSelector('#live-results:not([hidden]) .flight-card, #live-results:not([hidden]) .empty-panel', { timeout: 60000 }); };
await page.goto(base + '/#/');
// one-way
await page.locator('[name=trip-type][value=oneway]').check({ force: true });
await page.locator('#destination').fill('רומא'); await dates('2027-06-10');
log('one-way dates field:', await page.locator('#dates-value').innerText());
await search(); log('one-way request legs:', bodies.at(-1).originDestinations.length, '| header:', await page.locator('.live-heading p').innerText(), '| back filter:', await page.locator('legend', { hasText: 'המראה בחזור' }).count(), '| legs per card:', await page.locator('.flight-card').first().locator('.flight-leg').count());
log('url:', page.url().replace(base, ''));
await page.locator('.flight-card').first().locator('[data-volero-offer]').click(); await page.waitForSelector('[data-save-flight]', { timeout: 60000 }); await page.locator('[data-save-flight]').click(); await page.locator('#modal .modal-close').click();
// swap + foreign origin round trip
await page.locator('[name=trip-type][value=round]').check({ force: true });
await page.locator('#origin').fill('פריז'); await page.locator('#destination').fill('רומא');
await page.locator('#swap-route').click(); log('after swap:', await page.locator('#origin').inputValue(), '→', await page.locator('#destination').inputValue());
await page.locator('#swap-route').click();
await dates('2027-06-10', '2027-06-15'); await search();
log('Paris→Rome request:', bodies.at(-1).originDestinations.map(o => o.origin.code + '-' + o.destination.code).join(','), '| first card:', (await page.locator('.flight-card').first().locator('.flight-leg b').first().innerText()));
// same-day return
await page.locator('#origin').fill('תל אביב'); await page.locator('#destination').fill('לרנקה'); await dates('2027-06-10', '2027-06-10');
log('same-day dates:', await page.locator('#dates-value').innerText()); await search();
log('same-day request:', bodies.at(-1).originDestinations.map(o => o.date).join(','), '| status:', await page.locator('#live-results [role=status]').first().innerText());
// unknown origin
await page.locator('#origin').fill('גבעתיים'); await page.locator('.search-submit').click();
log('unknown origin:', await page.locator('#search-feedback').innerText(), '| focus:', await page.evaluate(() => document.activeElement.id));
// saved one-way flight + its link
await page.goto(base + '/#/account'); const card = page.locator('.saved-flight').first();
log('saved one-way:', (await card.locator('.saved-leg').allInnerTexts()).join(' / '));
await card.locator('a', { hasText: 'חיפוש מחדש' }).click(); await page.waitForTimeout(400);
log('restored from saved:', await page.locator('[name=trip-type]:checked').getAttribute('value'), await page.locator('#origin').inputValue(), '→', await page.locator('#destination').inputValue(), '|', await page.locator('#dates-value').innerText());
await page.screenshot({ path: `${OUT}/p4-home-${W}.png` });
log('overflow:', await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), '| errors:', errors);
await browser.close();
