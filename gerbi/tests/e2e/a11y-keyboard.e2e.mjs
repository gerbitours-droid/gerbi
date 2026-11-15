// Spec 19–21 keyboard-only walkthrough + semantics + legal pages. No supplier calls.
//   PLAYWRIGHT_MODULE=… BASE_URL=http://127.0.0.1:4187 node tests/e2e/a11y-keyboard.e2e.mjs
const { chromium, devices } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const BASE = process.env.BASE_URL || 'http://localhost:4173';
const results = [];
const check = (name, ok, extra = '') => { results.push({ name, ok: !!ok }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? ' — ' + extra : '')); };
const focusInfo = () => { const el = document.activeElement, s = getComputedStyle(el); return { tag: el.tagName, id: el.id, cls: String(el.className), text: (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 30), visible: (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) || /rgb/.test(s.boxShadow) && s.boxShadow !== 'none' }; };

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'he-IL' });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(BASE + '/#/'); await page.waitForTimeout(400);
  check('html lang=he dir=rtl', await page.evaluate(() => document.documentElement.lang === 'he' && document.documentElement.dir === 'rtl'));
  const marks = await page.evaluate(() => ({ main: document.querySelectorAll('main').length, header: document.querySelectorAll('body > header').length, navs: [...document.querySelectorAll('nav')].every((n) => n.getAttribute('aria-label')), h1: [...document.querySelectorAll('h1')].filter((h) => h.checkVisibility()).length }));
  check('landmarks: one main, a banner header, every nav labelled, one visible h1', marks.main === 1 && marks.header === 1 && marks.navs && marks.h1 === 1, JSON.stringify(marks));

  // The router focuses the h1 on load (screen readers start at the heading); the skip link is the first Tab stop of the document.
  check('skip link is the first focusable element in the document', await page.evaluate(() => document.querySelector('a[href], button, input, [tabindex]:not([tabindex="-1"])').classList.contains('skip-link')));
  await page.focus('.skip-link');
  const skip = await page.evaluate(() => { const el = document.activeElement, r = el.getBoundingClientRect(); return { cls: el.className, inView: r.top >= 0 && r.bottom <= innerHeight && r.width > 1 }; });
  check('focused skip link becomes visible', skip.cls.includes('skip-link') && skip.inView, JSON.stringify(skip));
  await page.keyboard.press('Enter');
  check('skip link moves focus to main', await page.evaluate(() => document.activeElement.id === 'main-content'));

  const invisible = [];
  for (let i = 0; i < 45; i++) { await page.keyboard.press('Tab'); const f = await page.evaluate(focusInfo); if (!f.visible && f.tag !== 'BODY') invisible.push(`${f.tag}#${f.id}.${f.cls.split(' ')[0]} "${f.text}"`); }
  check('45 Tab stops on home all show a focus indicator', !invisible.length, invisible.slice(0, 6).join(' | '));

  await page.mouse.click(5, 300);
  check('mouse click turns on .pointer-nav', await page.evaluate(() => document.documentElement.classList.contains('pointer-nav')));
  await page.keyboard.press('Tab');
  check('Tab turns .pointer-nav off again', await page.evaluate(() => !document.documentElement.classList.contains('pointer-nav')));

  await page.focus('#dates-button'); await page.keyboard.press('Enter'); await page.waitForSelector('#date-picker[open]');
  check('dates: Enter opens calendar with focus on a day', await page.evaluate(() => document.activeElement.classList.contains('dp-day')));
  await page.keyboard.press('ArrowLeft');
  check('dates: arrow keys move between days', await page.evaluate(() => document.activeElement.classList.contains('dp-day')));
  await page.keyboard.press('Escape'); await page.waitForTimeout(150); // the dialog 'close' event is async
  check('dates: Escape closes and returns focus to the dates field', await page.evaluate(() => !document.querySelector('#date-picker').open && document.activeElement.id === 'dates-button'));

  await page.focus('#travelers-button'); await page.keyboard.press('Enter'); await page.waitForSelector('#travelers-pop');
  await page.keyboard.press('Escape'); await page.waitForTimeout(150);
  check('travelers: Escape closes and returns focus', await page.evaluate(() => !document.querySelector('#travelers-pop') && document.activeElement.id === 'travelers-button'));

  await page.focus('.sb-launcher'); await page.keyboard.press('Enter'); await page.waitForSelector('#sb-dialog[open]');
  check('support bot: opens as a modal dialog with focus inside', await page.evaluate(() => document.querySelector('#sb-dialog').contains(document.activeElement)));
  await page.keyboard.press('Escape'); await page.waitForTimeout(150);
  check('support bot: Escape returns focus to the launcher', await page.evaluate(() => document.activeElement.classList.contains('sb-launcher')));

  // Legal + accessibility pages
  for (const [route, draft] of [['/terms', true], ['/privacy', true], ['/accessibility', false]]) {
    await page.goto(BASE + '/#' + route); await page.waitForTimeout(300);
    const info = await page.evaluate(() => ({ h1: document.querySelectorAll('#page-view h1').length, focus: document.activeElement.tagName, fhtml: document.activeElement.outerHTML.slice(0, 90), draft: !!document.querySelector('.draft-banner'), fill: document.querySelectorAll('mark.fill-in').length, title: document.title }));
    check(`${route}: one h1 (focused), draft banner ${draft ? 'shown' : 'absent'}, owner placeholders marked`, info.h1 === 1 && info.focus === 'H1' && info.draft === draft && info.fill > 0, JSON.stringify(info));
  }
  await page.goto(BASE + '/#/accessibility'); await page.waitForTimeout(300);
  const statement = await page.locator('#page-view').innerText();
  check('accessibility statement: regulation 35 items (standard, made accessible, limitations, coordinator, date)', /5568/.test(statement) && /התשע״ג–2013/.test(statement) && /מה הונגש/.test(statement) && /מגבלות ידועות/.test(statement) && /רכז\/ת הנגישות/.test(statement) && /15\.11\.2026/.test(statement));
  await page.locator('[data-display-pref="text"]').focus(); await page.keyboard.press('Enter');
  check('display settings: keyboard toggle sets aria-pressed and the html class', await page.evaluate(() => document.documentElement.classList.contains('a11y-text-lg') && document.querySelector('[data-display-pref="text"]').getAttribute('aria-pressed') === 'true'));
  await page.waitForTimeout(150); await page.reload(); await page.waitForTimeout(500);
  // zoom scales scrollWidth, so measure how far the page can actually scroll sideways.
  const persisted = await page.evaluate(() => { window.scrollTo(-99999, 0); const a = window.scrollX; window.scrollTo(99999, 0); const b = window.scrollX; window.scrollTo(0, 0); return { cls: document.documentElement.className, sideways: Math.abs(a - b) }; });
  check('display settings persist across reload without horizontal scroll', persisted.cls.includes('a11y-text-lg') && persisted.sideways <= 3, JSON.stringify(persisted));
  await page.locator('[data-display-reset]').click();
  check('display settings reset', await page.evaluate(() => !document.documentElement.className.includes('a11y-')));
  await page.goto(BASE + '/#/terms'); await page.waitForTimeout(300);
  await page.locator('[data-legal-jump="t-consumer"]').click();
  check('terms: table of contents moves focus to the section heading (hash route kept)', await page.evaluate(() => document.activeElement.id === 't-consumer-h' && location.hash === '#/terms'));
  check('terms covers consumer-protection cancellation', /14ג/.test(await page.locator('#t-consumer').innerText()));
  await page.goto(BASE + '/#/'); await page.waitForTimeout(300);
  check('home footer links to terms, privacy and accessibility', await page.evaluate(() => ['#/terms', '#/privacy', '#/accessibility'].every((h) => document.querySelector(`#home footer a[href="${h}"]`))));
  await page.goto(BASE + '/#/contact'); await page.waitForTimeout(300);
  check('contact consent text links to privacy and terms', await page.evaluate(() => !!document.querySelector('#consent-hint a[href="#/privacy"]') && !!document.querySelector('#consent-hint a[href="#/terms"]')));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  check('prefers-reduced-motion shortens transitions', await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.button, button')).transitionDuration) <= 0.001));
  check('no runtime errors (desktop)', !errors.length, errors.join(' | '));
  await ctx.close();

  // Phone: mobile menu by keyboard, multi-city add on a phone keeps the add button clear.
  const phone = await browser.newContext({ ...devices['iPhone 13'], locale: 'he-IL' });
  const p = await phone.newPage();
  await p.goto(BASE + '/#/'); await p.waitForTimeout(400);
  await p.focus('#mobile-menu-button'); await p.keyboard.press('Enter');
  check('phone: menu opens with focus on close', await p.evaluate(() => !document.querySelector('#mobile-menu').hidden && document.activeElement.id === 'close-mobile-menu'));
  check('phone: menu lists terms, privacy and accessibility', await p.evaluate(() => ['#/terms', '#/privacy', '#/accessibility'].every((h) => document.querySelector(`#mobile-menu a[href="${h}"]`))));
  await p.keyboard.press('Escape');
  check('phone: Escape closes menu and returns focus', await p.evaluate(() => document.querySelector('#mobile-menu').hidden && document.activeElement.id === 'mobile-menu-button'));
  const sizes = await p.evaluate(() => [...document.querySelectorAll('input:not([type=radio]):not([type=checkbox])')].filter((i) => i.offsetParent).map((i) => parseFloat(getComputedStyle(i).fontSize)));
  check('phone: visible inputs are ≥ 16px (no iOS zoom)', sizes.every((s) => s >= 16), sizes.join(','));
  if (await p.locator('[name="trip-type"][value="multi"]').count()) {
    await p.locator('label:has([name="trip-type"][value="multi"])').click(); await p.waitForTimeout(200);
    await p.locator('[data-add-leg]').click(); await p.waitForTimeout(300);
    const st = await p.evaluate(() => ({ lists: [...document.querySelectorAll('.place-list')].filter((l) => !l.hidden).length, focus: document.activeElement.matches('[data-add-leg]') }));
    check('phone multi-city: adding a flight opens no place list over the add button', st.lists === 0 && st.focus, JSON.stringify(st));
  }
  const launcher = await p.evaluate(() => { const r = document.querySelector('.sb-launcher').getBoundingClientRect(), n = document.querySelector('.mobile-bottom').getBoundingClientRect(); return { w: r.width, h: r.height, clear: r.bottom <= n.top }; });
  check('phone: bot launcher ≥ 44px and above the bottom nav', launcher.w >= 44 && launcher.h >= 44 && launcher.clear, JSON.stringify(launcher));
  await phone.close();
} finally { await browser.close(); }
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exitCode = failed.length ? 1 : 0;
