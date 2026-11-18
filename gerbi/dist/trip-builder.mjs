// Magic trip builder (spec 24): free text → a validated trip request → a package skeleton (destination, dates,
// flight/hotel search specs, car advice, day-by-day itinerary, practical card). Deterministic and catalog-grounded:
// no prices are produced here (live prices come from the supplier, estimates from trip-package.mjs).
import { understandRequest, spellFix, MAX_NIGHTS } from './brief-engine.mjs';
import { detectLegs } from './multi-city-brief.mjs';
import { destinations, byId, byCode, rank, normalize, monthName, nameVariants, skiSeason } from './catalog.mjs';
import { placeByCode, placeType } from './places.mjs';
import { t } from './i18n.mjs';
import { mapsUrl, typical, graceOf } from './trip-package.mjs';
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
  allInclusive: /הכו?ל כלול|הכו?ל-כלול|או?ל ?אינקלוסיב|all[- ]?inclusive/i, pool: /בריכה|\bpool\b/i,
  halfBoard: /חצי פנסיון|half[- ]board/i, fullBoard: /פנסיון מלא|full[- ]board/i, breakfast: /(?:עם|כולל|רק)\s+ארוחת בוקר|bed (?:and|&) breakfast|\bb&b\b|with breakfast/i,
  carYes: /(?:עם|כולל|נשכור|לשכור|שוכרים|השכרת|ונשכור|וגם|ב)\s*(?:ה)?רכב(?!\s*ציבורי)|רכב שכור|רכב צמוד|קרוואן|קראוון|\bcampervan|\bmotorhome|\bcaravan|\brv\b|\bby car\b|\b(?:rent(?:al|ing)?\s+(?:a\s+)?car|car\s+(?:hire|rental)|with\s+a\s+car|road\s?trip)\b/i,
  carNo: /(?:בלי|ללא|לא צריך|לא צריכים|לא רוצים)\s*(?:ה)?רכב|\b(?:no|without a|don'?t need a)\s+car\b/i,
  ski: /סקי|סנובורד|\bski(?:ing)?\b|snowboard/i, nature: /טבע|הרים|מפלים|נופים|נוף|טרקים|טיולים רגליים|זוהר|צילום נוף|טיול צילום|טרק|הליכות|מסלולי הליכה|\bnature\b|hiking|hikes?\b|treks?\b|trekking|mountains|waterfalls|scenery/i,
  nightlife: /חיי לילה|מסיבות|ברים|nightlife|clubs|\bbars\b|\bparty\b/i, friends: /חברים|חברות|\bfriends\b|\bmates\b/i,
  honeymoon: /ירח דבש|honeymoon/i, luxury: /יוקרה|יוקרתי|פינוק|מפנק|\bluxury\b|luxurious|5[- ]star|five[- ]star|pamper/i,
  food: /אוכל|קולינרי|יין|\bfood\b|culinary|\bwine\b/i, culture: /תרבות|היסטוריה|מוזיאונים|culture|history|museums/i, shopping: /קניות|שופינג|אאוטלט|אופנה|shopping|outlets?|fashion/i,
  stars: /(\d)\s*(?:כוכבים|★)|\b(\d)[- ]?stars?\b|(חמישה|ארבעה|שלושה) כוכבים/i,
  suggest: /תציעו|תמליצו|לא יודעים לאן|לא בטוחים לאן|הפתיעו|תפתיעו|לאן כדאי|איפה כדאי|surprise|suggest|recommend|anywhere|not sure where|don'?t know where/i,
  alternatives: /\s(?:או|or)\s/i
};
const WORD_STARS = { חמישה: 5, ארבעה: 4, שלושה: 3 };

