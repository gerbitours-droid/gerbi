// Stress corpus for the magic trip builder's understanding (spec 24/28): hundreds of realistic one-sentence requests
// (≈70% Hebrew – slang, typos, no niqqud, missing spaces – ≈30% English) with the fields they must produce, run
// through the SAME functions the server uses (parseTrip → planPackage), then checked end to end: the package's
// nights / dates / travellers / destination / budget cap equal what was asked, and nothing asked is silently dropped.
//   node scripts/stress-understanding.mjs              → pass rate + failures grouped by field
//   node scripts/stress-understanding.mjs --all        → every failing case with what it got
//   node scripts/stress-understanding.mjs --case "חודש"  → full view of matching cases
// Deterministic: fixed "today" (Monday 16.11.2026), fixed FX, no network, no AI.
import { parseTrip, planPackage, inRegion } from '../dist/trip-builder.mjs';
import { byId } from '../dist/catalog.mjs';
import { pathToFileURL } from 'node:url';

export const TODAY = '2026-11-16';
export const FX = { rates: { USD: 3.65, EUR: 3.95, ILS: 1 } };

// ---------------------------------------------------------------------------------------------------------------
// Expectation keys (all optional):
//  n nights · s start · e end · m month (1–12) · anc approximate anchor date · yr year of the planned start
//  a adults · c children · ages childAges · inf infants
//  b budget cap in ₪ for everyone (null = no cap) · cheap budgetLevel 'low' · lux budgetLevel 'high'
//  d destinations (exact, in order) · sl shortlist (set) · co countries (subset) · x excluded ids (subset)
//  rg regions (subset) · xrg excluded regions (subset) · st styles (subset) · nst styles that must be absent
//  nd needs (subset) · q question id that must be asked · noq question ids that must NOT be asked
//  stops minimum number of stops in the package · said a word the package must say back in `assumed` (a need the
//  offline plan cannot guarantee is stated, never silently dropped)
// ---------------------------------------------------------------------------------------------------------------

