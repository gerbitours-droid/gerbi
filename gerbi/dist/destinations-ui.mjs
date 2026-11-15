// Destinations catalog UI (spec 23): the destinations list with filters, the destination page, the home showcase,
// inspiration and the comparison columns. Pure HTML builders + small wiring; pages.mjs / app.js own the routes.
import { destinations, byId, search, rank, curatedPicks, regions, REGIONS, TAG_LABELS, monthName, monthOf } from './catalog.mjs';
import { t, lang } from './i18n.mjs';

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

// The destinations-page card (also favorites, inspiration, related, results).
export function destCard(d, { favorites = [], compare = null, reason = '', heart = true } = {}) {
  const fav = favorites.includes(d.id), name = L(d.name);
  return `<article class="destination-card dest-card" data-dest-card="${d.id}"><a href="#/destination/${d.id}" class="destination-photo" tabindex="-1" aria-hidden="true"><img src="${imgSrc(d)}" alt="" loading="lazy" decoding="async" width="600" height="400"><span class="photo-label">${esc(L(regions[d.region]))}</span></a>`
    + (heart ? `<button class="heart-button" data-page-favorite="${d.id}" aria-label="${esc(fav ? t('catalog.card.unsave', { name }) : t('catalog.card.save', { name }))}" aria-pressed="${fav}">${icon('heart')}</button>` : '')
    + `<div class="destination-body"><span class="eyebrow">${esc(L(d.country))}</span><h2><a href="#/destination/${d.id}">${esc(name)}</a></h2><p>${esc(L(d.summary))}</p>${reason ? `<p class="match-reason">${esc(reason)}</p>` : ''}${factsLine(d)}`
    + `<div class="pills">${d.tags.filter((x) => STYLE_FILTERS.includes(x)).slice(0, 3).map((x) => `<span class="pill">${esc(L(TAG_LABELS[x]))}</span>`).join('')}</div>`
    + `<div class="destination-price"><a class="button yellow" href="#/destination/${d.id}">${t('catalog.card.open')}</a>${compare ? `<label class="compare-check"><input type="checkbox" data-compare="${d.id}" ${compare.has(d.id) ? 'checked' : ''}>${t('catalog.card.compare')}</label>` : ''}</div></div></article>`;
}

