// Saved travellers (spec 25 §6.5, customer area spec 17): profiles a signed-in customer keeps for the next booking —
// self and family: names as in the passport, gender, birth date, the passport, contact phone/email.
// The server seals them (AES-256-GCM) and only ever returns the passport number masked (•••123); a booking that uses a
// saved traveller sends "use the saved passport" and the server fills the number in itself.
//   account page: travellersSectionHtml() + wireTravellers(view)   ·   booking wizard: travellerPicker(), fillFromSaved()
import { t, lang, fmtDate } from './i18n.mjs';
import { validateTraveller } from './booking-core.mjs';

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

// ISO 3166-1 alpha-2 codes; names come from Intl.DisplayNames in the page language. Israel first.
const COUNTRIES = 'AD AE AF AG AI AL AM AO AR AT AU AW AZ BA BB BD BE BF BG BH BI BJ BM BN BO BR BS BT BW BY BZ CA CD CF CG CH CI CL CM CN CO CR CU CV CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FM FR GA GB GD GE GH GM GN GQ GR GT GW GY HK HN HR HT HU ID IE IL IN IQ IR IS IT JM JO JP KE KG KH KI KM KN KP KR KW KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MH MK ML MM MN MO MR MT MU MV MW MX MY MZ NA NE NG NI NL NO NP NR NZ OM PA PE PG PH PK PL PS PT PW PY QA RO RS RU RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SY SZ TD TG TH TJ TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VN VU WS XK YE ZA ZM ZW'.split(' ');
let countryOptions = '';
export function countries(selected = '') {
  if (!countryOptions) {
    let names; try { names = new Intl.DisplayNames([lang === 'en' ? 'en' : 'he'], { type: 'region' }); } catch { names = { of: (c) => c }; }
    const list = COUNTRIES.map((c) => [c, names.of(c) || c]).sort((a, b) => (a[0] === 'IL' ? -1 : b[0] === 'IL' ? 1 : a[1].localeCompare(b[1], lang)));
    countryOptions = list.map(([c, n]) => `<option value="${c}">${esc(n)}</option>`).join('');
  }
  return `<option value="">${t('booking.choose')}</option>` + (selected ? countryOptions.replace(`value="${selected}"`, `value="${selected}" selected`) : countryOptions);
}

async function call(method, path, payload) {
  const response = await fetch('/api/account' + path, { method, credentials: 'same-origin', cache: 'no-store', headers: payload ? { 'Content-Type': 'application/json' } : {}, body: payload ? JSON.stringify({ ...payload, lang }) : undefined });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}
// The signed-in customer's saved travellers (masked), or null (guest / unavailable).
export async function savedTravellers() {
  const { ok, data } = await call('GET', '/travellers');
  return ok && Array.isArray(data.travellers) ? data.travellers : null;
}
const nameOf = (x) => `${x.firstName} ${x.lastName}`;

