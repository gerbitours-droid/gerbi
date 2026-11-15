// Customer-service chat widget (spec 16 §4): a floating "שירות לקוחות" launcher and a modal <dialog> talking to
// POST /api/support/message. Separate from the ג׳רבי trip planner. The conversation is kept in sessionStorage only.
// Any element with [data-support-open] (e.g. on #/support) opens it.
import { t, lang, dir, errorText } from './i18n.mjs';
// One stored conversation per language (the Hebrew and English pages share sessionStorage).
const KEY = lang === 'en' ? 'gerbi-support-chat-en' : 'gerbi-support-chat';
const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = '/support-bot.css'; document.head.append(css);

const icon = (id) => `<svg aria-hidden="true"><use href="#i-${id}"/></svg>`;
const launcher = document.createElement('button');
launcher.type = 'button'; launcher.className = 'sb-launcher'; launcher.setAttribute('aria-haspopup', 'dialog'); launcher.setAttribute('aria-controls', 'sb-dialog');
launcher.innerHTML = `${icon('headphones')}<span class="sb-launcher-text">${t('support.ui.launcher')}</span>`;
launcher.setAttribute('aria-label', t('support.ui.launcherLabel'));

const dialog = document.createElement('dialog');
dialog.id = 'sb-dialog'; dialog.className = 'sb-dialog'; dialog.setAttribute('aria-labelledby', 'sb-title'); dialog.setAttribute('aria-describedby', 'sb-status');
dialog.innerHTML = `<header class="sb-head"><span class="sb-avatar">${icon('headphones')}</span><div><h2 id="sb-title">${t('support.ui.title')}</h2><p id="sb-status">${t('support.ui.status')}</p></div>
 <button type="button" class="sb-close" aria-label="${t('support.ui.close')}">${icon('close')}</button></header>
 <p class="sb-badge" id="sb-badge" hidden></p>
 <div class="sb-log" id="sb-log" role="log" aria-live="polite" aria-relevant="additions" aria-label="${t('support.ui.log')}"></div>
 <div class="sb-chips" id="sb-chips" role="group" aria-label="${t('support.ui.chips')}"></div>
 <form class="sb-form" id="sb-form"><label class="sr-only" for="sb-input" id="sb-input-label">${t('support.ui.message')}</label>
  <input id="sb-input" name="text" maxlength="600" autocomplete="off" enterkeyhint="send" placeholder="${t('support.ui.placeholder')}">
  <button type="submit" class="sb-send" aria-label="${t('support.ui.send')}">${icon('send')}</button></form>
 <p class="sb-note">${t('support.ui.note')} <a href="#/privacy">${t('support.ui.privacy')}</a></p>`;
document.body.append(launcher, dialog);

const $ = (s) => dialog.querySelector(s);
const log = $('#sb-log'), chipsBox = $('#sb-chips'), form = $('#sb-form'), input = $('#sb-input'), badge = $('#sb-badge');
let state = { sessionId: null, items: [], chips: [], input: 'text', escalation: null };
try { state = { ...state, ...JSON.parse(sessionStorage.getItem(KEY) || '{}') }; } catch {}
const save = () => { try { sessionStorage.setItem(KEY, JSON.stringify({ ...state, items: state.items.slice(-60) })); } catch {} };
// queued: Enter pressed while a reply was still loading; the text is sent as soon as that reply arrives.
let busy = false, lastPayload = null, queued = false;

function bubble(item, animate = true) {
  const el = document.createElement('div');
  el.className = `sb-msg sb-${item.from}${animate ? ' sb-new' : ''}`;
  const p = document.createElement('p'); p.textContent = item.text; el.append(p);
  if (item.link) {
    const a = document.createElement('a'); a.href = item.link.href; a.textContent = item.link.label; a.className = 'sb-link';
    if (/^https?:/.test(item.link.href)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; } else a.addEventListener('click', () => dialog.close());
    el.append(a);
  }
  // Spec 22: an answer composed by the AI from the owner's texts says so, and names the topics it came from.
  if (item.ai) { const src = document.createElement('small'); src.className = 'sb-source'; src.textContent = `${t('support.ui.aiSource')}${item.sources?.length ? `: ${item.sources.join(' · ')}` : ''}`; el.append(src); }
  if (item.from === 'user') el.setAttribute('aria-label', t('support.ui.you', { text: item.text }));
  log.append(el); log.scrollTop = log.scrollHeight;
  return el;
}
function renderChips() {
  chipsBox.replaceChildren(...state.chips.map((c) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'sb-chip'; b.textContent = c.label; b.onclick = () => ask({ chip: c.id }, c.label); return b; }));
  chipsBox.hidden = !state.chips.length;
}
function renderInput() {
  const mode = state.input;
  input.type = mode === 'tel' ? 'tel' : 'text'; input.inputMode = mode === 'tel' ? 'tel' : 'text';
  input.autocomplete = mode === 'name' ? 'name' : mode === 'tel' ? 'tel' : 'off'; input.dir = mode === 'tel' ? 'ltr' : dir();
  input.placeholder = mode === 'name' ? t('support.ui.yourName') : mode === 'tel' ? '050-1234567' : t('support.ui.placeholder');
  $('#sb-input-label').textContent = mode === 'name' ? t('support.ui.yourName') : mode === 'tel' ? t('support.ui.callbackPhone') : t('support.ui.message');
}
function renderBadge() {
  badge.hidden = !state.escalation;
  if (state.escalation) badge.textContent = t('support.ui.escalated', { ref: state.escalation.ref });
}
function setBusy(on) {
  busy = on; log.setAttribute('aria-busy', String(on)); form.querySelector('button').disabled = on; chipsBox.querySelectorAll('button').forEach((b) => (b.disabled = on));
  log.querySelector('.sb-typing')?.remove();
  if (on) { const t = document.createElement('div'); t.className = 'sb-msg sb-bot sb-typing'; t.setAttribute('aria-hidden', 'true'); t.innerHTML = '<span></span><span></span><span></span>'; log.append(t); log.scrollTop = log.scrollHeight; }
}

