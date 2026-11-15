// Search form widgets: place autocomplete (Hebrew/English/IATA, keyboard), a range date picker and a passengers popover.
// Plain DOM, no framework; app.js wires them to its state.
import { searchPlaces, resolvePlace, placeText, placeByCode, POPULAR_DESTINATIONS, POPULAR_ORIGINS } from './places.mjs';
import { addMonths, monthGrid, pickDate, dayState, parseIso, nightsBetween, selectable, maxDate } from './date-range.mjs';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = name => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;

// Hebrew counts read naturally in the singular: "נוסע אחד", not "1 נוסעים".
export const countText = (n, one, many) => (n === 1 ? one : `${n} ${many}`);
export const travelersText = (adults, children = 0) => {
  const total = adults + children;
  return `${countText(total, 'נוסע אחד', 'נוסעים')}${children ? ` · מתוכם ${countText(children, 'ילד אחד', 'ילדים')}` : ''}`;
};

// ---- Place autocomplete (WAI-ARIA combobox with a listbox popup).
export function placeCombobox(input, { kind = 'destination', exclude = () => '', onCommit = () => {} } = {}) {
  const id = `${input.id || 'place'}-list`, list = document.createElement('ul');
  list.id = id; list.className = 'place-list'; list.setAttribute('role', 'listbox'); list.hidden = true;
  list.setAttribute('aria-label', kind === 'origin' ? 'שדות מוצא' : 'יעדים');
  input.removeAttribute('list');
  Object.assign(input, { autocomplete: 'off', spellcheck: false });
  input.setAttribute('role', 'combobox'); input.setAttribute('aria-autocomplete', 'list'); input.setAttribute('aria-expanded', 'false'); input.setAttribute('aria-controls', id);
  (input.closest('.field') || input.parentElement).after(list);
  let items = [], active = -1;

  const optionHTML = (place, i) => {
    const child = Boolean(place.city), raw = !place.names;
    const sub = raw ? 'קוד שדה תעופה' : [place.sub, place.en].filter(Boolean).join(' · ');
    return `<li role="option" id="${id}-${i}" data-index="${i}" class="place-option${child ? ' is-airport' : ''}" aria-selected="${i === active}">`
      + `${icon(place.type === 'c' ? 'globe' : child ? 'plane' : 'pin')}<span class="place-text"><strong>${esc(place.name || place.label)}</strong><small>${esc(sub)}</small></span>`
      + `<b class="place-code" dir="ltr">${esc(place.code)}</b></li>`;
  };
  function render() {
    const query = input.value.trim(), known = resolvePlace(query);
    // A chosen value ("לונדון · LON") reopens on the popular list rather than on itself.
    const typed = query && !(known && placeText(known) === query);
    items = typed ? searchPlaces(query, { exclude: exclude() }) : (kind === 'origin' ? POPULAR_ORIGINS : POPULAR_DESTINATIONS).map(placeByCode).filter(p => p && p.code !== exclude());
    if (typed && /^[a-z]{3}$/i.test(query) && !items.some(p => p.code === query.toUpperCase())) items.push({ code: query.toUpperCase(), name: query.toUpperCase(), label: query.toUpperCase() });
    active = Math.min(active, items.length - 1);
    const heading = typed ? '' : `<li role="presentation" class="place-heading">${kind === 'origin' ? 'שדות תעופה בישראל' : 'יעדים פופולריים'}</li>`;
    list.innerHTML = items.length ? heading + items.map(optionHTML).join('') : `<li role="presentation" class="place-empty">לא מצאנו „${esc(query)}”. נסו שם בעברית או באנגלית, או קוד בן 3 אותיות (למשל LHR).</li>`;
    open();
    sync();
  }
  function sync() {
    list.querySelectorAll('[role=option]').forEach(li => li.setAttribute('aria-selected', String(Number(li.dataset.index) === active)));
    const current = active >= 0 ? list.querySelector(`#${CSS.escape(`${id}-${active}`)}`) : null;
    if (current) { input.setAttribute('aria-activedescendant', current.id); current.scrollIntoView({ block: 'nearest' }); } else input.removeAttribute('aria-activedescendant');
  }
  function open() {
    const field = input.closest('.field'), host = list.parentElement;
    if (field && host) { const f = field.getBoundingClientRect(), h = host.getBoundingClientRect(); list.style.top = `${f.bottom - h.top + 6}px`; list.style.right = `${h.right - f.right}px`; }
    list.hidden = false; input.setAttribute('aria-expanded', 'true'); }
  function close() { list.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); active = -1; }
  function commit(place) {
    if (!place) return;
    input.value = placeText(place); close();
    input.dispatchEvent(new Event('input', { bubbles: true }));
    onCommit(place);
  }
  input.addEventListener('focus', () => { input.select(); render(); });
  input.addEventListener('click', () => { if (list.hidden) render(); });
  input.addEventListener('input', e => { if (e.isTrusted) { active = -1; render(); } });
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); if (list.hidden) { render(); }
      if (!items.length) return;
      active = e.key === 'ArrowDown' ? (active + 1) % items.length : (active <= 0 ? items.length - 1 : active - 1); sync();
    } else if (e.key === 'Enter' && !list.hidden && items.length && (active >= 0 || input.value.trim())) {
      e.preventDefault(); commit(items[Math.max(active, 0)]);
    } else if (e.key === 'Escape' && !list.hidden) { e.preventDefault(); close(); }
    else if (e.key === 'Tab' && !list.hidden && active >= 0) commit(items[active]);
  });
  input.addEventListener('blur', () => setTimeout(() => {
    if (document.activeElement === input) return;
    close();
    // Tidy a typed name into the field's canonical form ("london" → "לונדון · LON").
    const place = resolvePlace(input.value);
    if (place?.names && input.value.trim() !== placeText(place)) { input.value = placeText(place); input.dispatchEvent(new Event('input', { bubbles: true })); }
  }, 120));
  list.addEventListener('mousedown', e => e.preventDefault()); // keep focus in the input
  list.addEventListener('click', e => { const li = e.target.closest('[role=option]'); if (li) commit(items[Number(li.dataset.index)]); });
  return { close, render };
}

