// Spec 25 online booking, real browser, NO supplier calls: the flight search and the price check are answered from
// recorded fixtures (page.route), and the server runs the fake supplier.
//   mock mode:    BOOKING_MODE=mock    → passengers (full passport) → extras per traveller (bags, cabin bag +
//                                         priority, sport…)/insurance → summary → mock hosted payment → confirmation,
//                                         hotel in one click, a supplier failure after the card hold (auto-void),
//                                         saved travellers (sign up → save from the wizard → pick next time), my orders, admin
//   request mode: BOOKING_MODE=request BOOKING_SUPPLIER=fake → the same wizard ends in "request received" + a lead
// Server: PORT=4193 BOOKING_MODE=mock LEADS_ADMIN_TOKEN=… npm run dev   (ADMIN_PASSWORD = that token for the admin part)
// Run:    PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs BASE_URL=http://localhost:4193 node tests/e2e/booking.e2e.mjs
import { readFileSync, mkdirSync } from 'node:fs';
import { slimAvailability } from '../../backend/volero-guard.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const BASE = process.env.BASE_URL || 'http://localhost:4193', OUT = process.env.OUT || 'verification/25-booking', ADMIN = process.env.ADMIN_PASSWORD || '';
mkdirSync(OUT, { recursive: true });
const search = JSON.parse(readFileSync(new URL('../fixtures/booking/search-slim.json', import.meta.url), 'utf8'));
const recorded = JSON.parse(readFileSync(new URL('../fixtures/booking/availability-raw.json', import.meta.url), 'utf8'));
const config = await fetch(BASE + '/api/orders/config').then((r) => r.json());
const MODE = config.mode;
const results = [];
const check = (name, ok, extra = '') => { results.push({ name, ok: Boolean(ok), extra }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? ' — ' + extra : '')); };
const day = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
console.log('server booking mode:', MODE, '| online:', config.online);

async function intercept(page) {
  await page.route('**/api/volero/flights/search', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ provider: 'volero', data: search.data, cached: false, searchedAt: new Date().toISOString() }) }));
  await page.route('**/api/volero/flights/availability', async (route) => {
    const { offerIndex } = JSON.parse(route.request().postData() || '{}');
    const entry = recorded.find((x) => x.offerIndex === offerIndex) || recorded[1];
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ provider: 'volero', data: slimAvailability(entry.raw) }) });
  });
}
const noHScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
const shot = async (page, name) => { if (process.env.DEBUG_FOCUS) console.log(name, await page.evaluate(() => document.activeElement?.outerHTML.slice(0, 90))); return page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true }); };

async function openWizard(page, { en, offer }) {
  await page.goto(`${BASE}${en ? '/en/' : '/'}#/?from=TLV&to=ATH&depart=${day(45)}&return=${day(50)}&adults=2&children=1`);
  await page.locator('.search-submit').click();
  await page.waitForSelector('#live-results:not([hidden]) [data-volero-offer]', { timeout: 30000 });
  const button = offer && await page.locator(`[data-volero-offer="${offer}"]`).count() ? page.locator(`[data-volero-offer="${offer}"]`).first() : page.locator('[data-volero-offer]').first();
  await button.click();
  await page.waitForSelector('[data-book-flight]', { timeout: 15000 });
  await page.locator('[data-book-flight]').click();
  await page.waitForSelector('#bo-passengers', { timeout: 15000 });
}
async function fillPassengers(page, { last = 'LEVI' } = {}) {
  const count = await page.locator('.bo-person[data-person]').count(); // travellers (not the contact / save boxes)
  for (let i = 0; i < count; i++) {
    await page.locator(`input[name="g${i}"][value="${i % 2 ? 'm' : 'f'}"]`).check({ force: true });
    await page.locator(`[data-key="${i}.firstName"]`).fill(['dana', 'roy', 'noam', 'maya'][i] || 'alex');
    await page.locator(`[data-key="${i}.lastName"]`).fill(i === 0 ? last : 'LEVI');
    const legend = await page.locator('.bo-person legend').nth(i).innerText();
    await page.locator(`[data-key="${i}.birthDate"]`).fill(/2–11|child|ילד/.test(legend) ? '2018-03-02' : /infant|תינוק/.test(legend) ? '2026-06-01' : `19${80 + i}-05-01`);
    // Full passport for every traveller (23.11.2026).
    await page.locator(`[data-key="${i}.document.number"]`).fill(`AB12345${i}`);
    await page.locator(`[data-key="${i}.document.issuingCountry"]`).selectOption('IL');
    await page.locator(`[data-key="${i}.document.nationality"]`).selectOption('IL');
    await page.locator(`[data-key="${i}.document.issueDate"]`).fill('2023-01-01');
    await page.locator(`[data-key="${i}.document.expiryDate"]`).fill('2031-01-01');
  }
  await page.locator('[data-key="contact.name"]').fill('Dana Levi');
  await page.locator('[data-key="contact.email"]').fill('dana@example.com');
  await page.locator('[data-key="contact.phone"]').fill('050-1234567');
}