// Hand-written cases: the owner's complaints, every phrasing family, and the tricky ones.
const H = [
  // ---- durations (the owner's "a month gave me a week")
  ['חודש באיטליה בקיץ', { n: 30, m: 7, co: ['Italy'], stops: 2 }],
  ['רוצים לטוס לחודש ליוון', { n: 30, co: ['Greece'], stops: 2 }],
  ['חודש בתאילנד', { n: 30, co: ['Thailand'], stops: 2 }],
  ['חודשיים בתאילנד אחרי הצבא', { n: 60, co: ['Thailand'], stops: 2 }],
  ['חודש ברומא', { n: 30, d: ['rome'] }],
  ['חודש וחצי בדרום אמריקה', { n: 45, rg: ['south-america'] }],
  ['טיול של חודש ביפן באפריל', { n: 30, d: ['japan'], m: 4 }],
  ['למשך חודש, זוג, פורטוגל', { n: 30, a: 2, co: ['Portugal'] }],
  ['חודש שלם בבאלי', { n: 30, d: ['bali'] }],
  ['3 חודשים בדרום מזרח אסיה', { n: 90, rg: ['asia'] }],
  ['שלושה שבועות בוייטנאם', { n: 21, d: ['vietnam'] }],
  ['3 שבועות בתאילנד, תרמילאים', { n: 21, co: ['Thailand'], stops: 2 }],
  ['שבועיים ביוון באוגוסט', { n: 14, m: 8, co: ['Greece'], stops: 2 }],
  ['שבועיים וחצי בארה"ב', { n: 17 }],
  ['שבוע וחצי בפורטוגל', { n: 10, co: ['Portugal'] }],
  ['שבוע ברודוס', { n: 7, d: ['rhodes'] }],
  ['לשבוע בכרתים', { n: 7, d: ['crete'] }],
  ['10 ימים בפריז', { n: 9, d: ['paris'] }],
  ['עשרה ימים בלונדון', { n: 9, d: ['london'] }],
  ['9 לילות בבנגקוק', { n: 9, d: ['bangkok'] }],
  ['תשעה לילות בפוקט', { n: 9, d: ['phuket'] }],
  ['סופ"ש בבודפשט', { n: 3, d: ['budapest'] }],
  ['סופ״ש ארוך בפראג', { n: 4, d: ['prague'] }],
  ['סופש ארוך בברלין', { n: 4, d: ['berlin'] }],
  ['סוף שבוע ארוך באתונה', { n: 4, d: ['athens'] }],
  ['יומיים באילת', { n: 1, d: ['eilat'] }],
  ['5-7 לילות בקפריסין', { n: 6, d: ['cyprus'] }],
  ['בין 4 ל-6 לילות באמסטרדם', { n: 5, d: ['amsterdam'] }],
  ['4-5 לילות ברומא', { n: 5, d: ['rome'] }],
  ['10-14 ימים ביפן', { n: 11, d: ['japan'] }],
  ['לילה אחד בדובאי בדרך', { n: 1, d: ['dubai'] }],
  ['3 לילות במילאנו', { n: 3, d: ['milan-lake-como'] }],
  ['שבוע-שבועיים בתאילנד', { n: 11 }],
  ['a month in Japan in April', { n: 30, d: ['japan'], m: 4 }],
  ['one month in Italy this summer', { n: 30, co: ['Italy'], m: 7, stops: 2 }],
  ['two months backpacking in Thailand', { n: 60, co: ['Thailand'] }],
  ['a fortnight in Crete', { n: 14, d: ['crete'] }],
  ['3 weeks in Vietnam', { n: 21, d: ['vietnam'] }],
  ['three weeks in Greece in June', { n: 21, co: ['Greece'], m: 6, stops: 2 }],
  ['10 days in Paris', { n: 9, d: ['paris'] }],
  ['a week and a half in Lisbon', { n: 10, d: ['lisbon'] }],
  ['a long weekend in Prague', { n: 4, d: ['prague'] }],
  ['weekend in Budapest', { n: 3, d: ['budapest'] }],
  ['5-7 nights in Cyprus', { n: 6, d: ['cyprus'] }],
  ['for a whole month in Bali', { n: 30, d: ['bali'] }],
  ['6 weeks in South America', { n: 42, rg: ['south-america'] }],
  ['a month and a half in Asia', { n: 45, rg: ['asia'] }],

  // ---- dates
  ['מ-3 עד 10 באוגוסט ברומא', { s: '2027-08-03', e: '2027-08-10', n: 7, d: ['rome'] }],
  ['מה-3 עד ה-10 באוגוסט, זוג, ברצלונה', { s: '2027-08-03', e: '2027-08-10', a: 2, d: ['barcelona'] }],
  ['3-10 באוגוסט באתונה', { s: '2027-08-03', e: '2027-08-10' }],
  ['בין 12 ל-19 ביולי בכרתים', { s: '2027-07-12', e: '2027-07-19', d: ['crete'] }],
  ['טסים ב-5 ביוני וחוזרים ב-12 ביוני, פריז', { s: '2027-06-05', e: '2027-06-12', d: ['paris'] }],
  ['28 בדצמבר עד 3 בינואר בלונדון', { s: '2026-12-28', e: '2027-01-03', n: 6, d: ['london'] }],
  ['28.12-3.1 בפראג', { s: '2026-12-28', e: '2027-01-03', n: 6, d: ['prague'] }],
  ['מה-20.12 עד ה-27.12, וינה', { s: '2026-12-20', e: '2026-12-27', d: ['vienna'] }],
  ['ב-10 ביוני, 5 לילות, רומא', { s: '2027-06-10', e: '2027-06-15', n: 5 }],
  ['באמצע יולי שבוע בכרתים', { m: 7, anc: '2027-07-15', n: 7 }],
  ['אמצע יולי, שבוע ברודוס', { m: 7, anc: '2027-07-15', n: 7 }],
  ['בסוף ספטמבר 5 לילות באמסטרדם', { m: 9, anc: '2027-09-24', n: 5 }],
  ['סוף ספטמבר, זוג, ליסבון', { m: 9, anc: '2027-09-24' }],
  ['בתחילת אוגוסט, שבוע, מונטנגרו', { m: 8, anc: '2027-08-03', n: 7, d: ['montenegro'] }],
  ['תחילת מאי 4 לילות בפריז', { m: 5, anc: '2027-05-03', n: 4 }],
  ['בחנוכה עם הילדים בני 6 ו-9 לאילת', { m: 12, anc: '2026-12-04', c: 2, d: ['eilat'] }],
  ['בפסח, משפחה עם 3 ילדים בני 4,7,10, רומא', { m: 4, anc: '2027-04-21', c: 3, ages: [4, 7, 10] }],
  ['בסוכות שבוע ביוון', { m: 10, anc: '2027-10-15', n: 7 }],
  ['בחג סוכות לפראג', { m: 10, anc: '2027-10-15' }],
  ['בראש השנה לבודפשט', { m: 10, anc: '2027-10-01' }],
  ['בשבועות לרומא, 4 לילות', { m: 6, anc: '2027-06-10', n: 4 }],
  ['בחופש הגדול עם הילדים בני 8 ו-11, שבועיים', { m: 7, n: 14, c: 2 }],
  ['בחופש הגדול לכרתים', { m: 7, d: ['crete'] }],
  ['בקיץ, זוג, מיקונוס', { m: 7, d: ['mykonos'] }],
  ['בחורף לסקי', { m: 1, st: ['ski'] }],
  ['בחודש הבא לרומא', { m: 12, d: ['rome'] }],
  ['חודש הבא, שבוע בדובאי', { m: 12, n: 7, d: ['dubai'] }],
  ['בעוד חודש לאתונה ל-4 לילות', { s: '2026-12-16', n: 4 }],
  ['בעוד שבועיים לברלין', { s: '2026-11-30' }],
  ['בשבוע הבא לאתונה, 3 לילות', { s: '2026-11-23', n: 3 }],
  ['ביום חמישי הקרוב לרומא ל-3 לילות', { s: '2026-11-19', n: 3, e: '2026-11-22' }],
  ['מחמישי עד ראשון בבודפשט', { s: '2026-11-19', e: '2026-11-22', n: 3 }],
  ['מחמישי עד שני בפראג', { s: '2026-11-19', e: '2026-11-23', n: 4 }],
  ['בינואר 2028 שבוע באילת', { m: 1, yr: 2028, n: 7 }],
  ['באוגוסט 2027, שבוע, רודוס', { m: 8, yr: 2027, n: 7 }],
  ['מחר לאתונה ל-3 לילות', { s: '2026-11-17', n: 3 }],
  ['סופ"ש הקרוב בבודפשט', { s: '2026-11-19', e: '2026-11-22' }],
  ['from August 3 to August 10 in Rome', { s: '2027-08-03', e: '2027-08-10', n: 7 }],
  ['3-10 August in Athens', { s: '2027-08-03', e: '2027-08-10' }],
  ['mid July, a week in Crete', { m: 7, anc: '2027-07-15', n: 7 }],
  ['end of September, 5 nights in Amsterdam', { m: 9, anc: '2027-09-24', n: 5 }],
  ['early August, 2 adults, Montenegro', { m: 8, anc: '2027-08-03' }],
  ['over Passover, family of 4 with kids 5 and 8, Rome', { m: 4, anc: '2027-04-21', c: 2, ages: [5, 8] }],
  ['Hanukkah in Eilat with the kids aged 6 and 9', { m: 12, anc: '2026-12-04' }],
  ['next month to Rome, 4 nights', { m: 12, n: 4 }],
  ['Dec 28 to Jan 3 in London', { s: '2026-12-28', e: '2027-01-03', n: 6 }],
  ['January 2028, a week in Eilat', { m: 1, yr: 2028, n: 7 }],
  ['this summer, 10 nights in Crete', { m: 7, n: 10 }],
  ['next week to Athens for 3 nights', { s: '2026-11-23', n: 3 }],
  ['Thursday to Sunday in Budapest', { s: '2026-11-19', e: '2026-11-22', n: 3 }],

  // ---- travellers
  ['אני ואשתי והתינוק, שבוע ברודוס', { a: 2, c: 1, inf: 1, ages: [0] }],
  ['אני ואשתי והתינוקת, 5 לילות בכרתים', { a: 2, c: 1, inf: 1 }],
  ['זוג + 3 ילדים בני 2,5,9, כרתים', { a: 2, c: 3, ages: [2, 5, 9] }],
  ['זוג+3 ילדים בני 2, 5 ו-9 לרודוס', { a: 2, c: 3, ages: [2, 5, 9] }],
  ['3 זוגות, סופ"ש בבודפשט', { a: 6, c: 0, n: 3 }],
  ['שלושה זוגות לאמסטרדם', { a: 6, c: 0 }],
  ['שני זוגות, שבוע ביוון', { a: 4, c: 0 }],
  ['סבא וסבתא עם 2 נכדים, שבוע ברודוס', { a: 2, c: 2 }],
  ['סבא וסבתא עם נכד בן 10 לוינה', { a: 2, c: 1, ages: [10] }],
  ['לבד, שבוע בליסבון', { a: 1, c: 0 }],
  ['אני לבד לבנגקוק 10 לילות', { a: 1, n: 10 }],
  ['סולו לברלין', { a: 1 }],
  ['4 חברות, סופ"ש בברצלונה', { a: 4, c: 0, n: 3 }],
  ['ארבע חברות לאתונה', { a: 4 }],
  ['אנחנו 6 חברים, מיקונוס, חיי לילה', { a: 6, st: ['nightlife'] }],
  ['5 חבר\'ה לבודפשט', { a: 5 }],
  ['זוג עם 2 נערים בני 14 ו-16, ברצלונה', { a: 2, c: 2, ages: [14, 16] }],
  ['אמא ו-2 מתבגרים בני 15 ו-17 ללונדון', { a: 1, c: 2, ages: [15, 17] }],
  ['משפחה של 5, כרתים', { a: 2, c: 3 }],
  ['אני ושני הילדים, רודוס', { a: 1, c: 2 }],
  ['אני והילדים בני 5 ו-8, אילת', { a: 1, c: 2, ages: [5, 8] }],
  ['2 מבוגרים ו-2 ילדים בני 4 ו-7, קפריסין', { a: 2, c: 2, ages: [4, 7] }],
  ['אמא עם ילדה בת 10 ללונדון', { a: 1, c: 1, ages: [10] }],
  ['אבא ובן בן 12 לניו יורק', { a: 1, c: 1, ages: [12] }],
  ['אני והחבר שלי לפריז', { a: 2 }],
  ['אני והחברה שלי לאמסטרדם', { a: 2 }],
  ['אני וחבר לברלין', { a: 2 }],
  ['זוג עם תינוק בן שנה, כרתים', { a: 2, c: 1, inf: 1, ages: [1] }],
  ['זוג עם תינוקת בת חצי שנה לקפריסין', { a: 2, c: 1, inf: 1, ages: [0] }],
  ['זוג עם ילד בן שנתיים לרודוס', { a: 2, c: 1, ages: [2] }],
  ['זוג ו-2 ילדים, שבוע ביוון באוגוסט', { a: 2, c: 2, q: 'ages' }],
  ['חופשה עם הילדים ברומא באוגוסט, שבוע', { q: 'children' }],
  ['אנחנו משפחה, רוצים לכרתים', { q: 'children' }],
  ['3 ילדים בני 4 ו-7 וזוג, רודוס', { a: 2, c: 3, ages: [4, 7], q: 'ages' }],
  ['אני, אשתי ו-3 ילדים לאילת', { a: 2, c: 3 }],
  ['ההורים שלי ואני לוינה', { a: 3 }],
  ['זוג פנסיונרים לפראג', { a: 2 }],
  ['אנחנו 4, שבוע ברודוס', { a: 4 }],
  ['ל-4 אנשים לרומא', { a: 4 }],
  ['me and my wife and our baby, a week in Rhodes', { a: 2, c: 1, inf: 1, ages: [0] }],
  ['a couple with 3 kids aged 2, 5 and 9, Crete', { a: 2, c: 3, ages: [2, 5, 9] }],
  ['3 couples, weekend in Budapest', { a: 6, c: 0 }],
  ['grandparents with 2 grandkids, a week in Rhodes', { a: 2, c: 2 }],
  ['solo trip to Lisbon', { a: 1 }],
  ['4 girlfriends going to Barcelona', { a: 4 }],
  ['family of 5 to Crete', { a: 2, c: 3 }],
  ['two teens aged 15 and 17 with their mom, London', { a: 1, c: 2, ages: [15, 17] }],
  ['family trip to Rome in August with the kids, a week', { q: 'children' }],

  // ---- budgets (incl. the owner's ₪4,800)
  ['זוג, רומא, תקציב ₪4,800', { b: 4800, d: ['rome'] }],
  ['זוג, רומא, תקציב 4,800 ש"ח', { b: 4800 }],
  ['תקציב 10,000 ₪ לזוג, שבוע ביוון', { b: 10000 }],
  ['עד 15 אלף, משפחה עם 2 ילדים בני 5 ו-8, כרתים', { b: 15000 }],
  ['מקסימום 8000 ש"ח, זוג, פראג', { b: 8000 }],
  ['בסביבות 12K לזוג, ברצלונה', { b: 12000 }],
  ['תקציב 3000 לאדם, זוג, אתונה', { b: 6000 }],
  ['3000 ש"ח לאדם, 4 חברים, בודפשט', { b: 12000, a: 4 }],
  ['עד 20 אלף שקל לכולם, משפחה של 5, רודוס', { b: 20000 }],
  ['תקציב של חמשת אלפים שקל, זוג, קפריסין', { b: 5000 }],
  ['עד 4.5K, זוג, סופ"ש בבודפשט', { b: 4500 }],
  ['תקציב 15 אלף ש"ח, שבוע בכרתים', { b: 15000 }],
  ['לא יותר מ-9000 שקל, זוג, וינה', { b: 9000 }],
  ['12000 שח, זוג, ליסבון', { b: 12000 }],
  ['תקציב: 7000', { b: 7000 }],
  ['עשרת אלפים שקל לשנינו, יוון', { b: 10000 }],
  ['20K לכולם, 4 חברים, מיקונוס', { b: 20000 }],
  ['לא משנה המחיר, ירח דבש במלדיביים', { b: null, lux: true }],
  ['המחיר לא משנה, זוג, פריז', { b: null }],
  ['משהו זול, זוג, אירופה', { cheap: true, rg: ['europe'] }],
  ['$3000 for two, Rome', { b: 10950 }],
  ['budget $3,000 total, Rome, 2 adults', { b: 10950 }],
  ['€2500, 2 adults, Paris', { b: 9870 }],
  ['3000 דולר לזוג, רומא', { b: 10950 }],
  ['2000 יורו לאדם, זוג, פריז', { b: 15800 }],
  ['up to 15k shekels, family of 4 with kids 5 and 8, Crete', { b: 15000 }],
  ['budget around 12,000 NIS for 2, Barcelona', { b: 12000 }],
  ['max 8000 ILS, couple, Prague', { b: 8000 }],
  ['3000 per person, 2 adults, Athens', { b: 6000 }],
  ['money is no object, honeymoon in the Maldives', { b: null, lux: true }],
  ['something cheap in Europe for 2', { cheap: true, rg: ['europe'] }],
  ['$3000 לזוג, רומא', { q: 'budget-currency', noFx: true }],

  // ---- destinations: spelling, regions, exclusions, routes, alternatives
  ['ברסלונה 4 לילות', { d: ['barcelona'] }],
  ['ברצלונה 4 לילות', { d: ['barcelona'] }],
  ['לברצלונא בקיץ', { d: ['barcelona'] }],
  ['פאריז, זוג', { d: ['paris'] }],
  ['פריס, זוג, 4 לילות', { d: ['paris'] }],
  ['לונדן שבוע', { d: ['london'] }],
  ['אמסטרדאם סופ"ש', { d: ['amsterdam'] }],
  ['בודאפשט 3 לילות', { d: ['budapest'] }],
  ['תאילאנד חודש', { co: ['Thailand'], n: 30 }],
  ['ניו-יורק 6 לילות', { d: ['new-york'] }],
  ['ניויורק עם הילדים בני 10 ו-12', { d: ['new-york'] }],
  ['לסנטוריני ירח דבש', { d: ['santorini'] }],
  ['סנטורני 5 לילות', { d: ['santorini'] }],
  ['איסטנבול 4 לילות', { d: ['istanbul'] }],
  ['טביליסי 5 לילות', { d: ['georgia'] }],
  ['Barcelona 4 nights', { d: ['barcelona'] }],
  ['Barcelonna for 4 nights', { d: ['barcelona'] }],
  ['Amsterdamm weekend', { d: ['amsterdam'] }],
  ['Pariss, 2 adults, 4 nights', { d: ['paris'] }],
  ['שבוע in Paris', { d: ['paris'], n: 7 }],
  ['5 לילות ב-London', { d: ['london'], n: 5 }],
  ['Rome ופירנצה, 8 לילות', { d: ['rome', 'florence-tuscany'], n: 8 }],
  ['רומא ואז פירנצה, 8 לילות במאי', { d: ['rome', 'florence-tuscany'], n: 8, stops: 2 }],
  ['רומא, פירנצה וונציה, שבועיים', { d: ['rome', 'florence-tuscany', 'venice'], n: 14, stops: 3 }],
  ['קודם אתונה ואחר כך סנטוריני, 10 לילות', { d: ['athens', 'santorini'], n: 10 }],
  ['רומא או פריז, 5 לילות', { sl: ['rome', 'paris'] }],
  ['Rome then Florence, 8 nights in May', { d: ['rome', 'florence-tuscany'], n: 8 }],
  ['Rome or Paris, 5 nights', { sl: ['rome', 'paris'] }],
  ['משהו באירופה, שבוע באוגוסט', { rg: ['europe'], n: 7 }],
  ['באירופה, זוג, 5 לילות', { rg: ['europe'] }],
  ['למזרח הרחוק לחודש', { rg: ['asia'], n: 30 }],
  ['במזרח הרחוק שלושה שבועות', { rg: ['asia'], n: 21 }],
  ['אסיה, חודשיים', { rg: ['asia'], n: 60 }],
  ['דרום אמריקה חודש', { rg: ['south-america'], n: 30 }],
  ['משהו באפריקה, שבוע', { rg: ['africa'] }],
  ['לא אירופה, משהו חם בדצמבר, שבוע', { xrg: ['europe'], m: 12 }],
  ['לא דובאי, משהו חם בדצמבר', { x: ['dubai'], m: 12 }],
  ['רק לא דובאי, ים בינואר', { x: ['dubai'] }],
  ['בלי איסטנבול, 4 לילות באירופה', { x: ['istanbul'], rg: ['europe'] }],
  ['somewhere in Europe, a week in August', { rg: ['europe'], n: 7 }],
  ['Far East for a month', { rg: ['asia'], n: 30 }],
  ['not Europe, somewhere warm in December', { xrg: ['europe'], m: 12 }],
  ['anywhere but Dubai, beach in January', { x: ['dubai'] }],
  ['ביוון, שבוע', { co: ['Greece'] }],
  ['באיטליה 5 לילות', { co: ['Italy'] }],
  ['בספרד 6 לילות', { co: ['Spain'] }],
  ['לא יודעים לאן, זוג, 5 לילות במרץ', { m: 3, n: 5 }],

  // ---- styles / needs
  ['כשר, שבוע ברומא', { nd: { kosher: true } }],
  ['שומרי שבת, 5 לילות בפראג', { nd: { shabbat: true } }],
  ['שומר שבת וכשרות, לונדון', { nd: { shabbat: true, kosher: true } }],
  ['הכול כלול עם הילדים בני 5 ו-8', { nd: { allInclusive: true } }],
  ['הכל כלול בכרתים', { nd: { allInclusive: true } }],
  ['אולאינקלוסיב בטורקיה', { nd: { allInclusive: true } }],
  ['נגיש לכיסא גלגלים, רומא, 5 לילות', { nd: { accessible: true }, said: 'נגיש' }],
  ['אמא שלי בכיסא גלגלים, לונדון', { nd: { accessible: true }, said: 'נגיש' }],
  ['עם רכב, כרתים', { nd: { car: 'yes' } }],
  ['נשכור רכב בטוסקנה', { nd: { car: 'yes' } }],
  ['בלי רכב, רומא', { nd: { car: 'no' } }],
  ['מלון עם בריכה בפראג', { nd: { pool: true }, said: 'בריכה' }],
  ['חיי לילה וברים, בודפשט', { st: ['nightlife'] }],
  ['משהו רגוע, זוג, יוון', { st: ['relaxation'] }],
  ['יוקרה, 5 כוכבים, דובאי', { st: ['luxury'], nd: { minStars: 5 } }],
  ['זול, אתונה, 3 לילות', { cheap: true }],
  ['הכי זול שיש לבודפשט', { cheap: true }],
  ['טיסה ישירה בלבד, רומא', { nd: { direct: true } }],
  ['ים וחופים, שבוע', { st: ['beach'] }],
  ['טבע והרים בגאורגיה', { st: ['nature'] }],
  ['קניות בלונדון', { st: ['shopping'] }],
  ['kosher food, a week in Rome', { nd: { kosher: true } }],
  ['shabbat observant family, London', { nd: { shabbat: true } }],
  ['wheelchair accessible hotel in Rome', { nd: { accessible: true }, said: 'ccessib' }],
  ['all inclusive in Crete', { nd: { allInclusive: true } }],
  ['with a rental car in Crete', { nd: { car: 'yes' } }],
  ['hotel with a pool in Prague', { nd: { pool: true }, said: 'pool' }],
  ['nightlife in Budapest', { st: ['nightlife'] }],
  ['luxury 5 star Dubai', { st: ['luxury'] }],
  ['direct flights only to Rome', { nd: { direct: true } }],

  // ---- slang / typos / missing spaces / no punctuation
  ['בא לנו לברוח לסופש לאתונה', { n: 3, d: ['athens'] }],
  ['5לילות ברומא', { n: 5, d: ['rome'] }],
  ['שבועייםבכרתים', { n: 14, d: ['crete'] }],
  ['זוג+2 ילדים בני 3 ו6', { a: 2, c: 2, ages: [3, 6] }],
  ['זוג ו2 ילדים בני 3 ו 6', { a: 2, c: 2, ages: [3, 6] }],
  ['תקציב 10אלף', { b: 10000 }],
  ['עד 10 אלפים שקל', { b: 10000 }],
  ['רוצה לטוס עם אישתי לרומא לשבוע', { a: 2, n: 7, d: ['rome'] }],
  ['אני ואישתי חודש בתאילנד', { a: 2, n: 30 }],
  ['ביולי לשבוע עם הילדים בני 7 ו9 לכרתים', { m: 7, n: 7, c: 2, ages: [7, 9] }],
  ['לרומא בחגים', { d: ['rome'] }],
  ['רוצים לטוס בחנוכה לאיזה מקום חם', { m: 12 }],
  ['פסח ברומא עם הילדים בני 6 ו-9', { m: 4, anc: '2027-04-21' }],
  ['ספטמבר סוף, ליסבון', { m: 9 }],
  ['זוג, סנטוריני, 5 לילות, תקציב 15 אלף, יוני, משהו רומנטי', { a: 2, d: ['santorini'], n: 5, b: 15000, m: 6, st: ['couple'] }],

  // ---- the owner-style full sentences (combinations)
  ['אני ואשתי ושני ילדים בני 4 ו-8 רוצים חודש באיטליה בקיץ עם רכב, תקציב 40 אלף, כשר', { a: 2, c: 2, ages: [4, 8], n: 30, m: 7, co: ['Italy'], b: 40000, nd: { car: 'yes', kosher: true }, stops: 2 }],
  ['זוג, ירח דבש, 10 לילות בבאלי בספטמבר, יוקרה, לא משנה המחיר', { a: 2, n: 10, m: 9, d: ['bali'], lux: true, b: null }],
  ['3 חברים אחרי צבא, חודשיים במזרח הרחוק, זול', { a: 3, n: 60, rg: ['asia'], cheap: true }],
  ['משפחה עם 3 ילדים בני 2, 6 ו-11, שבוע בכרתים באוגוסט, הכל כלול, עד 25 אלף', { a: 2, c: 3, ages: [2, 6, 11], n: 7, m: 8, d: ['crete'], b: 25000, nd: { allInclusive: true } }],
  ['סבא וסבתא שומרי שבת עם 2 נכדים בני 10 ו-12, 5 לילות בלונדון בחנוכה, כשר', { a: 2, c: 2, ages: [10, 12], n: 5, d: ['london'], m: 12, nd: { shabbat: true, kosher: true } }],
  ['4 חברות, סופ"ש ארוך בברצלונה באמצע מאי, חיי לילה, 3000 לאדם', { a: 4, n: 4, d: ['barcelona'], m: 5, anc: '2027-05-15', b: 12000, st: ['nightlife'] }],
  ['לבד, 3 שבועות בתאילנד בינואר, תרמילאי, זול', { a: 1, n: 21, m: 1, co: ['Thailand'], cheap: true }],
  ['זוג, מ-3 עד 10 באוגוסט, רומא ואז פירנצה, תקציב 15000', { a: 2, s: '2027-08-03', e: '2027-08-10', d: ['rome', 'florence-tuscany'], b: 15000 }],
  ['זוג + תינוק, שבוע וחצי ביוון ביוני, משהו רגוע עם בריכה', { a: 2, c: 1, inf: 1, n: 10, m: 6, co: ['Greece'], st: ['relaxation'], nd: { pool: true } }],
  ['a couple with 2 kids aged 4 and 8, a month in Italy this summer, with a car, budget 40k shekels, kosher', { a: 2, c: 2, ages: [4, 8], n: 30, m: 7, co: ['Italy'], b: 40000, nd: { car: 'yes', kosher: true } }],
  ['honeymoon, 10 nights in Bali in September, luxury, price is not an issue', { n: 10, m: 9, d: ['bali'], lux: true, b: null }],
  ['4 friends, long weekend in Barcelona mid May, nightlife, 3000 per person', { a: 4, n: 4, m: 5, b: 12000 }],
  ['solo, 3 weeks in Thailand in January, cheap', { a: 1, n: 21, m: 1, cheap: true }],
  ['family of 5 with kids 2, 6 and 11, a week in Crete in August, all inclusive, up to 25000 shekels', { a: 2, c: 3, ages: [2, 6, 11], n: 7, m: 8, b: 25000 }],

  // ---- second wave: written after the first round of fixes, to check the rules generalise (not tuned per sentence)
  ['טיול של חודש לאיטליה עם האישה', { n: 30, a: 2, co: ['Italy'] }],
  ['אנחנו זוג בני 60, חודש בפורטוגל', { n: 30, a: 2, c: 0 }],
  ['חופשה של 3 שבועות ביפן עם 2 ילדים בני 12 ו-15', { n: 21, c: 2, ages: [12, 15], d: ['japan'] }],
  ['מחפש משהו ל-10 לילות בתאילנד בפברואר', { n: 10, m: 2 }],
  ['נוסעים 5 חברים לחודש לדרום אמריקה', { a: 5, n: 30, rg: ['south-america'] }],
  ['לטוס לברצלונה ב-12.6 ל-5 לילות', { s: '2027-06-12', n: 5, d: ['barcelona'] }],
  ['מ-1.8 עד 15.8 ברודוס', { s: '2027-08-01', e: '2027-08-15', n: 14 }],
  ['מה-1 לאוגוסט ל-3 שבועות בכרתים', { s: '2027-08-01', n: 21 }],
  ['סוף דצמבר לאילת עם הילדים בני 4 ו-6', { m: 12, anc: '2026-12-24', c: 2 }],
  ['אמצע אוגוסט חודש בתאילנד', { m: 8, anc: '2027-08-15', n: 30 }],
  ['זוג ותינוק בן 8 חודשים, שבוע בקפריסין', { a: 2, c: 1, ages: [0], n: 7 }],
  ['תינוקת בת 3 חודשים וזוג, רודוס', { a: 2, c: 1, ages: [0] }],
  ['תקציב עד 6 אלף לזוג לשבוע ברומא', { b: 6000, n: 7 }],
  ['כ-8000 ש"ח, זוג, אתונה', { b: 8000 }],
  ['בין 10 ל-12 אלף, זוג, פריז', { b: 12000 }],
  ['עשרים אלף שקל, משפחה של 4, כרתים', { b: 20000 }],
  ['חמישה עשר אלף לזוג, יפן', { b: 15000 }],
  ['שתים עשרה לילות בבאלי', { n: 12 }],
  ['אחד עשר לילות בפוקט', { n: 11 }],
  ['משפחה: אבא, אמא ו-3 ילדים בני 3, 7, 12, כרתים', { a: 2, c: 3, ages: [3, 7, 12] }],
  ['שני מבוגרים ושלושה ילדים, רודוס', { a: 2, c: 3 }],
  ['ארבעה מבוגרים לוינה', { a: 4 }],
  ['קבוצה של 8 חברים, בודפשט', { a: 8 }],
  ['מסיבת רווקות, 6 בנות, מיקונוס', { a: 6, c: 0 }],
  ['אני וחברה טובה לפראג', { a: 2 }],
  ['אני ושלושה חברים, שבוע בכרתים', { a: 4 }],
  ['אני ועוד 2 חברות לאתונה', { a: 3 }],
  ['בשבוע הראשון של אוגוסט ברודוס', { m: 8 }],
  ['ב-31.12 לפראג ל-4 לילות', { s: '2026-12-31', n: 4 }],
  ['ערב ראש השנה לרומא', { m: 10, anc: '2027-10-01' }],
  ['בפברואר הקרוב לסקי', { m: 2, st: ['ski'] }],
  ['לחג החנוכה לאילת', { m: 12, anc: '2026-12-04' }],
  ['בחופשת חנוכה לרומא', { m: 12 }],
  ['בפסח הבא לברצלונה', { m: 4, anc: '2027-04-21' }],
  ['me and 3 friends, a week in Crete', { a: 4, n: 7 }],
  ['two adults, three kids (4, 7, 11), Rhodes, 10 nights', { a: 2, c: 3, ages: [4, 7, 11], n: 10 }],
  ['four of us, two months in South America', { a: 4, n: 60, rg: ['south-america'] }],
  ['a month in Thailand in February', { n: 30, m: 2 }],
  ['from the 1st to the 15th of August in Rhodes', { s: '2027-08-01', e: '2027-08-15' }],
  ['Aug 1-15, Rhodes', { s: '2027-08-01', e: '2027-08-15' }],
  ['mid-August, a month in Thailand', { m: 8, anc: '2027-08-15', n: 30 }],
  ['a week in Paris over Christmas', { m: 12, n: 7 }],
  ['budget 20k for everything, Crete', { b: 20000 }],
  ['$2,500 per person, 2 adults, Rome', { b: 18250 }],
  ['between 10 and 12 thousand shekels, Paris', { b: 12000 }],
  ['no Europe please, 10 nights, beach', { xrg: ['europe'], n: 10 }],
  ['my wife and I and our 2 kids aged 3 and 6, Crete, 7 nights', { a: 2, c: 2, ages: [3, 6] }],
  ['a girls trip, 5 of us, Mykonos', { a: 5 }],
  ['bachelor party, 8 guys, Budapest, 3 nights', { a: 8, n: 3 }],
  ['eleven nights in Bali', { n: 11 }],
  ['2-3 weeks in Japan', { n: 18 }],
  ['a couple with an 8 month old baby, a week in Cyprus', { a: 2, c: 1, inf: 1, ages: [0], n: 7 }],

  // ---- third wave: adversarial – "month" as a date, not a length; dates relative to a length; group arithmetic
  ['בשבוע הבא לחודש בתאילנד', { s: '2026-11-23', n: 30 }],
  ['בעוד חודש לשבוע ברומא', { s: '2026-12-16', n: 7 }],
  ['חודש מאי ברומא', { m: 5, n: 0 }],
  ['בחודש מאי, זוג, פריז', { m: 5, n: 0 }],
  ['החודש לרומא ל-3 לילות', { m: 11, n: 3 }],
  ['ב-15 לחודש הבא לאתונה, 4 לילות', { s: '2026-12-15', n: 4 }],
  ['לחודש ימים בבאלי', { n: 30 }],
  ['זוג וחבר, לונדון', { a: 3 }],
  ['אנחנו 2 זוגות ו-4 ילדים, כרתים', { a: 4, c: 4 }],
  ['שתי משפחות עם 5 ילדים, רודוס', { a: 4, c: 5 }],
  ['סבתא לבד עם 3 נכדים, אילת', { a: 1, c: 3 }],
  ['אני בן 30 ואשתי בת 28, פראג', { a: 2, c: 0 }],
  ['לסוף שבוע ארוך בחנוכה, בודפשט', { n: 4, m: 12 }],
  ['מ-10 ביולי לשבועיים, יוון', { s: '2027-07-10', n: 14, e: '2027-07-24' }],
  ['leaving July 10 for two weeks, Greece', { s: '2027-07-10', n: 14 }],
  ['for 4 people, kids are 3 and 6, Crete', { a: 2, c: 2, ages: [3, 6] }],
  ['Rome in may for 5 nights', { m: 5, n: 5 }],
  ['15/7-22/7 Crete', { s: '2027-07-15', e: '2027-07-22' }],
  ['Crete July 15-22', { s: '2027-07-15', e: '2027-07-22' }],
  ['Christmas in London for 4 nights with 2 kids 7 and 10', { m: 12, n: 4, c: 2, ages: [7, 10] }],
  ['a month from now, a week in Rome', { s: '2026-12-16', n: 7 }],
  ['the whole of August in Crete', { m: 8, n: 30 }],
  ['כל אוגוסט בכרתים', { m: 8, n: 30 }],
  ['Family ski holiday in the Austrian Alps in February, 7 nights, kids aged 8 and 11', { d: ['austrian-alps'], n: 7, ages: [8, 11] }],
  ['an Italian food tour, 10 days in Italy', { co: ['Italy'], n: 9 }],
  ['סקי באלפים האוסטריים בפברואר, שבוע', { d: ['austrian-alps'], n: 7 }],
  ['מ-3 ל-9 באוגוסט ברומא', { s: '2027-08-03', e: '2027-08-09', a: 2 }],

  // ---- genuinely ambiguous: exactly one clear question, never a silent guess
  ['מ-3 עד 10 באוגוסט, שבועיים ברומא', { s: '2027-08-03', q: 'nights-conflict' }],
  ['from 3 to 10 August, two weeks in Rome', { s: '2027-08-03', q: 'nights-conflict' }],
  ['ב-15 לחודש לרומא', { q: 'dates' }],
  ['שבוע', { q: 'destination' }]
];