// ---------------------------------------------------------------- booking wizard
export function travellerPicker(i, saved, selected = '') {
  return `<div class="lead-field bo-pick"><label for="bo-pick-${i}">${t('booking.saved.pick')}</label><select id="bo-pick-${i}" data-pick-traveller="${i}"><option value="">${t('booking.saved.pickNone')}</option>${saved.map((x) => `<option value="${esc(x.id)}" ${x.id === selected ? 'selected' : ''}>${esc(nameOf(x))}${x.self ? ` · ${t('booking.saved.self')}` : x.label ? ` · ${esc(x.label)}` : ''}</option>`).join('')}</select></div>`;
}
// Fills passenger i of the wizard form from a saved traveller (or clears the link when null). The passport block is
// re-drawn with "use the saved passport •••123" instead of an empty number field.
export function fillFromSaved(form, i, traveller, { passportFields }) {
  const box = form.querySelector(`[data-person="${i}"]`);
  if (!box) return;
  const set = (key, value) => { const el = form.querySelector(`[data-key="${CSS.escape(key)}"]`); if (el && value !== undefined) el.value = value; };
  if (!traveller) { delete box.dataset.savedId; return; }
  box.dataset.savedId = traveller.id;
  const radio = form.querySelector(`input[name="g${i}"][value="${traveller.gender}"]`); if (radio) radio.checked = true;
  set(`${i}.firstName`, traveller.firstName); set(`${i}.lastName`, traveller.lastName); set(`${i}.birthDate`, traveller.birthDate);
  const doc = traveller.document, slot = box.querySelector(`[data-passport="${i}"]`);
  if (slot && doc) slot.outerHTML = passportFields(i, doc, { masked: doc.number, keepKind: 'saved' });
  else if (slot) slot.outerHTML = passportFields(i, {}, {});
  if (doc) { set(`${i}.document.issuingCountry`, doc.issuingCountry); set(`${i}.document.nationality`, doc.nationality); set(`${i}.document.issueDate`, doc.issueDate || ''); set(`${i}.document.expiryDate`, doc.expiryDate); }
  if (i === 0) for (const k of ['email', 'phone']) { const el = form.querySelector(`[data-key="contact.${k}"]`); if (el && !el.value && traveller[k]) el.value = traveller[k]; }
}

// ---------------------------------------------------------------- customer area section
function field(key, label, control, { hint = '', optional = false } = {}) {
  const id = 'st-' + key.replace(/\./g, '-');
  return `<div class="lead-field" data-for="${esc(key)}"><label for="${id}">${label}${optional ? ` <span class="lead-optional">${t('leads.optional')}</span>` : ''}</label>${control.replace('<CONTROL>', `id="${id}" data-key="${esc(key)}" aria-describedby="${id}-error${hint ? ` ${id}-hint` : ''}"`)}${hint ? `<p class="lead-hint" id="${id}-hint">${hint}</p>` : ''}<p class="lead-error" id="${id}-error" hidden></p></div>`;
}
export const travellersSectionHtml = () => `<section class="surface-panel account-section" id="acc-travellers" aria-labelledby="acc-travellers-title"><div class="panel-heading"><h2 id="acc-travellers-title">${t('booking.saved.title')}</h2><button type="button" class="button secondary" data-traveller-add>${t('booking.saved.add')}</button></div>
  <p class="micro-copy">${t('booking.saved.lead')}</p><div data-travellers aria-busy="true"><p class="micro-copy">${t('booking.loading')}</p></div><div data-traveller-form-slot></div></section>`;

