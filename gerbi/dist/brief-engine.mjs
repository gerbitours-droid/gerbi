// Gerbi's free-text understanding: Hebrew request → structured brief, the facts it understood (each with the words it
// came from, so the traveler can correct it), the next question worth asking, and a live flight search when the
// request is concrete enough. Deterministic rules shared by the browser and the server – no model call, no guessing:
// anything ambiguous becomes a question, anything assumed is said out loud.
import { places, countries, resolvePlace, countryNameEn } from './places.mjs';
import { t, lang, fmtDate } from './i18n.mjs';

const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
const MONTH_ALIASES = { מרס: 'מרץ' };
const HOLIDAYS = { פסח: 'אפריל', סוכות: 'אוקטובר', 'ראש השנה': 'ספטמבר', חנוכה: 'דצמבר', שבועות: 'יוני', פורים: 'מרץ', 'יום כיפור': 'אוקטובר' };
// The first evening of each holiday (Hebrew calendar), so "בפסח" plans around the holiday itself, not "some day in
// April". Outside this table the holiday's usual month is used and said out loud.
const HOLIDAY_EVE = {
  פסח: ['2026-04-01', '2027-04-21', '2028-04-10', '2029-03-30', '2030-04-17'],
  שבועות: ['2026-05-21', '2027-06-10', '2028-05-30', '2029-05-19', '2030-06-06'],
  'ראש השנה': ['2026-09-11', '2027-10-01', '2028-09-20', '2029-09-09', '2030-09-27'],
  סוכות: ['2026-09-25', '2027-10-15', '2028-10-04', '2029-09-23', '2030-10-11'],
  חנוכה: ['2026-12-04', '2027-12-24', '2028-12-12', '2029-12-01', '2030-12-20'],
  פורים: ['2027-03-22', '2028-03-11', '2029-02-28', '2030-03-18'],
  'יום כיפור': ['2027-10-10', '2028-09-29', '2029-09-18', '2030-10-06']
};
const holidayEve = (holiday, today) => (HOLIDAY_EVE[holiday] || []).find(day => day >= today) || null;
// The longest stay the builder plans (a long trip is split into bases; nothing is silently cut to a week).
export const MAX_NIGHTS = 90;
const clampNights = n => Math.min(MAX_NIGHTS, Math.max(1, Math.round(n)));
// "early / mid / end of <month>" → the day the plan starts around.
const PART_DAY = { early: 3, mid: 15, late: 24 };
const WEEKDAYS_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const WEEKDAYS_EN = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const weekdayOf = value => new Date(value + 'T12:00:00Z').getUTCDay();
// The next given weekday strictly after `from` ("ביום חמישי" said on a Thursday is next week's).
const nextWeekday = (from, day) => { let d = addDays(from, 1); while (weekdayOf(d) !== day) d = addDays(d, 1); return d; };
// World regions people name instead of a place ("אירופה", "המזרח הרחוק", "South America"); catalog `region` values.
const REGIONS = [
  ['asia', /(?:^|\s)[בלמו]?(?:ה)?(?:מזרח הרחוק|דרום מזרח אסיה|מזרח אסיה|אסיה)(?=[\s,.!?]|$)|\b(?:far east|south ?east asia|east asia|asia)\b/],
  ['south-america', /(?:^|\s)[בלמו]?(?:דרום אמריקה|דרום אמריקא)(?=[\s,.!?]|$)|\bsouth america\b/],
  ['latin-america', /(?:^|\s)[בלמו]?(?:מרכז אמריקה|אמריקה הלטינית|הקריביים|האיים הקריביים)(?=[\s,.!?]|$)|\b(?:central america|latin america|the caribbean|caribbean)\b/],
  ['europe', /(?:^|\s)[בלמו]?(?:ה)?(?:אירופה|אירופא|אירופאית|אירופית|אירופאי|אירופי)(?=[\s,.!?]|$)|\beurope(?:an)?\b/],
  ['africa', /(?:^|\s)[בלמו]?(?:אפריקה)(?=[\s,.!?]|$)|\bafrica\b/],
  ['middle-east', /(?:^|\s)[בלמו]?(?:ה)?(?:מזרח התיכון)(?=[\s,.!?]|$)|\bmiddle east\b/],
  ['oceania', /(?:^|\s)[בלמו]?(?:אוקיאניה)(?=[\s,.!?]|$)|\boceania\b/]
];
const REGION_NEGATION = /(?:לא|בלי|ללא|חוץ מ|מלבד|רק לא|not|no|except|anywhere but|anything but|avoid)\s*-?\s*(?:ב|ל|ה|in|to)?\s*$/;
function extractRegions(text) {
  const want = [], exclude = [], sources = [];
  for (const [id, pattern] of REGIONS) {
    const global = new RegExp(pattern.source, 'g');
    for (const m of text.matchAll(global)) {
      const before = text.slice(Math.max(0, m.index - 14), m.index + (m[0].length - m[0].trimStart().length));
      (REGION_NEGATION.test(before) ? exclude : want).push(id); sources.push(m[0].trim());
    }
  }
  return { want: [...new Set(want)].filter(id => !exclude.includes(id)), exclude: [...new Set(exclude)], sources };
}
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
// Compound numbers: "שתים עשרה" 12, "חמישה עשר" 15, "עשרים" 20, "עשרים וחמש" 25.
const UNITS = { אחד: 1, אחת: 1, שניים: 2, שנים: 2, שתיים: 2, שתים: 2, שלושה: 3, שלוש: 3, ארבעה: 4, ארבע: 4, חמישה: 5, חמש: 5, שישה: 6, שש: 6, שבעה: 7, שבע: 7, שמונה: 8, תשעה: 9, תשע: 9 };
const TENS = { עשרים: 20, שלושים: 30, ארבעים: 40, חמישים: 50, שישים: 60, שבעים: 70, שמונים: 80, תשעים: 90 };
const UNIT_RX = Object.keys(UNITS).join('|'), TENS_RX = Object.keys(TENS).join('|');
const compoundNumbers = text => text
  .replace(new RegExp(`(^|[\\s(-])ו?(${UNIT_RX})\\s+(?:עשר|עשרה)(?=[\\s,.!?)]|$)`, 'g'), (_, lead, unit) => lead + (10 + UNITS[unit]))
  .replace(new RegExp(`(^|[\\s(-])ו?(${TENS_RX})(?:\\s+ו(${UNIT_RX}))?(?=[\\s,.!?)]|$)`, 'g'), (_, lead, tens, unit) => lead + (TENS[tens] + (unit ? UNITS[unit] : 0)));
