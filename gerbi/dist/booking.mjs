// Booking wizard #/book/<orderId> and "my orders" #/orders (spec 25 §6). The server holds the order; this page only
// renders the step its status calls for, sends what the customer typed, and re-reads. Every server value is escaped.
//   passengers (full passport, saved travellers) + contact → extras (every optional service the airline offers, per
//   traveller; Harel insurance on request) → summary (re-checked price, terms) →
//   request: "send booking request" · mock/live: hosted payment page → processing → confirmation
import { t, lang, fmtDate, fmtDateTime, fmtMoney } from './i18n.mjs';
import { formatIls, toIls, getFx, loadFx } from './fx.mjs';
import { validatePassengers, validateContact, PTC_ORDER, STATUS_GROUP, EXTRA_KINDS, extraLabel, extrasTotal } from './booking-core.mjs';
import { savedTravellers, travellerPicker, fillFromSaved, countries } from './account-travellers.mjs';
import { rememberOrder, orderToken, rememberedOrders, bookingConfig } from './booking-client.mjs';
import { account, ready as accountReady } from './account.mjs';

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const POLL_MS = 2500, POLL_MAX = 60;
const ils = (n) => (Number.isFinite(n) ? formatIls(n) : '');
const original = (p) => (p && Number.isFinite(p.value) ? fmtMoney(p.value, p.currency, { maximumFractionDigits: 2 }) : '');
const day = (d) => (d ? fmtDate(d, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '');

async function api(method, path, body, id) {
  const token = id ? orderToken(id) : '';
  const response = await fetch(path, { method, cache: 'no-store', headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { 'x-order-token': token } : {}) }, body: body ? JSON.stringify({ ...body, lang }) : undefined });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.error || 'error'), { status: response.status, data });
  return data;
}
const errText = (error) => t(`booking.err.${error.data?.error || error.message}`) !== `booking.err.${error.data?.error || error.message}` ? t(`booking.err.${error.data?.error || error.message}`) : error.status === 429 ? t('booking.err.rate_limited') : t('booking.err.generic');

// ---------------------------------------------------------------- pieces
const STEPS = ['passengers', 'addons', 'summary', 'done'];
function stepOf(order) {
  if (order.status === 'draft') return 'passengers';
  if (order.status === 'details') return 'addons';
  if (['priced', 'price_changed', 'payment_failed'].includes(order.status)) return 'summary';
  return 'done';
}
const stepper = (current) => `<ol class="bo-steps" aria-label="${t('booking.steps.label')}">${STEPS.map((s, i) => `<li${s === current ? ' aria-current="step"' : ''}${STEPS.indexOf(current) > i ? ' class="done"' : ''}><span>${i + 1}</span>${t(`booking.steps.${s}`)}</li>`).join('')}</ol>`;
const legsHtml = (order) => `<ul class="bo-legs">${order.legs.map((l) => `<li><strong dir="ltr">${esc(l.from)} ${esc(l.time)} → ${esc(l.to)} ${esc(l.arriveTime)}</strong><span>${esc(day(l.date))} · ${esc(l.carrier)}${l.flight ? ` <bdi dir="ltr">${esc(l.flight)}</bdi>` : ''} · ${l.stops ? t('booking.stops', { count: l.stops }) : t('booking.direct')}</span></li>`).join('')}</ul>`;
const paxLine = (pax) => PTC_ORDER.filter((p) => pax?.[p]).map((p) => t(`booking.pax.${p}`, { count: pax[p] })).join(' · ');
function tripCard(order) {
  return `<section class="surface-panel bo-trip" aria-labelledby="bo-trip-h"><h2 id="bo-trip-h">${t('booking.trip.title')}</h2>${legsHtml(order)}<p class="micro-copy">${esc(paxLine(order.pax))}${order.brand ? ' · ' + esc(order.brand) : ''}</p>
    <p class="bo-ref">${t('booking.ref')} <bdi dir="ltr">${esc(order.ref)}</bdi></p></section>`;
}
function priceBox(order, { big = true } = {}) {
  const p = order.price;
  if (!p) return '';
  const main = p.ils ? ils(p.ils) : original(p.total);
  return `<div class="bo-price${big ? ' big' : ''}"><small>${t('booking.price.total', { count: Object.values(order.pax || {}).reduce((a, b) => a + b, 0) })}</small><strong dir="ltr">${esc(main)}</strong>
    ${p.ils ? `<span class="micro-copy">${t('booking.price.original', { amount: `<bdi dir="ltr">${esc(original(p.total))}</bdi>`, rate: esc(p.rate ? p.rate.toFixed(3) : '-') })}</span>` : ''}
    <span class="micro-copy">${t('booking.price.includes')}</span></div>`;
}
function field(key, label, control, { hint = '', optional = false } = {}) {
  const id = 'bo-' + key.replace(/\./g, '-');
  return `<div class="lead-field" data-for="${esc(key)}"><label for="${id}">${label}${optional ? ` <span class="lead-optional">${t('leads.optional')}</span>` : ''}</label>${control.replace('<CONTROL>', `id="${id}" data-key="${esc(key)}" aria-describedby="${id}-error${hint ? ` ${id}-hint` : ''}"`)}${hint ? `<p class="lead-hint" id="${id}-hint">${hint}</p>` : ''}<p class="lead-error" id="${id}-error" hidden></p></div>`;
}
function showErrors(form, fields = {}, warnings = {}) {
  $$('.lead-field', form).forEach((f) => { f.classList.remove('invalid'); const e = $('.lead-error', f); if (e) { e.hidden = true; e.textContent = ''; } $$('[aria-invalid]', f).forEach((x) => x.removeAttribute('aria-invalid')); });
  $$('.bo-warning', form).forEach((w) => w.remove());
  let first = null;
  // A passport number the server could not resolve: open the number field again.
  for (const key of Object.keys(fields)) { const m = /^(\d+)\.document\.number$/.exec(key), keep = m && form.querySelector(`[data-keep="${m[1]}"]`); if (keep?.checked) { keep.checked = false; syncKeep(form); } }
  for (const [key, message] of Object.entries(fields)) {
    const box = form.querySelector(`[data-for="${CSS.escape(key)}"]`);
    if (!box) { const top = $('.bo-form-error', form); if (top) { top.hidden = false; top.textContent = message; } continue; }
    box.classList.add('invalid'); const e = $('.lead-error', box); e.hidden = false; e.textContent = message;
    const input = $('[data-key]', box); input?.setAttribute('aria-invalid', 'true'); first ||= input;
  }
  for (const [key, message] of Object.entries(warnings)) { const box = form.querySelector(`[data-for="${CSS.escape(key)}"]`); box?.insertAdjacentHTML('beforeend', `<p class="bo-warning lead-hint">⚠ ${esc(message)}</p>`); }
  first?.focus();
  return Boolean(first);
}

