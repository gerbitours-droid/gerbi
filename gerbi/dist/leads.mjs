// Lead generation: the contact page (#/contact), tailor-made trips (#/tailor-made) and the
// "didn't find it? leave details" call to action under flight results. Submits to POST /api/leads.
import { validateLead, CHANNELS, FLEXIBILITY, BUDGETS, STYLES, LIMITS, CONSENT_TEXT } from './leads-validate.mjs';
import { resolvePlace } from './places.mjs';
import { parseSearchLink } from './saved-flights.mjs';
import { tailorAssistHtml, mountTailorAssist } from './ai-client.mjs';

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const heDate = (day) => new Date(day + 'T12:00:00').toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
const placeName = (code) => resolvePlace(code)?.label || code;

// One labelled field with a hint and an inline error slot, both wired through aria-describedby.
function field(name, label, control, { hint = '', optional = false } = {}) {
  const ids = [hint && `${name}-hint`, `${name}-error`].filter(Boolean).join(' ');
  return `<div class="lead-field" data-field="${name}"><label for="lead-${name}">${label}${optional ? ' <span class="lead-optional">(רשות)</span>' : ''}</label>${control.replace('<CONTROL', `id="lead-${name}" name="${name}" aria-describedby="${ids}"`)}${hint ? `<p class="lead-hint" id="${name}-hint">${hint}</p>` : ''}<p class="lead-error" id="${name}-error" hidden></p></div>`;
}
const input = (attrs) => `<input <CONTROL ${attrs}>`;

function contactFields(prefill = {}) {
  return `<div class="lead-grid">
   ${field('name', 'שם מלא', input(`type="text" autocomplete="name" maxlength="${LIMITS.name}" required value="${esc(prefill.name)}"`))}
   ${field('phone', 'טלפון נייד', input('type="tel" inputmode="tel" autocomplete="tel" dir="ltr" maxlength="20" required placeholder="050-1234567"'), { hint: 'מספר ישראלי. אם תבחרו וואטסאפ, נכתוב למספר הזה.' })}
   ${field('email', 'מייל', input(`type="email" autocomplete="email" dir="ltr" maxlength="${LIMITS.email}" placeholder="name@example.com"`), { optional: true })}
  </div>
  <fieldset class="lead-field lead-choices" data-field="channel" aria-describedby="channel-error"><legend>איך נוח לכם שנחזור אליכם?</legend>
   ${Object.entries(CHANNELS).map(([value, label], i) => `<label class="lead-chip"><input type="radio" name="channel" value="${value}" ${i === 0 ? 'checked' : ''}><span>${label}</span></label>`).join('')}
   <p class="lead-error" id="channel-error" hidden></p></fieldset>`;
}

function consentFields() {
  return `<div class="lead-consent">
   <div class="lead-field" data-field="consent"><label class="lead-check"><input type="checkbox" id="lead-consent" name="consent" required aria-describedby="consent-hint consent-error"><span>${CONSENT_TEXT}</span></label>
    <p class="lead-hint" id="consent-hint">אין חובה חוקית למסור את הפרטים, אבל בלעדיהם לא נוכל לחזור אליכם. הפרטים משמשים רק לטיפול בפנייה ונשמרים בגישה מוגבלת. אפשר לבקש לעיין בהם או למחוק אותם בכל עת. פרטים נוספים ב<a href="#/privacy">הסבר על הפרטיות</a>.</p>
    <p class="lead-error" id="consent-error" hidden></p></div>
   <label class="lead-check lead-marketing"><input type="checkbox" name="marketing"><span>אשמח לקבל מג׳רבי טורס גם רעיונות לחופשה ומבצעים (אפשר להסיר בכל עת).</span></label>
  </div>
  <div class="lead-trap" aria-hidden="true"><label>אתר אינטרנט<input name="website" tabindex="-1" autocomplete="off"></label></div>
  <p class="lead-form-error" role="alert" hidden></p>`;
}

