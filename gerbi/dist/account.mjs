// Customer area (spec docs/specs/17-customer-area-he.md): header sign-in / user menu, the account panel on #/account,
// and syncing the browser's saved items (flights, plans, favorites) with the account. Guests keep working exactly as before.
import { mergeSaved, savedSignature, validateSignup, validateProfile, passwordProblem, normalizeEmail, cleanSearch, searchKey, MARKETING_TEXT, PASSWORD_MIN } from './account-core.mjs';
import { SAVED_FLIGHTS_KEY, parseSearchLink, searchLink } from './saved-flights.mjs';
import { STORAGE_KEY } from './journey.mjs';
import { resolvePlace } from './places.mjs';

const FAVORITES_KEY = 'gerbi-favorites', SYNC_KEY = 'gerbi-account-sync-v1', FLASH_KEY = 'gerbi-account-flash', RELOAD_KEY = 'gerbi-account-reloaded';
const DEVICE_KEYS = [SAVED_FLIGHTS_KEY, STORAGE_KEY, FAVORITES_KEY, 'gerbi-draft-recovery-v1', 'gerbi-last-flight-search-v1', 'gerbi-preferences'];
const OFFLINE = 'אין חיבור לשרת כרגע. בדקו את החיבור ונסו שוב.';
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const $ = (selector, root = document) => root.querySelector(selector);
const browser = typeof document !== 'undefined';
const store = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); return true; } catch { return false; } },
  remove(key) { try { localStorage.removeItem(key); } catch { /* nothing stored */ } }
};
const json = (raw, fallback) => { try { return JSON.parse(raw) ?? fallback; } catch { return fallback; } };

export const account = { user: undefined, config: { emailLogin: false, passwordReset: false }, sync: 'idle', syncedAt: null };

async function api(method, path, payload, options = {}) {
  const response = await fetch('/api/account' + path, { method, credentials: 'same-origin', headers: payload === undefined ? {} : { 'Content-Type': 'application/json' }, body: payload === undefined ? undefined : JSON.stringify(payload), ...options });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401 && account.user && !['/login', '/password/change', '/delete', '/code/verify'].includes(path)) { account.user = null; renderHeader(); }
  return { status: response.status, ok: response.ok, data };
}

// ——— Saved items: the browser keeps working on localStorage; this mirrors it to the account. ———
function readLocal() {
  return { flights: json(store.get(SAVED_FLIGHTS_KEY), []), trips: json(store.get(STORAGE_KEY), {}).saved || {}, favorites: json(store.get(FAVORITES_KEY), []) };
}
function writeLocal(bundle) {
  const journey = json(store.get(STORAGE_KEY), {});
  return [store.set(SAVED_FLIGHTS_KEY, JSON.stringify(bundle.flights)), store.set(STORAGE_KEY, JSON.stringify({ ...journey, saved: bundle.trips })), store.set(FAVORITES_KEY, JSON.stringify(bundle.favorites))].every(Boolean);
}
const marker = () => json(store.get(SYNC_KEY), null);
const setMarker = (signature) => store.set(SYNC_KEY, JSON.stringify({ email: account.user.email, signature, at: new Date().toISOString() }));

function setSync(status) {
  account.sync = status;
  if (status === 'saved') account.syncedAt = new Date();
  const box = browser && $('#account-sync');
  if (box) box.textContent = syncText();
}
const syncText = () => ({ saving: 'שומרים בחשבון…', error: 'לא הצלחנו לסנכרן כרגע. ננסה שוב, והשמירות במכשיר בטוחות.', saved: `מסונכרן עם החשבון · ${account.syncedAt?.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) || ''}` })[account.sync] || 'מסונכרן עם החשבון';

