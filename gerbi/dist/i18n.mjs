// Languages (spec 21): Hebrew at "/", English at "/en/". The hash routes are the same in both, so every
// in-site link ("#/contact") stays in its language. Safe to import in Node (no DOM access at import time).
//   t('search.submit')                     → the string in the page language (falls back to Hebrew, then the key)
//   t('search.travelers', { count: 3 })    → plural forms { one, two, other } picked by Intl.PluralRules
//   t('x', { name }) replaces {name}. Values are NOT escaped: escape vars where the original code did.
import core from './locales/core.mjs';
import home from './locales/home.mjs';
import app from './locales/app.mjs';
import search from './locales/search.mjs';
import pages from './locales/pages.mjs';
import content from './locales/content.mjs';
import account from './locales/account.mjs';
import leads from './locales/leads.mjs';
import support from './locales/support.mjs';
import ai from './locales/ai.mjs';
import cms from './locales/cms.mjs';
import planner from './locales/planner.mjs';

export const LANGS = ['he', 'en'];
export const AREAS = { core, home, app, search, pages, content, account, leads, support, ai, cms, planner };
export const DICTS = { he: {}, en: {} };
for (const area of Object.values(AREAS)) for (const l of LANGS) Object.assign(DICTS[l], area[l]);

const LANG_KEY = 'gerbi-lang';
export const langFromPath = (pathname = '') => (/^\/en(\/|$)/.test(pathname) ? 'en' : 'he');
export let lang = typeof location !== 'undefined' ? langFromPath(location.pathname) : 'he';
export const setLang = (l) => { lang = LANGS.includes(l) ? l : 'he'; return lang; };
export const isEn = () => lang === 'en';
export const dir = (l = lang) => (l === 'en' ? 'ltr' : 'rtl');
export const locale = (l = lang) => (l === 'en' ? 'en-GB' : 'he-IL');
export const normLang = (value) => (value === 'en' ? 'en' : 'he');

const rules = {};
const pluralOf = (l, n) => (rules[l] ||= new Intl.PluralRules(locale(l))).select(n);

export function t(key, vars = {}, l = lang) {
  let value = DICTS[l]?.[key] ?? DICTS.he[key];
  if (value === undefined) return key;
  if (value && typeof value === 'object') {
    const n = Number(vars.count);
    value = value[pluralOf(l, n)] ?? value[n === 1 ? 'one' : 'other'] ?? value.other;
  }
  return String(value).replace(/\{(\w+)\}/g, (m, name) => (vars[name] === undefined ? m : String(vars[name])));
}
// t() for another language without changing the page language (server per-request, tests).
export const tIn = (l) => (key, vars) => t(key, vars, normLang(l));
// A key exists in the page language (or Hebrew).
export const has = (key) => DICTS[lang]?.[key] !== undefined || DICTS.he[key] !== undefined;
// A server error shown to the visitor. Hebrew keeps the server's own message (unchanged behaviour); English maps the
// error code: "<area>.err.<code>", then "core.err.<code>", then a generic line. Server messages are never shown in English.
export function errorText(code, serverMessage = '', area = '', l = lang) {
  if (l === 'he' && serverMessage) return serverMessage;
  for (const key of [area && `${area}.err.${code}`, `core.err.${code}`]) if (key && DICTS[l]?.[key] !== undefined) return t(key, {}, l);
  return l === 'he' ? serverMessage || t('core.err.generic', {}, l) : t('core.err.generic', {}, l);
}

// ---- Formatting ----
export const fmtNumber = (n, options = {}, l = lang) => new Intl.NumberFormat(locale(l), options).format(n);
export const fmtMoney = (n, currency = 'ILS', options = {}, l = lang) =>
  new Intl.NumberFormat(locale(l), { style: 'currency', currency, maximumFractionDigits: 0, ...options }).format(n);
const asDate = (d) => (d instanceof Date ? d : typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(`${d}T12:00:00`) : new Date(d));
export const fmtDate = (d, options = { day: 'numeric', month: 'short', year: 'numeric' }, l = lang) => asDate(d).toLocaleDateString(locale(l), options);
export const fmtTime = (d, options = { hour: '2-digit', minute: '2-digit', hour12: false }, l = lang) => asDate(d).toLocaleTimeString(locale(l), options);
export const fmtDateTime = (d, options = { dateStyle: 'short', timeStyle: 'short' }, l = lang) => asDate(d).toLocaleString(locale(l), { hour12: false, ...options });

// ---- URLs ----
// The site root of the page language: '/' or '/en/'. Use it for absolute links (share, WhatsApp, email).
export const homePath = (l = lang) => (l === 'en' ? '/en/' : '/');
export const homeUrl = (l = lang) => (typeof location !== 'undefined' ? location.origin : '') + homePath(l);
// The same inner route in the other language.
export const langHref = (target, hash = typeof location !== 'undefined' ? location.hash : '') => homePath(target) + (hash && hash !== '#' && hash !== '#/' ? hash : '');
export function rememberLang(l) { try { localStorage.setItem(LANG_KEY, normLang(l)); } catch { /* no storage */ } }
export function rememberedLang() { try { return localStorage.getItem(LANG_KEY); } catch { return null; } }
// Only a bare Hebrew homepage visit follows the remembered choice; any inner link opens in its own language.
export function shouldRedirectToEnglish(pathname, hash, remembered) {
  return remembered === 'en' && langFromPath(pathname) === 'he' && (pathname === '/' || pathname === '/index.html') && (!hash || hash === '#' || hash === '#/');
}

// ---- Static HTML (index.html) ----
const escAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escText = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// Elements marked data-i18n="key" hold plain text only; data-i18n-attr="aria-label:key;placeholder:key" sets attributes.
// Used by the server for /en/ and by the Vercel build, so English is in the first HTML (no Hebrew flash, indexable).
export function localizeHtml(html, l = 'en') {
  const tr = tIn(l);
  let out = html.replace(/<html lang="[^"]*" dir="[^"]*">/, `<html lang="${l}" dir="${dir(l)}">`);
  out = out.replace(/(<([a-z0-9]+)\b[^>]*\sdata-i18n="([\w.-]+)"[^>]*>)([^<]*)(<\/\2>)/g, (m, open, tag, key, text, close) => open + escText(tr(key)) + close);
  out = out.replace(/<([a-z0-9]+)\b[^>]*\sdata-i18n-attr="([^"]+)"[^>]*>/g, (tag) => {
    const spec = /\sdata-i18n-attr="([^"]+)"/.exec(tag)[1];
    let next = tag;
    for (const pair of spec.split(';')) {
      const [attr, key] = pair.split(':').map((s) => s.trim());
      if (!attr || !key) continue;
      const re = new RegExp(`(\\s${attr}=")[^"]*(")`);
      next = re.test(next) ? next.replace(re, (mm, a, b) => a + escAttr(tr(key)) + b) : next.replace(/\s*\/?>$/, (end) => ` ${attr}="${escAttr(tr(key))}"${end}`);
    }
    return next;
  });
  return out;
}
// Browser: apply the same markup rules to a subtree (used for markup added after load).
export function localizeDom(root = typeof document !== 'undefined' ? document : null) {
  if (!root || lang === 'he') return;
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    for (const pair of el.dataset.i18nAttr.split(';')) { const [attr, key] = pair.split(':').map((s) => s.trim()); if (attr && key) el.setAttribute(attr, t(key)); }
  });
}