// ---------------------------------------------------------------------------------------------------------------
// Generated combinations: realistic parts in shuffled order, every combination's expectation known by construction.
const DUR_HE = [['5 לילות', 5], ['חמישה לילות', 5], ['שבוע', 7], ['לשבוע', 7], ['שבוע וחצי', 10], ['שבועיים', 14], ['10 ימים', 9], ['עשרה ימים', 9],
  ['9 לילות', 9], ['חודש', 30], ['לחודש', 30], ['חודשיים', 60], ['3 שבועות', 21], ['שלושה שבועות', 21], ['סופ"ש', 3], ['סופ״ש ארוך', 4], ['4 לילות', 4],
  ['5-7 לילות', 6], ['12 לילות', 12], ['3 לילות', 3], ['שבועיים וחצי', 17], ['חודש וחצי', 45], ['8 ימים', 7], ['6 לילות', 6]];
const TRAV_HE = [['זוג', { a: 2, c: 0 }], ['אני ואשתי', { a: 2, c: 0 }], ['אני ובעלי', { a: 2, c: 0 }], ['אני ואשתי והתינוק', { a: 2, c: 1, inf: 1 }],
  ['זוג + 3 ילדים בני 2,5,9', { a: 2, c: 3, ages: [2, 5, 9] }], ['3 זוגות', { a: 6, c: 0 }], ['סבא וסבתא עם 2 נכדים בני 6 ו-9', { a: 2, c: 2, ages: [6, 9] }],
  ['לבד', { a: 1, c: 0 }], ['4 חברות', { a: 4, c: 0 }], ['זוג עם 2 נערים בני 14 ו-16', { a: 2, c: 2, ages: [14, 16] }], ['אנחנו 6 חברים', { a: 6, c: 0 }],
  ['2 מבוגרים ו-2 ילדים בני 4 ו-7', { a: 2, c: 2, ages: [4, 7] }], ['אמא עם ילדה בת 10', { a: 1, c: 1, ages: [10] }], ['שני זוגות', { a: 4, c: 0 }],
  ['אני והחבר שלי', { a: 2, c: 0 }], ['זוג עם תינוק בן שנה', { a: 2, c: 1, inf: 1, ages: [1] }], ['משפחה עם 2 ילדים בני 6 ו-11', { a: 2, c: 2, ages: [6, 11] }],
  ['אני ושני הילדים בני 8 ו-12', { a: 1, c: 2, ages: [8, 12] }]];
