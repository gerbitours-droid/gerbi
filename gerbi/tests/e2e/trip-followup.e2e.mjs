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
} finally {
  await browser.close();
}
