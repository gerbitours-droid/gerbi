// Customer-side AI features (spec 22 §4.2, §4.3): the tailor-made form assistant and "Gerbi compares" for the top
// flights. Both degrade quietly: the form assistant always works with local rules; the comparison button appears
// only when the server says the feature is on. All model text is inserted with textContent.
import { tailorFromText } from './tailor-fill.mjs';
import { STYLES, BUDGETS, FLEXIBILITY } from './leads-validate.mjs';

if (typeof document !== 'undefined' && !document.querySelector('link[href="/ai.css"]')) document.head.append(Object.assign(document.createElement('link'), { rel: 'stylesheet', href: '/ai.css' }));
let featuresPromise = null;
export function aiFeatures() {
  featuresPromise ||= fetch('/api/ai/features', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : { features: {} })).then((d) => d.features || {}).catch(() => ({}));
  return featuresPromise;
}
const localDay = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const FIELD_LABEL = { destinations: 'יעד', start: 'תאריכים', flexibility: 'גמישות', adults: 'מבוגרים', children: 'ילדים', budget: 'תקציב', styles: 'סגנון', notes: 'הערות' };

// ---------- tailor-made form ----------
export const tailorAssistHtml = () => `<section class="ai-assist" aria-labelledby="ai-assist-title">
  <div class="ai-assist-head"><img src="/assets/mascot.png" alt="" width="44" height="44"><div><h3 id="ai-assist-title">ספרו במשפט אחד, ונמלא את הטופס בשבילכם</h3><p class="micro-copy">למשל: „ירח דבש ביפן באפריל, 12 לילות, תקציב 40 אלף, אוכל ויין”. אפשר לשנות כל שדה אחר כך.</p></div></div>
  <label class="sr-only" for="ai-assist-text">תיאור הטיול במילים שלכם</label>
  <textarea id="ai-assist-text" rows="2" maxlength="1500" placeholder="מי נוסע, לאן, מתי, תקציב ומה חשוב לכם…"></textarea>
  <div class="ai-assist-actions"><button type="button" class="button secondary" id="ai-assist-run">מילוי הטופס</button><p class="micro-copy ai-assist-status" role="status" aria-live="polite"></p></div>
</section>`;

function applyFields(form, fields) {
  const set = (name, value) => { const el = form.elements[name]; if (!el || value === undefined || value === '') return false; el.value = String(value); el.closest('[data-field]')?.classList.add('ai-filled'); el.dispatchEvent(new Event('input', { bubbles: true })); return true; };
  const done = [];
  for (const name of ['destinations', 'start', 'end', 'flexibility', 'adults', 'children', 'budget']) if (fields[name] !== undefined && set(name, fields[name])) done.push(name);
  if (fields.styles?.length) {
    for (const box of form.querySelectorAll('input[name="styles"]')) if (fields.styles.includes(box.value)) box.checked = true;
    form.querySelector('input[name="styles"]')?.closest('fieldset')?.classList.add('ai-filled'); done.push('styles');
  }
  if (fields.notes) {
    const notes = form.elements.notes, current = notes.value.trim();
    if (!current.includes(fields.notes)) { notes.value = current ? `${current}\n${fields.notes}` : fields.notes; notes.closest('[data-field]')?.classList.add('ai-filled'); done.push('notes'); }
  }
  setTimeout(() => form.querySelectorAll('.ai-filled').forEach((el) => el.classList.remove('ai-filled')), 2600);
  return done;
}
const describe = (f) => [f.destinations && `יעד: ${f.destinations}`, f.start && `תאריכים: ${f.start.split('-').reverse().join('.')}${f.end ? '–' + f.end.split('-').reverse().join('.') : ''}`,
  !f.start && f.flexibility && FLEXIBILITY[f.flexibility], f.adults && `${f.adults} מבוגרים`, f.children && `${f.children} ילדים`, f.budget && BUDGETS[f.budget],
  f.styles?.length && f.styles.map((s) => STYLES[s]).join(', ')].filter(Boolean).join(' · ');