// ---------------------------------------------------------------- step 1: passengers + contact
// Every traveller gives the full passport (spec 25 §6.2, 23.11.2026). A saved traveller fills the form in one click;
// its passport number stays on the server ("use the saved passport"), like the number already given in this order.
function passportFields(i, d, { masked = '', keepKind = '' } = {}) {
  const keep = masked ? `<label class="lead-check bo-keep"><input type="checkbox" data-keep="${i}" data-keep-kind="${keepKind}" checked><span>${t(keepKind === 'saved' ? 'booking.f.useSaved' : 'booking.f.keepNumber', { masked: `<bdi dir="ltr">${esc(masked)}</bdi>` })}</span></label>` : '';
  return `<div class="bo-passport" data-passport="${i}"><p class="bo-label">${t('booking.f.passportTitle')}</p>${keep}<div class="lead-grid">
      ${field(`${i}.document.number`, t('booking.f.docNumber'), `<input <CONTROL> dir="ltr" autocomplete="off" inputmode="text" autocapitalize="characters" spellcheck="false" maxlength="20" value="" ${masked ? '' : 'required'}>`, { hint: t('booking.f.docNumberHint') })}
      ${field(`${i}.document.issuingCountry`, t('booking.f.issuingCountry'), `<select <CONTROL> required>${countries(d.issuingCountry || '')}</select>`)}
      ${field(`${i}.document.nationality`, t('booking.f.nationality'), `<select <CONTROL> required>${countries(d.nationality || '')}</select>`)}
      ${field(`${i}.document.issueDate`, t('booking.f.docIssue'), `<input <CONTROL> type="date" value="${esc(d.issueDate || '')}" required>`)}
      ${field(`${i}.document.expiryDate`, t('booking.f.docExpiry'), `<input <CONTROL> type="date" value="${esc(d.expiryDate || '')}" required>`, { hint: t('booking.f.docExpiryHint') })}</div></div>`;
}
function passengersForm(order, saved = null) {
  const types = PTC_ORDER.flatMap((p) => Array.from({ length: order.pax?.[p] || 0 }, () => p)), prev = order.passengers || [];
  const me = (saved || []).find((x) => x.self);
  const contact = order.contact || (account.user ? { name: account.user.name, email: account.user.email || me?.email, phone: account.user.phone || me?.phone } : {});
  const person = (ptc, i) => {
    const p = prev[i] || {}, d = p.document || {};
    return `<fieldset class="bo-person" data-person="${i}"${p.savedId ? ` data-saved-id="${esc(p.savedId)}"` : ''}><legend>${t(`booking.person.${ptc}`, { n: i + 1 })}</legend>
      ${saved?.length ? travellerPicker(i, saved, p.savedId || '') : ''}
      <div class="lead-field lead-choices" data-for="${i}.gender" role="radiogroup" aria-label="${t('booking.f.gender')}"><span class="bo-label">${t('booking.f.gender')}</span>
        ${['f', 'm'].map((g) => `<label class="lead-chip"><input type="radio" name="g${i}" value="${g}" data-key="${i}.gender" ${p.gender === g ? 'checked' : ''}><span>${t(`booking.gender.${g}`)}</span></label>`).join('')}<p class="lead-error" hidden></p></div>
      <div class="lead-grid">
        ${field(`${i}.firstName`, t('booking.f.firstName'), `<input <CONTROL> dir="ltr" autocomplete="${i ? 'off' : 'given-name'}" autocapitalize="characters" spellcheck="false" maxlength="50" value="${esc(p.firstName || '')}" required>`, { hint: i ? '' : t('booking.f.latinHint') })}
        ${field(`${i}.lastName`, t('booking.f.lastName'), `<input <CONTROL> dir="ltr" autocomplete="${i ? 'off' : 'family-name'}" autocapitalize="characters" spellcheck="false" maxlength="50" value="${esc(p.lastName || '')}" required>`)}
        ${field(`${i}.birthDate`, t('booking.f.birthDate'), `<input <CONTROL> type="date" value="${esc(p.birthDate || '')}" required>`, { hint: ptc === 'ADT' ? '' : t(`booking.f.ageHint.${ptc}`) })}
      </div>${passportFields(i, d, { masked: d.number || '', keepKind: 'order' })}</fieldset>`;
  };
  const saveBox = account.user ? `<fieldset class="bo-person bo-save" data-save-box><legend>${t('booking.saved.saveTitle')}</legend><p class="micro-copy">${t('booking.saved.saveLead')}</p>
      <div class="bo-save-list">${types.map((ptc, i) => `<label class="lead-check"><input type="checkbox" data-save-traveller="${i}"><span>${t('booking.saved.saveThis', { n: i + 1 })}</span></label>`).join('')}</div>
      <div class="lead-field" data-for="save.consent"><label class="lead-check"><input type="checkbox" data-key="save.consent"><span>${t('booking.saved.consentText')}</span></label><p class="lead-error" hidden></p></div></fieldset>`
    : `<p class="micro-copy bo-save-guest">${t('booking.saved.signInToSave')} <a href="#/account?login=1">${t('booking.saved.signIn')}</a></p>`;
  return `${tripCard(order)}<form class="surface-panel lead-form bo-form" id="bo-passengers" novalidate>
    <h2>${t('booking.passengers.title')}</h2><p class="micro-copy">${t('booking.passengers.lead')}</p>
    <p class="notice">${t('booking.passengers.fullPassport')}</p>
    ${types.map(person).join('')}
    <fieldset class="bo-person"><legend>${t('booking.contact.title')}</legend><div class="lead-grid">
      ${field('contact.name', t('booking.f.contactName'), `<input <CONTROL> autocomplete="name" maxlength="80" value="${esc(contact.name || '')}" required>`)}
      ${field('contact.email', t('booking.f.email'), `<input <CONTROL> type="email" dir="ltr" autocomplete="email" value="${esc(contact.email || '')}" required>`)}
      ${field('contact.phone', t('booking.f.phone'), `<input <CONTROL> type="tel" dir="ltr" autocomplete="tel" value="${esc(contact.phone || '')}" required>`, { hint: t('booking.f.phoneHint') })}
    </div></fieldset>
    ${saveBox}
    <p class="lead-form-error bo-form-error" role="alert" hidden></p>
    <div class="bo-actions"><button class="button yellow" type="submit">${t('booking.passengers.next')}</button><button class="text-button" type="button" data-bo-cancel>${t('booking.cancel')}</button></div>
    <p class="micro-copy">${t('booking.privacy')} <a href="#/privacy">${t('booking.privacyLink')}</a></p></form>`;
}
// The passport number field follows its "use the saved / given number" box: hidden while the box is checked.
function syncKeep(form) {
  $$('[data-keep]', form).forEach((box) => {
    const i = box.dataset.keep, input = form.querySelector(`[data-key="${i}.document.number"]`), wrap = input?.closest('.lead-field');
    if (!input) return;
    input.required = !box.checked; if (wrap) wrap.hidden = box.checked;
  });
}
function readPassengers(form, order) {
  const types = PTC_ORDER.flatMap((p) => Array.from({ length: order.pax?.[p] || 0 }, () => p));
  const v = (key) => form.querySelector(`[data-key="${CSS.escape(key)}"]`)?.value?.trim() ?? '';
  const passengers = types.map((ptc, i) => {
    const box = form.querySelector(`[data-person="${i}"]`), savedId = box?.dataset.savedId || '', keep = form.querySelector(`[data-keep="${i}"]`);
    const reference = keep?.checked && !v(`${i}.document.number`) ? (keep.dataset.keepKind === 'saved' ? { useSaved: true, savedId } : { keep: true }) : {};
    return { gender: form.querySelector(`input[name="g${i}"]:checked`)?.value || '', firstName: v(`${i}.firstName`), lastName: v(`${i}.lastName`), birthDate: v(`${i}.birthDate`), ...(savedId ? { savedId } : {}),
      document: { type: 'passport', number: v(`${i}.document.number`), expiryDate: v(`${i}.document.expiryDate`), nationality: v(`${i}.document.nationality`), issuingCountry: v(`${i}.document.issuingCountry`), issueDate: v(`${i}.document.issueDate`), ...reference } };
  });
  const travellers = $$('[data-save-traveller]', form).filter((c) => c.checked).map((c) => Number(c.dataset.saveTraveller));
  const consent = form.querySelector('[data-key="save.consent"]')?.checked === true;
  return { passengers, contact: { name: v('contact.name'), email: v('contact.email'), phone: v('contact.phone') }, ...(travellers.length ? { save: { travellers, consent, self: travellers.includes(0) } } : {}) };
}

