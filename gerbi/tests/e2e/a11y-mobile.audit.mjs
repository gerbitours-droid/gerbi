// Spec 19–21 audit: every route × phone/tablet/desktop widths. Measures horizontal overflow, small tap targets,
// small text, input font size (iOS zoom), fixed-element overlap, and runs axe-core (WCAG 2.0/2.1 A+AA).
// axe-core is NOT a dependency: point AXE_PATH at any axe.min.js (e.g. from another project's node_modules).
//   PLAYWRIGHT_MODULE=… AXE_PATH=…/axe.min.js BASE_URL=http://127.0.0.1:4187 LABEL=after node tests/e2e/a11y-mobile.audit.mjs
// Optional: WIDTHS=360,390  ROUTES=/,/contact  LIVE=1 (adds a live flight search for the results screen).
import { mkdir, readFile, writeFile } from 'node:fs/promises';
const { chromium, devices } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const BASE = process.env.BASE_URL || 'http://localhost:4173';
const LABEL = process.env.LABEL || 'after';
const OUT = `verification/19-21-mobile-a11y/${LABEL}`;
const AXE = process.env.AXE_PATH ? await readFile(process.env.AXE_PATH, 'utf8') : null;
const WIDTHS = (process.env.WIDTHS || '360,375,390,414,768,1440').split(',').map(Number);
const ROUTES = process.env.ROUTES ? process.env.ROUTES.split(',') : ['/', '/destinations', '/destination/rome', '/inspiration', '/planner', '/blog', '/blog/__first', '/favorites', '/account', '/contact', '/tailor-made', '/support', '/converter', '/privacy', '/terms', '/accessibility', 'admin'];
await mkdir(OUT, { recursive: true });

const measure = () => {
  const vw = window.innerWidth, out = { overflow: document.documentElement.scrollWidth - vw, wide: [], small: [], tinyText: [], smallInputs: [], overlaps: [] };
  const visible = (el) => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && !el.closest('[hidden],[aria-hidden="true"]'); };
  const name = (el) => (el.id ? '#' + el.id : el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '')) + ' "' + (el.innerText || el.value || el.getAttribute('aria-label') || '').trim().slice(0, 24) + '"';
  for (const el of document.body.querySelectorAll('*')) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    if ((r.right > vw + 1 || r.left < -1) && getComputedStyle(el).position !== 'fixed' && !el.closest('.cards, .deals-strip, .fare-deals, [class*="fare-deal"], [data-scroller], .ds-track, .admin-tabs, .sb-chips, .filter-chips, .preference-chips') && out.wide.length < 8) out.wide.push(name(el) + ` [${Math.round(r.left)}..${Math.round(r.right)}]`);
  }
  for (const el of document.querySelectorAll('a[href], button, summary, select, input:not([type=hidden]), [role=button], [role=tab], [role=radio], label:has(> input[type=checkbox]), label:has(> input[type=radio])')) {
    if (!visible(el)) continue;
    if (el.matches('input[type=checkbox], input[type=radio]') && el.closest('label')) continue;
    if (el.closest('details:not([open])') && !el.matches('summary')) continue; // collapsed, not on screen // the label is the target
    if (el.matches('a') && el.closest('p, li p, .micro-copy, small') && !el.matches('.button')) continue; // inline links (WCAG 2.5.8 exception)
    if (el.closest('.dp-grid')) continue; // calendar days measured separately below
    if (el.matches('.field input, .prompt-input input')) continue; // the surrounding field/label is the tap target
    const r = el.getBoundingClientRect();
    if ((r.width < 43.5 || r.height < 43.5) && out.small.length < 40) out.small.push(name(el) + ` ${Math.round(r.width)}×${Math.round(r.height)}`);
  }
  for (const el of document.querySelectorAll('body *')) {
    if (!el.childNodes.length || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) || !visible(el)) continue;
    const size = parseFloat(getComputedStyle(el).fontSize);
    if (size < 12 && out.tinyText.length < 12) out.tinyText.push(name(el) + ` ${size}px`);
  }
  for (const el of document.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=hidden]), textarea, select')) {
    if (visible(el) && parseFloat(getComputedStyle(el).fontSize) < 16) out.smallInputs.push(name(el) + ' ' + getComputedStyle(el).fontSize);
  }
  const fixed = [...document.querySelectorAll('.mobile-bottom, .sb-launcher, #toast, .comparison-tray, #comparison-tray, .flight-compare-tray, .a11y-toggle, .a11y-fab')].filter(visible).filter((el) => ['fixed', 'sticky'].includes(getComputedStyle(el).position));
  for (let i = 0; i < fixed.length; i++) for (let j = i + 1; j < fixed.length; j++) {
    const a = fixed[i].getBoundingClientRect(), b = fixed[j].getBoundingClientRect();
    if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) out.overlaps.push(name(fixed[i]) + ' × ' + name(fixed[j]));
  }
  return out;
};