function numerals(text) {
  // Glued words: "5לילות" → "5 לילות", "10אלף" → "10 אלף", "זוג+2" → "זוג + 2".
  let out = compoundNumbers(text).replace(/(\d)(?=[א-ת])/g, '$1 ').replace(/(שבועיים|שבוע|חודשיים|חודש|לילות|ימים|סופ"?ש)(?=[בל][א-ת]{3,})/g, '$1 ').replace(/([א-ת])\+/g, '$1 +').replace(/\+(?=\d)/g, '+ ');
  out = out.replace(/(^|[\s(-])(\S+)(?=[\s,.)?!-]|$)/g, (all, lead, word, at, whole) => {
    const stripped = word.replace(/^[וה]/, '');
    // "יום שני" / "עד שני" is Monday, not two.
    if ((word === 'שני' || stripped === 'שני') && /(?:יום|עד|ועד|מ)\s*$/.test(whole.slice(0, at + lead.length))) return all;
    return NUMBER_WORDS[word] ? lead + NUMBER_WORDS[word] : NUMBER_WORDS[stripped] && /^[וה]/.test(word) ? lead + NUMBER_WORDS[stripped] : all;
  });
  out = out.replace(/(\d+(?:\.\d+)?)\s*(?:אלף|אלפים|k)(?![א-ת])/g, (_, n) => String(Math.round(Number(n) * 1000))).replace(/(^|\s)אלפיים(?=\s|$)/g, '$12000').replace(/(^|\s)אלף(?=\s|₪|ש|$)/g, '$11000');
  // Ages said in months or as a word ("בן שנה", "בת חצי שנה", "בן 8 חודשים") → years, so "8 חודשים" is never a stay.
  out = out.replace(/(בן|בת|בגיל)\s+(?:חצי שנה|\d+\s*חודשים|חודשיים|חודש)(?=[\s,.!?]|$)/g, '$1 0').replace(/(בן|בת|בגיל)\s+שנה(?=[\s,.!?]|$)/g, '$1 1').replace(/(בן|בת|בגיל)\s+שנתיים(?=[\s,.!?]|$)/g, '$1 2');
  return out.replace(/(\d),(\d{3})/g, '$1$2');
}
const words = text => text.replace(/[^\p{L}\p{N}\s'"]/gu, ' ').split(/\s+/).filter(Boolean);
// Words with the clause they belong to: a comma, period or "אבל" ends the reach of a negation.
const clauseWords = text => text.split(/[,.;!?]|\sאבל\s|(?<!anywhere|anything|everywhere|everything)\sbut\s/).flatMap((clause, c) => words(clause).map(word => ({ word, c })));
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
  text = text.replace(/[?!;:]+/g, ' ');
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
  // "10-17.7", "15-20.3": both days in the month after the second.
  match = text.match(/(?:^|\s)(?:מה?-?|ב-?|בין\s+)?(?<!\d)(\d{1,2})\s*(?:-|עד|ל-?)\s*(\d{1,2})[./](\d{1,2})(?![./]\d)(?!\d)/);
  if (match && +match[3] >= 1 && +match[3] <= 12) {
    const start = nextDate(+match[1], +match[3], today), end = nextDate(+match[2], +match[3], start);
    if (valid(start) && valid(end)) return { start, end, month: MONTHS[+match[3] - 1], source: match[0].trim() };
  }
  // "לטוס ב-24.12 ולחזור ב-31.12", "יציאה 3.7 חזרה 10.7"
  match = text.match(/(?<!\d)(\d{1,2})[./](\d{1,2})(?![./]\d)\s*,?\s*(?:ו?(?:לחזור|חזרה|חוזרים|נחזור)|ו?עד)\s*(?:ב|ה)?-?\s*(\d{1,2})[./](\d{1,2})(?!\d)/);
  if (match) {
    const start = nextDate(+match[1], +match[2], today), end = nextDate(+match[3], +match[4], start);
    if (valid(start) && valid(end)) return { start, end, month: MONTHS[+match[2] - 1], source: match[0].trim() };
  }
  // "3.7-10.7", "מה-3/7 עד ה-10/7", "3/7/27"
  match = text.match(/ה?-?(?<!\d)(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?\s*(?:-|עד|ועד|ל-?)\s*ה?-?(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?/);
  if (match) {
    const start = nextDate(+match[1], +match[2], today, match[3] && +match[3]), end = nextDate(+match[4], +match[5], start, match[6] && +match[6]);
    if (valid(start) && valid(end)) return { start, end, month: MONTHS[+match[2] - 1], source: match[0] };
  }
  // "ב-10 ביוני", "ב-3.7"
  match = text.match(new RegExp(`(?:^|\\s)(?:ב|מ|מה|החל מ|החל מה)?-?(\\d{1,2})\\s+(?:ב|ל)?(${monthPattern})(?:\\s+(20[23]\\d))?`)) || null;
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
  if (/סוף השבוע (?:הזה|הקרוב|הבא)|סופ"ש (?:הזה|הקרוב|הבא)|סופש (?:הזה|הקרוב|הבא)/.test(text)) {
    const weekday = new Date(today + 'T12:00:00Z').getUTCDay(), toThursday = (4 - weekday + 7) % 7 || 7;
    const start = addDays(today, toThursday + (/הבא/.test(text) ? 7 : 0));
    return { start, end: addDays(start, 3), source: text.match(/סו(?:ף השבוע|פ"ש|פש) \S+/)[0] };
  }
  // "ב-15 לחודש הבא": a day of next month.
  match = text.match(/(?:^|\s)(?:ב|מ|מה)?-?(\d{1,2})\s+(?:ל|ב)(?:ה)?חודש\s+(?:הבא|הקרוב)(?=[\s,.!?]|$)/);
  if (match) { const next = Number(today.slice(5, 7)) % 12 + 1, start = nextDate(+match[1], next, today); if (valid(start)) return { start, month: MONTHS[next - 1], source: match[0].trim() }; }
  // "כל אוגוסט" / "כל חודש אוגוסט": the whole month, first to last day.
  match = text.match(new RegExp(`(?:^|\\s)(?:את\\s+)?כל\\s+(?:חודש\\s+)?(${monthPattern})(?=[\\s,.!?]|$)`));
  if (match) { const m = monthIndex(match[1]), start = nextDate(1, m, today), end = addDays(nextDate(1, m % 12 + 1, start), -1); return { start, end, month: MONTHS[m - 1], source: match[0].trim() }; }
  // "בשבוע הבא" is when, not how long.
  match = text.match(/(?:^|\s)ב?שבוע (?:הבא|הקרוב)(?=[\s,.!?]|$)/);
  if (match) return { start: addDays(today, 7), approximate: true, source: match[0].trim() };
  // Weekdays: "מחמישי עד ראשון", "מיום חמישי עד יום שני", "ביום חמישי (הקרוב)".
  const day = `(${WEEKDAYS_HE.join('|')})`;
  match = text.match(new RegExp(`(?:^|\\s)(?:מ|מיום\\s+|ביום\\s+)${day}\\s+(?:ו?עד|-)\\s*(?:יום\\s+)?${day}(?=[\\s,.!?]|$)`));
  if (match) { const start = nextWeekday(today, WEEKDAYS_HE.indexOf(match[1])); return { start, end: nextWeekday(start, WEEKDAYS_HE.indexOf(match[2])), source: match[0].trim() }; }
  match = text.match(new RegExp(`(?:^|\\s)(?:ביום\\s+${day}(?:\\s+(?:הקרוב|הבא))?|ב(ראשון|שלישי|רביעי|חמישי|שישי)\\s+(?:הקרוב|הבא))(?=[\\s,.!?]|$)`));
  if (match) return { start: nextWeekday(today, WEEKDAYS_HE.indexOf(match[1] || match[2])), source: match[0].trim() };
  // A holiday: "בפסח", "בחג סוכות", "פסח ברומא"; "3 שבועות" is three weeks, so Shavuot needs "ב"/"חג" in front.
  text = text.replace(/ליל ה?סדר/g, 'פסח').replace(/(?:^|\s)(?:ב|ל)?כיפור(?=[\s,.]|$)/g, ' ביום כיפור');
  // Civil dates people travel for: around the day itself.
  for (const [rx, day, mon] of [[/ולנטיין|יום האהבה/, 14, 2], [/סילבסטר|ראש השנה האזרחית|השנה האזרחית החדשה/, 29, 12], [/חג המולד|כריסמס|קריסמס/, 22, 12]]) {
    const hit = text.match(rx);
    if (hit) { const anchor = nextDate(day, mon, today); return { month: MONTHS[mon - 1], anchor, approximate: true, source: hit[0] }; }
  }
  for (const [holiday, month] of Object.entries(HOLIDAYS)) {
    const hit = text.match(new RegExp(`(?:^|\\s)(?:ב|בחג\\s+ה?|חג\\s+ה?|לחג\\s+ה?|ל${holiday === 'שבועות' ? '' : '|'})${holiday}(?=\\s|$|[,.])`));
    if (!hit) continue;
    const eve = holidayEve(holiday, today);
    return eve ? { month: MONTHS[+eve.slice(5, 7) - 1], holiday, anchor: eve, approximate: true, source: hit[0].trim() } : { month, holiday, source: hit[0].trim() };
  }
  // The school summer holiday.
  match = text.match(/(?:^|\s)(?:ב|ל)?ה?(?:חופש הגדול|חופשת הקיץ|חופש הקיץ)(?=[\s,.!?-]|$)/);
  if (match) return { month: 'יולי', season: 'קיץ', source: match[0].trim() };
  // "בחודש הבא" / "החודש".
  match = text.match(/(?:^|\s)(?:ב|ל)?(?:ה)?חודש (?:הבא|הקרוב)(?=[\s,.!?]|$)/);
  if (match) return { month: MONTHS[Number(today.slice(5, 7)) % 12], source: match[0].trim() };
  match = text.match(/(?:^|\s)(?:ב|עוד\s+)?החודש(?=[\s,.!?]|$)/);
  if (match) return { month: MONTHS[Number(today.slice(5, 7)) - 1], source: match[0].trim() };
  // Part of a month: "באמצע יולי", "סוף ספטמבר", "בתחילת אוגוסט", "ספטמבר סוף" → a start around that day.
  const part = { תחילת: 'early', ראשית: 'early', אמצע: 'mid', סוף: 'late' };
  match = text.match(new RegExp(`(?:^|\\s)(?:ב|ל|מ)?(תחילת|ראשית|אמצע|סוף)\\s+(?:חודש\\s+)?(?:ב|ה)?(${monthPattern})(?:\\s+(20[23]\\d))?(?=[\\s,.!?]|$)`))
    || text.match(new RegExp(`(?:^|\\s)(?:ב|ל)?(${monthPattern})\\s+(סוף|אמצע|תחילת)(?:\\s+(20[23]\\d))?(?=[\\s,.!?]|$)`));
  if (match) {
    const partWord = part[match[1]] ? match[1] : match[2], monthWord = part[match[1]] ? match[2] : match[1], m = monthIndex(monthWord);
    const anchor = nextDate(PART_DAY[part[partWord]], m, today, match[3] && +match[3]);
    return { month: MONTHS[m - 1], anchor, approximate: true, part: part[partWord], source: match[0].trim() };
  }
  match = text.match(new RegExp(`(?:^|\\s)(?:ב|ל|מ)?(?:חודש\\s+)?(${monthPattern})(?:\\s+(20[23]\\d))?(?=[\\s,.]|$)`));
  if (match) return { month: MONTH_ALIASES[match[1]] || match[1], ...(match[2] && +match[2] >= 2026 && +match[2] <= 2030 ? { year: +match[2] } : {}), source: match[0].trim() };
  for (const [season, month] of Object.entries(SEASONS)) if (new RegExp(`(?:^|\\s)ב?${season}(?=[\\s,.!?]|$)`).test(text)) return { month, season, source: season };
  return null;
}

// How long, in nights. One unit table for every phrasing: nights as said, days minus the flight day home ("10 ימים" =
// 9 nights, said out loud), a week 7, a month 30. A range ("5-7 לילות", "שבוע-שבועיים") plans its middle and says so.
// Nothing is capped at a week or a month: up to MAX_NIGHTS (long trips are split into bases by the planner).
const nightsOfUnit = (unit, n) => (/^לילה|^לילות/.test(unit) ? n : /^ימים|^יום/.test(unit) ? n - 1 : /^שבוע/.test(unit) ? 7 * n : 30 * n);
const UNIT_WORD = { שבוע: 7, שבועיים: 14, חודש: 30, חודשיים: 60 };
const DATE_WORDS = `הבא|הקרוב|הזה|הנוכחי|${MONTHS.join('|')}`;
function extractDuration(text) {
  const range = (lo, hi, source, days) => ({ nights: clampNights((lo + hi) / 2), range: [clampNights(lo), clampNights(hi)], source, ...(days ? { days } : {}) });
  let match = text.match(/(?:בין\s+)?(?<!\d)(\d{1,2})\s*(?:-|עד|או|ל-?)\s*(\d{1,2})\s*(לילות|ימים|שבועות|חודשים)/);
  if (match && +match[1] < +match[2]) return range(nightsOfUnit(match[3], +match[1]), nightsOfUnit(match[3], +match[2]), match[0]);
  match = text.match(/(?:^|\s)(?:ל)?(שבוע|שבועיים|חודש)\s*(?:-|או|עד)\s*(שבועיים|חודש|חודשיים)(?=[\s,.!?]|$)/);
  if (match && UNIT_WORD[match[1]] < UNIT_WORD[match[2]]) return range(UNIT_WORD[match[1]], UNIT_WORD[match[2]], match[0].trim());
  match = text.match(/(\d+)\s*לילות|לילה אחד/);
  if (match) return { nights: match[1] ? clampNights(+match[1]) : 1, source: match[0] };
  match = text.match(/(\d+)\s*ימים/);
  // People count days including the flights home: "5 ימים" is 4 nights. Said out loud so it can be corrected.
  if (match) return { nights: clampNights(+match[1] - 1), source: match[0], note: `${match[1]} ימים = ${clampNights(+match[1] - 1)} לילות` };
  match = text.match(/(?:^|\s)(?:ל|של\s+)?יומיים(?=[\s,.!?]|$)/);
  if (match) return { nights: 1, source: match[0].trim(), note: '2 ימים = 1 לילות' };
  // "חודש" is a length unless it is a date: "בחודש הבא", "החודש", "חודש אוגוסט", "15 לחודש", "בעוד חודש".
  match = text.match(new RegExp(`(?<!\\d)(?:^|\\s)(?:ל|ו|של\\s+|למשך\\s+|כ)?(?:(\\d+)\\s*חודשים|חודש וחצי|חודשיים|חודש(?:\\s+(?:שלם|אחד|ימים))?)(?!\\s+(?:${DATE_WORDS}))(?=[\\s,.!?]|$)`));
  if (match && !/(?:^|\s)(?:בעוד|ב-?\d+|ל-?\d+)\s*$/.test(text.slice(0, match.index + 1))) {
    const phrase = match[0].trim(), nights = match[1] ? 30 * +match[1] : /וחצי/.test(phrase) ? 45 : /חודשיים/.test(phrase) ? 60 : 30;
    return { nights: clampNights(nights), source: phrase };
  }
  if (/שבועיים וחצי/.test(text)) return { nights: 17, source: 'שבועיים וחצי' };
  if (/שבוע וחצי/.test(text)) return { nights: 10, source: 'שבוע וחצי' };
  match = text.match(/(\d+)\s*שבועות/);
  if (match) return { nights: clampNights(7 * +match[1]), source: match[0] };
  if (/שבועיים/.test(text)) return { nights: 14, source: 'שבועיים' };
  if (/(?:סופ"?ש|סוף שבוע)\s+ארוך/.test(text)) return { nights: 4, source: text.match(/(?:סופ"?ש|סוף שבוע)\s+ארוך/)[0] };
  if (/סופ"?ש|סוף שבוע/.test(text) && !/סוף השבוע (?:הזה|הקרוב|הבא)/.test(text)) return { nights: 3, source: 'סוף שבוע' };
  if (/(?:^|\s)(?:ל|ב|של\s+)?שבוע(?=\s|$|[,.-])/.test(text) && !/סוף השבוע|בעוד שבוע|שבוע (?:הבא|הקרוב)/.test(text)) return { nights: 7, source: 'שבוע' };
  return null;
}

// Ages after "בן/בת/בני/בגילאי": "בני 2,5,9", "בני 3 ו-6", "בני 2, 5 ו-9" – never a count of nights/days/money after them.
const AGE_TAIL = '(?!\\d)(?!\\s*-\\s*\\d)(?!\\s*(?:לילות|ימים|לילה|שבועות|חודשים|₪|שקל|ש"ח|שח|אלף|כוכבים|%|מבוגרים|מבוגרות|אנשים|נוסעים|חברים|חברות))';
function agesIn(text) {
  const ages = [];
  for (const m of text.matchAll(new RegExp(`(?:^|[\\s(])ו?(?:בן|בת|בני|בנות|בגיל(?:אי)?|גילאי|גיל)\\s+(\\d{1,2})${AGE_TAIL}((?:\\s*(?:,\\s*(?:ו-?\\s*)?|ו-?\\s*|-\\s*(?=\\d{1,2}\\s*(?:,|ו)))\\d{1,2}${AGE_TAIL})*)`, 'g'))) {
    ages.push(+m[1], ...(m[2].match(/\d{1,2}/g) || []).map(Number));
  }
  // Ages in brackets after the kids: "3 ילדים קטנים (1, 3, 5)", "ילדים (4 ו-7)".
  for (const m of text.matchAll(/(?:ילדים|ילדות|נכדים|הילדים|קטנים|נערים)\s*\((\d{1,2}(?:\.\d)?(?:\s*(?:,|ו-?|-)\s*\d{1,2}(?:\.\d)?)*)\)/g)) ages.push(...m[1].match(/\d{1,2}(?:\.\d)?/g).map((a) => Math.floor(Number(a))));
  // A list of two or more ages right after the kids, without "בני": "ילדים 3 ו-6", "2 ילדים 9 ו-12", "מתבגרים 15 ו-17".
  for (const m of text.matchAll(new RegExp(`(?:ילדים|ילדות|נכדים|נערים|נערות|מתבגרים|מתבגרות)(?:\\s+(?:קטנים|קטנות|גדולים))?\\s*,?\\s*(\\d{1,2})${AGE_TAIL}((?:\\s*(?:,\\s*(?:ו-?\\s*)?|ו-?\\s*))\\d{1,2}${AGE_TAIL})+`, 'g'))) {
    if (!/(?:^|[\s,(])(?:בן|בת|בני|בנות|בגיל(?:אי)?|גילאי|גיל)\s+$/.test(text.slice(0, m.index))) ages.push(...m[0].match(/\d{1,2}/g).map(Number));
  }
  return ages.filter(age => age < 18);
}
const KIDS_HE = 'ילדים|ילדות|ילד(?=\\s|$|,)|ילדה(?=\\s|$|,)|נכדים|נכדות|נערים|נערות|מתבגרים|מתבגרות|בני נוער|בנות נוער|הילדים|הילדות|הנכדים|ילדיי|ילדינו';
const PARTNER_HE = /(?:^|\s|,)ו?(?:אשתי|אישתי|בעלי|זוגתי|בן זוגי|בת זוגי|בן הזוג|בת הזוג|בן הזוג שלי|בת הזוג שלי|החבר שלי|החברה שלי|חברה שלי|החבר|החברה|ארוסתי|ארוסי)(?=[\s,.]|$)/;
function extractTravelers(text) {
  const found = {};
  // "בלי בעלי" / "בלי אשתי": the partner is NOT coming.
  text = text.replace(/(?:בלי|ללא)\s+(?:ה)?(?:בעלי|אשתי|אישתי|בן הזוג|בת הזוג|בן זוגי|בת זוגי)(?:\s+שלי)?/g, ' ');
  const counted = text.match(new RegExp(`(\\d+)\\s*(?:${KIDS_HE})`)), single = text.match(/(?:^|\s)(?:ו|עם\s+)?(?:ילד|ילדה)\s+(?:אחד|אחת|1)(?=\s|$|,|ו)/);
  if (counted || single) { found.children = counted ? Math.min(8, +counted[1]) : 1; found.childrenSource = (counted || single)[0].trim(); }
  const infants = text.match(/(\d+)?\s*תינוק(?:ת|ות|ים)?/);
  if (infants) { found.infants = infants[1] ? +infants[1] : 1; found.children = (found.children || 0) + found.infants; }
  // "2+2", "זוג + 3", "משפחה 2+4", "2+3 (6,10,13)": adults + children – the Israeli shorthand for a family.
  const plus = text.match(/(?:^|[\s,(])(זוג|\d)\s*\+\s*(\d)(?!\d)(?!\s*(?:לילות|לילה|ימים|יום|כוכבים|שבועות|₪|אלף|שקל|ש"ח))/);
  if (plus) {
    found.plusAdults = plus[1] === 'זוג' ? 2 : +plus[1];
    if (!counted && !single) { found.children = Math.max(found.children || 0, +plus[2]); found.childrenSource = plus[0].trim(); }
    const list = text.slice(plus.index + plus[0].length).match(/^\s*(?:[א-ת]+\s*)?\((\d{1,2}(?:\.\d)?(?:\s*(?:,|ו-?|-)\s*\d{1,2}(?:\.\d)?)*)\)/);
    if (list) found.plusAges = list[1].match(/\d{1,2}(?:\.\d)?/g).map((a) => Math.floor(Number(a)));
  }
  const ages = [...agesIn(text), ...(found.plusAges || [])];
  if (ages.length) { found.childAges = ages.slice(0, 8); found.children = Math.max(found.children || 0, ages.length); }
  // A baby with no age said is under 2 (flight infant fare, cot in the room) – never "age 8" in the hotel search.
  if (found.infants && !(found.childAges || []).some(age => age < 2)) { found.childAges = [...(found.childAges || []), ...Array(found.infants).fill(0)].slice(0, 8); found.infantAgeAssumed = true; }
  if (/בלי ילדים|ללא ילדים|רק מבוגרים/.test(text)) { found.children = 0; found.childAges = []; found.noChildren = true; }
  if (found.plusAdults) { found.adults = found.plusAdults; found.adultsSource = 'N+M'; }
  let match = !found.adults && text.match(/משפחה של (\d+)/);
  if (match) { const total = +match[1]; found.children = found.children ?? Math.max(0, total - 2); found.adults = Math.max(1, total - found.children); found.adultsSource = match[0]; }
  match = text.match(/(\d+)\s*(?:מבוגרים|מבוגרות)/);
  if (match) { found.adults = +match[1]; found.adultsSource = match[0]; }
  // Families: "שתי משפחות" (two parents each, children counted apart).
  match = !found.adults && text.match(/(\d+)\s*משפחות/);
  if (match) { found.adults = 2 * +match[1]; found.adultsSource = match[0]; }
  // A couple and friends: "זוג וחבר" 3, "זוג ועוד 2 חברים" 4.
  match = !found.adults && text.match(/(?:^|\s)זוג\s+ו-?(?:עוד\s+)?(?:(\d+)\s+)?(?:חבר|חברה|חברים|חברות)(?=[\s,.]|$)/);
  if (match) { found.adults = 2 + (+match[1] || 1); found.adultsSource = match[0].trim(); }
  // Couples: "3 זוגות", "שני זוגות" (numerals made it "2 זוגות").
  match = !found.adults && text.match(/(\d+)\s*זוגות/);
  if (match) { found.adults = 2 * +match[1]; found.adultsSource = match[0]; }
  match = !found.adults && text.match(/(?:אנחנו\s+)?(\d+)\s*(?:נוסעים|אנשים|מטיילים|חברים|חברות|חבר'ה|חברה|רווקים|רווקות|נשים|גברים|בחורים|בחורות)(?![א-ת])/);
  // "אני ו-3 חברים" / "אני ועוד 2 חברות" is the friends plus me.
  if (match) { const me = /(?:^|\s)אני\s+(?:ו-?\s*)?(?:עוד\s+)?$/.test(text.slice(0, match.index + (match[0].length - match[0].trimStart().length))) ? 1 : 0; found.adults = Math.max(1, +match[1] + me - (found.children || 0)); found.adultsSource = match[0]; }
  // "6 בנות" / "4 בנים" with no parent around is a group of women / men (a hen party), not children.
  match = !found.adults && (!/(?:^|\s)(?:אבא|אמא|הורים|ההורים|זוג|סבא|סבתא|משפחה|אני|ואני|אשתי|בעלי|עם)(?=[\s,.]|$)/.test(text) || /חבר'?ה|רווק|מסיב|בנות \d\d\+?|חברות|חברים/.test(text)) && text.match(/(?:^|\s)(\d+)\s+(?:בנות|בנים)(?=[\s,.]|$)/);
  if (match) { found.adults = +match[1]; found.adultsSource = match[0].trim(); found.groupOfAdults = true; }
  if (!found.adults && /(?:^|\s)אנחנו (\d+)(?=\s|$|,)/.test(text)) { const total = +text.match(/אנחנו (\d+)/)[1]; found.adults = Math.max(1, total - (found.children || 0)); found.adultsSource = `אנחנו ${total}`; }
  const forParty = text.match(/(?:^|\s)ל-?(שניים|שלושה|ארבעה|חמישה|שישה|שבעה|שמונה|\d)(?=\s|$|,)(?!\s*(?:לילות|ימים|לילה|שבועות|חודשים|[בל]?(?:ינואר|פברואר|מרץ|אפריל|מאי|יוני|יולי|אוגוסט|ספטמבר|אוקטובר|נובמבר|דצמבר)))/);
  if (!found.adults && forParty) { found.adults = Math.max(1, (NUMBER_WORDS[forParty[1]] || +forParty[1]) - (found.children || 0)); found.adultsSource = forParty[0].trim(); }
  // Parents / grandparents named as a pair; "ההורים שלי ואני" is three.
  if (!found.adults && /(?:^|\s)(?:ההורים שלי ו?אני|אני וההורים(?: שלי)?)(?=[\s,.]|$)/.test(text)) { found.adults = 3; found.adultsSource = text.match(/ההורים שלי ו?אני|אני וההורים(?: שלי)?/)[0]; }
  const pair = /(?:^|\s)(?:סבא,?\s+ו?סבתא|סבתא,?\s+ו?סבא|אבא,?\s+ו?אמא|אמא,?\s+ו?אבא|ההורים)(?=[\s,.]|$)/;
  if (!found.adults && pair.test(text)) { found.adults = 2; found.adultsSource = text.match(pair)[0].trim(); }
  if (!found.adults && (/(?:^|\s)ו?(?:זוג|שנינו|שני מבוגרים)(?=[\s,.+]|$)/.test(text) || (/(?:^|\s)אני(?=[\s,]|$)/.test(text) && PARTNER_HE.test(text)) || /(?:^|\s)אני ו(?:עוד\s+)?(?:חבר|חברה)(?=[\s,.]|$)/.test(text))) {
    found.adults = 2; found.adultsSource = (text.match(/זוג|שנינו|שני מבוגרים|אני ו\S+/) || ['זוג'])[0];
  }
  // Me and one parent / grandparent: "לקחת את אמא שלי", "אני ואבא", "עם סבתא שלי" – two adults (no children with them).
  const elder = /(?:^|\s)(?:את|עם|ו)?-?(?:אמא|אבא|סבתא|סבא|אמי|אבי)(?:\s+שלי)?(?=[\s,.]|$)/;
  if (!found.adults && !found.children && elder.test(text) && /(?:^|\s)(?:אני|ואני|רוצה|לקחת|שלי|עם)(?=[\s,.]|$)/.test(text)) { found.adults = 2; found.adultsSource = text.match(elder)[0].trim(); }
  // Me and named relatives: "אני, אחי ואחותי" 3, "ההורים שלי… אני ואחותי" 4, "סבא… אני ואשתי" 3.
  if (!found.adults && /(?:^|\s)ו?אני(?=[\s,.]|$)/.test(text) && /(?:^|\s)ו?(?:אחי|אחותי)(?=[\s,.]|$)/.test(text)) {
    const rel = ['אחי', 'אחותי', 'אשתי', 'בעלי', 'אבא', 'אמא', 'סבא', 'סבתא'].filter((w) => new RegExp(`(?:^|\\s)(?:ו|את|עם)?${w}(?=[\\s,.]|$)`).test(text)).length;
    found.adults = 1 + rel + (/ההורים/.test(text) ? 2 : 0); found.adultsSource = 'אני + קרובים';
  }
  // "אני בת 22", "אני סטודנטית" with nobody else named: one traveller.
  if (!found.adults && !found.children && /(?:^|\s)אני\s+(?:בת|בן)\s+\d{2}(?=[\s,.]|$)|(?:^|\s)אני\s+(?:סטודנט|סטודנטית|חייל|חיילת)(?=[\s,.]|$)/.test(text) && !PARTNER_HE.test(text) && !/חבר|אמא|אבא|ההורים|אחי|אחותי|אנחנו|זוג/.test(text)) { found.adults = 1; found.adultsSource = 'אני'; }
  if (!found.adults && /(?:^|\s)(?:לבד|סולו|רק אני)(?=\s|$|,)/.test(text)) { found.adults = 1; found.adultsSource = 'לבד'; }
  // One parent or grandparent travelling with children, without a partner named: "אני והילדים", "אני ו-2 הילדים",
  // "אמא עם ילדה בת 10", "אבא ובן בן 12".
  if (!found.adults && new RegExp(`(?:^|\\s)אני\\s+(?:ו-?\\s*)?(?:עם\\s+)?(?:\\d+\\s+)?(?:${KIDS_HE}|הבן|הבת|בני|בתי)`).test(text) && !PARTNER_HE.test(text)) { found.adults = 1; found.adultsSource = 'אני'; }
  const role = text.match(/(?:^|\s)(אבא|אמא|סבא|סבתא|אב|אם)(?=\s|$)/);
  if (!found.adults && role && new RegExp(`(?:^|\\s)ו?-?(?:\\d+\\s+)?(?:בנים|בנות|בן|בת|נכד|נכדה|נכדים|נכדות|הילדים|ילד|ילדה|ילדים|נערים|נערות|מתבגרים|מתבגרות)(?=\\s|$)`).test(text) && !/(?:^|\s)ו(?:אבא|אמא|סבא|סבתא)(?=\s|$)/.test(text)) { found.adults = 1; found.adultsSource = role[1]; }
  if ((found.children === undefined || !found.childrenSource) && /(?:^|\s)ו?(?:נכדה|נכד)(?=\s|$)/.test(text)) { found.children = Math.max(found.children || 0, 1); found.childrenSource = 'נכד/ה'; }
  if ((found.children === undefined || !found.childrenSource) && /(?:^|\s)ו?(?:בן|בת)\s+(?:בן|בת)\s+\d/.test(text)) { found.children = Math.max(found.children || 0, 1); found.childrenSource = 'בן/בת'; }
  const sons = text.match(/(?:^|\s)ו?(\d+)\s+(?:בנים|בנות|נכדים|נכדות)(?=\s|$)/);
  if (sons && !counted && !found.groupOfAdults) { found.children = Math.max(found.children || 0, +sons[1]); found.childrenSource = sons[0].trim(); }
  if (!found.children && !found.noChildren && /עם הילדים|עם ילדים|משפחה|והילדים/.test(text)) found.childrenUnknown = true;
  // Grown-up sons / daughters travelling along: "אני ושני בנים בני 19 ו-21", "והבן שלנו בן 20" – adults.
  const grown = [...text.matchAll(/(?:בנים|בנות|ה?בן|ה?בת)(?:\s+שלנו|\s+שלי)?\s+(?:בן|בת|בני|בנות)\s+(\d{2})(?:\s*(?:,|ו-?)\s*(\d{2}))?/g)].flatMap((m) => m.slice(1).filter(Boolean).map(Number)).filter((a) => a >= 18);
  if (grown.length) { found.adults = (found.adults || (/(?:^|\s)אני(?=[\s,.]|$)/.test(text) && !PARTNER_HE.test(text) ? 1 : 2)) + grown.length; found.adultsSource = 'בנים בוגרים'; }
  // A grandparent or the parents on top of a couple / me + a sibling ("עם סבא… אני ואשתי" 3, "ההורים שלי… אני ואחותי" 4).
  if (found.adults === 2 && PARTNER_HE.test(text) && /(?:^|\s)(?:ו|את|עם)?(?:סבא|סבתא)(?:\s+שלי)?(?=[\s,.]|$)/.test(text)) found.adults = 3;
  if (/(?:^|\s)(?:את\s+)?ההורים שלי/.test(text) && /אני ו(?:אחי|אחותי)/.test(text)) found.adults = 4;
  found.wholeGroup = found.groupOfAdults || /חברים|חברות|חבר'ה|אנחנו \d|משפחה של|לבד|סולו|רק אני|זוגות|\d+\s*(?:נוסעים|אנשים|מטיילים)/.test(found.adultsSource || '');
  if (found.adults) found.adults = Math.min(9, found.adults);
  return found;
}

// A bare round amount (no keyword, no currency) still reads as a budget: ≥ 1,000, whole hundreds, not a year, and not
// followed by a unit (km, metres, points…). "4 אלף" / "10K" were already turned into digits by numerals().
const roundAmount = (m, text) => {
  const n = +m[3], after = text.slice(m.index + m[0].length, m.index + m[0].length + 12);
  return n >= 1000 && n % 100 === 0 && !(n >= 1900 && n <= 2100) && !/^\s*(?:ק"מ|קמ|מטר|רגל|נקודות|km|kilomet|met|feet|ft|miles|points|mi\b)/.test(after);
};
function extractBudget(text) {
  const currencyOf = value => CURRENCIES.find(([pattern]) => pattern.test(value))?.[1] || null;
  const pattern = /(?:(עד|תקציב(?: של)?|בסביבות|בערך|לא יותר מ-?|מקסימום|כ-)\s*)?(₪|\$|€)?\s*(\d{3,7})\s*(₪|\$|€|ש"ח|שח|שקלים|שקל|דולרים|דולר|יורו|nis|ils|usd|eur)?\s*(לאדם|לנוסע|פר אדם|לכל אחד|לזוג|לכולם|בסך הכל|סה"כ)?/g;
  // The first amount that is marked as money (a keyword, a currency or "per person"); a bare number such as a year is
  // not a budget, but a round amount from a thousands word ("10K", "10 אלף") or ≥ 1,000 that is not a year is (spec 28 §א).
  const match = [...text.matchAll(pattern)].find(m => m[1] || m[2] || m[4] || m[5]) || [...text.matchAll(pattern)].find(m => roundAmount(m, text));
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
    const negated = NEGATIONS.has(list[i - 1]) || (NEGATIONS.has(list[i - 2]) && tagged[i - 2].c === tagged[i].c && NEGATION_BRIDGE.has(list[i - 1]))
      || (list[i - 1] === 'but' && ['anywhere', 'anything', 'everywhere', 'everything'].includes(list[i - 2]));
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
const HOLIDAYS_EN = [[/passover|pesach/, 'פסח'], [/sukkot|sukkos|succot/, 'סוכות'], [/rosh hashanah?|jewish new year/, 'ראש השנה'], [/hanukkah?|chanukah?|hanuka/, 'חנוכה'], [/shavuot|shavuos/, 'שבועות'], [/christmas/, 'Christmas'], [/easter/, 'Easter'], [/new years?'?s?(?: eve)?\b|\bnye\b/, 'NYE'], [/valentine/, 'Valentine'], [/summer (?:vacation|holidays?|break)/, 'Summer']];
const HOLIDAY_MONTH_EN = { Christmas: 'דצמבר', Easter: 'אפריל', NYE: 'דצמבר', Valentine: 'פברואר', Summer: 'יולי' };
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
  text = text.replace(/[?!;:]+/g, ' ');
  const dm = `(?:(\\d{1,2})\\s+(?:of\\s+)?${EN_MONTH}|${EN_MONTH}\\s+(\\d{1,2})(?!\\s*(?:-|to)\\s*\\d{1,2}\\s*(?:nights?|days?|weeks?))(?!\\s*(?:nights?|days?|weeks?|adults?|kids?|children|child|people|persons|travell?ers|passengers|infants?|babies)\\b))(?!\\d)(?:,?\\s+(\\d{4}))?`;
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
  m = text.match(new RegExp(`${EN_MONTH}\\s+(\\d{1,2})\\s*(?:-|to|until|till)\\s*(\\d{1,2})(?![\\d/.])(?!\\s*(?:nights?|days?|weeks?|months?)\\b)(?:,?\\s+(\\d{4}))?`));
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
  m = text.match(new RegExp(`\\b(?:the\\s+)?(?:whole|entire|all)(?:\\s+of)?\\s+(?:the\\s+month\\s+of\\s+)?${EN_MONTH}(?=[\\s,.!?]|$)`));
  if (m) { const month = enMonthIndex(m[1]), start = nextDate(1, month, today), end = addDays(nextDate(1, month % 12 + 1, start), -1); return { start, end, month: MONTHS[month - 1], source: m[0] }; }
  m = text.match(/\b(?:on\s+)?(?:the\s+)?(\d{1,2})\s+of\s+next month\b/);
  if (m) { const next = Number(today.slice(5, 7)) % 12 + 1, start = nextDate(+m[1], next, today); if (valid(start)) return { start, month: MONTHS[next - 1], source: m[0] }; }
  // Weekdays: "Thursday to Sunday", "from Thursday till Monday", "this/next/on Thursday".
  const wd = `(${WEEKDAYS_EN.join('|')})`;
  m = text.match(new RegExp(`\\b(?:from\\s+)?${wd}\\s*(?:-|to|until|till|through)\\s*${wd}\\b`));
  if (m) { const start = nextWeekday(today, WEEKDAYS_EN.indexOf(m[1])); return { start, end: nextWeekday(start, WEEKDAYS_EN.indexOf(m[2])), source: m[0] }; }
  m = text.match(new RegExp(`\\b(?:on|this|next|coming)\\s+${wd}\\b`));
  if (m) return { start: nextWeekday(today, WEEKDAYS_EN.indexOf(m[1])), source: m[0] };
  for (const [pattern, holiday] of HOLIDAYS_EN) {
    const h = text.match(pattern);
    if (!h) continue;
    const eve = holidayEve(holiday, today);
    return eve ? { month: MONTHS[+eve.slice(5, 7) - 1], holiday, anchor: eve, approximate: true, source: h[0] } : { month: HOLIDAYS[holiday] || HOLIDAY_MONTH_EN[holiday], holiday, source: h[0] };
  }
  if (/\bnext month\b/.test(text)) { const month = Number(today.slice(5, 7)) % 12; return { month: MONTHS[month], source: 'next month' }; }
  if (/\bthis month\b/.test(text)) return { month: MONTHS[Number(today.slice(5, 7)) - 1], source: 'this month' };
  if (/\bsummer (?:vacation|holidays?|break)\b/.test(text)) return { month: 'יולי', season: 'קיץ', source: text.match(/summer (?:vacation|holidays?|break)/)[0] };
  // Part of a month: "mid July", "end of September", "early August", "late May 2027".
  m = text.match(new RegExp(`\\b(early|mid|middle of|late|end of|beginning of|start of|the end of|the middle of|the beginning of)[\\s-]+(?:the month of\\s+)?${EN_MONTH}(?:,?\\s+(20[23]\\d))?(?=[\\s,.!?]|$)`));
  if (m) {
    const part = /early|beginning|start/.test(m[1]) ? 'early' : /mid|middle/.test(m[1]) ? 'mid' : 'late', month = enMonthIndex(m[2]);
    return { month: MONTHS[month - 1], anchor: nextDate(PART_DAY[part], month, today, m[3] && +m[3]), approximate: true, part, source: m[0] };
  }
  // "in June", "early July", "in May" ("may" alone is a verb: it needs in/during/early/mid/late/of before it)
  m = text.match(new RegExp(`(?:^|\\s)(in|during|early|mid|late|of|end of|beginning of|start of)?\\s*${EN_MONTH}(?=[\\s,.!?]|$)`, 'g'));
  for (const hit of m || []) {
    const parts = new RegExp(`(in|during|early|mid|late|of)?\\s*${EN_MONTH}$`).exec(hit.trim());
    if (!parts) continue;
    // "may" / "march" are verbs too: bare, only as an item of their own ("Krakow, May, 4 nights", "…, 4 nights, May").
    if ((parts[2] === 'may' || parts[2] === 'march') && !parts[1] && !new RegExp(`(?:^|,)\\s*${parts[2]}\\s*(?:,|\\.|$)`).test(text)) continue;
    const year = text.match(new RegExp(`${parts[2]}\\.?,?\\s+(20[23]\\d)\\b`));
    return { month: MONTHS[enMonthIndex(parts[2]) - 1], ...(year ? { year: +year[1] } : {}), source: parts[2] };
  }
  for (const [season, he] of SEASONS_EN) {
    if (new RegExp(`\\b(?:in|this|next|over|during|for)\\s+(?:the\\s+)?${season}\\b`).test(text) || (season !== 'fall' && new RegExp(`\\b${season}\\b`).test(text)))
      return { month: SEASONS[he], season: he, source: season };
  }
  return null;
}

function extractDurationEn(text) {
  const unit = (u, n) => (/^night/.test(u) ? n : /^day/.test(u) ? n - 1 : /^week/.test(u) ? 7 * n : 30 * n);
  let m = text.match(/(?<!\d)(\d{1,2})\s*(?:-|to|or)\s*(\d{1,2})\s*(nights?|days?|weeks?|months?)\b/);
  if (m && +m[1] < +m[2]) { const lo = clampNights(unit(m[3], +m[1])), hi = clampNights(unit(m[3], +m[2])); return { nights: clampNights((lo + hi) / 2), range: [lo, hi], source: m[0] }; }
  m = text.match(/(\d+)[\s-]*nights?\b/);
  if (m) return { nights: clampNights(+m[1]), source: m[0] };
  if (/\b(?:a|one) night\b/.test(text)) return { nights: 1, source: 'a night' };
  m = text.match(/(\d+)\s*days?\b(?!\s+(?:from now|old))/);
  if (m) return { nights: clampNights(+m[1] - 1), source: m[0], days: +m[1] };
  // Months: "a month", "a whole month", "1 month", "2 months", "a month and a half" – never "next month" / "in a month" /
  // "8 months old".
  m = text.match(/\b(?:a|one|1)\s+(?:and a half|& a half)\s+months?\b|\b(?:a|one|1)\s+month and a half\b|\b1\.5\s+months?\b/);
  if (m) return { nights: 45, source: m[0] };
  m = text.match(/(?<!(?:baby|infant|toddler|newborn|aged?)\s*\(?\s*)\b(\d+)\s+months?\b(?![\s-]+old)(?!\s*\))/);
  if (m && !/\bin\s+$/.test(text.slice(0, m.index))) return { nights: clampNights(30 * +m[1]), source: m[0] };
  m = text.match(/\b(?:a|one|for a|the whole|a whole|a full|an entire|for the)\s+(?:whole\s+|full\s+|entire\s+)?month\b(?!\s+(?:from now|of))/);
  if (m && !/\b(?:in|within)\s+$/.test(text.slice(0, m.index))) return { nights: 30, source: m[0] };
  if (/\b(?:a\s+)?week and a half\b/.test(text)) return { nights: 10, source: 'week and a half' };
  m = text.match(/(\d+)\s*weeks?\b(?!\s+from now)/);
  if (m) return { nights: clampNights(7 * +m[1]), source: m[0] };
  if (/\bfortnight\b/.test(text)) return { nights: 14, source: 'fortnight' };
  if (/\b(?:a|for a|one)\s+week\b/.test(text)) return { nights: 7, source: 'a week' };
  if (/\blong weekend\b/.test(text) && !/\b(?:this|next)\s+long weekend\b/.test(text)) return { nights: 4, source: 'long weekend' };
  if (/\bweekend\b/.test(text) && !/\b(?:this|next)\s+weekend\b/.test(text)) return { nights: 3, source: 'weekend' };
  // "a beach week", "ski week": a week-long stay (not "next week", "the week of 5 July").
  if (/\bweek\b(?!\s+(?:from|of|after|before)\b)/.test(text) && !/\b(?:this|next|last|that|the)\s+week\b|\bweek (?:from|of)\b/.test(text)) return { nights: 7, source: 'week' };
  return null;
}

function extractTravelersEn(text) {
  const found = {};
  // Ages in months are babies ("a baby aged 8 months", "a 10-month-old") – never a stay of months.
  text = text.replace(/\b(\d{1,2})[\s-]*months?[\s-]*old\b/g, '0 year old').replace(/\(\s*\d{1,2}\s*(?:months?|mo)\s*\)/g, '(0)').replace(/\b(aged?)\s+\d{1,2}\s+months?\b/g, '$1 0');
  const counted = text.match(/(?<!family of\s*)(?<!\d)(\d+)\s*(?:kids?|children|child|boys?|girls?(?!friends)|grandkids|grandchildren|grandchild|sons?|daughters?|teens|teenagers|teenage (?:kids|boys|girls))\b/);
  const single = text.match(/(?:^|\s)(?:a|our|my|with a|and a)\s+(?:kid|child|son|daughter|boy|girl|grandchild|grandson|granddaughter)\b/);
  if (counted || single) { found.children = counted ? Math.min(8, +counted[1]) : 1; found.childrenSource = (counted || single)[0].trim(); }
  const infants = text.match(/(?:(\d+)\s*(?:infants|babies|toddlers)|(?:an?|our|my|1)\s+(?:\d{1,2}[\s-]*(?:year|month)s?[\s-]*old\s+)?(?:infant|baby|toddler))\b/);
  if (infants) { found.infants = infants[1] ? +infants[1] : 1; found.children = (found.children || 0) + found.infants; }
  // An age is never a count of nights/days/stars that follows it ("a child aged 8, 4 nights"); "kids 5 and 8" lists ages too.
  const AGE = '(\\d{1,2})(?!\\d)(?!\\s*(?:-|to)\\s*\\d)(?!\\s*(?:nights?|days?|weeks?|months?|stars?|hours?|adults?|people)\\b)';
  const ages = [...text.matchAll(new RegExp(`\\b(?:aged?|ages|(?:kids|children|boys|girls|sons|daughters)(?:\\s+are|:)?(?=\\s*\\(?\\s*\\d{1,2}\\s*(?:,|and|&)\\s*\\d))\\s*\\(?\\s*${AGE}(?:\\s*(?:,|and|&)\\s*${AGE})?(?:\\s*(?:,|and|&)\\s*${AGE})?(?:\\s*(?:,|and|&)\\s*${AGE})?`, 'g'))]
    .flatMap(m => m.slice(1).filter(Boolean).map(Number));
  for (const m of text.matchAll(/(\d{1,2})(?:\s*(?:,|and|&)\s*(\d{1,2}))?[\s-]*(?:years?|yrs?)[\s-]*olds?\b/g)) ages.push(...m.slice(1).filter(Boolean).map(Number));
  // "a teenager (15)", "2 teens (14,16)", "a toddler (2)", "my son (16)": ages in brackets after the kid.
  if (!ages.length) for (const b of text.matchAll(/\b(?:teen(?:ager)?s?|toddlers?|sons?|daughters?|kids?|children|child|boys?|girls?|grandkids?)\s*\((\d{1,2}(?:\s*(?:,|and|&)\s*\d{1,2})*)\)/g)) ages.push(...b[1].match(/\d{1,2}/g).map(Number));
  if (/\b(?:a|one|1|with a|and a)\s+(?:teen(?:ager)?|toddler)\b/.test(text) && !found.children) { found.children = 1; found.childrenSource = 'teen'; }
  const twoPlus = text.match(/(?:^|[\s,(])(\d)\s*\+\s*(\d)(?!\d)(?!\s*(?:nights?|days?|stars?))/);
  if (twoPlus && !counted) { found.adults = +twoPlus[1]; found.adultsSource = twoPlus[0].trim(); found.children = Math.max(found.children || 0, +twoPlus[2]); found.childrenSource = twoPlus[0].trim(); }
  const kidAges = ages.filter(age => age < 18);
  if (kidAges.length) { found.childAges = kidAges.slice(0, 8); found.children = Math.max(found.children || 0, kidAges.length); }
  if (found.infants && !(found.childAges || []).some(age => age < 2)) { found.childAges = [...(found.childAges || []), ...Array(found.infants).fill(0)].slice(0, 8); found.infantAgeAssumed = true; }
  if (/\b(?:no|without)\s+(?:kids|children)\b|\badults only\b|\b(?:just|only)\s+adults\b/.test(text)) { found.children = 0; found.childAges = []; found.noChildren = true; }
  let m = text.match(/\bfamily of (\d+)/);
  if (m) { const total = +m[1]; found.children = found.children ?? Math.max(0, total - 2); found.adults = Math.max(1, total - found.children); found.adultsSource = m[0]; }
  // A party of grown-ups: "4 girls" on a party trip, "5 women", "12 guys" – adults, not children.
  m = /\b(?:party|bachelor(?:ette)?|hen|stag|girls'? trip|girls'? weekend|trip|getaway|holiday|vacation)\b/.test(text) && text.match(/(\d+)\s+(?:girls|women|ladies|guys|men|lads)\b/);
  if (m) { found.adults = +m[1]; found.adultsSource = m[0]; if (/girls|guys/.test(m[0]) && found.childrenSource && /girls|boys/.test(found.childrenSource)) { found.children = 0; delete found.childAges; } }
  m = text.match(/(\d+)\s*(?:adults?|grown[- ]?ups)\b/);
  if (m) { found.adults = +m[1]; found.adultsSource = m[0]; }
  m = !found.adults && text.match(/(\d+)\s*couples\b/);
  if (m) { found.adults = 2 * +m[1]; found.adultsSource = m[0]; }
  m = !found.adults && (text.match(/(\d+)\s*(?:people|persons|travell?ers|passengers|pax|friends|of us|guys|girls|girlfriends|buddies|mates)\b/) || text.match(/\b(?:we are|we're|group of|party of)\s+(\d+)\b/));
  if (m) { const me = /\b(?:me|i)\s+(?:and|\+|with)\s+(?:my\s+)?$/.test(text.slice(0, m.index)) && /friends|girlfriends|buddies|mates|guys|girls/.test(m[0]) ? 1 : 0; found.adults = Math.max(1, +m[1] + me - (found.children || 0)); found.adultsSource = m[0]; }
  m = !found.adults && text.match(/\bfor\s+(\d)(?=\s*(?:[,.!?]|$|\s+(?:people|persons|to|from|in|on|at|with)\b))/);
  if (m) { found.adults = Math.max(1, +m[1] - (found.children || 0)); found.adultsSource = m[0]; }
  if (!found.adults && /(?:^|\s)(?:a couple|couple|the 2 of us|me and my (?:wife|husband|partner|girlfriend|boyfriend|fiancee?)|my (?:wife|husband|partner|girlfriend|boyfriend|fiancee?) and (?:i|me)|me and (?:the|my) (?:wife|husband)|2 adults)\b/.test(text)) {
    found.adults = 2; found.adultsSource = text.match(/a couple|couple|the 2 of us|me and \S+(?: \S+)?|my \S+ and (?:i|me)/)[0];
  }
  if (!found.adults && /\b(?:grandparents|my parents|our parents|mom and dad|mum and dad|dad and mom)\b/.test(text) && !/\b(?:me|i) and my parents\b|\bmy parents and (?:me|i)\b/.test(text)) { found.adults = 2; found.adultsSource = text.match(/grandparents|my parents|our parents|mom and dad|mum and dad|dad and mom/)[0]; }
  if (!found.adults && /\b(?:me|i) and my parents\b|\bmy parents and (?:me|i)\b/.test(text)) { found.adults = 3; found.adultsSource = 'me and my parents'; }
  if (!found.adults && /\b(?:solo|alone|just me|only me|by myself|on my own)\b/.test(text)) { found.adults = 1; found.adultsSource = text.match(/solo|alone|just me|only me|by myself|on my own/)[0]; }
  // One parent travelling with the kids: "me and my 2 kids", "mom with 2 children".
  if (!found.adults && found.children && /\b(?:with|and) (?:their|our|my|the) (?:mom|mum|dad|mother|father)\b/.test(text) && !/\b(?:wife|husband|partner|couple|parents)\b/.test(text)) { found.adults = 1; found.adultsSource = text.match(/(?:mom|mum|dad|mother|father)/)[0]; }
  if (!found.adults && /(?:^|\s)(?:i|me|mom|mum|dad|mother|father|grandma|grandpa|grandmother|grandfather)\s+(?:and|with|\+)\s+(?:my\s+|our\s+|the\s+)?(?:\d+\s+)?(?:kids?|children|child|sons?|daughters?|grandkids|grandchildren|teens|teenagers)\b/.test(text)) {
    found.adults = 1; found.adultsSource = text.match(/(?:i|me|mom|mum|dad|mother|father|grandma|grandpa|grandmother|grandfather)\s+(?:and|with|\+)/)[0];
  }
  if (!found.children && !found.noChildren && /\bwith (?:the |my |our )?(?:kids|children)\b|\bfamily\b/.test(text)) found.childrenUnknown = true;
  found.wholeGroup = /people|persons|travell?ers|passengers|friends|of us|we are|we're|group of|party of|family of|solo|alone|just me|only me|by myself|on my own|couples/.test(found.adultsSource || '');
  if (found.adults) found.adults = Math.min(9, found.adults);
  return found;
}

function extractBudgetEn(text) {
  const pattern = /(?:(up to|under|below|max(?:imum)?|no more than|budget(?: is| of)?|around|about|approx(?:imately)?|roughly)\s*)?(₪|\$|€)?\s*(\d{3,7})\s*(₪|\$|€|nis|ils|shekels?|usd|dollars?|eur|euros?)?\s*(per person|a person|each|pp|per head|per couple|for (?:the )?2 of us|in total|total|for everyone|for all of us)?/g;
  const match = [...text.matchAll(pattern)].find(m => m[1] || m[2] || m[4] || m[5]) || [...text.matchAll(pattern)].find(m => roundAmount(m, text));
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
const HOLIDAY_EN_LABEL = { פסח: 'Passover', סוכות: 'Sukkot', 'ראש השנה': 'Rosh Hashanah', חנוכה: 'Hanukkah', שבועות: 'Shavuot', פורים: 'Purim', 'יום כיפור': 'Yom Kippur' };
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
const KNOWN = new Set('לילות לילה ימים יום שבוע שבועיים סופש סוף ילדים ילד ילדה ילדות תינוק תינוקת בני בנות בן בת גיל מבוגרים מבוגר זוג זוגי זוגית רומנטי ירח דבש שנינו משפחה משפחתי חברים חברות נוסעים אנשים מטיילים לבד סולו ישירה ישיר עצירה עצירות קונקשן החלפה מזוודה כבודה טרולי מוקדם בבוקר בערב בלילה צהריים לחזור חזרה הלוך כיוון ים בים חוף חופים בריכה עיר עירוני אוכל תרבות מוזיאונים קניות מנוחה להירגע שקט רגוע כשר כשרות שבת נגיש נגישות שקל שקלים דולר יורו תקציב אלף זול משתלם בקיץ בחורף באביב בסתיו פסח סוכות חנוכה מחר בעוד חודש חודשיים חודשים וחצי אמצע תחילת ארוך זוגות משפחות נערים נערות מתבגרים נכדים נכד נכדה סבא סבתא אבא אמא הורים ההורים אשתי אישתי בעלי יוקרה מקסימום בסביבות אירופה אסיה אפריקה אמריקה מזרח הרחוק דרום חופש הגדול שבועות'.split(' '));
// English: words that carry no request content, and the vocabulary the English rules handle.
const FILLER_EN = new Set("we i me my our us you it is are am be the a an and or to of for in on at by with from want wants wanna would like looking look need needs please can could some any something somewhere trip holiday vacation getaway flight flights fly flying travel traveling travelling go going get place destination really very just also too about maybe prefer preferably hi hello thanks thank there this that it's i'm we're what where when how much many more less not no without but so than then".split(' '));
const KNOWN_EN = new Set("night nights day days week weeks weekend fortnight half kid kids child children baby babies infant infants toddler son daughter boy girl grandkids aged age ages year years old adult adults people person persons traveler travelers traveller travellers passenger passengers pax friend friends family couple wife husband partner girlfriend boyfriend romantic romance honeymoon solo alone myself own direct nonstop non stop stops connection connections layover layovers stopover early morning afternoon evening late return returning back night red eye one way round suitcase luggage baggage bag checked included beach beaches sea seaside pool swim swimming city food culture museums museum shopping relax relaxing relaxation rest quiet calm chill spa kosher shabbat sabbath accessible accessibility wheelchair budget cheap cheaper cheapest affordable shekels shekel nis ils dollars dollar usd euros euro eur total per each up under max tomorrow next summer winter spring autumn fall passover sukkot hanukkah christmas easter early mid between until till month months couples grandparents grandkids teens teenagers whole entire pool europe asia africa america south east far middle".split(' '));
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
  ['city', /אוכל|תרבות|(?:^|\s)ו?עיר(?:וני)?(?=[\s,.]|$)|מוזיאונים|קניות/, /בלי עיר|לא עיר/],
  ['relaxation', /מנוחה|להירגע|שקט|רגוע|לנוח/, /לא מנוחה/],
  ['family', /משפח|עם הילדים|לילדים/, /בלי ילדים|ללא ילדים/]
];

// ---- Spelling: place names typed the way they sound ("ברסלונה", "פאריז", "לונדן", "תאילאנד", "ניויורק", "Barcelonna").
// Hebrew: a sound key – final letters folded, ס/ש/צ/ז, ת/ט, כ/ק/ח alike, the vowel letters ו/י/א/ה/ע dropped after the
// first letter – must equal the key of exactly one known name. English: one edit away (two for long names). A word the
// rules already know is never "corrected". The original text is kept; only the copy the rules read is fixed.
const FINAL_LETTERS = { ם: 'מ', ן: 'נ', ץ: 'צ', ף: 'פ', ך: 'כ' };
const soundKey = w => w.replace(/['"]/g, '').replace(/[םןץףך]/g, c => FINAL_LETTERS[c]).replace(/[שצז]/g, 'ס').replace(/ת/g, 'ט').replace(/[קח]/g, 'כ').replace(/ע/g, 'א')
  .replace(/(?!^)[ויאה]/g, '');
function editDistance(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    if (Math.min(...row) > max) return max + 1;
    prev = row;
  }
  return prev[b.length];
}
const vocabCache = new Map();
function vocabulary(extra) {
  const id = extra.length ? extra.join('|').length + ':' + extra.length : 'base';
  if (vocabCache.has(id)) return vocabCache.get(id);
  const names = new Set([...places.flatMap(p => p.names), ...countries.flatMap(c => c.names), ...extra.map(normalize)].filter(n => n && n.length >= 4));
  // Every word of a multi-word name is a known word too ("austrian" of "austrian alps" is never "corrected" to Austria).
  const exact = new Set([...names, ...[...names].flatMap(n => (n.includes(' ') ? n.split(' ').filter(w => w.length >= 4) : []))]), he = new Map(), en = [], owners = new Map();
  // Two spellings of one place share a key ("פריז", "פאריז"); two different places with one key are left alone.
  const ownerOf = name => { const p = places.find(x => x.names.includes(name)); return p ? p.city || p.code : null; };
  const ownerOfAny = name => ownerOf(name) || countries.find(c => c.names.includes(name))?.names[0] || name;
  for (const name of names) {
    if (/[א-ת]/.test(name)) {
      const key = soundKey(name.replace(/ /g, ''));
      if (key.length < 3) continue;
      if (!he.has(key)) { he.set(key, name); owners.set(key, ownerOfAny(name)); } else if (he.get(key) && owners.get(key) !== ownerOfAny(name)) he.set(key, null);
    }
    else if (/^[a-z ]+$/.test(name) && name.length >= 5) en.push(name);
  }
  const value = { exact, he, en };
  vocabCache.set(id, value);
  return value;
}
const NOT_PLACES = new Set([...MONTHS, ...Object.keys(NUMBER_WORDS), 'שבועות', 'שבועיים', 'חודשיים', 'לילות', 'ילדים', 'ילדות', 'זוגות', 'בריכה', 'מבוגרים', 'סופש', 'יוקרה', 'יוקרתי', 'רגוע', 'שקלים', 'תקציב', 'מקסימום', 'בסביבות', 'מתבגרים', 'נכדים', 'תינוק', 'תינוקת', 'חברים', 'חברות', 'אשתי', 'אישתי', 'בעלי', 'ספטמבר', 'פסח', 'סוכות', 'חנוכה', 'כשר', 'כשרות', 'שבת', 'רכב', 'ישירה', 'טיסה', 'טיסות', 'זול', 'הכול', 'כלול', 'נגיש', 'לבד', 'סבתא', 'משפחה', 'מלון', 'חופשה', 'חופש', 'פנסיונרים', 'שומרי', 'נוסעים',
  // Everyday trip words that sound like a place ("טיולים" ≈ "טולום"): never "corrected".
  'טיול', 'טיולים', 'טיולי', 'לטייל', 'מטיילים', 'טבע', 'נופים', 'מוזיאונים', 'מסעדות', 'הופעה', 'הופעות', 'קניות', 'שופינג', 'ספארי', 'אטרקציות', 'מפלים', 'הרים', 'פארקים', 'ברים', 'מועדונים', 'מסיבות', 'צלילה', 'שנורקל', 'חופים', 'איים', 'אגמים', 'כפרים', 'שווקים']);
export function spellFix(text, extra = []) {
  const vocab = vocabulary(extra), english = isEnglish(text);
  return String(text || '').replace(/[\p{L}'"]+/gu, (word) => {
    const w = normalize(word);
    if (w.length < 4 || vocab.exact.has(w) || NOT_PLACES.has(w) || FILLER.has(w) || KNOWN.has(w) || FILLER_EN.has(w) || KNOWN_EN.has(w)) return word;
    if (/[א-ת]/.test(w)) {
      const cuts = [0, 1, 2].filter(cut => !cut || /^[ובלהמ]{1,2}$/.test(w.slice(0, cut)));
      if (cuts.some(cut => vocab.exact.has(w.slice(cut)) || NOT_PLACES.has(w.slice(cut)) || KNOWN.has(w.slice(cut)))) return word;
      for (const cut of cuts) {
        const prefix = w.slice(0, cut), rest = w.slice(cut), hit = rest.length >= 4 && vocab.he.get(soundKey(rest));
        // Same sound and at most a letter or two apart ("לאתונה" is never "לוטון").
        if (hit && editDistance(rest, hit, 2) <= Math.min(2, Math.floor(rest.length / 3))) return prefix + hit;
      }
      return word;
    }
    if (!english && !/^[a-z]+$/.test(w)) return word;
    const max = w.length >= 9 ? 2 : w.length >= 6 ? 1 : 0;
    // A longer form of a name is another word ("austrian", "italian"), not a typo.
    if (vocab.en.some(name => w.startsWith(name) && /^(?:n|an|ian|ese|ish|ic|ns|ans)$/.test(w.slice(name.length)))) return word;
    const hits = max ? vocab.en.filter(name => !name.includes(' ') && editDistance(w, name, max) <= max) : [];
    return hits.length === 1 ? hits[0] : word;
  });
}

// options.lang: the language of the labels and questions (default: the page language; the server passes the visitor's).
export function understandRequest(text, previous = {}, { today = new Date().toISOString().slice(0, 10), lang: l = lang } = {}) {
  const raw = String(text || '').slice(0, 1500), english = isEnglish(raw), fixed = spellFix(raw), base = english ? numeralsEn(normalize(fixed)) : numerals(normalize(fixed));
  const brief = { ...previous }, understood = [], assumed = [];
  const say = (field, label, source) => understood.push({ field, label, source: source || '' });
  const tr = (key, vars) => t(key, vars, l), num = n => n.toLocaleString(l === 'en' ? 'en-GB' : 'he-IL');

  const travelers = english ? extractTravelersEn(base) : extractTravelers(base);
  if (travelers.adults) { brief.adults = travelers.adults; say('adults', tr('planner.adults', { count: travelers.adults }), travelers.adultsSource); }
  if (travelers.children !== undefined) { brief.children = Math.min(travelers.children, 9 - (brief.adults || 2)); say('children', brief.children ? tr('planner.children', { count: brief.children }) : tr('planner.children.none'), travelers.childrenSource); }
  if (travelers.childAges) { brief.childAges = travelers.childAges; if (travelers.childAges.length > (travelers.infantAgeAssumed ? travelers.infants : 0)) say('childAges', tr('planner.childAges', { ages: travelers.childAges.join(', ') })); }
  if (travelers.infants) { brief.infants = travelers.infants; say('infants', tr('planner.infants', { count: travelers.infants })); }
  if (travelers.noChildren) { brief.family = false; }
  // "אנחנו 4 חברים" describes the whole group: children from an earlier message do not carry over.
  if (travelers.wholeGroup && travelers.children === undefined) { brief.children = 0; brief.childAges = []; }

  const dates = english ? extractDatesEn(base, today) : extractDates(base, today);
  if (dates?.start) { brief.start = dates.start; brief.end = dates.end || (brief.end > dates.start ? brief.end : undefined); }
  if (dates?.month) brief.month = dates.month;
  // An approximate start ("באמצע יולי", "בפסח") and a year ("בינואר 2028") – the planner starts there; a new date
  // phrase replaces the previous message's.
  if (dates) {
    for (const key of ['anchor', 'year', 'holiday']) if (dates[key]) brief[key] = dates[key]; else delete brief[key];
  }
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
    brief.nights = duration.nights;
    if (duration.range) brief.nightsRange = duration.range; else delete brief.nightsRange;
    say('nights', duration.range ? tr('planner.nightsRange', { low: duration.range[0], high: duration.range[1], nights: duration.nights }) : duration.note || tr('planner.nights', { count: duration.nights }), duration.source);
  }
  delete brief.nightsConflict;
  if (brief.start && brief.end) {
    const n = nightsBetween(brief.start, brief.end);
    // Dates and a length that disagree ("3–10 באוגוסט, שבועיים"): the dates win, and the traveller is asked.
    if (duration && dates?.end && n > 0 && Math.abs(n - duration.nights) > 1 && !duration.range) brief.nightsConflict = { said: duration.nights, dated: n };
    if (n > 0) brief.nights = n;
  }
  else if (brief.start && brief.nights && !brief.end) brief.end = addDays(brief.start, brief.nights);

  const budget = english ? extractBudgetEn(base) : extractBudget(base);
  if (budget) {
    const people = (brief.adults || 2) + (brief.children || 0);
    const total = budget.scope === 'person' ? budget.amount * people : budget.amount;
    brief.budgetCurrency = budget.currency;
    // Foreign money stays out of brief.budget (everything here is in shekels); callers with today's rates convert it.
    if (budget.currency === 'ILS') { brief.budget = total; delete brief.budgetForeign; } else { delete brief.budget; brief.budgetForeign = { amount: total, currency: budget.currency }; }
    brief.budgetScope = budget.scope;
    const symbol = l === 'en' ? { ILS: '₪', USD: '$', EUR: '€' }[budget.currency] : budget.currency === 'ILS' ? '₪' : budget.currency;
    say('budget', tr('planner.budget', { perPerson: budget.scope === 'person' ? tr('planner.budget.perPerson', { amount: l === 'en' ? symbol + num(budget.amount) : num(budget.amount) }) : '', total: num(total), currency: symbol }), budget.source);
  }
  if (english ? /\b(?:cheap|cheaper|cheapest|affordable|inexpensive|low[- ]cost|low price|lowest price|best price|budget[- ]friendly|bargain|good deal|not expensive|on a (?:tight |small |low )?budget|low budget|tight budget|backpack(?:ing|er)?)\b/.test(base)
    : /זול|משתלם|תוריד|מחיר נמוך|הכי זול|לא יקר|במחיר נוח|תקציב (?:מוגבל|נמוך|קטן|צנוע)|בלי מיליון|תרמיל/.test(base)) { brief.cheaper = true; say('cheaper', tr('planner.cheaper')); }
  // "לא משנה המחיר" / "money is no object": no cap, and the plan may go up a level.
  if (english ? /\b(?:money is no object|price is not an issue|price doesn'?t matter|no budget limit|whatever it costs|regardless of (?:the )?(?:price|cost)|no matter the (?:price|cost)|sky'?s the limit|money (?:isn'?t|is not) an (?:issue|object)|budget (?:isn'?t|is not) an (?:issue|object))\b/.test(base)
    : /לא משנה (?:ה?מחיר|כמה|ה?תקציב)|ה?מחיר לא משנה|ה?תקציב לא משנה|בלי הגבלת תקציב|בלי הגבלה|אין הגבלת תקציב|לא משנה לנו כמה|לא מוגבלים (?:ב)?תקציב|תקציב לא מוגבל|תקציב פתוח/.test(base)) { brief.noBudgetLimit = true; delete brief.cheaper; say('budget', tr('planner.noBudgetLimit')); }

  // Regions ("אירופה", "המזרח הרחוק", "not Europe") are read first and taken out, so "דרום אמריקה" is not the USA.
  const regions = extractRegions(base);
  if (regions.want.length || regions.exclude.length) {
    brief.regions = regions.want; brief.excludeRegions = regions.exclude;
    for (const id of regions.want) say('region', tr(`planner.region.${id}`));
    for (const id of regions.exclude) say('exclude', tr('planner.exclude', { name: tr(`planner.region.${id}`) }));
  }
  const placeText = regions.sources.reduce((text, source) => text.replace(source, ' '), base);
  const where = extractPlaces(placeText, previous, raw);
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
  const allQuestions = nextQuestions(brief, travelers, where, dates, l);
  return { brief, understood, assumed, countryOnly, coverage: coverage(raw, understood), questions: allQuestions.slice(0, 2), allQuestions, flightSearch: flightSearchFrom(brief, where) };
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
  return questions;
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