// ---------------------------------------------------------------- step 2: extras (every optional service, per traveller)
// Simple line icons (currentColor) per group of extras; an unknown group gets the generic one.
const ICONS = {
  bags: '<rect x="5" y="7" width="14" height="13" rx="2"/><path d="M9 7V4h6v3M9 11v6M15 11v6"/>',
  cabin: '<rect x="6" y="8" width="12" height="11" rx="2"/><path d="M10 8V5h4v3M8 21h2M14 21h2M9 13h6"/>',
  seat: '<path d="M7 4v9a2 2 0 0 0 2 2h7M7 13h9l2 6M9 15l-1 5"/>',
  sport: '<path d="M4 20 20 4M7 21l-3-3M20 7l-3-3M9 9l6 6"/>',
  meal: '<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 2-2 6 0 8v10"/>',
  other: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>'
};
const icon = (kind) => `<svg class="bo-x-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[kind] || ICONS.other}</svg>`;
const routeText = (x) => (x.from && x.from === x.to ? t('booking.extras.wholeTrip') : `<bdi dir="ltr">${esc(x.from)} → ${esc(x.to)}</bdi>`);
const optionText = (o) => extraLabel(o.description, lang).text || o.code;
const paxName = (order, i) => { const p = order.passengers?.[i]; return p ? `${p.firstName} ${p.lastName}` : t('booking.extras.traveller', { n: i + 1 }); };
function addonsForm(order) {
  const fx = getFx(), approx = (price) => { const v = toIls(price, fx); return v ? ` (≈${ils(Math.ceil(v))})` : ''; };
  const extras = order.extras || [], chosen = order.addons?.extras || {}, count = Object.values(order.pax || {}).reduce((a, b) => a + b, 0);
  const priceText = (o) => (o.price.value ? `${original(o.price)}${approx(o.price)}` : t('booking.extras.free'));
  const service = (x) => field(`x.${x.bookingCode}`, `${routeText(x)}${x.kind === 'other' && x.name ? ` · ${esc(x.name)}` : ''}`,
    `<select <CONTROL> data-extra="${esc(x.bookingCode)}"><option value="">${t('booking.extras.none')}</option>${x.options.map((o) => `<option value="${esc(o.code)}" data-value="${esc(o.price.value)}" data-currency="${esc(o.price.currency)}" ${chosen[x.bookingCode] === o.code ? 'selected' : ''}>${esc(optionText(o))} · ${esc(priceText(o))}</option>`).join('')}</select>`);
  const people = Array.from({ length: count }, (_, i) => i).map((i) => {
    const mine = extras.filter((x) => x.pax === i);
    if (!mine.length) return '';
    const groups = EXTRA_KINDS.map((kind) => [kind, mine.filter((x) => x.kind === kind)]).filter(([, list]) => list.length);
    return `<fieldset class="bo-person bo-extras-person"><legend><bdi dir="ltr">${esc(paxName(order, i))}</bdi></legend>${groups.map(([kind, list]) => `<div class="bo-x-group" data-kind="${kind}"><h4>${icon(kind)}<span>${t(`booking.extras.kind.${kind}`)}</span></h4><p class="micro-copy">${t(`booking.extras.lead.${kind}`)}</p><div class="lead-grid">${list.map(service).join('')}</div></div>`).join('')}</fieldset>`;
  }).join('');
  const mandatory = (order.mandatory || []).length ? `<div class="soft-notice"><strong>${t('booking.extras.mandatory')}</strong><ul class="bo-plain">${order.mandatory.map((m) => `<li>${esc(m.name)}${m.price ? ` · <bdi dir="ltr">${esc(original(m.price))}</bdi>` : ''}</li>`).join('')}</ul></div>` : '';
  const same = count > 1 && extras.length ? `<button class="text-button" type="button" data-bo-same>${t('booking.extras.sameForAll')}</button>` : '';
  return `${tripCard(order)}<form class="surface-panel lead-form bo-form" id="bo-addons" novalidate><h2>${t('booking.addons.title')}</h2>
    ${extras.length ? `<p class="micro-copy">${t('booking.extras.intro')}</p>${same}${people}<p class="bo-x-total" data-extras-total aria-live="polite"></p>` : `<p>${t('booking.extras.noneOffered')}</p>`}
    ${mandatory}
    <h3>${t('booking.addons.insurance')}</h3>
    <label class="lead-check bo-insurance"><input type="checkbox" data-insurance ${order.addons?.insurance ? 'checked' : ''}><span><strong>${t('booking.addons.insuranceLabel')}</strong><br><span class="micro-copy">${t('booking.addons.insuranceNote')}</span></span></label>
    <p class="lead-form-error bo-form-error" role="alert" hidden></p>
    <div class="bo-actions"><button class="button yellow" type="submit">${t('booking.addons.next')}</button><button class="text-button" type="button" data-bo-edit>${t('booking.editPassengers')}</button></div></form>`;
}
const readExtras = (form) => Object.fromEntries($$('[data-extra]', form).map((s) => [s.dataset.extra, s.value]).filter(([, v]) => v !== ''));
function showExtrasTotal(form, order) {
  const box = $('[data-extras-total]', form);
  if (!box) return;
  const choice = readExtras(form), currency = order.price?.total?.currency || '', sum = extrasTotal(order.extras, choice, currency), n = Object.keys(choice).length;
  const shekels = sum ? toIls({ value: sum, currency }, getFx()) : 0;
  box.innerHTML = n ? t('booking.extras.total', { count: n, amount: `<bdi dir="ltr">${esc(original({ value: sum, currency }))}</bdi>`, ils: shekels ? `<bdi dir="ltr">≈${esc(ils(Math.ceil(shekels)))}</bdi>` : '' }) : t('booking.extras.totalNone');
}

