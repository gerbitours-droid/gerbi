// Lead generation: the contact page (#/contact), tailor-made trips (#/tailor-made) and the
// "didn't find it? leave details" call to action under flight results. Submits to POST /api/leads.
import { validateLead, CHANNELS, FLEXIBILITY, BUDGETS, STYLES, LIMITS, consentText, optionLabel } from './leads-validate.mjs';
import { t, lang, locale, errorText } from './i18n.mjs';
import { resolvePlace } from './places.mjs';
import { parseSearchLink } from './saved-flights.mjs';
import { tailorAssistHtml, mountTailorAssist } from './ai-client.mjs';

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const heDate = (day) => new Date(day + 'T12:00:00').toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' });
const placeName = (code) => resolvePlace(code)?.label || code;

// One labelled field with a hint and an inline error slot, both wired through aria-describedby.
function field(name, label, control, { hint = '', optional = false } = {}) {
  const ids = [hint && `${name}-hint`, `${name}-error`].filter(Boolean).join(' ');
  return `<div class="lead-field" data-field="${name}"><label for="lead-${name}">${label}${optional ? ` <span class="lead-optional">${t('leads.optional')}</span>` : ''}</label>${control.replace('<CONTROL', `id="lead-${name}" name="${name}" aria-describedby="${ids}"`)}${hint ? `<p class="lead-hint" id="${name}-hint">${hint}</p>` : ''}<p class="lead-error" id="${name}-error" hidden></p></div>`;
}
const input = (attrs) => `<input <CONTROL ${attrs}>`;

function contactFields(prefill = {}) {
  return `<div class="lead-grid">
   ${field('name', t('leads.field.name'), input(`type="text" autocomplete="name" maxlength="${LIMITS.name}" required value="${esc(prefill.name)}"`))}
   ${field('phone', t('leads.field.phone'), input('type="tel" inputmode="tel" autocomplete="tel" dir="ltr" maxlength="20" required placeholder="050-1234567"'), { hint: t('leads.hint.phone') })}
   ${field('email', t('leads.field.email'), input(`type="email" autocomplete="email" dir="ltr" maxlength="${LIMITS.email}" placeholder="name@example.com"`), { optional: true })}
  </div>
  <fieldset class="lead-field lead-choices" data-field="channel" aria-describedby="channel-error"><legend>${t('leads.field.channel')}</legend>
   ${Object.keys(CHANNELS).map((value, i) => `<label class="lead-chip"><input type="radio" name="channel" value="${value}" ${i === 0 ? 'checked' : ''}><span>${optionLabel('channel', value)}</span></label>`).join('')}
   <p class="lead-error" id="channel-error" hidden></p></fieldset>`;
}

function consentFields() {
  return `<div class="lead-consent">
   <div class="lead-field" data-field="consent"><label class="lead-check"><input type="checkbox" id="lead-consent" name="consent" required aria-describedby="consent-hint consent-error"><span>${consentText()}</span></label>
    <p class="lead-hint" id="consent-hint">${t('leads.consentHint')}</p>
    <p class="lead-error" id="consent-error" hidden></p></div>
   <label class="lead-check lead-marketing"><input type="checkbox" name="marketing"><span>${t('leads.marketing')}</span></label>
  </div>
  <div class="lead-trap" aria-hidden="true"><label>${t('leads.trap')}<input name="website" tabindex="-1" autocomplete="off"></label></div>
  <p class="lead-form-error" role="alert" hidden></p>`;
}

function collect(form, type, extra) {
  const data = new FormData(form), get = (name) => String(data.get(name) ?? '');
  const base = { type, name: get('name'), phone: get('phone'), email: get('email').trim(), channel: get('channel'), consent: data.get('consent') === 'on', marketing: data.get('marketing') === 'on', website: get('website'), lang, ...extra };
  if (type === 'contact') return { ...base, message: get('message') };
  return { ...base, destinations: get('destinations'), start: get('start'), end: get('end'), flexibility: get('flexibility'), adults: get('adults'), children: get('children'), budget: get('budget'), styles: data.getAll('styles').map(String), notes: get('notes') };
}

