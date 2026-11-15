// Spec 10 §7 (item 12) on a round trip with a child, LIVE: per-passenger prices, fare inclusions, seats left, avoid-stop filter.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const OUT = process.env.OUT || 'verification/10-multi-city', base = process.env.BASE_URL || 'http://localhost:4173', W = Number(process.env.W || 1440);
const browser = await chromium.launch(); const page = await (await browser.newContext({ viewport: { width: W, height: 1000 } })).newPage();
const errors = []; page.on('pageerror', e => errors.push(e.message)); const log = (...a) => console.log(...a);
const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
await page.goto(base + `/#/?from=TLV&to=LON&depart=${day(30)}&return=${day(37)}&adults=2&children=1`); await page.waitForTimeout(400);
await page.locator('.search-submit').click();
await page.waitForSelector('#live-results:not([hidden]) .flight-card, #live-results:not([hidden]) .empty-panel', { timeout: 60000 });
const card = page.locator('.flight-card').filter({ has: page.locator('.fare-inclusions') }).first();
const pax = await page.locator('.pax-prices').count(), incl = await page.locator('.fare-inclusions').count(), seats = await page.locator('.seats-left').count();
log('per-passenger lines:', pax, '| sample:', pax ? await page.locator('.pax-prices').first().innerText() : '-');
log('cards with fare inclusions:', incl, '| seats-left tags:', seats);
if (await card.count()) { await card.locator('details.flight-segments').first().evaluate(d => { d.open = true; }); log('inclusions:', await card.locator('.fare-inclusions').first().innerText()); await card.screenshot({ path: `${OUT}/fare-extras-${W}.png` }); }
if (!(await page.locator('#flight-filters[open]').count())) await page.locator('#flight-filters summary').click();
log('avoid group:', await page.locator('legend', { hasText: 'בלי עצירה ב־' }).count(), (await page.locator('[data-filter="avoid"]').allInnerTexts()).join(' | '));
await page.locator('#flight-filters').screenshot({ path: `${OUT}/filters-${W}.png` });
log('overflow:', await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), '| errors:', errors);
const ok = pax > 0 && incl > 0 && !errors.length; log(ok ? 'ALL PASS' : 'FAILED'); await browser.close(); process.exit(ok ? 0 : 1);