async function flow({ browser, en = false, width = 1440, tag }) {
  const ctx = await browser.newContext({ viewport: { width, height: 1000 }, locale: en ? 'en-GB' : 'he-IL' });
  const page = await ctx.newPage(), errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await intercept(page);
  await openWizard(page, { en, offer: recorded[0].offerIndex });
  check(`${tag}: "Book" in the price check opens the wizard`, /#\/book\/[0-9a-f-]{36}$/.test(page.url()));
  // Validation: a Hebrew name and a missing gender are refused next to the field.
  await page.locator('[data-key="0.firstName"]').fill('דנה');
  await page.locator('#bo-passengers button[type=submit]').click();
  const err = page.locator('[data-for="0.firstName"] .lead-error');
  check(`${tag}: Latin-only names are enforced in the browser`, await err.isVisible() && await page.locator('[data-key="0.firstName"][aria-invalid=true]').count() === 1, await err.innerText().catch(() => ''));
  // Passport: an issue date after the expiry date is refused next to the field; the passport block is always there.
  await fillPassengers(page);
  check(`${tag}: full passport fields for every traveller`, await page.locator('.bo-passport').count() === await page.locator('.bo-person[data-person]').count() && await page.locator('[data-key="0.document.issueDate"]').count() === 1);
  await page.locator('[data-key="0.document.issueDate"]').fill('2032-01-01');
  await page.locator('#bo-passengers button[type=submit]').click();
  check(`${tag}: passport issue date is validated`, await page.locator('[data-for="0.document.issueDate"] .lead-error').isVisible(), await page.locator('[data-for="0.document.issueDate"] .lead-error').innerText().catch(() => ''));
  await page.locator('[data-key="0.document.issueDate"]').fill('2023-01-01');
  await shot(page, `${tag}-1-passengers`);
  check(`${tag}: no horizontal scroll (passengers)`, await noHScroll(page));
  await page.locator('#bo-passengers button[type=submit]').click();
  await page.waitForSelector('#bo-addons', { timeout: 15000 });
  // Extras: every category the airline offers, per traveller, with readable wording and a live total.
  const kinds = await page.locator('.bo-x-group').evaluateAll((els) => [...new Set(els.map((e) => e.dataset.kind))]);
  check(`${tag}: extras grouped per traveller (bags, cabin bag + priority, sport)`, ['bags', 'cabin', 'sport'].every((k) => kinds.includes(k)) && await page.locator('.bo-extras-person').count() === 3, kinds.join(','));
  const cabinText = await page.locator('.bo-x-group[data-kind="cabin"] select').first().innerText();
  check(`${tag}: supplier descriptions read as ${en ? 'English' : 'Hebrew'}`, en ? /Priority boarding/.test(cabinText) : /עלייה מועדפת/.test(cabinText) && /טרולי/.test(cabinText), cabinText.replace(/\s+/g, ' ').slice(0, 120));
  await page.locator('.bo-x-group[data-kind="cabin"] select').first().selectOption({ index: 2 });
  await page.locator('.bo-x-group[data-kind="bags"] select').first().selectOption({ index: 2 });
  await page.locator('[data-bo-same]').click();
  const chosen = await page.locator('[data-extra]').evaluateAll((els) => els.filter((e) => e.value).length);
  check(`${tag}: "same for everyone" copies the first traveller's extras`, chosen === 6, String(chosen));
  check(`${tag}: live extras total`, /6/.test(await page.locator('[data-extras-total]').innerText()));
  await page.locator('[data-insurance]').check();
  await shot(page, `${tag}-2-addons`);
  check(`${tag}: no horizontal scroll (extras)`, await noHScroll(page));
  await page.locator('#bo-addons button[type=submit]').click();
  await page.waitForSelector('#bo-commit, .bo-alert', { timeout: 20000 });
  const total = await page.locator('.bo-price strong').innerText();
  check(`${tag}: summary shows the re-checked final price in shekels with the original currency`, /₪/.test(total) && /USD|\$/.test(await page.locator('.bo-price').innerText()), total);
  check(`${tag}: cancellation policy + distance-sale rights shown`, await page.locator('.bo-policy li').count() >= 3);
  check(`${tag}: the summary lists the extras per traveller and masks the passport`, await page.locator('.bo-summary .bo-plain li .bo-x-icon').count() === 6 && /•••\d{3}/.test(await page.locator('.bo-summary').innerText()) && !/AB12345/.test(await page.locator('.bo-summary').innerText()));
  // Terms are required.
  await page.locator('.bo-pay').click();
  check(`${tag}: terms must be accepted`, await page.locator('[data-for="terms"] .lead-error').isVisible());
  await page.locator('[data-key="terms"]').check(); await page.locator('[data-key="cancellation"]').check();
  await shot(page, `${tag}-3-summary`);
  check(`${tag}: no horizontal scroll (summary)`, await noHScroll(page));
  if (config.online) {
    await page.locator('.bo-pay').click();
    await page.waitForURL(/\/api\/payments\/mock\//, { timeout: 15000 });
    await shot(page, `${tag}-4-mock-payment`);
    await page.locator('select[name=installments]').selectOption('3');
    await page.locator('button[value=approve]').click();
    await page.waitForSelector('.bo-done.bo-ok', { timeout: 30000 });
    const text = await page.locator('.bo-done').innerText();
    check(`${tag}: paid → booked → ticketed → confirmed with PNR and ticket`, /FK\d{4}/.test(text) && /1149/.test(text), text.replace(/\s+/g, ' ').slice(0, 160));
  } else {
    await page.locator('.bo-pay').click();
    await page.waitForSelector('.bo-done.bo-ok', { timeout: 15000 });
    check(`${tag}: request mode ends in "request received", nothing charged`, (await page.locator('.bo-done').innerText()).length > 20 && !(await page.locator('.bo-pnr').count()));
  }
  // Hotel in one click: the same lead traveller and contact, nothing to retype.
  if (await page.locator('#bo-hotel').count()) {
    check(`${tag}: hotel in one click is pre-filled from the flight booking`, /DANA LEVI/.test(await page.locator('.bo-hotel').innerText()) && /dana@example\.com/.test(await page.locator('.bo-hotel').innerText()));
    await page.locator('[data-key="hotel.stars"]').selectOption('4');
    await page.locator('#bo-hotel button[type=submit]').click();
    await page.waitForSelector('.bo-hotel .notice', { timeout: 15000 });
    check(`${tag}: hotel request sent in one click`, true);
  } else check(`${tag}: hotel in one click offered after the flight`, false);
  await shot(page, `${tag}-5-done`);
  check(`${tag}: the supplier's name never appears`, !/volero/i.test(await page.locator('body').innerText()));
  const ref = (await page.locator('.bo-ref bdi').first().innerText()).trim();
  await page.goto(`${BASE}${en ? '/en/' : '/'}#/orders`);
  await page.waitForSelector('[data-orders] .bo-orders, [data-orders] > p:not(.micro-copy)', { timeout: 15000 });
  check(`${tag}: "my orders" lists the booking`, (await page.locator('#acc-orders').innerText()).includes(ref), ref);
  await shot(page, `${tag}-6-my-orders`);
  check(`${tag}: no page errors`, !errors.length, errors.join(' | '));
  await ctx.close();
  return ref;
}

// Saved travellers: a signed-in customer saves the travellers from the wizard (consent), sees them masked in the
// account, and the next booking fills them in one click with the saved passport resolved on the server.
async function savedTravellers(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'he-IL' }), page = await ctx.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await intercept(page);
  await page.goto(BASE + '/#/');
  const email = `saved-${Date.now()}@example.com`;
  const signed = await page.evaluate(async (mail) => (await fetch('/api/account/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Dana Levi', email: mail, password: 'sunny-beach-27', privacy: true, phone: '050-1234567' }) })).status, email);
  check('saved: signed up for the saved-travellers run', signed === 201, String(signed));
  await page.reload();
  await openWizard(page, { offer: recorded[0].offerIndex });
  await fillPassengers(page);
  const boxes = page.locator('[data-save-traveller]');
  check('saved: the wizard offers "save to my account" per traveller', await boxes.count() === 3);
  for (let i = 0; i < 3; i++) await boxes.nth(i).check();
  await page.locator('#bo-passengers button[type=submit]').click();
  check('saved: saving needs the consent box', await page.locator('[data-for="save.consent"] .lead-error').isVisible());
  await page.locator('[data-key="save.consent"]').check();
  await page.locator('#bo-passengers button[type=submit]').click();
  await page.waitForSelector('#bo-addons', { timeout: 15000 });
  check('saved: "travellers saved" confirmation', /נשמרו/.test(await page.locator('#bo-addons').innerText()));
  await page.locator('.bo-x-group[data-kind="bags"] select').first().selectOption({ index: 3 });
  await shot(page, 'saved-extras-step');
  // The account lists them, passport numbers masked.
  await page.goto(BASE + '/#/account');
  await page.waitForSelector('#acc-travellers .st-list li', { timeout: 15000 });
  const section = await page.locator('#acc-travellers').innerText();
  check('saved: account lists the 3 saved travellers, numbers masked', await page.locator('#acc-travellers .st-list li').count() === 3 && /•••450/.test(section) && !/AB123450/.test(section), section.replace(/\s+/g, ' ').slice(0, 160));
  await page.locator('#acc-travellers').screenshot({ path: `${OUT}/saved-travellers-account.png` });
  // Edit form: "use the saved passport" instead of the number.
  await page.locator('[data-traveller-edit]').first().click();
  check('saved: editing offers the saved passport without showing it', await page.locator('[data-st-keep]').isChecked());
  await page.locator('[data-traveller-cancel]').click();
  // Next booking: pick each saved traveller in one click.
  await openWizard(page, { offer: recorded[0].offerIndex });
  const pickers = page.locator('[data-pick-traveller]');
  check('saved: "choose a saved traveller" in the next booking', await pickers.count() === 3);
  for (let i = 0; i < 3; i++) {
    const legend = await page.locator('.bo-person legend').nth(i).innerText();
    const name = /ילד/.test(legend) ? 'NOAM' : i === 0 ? 'DANA' : 'ROY';
    await pickers.nth(i).selectOption(await pickers.nth(i).locator('option', { hasText: name }).getAttribute('value'));
  }
  check('saved: one click fills names and the saved passport (number stays on the server)', (await page.locator('[data-key="0.firstName"]').inputValue()) === 'DANA' && await page.locator('[data-keep="0"]').isChecked() && !(await page.locator('[data-key="0.document.number"]').isVisible()));
  await shot(page, 'saved-pick-passengers');
  await page.locator('#bo-passengers button[type=submit]').click();
  await page.waitForSelector('#bo-addons', { timeout: 15000 });
  const id = page.url().split('#/book/')[1], token = await page.evaluate((i) => JSON.parse(localStorage.getItem('gerbi-orders-v1')).find((x) => x.id === i).token, id);
  const order = await page.evaluate(async ([i, tk]) => (await fetch(`/api/orders/${i}`, { headers: { 'x-order-token': tk } })).json(), [id, token]);
  check('saved: the order got the saved passports (masked back)', order.order.passengers.map((p) => p.document?.number).join(',') === '•••450,•••451,•••452', order.order.passengers.map((p) => p.document?.number).join(','));
  // Delete one saved traveller.
  await page.goto(BASE + '/#/account');
  await page.waitForSelector('#acc-travellers .st-list li', { timeout: 15000 });
  page.once('dialog', (d) => d.accept());
  await page.locator('[data-traveller-delete]').last().click();
  await page.waitForFunction(() => document.querySelectorAll('#acc-travellers .st-list li').length === 2, null, { timeout: 10000 }).catch(() => {});
  check('saved: delete a saved traveller', await page.locator('#acc-travellers .st-list li').count() === 2);
  check('saved: no page errors', !errors.length, errors.join(' | '));
  await ctx.close();
}

