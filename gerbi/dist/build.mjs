// Magic trip builder page (#/build, spec 24): one sentence → a complete trip. The server plans from the catalog;
// flights and hotels arrive separately (live, with their check time); everything else is an estimate or a quote.
import { t, lang, locale, fmtTime, fmtDate, errorText } from './i18n.mjs';
import { toIls, formatIls, formatOriginal, getFx, onFx, loadFx, fxNote } from './fx.mjs';
import { pricePackage, sanitizePackage, packageLeadFields, isStale, selectedFlight, travellers } from './trip-package.mjs';
import { validateLead, CHANNELS, LIMITS, consentText, optionLabel } from './leads-validate.mjs';
import { searchLink } from './saved-flights.mjs';
import { multiLink } from './multi-city-core.mjs';
import { timeVsIsrael } from './timezone.mjs';
import { account, ready as accountReady } from './account.mjs';
import { bookingConfig, startBooking } from './booking-client.mjs';
import { asciiBackground } from './ascii-bg.mjs';
import { slingTop } from './sling-top.mjs';
import { brochureHtml, loadBrochureData } from './brochure.mjs';
import { fitPackage, upsellOffers, applyUpsell, flightsInBudget } from './budget.mjs';

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const L = (v) => (v && typeof v === 'object' ? v[lang] || v.he || v.en || '' : v ?? '');
const icon = (name) => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
const $ = (s, root = document) => root.querySelector(s);
const SAVED_KEY = 'gerbi-packages-v1', CURRENT_KEY = 'gerbi-build-current-v1';
const MONTHS = Array.from({ length: 12 }, (_, i) => new Date(2026, i, 15).toLocaleDateString(locale(), { month: 'long' }));

let decor = [];
const stopDecor = () => { decor.forEach((stop) => stop()); decor = []; };
if (typeof window !== 'undefined') addEventListener('hashchange', () => { if (!location.hash.startsWith('#/build')) stopDecor(); });
let pkg = null, view = null, version = 0, lastInput = null, showAllHotels = new Set(), leadOpen = false;
// Attraction / day-trip photos ('<destId>|<English name>' → { src }), generated separately; optional (spec 28 §ב).
let tripImages = {};
import('./catalog/attraction-images.mjs').then((m) => { tripImages = Object.fromEntries(Object.entries(m.default || {}).filter(([, v]) => typeof v?.src === 'string').map(([k, v]) => [k, '/' + v.src.replace(/^\/+/, '')])); if (pkg?.destination && view?.isConnected) paint('upsell'); }).catch(() => {});

// ---- prices
const fare = (price) => { if (!price) return ''; const v = toIls(price, getFx()); return v === null ? formatOriginal(price) : formatIls(v); };
const checked = (iso) => (iso ? t('build.price.checkedAt', { time: fmtTime(iso), date: fmtDate(iso, { day: 'numeric', month: 'short' }) }) : '');
// A shekel range that never breaks across lines or flips around the dash in RTL.
const range = (low, high) => `<span class="bk-range" dir="ltr">${esc(formatIls(low))} – ${esc(formatIls(high))}</span>`;
const kindPill = (kind) => `<span class="bk-kind bk-${kind}">${t(`build.kind.${kind}`)}</span>`;
const longDay = (iso) => (iso ? new Date(iso + 'T12:00:00').toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short' }) : '');
const travellersText = (r) => t('build.travellers', { adults: r.adults, children: r.children });

// ---- input
const EXAMPLES = ['build.example.family', 'build.example.couple', 'build.example.friends'];
const CHIPS = [['who', ['couple', 'family', 'friends', 'solo']], ['budget', ['low', 'mid', 'high']], ['style', ['beach', 'city', 'nature', 'ski', 'allInclusive', 'car']]];
function inputHtml(text = '') {
  // Chat composer (spec 27): one rounded box – text on top, tools and a round send button underneath.
  return `<form id="build-form" class="build-form gb-composer" novalidate>
   <label for="build-text" class="build-label sr-only">${t('build.input.label')}</label>
   <div class="gb-box">
    <textarea id="build-text" name="text" rows="2" maxlength="1500" placeholder="${esc(t('build.input.placeholder'))}" aria-describedby="build-hint">${esc(text)}</textarea>
    <div class="gb-bar">
     <button type="button" class="gb-tool" aria-expanded="false" aria-controls="gb-prefs" data-prefs>${icon('filter')}<span>${t('build.prefs')}</span></button>
     <span id="build-hint" class="gb-hint">${t('build.input.hint')}</span>
     <button type="submit" class="build-submit gb-send" aria-label="${esc(t('build.input.submit'))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button>
    </div>
   </div>
   <div id="gb-prefs" class="gb-prefs" hidden>
   ${CHIPS.map(([group, ids]) => `<div class="build-chips" role="group" aria-label="${esc(t(`build.chip.${group}`))}"><span class="build-chip-label" aria-hidden="true">${t(`build.chip.${group}`)}</span>${ids.map((id) => `<button type="button" class="build-chip" data-chip="${group}.${id}" aria-pressed="false">${t(`build.chip.${group}.${id}`)}</button>`).join('')}</div>`).join('')}
   <div class="build-chips" role="group" aria-label="${esc(t('build.chip.when'))}"><label class="build-chip-label" for="build-month">${t('build.chip.when')}</label><select id="build-month" class="build-month"><option value="">${t('build.chip.when.any')}</option>${MONTHS.map((m, i) => `<option value="${i}">${esc(m)}</option>`).join('')}</select></div>
   </div>
   <div class="build-examples gb-suggest"><span class="sr-only">${t('build.input.examples')}</span>${EXAMPLES.map((k) => `<button type="button" class="gb-card" data-example="${k}"><strong>${t(k + '.short')}</strong><span>${t(k)}</span></button>`).join('')}</div>
   <p class="build-error" role="alert" hidden></p>
  </form>`;
}
const chipPhrase = (key) => t(`build.chip.${key}.phrase`);
function toggleChip(button) {
  const area = $('#build-text'), phrase = chipPhrase(button.dataset.chip), on = button.getAttribute('aria-pressed') !== 'true';
  // One choice per "who"/"budget" group: pressing one releases the others (and removes their phrase).
  const [group] = button.dataset.chip.split('.');
  if (on && group !== 'style') view.querySelectorAll(`[data-chip^="${group}."][aria-pressed="true"]`).forEach((b) => { b.setAttribute('aria-pressed', 'false'); area.value = area.value.replace(chipPhrase(b.dataset.chip), '').replace(/\s*,\s*,/g, ',').trim(); });
  button.setAttribute('aria-pressed', String(on));
  area.value = on ? [area.value.trim().replace(/[,.]$/, ''), phrase].filter(Boolean).join(', ') : area.value.replace(phrase, '').replace(/\s*,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '').trim();
  area.dispatchEvent(new Event('input'));
}

// ---- server calls
async function post(path, payload) {
  const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, lang }) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(errorText(data.error, data.message, 'build')), { status: response.status });
  return data;
}
function announce(text) { const s = $('#build-status'); if (s) { s.textContent = ''; setTimeout(() => { s.textContent = text; }, 30); } }

