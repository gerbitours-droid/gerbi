// Customer area (spec docs/specs/17-customer-area-he.md): header sign-in / user menu, the account panel on #/account,
// and syncing the browser's saved items (flights, plans, favorites) with the account. Guests keep working exactly as before.
import { mergeSaved, savedSignature, validateSignup, validateProfile, passwordProblem, normalizeEmail, cleanSearch, searchKey, marketingText, PASSWORD_MIN } from './account-core.mjs';
import { SAVED_FLIGHTS_KEY, parseSearchLink, searchLink } from './saved-flights.mjs';
import { STORAGE_KEY } from './journey.mjs';
import { resolvePlace } from './places.mjs';
import { t, lang, locale, errorText } from './i18n.mjs';
import { travellersSectionHtml, wireTravellers } from './account-travellers.mjs';

const FAVORITES_KEY = 'gerbi-favorites', SYNC_KEY = 'gerbi-account-sync-v1', FLASH_KEY = 'gerbi-account-flash', RELOAD_KEY = 'gerbi-account-reloaded';
const DEVICE_KEYS = [SAVED_FLIGHTS_KEY, STORAGE_KEY, FAVORITES_KEY, 'gerbi-draft-recovery-v1', 'gerbi-last-flight-search-v1', 'gerbi-preferences'];
const OFFLINE = t('core.err.network');
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
  const response = await fetch('/api/account' + path, { method, credentials: 'same-origin', headers: payload === undefined ? {} : { 'Content-Type': 'application/json' }, body: payload === undefined ? undefined : JSON.stringify(payload && typeof payload === 'object' && !Array.isArray(payload) ? { ...payload, lang } : payload), ...options });
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
const syncText = () => ({ saving: t('account.sync.saving'), error: t('account.sync.error'), saved: t('account.sync.savedAt', { time: account.syncedAt?.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' }) || '' }) })[account.sync] || t('account.sync.synced');

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
  flash(clear ? t('account.flash.signedOutClear') : t('account.flash.signedOut'));
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
    button.innerHTML = `${userIcon}${t('account.header.login')}`;
    button.setAttribute('aria-label', t('account.header.loginAria'));
    if (mobileLink) mobileLink.textContent = t('account.header.mobileLogin');
    return;
  }
  const first = account.user.name.split(/\s+/)[0];
  delete button.dataset.info;
  button.id = 'account-menu-button';
  button.setAttribute('aria-expanded', 'false'); button.setAttribute('aria-controls', 'account-menu');
  button.setAttribute('aria-label', t('account.header.userAria', { name: account.user.name }));
  button.innerHTML = `${userIcon}<span class="account-name">${esc(first)}</span><span class="account-caret" aria-hidden="true">▾</span>`;
  button.insertAdjacentHTML('afterend', `<div id="account-menu" class="account-menu" hidden><p class="account-menu-who"><strong>${esc(account.user.name)}</strong><span dir="ltr">${esc(account.user.email)}</span></p><a href="#/account">${t('account.menu.account')}</a><a href="#/account" data-account-jump="acc-trips">${t('account.menu.trips')}</a><a href="#/account" data-account-jump="acc-leads">${t('account.menu.leads')}</a><button type="button" data-account-logout>${t('account.menu.logout')}</button></div>`);
  if (mobileLink) { mobileLink.textContent = t('account.menu.account'); mobileLink.insertAdjacentHTML('afterend', `<button type="button" class="mobile-menu-logout" data-account-logout>${t('account.menu.logout')}</button>`); }
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
  return `<div class="lead-field" data-field="${name}"><label for="${id}">${label}${optional ? ` <span class="lead-optional">${t('account.optional')}</span>` : ''}</label><input id="${id}" name="${name}" type="${type}" ${attrs} aria-describedby="${describedBy}">${hint ? `<p class="lead-hint" id="${id}-hint">${hint}</p>` : ''}<p class="lead-error" id="${id}-error" hidden></p></div>`;
}
const passwordField = (form, name, label, autocomplete, hint = '') => field(form, name, label, `autocomplete="${autocomplete}" dir="ltr" maxlength="128" required`, { type: 'password', hint });
const checkbox = (form, name, text, { required = false, hint = '', checked = false } = {}) => `<div class="lead-field" data-field="${name}"><label class="lead-check"><input type="checkbox" id="${form}-${name}" name="${name}" ${required ? 'required' : ''} ${checked ? 'checked' : ''} aria-describedby="${hint ? `${form}-${name}-hint ` : ''}${form}-${name}-error"><span>${text}</span></label>${hint ? `<p class="lead-hint" id="${form}-${name}-hint">${hint}</p>` : ''}<p class="lead-error" id="${form}-${name}-error" hidden></p></div>`;
const formEnd = (label, extra = '') => `<p class="lead-form-error" role="alert" hidden></p><p class="account-form-ok" role="status"></p><button type="submit" class="button yellow full-width">${label}</button>${extra}`;

function showErrors(form, errors) {
  for (const box of form.querySelectorAll('[data-field]')) {
    const message = errors[box.dataset.field], slot = box.querySelector('.lead-error');
    if (slot) { slot.textContent = message || ''; slot.hidden = !message; }
    box.classList.toggle('invalid', Boolean(message));
    box.querySelectorAll('input').forEach((input) => (message ? input.setAttribute('aria-invalid', 'true') : input.removeAttribute('aria-invalid')));
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
    button.disabled = true; button.setAttribute('aria-busy', 'true'); button.textContent = t('account.wait');
    try {
      const result = await request(values);
      if (result.ok) { await done(result.data, form, ok); return; }
      if (result.data?.fields && showErrors(form, result.data.fields)) return;
      formError.textContent = lang === 'he' ? result.data?.message || (result.status === 503 ? t('account.err.service_unavailable') : t('account.err.fallback')) : result.data?.error ? errorText(result.data.error, result.data.message, 'account') : t(result.status === 503 ? 'account.err.service_unavailable' : 'account.err.fallback');
      formError.hidden = false;
    } catch { formError.textContent = OFFLINE; formError.hidden = false; }
    finally { if (button.isConnected) { button.disabled = false; button.removeAttribute('aria-busy'); button.textContent = label; } }
  });
}
const requireEmail = (values) => { const email = normalizeEmail(values.email); return email ? {} : { email: t('account.v.emailRequired') }; };

// ——— #/account for guests: sign in / sign up / code / forgot / reset ———
function guestPanel(resetToken) {
  const { emailLogin, passwordReset } = account.config;
  if (resetToken) return `<section class="surface-panel account-auth" aria-labelledby="auth-title"><span class="eyebrow">${t('account.reset.eyebrow')}</span><h2 id="auth-title">${t('account.reset.title')}</h2>
    <form id="reset-form" class="lead-form" novalidate>${passwordField('reset', 'password', t('account.field.newPassword'), 'new-password', t('account.hint.min', { min: PASSWORD_MIN }))}${formEnd(t('account.reset.submit'))}</form></section>`;
  const forgot = passwordReset
    ? `<details class="account-more"><summary>${t('account.forgot.summary')}</summary><form id="forgot-form" class="lead-form" novalidate><p class="micro-copy">${t('account.forgot.intro')}</p>${field('forgot', 'email', t('account.field.email'), 'autocomplete="email" dir="ltr" maxlength="120" required', { type: 'email' })}${formEnd(t('account.forgot.submit'))}</form></details>`
    : `<details class="account-more"><summary>${t('account.forgot.summary')}</summary><p class="micro-copy">${t('account.forgot.none')}</p></details>`;
  const code = emailLogin
    ? `<details class="account-more"><summary>${t('account.code.summary')}</summary><form id="code-form" class="lead-form" novalidate><p class="micro-copy">${t('account.code.intro')}</p>${field('code', 'email', t('account.field.email'), 'autocomplete="email" dir="ltr" maxlength="120" required', { type: 'email' })}<div class="account-code-step" hidden>${field('code', 'code', t('account.field.code'), 'inputmode="numeric" autocomplete="one-time-code" dir="ltr" maxlength="6" pattern="[0-9]*"')}</div>${formEnd(t('account.code.submit'))}</form></details>`
    : '';
  return `<section class="surface-panel account-auth" aria-labelledby="auth-title">
   <div class="account-auth-intro"><span class="eyebrow">${t('account.guest.eyebrow')}</span><h2 id="auth-title">${t('account.guest.title')}</h2><p>${t('account.guest.intro')}</p></div>
   <div class="account-tabs" role="tablist" aria-label="${t('account.guest.tabsAria')}"><button type="button" role="tab" id="tab-login" aria-selected="true" aria-controls="pane-login">${t('account.guest.login')}</button><button type="button" role="tab" id="tab-signup" aria-selected="false" aria-controls="pane-signup" tabindex="-1">${t('account.guest.signup')}</button></div>
   <div role="tabpanel" id="pane-login" aria-labelledby="tab-login">
    <form id="login-form" class="lead-form" novalidate>${field('login', 'email', t('account.field.email'), 'autocomplete="username" dir="ltr" maxlength="120" required', { type: 'email' })}${passwordField('login', 'password', t('account.field.password'), 'current-password')}${formEnd(t('account.guest.login'))}</form>
    ${code}${forgot}
   </div>
   <div role="tabpanel" id="pane-signup" aria-labelledby="tab-signup" hidden>
    <form id="signup-form" class="lead-form" novalidate><p class="micro-copy">${t('account.guest.required')}</p>
     <div class="lead-grid">${field('signup', 'name', t('account.field.name'), 'autocomplete="name" maxlength="80" required')}${field('signup', 'email', t('account.field.email'), 'autocomplete="email" dir="ltr" maxlength="120" required', { type: 'email' })}</div>
     <div class="lead-grid">${passwordField('signup', 'password', t('account.field.password'), 'new-password', t('account.hint.signupPassword', { min: PASSWORD_MIN }))}${field('signup', 'phone', t('account.field.phone'), 'autocomplete="tel" inputmode="tel" dir="ltr" maxlength="20" placeholder="050-1234567"', { type: 'tel', optional: true, hint: t('account.hint.phone') })}</div>
     <div class="lead-consent">${checkbox('signup', 'privacy', t('account.guest.privacy'), { required: true, hint: t('account.guest.privacyHint') })}
      ${checkbox('signup', 'marketing', marketingText())}</div>
     ${formEnd(t('account.guest.signup'))}</form>
   </div></section>`;
}
function wireGuest(view, resetToken) {
  if (resetToken) {
    wireForm($('#reset-form', view), { validate: (v) => { const p = passwordProblem(v.password); return p ? { password: p } : {}; }, request: (v) => api('POST', '/password/reset', { token: resetToken, password: v.password }),
      done: (data) => { flash(data.message || t('account.flash.passwordReset')); history.replaceState(null, '', '#/account'); location.reload(); } });
    return;
  }
  const tabs = [...view.querySelectorAll('[role=tab]')];
  const select = (tab) => { tabs.forEach((t) => { const on = t === tab; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; $('#' + t.getAttribute('aria-controls'), view).hidden = !on; }); tab.focus(); };
  tabs.forEach((tab, i) => { tab.onclick = () => select(tab); tab.onkeydown = (e) => { const step = { [lang === 'en' ? 'ArrowRight' : 'ArrowLeft']: 1, [lang === 'en' ? 'ArrowLeft' : 'ArrowRight']: -1, Home: -i, End: tabs.length - 1 - i }[e.key]; if (step !== undefined) { e.preventDefault(); select(tabs[(i + step + tabs.length) % tabs.length]); } }; });
  wireForm($('#login-form', view), { validate: (v) => ({ ...requireEmail(v), ...(v.password ? {} : { password: t('account.v.password') }) }), request: (v) => api('POST', '/login', { email: v.email, password: v.password }), done: (data) => signedIn(data.user, t('account.flash.login', { name: data.user.name })) });
  wireForm($('#signup-form', view), { validate: (v) => validateSignup(v).errors, request: (v) => api('POST', '/signup', v), done: (data) => signedIn(data.user, t('account.flash.signup', { name: data.user.name })) });
  wireForm($('#forgot-form', view), { validate: requireEmail, request: (v) => api('POST', '/password/forgot', { email: v.email }), done: (data, form, ok) => { ok.textContent = data.message; } });
  const codeForm = $('#code-form', view);
  wireForm(codeForm, {
    validate: (v) => ({ ...requireEmail(v), ...(!$('.account-code-step', codeForm).hidden && !/^\d{6}$/.test(v.code.trim()) ? { code: t('account.v.code') } : {}) }),
    request: (v) => ($('.account-code-step', codeForm).hidden ? api('POST', '/code/request', { email: v.email }) : api('POST', '/code/verify', { email: v.email, code: v.code.trim() })),
    done: (data, form, ok) => {
      if (data.user) return signedIn(data.user, t('account.flash.codeLogin', { name: data.user.name }));
      ok.textContent = data.message; $('.account-code-step', form).hidden = false; $('[type=submit]', form).textContent = t('account.code.enter'); $('#code-code', form).focus();
    }
  });
  if (new URLSearchParams(location.hash.split('?')[1] || '').get('login') === 'signup') select(tabs[1]);
}

// ——— #/account for a signed-in customer ———
const TYPE = { contact: t('account.type.contact'), tailor: t('account.type.tailor'), package: t('account.type.package') };
const heDate = (value) => (Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric' }) : '');
const placeName = (code) => resolvePlace(code)?.label || code;
function userPanel() {
  const user = account.user;
  return `<section class="surface-panel account-card" aria-labelledby="acc-hello"><div class="account-card-head"><span class="account-avatar" aria-hidden="true">${esc(user.name.trim()[0] || '?')}</span><div><span class="eyebrow">${t('account.user.eyebrow')}</span><h2 id="acc-hello">${t('account.user.hello', { name: esc(user.name.split(/\s+/)[0]) })}</h2><p class="micro-copy" dir="ltr">${esc(user.email)}</p></div><p class="account-sync" id="account-sync" role="status">${esc(syncText())}</p></div>
   <nav class="account-nav" aria-label="${t('account.nav.aria')}">${[['acc-trips', t('account.nav.trips')], ['acc-leads', t('account.nav.leads')], ['acc-travellers', t('booking.saved.title')], ['acc-searches', t('account.nav.searches')], ['acc-profile', t('account.nav.profile')], ['acc-privacy', t('account.nav.privacy')]].map(([id, label]) => `<a href="#/account" data-account-jump="${id}">${label}</a>`).join('')}</nav></section>`;
}
function userSections() {
  const user = account.user;
  return `<section class="surface-panel account-section" id="acc-leads" aria-labelledby="acc-leads-title"><div class="panel-heading"><h2 id="acc-leads-title">${t('account.nav.leads')}</h2><a class="button secondary" href="#/contact">${t('account.leads.new')}</a></div><div data-account-leads aria-busy="true"><p class="micro-copy">${t('account.leads.loading')}</p></div></section>
  ${travellersSectionHtml()}
  <section class="surface-panel account-section" id="acc-searches" aria-labelledby="acc-searches-title"><div class="panel-heading"><h2 id="acc-searches-title">${t('account.nav.searches')}</h2><button type="button" class="text-button" data-clear-searches hidden>${t('account.searches.clear')}</button></div><div data-account-searches aria-busy="true"><p class="micro-copy">${t('account.searches.loading')}</p></div></section>
  <section class="surface-panel account-section" id="acc-profile" aria-labelledby="acc-profile-title"><h2 id="acc-profile-title">${t('account.nav.profile')}</h2>
   <form id="profile-form" class="lead-form" novalidate><div class="lead-grid">${field('profile', 'name', t('account.field.name'), `autocomplete="name" maxlength="80" required value="${esc(user.name)}"`)}${field('profile', 'phone', t('account.field.phone'), `autocomplete="tel" inputmode="tel" dir="ltr" maxlength="20" placeholder="050-1234567" value="${esc(user.phone)}"`, { type: 'tel', optional: true })}
    <div class="lead-field"><label for="profile-email">${t('account.field.email')}</label><input id="profile-email" type="email" dir="ltr" value="${esc(user.email)}" readonly aria-describedby="profile-email-hint"><p class="lead-hint" id="profile-email-hint">${t('account.profile.emailHint')}${user.emailVerified ? t('account.profile.verified') : ''}</p></div></div>
    <div class="lead-consent">${checkbox('profile', 'marketing', marketingText(), { checked: user.marketing })}</div>${formEnd(t('account.profile.submit'))}</form>
   <details class="account-more"><summary>${t('account.password.summary')}</summary><form id="password-form" class="lead-form" novalidate>${passwordField('password', 'current', t('account.field.current'), 'current-password')}${passwordField('password', 'password', t('account.field.newPassword'), 'new-password', t('account.hint.changePassword', { min: PASSWORD_MIN }))}${formEnd(t('account.password.submit'))}</form></details></section>
  <section class="surface-panel account-section" id="acc-privacy" aria-labelledby="acc-privacy-title"><h2 id="acc-privacy-title">${t('account.nav.privacy')}</h2>
   <p>${t('account.privacy.text')}</p>
   <div class="account-actions"><a class="button secondary" href="/api/account/export" download="gerbi-tours-my-data.json">${t('account.privacy.export')}</a><button type="button" class="button secondary" data-account-logout>${t('account.menu.logout')}</button><button type="button" class="button secondary" data-account-logout-clear>${t('account.privacy.logoutClear')}</button></div>
   <p class="micro-copy">${t('account.privacy.clearNote')}</p>
   <details class="account-more account-danger"><summary>${t('account.delete.summary')}</summary><form id="delete-form" class="lead-form" novalidate><p>${t('account.delete.text')}</p>${passwordField('delete', 'password', t('account.field.confirmPassword'), 'current-password')}<p class="lead-form-error" role="alert" hidden></p><p class="account-form-ok" role="status"></p><button type="submit" class="button account-delete">${t('account.delete.submit')}</button></form></details></section>`;
}
async function fillLeads(view) {
  const box = $('[data-account-leads]', view);
  try {
    const { ok, data } = await api('GET', '/leads');
    if (!box.isConnected) return;
    box.removeAttribute('aria-busy');
    if (!ok) { box.innerHTML = `<p class="micro-copy">${t('account.leads.failed')}</p>`; return; }
    box.innerHTML = data.leads.length
      ? `<ul class="account-list">${data.leads.map((lead) => `<li><div><strong>${esc(lead.generic && lang !== 'he' ? TYPE[lead.type] || lead.title : lead.title)}</strong><span class="micro-copy">${t('account.leads.item', { type: esc(TYPE[lead.type] || t('account.type.other')), date: esc(heDate(lead.createdAt)), ref: `<bdi dir="ltr">${esc(lead.ref)}</bdi>` })}</span></div><span class="account-badge" data-status="${esc(lead.status || 'new')}">${t(`account.leads.status.${['progress', 'closed'].includes(lead.status) ? lead.status : 'new'}`)}</span></li>`).join('')}</ul>${account.user.emailVerified ? '' : `<p class="micro-copy">${t('account.leads.unverified')}</p>`}`
      : `<p>${t('account.leads.none')}</p>`;
  } catch { if (box.isConnected) { box.removeAttribute('aria-busy'); box.innerHTML = `<p class="micro-copy">${OFFLINE}</p>`; } }
}
function searchesMarkup(list) {
  return list.length
    ? `<ul class="account-list">${list.map((s) => `<li><div><strong>${esc(placeName(s.origin))} ${t('account.searches.arrow')} ${esc(placeName(s.to))}</strong><span class="micro-copy">${esc(heDate(s.start + 'T12:00:00'))}${s.end ? ' – ' + esc(heDate(s.end + 'T12:00:00')) : t('account.searches.oneway')} · ${t('account.searches.travelers', { count: s.adults + s.children })}</span></div><a class="button secondary" href="${esc(searchLink({ origin: s.origin, destination: s.to, start: s.start, end: s.end, type: s.type, adults: s.adults, children: s.children }))}">${t('account.searches.again')}</a></li>`).join('')}</ul>`
    : `<p class="micro-copy">${t('account.searches.none')}</p>`;
}
async function fillSearches(view) {
  const box = $('[data-account-searches]', view), clear = $('[data-clear-searches]', view);
  const show = (list) => { box.removeAttribute('aria-busy'); box.innerHTML = searchesMarkup(list); clear.hidden = !list.length; };
  try { const { ok, data } = await api('GET', '/searches'); if (box.isConnected) ok ? show(data.searches) : (box.innerHTML = `<p class="micro-copy">${t('account.searches.failed')}</p>`); } catch { if (box.isConnected) box.innerHTML = `<p class="micro-copy">${OFFLINE}</p>`; }
  clear.onclick = async () => { const { ok, data } = await api('POST', '/searches', { clear: true }).catch(() => ({})); if (ok) { show(data.searches); box.setAttribute('tabindex', '-1'); box.focus(); } };
}
function wireUser(view) {
  // The page's own "saved on this device" wording becomes "saved in your account".
  const tripsHeading = [...view.querySelectorAll('.panel-heading h2')].find((h) => h.textContent.includes('הטיולים השמורים') || /saved trips/i.test(h.textContent));
  if (tripsHeading) tripsHeading.id = 'acc-trips';
  view.querySelectorAll('.saved-card .eyebrow').forEach((el) => { el.textContent = t('account.savedPlan'); });
  fillLeads(view); fillSearches(view); wireTravellers(view);
  wireForm($('#profile-form', view), { validate: (v) => validateProfile(v).errors, request: (v) => api('POST', '/profile', v),
    done: (data, form, ok) => { account.user = data.user; ok.textContent = t('account.ok.profile'); renderHeader(); } });
  wireForm($('#password-form', view), { validate: (v) => ({ ...(v.current ? {} : { current: t('account.v.current') }), ...(passwordProblem(v.password) ? { password: passwordProblem(v.password) } : {}) }), request: (v) => api('POST', '/password/change', v),
    done: (data, form, ok) => { form.reset(); ok.textContent = data.message; } });
  wireForm($('#delete-form', view), { validate: (v) => (v.password ? {} : { password: t('account.v.deletePassword') }), request: (v) => api('POST', '/delete', { password: v.password }),
    done: () => { store.remove(SYNC_KEY); account.user = null; flash(t('account.flash.deleted')); history.replaceState(null, '', '#/account'); location.reload(); } });
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
  if (notice) notice.innerHTML = account.user ? t('account.notice.synced') : t('account.notice.device');
  if (account.user) { $('.soft-notice', view)?.insertAdjacentHTML('beforebegin', userSections()); wireUser(view); jumpTo(); }
  else if (account.user === null) {
    wireGuest(view, /^[A-Za-z0-9_-]{20,100}$/.test(resetToken) ? resetToken : '');
    if (/[?&](login|reset)=/.test(location.hash)) { slot.scrollIntoView({ block: 'start' }); $('#login-email, #reset-password', slot)?.focus(); }
  } else slot.innerHTML = `<p class="micro-copy">${t('account.unavailable')}</p>`;
}

// ——— Natural moments: saving a flight, lead forms, flight searches ———
function wireMoments() {
  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-save-flight]')) setTimeout(() => {
      const status = $('#save-flight-status');
      if (!status || !/נשמרה|saved/i.test(status.textContent)) return;
      if (account.user) { status.innerHTML = t('account.moment.saved'); schedulePush(200); }
      else if (account.user === null) status.insertAdjacentHTML('beforeend', ` <a class="account-save-cta" href="#/account?login=signup">${t('account.moment.cta')}</a>`);
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
