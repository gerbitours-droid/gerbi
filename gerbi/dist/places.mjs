// Flight destinations the search field understands. Each place has:
//   label  – the long Hebrew description (saved flights, messages)
//   name   – the short Hebrew name shown in the field ("לונדון"), sub – its context ("בריטניה", "כל שדות התעופה")
//   en     – the English name, code – the IATA code sent to the supplier (a city code for type 'c')
//   names  – lower-case Hebrew/English forms people type (also read by the free-text engine, brief-engine.mjs)
// `trip` links the four demo destinations; `home` marks Israeli airports. ponytail: a curated list of popular
// routes from Israel; any other 3-letter IATA code is still accepted as typed.
import { lang } from './i18n.mjs';
const P = (code, name, sub, en, names, extra = {}) => ({ label: extra.label || `${name}, ${sub}`, code, name, sub, en, names, ...extra });
const A = (code, city, name, en, names, extra = {}) => ({ label: `${city.he} – ${name} (${code})`, code, name, sub: city.he, en, city: city.code, names, ...extra });
const LON = { code: 'LON', he: 'לונדון' }, PAR = { code: 'PAR', he: 'פריז' }, MIL = { code: 'MIL', he: 'מילאנו' }, NYC = { code: 'NYC', he: 'ניו יורק' }, ISTC = { code: 'IST', he: 'איסטנבול' };
export const places = [
  // Home airports: valid as origin or destination, never read as a holiday wish by the planner.
  P('TLV', 'תל אביב', 'נתב״ג', 'Tel Aviv', ['תל אביב', 'נתבג', 'בן גוריון', 'tel aviv', 'ben gurion'], { home: true, label: 'תל אביב (נתב״ג)' }),
  P('ETM', 'אילת', 'שדה רמון', 'Eilat Ramon', ['רמון', 'אילת', 'ramon', 'eilat'], { home: true, label: 'רמון, אילת' }),
  P('HFA', 'חיפה', 'ישראל', 'Haifa', ['חיפה', 'haifa'], { home: true, label: 'חיפה' }),
  P('FCO', 'רומא', 'איטליה', 'Rome', ['רומא', 'rome', 'roma', 'fiumicino'], { trip: 'rome' }),
  P('JTR', 'סנטוריני', 'יוון', 'Santorini', ['סנטוריני', 'santorini', 'thira'], { trip: 'santorini' }),
  P('MLE', 'מלדיביים', 'מאלה', 'Maldives', ['מלדיביים', 'המלדיביים', 'מלדיבים', 'האיים המלדיביים', 'מאלה', 'maldives', 'male'], { trip: 'maldives', label: 'האיים המלדיביים' }),
  P('DXB', 'דובאי', 'איחוד האמירויות', 'Dubai', ['דובאי', 'dubai'], { trip: 'dubai' }),
  P('PAR', 'פריז', 'כל שדות התעופה', 'Paris', ['פריז', 'פאריז', 'paris'], { type: 'c', airports: ['CDG', 'ORY', 'BVA'], label: 'פריז – כל שדות התעופה' }),
  A('CDG', PAR, 'שארל דה גול', 'Charles de Gaulle', ['שארל דה גול', 'charles de gaulle']),
  A('ORY', PAR, 'אורלי', 'Orly', ['אורלי', 'orly']),
  A('BVA', PAR, 'בובה', 'Beauvais', ['בובה', 'beauvais'], { label: 'פריז – בובה (BVA), כ־85 ק״מ מהעיר', sub: 'פריז · כ־85 ק״מ מהעיר' }),
  P('LON', 'לונדון', 'כל שדות התעופה', 'London', ['לונדון', 'london'], { type: 'c', airports: ['LHR', 'LGW', 'LTN', 'STN', 'LCY'], label: 'לונדון – כל שדות התעופה' }),
  A('LHR', LON, 'הית׳רו', 'Heathrow', ['הית\'רו', 'היתרו', 'heathrow']),
  A('LGW', LON, 'גטוויק', 'Gatwick', ['גטוויק', 'gatwick']),
  A('LTN', LON, 'לוטון', 'Luton', ['לוטון', 'luton']),
  A('STN', LON, 'סטנסטד', 'Stansted', ['סטנסטד', 'stansted']),
  A('LCY', LON, 'לונדון סיטי', 'London City', ['לונדון סיטי', 'london city']),
  P('BCN', 'ברצלונה', 'ספרד', 'Barcelona', ['ברצלונה', 'barcelona']),
  P('MAD', 'מדריד', 'ספרד', 'Madrid', ['מדריד', 'madrid']),
  P('AMS', 'אמסטרדם', 'הולנד', 'Amsterdam', ['אמסטרדם', 'amsterdam']),
  P('BER', 'ברלין', 'גרמניה', 'Berlin', ['ברלין', 'berlin']),
  P('MUC', 'מינכן', 'גרמניה', 'Munich', ['מינכן', 'munich', 'munchen']),
  P('PRG', 'פראג', 'צ׳כיה', 'Prague', ['פראג', 'prague', 'praha']),
  P('BUD', 'בודפשט', 'הונגריה', 'Budapest', ['בודפשט', 'budapest']),
  P('VIE', 'וינה', 'אוסטריה', 'Vienna', ['וינה', 'vienna', 'wien']),
  P('ATH', 'אתונה', 'יוון', 'Athens', ['אתונה', 'athens']),
  P('HER', 'כרתים', 'הרקליון, יוון', 'Crete (Heraklion)', ['כרתים', 'הרקליון', 'crete', 'heraklion'], { label: 'כרתים (הרקליון), יוון' }),
  P('RHO', 'רודוס', 'יוון', 'Rhodes', ['רודוס', 'rhodes']),
  P('MIL', 'מילאנו', 'כל שדות התעופה', 'Milan', ['מילאנו', 'milan', 'milano'], { type: 'c', airports: ['MXP', 'LIN', 'BGY'], label: 'מילאנו – כל שדות התעופה' }),
  A('MXP', MIL, 'מלפנסה', 'Malpensa', ['מלפנסה', 'malpensa']),
  A('LIN', MIL, 'לינאטה', 'Linate', ['לינאטה', 'linate']),
  A('BGY', MIL, 'ברגמו', 'Bergamo', ['ברגמו', 'bergamo'], { label: 'מילאנו – ברגמו (BGY), כ־50 ק״מ מהעיר', sub: 'מילאנו · כ־50 ק״מ מהעיר' }),
  P('VCE', 'ונציה', 'איטליה', 'Venice', ['ונציה', 'venice', 'venezia']),
  P('NAP', 'נאפולי', 'איטליה', 'Naples', ['נאפולי', 'naples', 'napoli']),
  P('NCE', 'ניס', 'צרפת', 'Nice', ['ניס', 'nice']),
  P('LIS', 'ליסבון', 'פורטוגל', 'Lisbon', ['ליסבון', 'lisbon', 'lisboa']),
  P('ZRH', 'ציריך', 'שווייץ', 'Zurich', ['ציריך', 'zurich']),
  P('LCA', 'לרנקה', 'קפריסין', 'Larnaca', ['לרנקה', 'larnaca']),
  P('PFO', 'פאפוס', 'קפריסין', 'Paphos', ['פאפוס', 'paphos']),
  P('TBS', 'טביליסי', 'גאורגיה', 'Tbilisi', ['טביליסי', 'tbilisi']),
  P('BUS', 'בטומי', 'גאורגיה', 'Batumi', ['בטומי', 'batumi']),
  P('IST', 'איסטנבול', 'כל שדות התעופה', 'Istanbul', ['איסטנבול', 'istanbul'], { type: 'c', airports: ['IST', 'SAW'], label: 'איסטנבול – כל שדות התעופה' }),
  A('SAW', ISTC, 'סביחה גוקצ׳ן', 'Sabiha Gokcen', ['סביחה', 'sabiha', 'sabiha gokcen']),
  P('AYT', 'אנטליה', 'טורקיה', 'Antalya', ['אנטליה', 'antalya']),
  P('OTP', 'בוקרשט', 'רומניה', 'Bucharest', ['בוקרשט', 'bucharest']),
  P('SOF', 'סופיה', 'בולגריה', 'Sofia', ['סופיה', 'sofia']),
  P('KRK', 'קרקוב', 'פולין', 'Krakow', ['קרקוב', 'krakow', 'cracow']),
  P('WAW', 'ורשה', 'פולין', 'Warsaw', ['ורשה', 'וורשה', 'warsaw']),
  P('BEG', 'בלגרד', 'סרביה', 'Belgrade', ['בלגרד', 'belgrade']),
  P('AUH', 'אבו דאבי', 'איחוד האמירויות', 'Abu Dhabi', ['אבו דאבי', 'abu dhabi']),
  P('NYC', 'ניו יורק', 'כל שדות התעופה', 'New York', ['ניו יורק', 'new york', 'nyc'], { type: 'c', airports: ['JFK', 'EWR', 'LGA'], label: 'ניו יורק – כל שדות התעופה' }),
  A('JFK', NYC, 'ג׳ון פ. קנדי', 'John F. Kennedy', ['קנדי', 'kennedy'], { label: 'ניו יורק – JFK' }),
  A('EWR', NYC, 'ניוארק', 'Newark', ['ניוארק', 'newark']),
  A('LGA', NYC, 'לה גוארדיה', 'LaGuardia', ['לה גוארדיה', 'laguardia']),
  P('BKK', 'בנגקוק', 'תאילנד', 'Bangkok', ['בנגקוק', 'bangkok']),
  P('HKT', 'פוקט', 'תאילנד', 'Phuket', ['פוקט', 'phuket']),
  // Added 2026-11: more popular routes, so their names and codes resolve in both languages.
  P('FRA', 'פרנקפורט', 'גרמניה', 'Frankfurt', ['פרנקפורט', 'frankfurt']),
  P('BRU', 'בריסל', 'בלגיה', 'Brussels', ['בריסל', 'brussels', 'bruxelles']),
  P('CPH', 'קופנהגן', 'דנמרק', 'Copenhagen', ['קופנהגן', 'copenhagen']),
  P('DUB', 'דבלין', 'אירלנד', 'Dublin', ['דבלין', 'dublin']),
  P('GVA', 'ז׳נבה', 'שווייץ', 'Geneva', ['ז\'נבה', 'ג\'נבה', 'זנבה', 'geneva', 'geneve']),
  P('OPO', 'פורטו', 'פורטוגל', 'Porto', ['פורטו', 'porto', 'oporto']),
  P('AGP', 'מלאגה', 'ספרד', 'Malaga', ['מלאגה', 'malaga']),
  P('PMI', 'פלמה דה מיורקה', 'ספרד', 'Palma de Mallorca', ['פלמה דה מיורקה', 'מיורקה', 'palma', 'mallorca', 'majorca']),
  P('SKG', 'סלוניקי', 'יוון', 'Thessaloniki', ['סלוניקי', 'תסלוניקי', 'thessaloniki']),
  P('DBV', 'דוברובניק', 'קרואטיה', 'Dubrovnik', ['דוברובניק', 'dubrovnik']),
  P('TIV', 'טיבאט', 'מונטנגרו', 'Tivat', ['טיבאט', 'tivat']),
  P('EVN', 'ירוואן', 'ארמניה', 'Yerevan', ['ירוואן', 'yerevan']),
  P('GYD', 'באקו', 'אזרבייג׳ן', 'Baku', ['באקו', 'baku']),
  P('RIX', 'ריגה', 'לטביה', 'Riga', ['ריגה', 'riga']),
  P('LAX', 'לוס אנג׳לס', 'ארצות הברית', 'Los Angeles', ['לוס אנג\'לס', 'לוס אנגלס', 'los angeles']),
  P('MIA', 'מיאמי', 'ארצות הברית', 'Miami', ['מיאמי', 'miami'])
];