// Returns true when the browser copy changed and the page needs a reload to show it.
export async function syncNow() {
  if (!account.user) return false;
  setSync('saving');
  try {
    const remote = await api('GET', '/saved');
    if (!remote.ok) { setSync('error'); return false; }
    const local = readLocal(), localSig = savedSignature(local), remoteSig = savedSignature(remote.data), last = marker();
    let changed = false;
    if (!last || last.email !== account.user.email) {
      // First sign-in on this device: union of both sides.
      const merged = mergeSaved(local, remote.data), mergedSig = savedSignature(merged);
      if (mergedSig !== remoteSig && !(await api('POST', '/saved', merged)).ok) { setSync('error'); return false; }
      if (mergedSig !== localSig) { writeLocal(merged); changed = true; }
      setMarker(mergedSig);
    } else if (localSig !== last.signature) {
      if (!(await api('POST', '/saved', local)).ok) { setSync('error'); return false; }
      setMarker(localSig);
    } else if (remoteSig !== last.signature) {
      writeLocal(remote.data); setMarker(remoteSig); changed = true;
    }
    setSync('saved');
    return changed;
  } catch { setSync('error'); return false; }
}
let pushTimer = null;
function schedulePush(delay = 1200) {
  if (!account.user) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(async () => {
    const last = marker();
    if (last?.email === account.user?.email && savedSignature(readLocal()) !== last.signature) await syncNow();
  }, delay);
}
function pushOnLeave() {
  const last = marker();
  if (!account.user || last?.email !== account.user.email) return;
  const local = readLocal(), signature = savedSignature(local);
  if (signature === last.signature) return;
  try { fetch('/api/account/saved', { method: 'POST', keepalive: true, credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(local) }); setMarker(signature); } catch { /* next visit pushes it */ }
}
function reloadOnce() {
  // A pull from the account replaces what the page already loaded; reload once (never in a loop).
  const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
  if (Date.now() - last < 15000) return;
  try { sessionStorage.setItem(RELOAD_KEY, String(Date.now())); } catch { return; }
  location.reload();
}
const flash = (text) => { try { sessionStorage.setItem(FLASH_KEY, text); } catch { /* optional */ } };
function takeFlash() { try { const text = sessionStorage.getItem(FLASH_KEY); sessionStorage.removeItem(FLASH_KEY); return text || ''; } catch { return ''; } }

async function signedIn(user, message) {
  account.user = user;
  await syncNow();
  flash(message);
  if (location.hash.split('?')[0] !== '#/account') location.hash = '#/account';
  else history.replaceState(null, '', '#/account');
  location.reload();
}
async function signOut({ clear = false } = {}) {
  await api('POST', '/logout', {}).catch(() => null);
  store.remove(SYNC_KEY);
  if (clear) DEVICE_KEYS.forEach((key) => store.remove(key));
  flash(clear ? 'התנתקתם, והשמירות נוקו מהמכשיר הזה. הן נשמרות בחשבון.' : 'התנתקתם. השמירות נשארו במכשיר הזה ובחשבון.');
  history.replaceState(null, '', '#/account');
  location.reload();
}

// ——— Header: "התחברות" for guests, the customer's name and a small menu once signed in. ———
const userIcon = '<svg aria-hidden="true"><use href="#i-user"/></svg>';
function closeMenu(focus = false) {
  const button = $('#account-menu-button'), menu = $('#account-menu');
  if (!button || !menu || menu.hidden) return;
  menu.hidden = true; button.setAttribute('aria-expanded', 'false');
  if (focus) button.focus();
}
export function renderHeader() {
  if (!browser) return;
  const button = $('.header-actions .login');
  if (!button || account.user === undefined) return;
  $('#account-menu')?.remove();
  const mobileLink = $('#mobile-menu a[href="#/account"]');
  $('#mobile-menu [data-account-logout]')?.remove();
  if (!account.user) {
    button.dataset.info = 'account';
    button.removeAttribute('aria-expanded'); button.removeAttribute('aria-controls'); button.id = '';
    button.innerHTML = `${userIcon}התחברות`;
    button.setAttribute('aria-label', 'התחברות לחשבון והטיולים שלי');
    if (mobileLink) mobileLink.textContent = 'התחברות והטיולים שלי';
    return;
  }
  const first = account.user.name.split(/\s+/)[0];
  delete button.dataset.info;
  button.id = 'account-menu-button';
  button.setAttribute('aria-expanded', 'false'); button.setAttribute('aria-controls', 'account-menu');
  button.setAttribute('aria-label', `החשבון של ${account.user.name}`);
  button.innerHTML = `${userIcon}<span class="account-name">${esc(first)}</span><span class="account-caret" aria-hidden="true">▾</span>`;
  button.insertAdjacentHTML('afterend', `<div id="account-menu" class="account-menu" hidden><p class="account-menu-who"><strong>${esc(account.user.name)}</strong><span dir="ltr">${esc(account.user.email)}</span></p><a href="#/account">החשבון שלי</a><a href="#/account" data-account-jump="acc-trips">הטיולים שלי</a><a href="#/account" data-account-jump="acc-leads">הפניות שלי</a><button type="button" data-account-logout>התנתקות</button></div>`);
  if (mobileLink) { mobileLink.textContent = 'החשבון שלי'; mobileLink.insertAdjacentHTML('afterend', '<button type="button" class="mobile-menu-logout" data-account-logout>התנתקות</button>'); }
}
function wireHeader() {
  document.addEventListener('click', (event) => {
    const toggle = event.target.closest('#account-menu-button');
    if (toggle) { const menu = $('#account-menu'), open = menu.hidden; menu.hidden = !open; toggle.setAttribute('aria-expanded', String(open)); if (open) menu.querySelector('a')?.focus(); return; }
    if (event.target.closest('[data-account-logout]')) { event.preventDefault(); signOut(); return; }
    const jump = event.target.closest('[data-account-jump]');
    if (jump) { event.preventDefault(); closeMenu(); pendingJump = jump.dataset.accountJump; if (location.hash.split('?')[0] === '#/account') jumpTo(); else location.hash = '#/account'; return; }
    if (!event.target.closest('#account-menu')) closeMenu();
    else if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !$('#account-menu')?.hidden) closeMenu(true); });
}
let pendingJump = '';
function jumpTo() {
  const target = pendingJump && document.getElementById(pendingJump);
  if (!target) return;
  pendingJump = '';
  target.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  const heading = target.matches('h2') ? target : target.querySelector('h2');
  if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
}