async function build(input) {
  lastInput = input; const mine = ++version;
  const you = $('.gb-you', view); if (you && input.text) { you.querySelector('p').textContent = input.text; you.hidden = false; } leadOpen = false; showAllHotels = new Set();
  const out = $('#build-result'), err = $('.build-error', view), button = $('.build-submit', view);
  err.hidden = true; button.disabled = true; button.setAttribute('aria-busy', 'true');
  out.setAttribute('aria-busy', 'true'); out.innerHTML = skeletonHtml(); announce(t('build.status.planning'));
  try {
    const plan = await post('/api/build', input);
    if (mine !== version) return;
    pkg = { ...plan, manual: false, fit: null, extras: [], flights: { status: plan.flightSearch ? 'pending' : 'quote' },
      hotels: plan.stops?.length ? { stops: plan.hotelSearches.map((s, i) => ({ status: s ? 'pending' : 'quote', stop: i, area: plan.hotelAreas[i] })) } : { status: plan.hotelSearches[0] ? 'pending' : 'quote', area: plan.hotelAreas[0] },
      car: { ...plan.car }, insurance: { include: false }, polish: null };
    if (!pkg.destination) { out.removeAttribute('aria-busy'); out.innerHTML = suggestionsOnlyHtml(); announce(t('build.status.suggest')); return; }
    render(); announce(t('build.status.skeleton', { place: L(pkg.destination.name) }));
    $('#build-result h2')?.focus({ preventScroll: false });
    fetchFlights(mine); hotelGroups().forEach((_, i) => fetchHotels(mine, i)); fetchPolish(mine);
  } catch (error) {
    if (mine !== version) return;
    out.removeAttribute('aria-busy'); out.innerHTML = ''; err.textContent = error.message || t('build.err.generic'); err.hidden = false;
  } finally { if (mine === version) { button.disabled = false; button.removeAttribute('aria-busy'); } }
}
async function fetchFlights(mine) {
  if (!pkg.flightSearch) return;
  try {
    const result = await post('/api/build/flights', { search: pkg.flightSearch, request: { adults: pkg.request.adults, children: pkg.request.children, needs: pkg.request.needs, budget: pkg.request.budget || null } });
    if (mine !== version) return;
    pkg.flights = result.status === 'live' ? result : { status: 'quote', reason: result.reason || result.status };
  } catch (error) { if (mine === version) pkg.flights = { status: 'quote', reason: error.status === 429 ? 'rate_limited' : '' }; }
  if (mine !== version) return;
  fitBudget(); repaintPrices(); persist();
  announce(pkg.flights.status === 'live' ? t('build.status.flights', { count: pkg.flights.picks.length }) : t('build.status.flightsQuote'));
}
const hotelGroups = () => (pkg.hotels.stops ? pkg.hotels.stops : [pkg.hotels]);
// Spec 28: once every price is in, fit the package under the budget (cheapest fitting flight → cheaper hotel → lower
// meal plan → a star down → no car). In memory on what arrived; never after the visitor chose something by hand.
function fitBudget() {
  if (!pkg?.request?.budget || pkg.manual || pkg.flights.status === 'pending' || hotelGroups().some((g) => g.status === 'pending')) return;
  const result = fitPackage(pkg, getFx());
  if (result) pkg.fit = { ...result, steps: [...new Set([...(pkg.fit?.steps || []), ...result.steps])] };
}
function repaintPrices() { for (const part of ['flights', 'hotels', 'car', 'total', 'banner', 'upsell']) paint(part); }
async function fetchHotels(mine, i, area) {
  const spec = pkg.hotelSearches?.[i];
  if (!spec) return;
  const group = hotelGroups()[i];
  if (area !== undefined) { spec.area = area; group.status = 'pending'; paint('hotels'); }
  try {
    const result = await post('/api/build/hotels', { search: spec });
    if (mine !== version) return;
    Object.assign(group, result.status === 'live' ? { ...result, selected: result.picks[0]?.id } : result.status === 'estimate' ? { ...result, picks: [] } : { status: 'quote', picks: [], reason: result.reason || result.status });
  } catch (error) { if (mine === version) Object.assign(group, { status: 'quote', picks: [], reason: error.status === 429 ? 'rate_limited' : '' }); }
  if (mine !== version) return;
  fitBudget(); repaintPrices(); persist();
  announce(group.status === 'live' ? t('build.status.hotels', { count: group.picks.length }) : group.status === 'estimate' ? t('build.status.hotelsEstimate') : t('build.status.hotelsQuote'));
}
async function fetchPolish(mine) {
  try {
    const data = await post('/api/build/polish', { destination: L(pkg.destination.name), travellers: travellersText(pkg.request), days: pkg.itinerary.map((d) => ({ kind: d.kind, items: d.items.map((x) => x.name) })) });
    if (mine !== version || !data.polish || data.polish.dayTitles.length !== pkg.itinerary.length) return;
    pkg.polish = data.polish; pkg.itinerary.forEach((d, i) => { d.title = data.polish.dayTitles[i]; });
    paint('itinerary'); paint('where'); persist();
  } catch { /* the rules' wording stays */ }
}

// ---- rendering
function skeletonHtml() {
  return `<div class="build-skeleton" aria-hidden="true">${['where', 'flights', 'hotels', 'itinerary'].map(() => '<div class="bk-card bk-skel"><span></span><span></span><span></span></div>').join('')}</div><p class="micro-copy">${t('build.status.planning')}</p>`;
}
function suggestionsOnlyHtml() {
  return `<section class="bk-card"><h2 tabindex="-1">${t('build.where.pick')}</h2>${suggestionsHtml()}</section>`;
}
function suggestionsHtml() {
  if (!pkg.suggestions?.length) return '';
  return `<ul class="bk-suggestions">${pkg.suggestions.map((s) => `<li class="bk-suggestion${s.id === pkg.destination?.id ? ' current' : ''}">${s.image ? `<img src="${esc(s.image)}" alt="" loading="lazy" data-fallback>` : ''}<div><strong>${esc(L(s.name))}</strong> <small>${esc(L(s.country))}</small>
   <p class="micro-copy">${esc(s.reasons.join(' · ') || t('build.where.fit'))}</p>${s.advisory ? `<p class="micro-copy bk-advisory">${esc(s.advisory)}</p>` : ''}${s.flightHours ? `<p class="micro-copy">${t('build.where.flight', { hours: s.flightHours })}${s.direct ? ' · ' + t('build.where.direct') : ''}</p>` : ''}</div>
   ${s.id === pkg.destination?.id ? `<span class="bk-current" aria-current="true">${t('build.where.chosen')}</span>` : `<button type="button" class="button secondary" data-choose="${esc(s.id)}">${t('build.where.choose', { place: esc(L(s.name)) })}</button>`}</li>`).join('')}</ul>`;
}
function render() {
  const r = pkg.request, out = $('#build-result');
  out.removeAttribute('aria-busy');
  const stops = pkg.stops?.length ? pkg.stops : [pkg.destination];
  const stale = pkg.sharedAt && isStale(pkg.flights?.searchedAt || pkg.sharedAt);
  out.innerHTML = `<div class="bk-summary">
    ${pkg.destination.image ? `<img class="bk-hero-img" src="${esc(pkg.destination.image)}" alt="" data-fallback>` : ''}
    <div><span class="eyebrow">${t('build.result.kicker')}</span><h2 tabindex="-1">${esc(stops.map((s) => L(s.name)).join(' ← '))}</h2>
    <p>${esc(longDay(r.start))} – ${esc(longDay(r.end))} · ${t('build.nights', { count: r.nights })} · ${esc(travellersText(r))}</p>
    ${pkg.understood?.length ? `<p class="bk-understood"><span class="reply-label">${t('build.understood')}</span> ${pkg.understood.map((u) => `<span class="understood-chip">${esc(u.label)}</span>`).join('')}</p>` : ''}
    ${pkg.assumed?.length ? `<p class="micro-copy bk-assumed">${t('build.assumed', { list: esc(pkg.assumed.join(' · ')) })}</p>` : ''}
    ${pkg.questions?.length ? `<p class="next-question">${pkg.questions.map(esc).join('<br>')}</p>` : ''}
    ${stale ? `<p class="notice">${t('build.shared.stale', { time: esc(fmtDate(pkg.sharedAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })) })} <button type="button" class="link-button" data-act="refresh">${t('build.shared.refresh')}</button></p>` : ''}
    </div></div>
   <div id="bc-banner" class="bk-banner-host"></div>
   ${editHtml()}
   <div class="bk-grid">
    <div class="bk-main">
     <section class="bk-card" id="bc-where" aria-labelledby="bh-where"></section>
     <section class="bk-card" id="bc-flights" aria-labelledby="bh-flights"></section>
     <section class="bk-card" id="bc-hotels" aria-labelledby="bh-hotels"></section>
     <section class="bk-card" id="bc-car" aria-labelledby="bh-car"></section>
     <section class="bk-card" id="bc-insurance" aria-labelledby="bh-insurance"></section>
     <section class="bk-card" id="bc-itinerary" aria-labelledby="bh-itinerary"></section>
     <section class="bk-card" id="bc-practical" aria-labelledby="bh-practical"></section>
    </div>
    <aside class="bk-side"><section class="bk-card bk-total" id="bc-total" aria-labelledby="bh-total"></section>
     <section class="bk-card bk-upsell" id="bc-upsell" aria-labelledby="bh-upsell"></section>
     <div class="bk-actions" role="group" aria-label="${esc(t('build.actions'))}">
      <button type="button" class="button yellow full-width" data-act="lead">${icon('send')}${t('build.act.lead')}</button>
      <button type="button" class="button secondary" data-act="save">${icon('heart')}${t('build.act.save')}</button>
      <button type="button" class="button secondary" data-act="share">${icon('send')}${t('build.act.share')}</button>
      <button type="button" class="button secondary" data-act="print">${icon('case')}${t('build.act.print')}</button>
      <button type="button" class="button secondary" data-act="rebuild">${icon('spark')}${t('build.act.rebuild')}</button>
      <p class="micro-copy" id="build-act-status" role="status"></p>
     </div>
     <section class="bk-card bk-lead" id="bc-lead" ${leadOpen ? '' : 'hidden'}></section>
    </aside>
   </div>`;
  for (const part of ['where', 'flights', 'hotels', 'car', 'insurance', 'itinerary', 'practical', 'total', 'banner', 'upsell']) paint(part);
  if (leadOpen) paintLead();
  wireImages(out);
  loadBrochureData().then((x) => { brochureData = x; }).catch(() => {});
}
function wireImages(root) { root.querySelectorAll('img[data-fallback]').forEach((img) => img.addEventListener('error', () => img.classList.add('bk-noimg'), { once: true })); }