// ---- Range date picker in a modal dialog: two months side by side on wide screens, one on phones.
const DOW = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
const monthTitle = (y, m) => new Date(Date.UTC(y, m, 15)).toLocaleDateString('he-IL', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const dayLabel = iso => new Date(iso + 'T12:00:00Z').toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const shortLabel = iso => (iso ? new Date(iso + 'T12:00:00Z').toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }) : '');

export function openRangePicker({ start = '', end = '', oneWay = false, today, returnFocus = null, validate = () => true, onTripType = () => {}, onApply = () => {} }) {
  let dialog = document.querySelector('#date-picker');
  if (!dialog) {
    dialog = document.createElement('dialog'); dialog.id = 'date-picker'; dialog.className = 'date-picker'; dialog.setAttribute('aria-labelledby', 'date-picker-title');
    document.body.append(dialog);
    dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  }
  const sel = { start, end: oneWay ? '' : end, hover: '' };
  const first = parseIso(sel.start || today);
  let view = { y: first.y, m: first.m }, focusIso = sel.start || today;
  const months = () => (window.matchMedia('(min-width: 760px)').matches ? 2 : 1);
  const minView = parseIso(today), maxView = parseIso(maxDate(today));
  const atMin = () => view.y * 12 + view.m <= minView.y * 12 + minView.m;
  const atMax = () => { const last = addMonths(view.y, view.m, months() - 1); return last.y * 12 + last.m >= maxView.y * 12 + maxView.m; };

  function hint() {
    if (oneWay) return sel.start ? `יציאה ב${shortLabel(sel.start)}` : 'בחרו תאריך יציאה';
    if (!sel.start) return 'בחרו תאריך יציאה';
    if (!sel.end) return 'עכשיו בחרו תאריך חזרה';
    const n = nightsBetween(sel.start, sel.end);
    return `${shortLabel(sel.start)} – ${shortLabel(sel.end)} · ${n === 0 ? 'חזרה באותו יום' : countText(n, 'לילה אחד', 'לילות')}`;
  }
  const monthHTML = (y, m) => `<div class="dp-month"><h3>${esc(monthTitle(y, m))}</h3><div class="dp-grid" role="grid" aria-label="${esc(monthTitle(y, m))}">`
    + `<div role="row" class="dp-row dp-dow">${DOW.map(d => `<span role="columnheader">${d}</span>`).join('')}</div>`
    + monthGrid(y, m).map(week => `<div role="row" class="dp-row">${week.map(iso => iso ? `<span role="gridcell"><button type="button" class="dp-day" data-date="${iso}" tabindex="-1" aria-label="${esc(dayLabel(iso))}">${Number(iso.slice(8))}</button></span>` : '<span role="gridcell" class="dp-blank"></span>').join('')}</div>`).join('')
    + '</div></div>';

  function paint() {
    for (const button of dialog.querySelectorAll('.dp-day')) {
      const s = dayState(button.dataset.date, sel, today);
      button.disabled = s.disabled;
      button.classList.toggle('is-start', s.start); button.classList.toggle('is-end', s.end || (oneWay && s.start));
      button.classList.toggle('in-range', s.inRange || s.preview); button.classList.toggle('is-today', s.today);
      button.setAttribute('aria-pressed', String(s.start || s.end));
      button.tabIndex = button.dataset.date === focusIso ? 0 : -1;
    }
    if (![...dialog.querySelectorAll('.dp-day')].some(b => b.tabIndex === 0)) { const firstOk = dialog.querySelector('.dp-day:not(:disabled)'); if (firstOk) firstOk.tabIndex = 0; }
    dialog.querySelector('.dp-hint').textContent = hint();
    dialog.querySelector('#start-date').value = sel.start; const endInput = dialog.querySelector('#end-date'); if (endInput) { endInput.value = sel.end; endInput.min = sel.start || today; }
    dialog.classList.toggle('has-range', !oneWay && Boolean(sel.start && (sel.end || (sel.hover && sel.hover > sel.start))));
    const done = oneWay ? Boolean(sel.start) : Boolean(sel.start && sel.end);
    dialog.querySelector('.dp-apply').classList.toggle('is-ready', done);
  }
  function render(keepFocus = false) {
    const shown = Array.from({ length: months() }, (_, i) => addMonths(view.y, view.m, i));
    dialog.innerHTML = `<button type="button" class="modal-close" aria-label="סגירה">${icon('close')}</button>`
      + `<div class="dp-head"><h2 id="date-picker-title">מתי טסים?</h2><div class="dp-mode" role="radiogroup" aria-label="סוג נסיעה">`
      + `<button type="button" role="radio" data-mode="round" aria-checked="${!oneWay}">הלוך־חזור</button><button type="button" role="radio" data-mode="oneway" aria-checked="${oneWay}">כיוון אחד</button></div>`
      + `<button type="button" class="dp-clear text-button">ניקוי</button></div>`
      + `<p class="dp-hint" aria-live="polite"></p>`
      + `<div class="dp-body"><button type="button" class="dp-nav dp-prev" aria-label="החודש הקודם" ${atMin() ? 'disabled' : ''}>›</button>`
      + `<div class="dp-months">${shown.map(({ y, m }) => monthHTML(y, m)).join('')}</div>`
      + `<button type="button" class="dp-nav dp-next" aria-label="החודש הבא" ${atMax() ? 'disabled' : ''}>‹</button></div>`
      + `<form id="date-form" novalidate><div class="dp-fields"><label class="modal-field">יציאה<input id="start-date" type="date" min="${today}" max="${maxDate(today)}"></label>`
      + (oneWay ? '' : `<label class="modal-field">חזרה<input id="end-date" type="date" max="${maxDate(today)}"></label>`)
      + `</div><p id="date-error" class="inline-error" hidden></p><button class="yellow dialog-primary dp-apply">אישור תאריכים</button></form>`;
    paint();
    if (keepFocus) dialog.querySelector(`.dp-day[data-date="${focusIso}"]`)?.focus();
  }
  // Moving focus to a day outside the visible months turns the page.
  function moveFocus(iso) {
    if (!selectable(iso, today)) return;
    focusIso = iso;
    const { y, m } = parseIso(iso), index = y * 12 + m, from = view.y * 12 + view.m;
    if (index < from || index >= from + months()) { view = index < from ? { y, m } : addMonths(y, m, 1 - months()); render(true); }
    else { paint(); dialog.querySelector(`.dp-day[data-date="${iso}"]`)?.focus(); }
  }
  function apply() {
    const s = sel.start, e = oneWay ? '' : sel.end, error = dialog.querySelector('#date-error');
    if (!validate(s, e, oneWay)) { error.textContent = oneWay ? 'בחרו תאריך יציאה (לא בעבר).' : !s ? 'בחרו תאריך יציאה.' : !e ? 'בחרו גם תאריך חזרה.' : 'תאריך החזרה לא יכול להיות לפני היציאה.'; error.hidden = false; return; }
    dialog.close(); onApply({ start: s, end: e, oneWay });
  }

  dialog.onclick = e => {
    if (e.target === dialog) return;
    if (e.target.closest('.modal-close')) { dialog.close(); return; }
    const day = e.target.closest('.dp-day');
    if (day && !day.disabled) {
      Object.assign(sel, pickDate(sel, day.dataset.date, { oneWay }), { hover: '' }); focusIso = day.dataset.date; paint();
      // The range is complete: apply and close, the way travelers expect from flight sites.
      if (oneWay ? sel.start : sel.end) setTimeout(apply, 180);
      return;
    }
    if (e.target.closest('.dp-prev') && !atMin()) { view = addMonths(view.y, view.m, -1); render(); return; }
    if (e.target.closest('.dp-next') && !atMax()) { view = addMonths(view.y, view.m, 1); render(); return; }
    if (e.target.closest('.dp-clear')) { sel.start = ''; sel.end = ''; focusIso = today; paint(); return; }
    const mode = e.target.closest('[data-mode]');
    if (mode && (mode.dataset.mode === 'oneway') !== oneWay) { oneWay = mode.dataset.mode === 'oneway'; if (oneWay) sel.end = ''; onTripType(mode.dataset.mode); render(); dialog.querySelector(`[data-mode="${mode.dataset.mode}"]`).focus(); }
  };
  dialog.onmouseover = e => { const day = e.target.closest('.dp-day'); if (day && !oneWay && sel.start && !sel.end && sel.hover !== day.dataset.date) { sel.hover = day.dataset.date; paint(); } };
  dialog.onkeydown = e => {
    const day = e.target.closest('.dp-day'); if (!day) return;
    // RTL: the week runs right to left, so ArrowLeft is the next day.
    const step = { ArrowLeft: 1, ArrowRight: -1, ArrowDown: 7, ArrowUp: -7 }[e.key];
    const iso = day.dataset.date, d = new Date(iso + 'T12:00:00Z');
    let target = null;
    if (step) target = new Date(d.getTime() + step * 86400000);
    else if (e.key === 'PageDown' || e.key === 'PageUp') { target = new Date(d); target.setUTCMonth(d.getUTCMonth() + (e.key === 'PageDown' ? 1 : -1)); }
    else if (e.key === 'Home') target = new Date(d.getTime() - d.getUTCDay() * 86400000);
    else if (e.key === 'End') target = new Date(d.getTime() + (6 - d.getUTCDay()) * 86400000);
    if (!target) return;
    e.preventDefault(); moveFocus(target.toISOString().slice(0, 10));
  };
  dialog.onchange = e => {
    if (e.target.id === 'start-date') { sel.start = e.target.value; if (sel.end && sel.end < sel.start) sel.end = ''; if (sel.start) { const p = parseIso(sel.start); view = { y: p.y, m: p.m }; focusIso = sel.start; } render(); }
    if (e.target.id === 'end-date') { sel.end = e.target.value; paint(); }
  };
  dialog.onsubmit = e => { e.preventDefault(); apply(); };
  // However it closes, focus goes back to the dates field (not to the place field that opened it).
  dialog.onclose = () => { if (returnFocus) returnFocus.focus({ preventScroll: true }); };
  render();
  if (!dialog.open) dialog.showModal();
  (dialog.querySelector('.dp-day[tabindex="0"]') || dialog.querySelector('.dp-day:not(:disabled)'))?.focus();
  return dialog;
}

