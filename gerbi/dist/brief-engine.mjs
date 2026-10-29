// Gerbi's free-text understanding: Hebrew request → structured brief, the facts it understood (each with the words it
// came from, so the traveler can correct it), the next question worth asking, and a live flight search when the
// request is concrete enough. Deterministic rules shared by the browser and the server – no model call, no guessing:
// anything ambiguous becomes a question, anything assumed is said out loud.
import { places, countries, resolvePlace } from './places.mjs';

const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
const MONTH_ALIASES = { מרס: 'מרץ' };
const HOLIDAYS = { פסח: 'אפריל', סוכות: 'אוקטובר', 'ראש השנה': 'ספטמבר', חנוכה: 'דצמבר', שבועות: 'יוני' };
const SEASONS = { קיץ: 'יולי', חורף: 'ינואר', אביב: 'אפריל', סתיו: 'אוקטובר' };
const NUMBER_WORDS = { שניים: 2, שתיים: 2, שני: 2, שתי: 2, שלוש: 3, שלושה: 3, שלושת: 3, ארבע: 4, ארבעה: 4, ארבעת: 4,
  חמש: 5, חמישה: 5, חמשת: 5, שש: 6, שישה: 6, ששת: 6, שבע: 7, שבעה: 7, שבעת: 7, שמונה: 8, שמונת: 8, תשע: 9, תשעה: 9, תשעת: 9, עשר: 10, עשרה: 10, עשרת: 10 };
const CURRENCIES = [[/₪|ש"ח|שח|שקל(?:ים)?|nis|ils/, 'ILS'], [/\$|דולר(?:ים)?|usd/, 'USD'], [/€|יורו|eur/, 'EUR']];
const NEGATIONS = new Set(['לא', 'בלי', 'ללא', 'ולא', 'ובלי', 'וללא', 'מלבד', 'חוץ']);
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
  for (const [holiday, month] of Object.entries(HOLIDAYS)) if (new RegExp(`(?:^|\\s)ב?${holiday}(?=\\s|$)`).test(text)) return { month, holiday, source: holiday };
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
  if (!found.adults && /(?:^|\s)(?:זוג|שנינו|אני ו(?:אשתי|בעלי|בן הזוג|בת הזוג|החבר|החברה|בן זוגי|בת זוגי)|שני מבוגרים)/.test(text)) { found.adults = 2; found.adultsSource = text.match(/זוג|שנינו|אני ו\S+|שני מבוגרים/)[0]; }
  if (!found.adults && /(?:^|\s)(?:לבד|סולו|רק אני)(?=\s|$|,)/.test(text)) { found.adults = 1; found.adultsSource = 'לבד'; }
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
function extractPlaces(text, previous) {
  const list = words(text), want = new Set(previous.want || []), exclude = new Set(previous.exclude || []);
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
    const negated = NEGATIONS.has(list[i - 1]) || NEGATIONS.has(list[i - 2]);
    const fromWord = prefix => /^ו?מ$/.test(prefix) && list[i - 1] !== 'חוץ';
    for (const place of places) {
      const prefix = matchAt(i, place.names);
      if (prefix === null) continue;
      if (list[i - 1] === 'רק' || list[i - 2] === 'רק') only = true;
      if (fromWord(prefix)) origin = { code: place.code, source: word };
      // A home airport without "to" is where the trip starts ("מתל אביב", "מאילת", "אנחנו מחיפה").
      else if (place.home) { if (!prefix && !negated && !origin) origin = { code: place.code, source: word }; }
      else found.push({ code: place.code, negated, source: word });
      return;
    }
    for (const country of countries) {
      const prefix = matchAt(i, country.names);
      if (prefix === null) continue;
      if (list[i - 1] === 'רק' || list[i - 2] === 'רק') only = true;
      countryHits.push({ country, negated, source: word });
      return;
    }
  });
  // A newly named place replaces earlier wishes, unless the text adds to them ("גם", "או").
  if (only || (found.some(hit => !hit.negated) && !/(?:^|\s)(?:גם|וגם|או)(?=\s)/.test(text))) want.clear();
  for (const { code, negated } of found) { if (negated) { exclude.add(code); want.delete(code); } else { want.add(code); exclude.delete(code); } }
  for (const { country, negated } of countryHits) for (const code of country.codes) { if (negated) { exclude.add(code); want.delete(code); } else if (!found.length) { want.add(code); exclude.delete(code); } }
  // Home airports are where the trip starts, never a holiday wish.
  for (const place of places) if (place.home) want.delete(place.code);
  return { want: [...want], exclude: [...exclude], origin, countries: countryHits.filter(hit => !hit.negated).map(hit => hit.country), sources: [...found, ...countryHits] };
}

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