// ——— Forms ———
function field(form, name, label, attrs, { hint = '', optional = false, type = 'text' } = {}) {
  const id = `${form}-${name}`, describedBy = [hint && `${id}-hint`, `${id}-error`].filter(Boolean).join(' ');
  return `<div class="lead-field" data-field="${name}"><label for="${id}">${label}${optional ? ' <span class="lead-optional">(רשות)</span>' : ''}</label><input id="${id}" name="${name}" type="${type}" ${attrs} aria-describedby="${describedBy}">${hint ? `<p class="lead-hint" id="${id}-hint">${hint}</p>` : ''}<p class="lead-error" id="${id}-error" hidden></p></div>`;
}
const passwordField = (form, name, label, autocomplete, hint = '') => field(form, name, label, `autocomplete="${autocomplete}" dir="ltr" maxlength="128" required`, { type: 'password', hint });
const checkbox = (form, name, text, { required = false, hint = '', checked = false } = {}) => `<div class="lead-field" data-field="${name}"><label class="lead-check"><input type="checkbox" id="${form}-${name}" name="${name}" ${required ? 'required' : ''} ${checked ? 'checked' : ''} aria-describedby="${hint ? `${form}-${name}-hint ` : ''}${form}-${name}-error"><span>${text}</span></label>${hint ? `<p class="lead-hint" id="${form}-${name}-hint">${hint}</p>` : ''}<p class="lead-error" id="${form}-${name}-error" hidden></p></div>`;
const formEnd = (label, extra = '') => `<p class="lead-form-error" role="alert" hidden></p><p class="account-form-ok" role="status"></p><button type="submit" class="button yellow full-width">${label}</button>${extra}`;

function showErrors(form, errors) {
  for (const box of form.querySelectorAll('[data-field]')) {
    const message = errors[box.dataset.field], slot = box.querySelector('.lead-error');
    if (slot) { slot.textContent = message || ''; slot.hidden = !message; }
    box.classList.toggle('invalid', Boolean(message));
    box.querySelectorAll('input').forEach((input) => input.toggleAttribute('aria-invalid', Boolean(message)));
  }
  const first = form.querySelector('[data-field].invalid input');
  if (first) first.focus();
  return Object.keys(errors).length > 0;
}
function wireForm(form, { validate = () => ({}), request, done }) {
  if (!form) return;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formError = $('.lead-form-error', form), ok = $('.account-form-ok', form), button = $('[type=submit]', form), label = button.textContent;
    formError.hidden = true; ok.textContent = '';
    const values = Object.fromEntries([...new FormData(form)].map(([key, value]) => [key, typeof value === 'string' ? value : '']));
    form.querySelectorAll('input[type=checkbox]').forEach((box) => { values[box.name] = box.checked; });
    if (showErrors(form, validate(values))) return;
    button.disabled = true; button.setAttribute('aria-busy', 'true'); button.textContent = 'רגע…';
    try {
      const result = await request(values);
      if (result.ok) { await done(result.data, form, ok); return; }
      if (result.data?.fields && showErrors(form, result.data.fields)) return;
      formError.textContent = result.data?.message || (result.status === 503 ? 'השירות אינו זמין כרגע. נסו שוב בעוד רגע.' : 'משהו השתבש. נסו שוב.');
      formError.hidden = false;
    } catch { formError.textContent = OFFLINE; formError.hidden = false; }
    finally { if (button.isConnected) { button.disabled = false; button.removeAttribute('aria-busy'); button.textContent = label; } }
  });
}
const requireEmail = (values) => { const email = normalizeEmail(values.email); return email ? {} : { email: 'כתבו כתובת מייל.' }; };

