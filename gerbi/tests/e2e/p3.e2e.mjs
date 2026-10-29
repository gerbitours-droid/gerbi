const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const OUT = process.env.OUT || 'verification/e2e', base = process.env.BASE_URL || 'http://localhost:4173', W = Number(process.env.W || 1440);
const browser = await chromium.launch(); const context = await browser.newContext({ viewport: { width: W, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'] }); const page = await context.newPage();
const errors = []; page.on('pageerror', e => errors.push(e.message)); const log = (...a) => console.log(...a);
let searches = 0; page.on('request', r => { if (r.url().includes('/flights/search')) searches++; });
await page.goto(base + '/#/');
// F06
await page.locator('.search-submit').click();
log('F06 empty destination → focus:', await page.evaluate(() => document.activeElement.id), '|', await page.locator('#search-feedback').innerText());
await page.locator('#destination').fill('רומא'); await page.locator('.search-submit').click();
log('F06 no dates → focus:', await page.evaluate(() => document.activeElement.id));
await page.locator('#dates-button').click(); await page.locator('#start-date').fill('2027-06-10'); await page.locator('#end-date').fill('2027-06-15'); await page.locator('#date-form button').click();
await page.locator('.search-submit').click(); await page.waitForSelector('#live-results .flight-card', { timeout: 60000 });
log('url after search:', page.url().replace(base, ''));
await page.locator('#share-flight-search').click(); await page.waitForTimeout(300);
const shared = await page.evaluate(() => navigator.clipboard.readText()); log('shared link:', shared.replace(base, ''));
await page.locator('.flight-card').first().locator('[data-volero-offer]').click();
await page.waitForSelector('[data-save-flight]', { timeout: 60000 }); await page.locator('[data-save-flight]').click();
log('save status:', await page.locator('#save-flight-status').innerText());
await page.locator('#save-flight-status a').click(); await page.waitForSelector('.saved-flight');
log('account flight:', (await page.locator('.saved-flight').first().innerText()).replace(/\n+/g, ' / '));
await page.screenshot({ path: `${OUT}/account-${W}.png`, fullPage: false });
await page.locator('[data-copy-flight]').first().click(); await page.waitForTimeout(200);
log('copied text first line:', (await page.evaluate(() => navigator.clipboard.readText())).split('\n').slice(0, 3).join(' | '));
// trip page
await page.locator('.saved-flight a', { hasText: 'לתוכנית' }).first().click(); await page.waitForSelector('.trip-flight');
log('trip flight:', (await page.locator('.trip-flight').innerText()).replace(/\n+/g, ' / '));
log('match button (draft nights already 5):', await page.locator('#match-flight-nights').count());
// a plan with 4 nights → the button offers 5 and opens the approval dialog prefilled
await page.locator('#update-trip-brief').click(); await page.locator('#trip-brief-form [name=nights]').fill('4'); await page.locator('#confirm-trim').check(); await page.locator('#trip-brief-form button').click();
await page.locator('#match-flight-nights').click(); log('brief modal nights:', await page.locator('#trip-brief-form [name=nights]').inputValue());
await page.locator('#modal .modal-close').click();
// search again from account → form filled, no automatic supplier call
await page.goto(base + '/#/account'); const before = searches;
await page.locator('.saved-flight a', { hasText: 'חיפוש מחדש' }).first().click(); await page.waitForTimeout(500);
log('search again → form:', await page.locator('#destination').inputValue(), '|', await page.locator('#dates-value').innerText(), '|', await page.locator('#travelers-value').innerText(), '| auto searches:', searches - before);
// shared link in a fresh tab
const fresh = await (await browser.newContext({ viewport: { width: W, height: 1000 } })).newPage();
await fresh.goto(shared); await fresh.waitForTimeout(500);
log('fresh tab via link:', await fresh.locator('#destination').inputValue(), '|', await fresh.locator('#dates-value').innerText(), '|', await fresh.locator('#search-feedback').innerText());
// destination guide + support
await page.goto(base + '/#/destination/maldives'); log('guide items:', await page.locator('.destination-guide dt').count(), '| first:', await page.locator('.destination-guide dd').first().innerText());
await page.locator('.destination-guide').scrollIntoViewIfNeeded(); await page.screenshot({ path: `${OUT}/guide-${W}.png` });
await page.goto(base + '/#/support'); await page.locator('#support-form textarea').fill('בדיקה'); await page.locator('#support-form button').click();
log('support:', await page.locator('#support-draft [role=status]').innerText());
log('overflow:', await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), '| errors:', errors);
await browser.close();