// ---- Passengers popover: changes apply at once; "סיום", Escape or a click outside closes it.
export function travelersPopover(button, { get, set, onClose = () => {} }) {
  const existing = document.querySelector('#travelers-pop');
  if (existing) { existing.remove(); button.setAttribute('aria-expanded', 'false'); return; }
  let { adults, children } = get();
  const pop = document.createElement('div');
  pop.id = 'travelers-pop'; pop.className = 'travelers-pop'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'מי נוסע');
  const row = (key, title, note) => `<div class="counter"><span><strong>${title}</strong><small>${note}</small></span><div class="counter-controls">`
    + `<button type="button" aria-label="הוספת ${key === 'adult' ? 'מבוגר' : 'ילד'}" data-counter="${key}-plus">+</button><strong id="${key}-count" aria-live="polite"></strong>`
    + `<button type="button" aria-label="הסרת ${key === 'adult' ? 'מבוגר' : 'ילד'}" data-counter="${key}-minus">−</button></div></div>`;
  pop.innerHTML = row('adult', 'מבוגרים', 'מגיל 12 ומעלה') + row('child', 'ילדים', 'גילאי 2–11') + '<p class="micro-copy">עד 9 נוסעים בהזמנה אחת.</p><button type="button" id="save-travelers" class="yellow dialog-primary">סיום</button>';
  const host = button.closest('.search-panel') || document.body;
  host.append(pop);
  const place = () => {
    const a = button.getBoundingClientRect(), h = host.getBoundingClientRect();
    pop.style.top = `${a.bottom - h.top + 8}px`;
    if (window.matchMedia('(max-width: 700px)').matches) { pop.style.right = '10px'; pop.style.left = '10px'; }
    else { pop.style.right = `${Math.max(10, h.right - a.right)}px`; pop.style.left = 'auto'; }
  };
  const update = () => {
    pop.querySelector('#adult-count').textContent = adults; pop.querySelector('#child-count').textContent = children;
    pop.querySelector('[data-counter="adult-minus"]').disabled = adults <= 1; pop.querySelector('[data-counter="child-minus"]').disabled = children <= 0;
    pop.querySelector('[data-counter="adult-plus"]').disabled = pop.querySelector('[data-counter="child-plus"]').disabled = adults + children >= 9;
    set({ adults, children });
  };
  const close = (focus = true) => {
    pop.remove(); button.setAttribute('aria-expanded', 'false');
    document.removeEventListener('mousedown', outside, true); window.removeEventListener('resize', place);
    if (focus) button.focus(); onClose();
  };
  const outside = e => { if (!pop.contains(e.target) && !button.contains(e.target)) close(false); };
  pop.addEventListener('click', e => {
    const b = e.target.closest('[data-counter]');
    if (b) { const [who, op] = b.dataset.counter.split('-'); if (who === 'adult') adults += op === 'plus' ? 1 : -1; else children += op === 'plus' ? 1 : -1; update(); return; }
    if (e.target.closest('#save-travelers')) close();
  });
  pop.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); close(); } });
  document.addEventListener('mousedown', outside, true); window.addEventListener('resize', place);
  button.setAttribute('aria-expanded', 'true');
  place(); update();
  pop.querySelector('[data-counter="adult-plus"]').focus();
}