const DEST_HE = [['ברומא', { d: ['rome'] }], ['לברצלונה', { d: ['barcelona'] }], ['בברסלונה', { d: ['barcelona'] }], ['ביוון', { co: ['Greece'] }],
  ['באיטליה', { co: ['Italy'] }], ['בתאילנד', { co: ['Thailand'] }], ['ביפן', { d: ['japan'] }], ['בלונדון', { d: ['london'] }], ['בפאריז', { d: ['paris'] }],
  ['באמסטרדם', { d: ['amsterdam'] }], ['בבודפשט', { d: ['budapest'] }], ['בכרתים', { d: ['crete'] }], ['בדובאי', { d: ['dubai'] }], ['בניו יורק', { d: ['new-york'] }],
  ['בפראג', { d: ['prague'] }], ['בקפריסין', { d: ['cyprus'] }], ['באירופה', { rg: ['europe'] }], ['במזרח הרחוק', { rg: ['asia'] }], ['בליסבון', { d: ['lisbon'] }],
  ['ברודוס', { d: ['rhodes'] }], ['בוינה', { d: ['vienna'] }], ['בפורטוגל', { co: ['Portugal'] }]];
const DATE_HE = [['באוגוסט', { m: 8 }], ['ביולי', { m: 7 }], ['באמצע יולי', { m: 7, anc: '2027-07-15' }], ['בסוף ספטמבר', { m: 9, anc: '2027-09-24' }],
  ['בתחילת אוגוסט', { m: 8, anc: '2027-08-03' }], ['בפסח', { m: 4, anc: '2027-04-21' }], ['בחנוכה', { m: 12, anc: '2026-12-04' }], ['בסוכות', { m: 10, anc: '2027-10-15' }],
  ['בחופש הגדול', { m: 7 }], ['בקיץ', { m: 7 }], ['בחודש הבא', { m: 12 }], ['בדצמבר', { m: 12 }], ['במרץ', { m: 3 }], ['בינואר 2028', { m: 1, yr: 2028 }], ['במאי', { m: 5 }]];