async function failure(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'he-IL' });
  const page = await ctx.newPage();
  await intercept(page);
  await openWizard(page, {});
  await fillPassengers(page, { last: 'SUPPLIERFAIL' });
  await page.locator('#bo-passengers button[type=submit]').click();
  await page.waitForSelector('#bo-addons');
  await page.locator('#bo-addons button[type=submit]').click();
  await page.waitForSelector('#bo-commit');
  await page.locator('[data-key="terms"]').check(); await page.locator('[data-key="cancellation"]').check();
  await page.locator('.bo-pay').click();
  await page.waitForURL(/\/api\/payments\/mock\//);
  await page.locator('button[value=approve]').click();
  await page.waitForSelector('.bo-done.bo-fail', { timeout: 30000 });
  check('mock: supplier failure after the card hold → hold released, customer told nothing was charged', /שוחררה/.test(await page.locator('.bo-done').innerText()));
  await shot(page, 'he-1440-mock-supplier-failure');
  await ctx.close();
}

// Trip builder entry (spec 25 §9): the selected flight has a "book" button; the builder's Harel flag carries over.
// Needs a server with GERBI_SUPPLIER_FIXTURES=1 (recorded builder answers) – skipped otherwise.
async function builder(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'he-IL' }), page = await ctx.newPage();
  await page.goto(BASE + '/#/build?q=' + encodeURIComponent('זוג, 5 לילות באתונה בחודש הבא'));
  const ok = await page.waitForSelector('#bc-flights [data-book-flight]', { timeout: 60000 }).then(() => true).catch(() => false);
  if (!ok) { console.log('SKIP builder: no live/fixture flights in the builder (run the server with GERBI_SUPPLIER_FIXTURES=1)'); await ctx.close(); return; }
  const insurance = page.locator('[data-insurance]');
  if (await insurance.count()) await insurance.check();
  await page.locator('#bc-flights').screenshot({ path: `${OUT}/builder-book-button-${MODE}.png` });
  await page.locator('#bc-flights [data-book-flight]').click();
  await page.waitForSelector('#bo-passengers', { timeout: 20000 });
  check('builder: "book the selected flight" opens the booking wizard', /#\/book\//.test(page.url()));
  const id = page.url().split('#/book/')[1], token = await page.evaluate((i) => JSON.parse(localStorage.getItem('gerbi-orders-v1')).find((x) => x.id === i).token, id);
  const order = await fetch(`${BASE}/api/orders/${id}`, { headers: { 'x-order-token': token } }).then((r) => r.json());
  check('builder: the Harel insurance flag carries into the order (no second insurance UI)', order.order?.addons?.insurance === true && order.order?.source === 'builder');
  await ctx.close();
}

