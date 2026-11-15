// Booking wizard #/book/<orderId> and "my orders" #/orders (spec 25 §6). The server holds the order; this page only
// renders the step its status calls for, sends what the customer typed, and re-reads. Every server value is escaped.
//   passengers + contact → add-ons (bags, Harel insurance on request) → summary (re-checked price, terms) →
//   request: "send booking request" · mock/live: hosted payment page → processing → confirmation
import { t, lang, fmtDate, fmtDateTime, fmtMoney } from './i18n.mjs';
import { formatIls, toIls, getFx, loadFx } from './fx.mjs';
import { validatePassengers, validateContact, PTC_ORDER, STATUS_GROUP } from './booking-core.mjs';
import { rememberOrder, orderToken, rememberedOrders, bookingConfig } from './booking-client.mjs';
import { account, ready as accountReady } from './account.mjs';

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const POLL_MS = 2500, POLL_MAX = 60;
// ISO 3166-1 alpha-2 codes; names come from Intl.DisplayNames in the page language.
const COUNTRIES = 'AD AE AF AG AI AL AM AO AR AT AU AW AZ BA BB BD BE BF BG BH BI BJ BM BN BO BR BS BT BW BY BZ CA CD CF CG CH CI CL CM CN CO CR CU CV CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FM FR GA GB GD GE GH GM GN GQ GR GT GW GY HK HN HR HT HU ID IE IL IN IQ IR IS IT JM JO JP KE KG KH KI KM KN KP KR KW KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MH MK ML MM MN MO MR MT MU MV MW MX MY MZ NA NE NG NI NL NO NP NR NZ OM PA PE PG PH PK PL PS PT PW PY QA RO RS RU RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SY SZ TD TG TH TJ TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VN VU WS XK YE ZA ZM ZW'.split(' ');
let countryOptions = '';
function countries(selected = '') {
  if (!countryOptions) {
    let names; try { names = new Intl.DisplayNames([lang === 'en' ? 'en' : 'he'], { type: 'region' }); } catch { names = { of: (c) => c }; }
    const list = COUNTRIES.map((c) => [c, names.of(c) || c]).sort((a, b) => (a[0] === 'IL' ? -1 : b[0] === 'IL' ? 1 : a[1].localeCompare(b[1], lang)));
    countryOptions = list.map(([c, n]) => `<option value="${c}">${esc(n)}</option>`).join('');
  }
  return `<option value="">${t('booking.choose')}</option>` + (selected ? countryOptions.replace(`value="${selected}"`, `value="${selected}" selected`) : countryOptions);
}

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
function passengersForm(order) {
  const req = order.requirements || {}, types = PTC_ORDER.flatMap((p) => Array.from({ length: order.pax?.[p] || 0 }, () => p)), prev = order.passengers || [];
  const contact = order.contact || (account.user ? { name: account.user.name, email: account.user.email, phone: account.user.phone } : {});
  const person = (ptc, i) => {
    const p = prev[i] || {}, d = p.document || {};
    const docFields = req.document ? `<div class="lead-grid">
      ${req.documentTypes?.length > 1 ? field(`${i}.document.type`, t('booking.f.docType'), `<select <CONTROL>>${req.documentTypes.map((ty) => `<option value="${ty}" ${d.type === ty ? 'selected' : ''}>${t(`booking.doc.${ty}`)}</option>`).join('')}</select>`) : ''}
      ${field(`${i}.document.number`, t('booking.f.docNumber'), `<input <CONTROL> dir="ltr" autocomplete="off" inputmode="text" maxlength="20" value="" required>`, { hint: d.number ? t('booking.f.docAgain', { masked: esc(d.number) }) : '' })}
      ${field(`${i}.document.expiryDate`, t('booking.f.docExpiry'), `<input <CONTROL> type="date" value="${esc(d.expiryDate || '')}" required>`)}
      ${field(`${i}.document.nationality`, t('booking.f.nationality'), `<select <CONTROL> required>${countries(d.nationality || '')}</select>`)}
      ${field(`${i}.document.issuingCountry`, t('booking.f.issuingCountry'), `<select <CONTROL>>${countries(d.issuingCountry || '')}</select>`, { optional: true, hint: t('booking.f.issuingHint') })}
      ${req.documentIssueDate ? field(`${i}.document.issueDate`, t('booking.f.docIssue'), `<input <CONTROL> type="date" value="${esc(d.issueDate || '')}">`) : ''}</div>` : '';
    const dobRequired = req.birthDate?.[ptc] !== false;
    return `<fieldset class="bo-person"><legend>${t(`booking.person.${ptc}`, { n: i + 1 })}</legend>
      <div class="lead-field lead-choices" data-for="${i}.gender" role="radiogroup" aria-label="${t('booking.f.gender')}"><span class="bo-label">${t('booking.f.gender')}</span>
        ${['f', 'm'].map((g) => `<label class="lead-chip"><input type="radio" name="g${i}" value="${g}" data-key="${i}.gender" ${p.gender === g ? 'checked' : ''}><span>${t(`booking.gender.${g}`)}</span></label>`).join('')}<p class="lead-error" hidden></p></div>
      <div class="lead-grid">
        ${field(`${i}.firstName`, t('booking.f.firstName'), `<input <CONTROL> dir="ltr" autocomplete="${i ? 'off' : 'given-name'}" autocapitalize="characters" spellcheck="false" maxlength="50" value="${esc(p.firstName || '')}" required>`, { hint: i ? '' : t('booking.f.latinHint') })}
        ${field(`${i}.lastName`, t('booking.f.lastName'), `<input <CONTROL> dir="ltr" autocomplete="${i ? 'off' : 'family-name'}" autocapitalize="characters" spellcheck="false" maxlength="50" value="${esc(p.lastName || '')}" required>`)}
        ${field(`${i}.birthDate`, t('booking.f.birthDate'), `<input <CONTROL> type="date" value="${esc(p.birthDate || '')}" ${dobRequired ? 'required' : ''}>`, { optional: !dobRequired, hint: ptc === 'ADT' ? '' : t(`booking.f.ageHint.${ptc}`) })}
      </div>${docFields}</fieldset>`;
  };
  return `${tripCard(order)}<form class="surface-panel lead-form bo-form" id="bo-passengers" novalidate>
    <h2>${t('booking.passengers.title')}</h2><p class="micro-copy">${t('booking.passengers.lead')}</p>
    ${req.document ? '' : `<p class="notice">${t('booking.passengers.noDocument')}</p>`}
    ${types.map(person).join('')}
    <fieldset class="bo-person"><legend>${t('booking.contact.title')}</legend><div class="lead-grid">
      ${field('contact.name', t('booking.f.contactName'), `<input <CONTROL> autocomplete="name" maxlength="80" value="${esc(contact.name || '')}" required>`)}
      ${field('contact.email', t('booking.f.email'), `<input <CONTROL> type="email" dir="ltr" autocomplete="email" value="${esc(contact.email || '')}" required>`)}
      ${field('contact.phone', t('booking.f.phone'), `<input <CONTROL> type="tel" dir="ltr" autocomplete="tel" value="${esc(contact.phone || '')}" required>`, { hint: t('booking.f.phoneHint') })}
    </div></fieldset>
    <p class="lead-form-error bo-form-error" role="alert" hidden></p>
    <div class="bo-actions"><button class="button yellow" type="submit">${t('booking.passengers.next')}</button><button class="text-button" type="button" data-bo-cancel>${t('booking.cancel')}</button></div>
    <p class="micro-copy">${t('booking.privacy')} <a href="#/privacy">${t('booking.privacyLink')}</a></p></form>`;
}
function readPassengers(form, order) {
  const types = PTC_ORDER.flatMap((p) => Array.from({ length: order.pax?.[p] || 0 }, () => p));
  const v = (key) => form.querySelector(`[data-key="${CSS.escape(key)}"]`)?.value?.trim() ?? '';
  const passengers = types.map((ptc, i) => ({ gender: form.querySelector(`input[name="g${i}"]:checked`)?.value || '', firstName: v(`${i}.firstName`), lastName: v(`${i}.lastName`), birthDate: v(`${i}.birthDate`),
    ...(order.requirements?.document ? { document: { type: v(`${i}.document.type`) || order.requirements.documentTypes?.[0], number: v(`${i}.document.number`), expiryDate: v(`${i}.document.expiryDate`), nationality: v(`${i}.document.nationality`), issuingCountry: v(`${i}.document.issuingCountry`), issueDate: v(`${i}.document.issueDate`) } } : {}) }));
  return { passengers, contact: { name: v('contact.name'), email: v('contact.email'), phone: v('contact.phone') } };
}

