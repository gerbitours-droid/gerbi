// WCAG AA contrast for the colour tokens in dist/style.css (:root) and the high-contrast overrides in
// dist/a11y-widget.css. Text pairs need 4.5:1; focus rings and graphical state colours need 3:1 (SC 1.4.11).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const css = (f) => readFile(new URL(`../dist/${f}`, import.meta.url), 'utf8');
const tokens = (block) => Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\b/gi)].map(([, k, v]) => [k, v.toLowerCase()]));
const lum = (hex) => { const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

const root = tokens(/:root\{([^}]*)\}/.exec(await css('style.css'))[1]);
const high = { ...root, ...tokens(/html\.a11y-contrast\{([^}]*)\}/.exec(await css('a11y-widget.css'))[1]) };
const WHITE = '#ffffff', TAILOR = '#ffeccf', PAGE_BG = '#f7faff';

test('contrast helper matches known WCAG values', () => {
  assert.equal(ratio('#000000', WHITE).toFixed(1), '21.0');
  assert.equal(ratio('#767676', WHITE).toFixed(2), '4.54');
});

test('the refreshed palette tokens are all defined', () => {
  for (const k of ['navy', 'blue', 'blue-deep', 'yellow', 'yellow-soft', 'accent', 'accent-ink', 'pale', 'sky', 'sand', 'muted', 'border', 'focus']) assert.match(root[k] || '', /^#[0-9a-f]{6}$/, k);
});

const TEXT = [
  ['navy', [WHITE, 'pale', 'sky', 'sand', 'yellow', 'yellow-soft', PAGE_BG]],   // body text, text on yellow buttons
  ['blue', [WHITE, 'pale', 'sky', 'sand', PAGE_BG]],                          // links, prices, eyebrows
  ['blue-deep', [WHITE, 'pale']],
  ['muted', [WHITE, 'pale', 'sand', PAGE_BG]],                                // secondary text
  ['accent-ink', [WHITE, 'pale', 'sand', TAILOR, PAGE_BG]],                   // warm eyebrows / perk icons
];
const ON_FILLED = [['blue', WHITE], ['blue-deep', WHITE], ['navy', WHITE], ['navy', 'yellow']]; // [background, text]

for (const [name, palette] of [['default', root], ['high contrast', high]]) {
  const c = (v) => (v.startsWith('#') ? v : palette[v]);
  test(`${name}: text tokens reach 4.5:1 on every surface they sit on`, () => {
    for (const [fg, bgs] of TEXT) for (const bg of bgs) {
      const r = ratio(c(fg), c(bg));
      assert.ok(r >= 4.5, `${fg} ${c(fg)} on ${bg} ${c(bg)} = ${r.toFixed(2)}:1`);
    }
  });
  test(`${name}: text on filled buttons (white on blue, navy on yellow) reaches 4.5:1`, () => {
    for (const [bg, fg] of ON_FILLED) {
      const r = ratio(c(fg), c(bg));
      assert.ok(r >= 4.5, `${fg} on ${bg} = ${r.toFixed(2)}:1`);
    }
  });
  test(`${name}: focus ring and coral state colour reach 3:1 against white`, () => {
    for (const k of ['focus', 'accent']) assert.ok(ratio(c(k), WHITE) >= 3, `${k} ${c(k)} = ${ratio(c(k), WHITE).toFixed(2)}:1`);
  });
}

test('high contrast mode is at least as strong as the default for body and muted text', () => {
  for (const k of ['navy', 'blue', 'muted']) assert.ok(ratio(high[k], WHITE) >= ratio(root[k], WHITE), k);
});
