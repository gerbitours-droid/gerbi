// Magic trip builder (spec 24): free text → a validated trip request → a package skeleton (destination, dates,
// flight/hotel search specs, car advice, day-by-day itinerary, practical card). Deterministic and catalog-grounded:
// no prices are produced here (live prices come from the supplier, estimates from trip-package.mjs).
import { understandRequest } from './brief-engine.mjs';
import { detectLegs } from './multi-city-brief.mjs';
import { destinations, byId, byCode, rank, normalize, monthName, nameVariants, skiSeason } from './catalog.mjs';
import { placeByCode, placeType } from './places.mjs';
import { t } from './i18n.mjs';
import { mapsUrl } from './trip-package.mjs';
import { estimateTrip, fitTrip, floorConfig } from './budget.mjs';

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
    const names = nameVariants(d); // with and without the leading article ("The Swiss Alps" ↔ "Swiss Alps")
    const at = names.map((x) => n.indexOf(x)).filter((i) => i >= 0);
    if (names.some(has)) found.push({ d, at: Math.min(...at, 1e6) });
    if ([d.country?.he, d.country?.en].filter(Boolean).some(has)) countries.add(d.country.en);
  }
  return { found: found.sort((a, b) => a.at - b.at).map((x) => x.d), countries: [...countries] };
}

