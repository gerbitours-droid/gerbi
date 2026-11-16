// Destinations catalog (spec 23): the one source for every "destination" the site shows — destinations page,
// destination page, home showcase, inspiration, planner suggestions — and for the magic trip builder.
// Pure data + helpers: no DOM, no i18n import, safe in Node and the browser.
//   import { destinations, byCode, byId, search, rank, curatedPicks } from './catalog.mjs';
// Text fields are { he, en }. dailyBudgetIls {low,mid,high} = ₪ per person per day ON THE GROUND, excluding flights AND
// lodging (food, attractions, local transport) — rough estimates, always shown as such.
// `code` is an IATA city/airport code usable for flight search; optional `hotelCity` is the IATA city code to search hotels
// under when it differs from `code`. Spec 28 §ד (every field optional — code must cope without it):
//   attraction `area` = where it is, in English: one of `areas[].name.en` when it fits, otherwise a short real
//     neighbourhood/town; in country-sized destinations it is the city/base, so a day can stay in one base.
//   attraction `mustSee: true` = the 2–4 essentials of the destination; `months: [1..12]` only on seasonal activities.
//   attraction tags may also use ATTRACTION_EXTRA_TAGS (teens, evening, adults) on top of ALLOWED_TAGS.
//   dayTrip `priceIls: { low, high }` = rough ₪ per adult (estimate — see the data files), optional `kind`, `months`.
import greeceItaly from './catalog/greece-cyprus-italy.mjs';
import iberiaBalkans from './catalog/iberia-balkans.mjs';
import europeNorth from './catalog/europe-north.mjs';
import europeCentralNordic from './catalog/europe-central-nordic.mjs';
import eastMed from './catalog/east-med.mjs';
import africa from './catalog/africa.mjs';
import africaAsia from './catalog/africa-asia.mjs';
import americasOceania from './catalog/americas-oceania.mjs';
import images from './catalog/images.mjs';

export const REGIONS = ['europe', 'middle-east', 'israel', 'africa', 'asia', 'americas', 'oceania'];
export const regions = {
  europe: { he: 'אירופה', en: 'Europe' }, 'middle-east': { he: 'המזרח התיכון', en: 'Middle East' }, israel: { he: 'ישראל', en: 'Israel' },
  africa: { he: 'אפריקה והאיים', en: 'Africa & islands' }, asia: { he: 'אסיה', en: 'Asia' }, americas: { he: 'אמריקה', en: 'The Americas' }, oceania: { he: 'אוקיאניה', en: 'Oceania' }
};
// Style tags a visitor can pick (subset of backend/tag-catalog.mjs ids) and their labels.
export const TAG_LABELS = {
  beach: { he: 'ים וחופים', en: 'Beach' }, city: { he: 'עיר', en: 'City' }, nature: { he: 'טבע ונופים', en: 'Nature' }, family: { he: 'משפחות', en: 'Families' },
  couple: { he: 'זוגות', en: 'Couples' }, culture: { he: 'תרבות והיסטוריה', en: 'Culture' }, food: { he: 'אוכל', en: 'Food' }, nightlife: { he: 'חיי לילה', en: 'Nightlife' },
  shopping: { he: 'קניות', en: 'Shopping' }, ski: { he: 'סקי', en: 'Ski' }, adventure: { he: 'אקטיבי', en: 'Active' }, luxury: { he: 'יוקרה', en: 'Luxury' },
  relaxation: { he: 'מנוחה', en: 'Relaxation' }, low_budget: { he: 'משתלם', en: 'Good value' }, kosher: { he: 'כשר בהישג יד', en: 'Kosher-friendly' },
  short_break: { he: 'מתאים לסופ״ש', en: 'Short break' }, week_long: { he: 'שבוע ומעלה', en: 'A week or more' }, all_inclusive: { he: 'הכול כלול', en: 'All-inclusive' },
  water_slides: { he: 'פארקי מים', en: 'Water parks' }, with_children: { he: 'עם ילדים', en: 'With kids' }, direct_flight: { he: 'טיסה ישירה', en: 'Direct flight' }
};
// Every tag a destination may carry: ids of backend/tag-catalog.mjs (kept in sync by tests/catalog.test.mjs).
export const ALLOWED_TAGS = ['beach', 'city', 'couple', 'family', 'relaxation', 'adventure', 'short_break', 'week_long', 'flexible_dates', 'direct_flight', 'late_departure', 'low_budget', 'all_inclusive', 'kosher', 'shabbat', 'accessible', 'water_slides', 'family_room', 'solo', 'with_children', 'adults_only', 'nature', 'culture', 'food', 'nightlife', 'shopping', 'ski', 'luxury'];
// Attraction-only tags (not visitor-pickable, so not in backend/tag-catalog.mjs, which ALLOWED_TAGS must mirror).
export const ATTRACTION_EXTRA_TAGS = ['teens', 'evening', 'adults'];
export const ATTRACTION_TAGS = [...ALLOWED_TAGS, ...ATTRACTION_EXTRA_TAGS];
export const ATTRACTION_KINDS = ['landmark', 'museum', 'nature', 'beach', 'neighborhood', 'market', 'viewpoint', 'park', 'experience', 'religious'];