function editHtml() {
  const r = pkg.request, n = r.needs;
  return `<details class="bk-edit"><summary>${icon('edit')}${t('build.edit.summary')}</summary><form id="build-edit" class="bk-edit-form">
   <label>${t('build.edit.adults')}<input type="number" name="adults" min="1" max="9" value="${r.adults}"></label>
   <label>${t('build.edit.children')}<input type="number" name="children" min="0" max="8" value="${r.children}"></label>
   <label>${t('build.edit.ages')}<input type="text" name="childAges" inputmode="numeric" placeholder="${esc(t('build.edit.agesPlaceholder'))}" value="${esc(r.childAges.join(', '))}"></label>
   <label>${t('build.edit.start')}<input type="date" name="start" value="${esc(r.start)}"></label>
   <label>${t('build.edit.nights')}<input type="number" name="nights" min="1" max="30" value="${r.nights}"></label>
   <label>${t('build.edit.stars')}<select name="minStars">${[0, 3, 4, 5].map((s) => `<option value="${s}" ${n.minStars === s ? 'selected' : ''}>${s ? t('build.edit.starsN', { stars: s }) : t('build.edit.starsAny')}</option>`).join('')}</select></label>
   <label>${t('build.edit.car')}<select name="car">${['auto', 'yes', 'no'].map((c) => `<option value="${c}" ${n.car === c ? 'selected' : ''}>${t(`build.edit.car.${c}`)}</option>`).join('')}</select></label>
   <label class="lead-check"><input type="checkbox" name="allInclusive" ${n.allInclusive ? 'checked' : ''}><span>${t('build.edit.allInclusive')}</span></label>
   <label class="lead-check"><input type="checkbox" name="kosher" ${n.kosher ? 'checked' : ''}><span>${t('build.edit.kosher')}</span></label>
   <label class="lead-check"><input type="checkbox" name="shabbat" ${n.shabbat ? 'checked' : ''}><span>${t('build.edit.shabbat')}</span></label>
   <button type="submit" class="button yellow">${t('build.edit.apply')}</button></form></details>`;
}
function editsFrom(form) {
  const d = new FormData(form), num = (k) => (d.get(k) === '' ? undefined : Number(d.get(k)));
  return { adults: num('adults'), children: num('children'), childAges: String(d.get('childAges') || '').split(/[,\s]+/).filter(Boolean).map(Number).filter(Number.isInteger),
    start: String(d.get('start') || '') || undefined, nights: num('nights'), minStars: num('minStars'), car: String(d.get('car')), allInclusive: d.get('allInclusive') === 'on', kosher: d.get('kosher') === 'on', shabbat: d.get('shabbat') === 'on' };
}

