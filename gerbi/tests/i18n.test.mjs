// Spec 21: the dictionaries are complete in both languages, every key the code uses exists, and English is English.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { DICTS, AREAS, LANGS, t, tIn, setLang, fmtMoney, fmtDate, langFromPath, shouldRedirectToEnglish, langHref, localizeHtml, errorText } from '../dist/i18n.mjs';

const HEBREW = /[֐-׿]/;
// English values that are Hebrew on purpose (the switch back to Hebrew is written in Hebrew).
const HEBREW_OK = new Set(['core.lang.he', 'core.lang.toHe']);
const placeholders = (v) => [...new Set(JSON.stringify(v).match(/\{\w+\}/g) || [])].sort();

test('every key exists in both dictionaries with the same placeholders', () => {
  for (const [name, area] of Object.entries(AREAS)) {
    for (const l of LANGS) assert.ok(area[l] && typeof area[l] === 'object', `${name}.${l}`);
    const he = Object.keys(area.he), en = Object.keys(area.en);
    assert.deepEqual(he.filter((k) => !(k in area.en)), [], `${name}: keys missing in English`);
    assert.deepEqual(en.filter((k) => !(k in area.he)), [], `${name}: keys missing in Hebrew`);
    for (const k of he) {
      assert.ok(k.startsWith(`${name}.`), `${k} must be prefixed "${name}."`);
      assert.deepEqual(placeholders(area.en[k]), placeholders(area.he[k]), `${k}: placeholders differ`);
      for (const l of LANGS) {
        const v = area[l][k];
        assert.ok(typeof v === 'string' || (v && typeof v === 'object' && typeof v.other === 'string'), `${l} ${k}: string or { one, other }`);
      }
    }
  }
});

test('no key is defined by two areas', () => {
  const seen = new Map();
  for (const [name, area] of Object.entries(AREAS)) for (const k of Object.keys(area.he)) { assert.ok(!seen.has(k), `${k} in ${seen.get(k)} and ${name}`); seen.set(k, name); }
});

test('English values contain no Hebrew', () => {
  const bad = Object.entries(DICTS.en).filter(([k, v]) => !HEBREW_OK.has(k) && HEBREW.test(JSON.stringify(v))).map(([k]) => k);
  assert.deepEqual(bad, []);
});

async function sources() {
  const files = [];
  for (const dir of ['dist', 'backend']) for (const f of await readdir(new URL(`../${dir}/`, import.meta.url))) if (/\.(mjs|js|html)$/.test(f) && f !== 'i18n.mjs') files.push(`${dir}/${f}`);
  return Promise.all(files.map(async (f) => [f, await readFile(new URL(`../${f}`, import.meta.url), 'utf8')]));
}

test('every literal key used in code and markup exists', async () => {
  const missing = [];
  for (const [file, text] of await sources()) {
    for (const m of text.matchAll(/\b(?:t|tr|T)\(\s*['"`]([a-z][\w-]*\.[\w.-]+)['"`]/g)) if (!(m[1] in DICTS.he)) missing.push(`${file}: ${m[1]}`);
    for (const m of text.matchAll(/data-i18n="([\w.-]+)"/g)) if (!(m[1] in DICTS.he)) missing.push(`${file}: ${m[1]}`);
    for (const m of text.matchAll(/data-i18n-attr="([^"]+)"/g)) for (const pair of m[1].split(';')) { const key = pair.split(':')[1]?.trim(); if (key && !(key in DICTS.he)) missing.push(`${file}: ${key}`); }
  }
  assert.deepEqual(missing, []);
});

test('t: lookup, fallback, variables and plurals', () => {
  setLang('en');
  assert.equal(t('core.brand'), 'Gerbi Tours');
  assert.equal(t('no.such.key'), 'no.such.key');
  setLang('he');
  assert.equal(t('core.brand'), 'ג׳רבי טורס');
  assert.equal(tIn('en')('core.brand'), 'Gerbi Tours');
  DICTS.en['test.plural'] = { one: '{count} traveler', other: '{count} travelers' };
  DICTS.he['test.plural'] = { one: 'נוסע אחד', two: 'שני נוסעים', other: '{count} נוסעים' };
  assert.equal(t('test.plural', { count: 1 }, 'en'), '1 traveler');
  assert.equal(t('test.plural', { count: 3 }, 'en'), '3 travelers');
  assert.equal(t('test.plural', { count: 2 }, 'he'), 'שני נוסעים');
  assert.equal(t('test.plural', { count: 7 }, 'he'), '7 נוסעים');
  delete DICTS.en['test.plural']; delete DICTS.he['test.plural'];
});

test('formatting follows the language', () => {
  assert.equal(fmtMoney(1234, 'ILS', {}, 'en'), '₪1,234');
  assert.match(fmtMoney(1234, 'ILS', {}, 'he'), /1,234/);
  assert.equal(fmtDate('2026-11-15', undefined, 'en'), '15 Nov 2026');
});

test('language comes from the path; the remembered choice only redirects the bare Hebrew homepage', () => {
  assert.equal(langFromPath('/en/'), 'en');
  assert.equal(langFromPath('/en'), 'en');
  assert.equal(langFromPath('/'), 'he');
  assert.equal(langFromPath('/english'), 'he');
  assert.equal(shouldRedirectToEnglish('/', '', 'en'), true);
  assert.equal(shouldRedirectToEnglish('/', '#/', 'en'), true);
  assert.equal(shouldRedirectToEnglish('/', '#/contact', 'en'), false);
  assert.equal(shouldRedirectToEnglish('/', '', 'he'), false);
  assert.equal(shouldRedirectToEnglish('/en/', '', 'en'), false);
  assert.equal(langHref('en', '#/contact'), '/en/#/contact');
  assert.equal(langHref('he', '#/blog/x'), '/#/blog/x');
  assert.equal(langHref('en', '#/'), '/en/');
});

test('server errors: Hebrew keeps the server message, English maps the code', () => {
  assert.equal(errorText('rate_limited', 'הודעה', '', 'he'), 'הודעה');
  assert.equal(errorText('rate_limited', 'הודעה', '', 'en'), t('core.err.rate_limited', {}, 'en'));
  assert.equal(errorText('weird_code', 'הודעה', '', 'en'), t('core.err.generic', {}, 'en'));
});

test('index.html: English rendering has lang/dir and no Hebrew outside the language switch', async () => {
  const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
  const en = localizeHtml(html, 'en');
  assert.match(en, /<html lang="en" dir="ltr">/);
  const visible = en.replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]*\blang="he"[^>]*>[^<]*<\/[a-z]+>/g, '');
  const hebrew = [...visible.matchAll(/[^<>"]*[֐-׿][^<>"]*/g)].map((m) => m[0].trim()).filter(Boolean);
  assert.deepEqual(hebrew, []);
  assert.equal(localizeHtml(html, 'he').replace(/<html[^>]*>/, ''), html.replace(/<html[^>]*>/, ''), 'Hebrew markup is unchanged');
});