export const countries = [
  { names: ['יוון', 'greece'], codes: ['JTR', 'ATH', 'HER', 'RHO'] },
  { names: ['איטליה', 'italy'], codes: ['FCO', 'MIL', 'VCE', 'NAP'] },
  { names: ['ספרד', 'spain'], codes: ['BCN', 'MAD'] },
  { names: ['צרפת', 'france'], codes: ['PAR', 'NCE'] },
  { names: ['אנגליה', 'בריטניה', 'england', 'uk'], codes: ['LON'] },
  { names: ['גרמניה', 'germany'], codes: ['BER', 'MUC'] },
  { names: ['קפריסין', 'cyprus'], codes: ['LCA', 'PFO'] },
  { names: ['גאורגיה', 'גרוזיה', 'georgia'], codes: ['TBS', 'BUS'] },
  { names: ['טורקיה', 'turkey'], codes: ['IST', 'AYT'] },
  { names: ['תאילנד', 'thailand'], codes: ['BKK', 'HKT'] },
  { names: ['איחוד האמירויות', 'האמירויות', 'emirates', 'uae'], codes: ['DXB', 'AUH'] },
  { names: ['הולנד', 'netherlands', 'holland'], codes: ['AMS'] },
  { names: ['פורטוגל', 'portugal'], codes: ['LIS'] },
  { names: ['ארצות הברית', 'ארה"ב', 'ארהב', 'אמריקה', 'usa'], codes: ['NYC'] },
  { names: ['בלגיה', 'belgium'], codes: ['BRU'] },
  { names: ['דנמרק', 'denmark'], codes: ['CPH'] },
  { names: ['אירלנד', 'ireland'], codes: ['DUB'] },
  { names: ['קרואטיה', 'croatia'], codes: ['DBV'] },
  { names: ['מונטנגרו', 'montenegro'], codes: ['TIV'] },
  { names: ['ארמניה', 'armenia'], codes: ['EVN'] },
  { names: ['אזרבייג\'ן', 'azerbaijan'], codes: ['GYD'] },
  { names: ['לטביה', 'latvia'], codes: ['RIX'] }
];