// ——— #/account for guests: sign in / sign up / code / forgot / reset ———
function guestPanel(resetToken) {
  const { emailLogin, passwordReset } = account.config;
  if (resetToken) return `<section class="surface-panel account-auth" aria-labelledby="auth-title"><span class="eyebrow">איפוס סיסמה</span><h2 id="auth-title">בחירת סיסמה חדשה</h2>
    <form id="reset-form" class="lead-form" novalidate>${passwordField('reset', 'password', 'סיסמה חדשה', 'new-password', `לפחות ${PASSWORD_MIN} תווים.`)}${formEnd('שמירת הסיסמה')}</form></section>`;
  const forgot = passwordReset
    ? `<details class="account-more"><summary>שכחתם סיסמה?</summary><form id="forgot-form" class="lead-form" novalidate><p class="micro-copy">נשלח אליכם קישור לבחירת סיסמה חדשה.</p>${field('forgot', 'email', 'מייל', 'autocomplete="email" dir="ltr" maxlength="120" required', { type: 'email' })}${formEnd('שליחת קישור לאיפוס')}</form></details>`
    : `<details class="account-more"><summary>שכחתם סיסמה?</summary><p class="micro-copy">אין כרגע איפוס עצמי באתר. <a href="#/contact">צרו קשר עם נציג</a> ונעזור לכם להיכנס לחשבון.</p></details>`;
  const code = emailLogin
    ? `<details class="account-more"><summary>כניסה עם קוד במייל</summary><form id="code-form" class="lead-form" novalidate><p class="micro-copy">לחשבון קיים: נשלח קוד בן 6 ספרות למייל שלכם.</p>${field('code', 'email', 'מייל', 'autocomplete="email" dir="ltr" maxlength="120" required', { type: 'email' })}<div class="account-code-step" hidden>${field('code', 'code', 'הקוד מהמייל', 'inputmode="numeric" autocomplete="one-time-code" dir="ltr" maxlength="6" pattern="[0-9]*"')}</div>${formEnd('שליחת קוד')}</form></details>`
    : '';
  return `<section class="surface-panel account-auth" aria-labelledby="auth-title">
   <div class="account-auth-intro"><span class="eyebrow">החשבון שלכם בג׳רבי טורס</span><h2 id="auth-title">שמרו את הטיולים לתמיד</h2><p>התחברו כדי לשמור טיסות, תוכניות ומועדפים בחשבון, לראות את הפניות שלכם ולהמשיך מכל מכשיר. לא חובה: הכול עובד גם בלי חשבון.</p></div>
   <div class="account-tabs" role="tablist" aria-label="התחברות או פתיחת חשבון"><button type="button" role="tab" id="tab-login" aria-selected="true" aria-controls="pane-login">התחברות</button><button type="button" role="tab" id="tab-signup" aria-selected="false" aria-controls="pane-signup" tabindex="-1">פתיחת חשבון</button></div>
   <div role="tabpanel" id="pane-login" aria-labelledby="tab-login">
    <form id="login-form" class="lead-form" novalidate>${field('login', 'email', 'מייל', 'autocomplete="username" dir="ltr" maxlength="120" required', { type: 'email' })}${passwordField('login', 'password', 'סיסמה', 'current-password')}${formEnd('התחברות')}</form>
    ${code}${forgot}
   </div>
   <div role="tabpanel" id="pane-signup" aria-labelledby="tab-signup" hidden>
    <form id="signup-form" class="lead-form" novalidate><p class="micro-copy">שדות ללא סימון „רשות” הם שדות חובה.</p>
     <div class="lead-grid">${field('signup', 'name', 'שם מלא', 'autocomplete="name" maxlength="80" required')}${field('signup', 'email', 'מייל', 'autocomplete="email" dir="ltr" maxlength="120" required', { type: 'email' })}</div>
     <div class="lead-grid">${passwordField('signup', 'password', 'סיסמה', 'new-password', `לפחות ${PASSWORD_MIN} תווים. מומלץ משפט קצר שקל לכם לזכור.`)}${field('signup', 'phone', 'טלפון נייד', 'autocomplete="tel" inputmode="tel" dir="ltr" maxlength="20" placeholder="050-1234567"', { type: 'tel', optional: true, hint: 'כדי שנציג יוכל לחזור אליכם מהר יותר.' })}</div>
     <div class="lead-consent">${checkbox('signup', 'privacy', 'אני מאשר/ת לג׳רבי טורס לשמור את פרטי החשבון והשמירות שלי כדי לספק לי את השירות.', { required: true, hint: 'אין חובה חוקית למסור את הפרטים, אבל בלעדיהם אי אפשר לפתוח חשבון. הפרטים (שם, מייל, טלפון, השמירות והחיפושים) נשמרים אצל ג׳רבי טורס בגישה מוגבלת, משמשים רק לחשבון ולפניות שלכם ואינם נמסרים לאחרים. אפשר לעיין בהם, לתקן, להוריד ולמחוק את החשבון בכל עת. פרטים ב<a href="#/privacy">מדיניות הפרטיות</a> וב<a href="#/terms">תנאי השימוש</a>.' })}
      ${checkbox('signup', 'marketing', MARKETING_TEXT)}</div>
     ${formEnd('פתיחת חשבון')}</form>
   </div></section>`;
}
function wireGuest(view, resetToken) {
  if (resetToken) {
    wireForm($('#reset-form', view), { validate: (v) => { const p = passwordProblem(v.password); return p ? { password: p } : {}; }, request: (v) => api('POST', '/password/reset', { token: resetToken, password: v.password }),
      done: (data) => { flash(data.message || 'הסיסמה עודכנה. אפשר להתחבר.'); history.replaceState(null, '', '#/account'); location.reload(); } });
    return;
  }
  const tabs = [...view.querySelectorAll('[role=tab]')];
  const select = (tab) => { tabs.forEach((t) => { const on = t === tab; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; $('#' + t.getAttribute('aria-controls'), view).hidden = !on; }); tab.focus(); };
  tabs.forEach((tab, i) => { tab.onclick = () => select(tab); tab.onkeydown = (e) => { const step = { ArrowLeft: 1, ArrowRight: -1, Home: -i, End: tabs.length - 1 - i }[e.key]; if (step !== undefined) { e.preventDefault(); select(tabs[(i + step + tabs.length) % tabs.length]); } }; });
  wireForm($('#login-form', view), { validate: (v) => ({ ...requireEmail(v), ...(v.password ? {} : { password: 'כתבו סיסמה.' }) }), request: (v) => api('POST', '/login', { email: v.email, password: v.password }), done: (data) => signedIn(data.user, `שלום ${data.user.name}, התחברתם. השמירות מהמכשיר הזה נשמרו בחשבון.`) });
  wireForm($('#signup-form', view), { validate: (v) => validateSignup(v).errors, request: (v) => api('POST', '/signup', v), done: (data) => signedIn(data.user, `ברוכים הבאים, ${data.user.name}! החשבון נפתח, וכל מה ששמרתם במכשיר הזה עבר אליו.`) });
  wireForm($('#forgot-form', view), { validate: requireEmail, request: (v) => api('POST', '/password/forgot', { email: v.email }), done: (data, form, ok) => { ok.textContent = data.message; } });
  const codeForm = $('#code-form', view);
  wireForm(codeForm, {
    validate: (v) => ({ ...requireEmail(v), ...(!$('.account-code-step', codeForm).hidden && !/^\d{6}$/.test(v.code.trim()) ? { code: 'כתבו את 6 הספרות מהמייל.' } : {}) }),
    request: (v) => ($('.account-code-step', codeForm).hidden ? api('POST', '/code/request', { email: v.email }) : api('POST', '/code/verify', { email: v.email, code: v.code.trim() })),
    done: (data, form, ok) => {
      if (data.user) return signedIn(data.user, `שלום ${data.user.name}, התחברתם עם קוד.`);
      ok.textContent = data.message; $('.account-code-step', form).hidden = false; $('[type=submit]', form).textContent = 'כניסה עם הקוד'; $('#code-code', form).focus();
    }
  });
  if (new URLSearchParams(location.hash.split('?')[1] || '').get('login') === 'signup') select(tabs[1]);
}