// ---------------------------------------------------------------- step 3: summary + terms + pay / submit
function policyHtml(order) {
  const refund = order.nonRefundable === true ? t('booking.policy.nonRefundable') : order.nonRefundable === false ? t('booking.policy.refundable') : t('booking.policy.unknown');
  return `<section class="bo-policy" aria-labelledby="bo-policy-h"><h3 id="bo-policy-h">${t('booking.policy.title')}</h3><ul><li>${refund}</li><li>${t('booking.policy.law')}</li><li>${t('booking.policy.fees')}</li></ul>
    ${order.disclaimer ? `<p class="micro-copy">${esc(order.disclaimer)}</p>` : ''}</section>`;
}
function summaryHtml(order, config) {
  const changed = order.status === 'price_changed' && order.priceChange, online = order.online && config.online;
  const bagsChosen = (order.extras || []).filter((x) => order.addons?.extras?.[x.bookingCode] !== undefined).map((x) => { const o = x.options.find((y) => y.code === order.addons.extras[x.bookingCode]); return o ? `<li>${icon(x.kind)} <bdi dir="ltr">${esc(paxName(order, x.pax))}</bdi> · ${esc(optionText(o))} · ${routeText(x)}${o.price.value ? ` · <bdi dir="ltr">${esc(original(o.price))}</bdi>` : ''}</li>` : ''; }).join('');
  const lines = (order.items || []).map((i) => `<li><span>${t(`booking.pax.${i.ptc}`, { count: i.count })}</span><bdi dir="ltr">${esc(original({ value: (i.fullFare + (i.serviceFee || 0)), currency: i.currency }))} × ${i.count}</bdi></li>`).join('');
  return `${tripCard(order)}<section class="surface-panel bo-summary" aria-labelledby="bo-sum-h"><h2 id="bo-sum-h">${t('booking.summary.title')}</h2>
    ${changed ? `<div class="bo-alert" role="alert"><strong>${t('booking.summary.changedTitle')}</strong><p>${t('booking.summary.changed', { from: `<bdi dir="ltr">${esc(changed.from ? ils(changed.from) : original(changed.fromOriginal))}</bdi>`, to: `<bdi dir="ltr">${esc(changed.to ? ils(changed.to) : original(changed.toOriginal))}</bdi>` })}</p><div class="bo-actions"><button class="button yellow" type="button" data-bo-accept>${t('booking.summary.accept')}</button><a class="button secondary" href="#/">${t('booking.summary.searchAgain')}</a></div></div>` : ''}
    ${order.status === 'payment_failed' ? `<p class="bo-alert" role="alert">${t('booking.summary.paymentFailed')}</p>` : ''}
    <div class="bo-sum-grid"><div>
      <h3>${t('booking.summary.travellers')}</h3><ul class="bo-plain">${order.passengers.map((p) => `<li><bdi dir="ltr">${esc(p.firstName)} ${esc(p.lastName)}</bdi> · ${t(`booking.ptc.${p.ptc}`)}${p.birthDate ? ' · ' + esc(fmtDate(p.birthDate)) : ''}${p.document ? ` · ${t(`booking.doc.${p.document.type || 'passport'}`)} <bdi dir="ltr">${esc(p.document.number)}</bdi> · ${t('booking.summary.validUntil', { date: esc(fmtDate(p.document.expiryDate)) })}` : ''}</li>`).join('')}</ul>
      <h3>${t('booking.summary.contact')}</h3><p>${esc(order.contact?.name)} · <bdi dir="ltr">${esc(order.contact?.email)}</bdi> · <bdi dir="ltr">${esc(order.contact?.phone)}</bdi></p>
      ${bagsChosen ? `<h3>${t('booking.summary.extras')}</h3><ul class="bo-plain">${bagsChosen}</ul>` : ''}
      ${order.addons?.insurance ? `<p class="soft-notice">${t('booking.summary.insurance')}</p>` : ''}
      <div class="bo-actions"><button class="text-button" type="button" data-bo-edit>${t('booking.editPassengers')}</button><button class="text-button" type="button" data-bo-addons>${t('booking.editAddons')}</button></div>
    </div><div>${priceBox(order)}<details class="bo-breakdown"><summary>${t('booking.summary.breakdown')}</summary><ul class="bo-plain">${lines}${order.price?.extras ? `<li><span>${t('booking.summary.extrasTotal')}</span><bdi dir="ltr">${esc(original({ value: order.price.extras, currency: order.price.total.currency }))}</bdi></li>` : ''}</ul><p class="micro-copy">${t('booking.summary.fxNote')}</p></details>
      <p class="micro-copy">${t('booking.summary.checkedAt', { time: esc(order.quotedAt ? fmtDateTime(order.quotedAt) : '') })} <button class="text-button" type="button" data-bo-recheck>${t('booking.summary.recheck')}</button></p></div></div>
    ${policyHtml(order)}
    ${changed ? '' : `<form id="bo-commit" class="lead-form" novalidate>
      <div class="lead-consent"><div class="lead-field" data-for="terms"><label class="lead-check"><input type="checkbox" data-key="terms" required><span>${t('booking.summary.terms')}</span></label><p class="lead-error" hidden></p></div>
      <div class="lead-field" data-for="cancellation"><label class="lead-check"><input type="checkbox" data-key="cancellation" required><span>${t('booking.summary.cancellation')}</span></label><p class="lead-error" hidden></p></div></div>
      ${online ? `<p class="micro-copy">${t('booking.summary.installmentsNote', { count: config.maxInstallments || 1 })}</p>
        <button class="button yellow bo-pay" type="submit">${t('booking.summary.pay', { amount: `<bdi dir="ltr">${esc(ils(order.price?.ils))}</bdi>` })}</button><p class="micro-copy">${t('booking.summary.payNote')}</p>`
      : `<button class="button yellow bo-pay" type="submit">${t('booking.summary.submit')}</button><p class="micro-copy">${t('booking.summary.submitNote')}</p>`}
      <p class="lead-form-error bo-form-error" role="alert" hidden></p></form>`}
  </section>`;
}

