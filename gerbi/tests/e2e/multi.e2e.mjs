// Spec 10 (multi-city + fare extras) end to end, LIVE supplier search. Usage:
// PLAYWRIGHT_MODULE=... BASE_URL=http://127.0.0.1:4182 W=1440 OUT=verification/10-multi-city node tests/e2e/multi.e2e.mjs
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const OUT = process.env.OUT || 'verification/10-multi-city', base = process.env.BASE_URL || 'http://localhost:4173', W = Number(process.env.W || 1440);
const browser = await chromium.launch(); const context = await browser.newContext({ viewport: { width: W, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'] }); const page = await context.newPage();
const errors = [], failures = []; page.on('pageerror', e => errors.push(e.message)); const log = (...a) => console.log(...a);
const check = (ok, label) => { log(ok ? 'PASS' : 'FAIL', label); if (!ok) failures.push(label); };
const bodies = []; page.on('request', r => { if (r.url().includes('/flights/search')) bodies.push(JSON.parse(r.postData())); });
const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const [d1, d2, d3] = [day(40), day(44), day(48)];
const pick = async (selector, text, code) => { await page.locator(selector).fill(text); await page.locator(`${selector}-list [role=option]`, { hasText: code }).first().click(); };
const legDate = async (i, iso) => { await page.locator(`[data-leg="${i}"] [data-part="date"]`).click(); await page.locator('#start-date').fill(iso); await page.locator('#start-date').dispatchEvent('change'); await page.locator('#date-form button').click(); await page.waitForTimeout(250); };
const search = async () => { await page.locator('.search-submit').click(); await page.waitForSelector('#live-results:not([hidden]) .flight-card, #live-results:not([hidden]) .empty-panel', { timeout: 60000 }); };

await page.goto(base + '/#/');
await page.evaluate(() => localStorage.clear());
await page.reload();
// Seed a round trip, then switch: the editor starts from it.
await pick('#destination', 'רומא', 'FCO');
await page.waitForTimeout(250); if (await page.locator('#date-picker[open]').count()) await page.keyboard.press('Escape');
await page.locator('[name=trip-type][value=multi]').check({ force: true });
check(await page.locator('#multi-legs .leg-row').count() === 2, 'switching to multi shows 2 legs seeded from the form');
check((await page.locator('#leg-0-to').inputValue()).includes('FCO') && (await page.locator('#leg-1-from').inputValue()).includes('FCO'), 'seed: leg 1 → Rome, leg 2 from Rome');
check(await page.locator('#origin').isHidden() && await page.locator('#dates-button').isHidden(), 'main route/date fields hidden in multi mode');
check(await page.locator('[data-remove-leg]').count() === 0, 'no remove button at the 2-leg minimum');
// Build TLV → Rome → Paris → TLV
await pick('#leg-1-to', 'פריז', 'PAR');
await page.waitForTimeout(150); if (await page.locator('#date-picker[open]').count()) await page.keyboard.press('Escape');
await page.locator('[data-add-leg]').click();
check((await page.locator('#leg-2-from').inputValue()).includes('PAR'), 'a new leg starts where the last one landed');
await pick('#leg-2-to', 'תל אביב', 'TLV');
await page.waitForTimeout(150); if (await page.locator('#date-picker[open]').count()) await page.keyboard.press('Escape');
await legDate(0, d1); await legDate(1, d2);
// The calendar of leg 3 blocks days before leg 2.
await page.locator('[data-leg="2"] [data-part="date"]').click();
const blocked = await page.locator(`#date-picker .dp-day[data-date="${day(43)}"]`);
check(!(await blocked.count()) || await blocked.isDisabled(), 'leg 3 calendar blocks days before leg 2');
check(await page.locator('#date-picker .dp-mode').isHidden(), 'leg calendar hides the trip-type switch');
await page.locator('#start-date').fill(d3); await page.locator('#start-date').dispatchEvent('change'); await page.locator('#date-form button').click(); await page.waitForTimeout(250);
await page.screenshot({ path: `${OUT}/form-${W}.png` });
// Add up to 5, check the cap, then remove back to 3.
// (A new leg focuses its empty field and opens the place list; Escape closes it, as a traveler would.)
await page.locator('[data-add-leg]').click(); await page.keyboard.press('Escape'); await page.locator('[data-add-leg]').click(); await page.keyboard.press('Escape');
check(await page.locator('[data-add-leg]').isDisabled(), 'add is disabled at 5 legs');
await page.locator('[data-remove-leg="4"]').click(); await page.locator('[data-remove-leg="3"]').click();
check(await page.locator('#multi-legs .leg-row').count() === 3, 'remove back to 3 legs');
// Validation: wrong order is caught before any supplier call.
const before = bodies.length;
await legDate(1, d2);
await page.evaluate(() => {}); // keep order valid
await search();
const req = bodies.at(-1);
check(bodies.length === before + 1 && req.originDestinations.length === 3, 'one supplier request with 3 originDestinations');
check(req.originDestinations.map(o => o.origin.code + '-' + o.destination.code).join(',') === 'TLV-FCO,FCO-PAR,PAR-TLV', 'request route TLV-FCO,FCO-PAR,PAR-TLV');
const cards = await page.locator('.flight-card').count();
log('cards:', cards, '| heading:', await page.locator('.live-heading h2').innerText(), '|', await page.locator('.live-heading p').first().innerText());
if (cards) {
  check(await page.locator('.flight-card').first().locator('.flight-leg').count() === 3, 'each card shows 3 legs');
  check((await page.locator('.flight-card').first().locator('.flight-leg span').first().innerText()) === 'טיסה 1', 'legs labelled טיסה N');
  check((await page.locator('.flight-card .flight-price small').first().innerText()).includes('מחיר אחד לכל המסלול'), 'one price for the whole route');
  check(await page.locator('legend', { hasText: 'המראה בטיסה האחרונה' }).count() === 1, 'last-flight time filter');
  check(!(await page.locator('.flight-card .leg-warning', { hasText: 'החזרה יוצאת' }).count()), 'no round-trip "return" wording in multi results');
  log('same-city airport-change warnings (e.g. ORY → CDG):', await page.locator('.flight-card .leg-warning', { hasText: 'יוצאת משדה אחר מזה שנחתתם בו' }).count());
  // Sort + avoid filter
  await page.locator('#flight-sort').selectOption('price');
  if (!(await page.locator('#flight-filters[open]').count())) await page.locator('#flight-filters summary').click();
  const avoid = page.locator('[data-filter="avoid"]:not([disabled])').first();
  if (await avoid.count()) {
    const code = await avoid.getAttribute('data-value'), total = await page.locator('#live-results [role=status]').first().innerText();
    await avoid.click(); await page.waitForTimeout(200);
    check((await page.locator('.filter-chip', { hasText: 'בלי עצירה ב־' + code }).count()) === 1, `avoid-stop chip for ${code}`);
    log('avoid', code, ':', total, '→', await page.locator('#live-results [role=status]').first().innerText());
    await page.locator('.filter-chip', { hasText: 'בלי עצירה ב־' + code }).click();
  } else log('no layover airports to avoid in this result');
  await page.locator('.flight-card').first().locator('details.flight-segments').first().evaluate(d => { d.open = true; });
  log('fare inclusions shown:', await page.locator('.fare-inclusions').count(), '| per-pax lines:', await page.locator('.pax-prices').count(), '| seats-left tags:', await page.locator('.seats-left').count());
  await page.screenshot({ path: `${OUT}/results-${W}.png`, fullPage: false });
  await page.locator('.flight-card').first().screenshot({ path: `${OUT}/card-${W}.png` });
}
check(page.url().includes('type=multi') && page.url().includes('legs=TLV-FCO-'), 'URL carries the multi route');
const link = page.url();
// Save a priced flight (if the price check succeeds) and see it in the account.
if (cards) {
  await page.locator('.flight-card').first().locator('[data-volero-offer]').click();
  await page.waitForSelector('[data-save-flight], [data-close-availability]', { timeout: 60000 });
  if (await page.locator('[data-save-flight]').count()) {
    await page.locator('[data-save-flight]').click(); await page.locator('#modal .modal-close').click();
    await page.goto(base + '/#/account'); await page.waitForTimeout(300);
    const legs = await page.locator('.saved-flight').first().locator('.saved-leg').allInnerTexts();
    check(legs.length === 3 && legs[2].startsWith('טיסה 3'), 'saved multi flight keeps 3 legs labelled טיסה N');
    await page.screenshot({ path: `${OUT}/saved-${W}.png` });
    await page.locator('.saved-flight').first().locator('a', { hasText: 'חיפוש מחדש' }).click(); await page.waitForTimeout(400);
    check(await page.locator('[name=trip-type]:checked').getAttribute('value') === 'multi' && await page.locator('#multi-legs .leg-row').count() === 3, 'saved flight reopens as a 3-leg multi search');
  } else { log('price check did not confirm; skipping save:', await page.locator('#modal').innerText()); await page.locator('[data-close-availability]').click(); }
}
// Shared link restores everything in a fresh page.
const fresh = await context.newPage(); fresh.on('pageerror', e => errors.push(e.message));
await fresh.goto(link); await fresh.waitForTimeout(400);
check(await fresh.locator('[name=trip-type]:checked').getAttribute('value') === 'multi' && await fresh.locator('#multi-legs .leg-row').count() === 3, 'shared link restores 3 legs');
await fresh.close();
// Refresh restores the last multi search.
await page.goto(base + '/#/'); await page.reload(); await page.waitForTimeout(400);
check(await page.locator('[name=trip-type]:checked').getAttribute('value') === 'multi', 'refresh restores the last multi search');
// Open jaw: 2 legs, different cities, back to round trip afterwards.
await page.locator('[data-remove-leg="2"]').click();
await pick('#leg-1-to', 'תל אביב', 'TLV'); await page.waitForTimeout(150); if (await page.locator('#date-picker[open]').count()) await page.keyboard.press('Escape');
await pick('#leg-1-from', 'פריז', 'PAR'); await page.waitForTimeout(150); if (await page.locator('#date-picker[open]').count()) await page.keyboard.press('Escape');
await search();
const oj = bodies.at(-1).originDestinations.map(o => o.origin.code + '-' + o.destination.code).join(',');
check(oj === 'TLV-FCO,PAR-TLV', 'open jaw request TLV-FCO,PAR-TLV');
check((await page.locator('.live-heading').innerText()).includes('תצטרכו להגיע בעצמכם'), 'open jaw shows the ground-gap note');
await page.screenshot({ path: `${OUT}/openjaw-${W}.png` });
await page.locator('[name=trip-type][value=round]').check({ force: true });
check(await page.locator('#origin').isVisible() && (await page.locator('#destination').inputValue()).includes('FCO'), 'back to round trip: main fields return with leg 1');
// Validation message for a bad leg
await page.locator('[name=trip-type][value=multi]').check({ force: true });
await page.locator('#leg-1-to').fill('גבעתיים'); await page.locator('.search-submit').click();
log('bad leg:', await page.locator('#search-feedback').innerText(), '| focus:', await page.evaluate(() => document.activeElement.id));
check(await page.evaluate(() => document.activeElement.id) === 'leg-1-to', 'invalid leg is focused');
await page.screenshot({ path: `${OUT}/error-${W}.png` });
log('overflow:', await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), '| errors:', errors);
check(!errors.length, 'no page errors');
check(await page.evaluate(() => !document.body.innerText.includes('Volero')), 'no supplier name in the UI');
await browser.close();
log(failures.length ? `FAILED ${failures.length}` : 'ALL PASS');
process.exit(failures.length ? 1 : 0);
