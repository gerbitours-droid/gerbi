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
  { label: 'פריז, צרפת', code: 'CDG', names: ['פריז', 'פאריז', 'paris'] },
  { label: 'לונדון, בריטניה', code: 'LHR', names: ['לונדון', 'london'] },
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
  { label: 'מילאנו, איטליה', code: 'MXP', names: ['מילאנו', 'milan', 'milano'] },
  { label: 'ונציה, איטליה', code: 'VCE', names: ['ונציה', 'venice'] },
  { label: 'נאפולי, איטליה', code: 'NAP', names: ['נאפולי', 'naples'] },
  { label: 'ניס, צרפת', code: 'NCE', names: ['ניס', 'nice'] },
  { label: 'ליסבון, פורטוגל', code: 'LIS', names: ['ליסבון', 'lisbon'] },
  { label: 'ציריך, שווייץ', code: 'ZRH', names: ['ציריך', 'zurich'] },
  { label: 'לרנקה, קפריסין', code: 'LCA', names: ['לרנקה', 'קפריסין', 'larnaca', 'cyprus'] },
  { label: 'פאפוס, קפריסין', code: 'PFO', names: ['פאפוס', 'paphos'] },
  { label: 'טביליסי, גאורגיה', code: 'TBS', names: ['טביליסי', 'tbilisi'] },
  { label: 'בטומי, גאורגיה', code: 'BUS', names: ['בטומי', 'batumi'] },
  { label: 'איסטנבול, טורקיה', code: 'IST', names: ['איסטנבול', 'istanbul'] },
  { label: 'אנטליה, טורקיה', code: 'AYT', names: ['אנטליה', 'antalya'] },
  { label: 'בוקרשט, רומניה', code: 'OTP', names: ['בוקרשט', 'bucharest'] },
  { label: 'סופיה, בולגריה', code: 'SOF', names: ['סופיה', 'sofia'] },
  { label: 'קרקוב, פולין', code: 'KRK', names: ['קרקוב', 'krakow'] },
  { label: 'ורשה, פולין', code: 'WAW', names: ['ורשה', 'וורשה', 'warsaw'] },
  { label: 'בלגרד, סרביה', code: 'BEG', names: ['בלגרד', 'belgrade'] },
  { label: 'אבו דאבי, איחוד האמירויות', code: 'AUH', names: ['אבו דאבי', 'abu dhabi'] },
  { label: 'ניו יורק, ארה״ב', code: 'JFK', names: ['ניו יורק', 'new york', 'nyc'] },
  { label: 'בנגקוק, תאילנד', code: 'BKK', names: ['בנגקוק', 'bangkok', 'תאילנד', 'thailand'] },
  { label: 'פוקט, תאילנד', code: 'HKT', names: ['פוקט', 'phuket'] }
];

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
