// The language switch in the header and the mobile menu (spec 21 §2): same inner route in the other language,
// and the choice is remembered for the next bare homepage visit.
import { lang, langHref, rememberLang, dir } from './i18n.mjs';

document.documentElement.lang = lang;
document.documentElement.dir = dir();
const target = lang === 'en' ? 'he' : 'en';
const sync = () => document.querySelectorAll('[data-lang-switch]').forEach((a) => a.setAttribute('href', langHref(target)));
sync();
window.addEventListener('hashchange', sync);
document.addEventListener('click', (event) => {
  const link = event.target.closest?.('[data-lang-switch]');
  if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.button > 0) return;
  event.preventDefault();
  rememberLang(target);
  location.assign(langHref(target));
});
