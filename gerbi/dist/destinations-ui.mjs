// Destinations catalog UI (spec 23): the destinations list with filters, the destination page, the home showcase,
// inspiration and the comparison columns. Pure HTML builders + small wiring; pages.mjs / app.js own the routes.
import { destinations, byId, search, rank, curatedPicks, regions, REGIONS, TAG_LABELS, monthName, monthOf } from './catalog.mjs';
import { t, lang } from './i18n.mjs';
import { timeVsIsrael } from './timezone.mjs';

export const L = (x) => (x ? x[lang] || x.he || '' : '');
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const icon = (name) => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
const hours = (h) => (Number.isInteger(h) ? String(h) : h.toFixed(1));
export const STYLE_FILTERS = ['beach', 'city', 'nature', 'family', 'couple', 'culture', 'food', 'ski', 'luxury', 'nightlife'];
const PAGE = 12;
const shortMonth = (m) => (lang === 'en' ? monthName(m, 'en').slice(0, 3) : monthName(m, 'he'));
// "May–Jun, Sep–Oct": consecutive months joined into ranges (Dec→Jan wraps).
export function monthsText(months = []) {
  const set = new Set(months), runs = [];
  if (set.size === 12) return lang === 'en' ? 'All year' : 'כל השנה';
  let start = [...set].find((m) => !set.has(m === 1 ? 12 : m - 1));
  const seen = new Set();
  for (let i = 0; i < 12 && start && !seen.has(start); i++) {
    let end = start; seen.add(start);
    while (set.has(end === 12 ? 1 : end + 1) && !seen.has(end === 12 ? 1 : end + 1)) { end = end === 12 ? 1 : end + 1; seen.add(end); }
    runs.push(start === end ? shortMonth(start) : `${shortMonth(start)}–${shortMonth(end)}`);
    start = [...set].find((m) => !seen.has(m) && !set.has(m === 1 ? 12 : m - 1)) || [...set].find((m) => !seen.has(m));
  }
  return runs.join(', ');
}
const flightKind = (d) => (d.region === 'israel' && d.flightHours <= 1.5 ? (d.flightHours ? t('catalog.card.direct') : t('catalog.card.domestic')) : d.direct ? t('catalog.card.direct') : t('catalog.card.connection'));
const factsLine = (d) => `<ul class="dest-facts">${d.flightHours ? `<li>${icon('plane')}${t('catalog.card.flight', { hours: hours(d.flightHours) })}${d.direct ? ` · <b>${t('catalog.card.direct')}</b>` : ''}</li>` : `<li>${icon('pin')}${t('catalog.card.domestic')}</li>`}<li>${icon('calendar')}${esc(monthsText(d.bestMonths))}</li><li class="dest-level" aria-label="${t('catalog.card.budget', { level: d.budgetLevel })}" title="${t('catalog.card.budget', { level: d.budgetLevel })}">${'₪'.repeat(d.budgetLevel)}<span aria-hidden="true">${'₪'.repeat(4 - d.budgetLevel)}</span></li></ul>`;
// "Rome, Italy" — but just "Mauritius" / "The Maldives" when the country repeats the name.
export const placeTitle = (d) => { const n = L(d.name), c = L(d.country); return n.replace(/^(the|ה)\s?/i, '').includes(c.replace(/^(the|ה)\s?/i, '')) || c.replace(/^(the|ה)\s?/i, '').includes(n.replace(/^(the|ה)\s?/i, '').split(' ')[0]) && n.split(' ').length < 3 ? n : `${n}, ${c}`; };
export const imgSrc = (d, big = false) => (big ? d.image.src : d.image.thumb);
const altOf = (d) => L(d.image.alt) || `${L(d.name)}, ${L(d.country)}`;

export function flightEntryPanel(d, { search, price = '', estimate = '', heading = 'h3' }) {
  const name = esc(L(d.name));
  const airport = d.flightHours && /^[A-Z]{3}$/.test(d.code) ? `<span>${icon('plane')}<bdi>${esc(d.code)}</bdi></span>` : '';
  const cost = price && estimate ? `<span>${icon('tag')}<strong><bdi>${esc(price)}</bdi></strong></span>` : '';
  return `<div class="flight-entry-panel">
   <a class="flight-entry-photo" href="#/destination/${d.id}" tabindex="-1" aria-hidden="true"><img src="${imgSrc(d)}" alt="" loading="lazy" decoding="async" width="600" height="400"></a>
   <div class="flight-entry-body">
    <${heading}><a href="#/destination/${d.id}">${name}</a></${heading}><p class="flight-entry-country">${esc(L(d.country))}</p>
    ${cost || airport ? `<div class="flight-entry-meta">${cost}${airport}</div>` : ''}
    ${cost ? `<small class="flight-entry-price-note">${esc(estimate)}</small>` : ''}
    <div class="flight-entry-actions">${search}</div>
   </div>
  </div>`;
}

