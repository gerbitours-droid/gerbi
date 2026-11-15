// Currency converter (spec 13 §6): amount + currency → shekels at the same transfers-and-cheques sale rate as the prices.
// Used as the #/converter page and inside the results dialog.
import { getFx, loadFx, onFx, fxNote } from './fx.mjs';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const MAIN_CURRENCIES = [['USD', 'דולר אמריקאי'], ['EUR', 'אירו'], ['GBP', 'לירה שטרלינג']];
const OTHER_NAMES = { CHF: 'פרנק שוויצרי', JPY: 'ין יפני', CAD: 'דולר קנדי', AUD: 'דולר אוסטרלי', AED: 'דירהם אמירתי', SEK: 'כתר שוודי', NOK: 'כתר נורווגי', DKK: 'כתר דני', ZAR: 'ראנד דרום אפריקאי', TRY: 'לירה טורקית', EGP: 'לירה מצרית', JOD: 'דינר ירדני', PLN: 'זלוטי פולני', HUF: 'פורינט הונגרי', CZK: 'קורונה צ׳כית', THB: 'באט תאילנדי', INR: 'רופי הודי' };

// "1,234.5" / "1234,5" → 1234.5; anything else → null. Up to 10 million.
export function parseAmount(text) {
  const raw = String(text ?? '').trim().replace(/[\s₪$€£]/g, '');
  if (!raw) return { empty: true };
  const normal = /^\d{1,3}(,\d{3})+(\.\d+)?$/.test(raw) ? raw.replace(/,/g, '') : raw.replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(normal)) return { error: 'הזינו סכום במספרים, למשל 250 או 1,250.50' };
  const value = Number(normal);
  return value > 10_000_000 ? { error: 'הסכום גדול מדי למחשבון' } : { value };
}
// ILS for amount×rate, kept to agorot for the calculator (prices elsewhere round to whole shekels).
export function convertAmount(amount, currency, rates) {
  const rate = rates?.[currency];
  return Number.isFinite(amount) && amount >= 0 && rate > 0 ? Math.round(amount * rate * 100) / 100 : null;
}
const agorot = new Intl.NumberFormat('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const formatAgorot = value => `₪${agorot.format(value)}`;
const rateFormat = new Intl.NumberFormat('he-IL', { minimumFractionDigits: 4, maximumFractionDigits: 4 });

export function converterHtml({ id = 'fx', amount = '100', currency = 'USD' } = {}) {
  const fx = getFx(), extra = fx ? Object.keys(fx.rates).filter(code => OTHER_NAMES[code]).sort() : [];
  const option = (code, name) => `<option value="${code}" ${code === currency ? 'selected' : ''}>${esc(name)} (${code})</option>`;
  return `<form class="fx-converter" data-fx-converter novalidate aria-describedby="${id}-note">
   <div class="fx-fields"><label for="${id}-amount">סכום<input id="${id}-amount" name="amount" inputmode="decimal" autocomplete="off" dir="ltr" value="${esc(amount)}" aria-describedby="${id}-error"></label>
   <label for="${id}-currency">ממטבע<select id="${id}-currency" name="currency">${MAIN_CURRENCIES.map(([c, n]) => option(c, n)).join('')}${extra.length ? `<optgroup label="מטבעות נוספים">${extra.map(c => option(c, OTHER_NAMES[c])).join('')}</optgroup>` : ''}</select></label></div>
   <p class="fx-error" id="${id}-error" role="alert"></p>
   <div class="fx-result"><span>בשקלים</span><output for="${id}-amount ${id}-currency" aria-live="polite" dir="ltr"></output><small class="fx-rate" dir="rtl"></small></div>
   <p class="fx-note micro-copy" id="${id}-note"></p>
   <button type="button" class="button secondary" data-fx-retry hidden>ניסיון חוזר</button>
  </form>`;
}

// Live result on every keystroke; follows rate updates while the form is on the page.
export function wireConverter(form) {
  if (!form) return () => {};
  const $ = s => form.querySelector(s), out = $('output'), error = $('.fx-error'), rateLine = $('.fx-rate'), note = $('.fx-note'), retry = $('[data-fx-retry]'), input = $('input');
  let loading = !getFx();
  function update() {
    const fx = getFx(), parsed = parseAmount(input.value), currency = $('select').value;
    input.setAttribute('aria-invalid', String(Boolean(parsed.error)));
    error.textContent = parsed.error || '';
    retry.hidden = Boolean(fx) || loading;
    if (!fx) { out.textContent = loading ? 'טוענים שער עדכני…' : '—'; rateLine.textContent = ''; note.textContent = loading ? '' : 'השער אינו זמין כרגע. נסו שוב בעוד רגע.'; return; }
    note.textContent = fxNote(fx);
    const rate = fx.rates[currency];
    const per = rate < 0.1 ? 100 : 1;
    if (rate) { const formula = document.createElement('bdi'); formula.dir = 'ltr'; formula.textContent = `${per} ${currency} = ₪${rateFormat.format(rate * per)}`; rateLine.replaceChildren('שער: ', formula); } else rateLine.textContent = '';
    if (parsed.empty) { out.textContent = 'הזינו סכום'; return; }
    if (parsed.error) { out.textContent = '—'; return; }
    const value = convertAmount(parsed.value, currency, fx.rates);
    out.textContent = value === null ? 'אין שער למטבע הזה' : formatAgorot(value);
  }
  form.addEventListener('input', update);
  form.addEventListener('submit', e => e.preventDefault());
  retry.addEventListener('click', () => { loading = true; update(); loadFx(undefined, 5000, true).finally(() => { loading = false; update(); }); });
  const off = onFx(() => { loading = false; if (form.isConnected) update(); else off(); });
  if (loading) loadFx().finally(() => { loading = false; if (form.isConnected) update(); });
  update();
  return off;
}

// Route for initPages: #/converter.
export function converterRoutes() {
  return {
    converter({ view, footer, bread, heading }) {
      view.innerHTML = `<div class="article-width">${bread('מחשבון המרת מטבע')}${heading('מחירים בשקלים', 'מחשבון המרת מטבע', 'כמה זה בשקלים? לפי אותו שער שבו אנחנו מציגים את מחירי הטיסות: שער העברות והמחאות – מכירה.')}
       <section class="surface-panel fx-panel" aria-label="מחשבון המרה">${converterHtml({ id: 'fx-page' })}</section>
       <p class="micro-copy">שער העברות והמחאות – מכירה הוא השער שהבנק גובה כשמעבירים מט״ח לחו״ל, ולכן הוא קרוב למה שתשלמו בפועל. המחיר הסופי נקבע בעת ההזמנה.</p></div>${footer}`;
      wireConverter(view.querySelector('[data-fx-converter]'));
    }
  };
}