function showErrors(form, errors) {
  for (const box of form.querySelectorAll('[data-field]')) {
    const name = box.dataset.field, message = errors[name], slot = box.querySelector('.lead-error');
    if (slot) { slot.textContent = message || ''; slot.hidden = !message; }
    box.classList.toggle('invalid', Boolean(message));
    for (const control of box.querySelectorAll('input,select,textarea')) if (control.type !== 'radio' && control.type !== 'checkbox' || control.name === 'consent') control.toggleAttribute('aria-invalid', Boolean(message));
  }
}
const firstInvalid = (form) => form.querySelector('[data-field].invalid input:not([type=radio]), [data-field].invalid select, [data-field].invalid textarea, [data-field].invalid input[type=radio]:checked, [data-field].invalid input[type=radio]');

function successPanel(type, lead, reference, channelLabel) {
  const steps = type === 'tailor'
    ? [t('leads.success.tailor1'), t('leads.success.tailor2', { channel: channelLabel }), t('leads.success.tailor3')]
    : [t('leads.success.contact1'), t('leads.success.contact2', { channel: channelLabel }), t('leads.success.contact3')];
  return `<div class="lead-success" tabindex="-1"><span class="lead-success-icon" aria-hidden="true">✓</span><h2>${t('leads.success.title', { name: esc(lead.name) })}</h2><p>${t('leads.success.ref', { ref: `<strong dir="ltr">${esc(reference)}</strong>` })}</p><h3>${t('leads.success.next')}</h3><ol>${steps.map((s) => `<li>${s}</li>`).join('')}</ol><div class="lead-actions"><a class="button yellow" href="#/">${t('leads.success.home')}</a><button type="button" class="button secondary" data-lead-again>${t('leads.success.again')}</button></div></div>`;
}

function wire(form, type, extra, onAgain) {
  let tried = false;
  const errorsNow = () => validateLead(collect(form, type, extra), { today: today() }).errors;
  form.addEventListener('input', () => { if (tried) showErrors(form, errorsNow()); });
  form.addEventListener('change', () => { if (tried) showErrors(form, errorsNow()); });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    tried = true;
    const formError = form.querySelector('.lead-form-error'); formError.hidden = true;
    const payload = collect(form, type, extra), errors = validateLead(payload, { today: today() }).errors;
    showErrors(form, errors);
    if (Object.keys(errors).length) { firstInvalid(form)?.focus(); return; }
    const button = form.querySelector('[type=submit]'), label = button.textContent;
    button.disabled = true; button.setAttribute('aria-busy', 'true'); button.textContent = t('leads.sending');
    try {
      const response = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json().catch(() => ({}));
      if (response.status === 400 && data.fields) { showErrors(form, data.fields); firstInvalid(form)?.focus(); return; }
      if (!response.ok) throw new Error(lang === 'he' ? data.message || t('leads.err.send') : data.error ? errorText(data.error, data.message, 'leads') : t('leads.err.send'));
      const { lead } = validateLead(payload, { today: today() });
      const host = form.parentElement;
      host.innerHTML = successPanel(type, lead, data.id || '', t(`leads.channelIn.${lead.channel}`));
      host.querySelector('.lead-success').focus();
      host.querySelector('[data-lead-again]').onclick = onAgain;
    } catch (error) {
      formError.textContent = error instanceof TypeError ? t('core.err.network') : error.message;
      formError.hidden = false;
    } finally { if (button.isConnected) { button.disabled = false; button.removeAttribute('aria-busy'); button.textContent = label; } }
  });
}

function quickLinks(contact) {
  const links = [];
  if (/^\d{8,15}$/.test(contact?.whatsapp || '')) links.push(`<a class="lead-quick whatsapp" href="https://wa.me/${contact.whatsapp}" target="_blank" rel="noopener">${t('leads.quick.whatsapp')}<small>${t('leads.quick.whatsappNow')}</small></a>`);
  if (/^\+?\d{7,15}$/.test(contact?.phone || '')) links.push(`<a class="lead-quick" href="tel:${contact.phone}">${t('leads.quick.phone')}<small dir="ltr">${esc(contact.phone)}</small></a>`);
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact?.email || '')) links.push(`<a class="lead-quick" href="mailto:${contact.email}">${t('leads.quick.email')}<small dir="ltr">${esc(contact.email)}</small></a>`);
  return links.length ? `<div class="lead-quick-links">${links.join('')}</div>` : `<p class="micro-copy">${t('leads.quick.none')}</p>`;
}

