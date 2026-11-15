// Magic trip builder page (#/build, spec 24): one sentence → a complete trip. The server plans from the catalog;
// flights and hotels arrive separately (live, with their check time); everything else is an estimate or a quote.
import { t, lang, locale, fmtTime, fmtDate, errorText } from './i18n.mjs';
import { toIls, formatIls, formatOriginal, getFx, onFx, loadFx, fxNote } from './fx.mjs';
import { pricePackage, sanitizePackage, packageLeadFields, isStale, selectedFlight, travellers } from './trip-package.mjs';
import { validateLead, CHANNELS, LIMITS, consentText, optionLabel } from './leads-validate.mjs';
import { searchLink } from './saved-flights.mjs';
import { multiLink } from './multi-city-core.mjs';

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const L = (v) => (v && typeof v === 'object' ? v[lang] || v.he || v.en || '' : v ?? '');
const icon = (name) => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
const $ = (s, root = document) => root.querySelector(s);
const SAVED_KEY = 'gerbi-packages-v1', CURRENT_KEY = 'gerbi-build-current-v1';
const MONTHS = Array.from({ length: 12 }, (_, i) => new Date(2026, i, 15).toLocaleDateString(locale(), { month: 'long' }));

let pkg = null, view = null, version = 0, lastInput = null, showAllHotels = new Set(), leadOpen = false;

