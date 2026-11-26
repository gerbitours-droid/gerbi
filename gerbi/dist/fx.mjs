// Shekel display for supplier prices (docs/specs/13-pricing-ils-he.md). Shared by the browser and Node tests:
// no DOM at import time. Rates = ILS per 1 unit at the bank's transfers-and-cheques SALE rate, from GET /api/fx.
import { t, lang, locale, fmtDate } from './i18n.mjs';
let current = null, settled = null;
const listeners = new Set();
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const grouping = new Intl.NumberFormat(locale(), { maximumFractionDigits: 0 });

// Accepts the /api/fx payload; anything malformed clears the rates (prices fall back to the supplier currency).
export function setFx(data) {
  const rates = {};
  for (const [code, value] of Object.entries(data?.rates && typeof data.rates === 'object' ? data.rates : {})) {
    if (/^[A-Z]{3}$/.test(code) && typeof value === 'number' && Number.isFinite(value) && value > 0) rates[code] = value;
  }
  current = data?.ok !== false && Object.keys(rates).length ? { ...data, rates } : null;
  listeners.forEach(fn => { try { fn(current); } catch { /* one bad listener never breaks the others */ } });
  return current;
}
export const getFx = () => current;
export const onFx = fn => { listeners.add(fn); return () => listeners.delete(fn); };

// ILS value of a {value,currency} price, or null when there is no rate for it.
export function toIls(price, fx = current) {
  if (!price || typeof price.value !== 'number' || !Number.isFinite(price.value)) return null;
  if (price.currency === 'ILS') return price.value;
  const rate = fx?.rates?.[price.currency];
  return rate ? price.value * rate : null;
}
// Whole shekels: what is shown is what is sorted and compared, so differences add up on screen.
export const roundIls = value => Math.round(value);
export const formatIls = value => `${value < 0 ? '-' : ''}₪${grouping.format(Math.abs(roundIls(value)))}`;
// The price the UI compares: rounded ILS when convertible, else the supplier's own amount and currency.
export function priceBasis(price, fx = current) {
  if (!price) return null;
  const ils = toIls(price, fx);
  return ils === null ? { value: price.value, currency: price.currency } : { value: roundIls(ils), currency: 'ILS' };
}
export function formatOriginal(price) {
  if (!price) return '';
  try { return new Intl.NumberFormat(locale(), { style: 'currency', currency: price.currency, maximumFractionDigits: 2 }).format(price.value); }
  catch { return `${price.value.toFixed(2)} ${price.currency}`; }
}
// "Converted" = shown in shekels although the supplier priced it in something else.
export const converted = (price, fx = current) => Boolean(price && price.currency !== 'ILS' && toIls(price, fx) !== null);

const heDate = iso => /^\d{4}-\d{2}-\d{2}$/.test(iso || '') ? iso.split('-').reverse().map((part, i) => i < 2 ? String(Number(part)) : part).join('.') : '';
// "לפי שער העברות והמחאות – מכירה, נכון ל־13.11.2026" (or the estimate wording on the Bank of Israel fallback).
export function fxNote(fx = current) {
  if (!fx) return '';
  const date = lang === 'en' && heDate(fx.asOf) ? fmtDate(fx.asOf) : heDate(fx.asOf), when = date ? t('search.fx.asOf', { date }) : '';
  const base = fx.method === 'representative-plus-markup'
    ? t('search.fx.estimate', { pct: fx.markupPct, when })
    : t('search.fx.rate', { when });
  return base + (fx.stale ? t('search.fx.stale') : '');
}
export function ilsEstimateHtml(price, fx = current) {
  if (!converted(price, fx)) return '';
  return `<small class="fare-original" title="${esc(fxNote(fx))}">${t('search.fx.ilsEstimate', { amount: `<bdi dir="ltr">${esc(formatIls(toIls(price, fx)))}</bdi>` })}</small>`;
}
export const fxNoteHtml = (fx = current) => fx ? `<small class="fx-note">${esc(fxNote(fx))}</small>` : '';
export function fareText(price, fx = current) {
  if (!price) return t('search.fx.unavailable');
  if (!converted(price, fx)) return price.currency === 'ILS' ? formatIls(price.value) : formatOriginal(price);
  return t('search.fx.fareText', { ils: formatIls(toIls(price, fx)), original: formatOriginal(price), note: fxNote(fx) });
}

// Loads /api/fx once; resolves (never rejects) with the rates or null. Never blocks rendering.
export function loadFx(fetcher = globalThis.fetch, timeoutMs = 5000, force = false) {
  if (force) settled = null;
  settled ||= (async () => {
    try {
      const response = await fetcher('/api/fx', { signal: AbortSignal.timeout(timeoutMs) });
      if (!response.ok) return setFx(null);
      return setFx(await response.json());
    } catch { return setFx(null); }
  })();
  return settled;
}
// For callers that want rates if they come quickly (deals strip): waits at most `ms`.
export const fxSettled = (ms = 2500) => Promise.race([settled || Promise.resolve(current), new Promise(resolve => setTimeout(() => resolve(current), ms))]);
export const resetFx = () => { current = null; settled = null; listeners.clear(); };