export function mountTailorAssist(form, { today = localDay } = {}) {
  const box = form?.querySelector('.ai-assist');
  if (!box) return;
  const text = box.querySelector('#ai-assist-text'), run = box.querySelector('#ai-assist-run'), out = box.querySelector('.ai-assist-status');
  run.onclick = async () => {
    const value = text.value.trim();
    if (value.length < 5) { out.textContent = 'כתבו כמה מילים על הטיול: מי נוסע, לאן ומתי.'; text.focus(); return; }
    run.disabled = true;
    // Local rules first: instant and free. The server (AI when enabled) may add destinations, styles and wishes.
    const local = tailorFromText(value, today()).fields;
    let fields = local, ai = false;
    applyFields(form, local);
    out.textContent = 'ממלאים…';
    if ((await aiFeatures()).tailor_fill) {
      try {
        const r = await fetch('/api/ai/tailor-fill', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: value }) });
        if (r.ok) { const data = await r.json(); if (data.source === 'ai') { fields = data.fields; ai = true; applyFields(form, data.fields); } }
      } catch { /* the local fill stands */ }
    }
    const summary = describe(fields);
    out.textContent = summary ? `מילאנו ${ai ? 'בעזרת ג׳רבי AI' : ''}: ${summary}. בדקו ושנו כרצונכם, ואז השלימו פרטי קשר.`.replace('מילאנו :', 'מילאנו:') : 'לא זיהינו פרטים בטקסט. אפשר לנסח אחרת או למלא ידנית.';
    if (!form.elements.notes.value.includes(value)) form.elements.notes.value = (form.elements.notes.value ? form.elements.notes.value + '\n' : '') + `במילים שלי: ${value}`.slice(0, 1990);
    run.disabled = false;
  };
}

// ---------- flight comparison ----------
const BAG = { included: 'מזוודה כלולה', paid: 'מזוודה בתשלום', none: 'ללא מזוודה', mixed: 'מזוודה שונה בין הכיוונים', unknown: 'מזוודה לא נמסרה' };
const minutesText = (m) => (Number.isFinite(m) && m > 0 ? `${Math.floor(m / 60)} ש׳${m % 60 ? ` ${m % 60} ד׳` : ''}` : '');
export const flightTakeSlot = () => '<div class="ai-take" id="ai-take" hidden></div>';
export function takeOffers(facts, formatPrice) {
  return facts.slice(0, 3).map((f) => ({ price: formatPrice(f.price), duration: minutesText(f.totalMinutes), stops: Number.isInteger(f.stops) ? f.stops : null, longestWait: minutesText(f.longestLayover),
    departs: f.legs.map((l) => l.segments[0]?.departure?.time).filter(Boolean), arrives: f.legs.map((l) => l.segments.at(-1)?.arrival?.time).filter(Boolean), bag: BAG[f.checked] || '', carrier: f.carriers.join(' + ') }));
}
const takeCache = new Map();
export async function mountFlightTake(host, facts, { formatPrice, brief }) {
  const slot = host.querySelector('#ai-take');
  if (!slot || facts.length < 2 || !(await aiFeatures()).flight_explain || !host.contains(slot)) return;
  const offers = takeOffers(facts, formatPrice), signature = JSON.stringify(offers);
  slot.hidden = false;
  slot.innerHTML = '<button type="button" class="button secondary ai-take-button"><img src="/assets/mascot.png" alt="" width="26" height="26"> ג׳רבי, מה ההבדל בין המובילות?</button><div class="ai-take-body" role="status" aria-live="polite"></div>';
  const button = slot.querySelector('button'), body = slot.querySelector('.ai-take-body');
  const show = (data) => {
    body.textContent = '';
    if (!data?.ok) { const p = document.createElement('p'); p.className = 'micro-copy'; p.textContent = data?.message || 'לא הצלחנו להשוות כרגע.'; body.append(p); return; }
    const p = document.createElement('p'); p.textContent = data.summary; body.append(p);
    if (data.tradeoffs?.length) { const ul = document.createElement('ul'); for (const t of data.tradeoffs) { const li = document.createElement('li'); li.textContent = t; ul.append(li); } body.append(ul); }
    if (data.pick) { const b = document.createElement('p'); b.className = 'ai-take-pick'; b.textContent = `ההמלצה לבקשה שלכם: הטיסה ${({ A: 'הראשונה', B: 'השנייה', C: 'השלישית' })[data.pick]} ברשימה.`; body.append(b); }
    const note = document.createElement('p'); note.className = 'micro-copy'; note.textContent = 'הסבר אוטומטי על בסיס נתוני החיפוש בלבד. המחיר הקובע הוא זה שבכרטיס ובבדיקת המחיר.'; body.append(note);
  };
  if (takeCache.has(signature)) { button.hidden = true; show(takeCache.get(signature)); return; }
  button.onclick = async () => {
    button.disabled = true; body.textContent = 'ג׳רבי משווה…';
    try {
      const r = await fetch('/api/ai/explain-flights', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ offers, brief }) });
      const data = r.ok ? await r.json() : { ok: false, message: r.status === 429 ? 'יותר מדי בקשות. נסו שוב בעוד דקה.' : '' };
      if (data.ok) takeCache.set(signature, data);
      button.hidden = Boolean(data.ok); show(data);
    } catch { show({ ok: false }); }
    button.disabled = false;
  };
}
