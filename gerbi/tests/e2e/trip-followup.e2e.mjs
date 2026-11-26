// Run against a local Gerbi server. Supplier calls are intercepted to exercise planning without live inventory.
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.BASE_URL || 'http://localhost:4198';
const browser = await chromium.launch();

try {
  for (const [lang, width] of [['he', 1024], ['he', 320], ['en', 375]]) {
    const page = await browser.newPage({ viewport: { width, height: 850 } });
    await page.goto(base + (lang === 'en' ? '/en/' : '/'));
    const travelers = page.locator('#travelers-button');
    await travelers.click();
    await page.locator('[data-counter="child-plus"]').click();
    await page.locator('[data-counter="child-plus"]').click();
    await page.locator('#save-travelers').click();
    const layout = await travelers.evaluate((button) => {
      const bounds = button.getBoundingClientRect();
      const children = button.querySelector('#travelers-children');
      const value = button.querySelector('#travelers-value');
      const fits = (el) => {
        const rect = el.getBoundingClientRect();
        return rect.top >= bounds.top && rect.bottom <= bounds.bottom && rect.left >= bounds.left && rect.right <= bounds.right && el.scrollWidth <= el.clientWidth + 1;
      };
      return { fits: [children, value, button.querySelector('.field-label'), button.querySelector('svg')].every(fits), value: value.textContent, kids: children.textContent };
    });
    assert.equal(layout.fits, true, `${lang} ${width}px: all parts fit inside the traveller button`);
    assert.match(layout.value, /4/);
    assert.match(layout.kids, /2/);
    await page.close();
  }
  const page = await browser.newPage({ viewport: { width: 1280, height: 880 } });
  await page.route('**/api/build/flights', (route) => route.fulfill({ json: { status: 'quote' } }));
  await page.route('**/api/build/hotels', (route) => route.fulfill({ json: { status: 'quote' } }));
  const planResponse = () => page.waitForResponse((res) => res.url() === base + '/api/build' && res.request().method() === 'POST');
  const nextYear = new Date().getFullYear() + 1;
  const text = `זוג וילד בן 8, רומא, 10 עד 15 במרץ ${nextYear}, עם ארוחת בוקר`;
  const initialResponse = planResponse();
  await page.goto(base + '/#/build?q=' + encodeURIComponent(text));
  const initial = await (await initialResponse).json();
  await page.locator('.bk-summary').waitFor();
  assert.equal(initial.request.start.slice(5, 7), '03');
  const entry = page.locator('#build-follow-text');
  const changedText = 'הטיול צריך להיות בינואר';
  await entry.fill(changedText);
  const updatedResponse = planResponse();
  const flightsRequest = page.waitForRequest((req) => req.url() === base + '/api/build/flights' && req.postDataJSON()?.search?.originDestinations[0]?.date?.slice(5, 7) === '01');
  const hotelsRequest = page.waitForRequest((req) => req.url() === base + '/api/build/hotels' && req.postDataJSON()?.search?.checkIn?.slice(5, 7) === '01');
  await entry.press('Enter');
  const response = await updatedResponse;
  const updated = await response.json();
  assert.ok(response.ok());
  assert.equal(response.request().postDataJSON().current.request.start, initial.request.start);
  assert.equal(updated.request.start.slice(5, 7), '01');
  assert.equal(updated.flightSearch.originDestinations[0].date, updated.request.start);
  assert.equal(updated.hotelSearches[0].checkIn, updated.request.start);
  assert.equal(updated.destination.id, 'rome');
  assert.equal(updated.request.nights, initial.request.nights);
  assert.deepEqual(updated.request.childAges, initial.request.childAges);
  assert.equal(updated.request.needs.board, initial.request.needs.board);
  await Promise.all([flightsRequest, hotelsRequest]);
  await page.locator('.bk-reply').filter({ hasText: updated.request.start }).waitFor();
  await page.waitForFunction(() => document.querySelector('#build-follow-text').value === '');
  console.log('PASS: January updates the result and both supplier searches, travellers fit at 320–1024px');

  const overviewResponse = planResponse();
  const route = 'חופשה זוגית בסיציליה, 7 לילות בתקציב של 4800 שקל';
  await page.goto(base + '/#/build?dest=sicily&q=' + encodeURIComponent(route));
  const overviewPlan = await (await overviewResponse).json();
  assert.ok(overviewPlan.stops.length > 1, 'the overview covers a multi-stop title');
  const overview = page.locator('.bk-overview');
  await overview.locator('.bk-summary h2').waitFor();
  await overview.locator('.bk-hero-img').evaluate((img) => img.decode());
  for (const [width, stacked] of [[320, true], [632, true], [768, true], [900, false], [1280, false]]) {
    await page.setViewportSize({ width, height: 880 });
    const layout = await overview.evaluate((root) => {
      const box = (selector) => root.querySelector(selector).getBoundingClientRect();
      const card = box('.bk-summary'), photo = box('.bk-hero-img'), body = box('.bk-summary-body');
      const buttonsFit = [...root.querySelectorAll('.bk-jumps button')].every((button) => button.scrollWidth <= button.clientWidth + 1);
      return {
        stacked: photo.bottom <= body.top + 1,
        fullHeight: photo.width >= card.width / 4 && Math.abs(photo.height - body.height) <= 1,
        inside: card.left >= 0 && card.right <= innerWidth && buttonsFit && document.documentElement.scrollWidth <= innerWidth + 1,
      };
    });
    assert.equal(layout.stacked, stacked, `${width}px: overview layout`);
    assert.ok(stacked || layout.fullHeight, `${width}px: side photo covers the full card height`);
    assert.ok(layout.inside, `${width}px: overview and shortcuts fit`);
  }
  const coverRequest = new URL(overviewPlan.destination.image, base).href;
  await page.route(coverRequest, (request) => request.abort());
  await page.reload();
  await overview.locator('.bk-summary-media').waitFor({ state: 'attached' });
  await overview.locator('.bk-summary-media').waitFor({ state: 'hidden' });
  const fallbackFillsCard = await overview.locator('.bk-summary').evaluate((card) =>
    Math.abs(card.querySelector('.bk-summary-body').clientWidth - card.clientWidth) <= 1);
  assert.ok(fallbackFillsCard, 'a failed photo leaves the content at full width');
  console.log('PASS: multi-stop overview fits at 320, 632, 768, 900 and 1280px, including a missing photo');

  const hotel = { id: 'ath-test', name: 'Hotel Test', address: '12 Ermou Street', price: { value: 310, currency: 'EUR' }, nights: 5 };
  await page.route('**/api/build/hotels', (r) => r.fulfill({ json: { status: 'live', total: 1, picks: [hotel] } }));
  await page.goto(base + '/#/build?dest=athens&q=' + encodeURIComponent('זוג, 5 לילות באתונה'));
  const nearbyHotel = page.locator('#bc-hotels .bk-nearby').first();
  const mapQuery = async (link) => new URL(await link.getAttribute('href')).searchParams.get('query');
  assert.match(await mapQuery(nearbyHotel), /hotels.*12 Ermou Street.*Athens/i);
  const market = page.locator('.bk-att').filter({ hasText: 'שוק הפשפשים במונסטירקי' });
  await page.locator('.bk-attractions').waitFor();
  if (!await market.count()) await page.locator('[data-more-att]').click();
  assert.match(await mapQuery(market.locator('.bk-nearby')), /tourist attractions.*Monastiraki/i);
  const marketPhoto = market.locator('img[src$="/monastiraki-flea-market.webp"]');
  await marketPhoto.scrollIntoViewIfNeeded();
  assert.ok(await marketPhoto.evaluate(async (img) => { await img.decode(); return img.naturalWidth > 0; }));
  console.log('PASS: hotel and attraction area searches, and the Monastiraki photo');
} finally {
  await browser.close();
}
