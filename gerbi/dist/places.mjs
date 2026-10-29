// Flight destinations the search field understands: label shown to the traveler, the airport code sent to the
// supplier (kept apart from the label), and short Hebrew/English names people actually type. `trip` links the four
// demo destinations. ponytail: a curated list of popular routes from Israel; a supplier airport lookup replaces it
// once Volero's location endpoint is in the contract.
export const places = [
  // Home airports: valid as origin or destination, never read as a holiday wish by the planner.
  { label: 'תל אביב (נתב״ג)', code: 'TLV', home: true, names: ['תל אביב', 'נתבג', 'בן גוריון', 'tel aviv', 'ben gurion'] },
  { label: 'רמון, אילת', code: 'ETM', home: true, names: ['רמון', 'אילת', 'ramon', 'eilat'] },
  { label: 'חיפה', code: 'HFA', home: true, names: ['חיפה', 'haifa'] },
  { label: 'רומא, איטליה', code: 'FCO', trip: 'rome', names: ['רומא', 'rome', 'roma'] },
  { label: 'סנטוריני, יוון', code: 'JTR', trip: 'santorini', names: ['סנטוריני', 'santorini', 'thira'] },
  { label: 'האיים המלדיביים', code: 'MLE', trip: 'maldives', names: ['מלדיביים', 'המלדיביים', 'מלדיבים', 'האיים המלדיביים', 'מאלה', 'maldives', 'male'] },
  { label: 'דובאי, איחוד האמירויות', code: 'DXB', trip: 'dubai', names: ['דובאי', 'dubai'] },
  { label: 'פריז – כל שדות התעופה', code: 'PAR', type: 'c', airports: ['CDG', 'ORY', 'BVA'], names: ['פריז', 'פאריז', 'paris'] },
  { label: 'פריז – שארל דה גול (CDG)', code: 'CDG', city: 'PAR', names: ['שארל דה גול', 'charles de gaulle'] },
  { label: 'פריז – אורלי (ORY)', code: 'ORY', city: 'PAR', names: ['אורלי', 'orly'] },
  { label: 'פריז – בובה (BVA), כ־85 ק״מ מהעיר', code: 'BVA', city: 'PAR', names: ['בובה', 'beauvais'] },
  { label: 'לונדון – כל שדות התעופה', code: 'LON', type: 'c', airports: ['LHR', 'LGW', 'LTN', 'STN', 'LCY'], names: ['לונדון', 'london'] },
  { label: 'לונדון – הית׳רו (LHR)', code: 'LHR', city: 'LON', names: ['הית\'רו', 'היתרו', 'heathrow'] },
  { label: 'לונדון – גטוויק (LGW)', code: 'LGW', city: 'LON', names: ['גטוויק', 'gatwick'] },
  { label: 'לונדון – לוטון (LTN)', code: 'LTN', city: 'LON', names: ['לוטון', 'luton'] },
  { label: 'לונדון – סטנסטד (STN)', code: 'STN', city: 'LON', names: ['סטנסטד', 'stansted'] },
  { label: 'לונדון – סיטי (LCY)', code: 'LCY', city: 'LON', names: ['לונדון סיטי', 'london city'] },
  { label: 'ברצלונה, ספרד', code: 'BCN', names: ['ברצלונה', 'barcelona'] },
  { label: 'מדריד, ספרד', code: 'MAD', names: ['מדריד', 'madrid'] },
  { label: 'אמסטרדם, הולנד', code: 'AMS', names: ['אמסטרדם', 'amsterdam'] },
  { label: 'ברלין, גרמניה', code: 'BER', names: ['ברלין', 'berlin'] },
  { label: 'מינכן, גרמניה', code: 'MUC', names: ['מינכן', 'munich'] },
  { label: 'פראג, צ׳כיה', code: 'PRG', names: ['פראג', 'prague'] },
  { label: 'בודפשט, הונגריה', code: 'BUD', names: ['בודפשט', 'budapest'] },
  { label: 'וינה, אוסטריה', code: 'VIE', names: ['וינה', 'vienna'] },
  { label: 'אתונה, יוון', code: 'ATH', names: ['אתונה', 'athens'] },
  { label: 'כרתים (הרקליון), יוון', code: 'HER', names: ['כרתים', 'הרקליון', 'crete', 'heraklion'] },
  { label: 'רודוס, יוון', code: 'RHO', names: ['רודוס', 'rhodes'] },
  { label: 'מילאנו – כל שדות התעופה', code: 'MIL', type: 'c', airports: ['MXP', 'LIN', 'BGY'], names: ['מילאנו', 'milan', 'milano'] },
  { label: 'מילאנו – מלפנסה (MXP)', code: 'MXP', city: 'MIL', names: ['מלפנסה', 'malpensa'] },
  { label: 'מילאנו – לינאטה (LIN)', code: 'LIN', city: 'MIL', names: ['לינאטה', 'linate'] },
  { label: 'מילאנו – ברגמו (BGY), כ־50 ק״מ מהעיר', code: 'BGY', city: 'MIL', names: ['ברגמו', 'bergamo'] },
  { label: 'ונציה, איטליה', code: 'VCE', names: ['ונציה', 'venice'] },
  { label: 'נאפולי, איטליה', code: 'NAP', names: ['נאפולי', 'naples'] },
  { label: 'ניס, צרפת', code: 'NCE', names: ['ניס', 'nice'] },
  { label: 'ליסבון, פורטוגל', code: 'LIS', names: ['ליסבון', 'lisbon'] },
  { label: 'ציריך, שווייץ', code: 'ZRH', names: ['ציריך', 'zurich'] },
  { label: 'לרנקה, קפריסין', code: 'LCA', names: ['לרנקה', 'larnaca'] },
  { label: 'פאפוס, קפריסין', code: 'PFO', names: ['פאפוס', 'paphos'] },
  { label: 'טביליסי, גאורגיה', code: 'TBS', names: ['טביליסי', 'tbilisi'] },
  { label: 'בטומי, גאורגיה', code: 'BUS', names: ['בטומי', 'batumi'] },
  { label: 'איסטנבול – כל שדות התעופה', code: 'IST', type: 'c', airports: ['IST', 'SAW'], names: ['איסטנבול', 'istanbul'] },
  { label: 'איסטנבול – סביחה גוקצ׳ן (SAW)', code: 'SAW', city: 'IST', names: ['סביחה', 'sabiha'] },
  { label: 'אנטליה, טורקיה', code: 'AYT', names: ['אנטליה', 'antalya'] },
  { label: 'בוקרשט, רומניה', code: 'OTP', names: ['בוקרשט', 'bucharest'] },
  { label: 'סופיה, בולגריה', code: 'SOF', names: ['סופיה', 'sofia'] },
  { label: 'קרקוב, פולין', code: 'KRK', names: ['קרקוב', 'krakow'] },
  { label: 'ורשה, פולין', code: 'WAW', names: ['ורשה', 'וורשה', 'warsaw'] },
  { label: 'בלגרד, סרביה', code: 'BEG', names: ['בלגרד', 'belgrade'] },
  { label: 'אבו דאבי, איחוד האמירויות', code: 'AUH', names: ['אבו דאבי', 'abu dhabi'] },
  { label: 'ניו יורק – כל שדות התעופה', code: 'NYC', type: 'c', airports: ['JFK', 'EWR', 'LGA'], names: ['ניו יורק', 'new york', 'nyc'] },
  { label: 'ניו יורק – JFK', code: 'JFK', city: 'NYC', names: ['קנדי', 'kennedy'] },
  { label: 'ניו יורק – ניוארק (EWR)', code: 'EWR', city: 'NYC', names: ['ניוארק', 'newark'] },
  { label: 'ניו יורק – לה גוארדיה (LGA)', code: 'LGA', city: 'NYC', names: ['לה גוארדיה', 'laguardia'] },
  { label: 'בנגקוק, תאילנד', code: 'BKK', names: ['בנגקוק', 'bangkok'] },
  { label: 'פוקט, תאילנד', code: 'HKT', names: ['פוקט', 'phuket'] }
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
  { names: ['הולנד', 'netherlands'], codes: ['AMS'] },
  { names: ['פורטוגל', 'portugal'], codes: ['LIS'] },
  { names: ['ארצות הברית', 'ארה"ב', 'ארהב', 'אמריקה', 'usa'], codes: ['NYC'] }
];

export const placeType = code => places.find(place => place.code === code)?.type || 'a';

export const normalizePlace = value => String(value || '').normalize('NFKC').toLowerCase()
  .replace(/[״"׳']/g, '').replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();

// The label, any short name, the name before the comma ("רומא" from "רומא, איטליה") or an IATA code.
export function resolvePlace(input) {
  const raw = String(input || '').trim();
  if (/^[a-z]{3}$/i.test(raw)) return places.find(place => place.code === raw.toUpperCase()) || { label: raw.toUpperCase(), code: raw.toUpperCase() };
  const value = normalizePlace(raw), head = normalizePlace(raw.split(',')[0]);
  return places.find(place => normalizePlace(place.label) === value || place.names.some(name => name === value || name === head)) || null;
}

export function placeSuggestions(input, limit = 3) {
  const value = normalizePlace(input);
  if (value.length < 2) return [];
  return places.filter(place => place.names.some(name => name.startsWith(value) || name.includes(value))).slice(0, limit);
}
