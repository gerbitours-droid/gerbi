// Gerbi's free-text understanding: Hebrew request → structured brief, the facts it understood (each with the words it
// came from, so the traveler can correct it), the next question worth asking, and a live flight search when the
// request is concrete enough. Deterministic rules shared by the browser and the server – no model call, no guessing:
// anything ambiguous becomes a question, anything assumed is said out loud.
import { places, countries, resolvePlace, countryNameEn } from './places.mjs';
import { t, lang, fmtDate } from './i18n.mjs';

const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
const MONTH_ALIASES = { מרס: 'מרץ' };
const HOLIDAYS = { פסח: 'אפריל', סוכות: 'אוקטובר', 'ראש השנה': 'ספטמבר', חנוכה: 'דצמבר', שבועות: 'יוני' };
const SEASONS = { קיץ: 'יולי', חורף: 'ינואר', אביב: 'אפריל', סתיו: 'אוקטובר' };
const NUMBER_WORDS = { שניים: 2, שתיים: 2, שני: 2, שתי: 2, שלוש: 3, שלושה: 3, שלושת: 3, ארבע: 4, ארבעה: 4, ארבעת: 4,
  חמש: 5, חמישה: 5, חמשת: 5, שש: 6, שישה: 6, ששת: 6, שבע: 7, שבעה: 7, שבעת: 7, שמונה: 8, שמונת: 8, תשע: 9, תשעה: 9, תשעת: 9, עשר: 10, עשרה: 10, עשרת: 10 };