// Every catalog name (destinations and countries, both languages): what a misspelt word is corrected to.
const CATALOG_NAMES = [...new Set(destinations.flatMap((d) => [d.name?.he, d.name?.en, ...nameVariants(d), d.country?.he, d.country?.en]).filter(Boolean).map((n) => normalize(n)).filter((n) => !/[—&,(]/.test(n)))];
// World regions people name instead of a place ("אירופה", "המזרח הרחוק"); "דרום אמריקה" is the Americas without the USA.
const SOUTH_AMERICA = ['Peru', 'Argentina', 'Brazil', 'Chile', 'Colombia', 'Ecuador', 'Bolivia', 'Uruguay'];
export const inRegion = (d, id) => (id === 'latin-america' ? d?.region === 'americas' && d?.country?.en !== 'United States'
  : id === 'south-america' ? d?.region === 'americas' && SOUTH_AMERICA.includes(d?.country?.en)
  // "אירופה" as Israelis say it: not the Caucasus.
  : id === 'europe' ? d?.region === 'europe' && d?.country?.en !== 'Georgia' : d?.region === id);
// Approximate coordinates of each catalog destination: only to order the bases of a long trip as a route (nearest next),
// never shown. A destination missing here is simply placed by its ranking.
const COORDS = { rome: [41.9, 12.5], 'milan-lake-como': [45.6, 9.1], venice: [45.4, 12.3], 'florence-tuscany': [43.8, 11.25], 'amalfi-naples': [40.7, 14.5], sicily: [37.5, 14.5],
  athens: [37.98, 23.7], santorini: [36.4, 25.4], crete: [35.3, 25.1], rhodes: [36.4, 28.2], mykonos: [37.45, 25.35], barcelona: [41.4, 2.2], madrid: [40.4, -3.7], mallorca: [39.6, 2.9],
  tenerife: [28.3, -16.6], lisbon: [38.7, -9.1], porto: [41.15, -8.6], madeira: [32.7, -16.9], paris: [48.86, 2.35], nice: [43.7, 7.26], london: [51.5, -0.1], edinburgh: [55.95, -3.2],
  berlin: [52.5, 13.4], 'munich-bavaria': [48.1, 11.6], bangkok: [13.75, 100.5], phuket: [7.9, 98.4], 'new-york': [40.7, -74], florida: [25.8, -80.2], 'los-angeles': [34.05, -118.25],
  'las-vegas': [36.17, -115.14], dubai: [25.2, 55.3], 'abu-dhabi': [24.45, 54.4], eilat: [29.55, 34.95], 'dead-sea': [31.2, 35.4], 'swiss-alps': [46.6, 8], 'austrian-alps': [47.2, 11.4],
  vienna: [48.2, 16.4], japan: [35.7, 139.7], vietnam: [21, 105.8], bali: [-8.4, 115.2], 'sri-lanka': [7, 80], goa: [15.3, 74], maldives: [4.2, 73.5], cancun: [21.2, -86.8],
  'costa-rica': [9.9, -84], peru: [-12, -77], 'buenos-aires': [-34.6, -58.4], rio: [-22.9, -43.2], zanzibar: [-6.2, 39.2], seychelles: [-4.6, 55.5], mauritius: [-20.2, 57.5],
  'cape-town': [-33.9, 18.4], 'kenya-safari': [-1.3, 36.8], marrakech: [31.6, -8], budapest: [47.5, 19], prague: [50.1, 14.4], amsterdam: [52.4, 4.9], cyprus: [34.9, 33.6],
  georgia: [41.7, 44.8], croatia: [42.65, 18.1], montenegro: [42.4, 18.75], bansko: [41.8, 23.5], krakow: [50.06, 19.94], slovenia: [46.05, 14.5], istanbul: [41, 29],
  iceland: [64.1, -21.9], 'norway-fjords': [60.4, 5.3], copenhagen: [55.7, 12.6], sydney: [-33.9, 151.2], 'new-zealand': [-36.85, 174.8] };
const km = (a, b) => { const [x, y] = [COORDS[a], COORDS[b]]; if (!x || !y) return 5000; const r = Math.PI / 180, h = Math.sin((y[0] - x[0]) * r / 2) ** 2 + Math.cos(x[0] * r) * Math.cos(y[0] * r) * Math.sin((y[1] - x[1]) * r / 2) ** 2; return 12742 * Math.asin(Math.sqrt(h)); };
// The bases of a long trip: the best-ranked first, then always the nearest of the chosen ones (no zig-zag); a region's
// bases stay within a reasonable hop of the first (a month "in Asia" is not Japan + Bali + Goa).
export function routeBases(ids, count, { maxHop = Infinity } = {}) {
  const pool = ids.filter((id) => id === ids[0] || km(ids[0], id) <= maxHop).slice(0, Math.max(count, 0) + 4);
  const chosen = pool.slice(0, count), route = [chosen.shift()].filter(Boolean);
  while (chosen.length) { chosen.sort((a, b) => km(route.at(-1), a) - km(route.at(-1), b)); route.push(chosen.shift()); }
  return route;
}
const HOLIDAY_EN = { פסח: 'Passover', סוכות: 'Sukkot', 'ראש השנה': 'Rosh Hashanah', חנוכה: 'Hanukkah', שבועות: 'Shavuot', פורים: 'Purim', 'יום כיפור': 'Yom Kippur' };
const fmtDay = (iso, l) => (l === 'en' ? `${Number(iso.slice(8, 10))}/${Number(iso.slice(5, 7))}/${iso.slice(0, 4)}` : `${Number(iso.slice(8, 10))}.${Number(iso.slice(5, 7))}.${iso.slice(0, 4)}`);

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

// "שבוע בוייטנאם ואז שבוע בפוקט", "3 nights in Rome then 4 in Florence": a length said next to each place → its nights.
const UNIT_NIGHTS = [[/(\d+)\s*לילות?/, (m) => +m[1]], [/(\d+)\s*ימים/, (m) => +m[1] - 1], [/שבועיים/, () => 14], [/שבוע/, () => 7], [/סופ"?ש|סוף שבוע/, () => 3],
  [/(\d+)\s*nights?/i, (m) => +m[1]], [/(\d+)\s*days?/i, (m) => +m[1] - 1], [/(?:two|2)\s*weeks|fortnight/i, () => 14], [/(?:a|one)\s*week/i, () => 7]];
function legNightsOf(text, wanted) {
  if (wanted.length < 2) return null;
  const n = ` ${normalize(text)} `, out = [];
  for (const d of wanted) {
    const at = Math.min(...nameVariants(d).map((v) => n.indexOf(v)).filter((i) => i >= 0), 1e6);
    if (at === 1e6) return null;
    const before = n.slice(Math.max(0, at - 18), at), after = n.slice(at, at + 40).replace(/^\S+(?:\s+\S+)?/, '');
    const hit = UNIT_NIGHTS.map(([rx, f]) => { const m = before.match(new RegExp(rx.source + '\\s*(?:ב|ל|in|at)?\\s*-?\\s*$', 'i')) || after.match(new RegExp('^\\s*,?\\s*(?:ל|for)?\\s*' + rx.source, 'i')); return m ? f(m) : null; }).find((x) => x);
    if (!hit) return null;
    out.push(hit);
  }
  return out;
}

// text + quick chips (already appended to the text by the page) → the trip request.
export function parseTrip(text, { today = new Date().toISOString().slice(0, 10), lang = 'he', destId = '', fx = null } = {}) {
  // Misspelt place names are corrected on a copy the rules read ("ברסלונה" → "ברצלונה"); the visitor's text is kept.
  const raw = String(text || '').slice(0, 1500), fixed = spellFix(raw, CATALOG_NAMES), u = understandRequest(fixed, {}, { today, lang }), b = u.brief, has = (rx) => rx.test(fixed);
  const styles = ['beach', 'city', 'relaxation', 'family', 'couple'].filter((k) => b[k] === true);
  // More ways people say a style: spa / בטן גב is rest, the sun / snorkelling is the beach, a show is culture, kids make it a family trip.
  for (const [k, rx] of [['relaxation', /(?:^|\s)ו?ל?ספא(?=[\s,.!?]|$)|בטן[- ]גב|צ'יל|צ׳יל|רוגע|יוגה|ריטריט|\bspa\b|\bchill\b|\byoga\b|\bretreat\b/i], ['beach', /\bsun(?:ny|shine)?\b|\bhot place\b|snorkel|\bsurf|גלישה|לגלוש|שנורקל|על הים|מלון על החוף/i],
    ['culture', /תיאטרון|ברודווי|הופעות|מחזמר|אופרה|theat(?:re|er)|broadway|musicals?|\bshows?\b|opera/i], ['nightlife', /לצאת בלילות|לצאת בערבים|לבלות|party|parties/i],
    ['food', /\btapas\b|vegan|טבעוני|בשר|גסטרונומ/i], ['city', /בירה אירופ|עיר בירה|\bcapital\b|city break/i], ['couple', /יום נישואין|אחרי החתונה|anniversary|נשואים טריים/i]])
    if (rx.test(fixed) && !styles.includes(k)) styles.push(k);
  if ((b.children || 0) > 0 && !styles.includes('family') && !/בלי ילדים|without (?:the )?kids/i.test(fixed)) styles.push('family');
  for (const k of ['ski', 'nature', 'nightlife', 'food', 'culture', 'shopping', 'luxury']) if (has(RX[k]) && !styles.includes(k)) styles.push(k);
  const friends = has(RX.friends), honeymoon = has(RX.honeymoon);
  const occasion = honeymoon ? 'honeymoon' : friends ? 'friends' : (b.children || 0) > 0 ? 'family' : b.couple ? 'couple' : (b.adults === 1 ? 'solo' : '');
  const starsMatch = RX.stars.exec(fixed), stars = starsMatch ? Number(starsMatch[1] || starsMatch[2]) || WORD_STARS[starsMatch[3]] : 0;
  const allInclusive = has(RX.allInclusive);
  const board = allInclusive ? 'AI' : has(RX.fullBoard) ? 'FB' : has(RX.halfBoard) ? 'HB' : has(RX.breakfast) ? 'BB' : '';
  const car = has(RX.carNo) ? 'no' : has(RX.carYes) ? 'yes' : 'auto';
  const luxury = styles.includes('luxury') || honeymoon && stars >= 5;
  // A country alone ("שבוע ביוון") is a choice between its destinations (ranked below), not a route through all of them.
  const named = namedInText(fixed), fromCodes = u.countryOnly ? [] : (b.want || []).map((c) => byCode(c)).filter(Boolean);
  const excluded = new Set((b.exclude || []).map((c) => byCode(c)?.id).filter(Boolean));
  // Everything named after a "no" is out, the whole list ("not Paris or London", "לא יוון ולא קפריסין"), and a country
  // said that way takes all its places with it (Mykonos too, not only the airports the brief knew).
  const negatedCountries = new Set();
  for (const m of ` ${fixed.toLowerCase()} `.matchAll(/(?:^|[\s,])(?:ו?לא|בלי|ללא|חוץ מ-?|not|no|without|except|anywhere but)\s+([^,.;!?()]+)/g)) {
    // Only when a place comes right after the "no" ("לא משנה המחיר ברודוס", "בלי רכב… בברצלונה" keep their place).
    const head = namedInText(m[1].trim().split(/\s+/).slice(0, 2).join(' '));
    if (!head.found.length && !head.countries.length) continue;
    const span = namedInText(m[1]);
    span.found.forEach((d) => excluded.add(d.id));
    span.countries.forEach((c) => { negatedCountries.add(c); destinations.filter((d) => d.country?.en === c).forEach((d) => excluded.add(d.id)); });
  }
  named.countries = named.countries.filter((c) => !negatedCountries.has(c));
  // In the order they were named ("רומא, פירנצה וונציה" is that route), whichever list found them.
  const said = ` ${normalize(fixed)} `, at = (d) => Math.min(...[...nameVariants(d), ...(placeByCode(d.code)?.names || []), ...[d.name?.he, d.name?.en].flatMap((x) => normalize(x).split(/\s+ו|\s*&\s*|\s+—\s+|,\s*/))]
    .filter((x) => x && x.length >= 3).map((x) => said.indexOf(x)).filter((i) => i >= 0), 1e6);
  // A place that only a spelling fix produced, outside the country they named, is a misread ("בתאילנד… טיולים" ≠ Tulum).
  if (/\bLA\b|\bL\.A\.?/.test(raw)) named.found.push(byId('los-angeles'));
  const saidRaw = new Set([...namedInText(raw).found.map((d) => d.id), ...(/\bLA\b|\bL\.A\.?/.test(raw) ? ['los-angeles'] : [])]);
  const desertSafari = /ספארי\s*(?:מדבר|ג'יפים|ג׳יפים)|desert safari/i.test(fixed) && !/קניה|kenya/i.test(fixed);
  const atLA = raw.search(/\bLA\b|\bL\.A\.?/), atOf = (d) => (d.id === 'los-angeles' && atLA >= 0 ? atLA : at(d));
  let wanted = [...new Map([...named.found, ...fromCodes].map((d) => [d.id, d])).values()].filter((d) => !excluded.has(d.id))
    .filter((d) => saidRaw.has(d.id) || !named.countries.length || named.countries.includes(d.country?.en)).filter((d) => !(desertSafari && d.id === 'kenya-safari')).sort((a, b) => atOf(a) - atOf(b));
  // "אתונה + איים", "Athens and the islands": the named place, then the islands of its country.
  const ISLANDS = { Greece: ['santorini', 'mykonos', 'crete', 'rhodes'], Italy: ['sicily', 'amalfi-naples'], Spain: ['mallorca', 'tenerife'], Croatia: ['croatia'] };
  if (wanted.length === 1 && /(?:\+|ו|and(?: the)?|with(?: the)?)\s*(?:ה)?(?:איים|islands)(?![א-ת])/i.test(fixed)) {
    const isl = (ISLANDS[wanted[0].country?.en] || []).filter((id) => id !== wanted[0].id && !excluded.has(id)).map(byId);
    const n = (b.nights || 7) >= 10 ? 2 : 1;
    wanted.push(...isl.slice(0, n));
  }
  const forced = byId(destId);
  if (forced) wanted = [forced, ...wanted.filter((d) => d.id !== forced.id)];
  const legs = detectLegs(fixed, { today, origin: b.origin || 'TLV' })?.legs || null;
  const alternatives = wanted.length > 1 && has(RX.alternatives) && !legs;
  const extra = [];
  const say = (field, key, vars) => extra.push({ field, label: t(`build.understood.${key}`, vars, lang) });
  if (board) say('board', `board.${board}`);
  if (car !== 'auto') say('car', `car.${car}`);
  if (stars) say('stars', 'stars', { stars });
  if (honeymoon) say('occasion', 'honeymoon'); else if (friends) say('occasion', 'friends');
  for (const k of ['ski', 'nature', 'nightlife']) if (styles.includes(k)) say('style', `style.${k}`);
  // Wishes that name an experience, not a place: the catalog places that have it lead the suggestions.
  const IDEAS = [[/זוהר (?:ה)?צפוני|northern lights|aurora/i, ['iceland', 'norway-fjords']], [/(?<!מדבר\s)ספארי(?!\s*(?:מדבר|ג'יפים|ג׳יפים|בדובאי))|(?<!desert\s)safari/i, ['kenya-safari', 'cape-town']],
    [/מגלש|פארק(?:י)? מים|פארק מים|אקוופארק|water ?parks?|water ?slides?|aqua ?park/i, destinations.filter((d) => d.tags.includes('water_slides')).map((d) => d.id)],
    [/(?:נוף ל|ליד |על )?אגם|lake\b|lakes\b/i, ['milan-lake-como', 'slovenia', 'swiss-alps', 'austrian-alps', 'munich-bavaria']],
    [/גלישה|לגלוש|גלים|\bsurf/i, ['sri-lanka', 'costa-rica', 'tenerife', 'bali', 'lisbon']],
    [/לא חם מדי|לא חם|קריר|not too hot|cool weather|escape the heat/i, ['swiss-alps', 'norway-fjords', 'iceland', 'edinburgh', 'copenhagen', 'amsterdam', 'london', 'munich-bavaria', 'slovenia', 'austrian-alps']],
    [/ויין חם|mulled wine|אווירת חג|אווירה חגיגית|festive/i, ['vienna', 'prague', 'munich-bavaria', 'berlin', 'budapest']],
    [/קרוואן|קראוון|campervan|motorhome|\bcaravan/i, ['norway-fjords', 'iceland', 'slovenia', 'swiss-alps', 'munich-bavaria', 'edinburgh', 'austrian-alps']],
    [/ג'יפים|ג׳יפים|הרפתקא|אקסטרים|אדרנלין|\badventure|\bjeep|\bextreme/i, destinations.filter((d) => d.tags.includes('adventure')).map((d) => d.id)],
    [/(?:^|\s)(?:ה)?איים(?=[\s,.]|$)|\bislands?\b/i, ['crete', 'rhodes', 'santorini', 'mykonos', 'mallorca', 'sicily', 'tenerife', 'madeira', 'cyprus', 'bali', 'phuket', 'zanzibar', 'mauritius', 'seychelles', 'maldives']],
    [/פריחת (?:ה)?דובדבן|cherry blossom|sakura/i, ['japan']], [/שווקי (?:חג )?(?:ה)?מולד|כריסמס|christmas market/i, ['vienna', 'prague', 'munich-bavaria', 'berlin', 'budapest']],
    [/פיורד|fjord/i, ['norway-fjords']], [/צלילה|שנורקל|snorkel|diving|scuba/i, ['eilat', 'maldives', 'zanzibar', 'seychelles', 'mauritius']],
    [/פארקי שעשועים|יוניברסל|דיסני|disney|universal|theme park/i, ['florida', 'los-angeles', 'paris', 'dubai']], [/(?:^|\s)(?:תרמיל|תרמילאים|תרמילאי)|backpack/i, ['vietnam', 'sri-lanka', 'georgia', 'bangkok', 'peru']]];
  const boost = [...new Set(IDEAS.filter(([rx]) => rx.test(fixed)).flatMap(([, ids]) => ids))];
  // A flight-length limit: "עד 4 שעות טיסה", "לא יותר מ-3 שעות טיסה", "טיסה קצרה", "max 5 hours flight", "short flight".
  const fh = fixed.match(/(?:עד|לא יותר מ-?|מקסימום|פחות מ-?|max(?:imum)?|up to|under|less than|no more than)\s*(\d{1,2}(?:\.5)?)\s*(?:שעות|שעה|hours?|hrs?|h)\s*(?:טיסה|של טיסה|flight|flying|of flight)|(?:טיסה|flight)\s*(?:של\s*)?(?:עד|לא יותר מ-?|מקסימום|max|up to|under)\s*(\d{1,2}(?:\.5)?)\s*(?:שעות|שעה|hours?|hrs?)/i);
  const fh2 = !fh && fixed.match(/(?:עד|לא יותר מ-?|מקסימום|within|up to|under|max(?:imum)?)\s*(\d(?:\.5)?)\s*(?:שעות|שעה|hours?|hrs?|h)(?![א-תa-z])(?!\s*(?:נסיעה|הליכה|ביום|ממלון|drive|driving|walk|a day|from))/i);
  const maxFlightHours = fh ? Number(fh[1] || fh[2]) : fh2 ? Number(fh2[1]) : /טיסה קצרה|טיסות קצרות|קרוב לארץ|לא רחוק|(?:^|\s)(?:הכי\s+)?קרוב(?=[\s,.!?]|$)|\bshort (?:flight|haul)\b|\bclose to israel\b|\bnot far\b|\bclose by\b|\b(?:cheap|something) and close\b/i.test(fixed) ? 4.5 : 0;
  const pool = has(RX.pool);
  if (pool) extra.push({ field: 'pool', label: t('planner.need.pool', {}, lang) });
  // Budget (spec 28 §א): a cap for everyone in shekels. "$3000" / "€2500" convert at today's rate (the site's /api/fx);
  // with no rate the amount is unknown and the visitor is asked for it in shekels.
  const foreign = b.budgetForeign, rate = foreign ? fx?.rates?.[foreign.currency] : null;
  const budget = Number.isFinite(b.budget) ? b.budget : rate ? Math.floor(foreign.amount * rate / 10) * 10 : null;
  if (foreign && rate) say('budget', 'budgetFx', { amount: `₪${new Intl.NumberFormat('en-US').format(budget)}` });
  const request = {
    text: raw, lang, origin: placeByCode(b.origin)?.code || 'TLV', adults: b.adults || 2, children: b.children || 0, childAges: (b.childAges || []).filter((a) => Number.isInteger(a) && a >= 0 && a < 18).slice(0, 8),
    infants: b.infants || 0, nights: b.nights || 0, start: b.start || '', end: b.end || '', month: monthIndex(b.month), year: b.year || 0, anchor: b.anchor || '', holiday: b.holiday || '', styles, occasion,
    budget, budgetLevel: luxury || b.noBudgetLimit ? 'high' : b.cheaper ? 'low' : 'mid',
    needs: { car, allInclusive, board, minStars: stars || (luxury ? 5 : 0), kosher: b.kosher === true, shabbat: b.shabbat === true, accessible: b.accessible === true, direct: b.stops === '0', pool },
    asked: { stars: stars > 0 },
    destinations: alternatives ? [] : wanted.map((d) => d.id).slice(0, 4), shortlist: alternatives ? wanted.map((d) => d.id) : [], countries: named.countries, exclude: [...excluded],
    regions: b.regions || [], excludeRegions: b.excludeRegions || [],
    legNights: legNightsOf(fixed, wanted), maxFlightHours, abroad: /חו"ל|חו״ל|חוץ לארץ|לחו"ל|\babroad\b|\boverseas\b/i.test(fixed) || (b.excludeRegions || []).length > 0, ...(boost.length ? { boost } : {}), legs, suggest: !wanted.length || has(RX.suggest) && !forced,
    understood: [...u.understood.filter((x) => !['want', 'exclude'].includes(x.field) || (x.field === 'exclude' && (b.excludeRegions || []).length)).map(({ field, label }) => ({ field, label })), ...extra],
    coverage: u.coverage
  };
  // Questions (spec 24 §3): what is genuinely ambiguous is asked – one clear question, the most decision-changing –
  // instead of guessed silently. Otherwise the brief engine's "what is still missing" (exact dates, which city).
  const ask = [], q = (id, question) => ask.push({ id, question });
  const asked = new Map((u.allQuestions || u.questions).map((x) => [x.id, x.question]));
  if (b.nightsConflict) q('nights-conflict', t('planner.q.nightsConflict', { said: b.nightsConflict.said, dated: b.nightsConflict.dated, start: fmtDay(request.start, lang), end: fmtDay(request.end, lang) }, lang));
  if (asked.has('budget-currency') && !budget) q('budget-currency', asked.get('budget-currency'));
  if (asked.has('children')) q('children', asked.get('children'));
  if (request.children && request.childAges.length < request.children) q('ages', t('build.q.ages', {}, lang));
  const ambiguous = ask.length > 0;
  // Which city: not when a long trip in the country is planned as several bases anyway.
  if (asked.has('city') && !wanted.length && !(request.nights >= 14)) q('city', asked.get('city'));
  if (!wanted.length && !request.countries.length && !request.regions.length && !styles.length && !has(RX.suggest) && !forced) q('destination', asked.get('destination') || t('planner.q.destination', {}, lang));
  for (const id of ['dates', 'exact-dates']) if (asked.has(id) && !(id === 'exact-dates' && request.anchor)) q(id, asked.get(id));
  const shown = ask.slice(0, ambiguous ? 1 : 2);
  request.questions = shown.map((x) => x.question);
  request.questionIds = shown.map((x) => x.id);
  return request;
}

// Inline edits from the page ("הבנו / הנחנו" rows): each field re-validated; anything else is ignored.
// The model's reading of the request (backend trip_tags task) merged into the rules' request. The model decides MEANING
// (who travels, where, what kind of trip: tags, needs, exclusions); the rules keep what they read exactly (explicit
// dates, a budget amount, a length) and are the whole answer when no model is available. Everything is re-validated.
export function mergeModel(request, v, { today = new Date().toISOString().slice(0, 10) } = {}) {
  if (!v || typeof v !== 'object') return request;
  const r = { ...request, needs: { ...request.needs }, modelUsed: true };
  const int = (n, lo, hi) => (Number.isInteger(n) && n >= lo && n <= hi ? n : null), ids = (xs) => [...new Set((xs || []).filter((id) => byId(id)))];
  const iso = (x) => (/^\d{4}-\d{2}-\d{2}$/.test(x || '') && x > today ? x : '');
  // Travellers: the model's count when it gives one (it reads "אני, אחי ואחותי", "2+3", "12 חברים" as people do).
  const adults = int(v.adults, 1, 9), kids = int(v.children, 0, 8) ?? 0, infants = int(v.infants, 0, 4) ?? 0;
  if (adults) {
    const ages = (v.childAges || []).filter((a) => int(a, 2, 17) !== null).slice(0, 8);
    r.adults = adults; r.children = kids + infants; r.infants = infants;
    r.childAges = ages.length === kids ? [...ages, ...Array(infants).fill(0)] : request.children === r.children ? request.childAges : [...Array(infants).fill(0)];
  }
  if (!r.nights && int(v.nights, 1, MAX_NIGHTS)) r.nights = v.nights;
  if (!r.start && iso(v.start)) { r.start = iso(v.start); if (iso(v.end) > r.start) r.end = iso(v.end); }
  if (!r.month && !r.start && int(v.month, 1, 12)) r.month = v.month;
  if (!(r.budget > 0) && int(v.budgetIls, 300, 2e6)) r.budget = v.budgetIls;
  if (r.budgetLevel === 'mid' && ['low', 'high'].includes(v.budgetLevel)) r.budgetLevel = v.budgetLevel;
  // Places: what the model says was named wins (aliases, typos, "Nice and Monaco"); exclusions add up.
  r.exclude = [...new Set([...r.exclude, ...ids(v.exclude)])];
  const named = ids(v.destinations).filter((id) => !r.exclude.includes(id));
  if (named.length && !r.shortlist.length) { r.destinations = named; r.suggest = false; }
  if (Array.isArray(v.countries) && v.countries.length) r.countries = [...new Set(v.countries.filter((c) => destinations.some((d) => d.country.en === c)))];
  if (Array.isArray(v.regions) && v.regions.length && !r.regions.length) r.regions = v.regions.slice(0, 3);
  if (v.abroad === true) r.abroad = true;
  if (r.destinations.length > 1 && (v.nightsPerPlace || []).length === r.destinations.length && v.nightsPerPlace.every((n) => int(n, 1, 60))) r.legNights = v.nightsPerPlace;
  // Meaning → tags (searched in the catalog) and the styles the itinerary reads.
  const TAGS = new Set(destinations.flatMap((d) => d.tags)), tags = (xs) => [...new Set((xs || []).filter((x) => TAGS.has(x)))];
  r.tags = { must: tags(v.mustTags), nice: tags(v.niceTags) };
  const STYLE_OF = { beach: 'beach', city: 'city', relaxation: 'relaxation', family: 'family', couple: 'couple', ski: 'ski', nature: 'nature', nightlife: 'nightlife', food: 'food', culture: 'culture', shopping: 'shopping', luxury: 'luxury' };
  r.styles = [...new Set([...r.styles, ...[...r.tags.must, ...r.tags.nice].map((x) => STYLE_OF[x]).filter(Boolean)])];
  if (r.styles.includes('luxury') && r.budgetLevel === 'mid') r.budgetLevel = 'high';
  const n = v.needs || {};
  for (const k of ['kosher', 'shabbat', 'accessible', 'allInclusive', 'pool', 'direct']) if (n[k] === true) r.needs[k] = true;
  if (r.needs.allInclusive && !r.needs.board) r.needs.board = 'AI';
  if (r.needs.car === 'auto' && ['yes', 'no'].includes(n.car)) r.needs.car = n.car;
  if (!r.maxFlightHours && typeof v.maxFlightHours === 'number' && v.maxFlightHours >= 1 && v.maxFlightHours <= 24) r.maxFlightHours = v.maxFlightHours;
  const sug = ids(v.suggest).filter((id) => !r.exclude.includes(id));
  if (sug.length) r.modelSuggest = sug;
  if (!r.questions?.length && typeof v.question === 'string' && v.question.trim()) { r.questions = [v.question.trim().slice(0, 200)]; r.questionIds = ['model']; }
  return r;
}

export function applyEdits(request, e = {}, today = new Date().toISOString().slice(0, 10)) {
  if (!e || typeof e !== 'object') return request;
  const r = { ...request, needs: { ...request.needs }, childAges: [...request.childAges] };
  const int = (v, min, max) => (Number.isInteger(v) && v >= min && v <= max ? v : null);
  if (int(e.adults, 1, 9) !== null) r.adults = e.adults;
  if (int(e.children, 0, 8) !== null) { r.children = Math.min(e.children, 9 - r.adults); r.childAges = r.childAges.slice(0, r.children); }
  if (Array.isArray(e.childAges)) r.childAges = e.childAges.filter((a) => int(a, 0, 17) !== null).slice(0, r.children);
  if (int(e.nights, 1, MAX_NIGHTS) !== null) { r.nights = e.nights; r.end = ''; }
  if (typeof e.start === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(e.start) && e.start >= today) { r.start = e.start; r.end = ''; r.anchor = ''; r.nights = r.nights || 5; }
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
  // The model's tags: every "must" tag is required (when any place has them all), each "nice" tag adds to the score.
  if (request.tags) {
    const has = (x, t) => x.destination.tags.includes(t), { must, nice } = request.tags;
    ranked = ranked.map((x) => ({ ...x, score: x.score + 1.5 * nice.filter((t) => has(x, t)).length + 3 * must.filter((t) => has(x, t)).length }))
      .sort((a, b) => Boolean(a.destination.advisory) - Boolean(b.destination.advisory) || b.score - a.score);
    const all = ranked.filter((x) => must.every((t) => has(x, t)));
    if (must.length && all.length) ranked = [...all, ...ranked.filter((x) => !all.includes(x))];
  }
  const pool = request.shortlist.length ? request.shortlist : null;
  if (pool) ranked = ranked.filter((x) => pool.includes(x.destination.id));
  else if (request.countries.length) { const inCountry = ranked.filter((x) => request.countries.includes(x.destination.country.en)); if (inCountry.length) ranked = inCountry; }
  // Regions: "באירופה" keeps Europe; "לא אירופה" never offers it.
  if (!pool && request.regions?.length) { const inside = ranked.filter((x) => request.regions.some((id) => inRegion(x.destination, id))); if (inside.length) ranked = inside; }
  if (request.excludeRegions?.length) ranked = ranked.filter((x) => !request.excludeRegions.some((id) => inRegion(x.destination, id)));
  if (request.abroad) ranked = ranked.filter((x) => x.destination.region !== 'israel');
  if (/המזרח הרחוק|דרום מזרח אסיה|far east|south ?east asia/i.test(request.text)) { const fe = ranked.filter((x) => ['Thailand', 'Vietnam', 'Indonesia', 'Japan'].includes(x.destination.country?.en)); if (fe.length) ranked = fe; }
  // In season first (a stable move: the ranking order is kept inside each group); the rest stay as a fallback.
  const month = prefs.month;
  // Ski has its own season rule (by hemisphere, in the ranking): bestMonths are the general climate, not the snow.
  if (month && !request.styles.includes('ski')) ranked = [...ranked.filter((x) => x.destination.bestMonths?.includes(month)), ...ranked.filter((x) => !x.destination.bestMonths?.includes(month))];
  for (const tag of [request.needs.kosher && 'kosher', request.needs.allInclusive && 'all_inclusive']) if (tag) { const ok = ranked.filter((x) => x.destination.tags.includes(tag)); if (ok.length) ranked = [...ok, ...ranked.filter((x) => !ok.includes(x))]; }
  if (request.maxFlightHours) { const near = ranked.filter((x) => x.destination.flightHours > 0 && x.destination.flightHours <= request.maxFlightHours); if (near.length) ranked = near; }
  // With children, short flights first – unless that leaves nothing (a region or a season that is all long-haul).
  if (request.children > 0 && ranked.length > limit) { const near = ranked.filter((x) => x.destination.flightHours <= 6); if (near.length) ranked = near; }
  // The AI partner's ideas (when the rules understood little) lead the list; they never hide the catalog's ranking.
  if (request.boost?.length) ranked = [...ranked.filter((x) => request.boost.includes(x.destination.id)), ...ranked.filter((x) => !request.boost.includes(x.destination.id))];
  // The model's own picks lead, in its order (it weighed season, flight length, who travels and the budget).
  const ms = request.modelSuggest || [];
  if (ms.length) ranked = [...ranked.filter((x) => ms.includes(x.destination.id)).sort((a, b) => ms.indexOf(a.destination.id) - ms.indexOf(b.destination.id)), ...ranked.filter((x) => !ms.includes(x.destination.id))];
  // A car asked for: places made for driving first (Tuscany, Sicily – not Rome), whoever proposed them.
  if (request.needs.car === 'yes') ranked = [...ranked.filter((x) => countrySized(x.destination)), ...ranked.filter((x) => !countrySized(x.destination))];
  // Budget (spec 28 §א.2): a destination whose LOW end – with everything the plan may give up given up – is above the
  // cap is not offered; the ones whose HIGH end fits lead; "cheap" orders the best-matching ones by estimated cost.
  const cost = new Map();
  if (request.budget > 0) {
    // A trip type that defines the place (ski) or an experience they named (northern lights) is not traded for price:
    // "ski, ₪12,000" is the cheapest ski resort, never Cyprus. Those that lack it only follow.
    const must = (x) => (!request.styles.includes('ski') || x.destination.tags.includes('ski')) && (!request.styles.includes('beach') || x.destination.tags.includes('beach')) && (!request.boost?.length || request.boost.includes(x.destination.id))
      && (!request.needs.allInclusive || x.destination.tags.includes('all_inclusive')) && (!request.needs.kosher || x.destination.tags.includes('kosher'))
      && (request.tags?.must || []).every((t) => x.destination.tags.includes(t));
    const rest = ranked.some(must) ? ranked.filter((x) => !must(x)) : [];
    ranked = ranked.filter((x) => !rest.includes(x));
    for (const x of ranked.slice(0, 40)) { const d = x.destination, stops = [{ dest: d, nights: planDates(request, d, today).nights }]; cost.set(d.id, estimateTrip(stops, request, floorConfig(request, baseConfigOf(request, d)))); }
    const known = ranked.filter((x) => cost.has(x.destination.id)), fitting = known.filter((x) => cost.get(x.destination.id).cap.low <= request.budget);
    if (fitting.length) {
      const fits = (x) => typical(cost.get(x.destination.id).cap) <= graceOf(request.budget);
      ranked = [...fitting.filter(fits), ...fitting.filter((x) => !fits(x))];
      // Too few within reach (one, out of season): the next cheapest follow, flagged as not fitting – never an empty choice.
      if (fitting.length < limit + 3) ranked.push(...known.filter((x) => !fitting.includes(x)).sort((a, b) => cost.get(a.destination.id).cap.low - cost.get(b.destination.id).cap.low));
      if (request.budgetLevel === 'low') ranked = [...ranked.slice(0, 8).sort((a, b) => cost.get(a.destination.id).high - cost.get(b.destination.id).high), ...ranked.slice(8)];
    } else ranked = known.sort((a, b) => cost.get(a.destination.id).low - cost.get(b.destination.id).low);
    // Season before price: a beach in December that fits the budget is still the wrong answer.
    if (month && !request.styles.includes('ski')) ranked = [...ranked.filter((x) => x.destination.bestMonths?.includes(month)), ...ranked.filter((x) => !x.destination.bestMonths?.includes(month))];
    ranked = [...ranked, ...rest];
  } else if (request.budgetLevel === 'low') {
    // "Cheap" with no amount: the best matches ordered by what the whole trip costs (a cheap hotel 13 hours away is not cheap).
    const top = ranked[0]?.score || 0, est = (d) => estimateTrip([{ dest: d, nights: request.nights || 5 }], request, floorConfig(request, baseConfigOf(request, d))).high;
    // Season before price here too: a cheap week in March is never Georgia out of season while in-season places exist.
    const inSeason = (x) => !month || request.styles.includes('ski') || x.destination.bestMonths?.includes(month);
    // A ski resort's "season" is the snow: never the cheap answer for someone who did not ask for skiing.
    const skiOnly = (x) => !request.styles.includes('ski') && x.destination.tags.includes('ski') && !x.destination.tags.includes('city') && !x.destination.tags.includes('beach');
    // Places the catalog marks as good value compete even with a lower match score ("תקציב מוגבל" is the request).
    const pool = [...new Set([...ranked.slice(0, 12).filter((x) => x.score >= top * 0.6), ...ranked.filter((x) => x.destination.tags.includes('low_budget') && x.score >= top * 0.4)])], kinds = ['beach', 'city', 'ski', 'nature'].filter((k) => request.styles.includes(k)), fit = (x) => kinds.every((k) => x.destination.tags.includes(k));
    // The kind of trip asked for (a city, a beach) is kept; price only orders the places of that kind.
    const asked = pool.some(fit) ? pool.filter(fit) : pool, seasonal = asked.some(inSeason) ? asked.filter(inSeason) : asked;
    const head = seasonal.filter((x) => !skiOnly(x)).map((x) => [x, est(x.destination)]).sort((a, b) => a[1] - b[1]).map(([x]) => x);
    ranked = [...head, ...ranked.filter((x) => !head.includes(x))];
  }
  return ranked.slice(0, limit).map(({ destination: d, score, reasons }) => ({ id: d.id, name: d.name, country: d.country, image: imageOf(d), score,
    reasons: reasons.slice(0, 3).map((r) => L(r, request.lang)), flightHours: d.flightHours, direct: d.direct, budgetLevel: d.budgetLevel, advisory: L(d.advisory, request.lang),
    ...(cost.has(d.id) ? { estimate: { low: cost.get(d.id).low, high: cost.get(d.id).high }, fitsBudget: typical(cost.get(d.id).cap) <= graceOf(request.budget) } : {}) }));
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
  // An approximate start the visitor gave ("באמצע יולי", "בפסח"): the plan starts there, said out loud.
  if (!start && request.anchor && request.anchor > today) { start = request.anchor; assumed.push({ key: request.holiday ? 'holiday' : 'anchor', date: start, holiday: request.holiday }); }
  if (!start) {
    let month = request.month;
    if (!month) {
      const best = (dest?.bestMonths || []).length ? dest.bestMonths : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      const soon = addDays(today, 21);
      month = [...best].sort((a, b) => ((a - Number(soon.slice(5, 7)) + 12) % 12) - ((b - Number(soon.slice(5, 7)) + 12) % 12))[0];
      assumed.push({ key: 'month', month });
    } else assumed.push({ key: 'dates', month });
    let year = request.year && request.month ? request.year : Number(today.slice(0, 4));
    if (!(request.year && request.month) && `${year}-${pad(month)}-28` < earliest) year++;
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
// Where a country-sized trip sleeps: its bases in route order. weight → share of the nights; city → the hotel search's city
// code ('' = no live search there, an agent quotes it); air → the AIRPORT (never a city code: the supplier refuses
// OSA as an airport) to fly home from when the trip ends there;
// areas → the catalog attraction areas that belong to the base; trips → its day trips (English name starts).
// ponytail: hand-written for the destinations whose areas are hours apart; the rest stay one base with day trips.
const B = (areas, weight, city, air, trips = []) => ({ areas: [].concat(areas), weight, city, air, trips });
export const BASES = {
  japan: [B('Tokyo', 3, 'TYO', 'TYO', ['Kamakura', 'Hakone']), B('Fuji & Hakone', 1, '', ''), B('Kyoto', 2.5, 'UKY', 'KIX', ['Nara']), B('Osaka', 1.5, 'OSA', 'KIX', ['Hiroshima', 'Nara'])],
  vietnam: [B('Hanoi', 3, 'HAN', 'HAN', ['Ha Long', 'Ninh Binh', 'Sapa']), B(['Hoi An', 'Da Nang'], 2.5, 'DAD', 'DAD', ['My Son', 'Hue', 'Ba Na']), B('Ho Chi Minh City (Saigon)', 2, 'SGN', 'SGN', ['Mekong', 'Cu Chi'])],
  'sri-lanka': [B('The Cultural Triangle', 2.5, '', 'CMB'), B('Kandy', 1.5, '', 'CMB'), B('Ella & the tea hills', 1.5, '', 'CMB'), B(['The south coast (Galle & Mirissa)', 'Yala (Tissamaharama)', 'Udawalawe'], 2.5, '', 'CMB')],
  'new-zealand': [B('Auckland', 2, 'AKL', 'AKL'), B(['Rotorua', 'Tongariro National Park'], 2, 'ROT', 'AKL'), B('Queenstown', 3, 'ZQN', 'ZQN', ['Milford']), B('Wanaka & Mount Cook', 1.5, '', 'ZQN')],
  peru: [B(['Miraflores (Lima)', 'Barranco (Lima)', 'Lima Centro', 'Pueblo Libre (Lima)'], 2, 'LIM', 'LIM'), B('Cusco', 2.5, 'CUZ', 'CUZ', ['Rainbow', 'Vinicunca']), B(['Sacred Valley', 'Aguas Calientes'], 2, '', 'CUZ')],
  'costa-rica': [B('La Fortuna & Arenal', 3, '', 'SJO'), B('Monteverde', 1.5, '', 'SJO'), B(['Manuel Antonio', 'Turrialba'], 2.5, '', 'SJO')],
  iceland: [B('Reykjavík', 3, 'REK', 'KEF', ['Golden Circle', 'Blue Lagoon', 'Snæfellsnes']), B('The South Coast (Vík)', 2, '', 'KEF'), B('Akureyri & the North', 2, 'AEY', 'KEF')],
  'norway-fjords': [B(['Bergen', 'Stavanger'], 2.5, 'BGO', 'BGO'), B(['Flåm & Aurland', 'Lærdal', 'Geiranger'], 2, '', 'BGO'), B('Hardanger (Odda & Lofthus)', 1.5, '', 'BGO')],
  'kenya-safari': [B('Nairobi (Karen)', 1, 'NBO', 'NBO'), B('Maasai Mara', 3, '', 'NBO'), B('Amboseli', 2, '', 'NBO'), B('Naivasha & Nakuru (Rift Valley)', 1.5, '', 'NBO')],
  florida: [B(['Miami Beach (South Beach)', 'Central Miami', 'Sunrise (Fort Lauderdale)'], 3, 'MIA', 'MIA', ['Everglades', 'Key']), B('Orlando (theme-park area)', 3, 'ORL', 'MCO', ['Kennedy'])],
  sicily: [B(['Palermo', 'Cefalù'], 2, 'PMO', 'PMO'), B(['Syracuse — Ortigia', 'Noto', 'Agrigento'], 2, '', 'CTA'), B(['Taormina', 'Catania'], 2, 'CTA', 'CTA', ['Etna'])],
  croatia: [B(['Split centre', 'Krka', 'Brač', 'Trogir'], 3, 'SPU', 'SPU'), B(['Dubrovnik Old Town', 'Lokrum'], 3, 'DBV', 'DBV')],
  'swiss-alps': [B('Zurich', 1.5, 'ZRH', 'ZRH'), B('Lucerne', 2, '', 'ZRH'), B(['Interlaken', 'Grindelwald, Wengen & Lauterbrunnen'], 3, '', 'ZRH')],
  georgia: [B('Tbilisi — Old Town', 3, 'TBS', 'TBS'), B('Kazbegi (Stepantsminda)', 1.5, '', 'TBS'), B('Kakheti — Sighnaghi & Telavi', 1.5, '', 'TBS'), B(['Batumi', 'Kutaisi'], 2, 'BUS', 'BUS')],
  'amalfi-naples': [B(['Naples — historic centre', 'Naples — Chiaia seafront', 'Pompeii', 'Ercolano', 'Vesuvius'], 2, 'NAP', 'NAP'), B(['Positano', 'Amalfi & Ravello', 'Furore', 'Capri'], 3, '', 'NAP')],
  'munich-bavaria': [B(['Munich Altstadt', 'Schwabing & Maxvorstadt', 'Nymphenburg', 'Isarvorstadt', 'Olympiapark', 'Dachau'], 3, 'MUC', 'MUC'), B(['Füssen', 'Garmisch-Partenkirchen', 'Berchtesgaden'], 2, '', 'MUC')]
};
// A country-sized stop of 5+ nights → its bases: about one per 3.5 nights (the heaviest ones, kept in route order),
// nights by weight, at least 2 a base (1 for a one-night stopover like Hakone).
export function splitBases(stop) {
  const all = BASES[stop.dest.id];
  if (!all || stop.nights < 5) return [stop];
  const n = Math.min(all.length, Math.max(2, Math.round(stop.nights / 3.5)));
  const picked = [...all].sort((a, b) => b.weight - a.weight).slice(0, n), route = all.filter((b) => picked.includes(b));
  const w = route.reduce((t, b) => t + b.weight, 0), min = (b) => (b.weight <= 1 ? 1 : 2);
  const nights = route.map((b) => Math.max(min(b), Math.floor((stop.nights * b.weight) / w)));
  while (nights.reduce((a, b) => a + b, 0) > stop.nights) { const i = nights.findIndex((x, k) => x > min(route[k]) && x === Math.max(...nights)); if (i < 0) break; nights[i]--; }
  for (let k = 0; nights.reduce((a, b) => a + b, 0) < stop.nights; k++) nights[k % route.length]++;
  let cursor = stop.start;
  return route.map((base, i) => { const st = { ...stop, base, start: cursor, end: addDays(cursor, nights[i]), nights: nights[i] }; cursor = st.end; return st; });
}
const baseName = (s) => { if (!s.base) return s.dest.name; const a = (s.dest.areas || []).find((x) => s.base.areas.includes(x.name?.en)); return a ? a.name : { he: s.base.areas[0], en: s.base.areas[0] }; };
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

function stopDays(dest, request, { start, nights, first, last, stopIndex, l, others = [], base = null }) {
  // A base of a country-sized trip: only its own areas and day trips, and no area hopping inside it.
  if (base) dest = { ...dest, attractions: (dest.attractions || []).filter((a) => base.areas.includes(a.area)), dayTrips: (dest.dayTrips || []).filter((dt) => base.trips.some((x) => L(dt.name, 'en').startsWith(x))), countrySized: base.areas.length > 1 };
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
  // A base of a longer trip gets its day trip from 3 nights (Kyoto → Nara), the rest from 5.
  const tripCount = nights >= 5 && fullIdx.length >= 3 ? Math.min(Math.max(1, Math.round(nights / 3.5)), Math.floor((fullIdx.length - 1) / 2), trips.length)
    : base && nights >= 3 && fullIdx.length >= 2 && trips.length ? 1 : 0;
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
    const part = stopDays(s.dest, request, { start: s.start, nights: s.nights, first: i === 0, last: i === stops.length - 1, stopIndex: i, l, others: s.base ? [] : others, base: s.base || null });
    days.push(...part.days); spare.push(...part.spare.slice(0, 6));
    for (const w of part.warnings) warnings.push(t(`build.warn.${w}`, { place: L(s.dest.name, l) }, l));
  });
  return { days: days.map((d, i) => ({ ...d, day: i + 1, title: dayTitle(d, l, L(stops[d.stop] ? baseName(stops[d.stop]) : '', l)),
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
  // Children include the infants: with every age known the ages decide, else the infants are the under-2s.
  let adt = request.adults, chd = 0, inf = 0;
  const ages = request.childAges.length === request.children ? request.childAges : [];
  if (ages.length) for (const a of ages) { if (a < 2) inf++; else if (a < 12) chd++; else adt++; } else { inf = Math.min(request.infants || 0, request.children); chd = request.children - inf; }
  if (inf > adt) { chd += inf - adt; inf = adt; }
  return [{ ptc: 'ADT', count: Math.min(9, adt) }, ...(chd ? [{ ptc: 'CHD', count: chd }] : []), ...(inf ? [{ ptc: 'INF', count: inf }] : [])];
}
// Two places under ~450 km apart on the mainland (Rome → Florence, Vienna → Budapest, Paris → London) go by train or road,
// not a flight; islands always fly (or sail). ponytail: straight-line distance, a rail map would be the upgrade.
const ISLAND = new Set(['santorini', 'mykonos', 'crete', 'rhodes', 'mallorca', 'tenerife', 'madeira', 'sicily', 'cyprus', 'maldives', 'bali', 'zanzibar', 'seychelles', 'mauritius', 'phuket', 'iceland']);
export const byLand = (a, b) => Boolean(a && b && a.id !== b.id && !ISLAND.has(a.id) && !ISLAND.has(b.id) && COORDS[a.id] && COORDS[b.id] && km(a.id, b.id) < 450);
export function flightSearchOf(request, stops) {
  // Bases of one destination are joined by train or road: one flight in (the first base's airport), one out (the last's).
  const groups = []; stops.forEach((s) => { const g = groups.at(-1); if (g && ((g.dest.id === s.dest.id && s.base) || byLand(g.last, s.dest))) { g.out = s.base?.air || s.dest.code; g.end = s.end; g.last = s.dest; } else groups.push({ dest: s.dest, last: s.dest, in: s.base?.air || s.dest.code, out: s.base?.air || s.dest.code, start: s.start, end: s.end }); });
  const hops = [{ out: request.origin }, ...groups, { in: request.origin }];
  const legs = hops.slice(0, -1).map((from, i) => ({ origin: { code: from.out, type: placeType(from.out) }, destination: { code: hops[i + 1].in, type: placeType(hops[i + 1].in) }, date: i === 0 ? groups[0].start : groups[i - 1].end }));
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
  return { destinationId: stop.dest.id, city: stop.base ? stop.base.city : hotelCityOf(stop.dest), checkIn: stop.start, checkOut: stop.end, rooms: roomsOf(request), board: request.needs.board || '',
    minStars: defaultStars(request), family: request.children > 0, area: area ? L(area.name, 'en') : '' };
}
// The area the catalog recommends for these travellers: matched on its "for whom" text.
export function areaFor(dest, request) {
  const areas = dest?.areas || [];
  const words = request.children ? ['famil', 'משפח', 'kids', 'ילד'] : request.occasion === 'honeymoon' || request.occasion === 'couple' ? ['couple', 'זוג', 'romant'] : request.occasion === 'friends' ? ['nightlife', 'לילה', 'young', 'צעיר'] : request.budgetLevel === 'low' ? ['cheap', 'value', 'budget', 'זול', 'משתלם', 'lower price'] : ['first', 'central', 'מרכז', 'ראשונ'];
  return areas.find((a) => words.some((w) => normalize(L(a.forWhom, 'en') + ' ' + L(a.forWhom, 'he')).includes(w))) || areas[0] || null;
}

// ---- 6. The whole skeleton.
// The budget is a hard cap (owner rule, spec 28 §א): when the asked plan cannot fit, the plan the customer sees is one
// that does – another destination in what they asked for (never a city they named), else fewer nights – and it says so,
// with what the original would cost. Only when nothing fits does the honest "closest is ₪X over" remain.
export function planPackage(request, opts = {}) {
  const p = planPackageRaw(request, opts), bp = p.budgetPlan, l = request.lang;
  if (!bp || bp.fits || opts.chosenId || opts.nights || !p.destination) return p;
  const askedName = L(p.destination.name, l);
  const namedCity = request.destinations.length > 0 && !request.suggest;
  if (!namedCity) {
    const mon = Number(p.request.start?.slice(5, 7)), inSeason = (id) => !mon || request.styles.includes('ski') || byId(id)?.bestMonths?.includes(mon);
    const same = (p.suggestions || []).filter((x) => x.fitsBudget && x.id !== p.destination.id && inSeason(x.id));
    const free = !request.countries.length && !request.regions?.length ? (bp.alternatives || []).filter((a) => a.fits) : [];
    for (const alt of [...same, ...free].slice(0, 3)) {
      const q = planPackageRaw(request, { ...opts, chosenId: alt.id });
      if (q.budgetPlan?.fits) {
        q.assumed.unshift(t('build.assumed.budgetDest', { from: askedName, to: L(q.destination.name, l), budget: request.budget.toLocaleString('en-US'), raise: bp.raiseTo.toLocaleString('en-US') }, l));
        q.budgetPlan.adjusted = { kind: 'destination', from: p.destination.id, raiseTo: bp.raiseTo };
        return q;
      }
    }
  }
  // Last resort (owner 18.11.2026, the budget is a hard cap): fewer nights, said in the plan with what the full length
  // would cost. When even that does not fit, the closest plan stays with the three ways out (buttons).
  const askedNights = p.request.nights;
  if (bp.nights && bp.nights < askedNights) {
    const q = planPackageRaw(request, { ...opts, nights: bp.nights });
    if (q.budgetPlan?.fits) {
      q.assumed.unshift(t('build.assumed.budgetNights', { nights: bp.nights, asked: askedNights, budget: request.budget.toLocaleString('en-US'), raise: bp.raiseTo.toLocaleString('en-US') }, l));
      q.budgetPlan.adjusted = { kind: 'nights', askedNights, raiseTo: bp.raiseTo };
      return q;
    }
  }
  return p;
}
function planPackageRaw(request, { today = new Date().toISOString().slice(0, 10), chosenId = '', nights: override = 0 } = {}) {
  const l = request.lang;
  if (override) request = { ...request, nights: override, end: '' };
  const suggestions = request.destinations.length && !request.suggest ? [] : suggestDestinations(request, { today });
  let ids = chosenId && byId(chosenId) ? [chosenId] : request.destinations.length ? request.destinations : suggestions.slice(0, 1).map((s) => s.id);
  if (chosenId && request.destinations.length > 1 && request.destinations.includes(chosenId)) ids = request.destinations;
  // A country or a region for two weeks or more ("חודש באיטליה", "3 weeks in Thailand"): several bases of about a week
  // each, best-ranked first – never one city for a month, never cut to a week.
  let bases = 0;
  const roadTrip = request.needs.car === 'yes' && /כמה מקומות|בין מקומות|כמה ערים|מסלול|road ?trip|several places|a few places|multiple/i.test(request.text);
  if (!chosenId && !request.destinations.length && !request.shortlist.length && !request.legs && (request.countries.length || request.regions?.length) && (request.nights >= 14 || (roadTrip && request.nights >= 6))) {
    const want = roadTrip && request.nights < 14 ? Math.min(3, Math.max(2, Math.round(request.nights / 3.5))) : Math.min(4, Math.max(2, Math.round(request.nights / 7)));
    const pool = suggestDestinations(request, { today, limit: 12 }).filter((s) => !s.advisory && (!request.countries.length || request.countries.includes(s.country?.en)));
    const route = routeBases(pool.map((s) => s.id), want, { maxHop: request.countries.length ? Infinity : roadTrip ? 700 : 3500 });
    if (route.length > 1) { ids = route; bases = ids.length; }
  }
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
    const said = request.legNights?.length === dests.length && !request.end ? request.legNights : null;
    if (said) r.nights = said.reduce((a, b) => a + b, 0);
    stops = dests.map((d, i) => { const n = said ? said[i] : Math.floor(r.nights / dests.length) + (i < r.nights % dests.length ? 1 : 0); const s = { dest: d, start: cursor, end: addDays(cursor, Math.max(1, n)), nights: Math.max(1, n) }; cursor = s.end; return s; });
    // Shabbat-observant: no internal flight on Saturday – the boundary moves a day earlier (or later).
    if (r.needs.shabbat) for (let i = 1; i < stops.length; i++) if (weekday(stops[i].start) === 6) {
      const shift = stops[i - 1].nights > 1 ? -1 : stops[i].nights > 1 ? 1 : 0;
      if (shift) { stops[i].start = addDays(stops[i].start, shift); stops[i - 1].end = stops[i].start; stops[i - 1].nights += shift; stops[i].nights -= shift; }
    }
    r.end = stops.at(-1).end; r.nights = daysBetween(r.start, r.end);
  }
  const before = stops.length;
  stops = stops.flatMap(splitBases);
  const split = stops.length > before ? stops.filter((s) => s.base) : [];
  const it = buildItinerary(stops, r, l), main = dests[0];
  const assumed = dates.assumed.map((a) => (['anchor', 'holiday'].includes(a.key) ? t(`planner.assumed.${a.key}`, { date: fmtDay(a.date, l), holiday: a.holiday && l === 'en' ? HOLIDAY_EN[a.holiday] || a.holiday : a.holiday }, l)
    : t(`build.assumed.${a.key}`, { nights: a.nights, month: monthName(a.month, l) }, l)));
  const land = stops.filter((s, i) => i > 0 && byLand(stops[i - 1].dest, s.dest)).map((s, i) => `${L(stops[stops.indexOf(s) - 1].dest.name, l)} ← ${L(s.dest.name, l)}`);
  if (land.length) assumed.push(t('build.assumed.ground', { list: land.join(', ') }, l));
  if (split.length && !bases) assumed.push(t('planner.assumed.bases', { nights: split.reduce((a, s) => a + s.nights, 0), count: split.length, list: split.map((s) => `${L(baseName(s), l)} (${s.nights})`).join(', ') }, l));
  if (bases) assumed.push(t('planner.assumed.bases', { nights: r.nights, count: bases, list: stops.map((s) => `${L(s.dest.name, l)} (${s.nights})`).join(', ') }, l));
  // The live hotel search covers 30 nights per stay; a longer base is completed by an agent (said, not hidden).
  if (stops.some((s) => s.nights > 30)) assumed.push(t('planner.assumed.longStay', {}, l));
  // What the offline plan cannot guarantee is requested from the hotel and confirmed – stated, never silently dropped.
  const hotelNeeds = ['accessible', 'pool'].filter((k) => r.needs?.[k]).map((k) => t(`planner.need.${k}`, {}, l));
  if (hotelNeeds.length) assumed.push(t('planner.assumed.needs', { list: hotelNeeds.join(', ') }, l));
  if (!request.understood.some((x) => x.field === 'adults')) assumed.unshift(t('build.assumed.adults', {}, l));
  if (request.children > request.childAges.length) assumed.push(t('build.assumed.ages', {}, l));
  const stopView = (s) => ({ id: s.dest.id, code: s.base?.air || s.dest.code, name: baseName(s), ...(s.base ? { base: L(baseName(s), 'en'), country: s.dest.country } : {}), country: s.dest.country, nights: s.nights, start: s.start, end: s.end, dailyBudgetIls: s.dest.dailyBudgetIls, image: imageOf(s.dest), summary: s.dest.summary, advisory: s.dest.advisory || null });
  const areas = stops.map((s) => (s.base ? (s.dest.areas || []).find((a) => s.base.areas.includes(a.name?.en)) || null : areaFor(s.dest, r)));
  // Budget (spec 28 §א.2): the highest stars / meal plan / car whose estimated HIGH end fits the cap (no supplier call).
  const base = baseConfigOf(r, main), budgetPlan = fitTrip(stops, r, base), cfg = budgetPlan?.config || base;
  if (budgetPlan) {
    const what = budgetPlan.changes.map((k) => t(`build.assumed.budget.${k}`, { stars: cfg.stars, board: t(`build.understood.board.${cfg.board || 'RO'}`, {}, l) }, l));
    if (what.length) assumed.push(t('build.assumed.budget', { list: what.join(', ') }, l));
    // Nearest alternatives: destinations that fit; when none does, the cheapest ones that are cheaper than this plan.
    if (!budgetPlan.fits) {
      // Alternatives that fit the season too (a cheaper beach in December is no alternative to a winter-sun one).
      const mon = Number(r.start.slice(5, 7));
      const others = suggestDestinations({ ...r, destinations: [], shortlist: [], countries: [] }, { limit: 6, today }).filter((s) => !ids.includes(s.id) && s.estimate && (!mon || r.styles.includes('ski') || byId(s.id)?.bestMonths?.includes(mon)));
      const fitting = others.filter((s) => s.fitsBudget), cheaper = others.filter((s) => s.estimate.high < budgetPlan.estimate.high).sort((a, b) => a.estimate.high - b.estimate.high);
      budgetPlan.alternatives = (fitting.length ? fitting : cheaper).slice(0, 2).map(({ id, name, estimate, fitsBudget }) => ({ id, name, estimate, fits: fitsBudget === true }));
    }
  }
  return {
    request: r, suggestions, assumed, budgetPlan,
    destination: stopView(stops[0]), stops: stops.length > 1 ? stops.map(stopView) : [],
    areas: stops.map((s) => (s.dest.areas || []).filter((a) => !s.base || s.base.areas.includes(a.name?.en)).map((a) => ({ name: a.name, forWhom: a.forWhom }))),
    flightSearch: flightSearchOf(r, stops), hotelSearches: stops.map((s, i) => ({ ...hotelSearchOf(r, s, areas[i]), minStars: cfg.stars, board: cfg.board })),
    hotelAreas: areas.map((a) => (a ? { name: a.name, forWhom: a.forWhom } : null)),
    car: { ...carAdvice(main, r, l), include: cfg.car }, itinerary: it.days, spare: it.spare, warnings: it.warnings,
    practical: (() => { const pr = practicalOf(main, r, l); if (it.warnings.length) pr.season = [...it.warnings, pr.season].filter(Boolean).join(' '); return pr; })(),
    highlights: (main.highlights || []).slice(0, 4).map((h) => L(h, l))
  };
}