async function admin(browser, ref) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } }), page = await ctx.newPage();
  await page.goto(BASE + '/admin');
  await page.locator('#password').fill(ADMIN); await page.locator('#login-form button').click();
  await page.waitForSelector('#app-view:not([hidden])');
  await page.goto(BASE + '/admin#orders');
  await page.waitForSelector('#orders-list li, #orders-list p', { timeout: 15000 });
  check('admin: orders list shows the booking and the running mode', (await page.locator('#orders-list').innerText()).includes(ref) && (await page.locator('#orders-mode').innerText()).length > 5);
  await shot(page, `admin-orders-${MODE}`);
  await page.locator(`#orders-list a:has-text("${ref}")`).first().click();
  await page.waitForSelector('.admin-timeline li');
  check('admin: detail shows decrypted passengers and the audit timeline', /DANA/.test(await page.locator('#panel').innerText()) && await page.locator('.admin-timeline li').count() >= 3);
  check('admin: passport numbers masked until the audited "show" button', /•••\d{3}/.test(await page.locator('#panel').innerText()) && !/AB12345\d/.test(await page.locator('#panel').innerText()));
  page.once('dialog', (d) => d.accept());
  await page.locator('#order-docs').click();
  await page.waitForFunction(() => /AB12345\d/.test(document.querySelector('#panel').innerText), null, { timeout: 10000 }).catch(() => {});
  check('admin: full passport numbers on request', /AB12345\d/.test(await page.locator('#panel').innerText()));
  check('admin: extras listed in Hebrew', /תוספות: .*(מזוודה|טרולי|עלייה)/.test(await page.locator('#panel').innerText()));
  await shot(page, `admin-order-detail-${MODE}`);
  await ctx.close();
}

const browser = await chromium.launch();
try {
  const ref = await flow({ browser, tag: `he-1440-${MODE}` });
  await flow({ browser, tag: `he-375-${MODE}`, width: 375 });
  await flow({ browser, en: true, tag: `en-1440-${MODE}` });
  await flow({ browser, en: true, tag: `en-375-${MODE}`, width: 375 });
  if (MODE === 'mock') await failure(browser);
  if (process.env.SAVED !== '0') await savedTravellers(browser);
  if (process.env.BUILDER !== '0') await builder(browser);
  if (ADMIN) await admin(browser, ref);
} catch (error) { check('run', false, error.stack?.split('\n').slice(0, 3).join(' | ')); }
finally { await browser.close(); }
const failed = results.filter((r) => !r.ok);
console.log(failed.length ? `FAILED ${failed.length}/${results.length}` : `ALL PASS (${results.length})`);
process.exit(failed.length ? 1 : 0);