// text + quick chips (already appended to the text by the page) → the trip request.
export function parseTrip(text, { today = new Date().toISOString().slice(0, 10), lang = 'he', destId = '', fx = null } = {}) {
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
  // A country alone ("שבוע ביוון") is a choice between its destinations (ranked below), not a route through all of them.
  const named = namedInText(raw), fromCodes = u.countryOnly ? [] : (b.want || []).map((c) => byCode(c)).filter(Boolean);
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
  // Budget (spec 28 §א): a cap for everyone in shekels. "$3000" / "€2500" convert at today's rate (the site's /api/fx);
  // with no rate the amount is unknown and the visitor is asked for it in shekels.
  const foreign = b.budgetForeign, rate = foreign ? fx?.rates?.[foreign.currency] : null;
  const budget = Number.isFinite(b.budget) ? b.budget : rate ? Math.floor(foreign.amount * rate / 10) * 10 : null;
  if (foreign && rate) say('budget', 'budgetFx', { amount: `₪${new Intl.NumberFormat('en-US').format(budget)}` });
  const request = {
    text: raw, lang, origin: placeByCode(b.origin)?.code || 'TLV', adults: b.adults || 2, children: b.children || 0, childAges: (b.childAges || []).filter((a) => Number.isInteger(a) && a >= 0 && a < 18).slice(0, 8),
    infants: b.infants || 0, nights: b.nights || 0, start: b.start || '', end: b.end || '', month: monthIndex(b.month), styles, occasion,
    budget, budgetLevel: luxury ? 'high' : b.cheaper ? 'low' : 'mid',
    needs: { car, allInclusive, board, minStars: stars || (luxury ? 5 : 0), kosher: b.kosher === true, shabbat: b.shabbat === true, accessible: b.accessible === true, direct: b.stops === '0' },
    asked: { stars: stars > 0 },
    destinations: alternatives ? [] : wanted.map((d) => d.id).slice(0, 4), shortlist: alternatives ? wanted.map((d) => d.id) : [], countries: named.countries, exclude: [...excluded],
    legs, suggest: !wanted.length || has(RX.suggest) && !forced,
    understood: [...u.understood.filter((x) => !['want', 'exclude'].includes(x.field)).map(({ field, label }) => ({ field, label })), ...extra],
    questions: u.questions.filter((q) => !['destination', 'budget', 'nights', 'ages', 'children'].includes(q.id) && (q.id !== 'budget-currency' || !budget)).map((q) => q.question).slice(0, 2),
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
  // A star level chosen in the form (a change, not the value it was showing) is a hard constraint for the budget fit.
  if (int(e.minStars, 0, 5) !== null) { if (e.minStars !== request.needs.minStars) r.asked = { ...request.asked, stars: e.minStars > 0 }; r.needs.minStars = e.minStars; }
  // Budget (spec 28): the "raise the budget" button and the ₪500 upgrades re-plan with a new cap; 0 clears it.
  if (int(e.budget, 0, 5_000_000) !== null) r.budget = e.budget || null;
  for (const k of ['kosher', 'shabbat']) if (typeof e[k] === 'boolean') r.needs[k] = e[k];
  return r;
}

// ---- 2. Destination choice: the catalog's own ranking, with the request's styles and filters.
export function suggestDestinations(request, { limit = 3, today = new Date().toISOString().slice(0, 10) } = {}) {
  const prefs = { want: [], exclude: request.exclude.map((id) => byId(id)?.code).filter(Boolean), month: request.month || (request.start ? Number(request.start.slice(5, 7)) : 0),
    children: request.children, kosher: request.needs.kosher, direct: request.needs.direct || undefined, cheaper: request.budgetLevel === 'low', short: request.nights > 0 && request.nights <= 3, nights: request.nights || 0 };
  for (const s of request.styles) prefs[s] = true;
  if (request.occasion === 'honeymoon') prefs.couple = true;
  if (request.needs.allInclusive) prefs.tags = ['all_inclusive'];
  // Destinations under a travel advisory stay in the list (shown with their note) but never lead it.
  let ranked = rank(prefs).sort((a, b) => Boolean(a.destination.advisory) - Boolean(b.destination.advisory));
  const pool = request.shortlist.length ? request.shortlist : null;
  if (pool) ranked = ranked.filter((x) => pool.includes(x.destination.id));
  else if (request.countries.length) { const inCountry = ranked.filter((x) => request.countries.includes(x.destination.country.en)); if (inCountry.length) ranked = inCountry; }
  if (request.children > 0) ranked = ranked.filter((x) => x.destination.flightHours <= 6 || ranked.length <= limit);
  // The AI partner's ideas (when the rules understood little) lead the list; they never hide the catalog's ranking.
  if (request.boost?.length) ranked = [...ranked.filter((x) => request.boost.includes(x.destination.id)), ...ranked.filter((x) => !request.boost.includes(x.destination.id))];
  // Budget (spec 28 §א.2): a destination whose LOW end – with everything the plan may give up given up – is above the
  // cap is not offered; the ones whose HIGH end fits lead; "cheap" orders the best-matching ones by estimated cost.
  const cost = new Map();
  if (request.budget > 0) {
    for (const x of ranked.slice(0, 40)) { const d = x.destination, stops = [{ dest: d, nights: planDates(request, d, today).nights }]; cost.set(d.id, estimateTrip(stops, request, floorConfig(request, baseConfigOf(request, d)))); }
    const known = ranked.filter((x) => cost.has(x.destination.id)), fitting = known.filter((x) => cost.get(x.destination.id).low <= request.budget);
    if (fitting.length) {
      const fits = (x) => cost.get(x.destination.id).high <= request.budget;
      ranked = [...fitting.filter(fits), ...fitting.filter((x) => !fits(x))];
      if (request.budgetLevel === 'low') ranked = [...ranked.slice(0, 8).sort((a, b) => cost.get(a.destination.id).high - cost.get(b.destination.id).high), ...ranked.slice(8)];
    } else ranked = known.sort((a, b) => cost.get(a.destination.id).low - cost.get(b.destination.id).low);
  }
  return ranked.slice(0, limit).map(({ destination: d, score, reasons }) => ({ id: d.id, name: d.name, country: d.country, image: imageOf(d), score,
    reasons: reasons.slice(0, 3).map((r) => L(r, request.lang)), flightHours: d.flightHours, direct: d.direct, budgetLevel: d.budgetLevel, advisory: L(d.advisory, request.lang),
    ...(cost.has(d.id) ? { estimate: { low: cost.get(d.id).low, high: cost.get(d.id).high }, fitsBudget: cost.get(d.id).high <= request.budget } : {}) }));
}
// The configuration a plan starts from before the budget fit: the hotel search's stars and meal plan, the car advice.
export const baseConfigOf = (request, dest) => ({ stars: defaultStars(request), board: request.needs.board || '', car: carAdvice(dest, request).include });
const defaultStars = (request) => request.needs.minStars || (request.occasion === 'honeymoon' ? 4 : request.children || request.budgetLevel !== 'low' ? 4 : 3);
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
  // Shabbat-observant travellers never fly on Saturday: dates we chose move forward a day (a Sunday start with 6 nights
  // would land home on Shabbat). Dates the visitor typed stay as typed; the itinerary flags the Saturday flight.
  if (request.needs?.shabbat && !request.start && (weekday(start) === 6 || weekday(addDays(start, nights)) === 6)) {
    while (weekday(start) === 6 || weekday(addDays(start, nights)) === 6) start = addDays(start, 1);
    assumed.push({ key: 'shabbat' });
  }
  return { start, end: addDays(start, nights), nights, assumed, datesAssumed: !request.start };
}