function collect(form, type, extra) {
  const data = new FormData(form), get = (name) => String(data.get(name) ?? '');
  const base = { type, name: get('name'), phone: get('phone'), email: get('email').trim(), channel: get('channel'), consent: data.get('consent') === 'on', marketing: data.get('marketing') === 'on', website: get('website'), ...extra };
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
    ? ['נציג ג׳רבי טורס יעבור על הבקשה ויבדוק אפשרויות שמתאימות לכם.', `נחזור אליכם ב${channelLabel} כדי לדייק את הפרטים.`, 'תקבלו הצעה מסודרת. שום הזמנה או חיוב לא יתבצעו בלי אישור שלכם.']
    : ['הפנייה הגיעה לצוות ג׳רבי טורס.', `נחזור אליכם ב${channelLabel} בהקדם האפשרי.`, 'לא צריך לשלוח שוב. אם נזכרתם במשהו, אפשר להוסיף אותו כשנדבר.'];
  return `<div class="lead-success" tabindex="-1"><span class="lead-success-icon" aria-hidden="true">✓</span><h2>תודה ${esc(lead.name)}, הפנייה התקבלה</h2><p>מספר הפנייה שלכם: <strong dir="ltr">${esc(reference)}</strong></p><h3>מה קורה עכשיו?</h3><ol>${steps.map((s) => `<li>${s}</li>`).join('')}</ol><div class="lead-actions"><a class="button yellow" href="#/">חזרה לדף הבית</a><button type="button" class="button secondary" data-lead-again>פנייה נוספת</button></div></div>`;
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
    button.disabled = true; button.setAttribute('aria-busy', 'true'); button.textContent = 'שולחים…';
    try {
      const response = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json().catch(() => ({}));
      if (response.status === 400 && data.fields) { showErrors(form, data.fields); firstInvalid(form)?.focus(); return; }
      if (!response.ok) throw new Error(data.message || 'לא הצלחנו לשלוח את הפנייה. נסו שוב בעוד רגע.');
      const { lead } = validateLead(payload, { today: today() });
      const host = form.parentElement;
      host.innerHTML = successPanel(type, lead, data.id || '', CHANNELS[lead.channel]);
      host.querySelector('.lead-success').focus();
      host.querySelector('[data-lead-again]').onclick = onAgain;
    } catch (error) {
      formError.textContent = error instanceof TypeError ? 'אין חיבור לשרת כרגע. בדקו את החיבור ונסו שוב.' : error.message;
      formError.hidden = false;
    } finally { if (button.isConnected) { button.disabled = false; button.removeAttribute('aria-busy'); button.textContent = label; } }
  });
}

function quickLinks(contact) {
  const links = [];
  if (/^\d{8,15}$/.test(contact?.whatsapp || '')) links.push(`<a class="lead-quick whatsapp" href="https://wa.me/${contact.whatsapp}" target="_blank" rel="noopener">וואטסאפ<small>כתבו לנו עכשיו</small></a>`);
  if (/^\+?\d{7,15}$/.test(contact?.phone || '')) links.push(`<a class="lead-quick" href="tel:${contact.phone}">טלפון<small dir="ltr">${esc(contact.phone)}</small></a>`);
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact?.email || '')) links.push(`<a class="lead-quick" href="mailto:${contact.email}">מייל<small dir="ltr">${esc(contact.email)}</small></a>`);
  return links.length ? `<div class="lead-quick-links">${links.join('')}</div>` : '<p class="micro-copy">הדרך המהירה להגיע אלינו היא הטופס: הפנייה מגיעה ישירות לנציג.</p>';
}