// Home showcase card: the home `.card` look, catalog content.
export function homeCard(d, { favorites = [], reason = '' } = {}) {
  const fav = favorites.includes(d.id), name = L(d.name);
  return `<article class="card dest-home-card"><div class="card-image"><img src="${imgSrc(d)}" alt="${esc(altOf(d))}" loading="lazy" decoding="async" width="600" height="400"><button class="favorite" data-favorite="${d.id}" aria-pressed="${fav}" aria-label="${esc(fav ? t('catalog.card.unsave', { name }) : t('catalog.card.save', { name }))}">${icon('heart')}</button><span class="card-badge">${icon('globe')}${esc(L(regions[d.region]))}</span></div>`
    + `<div class="card-body"><h3>${esc(placeTitle(d))}</h3><p class="card-description">${esc(L(d.summary))}</p>${reason ? `<p class="match-reason">${esc(reason)}</p>` : ''}${factsLine(d)}<div class="card-bottom"><a class="button yellow card-cta" href="#/destination/${d.id}">${t('app.card.cta')}</a></div></div></article>`;
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
    sort: ['recommended', 'flight', 'budget', 'name'].includes(p.get('sort')) ? p.get('sort') : 'recommended', n: Math.min(Math.max(PAGE, Math.floor(Number(p.get('n'))) || PAGE), 200), type: p.get('type') || '' };
}
export function filterQuery(f) {
  const q = {};
  if (f.q) q.q = f.q; if (f.region !== 'all') q.region = f.region; if (f.style !== 'all') q.style = f.style; if (f.month) q.month = f.month; if (f.budget) q.budget = f.budget;
  if (f.hours) q.hours = f.hours; if (f.direct) q.direct = '1'; if (f.sort !== 'recommended') q.sort = f.sort; if (f.n > PAGE) q.n = f.n; if (f.type) q.type = f.type;
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
  return `<form id="destination-filter" class="filter-toolbar dest-toolbar" role="search"><label class="search-box">${icon('search')}<input name="q" type="search" aria-label="${t('catalog.search.label')}" placeholder="${t('catalog.search.placeholder')}" value="${esc(f.q)}" autocomplete="off"></label>`
    + `<select name="sort" aria-label="${t('catalog.sort.label')}">${option('recommended', t('catalog.sort.recommended'), f.sort)}${option('flight', t('catalog.sort.flight'), f.sort)}${option('budget', t('catalog.sort.budget'), f.sort)}${option('name', t('catalog.sort.name'), f.sort)}</select><button class="button blue">${t('catalog.search.submit')}</button></form>`
    + `<div class="filter-chips dest-chips" role="group" aria-label="${t('catalog.filter.region')}">${chip('region', 'all', t('catalog.filter.all'), f.region)}${REGIONS.map((r) => chip('region', r, L(regions[r]), f.region)).join('')}</div>`
    + `<div class="filter-chips dest-chips" role="group" aria-label="${t('catalog.filter.style')}">${chip('style', 'all', t('catalog.filter.all'), f.style)}${STYLE_FILTERS.map((s) => chip('style', s, L(TAG_LABELS[s]), f.style)).join('')}${chip('style', 'short', t('catalog.insp.short'), f.style)}</div>`
    + `<div class="dest-selects"><label>${t('catalog.filter.month')}<select data-filter="month">${option(0, t('catalog.filter.anyMonth'), f.month)}${Array.from({ length: 12 }, (_, i) => option(i + 1, monthName(i + 1, lang), f.month)).join('')}</select></label>`
    + `<label>${t('catalog.filter.budget')}<select data-filter="budget">${option(0, t('catalog.filter.anyBudget'), f.budget)}${[1, 2, 3].map((b) => option(b, t(`catalog.filter.budget${b}`), f.budget)).join('')}</select></label>`
    + `<label>${t('catalog.filter.hours')}<select data-filter="hours">${option(0, t('catalog.filter.anyHours'), f.hours)}${[4, 6, 10].map((h) => option(h, t('catalog.filter.hoursUpTo', { hours: h }), f.hours)).join('')}</select></label>`
    + `<label class="dest-direct"><input type="checkbox" data-filter="direct" ${f.direct ? 'checked' : ''}>${t('catalog.filter.direct')}</label></div>`;
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
    hero: `<div class="destination-hero dest-hero"><img src="${imgSrc(d, true)}" alt="${esc(altOf(d))}" width="1200" height="800"><div><span>${esc(L(d.country))} / ${esc(L(regions[d.region]))}</span><h1 tabindex="-1">${esc(name)}</h1><p>${esc(L(d.summary))}</p></div><button class="button white" data-page-favorite="${d.id}" aria-pressed="${fav}">${icon('heart')} ${fav ? t('pages.destination.2') : t('pages.destination.3')}</button></div>${d.image.credit ? `<p class="photo-credit">${t('catalog.dest.photo', { credit: `<bdi data-allow-hebrew>${esc(d.image.credit)}</bdi>`, license: d.image.source ? `<a href="${esc(d.image.source)}" target="_blank" rel="noopener">${esc(d.image.license)}</a>` : esc(d.image.license) })}</p>` : ''}`,
    body: (d.advisory ? `<div class="soft-notice dest-advisory" role="note"><strong>${t('catalog.dest.advisory')}:</strong> ${esc(L(d.advisory))}</div>` : '')
      + `<span class="eyebrow">${esc(L(d.country))}</span><h2>${t('catalog.dest.why', { name: esc(name) })}</h2><ul class="dest-highlights">${d.highlights.map((h) => `<li>${icon('spark')}<span>${esc(L(h))}</span></li>`).join('')}</ul>`
      + guide
      + `<section class="dest-section" aria-labelledby="dest-areas"><h2 id="dest-areas">${t('catalog.dest.areas')}</h2><dl class="dest-areas">${d.areas.map((a) => `<div><dt>${esc(L(a.name))}</dt><dd>${esc(L(a.forWhom))}</dd></div>`).join('')}</dl></section>`
      + `<section class="dest-section" aria-labelledby="dest-todo"><h2 id="dest-todo">${t('catalog.dest.attractions')}</h2><ul class="dest-attractions">${d.attractions.map((a) => `<li><strong>${esc(L(a.name))}</strong><small>${esc(a.area ? L(d.areas.find((x) => x.name.en === a.area)?.name) + ' · ' : '')}${t('catalog.dest.hoursShort', { hours: hours(a.durationH) })}</small></li>`).join('')}</ul></section>`
      + (d.dayTrips.length ? `<section class="dest-section" aria-labelledby="dest-trips"><h2 id="dest-trips">${t('catalog.dest.dayTrips')}</h2><ul class="dest-daytrips">${d.dayTrips.map((x) => `<li><strong>${esc(L(x.name))}</strong> <small>${t('catalog.dest.dayTripHours', { hours: hours(x.hours) })}</small><p>${esc(L(x.note))}</p></li>`).join('')}</ul></section>` : '')
      + `<section class="dest-section" aria-labelledby="dest-when"><h2 id="dest-when">${t('catalog.dest.when')}</h2><ol class="dest-months">${Array.from({ length: 12 }, (_, i) => `<li class="${best.has(i + 1) ? 'best' : ''}"${best.has(i + 1) ? ` title="${t('catalog.dest.bestMonth')}"` : ''}><span>${esc(shortMonth(i + 1))}</span>${best.has(i + 1) ? `<span class="sr-only"> – ${t('catalog.dest.bestMonth')}</span>` : ''}</li>`).join('')}</ol><p>${esc(L(d.seasonsNote))}</p></section>`
      + `<section class="dest-section" aria-labelledby="dest-practical"><h2 id="dest-practical">${t('catalog.dest.practical')}</h2><dl class="dest-practical">`
      + [[t('catalog.dest.transport'), `${d.transport.carRecommended ? t('catalog.dest.car') : t('catalog.dest.noCar')}. ${L(d.transport.note)}`], [t('catalog.dest.currency'), d.practical.currency], [t('catalog.dest.language'), L(d.practical.language)], [t('catalog.dest.timeZone'), d.practical.timeZone.replace('_', ' ')],
        [t('catalog.dest.visa'), L(d.practical.visaNoteForIsraelis)], [t('catalog.dest.kosher'), L(d.practical.kosher)], [t('catalog.dest.shabbat'), L(d.practical.shabbat)]].map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')
      + `</dl></section>`,
    aside: `<span class="eyebrow">${t('catalog.dest.facts')}</span><h2>${esc(name)}</h2><dl class="dest-quick"><div><dt>${t('catalog.dest.flight')}</dt><dd>${d.flightHours ? t('catalog.dest.flightValue', { hours: hours(d.flightHours), kind: flightKind(d) }) : t('catalog.card.domestic')}</dd></div><div><dt>${t('catalog.dest.bestMonths')}</dt><dd>${esc(monthsText(d.bestMonths))}</dd></div><div><dt>${t('catalog.dest.dailyBudget')}</dt><dd>${t('catalog.dest.dailyBudgetValue', { low: d.dailyBudgetIls.low, high: d.dailyBudgetIls.high })}<small>${t('catalog.dest.dailyBudgetNote')}</small></dd></div></dl>`
      + `<a class="button yellow full-width" href="#/?to=${d.code}">${icon('plane')}${t('catalog.dest.ctaFlights')}</a><a class="button blue full-width" href="#/build?dest=${d.id}">${icon('spark')}${t('catalog.dest.ctaBuild')}</a><a class="button secondary full-width" href="#/tailor-made?dest=${d.id}">${t('catalog.dest.ctaTailor')}</a><p class="micro-copy">${t('catalog.dest.ctaNote')}</p>`
  };
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
  return INSPIRATION_STYLES.map((style) => {
    const list = style === 'short' ? destinations.filter((d) => d.flightHours > 0 && d.flightHours <= 4) : destinations.filter((d) => d.tags.includes(style));
    const lead = rank({ month: style === 'ski' ? 1 : month }).map((x) => x.destination).find((d) => list.includes(d) && !d.advisory) || list[0];
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