// ---- 4. Itinerary: catalog attractions scored for the request, paced for the travellers, one area per day,
// day trips every 3–4 nights, season-aware, Shabbat-aware; a declared free day (with ideas) when the list runs out.
// Optional catalog fields (spec 28 §ד): attraction `mustSee`, `months`, tags teens/evening/adults; day trip `months`,
// `mustSee`, `tags`. Everything works without them (must-sees then come from the destination's highlights).
const TAGS_FOR = {
  family: ['family', 'with_children', 'water_slides'], teens: ['teens', 'family', 'adventure', 'water_slides'],
  couple: ['couple', 'food'], honeymoon: ['couple', 'luxury', 'food'], luxury: ['luxury', 'couple', 'food'],
  friends: ['nightlife', 'evening', 'food', 'adventure'], solo: ['culture', 'food', 'adventure'],
  beach: ['beach', 'relaxation'], relaxation: ['relaxation', 'beach'], city: ['culture', 'food', 'shopping'], culture: ['culture'], food: ['food'],
  nature: ['nature', 'adventure'], nightlife: ['nightlife', 'evening', 'food'], ski: ['ski', 'adventure', 'nature'], shopping: ['shopping']
};
const KIND_FOR = { beach: ['beach'], nature: ['nature', 'park', 'viewpoint'], city: ['landmark', 'museum', 'neighborhood', 'market'], culture: ['landmark', 'museum', 'religious'], food: ['market'], family: ['park', 'beach', 'experience'], luxury: ['experience', 'viewpoint'] };
const KIDS_TAGS = ['with_children', 'water_slides'], ADULT_TAGS = ['nightlife', 'adults', 'adults_only'], HEAVY = ['museum', 'religious'], LIGHT = ['neighborhood', 'viewpoint', 'market', 'park'];
const LATE = (a) => (a.tags || []).some((x) => x === 'evening' || x === 'nightlife');
const dur = (a) => a.durationH || 2;

// toddlers (<4 or an infant) · kids (4–11, or ages unknown) · teens (all 12–17) · adults.
export function travellerProfile(request) {
  const ages = request.childAges || [];
  if ((request.infants || 0) > 0 || ages.some((a) => a < 4)) return 'toddlers';
  if (!request.children) return 'adults';
  return ages.length >= request.children && ages.every((a) => a >= 12) ? 'teens' : 'kids';
}
export function pace(request) {
  const profile = travellerProfile(request), young = profile === 'toddlers' || (profile === 'kids' && (request.childAges || []).some((a) => a < 6));
  const relax = profile === 'adults' && request.styles.includes('relaxation');
  const hours = young ? 5 : profile === 'kids' ? 7 : relax ? 5 : 8;
  return { hours, items: young ? 2 : 3, profile, young,
    // School-age kids may spend a whole day in a park made for them (theme/water parks); nobody else goes past the pace.
    kidDayH: profile === 'kids' && !young ? 10 : 0,
    dayTripH: ['adults', 'teens'].includes(profile) ? hours * 1.25 : hours };
}
const tagsOf = (keys, profile) => new Set(keys.flatMap((k) => (k === 'family' && profile === 'teens' ? TAGS_FOR.teens : TAGS_FOR[k] || [])));
// What the visitor asked for: the styles they named weigh more than what the group implies (occasion, children).
const wantTags = (request, profile) => tagsOf([...request.styles, request.occasion, ...(request.children ? ['family'] : [])], profile);
const styleTags = (request, profile) => tagsOf(request.styles, profile);

