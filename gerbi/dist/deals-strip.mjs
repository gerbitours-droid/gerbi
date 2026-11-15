// Homepage strip of the cheapest fares found from Tel Aviv (served from the server's long cache, /api/deals).
// Renders only when there is something to show; on any failure the strip simply stays hidden.
import { placeByCode } from './places.mjs';
import { formatFare } from './flight-view.mjs';
import { fxSettled, onFx, getFx, fxNote, originalHtml } from './fx.mjs';
import { t, locale } from './i18n.mjs';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const short = iso => new Date(iso + 'T12:00:00Z').toLocaleDateString(locale(), { day: 'numeric', month: 'numeric', timeZone: 'UTC' });
const nights = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
const ago = iso => { const h = Math.round((Date.now() - Date.parse(iso)) / 3600000); return h < 1 ? t('search.deals.lastHour') : h === 1 ? t('search.deals.hourAgo') : h < 24 ? t('search.deals.hoursAgo', { count: h }) : t('search.deals.lastDay'); };
const VALID = /^\d{4}-\d{2}-\d{2}$/;

export function dealCard(deal, i) {
  const place = placeByCode(deal.destination), name = place?.name || deal.destination;
  const stops = deal.stops === 0 ? t('search.deals.direct') : deal.stops === 1 ? t('search.deals.oneStop') : Number.isFinite(deal.stops) ? t('search.deals.stops', { count: deal.stops }) : '';
  return `<li><button type="button" class="fare-deal" data-deal="${i}" aria-label="${t('search.deals.cardLabel', { name: esc(name), from: esc(short(deal.depart)), to: esc(short(deal.back)), price: esc(formatFare(deal.price)) })}">`
    + `<span class="fare-route"><strong>${esc(name)}</strong><b dir="ltr">TLV ⇄ ${esc(deal.destination)}</b></span>`
    + `<span class="fare-dates">${esc(short(deal.depart))}–${esc(short(deal.back))} · ${t('search.nights', { count: nights(deal.depart, deal.back) })}</span>`
    + `<span class="fare-meta">${[stops, deal.carrier].filter(Boolean).map(esc).join(' · ')}</span>`
    + `<span class="fare-price"><small>${t('search.deals.from')}</small><strong dir="ltr">${esc(formatFare(deal.price))}</strong>${originalHtml(deal.price)}<small>${t('search.deals.perTraveler')}</small></span></button></li>`;
}

export async function initDealsStrip({ after, onPick, today, fetcher = fetch, retryMs = 30000 }) {
  const section = document.createElement('section');
  section.id = 'fare-deals'; section.className = 'fare-deals page-width'; section.hidden = true; section.setAttribute('aria-labelledby', 'fare-deals-title');
  after.after(section);
  let deals = [], data = null;
  // Shown in shekels when the rates arrive within a moment; re-rendered if they arrive later.
  onFx(() => { if (deals.length) render(); });
  function render() {
    section.innerHTML = `<div class="fare-deals-head"><h2 id="fare-deals-title">${t('search.deals.title')}</h2>`
      + `<p>${t('search.deals.intro')}${data.updatedAt ? t('search.deals.checked', { ago: ago(data.updatedAt) }) : ''}${t('search.deals.clickHint')}${getFx() ? ` <small class="fx-note">${t('search.deals.fxNote', { note: esc(fxNote()) })}</small>` : ''}</p></div>`
      + `<ul class="fare-deals-list">${deals.map(dealCard).join('')}</ul>`;
    section.hidden = false;
  }
  async function load(attempt = 0) {
    try { const [response] = await Promise.all([fetcher('/api/deals'), fxSettled()]); if (!response.ok) return; data = await response.json(); } catch { return; }
    // Deals whose departure already passed are dropped; a cold cache is retried once while the server fills it.
    deals = (Array.isArray(data?.deals) ? data.deals : []).filter(d => VALID.test(d?.depart) && VALID.test(d?.back) && d.depart >= today() && d.price && Number.isFinite(d.price.value)).slice(0, 6);
    if (!deals.length) { if (data?.refreshing && attempt === 0) setTimeout(() => load(1), retryMs); return; }
    render();
  }
  section.addEventListener('click', e => { const button = e.target.closest('[data-deal]'); if (button) onPick(deals[Number(button.dataset.deal)]); });
  load();
  return section;
}