export function leadRoutes({ contact = {} } = {}) {
  function contactPage({ view, footer, bread, heading }) {
    const render = () => {
      view.innerHTML = `<div class="route-width">${bread('צור קשר')}${heading('צור קשר', 'נשמח לשמוע מכם', 'השאירו פרטים ונציג ג׳רבי טורס יחזור אליכם. אפשר לשאול על טיסה, חופשה, הזמנה קיימת או כל דבר אחר.')}
      <div class="lead-layout"><section class="surface-panel lead-panel" aria-labelledby="lead-form-title"><h2 id="lead-form-title">השאירו פרטים</h2><p class="micro-copy">שדות ללא סימון „רשות” הם שדות חובה.</p>
       <form id="lead-form" class="lead-form" novalidate>${contactFields()}
        ${field('message', 'במה נוכל לעזור?', `<textarea <CONTROL maxlength="${LIMITS.message}" rows="5" placeholder="למשל: מחפשים טיסה לאתונה בסוף אוגוסט לשני מבוגרים וילד."></textarea>`, { optional: true, hint: 'אין צורך בפרטי אשראי או במספר תעודת זהות.' })}
        ${consentFields()}<button type="submit" class="button yellow full-width">שליחת הפנייה</button></form></section>
       <aside class="lead-aside"><div class="surface-panel"><span class="eyebrow">ערוצים ישירים</span><h2>מעדיפים לדבר עכשיו?</h2>${quickLinks(contact)}</div>
        <div class="help-card"><h2>מחפשים טיול מיוחד?</h2><p>ירח דבש, טיול משפחתי, כמה יעדים בטיול אחד: נבנה לכם מסלול בהתאמה אישית.</p><a class="button yellow" href="#/tailor-made">לטיול בהתאמה אישית</a></div>
        <p class="micro-copy">יש לכם שאלה כללית? ייתכן שהתשובה כבר מחכה ב<a href="#/support">שאלות הנפוצות</a>.</p></aside></div></div>${footer}`;
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
      view.innerHTML = `<div class="route-width">${bread('טיולים בהתאמה אישית')}${heading('טיולים בהתאמה אישית', fromResults ? 'לא מצאתם? נמצא בשבילכם' : 'הטיול שלכם, בדיוק כמו שדמיינתם', fromResults ? 'השאירו פרטים ונציג ג׳רבי טורס יחפש עבורכם אפשרויות נוספות: מסלולים אחרים, תאריכים קרובים או שילוב של טיסה ומלון.' : 'ירח דבש, טיול משפחתי, כמה יעדים בטיול אחד או חגיגה מיוחדת. ספרו לנו מה חשוב לכם ונבנה יחד מסלול מותאם.')}
      ${fromResults && context?.to ? `<div class="soft-notice lead-context"><p><strong>מהחיפוש שלכם:</strong> ${esc(placeName(context.from || 'TLV'))} ← ${esc(placeName(context.to))}${context.depart ? ` · ${esc(heDate(context.depart))}${context.return ? ' עד ' + esc(heDate(context.return)) : ''}` : ''}. מילאנו את הפרטים מראש, ואפשר לשנות הכול.</p></div>` : ''}
      <div class="lead-layout"><section class="surface-panel lead-panel" aria-labelledby="lead-form-title"><h2 id="lead-form-title">ספרו לנו על הטיול</h2><p class="micro-copy">שדות ללא סימון „רשות” הם שדות חובה. כמה דקות, ונחזור אליכם עם רעיונות.</p>
       <form id="lead-form" class="lead-form" novalidate>
        ${tailorAssistHtml()}
        <h3 class="lead-step">1. לאן ומתי</h3>
        ${field('destinations', 'לאן תרצו לטוס?', input(`type="text" maxlength="${LIMITS.destinations}" required value="${esc(prefill.destinations)}" placeholder="למשל: יפן, או איטליה ויוון"`), { hint: 'אפשר יעד אחד, כמה יעדים, או אזור כללי. עוד לא יודעים? כתבו את זה.' })}
        <div class="lead-grid">
         ${field('start', 'תאריך יציאה', input(`type="date" min="${today()}" value="${prefill.start}"`), { optional: true })}
         ${field('end', 'תאריך חזרה', input(`type="date" min="${today()}" value="${prefill.end}"`), { optional: true })}
         ${field('flexibility', 'גמישות בתאריכים', `<select <CONTROL>${Object.entries(FLEXIBILITY).map(([v, l]) => `<option value="${v}" ${v === (prefill.start ? 'days' : 'open') ? 'selected' : ''}>${l}</option>`).join('')}</select>`)}
        </div>
        <h3 class="lead-step">2. מי נוסע ובאיזה סגנון</h3>
        <div class="lead-grid">
         ${field('adults', 'מבוגרים', input(`type="number" inputmode="numeric" min="1" max="30" value="${prefill.adults}" required`))}
         ${field('children', 'ילדים (עד גיל 18)', input(`type="number" inputmode="numeric" min="0" max="20" value="${prefill.children}"`))}
         ${field('budget', 'תקציב משוער לכל הטיול', `<select <CONTROL>${Object.entries(BUDGETS).map(([v, l]) => `<option value="${v}" ${v === 'open' ? 'selected' : ''}>${l}</option>`).join('')}</select>`)}
        </div>
        <fieldset class="lead-field lead-choices"><legend>סגנון הטיול <span class="lead-optional">(רשות, אפשר לבחור כמה)</span></legend>
         ${Object.entries(STYLES).map(([v, l]) => `<label class="lead-chip"><input type="checkbox" name="styles" value="${v}"><span>${l}</span></label>`).join('')}</fieldset>
        ${field('notes', 'עוד משהו שחשוב לנו לדעת?', `<textarea <CONTROL maxlength="${LIMITS.notes}" rows="4" placeholder="למשל: חוגגים יום הולדת 40, רוצים מלון עם בריכה לילדים, לא אוהבים טיסות לילה."></textarea>`, { optional: true })}
        <h3 class="lead-step">3. איך נחזור אליכם</h3>
        ${contactFields()}
        ${consentFields()}<button type="submit" class="button yellow full-width">שליחה לנציג ג׳רבי טורס</button></form></section>
       <aside class="lead-aside"><div class="surface-panel"><span class="eyebrow">איך זה עובד</span><h2>שלושה צעדים פשוטים</h2><ol class="lead-how"><li>ממלאים את מה שידוע לכם. לא חייבים הכול.</li><li>נציג ג׳רבי טורס חוזר אליכם לשיחה קצרה.</li><li>מקבלים הצעה מסודרת, ומחליטים בלי לחץ.</li></ol></div>
        <div class="surface-panel"><span class="eyebrow">ערוצים ישירים</span><h2>מעדיפים לדבר?</h2>${quickLinks(contact)}<a class="lead-link" href="#/contact">לטופס יצירת קשר כללי ←</a></div></aside></div></div>${footer}`;
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
      ? `<aside class="lead-cta strong" data-variant="strong" aria-label="עזרה מנציג"><div><strong>לא מצאתם? השאירו פרטים</strong><p>נציג ג׳רבי טורס יחפש עבורכם מסלולים, תאריכים או שדות תעופה נוספים, ויחזור אליכם.</p></div><a class="button yellow" href="${esc(href)}">השאירו פרטים לנציג</a></aside>`
      : `<aside class="lead-cta" data-variant="quiet" aria-label="עזרה מנציג"><p><strong>לא מצאתם בדיוק מה שחיפשתם?</strong> נציג ג׳רבי טורס ישמח לבנות לכם הצעה מותאמת.</p><a class="button secondary" href="${esc(href)}">השאירו פרטים</a></aside>`);
  };
  new MutationObserver(() => { if (!queued) { queued = true; requestAnimationFrame(update); } }).observe(host, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
}