const byCode = new Map(places.map(place => [place.code, place]));
export const placeByCode = code => byCode.get(String(code || '').toUpperCase()) || null;
export const placeType = code => byCode.get(code)?.type || 'a';

export const normalizePlace = value => String(value || '').normalize('NFKC').toLowerCase()
  .replace(/[״"׳'`’]/g, '').replace(/[()]/g, ' ').replace(/[–—־-]/g, ' ').replace(/\s+/g, ' ').trim();

// What the field shows once a place is chosen: "לונדון · LON", "הית׳רו · LHR".
export const placeText = place => (place ? `${place.name || place.label} · ${place.code}` : '');

// Every form a place answers to, normalized once.
const forms = new Map(places.map(place => [place, [...new Set([place.name, place.en, place.label, ...place.names].filter(Boolean).map(normalizePlace))]]));

// The label, the short name, English or Hebrew, "name · CODE" as the field shows it, or an IATA code.
export function resolvePlace(input) {
  const raw = String(input || '').trim();
  const tagged = /(?:·|\(|\s)\s*([A-Za-z]{3})\)?\s*$/.exec(raw);
  if (tagged && byCode.has(tagged[1].toUpperCase())) return byCode.get(tagged[1].toUpperCase());
  if (/^[a-z]{3}$/i.test(raw)) {
    // A known code first; then an English name that happens to be 3 letters ("nyc"); else trust the code as typed.
    return byCode.get(raw.toUpperCase()) || places.find(place => forms.get(place).includes(raw.toLowerCase())) || { label: raw.toUpperCase(), name: raw.toUpperCase(), code: raw.toUpperCase() };
  }
  const value = normalizePlace(raw), head = normalizePlace(raw.split(/[,·]/)[0]);
  if (!value) return null;
  return places.find(place => forms.get(place).includes(value)) || places.find(place => forms.get(place).includes(head)) || null;
}

// Ranked matches for the autocomplete, Hebrew or English, by name or code; a city brings its airports right after it.
export function searchPlaces(input, { limit = 8, exclude = '' } = {}) {
  const value = normalizePlace(input), code = /^[a-z]{2,3}$/.test(value) ? value.toUpperCase() : '';
  if (!value) return [];
  const rank = place => {
    const list = forms.get(place);
    if (code && place.code === code) return 0;
    if (list.includes(value)) return 1;
    if (list.some(form => form.startsWith(value))) return 2;
    if (code && place.code.startsWith(code)) return 3;
    if (list.some(form => form.split(' ').some(word => word.startsWith(value)))) return 4;
    if (value.length >= 3 && list.some(form => form.includes(value))) return 5;
    return 9;
  };
  const scored = places.map((place, order) => ({ place, order, rank: rank(place) })).filter(item => item.rank < 9 && item.place.code !== exclude)
    .sort((a, b) => a.rank - b.rank || (a.place.city ? 1 : 0) - (b.place.city ? 1 : 0) || a.order - b.order);
  const out = [];
  for (const { place } of scored) {
    if (out.includes(place)) continue;
    out.push(place);
    if (place.type === 'c') for (const airport of places.filter(p => p.city === place.code && p.code !== exclude)) if (!out.includes(airport)) out.push(airport);
  }
  return out.slice(0, limit);
}

export function placeSuggestions(input, limit = 3) {
  return normalizePlace(input).length < 2 ? [] : searchPlaces(input, { limit });
}

// What the field offers before anything is typed.
export const POPULAR_DESTINATIONS = ['LON', 'PAR', 'FCO', 'ATH', 'BCN', 'LCA', 'DXB', 'NYC'];
export const POPULAR_ORIGINS = ['TLV', 'ETM', 'HFA'];

// English page (spec 21): the fields the UI shows switch to English once, after every Hebrew/English form above is
// indexed, so typing Hebrew or English still resolves and every consumer (field, results, saved flights) shows English.
// The Hebrew originals stay on place.he.
const SUB_EN = { 'נתב״ג': 'Ben Gurion', 'שדה רמון': 'Ramon Airport', 'ישראל': 'Israel', 'איטליה': 'Italy', 'יוון': 'Greece', 'מאלה': 'Malé', 'איחוד האמירויות': 'UAE',
  'כל שדות התעופה': 'All airports', 'ספרד': 'Spain', 'הולנד': 'Netherlands', 'גרמניה': 'Germany', 'צ׳כיה': 'Czechia', 'הונגריה': 'Hungary', 'אוסטריה': 'Austria',
  'הרקליון, יוון': 'Heraklion, Greece', 'צרפת': 'France', 'פורטוגל': 'Portugal', 'שווייץ': 'Switzerland', 'קפריסין': 'Cyprus', 'גאורגיה': 'Georgia', 'טורקיה': 'Turkey',
  'רומניה': 'Romania', 'בולגריה': 'Bulgaria', 'פולין': 'Poland', 'סרביה': 'Serbia', 'תאילנד': 'Thailand', 'בלגיה': 'Belgium', 'דנמרק': 'Denmark', 'אירלנד': 'Ireland',
  'קרואטיה': 'Croatia', 'מונטנגרו': 'Montenegro', 'ארמניה': 'Armenia', 'אזרבייג׳ן': 'Azerbaijan', 'לטביה': 'Latvia', 'ארצות הברית': 'USA', 'בריטניה': 'UK', 'אנגליה': 'England',
  'המלדיביים': 'The Maldives', 'האיים המלדיביים': 'The Maldives' };
const LABEL_EN = { TLV: 'Tel Aviv (Ben Gurion)', ETM: 'Ramon, Eilat', HFA: 'Haifa', MLE: 'The Maldives', HER: 'Crete (Heraklion), Greece' };
const FAR_EN = { BVA: '~85 km from the city', BGY: '~50 km from the city' };
export const countryNameEn = (name) => SUB_EN[name] || name;
export function englishPlace(place) {
  const city = place.city && byCode.get(place.city), far = FAR_EN[place.code];
  if (city) return { name: place.en, sub: city.en +(far ? ` · ${far}` : ''), label: `${city.en} – ${place.en} (${place.code})${far ? `, ${far}` : ''}` };
  const sub = SUB_EN[place.sub] || SUB_EN[place.he?.sub] || place.sub;
  return { name: place.en, sub, label: LABEL_EN[place.code] || (place.type === 'c' ? `${place.en} – all airports` : `${place.en}, ${sub}`) };
}
if (lang === 'en') for (const place of places) {
  const english = englishPlace(place); place.he = { name: place.name, sub: place.sub, label: place.label }; Object.assign(place, english);
  // The English label/name the field shows ("Tel Aviv (Ben Gurion)") must resolve back to the place too.
  forms.set(place, [...new Set([...forms.get(place), ...[english.name, english.label, english.label.split(/[,·]/)[0]].map(normalizePlace)])]);
}