function scoreAttraction(a, request, want, asked) {
  const tags = a.tags || [], hits = tags.filter((x) => want.has(x)).length;
  let s = tags.some((x) => asked.has(x)) ? 3 : hits ? 2 : 0;
  if (hits > 1) s += Math.min(hits - 1, 2);
  if (request.styles.some((st) => (KIND_FOR[st] || []).includes(a.kind))) s += 1;
  if (request.children && dur(a) > 4) s -= 1;
  return s;
}
// Who may go: no nightlife/adults-only with children, no kids' parks for adults who did not ask, no long museum for
// young kids, nothing longer than the day's pace (the first item of a day included).
function suitable(a, request, p, want) {
  const tags = a.tags || [];
  if (request.children && tags.some((x) => ADULT_TAGS.includes(x))) return false;
  if (!request.children && tags.some((x) => KIDS_TAGS.includes(x)) && !tags.some((x) => KIDS_TAGS.includes(x) && want.has(x))) return false;
  if (p.young && a.kind === 'museum' && dur(a) >= 3) return false;
  return dur(a) <= p.hours || (p.kidDayH > 0 && dur(a) <= p.kidDayH && ['experience', 'park'].includes(a.kind) && tags.some((x) => ['family', ...KIDS_TAGS].includes(x)));
}
// The sea is cold Nov–Apr in Europe and the Middle East (unless the destination is a winter-sun one); ski has its own
// months by hemisphere; an attraction's own `months` win. Returns the warning key, '' when in season.
function offSeason(a, dest, month) {
  const tags = a.tags || [], beachy = a.kind === 'beach' || tags.includes('beach');
  // The specific reason wins over the generic one, so the customer reads "the sea is cold", not "seasonal".
  if (Array.isArray(a.months) && a.months.length) return a.months.includes(month) ? '' : beachy ? 'beach' : tags.includes('ski') ? 'ski' : 'season';
  if ((a.kind === 'beach' || tags.includes('beach')) && ['europe', 'middle-east'].includes(dest.region) && !(dest.bestMonths || []).some((m) => [12, 1, 2].includes(m)) && (month < 5 || month > 10)) return 'beach';
  if (tags.includes('ski') && !skiSeason(dest, month)) return 'ski';
  return '';
}
// Distinctive words of a name ("Phi Phi Islands & Maya Bay boat trip" → phi, maya): duplicates and must-sees.
const GENERIC = new Set('the and of de da di del la le el los las to at in on with from a an old new town city national park museum museums beach beaches market markets island islands tower palace street square church cathedral quarter district gardens garden view viewpoint views lake river bay hill hills mount mountain mountains day trip trips tour cruise walk walking centre center historic its world great grand royal house castle bridge harbour port night evening evenings best every sunset trail valley falls waterfall coast village villages boat'.split(' '));
const wordCache = new Map();
const words = (s) => { const k = String(s || ''); if (!wordCache.has(k)) wordCache.set(k, normalize(k).split(' ').filter((w) => w.length >= 4 && !GENERIC.has(w))); return wordCache.get(k); };
const overlaps = (x, y) => { const w = words(L(x, 'en')); return words(L(y, 'en')).some((v) => w.includes(v)) || (normalize(x?.he).length >= 3 && normalize(x?.he) === normalize(y?.he)); };
function mustSeeOf(dest) {
  const list = dest.attractions || [];
  if (list.some((a) => 'mustSee' in a)) return (a) => a.mustSee === true;
  const hl = (dest.highlights || []).map((h) => normalize(L(h, 'en'))).join(' | ');
  return (a) => words(L(a.name, 'en')).some((w) => hl.includes(w));
}
// A destination the size of a country or a region (Japan, Vietnam, Florida, Tuscany, the Alps…): each day stays in one
// area. The catalog may say so (`countrySized` / `bases`); otherwise: a country-named destination, a car-recommended
// one, or a known region whose areas are separate towns.
const REGION_SIZED = new Set(['swiss-alps', 'austrian-alps', 'amalfi-naples', 'goa', 'bali', 'zanzibar', 'kenya-safari']);
export const countrySized = (d) => (d?.countrySized ?? null) !== null ? d.countrySized === true : Array.isArray(d?.bases) || d?.transport?.carRecommended === true
  || REGION_SIZED.has(d?.id) || normalize(d?.name?.en).replace(/^the /, '') === normalize(d?.country?.en);