// ---- prices
const fare = (price) => { if (!price) return ''; const v = toIls(price, getFx()); return v === null ? formatOriginal(price) : formatIls(v); };
const checked = (iso) => (iso ? t('build.price.checkedAt', { time: fmtTime(iso), date: fmtDate(iso, { day: 'numeric', month: 'short' }) }) : '');
const kindPill = (kind) => `<span class="bk-kind bk-${kind}">${t(`build.kind.${kind}`)}</span>`;
const longDay = (iso) => (iso ? new Date(iso + 'T12:00:00').toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short' }) : '');
const travellersText = (r) => t('build.travellers', { adults: r.adults, children: r.children });

// ---- input
const EXAMPLES = ['build.example.family', 'build.example.couple', 'build.example.friends'];
const CHIPS = [['who', ['couple', 'family', 'friends', 'solo']], ['budget', ['low', 'mid', 'high']], ['style', ['beach', 'city', 'nature', 'ski', 'allInclusive', 'car']]];
function inputHtml(text = '') {
  return `<form id="build-form" class="build-form" novalidate>
   <label for="build-text" class="build-label">${t('build.input.label')}</label>
   <textarea id="build-text" name="text" rows="3" maxlength="1500" placeholder="${esc(t('build.input.placeholder'))}" aria-describedby="build-hint">${esc(text)}</textarea>
   <p id="build-hint" class="micro-copy">${t('build.input.hint')}</p>
   ${CHIPS.map(([group, ids]) => `<div class="build-chips" role="group" aria-label="${esc(t(`build.chip.${group}`))}"><span class="build-chip-label" aria-hidden="true">${t(`build.chip.${group}`)}</span>${ids.map((id) => `<button type="button" class="build-chip" data-chip="${group}.${id}" aria-pressed="false">${t(`build.chip.${group}.${id}`)}</button>`).join('')}</div>`).join('')}
   <div class="build-chips" role="group" aria-label="${esc(t('build.chip.when'))}"><label class="build-chip-label" for="build-month">${t('build.chip.when')}</label><select id="build-month" class="build-month"><option value="">${t('build.chip.when.any')}</option>${MONTHS.map((m, i) => `<option value="${i}">${esc(m)}</option>`).join('')}</select></div>
   <div class="build-submit-row"><button type="submit" class="button yellow build-submit">${icon('spark')}${t('build.input.submit')}</button>
    <div class="build-examples"><span class="micro-copy">${t('build.input.examples')}</span>${EXAMPLES.map((k) => `<button type="button" class="link-button" data-example="${k}">${t(k + '.short')}</button>`).join('')}</div></div>
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
  lastInput = input; const mine = ++version; leadOpen = false; showAllHotels = new Set();
  const out = $('#build-result'), err = $('.build-error', view), button = $('.build-submit', view);
  err.hidden = true; button.disabled = true; button.setAttribute('aria-busy', 'true');
  out.setAttribute('aria-busy', 'true'); out.innerHTML = skeletonHtml(); announce(t('build.status.planning'));
  try {
    const plan = await post('/api/build', input);
    if (mine !== version) return;
    pkg = { ...plan, flights: { status: plan.flightSearch ? 'pending' : 'quote' },
      hotels: plan.stops?.length ? { stops: plan.hotelSearches.map((s, i) => ({ status: s ? 'pending' : 'quote', stop: i, area: plan.hotelAreas[i] })) } : { status: plan.hotelSearches[0] ? 'pending' : 'quote', area: plan.hotelAreas[0] },
      car: { ...plan.car }, polish: null };
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
    const result = await post('/api/build/flights', { search: pkg.flightSearch, request: { adults: pkg.request.adults, children: pkg.request.children, needs: pkg.request.needs } });
    if (mine !== version) return;
    pkg.flights = result.status === 'live' ? result : { status: 'quote', reason: result.reason || result.status };
  } catch (error) { if (mine === version) pkg.flights = { status: 'quote', reason: error.status === 429 ? 'rate_limited' : '' }; }
  if (mine !== version) return;
  paint('flights'); paint('total'); persist();
  announce(pkg.flights.status === 'live' ? t('build.status.flights', { count: pkg.flights.picks.length }) : t('build.status.flightsQuote'));
}
const hotelGroups = () => (pkg.hotels.stops ? pkg.hotels.stops : [pkg.hotels]);
async function fetchHotels(mine, i, area) {
  const spec = pkg.hotelSearches?.[i];
  if (!spec) return;
  const group = hotelGroups()[i];
  if (area !== undefined) { spec.area = area; group.status = 'pending'; paint('hotels'); }
  try {
    const result = await post('/api/build/hotels', { search: spec });
    if (mine !== version) return;
    Object.assign(group, result.status === 'live' ? { ...result, selected: result.picks[0]?.id } : { status: 'quote', picks: [], reason: result.reason || result.status });
  } catch (error) { if (mine === version) Object.assign(group, { status: 'quote', picks: [], reason: error.status === 429 ? 'rate_limited' : '' }); }
  if (mine !== version) return;
  paint('hotels'); paint('total'); persist();
  announce(group.status === 'live' ? t('build.status.hotels', { count: group.picks.length }) : t('build.status.hotelsQuote'));
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
   ${editHtml()}
   <div class="bk-grid">
    <div class="bk-main">
     <section class="bk-card" id="bc-where" aria-labelledby="bh-where"></section>
     <section class="bk-card" id="bc-flights" aria-labelledby="bh-flights"></section>
     <section class="bk-card" id="bc-hotels" aria-labelledby="bh-hotels"></section>
     <section class="bk-card" id="bc-car" aria-labelledby="bh-car"></section>
     <section class="bk-card" id="bc-itinerary" aria-labelledby="bh-itinerary"></section>
     <section class="bk-card" id="bc-practical" aria-labelledby="bh-practical"></section>
    </div>
    <aside class="bk-side"><section class="bk-card bk-total" id="bc-total" aria-labelledby="bh-total"></section>
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
  for (const part of ['where', 'flights', 'hotels', 'car', 'itinerary', 'practical', 'total']) paint(part);
  if (leadOpen) paintLead();
  wireImages(out);
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
    return head + `<p class="micro-copy">${kindPill('live')} ${t('build.flights.found', { count: f.total })} · ${esc(checked(f.searchedAt))}</p>
     <ul class="bk-options">${f.picks.map((p) => `<li><button type="button" class="bk-option" data-pick-flight="${esc(p.key)}" aria-pressed="${p.key === f.selected}">
      <span class="bk-option-main"><strong>${esc(p.carriers.join(' + '))}</strong>${p.badges.length ? `<span class="bk-badges">${p.badges.map((b) => `<span class="flight-badge badge-${esc(b)}">${t(`app.badge.${b}`)}</span>`).join('')}</span>` : ''}
      ${p.legs.map((l) => `<span class="bk-leg" dir="ltr">${esc(l.from)} ${esc(l.depart)} → ${esc(l.to)} ${esc(l.arrive)}${l.dayOffset ? ` +${l.dayOffset}` : ''}</span><small>${esc(longDay(l.date))} · ${l.stops ? t('build.flights.stops', { count: l.stops }) : t('build.flights.direct')}</small>`).join('')}
      ${p.reasons.length ? `<small class="why">${esc(p.reasons.join(' · '))}</small>` : ''}</span>
      <span class="bk-option-price"><strong dir="ltr">${esc(fare(p.price))}</strong><small>${t('build.flights.forAll', { count: travellers(pkg.request) })}</small></span></button></li>`).join('')}</ul>
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
  itinerary() {
    const days = pkg.itinerary, movable = (d) => ['full', 'daytrip', 'rest'].includes(d.kind);
    return `<h3 id="bh-itinerary">${icon('calendar')}${t('build.itinerary.title')}</h3><p class="micro-copy">${t('build.itinerary.hint')}${pkg.polish ? ' ' + t('build.ai.note') : ''}</p>
     <ol class="bk-days">${days.map((d, i) => `<li class="bk-day bk-day-${esc(d.kind)}"><div class="bk-day-head"><span class="day-number">${d.day}</span><div><strong>${esc(d.title)}</strong><small>${esc(longDay(d.date))}${pkg.stops?.length ? ' · ' + esc(L(pkg.stops[d.stop]?.name)) : ''}</small></div>
       ${movable(d) ? `<span class="bk-day-move"><button type="button" class="icon-button" data-day-up="${i}" aria-label="${esc(t('build.itinerary.up', { day: d.day }))}" ${i > 0 && movable(days[i - 1]) ? '' : 'disabled'}>▲</button><button type="button" class="icon-button" data-day-down="${i}" aria-label="${esc(t('build.itinerary.down', { day: d.day }))}" ${i < days.length - 1 && movable(days[i + 1]) ? '' : 'disabled'}>▼</button></span>` : ''}</div>
       ${d.items.length ? `<ul>${d.items.map((x, j) => `<li><a href="${esc(x.mapsUrl)}" target="_blank" rel="noopener noreferrer">${esc(x.name)}</a> <small>${x.durationH ? t('build.itinerary.hours', { hours: x.durationH }) : ''}</small><button type="button" class="link-button" data-remove-item="${i}:${j}" aria-label="${esc(t('build.itinerary.remove', { name: x.name }))}">✕</button></li>`).join('')}</ul>` : ''}
       ${d.note ? `<p class="micro-copy">${esc(d.note)}</p>` : ''}</li>`).join('')}</ol>
     ${pkg.spare?.length ? `<details class="bk-spare"><summary>${t('build.itinerary.spare', { count: pkg.spare.length })}</summary><ul>${pkg.spare.map((x, k) => `<li><a href="${esc(x.mapsUrl)}" target="_blank" rel="noopener noreferrer">${esc(x.name)}</a> <button type="button" class="link-button" data-add-spare="${k}">${t('build.itinerary.add')}</button></li>`).join('')}</ul></details>` : ''}`;
  },
  practical() {
    const p = pkg.practical || {};
    const rows = [['visa', p.visa], ['currency', p.currency], ['language', p.language], ['timeZone', p.timeZone], ['kosher', p.kosher], ['shabbat', p.shabbat], ['season', p.season]].filter(([, v]) => v);
    return `<h3 id="bh-practical">${icon('shield')}${t('build.practical.title')}</h3><dl class="bk-practical">${rows.map(([k, v]) => `<div class="${(k === 'kosher' && pkg.request.needs.kosher) || (k === 'shabbat' && pkg.request.needs.shabbat) ? 'bk-flag' : ''}"><dt>${t(`build.practical.${k}`)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl><p class="micro-copy">${esc(p.check || t('build.practical.check'))}</p>`;
  },
  total() {
    const pr = pricePackage(pkg, getFx()), label = (l) => t(`build.line.${l.id.split(':')[0]}`, { place: l.stop !== undefined && pkg.stops?.length ? L(pkg.stops[l.stop]?.name) : '' });
    const value = (l) => l.kind === 'live' ? `<strong dir="ltr">${esc(l.ils === null ? formatOriginal(l.price) : formatIls(l.ils))}</strong>` : l.kind === 'estimate' ? `<span dir="ltr">${esc(formatIls(l.range.low))}–${esc(formatIls(l.range.high))}</span>` : l.kind === 'pending' ? `<span class="bk-pending">${t('build.kind.pending')}</span>` : `<span>${t('build.price.byRep')}</span>`;
    return `<h3 id="bh-total">${icon('tag')}${t('build.total.title')}</h3><table class="bk-lines"><tbody>${pr.lines.map((l) => `<tr><th scope="row">${esc(label(l))}<br>${kindPill(l.kind)}</th><td>${value(l)}${l.at ? `<small>${esc(checked(l.at))}</small>` : ''}</td></tr>`).join('')}</tbody></table>
     ${pr.total ? `<div class="bk-sum"><p>${t('build.total.live')} <strong dir="ltr">${esc(formatIls(pr.total.live))}</strong></p><p>${t('build.total.withEstimate')} <strong dir="ltr">${esc(formatIls(pr.total.low))}–${esc(formatIls(pr.total.high))}</strong></p>
       <p class="micro-copy">${t('build.total.perPerson', { live: esc(formatIls(pr.perPerson.live)), low: esc(formatIls(pr.perPerson.low)), high: esc(formatIls(pr.perPerson.high)), count: pr.people })}</p></div>` : pr.missingFx ? `<p class="micro-copy">${t('build.total.noFx')}</p>` : ''}
     ${pr.budget ? `<p class="bk-budget bk-budget-${pr.budget.verdict}">${t(`build.total.budget.${pr.budget.verdict}`, { budget: esc(formatIls(pr.budget.amount)), diff: esc(formatIls(Math.abs(pr.budget.diff))) })}</p>` : ''}
     <div class="bk-legend"><p>${kindPill('live')} ${t('build.legend.live')}</p><p>${kindPill('estimate')} ${t('build.legend.estimate')}</p><p>${kindPill('quote')} ${t('build.legend.quote')}</p></div>
     ${getFx() ? `<p class="micro-copy">${esc(fxNote())}</p>` : ''}`;
  }
};
function paint(part) {
  const host = view && $(`#bc-${part}`, view);
  if (!host || !pkg?.destination) return;
  const focus = document.activeElement && host.contains(document.activeElement) ? [...host.querySelectorAll('button,select,input,a')].indexOf(document.activeElement) : -1;
  host.innerHTML = PAINT[part]();
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
  const response = await fetch('/api/account/packages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, title: entry.title, lang }) }).catch(() => null);
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
  view.innerHTML = `<div class="route-width build-page">${bread(t('build.title'))}
   <header class="build-hero"><span class="eyebrow">${icon('spark')}${t('build.kicker')}</span><h1 tabindex="-1">${t('build.title')}</h1><p>${t('build.subtitle')}</p>${inputHtml(q)}</header>
   <p id="build-status" class="sr-only" aria-live="polite"></p>
   <div id="build-result" class="build-result"></div>
   <p class="micro-copy build-disclaimer">${t('build.disclaimer')}</p></div>${footer}`;
  loadFx();
  if (shared && /^[a-f0-9]{16}$/.test(shared)) openShared(shared);
  else if (q || dest) build({ text: q, dest });
  else {
    try { const saved = JSON.parse(sessionStorage.getItem(CURRENT_KEY) || 'null'); if (saved?.pkg?.destination) { pkg = saved.pkg; lastInput = saved.input; $('#build-text').value = saved.input?.text || ''; render(); } } catch { /* fresh start */ }
  }
}

let wired = false;
function wire() {
  if (wired) return; wired = true;
  onFx(() => { if (pkg?.destination && view?.isConnected) { paint('flights'); paint('hotels'); paint('total'); } });
  document.addEventListener('submit', (e) => {
    if (!view?.contains(e.target)) return;
    if (e.target.id === 'build-form') {
      e.preventDefault(); const text = $('#build-text').value.trim(), month = $('#build-month').value;
      const full = month !== '' ? `${text}${text ? ', ' : ''}${t('build.chip.when.phrase', { month: MONTHS[Number(month)] })}` : text;
      if (!full) { const err = $('.build-error', view); err.textContent = t('build.err.empty'); err.hidden = false; $('#build-text').focus(); return; }
      history.replaceState(null, '', `#/build?q=${encodeURIComponent(full)}`); build({ text: full });
    } else if (e.target.id === 'build-edit') { e.preventDefault(); build({ ...lastInput, chosen: pkg.destination.id, edits: editsFrom(e.target) }); }
    else if (e.target.id === 'build-lead') { e.preventDefault(); submitLead(e.target); }
  });
  document.addEventListener('change', (e) => {
    if (!view?.contains(e.target) || !pkg) return;
    if (e.target.matches('[data-car]')) { pkg.car.include = e.target.checked; paint('car'); paint('total'); persist(); $('[data-car]', view)?.focus(); }
    if (e.target.matches('[data-area]')) { const i = Number(e.target.dataset.area), area = (pkg.areas[i] || []).find((a) => (a.name.en || L(a.name)) === e.target.value); hotelGroups()[i].area = area || null; fetchHotels(version, i, e.target.value); }
  });
  document.addEventListener('click', async (e) => {
    if (!view?.contains(e.target)) return;
    const el = (s) => e.target.closest(s);
    if (el('[data-example]')) { $('#build-text').value = t(el('[data-example]').dataset.example); $('#build-text').focus(); return; }
    if (el('[data-chip]')) { toggleChip(el('[data-chip]')); return; }
    if (!pkg) return;
    if (el('[data-choose]')) { build({ ...lastInput, chosen: el('[data-choose]').dataset.choose }); return; }
    if (el('[data-pick-flight]')) { pkg.flights.selected = el('[data-pick-flight]').dataset.pickFlight; paint('flights'); paint('total'); persist(); return; }
    if (el('[data-pick-hotel]')) { const [i, id] = el('[data-pick-hotel]').dataset.pickHotel.split(':'); hotelGroups()[Number(i)].selected = id; paint('hotels'); paint('total'); persist(); return; }
    if (el('[data-more-hotels]')) { const i = Number(el('[data-more-hotels]').dataset.moreHotels); showAllHotels.has(i) ? showAllHotels.delete(i) : showAllHotels.add(i); paint('hotels'); $(`[data-more-hotels="${i}"]`, view)?.focus(); return; }
    if (el('[data-day-up]')) { moveDay(Number(el('[data-day-up]').dataset.dayUp), -1); return; }
    if (el('[data-day-down]')) { moveDay(Number(el('[data-day-down]').dataset.dayDown), 1); return; }
    if (el('[data-remove-item]')) { const [i, j] = el('[data-remove-item]').dataset.removeItem.split(':').map(Number); const [item] = pkg.itinerary[i].items.splice(j, 1); pkg.spare = [item, ...(pkg.spare || [])]; paint('itinerary'); persist(); announce(t('build.itinerary.removed', { name: item.name })); $('#bh-itinerary', view)?.focus?.(); return; }
    if (el('[data-add-spare]')) { const k = Number(el('[data-add-spare]').dataset.addSpare), [item] = pkg.spare.splice(k, 1); const day = pkg.itinerary.find((d) => d.kind === 'full' && d.items.length < 3) || pkg.itinerary.find((d) => d.kind === 'full') || pkg.itinerary[0]; day.items.push(item); paint('itinerary'); persist(); announce(t('build.itinerary.added', { name: item.name, day: day.day })); return; }
    const act = el('[data-act]')?.dataset.act, status = $('#build-act-status', view);
    if (!act) return;
    try {
      if (act === 'lead') { leadOpen = true; paintLead(); $('#bc-lead h3', view).focus(); }
      else if (act === 'save') await save(status);
      else if (act === 'share') await share(status);
      else if (act === 'print') window.print();
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
    const response = await fetch('/api/account/packages');
    if (!response.ok) return;
    const { packages } = await response.json(), local = savedList();
    box.innerHTML = packagesList([...packages, ...local.filter((x) => !packages.some((p) => p.id === x.id))].slice(0, 20));
  } catch { /* the device list stays */ }
}
