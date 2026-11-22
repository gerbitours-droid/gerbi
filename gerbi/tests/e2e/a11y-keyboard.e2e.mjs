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

  // Accessibility menu (IS 5568): keyboard open, focus trap, toggles, persistence across reload, reset.
  await page.goto(BASE + '/#/'); await page.waitForTimeout(400);
  await page.focus('.skip-link'); await page.keyboard.press('Tab');
  const fab = await page.evaluate(focusInfo);
  check('a11y menu: labelled button is the Tab stop right after the skip link, with a focus indicator', fab.cls.includes('a11y-fab') && fab.text === 'תפריט נגישות' && fab.visible, JSON.stringify(fab));
  await page.keyboard.press('Enter');
  const opened = await page.evaluate(() => { const d = document.querySelector('#a11y-panel'); return { visible: !d.hidden && d.checkVisibility(), role: d.getAttribute('role'), modal: d.getAttribute('aria-modal'), inside: d.contains(document.activeElement), expanded: document.querySelector('.a11y-fab').getAttribute('aria-expanded') }; });
  check('a11y menu: Enter opens a modal dialog with focus inside', opened.visible && opened.role === 'dialog' && opened.modal === 'true' && opened.inside && opened.expanded === 'true', JSON.stringify(opened));
  let trapped = true;
  for (let i = 0; i < 18; i++) { await page.keyboard.press(i % 6 === 5 ? 'Shift+Tab' : 'Tab'); trapped &&= await page.evaluate(() => document.querySelector('#a11y-panel').contains(document.activeElement)); }
  check('a11y menu: Tab and Shift+Tab stay inside the dialog (focus trap)', trapped);
  await page.focus('[data-a11y="contrast"]'); await page.keyboard.press('Enter');
  await page.focus('[data-a11y-text="1"]'); await page.keyboard.press('Enter'); await page.keyboard.press('Enter');
  const applied = await page.evaluate(() => ({ cls: document.documentElement.className, pressed: document.querySelector('[data-a11y="contrast"]').getAttribute('aria-pressed'), level: document.querySelector('#a11y-text-level').textContent }));
  check('a11y menu: keyboard toggles high contrast and text size (2 steps)', /a11y-contrast/.test(applied.cls) && /a11y-text-xl/.test(applied.cls) && applied.pressed === 'true' && /130/.test(applied.level), JSON.stringify(applied));
  await page.focus('[data-a11y="dark"]'); await page.keyboard.press('Enter');
  check('a11y menu: dark contrast replaces high contrast', await page.evaluate(() => document.documentElement.classList.contains('a11y-dark') && !document.documentElement.classList.contains('a11y-contrast') && document.querySelector('[data-a11y="contrast"]').getAttribute('aria-pressed') === 'false'));
  await page.keyboard.press('Enter'); await page.focus('[data-a11y="contrast"]'); await page.keyboard.press('Enter');
  await page.keyboard.press('Escape'); await page.waitForTimeout(100);
  check('a11y menu: Escape closes and returns focus to the button', await page.evaluate(() => document.querySelector('#a11y-panel').hidden && document.activeElement.matches('.a11y-fab') && document.activeElement.getAttribute('aria-expanded') === 'false'));
  await page.reload(); await page.waitForTimeout(500);
  const kept = await page.evaluate(() => { window.scrollTo(-99999, 0); const a = window.scrollX; window.scrollTo(99999, 0); const b = window.scrollX; window.scrollTo(0, 0); return { cls: document.documentElement.className, sideways: Math.abs(a - b) }; });
  check('a11y menu: settings persist across reload, no horizontal scroll at the larger text size', /a11y-contrast/.test(kept.cls) && /a11y-text-xl/.test(kept.cls) && kept.sideways <= 3, JSON.stringify(kept));
  await page.click('.a11y-fab');
  check('a11y menu: reopened dialog shows the saved state', await page.evaluate(() => document.querySelector('[data-a11y="contrast"]').getAttribute('aria-pressed') === 'true' && /130/.test(document.querySelector('#a11y-text-level').textContent)));
  await page.click('[data-a11y-reset]');
  check('a11y menu: reset clears every class and the stored settings', await page.evaluate(() => !document.documentElement.className.includes('a11y-') && localStorage.getItem('gerbi-a11y-v1') === null && [...document.querySelectorAll('[data-a11y]')].every((b) => b.getAttribute('aria-pressed') === 'false')));
  await page.click('.a11y-statement'); await page.waitForTimeout(300);
  check('a11y menu: statement link opens #/accessibility and closes the menu', await page.evaluate(() => location.hash === '#/accessibility' && document.querySelector('#a11y-panel').hidden));
  await page.click('[data-a11y-open]'); await page.waitForTimeout(100);
  check('statement page: "open the accessibility menu" opens it', await page.evaluate(() => !document.querySelector('#a11y-panel').hidden));
  await page.keyboard.press('Escape');

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
  const a11yFab = await p.evaluate(() => { const r = document.querySelector('.a11y-fab').getBoundingClientRect(), s = document.querySelector('.sb-launcher').getBoundingClientRect(), n = document.querySelector('.mobile-bottom').getBoundingClientRect(); return { w: r.width, h: r.height, aboveNav: r.bottom <= n.top, apart: r.right <= s.left || r.left >= s.right || r.bottom <= s.top || r.top >= s.bottom, rightSide: r.left > innerWidth / 2 }; });
  check('phone: accessibility button ≥ 44px, above the bottom nav, clear of the bot launcher (right side in Hebrew)', a11yFab.w >= 44 && a11yFab.h >= 44 && a11yFab.aboveNav && a11yFab.apart && a11yFab.rightSide, JSON.stringify(a11yFab));
  await p.click('.a11y-fab'); await p.waitForTimeout(150);
  const sheet = await p.evaluate(() => { const r = document.querySelector('#a11y-panel').getBoundingClientRect(); return { fits: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight, sideways: document.documentElement.scrollWidth - innerWidth }; });
  check('phone: menu opens as a sheet inside the screen, no sideways scroll', sheet.fits && sheet.sideways <= 0, JSON.stringify(sheet));
  await p.keyboard.press('Escape');
  await p.evaluate(() => window.gerbiA11y.save({ text: 3 })); await p.reload(); await p.waitForTimeout(500);
  const big = await p.evaluate(() => { window.scrollTo(-99999, 0); const a = window.scrollX; window.scrollTo(99999, 0); const b = window.scrollX; window.scrollTo(0, 0); return { cls: document.documentElement.className, sideways: Math.abs(a - b) }; });
  check('phone: largest text size keeps the page free of horizontal scroll', /a11y-text-xxl/.test(big.cls) && big.sideways <= 3, JSON.stringify(big));
  await p.evaluate(() => window.gerbiA11y.save({}));
  await phone.close();

  // English site: English labels, button at the reading-start corner (left in LTR).
  const enCtx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'en-GB' });
  const ep = await enCtx.newPage();
  await ep.goto(BASE + '/en/#/'); await ep.waitForTimeout(500);
  const en = await ep.evaluate(() => { const f = document.querySelector('.a11y-fab'), r = f.getBoundingClientRect(); return { label: f.getAttribute('aria-label'), left: r.right < innerWidth / 2 }; });
  await ep.click('.a11y-fab');
  const enText = await ep.locator('#a11y-panel').innerText();
  check('English: menu labelled in English, button bottom-left', en.label === 'Accessibility menu' && en.left && /High contrast/.test(enText) && /Accessibility statement/.test(enText), JSON.stringify(en));
  await enCtx.close();
} finally { await browser.close(); }
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exitCode = failed.length ? 1 : 0;