// The destinations-page card (also favorites, inspiration, related, results).
export function destCard(d, { favorites = [], compare = null, reason = '', heart = true, actions = false, catalogView = false } = {}) {
  const fav = favorites.includes(d.id), name = L(d.name);
  const compareHtml = compare ? `<label class="compare-check"><input type="checkbox" data-compare="${d.id}" ${compare.has(d.id) ? 'checked' : ''}>${t('catalog.card.compare')}</label>` : '';
  if (actions) {
    const search = d.flightHours
      ? `<a class="flight-entry-cta" href="#/?to=${esc(d.code)}">${t('catalog.dest.ctaFlights')}</a>`
      : `<a class="flight-entry-cta" href="#/destination/${d.id}">${t('catalog.card.open')}</a>`;
    return `<article class="destination-card dest-card travel-card flight-entry" data-dest-card="${d.id}">
     ${flightEntryPanel(d, { search, heading: 'h2' })}
     <div class="flight-entry-support">
      ${factsLine(d)}
      <div class="flight-entry-secondary"><a class="button secondary" href="#/build?dest=${d.id}">${icon('spark')}${t('catalog.dest.ctaBuild')}</a>${compareHtml}</div>
     </div>
    </article>`;
  }
  return `<article class="destination-card dest-card travel-card" data-dest-card="${d.id}"><div class="dest-card-media travel-card-media photo-place-frame"><a href="#/destination/${d.id}" class="destination-photo" tabindex="-1" aria-hidden="true"><img src="${imgSrc(d)}" alt="" loading="lazy" decoding="async" width="600" height="400"><span class="photo-label">${esc(L(regions[d.region]))}</span></a>`
    + (heart ? `<button class="heart-button" data-page-favorite="${d.id}" aria-label="${esc(fav ? t('catalog.card.unsave', { name }) : t('catalog.card.save', { name }))}" aria-pressed="${fav}">${icon('heart')}</button>` : '')
    + `<div class="photo-place-caption"><h2><a href="#/destination/${d.id}">${esc(name)}</a></h2><span>${catalogView?icon('pin'):''}${esc(L(d.country))}</span></div></div><div class="destination-body"><p>${esc(L(d.summary))}</p>${factsLine(d)}`
    + `<div class="pills">${d.tags.filter((x) => STYLE_FILTERS.includes(x)).slice(0, 3).map((x) => `<span class="pill">${esc(L(TAG_LABELS[x]))}</span>`).join('')}</div>`
    + `${reason ? `<details class="travel-card-why"><summary>${t('app.card.whyToggle')}</summary><p class="match-reason">${esc(reason)}</p></details>` : ''}<div class="destination-price"><a class="button yellow" href="#/destination/${d.id}">${t('catalog.card.open')}</a>${compareHtml}</div></div></article>`;
}

// Home showcase card: the home `.card` look, catalog content.
export function homeCard(d, { favorites = [], reason = '' } = {}) {
  const fav = favorites.includes(d.id), name = L(d.name);
  return `<article class="card dest-home-card travel-card photo-place-card"><div class="card-image travel-card-media photo-place-frame"><img src="${imgSrc(d)}" alt="${esc(altOf(d))}" loading="lazy" decoding="async" width="600" height="400"><button class="favorite" data-favorite="${d.id}" aria-pressed="${fav}" aria-label="${esc(fav ? t('catalog.card.unsave', { name }) : t('catalog.card.save', { name }))}">${icon('heart')}</button><span class="card-badge">${icon('globe')}${esc(L(regions[d.region]))}</span><h3 class="photo-place-caption">${esc(placeTitle(d))}</h3></div>`
    + `<div class="card-body"><p class="card-description">${esc(L(d.summary))}</p>${reason ? `<p class="match-reason">${esc(reason)}</p>` : ''}${factsLine(d)}<div class="card-bottom"><a class="button yellow card-cta" href="#/destination/${d.id}">${t('app.card.cta')}</a></div></div></article>`;
}

// The home showcase: in season, varied across regions, reacting to the style chips; a destination the visitor asked
// for leads but never hides the rest (spec 23 §1 — the "only Greece" bug).
export function homePicks(preferences = {}, { limit = 8, today = new Date() } = {}) {
  const month = monthOf(preferences) || today.getMonth() + 1;
  return curatedPicks({ month, preferences: { ...preferences, month }, limit }).map(({ destination, reasons }) => ({ destination, reason: reasons.map(L).slice(0, 3).join(' · ') }));
}