const BUD_HE = [['תקציב 10,000 ₪', { b: 10000 }], ['עד 15 אלף', { b: 15000 }], ['מקסימום 8000 ש"ח', { b: 8000 }], ['בסביבות 12K', { b: 12000 }],
  ['תקציב 3000 לאדם', { pp: 3000 }], ['עד 20 אלף שקל לכולם', { b: 20000 }], ['תקציב של חמשת אלפים שקל', { b: 5000 }], ['עד 4.5K', { b: 4500 }],
  ['לא משנה המחיר', { b: null }], ['זול', { cheap: true }], ['תקציב 4,800 ש"ח', { b: 4800 }], ['עד 30 אלף', { b: 30000 }]];
const STY_HE = [['כשר', { nd: { kosher: true } }], ['שומרי שבת', { nd: { shabbat: true } }], ['הכול כלול', { nd: { allInclusive: true } }], ['נגיש לכיסא גלגלים', { nd: { accessible: true } }],
  ['עם רכב', { nd: { car: 'yes' } }], ['בלי רכב', { nd: { car: 'no' } }], ['חיי לילה', { st: ['nightlife'] }], ['משהו רגוע', { st: ['relaxation'] }], ['יוקרה', { st: ['luxury'] }],
  ['טיסה ישירה', { nd: { direct: true } }], ['עם בריכה', { nd: { pool: true } }]];