const imageOf = (id) => {
  const meta = images[id] || {};
  return { src: `/assets/destinations/${id}.webp`, thumb: `/assets/destinations/${id}-600.webp`, alt: meta.alt || { he: '', en: '' }, credit: meta.credit || '', license: meta.license || '', source: meta.source || '' };
};

export const destinations = [...greeceItaly, ...iberiaBalkans, ...europeNorth, ...europeCentralNordic, ...eastMed, ...africa, ...africaAsia, ...americasOceania]
  .map((d) => ({ ...d, image: { ...imageOf(d.id), ...(d.image || {}), alt: { ...imageOf(d.id).alt, ...(d.image?.alt || {}) } } }));

// Rough order of popularity with Israeli travellers: the tie-break of every ranking and the default listing order.
const POPULAR = ['athens', 'cyprus', 'rome', 'santorini', 'crete', 'rhodes', 'dubai', 'paris', 'london', 'barcelona', 'budapest', 'prague', 'georgia', 'eilat', 'milan-lake-como', 'new-york', 'bangkok', 'phuket',
  'amsterdam', 'vienna', 'berlin', 'lisbon', 'mykonos', 'abu-dhabi', 'venice', 'florence-tuscany', 'amalfi-naples', 'madrid', 'mallorca', 'croatia', 'montenegro', 'dead-sea', 'nice', 'munich-bavaria', 'swiss-alps',
  'austrian-alps', 'bansko', 'maldives', 'sicily', 'krakow', 'porto', 'tenerife', 'madeira', 'slovenia', 'istanbul', 'marrakech', 'florida', 'japan', 'vietnam', 'sri-lanka', 'goa', 'bali', 'zanzibar', 'seychelles',
  'mauritius', 'cape-town', 'kenya-safari', 'iceland', 'norway-fjords', 'copenhagen', 'edinburgh', 'los-angeles', 'las-vegas', 'cancun', 'costa-rica', 'peru', 'buenos-aires', 'rio', 'sydney', 'new-zealand'];
const order = (d) => { const i = POPULAR.indexOf(d.id); return i < 0 ? POPULAR.length + destinations.indexOf(d) : i; };
destinations.sort((a, b) => order(a) - order(b));

const ids = new Map(destinations.map((d) => [d.id, d]));
export const byId = (id) => ids.get(String(id || '')) || null;
// By the destination's own code first, then by any of its airports ("CDG" → Paris).
export function byCode(code) {
  const c = String(code || '').toUpperCase();
  if (!c) return null;
  return destinations.find((d) => d.code === c) || destinations.find((d) => (d.airports || []).includes(c)) || null;
}

const MONTHS_HE = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
const MONTHS_EN = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
export const monthName = (m, lang = 'he') => (lang === 'en' ? MONTHS_EN[m - 1]?.replace(/^./, (c) => c.toUpperCase()) : MONTHS_HE[m - 1]) || '';
// 1..12 from a number, a Hebrew/English month name, or an ISO start date; 0 when unknown.
export function monthOf(p = {}) {
  if (Number.isInteger(p.month) && p.month >= 1 && p.month <= 12) return p.month;
  if (typeof p.start === 'string' && /^\d{4}-\d{2}/.test(p.start)) return Number(p.start.slice(5, 7));
  const name = String(p.month || '').trim().toLowerCase();
  return MONTHS_HE.indexOf(name) + 1 || MONTHS_EN.indexOf(name) + 1 || 0;
}