// ---------------------------------------------------------------- after commit
function doneHtml(order) {
  const g = STATUS_GROUP[order.status] || 'closed';
  const box = (kind, title, body, extra = '') => `<section class="surface-panel bo-done bo-${kind}" role="status" aria-live="polite"><h2>${title}</h2><p>${body}</p>${extra}</section>`;
  const tickets = order.supplier?.tickets?.length ? `<p>${t('booking.done.tickets')} <bdi dir="ltr">${order.supplier.tickets.map(esc).join(', ')}</bdi></p>` : '';
  const pnr = order.supplier?.pnr ? `<p class="bo-pnr">${t('booking.done.pnr')} <strong dir="ltr">${esc(order.supplier.pnr)}</strong></p>` : '';
  const cancel = !order.cancelRequested && ['request', 'confirmed', 'agent', 'processing'].includes(g) ? `<details class="bo-cancel"><summary>${t('booking.cancelRequest.open')}</summary><form id="bo-cancel-request" class="lead-form">${field('reason', t('booking.cancelRequest.reason'), '<textarea <CONTROL> maxlength="300"></textarea>', { optional: true })}<p class="micro-copy">${t('booking.cancelRequest.note')}</p><button class="button secondary" type="submit">${t('booking.cancelRequest.send')}</button></form></details>` : order.cancelRequested ? `<p class="notice">${t('booking.cancelRequest.sent')}</p>` : '';
  const lead = order.passengers?.[0], legs = order.legs || [];
  const hotel = order.piiPurged || !['request', 'confirmed', 'agent', 'processing'].includes(g) ? '' : order.hotelRequested ? `<section class="surface-panel bo-hotel"><h3>${t('booking.hotel.title')}</h3><p class="notice" role="status">${t('booking.hotel.sent')}</p></section>`
    : `<section class="surface-panel bo-hotel" aria-labelledby="bo-hotel-h"><h3 id="bo-hotel-h">${t('booking.hotel.title')}</h3><p>${t('booking.hotel.lead', { city: esc(legs[0]?.toCity || legs[0]?.to || ''), from: esc(day(legs[0]?.arriveDate || legs[0]?.date)), to: esc(legs.length > 1 ? day(legs.at(-1).date) : '') })}</p>
      <p class="micro-copy">${t('booking.hotel.prefilled', { name: `<bdi dir="ltr">${esc(lead ? `${lead.firstName} ${lead.lastName}` : '')}</bdi>`, email: `<bdi dir="ltr">${esc(order.contact?.email || '')}</bdi>`, phone: `<bdi dir="ltr">${esc(order.contact?.phone || '')}</bdi>` })}</p>
      <form id="bo-hotel" class="lead-form" novalidate><div class="lead-grid">
        ${field('hotel.stars', t('booking.hotel.stars'), `<select <CONTROL>><option value="">${t('booking.hotel.any')}</option>${['3', '4', '5'].map((n) => `<option value="${n}">${t('booking.hotel.starsN', { n })}</option>`).join('')}</select>`, { optional: true })}
        ${field('hotel.board', t('booking.hotel.board'), `<select <CONTROL>><option value="">${t('booking.hotel.any')}</option>${['room', 'breakfast', 'half', 'all'].map((b) => `<option value="${b}">${t(`booking.hotel.board.${b}`)}</option>`).join('')}</select>`, { optional: true })}
        ${field('hotel.note', t('booking.hotel.note'), '<input <CONTROL> maxlength="300">', { optional: true })}</div>
        <p class="lead-form-error bo-form-error" role="alert" hidden></p><button class="button yellow" type="submit">${t('booking.hotel.send')}</button></form></section>`;
  const links = `<div class="bo-actions"><a class="button secondary" href="#/orders">${t('booking.myOrders')}</a>${g === 'confirmed' ? `<button class="button secondary" type="button" data-bo-print>${t('booking.done.print')}</button>` : ''}</div>`;
  let main;
  if (g === 'confirmed') main = box('ok', t('booking.done.confirmedTitle'), t('booking.done.confirmed', { ref: `<bdi dir="ltr">${esc(order.ref)}</bdi>` }), pnr + tickets + (order.payment ? `<p>${t('booking.done.paid', { amount: `<bdi dir="ltr">${esc(ils(order.payment.amount / 100))}</bdi>`, count: order.payment.installments })}</p>` : '') + (order.addons?.insurance ? `<p>${t('booking.summary.insurance')}</p>` : ''));
  else if (g === 'request') main = box('ok', t('booking.done.requestTitle'), t(order.status === 'in_progress' ? 'booking.done.inProgress' : 'booking.done.request', { ref: `<bdi dir="ltr">${esc(order.ref)}</bdi>` }), `<ol class="bo-next"><li>${t('booking.done.next1')}</li><li>${t('booking.done.next2')}</li><li>${t('booking.done.next3')}</li></ol>`);
  else if (g === 'payment') main = box('wait', t('booking.done.paymentTitle'), t('booking.done.payment'), `<div class="bo-actions"><button class="button yellow" type="button" data-bo-repay>${t('booking.done.backToPayment')}</button></div>`);
  else if (g === 'processing') main = box('wait', t('booking.done.processingTitle'), t('booking.done.processing'), '<p class="bo-spinner" aria-hidden="true"></p>');
  else if (g === 'agent') main = box('wait', t('booking.done.agentTitle'), t('booking.done.agent', { ref: `<bdi dir="ltr">${esc(order.ref)}</bdi>` }), pnr);
  else if (g === 'failed') main = box('fail', t(order.status === 'unavailable' ? 'booking.done.unavailableTitle' : 'booking.done.failedTitle'), t(order.status === 'unavailable' ? (order.payment ? 'booking.done.unavailablePaid' : 'booking.done.unavailable') : 'booking.done.failed'), `<div class="bo-actions"><a class="button yellow" href="#/">${t('booking.summary.searchAgain')}</a></div>`);
  else if (g === 'refund') main = box('wait', t('booking.done.refundTitle'), t('booking.done.refund'));
  else main = box('fail', t(`booking.done.${order.status}Title`), t(`booking.done.${order.status}`));
  const timeline = order.timeline.length ? `<details class="bo-timeline"><summary>${t('booking.timeline')}</summary><ol>${order.timeline.map((e) => `<li><time datetime="${esc(e.at)}">${esc(fmtDateTime(e.at))}</time> · ${t(`booking.status.${e.to}`)}</li>`).join('')}</ol></details>` : '';
  return main + hotel + tripCard(order) + links + cancel + timeline;
}

