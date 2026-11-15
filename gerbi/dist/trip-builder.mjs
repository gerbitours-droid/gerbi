// Magic trip builder (spec 24): free text → a validated trip request → a package skeleton (destination, dates,
// flight/hotel search specs, car advice, day-by-day itinerary, practical card). Deterministic and catalog-grounded:
// no prices are produced here (live prices come from the supplier, estimates from trip-package.mjs).
import { understandRequest } from './brief-engine.mjs';
import { detectLegs } from './multi-city-brief.mjs';
import { destinations, byId, byCode, rank, normalize, monthName } from './catalog.mjs';
import { placeByCode, placeType } from './places.mjs';
import { t } from './i18n.mjs';
import { mapsUrl } from './trip-package.mjs';

export const L = (v, l = 'he') => (v && typeof v === 'object' && !Array.isArray(v) ? v[l] || v.he || v.en || '' : v ?? '');
const pad = (n) => String(n).padStart(2, '0');
export const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
export const weekday = (iso) => new Date(iso + 'T12:00:00Z').getUTCDay(); // 0 Sunday … 6 Saturday
const daysBetween = (a, b) => Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86400000);
const HE_MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
const EN_MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const monthIndex = (m) => (Number.isInteger(m) ? m : HE_MONTHS.indexOf(m) + 1 || EN_MONTHS.indexOf(String(m || '').toLowerCase()) + 1 || 0);

// Airport codes whose hotels are listed under the city code (catalog `hotelCity` wins when set).
const HOTEL_CITY = { FCO: 'ROM', CIA: 'ROM', CDG: 'PAR', ORY: 'PAR', LHR: 'LON', LGW: 'LON', STN: 'LON', LTN: 'LON', JFK: 'NYC', EWR: 'NYC', MXP: 'MIL', LIN: 'MIL', BGY: 'MIL', SAW: 'IST', VIE: 'VIE', BER: 'BER' };
export const hotelCityOf = (d) => d?.hotelCity || HOTEL_CITY[d?.code] || d?.code || '';