const PAINT = {
  where() {
    const d = pkg.destination;
    return `<h3 id="bh-where">${icon('globe')}${t('build.where.title')}</h3>
     ${pkg.polish?.intro ? `<p class="bk-intro">${esc(pkg.polish.intro)} <small class="bk-ai">${t('build.ai.note')}</small></p>` : ''}
     <p>${esc(L(d.summary))}</p>${d.advisory ? `<p class="notice bk-advisory">${esc(L(d.advisory))}</p>` : ''}${pkg.highlights?.length ? `<ul class="bk-highlights">${pkg.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}
     ${pkg.suggestions?.length > 1 ? `<h4>${t('build.where.others')}</h4>${suggestionsHtml()}` : ''}`;
  },
  flights() {
    const f = pkg.flights, head = `<h3 id="bh-flights">${icon('plane')}${t('build.flights.title')}</h3>`;
    if (f.status === 'pending') return head + `<p class="bk-pending" aria-busy="true">${t('build.flights.pending')}</p>`;
    if (f.status !== 'live') return head + `<p>${kindPill('quote')} ${t(f.reason === 'not_connected' ? 'build.flights.notConnected' : f.reason === 'rate_limited' ? 'build.err.rateLimited' : 'build.flights.quote')}</p>`;
    const link = pkg.stops?.length ? multiLink({ legs: f.picks[0].legs.map((l) => ({ from: l.from, to: l.to, date: l.date })), adults: pkg.request.adults, children: pkg.request.children })
      : searchLink({ origin: pkg.request.origin, destination: pkg.destination.code, start: pkg.request.start, end: pkg.request.end, type: 'round', adults: pkg.request.adults, children: pkg.request.children });
    const flightView = flightsInBudget(pkg, getFx());
    return head + `<p class="micro-copy">${kindPill('live')} ${t('build.flights.found', { count: f.total })} · ${esc(checked(f.searchedAt))}</p>
     ${flightView.hidden ? `<p class="micro-copy bk-over-note">${t('build.flights.hiddenOver', { count: flightView.hidden, budget: esc(formatIls(pkg.request.budget)) })}</p>` : ''}
     ${flightView.allOver ? `<p class="bk-budget bk-budget-over">${t('build.flights.allOver', { budget: esc(formatIls(pkg.request.budget)) })}</p>` : ''}
     <ul class="bk-options">${flightView.shown.map((p) => `<li><button type="button" class="bk-option" data-pick-flight="${esc(p.key)}" aria-pressed="${p.key === f.selected}">
      <span class="bk-option-main"><strong>${esc(p.carriers.join(' + '))}</strong>${p.badges.length ? `<span class="bk-badges">${p.badges.map((b) => `<span class="flight-badge badge-${esc(b)}">${t(`app.badge.${b}`)}</span>`).join('')}</span>` : ''}
      ${p.legs.map((l) => `<span class="bk-leg" dir="ltr">${esc(l.from)} ${esc(l.depart)} → ${esc(l.to)} ${esc(l.arrive)}${l.dayOffset ? ` +${l.dayOffset}` : ''}</span><small>${esc(longDay(l.date))} · ${l.stops ? t('build.flights.stops', { count: l.stops }) : t('build.flights.direct')}</small>`).join('')}
      ${p.reasons.length ? `<small class="why">${esc(p.reasons.join(' · '))}</small>` : ''}</span>
      <span class="bk-option-price"><strong dir="ltr">${esc(fare(p.price))}</strong><small>${t('build.flights.forAll', { count: travellers(pkg.request) })}</small></span></button></li>`).join('')}</ul>
     ${bookable(f) ? `<p class="bo-book-flight"><button type="button" class="button yellow" data-book-flight>${t('booking.builder.book')}</button> <span class="micro-copy">${t('booking.builder.bookNote')}</span></p><p class="micro-copy" id="bo-book-status" role="status"></p>` : ''}
     <p class="micro-copy">${t('build.flights.note')} <a href="${esc(link)}">${t('build.flights.full')}</a></p>`;
  },
  hotels() {
    const groups = hotelGroups(), head = `<h3 id="bh-hotels">${icon('hotel')}${t('build.hotels.title')}</h3>`;
    return head + groups.map((g, i) => {
      const stop = pkg.stops?.length ? pkg.stops[i] : pkg.destination, areas = pkg.areas?.[i] || [];
      const areaLine = g.area ? `<p class="bk-area"><strong>${t('build.hotels.area', { area: esc(L(g.area.name)) })}</strong> ${esc(L(g.area.forWhom))}</p>` : '';
      const areaPick = areas.length > 1 ? `<label class="bk-area-pick">${t('build.hotels.otherArea')}<select data-area="${i}">${areas.map((a) => `<option value="${esc(L(a.name).length ? (a.name.en || L(a.name)) : '')}" ${g.area && L(g.area.name) === L(a.name) ? 'selected' : ''}>${esc(L(a.name))}</option>`).join('')}</select></label>` : '';
      const title = groups.length > 1 ? `<h4>${esc(L(stop.name))} · ${t('build.nights', { count: stop.nights })}</h4>` : '';
      if (g.status === 'pending') return title + areaLine + `<p class="bk-pending" aria-busy="true">${t('build.hotels.pending')}</p>`;
      if (g.status === 'estimate' && g.estimate) {
        const e = g.estimate, conv = (v) => fare({ value: v, currency: e.currency });
        const what = [g.minStars ? t('build.hotels.estStars', { stars: g.minStars }) : '', g.board && !g.boardFallback ? t(`build.board.${g.board}`) : ''].filter(Boolean).join(' · ');
        return title + areaLine + areaPick + `<div class="bk-hotel-est"><p>${kindPill('estimate')} <strong>${t('build.hotels.estLine', { low: `<span class="bk-range" dir="ltr">${esc(conv(e.perNight.low))} – ${esc(conv(e.perNight.high))}</span>`, what: esc(what || t('build.hotels.estAny')), where: e.areaScope && g.area ? t('build.hotels.estInArea', { area: esc(L(g.area.name)) }) : t('build.hotels.estInDest') })}</strong></p>
          <p>${t('build.hotels.estStay', { nights: e.nights, range: `<span class="bk-range" dir="ltr">${esc(conv(e.stay.low))} – ${esc(conv(e.stay.high))}</span>` })}</p>
          <p class="micro-copy">${t('build.hotels.estNote', { count: e.count, time: esc(checked(g.searchedAt)) })}${g.boardFallback ? ' · ' + t('build.hotels.boardFallback', { board: t(`build.board.${g.board}`) }) : ''}</p></div>`;
      }
      if (g.status !== 'live') return title + areaLine + areaPick + `<p>${kindPill('quote')} ${t(g.reason === 'not_connected' ? 'build.hotels.notConnected' : g.reason === 'rate_limited' ? 'build.err.rateLimited' : 'build.hotels.quote')}</p>`;
      const shown = showAllHotels.has(i) ? g.picks : g.picks.slice(0, 3);
      return title + areaLine + areaPick + `<p class="micro-copy">${kindPill('live')} ${t('build.hotels.found', { count: g.total })} · ${esc(checked(g.searchedAt))}${g.boardFallback ? ' · ' + t('build.hotels.boardFallback', { board: t(`build.board.${g.board}`) }) : ''}${g.relaxedStars ? ' · ' + t('build.hotels.relaxed') : ''}</p>
       <ul class="bk-options bk-hotels">${shown.map((h) => `<li><button type="button" class="bk-option bk-hotel" data-pick-hotel="${i}:${esc(h.id)}" aria-pressed="${h.id === g.selected}">
        ${h.image ? `<img src="${esc(h.image)}" alt="" loading="lazy" width="96" height="72" data-fallback>` : ''}
        <span class="bk-option-main"><strong>${esc(h.name)}</strong><span class="bk-stars" aria-label="${esc(t('build.hotels.stars', { stars: h.stars }))}">${'★'.repeat(h.stars || 0)}</span>
         ${h.role ? `<span class="bk-badges"><span class="flight-badge badge-${h.role === 'value' ? 'recommended' : h.role === 'budget' ? 'cheapest' : 'value'}">${t(`build.hotels.role.${h.role}`)}</span></span>` : ''}
         <small>${esc(h.address)}</small>
         <span class="bk-tags">${h.board ? `<span class="pill">${t(`build.board.${h.board}`)}</span>` : ''}${h.areaMatch ? `<span class="pill">${t('build.hotels.inArea')}</span>` : ''}${h.family ? `<span class="pill">${t('build.hotels.family')}</span>` : ''}${h.refundable ? '' : `<span class="pill pill-warn">${t('build.hotels.nonRefundable')}</span>`}</span></span>
        <span class="bk-option-price"><strong dir="ltr">${esc(fare(h.price))}</strong><small>${t('build.hotels.forStay', { nights: h.nights })}</small><small dir="ltr">${esc(fare({ value: h.price.value / (h.nights || 1), currency: h.price.currency }))} ${t('build.hotels.perNight')}</small></span></button></li>`).join('')}</ul>
       ${g.picks.length > 3 ? `<button type="button" class="link-button" data-more-hotels="${i}" aria-expanded="${showAllHotels.has(i)}">${showAllHotels.has(i) ? t('build.hotels.less') : t('build.hotels.more', { count: g.picks.length })}</button>` : ''}
       <p class="micro-copy">${t('build.hotels.note')}</p>`;
    }).join('<hr>');
  },
  car() {
    const c = pkg.car;
    return `<h3 id="bh-car">${icon('pin')}${t('build.car.title')}</h3><p><strong>${t(`build.car.${c.advice}`)}</strong> ${esc(c.note || '')}</p>
     <label class="lead-check"><input type="checkbox" data-car ${c.include ? 'checked' : ''}><span>${t('build.car.include')}</span></label>
     ${c.include ? `<p>${kindPill('quote')} ${t('build.car.quote')}</p><p class="micro-copy">${esc(c.driverAgeNote || t('build.car.age'))}</p>` : ''}`;
  },
  insurance() {
    const url = pkg.config?.insuranceUrl;
    return `<h3 id="bh-insurance">${icon('shield')}${t('build.insurance.title')}</h3><label class="lead-check"><input type="checkbox" data-insurance ${pkg.insurance?.include ? 'checked' : ''}><span>${t('build.insurance.include')}</span></label>
     ${pkg.insurance?.include ? `<p>${kindPill('quote')} ${t('build.insurance.quote')}</p>` : `<p class="micro-copy">${t('build.insurance.hint')}</p>`}
     ${url ? `<p class="micro-copy"><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${t('build.insurance.partner')}</a></p>` : ''}`;
  },
  itinerary() {
    const days = pkg.itinerary, movable = (d) => ['full', 'daytrip', 'rest', 'free'].includes(d.kind);
    return `<h3 id="bh-itinerary">${icon('calendar')}${t('build.itinerary.title')}</h3><p class="micro-copy">${t('build.itinerary.hint')}${pkg.polish ? ' ' + t('build.ai.note') : ''}</p>
     <ol class="bk-days">${days.map((d, i) => `<li class="bk-day bk-day-${esc(d.kind)}"><div class="bk-day-head"><span class="day-number">${d.day}</span><div><strong>${esc(d.title)}</strong><small>${esc(longDay(d.date))}${pkg.stops?.length ? ' · ' + esc(L(pkg.stops[d.stop]?.name)) : ''}</small></div>
       ${movable(d) ? `<span class="bk-day-move"><button type="button" class="icon-button" data-day-up="${i}" aria-label="${esc(t('build.itinerary.up', { day: d.day }))}" ${i > 0 && movable(days[i - 1]) ? '' : 'disabled'}>▲</button><button type="button" class="icon-button" data-day-down="${i}" aria-label="${esc(t('build.itinerary.down', { day: d.day }))}" ${i < days.length - 1 && movable(days[i + 1]) ? '' : 'disabled'}>▼</button></span>` : ''}</div>
       ${d.items.length ? `<ul>${d.items.map((x, j) => `<li><a href="${esc(x.mapsUrl)}" target="_blank" rel="noopener noreferrer">${esc(x.name)}</a> <small>${x.durationH ? t('build.itinerary.hours', { hours: x.durationH }) : ''}</small><button type="button" class="link-button" data-remove-item="${i}:${j}" aria-label="${esc(t('build.itinerary.remove', { name: x.name }))}">✕</button></li>`).join('')}</ul>` : ''}
       ${d.note ? `<p class="micro-copy">${esc(d.note)}</p>` : ''}</li>`).join('')}</ol>
     ${pkg.spare?.length ? `<details class="bk-spare"><summary>${t('build.itinerary.spare', { count: pkg.spare.length })}</summary><ul>${pkg.spare.map((x, k) => `<li><a href="${esc(x.mapsUrl)}" target="_blank" rel="noopener noreferrer">${esc(x.name)}</a> <button type="button" class="link-button" data-add-spare="${k}">${t('build.itinerary.add')}</button></li>`).join('')}</ul></details>` : ''}`;
  },
  practical() {
    const p = pkg.practical || {};
    const rows = [['visa', p.visa], ['currency', p.currency], ['language', p.language], ['timeZone', p.timeZone && timeVsIsrael(p.timeZone, new Date((pkg.request.start || new Date().toISOString().slice(0, 10)) + 'T12:00:00Z'))], ['kosher', p.kosher], ['shabbat', p.shabbat], ['season', p.season]].filter(([, v]) => v);
    return `<h3 id="bh-practical">${icon('shield')}${t('build.practical.title')}</h3><dl class="bk-practical">${rows.map(([k, v]) => `<div class="${(k === 'kosher' && pkg.request.needs.kosher) || (k === 'shabbat' && pkg.request.needs.shabbat) ? 'bk-flag' : ''}"><dt>${t(`build.practical.${k}`)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl><p class="micro-copy">${esc(p.check || t('build.practical.check'))}</p>`;
  },
  total() {
    const pr = pricePackage(pkg, getFx()), label = (l) => l.name || t(`build.line.${l.id.split(':')[0]}`, { place: l.stop !== undefined && pkg.stops?.length ? L(pkg.stops[l.stop]?.name) : '' });
    const value = (l) => l.kind === 'live' ? `<strong dir="ltr">${esc(l.ils === null ? formatOriginal(l.price) : formatIls(l.ils))}</strong>` : l.kind === 'estimate' ? (l.range ? range(l.range.low, l.range.high) : `<span class="bk-range" dir="ltr">${esc(formatOriginal({ value: l.original.low, currency: l.original.currency }))} – ${esc(formatOriginal({ value: l.original.high, currency: l.original.currency }))}</span>`) : l.kind === 'pending' ? `<span class="bk-pending">${t('build.kind.pending')}</span>` : `<span>${t('build.price.byRep')}</span>`;
    return `<h3 id="bh-total">${icon('tag')}${t('build.total.title')}</h3><table class="bk-lines"><tbody>${pr.lines.map((l) => `<tr><th scope="row">${esc(label(l))}<br>${kindPill(l.kind)}</th><td>${value(l)}${l.at ? `<small>${esc(checked(l.at))}</small>` : ''}</td></tr>`).join('')}</tbody></table>
     ${pr.total ? `<div class="bk-sum"><p>${t('build.total.live')} <strong dir="ltr">${esc(formatIls(pr.total.live))}</strong></p><p>${t('build.total.withEstimate')} <strong>${range(pr.total.low, pr.total.high)}</strong></p>
       <p class="micro-copy">${t('build.total.perPerson', { live: esc(formatIls(pr.perPerson.live)), low: esc(formatIls(pr.perPerson.low)), high: esc(formatIls(pr.perPerson.high)), count: pr.people })}</p></div>` : pr.missingFx ? `<p class="micro-copy">${t('build.total.noFx')}</p>` : ''}
     ${pr.budget ? budgetHtml(pr) : ''}
     <div class="bk-legend"><p>${kindPill('live')} ${t('build.legend.live')}</p><p>${kindPill('estimate')} ${t('build.legend.estimate')}</p><p>${kindPill('quote')} ${t('build.legend.quote')}</p></div>
     ${getFx() ? `<p class="micro-copy">${esc(fxNote())}</p>` : ''}`;
  },
  // Above the cards: an over-budget package is never shown as if it fits (spec 28 §א.5).
  banner() {
    const b = pricePackage(pkg, getFx()).budget;
    return b?.verdict === 'over' ? `<p class="bk-budget-banner">${t('build.budget.banner', { diff: esc(formatIls(b.diff)), budget: esc(formatIls(b.amount)) })} <a href="#bc-total" data-budget-jump>${t('build.budget.bannerLink')}</a></p>` : '';
  },
  upsell() { return upsellHtml(); }
};
// The budget box of the total card: within (with what is left), over (closest + three ways out), or not yet known.
function budgetHtml(pr) {
  const b = pr.budget, money = (v) => esc(formatIls(v)), all = pkg.fit?.steps || [], steps = all.filter((s) => s !== 'restored');
  const restored = all.includes('restored') ? `<p class="micro-copy">${t('build.budget.restored', { stars: hotelGroups()[0]?.minStars || '' })}</p>` : '';
  if (b.verdict === 'within') return `<div class="bk-budget bk-budget-within"><p>${t('build.budget.within', { budget: money(b.amount), left: money(b.left) })}</p>${restored}${steps.length ? `<p class="micro-copy">${t('build.budget.steps', { list: steps.map((s) => t(`build.budget.step.${s}`)).join(', ') })}</p>` : ''}</div>`;
  if (b.verdict !== 'over') {
    const plan = pkg.budgetPlan;
    return `<p class="bk-budget bk-budget-${b.verdict}">${t(`build.total.budget.${b.verdict}`, { budget: money(b.amount) })}</p>${b.verdict === 'unverified' && plan && !plan.fits ? budgetActions({ overBy: plan.overBy, raiseTo: plan.raiseTo, nights: plan.nights }, b.amount) : ''}`;
  }
  return budgetActions({ overBy: b.diff, raiseTo: Math.ceil(pr.total.high / 100) * 100, nights: pkg.fit?.nights || pkg.budgetPlan?.nights }, b.amount, steps);
}
function budgetActions({ overBy, raiseTo, nights }, amount, steps = []) {
  const alts = (pkg.budgetPlan?.alternatives || []).filter((a) => a.id !== pkg.destination.id);
  return `<div class="bk-budget bk-budget-over"><p><strong>${t('build.budget.over', { diff: esc(formatIls(overBy)), budget: esc(formatIls(amount)) })}</strong></p>
    ${steps.length ? `<p class="micro-copy">${t('build.budget.steps', { list: steps.map((s) => t(`build.budget.step.${s}`)).join(', ') })}</p>` : ''}
    <p class="micro-copy">${t('build.budget.overLead')}</p>
    <div class="bk-budget-acts" role="group" aria-label="${esc(t('build.budget.overLead'))}">
     ${nights && nights < pkg.request.nights ? `<button type="button" class="button secondary" data-budget-act="nights" data-value="${nights}">${t('build.budget.act.nights', { nights })}</button>` : ''}
     ${alts.map((a) => `<button type="button" class="button secondary" data-budget-act="dest" data-value="${esc(a.id)}">${t('build.budget.act.dest', { place: esc(L(a.name)) })}</button>`).join('')}
     <button type="button" class="button yellow" data-budget-act="raise" data-value="${raiseTo}">${t('build.budget.act.raise', { amount: esc(formatIls(raiseTo)) })}</button>
    </div></div>`;
}

// ---- "add up to ₪500 and get…" (spec 28 §ב): an accessible scroll-snap carousel next to the total.
let offers = [];
const offerTitle = (o) => (o.type === 'trip' ? o.name : t(`build.upsell.${o.type}.title`, { stars: o.stars, board: o.board ? t(`build.board.${o.board}`) : '' }));
const offerWhat = (o) => (o.type === 'trip' ? esc(o.note || t('build.upsell.trip.what')) : t(`build.upsell.${o.type}.what`, { stars: o.stars, carriers: esc((o.carriers || []).join(' + ')), nights: o.nights, was: pkg.request.nights }));
const offerIcon = (o) => (o.type === 'direct' || o.type === 'bag' ? 'plane' : o.type === 'trip' ? 'pin' : 'hotel');
function upsellHtml() {
  offers = pkg.sharedAt ? [] : upsellOffers(pkg, getFx(), { trips: pkg.upsellTrips || [], images: tripImages });
  if (!offers.length) return '';
  const rtl = document.documentElement.dir === 'rtl';
  return `<h3 id="bh-upsell">${icon('spark')}${t('build.upsell.title')}</h3><p class="micro-copy">${t('build.upsell.intro')}</p>
   <div class="bk-carousel" role="region" aria-roledescription="carousel" aria-label="${esc(t('build.upsell.label'))}">
    <ul class="bk-car-track">${offers.map((o, i) => `<li class="bk-car-slide" role="group" aria-roledescription="slide" aria-label="${esc(t('build.upsell.slide', { n: i + 1, count: offers.length }))}: ${esc(offerTitle(o))}">
     <div class="bk-car-img">${o.image ? `<img src="${esc(o.image)}" alt="" loading="lazy" data-fallback>` : ''}<span class="bk-car-badge" aria-hidden="true">${icon(offerIcon(o))}</span></div>
     <div class="bk-car-body"><h4>${esc(offerTitle(o))}</h4><p>${offerWhat(o)}</p>
      <p class="bk-car-price"><strong>${t(o.exact ? 'build.upsell.exact' : 'build.upsell.estimate', { amount: `<bdi dir="ltr">+${esc(formatIls(o.extra))}</bdi>` })}</strong> <span class="bk-kind bk-${o.exact ? 'live' : 'estimate'}">${t(o.exact ? 'build.upsell.kind.exact' : 'build.upsell.kind.estimate')}</span></p>
      <button type="button" class="button yellow" data-upsell="${i}">${t('build.upsell.add')}</button></div></li>`).join('')}</ul>
    ${offers.length > 1 ? `<div class="bk-car-nav"><button type="button" class="icon-button" data-carousel="-1" aria-label="${esc(t('build.upsell.prev'))}">${rtl ? '›' : '‹'}</button><span class="micro-copy" data-car-pos aria-hidden="true">1 / ${offers.length}</span><button type="button" class="icon-button" data-carousel="1" aria-label="${esc(t('build.upsell.next'))}">${rtl ? '‹' : '›'}</button></div>` : ''}
   </div>`;
}
// The slide whose start edge is nearest the track's start edge (works for RTL negative scroll and LTR alike).
function currentSlide(track) {
  const slides = [...track.children], box = track.getBoundingClientRect(), rtl = getComputedStyle(track).direction === 'rtl';
  const edge = (r) => Math.abs(rtl ? box.right - r.right : r.left - box.left);
  return slides.reduce((best, s, i) => (edge(s.getBoundingClientRect()) < edge(slides[best].getBoundingClientRect()) ? i : best), 0);
}
function moveCarousel(root, dir, focus = false) {
  const track = root.querySelector('.bk-car-track'), slides = [...(track?.children || [])];
  if (!slides.length) return;
  const next = slides[Math.min(slides.length - 1, Math.max(0, currentSlide(track) + dir))];
  const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  track.scrollTo({ left: track.scrollLeft + (next.getBoundingClientRect()[getComputedStyle(track).direction === 'rtl' ? 'right' : 'left'] - track.getBoundingClientRect()[getComputedStyle(track).direction === 'rtl' ? 'right' : 'left']), behavior: smooth ? 'smooth' : 'auto' });
  const pos = root.querySelector('[data-car-pos]');
  if (pos) pos.textContent = `${slides.indexOf(next) + 1} / ${slides.length}`;
  if (focus) next.querySelector('button')?.focus({ preventScroll: true });
}
// Spec 25: the chosen flight can be booked on the site while its search is fresh (the supplier token lives an hour).
// Flights only – hotels stay quoted by an agent while HOTELS_PUBLIC_DISPLAY is off.
let bookingEnabled = false;
const bookable = (f) => bookingEnabled && f?.booking?.srk && !pkg?.sharedAt && Date.now() - Date.parse(f.searchedAt || 0) < 45 * 60_000 && Boolean(selectedFlight(pkg)?.offerIndex);
function paint(part) {
  const host = view && $(`#bc-${part}`, view);
  if (!host || !pkg?.destination) return;
  const focus = document.activeElement && host.contains(document.activeElement) ? [...host.querySelectorAll('button,select,input,a')].indexOf(document.activeElement) : -1;
  host.innerHTML = PAINT[part]();
  if (part === 'upsell' || part === 'banner') host.hidden = !host.innerHTML.trim();
  host.toggleAttribute('aria-busy', host.querySelector('[aria-busy="true"]') !== null);
  wireImages(host);
  if (focus >= 0) host.querySelectorAll('button,select,input,a')[focus]?.focus();
}

// ---- hand-off to a representative (lead type "package")
function paintLead() {
  const host = $('#bc-lead', view);
  host.hidden = false;
  host.innerHTML = `<h3 tabindex="-1">${t('build.lead.title')}</h3><p class="micro-copy">${t('build.lead.intro')}</p>
   <form id="build-lead" class="lead-form" novalidate>
    ${[['name', 'text', 'autocomplete="name" maxlength="80" required'], ['phone', 'tel', 'autocomplete="tel" inputmode="tel" dir="ltr" maxlength="20" required placeholder="050-1234567"'], ['email', 'email', `autocomplete="email" dir="ltr" maxlength="${LIMITS.email}"`]].map(([n, type, attrs]) => `<div class="lead-field" data-field="${n}"><label for="bl-${n}">${t(`leads.field.${n}`)}</label><input id="bl-${n}" name="${n}" type="${type}" ${attrs} aria-describedby="bl-${n}-error"><p class="lead-error" id="bl-${n}-error" hidden></p></div>`).join('')}
    <fieldset class="lead-field lead-choices" data-field="channel"><legend>${t('leads.field.channel')}</legend>${Object.keys(CHANNELS).map((v, i) => `<label class="lead-chip"><input type="radio" name="channel" value="${v}" ${i === 0 ? 'checked' : ''}><span>${optionLabel('channel', v)}</span></label>`).join('')}<p class="lead-error" hidden></p></fieldset>
    <div class="lead-field" data-field="consent"><label class="lead-check"><input type="checkbox" name="consent" required aria-describedby="bl-consent-error"><span>${consentText()}</span></label><p class="lead-error" id="bl-consent-error" hidden></p></div>
    <label class="lead-check lead-marketing"><input type="checkbox" name="marketing"><span>${t('leads.marketing')}</span></label>
    <div class="lead-trap" aria-hidden="true"><label>${t('leads.trap')}<input name="website" tabindex="-1" autocomplete="off"></label></div>
    <p class="lead-form-error" role="alert" hidden></p>
    <button type="submit" class="button yellow full-width">${t('build.lead.submit')}</button></form>`;
}
async function submitLead(form) {
  const d = new FormData(form), snapshot = sanitizePackage(pkg);
  const input = { type: 'package', name: String(d.get('name') || ''), phone: String(d.get('phone') || ''), email: String(d.get('email') || '').trim(), channel: String(d.get('channel') || ''),
    consent: d.get('consent') === 'on', marketing: d.get('marketing') === 'on', website: String(d.get('website') || ''), source: '/build', lang, ...packageLeadFields(snapshot, lang), package: snapshot };
  const { errors } = validateLead(input, { lang });
  form.querySelectorAll('[data-field]').forEach((box) => { const m = errors[box.dataset.field], slot = box.querySelector('.lead-error'); if (slot) { slot.textContent = m || ''; slot.hidden = !m; } box.classList.toggle('invalid', Boolean(m)); });
  const formError = $('.lead-form-error', form);
  if (Object.keys(errors).length) { form.querySelector('.invalid input')?.focus(); return; }
  const button = $('[type=submit]', form); button.disabled = true;
  try {
    const response = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(errorText(data.error, data.message, 'leads'));
    const host = $('#bc-lead', view);
    host.innerHTML = `<h3 tabindex="-1">${t('build.lead.done')}</h3><p>${t('build.lead.doneText', { ref: `<bdi dir="ltr">${esc(data.id)}</bdi>` })}</p><a class="button secondary" href="#/account">${t('build.lead.account')}</a>`;
    $('h3', host).focus(); announce(t('build.lead.done'));
  } catch (error) { formError.textContent = error.message || t('build.err.generic'); formError.hidden = false; button.disabled = false; }
}

// ---- save / share / print
async function snapshotId() {
  if (pkg.sharedId && pkg.sharedVersion === JSON.stringify(sanitizePackage(pkg))) return pkg.sharedId;
  const snapshot = sanitizePackage(pkg), data = await post('/api/build/share', { package: snapshot });
  pkg.sharedId = data.id; pkg.sharedVersion = JSON.stringify(snapshot);
  return data.id;
}
const shareUrl = (id) => `${location.origin}${location.pathname}#/build?p=${id}`;
const title = () => `${(pkg.stops?.length ? pkg.stops : [pkg.destination]).map((s) => L(s.name)).join(' ← ')} · ${longDay(pkg.request.start)}`;
function savedList() { try { const v = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]'); return Array.isArray(v) ? v.filter((x) => /^[a-f0-9]{16}$/.test(x?.id)).slice(0, 20) : []; } catch { return []; } }
async function save(status) {
  const id = await snapshotId(), entry = { id, title: title(), savedAt: new Date().toISOString() };
  let local = true; try { localStorage.setItem(SAVED_KEY, JSON.stringify([entry, ...savedList().filter((x) => x.id !== id)].slice(0, 20))); } catch { local = false; }
  // Only a signed-in customer has an account list; a guest keeps it on this device (no 401 noise).
  await accountReady.catch(() => {});
  const response = account.user ? await fetch('/api/account/packages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, title: entry.title, lang }) }).catch(() => null) : null;
  status.innerHTML = response?.ok ? t('build.save.account') : `${local ? t('build.save.device') : t('build.save.failedDevice')} <a href="#/account">${t('build.save.signIn')}</a>`;
}
async function share(status) {
  const url = shareUrl(await snapshotId());
  try { if (navigator.share) { await navigator.share({ title: title(), url }); return; } await navigator.clipboard.writeText(url); status.textContent = t('build.share.copied'); }
  catch (error) { if (error?.name !== 'AbortError') status.innerHTML = `${t('build.share.manual')} <input class="bk-share-url" readonly value="${esc(url)}" aria-label="${esc(t('build.share.link'))}">`; }
}
function persist() { try { sessionStorage.setItem(CURRENT_KEY, JSON.stringify({ input: lastInput, pkg })); } catch { /* convenience only */ } }

// ---- itinerary edits (local, no rebuild)
function moveDay(i, delta) {
  const days = pkg.itinerary, j = i + delta, a = days[i], b = days[j];
  if (!b) return;
  for (const key of ['kind', 'title', 'items', 'note']) [a[key], b[key]] = [b[key], a[key]];
  paint('itinerary'); persist();
  $(`[data-day-${delta < 0 ? 'up' : 'down'}="${j}"]`, view)?.focus();
  announce(t('build.itinerary.moved', { from: a.day, to: b.day }));
}

// ---- the page
async function openShared(id) {
  const out = $('#build-result');
  out.setAttribute('aria-busy', 'true'); out.innerHTML = skeletonHtml();
  try {
    const response = await fetch(`/api/build/share/${encodeURIComponent(id)}`), data = await response.json();
    if (!response.ok || !data.package) throw new Error();
    pkg = { ...data.package, understood: [], assumed: [], questions: [], suggestions: [], areas: [], spare: [], highlights: [] };
    lastInput = { text: pkg.request.text, chosen: pkg.destination.id };
    render(); $('#build-result h2')?.focus();
  } catch { out.removeAttribute('aria-busy'); out.innerHTML = `<p class="notice">${t('build.shared.missing')}</p>`; }
}
function refreshFromSnapshot() {
  const r = pkg.request;
  build({ text: r.text, chosen: pkg.destination.id, edits: { adults: r.adults, children: r.children, childAges: r.childAges, start: r.start, nights: r.nights, car: r.needs.car, allInclusive: r.needs.allInclusive, minStars: r.needs.minStars, kosher: r.needs.kosher, shabbat: r.needs.shabbat } });
}

function page({ view: host, footer, bread }) {
  view = host;
  const params = new URLSearchParams(location.hash.split('?')[1] || ''), q = params.get('q') || '', dest = params.get('dest') || '', shared = params.get('p') || '';
  stopDecor();
  view.innerHTML = `<div class="build-page gb-page">
   <section class="gb-stage"><canvas class="gb-ascii" aria-hidden="true"></canvas>
    <div class="route-width gb-stage-inner">${bread(t('build.title'))}
     <header class="build-hero gb-hero"><img class="gb-avatar" src="/assets/mascot.webp" alt="" width="96" height="96"><span class="eyebrow">${icon('spark')}${t('build.kicker')}</span><h1 tabindex="-1">${t('build.title')}</h1><p>${t('build.subtitle')}</p></header>
     ${inputHtml(q)}
    </div>
   </section>
   <div class="route-width gb-thread">
    <p id="build-status" class="sr-only" aria-live="polite"></p>
    <div class="gb-you" hidden><p></p></div>
    <div class="gb-msg"><img class="gb-msg-avatar" src="/assets/mascot.webp" alt="" width="40" height="40"><div id="build-result" class="build-result"></div></div>
    <p class="micro-copy build-disclaimer">${t('build.disclaimer')}</p>
   </div></div>${footer}`;
  const canvas = $('.gb-ascii', view), area = $('#build-text', view);
  decor = [asciiBackground(canvas), slingTop(t('build.toTop'))];
  const grow = () => { area.style.height = 'auto'; area.style.height = Math.min(area.scrollHeight, 240) + 'px'; };
  area.addEventListener('input', grow); grow();
  area.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('#build-form', view).requestSubmit(); } });
  loadFx();
  if (shared && /^[a-f0-9]{16}$/.test(shared)) openShared(shared);
  else if (q || dest) build({ text: q, dest });
  else {
    try { const saved = JSON.parse(sessionStorage.getItem(CURRENT_KEY) || 'null'); if (saved?.pkg?.destination) { pkg = saved.pkg; lastInput = saved.input; for (const g of [pkg.flights, ...hotelGroups()]) if (g.status === 'pending') g.status = 'quote'; $('#build-text').value = saved.input?.text || ''; render(); } } catch { /* fresh start */ }
  }
}

// Spec 27: print/PDF = a designed brochure, not the screen. Also catches ⌘P while a package is shown.
let brochureData = null, brochureLink = '';
function mountBrochure() {
  if (!pkg?.destination || !view?.isConnected) return false;
  document.getElementById('bk-brochure')?.remove();
  const box = document.createElement('div'); box.id = 'bk-brochure'; box.className = 'br'; box.setAttribute('aria-hidden', 'true');
  box.innerHTML = brochureHtml(pkg, { esc, L, longDay, fare, formatIls, totals: () => pricePackage(pkg, getFx()), hotelGroups, shareUrl: () => brochureLink }, brochureData || undefined);
  document.body.append(box); document.documentElement.classList.add('printing-brochure'); return box;
}
function unmountBrochure() { document.getElementById('bk-brochure')?.remove(); document.documentElement.classList.remove('printing-brochure'); }
async function printBrochure() {
  // Details (descriptions, photos, country info) and a live link for the cover QR; neither may block printing.
  brochureData = await loadBrochureData().catch(() => null);
  brochureLink = await Promise.race([snapshotId().then(shareUrl), new Promise((ok) => setTimeout(() => ok(''), 3000))]).catch(() => '');
  const box = mountBrochure(); if (!box) return window.print();
  // Wait for the photos, or the PDF comes out with empty frames.
  await Promise.all([...box.querySelectorAll('img')].map((img) => img.complete ? null : new Promise((ok) => { img.onload = img.onerror = ok; setTimeout(ok, 4000); })));
  window.print();
}
if (typeof window !== 'undefined') {
  addEventListener('beforeprint', () => { if (!document.getElementById('bk-brochure')) mountBrochure(); });
  addEventListener('afterprint', unmountBrochure);
}

let wired = false;
function wire() {
  bookingConfig().then((c) => { bookingEnabled = c.enabled === true; if (pkg?.flights?.status === 'live' && view?.isConnected) paint('flights'); }).catch(() => {});
  if (wired) return; wired = true;
  onFx(() => { if (pkg?.destination && view?.isConnected) { fitBudget(); repaintPrices(); } });
  // Upgrade carousel: arrow keys move between slides (visual direction, so RTL and LTR both feel right); Home / End.
  document.addEventListener('keydown', (e) => {
    const root = e.target.closest?.('.bk-carousel');
    if (!root || !view?.contains(root) || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    const rtl = getComputedStyle(root).direction === 'rtl', n = root.querySelectorAll('.bk-car-slide').length;
    const dir = e.key === 'Home' ? -n : e.key === 'End' ? n : (e.key === 'ArrowRight') !== rtl ? 1 : -1;
    e.preventDefault(); moveCarousel(root, dir, true);
  });
  document.addEventListener('scroll', (e) => {
    const track = e.target?.classList?.contains('bk-car-track') ? e.target : null, pos = track?.closest('.bk-carousel')?.querySelector('[data-car-pos]');
    if (pos) pos.textContent = `${currentSlide(track) + 1} / ${track.children.length}`;
  }, { capture: true, passive: true });
  document.addEventListener('submit', (e) => {
    if (!view?.contains(e.target)) return;
    if (e.target.id === 'build-form') {
      e.preventDefault(); const text = $('#build-text').value.trim(), month = $('#build-month').value;
      const full = month !== '' ? `${text}${text ? ', ' : ''}${t('build.chip.when.phrase', { month: MONTHS[Number(month)] })}` : text;
      if (!full) { const err = $('.build-error', view); err.textContent = t('build.err.empty'); err.hidden = false; $('#build-text').focus(); return; }
      history.replaceState(null, '', `#/build?q=${encodeURIComponent(full)}`); build({ text: full });
    } else if (e.target.id === 'build-edit') { e.preventDefault(); build({ ...lastInput, chosen: pkg.destination.id, edits: { ...(lastInput?.edits?.budget ? { budget: lastInput.edits.budget } : {}), ...editsFrom(e.target) } }); }
    else if (e.target.id === 'build-lead') { e.preventDefault(); submitLead(e.target); }
  });
  document.addEventListener('change', (e) => {
    if (!view?.contains(e.target) || !pkg) return;
    if (e.target.matches('[data-insurance]')) { pkg.insurance = { include: e.target.checked }; paint('insurance'); paint('total'); paint('banner'); paint('upsell'); persist(); $('[data-insurance]', view)?.focus(); }
    if (e.target.matches('[data-car]')) { pkg.car.include = e.target.checked; pkg.manual = true; paint('car'); paint('total'); paint('banner'); paint('upsell'); persist(); $('[data-car]', view)?.focus(); }
    if (e.target.matches('[data-area]')) { const i = Number(e.target.dataset.area), area = (pkg.areas[i] || []).find((a) => (a.name.en || L(a.name)) === e.target.value); hotelGroups()[i].area = area || null; fetchHotels(version, i, e.target.value); }
  });
  document.addEventListener('click', async (e) => {
    if (!view?.contains(e.target)) return;
    const el = (s) => e.target.closest(s);
    if (el('[data-example]')) { const area = $('#build-text'); area.value = t(el('[data-example]').dataset.example); area.dispatchEvent(new Event('input')); area.focus(); return; }
    if (el('[data-prefs]')) { const b = el('[data-prefs]'), open = b.getAttribute('aria-expanded') !== 'true'; b.setAttribute('aria-expanded', String(open)); $('#gb-prefs', view).hidden = !open; return; }
    if (el('[data-chip]')) { toggleChip(el('[data-chip]')); return; }
    if (!pkg) return;
    if (el('[data-choose]')) { build({ ...lastInput, chosen: el('[data-choose]').dataset.choose }); return; }
    if (el('[data-book-flight]')) {
      const button = el('[data-book-flight]'), pick = selectedFlight(pkg), f = pkg.flights;
      button.disabled = true; button.setAttribute('aria-busy', 'true');
      try { await startBooking({ offer: { srk: f.booking.srk, offerIndex: pick.offerIndex, searchToken: f.booking.searchToken, itineraryIndex: pick.itineraryIndex ?? 0 }, source: 'builder', insurance: pkg.insurance?.include === true }); }
      catch (error) { button.disabled = false; button.removeAttribute('aria-busy'); const status = $('#bo-book-status', view); if (status) status.textContent = t(error.code === 'offer_unavailable' ? 'booking.offer.gone' : error.status === 429 ? 'booking.offer.busy' : 'booking.offer.failed'); }
      return;
    }
    if (el('[data-pick-flight]')) { pkg.flights.selected = el('[data-pick-flight]').dataset.pickFlight; pkg.manual = true; paint('flights'); paint('total'); paint('banner'); paint('upsell'); persist(); return; }
    if (el('[data-pick-hotel]')) { const [i, id] = el('[data-pick-hotel]').dataset.pickHotel.split(':'); hotelGroups()[Number(i)].selected = id; pkg.manual = true; paint('hotels'); paint('total'); paint('banner'); paint('upsell'); persist(); return; }
    if (el('[data-budget-jump]')) { e.preventDefault(); const box = $('#bc-total', view); box?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); (box?.querySelector('[data-budget-act]') || box)?.focus?.({ preventScroll: true }); return; }
    if (el('[data-budget-act]')) {
      const b = el('[data-budget-act]'), value = b.dataset.value, edits = { ...(lastInput?.edits || {}) };
      if (b.dataset.budgetAct === 'dest') { build({ ...lastInput, chosen: value, edits }); return; }
      if (b.dataset.budgetAct === 'nights') edits.nights = Number(value); else edits.budget = Number(value);
      build({ ...lastInput, chosen: pkg.destination.id, edits }); return;
    }
    if (el("[data-carousel]")) { moveCarousel(el(".bk-carousel"), Number(el("[data-carousel]").dataset.carousel)); return; }
    if (el('[data-upsell]')) {
      const offer = offers[Number(el('[data-upsell]').dataset.upsell)];
      if (!offer) return;
      const done = applyUpsell(pkg, offer, getFx()), title = offer.type === 'trip' ? offer.name : offerTitle(offer);
      lastInput = { ...lastInput, edits: { ...(lastInput?.edits || {}), budget: done.budget } };
      if (done.rebuild) { build({ ...lastInput, chosen: pkg.destination.id, edits: { ...lastInput.edits, nights: done.nights } }); return; }
      pkg.manual = true; repaintPrices(); persist();
      announce(t('build.upsell.added', { title, budget: formatIls(done.budget) }));
      $('#bh-total', view)?.setAttribute('tabindex', '-1'); $('#bh-total', view)?.focus();
      return;
    }
    if (el('[data-more-hotels]')) { const i = Number(el('[data-more-hotels]').dataset.moreHotels); showAllHotels.has(i) ? showAllHotels.delete(i) : showAllHotels.add(i); paint('hotels'); $(`[data-more-hotels="${i}"]`, view)?.focus(); return; }
    if (el('[data-day-up]')) { moveDay(Number(el('[data-day-up]').dataset.dayUp), -1); return; }
    if (el('[data-day-down]')) { moveDay(Number(el('[data-day-down]').dataset.dayDown), 1); return; }
    if (el('[data-remove-item]')) { const [i, j] = el('[data-remove-item]').dataset.removeItem.split(':').map(Number); const [item] = pkg.itinerary[i].items.splice(j, 1); pkg.spare = [item, ...(pkg.spare || [])]; paint('itinerary'); persist(); announce(t('build.itinerary.removed', { name: item.name })); $('#bh-itinerary', view)?.focus?.(); return; }
    if (el('[data-add-spare]')) { const k = Number(el('[data-add-spare]').dataset.addSpare), [item] = pkg.spare.splice(k, 1); const day = pkg.itinerary.find((d) => d.kind === 'free') || pkg.itinerary.find((d) => d.kind === 'full' && d.items.length < 3) || pkg.itinerary.find((d) => d.kind === 'full') || pkg.itinerary[0]; day.items.push(item); paint('itinerary'); persist(); announce(t('build.itinerary.added', { name: item.name, day: day.day })); return; }
    const act = el('[data-act]')?.dataset.act, status = $('#build-act-status', view);
    if (!act) return;
    try {
      if (act === 'lead') { leadOpen = true; paintLead(); $('#bc-lead h3', view).focus(); }
      else if (act === 'save') await save(status);
      else if (act === 'share') await share(status);
      else if (act === 'print') printBrochure();
      else if (act === 'rebuild') build(lastInput || { text: $('#build-text').value });
      else if (act === 'refresh') refreshFromSnapshot();
    } catch (error) { status.textContent = error.message || t('build.err.generic'); }
  });
}

export function buildRoutes() {
  wire();
  return { build: page };
}

// Customer area (spec 24 §10): the packages saved on this device and in the account.
export function packagesSectionHtml() {
  return `<section class="surface-panel" id="acc-packages" aria-labelledby="acc-packages-title"><div class="panel-heading"><h2 id="acc-packages-title">${t('build.account.title')}</h2><a class="button secondary" href="#/build">${t('build.account.new')}</a></div><div data-packages>${packagesList(savedList())}</div></section>`;
}
const packagesList = (list) => (list.length ? `<ul class="account-list">${list.map((p) => `<li><div><strong>${esc(p.title || t('build.account.untitled'))}</strong><span class="micro-copy">${esc(p.savedAt ? fmtDate(p.savedAt) : '')}</span></div><a class="button secondary" href="#/build?p=${esc(p.id)}">${t('build.account.open')}</a></li>`).join('')}</ul>` : `<p>${t('build.account.none')}</p>`);
export async function fillPackages(root) {
  const box = root.querySelector('[data-packages]');
  if (!box) return;
  try {
    await accountReady.catch(() => {});
    if (!account.user) return;
    const response = await fetch('/api/account/packages');
    if (!response.ok) return;
    const { packages } = await response.json(), local = savedList();
    box.innerHTML = packagesList([...packages, ...local.filter((x) => !packages.some((p) => p.id === x.id))].slice(0, 20));
  } catch { /* the device list stays */ }
}