// ---------------------------------------------------------------- step 2: add-ons
function addonsForm(order) {
  const fx = getFx(), approx = (price) => { const v = toIls(price, fx); return v ? ` (≈${ils(Math.ceil(v))})` : ''; };
  const bags = order.bags || [];
  return `${tripCard(order)}<form class="surface-panel lead-form bo-form" id="bo-addons" novalidate><h2>${t('booking.addons.title')}</h2>
    ${bags.length ? `<h3>${t('booking.addons.bags')}</h3><p class="micro-copy">${t('booking.addons.bagsLead')}</p><div class="lead-grid">${bags.map((b) => field(`bag.${b.route}`, t('booking.addons.bagFor', { from: `<bdi dir="ltr">${esc(b.from)}</bdi>`, to: `<bdi dir="ltr">${esc(b.to)}</bdi>`, count: b.travellers }),
      `<select <CONTROL> data-bag="${esc(b.route)}"><option value="">${t('booking.addons.noBag')}</option>${b.options.map((o) => `<option value="${esc(o.code)}" ${order.addons?.bags?.[b.route] === o.code ? 'selected' : ''}>${esc(o.label)} · ${esc(original(o.price))}${esc(approx(o.price))} ${t('booking.addons.perTraveller')}</option>`).join('')}</select>`)).join('')}</div>`
      : `<p>${t('booking.addons.noBags')}</p>`}
    <h3>${t('booking.addons.insurance')}</h3>
    <label class="lead-check bo-insurance"><input type="checkbox" data-insurance ${order.addons?.insurance ? 'checked' : ''}><span><strong>${t('booking.addons.insuranceLabel')}</strong><br><span class="micro-copy">${t('booking.addons.insuranceNote')}</span></span></label>
    <p class="lead-form-error bo-form-error" role="alert" hidden></p>
    <div class="bo-actions"><button class="button yellow" type="submit">${t('booking.addons.next')}</button><button class="text-button" type="button" data-bo-edit>${t('booking.editPassengers')}</button></div></form>`;
}

