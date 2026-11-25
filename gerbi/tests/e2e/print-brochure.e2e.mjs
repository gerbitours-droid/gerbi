// Run against a local server with GERBI_SUPPLIER_FIXTURES=1. OUT optionally saves sample PDFs.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.BASE_URL || 'http://localhost:4192';
const out = process.env.OUT;
if (out) await mkdir(out, { recursive: true });
const browser = await chromium.launch();
try {
  for (const { lang, destination, width, theme } of [
    { lang: 'he', destination: 'rio', width: 1440, theme: 'coast' },
    { lang: 'en', destination: 'rome', width: 375, theme: 'city' },
  ]) {
    const page = await browser.newPage({ viewport: { width, height: 960 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript(() => { window.print = () => { window.printCalls = (window.printCalls || 0) + 1; }; });
    // The recorded supplier fixture is for Rome only.
    if (destination === 'rio') {
      await page.route('**/api/build/flights', (route) => route.fulfill({ json: { status: 'quote' } }));
    }

    await page.goto(base + (lang === 'en' ? '/en/' : '/') + '#/build?dest=' + destination);
    await page.locator('.bk-day').first().waitFor({ timeout: 30000 });
    await page.waitForFunction(() => !document.querySelector('#bc-flights .bk-pending'));
    const print = page.locator('[data-act="print"]');
    const brochure = page.locator('#bk-brochure');
    await print.click();
    await page.waitForFunction(() => window.printCalls === 1);
    const info = await brochure.evaluate((el) => {
      const cover = el.querySelector('.br-cover');
      return {
        theme: el.firstElementChild.className,
        route: cover.querySelector('.br-cover-route')?.textContent,
        hero: cover.querySelector('.br-cover-img')?.naturalWidth,
        collage: [...cover.querySelectorAll('.br-cover-card')].map((card) => ({
          src: card.querySelector('img').getAttribute('src'), label: card.textContent.trim(),
        })),
        itinerary: [...el.querySelectorAll('.br-item h4')].map((title) => title.firstChild.textContent.trim()),
        photoDays: el.querySelectorAll('.br-day-photo:not([hidden])').length,
        brokenLocalImages: [...el.querySelectorAll('img[hidden]')].filter((img) => img.getAttribute('src').startsWith('/assets/')).length,
        coverFontLoaded: document.fonts.check('700 35pt "Amatic SC"', cover.querySelector('.br-cover-script').textContent),
        credits: el.querySelectorAll('.br-photo-credits a').length,
        direction: getComputedStyle(el).direction,
      };
    });
    assert.equal(info.theme, `br-theme-${theme}`);
    assert.equal(info.direction, lang === 'he' ? 'rtl' : 'ltr');
    assert.equal(info.route, destination === 'rome' ? 'TLVFCO' : undefined);
    assert.ok(info.hero > 600 && info.photoDays > 0 && info.credits > 0);
    assert.equal(info.collage.length, 3);
    assert.ok(info.collage.every((photo) => info.itinerary.includes(photo.label)));
    assert.equal(new Set(info.collage.map((photo) => photo.src)).size, 3);
    assert.equal(info.coverFontLoaded, true);
    assert.equal(info.brokenLocalImages, 0);

    const pdf = await page.pdf({ path: out ? join(out, `gerbi-${destination}.pdf`) : undefined, preferCSSPageSize: true, printBackground: true });
    const pageCount = [...pdf.toString('latin1').matchAll(/\/Type \/Page\b/g)].length;
    assert.ok(pageCount >= 2 && pageCount <= 9, `${destination} six-day brochure should fit within nine pages; got ${pageCount}`);
    await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
    assert.equal(await brochure.count(), 0);
    const hero = brochure.locator('.br-cover-img');
    const heroUrl = await page.evaluate(async (id) => (await import('/catalog.mjs')).byId(id).image.src, destination);
    await page.route('**' + heroUrl, (route) => route.abort());
    await print.click();
    await page.waitForFunction(() => window.printCalls === 2);
    assert.ok(await hero.evaluate((img) => img.naturalWidth > 0 && img.getAttribute('src') === img.dataset.fallback));
    assert.deepEqual(errors, []);
    console.log(`PASS ${destination} ${lang}: ${pageCount} pages, cover font, itinerary photography, image fallback and cleanup`);
    await page.close();
  }
} finally {
  await browser.close();
}