// ---------- destinations list ----------
export function readFilters(hash) {
  const p = new URLSearchParams(String(hash || '').split('?')[1] || '');
  const num = (v, max) => { const n = Number(v); return Number.isInteger(n) && n > 0 && n <= max ? n : 0; };
  return { q: (p.get('q') || '').slice(0, 80), region: REGIONS.includes(p.get('region')) ? p.get('region') : 'all', style: STYLE_FILTERS.includes(p.get('style')) || p.get('style') === 'short' ? p.get('style') : 'all',
    month: num(p.get('month'), 12), budget: num(p.get('budget'), 3), hours: [4, 6, 10].includes(Number(p.get('hours'))) ? Number(p.get('hours')) : 0, direct: p.get('direct') === '1',
    sort: ['recommended', 'flight', 'budget', 'name'].includes(p.get('sort')) ? p.get('sort') : 'recommended', n: Math.min(Math.max(PAGE, Math.floor(Number(p.get('n'))) || PAGE), 200), type: p.get('type') || '', view: p.get('view') === 'list' ? 'list' : 'grid' };
}
export function filterQuery(f) {
  const q = {};
  if (f.q) q.q = f.q; if (f.region !== 'all') q.region = f.region; if (f.style !== 'all') q.style = f.style; if (f.month) q.month = f.month; if (f.budget) q.budget = f.budget;
  if (f.hours) q.hours = f.hours; if (f.direct) q.direct = '1'; if (f.sort !== 'recommended') q.sort = f.sort; if (f.n > PAGE) q.n = f.n; if (f.type) q.type = f.type; if (f.view === 'list') q.view = f.view;
  return new URLSearchParams(q).toString();
}
export const isFiltered = (f) => Boolean(f.q || f.region !== 'all' || f.style !== 'all' || f.month || f.budget || f.hours || f.direct || f.sort !== 'recommended');
// The list for a set of filters; `source` limits it (favorites). Recommended = season (filter month, else this month) + popularity.
export function applyFilters(f, { source = null, today = new Date() } = {}) {
  const allowed = source ? new Set(source) : null;
  let list = f.q ? search(f.q, lang) : rank({ month: f.month || today.getMonth() + 1 }).map((x) => x.destination);
  if (allowed) list = list.filter((d) => allowed.has(d.id));
  list = list.filter((d) => (f.region === 'all' || d.region === f.region) && (f.style === 'all' || (f.style === 'short' ? d.flightHours <= 4 : d.tags.includes(f.style)))
    && (!f.month || d.bestMonths.includes(f.month)) && (!f.budget || d.budgetLevel <= f.budget) && (!f.hours || d.flightHours <= f.hours) && (!f.direct || d.direct));
  const name = (d) => L(d.name);
  if (f.sort === 'flight') list = [...list].sort((a, b) => a.flightHours - b.flightHours);
  else if (f.sort === 'budget') list = [...list].sort((a, b) => a.budgetLevel - b.budgetLevel || a.dailyBudgetIls.mid - b.dailyBudgetIls.mid);
  else if (f.sort === 'name') list = [...list].sort((a, b) => name(a).localeCompare(name(b), lang));
  return list;
}

const chip = (group, value, label, current) => `<button type="button" data-chip-${group}="${value}" class="${current === value ? 'selected' : ''}" aria-pressed="${current === value}">${esc(label)}</button>`;
const option = (value, label, current) => `<option value="${value}" ${String(current) === String(value) ? 'selected' : ''}>${esc(label)}</option>`;
export function filtersHtml(f) {
  const toolbar = `<form id="destination-filter" class="filter-toolbar dest-toolbar" role="search"><label class="search-box">${icon('search')}<input name="q" type="search" aria-label="${t('catalog.search.label')}" placeholder="${t('catalog.search.placeholder')}" value="${esc(f.q)}" autocomplete="off"></label>`
    + `<select name="sort" aria-label="${t('catalog.sort.label')}">${option('recommended', t('catalog.sort.recommended'), f.sort)}${option('flight', t('catalog.sort.flight'), f.sort)}${option('budget', t('catalog.sort.budget'), f.sort)}${option('name', t('catalog.sort.name'), f.sort)}</select><button class="button blue">${t('catalog.search.submit')}</button></form>`;
  const options = `<p class="catalog-filter-label" id="catalog-region-label">${t('catalog.filter.region')}</p><div class="filter-chips dest-chips" role="group" aria-labelledby="catalog-region-label">${chip('region', 'all', t('catalog.filter.all'), f.region)}${REGIONS.map((r) => chip('region', r, L(regions[r]), f.region)).join('')}</div>`
    + `<p class="catalog-filter-label" id="catalog-style-label">${t('catalog.filter.style')}</p><div class="filter-chips dest-chips" role="group" aria-labelledby="catalog-style-label">${chip('style', 'all', t('catalog.filter.all'), f.style)}${STYLE_FILTERS.map((s) => chip('style', s, L(TAG_LABELS[s]), f.style)).join('')}${chip('style', 'short', t('catalog.insp.short'), f.style)}</div>`
    + `<div class="dest-selects"><label><span>${icon('calendar')}${t('catalog.filter.month')}</span><select data-filter="month">${option(0, t('catalog.filter.anyMonth'), f.month)}${Array.from({ length: 12 }, (_, i) => option(i + 1, monthName(i + 1, lang), f.month)).join('')}</select></label>`
    + `<label><span>${icon('tag')}${t('catalog.filter.budget')}</span><select data-filter="budget">${option(0, t('catalog.filter.anyBudget'), f.budget)}${[1, 2, 3].map((b) => option(b, t(`catalog.filter.budget${b}`), f.budget)).join('')}</select></label>`
    + `<label><span>${icon('clock')}${t('catalog.filter.hours')}</span><select data-filter="hours">${option(0, t('catalog.filter.anyHours'), f.hours)}${[4, 6, 10].map((h) => option(h, t('catalog.filter.hoursUpTo', { hours: h }), f.hours)).join('')}</select></label>`
    + `<label class="dest-direct"><input type="checkbox" data-filter="direct" ${f.direct ? 'checked' : ''}>${t('catalog.filter.direct')}</label></div>`;
  return { toolbar, options };
}