// ——— #/account for a signed-in customer ———
const TYPE = { contact: 'פנייה כללית', tailor: 'טיול בהתאמה אישית' };
const heDate = (value) => (Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
const placeName = (code) => resolvePlace(code)?.label || code;
function userPanel() {
  const user = account.user;
  return `<section class="surface-panel account-card" aria-labelledby="acc-hello"><div class="account-card-head"><span class="account-avatar" aria-hidden="true">${esc(user.name.trim()[0] || '?')}</span><div><span class="eyebrow">החשבון שלי</span><h2 id="acc-hello">שלום, ${esc(user.name.split(/\s+/)[0])}</h2><p class="micro-copy" dir="ltr">${esc(user.email)}</p></div><p class="account-sync" id="account-sync" role="status">${esc(syncText())}</p></div>
   <nav class="account-nav" aria-label="אזורים בחשבון">${[['acc-trips', 'הטיולים שלי'], ['acc-leads', 'הפניות שלי'], ['acc-searches', 'חיפושים אחרונים'], ['acc-profile', 'פרטים אישיים'], ['acc-privacy', 'פרטיות וחשבון']].map(([id, label]) => `<a href="#/account" data-account-jump="${id}">${label}</a>`).join('')}</nav></section>`;
}
function userSections() {
  const user = account.user;
  return `<section class="surface-panel account-section" id="acc-leads" aria-labelledby="acc-leads-title"><div class="panel-heading"><h2 id="acc-leads-title">הפניות שלי</h2><a class="button secondary" href="#/contact">פנייה חדשה</a></div><div data-account-leads aria-busy="true"><p class="micro-copy">טוענים את הפניות…</p></div></section>
  <section class="surface-panel account-section" id="acc-searches" aria-labelledby="acc-searches-title"><div class="panel-heading"><h2 id="acc-searches-title">חיפושים אחרונים</h2><button type="button" class="text-button" data-clear-searches hidden>ניקוי ההיסטוריה</button></div><div data-account-searches aria-busy="true"><p class="micro-copy">טוענים…</p></div></section>
  <section class="surface-panel account-section" id="acc-profile" aria-labelledby="acc-profile-title"><h2 id="acc-profile-title">פרטים אישיים</h2>
   <form id="profile-form" class="lead-form" novalidate><div class="lead-grid">${field('profile', 'name', 'שם מלא', `autocomplete="name" maxlength="80" required value="${esc(user.name)}"`)}${field('profile', 'phone', 'טלפון נייד', `autocomplete="tel" inputmode="tel" dir="ltr" maxlength="20" placeholder="050-1234567" value="${esc(user.phone)}"`, { type: 'tel', optional: true })}
    <div class="lead-field"><label for="profile-email">מייל</label><input id="profile-email" type="email" dir="ltr" value="${esc(user.email)}" readonly aria-describedby="profile-email-hint"><p class="lead-hint" id="profile-email-hint">לשינוי כתובת המייל <a href="#/contact">פנו לנציג</a>.${user.emailVerified ? ' המייל אומת.' : ''}</p></div></div>
    <div class="lead-consent">${checkbox('profile', 'marketing', MARKETING_TEXT, { checked: user.marketing })}</div>${formEnd('שמירת הפרטים')}</form>
   <details class="account-more"><summary>שינוי סיסמה</summary><form id="password-form" class="lead-form" novalidate>${passwordField('password', 'current', 'הסיסמה הנוכחית', 'current-password')}${passwordField('password', 'password', 'סיסמה חדשה', 'new-password', `לפחות ${PASSWORD_MIN} תווים. החיבור במכשירים אחרים ינותק.`)}${formEnd('עדכון הסיסמה')}</form></details></section>
  <section class="surface-panel account-section" id="acc-privacy" aria-labelledby="acc-privacy-title"><h2 id="acc-privacy-title">פרטיות וחשבון</h2>
   <p>המידע בחשבון שלכם: שם, מייל, טלפון, הסכמה לדיוור, הטיולים, הטיסות והמועדפים ששמרתם, חיפושים אחרונים ותקציר הפניות. אפשר להוריד עותק מלא, לתקן פרטים למעלה או למחוק את החשבון.</p>
   <div class="account-actions"><a class="button secondary" href="/api/account/export" download="gerbi-tours-my-data.json">הורדת המידע שלי (JSON)</a><button type="button" class="button secondary" data-account-logout>התנתקות</button><button type="button" class="button secondary" data-account-logout-clear>התנתקות וניקוי המכשיר</button></div>
   <p class="micro-copy">„ניקוי המכשיר” מוחק מהדפדפן הזה את הטיולים, הטיסות והמועדפים (בחשבון הם נשארים). מומלץ במחשב משותף.</p>
   <details class="account-more account-danger"><summary>מחיקת החשבון</summary><form id="delete-form" class="lead-form" novalidate><p>המחיקה סופית: החשבון, השמירות בחשבון וההיסטוריה יימחקו ולא יהיה אפשר לשחזר אותם. פניות שכבר שלחתם נשמרות אצל צוות ג׳רבי טורס לטיפול; כדי למחוק גם אותן, <a href="#/contact">כתבו לנו</a>.</p>${passwordField('delete', 'password', 'אישור בסיסמה', 'current-password')}<p class="lead-form-error" role="alert" hidden></p><p class="account-form-ok" role="status"></p><button type="submit" class="button account-delete">מחיקת החשבון לצמיתות</button></form></details></section>`;
}
async function fillLeads(view) {
  const box = $('[data-account-leads]', view);
  try {
    const { ok, data } = await api('GET', '/leads');
    if (!box.isConnected) return;
    box.removeAttribute('aria-busy');
    if (!ok) { box.innerHTML = '<p class="micro-copy">לא הצלחנו לטעון את הפניות כרגע.</p>'; return; }
    box.innerHTML = data.leads.length
      ? `<ul class="account-list">${data.leads.map((lead) => `<li><div><strong>${esc(lead.title)}</strong><span class="micro-copy">${esc(TYPE[lead.type] || 'פנייה')} · נשלחה ב־${esc(heDate(lead.createdAt))} · מספר פנייה <bdi dir="ltr">${esc(lead.ref)}</bdi></span></div><span class="account-badge">התקבלה</span></li>`).join('')}</ul>${account.user.emailVerified ? '' : '<p class="micro-copy">מוצגות פניות ששלחתם כשהייתם מחוברים. פניות קודמות עם אותו מייל יופיעו אחרי אימות המייל.</p>'}`
      : `<p>עוד לא השארתם פנייה. רוצים שנציג יחזור אליכם? <a href="#/contact">השאירו פרטים</a> או <a href="#/tailor-made">ספרו לנו על טיול בהתאמה אישית</a>.</p>`;
  } catch { if (box.isConnected) { box.removeAttribute('aria-busy'); box.innerHTML = `<p class="micro-copy">${OFFLINE}</p>`; } }
}
function searchesMarkup(list) {
  return list.length
    ? `<ul class="account-list">${list.map((s) => `<li><div><strong>${esc(placeName(s.origin))} ← ${esc(placeName(s.to))}</strong><span class="micro-copy">${esc(heDate(s.start + 'T12:00:00'))}${s.end ? ' – ' + esc(heDate(s.end + 'T12:00:00')) : ' · כיוון אחד'} · ${s.adults + s.children} נוסעים</span></div><a class="button secondary" href="${esc(searchLink({ origin: s.origin, destination: s.to, start: s.start, end: s.end, type: s.type, adults: s.adults, children: s.children }))}">חיפוש שוב</a></li>`).join('')}</ul>`
    : '<p class="micro-copy">חיפושי טיסות שתעשו כשאתם מחוברים יופיעו כאן (רק מסלול, תאריכים ונוסעים; בלי מחירים).</p>';
}
async function fillSearches(view) {
  const box = $('[data-account-searches]', view), clear = $('[data-clear-searches]', view);
  const show = (list) => { box.removeAttribute('aria-busy'); box.innerHTML = searchesMarkup(list); clear.hidden = !list.length; };
  try { const { ok, data } = await api('GET', '/searches'); if (box.isConnected) ok ? show(data.searches) : (box.innerHTML = '<p class="micro-copy">לא הצלחנו לטעון כרגע.</p>'); } catch { if (box.isConnected) box.innerHTML = `<p class="micro-copy">${OFFLINE}</p>`; }
  clear.onclick = async () => { const { ok, data } = await api('POST', '/searches', { clear: true }).catch(() => ({})); if (ok) { show(data.searches); box.setAttribute('tabindex', '-1'); box.focus(); } };
}
function wireUser(view) {
  // The page's own "saved on this device" wording becomes "saved in your account".
  const tripsHeading = [...view.querySelectorAll('.panel-heading h2')].find((h) => h.textContent.includes('הטיולים השמורים'));
  if (tripsHeading) tripsHeading.id = 'acc-trips';
  view.querySelectorAll('.saved-card .eyebrow').forEach((el) => { el.textContent = 'תוכנית אישית · נשמרה בחשבון'; });
  fillLeads(view); fillSearches(view);
  wireForm($('#profile-form', view), { validate: (v) => validateProfile(v).errors, request: (v) => api('POST', '/profile', v),
    done: (data, form, ok) => { account.user = data.user; ok.textContent = 'הפרטים נשמרו.'; renderHeader(); } });
  wireForm($('#password-form', view), { validate: (v) => ({ ...(v.current ? {} : { current: 'כתבו את הסיסמה הנוכחית.' }), ...(passwordProblem(v.password) ? { password: passwordProblem(v.password) } : {}) }), request: (v) => api('POST', '/password/change', v),
    done: (data, form, ok) => { form.reset(); ok.textContent = data.message; } });
  wireForm($('#delete-form', view), { validate: (v) => (v.password ? {} : { password: 'כתבו את הסיסמה כדי לאשר.' }), request: (v) => api('POST', '/delete', { password: v.password }),
    done: () => { store.remove(SYNC_KEY); account.user = null; flash('החשבון נמחק. השמירות שבמכשיר הזה נשארו בדפדפן בלבד.'); history.replaceState(null, '', '#/account'); location.reload(); } });
  $('[data-account-logout-clear]', view).onclick = () => signOut({ clear: true });
}

// Called by pages.mjs inside #/account: a slot after the welcome block, then filled once the session is known.
export const accountSlot = () => '<div id="account-panel" class="account-panel" aria-live="polite"></div>';
export async function wireAccountPage(view) {
  await ready;
  const slot = $('#account-panel', view);
  if (!slot) return;
  const message = takeFlash();
  const resetToken = new URLSearchParams(location.hash.split('?')[1] || '').get('reset') || '';
  slot.innerHTML = (message ? `<p class="account-flash" role="status">${esc(message)}</p>` : '') + (account.user ? userPanel() : guestPanel(account.user === null && /^[A-Za-z0-9_-]{20,100}$/.test(resetToken) ? resetToken : ''));
  const notice = $('.soft-notice p', view);
  if (notice) notice.innerHTML = account.user ? '<strong>מסונכרן עם החשבון שלכם.</strong> הטיולים, הטיסות והמועדפים נשמרים בחשבון ובדפדפן הזה, וזמינים מכל מכשיר שבו תתחברו.' : '<strong>השמירה כרגע במכשיר הזה בלבד.</strong> אין חובה להתחבר. כדי לשמור בחשבון ולהמשיך מכל מכשיר, התחברו או פתחו חשבון למעלה.';
  if (account.user) { $('.soft-notice', view)?.insertAdjacentHTML('beforebegin', userSections()); wireUser(view); jumpTo(); }
  else if (account.user === null) {
    wireGuest(view, /^[A-Za-z0-9_-]{20,100}$/.test(resetToken) ? resetToken : '');
    if (/[?&](login|reset)=/.test(location.hash)) { slot.scrollIntoView({ block: 'start' }); $('#login-email, #reset-password', slot)?.focus(); }
  } else slot.innerHTML = '<p class="micro-copy">החשבון אינו זמין כרגע. אפשר להמשיך לשמור במכשיר הזה.</p>';
}

// ——— Natural moments: saving a flight, lead forms, flight searches ———
function wireMoments() {
  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-save-flight]')) setTimeout(() => {
      const status = $('#save-flight-status');
      if (!status || !/נשמרה/.test(status.textContent)) return;
      if (account.user) { status.innerHTML = 'הטיסה נשמרה בחשבון שלכם. <a href="#/account">לטיולים שלי ←</a> לא הוזמן; נדרשת בדיקת זמינות לפני המשך.'; schedulePush(200); }
      else if (account.user === null) status.insertAdjacentHTML('beforeend', ' <a class="account-save-cta" href="#/account?login=signup">שמרו לתמיד בחשבון</a>');
    }, 0);
    schedulePush();
  });
  document.addEventListener('change', () => schedulePush());
  document.addEventListener('submit', () => schedulePush());
  document.addEventListener('brief-changed', () => schedulePush());
  setInterval(() => schedulePush(0), 20000);
  addEventListener('pagehide', pushOnLeave);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') pushOnLeave(); });
  // Prefill the lead forms with the account's details (only empty fields).
  const prefill = () => setTimeout(() => {
    if (!account.user) return;
    for (const [name, value] of [['name', account.user.name], ['phone', account.user.phone], ['email', account.user.email]]) { const input = $('#lead-form #lead-' + name); if (input && !input.value && value) input.value = value; }
  }, 0);
  addEventListener('hashchange', prefill); ready.then(prefill);
  // Search history: a results list for a shareable search, recorded once per search while signed in.
  const host = $('#live-results');
  let lastKey = '';
  if (host && typeof MutationObserver !== 'undefined') new MutationObserver(() => {
    if (!account.user || host.hidden || !host.querySelector('.flight-list')) return;
    const search = cleanSearch(parseSearchLink(location.hash));
    if (!search || searchKey(search) === lastKey) return;
    lastKey = searchKey(search);
    api('POST', '/searches', { search }).catch(() => {});
  }).observe(host, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
}

async function boot() {
  try {
    const [me, config] = await Promise.all([api('GET', '/me'), api('GET', '/config')]);
    account.config = config.ok ? config.data : account.config;
    account.user = me.ok ? me.data.user : undefined;
  } catch { account.user = undefined; }
  renderHeader();
  if (account.user && await syncNow()) reloadOnce();
}
export const ready = browser ? boot() : Promise.resolve();
if (browser) { wireHeader(); wireMoments(); }