async function ask(payload, shown) {
  if (busy) return;
  if (shown) { const item = { from: 'user', text: shown }; state.items.push(item); bubble(item); }
  state.chips = []; renderChips();
  lastPayload = payload; setBusy(true);
  try {
    const response = await fetch('/api/support/message', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, lang, sessionId: state.sessionId || undefined }) });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) throw Object.assign(new Error('http'), { message: data.error && lang === 'en' ? errorText(data.error, data.message, 'support') : data.message });
    state.sessionId = data.sessionId; state.chips = data.chips || []; state.input = data.input || 'text'; state.escalation = data.escalation || state.escalation;
    if (data.hours) $('#sb-status').textContent = t('support.ui.statusLine', { availability: data.hours.open ? t('support.ui.agentsNow') : t('support.ui.agentsHours') });
    for (const m of data.messages || []) { const item = { from: 'bot', text: m.text, link: m.link, ...(m.ai ? { ai: true, sources: (m.sources || []).slice(0, 3).map(String) } : {}) }; state.items.push(item); bubble(item); }
  } catch (error) {
    setBusy(false);
    const el = bubble({ from: 'system', text: error.message && error.message !== 'http' && error.message !== 'Failed to fetch' ? error.message : t('support.ui.offline') });
    const retry = document.createElement('button'); retry.type = 'button'; retry.className = 'sb-retry'; retry.textContent = t('support.ui.retry');
    retry.onclick = () => { el.remove(); ask(lastPayload); }; el.append(retry);
  }
  renderChips(); renderInput(); renderBadge(); save(); log.scrollTop = log.scrollHeight;
  if (dialog.open && document.activeElement === document.body) input.focus();
  if (queued) { queued = false; form.requestSubmit(); }
}

// The send button is disabled while busy, which also blocks Enter (implicit submission); remember it instead.
input.addEventListener('keydown', (event) => { if (event.key === 'Enter' && busy && input.value.trim()) { event.preventDefault(); queued = true; } });
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  if (busy) { queued = true; return; }
  input.value = '';
  ask({ text }, text);
});

export function openSupport() {
  if (dialog.open) return;
  dialog.showModal(); launcher.setAttribute('aria-expanded', 'true');
  if (!log.children.length) state.items.forEach((item) => bubble(item, false));
  renderChips(); renderInput(); renderBadge();
  if (!state.items.length) ask({ chip: 'greeting' });
  input.focus();
}
launcher.addEventListener('click', openSupport);
$('.sb-close').addEventListener('click', () => dialog.close());
// Esc closes natively (cancel); a click on the backdrop closes too. Focus returns to whoever opened it.
let opener = null;
launcher.addEventListener('focus', () => (opener = launcher));
document.addEventListener('click', (event) => { const trigger = event.target.closest?.('[data-support-open]'); if (trigger) { event.preventDefault(); opener = trigger; openSupport(); } });
dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
dialog.addEventListener('close', () => { launcher.setAttribute('aria-expanded', 'false'); (opener && opener.isConnected ? opener : launcher).focus(); opener = null; });
launcher.addEventListener('click', () => (opener = launcher));
// Keep Tab inside the dialog even in browsers whose modal dialog lets focus reach the address bar.
dialog.addEventListener('keydown', (event) => {
  if (event.key !== 'Tab') return;
  const focusables = [...dialog.querySelectorAll('button:not([disabled]), input, a[href]')].filter((el) => el.offsetParent !== null);
  const first = focusables[0], last = focusables.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});
// The planner page has its own assistant (ג׳רבי) at the bottom; the launcher steps aside there.
const syncRoute = () => launcher.classList.toggle('sb-hidden', /^#\/planner/.test(location.hash));
window.addEventListener('hashchange', syncRoute); syncRoute();
