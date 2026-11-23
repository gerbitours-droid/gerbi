// Spec 24 in the browser: the magic trip builder (#/build) in Hebrew and English, 1440 + 375.
// Recorded supplier answers (no live calls):
//   GERBI_SUPPLIER_FIXTURES=1 [GERBI_AI_MOCK_URL=http://127.0.0.1:4199/v1/chat/completions] PORT=4192 node server.mjs &
//   PLAYWRIGHT_MODULE=… BASE_URL=http://localhost:4192 OUT=verification/24-builder [NOKEY=1] [ADMIN_PASSWORD=…] node tests/e2e/build.e2e.mjs
// One live run against the real supplier (a running server with credentials, no fixtures): LIVE=1 (1440 Hebrew only).
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const BASE = process.env.BASE_URL || 'http://localhost:4192', OUT = process.env.OUT || 'verification/24-builder', NOKEY = process.env.NOKEY === '1', LIVE = process.env.LIVE === '1';
// PUBLIC=1: the server runs with HOTELS_PUBLIC_DISPLAY=1 (named hotels); default = hotels private (aggregate estimate only).
const PUBLIC = process.env.PUBLIC === '1';
const sfx = (LIVE ? '-live' : NOKEY ? '-nokey' : '') + (PUBLIC ? '-public' : '');
const results = [], check = (name, ok, extra = '') => { results.push({ name, ok: !!ok }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? ' — ' + extra : '')); };
const noHScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
const TEXT = { he: 'זוג עם ילד בן 8, 4 לילות ברומא בינואר, מלון 4 כוכבים, עם רכב', en: 'A couple with a child aged 8, 4 nights in Rome in January, a 4-star hotel, with a car' };
const SUGGEST = { he: 'ירח דבש, 6 לילות, יוקרה, תציעו לנו לאן', en: 'Honeymoon, 6 nights, luxury, suggest where' };
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const settled = (page) => page.waitForFunction(() => !document.querySelector('#bc-flights .bk-pending') && !document.querySelector('#bc-hotels .bk-pending') && document.querySelector('#bc-flights h3'), null, { timeout: LIVE ? 90000 : 30000 });
try {
  const runs = LIVE ? [[1440, 'he']] : [[1440, 'he'], [375, 'he'], [1440, 'en'], [375, 'en']];
  for (const [run, [width, l]] of runs.entries()) {
    // Each run makes ~8 supplier-route calls; the builder allows 16 a minute per visitor, so runs are spaced.
    if (run) await new Promise((r) => setTimeout(r, 30000));
    const tag = `${width}-${l}`;
    const ctx = await browser.newContext({ viewport: { width, height: width > 500 ? 1000 : 820 }, locale: l === 'en' ? 'en-GB' : 'he-IL', deviceScaleFactor: width > 500 ? 1 : 2 });
    await ctx.addInitScript(() => { Object.defineProperty(navigator, 'share', { value: undefined }); });
    // Every country a "did you know?" card showed while Gerbi thought (23.11.2026: must be the destination's).
    await ctx.addInitScript(() => { window.__dyk = new Set(); new MutationObserver(() => document.querySelectorAll('.did-you-know[data-country]').forEach((x) => window.__dyk.add(x.dataset.country)) || (window.__think = Math.max(window.__think || 0, document.querySelector('.bk-think .bk-think-mascot img') ? document.querySelectorAll('.bk-think .bk-think-steps li').length : 0))).observe(document, { subtree: true, childList: true, attributes: true }); });
    const page = await ctx.newPage(), errors = [], supplierCalls = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('request', (r) => { if (/\/api\/build\/(flights|hotels)/.test(r.url())) supplierCalls.push(r.url()); });
    const home = BASE + (l === 'en' ? '/en/' : '/');

    // Home: the big prompt opens the builder with the text.
    await page.goto(home);
    await page.waitForSelector('#magic-text');
    check(`${tag} home shows the magic prompt + nav link`, await page.locator('#magic-form label').isVisible() && await page.locator('header nav a[href="#/build"], #mobile-menu a[href="#/build"]').count() >= 1);
    if (!LIVE) await page.screenshot({ path: `${OUT}/${tag}-home-prompt${sfx}.png`, clip: { x: 0, y: 0, width, height: width > 500 ? 520 : 700 } });
    let releasePlan;
    if (!LIVE) {
      const gate = new Promise((resolve) => { releasePlan = resolve; });
      await page.route('**/api/build', async (route) => { await gate; await route.continue(); }, { times: 1 });
    }
    await page.fill('#magic-text', TEXT[l]);
    await page.click('.magic-submit');
    // 23.11.2026: an animated "Gerbi is thinking" stage with steps that tick, then the plan before the prices.
    await page.waitForSelector('.bk-think .bk-think-steps li', { timeout: 10000 });
    check(`${tag} thinking stage: mascot + 5 steps`, await page.evaluate(() => window.__think) === 5);
    if (!LIVE) await page.locator('.bk-think').first().screenshot({ path: `${OUT}/${tag}-thinking${sfx}.png` }).catch(() => {});
    if (!LIVE) {
      try {
        await page.locator('[data-poll="flight.direct"]').click();
        check(`${tag} can answer a preference before the plan arrives`, await page.locator('[data-poll-step="1"]').isVisible());
      } finally { releasePlan(); }
    }
    await page.waitForSelector('#bc-itinerary .bk-day', { timeout: 15000 });
    check(`${tag} prompt opens #/build and plans immediately`, page.url().includes('#/build?q='));
    await page.waitForSelector('#bc-flights .bk-pending, #bc-flights [data-pick-flight], #bc-flights .bk-quote', { timeout: 10000 });
    check(`${tag} skeleton (itinerary + practical) before supplier answers`, await page.locator('#bc-itinerary .bk-day').count() >= 4 && await page.locator('#bc-practical dt').count() >= 3);
    await settled(page);
    const flights = await page.locator('[data-pick-flight]').count(), hotels = await page.locator('[data-pick-hotel]').count();
    check(`${tag} flights card: live picks with check time`, flights >= 1 && flights <= 3 && /\d{1,2}:\d{2}/.test(await page.textContent('#bc-flights')), `${flights} picks`);
    if (PUBLIC) check(`${tag} hotels card: live hotels with stars and stay price`, hotels >= 1 && await page.locator('#bc-hotels .bk-stars').count() >= 1, `${hotels} hotels`);
    else check(`${tag} hotels card (private): area + star level + estimate range, no hotel names or photos`, hotels === 0 && await page.locator('#bc-hotels img').count() === 0
      && /₪[\s\S]*₪/.test(await page.textContent('#bc-hotels .bk-hotel-est')) && (l === 'en' ? /Estimate[\s\S]*4★/ : /הערכה[\s\S]*4★/).test(await page.textContent('#bc-hotels')));
    check(`${tag} understood chips show travellers/car/stars`, await page.locator('.bk-understood .understood-chip').count() >= 3);
    const total = await page.textContent('#bc-total');
    check(`${tag} total: live + estimate range + quote legend`, (l === 'en' ? /Live[\s\S]*Estimate[\s\S]*On request/ : /חי[\s\S]*הערכה[\s\S]*לפי הצעה/).test(total) && /₪/.test(total));
    check(`${tag} car included → car line "on request"`, await page.locator('[data-car]').isChecked() && (l === 'en' ? /Car rental/ : /השכרת רכב/).test(total));
    const html = await page.content();
    check(`${tag} no supplier name anywhere in the page (text, links, images)`, !/volero/i.test(html));
    check(`${tag} every item has a Google Maps search link`, await page.locator('#bc-itinerary a[href^="https://www.google.com/maps/search/?api=1&query="]').count() >= 3);
    await page.screenshot({ path: `${OUT}/${tag}-package${sfx}.png`, fullPage: true });
    check(`${tag} no horizontal scroll`, await noHScroll(page));
    if (LIVE) { check(`${tag} live: flight prices are live and hotels are ${PUBLIC ? 'live' : 'a live-based estimate'}`, flights > 0 && (PUBLIC ? hotels > 0 : await page.locator('#bc-hotels .bk-hotel-est').count() === 1)); await ctx.close(); continue; }
    check(`${tag} the preference stays available after prices arrive`, await page.locator('#bc-live [data-poll-step="1"]').isVisible() && await page.locator('#bc-live [data-poll-apply]').isVisible());
    await page.locator('[data-build-jump="itinerary"]').focus();
    await page.keyboard.press('Enter');
    check(`${tag} the itinerary shortcut moves keyboard focus to its section`, await page.evaluate(() => document.activeElement?.id === 'bh-itinerary'));

    const dyk = await page.evaluate(() => [...window.__dyk]);
    check(`${tag} did-you-know facts are about Italy (Rome)`, dyk.every((c) => c === 'IT'), dyk.join(',') || 'not shown (all answers within the grace time)');
    check(`${tag} live strip finished`, await page.locator('#bc-live').count() === 0 || await page.locator('#bc-live.bk-live-done').count() === 1);
    // Attractions: photo, meta, rough price, and one tap adds one to a day.
    const atts = await page.locator('#bc-attractions .bk-att').count();
    check(`${tag} attractions section: 6+ cards with photos and visit time`, atts >= 6 && await page.locator('#bc-attractions .bk-att-img img').count() >= 3 && await page.locator('#bc-attractions .bk-att-meta').count() === atts);
    await page.locator('#bc-attractions').screenshot({ path: `${OUT}/${tag}-attractions${sfx}.png` });
    if (await page.locator('[data-more-att]').count()) await page.click('[data-more-att]');
    const inPlan = await page.locator('.bk-att-in').count(), planItems = await page.locator('[data-remove-item]').count();
    await page.locator('[data-add-att]').first().click();
    check(`${tag} attraction added to a day`, await page.locator('.bk-att-in').count() === inPlan + 1 && await page.locator('[data-remove-item]').count() === planItems + 1);
    // More ideas per day (rules) and, with a key, "expand with Gerbi".
    await page.locator('[data-day-more]').first().click();
    check(`${tag} day "more ideas": catalog ideas of other kinds`, await page.locator('.bk-day-more [data-add-more]').count() >= 1);
    const beforeMore = await page.locator('[data-remove-item]').count();
    await page.locator('.bk-day-more [data-add-more]').first().click();
    check(`${tag} add an idea to the day`, await page.locator('[data-remove-item]').count() === beforeMore + 1);
    if (!NOKEY) {
      await page.locator('[data-expand-day]').first().click();
      await page.waitForSelector('.bk-ai-box [data-add-idea]', { timeout: 15000 });
      check(`${tag} expand with Gerbi: tip + extra ideas marked AI`, await page.locator('.bk-ai-box [data-add-idea]').count() >= 1 && await page.locator('.bk-ai-box .bk-ai').count() === 1);
      await page.locator('[data-expand-stay]').first().click();
      await page.waitForSelector('.bk-stay-pc', { timeout: 15000 });
      check(`${tag} where to stay with Gerbi: pros / cons / price level`, await page.locator('.bk-stay-pc').count() >= 2);
    } else check(`${tag} without a key: no "expand with Gerbi" buttons`, await page.locator('[data-expand-day], [data-expand-stay]').count() === 0);
    await page.locator('.bk-day', { has: page.locator('.bk-day-more') }).first().screenshot({ path: `${OUT}/${tag}-more-ideas${sfx}.png` });
    check(`${tag} where to stay: areas with whom they suit`, await page.locator('#bc-stay .bk-stay-area').count() >= 2);
    await page.locator('#bc-stay').screenshot({ path: `${OUT}/${tag}-where-to-stay${sfx}.png` });

    // Choose another flight → the total follows.
    if (flights > 1) { const before = await page.textContent('#bc-total'); await page.locator('[data-pick-flight]').nth(1).click(); check(`${tag} picking another flight updates the total`, (await page.textContent('#bc-total')) !== before && await page.locator('[data-pick-flight][aria-pressed=true]').count() === 1); }
    // Itinerary: move a day, remove and re-add an item (keyboard focus stays on the control).
    const firstMovable = page.locator('[data-day-down]:not([disabled])').first();
    const titleBefore = await page.locator('.bk-day-head strong').nth(1).textContent();
    await firstMovable.focus(); await page.keyboard.press('Enter');
    check(`${tag} move a day down with the keyboard`, (await page.locator('.bk-day-head strong').nth(1).textContent()) !== titleBefore && await page.evaluate(() => document.activeElement?.matches('[data-day-down]')));
    const items = await page.locator('[data-remove-item]').count();
    await page.locator('[data-remove-item]').first().click();
    check(`${tag} remove an item → it moves to "more ideas"`, await page.locator('[data-remove-item]').count() === items - 1 && await page.locator('[data-add-spare]').count() >= 1);
    await page.locator('.bk-spare summary').click(); await page.locator('[data-add-spare]').first().click();
    check(`${tag} add it back`, await page.locator('[data-remove-item]').count() === items);
    // Insurance add-on (Harel): on request, carried in the total and the lead.
    await page.locator('[data-insurance]').check();
    check(`${tag} insurance add-on adds an "on request" line`, (l === 'en' ? /Travel insurance \(Harel\)/ : /ביטוח נסיעות \(הראל\)/).test(await page.textContent('#bc-total')));
    // Car off → the car line leaves the total.
    await page.locator('[data-car]').uncheck();
    check(`${tag} car toggle removes the car line`, !(l === 'en' ? /Car rental/ : /השכרת רכב/).test(await page.textContent('#bc-total')));
    // Edit: 6 nights → rebuilt with 7 days.
    await page.click('.bk-edit summary'); await page.fill('#build-edit [name=nights]', '6'); await page.click('#build-edit [type=submit]');
    await page.waitForFunction(() => document.querySelectorAll('#bc-itinerary .bk-day').length === 7, null, { timeout: 15000 });
    await settled(page);
    check(`${tag} edit nights rebuilds (7 days)`, true);
    // Share: a link that reopens the same package with no supplier call.
    await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE });
    await page.click('[data-act="share"]');
    await page.waitForFunction(() => /\S/.test(document.querySelector('#build-act-status')?.textContent || '') || document.querySelector('.bk-share-url'), null, { timeout: 10000 });
    const link = await page.evaluate(async () => document.querySelector('.bk-share-url')?.value || await navigator.clipboard.readText().catch(() => ''));
    check(`${tag} share link created`, /#\/build\?p=[a-f0-9]{16}$/.test(link), link.replace(/.*#/, '#'));
    if (link) {
      const before = supplierCalls.length, other = await ctx.newPage();
      other.on('request', (r) => { if (/\/api\/build\/(flights|hotels)/.test(r.url())) supplierCalls.push(r.url()); });
      await other.goto(link); await other.waitForSelector('#bc-flights h3');
      check(`${tag} shared link opens the package without supplier calls`, supplierCalls.length === before && await other.locator('#bc-itinerary .bk-day').count() === 7);
      await other.close();
    }
    // Hand-off: send to a representative (lead type package). Leads are limited to 5 per 10 minutes per visitor: wide screens only.
    if (width > 500 && (l === 'he' || process.env.LEADS_EN === '1')) {
    await page.click('[data-act="lead"]');
    await page.waitForSelector('#build-lead');
    await page.click('#build-lead [type=submit]');
    check(`${tag} lead form shows inline errors`, await page.locator('#build-lead .invalid').count() >= 2);
    await page.fill('#bl-name', l === 'en' ? 'Dana Test' : 'דנה בדיקה'); await page.fill('#bl-phone', '050-1234567'); await page.check('#build-lead [name=consent]');
    await page.click('#build-lead [type=submit]');
    await page.waitForFunction(() => /\b[0-9a-f]{8}\b/.test(document.querySelector('#bc-lead')?.textContent || ''), null, { timeout: 10000 });
    check(`${tag} package lead sent (reference shown)`, true);
    await page.locator('#bc-lead').screenshot({ path: `${OUT}/${tag}-lead-sent${sfx}.png` });
    }

    // 23.11.2026: keep editing by text after the route is built – the package updates (one more day, in Florence).
    const daysNow = await page.locator('#bc-itinerary .bk-day').count();
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    if (width < 500) { await page.waitForTimeout(600); check(`${tag} "talk to Gerbi" button floats on the phone`, await page.locator('.bk-chat-fab').isVisible()); await page.click('.bk-chat-fab'); }
    else await page.click('.bk-talk [data-chat-jump]');
    check(`${tag} the follow-up box gets focus`, await page.evaluate(() => document.activeElement?.id === 'build-follow-text'));
    await page.fill('#build-follow-text', l === 'en' ? 'add a day in Florence' : 'תוסיף יום בפירנצה'); await page.keyboard.press('Enter');
    await page.waitForFunction((n) => document.querySelectorAll('#bc-itinerary .bk-day').length === n + 1, daysNow, { timeout: 20000 });
    await settled(page);
    check(`${tag} follow-up "add a day in Florence" → Rome kept + Florence, one more day`, (l === 'en' ? /Rome[\s\S]*Florence/ : /רומא[\s\S]*פירנצה/).test(await page.textContent('.bk-summary h2')) && await page.locator('.bk-reply').count() === 1 && await page.locator('.bk-history li').count() >= 2);
    await page.locator('.bk-history').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${OUT}/${tag}-follow-up${sfx}.png` });
    check(`${tag} no horizontal scroll after the follow-up`, await noHScroll(page));

    // "Suggest me": no destination → three suggestions with reasons; choosing another rebuilds.
    await page.goto(BASE + (l === 'en' ? '/en/' : '/') + '#/build?q=' + encodeURIComponent(SUGGEST[l]));
    await page.waitForSelector('#bc-where .bk-suggestion', { timeout: 15000 });
    const suggestions = await page.locator('#bc-where .bk-suggestion').count();
    check(`${tag} suggest mode: 3 destinations with reasons`, suggestions === 3 && (await page.textContent('#bc-where .bk-suggestion')).length > 10);
    const chosen = await page.textContent('#build-result h2');
    await page.locator('[data-choose]').first().click();
    await page.waitForFunction((was) => document.querySelector('#build-result h2')?.textContent !== was, chosen, { timeout: 15000 });
    check(`${tag} choosing another suggestion rebuilds for it`, true);
    await settled(page);
    // The wording arrives into the plan after it is shown (23.11.2026) – wait for it.
    if (!NOKEY) await page.waitForSelector('#bc-where .bk-ai', { timeout: 8000 }).catch(() => {});
    if (!NOKEY) check(`${tag} AI wording (mock) marked as AI`, await page.locator('.bk-ai').count() >= 1 || await page.locator('#bc-itinerary').textContent().then((x) => /AI/.test(x)));
    else check(`${tag} without a key: rule wording, no AI mark`, await page.locator('.bk-intro').count() === 0);
    await page.screenshot({ path: `${OUT}/${tag}-suggest${sfx}.png`, fullPage: false });
    check(`${tag} no page errors`, errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  // Owner admin: the package lead reads clearly (needs the owner password of the running server).
  if (!LIVE && process.env.ADMIN_PASSWORD) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'he-IL' }), page = await ctx.newPage();
    await page.goto(BASE + '/admin'); await page.fill('#password', process.env.ADMIN_PASSWORD); await page.click('#login-form button');
    await page.waitForSelector('.admin-package', { timeout: 10000 });
    const card = page.locator('.lead-card', { has: page.locator('.admin-package') }).first();
    check('admin: package lead shows flight, hotel, car, insurance and the day plan', /טיסה[\s\S]*מלון[\s\S]*רכב[\s\S]*ביטוח נסיעות/.test(await card.textContent()) && await card.locator('.admin-days li').count() >= 5);
    if (!PUBLIC) check('admin: the agent-only hotel options are attached to the lead', /אפשרויות מלון לנציג/.test(await card.textContent()));
    await card.scrollIntoViewIfNeeded(); await card.screenshot({ path: `${OUT}/1440-admin-package-lead${sfx}.png` });
    await ctx.close();
  }
} finally { await browser.close(); }
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
