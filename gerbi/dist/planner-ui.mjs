import { t } from './i18n.mjs';

const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
})[ch]);
const icon = name => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;

export function plannerHeaderHtml(title, actions) {
  return `<header class="planner-toolbar">
   <div class="planner-brand"><img src="/assets/mascot.webp" alt="" width="48" height="48"><h1 tabindex="-1">${esc(title)}</h1></div>
   <div class="planner-actions">${actions}</div>
  </header>`;
}

export function plannerLinksHtml() {
  return `<nav class="planner-links" aria-label="${esc(t('pages.planner.shortcuts'))}">
   <a href="#/destinations">${icon('compass')}<span>${t('pages.footer.3')}</span></a>
   <a href="#/favorites">${icon('heart')}<span>${t('pages.footer.9')}</span></a>
  </nav>`;
}

export function plannerWelcomeHtml(description) {
  return `<div class="planner-welcome">
   <div class="planner-welcome-mark"><img src="/assets/mascot.webp" alt="" width="60" height="60"></div>
   <h2>${t('pages.planner.2')}</h2>
   <p>${esc(description)}</p>
  </div>`;
}

export function plannerStartersHtml(starters, { builder = false } = {}) {
  const attribute = builder ? 'data-example' : 'data-quick';
  return `<div class="planner-starters" role="group" aria-label="${esc(t('pages.planner.suggestions'))}">${starters.map(([symbol, title, detail, value]) => `<button type="button" ${attribute}="${esc(value)}">${icon(symbol)}<span><strong>${esc(title)}</strong><small>${esc(detail)}</small></span></button>`).join('')}</div>`;
}

export function mountFloatingComposer(dock) {
  const nav = document.querySelector('.mobile-bottom');
  const viewport = window.visualViewport;
  const styles = document.body.style;
  const update = () => {
    const keyboard = viewport?.scale === 1 && dock.contains(document.activeElement)
      ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop) : 0;
    styles.setProperty('--composer-keyboard', `${keyboard}px`);
    styles.setProperty('--composer-height', `${dock.offsetHeight}px`);
    styles.setProperty('--composer-nav-height', `${nav?.offsetHeight || 0}px`);
  };
  const observer = new ResizeObserver(update);
  observer.observe(dock);
  if (nav) observer.observe(nav);
  update();
  viewport?.addEventListener('resize', update);
  viewport?.addEventListener('scroll', update);
  return () => {
    observer.disconnect();
    viewport?.removeEventListener('resize', update);
    viewport?.removeEventListener('scroll', update);
    for (const name of ['--composer-keyboard', '--composer-height', '--composer-nav-height']) styles.removeProperty(name);
  };
}
