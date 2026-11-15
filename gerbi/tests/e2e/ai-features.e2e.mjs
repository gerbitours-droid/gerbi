// Spec 22 in the browser, 1440 + 375: tailor-form assistant, support bot AI answer, planner multi-city route, flight
// comparison (needs a live supplier search: SEARCH=1), owner admin (lead brief, priority, blog assistant, AI tab).
// Run the server with the mock provider:  node scripts/mock-llm-server.mjs 4199 &
//   GERBI_AI_MOCK_URL=http://127.0.0.1:4199/v1/chat/completions PORT=4186 node server.mjs &
//   PLAYWRIGHT_MODULE=… BASE_URL=http://localhost:4186 OUT=verification/22-ai ADMIN_PASSWORD=… node tests/e2e/ai-features.e2e.mjs
// Without GERBI_AI_MOCK_URL set NOKEY=1: the same pages must work in rules mode (screenshots get a "-nokey" suffix).
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const BASE = process.env.BASE_URL || 'http://localhost:4186', OUT = process.env.OUT || 'verification/22-ai', NOKEY = process.env.NOKEY === '1', sfx = NOKEY ? '-nokey' : '';
const results = [], check = (name, ok, extra = '') => { results.push({ name, ok: !!ok }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? ' — ' + extra : '')); };
const noHScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
const browser = await chromium.launch();
try {
  for (const width of [1440, 375]) {
    const ctx = await browser.newContext({ viewport: { width, height: width > 500 ? 1000 : 820 }, locale: 'he-IL', deviceScaleFactor: width > 500 ? 1 : 2 });
    const page = await ctx.newPage(), errors = [];
    page.on('pageerror', (e) => errors.push(e.message));

    // Tailor-made: one sentence fills the form.
    await page.goto(BASE + '/#/tailor-made');
    await page.waitForSelector('#ai-assist-text');
    await page.fill('#ai-assist-text', 'ירח דבש ביפן 12-24 באפריל, תקציב 40 אלף, אוכל ויין ומלון יוקרתי');
    await page.click('#ai-assist-run');
    await page.waitForFunction(() => /מילאנו/.test(document.querySelector('.ai-assist-status')?.textContent || ''), null, { timeout: 15000 });
    const filled = await page.evaluate(() => ({ dest: document.querySelector('#lead-destinations').value, start: document.querySelector('#lead-start').value, budget: document.querySelector('#lead-budget').value, styles: [...document.querySelectorAll('input[name=styles]:checked')].map((x) => x.value) }));
    check(`${width} tailor assistant fills destination/dates/budget`, filled.dest.includes('יפן') && filled.start.endsWith('-04-12') && filled.budget === '20to40', JSON.stringify(filled));
    if (!NOKEY) check(`${width} AI adds styles the rules cannot (culinary/luxury)`, filled.styles.includes('culinary'));
    await page.locator('.ai-assist').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${OUT}/${width}-tailor-assist${sfx}.png`, fullPage: false });
    check(`${width} tailor page no horizontal scroll`, await noHScroll(page));

    // Support bot: a question the rules miss.
    await page.goto(BASE + '/#/support');
    await page.click('[data-support-open]');
    await page.waitForSelector('#sb-input');
    await page.fill('#sb-input', 'האם אתם עובדים גם עם חברות תעופה זולות?');
    await page.press('#sb-input', 'Enter');
    await page.waitForSelector('.sb-msg.sb-user ~ .sb-msg.sb-bot', { timeout: 15000 });
    if (!NOKEY) await page.waitForSelector('.sb-source', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(700);
    const ai = await page.locator('.sb-source').count();
    check(`${width} support bot ${NOKEY ? 'falls back without AI' : 'answers from owner FAQ with source line'}`, NOKEY ? ai === 0 : ai >= 1);
    await page.screenshot({ path: `${OUT}/${width}-support-ai${sfx}.png`, fullPage: false });
    await page.keyboard.press('Escape');

    // Planner: a multi-city sentence.
    await page.goto(BASE + '/#/planner');
    await page.waitForSelector('#page-chat-input');
    await page.fill('#page-chat-input', 'זוג, מתל אביב לרומא ב-10.12, משם לפריז ב-14.12 וחוזרים הביתה ב-18.12');
    await page.click('#page-chat-form button');
    await page.waitForSelector('.message.assistant a[href*="type=multi"]', { timeout: 10000 });
    check(`${width} planner offers the multi-city route`, true);
    await page.waitForTimeout(800);
    await page.evaluate(() => document.querySelector('.message.assistant a[href*="type=multi"]')?.scrollIntoView({ block: 'center' }));
    await page.screenshot({ path: `${OUT}/${width}-planner-multicity${sfx}.png`, fullPage: false });
    await page.click('.message.assistant a[href*="type=multi"]');
    await page.waitForFunction(() => /כמה יעדים/.test(document.querySelector('#search-feedback')?.textContent || ''), null, { timeout: 8000 }).catch(() => {});
    check(`${width} route link fills the multi-city form`, await page.evaluate(() => document.querySelectorAll('[data-leg]').length) >= 3);

    if (process.env.SEARCH === '1' && width === 1440 && !NOKEY) {
      await page.goto(BASE + '/#/?from=TLV&to=ATH&depart=2026-12-10&return=2026-12-14&adults=2&children=0');
      await page.click('#search-form [type=submit]');
      await page.waitForSelector('#live-results .flight-card', { timeout: 60000 });
      await page.waitForSelector('.ai-take-button', { timeout: 8000 });
      await page.click('.ai-take-button');
      await page.waitForFunction(() => document.querySelector('.ai-take-body p')?.textContent.length > 20, null, { timeout: 15000 });
      check('flight comparison shows a grounded explanation', true);
      await page.locator('#ai-take').scrollIntoViewIfNeeded();
      await page.screenshot({ path: `${OUT}/${width}-flight-take.png`, fullPage: false });
    }
    check(`${width} no page errors on the site`, !errors.length, errors.join(' | '));

    // Owner admin.
    if (process.env.ADMIN_PASSWORD) {
      await page.goto(BASE + '/admin');
      await page.fill('#password', process.env.ADMIN_PASSWORD);
      await page.click('#login-form button');
      await page.waitForSelector('.lead-card', { timeout: 10000 });
      check(`${width} every lead has a priority badge`, await page.locator('.lead-card .priority-chip').count() === await page.locator('.lead-card').count());
      await page.selectOption('#lead-sort', 'priority');
      await page.waitForTimeout(400);
      await page.locator('.lead-card [data-ai-lead]').first().click();
      await page.waitForSelector('.lead-ai-panel textarea', { timeout: 15000 });
      const draft = await page.locator('.lead-ai-panel textarea').first().inputValue();
      check(`${width} lead brief + WhatsApp draft with the first name`, /^היי \S+,/.test(draft) && !draft.includes('{שם}'), draft.split('\n')[0]);
      await page.locator('.lead-ai-panel').first().scrollIntoViewIfNeeded();
      await page.screenshot({ path: `${OUT}/${width}-admin-lead-brief${sfx}.png`, fullPage: false });
      await page.goto(BASE + '/admin#blog/new');
      await page.waitForSelector('.ai-blog');
      await page.click('.ai-blog summary');
      await page.fill('#ai-topic', 'סופ״ש באתונה עם ילדים');
      await page.click(NOKEY ? '#ai-outline' : '#ai-draft');
      await page.waitForSelector('#ai-blog-review:not([hidden])', { timeout: 30000 });
      check(`${width} blog assistant fills the editor`, (await page.inputValue('#f-body')).includes('## '));
      if (!NOKEY) {
        await page.click('#toggle-publish');
        check(`${width} AI draft cannot be published before "facts checked"`, /בדקתי/.test(await page.textContent('#ai-blog-status')));
      }
      await page.locator('.ai-blog').scrollIntoViewIfNeeded();
      await page.screenshot({ path: `${OUT}/${width}-admin-blog-assistant${sfx}.png`, fullPage: false });
      await page.evaluate(() => { window.onbeforeunload = null; });
      page.once('dialog', (d) => d.accept());
      await page.goto(BASE + '/admin#ai');
      await page.waitForSelector('.ai-table', { timeout: 10000 });
      if (!NOKEY) { await page.click('#dg-ai'); await page.waitForFunction(() => /ג׳רבי AI/.test(document.querySelector('#digest')?.textContent || ''), null, { timeout: 15000 }); }
      check(`${width} AI tab: digest + usage table + switches`, await page.locator('[data-flag]').count() >= 9);
      check(`${width} admin no horizontal page scroll`, await noHScroll(page));
      await page.screenshot({ path: `${OUT}/${width}-admin-ai-tab${sfx}.png`, fullPage: true });
    }
    await ctx.close();
  }
} finally { await browser.close(); }
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