// ---------------------------------------------------------------- step 3: summary + terms + pay / submit
function policyHtml(order) {
  const refund = order.nonRefundable === true ? t('booking.policy.nonRefundable') : order.nonRefundable === false ? t('booking.policy.refundable') : t('booking.policy.unknown');
  return `<section class="bo-policy" aria-labelledby="bo-policy-h"><h3 id="bo-policy-h">${t('booking.policy.title')}</h3><ul><li>${refund}</li><li>${t('booking.policy.law')}</li><li>${t('booking.policy.fees')}</li></ul>
    ${order.disclaimer ? `<p class="micro-copy">${esc(order.disclaimer)}</p>` : ''}</section>`;
}
function summaryHtml(order, config) {
  const changed = order.status === 'price_changed' && order.priceChange, online = order.online && config.online;
  const bagsChosen = (order.bags || []).filter((b) => order.addons?.bags?.[b.route]).map((b) => { const o = b.options.find((x) => x.code === order.addons.bags[b.route]); return `<li>${t('booking.summary.bag', { from: `<bdi dir="ltr">${esc(b.from)}</bdi>`, to: `<bdi dir="ltr">${esc(b.to)}</bdi>`, label: esc(o?.label || ''), count: b.travellers })}</li>`; }).join('');
  const lines = (order.items || []).map((i) => `<li><span>${t(`booking.pax.${i.ptc}`, { count: i.count })}</span><bdi dir="ltr">${esc(original({ value: (i.fullFare + (i.serviceFee || 0)), currency: i.currency }))} × ${i.count}</bdi></li>`).join('');
  return `${tripCard(order)}<section class="surface-panel bo-summary" aria-labelledby="bo-sum-h"><h2 id="bo-sum-h">${t('booking.summary.title')}</h2>
    ${changed ? `<div class="bo-alert" role="alert"><strong>${t('booking.summary.changedTitle')}</strong><p>${t('booking.summary.changed', { from: `<bdi dir="ltr">${esc(changed.from ? ils(changed.from) : original(changed.fromOriginal))}</bdi>`, to: `<bdi dir="ltr">${esc(changed.to ? ils(changed.to) : original(changed.toOriginal))}</bdi>` })}</p><div class="bo-actions"><button class="button yellow" type="button" data-bo-accept>${t('booking.summary.accept')}</button><a class="button secondary" href="#/">${t('booking.summary.searchAgain')}</a></div></div>` : ''}
    ${order.status === 'payment_failed' ? `<p class="bo-alert" role="alert">${t('booking.summary.paymentFailed')}</p>` : ''}
    <div class="bo-sum-grid"><div>
      <h3>${t('booking.summary.travellers')}</h3><ul class="bo-plain">${order.passengers.map((p) => `<li><bdi dir="ltr">${esc(p.firstName)} ${esc(p.lastName)}</bdi> · ${t(`booking.ptc.${p.ptc}`)}${p.birthDate ? ' · ' + esc(fmtDate(p.birthDate)) : ''}${p.document ? ` · ${t(`booking.doc.${p.document.type}`)} <bdi dir="ltr">${esc(p.document.number)}</bdi>` : ''}</li>`).join('')}</ul>
      <h3>${t('booking.summary.contact')}</h3><p>${esc(order.contact?.name)} · <bdi dir="ltr">${esc(order.contact?.email)}</bdi> · <bdi dir="ltr">${esc(order.contact?.phone)}</bdi></p>
      ${bagsChosen ? `<h3>${t('booking.summary.extras')}</h3><ul class="bo-plain">${bagsChosen}</ul>` : ''}
      ${order.addons?.insurance ? `<p class="soft-notice">${t('booking.summary.insurance')}</p>` : ''}
      <div class="bo-actions"><button class="text-button" type="button" data-bo-edit>${t('booking.editPassengers')}</button><button class="text-button" type="button" data-bo-addons>${t('booking.editAddons')}</button></div>
    </div><div>${priceBox(order)}<details class="bo-breakdown"><summary>${t('booking.summary.breakdown')}</summary><ul class="bo-plain">${lines}${order.price?.bags ? `<li><span>${t('booking.summary.bags')}</span><bdi dir="ltr">${esc(original({ value: order.price.bags, currency: order.price.total.currency }))}</bdi></li>` : ''}</ul><p class="micro-copy">${t('booking.summary.fxNote')}</p></details>
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
  return main + tripCard(order) + links + cancel + timeline;
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
  let order, polls = 0;
  async function load() {
    try { order = (await api('GET', `/api/orders/${id}`, null, id)).order; render(); }
    catch (error) { body.innerHTML = `<section class="surface-panel"><h2>${t('booking.notFound.title')}</h2><p>${t(error.status === 404 ? 'booking.notFound.body' : 'booking.err.generic')}</p><a class="button secondary" href="#/orders">${t('booking.myOrders')}</a></section>`; }
  }
  function render() {
    clearTimeout(poll);
    if (!location.hash.startsWith(`#/book/${id}`)) return;
    const step = stepOf(order);
    body.innerHTML = stepper(step) + (step === 'passengers' ? passengersForm(order) : step === 'addons' ? addonsForm(order) : step === 'summary' ? summaryHtml(order, config) : doneHtml(order));
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
    if (passengers) passengers.onsubmit = (e) => {
      e.preventDefault();
      const data = readPassengers(passengers, order), dates = { travelStart: order.legs[0]?.date, travelEnd: order.legs.at(-1)?.arriveDate || order.legs.at(-1)?.date };
      const local = validatePassengers(data.passengers, { pax: order.pax, requirements: order.requirements, ...dates, lang }), contact = validateContact(data.contact, lang);
      const errors = { ...local.errors, ...Object.fromEntries(Object.entries(contact.errors).map(([k, v]) => [`contact.${k}`, v])) };
      if (showErrors(passengers, errors, local.warnings)) return;
      run(e.submitter, async () => { const r = await go('passengers', data); render(); if (Object.keys(r.warnings || {}).length) { const w = Object.values(r.warnings).join(' '); $('#bo-addons')?.insertAdjacentHTML('afterbegin', `<p class="notice">${esc(w)}</p>`); } $('#bo-addons h2', body)?.setAttribute('tabindex', '-1'); $('#bo-addons h2', body)?.focus(); });
    };
    const addons = $('#bo-addons', body);
    if (addons) addons.onsubmit = (e) => {
      e.preventDefault();
      const bags = Object.fromEntries($$('[data-bag]', addons).map((s) => [s.dataset.bag, s.value]).filter(([, v]) => v));
      run(e.submitter, async () => { await go('addons', { bags, insurance: $('[data-insurance]', addons).checked }); await go('recheck'); render(); $('#bo-sum-h', body)?.setAttribute('tabindex', '-1'); $('#bo-sum-h', body)?.focus(); });
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