// ---------------------------------------------------------------- page
let poll = null;
async function page({ view, footer, bread, heading }) {
  clearTimeout(poll);
  const path = location.hash.slice(1), [, , id] = path.split('?')[0].split('/'), params = new URLSearchParams(path.split('?')[1] || '');
  // The email link carries the order token once; keep it on this device and drop it from the address bar.
  if (params.get('t') && /^[A-Za-z0-9_-]{20,80}$/.test(params.get('t'))) { rememberOrder(id, params.get('t')); history.replaceState(null, '', `#/book/${id}`); }
  view.innerHTML = `<div class="route-width bo-page">${bread(t('booking.crumb'))}${heading(t('booking.kicker'), t('booking.title'), t('booking.lead'))}<div id="bo-body" aria-live="polite"><p class="bo-loading">${t('booking.loading')}</p></div></div>${footer}`;
  const body = $('#bo-body', view);
  // A field's error goes away as soon as it is corrected.
  const clearField = (e) => { const f = e.target.closest?.('.lead-field.invalid'); if (!f) return; f.classList.remove('invalid'); const err = $('.lead-error', f); if (err) err.hidden = true; $$('[aria-invalid]', f).forEach((x) => x.removeAttribute('aria-invalid')); };
  body.addEventListener('input', clearField); body.addEventListener('change', clearField);
  const [config] = await Promise.all([bookingConfig(), accountReady.catch(() => {}), loadFx().catch(() => {})]);
  let order, polls = 0, saved = null;
  const loadSaved = async () => { saved = account.user ? await savedTravellers().catch(() => null) : null; };
  async function load() {
    try { [order] = await Promise.all([api('GET', `/api/orders/${id}`, null, id).then((r) => r.order), loadSaved()]); render(); }
    catch (error) { body.innerHTML = `<section class="surface-panel"><h2>${t('booking.notFound.title')}</h2><p>${t(error.status === 404 ? 'booking.notFound.body' : 'booking.err.generic')}</p><a class="button secondary" href="#/orders">${t('booking.myOrders')}</a></section>`; }
  }
  function render() {
    clearTimeout(poll);
    if (!location.hash.startsWith(`#/book/${id}`)) return;
    const step = stepOf(order);
    body.innerHTML = stepper(step) + (step === 'passengers' ? passengersForm(order, saved) : step === 'addons' ? addonsForm(order) : step === 'summary' ? summaryHtml(order, config) : doneHtml(order));
    wire();
    const g = STATUS_GROUP[order.status];
    if (['processing', 'payment'].includes(g) && polls < POLL_MAX) poll = setTimeout(async () => { polls++; try { if (polls === 2) await api('POST', `/api/orders/${id}/continue`, {}, id); order = (await api('GET', `/api/orders/${id}`, null, id)).order; render(); } catch { render(); } }, POLL_MS);
  }
  async function run(button, fn) {
    const form = button?.closest('form') || body;
    if (button) { button.disabled = true; button.setAttribute('aria-busy', 'true'); }
    try { await fn(); }
    catch (error) {
      if (error.data?.order) { order = error.data.order; render(); $('.bo-alert', body)?.focus?.(); return; }
      if (error.data?.fields && showErrors(form, error.data.fields, error.data.warnings)) return;
      const top = $('.bo-form-error', form) || $('.bo-form-error', body); if (top) { top.hidden = false; top.textContent = errText(error); top.focus?.(); }
    } finally { if (button?.isConnected) { button.disabled = false; button.removeAttribute('aria-busy'); } }
  }
  const go = async (action, data = {}) => { const result = await api('POST', `/api/orders/${id}/${action}`, data, id); order = result.order; return result; };
  function wire() {
    const passengers = $('#bo-passengers', body);
    if (passengers) {
      syncKeep(passengers);
      passengers.addEventListener('change', (e) => {
        if (e.target.matches('[data-keep]')) { syncKeep(passengers); if (!e.target.checked) passengers.querySelector(`[data-key="${e.target.dataset.keep}.document.number"]`)?.focus(); }
        if (e.target.matches('[data-pick-traveller]')) { fillFromSaved(passengers, Number(e.target.dataset.pickTraveller), (saved || []).find((x) => x.id === e.target.value) || null, { passportFields }); syncKeep(passengers); }
      });
    }
    if (passengers) passengers.onsubmit = (e) => {
      e.preventDefault();
      const data = readPassengers(passengers, order), dates = { travelStart: order.legs[0]?.date, travelEnd: order.legs.at(-1)?.arriveDate || order.legs.at(-1)?.date };
      const local = validatePassengers(data.passengers, { pax: order.pax, requirements: order.requirements, ...dates, lang, allowReference: true }), contact = validateContact(data.contact, lang);
      const errors = { ...local.errors, ...Object.fromEntries(Object.entries(contact.errors).map(([k, v]) => [`contact.${k}`, v])), ...(data.save && !data.save.consent ? { 'save.consent': t('booking.v.saveConsent') } : {}) };
      if (showErrors(passengers, errors, local.warnings)) return;
      run(e.submitter, async () => { const r = await go('passengers', data); if (r.savedTravellers) await loadSaved(); render(); if (r.savedTravellers) $('#bo-addons')?.insertAdjacentHTML('afterbegin', `<p class="notice" role="status">${esc(t('booking.saved.savedOk', { count: r.savedTravellers }))}</p>`); if (Object.keys(r.warnings || {}).length) { const w = Object.values(r.warnings).join(' '); $('#bo-addons')?.insertAdjacentHTML('afterbegin', `<p class="notice">${esc(w)}</p>`); } $('#bo-addons h2', body)?.setAttribute('tabindex', '-1'); $('#bo-addons h2', body)?.focus(); });
    };
    const addons = $('#bo-addons', body);
    if (addons) {
      showExtrasTotal(addons, order);
      addons.addEventListener('change', (e) => { if (e.target.matches('[data-extra]')) showExtrasTotal(addons, order); });
      // "Same for everyone": the first traveller's choices copied to the others for the same kind of extra and route.
      const same = $('[data-bo-same]', addons);
      if (same) same.onclick = () => {
        const extras = order.extras || [], first = extras.filter((x) => x.pax === 0);
        for (const src of first) {
          const value = addons.querySelector(`[data-extra="${CSS.escape(src.bookingCode)}"]`)?.value ?? '';
          for (const x of extras.filter((y) => y.pax !== 0 && y.kind === src.kind && y.from === src.from && y.to === src.to)) {
            const select = addons.querySelector(`[data-extra="${CSS.escape(x.bookingCode)}"]`);
            if (select && (value === '' || x.options.some((o) => o.code === value))) select.value = value;
          }
        }
        showExtrasTotal(addons, order);
      };
    }
    if (addons) addons.onsubmit = (e) => {
      e.preventDefault();
      const extras = readExtras(addons);
      run(e.submitter, async () => { await go('addons', { extras, insurance: $('[data-insurance]', addons).checked }); await go('recheck'); render(); $('#bo-sum-h', body)?.setAttribute('tabindex', '-1'); $('#bo-sum-h', body)?.focus(); });
    };
    const commit = $('#bo-commit', body);
    if (commit) commit.onsubmit = (e) => {
      e.preventDefault();
      const terms = $('[data-key="terms"]', commit).checked, cancellation = $('[data-key="cancellation"]', commit).checked;
      if (showErrors(commit, { ...(terms ? {} : { terms: t('booking.v.terms') }), ...(cancellation ? {} : { cancellation: t('booking.v.cancellation') }) })) return;
      const payload = { terms, cancellation, expectedTotal: order.price?.ils || order.price?.total?.value };
      run(e.submitter, async () => {
        if (order.online && config.online) { const r = await go('pay', payload); location.assign(r.redirectUrl); return; }
        await go('submit', payload); render(); $('.bo-done h2', body)?.setAttribute('tabindex', '-1'); $('.bo-done h2', body)?.focus();
      });
    };
    const on = (sel, fn) => { const el = $(sel, body); if (el) el.onclick = (e) => run(e.currentTarget, fn); };
    on('[data-bo-accept]', async () => { await go('accept-price'); render(); });
    on('[data-bo-recheck]', async () => { await go('recheck'); render(); });
    on('[data-bo-edit]', async () => { order = { ...order, status: 'draft' }; render(); });
    on('[data-bo-addons]', async () => { order = { ...order, status: 'details' }; render(); });
    on('[data-bo-repay]', async () => { const r = await go('pay', { terms: true, cancellation: true, expectedTotal: order.price?.ils }); location.assign(r.redirectUrl); });
    on('[data-bo-cancel]', async () => { if (!confirm(t('booking.cancelConfirm'))) return; await go('cancel'); render(); });
    on('[data-bo-print]', async () => window.print());
    const hotelForm = $('#bo-hotel', body);
    if (hotelForm) hotelForm.onsubmit = (e) => { e.preventDefault(); const v = (k) => $(`[data-key="hotel.${k}"]`, hotelForm).value; run(e.submitter, async () => { await go('hotel-request', { stars: v('stars'), board: v('board'), note: v('note') }); render(); $('.bo-hotel .notice', body)?.focus?.(); }); };
    const cancelForm = $('#bo-cancel-request', body);
    if (cancelForm) cancelForm.onsubmit = (e) => { e.preventDefault(); run(e.submitter, async () => { await go('cancel-request', { reason: $('[data-key="reason"]', cancelForm).value }); render(); }); };
  }
  await load();
}

