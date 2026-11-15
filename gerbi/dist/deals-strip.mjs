// Homepage strip of the cheapest fares found from Tel Aviv (served from the server's long cache, /api/deals).
// Renders only when there is something to show; on any failure the strip simply stays hidden.
import { placeByCode } from './places.mjs';
import { formatFare } from './flight-view.mjs';
import { countText } from './search-form.mjs';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const short = iso => new Date(iso + 'T12:00:00Z').toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', timeZone: 'UTC' });
const nights = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
const ago = iso => { const h = Math.round((Date.now() - Date.parse(iso)) / 3600000); return h < 1 ? 'בשעה האחרונה' : h === 1 ? 'לפני שעה' : h < 24 ? `לפני ${h} שעות` : 'ביממה האחרונה'; };
const VALID = /^\d{4}-\d{2}-\d{2}$/;

export function dealCard(deal, i) {
  const place = placeByCode(deal.destination), name = place?.name || deal.destination;
  const stops = deal.stops === 0 ? 'ישירה' : deal.stops === 1 ? 'עצירה אחת' : Number.isFinite(deal.stops) ? `${deal.stops} עצירות` : '';
  return `<li><button type="button" class="fare-deal" data-deal="${i}" aria-label="חיפוש טיסות לתל אביב–${esc(name)}, ${esc(short(deal.depart))} עד ${esc(short(deal.back))}, החל מ־${esc(formatFare(deal.price))} לנוסע">`
    + `<span class="fare-route"><strong>${esc(name)}</strong><b dir="ltr">TLV ⇄ ${esc(deal.destination)}</b></span>`
    + `<span class="fare-dates">${esc(short(deal.depart))}–${esc(short(deal.back))} · ${countText(nights(deal.depart, deal.back), 'לילה אחד', 'לילות')}</span>`
    + `<span class="fare-meta">${[stops, deal.carrier].filter(Boolean).map(esc).join(' · ')}</span>`
    + `<span class="fare-price"><small>החל מ־</small><strong dir="ltr">${esc(formatFare(deal.price))}</strong><small>לנוסע, הלוך־חזור</small></span></button></li>`;
}

export async function initDealsStrip({ after, onPick, today, fetcher = fetch, retryMs = 30000 }) {
  const section = document.createElement('section');
  section.id = 'fare-deals'; section.className = 'fare-deals page-width'; section.hidden = true; section.setAttribute('aria-labelledby', 'fare-deals-title');
  after.after(section);
  let deals = [];
  async function load(attempt = 0) {
    let data;
    try { const response = await fetcher('/api/deals'); if (!response.ok) return; data = await response.json(); } catch { return; }
    // Deals whose departure already passed are dropped; a cold cache is retried once while the server fills it.
    deals = (Array.isArray(data?.deals) ? data.deals : []).filter(d => VALID.test(d?.depart) && VALID.test(d?.back) && d.depart >= today() && d.price && Number.isFinite(d.price.value)).slice(0, 6);
    if (!deals.length) { if (data?.refreshing && attempt === 0) setTimeout(() => load(1), retryMs); return; }
    section.innerHTML = `<div class="fare-deals-head"><h2 id="fare-deals-title">הטיסות הזולות מתל אביב עכשיו</h2>`
      + `<p>המחיר הזול שמצאנו בשבועות הקרובים${data.updatedAt ? ` · נבדק ${ago(data.updatedAt)}` : ''}. לחיצה מחפשת מחיר עדכני.</p></div>`
      + `<ul class="fare-deals-list">${deals.map(dealCard).join('')}</ul>`;
    section.hidden = false;
  }
  section.addEventListener('click', e => { const button = e.target.closest('[data-deal]'); if (button) onPick(deals[Number(button.dataset.deal)]); });
  load();
  return section;
}
