// Customisation and conversation for the trip builder (owner 18.11.2026): the specific things people ask for – an
// airline, flight times, a bag, the hotel's area or type, the pace, what to skip or have more of – and the follow-up
// messages that refine a plan ("רק אל על", "עוד לילה", "יותר זול", "במקום רומא – ברצלונה"). Pure and shared by the
// browser, the server and the tests: no DOM, no network.
import { t } from './i18n.mjs';

// ---- airlines: the supplier names carriers in English ("El Al", "Wizz Air"); `key` is matched inside those names.
export const AIRLINES = [
  ['el al', /אל[ -]?על|\bel ?al\b/i, 'אל על', 'El Al'], ['israir', /ישראייר|\bisrair\b/i, 'ישראייר', 'Israir'], ['arkia', /ארקיע|\barkia\b/i, 'ארקיע', 'Arkia'],
  ['wizz', /וו?יז ?(?:אייר)?(?![א-ת])|\bwizz/i, 'וויז אייר', 'Wizz Air'], ['ryanair', /רי?י?א?ינאייר|\bryan ?air/i, 'ריינאייר', 'Ryanair'], ['easyjet', /איזי ?ג['׳]?ט|\beasy ?jet/i, 'איזיג׳ט', 'easyJet'],
  ['lufthansa', /לופטהנזה|\blufthansa/i, 'לופטהנזה', 'Lufthansa'], ['turkish', /טורקיש|\bturkish airlines|\bturkish\b(?= air| flight)/i, 'טורקיש', 'Turkish Airlines'],
  ['aegean', /אג['׳]?יאן|\baegean/i, 'אג׳יאן', 'Aegean'], ['british', /בריטיש|\bbritish airways/i, 'בריטיש איירווייז', 'British Airways'],
  ['air france', /אייר פר?א?נס|\bair france/i, 'אייר פראנס', 'Air France'], ['klm', /\bklm\b|קיי אל אם/i, 'KLM', 'KLM'], ['swiss', /סוויס(?:אייר| אייר)|\bswiss(?: international)? air/i, 'סוויס', 'Swiss'],
  ['austrian', /אוסטריאן|\baustrian airlines/i, 'אוסטריאן', 'Austrian'], ['ita', /\bita airways|אליטליה|\balitalia|איטה איירווייז/i, 'ITA', 'ITA Airways'],
  ['emirates', /אמירייטס|\bemirates/i, 'אמירייטס', 'Emirates'], ['flydubai', /פליי ?דובאי|\bfly ?dubai/i, 'פליידובאי', 'flydubai'], ['etihad', /אתיחאד|\betihad/i, 'אתיחאד', 'Etihad'],
  ['pegasus', /פגסוס|\bpegasus/i, 'פגסוס', 'Pegasus'], ['blue bird', /בלו ?בירד|\bblue ?bird/i, 'בלו בירד', 'Bluebird'], ['air europa', /אייר אירופה|\bair europa/i, 'אייר אירופה', 'Air Europa'],
  ['vueling', /וו?אלינג|ווילינג|\bvueling/i, 'וואלינג', 'Vueling'], ['tap', /\btap (?:air|portugal)|טאפ/i, 'TAP', 'TAP'], ['thai', /תאי איירווייז|\bthai airways/i, 'תאי', 'Thai Airways'],
  ['delta', /דלתא|\bdelta air/i, 'דלתא', 'Delta'], ['united', /יונייטד|\bunited airlines/i, 'יונייטד', 'United']
];
export const LOW_COST = ['wizz', 'ryanair', 'easyjet', 'pegasus', 'vueling', 'flydubai'];
export const airlineName = (key, l = 'he') => { const a = AIRLINES.find((x) => x[0] === key); return a ? (l === 'en' ? a[3] : a[2]) : key; };
export const carrierMatches = (names, key) => (names || []).some((n) => String(n).toLowerCase().includes(key));

const NEG = /(?:^|[\s,(])(?:ו?בלי|ו?ללא|ו?לא|חוץ מ|not|no|without|avoid|except|but not)\s*(?:עם\s+|ב|with\s+)?$/i;
const ONLY = /(?:רק|בלבד|אך ורק|\bonly\b|exclusively)/i;

// The preferences a message states (empty when it states none). Hebrew and English.
export function parsePrefs(text) {
  const s = String(text || ''), low = s.toLowerCase(), prefs = { flight: {}, hotel: {}, pace: '', avoidKinds: [], moreKinds: [] };
  // Airlines: "רק אל על" (only), "עם ישראייר" (prefer), "בלי ריינאייר" / "לא לואוקוסט" (avoid).
  const only = [], prefer = [], avoid = [];
  for (const [key, rx] of AIRLINES) {
    const m = rx.exec(s); if (!m) continue;
    const before = s.slice(Math.max(0, m.index - 14), m.index), after = s.slice(m.index, m.index + m[0].length + 10);
    if (NEG.test(before)) avoid.push(key); else if (ONLY.test(before) || /בלבד|\bonly\b/i.test(after)) only.push(key); else prefer.push(key);
  }
  if (/(?:בלי|ללא|לא)\s*(?:חברות\s*)?(?:לואו ?קוסט|לו ?קוסט|זולות)|no low[- ]?cost|avoid low[- ]?cost|not (?:a )?low[- ]?cost/i.test(s)) avoid.push(...LOW_COST);
  if (only.length) prefs.flight.only = [...new Set(only)];
  if (prefer.length && !only.length) prefs.flight.prefer = [...new Set(prefer)];
  if (avoid.length) prefs.flight.avoid = [...new Set(avoid)];
  // Times, bag, stops.
  if (/(?:בלי|ללא|לא)\s*טיסות?\s*(?:ב)?לילה|לא\s+בלילה|no (?:night|red[- ]?eye|overnight) flights?|no red[- ]?eyes?/i.test(s)) prefs.flight.noNight = true;
  if (/טיסת בוקר|לטוס בבוקר|יציאה בבוקר|morning flight|fly (?:out )?in the morning/i.test(s)) prefs.flight.out = ['morning'];
  else if (/לא (?:לקום )?מוקדם|לא בבוקר|טיסת צהריים|אחרי הצהריים|not too early|no early (?:flights?|departures?)|afternoon flight/i.test(s)) prefs.flight.out = ['afternoon', 'evening'];
  if (/לחזור בערב|חזרה בערב|חזרה מאוחרת|לחזור מאוחר|return (?:in the )?evening|late return|fly back late/i.test(s)) prefs.flight.back = ['evening'];
  else if (/לחזור בבוקר|חזרה בבוקר|return in the morning|early return/i.test(s)) prefs.flight.back = ['morning'];
  if (/מזוודה|מזוודות|כבודה רשומה|checked (?:bag|luggage|baggage)|a suitcase/i.test(s) && !/בלי מזוודה|no (?:checked )?bag/i.test(s)) prefs.flight.checkedBag = true;
  if (/בלי מזוודה|רק טרולי|no checked bag|carry[- ]on only|hand luggage only/i.test(s)) prefs.flight.checkedBag = false;
  if (/(?:רק\s+)?(?:טיסה|טיסות)\s+ישיר(?:ה|ות)|בלי (?:עצירות|קונקשן|חיבורים)|direct (?:flights? )?only|non-?stop/i.test(s)) prefs.flight.direct = true;
  // Hotel: where and what kind. A kind the live search cannot filter is handed to the agent (said in the plan).
  if (/על הים|ליד הים|קרוב לים|על החוף|ליד החוף|נוף לים|beach ?front|by the (?:beach|sea)|near the (?:beach|sea)|sea view|ocean view/i.test(s)) prefs.hotel.area = 'beach';
  else if (/במרכז|מרכזי|קרוב למרכז|בעיר העתיקה|city cent(?:er|re)|in the cent(?:er|re)|central(?:ly)?|old town/i.test(s)) prefs.hotel.area = 'center';
  else if (/מקום שקט|אזור שקט|רחוק מהרעש|quiet (?:area|neighbou?rhood|hotel)/i.test(s)) prefs.hotel.area = 'quiet';
  if (/דירה|דירת נופש|אפרטמנט|apartment|airbnb|aparthotel/i.test(s)) prefs.hotel.type = 'apartment';
  else if (/וילה|villa/i.test(s)) prefs.hotel.type = 'villa';
  else if (/ריזורט|resort/i.test(s)) prefs.hotel.type = 'resort';
  else if (/מלון בוטיק|boutique/i.test(s)) prefs.hotel.type = 'boutique';
  if (/למבוגרים בלבד|רק מבוגרים במלון|adults[- ]only/i.test(s)) prefs.hotel.adultsOnly = true;
  if (/חדר משפחתי|חדרים מחוברים|family room|connecting rooms/i.test(s)) prefs.hotel.familyRoom = true;
  // Pace and content.
  if (/(?:יותר|קצב)\s*רגוע|לא לרוץ|בלי לחץ|פחות אטרקציות|פחות עמוס|לאט|relaxed pace|slower|less packed|fewer (?:things|activities|sights)|take it easy/i.test(s)) prefs.pace = 'relaxed';
  else if (/יותר אטרקציות|יותר פעילויות|אינטנסיבי|כמה שיותר|לראות הכול|מלא אטרקציות|packed|more (?:activities|sights|attractions)|see (?:it all|everything)|intense/i.test(s)) prefs.pace = 'packed';
  const KIND = [['museum', /מוזיאונ|museums?/], ['religious', /כנסיות|כנסייה|מקדשים|בתי תפילה|churches|temples/], ['beach', /חופים|ים(?![א-ת])|beach(?:es)?/],
    ['nature', /טבע|טיולים בטבע|הליכות|טרקים|nature|hik(?:e|es|ing)/], ['market', /שווקים|שוק|markets?/], ['experience', /חוויות|פעילויות|אטרקציות לילדים|activities|experiences/],
    ['nightlife', /חיי לילה|מסיבות|ברים|nightlife|parties|bars/], ['shopping', /קניות|שופינג|shopping/], ['daytrip', /טיולי יום|day trips?/]];
  for (const [kind, rx] of KIND) {
    const m = new RegExp(`(?:^|[\\s,])(?:בלי|ללא|לא רוצים|פחות|no|without|skip|less|fewer)\\s+(?:ה)?(?:${rx.source})`, 'i').test(low);
    const more = new RegExp(`(?:^|[\\s,])(?:יותר|עוד|הרבה|more|lots of|extra)\\s+(?:ה)?(?:${rx.source})`, 'i').test(low);
    if (m) prefs.avoidKinds.push(kind); else if (more) prefs.moreKinds.push(kind);
  }
  return prefs;
}
const empty = (p) => !p || (!Object.keys(p.flight || {}).length && !Object.keys(p.hotel || {}).length && !p.pace && !p.avoidKinds?.length && !p.moreKinds?.length);
// Later wins, field by field (a new airline choice replaces the old one; lists of things to skip add up).
export function mergePrefs(a = {}, b = {}) {
  const fa = a.flight || {}, fb = b.flight || {};
  const flight = { ...fa, ...fb };
  if (fb.only) { flight.only = fb.only; delete flight.prefer; flight.avoid = (fa.avoid || []).filter((k) => !fb.only.includes(k)); }
  if (fb.prefer) { flight.prefer = fb.prefer; delete flight.only; }
  if (fb.avoid) { flight.avoid = [...new Set([...(fa.avoid || []), ...fb.avoid])]; if (flight.only) flight.only = flight.only.filter((k) => !fb.avoid.includes(k)); }
  for (const k of ['only', 'prefer', 'avoid']) if (!flight[k]?.length) delete flight[k];
  const avoidKinds = [...new Set([...(a.avoidKinds || []).filter((k) => !(b.moreKinds || []).includes(k)), ...(b.avoidKinds || [])])];
  const moreKinds = [...new Set([...(a.moreKinds || []).filter((k) => !(b.avoidKinds || []).includes(k)), ...(b.moreKinds || [])])];
  return { flight, hotel: { ...(a.hotel || {}), ...(b.hotel || {}) }, pace: b.pace || a.pace || '', avoidKinds, moreKinds };
}

// ---- a follow-up message on top of the request so far. `next` is the follow-up parsed alone (parseTrip); only what
// it states changes, plus the relative wishes people say in a conversation ("עוד לילה", "יותר זול", "תחליף לברצלונה").
const ADD = /(?:^|\s)(?:תוסיף|להוסיף|הוסף|וגם|גם\s+ל|גם\s+ב|ועוד\s+\d|add|also|plus|as well)/i;
export function refineRequest(prev, next, text) {
  const s = String(text || ''), has = (f) => (next.understood || []).some((u) => u.field === f);
  const r = { ...prev, needs: { ...prev.needs }, styles: [...prev.styles], exclude: [...(prev.exclude || [])], destinations: [...prev.destinations], prefs: mergePrefs(prev.prefs, next.prefs) };
  if (has('adults')) r.adults = next.adults;
  if (has('children') || has('childAges') || has('infants')) { r.children = next.children; r.childAges = next.childAges; r.infants = next.infants; }
  if (has('start')) { r.start = next.start; r.end = next.end; r.month = next.month; r.year = next.year; r.anchor = next.anchor; r.holiday = next.holiday; }
  else if (has('month') || next.holiday) { r.month = next.month; r.start = ''; r.end = ''; r.anchor = next.anchor; r.holiday = next.holiday; r.year = next.year; }
  if (has('nights') && next.nights) { r.nights = next.nights; if (!has('start')) r.end = ''; }
  // Relative length and dates.
  const more = s.match(/(?:עוד|תוסיף|להוסיף)\s*(\d+)?\s*לילות?|(?:לילה|יום)\s+(?:נוסף|נוסף אחד|יותר)|(\d+|one|two|an?)\s+(?:more|extra)\s+nights?/i);
  const less = s.match(/(?:לילה|יום)\s+(?:פחות|אחד פחות)|(?:פחות|תוריד|להוריד)\s*(\d+)?\s*(?:לילה|לילות|יום|ימים)|(\d+|one|a)\s+(?:night|day)s?\s+(?:less|fewer|shorter)|one night less|shorter by (\d+)/i);
  const num = (x) => (x === undefined ? 1 : /^(?:one|a|an)$/i.test(x) ? 1 : /^two$/i.test(x) ? 2 : Number(x) || 1);
  if (!has('nights') && more && r.nights) { r.nights = Math.min(90, r.nights + num(more[1] ?? more[2])); r.end = ''; }
  if (!has('nights') && less && r.nights) { r.nights = Math.max(1, r.nights - num(less[1] ?? less[2] ?? less[3])); r.end = ''; }
  const shift = /שבוע (?:אחרי|אח״כ|אחר כך|קדימה|מאוחר)|week later/i.test(s) ? 7 : /שבוע (?:לפני|קודם|מוקדם)|week earlier/i.test(s) ? -7 : 0;
  if (shift && r.start) { const d = (iso) => { const x = new Date(iso + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + shift); return x.toISOString().slice(0, 10); }; r.start = d(r.start); if (r.end) r.end = d(r.end); }
  // Money and level.
  if (next.budget) r.budget = next.budget;
  if (/(?:יותר\s+זול|זול\s+יותר|תוזיל|להוזיל|חסכוני יותר|cheaper|less expensive|lower (?:the )?price)/i.test(s)) { r.budgetLevel = 'low'; r.needs.minStars = 0; r.cheaperStep = true; }
  if (/(?:יותר\s+(?:יוקרתי|מפנק|טוב)|מלון\s+(?:יותר\s+)?טוב\s+יותר|שדרוג|לשדרג|upgrade|nicer hotel|more luxurious|better hotel)/i.test(s)) { r.budgetLevel = 'high'; r.needs.minStars = Math.min(5, Math.max(4, (prev.needs.minStars || 4) + 1)); }
  if (next.needs.minStars) r.needs.minStars = next.needs.minStars;
  if (next.needs.board) { r.needs.board = next.needs.board; r.needs.allInclusive = next.needs.allInclusive; }
  for (const k of ['kosher', 'shabbat', 'accessible', 'pool', 'direct']) if (next.needs[k]) r.needs[k] = true;
  if (r.prefs.flight.direct) r.needs.direct = true;
  if (next.needs.car !== 'auto') r.needs.car = next.needs.car;
  if (next.maxFlightHours) r.maxFlightHours = next.maxFlightHours;
  // Places: a new place replaces the route unless they add it; "בלי X" removes it.
  if (next.destinations.length) { r.destinations = ADD.test(s) ? [...new Set([...r.destinations, ...next.destinations])] : next.destinations; r.suggest = false; r.shortlist = []; }
  if (next.replaced?.length) r.destinations = r.destinations.filter((id) => !next.replaced.includes(id));
  if (next.exclude?.length) { r.exclude = [...new Set([...r.exclude, ...next.exclude])]; r.destinations = r.destinations.filter((id) => !next.exclude.includes(id)); }
  if (next.countries.length && !next.destinations.length) { r.countries = next.countries; r.destinations = []; r.suggest = true; }
  if (next.legNights?.length && next.legNights.length === r.destinations.length) r.legNights = next.legNights;
  r.styles = [...new Set([...r.styles, ...next.styles])];
  if (next.boost?.length) r.boost = next.boost;
  r.text = `${prev.text}\n${s}`;
  r.understood = next.understood; r.questions = []; r.questionIds = [];
  return r;
}

// ---- what changed, said back to the visitor ("עדכנתי: רק אל על · 8 לילות · מלון 5★").
export function describeChange(before, after, l = 'he') {
  if (!before || !after) return [];
  const a = before.request, b = after.request, out = [], say = (key, vars) => out.push(t(`build.chat.change.${key}`, vars, l));
  const names = (p) => (p.stops?.length ? p.stops : [p.destination]).filter(Boolean).map((s) => (typeof s.name === 'object' ? s.name[l] || s.name.he : s.name)).join(' ← ');
  if (names(before) !== names(after)) say('place', { place: names(after) });
  if (a.nights !== b.nights) say('nights', { nights: b.nights });
  if (a.start !== b.start) say('dates', { start: b.start, end: b.end });
  if (a.adults !== b.adults || a.children !== b.children) say('who', { adults: b.adults, children: b.children });
  if ((a.budget || 0) !== (b.budget || 0) && b.budget) say('budget', { amount: `₪${b.budget.toLocaleString('en-US')}` });
  if ((a.needs?.minStars || 0) !== (b.needs?.minStars || 0) && b.needs?.minStars) say('stars', { stars: b.needs.minStars });
  if (a.needs?.board !== b.needs?.board && b.needs?.board) say('board', { board: t(`build.understood.board.${b.needs.board}`, {}, l) });
  if (a.needs?.car !== b.needs?.car && b.needs?.car !== 'auto') say(b.needs.car === 'yes' ? 'carYes' : 'carNo');
  if (!a.needs?.direct && b.needs?.direct) say('direct');
  const fa = a.prefs?.flight || {}, fb = b.prefs?.flight || {}, list = (xs) => xs.map((k) => airlineName(k, l)).join(', ');
  if (JSON.stringify(fa.only) !== JSON.stringify(fb.only) && fb.only?.length) say('only', { list: list(fb.only) });
  if (JSON.stringify(fa.prefer) !== JSON.stringify(fb.prefer) && fb.prefer?.length) say('prefer', { list: list(fb.prefer) });
  if (JSON.stringify(fa.avoid) !== JSON.stringify(fb.avoid) && fb.avoid?.length) say('avoid', { list: list(fb.avoid.filter((k) => !(fa.avoid || []).includes(k))) || list(fb.avoid) });
  if (!fa.noNight && fb.noNight) say('noNight');
  if (JSON.stringify(fa.out) !== JSON.stringify(fb.out) && fb.out) say(fb.out.includes('morning') ? 'outMorning' : 'outLate');
  if (JSON.stringify(fa.back) !== JSON.stringify(fb.back) && fb.back) say(fb.back.includes('evening') ? 'backEvening' : 'backMorning');
  if (fa.checkedBag !== fb.checkedBag && fb.checkedBag !== undefined) say(fb.checkedBag ? 'bag' : 'noBag');
  const ha = a.prefs?.hotel || {}, hb = b.prefs?.hotel || {};
  if (ha.area !== hb.area && hb.area) say(`area.${hb.area}`);
  if (ha.type !== hb.type && hb.type) say(`type.${hb.type}`);
  if ((a.prefs?.pace || '') !== (b.prefs?.pace || '') && b.prefs?.pace) say(`pace.${b.prefs.pace}`);
  for (const k of (b.prefs?.avoidKinds || []).filter((k) => !(a.prefs?.avoidKinds || []).includes(k))) say('skip', { what: t(`build.kind.${k}`, {}, l) });
  for (const k of (b.prefs?.moreKinds || []).filter((k) => !(a.prefs?.moreKinds || []).includes(k))) say('more', { what: t(`build.kind.${k}`, {}, l) });
  if (b.budgetLevel === 'low' && a.budgetLevel !== 'low') say('cheaper');
  return out;
}
export const hasPrefs = (p) => !empty(p);