const STYLE_RULES = [
  ['beach', /(?:^|[\s,])(?:ים|בים|לים|וים|בריכה|ובריכה|חוף|חופים|בטן גב|בטן-גב)(?=[\s,.!?]|$)/, /בלי ים|ללא ים|לא רוצים ים|לא ים/],
  ['city', /אוכל|תרבות|(?:^|\s)עיר(?:וני)?(?=\s|$)|מוזיאונים|קניות/, /בלי עיר|לא עיר/],
  ['relaxation', /מנוחה|להירגע|שקט|רגוע|לנוח/, /לא מנוחה/],
  ['family', /משפח|עם הילדים|לילדים/, /בלי ילדים|ללא ילדים/]
];

export function understandRequest(text, previous = {}, { today = new Date().toISOString().slice(0, 10) } = {}) {
  const raw = String(text || '').slice(0, 1500), base = numerals(normalize(raw));
  const brief = { ...previous }, understood = [], assumed = [];
  const say = (field, label, source) => understood.push({ field, label, source: source || '' });

  const travelers = extractTravelers(base);
  if (travelers.adults) { brief.adults = travelers.adults; say('adults', travelers.adults === 1 ? 'מבוגר אחד' : `${travelers.adults} מבוגרים`, travelers.adultsSource); }
  if (travelers.children !== undefined) { brief.children = Math.min(travelers.children, 9 - (brief.adults || 2)); say('children', brief.children === 1 ? 'ילד אחד' : brief.children ? `${brief.children} ילדים` : 'בלי ילדים', travelers.childrenSource); }
  if (travelers.childAges) { brief.childAges = travelers.childAges; if (travelers.childAges.length) say('childAges', `גילאים ${travelers.childAges.join(', ')}`); }
  if (travelers.infants) { brief.infants = travelers.infants; say('infants', travelers.infants === 1 ? 'תינוק' : `${travelers.infants} תינוקות`); }
  if (travelers.noChildren) { brief.family = false; }
  // "אנחנו 4 חברים" describes the whole group: children from an earlier message do not carry over.
  if (travelers.wholeGroup && travelers.children === undefined) { brief.children = 0; brief.childAges = []; }

  const dates = extractDates(base, today);
  if (dates?.start) { brief.start = dates.start; brief.end = dates.end || (brief.end > dates.start ? brief.end : undefined); }
  if (dates?.month) brief.month = dates.month;
  if (dates) say('dates', dates.end ? `${dates.start.split('-').reverse().join('.')}–${dates.end.split('-').reverse().join('.')}` : dates.start ? `יציאה ${dates.start.split('-').reverse().join('.')}${dates.approximate ? ' (בערך)' : ''}` : dates.holiday ? `בחג ${dates.holiday} (${dates.month})` : dates.season ? `ב${dates.season} (${dates.month})` : `ב${dates.month}`, dates.source);
  const duration = extractDuration(dates?.source ? base.replace(dates.source, ' ') : base);
  if (duration) { brief.nights = duration.nights; say('nights', duration.note || (duration.nights === 1 ? 'לילה אחד' : `${duration.nights} לילות`), duration.source); }
  if (brief.start && brief.end) { const n = nightsBetween(brief.start, brief.end); if (n > 0) brief.nights = n; }
  else if (brief.start && brief.nights && !brief.end) brief.end = addDays(brief.start, brief.nights);

  const budget = extractBudget(base);
  if (budget) {
    const people = (brief.adults || 2) + (brief.children || 0);
    const total = budget.scope === 'person' ? budget.amount * people : budget.amount;
    brief.budgetCurrency = budget.currency;
    if (budget.currency === 'ILS') brief.budget = total; else delete brief.budget;
    say('budget', `${budget.scope === 'person' ? `${budget.amount.toLocaleString('he-IL')} לאדם = ` : ''}${total.toLocaleString('he-IL')} ${budget.currency === 'ILS' ? '₪' : budget.currency} לכולם`, budget.source);
  }
  if (/זול|משתלם|תוריד|מחיר נמוך|הכי זול/.test(base)) { brief.cheaper = true; say('cheaper', 'מחיר חשוב'); }

  const where = extractPlaces(base, previous);
  brief.want = where.want; brief.exclude = where.exclude;
  if (where.origin) { brief.origin = where.origin.code; say('origin', `יציאה מ${places.find(p => p.code === where.origin.code).names[0]}`, where.origin.source); }
  for (const hit of where.sources) {
    const name = hit.country ? hit.country.names[0] : places.find(p => p.code === hit.code)?.names[0];
    say(hit.negated ? 'exclude' : 'want', hit.negated ? `לא ${name}` : name, hit.source);
  }

  const flight = extractFlight(base);
  if (flight.stops) { brief.stops = flight.stops; brief.direct = flight.stops === '0'; say('stops', flight.stops === '0' ? 'טיסה ישירה' : 'עד החלפה אחת'); }
  if (flight.out) { brief.out = flight.out; brief.lateFlight = !flight.out.includes('morning'); say('out', flight.out.includes('morning') ? 'המראה בבוקר' : flight.out.includes('night') ? 'טיסת לילה' : 'בלי המראה מוקדמת (אחרי 12:00)'); }
  if (flight.back) { brief.back = flight.back; say('back', 'חזרה מאוחרת'); }
  if (flight.checkedBag) { brief.checkedBag = true; say('checkedBag', 'מזוודה כלולה'); }
  if (flight.carrier) { brief.carrier = flight.carrier; say('carrier', `חברה מועדפת: ${CARRIERS.find(c => c[1] === flight.carrier)[0]}`); }
  if (flight.tripType) { brief.tripType = flight.tripType; say('tripType', 'כיוון אחד'); }

  for (const [key, positive, negative] of STYLE_RULES) {
    if (negative.test(base)) { brief[key] = false; say(key, { beach: 'בלי ים', city: 'בלי עיר', relaxation: 'לא מנוחה', family: 'בלי ילדים' }[key]); }
    else if (positive.test(base)) { brief[key] = true; say(key, { beach: 'ים ובריכה', city: 'אוכל ותרבות', relaxation: 'מנוחה', family: 'זמן משפחתי' }[key]); }
  }
  const couple = /לא\s+(?:חופשה\s+)?(?:זוגי|רומנטי)|בלי\s+רומנטיקה/.test(base) ? false : /רומנטי|זוגי|ירח דבש|רק שנינו|רק אנחנו/.test(base) ? true
    : (brief.children || 0) > 0 ? false : /(?:^|\s)זוג(?=\s|$|,)/.test(base) ? true : undefined;
  if (couple !== undefined) { brief.couple = couple; if (couple) say('couple', 'חופשה זוגית'); }
  for (const [key, pattern, label] of [['kosher', /כשר/, 'אוכל כשר'], ['shabbat', /שבת/, 'שומרי שבת'], ['accessible', /נגיש|כיסא גלגלים/, 'נגישות']]) if (pattern.test(base)) { brief[key] = true; say(key, label); }

  // Relative edits in a follow-up: "עוד לילה", "תוסיף ילד".
  if (/עוד לילה|תוסיף לילה|לילה נוסף/.test(base) && !duration) { brief.nights = Math.min(30, (brief.nights || 5) + 1); say('nights', `${brief.nights} לילות`); }
  if (/(?:עוד|תוסיף|ועוד) (?:ילד|ילדה)(?=\s|$)/.test(base) && travelers.children === undefined) { brief.children = Math.min(9 - (brief.adults || 2), (brief.children || 0) + 1); say('children', `${brief.children} ילדים`); }

  if (!brief.adults) { brief.adults = 2; assumed.push('2 מבוגרים'); }
  brief.children = brief.children ?? 0;
  brief.text = raw;
  return { brief, understood, assumed, questions: nextQuestions(brief, travelers, where, dates), flightSearch: flightSearchFrom(brief, where) };
}

