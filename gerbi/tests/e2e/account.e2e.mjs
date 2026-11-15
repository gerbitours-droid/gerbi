// Customer area (spec 17): guest → sign-up with merge → sync → enquiry → second device (375) → delete. No supplier calls.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const BASE = process.env.BASE_URL || 'http://localhost:4173', OUT = process.env.OUT || 'verification/e2e';
const email = `e2e-${Date.now()}@example.com`, password = 'sunny-beach-27';
const results = [];
const check = (name, ok, extra = '') => { results.push({ name, ok: !!ok, extra }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? ' — ' + extra : '')); };
const flight = { id: 'e2e-flight-1', savedAt: '2026-11-15T10:00:00.000Z', checkedAt: '2026-11-15T10:00:00.000Z', price: 1290, currency: 'ILS', destination: 'אתונה', trip: null, from: 'TLV', to: 'ATH', start: '2027-03-01', end: '2027-03-05', adults: 2, children: 0, carriers: ['Aegean'], checked: 'included', trolley: 'included',
  legs: [{ from: 'TLV', to: 'ATH', departDate: '2027-03-01', departTime: '08:00', arriveDate: '2027-03-01', arriveTime: '10:05', stops: 0, minutes: 125, dayOffset: 0 }, { from: 'ATH', to: 'TLV', departDate: '2027-03-05', departTime: '18:00', arriveDate: '2027-03-05', arriveTime: '20:00', stops: 0, minutes: 120, dayOffset: 0 }] };
const journey = { brief: { adults: 2, children: 0 }, saved: { rome: { title: 'רומא של אביב', days: ['הגעה', 'קולוסיאום', 'טרסטוורה', 'חזרה'], request: '', nights: 3, adults: 2, children: 0, updated: '2026-11-14T09:00:00.000Z' } } };
const noHScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

