// Customer-service widget in a real browser at 1440 and 375 (spec 16 §11). Screenshots → verification/16-support-bot/.
// BASE_URL=http://localhost:4185 PLAYWRIGHT_MODULE=~/tevel-crm/node_modules/playwright/index.mjs node tests/e2e/support-bot.e2e.mjs
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const OUT = process.env.OUT || 'verification/16-support-bot', base = process.env.BASE_URL || 'http://localhost:4185';
const browser = await chromium.launch();
let failures = 0;
const check = (ok, label) => { console.log(`${ok ? '✓' : '✗'} ${label}`); if (!ok) failures++; };
const overlap = (a, b) => a && b && !(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y);

for (const W of [1440, 375]) {
  console.log(`\n— width ${W}`);
  const page = await (await browser.newContext({ viewport: { width: W, height: W > 600 ? 900 : 812 }, locale: 'he-IL' })).newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(base + '/#/');
  const launcher = page.locator('.sb-launcher');
  await launcher.waitFor();
  check(/שירות לקוחות/.test(await launcher.getAttribute('aria-label')), 'launcher labelled "שירות לקוחות"');
  if (W < 600) {
    const nav = await page.locator('.mobile-bottom').boundingBox(), box = await launcher.boundingBox();
    check(!overlap(nav, box), 'launcher clears the mobile bottom nav');
  }
  await page.screenshot({ path: `${OUT}/w${W}-home-launcher.png` });
  await launcher.click();
  const dialog = page.locator('#sb-dialog');
  await page.locator('.sb-bot').first().waitFor();
  check(await dialog.evaluate((d) => d.open && d.matches(':modal')), 'opens as a modal dialog');
  check(await page.locator('#sb-log[role=log][aria-live=polite]').count() === 1, 'messages in a polite live region');
  check(await page.evaluate(() => document.activeElement?.id) === 'sb-input', 'focus moves to the message field');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/w${W}-welcome.png` });
  await page.locator('.sb-chip', { hasText: 'כבודה' }).click();
  await page.locator('.sb-bot', { hasText: 'חברת התעופה' }).waitFor();
  await page.fill('#sb-input', 'אפשר לשלם בתשלומים?'); await page.press('#sb-input', 'Enter');
  await page.locator('.sb-bot', { hasText: 'אין תשלום באתר' }).waitFor();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/w${W}-faq-answers.png` });
  // Tab stays inside the dialog.
  for (let i = 0; i < 12; i++) await page.keyboard.press('Tab');
  check(await page.evaluate(() => !!document.activeElement?.closest('#sb-dialog')), 'Tab is trapped in the dialog');
  // Escalation.
  await page.fill('#sb-input', 'אני רוצה לדבר עם נציג'); await page.press('#sb-input', 'Enter');
  await page.locator('.sb-bot', { hasText: 'איך קוראים לכם' }).waitFor();
  check(await page.getAttribute('#sb-input', 'autocomplete') === 'name', 'name step uses autocomplete=name');
  await page.fill('#sb-input', 'בדיקת דפדפן'); await page.press('#sb-input', 'Enter');
  await page.locator('.sb-bot', { hasText: 'לאיזה מספר טלפון' }).waitFor();
  check(await page.getAttribute('#sb-input', 'type') === 'tel', 'phone step switches to type=tel');
  await page.fill('#sb-input', '123'); await page.press('#sb-input', 'Enter');
  await page.locator('.sb-bot', { hasText: 'לא נראה ישראלי' }).waitFor();
  await page.fill('#sb-input', '050-765-4321'); await page.press('#sb-input', 'Enter');
  await page.locator('.sb-chip', { hasText: 'כן, אפשר לחזור אליי' }).waitFor();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/w${W}-consent.png` });
  await page.locator('.sb-chip', { hasText: 'כן, אפשר לחזור אליי' }).click();
  await page.locator('.sb-bot', { hasText: 'מספר הפנייה' }).waitFor();
  check(await page.locator('#sb-badge:not([hidden])').count() === 1, 'hand-off badge with reference shown');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/w${W}-escalated.png` });
  await page.keyboard.press('Escape');
  check(!(await dialog.evaluate((d) => d.open)), 'Esc closes the dialog');
  check(await page.evaluate(() => document.activeElement?.classList.contains('sb-launcher')), 'focus returns to the launcher');
  // Conversation survives navigation in the same tab; the #/support page opens the same chat.
  await page.goto(base + '/#/support');
  await page.locator('[data-support-open]').waitFor();
  await page.screenshot({ path: `${OUT}/w${W}-support-page.png`, fullPage: false });
  await page.locator('[data-support-open]').click();
  check(await page.locator('.sb-bot', { hasText: 'מספר הפנייה' }).count() >= 1, '#/support button opens the same conversation');
  await page.keyboard.press('Escape');
  await page.goto(base + '/#/planner');
  check(!(await launcher.isVisible()), 'launcher steps aside on the planner (ג׳רבי) page');
  check(!errors.length, `no page errors ${errors.join(' | ')}`);
}
await browser.close();
console.log(failures ? `\n${failures} failed` : '\nAll browser checks passed.');
process.exit(failures ? 1 : 0);