export function leadRoutes({ contact = {} } = {}) {
  function contactPage({ view, footer, bread, heading }) {
    const render = () => {
      view.innerHTML = `<div class="route-width">${bread(t('leads.contact.crumb'))}${heading(t('leads.contact.crumb'), t('leads.contact.title'), t('leads.contact.sub'))}
      <div class="lead-layout"><section class="surface-panel lead-panel" aria-labelledby="lead-form-title"><h2 id="lead-form-title">${t('leads.form.title')}</h2><p class="micro-copy">${t('leads.form.required')}</p>
       <form id="lead-form" class="lead-form" novalidate>${contactFields()}
        ${field('message', t('leads.contact.message'), `<textarea <CONTROL maxlength="${LIMITS.message}" rows="5" placeholder="${t('leads.contact.messagePlaceholder')}"></textarea>`, { optional: true, hint: t('leads.contact.messageHint') })}
        ${consentFields()}<button type="submit" class="button yellow full-width">${t('leads.contact.submit')}</button></form></section>
       <aside class="lead-aside"><div class="surface-panel"><span class="eyebrow">${t('leads.aside.direct')}</span><h2>${t('leads.contact.talkNow')}</h2>${quickLinks(contact)}</div>
        <div class="help-card"><h2>${t('leads.contact.special')}</h2><p>${t('leads.contact.specialText')}</p><a class="button yellow" href="#/tailor-made">${t('leads.contact.specialCta')}</a></div>
        <p class="micro-copy">${t('leads.contact.faq')}</p></aside></div></div>${footer}`;
      wire(view.querySelector('#lead-form'), 'contact', { source: '/contact' }, render);
    };
    render();
  }

  function tailorPage({ view, footer, bread, heading }) {
    const params = new URLSearchParams(location.hash.split('?')[1] || '');
    const code = (v) => (/^[A-Z]{3}$/.test(v || '') ? v : ''), day = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v || '') && v >= today() ? v : '');
    const count = (v, min, max, fallback) => { const n = Number(v); return Number.isInteger(n) && n >= min && n <= max && v !== null && v !== '' ? n : fallback; };
    const fromResults = params.get('src') === 'flight-results';
    const context = fromResults ? { from: code(params.get('from')), to: code(params.get('to')), depart: day(params.get('depart')), return: day(params.get('return')), adults: count(params.get('adults'), 0, 9, null), children: count(params.get('children'), 0, 8, null), results: count(params.get('results'), 0, 10000, null) } : null;
    const prefill = { destinations: context?.to ? placeName(context.to) : '', start: context?.depart || '', end: context?.return || '', adults: context?.adults || 2, children: context?.children ?? 0 };
    const render = () => {
      view.innerHTML = `<div class="route-width">${bread(t('leads.tailor.crumb'))}${heading(t('leads.tailor.crumb'), fromResults ? t('leads.tailor.titleResults') : t('leads.tailor.title'), fromResults ? t('leads.tailor.subResults') : t('leads.tailor.sub'))}
      ${fromResults && context?.to ? `<div class="soft-notice lead-context"><p><strong>${t('leads.tailor.fromSearch')}</strong> ${esc(placeName(context.from || 'TLV'))} ${t('leads.tailor.arrow')} ${esc(placeName(context.to))}${context.depart ? ` · ${esc(heDate(context.depart))}${context.return ? t('leads.tailor.until') + esc(heDate(context.return)) : ''}` : ''}${t('leads.tailor.prefilled')}</p></div>` : ''}
      <div class="lead-layout"><section class="surface-panel lead-panel" aria-labelledby="lead-form-title"><h2 id="lead-form-title">${t('leads.tailor.formTitle')}</h2><p class="micro-copy">${t('leads.tailor.required')}</p>
       <form id="lead-form" class="lead-form" novalidate>
        ${tailorAssistHtml()}
        <h3 class="lead-step">${t('leads.tailor.step1')}</h3>
        ${field('destinations', t('leads.tailor.destinations'), input(`type="text" maxlength="${LIMITS.destinations}" required value="${esc(prefill.destinations)}" placeholder="${t('leads.tailor.destinationsPlaceholder')}"`), { hint: t('leads.tailor.destinationsHint') })}
        <div class="lead-grid">
         ${field('start', t('leads.tailor.start'), input(`type="date" min="${today()}" value="${prefill.start}"`), { optional: true })}
         ${field('end', t('leads.tailor.end'), input(`type="date" min="${today()}" value="${prefill.end}"`), { optional: true })}
         ${field('flexibility', t('leads.tailor.flexibility'), `<select <CONTROL>${Object.keys(FLEXIBILITY).map((v) => `<option value="${v}" ${v === (prefill.start ? 'days' : 'open') ? 'selected' : ''}>${optionLabel('flex', v)}</option>`).join('')}</select>`)}
        </div>
        <h3 class="lead-step">${t('leads.tailor.step2')}</h3>
        <div class="lead-grid">
         ${field('adults', t('leads.tailor.adults'), input(`type="number" inputmode="numeric" min="1" max="30" value="${prefill.adults}" required`))}
         ${field('children', t('leads.tailor.children'), input(`type="number" inputmode="numeric" min="0" max="20" value="${prefill.children}"`))}
         ${field('budget', t('leads.tailor.budget'), `<select <CONTROL>${Object.keys(BUDGETS).map((v) => `<option value="${v}" ${v === 'open' ? 'selected' : ''}>${optionLabel('budget', v)}</option>`).join('')}</select>`)}
        </div>
        <fieldset class="lead-field lead-choices"><legend>${t('leads.tailor.style')} <span class="lead-optional">${t('leads.tailor.styleNote')}</span></legend>
         ${Object.keys(STYLES).map((v) => `<label class="lead-chip"><input type="checkbox" name="styles" value="${v}"><span>${optionLabel('style', v)}</span></label>`).join('')}</fieldset>
        ${field('notes', t('leads.tailor.notes'), `<textarea <CONTROL maxlength="${LIMITS.notes}" rows="4" placeholder="${t('leads.tailor.notesPlaceholder')}"></textarea>`, { optional: true })}
        <h3 class="lead-step">${t('leads.tailor.step3')}</h3>
        ${contactFields()}
        ${consentFields()}<button type="submit" class="button yellow full-width">${t('leads.tailor.submit')}</button></form></section>
       <aside class="lead-aside"><div class="surface-panel"><span class="eyebrow">${t('leads.tailor.how')}</span><h2>${t('leads.tailor.steps')}</h2><ol class="lead-how"><li>${t('leads.tailor.how1')}</li><li>${t('leads.tailor.how2')}</li><li>${t('leads.tailor.how3')}</li></ol></div>
        <div class="surface-panel"><span class="eyebrow">${t('leads.aside.direct')}</span><h2>${t('leads.tailor.talk')}</h2>${quickLinks(contact)}<a class="lead-link" href="#/contact">${t('leads.tailor.contactLink')}</a></div></aside></div></div>${footer}`;
      wire(view.querySelector('#lead-form'), 'tailor', { source: fromResults ? '/flight-results' : '/tailor-made', context }, render);
      mountTailorAssist(view.querySelector('#lead-form'));
    };
    render();
  }
  return { contact: contactPage, 'tailor-made': tailorPage };
}

