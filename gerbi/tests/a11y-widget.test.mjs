// Accessibility menu: the settings store (dist/a11y-boot.js, run in a fake browser) and the menu markup.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { setLang } from '../dist/i18n.mjs';
import { widgetHtml, TOGGLES } from '../dist/a11y-widget.mjs';

const file = (f) => readFile(new URL(`../dist/${f}`, import.meta.url), 'utf8');
const BOOT = await file('a11y-boot.js');

function browser(storage = {}, { throwing = false } = {}) {
  const classes = new Set(), events = [];
  const localStorage = {
    getItem: (k) => { if (throwing) throw new Error('blocked'); return k in storage ? storage[k] : null; },
    setItem: (k, v) => { if (throwing) throw new Error('blocked'); storage[k] = String(v); },
    removeItem: (k) => { if (throwing) throw new Error('blocked'); delete storage[k]; },
  };
  const documentElement = { classList: { toggle: (c, on) => (on ? classes.add(c) : classes.delete(c)), contains: (c) => classes.has(c) } };
  const window = { matchMedia: (q) => ({ matches: false, media: q, addEventListener() {} }) };
  const ctx = { window, localStorage, document: { documentElement, dispatchEvent: (e) => events.push(e) }, CustomEvent: class { constructor(type, o) { this.type = type; this.detail = o?.detail; } } };
  vm.runInNewContext(BOOT, ctx);
  return { api: window.gerbiA11y, window, classes, storage, events };
}

test('a fresh visitor gets no classes; saved settings are applied on load (before paint)', () => {
  assert.equal(browser().classes.size, 0);
  const b = browser({ 'gerbi-a11y-v1': JSON.stringify({ text: 2, contrast: true, cursor: true }) });
  assert.deepEqual([...b.classes].sort(), ['a11y-contrast', 'a11y-cursor', 'a11y-text-xl']);
});

test('settings are cleaned: unknown keys dropped, text clamped to 3 steps, high and dark contrast exclusive', () => {
  const { api } = browser(); const plain = (o) => JSON.parse(JSON.stringify(o));
  assert.deepEqual(plain(api.clean({ text: 9, evil: '<x>', links: 'yes', gray: true })), { text: 3, gray: true });
  assert.deepEqual(plain(api.clean({ text: -2 })), {});
  assert.deepEqual(plain(api.clean({ contrast: true, dark: true })), { dark: true });
});

test('save persists, toggles classes, announces the change; an empty save removes the key', () => {
  const b = browser();
  b.api.save({ text: 1, links: true, headings: true, font: true, spacing: true, focus: true, still: true });
  assert.deepEqual(JSON.parse(b.storage['gerbi-a11y-v1']), { text: 1, links: true, headings: true, font: true, still: true, spacing: true, focus: true });
  assert.ok(b.classes.has('a11y-text-lg') && b.classes.has('a11y-focus'));
  assert.equal(b.events.at(-1).type, 'gerbi-a11y-change');
  b.api.save({});
  assert.equal(b.classes.size, 0);
  assert.ok(!('gerbi-a11y-v1' in b.storage));
});

test('the earlier statement-page settings are migrated', () => {
  const b = browser({ 'gerbi-display-prefs-v1': JSON.stringify({ text: true, contrast: true, motion: true }) });
  assert.deepEqual([...b.classes].sort(), ['a11y-contrast', 'a11y-still', 'a11y-text-lg']);
  b.api.save(b.api.read());
  assert.ok(!('gerbi-display-prefs-v1' in b.storage));
});

test('blocked storage never throws: the page still renders and settings apply for this visit', () => {
  const b = browser({}, { throwing: true });
  assert.deepEqual(JSON.parse(JSON.stringify(b.api.read())), {});
  assert.doesNotThrow(() => b.api.save({ gray: true }));
  assert.ok(b.classes.has('a11y-gray'));
});

test('"stop animations" makes the site scripts see prefers-reduced-motion: reduce', () => {
  const b = browser();
  assert.equal(b.window.matchMedia('(prefers-reduced-motion: reduce)').matches, false);
  b.api.save({ still: true });
  assert.equal(b.window.matchMedia('(prefers-reduced-motion: reduce)').matches, true);
  assert.equal(b.window.matchMedia('(prefers-reduced-motion: no-preference)').matches, false);
  assert.equal(b.window.matchMedia('(max-width: 760px)').matches, false);
});

test('menu markup: labelled button, modal dialog, text size, every toggle with aria-pressed, reset and statement link', () => {
  setLang('he');
  const html = widgetHtml({ text: 1, gray: true });
  assert.match(html, /class="a11y-fab"[^>]*aria-haspopup="dialog"[^>]*aria-expanded="false"[^>]*aria-label="תפריט נגישות"/);
  assert.match(html, /role="dialog" aria-modal="true" aria-labelledby="a11y-title" hidden/);
  assert.equal((html.match(/class="a11y-toggle"/g) || []).length, TOGGLES.length);
  assert.equal(TOGGLES.length, 10);
  assert.match(html, /data-a11y="gray" aria-pressed="true"/);
  assert.match(html, /data-a11y="contrast" aria-pressed="false"/);
  assert.match(html, /גודל 115%/);
  assert.match(html, /data-a11y-reset/);
  assert.match(html, /href="#\/accessibility"/);
  setLang('en');
  const en = widgetHtml();
  assert.match(en, /aria-label="Accessibility menu"/);
  assert.match(en, /Highlight headings/);
  assert.match(en, /data-a11y-text="-1"[^>]*aria-disabled="true"/);
  setLang('he');
});

test('index.html loads the store before the stylesheets, plus the menu css and module', async () => {
  const html = await file('index.html');
  const boot = html.indexOf('<script src="/a11y-boot.js"></script>');
  assert.ok(boot > 0 && boot < html.indexOf('<link rel="stylesheet"'), 'boot script runs before any stylesheet');
  assert.ok(html.includes('<link rel="stylesheet" href="/a11y-widget.css">'));
  assert.ok(html.includes('<script type="module" src="/a11y-widget.mjs"></script>'));
  assert.ok(!/<script>[^<]/.test(html), 'no inline script (CSP script-src self)');
});

test('the accessibility statement describes the menu in both languages', async () => {
  assert.match(await file('legal.mjs'), /תפריט נגישות בכל דף/);
  assert.match(await file('locales/legal-en.mjs'), /An accessibility menu on every page/);
});