// ---------- destination page ----------
// Guide defaults for the CMS fields (fit/less/stay/move/season/budget). Catalog-only destinations show what the
// catalog knows in its own sections, so their guide holds only fit + budget unless the owner writes more in /admin.
export function guideDefaults(d, l = lang) {
  const pick = (x) => (x ? x[l] || x.he : '');
  const tags = d.tags.filter((x) => STYLE_FILTERS.includes(x) || x === 'relaxation' || x === 'adventure').map((x) => pick(TAG_LABELS[x]));
  return { fit: tags.length ? tags.join(l === 'en' ? ', ' : ', ') + '.' : '', less: '', stay: '', move: '', season: '', budget: (l === 'en' ? 'On-the-ground spending (no flights or lodging): about ₪{low}–{high} per person per day. An estimate only.' : 'הוצאות בשטח (בלי טיסות ולינה): כ־₪{low}–{high} לאדם ליום. הערכה בלבד.').replace('{low}', d.dailyBudgetIls.low).replace('{high}', d.dailyBudgetIls.high) };
}

export function destinationMain(d, { guide = '', favorites = [] } = {}) {
  const name = L(d.name), fav = favorites.includes(d.id);
  const best = new Set(d.bestMonths);
  return {
    hero: `<div class="destination-hero dest-hero photo-place-card"><img src="${imgSrc(d, true)}" data-thumb="${imgSrc(d)}" alt="${esc(altOf(d))}" width="1200" height="800" fetchpriority="high"><div><span>${esc(L(d.country))} / ${esc(L(regions[d.region]))}</span><h1 tabindex="-1">${esc(name)}</h1><p>${esc(L(d.summary))}</p></div><button class="button white" data-page-favorite="${d.id}" aria-pressed="${fav}">${icon('heart')} ${fav ? t('pages.destination.2') : t('pages.destination.3')}</button></div>${d.image.credit ? `<p class="photo-credit">${t('catalog.dest.photo', { credit: `<bdi data-allow-hebrew>${esc(d.image.credit)}</bdi>`, license: d.image.source ? `<a href="${esc(d.image.source)}" target="_blank" rel="noopener">${esc(d.image.license)}</a>` : esc(d.image.license) })}</p>` : ''}`,
    body: (d.advisory ? `<div class="soft-notice dest-advisory" role="note"><strong>${t('catalog.dest.advisory')}:</strong> ${esc(L(d.advisory))}</div>` : '')
      + `<span class="eyebrow">${esc(L(d.country))}</span><h2>${t('catalog.dest.why', { name: esc(name) })}</h2><ul class="dest-highlights">${d.highlights.map((h) => `<li>${icon('spark')}<span>${esc(L(h))}</span></li>`).join('')}</ul>`
      + guide
      + topAttractionsHtml(d) + todoHtml(d) + dayTripsHtml(d) + areasHtml(d)
      + `<section class="dest-section" aria-labelledby="dest-when"><h2 id="dest-when">${t('catalog.dest.when')}</h2><ol class="dest-months">${Array.from({ length: 12 }, (_, i) => `<li class="${best.has(i + 1) ? 'best' : ''}"${best.has(i + 1) ? ` title="${t('catalog.dest.bestMonth')}"` : ''}><span>${esc(shortMonth(i + 1))}</span>${best.has(i + 1) ? `<span class="sr-only"> – ${t('catalog.dest.bestMonth')}</span>` : ''}</li>`).join('')}</ol><p>${esc(L(d.seasonsNote))}</p></section>`
      + `<section class="dest-section" aria-labelledby="dest-practical"><h2 id="dest-practical">${t('catalog.dest.practical')}</h2><dl class="dest-practical">`
      + [[t('catalog.dest.transport'), `${d.transport.carRecommended ? t('catalog.dest.car') : t('catalog.dest.noCar')}. ${L(d.transport.note)}`], [t('catalog.dest.currency'), d.practical.currency], [t('catalog.dest.language'), L(d.practical.language)], [t('catalog.dest.timeZone'), timeVsIsrael(d.practical.timeZone)],
        [t('catalog.dest.visa'), L(d.practical.visaNoteForIsraelis)], [t('catalog.dest.kosher'), L(d.practical.kosher)], [t('catalog.dest.shabbat'), L(d.practical.shabbat)]].map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')
      + `</dl></section>`,
    aside: `<span class="eyebrow">${t('catalog.dest.facts')}</span><h2>${esc(name)}</h2><dl class="dest-quick"><div><dt>${t('catalog.dest.flight')}</dt><dd>${d.flightHours ? t('catalog.dest.flightValue', { hours: hours(d.flightHours), kind: flightKind(d) }) : t('catalog.card.domestic')}</dd></div><div><dt>${t('catalog.dest.bestMonths')}</dt><dd>${esc(monthsText(d.bestMonths))}</dd></div><div><dt>${t('catalog.dest.dailyBudget')}</dt><dd>${t('catalog.dest.dailyBudgetValue', { low: d.dailyBudgetIls.low, high: d.dailyBudgetIls.high })}<small>${t('catalog.dest.dailyBudgetNote')}</small></dd></div></dl>`
      + `<a class="button yellow full-width" href="#/?to=${d.code}">${icon('plane')}${t('catalog.dest.ctaFlights')}</a><a class="button blue full-width" href="#/build?dest=${d.id}">${icon('spark')}${t('catalog.dest.ctaBuild')}</a><a class="button secondary full-width" href="#/tailor-made?dest=${d.id}">${t('catalog.dest.ctaTailor')}</a><p class="micro-copy">${t('catalog.dest.ctaNote')}</p>`
  };
}