// Under flight results: a call to action that is prominent when there are few or no offers, quiet otherwise.
export function tailorLinkFromSearch(search, results) {
  const params = new URLSearchParams({ src: 'flight-results' });
  if (search) for (const [key, value] of Object.entries({ from: search.origin, to: search.to, depart: search.start, return: search.end, adults: search.adults, children: search.children })) if (value !== '' && value != null) params.set(key, String(value));
  params.set('results', String(results));
  return '#/tailor-made?' + params;
}
export function installResultsCta(host = document.querySelector('#live-results')) {
  if (!host || typeof MutationObserver === 'undefined') return;
  let queued = false;
  const update = () => {
    queued = false;
    if (host.hidden || !host.querySelector('.flight-list')) return;
    const results = host.querySelectorAll('[data-itinerary]').length, few = results < 3;
    const href = tailorLinkFromSearch(parseSearchLink(location.hash), results), variant = few ? 'strong' : 'quiet';
    let cta = host.querySelector('.lead-cta');
    if (cta && cta.dataset.variant === variant && cta.querySelector('a').getAttribute('href') === href) return;
    cta?.remove();
    host.insertAdjacentHTML('beforeend', few
      ? `<aside class="lead-cta strong" data-variant="strong" aria-label="${t('leads.cta.aria')}"><div><strong>${t('leads.cta.strongTitle')}</strong><p>${t('leads.cta.strongText')}</p></div><a class="button yellow" href="${esc(href)}">${t('leads.cta.strongButton')}</a></aside>`
      : `<aside class="lead-cta" data-variant="quiet" aria-label="${t('leads.cta.aria')}"><p><strong>${t('leads.cta.quietTitle')}</strong> ${t('leads.cta.quietText')}</p><a class="button secondary" href="${esc(href)}">${t('leads.cta.quietButton')}</a></aside>`);
  };
  new MutationObserver(() => { if (!queued) { queued = true; requestAnimationFrame(update); } }).observe(host, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
}
