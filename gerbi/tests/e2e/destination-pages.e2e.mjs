// 2026-11-23: the livelier destination page (guide cards, top attractions, things to do by kind, day trips, where to
// stay) and the Gerbi chat follow-up ("בלי ילדים", "תוסיף יומיים"…) in a real browser — no supplier calls.
//   PLAYWRIGHT_MODULE=… BASE_URL=http://localhost:4204 node tests/e2e/destination-pages.e2e.mjs
// Screenshots: verification/destinations-2026-11-23/ (OUT= to change).
import { mkdir } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const BASE = process.env.BASE_URL || 'http://localhost:4173';
const OUT = process.env.OUT || 'verification/destinations-2026-11-23';
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
let failures = 0;
const check = (ok, msg) => { if (!ok) failures++; console.log(ok ? '  ✓' : '  ✗', msg); };
const overflow = () => document.documentElement.scrollWidth - document.documentElement.clientWidth;
for (const [lang, width] of [['he', 1440], ['he', 375], ['en', 1440], ['en', 375]]) {
  const root = BASE + (lang === 'en' ? '/en/' : '/'), tag = `${lang}-${width}`;
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('response', (r) => { if (r.status() >= 400 && r.url().includes('/assets/')) errors.push(`${r.status()} ${r.url()}`); });
  console.log(`\n== ${tag}`);
  for (const id of ['paris', 'japan', 'rio']) {
    await page.goto(root + '#/destination/' + id); await page.waitForSelector('.dest-sec-top');
    await page.waitForFunction(() => document.querySelectorAll('.attr-media img').length > 0, null, { timeout: 8000 }).catch(() => {});
    const s = await page.evaluate(() => ({
      guide: document.querySelectorAll('.dest-guide dl > div').length, top: document.querySelectorAll('.dest-top .attr-card').length,
      todo: document.querySelectorAll('#dest-todo-list .attr-card').length, todoShown: [...document.querySelectorAll('#dest-todo-list .attr-card')].filter((x) => !x.hidden).length,
      kinds: document.querySelectorAll('[data-attr-kind]').length, areas: document.querySelectorAll('.area-card').length, prices: document.querySelectorAll('.area-price').length,
      imgs: document.querySelectorAll('.attr-media img').length, noAlt: [...document.querySelectorAll('.detail-layout img')].filter((i) => !i.hasAttribute('alt')).length,
      credits: document.querySelectorAll('.attr-credit').length,
      headings: [...document.querySelectorAll('.detail-layout h2, .detail-layout h3, .detail-layout h4')].map((h) => +h.tagName[1])
    }));
    console.log('  ', id, JSON.stringify({ ...s, headings: s.headings.join('') }));
    check(s.top >= 2 && s.areas >= 4 && s.kinds >= 3, `${id}: top attractions, kind chips, area cards`);
    check(s.imgs >= 1 && s.credits === s.imgs && s.noAlt === 0, `${id}: attraction photos load, each credited, every image has alt`);
    check(s.headings.every((h, i) => i === 0 || h <= s.headings[i - 1] + 1), `${id}: heading order has no jumps`);
    check(await page.evaluate(overflow) <= 0, `${id}: no horizontal overflow`);
    if (id === 'paris') check(s.guide === 6 && s.prices === 5, 'paris: 6 guide cards and a price level on each area');
    if (id === 'rio') {
      await page.locator('.dest-hero img').evaluate(img => img.decode());
      const topPhotos = await page.locator('.dest-top .attr-card img').all();
      check(topPhotos.length === s.top, 'rio: every leading attraction has its own photo');
      for (const photo of topPhotos) {
        await photo.scrollIntoViewIfNeeded();
        await photo.evaluate(img => img.decode());
      }
      check(await page.locator('.dest-top .photo-place-caption').first().evaluate(el => getComputedStyle(el).position === 'absolute'), 'rio: titles use the photo overlay');
    }
    await page.screenshot({ path: `${OUT}/destination-${id}-${tag}.png`, fullPage: true });
    // kind chip narrows, "all" + show more restores
    if (s.todo > s.todoShown) {
      await page.click('#dest-todo-more'); check(await page.locator('#dest-todo-list .attr-card:not([hidden])').count() === s.todo, `${id}: "show more" shows every idea`);
    }
    if (id === 'rio') {
      const todo = page.locator('#dest-todo-list .attr-card:not([hidden])');
      const photos = await todo.locator('.attr-media img').all();
      const sources = await todo.locator('.attr-media img').evaluateAll(imgs => imgs.map(img => img.getAttribute('src')));
      check(s.todo === 10 && photos.length === s.todo && new Set(sources).size === s.todo, 'rio: all ten things to do have distinct photos');
      for (const photo of photos) {
        await photo.scrollIntoViewIfNeeded();
        await photo.evaluate(img => img.decode());
      }
      check(await todo.locator('.photo-place-caption').evaluateAll(titles => titles.length > 0 && titles.every(title => getComputedStyle(title).position === 'absolute')), 'rio: all things to do use the photo overlay');
      check(await todo.locator('.attr-credit a').count() === s.todo, 'rio: all things-to-do photos link to their credits');
    }
    const kind = await page.locator('[data-attr-kind]:not([data-attr-kind="all"])').first().getAttribute('data-attr-kind');
    await page.click(`[data-attr-kind="${kind}"]`);
    check(await page.$$eval('#dest-todo-list .attr-card:not([hidden])', (a, k) => a.length > 0 && a.every((x) => x.dataset.kind === k), kind), `${id}: the "${kind}" chip shows only that kind`);
    await page.click('[data-attr-kind="all"]');
    if (id === 'rio') {
      const main = '**/assets/destinations/rio.webp';
      await page.route(main, route => route.abort());
      await page.reload();
      await page.waitForFunction(() => {
        const img = document.querySelector('.dest-hero img');
        return img?.complete && img.naturalWidth > 0 && img.getAttribute('src').endsWith('/rio-600.webp');
      });
      check(true, 'rio: destination header shows the local thumbnail if the large photo fails');
      await page.unroute(main);
    }
  }
  // Gerbi chat: ask for Paris, then refine in free text.
  await page.goto(root + '#/planner'); await page.waitForSelector('#page-chat-input');
  check(await page.locator('.planner-starters [data-quick]').count() === 3, 'planner has three starting prompts');
  check(await page.locator('.floating-composer-dock').evaluate(el => getComputedStyle(el).position === 'fixed'), 'planner starts with the floating composer');
  check(await page.locator('.planner-links a[href="#/destinations"]').isVisible(), 'destination shortcuts are available');

  const details = page.locator('.planner-details');
  if (!(await details.evaluate((el) => el.open))) await details.locator('summary').click();
  check(await details.locator('[name=adults]').isVisible(), 'trip details can be edited');
  if (width < 1000) await details.locator('summary').click();
  await page.screenshot({ path: `${OUT}/ai-welcome-${tag}.png`, animations: 'disabled' });
  const say = async (text) => {
    const input = page.locator('#page-chat-input');
    await input.fill(text);
    await input.press('Enter');
    return page.locator('#page-chat .message.assistant').last();
  };
  let reply = await say(lang === 'en' ? '2 adults 2 kids, 5 nights in Paris in June' : '2 מבוגרים 2 ילדים ביוני 5 לילות פריז');
  let text = await reply.innerText();
  check(!/(עדיין לא בקטלוג|isn’t in our)/.test(text), 'Paris is not "missing" in the reply');
  check(/פריז|Paris/.test(await reply.locator('.reply-pick').first().innerText()), 'the reply leads with Paris');
  check(await reply.locator('.reply-pick a[href="#/?to=PAR"]').count() === 1 && await reply.locator('.reply-pick a[href="#/build?dest=paris"]').count() === 1, 'Paris pick: flights + trip builder CTAs');
  const paris = reply.locator('.reply-pick').first();
  check(await paris.locator('.flight-entry-panel img').count() === 1, 'requested destination uses the full-photo card');
  check(await paris.locator('.flight-entry-cta').isVisible(), 'the photo card keeps its search CTA');
  check(await reply.locator('.flight-entry-panel img').count() === await reply.locator('.reply-pick').count(), 'all destination cards use a full photo');
  check(await reply.locator('.reply-pick [data-page-favorite]').count() === 0, 'destination cards omit the like button');
  const why = paris.locator('.travel-card-why');
  check(!(await why.locator('.planner-reasons').isVisible()), 'recommendation reasons start collapsed');
  await why.locator('summary').press('Enter');
  check(await why.locator('.planner-reasons').isVisible() && await paris.locator('.planner-pick-summary').isVisible(), 'recommendation reasons open with the keyboard');
  const map = new URL(await paris.locator('.planner-map').getAttribute('href'));
  check(map.hostname === 'www.google.com' && map.searchParams.get('query') === 'Paris, France', 'Paris card opens the correct map');
  check(await page.evaluate(overflow) <= 0, 'planner: no horizontal page overflow');
  check(await page.locator('.reply-pick-list').evaluate(el => el.scrollWidth <= el.clientWidth + 1), 'destination cards fit as stacked rows');
  check(await page.locator('#planner-prompts [data-refine]').count() >= 3 && await page.locator('#page-chat-input').isVisible(), 'refine chips + the input are under the reply');
  await page.screenshot({ path: `${OUT}/ai-reply-${tag}.png`, fullPage: false });
  reply = await say(lang === 'en' ? 'no kids' : 'בלי ילדים');
  reply = await say(lang === 'en' ? 'add 2 days' : 'תוסיף יומיים');
  text = await reply.innerText();
  console.log('   follow-up:', text.replace(/\n+/g, ' / ').slice(0, 220));
  check(/7/.test(await reply.locator('.reply-now').innerText()) && /פריז|Paris/.test(await reply.locator('.reply-now').innerText()), 'the brief keeps Paris and now has 7 nights');
  check(await page.locator('#page-chat .reply-picks').count() === 1, 'the directions update in place (only on the latest reply)');
  await page.locator('#planner-quick summary').click();
  await page.locator('#planner-prompts [data-refine]').nth(2).click(); await page.waitForTimeout(400);
  check(await page.locator('#page-chat .message.assistant').count() >= 4, 'a refine chip sends a follow-up');
  await page.locator('#page-chat-input').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${OUT}/ai-followup-${tag}.png`, fullPage: false });
  await page.goto(root + '#/results'); await page.waitForSelector('#recommendation-list');
  check(/פריז|Paris/.test(await page.locator('.results-requested').innerText()) && await page.locator('.constraint-note').count() === 0, 'results lead with Paris, no "missing" note');
  await page.screenshot({ path: `${OUT}/results-${tag}.png`, fullPage: false });
  check(await page.evaluate(overflow) <= 0, 'results: no horizontal overflow');
  check(errors.length === 0, `no page errors / missing assets ${errors.slice(0, 3).join(' ; ')}`);
  await page.close();
}
await browser.close();
console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed');
process.exitCode = failures ? 1 : 0;
