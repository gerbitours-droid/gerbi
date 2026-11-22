// Site-wide accessibility menu (IS 5568 style): a floating button that opens a dialog of display settings.
// State and the <html> classes live in a11y-boot.js (window.gerbiA11y, applied before paint); CSS in a11y-widget.css.
// No external library, nothing leaves the device.
import { t } from './i18n.mjs';

const PCT = [100, 115, 130, 145];
export const TOGGLES = [
  ['contrast', '<circle cx="12" cy="12" r="9"/><path d="M12 3v18" /><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>'],
  ['dark', '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>'],
  ['gray', '<circle cx="12" cy="12" r="9"/><path d="M12 3v18M4.5 8h7.5M3.5 13h8.5M5 17.5h7"/>'],
  ['links', '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2"/>'],
  ['headings', '<path d="M5 4v16M15 4v16M5 12h10M19 9v11"/>'],
  ['font', '<path d="M4 20 10 4h1l6 16M6.5 14h8.5"/><path d="M18 20h3"/>'],
  ['still', '<circle cx="12" cy="12" r="9"/><path d="M9.5 8.5v7M14.5 8.5v7"/>'],
  ['cursor', '<path d="M5 3l14 7-6 2-2 6z"/><path d="M13 12l6 6"/>'],
  ['spacing', '<path d="M4 6h16M4 12h16M4 18h16"/><path d="M2 3v18M22 3v18" stroke-dasharray="2 2"/>'],
  ['focus', '<rect x="4" y="7" width="16" height="10" rx="2"/><path d="M2 4h4M18 4h4M2 20h4M18 20h4M2 4v4M22 4v4M2 20v-4M22 20v-4"/>'],
];
const ICON = '<svg class="a11y-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="4" r="2.1" fill="currentColor" stroke="none"/><path d="M4.5 8.3c2.4.7 4.9 1.1 7.5 1.1s5.1-.4 7.5-1.1M12 9.6v4.7M12 14.3l-3.3 6.4M12 14.3l3.3 6.4"/></svg>';
const svg = (paths) => `<svg viewBox="0 0 24 24" aria-hidden="true">${paths}</svg>`;

export function widgetHtml(prefs = {}) {
  const text = prefs.text || 0;
  return `<button type="button" class="a11y-fab" aria-haspopup="dialog" aria-expanded="false" aria-controls="a11y-panel" aria-label="${t('a11y.open')}" title="${t('a11y.open')}">${ICON}</button>
<div id="a11y-panel" class="a11y-panel" role="dialog" aria-modal="true" aria-labelledby="a11y-title" hidden>
 <div class="a11y-head">${ICON}<h2 id="a11y-title">${t('a11y.title')}</h2><button type="button" class="a11y-close" aria-label="${t('a11y.close')}"><svg aria-hidden="true"><use href="#i-close"/></svg></button></div>
 <div class="a11y-body">
  <p class="a11y-intro">${t('a11y.intro')}</p>
  <div class="a11y-text" role="group" aria-labelledby="a11y-text-label"><span id="a11y-text-label">${t('a11y.text')}</span>
   <button type="button" data-a11y-text="-1" aria-label="${t('a11y.textDown')}" aria-disabled="${text <= 0}" dir="ltr">A−</button>
   <output id="a11y-text-level" aria-live="polite">${t('a11y.textLevel', { pct: PCT[text] })}</output>
   <button type="button" data-a11y-text="1" aria-label="${t('a11y.textUp')}" aria-disabled="${text >= PCT.length - 1}" dir="ltr">A+</button></div>
  <div class="a11y-grid">${TOGGLES.map(([key, paths]) => `<button type="button" class="a11y-toggle" data-a11y="${key}" aria-pressed="${Boolean(prefs[key])}">${svg(paths)}<span>${t('a11y.' + key)}</span></button>`).join('')}</div>
  <div class="a11y-foot"><button type="button" class="a11y-reset" data-a11y-reset>${t('a11y.reset')}</button><a href="#/accessibility" class="a11y-statement">${t('a11y.statement')}</a></div>
 </div>
</div>`;
}

function mount() {
  const store = window.gerbiA11y;
  if (!store || document.querySelector('.a11y-widget')) return;
  const box = document.createElement('div');
  box.className = 'a11y-widget';
  box.innerHTML = widgetHtml(store.read());
  // Second Tab stop of every page (right after "skip to content"); it is position:fixed, so DOM order is only for focus.
  const skip = document.querySelector('.skip-link');
  if (skip) skip.after(box); else document.body.prepend(box);
  const fab = box.querySelector('.a11y-fab'), panel = box.querySelector('.a11y-panel');
  const focusables = () => [...panel.querySelectorAll('button, a[href]')].filter((el) => !el.hidden);

  const sync = (p = store.read()) => {
    const text = p.text || 0;
    panel.querySelectorAll('[data-a11y]').forEach((b) => b.setAttribute('aria-pressed', String(Boolean(p[b.dataset.a11y]))));
    panel.querySelector('[data-a11y-text="-1"]').setAttribute('aria-disabled', String(text <= 0));
    panel.querySelector('[data-a11y-text="1"]').setAttribute('aria-disabled', String(text >= store.MAX_TEXT));
    panel.querySelector('#a11y-text-level').textContent = t('a11y.textLevel', { pct: PCT[text] });
  };
  const open = () => {
    if (!panel.hidden) return;
    sync(); panel.hidden = false; fab.setAttribute('aria-expanded', 'true');
    focusables()[0]?.focus();
  };
  const close = (refocus = true) => {
    if (panel.hidden) return;
    panel.hidden = true; fab.setAttribute('aria-expanded', 'false');
    if (refocus) fab.focus();
  };

  fab.addEventListener('click', () => (panel.hidden ? open() : close()));
  panel.addEventListener('click', (e) => {
    const toggle = e.target.closest('[data-a11y]'), step = e.target.closest('[data-a11y-text]');
    const p = store.read();
    if (toggle) {
      const key = toggle.dataset.a11y, on = !p[key];
      const next = { ...p, [key]: on };
      if (on && key === 'contrast') next.dark = false;
      if (on && key === 'dark') next.contrast = false;
      sync(store.save(next));
    } else if (step) {
      if (step.getAttribute('aria-disabled') === 'true') return;
      sync(store.save({ ...p, text: Math.max(0, Math.min(store.MAX_TEXT, (p.text || 0) + Number(step.dataset.a11yText))) }));
    } else if (e.target.closest('[data-a11y-reset]')) {
      sync(store.save({}));
    } else if (e.target.closest('.a11y-close')) close();
    else if (e.target.closest('.a11y-statement')) close(false);
  });
  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
    if (e.key !== 'Tab') return;
    const items = focusables(), first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  // A click outside closes it without stealing focus from what was clicked.
  document.addEventListener('pointerdown', (e) => { if (!panel.hidden && !box.contains(e.target)) close(false); }, true);
  document.addEventListener('gerbi-a11y-change', (e) => sync(e.detail));
  document.addEventListener('gerbi-a11y-open', open);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
}