function listHtml(list) {
  if (!list.length) return `<p>${t('booking.saved.none')}</p>`;
  return `<ul class="account-list st-list">${list.map((x) => `<li><div><strong><bdi dir="ltr">${esc(nameOf(x))}</bdi>${x.self ? ` <span class="account-badge">${t('booking.saved.self')}</span>` : x.label ? ` <span class="account-badge">${esc(x.label)}</span>` : ''}</strong>
    <span class="micro-copy">${t(`booking.gender.${x.gender}`)} · ${esc(fmtDate(x.birthDate))}${x.document ? ` · ${t('booking.doc.passport')} <bdi dir="ltr">${esc(x.document.number)}</bdi> · ${t('booking.summary.validUntil', { date: esc(fmtDate(x.document.expiryDate)) })}` : ` · ${t('booking.saved.noPassport')}`}</span></div>
    <div class="account-actions"><button type="button" class="button secondary" data-traveller-edit="${esc(x.id)}">${t('booking.saved.edit')}</button><button type="button" class="text-button" data-traveller-delete="${esc(x.id)}">${t('booking.saved.delete')}</button></div></li>`).join('')}</ul>`;
}
function formHtml(x = null) {
  const d = x?.document || {};
  return `<form class="lead-form st-form" data-traveller-form novalidate${x ? ` data-id="${esc(x.id)}"` : ''}><h3 tabindex="-1">${x ? t('booking.saved.editTitle', { name: `<bdi dir="ltr">${esc(nameOf(x))}</bdi>` }) : t('booking.saved.addTitle')}</h3>
    <div class="lead-field lead-choices" data-for="gender" role="radiogroup" aria-label="${t('booking.f.gender')}"><span class="bo-label">${t('booking.f.gender')}</span>${['f', 'm'].map((g) => `<label class="lead-chip"><input type="radio" name="st-g" value="${g}" data-key="gender" ${x?.gender === g ? 'checked' : ''}><span>${t(`booking.gender.${g}`)}</span></label>`).join('')}<p class="lead-error" hidden></p></div>
    <div class="lead-grid">
      ${field('firstName', t('booking.f.firstName'), `<input <CONTROL> dir="ltr" autocapitalize="characters" spellcheck="false" maxlength="50" value="${esc(x?.firstName || '')}" required>`, { hint: t('booking.f.latinHint') })}
      ${field('lastName', t('booking.f.lastName'), `<input <CONTROL> dir="ltr" autocapitalize="characters" spellcheck="false" maxlength="50" value="${esc(x?.lastName || '')}" required>`)}
      ${field('birthDate', t('booking.f.birthDate'), `<input <CONTROL> type="date" value="${esc(x?.birthDate || '')}" required>`)}
      ${field('label', t('booking.saved.label'), `<input <CONTROL> maxlength="40" value="${esc(x?.label || '')}" placeholder="${esc(t('booking.saved.labelHint'))}">`, { optional: true })}
    </div>
    <label class="lead-check"><input type="checkbox" data-key="self" ${x?.self ? 'checked' : ''}><span>${t('booking.saved.isSelf')}</span></label>
    <p class="bo-label">${t('booking.f.passportTitle')}</p>
    ${d.number ? `<label class="lead-check"><input type="checkbox" data-st-keep checked><span>${t('booking.f.useSaved', { masked: `<bdi dir="ltr">${esc(d.number)}</bdi>` })}</span></label>` : ''}
    <div class="lead-grid">
      ${field('document.number', t('booking.f.docNumber'), '<input <CONTROL> dir="ltr" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="20" value="">', { optional: !d.number, hint: t('booking.saved.passportOptional') })}
      ${field('document.issuingCountry', t('booking.f.issuingCountry'), `<select <CONTROL>>${countries(d.issuingCountry || '')}</select>`)}
      ${field('document.nationality', t('booking.f.nationality'), `<select <CONTROL>>${countries(d.nationality || '')}</select>`)}
      ${field('document.issueDate', t('booking.f.docIssue'), `<input <CONTROL> type="date" value="${esc(d.issueDate || '')}">`)}
      ${field('document.expiryDate', t('booking.f.docExpiry'), `<input <CONTROL> type="date" value="${esc(d.expiryDate || '')}">`)}
      ${field('phone', t('booking.f.phone'), `<input <CONTROL> type="tel" dir="ltr" maxlength="20" value="${esc(x?.phone || '')}">`, { optional: true })}
      ${field('email', t('booking.saved.email'), `<input <CONTROL> type="email" dir="ltr" maxlength="200" value="${esc(x?.email || '')}">`, { optional: true })}
    </div>
    <div class="lead-field" data-for="consent"><label class="lead-check"><input type="checkbox" data-key="consent" required><span>${t('booking.saved.consentText')}</span></label><p class="lead-error" hidden></p></div>
    <p class="lead-form-error" role="alert" hidden></p>
    <div class="account-actions"><button type="submit" class="button yellow">${t('booking.saved.save')}</button><button type="button" class="text-button" data-traveller-cancel>${t('booking.saved.cancel')}</button></div></form>`;
}
function readForm(form) {
  const v = (k) => form.querySelector(`[data-key="${CSS.escape(k)}"]`)?.value?.trim() ?? '';
  const keep = form.querySelector('[data-st-keep]')?.checked === true;
  return { gender: form.querySelector('input[name="st-g"]:checked')?.value || '', firstName: v('firstName'), lastName: v('lastName'), birthDate: v('birthDate'), label: v('label'), self: form.querySelector('[data-key="self"]').checked, phone: v('phone'), email: v('email'), consent: form.querySelector('[data-key="consent"]').checked,
    document: { number: v('document.number'), issuingCountry: v('document.issuingCountry'), nationality: v('document.nationality'), issueDate: v('document.issueDate'), expiryDate: v('document.expiryDate'), ...(keep && !v('document.number') ? { keep: true } : {}) } };
}
function showErrors(form, fields = {}) {
  $$('.lead-field', form).forEach((f) => { f.classList.remove('invalid'); const e = $('.lead-error', f); if (e) { e.hidden = true; e.textContent = ''; } });
  let first = null;
  for (const [key, message] of Object.entries(fields)) {
    const box = form.querySelector(`[data-for="${CSS.escape(key)}"]`);
    if (!box) { const top = $('.lead-form-error', form); top.hidden = false; top.textContent = message; continue; }
    box.classList.add('invalid'); const e = $('.lead-error', box); e.hidden = false; e.textContent = message; first ||= $('[data-key]', box);
  }
  first?.focus();
  return Boolean(first) || Object.keys(fields).length > 0;
}
export async function wireTravellers(view) {
  const section = $('#acc-travellers', view);
  if (!section) return;
  const box = $('[data-travellers]', section), slot = $('[data-traveller-form-slot]', section);
  let list = [];
  const paint = () => { box.removeAttribute('aria-busy'); box.innerHTML = listHtml(list); };
  const load = async () => {
    const { ok, data, status } = await call('GET', '/travellers').catch(() => ({ ok: false }));
    if (!box.isConnected) return;
    if (!ok) { box.removeAttribute('aria-busy'); box.innerHTML = `<p class="micro-copy">${t(status === 503 ? 'booking.saved.unavailable' : 'core.err.network')}</p>`; $('[data-traveller-add]', section).hidden = true; return; }
    list = data.travellers; paint();
  };
  const open = (x) => {
    slot.innerHTML = formHtml(x);
    const form = $('[data-traveller-form]', slot);
    $('h3', form).focus();
    $('[data-traveller-cancel]', form).onclick = () => { slot.innerHTML = ''; $('[data-traveller-add]', section).focus(); };
    form.onsubmit = async (e) => {
      e.preventDefault();
      const input = readForm(form), id = form.dataset.id || '';
      const local = validateTraveller(input, { lang, keepNumber: Boolean(id) });
      if (showErrors(form, local.errors)) return;
      const button = e.submitter; if (button) button.disabled = true;
      try {
        const { consent, ...traveller } = input;
        const { ok, data } = await call('POST', '/travellers', { ...(id ? { id } : {}), traveller, consent });
        if (!ok) { showErrors(form, data.fields || { form: data.message || t('booking.err.generic') }); return; }
        list = data.travellers; paint(); slot.innerHTML = `<p class="account-form-ok" role="status" tabindex="-1">${t('booking.saved.savedOne')}</p>`; $('p', slot).focus();
      } catch { showErrors(form, { form: t('core.err.network') }); } finally { if (button?.isConnected) button.disabled = false; }
    };
  };
  section.addEventListener('click', async (e) => {
    const el = (sel) => e.target.closest(sel);
    if (el('[data-traveller-add]')) open(null);
    else if (el('[data-traveller-edit]')) open(list.find((x) => x.id === el('[data-traveller-edit]').dataset.travellerEdit) || null);
    else if (el('[data-traveller-delete]')) {
      const x = list.find((y) => y.id === el('[data-traveller-delete]').dataset.travellerDelete);
      if (!x || !confirm(t('booking.saved.deleteConfirm', { name: nameOf(x) }))) return;
      const { ok, data } = await call('POST', '/travellers/delete', { id: x.id }).catch(() => ({ ok: false }));
      if (ok) { list = data.travellers; paint(); box.setAttribute('tabindex', '-1'); box.focus(); }
    }
  });
  await load();
}