// ---------- destination page: attractions, things to do, day trips, where to stay (vivid cards) ----------
// Icons per kind of place: small inline SVGs (no icon library), drawn in the card's accent colour.
const SVG = (d) => `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const KIND_ICON = {
  landmark: '<path d="M3 10l9-6 9 6z"/><path d="M5 10v9M9.5 10v9M14.5 10v9M19 10v9M3 20h18"/>',
  museum: '<rect x="4" y="5" width="16" height="14" rx="1.5"/><path d="M4 16l5-5 4 4 2-2 5 5"/><circle cx="15.5" cy="9" r="1.5"/>',
  nature: '<path d="M3 19l6-10 4 6 2-3 6 7z"/><circle cx="17" cy="6" r="1.6"/>',
  beach: '<path d="M4 12a8 8 0 0116 0z"/><path d="M12 12v8M7 20h10"/>',
  neighborhood: '<path d="M3 20V11l5-4 5 4v9M13 20v-6l4-3 4 3v6M2 20h20M7 20v-4h2v4"/>',
  market: '<path d="M4 9h16l-1.5 10h-13z"/><path d="M8 9l2-5M16 9l-2-5M9.5 13v3M14.5 13v3"/>',
  viewpoint: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  park: '<path d="M12 21v-6"/><path d="M12 3a5 5 0 015 5 4 4 0 01-1 7H8a4 4 0 01-1-7 5 5 0 015-5z"/>',
  experience: '<path d="M4 8h16v3a2 2 0 000 4v3H4v-3a2 2 0 000-4z"/><path d="M14 8v10" stroke-dasharray="2 2"/>',
  religious: '<path d="M5 20v-8a7 7 0 0114 0v8M3 20h18M12 2.5v2.5"/><path d="M10 20v-4a2 2 0 014 0v4"/>',
  food: '<path d="M7 3v8M5 3v5a2 2 0 004 0V3M7 11v10M17 3c-2.5 2-2.5 7 0 9v9"/>',
  nightlife: '<path d="M5 4h14l-7 8z"/><path d="M12 12v8M8 20h8"/>',
  family: '<circle cx="8" cy="7" r="2.5"/><circle cx="16.5" cy="9" r="2"/><path d="M3.5 20v-3a4.5 4.5 0 019 0v3M13 20v-2.5a3.5 3.5 0 017 0V20"/>'
};
export const kindIcon = (kind) => SVG(KIND_ICON[kind] || KIND_ICON.landmark);
const KINDS = {
  landmark: { group: { he: 'אתרים ומונומנטים', en: 'Landmarks' }, one: { he: 'אתר', en: 'Landmark' } },
  museum: { group: { he: 'מוזיאונים', en: 'Museums' }, one: { he: 'מוזיאון', en: 'Museum' } },
  religious: { group: { he: 'אתרי דת ומקדשים', en: 'Temples & places of worship' }, one: { he: 'אתר דת', en: 'Place of worship' } },
  neighborhood: { group: { he: 'שכונות ורובעים', en: 'Neighbourhoods' }, one: { he: 'שכונה', en: 'Neighbourhood' } },
  market: { group: { he: 'שווקים ואוכל', en: 'Markets & food' }, one: { he: 'שוק', en: 'Market' } },
  viewpoint: { group: { he: 'תצפיות', en: 'Viewpoints' }, one: { he: 'תצפית', en: 'Viewpoint' } },
  nature: { group: { he: 'טבע ונופים', en: 'Nature' }, one: { he: 'טבע', en: 'Nature' } },
  beach: { group: { he: 'חופים', en: 'Beaches' }, one: { he: 'חוף', en: 'Beach' } },
  park: { group: { he: 'פארקים וגנים', en: 'Parks & gardens' }, one: { he: 'פארק', en: 'Park' } },
  experience: { group: { he: 'חוויות', en: 'Experiences' }, one: { he: 'חוויה', en: 'Experience' } }
};
const KIND_ORDER = Object.keys(KINDS);
const kindOf = (x) => (KINDS[x.kind] ? x.kind : 'landmark');
// "Good for" pills on an attraction: the visitor-facing tags only, at most three.
const EXTRA_TAG_LABELS = { teens: { he: 'נוער', en: 'Teens' }, evening: { he: 'בערב', en: 'Evening' }, adults: { he: 'מבוגרים', en: 'Adults' } };
const ATTR_PILLS = ['family', 'couple', 'teens', 'culture', 'food', 'nightlife', 'evening', 'shopping', 'nature', 'relaxation', 'adventure', 'beach', 'kosher', 'luxury', 'low_budget'];
const tagLabel = (x) => L(TAG_LABELS[x] || EXTRA_TAG_LABELS[x]);
const PILL_ICON = { family: 'family', couple: null, food: 'food', nightlife: 'nightlife', evening: 'nightlife', nature: 'nature', beach: 'beach' };
const pills = (tags = [], max = 3) => tags.filter((x) => ATTR_PILLS.includes(x)).slice(0, max).map((x) => `<span class="attr-pill tag-${x}">${PILL_ICON[x] ? SVG(KIND_ICON[PILL_ICON[x]]) : ''}${esc(tagLabel(x))}</span>`).join('');
const areaName = (d, en) => { const a = (d.areas || []).find((x) => x.name.en === en); return a ? L(a.name) : en || ''; };

// Attraction / day-trip photos (dist/catalog/attraction-images.mjs, ~180KB): loaded once, on the first destination page.
let attrImages = null, attrImagesLoading = null;
const loadAttrImages = () => attrImagesLoading ||= import('./catalog/attraction-images.mjs').then((m) => (attrImages = m.default || {})).catch(() => (attrImages = {}));
const photoKey = (d, x) => `${d.id}|${x.name.en}`;
function photoHtml(meta, alt) {
  return `<img src="${esc(meta.src)}" alt="${esc(alt)}" loading="lazy" decoding="async" width="640" height="427">`;
}
const creditHtml = (meta) => (meta?.credit ? `<small class="attr-credit">${t('catalog.dest.attrPhoto', { credit: `<bdi data-allow-hebrew>${esc(meta.credit)}</bdi>`, license: meta.source ? `<a href="${esc(meta.source)}" target="_blank" rel="noopener">${esc(meta.license)}</a>` : esc(meta.license) })}</small>` : '');
// The media block of a card: the photo when we have one (or once the photo list arrives), else the kind's icon on its colour.
function mediaHtml(d, x, alt) {
  const meta = attrImages?.[photoKey(d, x)];
  return `<div class="attr-media" data-attr-photo="${esc(photoKey(d, x))}" data-alt="${esc(alt)}">${meta ? photoHtml(meta, alt) : `<span class="attr-placeholder">${kindIcon(kindOf(x))}</span>`}<span class="attr-kind">${kindIcon(kindOf(x))}${esc(L(KINDS[kindOf(x)].one))}</span>${x.mustSee ? `<span class="attr-must">${t('catalog.dest.mustSee')}</span>` : ''}</div>`;
}
function attractionCard(d, a, { hidden = false } = {}) {
  const name = L(a.name), meta = attrImages?.[photoKey(d, a)];
  const where = a.area ? `<span>${icon('pin')}${esc(areaName(d, a.area))}</span>` : '';
  return `<li class="attr-card kind-${kindOf(a)} photo-place-card" data-kind="${kindOf(a)}"${hidden ? ' hidden data-more' : ''}><div class="photo-place-frame">${mediaHtml(d, a, name)}<strong class="photo-place-caption">${esc(name)}</strong></div><div class="attr-body">`
    + `<p class="attr-meta">${where}<span>${icon('clock')}${t('catalog.dest.hoursShort', { hours: hours(a.durationH) })}</span>${a.months?.length ? `<span>${icon('calendar')}${esc(monthsText(a.months))}</span>` : ''}</p>`
    + `${pills(a.tags).length ? `<p class="attr-pills">${pills(a.tags)}</p>` : ''}<span class="attr-credit-slot">${creditHtml(meta)}</span></div></li>`;
}
const secHead = (id, title, sub, iconSvg) => `<div class="dest-sec-head"><span class="sec-badge">${iconSvg}</span><div><h2 id="${id}">${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div></div>`;
const mustSee = (d) => { const top = d.attractions.filter((a) => a.mustSee); return top.length ? top : d.attractions.slice(0, 3); };

function topAttractionsHtml(d) {
  const top = mustSee(d);
  return `<section class="dest-section dest-sec-top" aria-labelledby="dest-top">${secHead('dest-top', t('catalog.dest.top'), t('catalog.dest.topSub'), icon('spark'))}<ul class="dest-attractions dest-top">${top.map((a) => attractionCard(d, a)).join('')}</ul></section>`;
}
const TODO_SHOWN = 6;
function todoHtml(d) {
  const top = new Set(mustSee(d));
  // Same kinds sit together (landmarks, museums, markets…); the chips narrow the list to one kind.
  const rest = d.attractions.filter((a) => !top.has(a)).sort((a, b) => KIND_ORDER.indexOf(kindOf(a)) - KIND_ORDER.indexOf(kindOf(b)));
  if (!rest.length) return '';
  const kinds = [...new Set(rest.map(kindOf))];
  const chips = kinds.length > 1 ? `<div class="filter-chips attr-kinds" role="group" aria-label="${t('catalog.dest.kindsLabel')}"><button type="button" class="selected" aria-pressed="true" data-attr-kind="all">${t('catalog.dest.allKinds')} <span class="count">${rest.length}</span></button>${kinds.map((k) => `<button type="button" aria-pressed="false" data-attr-kind="${k}" class="kind-${k}">${kindIcon(k)}${esc(L(KINDS[k].group))} <span class="count">${rest.filter((a) => kindOf(a) === k).length}</span></button>`).join('')}</div>` : '';
  const more = rest.length - TODO_SHOWN;
  return `<section class="dest-section dest-sec-todo" aria-labelledby="dest-todo">${secHead('dest-todo', t('catalog.dest.attractions'), t('catalog.dest.todoSub', { count: rest.length }), SVG(KIND_ICON.experience))}${chips}`
    + `<ul class="dest-attractions dest-todo" id="dest-todo-list">${rest.map((a, i) => attractionCard(d, a, { hidden: i >= TODO_SHOWN })).join('')}</ul>`
    + (more > 0 ? `<div class="dest-more-wrap"><button type="button" class="button secondary" id="dest-todo-more" aria-expanded="false" aria-controls="dest-todo-list" data-more="${t('catalog.dest.showMore', { count: more })}" data-less="${t('catalog.dest.showLess')}">${t('catalog.dest.showMore', { count: more })}</button></div>` : '')
    + `</section>`;
}
function dayTripsHtml(d) {
  if (!d.dayTrips.length) return '';
  return `<section class="dest-section dest-sec-trips" aria-labelledby="dest-trips">${secHead('dest-trips', t('catalog.dest.dayTrips'), '', icon('case'))}<ul class="dest-daytrips">${d.dayTrips.map((x) => {
    const name = L(x.name), meta = attrImages?.[photoKey(d, x)];
    return `<li class="attr-card kind-${kindOf(x)} photo-place-card"><div class="photo-place-frame">${mediaHtml(d, x, name)}<strong class="photo-place-caption">${esc(name)}</strong></div><div class="attr-body"><p class="attr-meta"><span>${icon('clock')}${t('catalog.dest.dayTripHours', { hours: hours(x.hours) })}</span>${x.priceIls ? `<span>${icon('tag')}${t('catalog.dest.dayTripPrice', { low: x.priceIls.low, high: x.priceIls.high })}</span>` : ''}${x.months?.length ? `<span>${icon('calendar')}${esc(monthsText(x.months))}</span>` : ''}</p><p class="attr-note">${esc(L(x.note))}</p><span class="attr-credit-slot">${creditHtml(meta)}</span></div></li>`;
  }).join('')}</ul></section>`;
}
// Where to stay: who each area suits, a price level (written in the data, or read from words like "pricey" / "cheaper"),
// pros and cons when the data has them, and which of the destination's attractions are in that area.
const AREA_FOR = [
  ['family', /\bfamil/i], ['couple', /\bcouple/i], ['first', /first[- ]tim/i], ['nightlife', /nightlife|bars|clubs|party/i], ['shopping', /shop/i],
  ['kosher', /kosher|shabbat/i], ['beach', /beach|seafront|sea\b/i], ['quiet', /\bquiet|\bcalm/i], ['food', /food|restaurant/i]
];
const AREA_TAG = { first: { he: 'ביקור ראשון', en: 'First-timers' }, quiet: { he: 'שקט', en: 'Quiet' } };
export function areaPrice(a) {
  if ([1, 2, 3].includes(a.price)) return a.price;
  const en = a.forWhom?.en || '';
  return /pricey|expensive|upscale|luxur|exclusive|high-end|posh/i.test(en) ? 3 : /cheap|budget|lower prices|affordable|good value|inexpensive|backpack/i.test(en) ? 1 : 0;
}
export const areaTags = (a) => AREA_FOR.filter(([, re]) => re.test(a.forWhom?.en || '')).map(([k]) => k).slice(0, 3);
function areasHtml(d) {
  if (!d.areas?.length) return '';
  return `<section class="dest-section dest-sec-stay" aria-labelledby="dest-areas">${secHead('dest-areas', t('catalog.dest.areas'), t('catalog.dest.areasSub', { count: d.areas.length }), icon('hotel'))}<ul class="dest-areas">${d.areas.map((a) => {
    const price = areaPrice(a), near = d.attractions.filter((x) => x.area === a.name.en).slice(0, 3).map((x) => L(x.name));
    const tags = areaTags(a).map((k) => `<span class="attr-pill">${esc(L(AREA_TAG[k] || TAG_LABELS[k]))}</span>`).join('');
    return `<li class="area-card photo-place-card"><div class="area-head"><span class="area-icon">${icon('hotel')}</span><h3>${esc(L(a.name))}</h3>${price ? `<span class="area-price p${price}" title="${t(`catalog.dest.price${price}`)}"><span aria-hidden="true">${'₪'.repeat(price)}<i>${'₪'.repeat(3 - price)}</i></span> ${t(`catalog.dest.price${price}`)}</span>` : ''}</div>`
      + `<p class="area-for"><b>${t('pages.destination.7')}:</b> ${esc(L(a.forWhom))}</p>${tags ? `<p class="attr-pills">${tags}</p>` : ''}`
      + (a.pros || a.cons ? `<ul class="area-proscons">${a.pros ? `<li class="pro">${icon('check')}<span><b>${t('catalog.dest.pros')}:</b> ${esc(L(a.pros))}</span></li>` : ''}${a.cons ? `<li class="con">${icon('shield')}<span><b>${t('catalog.dest.cons')}:</b> ${esc(L(a.cons))}</span></li>` : ''}</ul>` : '')
      + (near.length ? `<p class="area-near">${icon('pin')}${esc(t('catalog.dest.nearby', { list: near.join(', ') }))}</p>` : '') + `</li>`;
  }).join('')}</ul></section>`;
}

// Destination page wiring: kind chips + "show more" on things to do, and the attraction photos once their list arrives.
export function wireDestination(root) {
  const heroImage = root.querySelector('.dest-hero img[data-thumb]');
  if (heroImage) {
    const useThumbnail = () => {
      if (heroImage.getAttribute('src') === heroImage.dataset.thumb) heroImage.hidden = true;
      else heroImage.src = heroImage.dataset.thumb;
    };
    heroImage.addEventListener('error', useThumbnail);
    if (heroImage.complete && !heroImage.naturalWidth) useThumbnail();
  }
  const list = root.querySelector('#dest-todo-list'), more = root.querySelector('#dest-todo-more');
  let expanded = false, kind = 'all';
  const apply = () => {
    if (!list) return;
    [...list.children].forEach((li) => { li.hidden = kind === 'all' ? !expanded && li.hasAttribute('data-more') : li.dataset.kind !== kind; });
    if (more) { more.hidden = kind !== 'all'; more.textContent = expanded ? more.dataset.less : more.dataset.more; more.setAttribute('aria-expanded', String(expanded)); }
  };
  root.querySelectorAll('[data-attr-kind]').forEach((b) => b.addEventListener('click', () => {
    kind = b.dataset.attrKind;
    root.querySelectorAll('[data-attr-kind]').forEach((x) => { x.classList.toggle('selected', x === b); x.setAttribute('aria-pressed', String(x === b)); });
    apply();
  }));
  more?.addEventListener('click', () => { const first = [...list.children].find((li) => li.hasAttribute('data-more')); expanded = !expanded; apply(); if (expanded) first?.querySelector('strong')?.scrollIntoView({ block: 'nearest' }); });
  const fill = () => root.querySelectorAll('[data-attr-photo]').forEach((el) => {
    const meta = attrImages?.[el.dataset.attrPhoto];
    if (!meta || el.querySelector('img')) return;
    el.querySelector('.attr-placeholder')?.remove();
    el.insertAdjacentHTML('afterbegin', photoHtml(meta, el.dataset.alt || ''));
    const slot = el.closest('.attr-card')?.querySelector('.attr-credit-slot');
    if (slot && !slot.innerHTML) slot.innerHTML = creditHtml(meta);
  });
  if (attrImages) fill(); else loadAttrImages().then(() => { if (root.isConnected) fill(); });
}

export function relatedOf(d, limit = 3) {
  // Same region and a similar style first ("Rome" → Florence, Venice, Barcelona), never under an advisory.
  const styles = d.tags.filter((x) => STYLE_FILTERS.includes(x));
  const score = (x) => styles.filter((t) => x.tags.includes(t)).length + (x.region === d.region ? 3 : 0) + (Math.abs(x.flightHours - d.flightHours) <= 2 ? 1 : 0);
  return destinations.filter((x) => x.id !== d.id && !x.advisory).map((x) => ({ x, s: score(x) })).sort((a, b) => b.s - a.s).slice(0, limit).map((r) => r.x);
}

// ---------- inspiration ----------
export const INSPIRATION_STYLES = ['beach', 'city', 'nature', 'family', 'couple', 'ski', 'luxury', 'short'];
export function inspirationTiles(today = new Date()) {
  const month = today.getMonth() + 1;
  const used = new Set(); // ponytail: each tile gets its own lead photo, so 'beach' and 'city' don't both show Athens
  return INSPIRATION_STYLES.map((style) => {
    const list = style === 'short' ? destinations.filter((d) => d.flightHours > 0 && d.flightHours <= 4) : destinations.filter((d) => d.tags.includes(style));
    const ranked = rank({ month: style === 'ski' ? 1 : month, tags: style === 'short' ? [] : [style] }).map((x) => x.destination).filter((d) => list.includes(d) && !d.advisory);
    const lead = ranked.find((d) => !used.has(d.id) && d.tags[0] === style) || ranked.find((d) => !used.has(d.id)) || ranked[0] || list[0];
    if (lead) used.add(lead.id);
    return { style, count: list.length, lead, label: style === 'short' ? t('catalog.insp.short') : L(TAG_LABELS[style]), sub: t(`catalog.insp.styleSub.${style}`) };
  });
}

// ---------- comparison ----------
export function compareColumn(d) {
  return `<article class="compare-column"><img src="${imgSrc(d)}" alt="${esc(altOf(d))}" loading="lazy"><h2>${esc(L(d.name))}, ${esc(L(d.country))}</h2><dl>`
    + `<div><dt>${t('catalog.compare.flight')}</dt><dd>${d.flightHours ? t('catalog.dest.flightValue', { hours: hours(d.flightHours), kind: flightKind(d) }) : t('catalog.card.domestic')}</dd></div>`
    + `<div><dt>${t('catalog.compare.daily')}</dt><dd class="compare-total">${t('catalog.dest.dailyBudgetValue', { low: d.dailyBudgetIls.low, high: d.dailyBudgetIls.high })}</dd></div>`
    + `<div><dt>${t('catalog.compare.best')}</dt><dd>${esc(monthsText(d.bestMonths))}</dd></div>`
    + `<div><dt>${t('catalog.compare.styles')}</dt><dd>${d.tags.filter((x) => STYLE_FILTERS.includes(x)).map((x) => esc(L(TAG_LABELS[x]))).join(' · ')}</dd></div>`
    + `<div><dt>${t('catalog.compare.highlights')}</dt><dd>${d.highlights.slice(0, 3).map((h) => esc(L(h))).join(' · ')}</dd></div></dl>`;
}

export { destinations, byId };