const PRE_HE = ['', '', 'רוצים ', 'מחפשים ', 'בא לנו ', 'אנחנו מתכננים ', 'היי, ', 'תבנו לנו '];

const DUR_EN = [['5 nights', 5], ['a week', 7], ['for a week', 7], ['a week and a half', 10], ['two weeks', 14], ['a fortnight', 14], ['10 days', 9], ['9 nights', 9],
  ['a month', 30], ['one month', 30], ['two months', 60], ['3 weeks', 21], ['three weeks', 21], ['a weekend', 3], ['a long weekend', 4], ['4 nights', 4], ['5-7 nights', 6], ['12 nights', 12]];
const TRAV_EN = [['a couple', { a: 2, c: 0 }], ['me and my wife', { a: 2, c: 0 }], ['me and my wife and our baby', { a: 2, c: 1, inf: 1 }], ['a couple with 3 kids aged 2, 5 and 9', { a: 2, c: 3, ages: [2, 5, 9] }],
  ['3 couples', { a: 6, c: 0 }], ['solo', { a: 1, c: 0 }], ['4 friends', { a: 4, c: 0 }], ['2 adults and 2 kids aged 4 and 7', { a: 2, c: 2, ages: [4, 7] }],
  ['grandparents with 2 grandkids aged 6 and 9', { a: 2, c: 2, ages: [6, 9] }], ['family of 4 with kids 5 and 8', { a: 2, c: 2, ages: [5, 8] }]];