const browser = await chromium.launch();
try {
  // Device A, desktop: a guest with things saved on the device.
  const a = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'he-IL' });
  await a.addInitScript(([f, j]) => { if (!localStorage.getItem('seeded')) { localStorage.setItem('seeded', '1'); localStorage.setItem('gerbi-saved-flights-v1', JSON.stringify([f])); localStorage.setItem('gerbi-journey-v1', JSON.stringify(j)); localStorage.setItem('gerbi-favorites', JSON.stringify(['santorini'])); } }, [flight, journey]);
  const pa = await a.newPage();
  const errors = []; pa.on('pageerror', (e) => errors.push(e.message));
  await pa.goto(BASE + '/#/');
  await pa.waitForFunction(() => document.querySelector('.header-actions .login')?.textContent.includes('התחברות'));
  check('guest header shows התחברות', true);
  await pa.screenshot({ path: `${OUT}/1440-guest-home-header.png`, clip: { x: 0, y: 0, width: 1440, height: 120 } });
  await pa.click('.header-actions .login');
  await pa.waitForSelector('#login-form');
  check('header button opens #/account sign-in card', pa.url().includes('#/account'));
  check('guest still sees device-saved flight', await pa.locator('.saved-flight').count() === 1);
  await pa.screenshot({ path: `${OUT}/1440-guest-account.png`, fullPage: false });
  await pa.click('#tab-signup');
  await pa.click('#signup-form [type=submit]');
  const focused = await pa.evaluate(() => document.activeElement?.id);
  check('empty signup shows errors and focuses first invalid field', focused === 'signup-name', focused);
  check('error linked via aria-describedby', await pa.evaluate(() => document.querySelector('#signup-name').getAttribute('aria-describedby').includes('signup-name-error') && document.querySelector('#signup-name').hasAttribute('aria-invalid')));
  await pa.locator('#pane-signup').screenshot({ path: `${OUT}/1440-signup-errors.png` });
  await pa.fill('#signup-name', 'דנה כהן'); await pa.fill('#signup-email', email); await pa.fill('#signup-password', password); await pa.fill('#signup-phone', '050-1234567');
  await pa.check('#signup-privacy');
  await Promise.all([pa.waitForEvent('load'), pa.click('#signup-form [type=submit]')]);
  await pa.waitForSelector('#acc-hello');
  check('after signup: signed-in panel with flash', (await pa.textContent('.account-flash')).includes('ברוכים הבאים'));
  const cookies = await a.cookies();
  const sid = cookies.find((c) => c.name === 'gerbi_sid');
  check('session cookie httpOnly + SameSite=Lax', sid?.httpOnly && sid?.sameSite === 'Lax', JSON.stringify({ httpOnly: sid?.httpOnly, sameSite: sid?.sameSite }));
  const saved = await pa.evaluate(() => fetch('/api/account/saved').then((r) => r.json()));
  check('device items merged into the account', saved.flights.length === 1 && saved.trips.rome && saved.favorites.includes('santorini'));
  await pa.waitForFunction(() => document.querySelector('#account-sync')?.textContent.includes('מסונכרן'));
  await pa.screenshot({ path: `${OUT}/1440-signed-in-account.png`, fullPage: true });
  await pa.click('#account-menu-button');
  check('user menu opens with aria-expanded', await pa.getAttribute('#account-menu-button', 'aria-expanded') === 'true');
  await pa.screenshot({ path: `${OUT}/1440-user-menu.png`, clip: { x: 0, y: 0, width: 1440, height: 380 } });
  await pa.keyboard.press('Escape');
  check('Escape closes the menu and returns focus', await pa.evaluate(() => document.activeElement?.id === 'account-menu-button' && document.querySelector('#account-menu').hidden));

  // A favorite added while signed in is pushed to the account.
  await pa.goto(BASE + '/#/destinations');
  await pa.waitForSelector('[data-page-favorite="rome"], .heart-button');
  const heart = pa.locator('[data-page-favorite="rome"]').first();
  await heart.click();
  await pa.waitForTimeout(2200);
  const afterFav = await pa.evaluate(() => fetch('/api/account/saved').then((r) => r.json()));
  check('favorite added while signed in syncs to the account', afterFav.favorites.includes('rome'), afterFav.favorites.join(','));

  // Enquiry while signed in: prefilled and linked.
  await pa.goto(BASE + '/#/contact');
  await pa.waitForSelector('#lead-form');
  await pa.waitForFunction(() => document.querySelector('#lead-name').value === 'דנה כהן');
  check('contact form prefilled from the account', await pa.inputValue('#lead-phone') === '0501234567' || await pa.inputValue('#lead-phone') === '050-1234567');
  await pa.fill('#lead-message', 'מחפשים טיסה לאתונה');
  await pa.check('#lead-consent');
  await pa.click('#lead-form [type=submit]');
  await pa.waitForSelector('.lead-success');
  await pa.evaluate(() => fetch('/api/account/searches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ search: { origin: 'TLV', to: 'ATH', start: '2027-03-01', end: '2027-03-05', type: 'round', adults: 2, children: 0 } }) }));
  await pa.goto(BASE + '/#/account');
  await pa.waitForSelector('[data-account-leads] li');
  check('my enquiries lists the linked enquiry', (await pa.textContent('[data-account-leads]')).includes('פנייה כללית'));
  await pa.waitForSelector('[data-account-searches] li');
  await pa.locator('#acc-leads').screenshot({ path: `${OUT}/1440-my-enquiries.png` });
  await pa.locator('#acc-profile').screenshot({ path: `${OUT}/1440-profile.png` });
  await pa.locator('#acc-privacy').screenshot({ path: `${OUT}/1440-privacy.png` });
  const exp = await pa.evaluate(() => fetch('/api/account/export').then(async (r) => ({ cd: r.headers.get('content-disposition'), text: await r.text() })));
  check('export downloads JSON without the password hash', /attachment/.test(exp.cd) && !exp.text.includes('scrypt') && exp.text.includes(email.toLowerCase()));
  // CSRF from another origin is refused.
  const csrf = await pa.evaluate(() => fetch('/api/account/profile', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: '{}' }).then((r) => r.status));
  check('non-JSON state change refused', csrf === 415, String(csrf));

  // Device B, phone 375: fresh browser, signs in and gets everything.
  const b = await browser.newContext({ viewport: { width: 375, height: 812 }, locale: 'he-IL', isMobile: true, hasTouch: true });
  const pb = await b.newPage(); pb.on('pageerror', (e) => errors.push(e.message));
  await pb.goto(BASE + '/#/account?login=1');
  await pb.waitForSelector('#login-form');
  check('375: no horizontal scroll on the sign-in page', await noHScroll(pb));
  await pb.click('#mobile-menu-button');
  check('375: guest mobile menu offers sign-in', (await pb.textContent('#mobile-menu')).includes('התחברות והטיולים שלי'));
  await pb.click('#close-mobile-menu');
  await pb.screenshot({ path: `${OUT}/375-guest-account.png` });
  await pb.fill('#login-email', email); await pb.fill('#login-password', 'wrong-password-1');
  await pb.click('#login-form [type=submit]');
  await pb.waitForSelector('#login-form .lead-form-error:not([hidden])');
  check('wrong password: generic message', (await pb.textContent('#login-form .lead-form-error')).includes('המייל או הסיסמה שגויים'));
  await pb.locator('.account-auth').screenshot({ path: `${OUT}/375-login-error.png` });
  await pb.fill('#login-password', password);
  await Promise.all([pb.waitForEvent('load'), pb.click('#login-form [type=submit]')]);
  await pb.waitForSelector('#acc-hello');
  await pb.waitForSelector('.saved-flight');
  check('second device shows the flight saved on the first', (await pb.textContent('.saved-flight')).includes('אתונה'));
  check('second device has favorites from the account', await pb.evaluate(() => JSON.parse(localStorage.getItem('gerbi-favorites')).includes('rome')));
  check('375: no horizontal scroll signed in', await noHScroll(pb));
  await pb.screenshot({ path: `${OUT}/375-signed-in-account.png` });
  await pb.screenshot({ path: `${OUT}/375-signed-in-account-full.png`, fullPage: true });
  await pb.click('#mobile-menu-button');
  await pb.waitForSelector('#mobile-menu:not([hidden])');
  check('375: mobile menu offers החשבון שלי + התנתקות', (await pb.textContent('#mobile-menu')).includes('החשבון שלי') && (await pb.textContent('#mobile-menu')).includes('התנתקות'));
  await pb.screenshot({ path: `${OUT}/375-mobile-menu.png` });
  await pb.click('#close-mobile-menu');

  // Delete the account from the phone.
  await pb.click('#acc-privacy .account-danger summary');
  await pb.fill('#delete-password', password);
  await Promise.all([pb.waitForEvent('load'), pb.click('#delete-form [type=submit]')]);
  await pb.waitForSelector('.account-flash');
  check('account deleted, back to guest', (await pb.textContent('.account-flash')).includes('החשבון נמחק') && await pb.locator('#login-form').count() === 1);
  // Device A's session is gone too.
  const me = await pa.evaluate(() => fetch('/api/account/me').then((r) => r.json()));
  check('other device signed out after deletion', me.user === null);
  check('no page errors', errors.length === 0, errors.join(' | '));
  check('brand: no "Volero" in UI text', !(await pa.evaluate(() => document.body.innerText.includes('Volero'))));
} finally { await browser.close(); }
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