const dayTripHours = (dt) => Math.max(4, (dt.hours || 1) * 2 + 4);

function freeIdeaKeys(request, dest, cold) {
  const s = request.styles, keys = [];
  if (request.children) keys.push('playground');
  if (!cold && (s.includes('beach') || s.includes('relaxation') || dest.tags?.includes('beach'))) keys.push('beach');
  if (!cold && (request.children || s.includes('relaxation'))) keys.push('pool');
  if (s.includes('luxury') || ['honeymoon', 'couple'].includes(request.occasion)) keys.push('spa');
  if (s.includes('shopping') || s.includes('city')) keys.push('shop');
  return [...new Set([...keys, 'walk', 'food', 'cafe'])];
}

function stopDays(dest, request, { start, nights, first, last, stopIndex, l, others = [] }) {
  const where = L(dest.name, l), p = pace(request), want = wantTags(request, p.profile), asked = styleTags(request, p.profile), month = Number(start.slice(5, 7));
  const sized = countrySized(dest), isMust = mustSeeOf(dest), warnings = new Set();
  const item = (a) => ({ name: L(a.name, l), kind: a.kind, durationH: a.durationH, area: a.area || '', where, mapsUrl: mapsUrl(L(a.name, l), where) });
  let entries = [];
  const tooLong = []; // kid-friendly or must-see places longer than the pace: offered as free-day ideas, never planned
  (dest.attractions || []).forEach((a, i) => {
    if (!suitable(a, request, p, want)) {
      if (suitable({ ...a, durationH: 1 }, request, p, want) && !offSeason(a, dest, month) && (isMust(a) || (a.tags || []).some((x) => asked.has(x) || (request.children && ['family', ...KIDS_TAGS].includes(x))))) tooLong.push(a);
      return;
    }
    const off = offSeason(a, dest, month);
    if (off) { warnings.add(off); return; }
    const must = isMust(a);
    entries.push({ a, must, s: scoreAttraction(a, request, want, asked) + (must ? 3 : 0) - i * 0.01, zone: a.area || (sized ? `#${i}` : '') });
  });
  if (request.styles.includes('ski') && !skiSeason(dest, month)) warnings.add('ski');
  entries.sort((x, y) => y.s - x.s);

  const total = nights + (last ? 1 : 0);
  const kinds = Array.from({ length: total }, (_, i) => (i === 0 && first ? 'arrival' : i === 0 ? 'move' : last && i === total - 1 ? 'departure' : 'full'));
  const dates = kinds.map((_, i) => addDays(start, i));
  if (request.needs.shabbat) dates.forEach((d, i) => { if (weekday(d) === 6 && kinds[i] === 'full') kinds[i] = 'shabbat'; });
  // Day trips: one per 3–4 nights (from 5 nights), never on consecutive days, most days stay in the destination; only
  // trips that fit the travellers' pace and season, and never to another stop of the route.
  const fullIdx = kinds.map((k, i) => (k === 'full' ? i : -1)).filter((i) => i >= 0);
  const trips = (dest.dayTrips || []).map((dt, i) => ({ dt, h: dayTripHours(dt), s: (dt.mustSee ? 3 : 0) + (dt.tags || []).filter((x) => want.has(x)).length * 2 - (request.children ? dayTripHours(dt) * 0.1 : 0) - i * 0.01 }))
    .filter((x) => x.h <= p.dayTripH && !(Array.isArray(x.dt.months) && x.dt.months.length && !x.dt.months.includes(month)) && !others.some((o) => overlaps(o, x.dt.name)))
    .sort((x, y) => y.s - x.s);
  const tripCount = nights >= 5 && fullIdx.length >= 3 ? Math.min(Math.max(1, Math.round(nights / 3.5)), Math.floor((fullIdx.length - 1) / 2), trips.length) : 0;
  const chosen = trips.slice(0, tripCount);
  chosen.forEach((x, k) => { kinds[fullIdx[Math.floor(((k + 1) * fullIdx.length) / (tripCount + 1))]] = 'daytrip'; });
  // A day trip to a place replaces the same place as an attraction (no "Phi Phi" twice).
  entries = entries.filter((e) => !chosen.some((x) => overlaps(x.dt.name, e.a.name)));
  const restWanted = nights >= 6 && (request.children || request.styles.includes('relaxation') || request.styles.includes('beach'));
  const fullLeft = kinds.map((k, i) => (k === 'full' ? i : -1)).filter((i) => i >= 0);
  if (restWanted && fullLeft.length >= 3) kinds[fullLeft.at(-1)] = 'rest';

  const used = new Set(), out = kinds.map((kind, i) => ({ kind, date: dates[i], stop: stopIndex, items: [], note: '' }));
  let zone = '', trip = 0;
  out.forEach((day) => {
    if (day.kind === 'arrival' && (dest.flightHours || 0) >= 6) day.note = t('build.note.longFlight', {}, l);
    else if (day.kind === 'arrival' || day.kind === 'move') {
      const light = entries.find((e) => !used.has(e) && dur(e.a) <= 2 && LIGHT.includes(e.a.kind));
      if (light) { used.add(light); day.items.push(item(light.a)); zone = light.zone; }
    } else if (day.kind === 'daytrip') {
      const { dt, h } = chosen[trip++];
      day.items.push({ name: L(dt.name, l), kind: 'daytrip', durationH: h, where, mapsUrl: mapsUrl(L(dt.name, l), where) });
      day.note = L(dt.note, l);
    }
  });
  // Full days: the best remaining item leads (highlights first), then by score and proximity (same area), at most two
  // of a kind, one museum/church a day with children, off-request items only to fill a thin day. A country-sized
  // destination keeps each day in one area and finishes an area before moving on.
  const plans = [], fullCount = out.filter((d) => d.kind === 'full').length;
  for (let k = 0; k < fullCount; k++) {
    // A day is led by a must-see or by something the visitor asked for; once those run out, up to one free day in
    // four, then the rest of the list (no long trip turns into a row of free days while places are left).
    const strict = plans.filter((x) => !x).length < Math.floor(fullCount / 4);
    const left = entries.filter((e) => !used.has(e) && !(strict && want.size && e.s < 1));
    if (!left.length) { plans.push(null); continue; }
    const seed = (sized && zone && left.find((e) => e.zone === zone)) || left[0], day = [seed];
    used.add(seed); let hours = dur(seed.a);
    const count = (k) => day.filter((x) => x.a.kind === k).length;
    // An evening item (night out, sunset, evening cruise) for those who asked for it comes on top of the day's places
    // (in a city it may be across town: it is the evening).
    const evening = (e) => LATE(e.a) && e.s >= 2 && !day.some((x) => LATE(x.a));
    const fits = (e, loose) => !used.has(e) && (day.length < p.items || (day.length === p.items && evening(e))) && hours + dur(e.a) <= p.hours && count(e.a.kind) < 2
      && !(request.children && HEAVY.includes(e.a.kind) && day.some((x) => HEAVY.includes(x.a.kind)))
      && (sized ? e.zone === seed.zone : loose || evening(e) || !(e.a.area && seed.a.area && e.a.area !== seed.a.area))
      && !(want.size && e.s < 1 && hours >= p.hours * 0.5);
    for (const loose of sized ? [false] : [false, true]) {
      if (loose && hours >= p.hours * 0.5) break;
      for (;;) {
        const next = entries.filter((e) => fits(e, loose)).map((e) => ({ e, v: e.s + (e.a.area && e.a.area === seed.a.area ? 1.5 : 0) - count(e.a.kind) })).sort((x, y) => y.v - x.v)[0];
        if (!next) break;
        used.add(next.e); day.push(next.e); hours += dur(next.e.a);
      }
    }
    zone = seed.zone;
    plans.push(day.sort((x, y) => Number(LATE(x.a)) - Number(LATE(y.a))));
  }
  // A country-sized destination: days of the same base stay together, in the order the bases first appear
  // (a low-scored leftover in Kyoto must not bring the trip back from Osaka).
  if (sized) {
    const order = [], days = plans.filter(Boolean);
    days.forEach((d) => { if (!order.includes(d[0].zone)) order.push(d[0].zone); });
    days.sort((a, b) => order.indexOf(a[0].zone) - order.indexOf(b[0].zone));
    let n = 0; plans.forEach((d, i) => { if (d) plans[i] = days[n++]; });
  }
  // Free days are spread between the planned ones (not all at the end) and carry 2–3 ideas.
  const fullDays = out.filter((d) => d.kind === 'full'), free = plans.filter((x) => !x).length, content = plans.filter(Boolean);
  const spareTrips = trips.filter((x) => !chosen.includes(x) && ![...used].some((e) => overlaps(x.dt.name, e.a.name))).map((x) => L(x.dt.name, l));
  const ideas = [...tooLong.map((a) => t('build.idea.long', { place: L(a.name, l) }, l)), ...entries.filter((e) => !used.has(e)).slice(0, 4).map((e) => L(e.a.name, l)), ...spareTrips.map((name) => t('build.idea.daytrip', { place: name }, l)), ...freeIdeaKeys(request, dest, warnings.has('beach')).map((k) => t(`build.idea.${k}`, {}, l))];
  let c = 0, f = 0, lastZone = '';
  fullDays.forEach((day, k) => {
    if (free && Math.floor(((k + 1) * free) / fullDays.length) > Math.floor((k * free) / fullDays.length)) {
      const mine = [...new Set([0, 1, 2].map((j) => ideas[(f * 2 + j) % ideas.length]))];
      f++; day.kind = 'free'; day.ideas = mine; day.note = t('build.note.free', { ideas: mine.join(' · ') }, l);
      return;
    }
    const plan = content[c++];
    day.items = plan.map((e) => item(e.a));
    const area = plan[0].a.area;
    if (sized && area && area !== lastZone) { const named = (dest.areas || []).find((x) => x.name?.en === area); day.note = t('build.note.base', { area: named ? L(named.name, l) : area }, l); }
    if (area) lastZone = area;
  });
  return { days: out, spare: entries.filter((e) => !used.has(e)).map((e) => item(e.a)), warnings: [...warnings] };
}