const DEST_EN = [['in Rome', { d: ['rome'] }], ['to Barcelona', { d: ['barcelona'] }], ['in Greece', { co: ['Greece'] }], ['in Italy', { co: ['Italy'] }], ['in Thailand', { co: ['Thailand'] }],
  ['in Japan', { d: ['japan'] }], ['in London', { d: ['london'] }], ['in Paris', { d: ['paris'] }], ['in Crete', { d: ['crete'] }], ['somewhere in Europe', { rg: ['europe'] }], ['in the Far East', { rg: ['asia'] }], ['in Prague', { d: ['prague'] }]];
const DATE_EN = [['in August', { m: 8 }], ['in July', { m: 7 }], ['mid July', { m: 7, anc: '2027-07-15' }], ['end of September', { m: 9, anc: '2027-09-24' }], ['over Passover', { m: 4, anc: '2027-04-21' }],
  ['over Hanukkah', { m: 12, anc: '2026-12-04' }], ['this summer', { m: 7 }], ['next month', { m: 12 }], ['in December', { m: 12 }], ['in March', { m: 3 }]];
const BUD_EN = [['budget 10,000 NIS', { b: 10000 }], ['up to 15k shekels', { b: 15000 }], ['max 8000 ILS', { b: 8000 }], ['3000 shekels per person', { pp: 3000 }], ['$3000 total', { b: 10950 }],
  ['money is no object', { b: null }], ['cheap', { cheap: true }]];
const STY_EN = [['kosher', { nd: { kosher: true } }], ['shabbat observant', { nd: { shabbat: true } }], ['all inclusive', { nd: { allInclusive: true } }], ['wheelchair accessible', { nd: { accessible: true } }],
  ['with a rental car', { nd: { car: 'yes' } }], ['nightlife', { st: ['nightlife'] }], ['relaxing', { st: ['relaxation'] }], ['luxury', { st: ['luxury'] }], ['direct flights', { nd: { direct: true } }]];

function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32); }
const mergeExp = (...xs) => xs.reduce((o, x) => { for (const [k, v] of Object.entries(x)) o[k] = k === 'nd' ? { ...(o.nd || {}), ...v } : k === 'st' ? [...(o.st || []), ...v] : v; return o; }, {});

function generate(count, lang, seed) {
  const r = rng(seed), pick = (list) => list[Math.floor(r() * list.length)], out = [], seen = new Set();
  const banks = lang === 'he' ? { dur: DUR_HE, trav: TRAV_HE, dest: DEST_HE, date: DATE_HE, bud: BUD_HE, sty: STY_HE } : { dur: DUR_EN, trav: TRAV_EN, dest: DEST_EN, date: DATE_EN, bud: BUD_EN, sty: STY_EN };
  for (let guard = 0; out.length < count && guard < count * 20; guard++) {
    const [dur, nights] = pick(banks.dur), [trav, tx] = pick(banks.trav), [dest, dx] = pick(banks.dest);
    const parts = [[dur, { n: nights }], [trav, tx], [dest, dx]];
    if (r() < 0.8) parts.push(pick(banks.date));
    if (r() < 0.5) parts.push(pick(banks.bud));
    if (r() < 0.5) parts.push(pick(banks.sty));
    // Shuffle, keeping "duration + place" adjacent half of the time ("שבוע ברומא").
    for (let i = parts.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [parts[i], parts[j]] = [parts[j], parts[i]]; }
    const sep = r() < 0.7 ? ', ' : ' ';
    const text = (lang === 'he' ? pick(PRE_HE) : '') + parts.map((p) => p[0]).join(sep);
    if (seen.has(text)) continue;
    seen.add(text);
    const exp = mergeExp(...parts.map((p) => p[1]));
    if (exp.pp) { exp.b = exp.pp * ((exp.a || 2) + (exp.c || 0)); delete exp.pp; }
    // A country, region or several bases: two places are a route only when named; a country for ≥ 2 weeks is a multi-base trip.
    if ((exp.co || exp.rg) && nights >= 14 && exp.co) exp.stops = 2;
    // Shabbat-observant travellers never get a Saturday flight: the planner may move an approximate anchor by a day or two.
    if (exp.nd?.shabbat && exp.anc) exp.ancLoose = true;
    out.push([text, exp]);
  }
  return out;
}

export const CORPUS = [...H, ...generate(230, 'he', 7), ...generate(90, 'en', 11)];

// ---------------------------------------------------------------------------------------------------------------
const sameSet = (a = [], b = []) => a.length === b.length && a.every((x) => b.includes(x));
const sub = (want = [], got = []) => want.every((x) => got.includes(x));
const people = (r) => r.adults + r.children;