const CURRENCIES = [[/₪|ש"ח|שח|שקל(?:ים)?|nis|ils/, 'ILS'], [/\$|דולר(?:ים)?|usd/, 'USD'], [/€|יורו|eur/, 'EUR']];
const NEGATIONS = new Set(['לא', 'בלי', 'ללא', 'ולא', 'ובלי', 'וללא', 'מלבד', 'חוץ', 'not', 'no', 'without', 'except', 'excluding', 'avoid', "don't", 'dont', 'never']);
const CARRIERS = [['אל על', 'el al'], ['ישראייר', 'israir'], ['ארקיע', 'arkia'], ['וויז', 'wizz'], ['ריינאייר', 'ryanair'], ['איזיג׳ט', 'easyjet'], ['לופטהנזה', 'lufthansa'], ['טורקיש', 'turkish'], ['אג׳יאן', 'aegean']];

export function normalize(text = '') {
  return String(text).normalize('NFKC').replace(/[֑-ׇ]/g, '').replace(/[״”“]/g, '"').replace(/[׳’‘`]/g, "'")
    .replace(/[־–—]/g, '-').toLowerCase().replace(/\s+/g, ' ').trim();
}
// Hebrew number words → digits ("חמישה לילות" → "5 לילות", "15 אלף" → "15000"); the original text keeps the evidence.
function numerals(text) {
  let out = text.replace(/(^|[\s(-])(\S+)(?=[\s,.)?!-]|$)/g, (all, lead, word) => {
    const stripped = word.replace(/^[וה]/, '');
    return NUMBER_WORDS[word] ? lead + NUMBER_WORDS[word] : NUMBER_WORDS[stripped] && /^[וה]/.test(word) ? lead + NUMBER_WORDS[stripped] : all;
  });
  out = out.replace(/(\d+(?:\.\d+)?)\s*(?:אלף|אלפים|k)(?![א-ת])/g, (_, n) => String(Math.round(Number(n) * 1000))).replace(/(^|\s)אלפיים(?=\s|$)/g, '$12000').replace(/(^|\s)אלף(?=\s|₪|ש|$)/g, '$11000');
  return out.replace(/(\d),(\d{3})/g, '$1$2');
}
const words = text => text.replace(/[^\p{L}\p{N}\s'"]/gu, ' ').split(/\s+/).filter(Boolean);
// Words with the clause they belong to: a comma, period or "אבל" ends the reach of a negation.
const clauseWords = text => text.split(/[,.;!?]|\sאבל\s|\sbut\s/).flatMap((clause, c) => words(clause).map(word => ({ word, c })));
const NEGATION_BRIDGE = new Set(['רוצים', 'רוצה', 'את', 'לטוס', 'טיסה', 'טיסות', 'לנסוע', 'אל', 'דרך', 'ממש', 'אפילו', 'ל', 'מ', 'to', 'fly', 'flying', 'go', 'going', 'travel', 'visit', 'want', 'really', 'even', 'in', 'via']);
const iso = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const addDays = (value, days) => { const date = new Date(value + 'T12:00:00Z'); date.setUTCDate(date.getUTCDate() + days); return date.toISOString().slice(0, 10); };
const nightsBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
// The next occurrence of day/month on or after today (a June trip asked for in November is next year's June).
function nextDate(day, month, today, year) {
  if (year) return iso(year < 100 ? 2000 + year : year, month, day);
  const [y, m, d] = today.split('-').map(Number);
  return iso(month < m || (month === m && day < d) ? y + 1 : y, month, day);
}
const valid = value => { const date = new Date(value + 'T12:00:00Z'); return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value; };

function extractDates(text, today) {
  const monthPattern = MONTHS.concat(Object.keys(MONTH_ALIASES)).join('|');
  const monthIndex = name => MONTHS.indexOf(MONTH_ALIASES[name] || name) + 1;
  // "יציאה 2 בפברואר וחזרה 6 בפברואר", "28 ביוני עד 3 ביולי"
  let full = text.match(new RegExp(`(?<!\\d)(\\d{1,2})\\s+(?:ב|ל)?(${monthPattern})(?:\\s+(\\d{4}))?,?\\s+(?:ו?(?:חזרה|חוזרים|עד|ועד)|-)\\s*(?:ב|ה)?-?\\s*(\\d{1,2})\\s+(?:ב|ל)?(${monthPattern})(?:\\s+(\\d{4}))?`));
  if (full) {
    const start = nextDate(+full[1], monthIndex(full[2]), today, full[3] && +full[3]), end = nextDate(+full[4], monthIndex(full[5]), start, full[6] && +full[6]);
    if (valid(start) && valid(end)) return { start, end, month: MONTHS[monthIndex(full[2]) - 1], source: full[0] };
  }
  // "10-15 ביוני", "בין 10 ל-15 ביוני", "מה-10 עד ה-15 ביוני"
  let match = text.match(new RegExp(`(?:בין\\s+|מה?-?\\s*)?ה?-?(?<!\\d)(\\d{1,2})\\s*(?:-|עד|ועד|ל-?)\\s*ה?-?(\\d{1,2})\\s+(?:ב|ל)?(${monthPattern})(?:\\s+(\\d{4}))?`));
  if (match) {
    const month = monthIndex(match[3]), start = nextDate(+match[1], month, today, match[4] && +match[4]);
    const end = nextDate(+match[2], month, start);
    if (valid(start) && valid(end)) return { start, end, month: MONTHS[month - 1], source: match[0] };
  }
  // "3.7-10.7", "מה-3/7 עד ה-10/7", "3/7/27"
  match = text.match(/ה?-?(?<!\d)(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?\s*(?:-|עד|ועד|ל-?)\s*ה?-?(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?/);
  if (match) {
    const start = nextDate(+match[1], +match[2], today, match[3] && +match[3]), end = nextDate(+match[4], +match[5], start, match[6] && +match[6]);
    if (valid(start) && valid(end)) return { start, end, month: MONTHS[+match[2] - 1], source: match[0] };
  }
  // "ב-10 ביוני", "ב-3.7"
  match = text.match(new RegExp(`(?:^|\\s)ב?-?(\\d{1,2})\\s+(?:ב|ל)?(${monthPattern})(?:\\s+(\\d{4}))?`)) || null;
  if (match) { const start = nextDate(+match[1], monthIndex(match[2]), today, match[3] && +match[3]); if (valid(start)) return { start, month: MONTHS[monthIndex(match[2]) - 1], source: match[0].trim() }; }
  match = text.match(/(?:^|\s)ב-?(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?(?=\s|$)/);
  if (match) { const start = nextDate(+match[1], +match[2], today, match[3] && +match[3]); if (valid(start)) return { start, month: MONTHS[+match[2] - 1], source: match[0].trim() }; }
  if (/(?:^|\s)מחר(?=\s|$)/.test(text)) return { start: addDays(today, 1), source: 'מחר' };
  match = text.match(/בעוד\s+(?:(\d+)\s+)?(שבוע(?:יים)?|חודש(?:יים)?|ימים|יום)/);
  if (match) {
    const n = Number(match[1] || 1), unit = match[2];
    const days = unit === 'שבועיים' ? 14 : unit === 'חודשיים' ? 60 : unit.startsWith('שבוע') ? 7 * n : unit.startsWith('חודש') ? 30 * n : n;
    return { start: addDays(today, days), approximate: true, source: match[0] };
  }
  if (/סוף השבוע (?:הזה|הקרוב|הבא)|סופ"ש (?:הזה|הקרוב|הבא)/.test(text)) {
    const weekday = new Date(today + 'T12:00:00Z').getUTCDay(), toThursday = (4 - weekday + 7) % 7 || 7;
    const start = addDays(today, toThursday + (/הבא/.test(text) ? 7 : 0));
    return { start, end: addDays(start, 3), source: text.match(/סו(?:ף השבוע|פ"ש) \S+/)[0] };
  }
  // A holiday needs "ב" or "חג" in front: "3 שבועות" is three weeks, "בשבועות" is the holiday.
  for (const [holiday, month] of Object.entries(HOLIDAYS)) if (new RegExp(`(?:^|\\s)(?:ב|בחג\\s+|חג\\s+)${holiday}(?=\\s|$|[,.])`).test(text)) return { month, holiday, source: holiday };
  match = text.match(new RegExp(`(?:^|\\s)(?:ב|ל|מ)?(${monthPattern})(?=[\\s,.]|$)`));
  if (match) return { month: MONTH_ALIASES[match[1]] || match[1], source: match[1] };
  for (const [season, month] of Object.entries(SEASONS)) if (new RegExp(`(?:^|\\s)ב?${season}(?=\\s|$)`).test(text)) return { month, season, source: season };
  return null;
}

function extractDuration(text) {
  let match = text.match(/(\d+)\s*לילות|לילה אחד/);
  if (match) return { nights: match[1] ? Math.min(30, Math.max(1, +match[1])) : 1, source: match[0] };
  match = text.match(/(\d+)\s*ימים/);
  // People count days including the flights home: "5 ימים" is 4 nights. Said out loud so it can be corrected.
  if (match) return { nights: Math.min(30, Math.max(1, +match[1] - 1)), source: match[0], note: `${match[1]} ימים = ${Math.max(1, +match[1] - 1)} לילות` };
  match = text.match(/(\d+)\s*שבועות/);
  if (match) return { nights: Math.min(30, 7 * +match[1]), source: match[0] };
  if (/שבוע וחצי/.test(text)) return { nights: 10, source: 'שבוע וחצי' };
  if (/שבועיים/.test(text)) return { nights: 14, source: 'שבועיים' };
  if (/(?:^|\s)(?:ל|ב)?שבוע(?=\s|$|[,.])/.test(text) && !/סוף השבוע|בעוד שבוע/.test(text)) return { nights: 7, source: 'שבוע' };
  if (/סופ"?ש|סוף שבוע/.test(text) && !/סוף השבוע (?:הזה|הקרוב|הבא)/.test(text)) return { nights: 3, source: 'סוף שבוע' };
  return null;
}

function extractTravelers(text) {
  const found = {};
  const counted = text.match(/(\d+)\s*(?:ילדים|ילדות|ילד(?=\s|$)|ילדה(?=\s|$)|נכדים)/), single = text.match(/(?:^|\s)(?:ו|עם\s+)?(?:ילד|ילדה)\s+(?:אחד|אחת|1)(?=\s|$|,|ו)/);
  if (counted || single) { found.children = counted ? Math.min(8, +counted[1]) : 1; found.childrenSource = (counted || single)[0].trim(); }
  const infants = text.match(/(\d+)?\s*תינוק(?:ת|ות|ים)?/);
  if (infants) { found.infants = infants[1] ? +infants[1] : 1; found.children = (found.children || 0) + found.infants; }
  const ages = [...text.matchAll(/(?:בן|בת|בני|בנות|בגיל(?:אי)?)\s+(\d{1,2})(?:\s*(?:,\s*)?ו-?\s*(\d{1,2}))?(?:\s*(?:,\s*)?ו-?\s*(\d{1,2}))?(?!\s*(?:לילות|ימים|לילה|₪|שקל))/g)]
    .flatMap(m => m.slice(1).filter(Boolean).map(Number)).filter(age => age < 18);
  if (ages.length) { found.childAges = ages.slice(0, 8); found.children = Math.max(found.children || 0, ages.length); }
  if (/בלי ילדים|ללא ילדים|רק מבוגרים/.test(text)) { found.children = 0; found.childAges = []; found.noChildren = true; }
  let match = text.match(/משפחה של (\d+)/);
  if (match) { const total = +match[1]; found.children = found.children ?? Math.max(0, total - 2); found.adults = Math.max(1, total - found.children); found.adultsSource = match[0]; }
  match = text.match(/(\d+)\s*(?:מבוגרים|מבוגרות)/);
  if (match) { found.adults = +match[1]; found.adultsSource = match[0]; }
  match = !found.adults && text.match(/(?:אנחנו\s+)?(\d+)\s*(?:נוסעים|אנשים|מטיילים|חברים|חברות|חבר'ה)/);
  if (match) { found.adults = Math.max(1, +match[1] - (found.children || 0)); found.adultsSource = match[0]; }
  if (!found.adults && /(?:^|\s)אנחנו (\d+)(?=\s|$|,)/.test(text)) { const total = +text.match(/אנחנו (\d+)/)[1]; found.adults = Math.max(1, total - (found.children || 0)); found.adultsSource = `אנחנו ${total}`; }
  const forParty = text.match(/(?:^|\s)ל(שניים|שלושה|ארבעה|חמישה|שישה|שבעה|שמונה)(?=\s|$|,)/);
  if (!found.adults && forParty) { found.adults = Math.max(1, NUMBER_WORDS[forParty[1]] - (found.children || 0)); found.adultsSource = forParty[0].trim(); }
  if (!found.adults && /(?:^|\s)(?:זוג|שנינו|אני ו(?:אשתי|בעלי|בן הזוג|בת הזוג|החבר|החברה|בן זוגי|בת זוגי)|שני מבוגרים)/.test(text)) { found.adults = 2; found.adultsSource = text.match(/זוג|שנינו|אני ו\S+|שני מבוגרים/)[0]; }
  if (!found.adults && /(?:^|\s)(?:לבד|סולו|רק אני)(?=\s|$|,)/.test(text)) { found.adults = 1; found.adultsSource = 'לבד'; }
  // One parent or grandparent travelling with children, without a partner named.
  const role = text.match(/(?:^|\s)(אבא|אמא|סבא|סבתא|אב|אם)(?=\s|$)/);
  if (!found.adults && role && /(?:^|\s)ו?(?:\d+\s+)?(?:בנים|בנות|בן|בת|נכד|נכדה|נכדים|נכדות|הילדים|ילד|ילדה|ילדים)(?=\s|$)/.test(text) && !/(?:^|\s)ו(?:אבא|אמא|סבא|סבתא)(?=\s|$)/.test(text)) { found.adults = 1; found.adultsSource = role[1]; }
  if ((found.children === undefined || !found.childrenSource) && /(?:^|\s)ו?(?:נכדה|נכד)(?=\s|$)/.test(text)) { found.children = Math.max(found.children || 0, 1); found.childrenSource = 'נכד/ה'; }
  const sons = text.match(/(?:^|\s)ו?(\d+)\s+(?:בנים|בנות|נכדים|נכדות)(?=\s|$)/);
  if (sons && !counted) { found.children = Math.max(found.children || 0, +sons[1]); found.childrenSource = sons[0].trim(); }
  if (!found.children && !found.noChildren && /עם הילדים|עם ילדים|משפחה/.test(text)) found.childrenUnknown = true;
  found.wholeGroup = /חברים|חברות|חבר'ה|אנחנו \d|משפחה של|לבד|סולו|רק אני|\d+\s*(?:נוסעים|אנשים|מטיילים)/.test(found.adultsSource || '');
  if (found.adults) found.adults = Math.min(9, found.adults);
  return found;
}

function extractBudget(text) {
  const currencyOf = value => CURRENCIES.find(([pattern]) => pattern.test(value))?.[1] || null;
  const pattern = /(?:(עד|תקציב(?: של)?|בסביבות|בערך|לא יותר מ-?|מקסימום|כ-)\s*)?(₪|\$|€)?\s*(\d{3,7})\s*(₪|\$|€|ש"ח|שח|שקלים|שקל|דולרים|דולר|יורו|nis|ils|usd|eur)?\s*(לאדם|לנוסע|פר אדם|לכל אחד|לזוג|לכולם|בסך הכל|סה"כ)?/g;
  // The first amount that is marked as money (a keyword or a currency); a bare number such as a year is not a budget.
  const match = [...text.matchAll(pattern)].find(m => m[1] || m[2] || m[4]);
  if (!match) return null;
  const currency = currencyOf(`${match[2] || ''}${match[4] || ''}`) || 'ILS';
  const scope = /לאדם|לנוסע|פר אדם|לכל אחד/.test(match[5] || '') ? 'person' : /לזוג/.test(match[5] || '') ? 'couple' : 'total';
  return { amount: +match[3], currency, scope, ceiling: /עד|לא יותר|מקסימום/.test(match[1] || ''), source: match[0].trim() };
}

// Destinations, countries and origin with Hebrew prefixes: ב/ל (to), מ (from), and negation within two words.
function extractPlaces(text, previous, raw = '') {
  // IATA codes count only when typed in capitals ("TLV", "LHR"), so English words like "bus" or "nap" stay words.
  const codes = new Set((raw.match(/(?<![A-Za-z])[A-Z]{3}(?![A-Za-z])/g) || []).map(code => code.toLowerCase()));
  const namesOf = place => (codes.has(place.code.toLowerCase()) ? [...place.names, place.code.toLowerCase()] : place.names);
  const tagged = clauseWords(text), list = tagged.map(t => t.word), want = new Set(previous.want || []), exclude = new Set(previous.exclude || []);
  const found = [], countryHits = [];
  let only = false, origin = null;
  const matchAt = (i, names) => {
    for (const name of names) {
      const parts = name.split(' '), phrase = parts.length === 1 ? list[i] : list.slice(i, i + parts.length).join(' ');
      if (!phrase) continue;
      if (phrase === name) return '';
      const prefix = phrase.slice(0, phrase.length - name.length);
      if (phrase.endsWith(name) && /^[ובלהמ]{1,2}$/.test(prefix)) return prefix;
    }
    return null;
  };
  list.forEach((word, i) => {
    const negated = NEGATIONS.has(list[i - 1]) || (NEGATIONS.has(list[i - 2]) && tagged[i - 2].c === tagged[i].c && NEGATION_BRIDGE.has(list[i - 1]));
    const fromWord = prefix => (/^ו?מ$/.test(prefix) && list[i - 1] !== 'חוץ') || (!prefix && (list[i - 1] === 'from' || (list[i - 1] === 'of' && list[i - 2] === 'out')));
    const onlyWord = list[i - 1] === 'רק' || list[i - 2] === 'רק' || list[i - 1] === 'only' || list[i - 2] === 'only';
    for (const place of places) {
      const prefix = matchAt(i, namesOf(place));
      if (prefix === null) continue;
      // English words that are also place names ("a nice hotel", "male") count only after to/in/from/visit.
      if (!prefix && AMBIGUOUS_EN.has(word) && !['to', 'in', 'from', 'visit', 'visiting', 'and', 'or'].includes(list[i - 1])) continue;
      if (onlyWord) only = true;
      if (fromWord(prefix)) origin = { code: place.code, source: word };
      // A home airport without "to" is where the trip starts ("מתל אביב", "מאילת", "אנחנו מחיפה").
      else if (place.home) { if (!prefix && !negated && !origin) origin = { code: place.code, source: word }; }
      else found.push({ code: place.code, negated, source: word });
      return;
    }
    for (const country of countries) {
      const prefix = matchAt(i, country.names);
      if (prefix === null) continue;
      if (!prefix && AMBIGUOUS_EN.has(word) && !['to', 'in', 'from', 'visit', 'visiting', 'and', 'or'].includes(list[i - 1])) continue;
      if (onlyWord) only = true;
      countryHits.push({ country, negated, source: word });
      return;
    }
  });
  const airportCities = new Set(found.map(hit => places.find(p => p.code === hit.code)?.city).filter(Boolean));
  for (let i = found.length - 1; i >= 0; i--) if (airportCities.has(found[i].code)) found.splice(i, 1);
  // A newly named place replaces earlier wishes, unless the text adds to them ("גם", "או").
  if (only || (found.some(hit => !hit.negated) && !/(?:^|\s)(?:גם|וגם|או|also|or|too)(?=\s|$)/.test(text))) want.clear();
  for (const { code, negated } of found) { if (negated) { exclude.add(code); want.delete(code); } else { want.add(code); exclude.delete(code); } }
  for (const { country, negated } of countryHits) for (const code of country.codes) { if (negated) { exclude.add(code); want.delete(code); } else if (!found.length) { want.add(code); exclude.delete(code); } }
  // Home airports are where the trip starts, never a holiday wish.
  for (const place of places) if (place.home) want.delete(place.code);
  return { want: [...want], exclude: [...exclude], origin, countries: countryHits.filter(hit => !hit.negated).map(hit => hit.country), sources: [...found, ...countryHits] };
}

const AMBIGUOUS_EN = new Set(['nice', 'male', 'sofia', 'porto', 'palma']);

function extractFlight(text) {
  const flight = {};
  if (/ישיר|בלי עצירות|בלי קונקשן|בלי חיבור|ללא עצירות|ללא קונקשן/.test(text)) flight.stops = '0';
  else if (/עצירה אחת|קונקשן אחד|החלפה אחת/.test(text)) flight.stops = '1';
  if (/לא לקום מוקדם|לא מוקדם|לא בבוקר|טיסת צהריים|אחרי הצהריים/.test(text)) flight.out = ['afternoon', 'evening'];
  else if (/טיסת בוקר|לטוס בבוקר|בבוקר מוקדם/.test(text)) flight.out = ['morning'];
  else if (/טיסת לילה|לטוס בלילה/.test(text)) flight.out = ['night'];
  if (/לחזור בערב|חזרה בערב|חזרה מאוחרת|לחזור מאוחר/.test(text)) flight.back = ['evening'];
  else if (/לחזור אחרי הצהריים|חזרה אחרי הצהריים/.test(text)) flight.back = ['afternoon', 'evening'];
  if (/עם מזוודה|מזוודה כלולה|כולל מזוודה|כבודה כלולה|כולל כבודה/.test(text)) flight.checkedBag = true;
  const carrier = CARRIERS.find(([he, en]) => text.includes(normalize(he)) || text.includes(en));
  if (carrier) flight.carrier = carrier[1];
  if (/כיוון אחד|רק הלוך|בלי חזור|one way/.test(text)) flight.tripType = 'oneway';
  return flight;
}

// ---- English requests (spec 21) ----
// A request with no Hebrew letters is read with these rules; Hebrew (and mixed) text keeps the rules above unchanged.
// Months, holidays and seasons map to the canonical Hebrew values the rest of the app stores (brief.month = 'יוני').
const MONTHS_EN = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const MONTH_SHORT_EN = { jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 };
const EN_MONTH = `(${MONTHS_EN.join('|')}|sept|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\\.?`;
const enMonthIndex = name => MONTHS_EN.indexOf(name) + 1 || MONTH_SHORT_EN[name] || 0;
const HOLIDAYS_EN = [[/passover|pesach/, 'פסח'], [/sukkot|sukkos|succot/, 'סוכות'], [/rosh hashanah?|jewish new year/, 'ראש השנה'], [/hanukkah?|chanukah?|hanuka/, 'חנוכה'], [/shavuot|shavuos/, 'שבועות'], [/christmas/, 'Christmas'], [/easter/, 'Easter']];
const HOLIDAY_MONTH_EN = { Christmas: 'דצמבר', Easter: 'אפריל' };
const SEASONS_EN = [['summer', 'קיץ'], ['winter', 'חורף'], ['spring', 'אביב'], ['autumn', 'סתיו'], ['fall', 'סתיו']];
const NUMBER_WORDS_EN = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, twenty: 20, thirty: 30 };
const isEnglish = raw => /[a-z]{2}/i.test(raw) && !/[֐-׿]/.test(raw);

// "two kids" → "2 kids", "12th" → "12", "5 thousand" → "5000"; "one way" stays words.
function numeralsEn(text) {
  return text.replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|twenty|thirty)\b(?![\s-]*way)/g, (w) => String(NUMBER_WORDS_EN[w]))
    .replace(/\b(\d{1,2})(?:st|nd|rd|th)\b/g, '$1').replace(/\b(\d+)\s*thousand\b/g, (_, n) => String(+n * 1000))
    .replace(/\b(\d+(?:\.\d+)?)k\b/g, (_, n) => String(Math.round(Number(n) * 1000))).replace(/(\d),(\d{3})/g, '$1$2');
}

function extractDatesEn(text, today) {
  const dm = `(?:(\\d{1,2})\\s+(?:of\\s+)?${EN_MONTH}|${EN_MONTH}\\s+(\\d{1,2})(?!\\s*(?:nights?|days?|weeks?|adults?|kids?|children|child|people|persons|travell?ers|passengers|infants?|babies)\\b))(?!\\d)(?:,?\\s+(\\d{4}))?`;
  const read = (m, at) => ({ day: +(m[at] || m[at + 3]), month: enMonthIndex(m[at + 1] || m[at + 2]), year: m[at + 4] && +m[at + 4] });
  const out = (start, end, month, source) => (valid(start) && (!end || valid(end)) ? { start, ...(end ? { end } : {}), month: MONTHS[month - 1], source } : null);
  // "June 10 to June 15", "10 June - 15 July 2027", "from 3 March until 9 March"
  let m = text.match(new RegExp(`${dm}\\s*(?:-|to|until|till|through|and|returning(?: on)?|back(?: on)?|,? back on)\\s*(?:on\\s+)?(?:the\\s+)?${dm}`));
  if (m) {
    const a = read(m, 1), b = read(m, 6), start = nextDate(a.day, a.month, today, a.year);
    const r = out(start, nextDate(b.day, b.month, start, b.year), a.month, m[0]);
    if (r) return r;
  }
  // "10-15 June", "between 10 and 15 June", "from the 3 to the 9 of March"
  m = text.match(new RegExp(`(?<!\\d)(\\d{1,2})\\s*(?:-|to|until|till|and)\\s*(?:the\\s+)?(\\d{1,2})\\s+(?:of\\s+)?${EN_MONTH}(?:,?\\s+(\\d{4}))?`));
  if (m) { const month = enMonthIndex(m[3]), start = nextDate(+m[1], month, today, m[4] && +m[4]); const r = out(start, nextDate(+m[2], month, start), month, m[0]); if (r) return r; }
  // "June 10-15", "June 10 to 15"
  m = text.match(new RegExp(`${EN_MONTH}\\s+(\\d{1,2})\\s*(?:-|to|until|till)\\s*(\\d{1,2})(?![\\d/.])(?:,?\\s+(\\d{4}))?`));
  if (m) { const month = enMonthIndex(m[1]), start = nextDate(+m[2], month, today, m[4] && +m[4]); const r = out(start, nextDate(+m[3], month, start), month, m[0]); if (r) return r; }
  // "3/7-10/7", "3.7 to 10.7" (day/month, as in Israel), ISO "2027-06-12"
  m = text.match(/(?<!\d)(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?\s*(?:-|to|until|till)\s*(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?/);
  if (m) { const start = nextDate(+m[1], +m[2], today, m[3] && +m[3]); const r = out(start, nextDate(+m[4], +m[5], start, m[6] && +m[6]), +m[2], m[0]); if (r) return r; }
  m = text.match(/(\d{4})-(\d{2})-(\d{2})(?:\s*(?:to|until|-)\s*(\d{4})-(\d{2})-(\d{2}))?/);
  if (m) { const r = out(iso(+m[1], +m[2], +m[3]), m[4] ? iso(+m[4], +m[5], +m[6]) : '', +m[2], m[0]); if (r) return r; }
  // "June 12", "12 June", "on the 12th of June"
  m = text.match(new RegExp(dm));
  if (m) { const a = read(m, 1); if (a.month) { const r = out(nextDate(a.day, a.month, today, a.year), '', a.month, m[0]); if (r) return r; } }
  m = text.match(/(?:^|\s)(?:on\s+)?(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?(?=[\s,.]|$)/);
  if (m) { const r = out(nextDate(+m[1], +m[2], today, m[3] && +m[3]), '', +m[2], m[0].trim()); if (r) return r; }
  if (/\btomorrow\b/.test(text)) return { start: addDays(today, 1), source: 'tomorrow' };
  m = text.match(/\bin\s+(?:(\d+)|a|an)\s+(days?|weeks?|months?)\b/) || text.match(/\b(?:(\d+)\s+)?(days?|weeks?|months?) from now\b/);
  if (m) {
    const n = Number(m[1] || 1), unit = m[2];
    return { start: addDays(today, unit.startsWith('week') ? 7 * n : unit.startsWith('month') ? 30 * n : n), approximate: true, source: m[0] };
  }
  if (/\bnext week\b/.test(text)) return { start: addDays(today, 7), approximate: true, source: 'next week' };
  m = text.match(/\b(this|next)\s+weekend\b/);
  if (m) {
    const weekday = new Date(today + 'T12:00:00Z').getUTCDay(), toThursday = (4 - weekday + 7) % 7 || 7;
    const start = addDays(today, toThursday + (m[1] === 'next' ? 7 : 0));
    return { start, end: addDays(start, 3), source: m[0] };
  }
  for (const [pattern, holiday] of HOLIDAYS_EN) { const h = text.match(pattern); if (h) return { month: HOLIDAYS[holiday] || HOLIDAY_MONTH_EN[holiday], holiday, source: h[0] }; }
  if (/\bnext month\b/.test(text)) { const month = Number(today.slice(5, 7)) % 12; return { month: MONTHS[month], source: 'next month' }; }
  // "in June", "early July", "in May" ("may" alone is a verb: it needs in/during/early/mid/late/of before it)
  m = text.match(new RegExp(`(?:^|\\s)(in|during|early|mid|late|of|end of|beginning of|start of)?\\s*${EN_MONTH}(?=[\\s,.!?]|$)`, 'g'));
  for (const hit of m || []) {
    const parts = new RegExp(`(in|during|early|mid|late|of)?\\s*${EN_MONTH}$`).exec(hit.trim());
    if (!parts) continue;
    if ((parts[2] === 'may' || parts[2] === 'march') && !parts[1]) continue;
    return { month: MONTHS[enMonthIndex(parts[2]) - 1], source: parts[2] };
  }
  for (const [season, he] of SEASONS_EN) {
    if (new RegExp(`\\b(?:in|this|next|over|during|for)\\s+(?:the\\s+)?${season}\\b`).test(text) || (season !== 'fall' && new RegExp(`\\b${season}\\b`).test(text)))
      return { month: SEASONS[he], season: he, source: season };
  }
  return null;
}

function extractDurationEn(text) {
  let m = text.match(/(\d+)\s*nights?\b/);
  if (m) return { nights: Math.min(30, Math.max(1, +m[1])), source: m[0] };
  if (/\b(?:a|one) night\b/.test(text)) return { nights: 1, source: 'a night' };
  m = text.match(/(\d+)\s*days?\b/);
  if (m) return { nights: Math.min(30, Math.max(1, +m[1] - 1)), source: m[0], days: +m[1] };
  if (/\b(?:a\s+)?week and a half\b/.test(text)) return { nights: 10, source: 'week and a half' };
  m = text.match(/(\d+)\s*weeks?\b/);
  if (m) return { nights: Math.min(30, 7 * +m[1]), source: m[0] };
  if (/\bfortnight\b/.test(text)) return { nights: 14, source: 'fortnight' };
  if (/\b(?:a|for a|one)\s+week\b/.test(text)) return { nights: 7, source: 'a week' };
  if (/\bweekend\b/.test(text) && !/\b(?:this|next)\s+weekend\b/.test(text)) return { nights: 3, source: 'weekend' };
  return null;
}

function extractTravelersEn(text) {
  const found = {};
  const counted = text.match(/(\d+)\s*(?:kids?|children|child|boys?|girls?|grandkids|grandchildren|grandchild|sons?|daughters?)\b/);
  const single = text.match(/(?:^|\s)(?:a|our|my|with a|and a)\s+(?:kid|child|son|daughter|boy|girl|grandchild|grandson|granddaughter)\b/);
  if (counted || single) { found.children = counted ? Math.min(8, +counted[1]) : 1; found.childrenSource = (counted || single)[0].trim(); }
  const infants = text.match(/(?:(\d+)\s*(?:infants|babies|toddlers)|(?:an?|our|my|1)\s+(?:infant|baby|toddler))\b/);
  if (infants) { found.infants = infants[1] ? +infants[1] : 1; found.children = (found.children || 0) + found.infants; }
  // An age is never a count of nights/days/stars that follows it ("a child aged 8, 4 nights"); "kids 5 and 8" lists ages too.
  const AGE = '(\\d{1,2})(?!\\d)(?!\\s*(?:nights?|days?|weeks?|months?|stars?|hours?|adults?|people)\\b)';
  const ages = [...text.matchAll(new RegExp(`\\b(?:aged?|ages|(?:kids|children|boys|girls|sons|daughters)(?=\\s*\\(?\\s*\\d{1,2}\\s*(?:,|and|&)\\s*\\d))\\s*\\(?\\s*${AGE}(?:\\s*(?:,|and|&)\\s*${AGE})?(?:\\s*(?:,|and|&)\\s*${AGE})?(?:\\s*(?:,|and|&)\\s*${AGE})?`, 'g'))]
    .flatMap(m => m.slice(1).filter(Boolean).map(Number));
  for (const m of text.matchAll(/(\d{1,2})(?:\s*(?:,|and|&)\s*(\d{1,2}))?[\s-]*(?:years?|yrs?)[\s-]*olds?\b/g)) ages.push(...m.slice(1).filter(Boolean).map(Number));
  const kidAges = ages.filter(age => age < 18);
  if (kidAges.length) { found.childAges = kidAges.slice(0, 8); found.children = Math.max(found.children || 0, kidAges.length); }
  if (/\b(?:no|without)\s+(?:kids|children)\b|\badults only\b|\b(?:just|only)\s+adults\b/.test(text)) { found.children = 0; found.childAges = []; found.noChildren = true; }
  let m = text.match(/\bfamily of (\d+)/);
  if (m) { const total = +m[1]; found.children = found.children ?? Math.max(0, total - 2); found.adults = Math.max(1, total - found.children); found.adultsSource = m[0]; }
  m = text.match(/(\d+)\s*(?:adults?|grown[- ]?ups)\b/);
  if (m) { found.adults = +m[1]; found.adultsSource = m[0]; }
  m = !found.adults && (text.match(/(\d+)\s*(?:people|persons|travell?ers|passengers|pax|friends|of us|guys|girls)\b/) || text.match(/\b(?:we are|we're|group of|party of)\s+(\d+)\b/));
  if (m) { found.adults = Math.max(1, +m[1] - (found.children || 0)); found.adultsSource = m[0]; }
  m = !found.adults && text.match(/\bfor\s+(\d)(?=\s*(?:[,.!?]|$|\s+(?:people|persons|to|from|in|on|at|with)\b))/);
  if (m) { found.adults = Math.max(1, +m[1] - (found.children || 0)); found.adultsSource = m[0]; }
  if (!found.adults && /(?:^|\s)(?:a couple|couple|the 2 of us|me and my (?:wife|husband|partner|girlfriend|boyfriend|fiancee?)|my (?:wife|husband|partner|girlfriend|boyfriend|fiancee?) and (?:i|me)|me and (?:the|my) (?:wife|husband)|2 adults)\b/.test(text)) {
    found.adults = 2; found.adultsSource = text.match(/a couple|couple|the 2 of us|me and \S+(?: \S+)?|my \S+ and (?:i|me)/)[0];
  }
  if (!found.adults && /\b(?:solo|alone|just me|only me|by myself|on my own)\b/.test(text)) { found.adults = 1; found.adultsSource = text.match(/solo|alone|just me|only me|by myself|on my own/)[0]; }
  // One parent travelling with the kids: "me and my 2 kids", "mom with 2 children".
  if (!found.adults && /(?:^|\s)(?:i|me|mom|mum|dad|mother|father|grandma|grandpa|grandmother|grandfather)\s+(?:and|with|\+)\s+(?:my\s+|our\s+|the\s+)?(?:\d+\s+)?(?:kids?|children|child|sons?|daughters?|grandkids|grandchildren)\b/.test(text)) {
    found.adults = 1; found.adultsSource = text.match(/(?:i|me|mom|mum|dad|mother|father|grandma|grandpa|grandmother|grandfather)\s+(?:and|with|\+)/)[0];
  }
  if (!found.children && !found.noChildren && /\bwith (?:the |my |our )?(?:kids|children)\b|\bfamily\b/.test(text)) found.childrenUnknown = true;
  found.wholeGroup = /people|persons|travell?ers|passengers|friends|of us|we are|we're|group of|party of|family of|solo|alone|just me|only me|by myself|on my own/.test(found.adultsSource || '');
  if (found.adults) found.adults = Math.min(9, found.adults);
  return found;
}

function extractBudgetEn(text) {
  const pattern = /(?:(up to|under|below|max(?:imum)?|no more than|budget(?: is| of)?|around|about|approx(?:imately)?|roughly)\s*)?(₪|\$|€)?\s*(\d{3,7})\s*(₪|\$|€|nis|ils|shekels?|usd|dollars?|eur|euros?)?\s*(per person|a person|each|pp|per head|per couple|for (?:the )?2 of us|in total|total|for everyone|for all of us)?/g;
  const match = [...text.matchAll(pattern)].find(m => m[1] || m[2] || m[4]);
  if (!match) return null;
  const unit = `${match[2] || ''}${match[4] || ''}`;
  const currency = /\$|usd|dollar/.test(unit) ? 'USD' : /€|eur/.test(unit) ? 'EUR' : 'ILS';
  const scope = /per person|a person|each|pp|per head/.test(match[5] || '') ? 'person' : /per couple|2 of us/.test(match[5] || '') ? 'couple' : 'total';
  return { amount: +match[3], currency, scope, ceiling: /up to|under|below|max|no more/.test(match[1] || ''), source: match[0].trim() };
}

function extractFlightEn(text) {
  const flight = {};
  if (/\b(?:direct|non-?stop|no (?:stops|connections?|layovers?|stopovers?)|without (?:stops|connections?|layovers?|stopovers?))\b/.test(text)) flight.stops = '0';
  else if (/\b(?:1 stop|1 connection|1 layover|1 stopover)\b/.test(text)) flight.stops = '1';
  if (/not (?:too |very )?early|no early (?:flights?|departures?|mornings?)|not in the morning|afternoon (?:flight|departure)|fly (?:out )?in the afternoon|late departure|depart(?:ing)? late|sleep in/.test(text)) flight.out = ['afternoon', 'evening'];
  else if (/morning (?:flight|departure)|fly (?:out )?in the morning|early (?:flight|departure)|depart(?:ing)? early/.test(text)) flight.out = ['morning'];
  else if (/night flight|red[- ]?eye|overnight flight|fly at night/.test(text)) flight.out = ['night'];
  if (/return(?:ing)? (?:in the )?evening|evening return|late return|(?:come|fly|get) back late|return(?:ing)? late|back in the evening/.test(text)) flight.back = ['evening'];
  else if (/return(?:ing)? (?:in the )?afternoon|afternoon return/.test(text)) flight.back = ['afternoon', 'evening'];
  if (/checked (?:bag|baggage|luggage|suitcase)|(?:with|incl(?:uding|uded)?|plus) (?:a |1 )?(?:suitcase|luggage|bag(?:gage)?)|(?:suitcase|luggage|baggage|bag) included/.test(text)) flight.checkedBag = true;
  const carrier = CARRIERS.find(([, en]) => text.includes(en));
  if (carrier) flight.carrier = carrier[1];
  if (/\bone[- ]?way\b|\b1 way\b|\bno return\b/.test(text)) flight.tripType = 'oneway';
  return flight;
}
const CARRIER_EN = { 'el al': 'El Al', israir: 'Israir', arkia: 'Arkia', wizz: 'Wizz Air', ryanair: 'Ryanair', easyjet: 'easyJet', lufthansa: 'Lufthansa', turkish: 'Turkish Airlines', aegean: 'Aegean' };

const STYLE_RULES_EN = [
  ['beach', /\b(?:beach(?:es)?|sea|seaside|pool|swim(?:ming)?|lagoon|sunbathing)\b/, /\b(?:no|not|without)\s+(?:the\s+|a\s+)?(?:beach|sea)\b/],
  ['city', /\b(?:city|cities|food|foodie|culture|cultural|museums?|shopping|urban|restaurants|nightlife)\b/, /\b(?:no|not)\s+(?:a\s+)?city\b/],
  ['relaxation', /\b(?:relax(?:ing|ation)?|rest|restful|quiet|calm|chill(?:ing)?|unwind|peaceful|spa)\b/, /\bnot (?:a )?(?:rest|relaxing)\b/],
  ['family', /\bfamily\b|\bwith (?:the |my |our )?(?:kids|children)\b|\bfor (?:the )?kids\b|\bkid[- ]friendly\b/, /\b(?:no|without)\s+(?:the\s+)?(?:kids|children)\b|\badults only\b/]
];

// Labels in the page language: Hebrew keeps the engine's original wording (names from places.mjs `names[0]`).
const MONTH_EN_LABEL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const HOLIDAY_EN_LABEL = { פסח: 'Passover', סוכות: 'Sukkot', 'ראש השנה': 'Rosh Hashanah', חנוכה: 'Hanukkah', שבועות: 'Shavuot' };
const SEASON_EN_LABEL = { קיץ: 'summer', חורף: 'winter', אביב: 'spring', סתיו: 'autumn' };
// brief.month is stored in Hebrew ('יוני'); this is how to show it.
export const monthLabel = (month, l = lang) => (l === 'en' && MONTHS.includes(month) ? MONTH_EN_LABEL[MONTHS.indexOf(month)] : month || '');
const placeNameIn = (code, l) => { const place = places.find(p => p.code === code); return place ? (l === 'en' ? place.en : place.names[0]) : code; };
const countryNameIn = (country, l) => {
  if (l !== 'en') return country.names[0];
  const en = countryNameEn(country.names[0]);
  if (en !== country.names[0]) return en;
  const ascii = country.names.find(n => /^[a-z ]+$/.test(n)) || country.names[0];
  return ascii.length <= 3 ? ascii.toUpperCase() : ascii.replace(/\b\w/g, c => c.toUpperCase());
};
const dayLabel = (value, l) => (l === 'en' ? fmtDate(value, { day: 'numeric', month: 'short', year: 'numeric' }, 'en') : value.split('-').reverse().join('.'));

// Words that carry no request content, and the vocabulary the rules above already handle. Whatever is left is
// what the engine did not understand; its share decides whether the LLM partner is consulted (spec §4.1).
const FILLER = new Set('אנחנו אני את אתה הם רוצים רוצה מחפשים מחפש מחפשת עם של על זה זו גם או אבל עד רק כל יותר פחות משהו איזה איזו חופשה חופשת טיול טיסה טיסות לטוס לטייל לנסוע נסיעה בבקשה אפשר צריך צריכים מתאים טוב הכי מאוד קצת לנו לי שלנו ביחד וגם כי היי שלום תודה יעד מקום עדיף ממש כמה לא בלי ללא עוד תוסיף תוריד את המחיר בעצם כן'.split(' '));
const KNOWN = new Set('לילות לילה ימים יום שבוע שבועיים סופש סוף ילדים ילד ילדה ילדות תינוק תינוקת בני בנות בן בת גיל מבוגרים מבוגר זוג זוגי זוגית רומנטי ירח דבש שנינו משפחה משפחתי חברים חברות נוסעים אנשים מטיילים לבד סולו ישירה ישיר עצירה עצירות קונקשן החלפה מזוודה כבודה טרולי מוקדם בבוקר בערב בלילה צהריים לחזור חזרה הלוך כיוון ים בים חוף חופים בריכה עיר עירוני אוכל תרבות מוזיאונים קניות מנוחה להירגע שקט רגוע כשר כשרות שבת נגיש נגישות שקל שקלים דולר יורו תקציב אלף זול משתלם בקיץ בחורף באביב בסתיו פסח סוכות חנוכה מחר בעוד'.split(' '));
// English: words that carry no request content, and the vocabulary the English rules handle.
const FILLER_EN = new Set("we i me my our us you it is are am be the a an and or to of for in on at by with from want wants wanna would like looking look need needs please can could some any something somewhere trip holiday vacation getaway flight flights fly flying travel traveling travelling go going get place destination really very just also too about maybe prefer preferably hi hello thanks thank there this that it's i'm we're what where when how much many more less not no without but so than then".split(' '));
const KNOWN_EN = new Set("night nights day days week weeks weekend fortnight half kid kids child children baby babies infant infants toddler son daughter boy girl grandkids aged age ages year years old adult adults people person persons traveler travelers traveller travellers passenger passengers pax friend friends family couple wife husband partner girlfriend boyfriend romantic romance honeymoon solo alone myself own direct nonstop non stop stops connection connections layover layovers stopover early morning afternoon evening late return returning back night red eye one way round suitcase luggage baggage bag checked included beach beaches sea seaside pool swim swimming city food culture museums museum shopping relax relaxing relaxation rest quiet calm chill spa kosher shabbat sabbath accessible accessibility wheelchair budget cheap cheaper cheapest affordable shekels shekel nis ils dollars dollar usd euros euro eur total per each up under max tomorrow next summer winter spring autumn fall passover sukkot hanukkah christmas easter early mid between until till".split(' '));
export function coverage(text, understood) {
  const sources = understood.map(item => normalize(item.source || '')).join(' ');
  const english = isEnglish(text);
  const meaningful = words(english ? numeralsEn(normalize(text)) : numerals(normalize(text)))
    .filter(w => w.length >= 2 && !/^\d+$/.test(w) && !FILLER.has(w) && !FILLER.has(w.replace(/^[ובלהמש]/, '')) && !(english && FILLER_EN.has(w)));
  const unknown = meaningful.filter(w => !KNOWN.has(w) && !KNOWN.has(w.replace(/^[ובלהמש]/, '')) && !sources.includes(w) && !MONTHS.some(m => w.endsWith(m))
    && !(english && (KNOWN_EN.has(w) || KNOWN_EN.has(w.replace(/s$/, '')) || enMonthIndex(w) || places.some(p => p.names.some(n => n.includes(' ') && n.split(' ').includes(w)))))
    && !places.some(p => p.names.some(n => w.endsWith(n))) && !countries.some(c => c.names.some(n => w.endsWith(n))));
  const ratio = meaningful.length ? 1 - unknown.length / meaningful.length : 1;
  return { ratio: Math.round(ratio * 100) / 100, unknown: unknown.slice(0, 12), needsPartner: meaningful.length >= 3 && (ratio < 0.6 || unknown.length >= 3) };
}

const STYLE_RULES = [
  ['beach', /(?:^|[\s,])(?:ים|בים|לים|וים|בריכה|ובריכה|חוף|חופים|בטן גב|בטן-גב)(?=[\s,.!?]|$)/, /בלי ים|ללא ים|לא רוצים ים|לא ים/],
  ['city', /אוכל|תרבות|(?:^|\s)עיר(?:וני)?(?=\s|$)|מוזיאונים|קניות/, /בלי עיר|לא עיר/],
  ['relaxation', /מנוחה|להירגע|שקט|רגוע|לנוח/, /לא מנוחה/],
  ['family', /משפח|עם הילדים|לילדים/, /בלי ילדים|ללא ילדים/]
];

// options.lang: the language of the labels and questions (default: the page language; the server passes the visitor's).
export function understandRequest(text, previous = {}, { today = new Date().toISOString().slice(0, 10), lang: l = lang } = {}) {
  const raw = String(text || '').slice(0, 1500), english = isEnglish(raw), base = english ? numeralsEn(normalize(raw)) : numerals(normalize(raw));
  const brief = { ...previous }, understood = [], assumed = [];
  const say = (field, label, source) => understood.push({ field, label, source: source || '' });
  const tr = (key, vars) => t(key, vars, l), num = n => n.toLocaleString(l === 'en' ? 'en-GB' : 'he-IL');

  const travelers = english ? extractTravelersEn(base) : extractTravelers(base);
  if (travelers.adults) { brief.adults = travelers.adults; say('adults', tr('planner.adults', { count: travelers.adults }), travelers.adultsSource); }
  if (travelers.children !== undefined) { brief.children = Math.min(travelers.children, 9 - (brief.adults || 2)); say('children', brief.children ? tr('planner.children', { count: brief.children }) : tr('planner.children.none'), travelers.childrenSource); }
  if (travelers.childAges) { brief.childAges = travelers.childAges; if (travelers.childAges.length) say('childAges', tr('planner.childAges', { ages: travelers.childAges.join(', ') })); }
  if (travelers.infants) { brief.infants = travelers.infants; say('infants', tr('planner.infants', { count: travelers.infants })); }
  if (travelers.noChildren) { brief.family = false; }
  // "אנחנו 4 חברים" describes the whole group: children from an earlier message do not carry over.
  if (travelers.wholeGroup && travelers.children === undefined) { brief.children = 0; brief.childAges = []; }

  const dates = english ? extractDatesEn(base, today) : extractDates(base, today);
  if (dates?.start) { brief.start = dates.start; brief.end = dates.end || (brief.end > dates.start ? brief.end : undefined); }
  if (dates?.month) brief.month = dates.month;
  if (dates) {
    const month = monthLabel(dates.month, l);
    say('dates', dates.end ? tr('planner.dates.range', { start: dayLabel(dates.start, l), end: dayLabel(dates.end, l) })
      : dates.start ? tr('planner.dates.start', { date: dayLabel(dates.start, l), approx: dates.approximate ? tr('planner.dates.approx') : '' })
        : dates.holiday ? tr('planner.dates.holiday', { holiday: l === 'en' ? HOLIDAY_EN_LABEL[dates.holiday] || dates.holiday : dates.holiday, month })
          : dates.season ? tr('planner.dates.season', { season: l === 'en' ? SEASON_EN_LABEL[dates.season] : dates.season, month }) : tr('planner.dates.month', { month }), dates.source);
  }
  const rest = dates?.source ? base.replace(dates.source, ' ') : base;
  const duration = english ? extractDurationEn(rest) : extractDuration(rest);
  if (duration) {
    if (duration.days) duration.note = tr('planner.daysToNights', { days: duration.days, nights: duration.nights });
    else if (duration.note) duration.note = tr('planner.daysToNights', { days: +duration.note.split(' ')[0], nights: duration.nights });
    brief.nights = duration.nights; say('nights', duration.note || tr('planner.nights', { count: duration.nights }), duration.source);
  }
  if (brief.start && brief.end) { const n = nightsBetween(brief.start, brief.end); if (n > 0) brief.nights = n; }
  else if (brief.start && brief.nights && !brief.end) brief.end = addDays(brief.start, brief.nights);

  const budget = english ? extractBudgetEn(base) : extractBudget(base);
  if (budget) {
    const people = (brief.adults || 2) + (brief.children || 0);
    const total = budget.scope === 'person' ? budget.amount * people : budget.amount;
    brief.budgetCurrency = budget.currency;
    if (budget.currency === 'ILS') brief.budget = total; else delete brief.budget;
    const symbol = l === 'en' ? { ILS: '₪', USD: '$', EUR: '€' }[budget.currency] : budget.currency === 'ILS' ? '₪' : budget.currency;
    say('budget', tr('planner.budget', { perPerson: budget.scope === 'person' ? tr('planner.budget.perPerson', { amount: l === 'en' ? symbol + num(budget.amount) : num(budget.amount) }) : '', total: num(total), currency: symbol }), budget.source);
  }
  if (english ? /\b(?:cheap|cheaper|cheapest|affordable|inexpensive|low[- ]cost|low price|lowest price|best price|budget[- ]friendly|bargain|good deal|not expensive)\b/.test(base)
    : /זול|משתלם|תוריד|מחיר נמוך|הכי זול|לא יקר|במחיר נוח/.test(base)) { brief.cheaper = true; say('cheaper', tr('planner.cheaper')); }

  const where = extractPlaces(base, previous, raw);
  brief.want = where.want; brief.exclude = where.exclude;
  if (where.origin) { brief.origin = where.origin.code; say('origin', tr('planner.origin', { name: placeNameIn(where.origin.code, l) }), where.origin.source); }
  for (const hit of where.sources) {
    const name = hit.country ? countryNameIn(hit.country, l) : placeNameIn(hit.code, l);
    say(hit.negated ? 'exclude' : 'want', hit.negated ? tr('planner.exclude', { name }) : name, hit.source);
  }

  const flight = english ? extractFlightEn(base) : extractFlight(base);
  if (flight.stops) { brief.stops = flight.stops; brief.direct = flight.stops === '0'; say('stops', flight.stops === '0' ? tr('planner.stops.direct') : tr('planner.stops.one')); }
  if (flight.out) { brief.out = flight.out; brief.lateFlight = !flight.out.includes('morning'); say('out', flight.out.includes('morning') ? tr('planner.out.morning') : flight.out.includes('night') ? tr('planner.out.night') : tr('planner.out.late')); }
  if (flight.back) { brief.back = flight.back; say('back', tr('planner.back.late')); }
  if (flight.checkedBag) { brief.checkedBag = true; say('checkedBag', tr('planner.checkedBag')); }
  if (flight.carrier) { brief.carrier = flight.carrier; say('carrier', tr('planner.carrier', { name: l === 'en' ? CARRIER_EN[flight.carrier] : CARRIERS.find(c => c[1] === flight.carrier)[0] })); }
  if (flight.tripType) { brief.tripType = flight.tripType; say('tripType', tr('planner.oneway')); }

  for (const [key, positive, negative] of english ? STYLE_RULES_EN : STYLE_RULES) {
    if (negative.test(base)) { brief[key] = false; say(key, tr(`planner.style.${key}.no`)); }
    else if (positive.test(base)) { brief[key] = true; say(key, tr(`planner.style.${key}`)); }
  }
  const couple = english
    ? (/\bnot (?:a )?(?:romantic|couples?)\b|\bno romance\b/.test(base) ? false : /\b(?:romantic|romance|honeymoon|anniversary|couples? (?:trip|getaway|holiday|vacation)|just the 2 of us|just us 2)\b/.test(base) ? true
      : (brief.children || 0) > 0 ? false : /(?:^|\s)(?:a couple|couple|me and my (?:wife|husband|partner|girlfriend|boyfriend)|my (?:wife|husband|partner|girlfriend|boyfriend) and (?:i|me))\b/.test(base) ? true : undefined)
    : /לא\s+(?:חופשה\s+)?(?:זוגי|רומנטי)|בלי\s+רומנטיקה/.test(base) ? false : /רומנטי|זוגי|ירח דבש|רק שנינו|רק אנחנו/.test(base) ? true
      : (brief.children || 0) > 0 ? false : /(?:^|\s)זוג(?=\s|$|,)|אני ו(?:אשתי|בעלי|בן הזוג|בת הזוג|בן זוגי|בת זוגי)/.test(base) ? true : undefined;
  if (couple !== undefined) { brief.couple = couple; if (couple) say('couple', tr('planner.couple')); }
  const needs = english ? [['kosher', /\bkosher\b/], ['shabbat', /\b(?:shabbat|sabbath|shabbos)\b/], ['accessible', /\b(?:accessible|accessibility|wheelchair|reduced mobility)\b/]]
    : [['kosher', /כשר/], ['shabbat', /שבת/], ['accessible', /נגיש|כיסא גלגלים/]];
  for (const [key, pattern] of needs) if (pattern.test(base)) { brief[key] = true; say(key, tr(`planner.${key}`)); }

  // Relative edits in a follow-up: "עוד לילה", "תוסיף ילד" / "one more night", "add a kid".
  if ((english ? /\b(?:1 more|another|an extra|extra|add (?:a|1|another)) night\b/ : /עוד לילה|תוסיף לילה|לילה נוסף/).test(base) && !duration) { brief.nights = Math.min(30, (brief.nights || 5) + 1); say('nights', tr('planner.nights', { count: brief.nights })); }
  if ((english ? /\b(?:1 more|another|add (?:a|1|another)|plus (?:a|1)) (?:kid|child)\b/ : /(?:עוד|תוסיף|ועוד) (?:ילד|ילדה)(?=\s|$)/).test(base) && travelers.children === undefined) { brief.children = Math.min(9 - (brief.adults || 2), (brief.children || 0) + 1); say('children', tr('planner.children.count', { count: brief.children })); }

  if (travelers.adults) delete brief.adultsAssumed;
  if (!brief.adults) { brief.adults = 2; brief.adultsAssumed = true; assumed.push(tr('planner.assumed.adults')); }
  brief.children = brief.children ?? 0;
  brief.text = raw;
  // Only a country was named ("שבוע ביוון"): `want` then lists every place in it – a choice to make, not a route.
  const countryOnly = where.countries.length > 0 && !where.sources.some(hit => !hit.country && !hit.negated);
  return { brief, understood, assumed, countryOnly, coverage: coverage(raw, understood), questions: nextQuestions(brief, travelers, where, dates, l), flightSearch: flightSearchFrom(brief, where) };
}

// One or two questions, most decision-changing first; never a question whose answer the text already gave.
function nextQuestions(brief, travelers, where, dates, l = lang) {
  const questions = [], tr = (key, vars) => t(key, vars, l);
  const destinations = brief.want || [];
  if (where.countries.length && destinations.filter(code => where.countries.some(c => c.codes.includes(code))).length > 1)
    questions.push({ id: 'city', question: tr('planner.q.city', { country: countryNameIn(where.countries[0], l), examples: where.countries[0].codes.slice(0, 3).map(code => placeNameIn(code, l)).join(', ') }) });
  if (!destinations.length && !['beach', 'city', 'relaxation', 'family', 'couple'].some(key => brief[key] === true)) questions.push({ id: 'destination', question: tr('planner.q.destination') });
  if (!brief.start && !brief.month) questions.push({ id: 'dates', question: tr('planner.q.dates') });
  else if (!brief.start && (dates?.holiday || dates?.season || brief.month)) questions.push({ id: 'exact-dates', question: tr('planner.q.exactDates', { month: monthLabel(brief.month, l) }) });
  if (travelers.childrenUnknown && !brief.children) questions.push({ id: 'children', question: tr('planner.q.children') });
  else if (brief.children > 0 && !(brief.childAges || []).length) questions.push({ id: 'ages', question: tr('planner.q.ages') });
  if (!brief.nights && !brief.end && brief.tripType !== 'oneway') questions.push({ id: 'nights', question: tr('planner.q.nights') });
  if (!brief.budget && brief.budgetCurrency && brief.budgetCurrency !== 'ILS') questions.push({ id: 'budget-currency', question: tr('planner.q.budgetCurrency') });
  else if (!brief.budget) questions.push({ id: 'budget', question: tr('planner.q.budget') });
  return questions.slice(0, 2);
}

// A live search is offered only when every input is explicit: one searchable place and a departure date.
function flightSearchFrom(brief, where) {
  const targets = (brief.want || []).map(code => places.find(place => place.code === code)).filter(place => place && !place.home);
  if (targets.length !== 1 || !brief.start) return null;
  const oneWay = brief.tripType === 'oneway';
  if (!oneWay && !brief.end) return null;
  return { origin: brief.origin || 'TLV', destination: targets[0].code, start: brief.start, end: oneWay ? '' : brief.end, type: oneWay ? 'oneway' : 'round',
    adults: brief.adults, children: brief.children,
    filters: { stops: brief.stops || 'any', out: brief.out || [], back: oneWay ? [] : brief.back || [], checkedBag: brief.checkedBag === true, carrier: brief.carrier || null } };
}

export { resolvePlace };