// ---------------------------------------------------------------- my orders
export async function ordersListHtml() {
  const local = rememberedOrders();
  const [mine, found] = await Promise.all([fetch('/api/orders/mine', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : { orders: [] })).catch(() => ({ orders: [] })),
    local.length ? fetch('/api/orders/lookup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: local.map(({ id, token }) => ({ id, token })) }) }).then((r) => (r.ok ? r.json() : { orders: [] })).catch(() => ({ orders: [] })) : { orders: [] }]);
  const all = [...mine.orders, ...found.orders.filter((o) => !mine.orders.some((m) => m.id === o.id))].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  if (!all.length) return `<p>${t('booking.orders.none')}</p>`;
  return `<ul class="account-list bo-orders">${all.map((o) => `<li><div><strong><bdi dir="ltr">${esc(o.legs.map((l) => l.from).concat(o.legs.at(-1)?.to || []).join(' → '))}</bdi></strong><span class="micro-copy">${esc(day(o.legs[0]?.date))} · ${t('booking.ref')} <bdi dir="ltr">${esc(o.ref)}</bdi>${o.supplier?.pnr ? ` · PNR <bdi dir="ltr">${esc(o.supplier.pnr)}</bdi>` : ''}${o.price?.ils ? ` · <bdi dir="ltr">${esc(ils(o.price.ils))}</bdi>` : ''}</span></div>
    <span class="account-badge bo-badge" data-group="${esc(o.group)}">${t(`booking.group.${o.group}`)}</span><a class="button secondary" href="#/book/${esc(o.id)}">${t('booking.orders.open')}</a></li>`).join('')}</ul>`;
}
export const ordersSectionHtml = () => `<section class="surface-panel" id="acc-orders" aria-labelledby="acc-orders-title"><div class="panel-heading"><h2 id="acc-orders-title">${t('booking.orders.title')}</h2></div><div data-orders><p class="micro-copy">${t('booking.loading')}</p></div></section>`;
export async function fillOrders(root) { const box = root.querySelector('[data-orders]'); if (box) box.innerHTML = await ordersListHtml(); }
async function ordersPage({ view, footer, bread, heading }) {
  view.innerHTML = `<div class="route-width">${bread(t('booking.orders.title'))}${heading(t('booking.kicker'), t('booking.orders.title'), t('booking.orders.lead'))}${ordersSectionHtml()}</div>${footer}`;
  await accountReady.catch(() => {});
  await fillOrders(view);
}

export function bookingRoutes() { return { book: page, orders: ordersPage }; }