export function check(text, exp, { today = TODAY } = {}) {
  const lang = /[א-ת]/.test(text) ? 'he' : 'en';
  const r = parseTrip(text, { today, lang, fx: exp.noFx ? null : FX });
  const p = planPackage(r, { today });
  const fails = [], f = (field, got, want) => fails.push({ field, got, want });
  const pr = p.request || r, stops = p.stops?.length ? p.stops : p.destination ? [p.destination] : [];
  // ---- understanding
  if ('n' in exp && r.nights !== exp.n) f('nights', r.nights, exp.n);
  if ('s' in exp && r.start !== exp.s) f('start', r.start, exp.s);
  if ('e' in exp && r.end !== exp.e) f('end', r.end, exp.e);
  if ('m' in exp && r.month !== exp.m && Number((r.start || '').slice(5, 7)) !== exp.m) f('month', r.month, exp.m);
  if ('anc' in exp && r.anchor !== exp.anc) f('anchor', r.anchor, exp.anc);
  if ('a' in exp && r.adults !== exp.a) f('adults', r.adults, exp.a);
  if ('c' in exp && r.children !== exp.c) f('children', r.children, exp.c);
  if ('inf' in exp && r.infants !== exp.inf) f('infants', r.infants, exp.inf);
  if ('ages' in exp && JSON.stringify(r.childAges) !== JSON.stringify(exp.ages)) f('childAges', r.childAges, exp.ages);
  if ('b' in exp && (r.budget ?? null) !== exp.b) f('budget', r.budget, exp.b);
  if (exp.cheap && r.budgetLevel !== 'low') f('cheap', r.budgetLevel, 'low');
  if (exp.lux && r.budgetLevel !== 'high') f('luxury', r.budgetLevel, 'high');
  if ('d' in exp && JSON.stringify(r.destinations) !== JSON.stringify(exp.d)) f('destinations', r.destinations, exp.d);
  if ('sl' in exp && !sameSet(r.shortlist, exp.sl)) f('shortlist', r.shortlist, exp.sl);
  if ('co' in exp && !sub(exp.co, r.countries)) f('countries', r.countries, exp.co);
  if ('x' in exp && !sub(exp.x, r.exclude)) f('exclude', r.exclude, exp.x);
  if ('rg' in exp && !sub(exp.rg, r.regions || [])) f('regions', r.regions, exp.rg);
  if ('xrg' in exp && !sub(exp.xrg, r.excludeRegions || [])) f('excludeRegions', r.excludeRegions, exp.xrg);
  if ('st' in exp && !sub(exp.st, r.styles)) f('styles', r.styles, exp.st);
  for (const [k, v] of Object.entries(exp.nd || {})) if (r.needs[k] !== v) f(`needs.${k}`, r.needs[k], v);
  if ('q' in exp && !(r.questionIds || []).includes(exp.q)) f('question', r.questionIds || r.questions, exp.q);
  // ---- end to end: the package keeps what was asked
  if (!p.destination) { if (!exp.q) f('pkg.destination', null, 'a destination'); return { text, fails, r, p }; }
  if (exp.n && !r.legs && pr.nights !== exp.n) f('pkg.nights', pr.nights, exp.n);
  if (exp.n && stops.length && stops.reduce((s, x) => s + x.nights, 0) !== pr.nights) f('pkg.stopNights', stops.map((s) => s.nights), pr.nights);
  if ('s' in exp && !exp.q && pr.start !== exp.s) f('pkg.start', pr.start, exp.s);
  if ('e' in exp && !exp.q && pr.end !== exp.e) f('pkg.end', pr.end, exp.e);
  if ('anc' in exp && !exp.ancLoose && pr.start !== exp.anc) f('pkg.start(anchor)', pr.start, exp.anc);
  if ('m' in exp && !('s' in exp) && Number(pr.start.slice(5, 7)) !== exp.m && !exp.ancLoose) f('pkg.month', pr.start, exp.m);
  if ('yr' in exp && Number(pr.start.slice(0, 4)) !== exp.yr) f('pkg.year', pr.start, exp.yr);
  if ('a' in exp && pr.adults !== exp.a) f('pkg.adults', pr.adults, exp.a);
  if ('c' in exp || 'a' in exp) {
    const seats = (p.flightSearch?.passengers?.ptcList || []).reduce((s, x) => s + x.count, 0);
    if (seats !== people(pr)) f('pkg.passengers', seats, people(pr));
  }
  if ('b' in exp && exp.b && (pr.budget !== exp.b || !p.budgetPlan)) f('pkg.budget', pr.budget, exp.b);
  if ('b' in exp && exp.b === null && pr.budget) f('pkg.budget', pr.budget, null);
  if ('d' in exp && exp.d.length === 1 && p.destination.id !== exp.d[0]) f('pkg.destination', p.destination.id, exp.d[0]);
  if ('d' in exp && exp.d.length > 1 && JSON.stringify(stops.map((s) => s.id)) !== JSON.stringify(exp.d)) f('pkg.route', stops.map((s) => s.id), exp.d);
  if ('sl' in exp && !exp.sl.includes(p.destination.id)) f('pkg.shortlist', p.destination.id, exp.sl);
  if ('co' in exp && !stops.every((s) => exp.co.includes(byId(s.id)?.country?.en))) f('pkg.country', stops.map((s) => s.id), exp.co);
  if ('x' in exp && stops.some((s) => exp.x.includes(s.id))) f('pkg.excluded', stops.map((s) => s.id), exp.x);
  if ('rg' in exp && !stops.every((s) => exp.rg.some((id) => inRegion(byId(s.id), id)))) f('pkg.region', stops.map((s) => byId(s.id)?.region), exp.rg);
  if ('xrg' in exp && stops.some((s) => exp.xrg.some((id) => inRegion(byId(s.id), id)))) f('pkg.excludedRegion', stops.map((s) => byId(s.id)?.region), exp.xrg);
  if ('stops' in exp && stops.length < exp.stops) f('pkg.stops', stops.map((s) => `${s.id}:${s.nights}`), `≥ ${exp.stops}`);
  if (exp.said) {
    const said = JSON.stringify(p.assumed || []);
    if (!said.includes(exp.said)) f('pkg.said', p.assumed, exp.said);
  }
  // Every day of the stay is in the itinerary, and every free day carries ideas (long trips are never truncated).
  if (p.itinerary && p.itinerary.length !== pr.nights + 1) f('pkg.itineraryDays', p.itinerary.length, pr.nights + 1);
  if ((p.itinerary || []).some((d) => d.kind === 'free' && !(d.ideas || []).length)) f('pkg.freeIdeas', 'free day without ideas', 'ideas');
  return { text, fails, r, p };
}

export function runStress({ corpus = CORPUS } = {}) {
  const results = corpus.map(([text, exp]) => ({ ...check(text, exp), exp }));
  const failed = results.filter((x) => x.fails.length);
  const byField = {};
  for (const x of failed) for (const fl of x.fails) (byField[fl.field] ||= []).push(x);
  return { total: results.length, passed: results.length - failed.length, rate: (results.length - failed.length) / results.length, failed, byField,
    hebrew: corpus.filter(([t]) => /[א-ת]/.test(t)).length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const res = runStress(), args = process.argv.slice(2);
  const pick = args.indexOf('--case');
  if (pick >= 0) {
    for (const [text, exp] of CORPUS.filter(([t]) => t.includes(args[pick + 1]))) {
      const { r, p, fails } = check(text, exp);
      console.log('\n>>', text, JSON.stringify(exp));
      console.log(JSON.stringify({ nights: r.nights, start: r.start, end: r.end, month: r.month, anchor: r.anchor, adults: r.adults, children: r.children, ages: r.childAges, infants: r.infants, budget: r.budget,
        level: r.budgetLevel, dest: r.destinations, shortlist: r.shortlist, countries: r.countries, regions: r.regions, xregions: r.excludeRegions, exclude: r.exclude, styles: r.styles, needs: r.needs, q: r.questionIds, questions: r.questions }));
      console.log('PKG', JSON.stringify({ stops: (p.stops?.length ? p.stops : [p.destination]).filter(Boolean).map((s) => `${s.id}:${s.nights}`), start: p.request?.start, end: p.request?.end, nights: p.request?.nights, assumed: p.assumed, kinds: (p.itinerary || []).map((d) => d.kind[0]).join('') }));
      console.log('FAILS', JSON.stringify(fails));
    }
    process.exit(0);
  }
  console.log(`stress corpus: ${res.passed}/${res.total} (${(100 * res.rate).toFixed(1)}%) · Hebrew ${res.hebrew}, English ${res.total - res.hebrew}`);
  console.log(Object.entries(res.byField).sort((a, b) => b[1].length - a[1].length).map(([k, v]) => `${k} ${v.length}`).join(' · '));
  const show = args.includes('--all') ? res.failed : res.failed.slice(0, 60);
  for (const x of show) console.log(`✗ ${x.text}\n   ${x.fails.map((fl) => `${fl.field}: got ${JSON.stringify(fl.got)} want ${JSON.stringify(fl.want)}`).join(' | ')}`);
}