export const normalize = (value) => String(value || '').normalize('NFKC').toLowerCase().replace(/[֑-ׇ]/g, '')
  .replace(/[״"׳'`’]/g, '').replace(/[()–—־\-,.·/]/g, ' ').replace(/\s+/g, ' ').trim();
const searchIndex = new Map();
function indexOf(d) {
  if (searchIndex.has(d)) return searchIndex.get(d);
  const both = (x) => [x?.he, x?.en].filter(Boolean).map(normalize);
  const entry = {
    names: [...both(d.name), d.id.replace(/-/g, ' '), d.code.toLowerCase()],
    countries: both(d.country),
    region: both(regions[d.region]),
    body: [...(d.areas || []).flatMap((a) => both(a.name)), ...(d.attractions || []).flatMap((a) => both(a.name)), ...(d.dayTrips || []).flatMap((a) => both(a.name)),
      ...(d.highlights || []).flatMap(both), ...(d.tags || []).flatMap((t) => [t, ...both(TAG_LABELS[t])])].join(' | ')
  };
  searchIndex.set(d, entry);
  return entry;
}
// Free-text search in Hebrew or English: name > country/region > places inside the destination. `lang` only orders ties.
export function search(query, lang = 'he') {
  const q = normalize(query);
  if (!q) return [...destinations];
  // Hebrew prefixes ("ביוון", "לרומא") are tried both with and without the leading letter.
  const variants = [...new Set([q, ...(/^[בלהומש][א-ת]{3,}/.test(q) ? [q.slice(1)] : [])])];
  const scoreOf = (d) => {
    const ix = indexOf(d);
    let best = 0;
    for (const v of variants) {
      if (ix.names.includes(v)) best = Math.max(best, 100);
      else if (ix.names.some((n) => n.startsWith(v) || n.split(' ').some((w) => w.startsWith(v) && v.length >= 2))) best = Math.max(best, 80);
      if (ix.countries.some((c) => c === v || c.startsWith(v))) best = Math.max(best, 70);
      if (ix.region.some((r) => r === v || (v.length >= 3 && r.startsWith(v)))) best = Math.max(best, 50);
      if (v.length >= 3 && ix.body.includes(v)) best = Math.max(best, 30);
    }
    return best;
  };
  const langName = (d) => (lang === 'en' ? d.name.en : d.name.he);
  const scored = destinations.map((d) => ({ d, s: scoreOf(d) })).filter((x) => x.s > 0);
  // A name/country hit ("רומא", "יוון") means the visitor named a place: drop destinations that merely mention it.
  const floor = scored.some((x) => x.s >= 70) ? 50 : 1;
  return scored.filter((x) => x.s >= floor)
    .sort((a, b) => b.s - a.s || order(a.d) - order(b.d) || langName(a.d).localeCompare(langName(b.d))).map((x) => x.d);
}

const STYLE_KEYS = ['beach', 'city', 'family', 'couple', 'relaxation', 'adventure', 'nature', 'culture', 'food', 'nightlife', 'shopping', 'ski', 'luxury'];
const R = {
  requested: { he: 'ביקשתם את היעד הזה', en: 'You asked for this destination' },
  season: (m) => ({ he: `עונה טובה ב${monthName(m, 'he')}`, en: `Good season in ${monthName(m, 'en')}` }),
  style: (t) => ({ he: TAG_LABELS[t]?.he || t, en: TAG_LABELS[t]?.en || t }),
  kids: { he: 'מתאים למשפחות', en: 'Family-friendly' },
  value: { he: 'משתלם יחסית', en: 'Relatively good value' },
  kosher: { he: 'אוכל כשר בהישג יד', en: 'Kosher food is easy to find' },
  close: { he: 'טיסה קצרה', en: 'Short flight' }
};
// Ranks the whole catalog for a brief (the planner's brief format). `want` adds weight, never removes the rest;
// exclude / region / maxFlightHours / direct / maxBudgetLevel filter. Returns [{ destination, score, reasons:[{he,en}] }].
export function rank(preferences = {}, { limit = Infinity } = {}) {
  const p = preferences || {};
  const tags = Array.isArray(p.tags) ? p.tags : [];
  const styles = STYLE_KEYS.filter((k) => p[k] === true || (p[k] !== false && tags.includes(k)));
  const codes = (list) => new Set((Array.isArray(list) ? list : []).map((c) => String(c).toUpperCase()));
  const want = codes(p.want), exclude = codes(p.exclude);
  const hits = (d, set) => set.has(d.code) || (d.airports || []).some((a) => set.has(a)) || set.has(d.id.toUpperCase());
  const month = monthOf(p), regionsWanted = [].concat(p.region || []).filter(Boolean);
  const maxBudget = Number(p.maxBudgetLevel) || 0, maxHours = Number(p.maxFlightHours) || 0;
  const cheap = p.cheaper === true || tags.includes('low_budget');
  return destinations
    .filter((d) => !hits(d, exclude) && (!regionsWanted.length || regionsWanted.includes(d.region)) && (!maxHours || d.flightHours <= maxHours)
      && (p.direct !== true || d.direct) && (!maxBudget || d.budgetLevel <= maxBudget))
    .map((d) => {
      const reasons = [];
      let score = 0;
      if (want.size && hits(d, want)) { score += 12; reasons.push(R.requested); }
      if (month && d.bestMonths?.includes(month)) { score += 3; reasons.push(R.season(month)); } else if (month) score -= 1;
      for (const s of styles) if (d.tags.includes(s)) { score += 5; reasons.push(R.style(s)); }
      if (p.children > 0 && d.tags.includes('family') && !styles.includes('family')) { score += 2; reasons.push(R.kids); }
      if (cheap) { score += 4 - d.budgetLevel; if (d.budgetLevel <= 2) reasons.push(R.value); }
      if ((p.kosher === true || tags.includes('kosher')) && d.tags.includes('kosher')) { score += 2; reasons.push(R.kosher); }
      if (p.short === true && d.flightHours <= 4) { score += 2; reasons.push(R.close); }
      return { destination: d, score, reasons };
    })
    .sort((a, b) => b.score - a.score || order(a.destination) - order(b.destination))
    .slice(0, limit);
}

// Home showcase: varied across regions (and countries), in season, never a destination under a travel advisory.
// A destination the visitor asked for leads; it never hides the others.
export function curatedPicks({ month, preferences = {}, limit = 8, perRegion = 2 } = {}) {
  const m = monthOf({ month: month || preferences.month, start: preferences.start });
  const ranked = rank({ ...preferences, month: m || undefined, start: undefined, region: undefined, direct: undefined, maxBudgetLevel: undefined, maxFlightHours: undefined });
  const want = new Set((preferences.want || []).map((c) => String(c).toUpperCase()));
  const requested = (d) => want.has(d.code) || (d.airports || []).some((a) => want.has(a));
  const out = [], perR = {}, countries = {};
  const take = (item, countryCap, regionCap = perRegion) => {
    const d = item.destination;
    if (out.includes(item) || out.length >= limit || (perR[d.region] || 0) >= regionCap || (countries[d.country.en] || 0) >= countryCap) return;
    out.push(item); perR[d.region] = (perR[d.region] || 0) + 1; countries[d.country.en] = (countries[d.country.en] || 0) + 1;
  };
  const usable = ranked.filter((x) => !x.destination.advisory || requested(x.destination));
  // 1) what the visitor asked for (up to two of the same country), 2) in season across regions, 3) in season with a
  // looser region cap, 4) anything else that fits.
  for (const item of usable) if (requested(item.destination)) take(item, 2);
  const inSeason = usable.filter((x) => !m || x.destination.bestMonths.includes(m));
  for (const item of inSeason) take(item, 1);
  for (const item of inSeason) take(item, 1, perRegion * 2);
  for (const item of usable) take(item, 1);
  return out;
}

// Schema check used by tests/catalog.test.mjs (and handy for the builder): returns a list of problems.
export function validateDestination(d) {
  const problems = [], text = (x) => x && typeof x.he === 'string' && x.he.trim() && typeof x.en === 'string' && x.en.trim();
  const need = (ok, what) => { if (!ok) problems.push(`${d?.id}: ${what}`); };
  need(/^[a-z0-9-]+$/.test(d.id || ''), 'id');
  need(/^[A-Z]{3}$/.test(d.code || ''), 'code');
  need(Array.isArray(d.airports) && d.airports.length && d.airports.every((a) => /^[A-Z]{3}$/.test(a)), 'airports');
  need(text(d.name) && text(d.country), 'name/country');
  need(REGIONS.includes(d.region), 'region');
  need(Array.isArray(d.tags) && d.tags.length >= 2 && d.tags.every((t) => ALLOWED_TAGS.includes(t)), `tags ${(d.tags || []).filter((t) => !ALLOWED_TAGS.includes(t))}`);
  need(Array.isArray(d.bestMonths) && d.bestMonths.length && d.bestMonths.every((m) => Number.isInteger(m) && m >= 1 && m <= 12), 'bestMonths');
  need(typeof d.flightHours === 'number' && d.flightHours >= 0 && d.flightHours < 30, 'flightHours');
  need(typeof d.direct === 'boolean', 'direct');
  need([1, 2, 3, 4].includes(d.budgetLevel), 'budgetLevel');
  need(d.dailyBudgetIls && d.dailyBudgetIls.low > 0 && d.dailyBudgetIls.low < d.dailyBudgetIls.mid && d.dailyBudgetIls.mid < d.dailyBudgetIls.high, 'dailyBudgetIls');
  need(text(d.summary), 'summary');
  need(Array.isArray(d.highlights) && d.highlights.length >= 5 && d.highlights.length <= 8 && d.highlights.every(text), 'highlights 5-8');
  need(Array.isArray(d.areas) && d.areas.length >= 2 && d.areas.every((a) => text(a.name) && text(a.forWhom)), 'areas');
  need(Array.isArray(d.attractions) && d.attractions.length >= 8 && d.attractions.length <= 15 && d.attractions.every((a) => text(a.name) && ATTRACTION_KINDS.includes(a.kind) && a.durationH > 0 && Array.isArray(a.tags)), 'attractions 8-15');
  need(Array.isArray(d.dayTrips) && d.dayTrips.every((a) => text(a.name) && a.hours > 0 && text(a.note)), 'dayTrips');
  need(d.transport && typeof d.transport.carRecommended === 'boolean' && text(d.transport.note), 'transport');
  const pr = d.practical || {};
  need(/^[A-Z]{3}$/.test(pr.currency || '') && text(pr.language) && /^[A-Za-z_]+\/[A-Za-z_]+/.test(pr.timeZone || '') && text(pr.visaNoteForIsraelis) && text(pr.kosher) && text(pr.shabbat), 'practical');
  need(text(d.seasonsNote), 'seasonsNote');
  need(!d.advisory || text(d.advisory), 'advisory');
  need(d.hotelCity === undefined || /^[A-Z]{3}$/.test(d.hotelCity), 'hotelCity');
  const att = d.attractions || [], trips = d.dayTrips || [];
  const okMonths = (m) => m === undefined || (Array.isArray(m) && m.length && m.length === new Set(m).size && m.every((x) => Number.isInteger(x) && x >= 1 && x <= 12));
  need(att.every((a) => a.area === undefined || (typeof a.area === 'string' && a.area.trim() && a.area.length <= 60)), 'attraction area');
  need(att.every((a) => (a.tags || []).every((t) => ATTRACTION_TAGS.includes(t))), `attraction tags ${att.flatMap((a) => a.tags || []).filter((t) => !ATTRACTION_TAGS.includes(t))}`);
  need(att.every((a) => a.mustSee === undefined || a.mustSee === true) && att.filter((a) => a.mustSee).length <= 4, 'attraction mustSee (true, at most 4)');
  need(att.every((a) => okMonths(a.months)) && trips.every((t) => okMonths(t.months)), 'months');
  need(trips.every((t) => t.priceIls === undefined || (t.priceIls.low > 0 && t.priceIls.high >= t.priceIls.low)), 'dayTrip priceIls');
  need(trips.every((t) => t.kind === undefined || ATTRACTION_KINDS.includes(t.kind)), 'dayTrip kind');
  return problems;
}