// One or two questions, most decision-changing first; never a question whose answer the text already gave.
function nextQuestions(brief, travelers, where, dates) {
  const questions = [];
  const destinations = brief.want || [];
  if (where.countries.length && destinations.filter(code => where.countries.some(c => c.codes.includes(code))).length > 1)
    questions.push({ id: 'city', question: `לאיזה מקום ב${where.countries[0].names[0]}? למשל ${where.countries[0].codes.slice(0, 3).map(code => places.find(p => p.code === code).names[0]).join(', ')}.` });
  if (!destinations.length && !['beach', 'city', 'relaxation', 'family', 'couple'].some(key => brief[key] === true)) questions.push({ id: 'destination', question: 'לאן תרצו לטוס, או איזו חופשה מתחשק לכם (ים, עיר, מנוחה)?' });
  if (!brief.start && !brief.month) questions.push({ id: 'dates', question: 'מתי תרצו לטוס? תאריכים מדויקים או חודש.' });
  else if (!brief.start && (dates?.holiday || dates?.season || brief.month)) questions.push({ id: 'exact-dates', question: `באילו תאריכים ב${brief.month}? מחיר טיסה חי צריך תאריך מדויק.` });
  if (travelers.childrenUnknown && !brief.children) questions.push({ id: 'children', question: 'כמה ילדים מצטרפים, ובני כמה?' });
  else if (brief.children > 0 && !(brief.childAges || []).length) questions.push({ id: 'ages', question: 'בני כמה הילדים? הגיל משפיע על מחיר הטיסה.' });
  if (!brief.nights && !brief.end && brief.tripType !== 'oneway') questions.push({ id: 'nights', question: 'לכמה לילות?' });
  if (!brief.budget && brief.budgetCurrency && brief.budgetCurrency !== 'ILS') questions.push({ id: 'budget-currency', question: 'האומדנים כאן בשקלים. מה התקציב בשקלים לכל הנוסעים?' });
  else if (!brief.budget) questions.push({ id: 'budget', question: 'מה התקציב הכולל לכל הנוסעים?' });
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