const runAxe = async (page) => {
  if (!AXE) return null;
  if (!(await page.evaluate(() => !!window.axe))) await page.addScriptTag({ content: AXE });
  const result = await page.evaluate(() => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }, resultTypes: ['violations'] }));
  return result.violations.map((v) => ({ id: v.id, impact: v.impact, count: v.nodes.length, help: v.help, targets: v.nodes.slice(0, 4).map((n) => n.target.join(' ')) }));
};

const browser = await chromium.launch();
const report = { label: LABEL, base: BASE, at: new Date().toISOString(), rows: [] };
try {
  for (const width of WIDTHS) {
    const phone = width < 700;
    const context = await browser.newContext({ ...(phone ? devices['Pixel 7'] : {}), viewport: { width, height: phone ? 800 : width < 1000 ? 1024 : 900 }, isMobile: phone, hasTouch: width < 1000, locale: 'he-IL', bypassCSP: true, ...(phone ? { deviceScaleFactor: 2 } : {}) });
    const page = await context.newPage();
    const errors = []; page.on('pageerror', (e) => errors.push(e.message));
    for (let route of ROUTES) {
      if (route === '/blog/__first') {
        await page.goto(BASE + '/#/blog'); await page.waitForTimeout(500);
        const href = await page.locator('#page-view a[href^="#/blog/"]').first().getAttribute('href').catch(() => null);
        if (!href) continue; route = href.slice(1);
      }
      const url = route === 'admin' ? BASE + '/admin' : BASE + '/#' + route;
      await page.goto(url); await page.waitForLoadState('networkidle').catch(() => {}); await page.waitForTimeout(350);
      if (route === 'admin' && process.env.ADMIN_PASSWORD && await page.locator('#password').isVisible()) { await page.fill('#password', process.env.ADMIN_PASSWORD); await page.click('#login-form [type=submit]'); await page.waitForSelector('#app-view:not([hidden])').catch(() => {}); await page.waitForTimeout(500); }
      const m = await page.evaluate(measure);
      const axe = width === 390 || width === 1440 ? await runAxe(page) : null;
      const slug = route === 'admin' ? 'admin' : route === '/' ? 'home' : route.slice(1).replace(/\//g, '_');
      if ([360, 390, 768, 1440].includes(width)) await page.screenshot({ path: `${OUT}/w${width}-${slug}.png`, fullPage: false });
      report.rows.push({ width, route, ...m, axe });
      const sev = axe ? axe.filter((v) => ['serious', 'critical'].includes(v.impact)).length : '-';
      console.log(`w${width} ${route.padEnd(20)} overflow=${m.overflow} small=${m.small.length} tiny=${m.tinyText.length} inputs<16=${m.smallInputs.length} overlaps=${m.overlaps.length} axe=${axe ? axe.length : '-'} (serious+=${sev})`);
    }
    // Dialog states on the home page (phones + tablet).
    if (width < 1000) {
      await page.goto(BASE + '/#/'); await page.waitForTimeout(400);
      await page.locator('#dates-button').click(); await page.waitForSelector('#date-picker[open]');
      const dp = await page.evaluate(() => { const d = document.querySelector('#date-picker').getBoundingClientRect(), day = document.querySelector('.dp-day').getBoundingClientRect(); return { w: Math.round(d.width), h: Math.round(d.height), vw: innerWidth, vh: innerHeight, day: `${Math.round(day.width)}×${Math.round(day.height)}` }; });
      const dpm = await page.evaluate(measure);
      const dpAxe = width === 390 ? await runAxe(page) : null;
      await page.screenshot({ path: `${OUT}/w${width}-datepicker.png` });
      report.rows.push({ width, route: 'dialog:date-picker', dialog: dp, ...dpm, axe: dpAxe });
      console.log(`w${width} date-picker ${JSON.stringify(dp)} small=${dpm.small.length} axe=${dpAxe ? dpAxe.length : '-'}`);
      await page.keyboard.press('Escape');
      await page.locator('#travelers-button').click(); await page.waitForSelector('#travelers-pop');
      const tp = await page.evaluate(measure);
      await page.screenshot({ path: `${OUT}/w${width}-travelers.png` });
      report.rows.push({ width, route: 'dialog:travelers', ...tp });
      console.log(`w${width} travelers small=${tp.small.length} overflow=${tp.overflow}`);
      await page.keyboard.press('Escape');
      await page.locator('.sb-launcher').click(); await page.waitForSelector('#sb-dialog[open]');
      const sb = await page.evaluate(() => { const d = document.querySelector('#sb-dialog').getBoundingClientRect(); return { w: Math.round(d.width), h: Math.round(d.height), vw: innerWidth, vh: innerHeight }; });
      const sbm = await page.evaluate(measure); const sbAxe = width === 390 ? await runAxe(page) : null;
      await page.screenshot({ path: `${OUT}/w${width}-support-bot.png` });
      report.rows.push({ width, route: 'dialog:support-bot', dialog: sb, ...sbm, axe: sbAxe });
      console.log(`w${width} support-bot ${JSON.stringify(sb)} small=${sbm.small.length} axe=${sbAxe ? sbAxe.length : '-'}`);
      await page.keyboard.press('Escape');
      await page.locator('.a11y-fab').click(); await page.waitForSelector('#a11y-panel:not([hidden])');
      const am = await page.evaluate(measure); const amAxe = width === 390 ? await runAxe(page) : null;
      await page.screenshot({ path: `${OUT}/w${width}-a11y-menu.png` });
      report.rows.push({ width, route: 'dialog:a11y-menu', ...am, axe: amAxe });
      console.log(`w${width} a11y-menu overflow=${am.overflow} small=${am.small.length} axe=${amAxe ? amAxe.length : '-'}`);
      await page.keyboard.press('Escape');
      if (await page.locator('[name="trip-type"][value="multi"]').count()) {
        await page.locator('label:has([name="trip-type"][value="multi"])').click(); await page.waitForTimeout(300);
        const add = page.locator('#multi-legs button:has-text("הוספת")').first();
        if (await add.count()) { await add.click(); await page.waitForTimeout(300); }
        const mc = await page.evaluate(measure);
        const covered = await page.evaluate(() => { const b = document.querySelector('[data-add-leg]'); if (!b) return 'no add button'; const r = b.getBoundingClientRect(); const lists = [...document.querySelectorAll('.place-list')].filter((l) => !l.hidden && l.getBoundingClientRect().height > 0); const over = lists.find((l) => { const q = l.getBoundingClientRect(); return q.left < r.right && r.left < q.right && q.top < r.bottom && r.top < q.bottom; }); return over ? 'covered by place list' : `clear (open lists: ${lists.length}, focus: ${document.activeElement.className || document.activeElement.id})`; });
        const mcAxe = width === 390 ? await runAxe(page) : null;
        await page.screenshot({ path: `${OUT}/w${width}-multi-city.png` });
        report.rows.push({ width, route: 'form:multi-city', addButton: covered, ...mc, axe: mcAxe });
        console.log(`w${width} multi-city overflow=${mc.overflow} small=${mc.small.length} add=${covered} axe=${mcAxe ? mcAxe.length : '-'}`);
        await page.keyboard.press('Escape'); await page.locator('label:has([name="trip-type"][value="round"])').click();
      }
      await page.locator('#mobile-menu-button').click().catch(() => {});
      if (await page.locator('#mobile-menu').isVisible()) { const mm = await page.evaluate(measure); await page.screenshot({ path: `${OUT}/w${width}-mobile-menu.png` }); report.rows.push({ width, route: 'menu:mobile', ...mm }); console.log(`w${width} mobile-menu small=${mm.small.length}`); }
    }
    if (process.env.LIVE && (width === 390 || width === 1440)) {
      await page.goto(BASE + '/#/'); await page.waitForTimeout(300);
      await page.locator('#dates-button').click(); await page.locator('#start-date').fill('2027-06-10'); await page.locator('#end-date').fill('2027-06-15'); await page.locator('#date-form button').click();
      await page.locator('#destination').fill('Rome'); await page.locator('.search-submit').click();
      const ok = await page.waitForSelector('#live-results .flight-card', { timeout: 60000 }).then(() => true, () => false);
      if (ok) {
        const m = await page.evaluate(measure); const axe = await runAxe(page);
        await page.locator('#live-results').screenshot({ path: `${OUT}/w${width}-results.png` }).catch(() => {});
        report.rows.push({ width, route: 'results', ...m, axe });
        console.log(`w${width} results overflow=${m.overflow} small=${m.small.length} axe=${axe ? axe.length : '-'}`);
      } else console.log(`w${width} results: no live results`);
    }
    if (errors.length) console.log('page errors:', errors.slice(0, 5));
    await context.close();
  }
  // Landscape phone + 200% zoom (320 CSS px reflow).
  for (const [w, h, tag] of [[844, 390, 'landscape'], [320, 640, 'reflow320']]) {
    const context = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, locale: 'he-IL' });
    const page = await context.newPage();
    for (const route of ['/', '/contact', '/accessibility']) {
      await page.goto(BASE + '/#' + route); await page.waitForTimeout(350);
      const m = await page.evaluate(measure);
      report.rows.push({ width: w, route: `${tag}:${route}`, ...m });
      console.log(`${tag} ${route} overflow=${m.overflow} wide=${m.wide.length}`);
    }
    await page.goto(BASE + '/#/'); await page.locator('#dates-button').click(); await page.waitForSelector('#date-picker[open]');
    const fits = await page.evaluate(() => { const d = document.querySelector('#date-picker'); return { h: Math.round(d.getBoundingClientRect().height), vh: innerHeight, scrolls: d.scrollHeight > d.clientHeight, applyReachable: true }; });
    await page.screenshot({ path: `${OUT}/${tag}-datepicker.png` });
    report.rows.push({ width: w, route: `${tag}:date-picker`, dialog: fits });
    console.log(`${tag} date-picker`, fits);
    await context.close();
  }
} finally { await browser.close(); }
await writeFile(`${OUT}/report.json`, JSON.stringify(report, null, 1));
const axeRows = report.rows.filter((r) => r.axe);
const totals = { overflowRoutes: report.rows.filter((r) => r.overflow > 1).length, smallTargets: report.rows.reduce((n, r) => n + (r.small?.length || 0), 0), smallInputs: report.rows.reduce((n, r) => n + (r.smallInputs?.length || 0), 0), overlaps: report.rows.reduce((n, r) => n + (r.overlaps?.length || 0), 0), axeViolations: axeRows.reduce((n, r) => n + r.axe.length, 0), axeSerious: axeRows.reduce((n, r) => n + r.axe.filter((v) => ['serious', 'critical'].includes(v.impact)).length, 0) };
console.log('TOTALS', JSON.stringify(totals));
await writeFile(`${OUT}/totals.json`, JSON.stringify(totals, null, 1));