// ---- 1. Understanding: the shared brief engine + what only a whole-trip request needs.
const RX = {
  allInclusive: /הכו?ל כלול|all[- ]?inclusive/i,
  halfBoard: /חצי פנסיון|half[- ]board/i, fullBoard: /פנסיון מלא|full[- ]board/i, breakfast: /(?:עם|כולל|רק)\s+ארוחת בוקר|bed (?:and|&) breakfast|\bb&b\b|with breakfast/i,
  carYes: /(?:עם|כולל|נשכור|לשכור|שוכרים|השכרת|ונשכור|וגם)\s*(?:ה)?רכב|רכב שכור|רכב צמוד|\b(?:rent(?:al|ing)?\s+(?:a\s+)?car|car\s+(?:hire|rental)|with\s+a\s+car|road\s?trip)\b/i,
  carNo: /(?:בלי|ללא|לא צריך|לא צריכים|לא רוצים)\s*(?:ה)?רכב|\b(?:no|without a|don'?t need a)\s+car\b/i,
  ski: /סקי|סנובורד|\bski(?:ing)?\b|snowboard/i, nature: /טבע|הרים|מפלים|נופים|\bnature\b|hiking|mountains|waterfalls/i,
  nightlife: /חיי לילה|מסיבות|ברים|nightlife|clubs|\bbars\b|\bparty\b/i, friends: /חברים|חברות|\bfriends\b|\bmates\b/i,
  honeymoon: /ירח דבש|honeymoon/i, luxury: /יוקרה|יוקרתי|פינוק|\bluxury\b|luxurious/i,
  food: /אוכל|קולינרי|יין|\bfood\b|culinary|\bwine\b/i, culture: /תרבות|היסטוריה|מוזיאונים|culture|history|museums/i, shopping: /קניות|shopping/i,
  stars: /(\d)\s*(?:כוכבים|★)|\b(\d)[- ]?stars?\b|(חמישה|ארבעה|שלושה) כוכבים/i,
  suggest: /תציעו|תמליצו|לא יודעים לאן|לא בטוחים לאן|הפתיעו|תפתיעו|לאן כדאי|איפה כדאי|surprise|suggest|recommend|anywhere|not sure where|don'?t know where/i,
  alternatives: /\s(?:או|or)\s/i
};
const WORD_STARS = { חמישה: 5, ארבעה: 4, שלושה: 3 };

// Destinations named in the text (catalog names in Hebrew/English, with Hebrew prefixes) and countries named.
function namedInText(text) {
  const n = ` ${normalize(text)} `, found = [], countries = new Set();
  const has = (name) => { const v = normalize(name); return v.length >= 3 && new RegExp(`(?:^|\\s)[בלהומש]?${v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=\\s|$)`).test(n); };
  for (const d of destinations) {
    const names = [d.name?.he, d.name?.en].filter(Boolean);
    const at = names.map((x) => n.indexOf(normalize(x))).filter((i) => i >= 0);
    if (names.some(has)) found.push({ d, at: Math.min(...at, 1e6) });
    if ([d.country?.he, d.country?.en].filter(Boolean).some(has)) countries.add(d.country.en);
  }
  return { found: found.sort((a, b) => a.at - b.at).map((x) => x.d), countries: [...countries] };
}

// text + quick chips (already appended to the text by the page) → the trip request.
export function parseTrip(text, { today = new Date().toISOString().slice(0, 10), lang = 'he', destId = '' } = {}) {
  const raw = String(text || '').slice(0, 1500), u = understandRequest(raw, {}, { today, lang }), b = u.brief, has = (rx) => rx.test(raw);
  const styles = ['beach', 'city', 'relaxation', 'family', 'couple'].filter((k) => b[k] === true);
  for (const k of ['ski', 'nature', 'nightlife', 'food', 'culture', 'shopping', 'luxury']) if (has(RX[k]) && !styles.includes(k)) styles.push(k);
  const friends = has(RX.friends), honeymoon = has(RX.honeymoon);
  const occasion = honeymoon ? 'honeymoon' : friends ? 'friends' : (b.children || 0) > 0 ? 'family' : b.couple ? 'couple' : (b.adults === 1 ? 'solo' : '');
  const starsMatch = RX.stars.exec(raw), stars = starsMatch ? Number(starsMatch[1] || starsMatch[2]) || WORD_STARS[starsMatch[3]] : 0;
  const allInclusive = has(RX.allInclusive);
  const board = allInclusive ? 'AI' : has(RX.fullBoard) ? 'FB' : has(RX.halfBoard) ? 'HB' : has(RX.breakfast) ? 'BB' : '';
  const car = has(RX.carNo) ? 'no' : has(RX.carYes) ? 'yes' : 'auto';
  const luxury = styles.includes('luxury') || honeymoon && stars >= 5;
  const named = namedInText(raw), fromCodes = (b.want || []).map((c) => byCode(c)).filter(Boolean);
  const excluded = new Set((b.exclude || []).map((c) => byCode(c)?.id).filter(Boolean));
  let wanted = [...new Map([...named.found, ...fromCodes].map((d) => [d.id, d])).values()].filter((d) => !excluded.has(d.id));
  const forced = byId(destId);
  if (forced) wanted = [forced, ...wanted.filter((d) => d.id !== forced.id)];
  const legs = detectLegs(raw, { today, origin: b.origin || 'TLV' })?.legs || null;
  const alternatives = wanted.length > 1 && has(RX.alternatives) && !legs;
  const extra = [];
  const say = (field, key, vars) => extra.push({ field, label: t(`build.understood.${key}`, vars, lang) });
  if (board) say('board', `board.${board}`);
  if (car !== 'auto') say('car', `car.${car}`);
  if (stars) say('stars', 'stars', { stars });
  if (honeymoon) say('occasion', 'honeymoon'); else if (friends) say('occasion', 'friends');
  for (const k of ['ski', 'nature', 'nightlife']) if (styles.includes(k)) say('style', `style.${k}`);
  const request = {
    text: raw, lang, origin: placeByCode(b.origin)?.code || 'TLV', adults: b.adults || 2, children: b.children || 0, childAges: (b.childAges || []).filter((a) => Number.isInteger(a) && a >= 0 && a < 18).slice(0, 8),
    infants: b.infants || 0, nights: b.nights || 0, start: b.start || '', end: b.end || '', month: monthIndex(b.month), styles, occasion,
    budget: Number.isFinite(b.budget) ? b.budget : null, budgetLevel: luxury ? 'high' : b.cheaper ? 'low' : 'mid',
    needs: { car, allInclusive, board, minStars: stars || (luxury ? 5 : 0), kosher: b.kosher === true, shabbat: b.shabbat === true, accessible: b.accessible === true, direct: b.stops === '0' },
    destinations: alternatives ? [] : wanted.map((d) => d.id).slice(0, 4), shortlist: alternatives ? wanted.map((d) => d.id) : [], countries: named.countries, exclude: [...excluded],
    legs, suggest: !wanted.length || has(RX.suggest) && !forced,
    understood: [...u.understood.filter((x) => !['want', 'exclude'].includes(x.field)).map(({ field, label }) => ({ field, label })), ...extra],
    questions: u.questions.filter((q) => !['destination', 'budget', 'budget-currency', 'nights', 'ages', 'children'].includes(q.id)).map((q) => q.question).slice(0, 2),
    coverage: u.coverage
  };
  if (request.children && request.childAges.length < request.children) request.questions.unshift(t('build.q.ages', {}, lang));
  request.questions = request.questions.slice(0, 2);
  return request;
}

// Inline edits from the page ("הבנו / הנחנו" rows): each field re-validated; anything else is ignored.
export function applyEdits(request, e = {}, today = new Date().toISOString().slice(0, 10)) {
  if (!e || typeof e !== 'object') return request;
  const r = { ...request, needs: { ...request.needs }, childAges: [...request.childAges] };
  const int = (v, min, max) => (Number.isInteger(v) && v >= min && v <= max ? v : null);
  if (int(e.adults, 1, 9) !== null) r.adults = e.adults;
  if (int(e.children, 0, 8) !== null) { r.children = Math.min(e.children, 9 - r.adults); r.childAges = r.childAges.slice(0, r.children); }
  if (Array.isArray(e.childAges)) r.childAges = e.childAges.filter((a) => int(a, 0, 17) !== null).slice(0, r.children);
  if (int(e.nights, 1, 30) !== null) { r.nights = e.nights; r.end = ''; }
  if (typeof e.start === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(e.start) && e.start >= today) { r.start = e.start; r.end = ''; r.nights = r.nights || 5; }
  if (['yes', 'no', 'auto'].includes(e.car)) r.needs.car = e.car;
  if (typeof e.allInclusive === 'boolean') { r.needs.allInclusive = e.allInclusive; r.needs.board = e.allInclusive ? 'AI' : r.needs.board === 'AI' ? '' : r.needs.board; }
  if (int(e.minStars, 0, 5) !== null) r.needs.minStars = e.minStars;
  for (const k of ['kosher', 'shabbat']) if (typeof e[k] === 'boolean') r.needs[k] = e[k];
  return r;
}

// ---- 2. Destination choice: the catalog's own ranking, with the request's styles and filters.
export function suggestDestinations(request, { limit = 3, today = new Date().toISOString().slice(0, 10) } = {}) {
  const prefs = { want: [], exclude: request.exclude.map((id) => byId(id)?.code).filter(Boolean), month: request.month || (request.start ? Number(request.start.slice(5, 7)) : 0),
    children: request.children, kosher: request.needs.kosher, direct: request.needs.direct || undefined, cheaper: request.budgetLevel === 'low', short: request.nights > 0 && request.nights <= 3 };
  for (const s of request.styles) prefs[s] = true;
  if (request.occasion === 'honeymoon') prefs.couple = true;
  if (request.needs.allInclusive) prefs.tags = ['all_inclusive'];
  let ranked = rank(prefs).filter((x) => !x.destination.advisory);
  const pool = request.shortlist.length ? request.shortlist : null;
  if (pool) ranked = ranked.filter((x) => pool.includes(x.destination.id));
  else if (request.countries.length) { const inCountry = ranked.filter((x) => request.countries.includes(x.destination.country.en)); if (inCountry.length) ranked = inCountry; }
  if (request.children > 0) ranked = ranked.filter((x) => x.destination.flightHours <= 6 || ranked.length <= limit);
  return ranked.slice(0, limit).map(({ destination: d, score, reasons }) => ({ id: d.id, name: d.name, country: d.country, image: imageOf(d), score,
    reasons: reasons.slice(0, 3).map((r) => L(r, request.lang)), flightHours: d.flightHours, direct: d.direct, budgetLevel: d.budgetLevel }));
}
export const imageOf = (d) => (d?.image?.thumb ? d.image.thumb : d?.trip ? `/assets/${d.trip}.jpg` : '');

// ---- 3. Dates: what was said, else the month (first Sunday on/after the 10th), else the next good month.
export function planDates(request, dest, today) {
  const assumed = [];
  const defNights = request.nights || (request.styles.includes('ski') ? 6 : request.children ? 6 : request.occasion === 'friends' ? 3 : 5);
  if (!request.nights) assumed.push({ key: 'nights', nights: defNights });
  let start = request.start, nights = defNights;
  if (start && request.end && request.end > start) nights = daysBetween(start, request.end);
  const earliest = addDays(today, 14);
  if (!start) {
    let month = request.month;
    if (!month) {
      const best = (dest?.bestMonths || []).length ? dest.bestMonths : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      const soon = addDays(today, 21);
      month = [...best].sort((a, b) => ((a - Number(soon.slice(5, 7)) + 12) % 12) - ((b - Number(soon.slice(5, 7)) + 12) % 12))[0];
      assumed.push({ key: 'month', month });
    } else assumed.push({ key: 'dates', month });
    let year = Number(today.slice(0, 4));
    if (`${year}-${pad(month)}-28` < earliest) year++;
    start = `${year}-${pad(month)}-10`;
    while (weekday(start) !== 0) start = addDays(start, 1);
    if (start < earliest) { start = earliest; while (weekday(start) !== 0) start = addDays(start, 1); }
  }
  if (start < today) start = earliest;
  return { start, end: addDays(start, nights), nights, assumed, datesAssumed: !request.start };
}

// ---- 4. Itinerary: catalog attractions grouped by area/kind, paced for the travellers, Shabbat-aware.
const PREFER = { family: ['family'], couple: ['couple', 'food'], beach: ['beach'], city: ['culture', 'food', 'shopping'], culture: ['culture'], food: ['food'], nature: ['nature', 'adventure'], nightlife: ['nightlife'], relaxation: ['beach'], ski: ['ski', 'nature', 'adventure'], shopping: ['shopping'] };
const KIND_FOR = { beach: ['beach'], nature: ['nature', 'park', 'viewpoint'], city: ['landmark', 'museum', 'neighborhood', 'market'], culture: ['landmark', 'museum', 'religious'], food: ['market'], family: ['park', 'beach', 'experience'] };
export function pace(request) {
  const young = request.childAges.some((a) => a < 6) || request.infants > 0;
  const hours = young ? 5 : request.children ? 6 : request.styles.includes('relaxation') ? 5 : 8;
  return { hours, items: request.children || young ? 2 : 3 };
}
function scoreAttraction(a, request) {
  let s = 0;
  const want = new Set([...request.styles.flatMap((x) => PREFER[x] || []), ...(request.children ? ['family'] : []), ...(request.occasion === 'honeymoon' ? ['couple'] : [])]);
  for (const tag of a.tags || []) if (want.has(tag)) s += 2;
  for (const st of request.styles) if ((KIND_FOR[st] || []).includes(a.kind)) s += 1;
  if (request.children && (a.durationH || 0) > 4) s -= 1;
  return s;
}
const usable = (a, request) => !(request.children && (a.tags || []).some((x) => ['nightlife', 'adults_only'].includes(x)));

function stopDays(dest, request, { start, nights, first, last, stopIndex, l }) {
  const where = L(dest.name, l), p = pace(request), out = [];
  const item = (a) => ({ name: L(a.name, l), kind: a.kind, durationH: a.durationH, area: a.area || '', where, mapsUrl: mapsUrl(L(a.name, l), where) });
  const pool = (dest.attractions || []).filter((a) => usable(a, request)).map((a, i) => ({ a, s: scoreAttraction(a, request) - i * 0.01 })).sort((x, y) => y.s - x.s).map((x) => x.a);
  const total = nights + (last ? 1 : 0);
  const kinds = Array.from({ length: total }, (_, i) => (i === 0 && first ? 'arrival' : i === 0 ? 'move' : last && i === total - 1 ? 'departure' : 'full'));
  const dates = kinds.map((_, i) => addDays(start, i));
  if (request.needs.shabbat) dates.forEach((d, i) => { if (weekday(d) === 6 && kinds[i] === 'full') kinds[i] = 'shabbat'; });
  const full = kinds.map((k, i) => (k === 'full' ? i : -1)).filter((i) => i >= 0);
  if (nights >= 5 && dest.dayTrips?.length && full.length >= 3) kinds[full[Math.floor(full.length / 2)]] = 'daytrip';
  const restWanted = nights >= 6 && (request.children || request.styles.includes('relaxation') || request.styles.includes('beach'));
  const fullLeft = kinds.map((k, i) => (k === 'full' ? i : -1)).filter((i) => i >= 0);
  if (restWanted && fullLeft.length >= 3) kinds[fullLeft.at(-1)] = 'rest';
  const used = new Set();
  let trip = 0;
  kinds.forEach((kind, i) => {
    const day = { kind, date: dates[i], stop: stopIndex, items: [], note: '' };
    if (kind === 'arrival' || kind === 'move') {
      const light = pool.find((a) => !used.has(a) && a.durationH <= 2 && ['neighborhood', 'viewpoint', 'market', 'park'].includes(a.kind));
      if (light) { used.add(light); day.items.push(item(light)); }
    } else if (kind === 'full') {
      const seed = pool.find((a) => !used.has(a));
      if (seed) {
        used.add(seed); day.items.push(item(seed)); let hours = seed.durationH || 2;
        const near = pool.filter((a) => !used.has(a)).sort((x, y) => Number(Boolean(y.area && y.area === seed.area)) * 2 + Number(y.kind === seed.kind) - (Number(Boolean(x.area && x.area === seed.area)) * 2 + Number(x.kind === seed.kind)));
        for (const a of near) { if (day.items.length >= p.items) break; if (hours + (a.durationH || 2) > p.hours) continue; used.add(a); day.items.push(item(a)); hours += a.durationH || 2; }
      }
    } else if (kind === 'daytrip') {
      const dt = dest.dayTrips[trip++ % dest.dayTrips.length];
      day.items.push({ name: L(dt.name, l), kind: 'daytrip', durationH: Math.max(4, (dt.hours || 1) * 2 + 4), where, mapsUrl: mapsUrl(L(dt.name, l), where) });
      day.note = L(dt.note, l);
    }
    out.push(day);
  });
  return { days: out, spare: pool.filter((a) => !used.has(a)).map(item) };
}

export function dayTitle(day, l = 'he', stopName = '') {
  if (['arrival', 'departure', 'rest', 'shabbat', 'move'].includes(day.kind)) return t(`build.day.${day.kind}`, { place: stopName }, l);
  if (day.kind === 'daytrip') return t('build.day.daytrip', { place: day.items[0]?.name || '' }, l);
  return day.items.slice(0, 2).map((x) => x.name).join(' · ') || t('build.day.free', {}, l);
}

export function buildItinerary(stops, request, l = 'he') {
  const days = [], spare = [];
  stops.forEach((s, i) => {
    const part = stopDays(s.dest, request, { start: s.start, nights: s.nights, first: i === 0, last: i === stops.length - 1, stopIndex: i, l });
    days.push(...part.days); spare.push(...part.spare.slice(0, 6));
  });
  return { days: days.map((d, i) => ({ ...d, day: i + 1, title: dayTitle(d, l, L(stops[d.stop]?.dest.name, l)),
    note: d.note || (d.kind === 'shabbat' ? t('build.note.shabbat', {}, l) : request.needs.shabbat && weekday(d.date) === 5 && d.kind === 'full' ? t('build.note.friday', {}, l) : request.needs.shabbat && weekday(d.date) === 6 ? t('build.note.travelShabbat', {}, l) : '') })), spare };
}

// ---- 5. Car, practical card, search specs.
export function carAdvice(dest, request, l = 'he') {
  const advice = dest?.transport?.carRecommended ? 'recommended' : request.styles.includes('ski') || request.styles.includes('nature') ? 'optional' : 'not_needed';
  const include = request.needs.car === 'yes' || (request.needs.car === 'auto' && advice === 'recommended');
  return { advice, include, note: L(dest?.transport?.note, l), driverAgeNote: t('build.car.age', {}, l) };
}
export function practicalOf(dest, request, l = 'he') {
  const p = dest?.practical || {};
  return { visa: L(p.visaNoteForIsraelis, l), currency: p.currency || '', language: L(p.language, l), timeZone: p.timeZone || '', kosher: L(p.kosher, l), shabbat: L(p.shabbat, l),
    season: L(dest?.seasonsNote, l), transport: L(dest?.transport?.note, l), check: t('build.practical.check', {}, l), months: (dest?.bestMonths || []).map((m) => monthName(m, l)).join(', '),
    flags: { kosher: request.needs.kosher, shabbat: request.needs.shabbat } };
}

// Passengers by age: under 2 → infant (on a lap, at most one per adult), 2–11 → child, 12+ → adult.
export function passengers(request) {
  let adt = request.adults, chd = 0, inf = request.infants || 0;
  const ages = request.childAges.length === request.children ? request.childAges : [];
  if (ages.length) for (const a of ages) { if (a < 2) inf++; else if (a < 12) chd++; else adt++; } else chd = request.children;
  if (inf > adt) { chd += inf - adt; inf = adt; }
  return [{ ptc: 'ADT', count: Math.min(9, adt) }, ...(chd ? [{ ptc: 'CHD', count: chd }] : []), ...(inf ? [{ ptc: 'INF', count: inf }] : [])];
}
export function flightSearchOf(request, stops) {
  const codes = [request.origin, ...stops.map((s) => s.dest.code), request.origin];
  const legs = codes.slice(0, -1).map((from, i) => ({ origin: { code: from, type: placeType(from) }, destination: { code: codes[i + 1], type: placeType(codes[i + 1]) }, date: i === 0 ? stops[0].start : stops[i - 1].end }));
  return { originDestinations: legs, passengers: { ptcList: passengers(request) }, sellingChannel: 'B2B', language: 'en_GB', timeout: 10 };
}
// Hotel rooms: two adults per room, children spread (at most 2 per room); unknown ages search as 8 (stated).
export function roomsOf(request) {
  const ages = [...request.childAges]; while (ages.length < request.children) ages.push(8);
  const count = Math.max(1, Math.ceil(request.adults / 2), Math.ceil(ages.length / 2), Math.ceil((request.adults + ages.length) / 4));
  const rooms = Array.from({ length: Math.min(count, 4) }, () => ({ adults: 0, childrenAges: [] }));
  for (let i = 0; i < request.adults; i++) rooms[i % rooms.length].adults++;
  ages.forEach((a, i) => rooms[i % rooms.length].childrenAges.push(a));
  return rooms.filter((r) => r.adults > 0);
}
export function hotelSearchOf(request, stop, area) {
  return { destinationId: stop.dest.id, city: hotelCityOf(stop.dest), checkIn: stop.start, checkOut: stop.end, rooms: roomsOf(request), board: request.needs.board || '',
    minStars: request.needs.minStars || (request.occasion === 'honeymoon' ? 4 : request.children || request.budgetLevel !== 'low' ? 4 : 3), family: request.children > 0, area: area ? L(area.name, 'en') : '' };
}
// The area the catalog recommends for these travellers: matched on its "for whom" text.
export function areaFor(dest, request) {
  const areas = dest?.areas || [];
  const words = request.children ? ['famil', 'משפח', 'kids', 'ילד'] : request.occasion === 'honeymoon' || request.occasion === 'couple' ? ['couple', 'זוג', 'romant'] : request.occasion === 'friends' ? ['nightlife', 'לילה', 'young', 'צעיר'] : request.budgetLevel === 'low' ? ['cheap', 'value', 'budget', 'זול', 'משתלם', 'lower price'] : ['first', 'central', 'מרכז', 'ראשונ'];
  return areas.find((a) => words.some((w) => normalize(L(a.forWhom, 'en') + ' ' + L(a.forWhom, 'he')).includes(w))) || areas[0] || null;
}

// ---- 6. The whole skeleton.
export function planPackage(request, { today = new Date().toISOString().slice(0, 10), chosenId = '', nights: override = 0 } = {}) {
  const l = request.lang;
  if (override) request = { ...request, nights: override, end: '' };
  const suggestions = request.destinations.length && !request.suggest ? [] : suggestDestinations(request, { today });
  let ids = chosenId && byId(chosenId) ? [chosenId] : request.destinations.length ? request.destinations : suggestions.slice(0, 1).map((s) => s.id);
  if (chosenId && request.destinations.length > 1 && request.destinations.includes(chosenId)) ids = request.destinations;
  const dests = ids.map(byId).filter(Boolean);
  if (!dests.length) return { request, suggestions, destination: null, stops: [], assumed: [] };
  const dates = planDates(request, dests[0], today);
  const r = { ...request, start: dates.start, end: dates.end, nights: dates.nights, datesAssumed: dates.datesAssumed };
  // Multi-city: the route's own dates when the text gave them, else the nights split evenly (first stops get the extra).
  let stops;
  const legDates = request.legs && request.legs.length === dests.length + 1 ? request.legs.map((x) => x.date) : null;
  if (legDates) { r.start = legDates[0]; r.end = legDates.at(-1); r.nights = daysBetween(r.start, r.end); stops = dests.map((d, i) => ({ dest: d, start: legDates[i], end: legDates[i + 1], nights: daysBetween(legDates[i], legDates[i + 1]) })); }
  else {
    let cursor = r.start;
    stops = dests.map((d, i) => { const n = Math.floor(r.nights / dests.length) + (i < r.nights % dests.length ? 1 : 0); const s = { dest: d, start: cursor, end: addDays(cursor, Math.max(1, n)), nights: Math.max(1, n) }; cursor = s.end; return s; });
    r.end = stops.at(-1).end; r.nights = daysBetween(r.start, r.end);
  }
  const it = buildItinerary(stops, r, l), main = dests[0];
  const assumed = dates.assumed.map((a) => t(`build.assumed.${a.key}`, { nights: a.nights, month: monthName(a.month, l) }, l));
  if (!request.understood.some((x) => x.field === 'adults')) assumed.unshift(t('build.assumed.adults', {}, l));
  if (request.children > request.childAges.length) assumed.push(t('build.assumed.ages', {}, l));
  const stopView = (s) => ({ id: s.dest.id, code: s.dest.code, name: s.dest.name, country: s.dest.country, nights: s.nights, start: s.start, end: s.end, dailyBudgetIls: s.dest.dailyBudgetIls, image: imageOf(s.dest), summary: s.dest.summary });
  const areas = stops.map((s) => areaFor(s.dest, r));
  return {
    request: r, suggestions, assumed,
    destination: stopView(stops[0]), stops: stops.length > 1 ? stops.map(stopView) : [],
    areas: stops.map((s) => (s.dest.areas || []).map((a) => ({ name: a.name, forWhom: a.forWhom }))),
    flightSearch: flightSearchOf(r, stops), hotelSearches: stops.map((s, i) => hotelSearchOf(r, s, areas[i])),
    hotelAreas: areas.map((a) => (a ? { name: a.name, forWhom: a.forWhom } : null)),
    car: carAdvice(main, r, l), itinerary: it.days, spare: it.spare, practical: practicalOf(main, r, l),
    highlights: (main.highlights || []).slice(0, 4).map((h) => L(h, l))
  };
}