export function dayTitle(day, l = 'he', stopName = '') {
  if (['arrival', 'departure', 'rest', 'shabbat', 'move', 'free'].includes(day.kind)) return t(`build.day.${day.kind}`, { place: stopName }, l);
  if (day.kind === 'daytrip') return t('build.day.daytrip', { place: day.items[0]?.name || '' }, l);
  return day.items.slice(0, 2).map((x) => x.name).join(' · ') || t('build.day.free', {}, l);
}

export function buildItinerary(stops, request, l = 'he') {
  const days = [], spare = [], warnings = [];
  stops.forEach((s, i) => {
    const others = stops.filter((_, k) => k !== i).map((o) => o.dest.name);
    const part = stopDays(s.dest, request, { start: s.start, nights: s.nights, first: i === 0, last: i === stops.length - 1, stopIndex: i, l, others });
    days.push(...part.days); spare.push(...part.spare.slice(0, 6));
    for (const w of part.warnings) warnings.push(t(`build.warn.${w}`, { place: L(s.dest.name, l) }, l));
  });
  return { days: days.map((d, i) => ({ ...d, day: i + 1, title: dayTitle(d, l, L(stops[d.stop]?.dest.name, l)),
    note: d.note || (d.kind === 'shabbat' ? t('build.note.shabbat', {}, l) : request.needs.shabbat && weekday(d.date) === 5 && d.kind === 'full' ? t('build.note.friday', {}, l) : request.needs.shabbat && weekday(d.date) === 6 ? t('build.note.travelShabbat', {}, l) : '') })), spare, warnings };
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
    minStars: defaultStars(request), family: request.children > 0, area: area ? L(area.name, 'en') : '' };
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
    // Shabbat-observant: no internal flight on Saturday – the boundary moves a day earlier (or later).
    if (r.needs.shabbat) for (let i = 1; i < stops.length; i++) if (weekday(stops[i].start) === 6) {
      const shift = stops[i - 1].nights > 1 ? -1 : stops[i].nights > 1 ? 1 : 0;
      if (shift) { stops[i].start = addDays(stops[i].start, shift); stops[i - 1].end = stops[i].start; stops[i - 1].nights += shift; stops[i].nights -= shift; }
    }
    r.end = stops.at(-1).end; r.nights = daysBetween(r.start, r.end);
  }
  const it = buildItinerary(stops, r, l), main = dests[0];
  const assumed = dates.assumed.map((a) => t(`build.assumed.${a.key}`, { nights: a.nights, month: monthName(a.month, l) }, l));
  if (!request.understood.some((x) => x.field === 'adults')) assumed.unshift(t('build.assumed.adults', {}, l));
  if (request.children > request.childAges.length) assumed.push(t('build.assumed.ages', {}, l));
  const stopView = (s) => ({ id: s.dest.id, code: s.dest.code, name: s.dest.name, country: s.dest.country, nights: s.nights, start: s.start, end: s.end, dailyBudgetIls: s.dest.dailyBudgetIls, image: imageOf(s.dest), summary: s.dest.summary, advisory: s.dest.advisory || null });
  const areas = stops.map((s) => areaFor(s.dest, r));
  // Budget (spec 28 §א.2): the highest stars / meal plan / car whose estimated HIGH end fits the cap (no supplier call).
  const base = baseConfigOf(r, main), budgetPlan = fitTrip(stops, r, base), cfg = budgetPlan?.config || base;
  if (budgetPlan) {
    const what = budgetPlan.changes.map((k) => t(`build.assumed.budget.${k}`, { stars: cfg.stars, board: t(`build.understood.board.${cfg.board || 'RO'}`, {}, l) }, l));
    if (what.length) assumed.push(t('build.assumed.budget', { list: what.join(', ') }, l));
    // Nearest alternatives: destinations that fit; when none does, the cheapest ones that are cheaper than this plan.
    if (!budgetPlan.fits) {
      const others = suggestDestinations({ ...r, destinations: [], shortlist: [], countries: [] }, { limit: 6, today }).filter((s) => !ids.includes(s.id) && s.estimate);
      const fitting = others.filter((s) => s.fitsBudget), cheaper = others.filter((s) => s.estimate.high < budgetPlan.estimate.high).sort((a, b) => a.estimate.high - b.estimate.high);
      budgetPlan.alternatives = (fitting.length ? fitting : cheaper).slice(0, 2).map(({ id, name, estimate, fitsBudget }) => ({ id, name, estimate, fits: fitsBudget === true }));
    }
  }
  return {
    request: r, suggestions, assumed, budgetPlan,
    destination: stopView(stops[0]), stops: stops.length > 1 ? stops.map(stopView) : [],
    areas: stops.map((s) => (s.dest.areas || []).map((a) => ({ name: a.name, forWhom: a.forWhom }))),
    flightSearch: flightSearchOf(r, stops), hotelSearches: stops.map((s, i) => ({ ...hotelSearchOf(r, s, areas[i]), minStars: cfg.stars, board: cfg.board })),
    hotelAreas: areas.map((a) => (a ? { name: a.name, forWhom: a.forWhom } : null)),
    car: { ...carAdvice(main, r, l), include: cfg.car }, itinerary: it.days, spare: it.spare, warnings: it.warnings,
    practical: (() => { const pr = practicalOf(main, r, l); if (it.warnings.length) pr.season = [...it.warnings, pr.season].filter(Boolean).join(' '); return pr; })(),
    highlights: (main.highlights || []).slice(0, 4).map((h) => L(h, l))
  };
}
