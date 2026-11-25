// Planner conversation controls, saved destinations, and the pending Volero search. No supplier calls.
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.BASE_URL || 'http://localhost:4173';
const out = process.env.OUT || 'verification/e2e';
const fixtureData = JSON.parse(await readFile(new URL('../fixtures/build/flights.json', import.meta.url), 'utf8'));
const browser = await chromium.launch();
await mkdir(out, { recursive: true });

try {
  for (const [lang, width] of [['he', 1440], ['he', 375], ['en', 1440], ['en', 375]]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const root = base + (lang === 'en' ? '/en/' : '/');
    await page.goto(root + '#/planner');

    const input = page.locator('#page-chat-input');
    const dock = page.locator('.flight-planner .floating-composer-dock');
    const dockBounds = () => dock.evaluate(el => {
      const nav = document.querySelector('.mobile-bottom'), box = el.getBoundingClientRect();
      const bottom = nav.offsetHeight ? nav.getBoundingClientRect().top : window.innerHeight;
      return { width: box.width, top: box.top, gap: bottom - box.bottom, position: getComputedStyle(el).position };
    });
    await input.waitFor();
    const size = await dockBounds();
    assert.equal(size.position, 'fixed');
    assert.ok(size.width <= 680 && size.width < width && size.gap >= 9);
    await page.evaluate(() => scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
    assert.deepEqual(await dockBounds(), size);
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    const say = async text => { await input.fill(text); await input.press('Enter'); };
    const users = page.locator('#page-chat .message.user');
    const detail = page.locator('.planner-details');
    const openDetails = async () => {
      if (!(await detail.evaluate(el => el.open))) await detail.locator('summary').click();
    };

    await say('3 adults, 6 nights in Rome');
    assert.equal(await page.locator('.reply-pick [data-page-favorite]').count(), 0);
    const quick = page.locator('#planner-quick');
    await quick.locator('summary').press('Enter');
    assert.equal(await quick.locator('[data-refine]').first().isVisible(), true);
    await quick.locator('summary').press('Escape');
    assert.equal(await quick.locator('[data-refine]').first().isVisible(), false);
    await page.locator('#clear-chat').click();
    assert.equal(await page.locator('#modal').evaluate(el => el.open), true);
    await page.keyboard.press('Escape');
    assert.equal(await users.count(), 1);
    await page.locator('#clear-chat').click();
    await page.locator('#planner-confirm').click();
    assert.equal(await users.count(), 0);
    await openDetails();
    assert.equal(await detail.locator('[name=adults]').inputValue(), '3');
    assert.equal(await detail.locator('[name=nights]').inputValue(), '6');
    await page.locator('#new-holiday').click();
    await page.locator('#planner-confirm').click();
    assert.equal(await users.count(), 0);
    await openDetails();
    assert.equal(await detail.locator('[name=adults]').inputValue(), '2');
    assert.equal(await detail.locator('[name=nights]').inputValue(), '5');
    if (width < 1000) await detail.locator('summary').click();

    const month = new Date();
    month.setDate(1);
    month.setMonth(month.getMonth() + 2);
    const isoMonth = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
    const calendar = page.locator('#planner-calendar');
    const picker = page.locator('#date-picker');
    await calendar.click();
    await picker.waitFor();
    await page.keyboard.press('Escape');
    await picker.waitFor({ state: 'hidden' });
    assert.equal(await calendar.evaluate(el => el === document.activeElement), true);
    await say('from Tel Aviv to Rome, 2 adults');
    const pickForRome = page.locator('[data-planner-date-destination="FCO"]');
    await pickForRome.click();
    await picker.waitFor();
    await picker.locator('#start-date').fill(`${isoMonth}-10`);
    await picker.locator('#end-date').fill(`${isoMonth}-15`);
    await picker.screenshot({ path: `${out}/planner-calendar-${lang}-${width}.png`, animations: 'disabled' });
    await picker.locator('.dp-apply').click();
    await picker.waitFor({ state: 'hidden' });
    assert.match(await calendar.innerText(), /10.*15/);
    await openDetails();
    assert.equal(await detail.locator('[name=nights]').inputValue(), '5');
    assert.ok(await detail.locator('[name=nights]').isDisabled());
    if (width < 1000) await detail.locator('summary').click();
    const buildLink = await page.locator('.reply-pick a[href^="#/build?dest=rome"]').getAttribute('href');
    assert.match(new URLSearchParams(buildLink.split('?')[1]).get('q'), /10\/.*15\//);
    await page.reload();
    await calendar.waitFor();
    assert.match(await calendar.innerText(), /10.*15/);
    await say('from Tel Aviv to Rome, 2 adults');

    const flights = page.locator('.reply-pick [data-planner-flight="FCO"]');
    const loader = page.locator('.flight-search-loader');
    const cardMotion = page.locator('.planner-reveal .reply-pick').first();
    assert.equal(await cardMotion.evaluate(el => getComputedStyle(el).animationName), 'travel-reveal');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await cardMotion.evaluate(el => getComputedStyle(el).animationName), 'none');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.screenshot({ path: `${out}/planner-cards-${lang}-${width}.png`, animations: 'disabled', style: '#toast { visibility: hidden }' });

    for (const mode of ['success', 'error', 'cancel']) {
      const endpoint = '**/api/volero/flights/search';
      let release, capture;
      const pending = new Promise(resolve => { release = resolve; });
      const request = new Promise(resolve => { capture = resolve; });
      await page.route(endpoint, async route => {
        capture(route.request().postDataJSON());
        await pending;
        if (mode === 'cancel') await route.abort();
        else if (mode === 'error') await route.fulfill({ status: 503, json: {} });
        else await route.fulfill({ json: { data: fixtureData } });
      });
      if (mode !== 'success') await page.goto(root + '#/planner');
      await flights.click();
      await loader.waitFor();
      const { originDestinations } = await request;
      assert.equal(originDestinations[0].destination.code, 'FCO');
      assert.deepEqual(originDestinations.map(leg => leg.date), [`${isoMonth}-10`, `${isoMonth}-15`]);
      assert.ok(await loader.locator('.flight-loader-skeleton').isVisible());
      assert.equal(await page.locator('#live-results').isVisible(), false);
      assert.ok(await page.locator('.search-submit').isDisabled());
      if (mode === 'success') await loader.screenshot({ path: `${out}/planner-flight-loading-${lang}-${width}.png` });
      if (mode === 'cancel') await page.locator('#cancel-flight-search').click();
      release();
      await loader.waitFor({ state: 'detached' });
      assert.equal(await page.locator('#live-results').isVisible(), mode === 'success');
      if (mode === 'success') {
        assert.ok(await page.locator('#live-results .flight-card').count());
        await page.locator('#live-results a[href="#/planner"]').click();
        await flights.waitFor();
      }
      const status = await page.locator('#search-feedback').innerText();
      if (mode === 'error') assert.match(status, /couldn’t|לא הצלחנו/);
      if (mode === 'cancel') assert.match(status, /stopped waiting|בוטלה/);
      await page.unroute(endpoint);
    }
    await page.goto(root + '#/planner');
    await calendar.click();
    await picker.locator('[data-mode="oneway"]').click();
    await picker.locator('.dp-apply').click();
    await picker.waitFor({ state: 'hidden' });
    assert.doesNotMatch(await calendar.innerText(), /–/);
    const oneWay = page.waitForRequest(r => r.url().includes('/api/volero/flights/search'));
    await page.route('**/api/volero/flights/search', route => route.fulfill({ json: { data: { offers: [] } } }));
    await flights.click();
    assert.deepEqual((await oneWay).postDataJSON().originDestinations.map(leg => leg.date), [`${isoMonth}-10`]);
    await page.goto(root + '#/planner');
    await page.locator('#planner-flexible').click();
    assert.equal(await page.locator('#planner-flexible').isVisible(), false);
    assert.deepEqual(errors, []);
    console.log(`${lang} ${width}px: exact and flexible dates, one-way, reset, shortcut menu, motion, and flight success/error/cancel passed`);
    await page.close();
  }
  const chat = await browser.newPage();
  await chat.route('**/api/status', route => route.fulfill({ json: { partner: { available: true } } }));
  let releasePartner;
  const pendingPartner = new Promise(resolve => { releasePartner = resolve; });
  await chat.route('**/api/ai/understand', async route => {
    await pendingPartner;
    await route.fulfill({ json: { partner: { used: true, question: 'לטייל בטבע או בעיר?' } } });
  });
  const statusReady = chat.waitForResponse(response => response.url().endsWith('/api/status'));
  await chat.goto(base + '/#/planner');
  await statusReady;
  const message = chat.locator('#page-chat-input');
  await message.fill('רוצים מקום עם הרבה טבע, מפלים ושווקים מקומיים, לא תיירותי מדי');
  await message.press('Enter');
  const working = chat.locator('#planner-working');
  await working.waitFor();
  releasePartner();
  await working.waitFor({ state: 'hidden' });
  assert.match(await chat.locator('#page-chat .assistant').last().innerText(), /לטייל בטבע או בעיר/);
  console.log('Planner partner status is visible only during the pending request');
  await chat.close();
} finally {
  await browser.close();
}
