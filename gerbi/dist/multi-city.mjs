// Multi-city leg editor: the third trip type ("כמה יעדים"). Reuses the place combobox and the calendar dialog.
// app.js owns the search; this module owns the legs and tells app.js when they change ('brief-changed').
import { placeCombobox, openRangePicker } from './search-form.mjs';
import { resolvePlace, placeText, placeByCode } from './places.mjs';
import { MIN_LEGS, MAX_LEGS, validateLegs, multiRequest, routeText, groundGaps, gapText } from './multi-city-core.mjs';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = name => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
const shortDay = iso => (iso ? new Date(iso + 'T12:00:00Z').toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }) : '');
const textOf = code => placeText(placeByCode(code)) || code || '';

// seed(): the main form's {from, to, start, end} when switching in; unseed(values) writes them back when switching out.
export function initMultiCity({ form, today, seed, unseed, changed = () => document.dispatchEvent(new Event('brief-changed')) }) {
  const radio = () => form.querySelector('[name="trip-type"]:checked')?.value;
  const fields = form.querySelector('.search-fields');
  const host = document.createElement('div');
  host.className = 'multi-legs'; host.id = 'multi-legs'; host.hidden = true;
  host.setAttribute('role', 'group'); host.setAttribute('aria-label', 'הטיסות במסלול');
  fields.before(host);
  let legs = [], shown = false;

  const read = () => legs.map((leg, i) => ({ from: host.querySelector(`[data-leg="${i}"] [data-part="from"]`)?.value ?? leg.from, to: host.querySelector(`[data-leg="${i}"] [data-part="to"]`)?.value ?? leg.to, date: leg.date }));
  function gapNotes() {
    let resolved = null; try { resolved = read().map(l => ({ from: resolvePlace(l.from)?.code, to: resolvePlace(l.to)?.code, date: l.date })); } catch { /* typing */ }
    const gaps = resolved && resolved.every(l => l.from && l.to) ? groundGaps(resolved) : [];
    host.querySelector('.multi-gaps').innerHTML = gaps.map(g => `<p>${esc(gapText(g))}</p>`).join('');
  }
  function render(focus) {
    host.innerHTML = `<ol class="leg-list">${legs.map((leg, i) => `<li class="leg-row" data-leg="${i}">`
      + `<span class="leg-number" aria-hidden="true">${i + 1}</span>`
      + `<label class="field leg-from">${icon('pin')}<span><span class="field-label">טיסה ${i + 1} · מ־</span><input id="leg-${i}-from" data-part="from" value="${esc(leg.from)}" aria-label="טיסה ${i + 1}: מאיפה" placeholder="עיר או שדה"></span></label>`
      + `<label class="field leg-to">${icon('pin')}<span><span class="field-label">אל</span><input id="leg-${i}-to" data-part="to" value="${esc(leg.to)}" aria-label="טיסה ${i + 1}: לאן" placeholder="עיר או שדה"></span></label>`
      + `<button type="button" class="field leg-date" data-part="date" aria-label="טיסה ${i + 1}: תאריך${leg.date ? ' ' + esc(shortDay(leg.date)) : ''}">${icon('calendar')}<span><span class="field-label">תאריך</span><span class="field-value${leg.date ? '' : ' muted'}">${leg.date ? esc(shortDay(leg.date)) : 'בחרו תאריך'}</span></span></button>`
      + (legs.length > MIN_LEGS ? `<button type="button" class="leg-remove" data-remove-leg="${i}" aria-label="הסרת טיסה ${i + 1}">${icon('close')}</button>` : '<span class="leg-remove-spacer"></span>')
      + '</li>').join('')}</ol>`
      + `<div class="multi-actions"><button type="button" class="button secondary leg-add" data-add-leg ${legs.length >= MAX_LEGS ? 'disabled' : ''}>+ הוספת טיסה</button><small>${legs.length >= MAX_LEGS ? `הגעתם למקסימום: ${MAX_LEGS} טיסות במסלול.` : `עד ${MAX_LEGS} טיסות · מחיר אחד לכל המסלול`}</small></div><div class="multi-gaps" aria-live="polite"></div>`;
    legs.forEach((_, i) => {
      for (const part of ['from', 'to']) {
        const input = host.querySelector(`#leg-${i}-${part}`);
        placeCombobox(input, { kind: part === 'from' && i === 0 ? 'origin' : 'destination',
          exclude: () => resolvePlace(host.querySelector(`#leg-${i}-${part === 'from' ? 'to' : 'from'}`)?.value)?.code || '',
          onCommit: place => afterPick(i, part, place) });
      }
    });
    gapNotes();
    if (focus) host.querySelector(focus)?.focus();
  }
  // Picking a destination fills the next leg's origin (when empty) and moves on to the date.
  function afterPick(i, part, place) {
    legs = read();
    if (part === 'to' && legs[i + 1] && !legs[i + 1].from.trim()) { legs[i + 1].from = placeText(place); host.querySelector(`#leg-${i + 1}-from`).value = legs[i + 1].from; }
    if (part === 'from' && !legs[i].to.trim()) host.querySelector(`#leg-${i}-to`).focus();
    else if (part === 'to' && !legs[i].date) setTimeout(() => openDate(i), 60);
    gapNotes(); changed();
  }
  const minFor = i => legs.slice(0, i).map(l => l.date).filter(Boolean).reduce((a, b) => (b > a ? b : a), today());
  function openDate(i) {
    legs = read();
    const button = host.querySelector(`[data-leg="${i}"] [data-part="date"]`), min = minFor(i);
    const dialog = openRangePicker({ start: legs[i].date >= min ? legs[i].date : '', oneWay: true, today: min, returnFocus: button,
      validate: start => Boolean(start) && start >= min,
      onApply: ({ start }) => {
        legs[i].date = start;
        // A later leg that now departs before this one is cleared rather than silently moved.
        legs.forEach((l, k) => { if (k > i && l.date && l.date < start) l.date = ''; });
        render(); changed();
        const next = host.querySelector(`[data-leg="${i + 1}"] [data-part="${legs[i + 1]?.from ? (legs[i + 1].to ? 'date' : 'to') : 'from'}"]`);
        (next || form.querySelector('#travelers-button'))?.focus();
      } });
    // Same calendar, single date: the round-trip/one-way switch inside it does not apply here.
    dialog.classList.add('single-only'); dialog.querySelector('#date-picker-title').textContent = `מתי טסים בטיסה ${i + 1}?`;
    const close = dialog.onclose; dialog.onclose = () => { dialog.classList.remove('single-only'); close?.(); };
  }
  host.addEventListener('click', e => {
    const date = e.target.closest('[data-part="date"]'); if (date) { openDate(Number(date.closest('[data-leg]').dataset.leg)); return; }
    const remove = e.target.closest('[data-remove-leg]');
    if (remove) { legs = read(); legs.splice(Number(remove.dataset.removeLeg), 1); render('[data-add-leg]'); changed(); return; } // focus somewhere that opens no popup
    if (e.target.closest('[data-add-leg]') && legs.length < MAX_LEGS) {
      legs = read(); const last = legs.at(-1);
      legs.push({ from: last?.to || '', to: '', date: '' }); render(`[data-leg="${legs.length - 1}"] [data-part="${last?.to ? 'to' : 'from'}"]`); changed();
    }
  });
  host.addEventListener('input', e => { if (e.target.dataset.part) { legs = read(); gapNotes(); changed(); } });

  // Visibility follows the trip-type radio (also when app.js sets it in code, e.g. from a deal or a shared link).
  function sync() {
    const on = radio() === 'multi';
    if (on && !shown) {
      if (!legs.length) { const s = seed(); legs = [{ from: s.from, to: s.to, date: s.start || '' }, { from: s.to, to: s.from, date: s.end && s.end >= (s.start || '') ? s.end : '' }]; }
      render();
    } else if (!on && shown) {
      legs = read();
      const first = legs[0], last = legs.at(-1);
      if (first) unseed({ from: first.from, to: first.to, start: first.date, end: legs.length > 1 ? last.date : '' });
    }
    shown = on; host.hidden = !on; fields.classList.toggle('multi-mode', on);
  }
  form.querySelectorAll('[name="trip-type"]').forEach(input => input.addEventListener('change', () => { sync(); changed(); }));
  return {
    sync,
    active: () => radio() === 'multi',
    legs: () => read(),
    // Codes, ready to send; throws a Hebrew error whose .field selects the leg input to focus.
    validated: () => validateLegs(read(), today()),
    request: (adults, children) => { const valid = validateLegs(read(), today()); legs = valid.map(l => ({ from: textOf(l.from), to: textOf(l.to), date: l.date })); render(); return multiRequest(valid, adults, children); },
    signature: () => JSON.stringify(read().map(l => [resolvePlace(l.from)?.code || l.from.trim(), resolvePlace(l.to)?.code || l.to.trim(), l.date])),
    setLegs(list) { legs = list.map(l => ({ from: textOf(l.from), to: textOf(l.to), date: l.date || '' })); shown = false; sync(); },
    routeText
  };
}
