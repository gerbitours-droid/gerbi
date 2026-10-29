const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const OUT = process.env.OUT || 'verification/e2e', base = process.env.BASE_URL || 'http://localhost:4173';
const browser = await chromium.launch(); const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
const errors = []; page.on('pageerror', e => errors.push(e.message));
const log = (...a) => console.log(...a);
await page.goto(base + '/#/');
await page.locator('#dates-button').click(); await page.locator('#start-date').fill('2027-06-10'); await page.locator('#end-date').fill('2027-06-15'); await page.locator('#date-form button').click();
await page.locator('#destination').fill('רומא');
await page.locator('.search-submit').click();
await page.waitForSelector('#live-results .flight-card', { timeout: 60000 });
log('destination field:', await page.locator('#destination').inputValue());
const cards = page.locator('.flight-card');
log('cards', await cards.count(), '| first carrier:', await cards.first().locator('h3').innerText());
log('warnings:', (await page.locator('.leg-warning').allInnerTexts()).slice(0, 4));
const det = page.locator('.flight-segments').first(); await det.locator('summary').click();
log('segment line:', (await det.innerText()).split('\n').slice(0, 4).join(' | '));
await page.screenshot({ path: OUT + '/results.png', fullPage: false });
// price check, then stamp
await cards.first().locator('[data-volero-offer]').click();
await page.waitForSelector('#modal[open] h2', { timeout: 60000 }); log('modal:', await page.locator('#modal h2').innerText());
await page.locator('[data-close-availability]').click();
log('stamp:', await cards.first().locator('.verified-stamp').innerText().catch(() => 'none'));
// change travelers -> stale
await page.locator('#travelers-button').click(); await page.locator('[data-counter="adult-plus"]').click(); await page.locator('#save-travelers').click();
log('stale note:', await page.locator('#stale-note').isVisible(), '| offer disabled:', await cards.first().locator('[data-volero-offer]').isDisabled());
await page.locator('#stale-note').scrollIntoViewIfNeeded(); await page.screenshot({ path: OUT + '/stale.png' });
await page.locator('#travelers-button').click(); await page.locator('[data-counter="adult-minus"]').click(); await page.locator('#save-travelers').click();
log('back to original -> stale:', await page.locator('#stale-note').count());
// unknown destination message
await page.locator('#destination').fill('ברצ'); await page.locator('.search-submit').click();
log('unknown msg:', await page.locator('#search-feedback').innerText());
// planner
await page.goto(base + '/#/planner'); await page.locator('#page-chat-input').fill('זוג עם שני ילדים, חמישה לילות בפריז ביוני, תקציב 12000 שקל, בלי ים ובלי דובאי'); await page.locator('#page-chat-form button[type=submit], #page-chat-form button').first().click();
await page.waitForTimeout(1500); log('bot:', (await page.locator('#page-chat .message.assistant').last().innerText()).replace(/\n/g, ' / '));
await page.goto(base + '/#/results'); await page.waitForSelector('#recommendation-list');
log('results:', await page.locator('#recommendation-list h2').allInnerTexts(), '| reasons:', await page.locator('#recommendation-list .match-reason').allInnerTexts(), '| note:', await page.locator('.constraint-note').innerText().catch(() => 'none'));
// F01: draft for rome with 2 adults, change home brief to 4, then open update dialog
await page.goto(base + '/#/trip/rome'); await page.waitForSelector('#update-trip-brief');
await page.locator('#update-trip-brief').click(); const f = page.locator('#trip-brief-form');
log('F01 fields:', await f.locator('[name=adults]').inputValue(), await f.locator('[name=children]').inputValue(), await f.locator('[name=nights]').inputValue(), '|', await page.locator('#modal p').first().innerText());
await f.locator('button').click(); log('F01 toast after no-change:', await page.locator('#toast').isVisible());
log('errors:', errors);
await browser.close();
