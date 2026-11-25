// Customisation and conversation for the trip builder (owner 18.11.2026): the specific things people ask for – an
// airline, flight times, a bag, the hotel's area or type, the pace, what to skip or have more of – and the follow-up
// messages that refine a plan ("רק אל על", "עוד לילה", "יותר זול", "במקום רומא – ברצלונה"). Pure and shared by the
// browser, the server and the tests: no DOM, no network.
import { t } from './i18n.mjs';
import { byId, normalize } from './catalog.mjs';

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
const ADD = /(?:^|\s)(?:תוסיף|להוסיף|הוסף|וגם|גם\s+ל|גם\s+ב|גם(?=\s)|ועוד\s+\d|add|also|plus|as well)/i;
const activityAction = /(?:^|\s)(תוסיף|תוסיפו|להוסיף|הוסף|הוסיפו|תכניסו?|add|include|תורידו?|להוריד|להסיר|הסירו?|תסירו?|תוותרו?|בלי|ללא|remove|skip|without)\s+(?:את\s+)?(.*)/i;
export const activityKey = (dest, item) => `${dest}|${item.name.en}`;
export function activityUpdates(text, ids) {
  const changes = [];
  for (const clause of text.split(/[,;.!?\n]|\s+(?=ו?(?:תוסיף|תוריד|תסיר)\s)|\s+and\s+(?=add\s|remove\s|skip\s)/i)) {
    const match = clause.replace(/^ו(?=תוסיף|תוריד|תסיר)/, '').match(activityAction);
    if (!match) continue;
    const action = /תוסף|תוסיף|תוסיפו|להוסיף|הוסף|הוסיפו|תכניס|add|include/i.test(match[1]) ? 'add' : 'remove';
    const phrase = ` ${normalize(match[2])} `;
    for (const id of ids) {
      const dest = byId(id);
      for (const item of [...(dest?.attractions || []), ...(dest?.dayTrips || [])]) {
        if (Object.values(item.name).some((name) => phrase.includes(` ${normalize(name)} `))) changes.push({ key: activityKey(id, item), action });
      }
    }
  }
  return changes;
}

export function refineRequest(prev, next, text) {
  const s = String(text || ''), has = (f) => (next.understood || []).some((u) => u.field === f);
  const r = { ...prev, needs: { ...prev.needs }, styles: [...prev.styles], exclude: [...(prev.exclude || [])], destinations: [...prev.destinations], prefs: mergePrefs(prev.prefs, next.prefs) };
  if (has('adults')) r.adults = next.adults;
  if (has('children') || has('childAges') || has('infants')) { r.children = next.children; r.childAges = next.childAges; r.infants = next.infants; }
  const explicitOrigin = has('origin') && /(?:לצאת|יוצא(?:ים|ות)?|יציאה|טיס[הו]|נוסעים)\s+מ|\bfrom\s/i.test(s);
  if (explicitOrigin || /מנתב[״"׳']?ג|מתל אביב|from (?:tel aviv|tlv)/i.test(s)) r.origin = next.origin;
  const wanted = explicitOrigin ? next.destinations.filter((id) => {
    const dest = byId(id);
    return dest?.code !== next.origin && !dest?.airports?.includes(next.origin);
  }) : next.destinations;
  const datesChanged = next.start || next.month || next.anchor || next.holiday;
  if (datesChanged) {
    r.start = next.start; r.end = next.end; r.month = next.month; r.year = next.year;
    r.anchor = next.anchor; r.holiday = next.holiday; r.datesAssumed = !next.start || next.datesAssumed;
    r.legs = null;
  }
  // Relative length and dates. A relative length ("עוד לילה", "one night less") counts from the plan on screen – the
  // parser alone reads "עוד לילה" as its default + 1 (23.11.2026: after a hand edit to 7 nights it gave 6).
  const more = s.match(/(?:עוד|תוסיף|להוסיף)\s*(\d+)?\s*(?:לילה|לילות|ימים|יום(?!\s+ב(?:ה)?(?:ים|טבע|חוף)))|(?:לילה|יום)\s+(?:נוסף|נוסף אחד|יותר)|(\d+|one|two|an?)\s+(?:more|extra)\s+nights?/i);
  const less = s.match(/(?:לילה|יום)\s+(?:פחות|אחד פחות)|(?:פחות|תוריד|להוריד)\s*(\d+)?\s*(?:לילה|לילות|יום|ימים)|(\d+|one|a)\s+(?:night|day)s?\s+(?:less|fewer|shorter)|one night less|shorter by (\d+)/i);
  const num = (x) => (x === undefined ? 1 : /^(?:one|a|an)$/i.test(x) ? 1 : /^two$/i.test(x) ? 2 : Number(x) || 1);
  const shift = /שבוע (?:אחרי|אח״כ|אחר כך|קדימה|מאוחר)|week later/i.test(s) ? 7 : /שבוע (?:לפני|קודם|מוקדם)|week earlier/i.test(s) ? -7 : 0;
  if (has('nights') && next.nights && !more && !less && !shift) { r.nights = next.nights; if (!next.end) r.end = ''; }
  if (more && r.nights) { r.nights = Math.min(90, r.nights + num(more[1] ?? more[2])); r.end = ''; }
  if (less && r.nights) { r.nights = Math.max(1, r.nights - num(less[1] ?? less[2] ?? less[3])); r.end = ''; }
  if (shift && r.start) { const d = (iso) => { const x = new Date(iso + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + shift); return x.toISOString().slice(0, 10); }; r.start = d(r.start); if (r.end) r.end = d(r.end); r.month = Number(r.start.slice(5, 7)); r.year = Number(r.start.slice(0, 4)); }
  if (shift || r.nights !== prev.nights || next.end) { r.legs = null; if (r.nights !== prev.nights || next.end) r.legNights = []; }
  // Money and level.
  if (next.budget) r.budget = next.budget;
  if (/בלי (?:מגבלת|תקרת) תקציב|אין (?:מגבלת|תקרת) תקציב|no budget (?:cap|limit)/i.test(s)) r.budget = null;
  if (/(?:יותר\s+זול|זול\s+יותר|תוזיל|להוזיל|חסכוני יותר|cheaper|less expensive|lower (?:the )?price)/i.test(s)) { r.budgetLevel = 'low'; r.needs.minStars = 0; r.cheaperStep = true; }
  if (/(?:יותר\s+(?:יוקרתי|מפנק|טוב)|מלון\s+(?:יותר\s+)?טוב\s+יותר|שדרוג|לשדרג|upgrade|nicer hotel|more luxurious|better hotel)/i.test(s)) { r.budgetLevel = 'high'; r.needs.minStars = Math.min(5, Math.max(4, (prev.needs.minStars || 4) + 1)); }
  if (next.needs.minStars) { r.needs.minStars = next.needs.minStars; if (has('stars')) r.asked = { ...r.asked, stars: true }; }
  if (next.needs.board) { r.needs.board = next.needs.board; r.needs.allInclusive = next.needs.allInclusive; }
  if (/בלי (?:ארוחת בוקר|ארוחות)|לינה בלבד|room.only|no (?:breakfast|meals)/i.test(s)) { r.needs.board = ''; r.needs.allInclusive = false; }
  for (const k of ['kosher', 'shabbat', 'accessible', 'pool', 'direct']) if (next.needs[k]) r.needs[k] = true;
  if (r.prefs.flight.direct) r.needs.direct = true;
  if (/אפשר (?:גם )?(?:עציר(?:ה|ות)|קונקשן)|ישיר(?:ה|ות|ים)? לא חובה|לא חייב(?:ים)? (?:טיסה )?ישיר|stops (?:are )?(?:fine|okay)|connections? (?:are )?(?:fine|okay)/i.test(s)) { r.needs.direct = false; delete r.prefs.flight.direct; }
  if (/(?:לא צריך|לא חייב|בלי דרישת) כשר|kosher (?:is )?not required/i.test(s)) r.needs.kosher = false;
  if (next.needs.car !== 'auto') r.needs.car = next.needs.car;
  if (next.maxFlightHours) r.maxFlightHours = next.maxFlightHours;
  // Places: a new place replaces the route unless they add it; "בלי X" removes it.
  if (wanted.length) {
    const before = r.destinations, adding = ADD.test(s) && before.length > 0;
    r.destinations = adding ? [...new Set([...before, ...wanted])] : wanted; r.suggest = false; r.shortlist = [];
    // "תוסיף יום בפירנצה" / "add 2 nights in Florence" (owner 23.11.2026): the new place gets that many nights ON TOP of
    // the plan – the places already there keep theirs (not a re-split of the same length).
    // A length said with the new place ("תוסיף 2 לילות בפירנצה") is that place's, not the whole trip's.
    const extra = adding ? s.match(/(?:(\d+)\s*)?(?:ימים|יום|לילות|לילה)|(\d+|one|two|a|an)?\s*(?:extra\s+|more\s+)?(?:days?|nights?)\b/i) : null;
    const added = r.destinations.filter((id) => !before.includes(id));
    const known = Array.isArray(prev.legNights) && prev.legNights.length === before.length ? prev.legNights : before.length === 1 && prev.nights ? [prev.nights] : null;
    if (extra && added.length === 1 && known) {
      const n = Math.min(14, Math.max(1, (has('nights') && next.nights) || Number(extra[1]) || (/^two$/i.test(extra[2] || '') ? 2 : Number(extra[2]) || 1)));
      r.legNights = [...known, n]; r.nights = Math.min(90, known.reduce((a, b) => a + b, 0) + n); r.end = '';
    }
  }
  if (next.replaced?.length) r.destinations = r.destinations.filter((id) => !next.replaced.includes(id));
  if (next.exclude?.length) { r.exclude = [...new Set([...r.exclude, ...next.exclude])]; r.destinations = r.destinations.filter((id) => !next.exclude.includes(id)); }
  if (next.countries.length && !wanted.length && !explicitOrigin) { r.countries = next.countries; r.destinations = []; r.suggest = true; }
  if (!wanted.length && !next.countries.length && (next.regions?.length || /יעד אחר|תציעו יעד|different destination|suggest another (?:place|destination)/i.test(s))) {
    r.exclude = [...new Set([...r.exclude, ...prev.destinations])];
    r.regions = next.regions || []; r.countries = []; r.destinations = []; r.suggest = true;
  }
  if (next.legNights?.length && next.legNights.length === r.destinations.length) r.legNights = next.legNights;
  if (r.destinations.join() !== prev.destinations.join()) {
    r.legs = next.legs;
    if (r.legNights?.length !== r.destinations.length) r.legNights = [];
  }
  if (!r.end && r.legNights?.length && r.legNights.reduce((a, b) => a + b, 0) !== r.nights) r.legNights = [];
  if (next.occasion) r.occasion = next.occasion;
  if (next.budgetLevel !== 'mid' && !has('stars')) r.budgetLevel = next.budgetLevel;
  r.styles = [...new Set([...r.styles, ...next.styles])];
  if (has('children') && !r.children) { r.styles = r.styles.filter((style) => style !== 'family'); if (r.occasion === 'family') r.occasion = ''; }
  if (next.tags) r.tags = { must: [...new Set([...(r.tags?.must || []), ...next.tags.must])], nice: [...new Set([...(r.tags?.nice || []), ...next.tags.nice])] };
  const acts = [...(next.activityChanges || []), ...activityUpdates(s, r.destinations)];
  if (acts.length) r.activities = { ...r.activities, ...Object.fromEntries(acts.map(({ key, action }) => [key, action])) };
  if (next.boost?.length) r.boost = next.boost;
  r.text = `${prev.text}\n${s}`.slice(-1500);
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
  if (a.start !== b.start || a.end !== b.end) say('dates', { start: b.start, end: b.end });
  if (a.adults !== b.adults || a.children !== b.children) say('who', { adults: b.adults, children: b.children });
  if ((a.budget || 0) !== (b.budget || 0)) { if (b.budget) say('budget', { amount: `₪${b.budget.toLocaleString('en-US')}` }); else say('noBudgetCap'); }
  if ((a.needs?.minStars || 0) !== (b.needs?.minStars || 0) && b.needs?.minStars) say('stars', { stars: b.needs.minStars });
  if (a.needs?.board !== b.needs?.board) { if (b.needs?.board) say('board', { board: t(`build.understood.board.${b.needs.board}`, {}, l) }); else say('roomOnly'); }
  if (a.needs?.car !== b.needs?.car && b.needs?.car !== 'auto') say(b.needs.car === 'yes' ? 'carYes' : 'carNo');
  if (!a.needs?.direct && b.needs?.direct) say('direct');
  if (a.needs?.direct && !b.needs?.direct) say('connections');
  if (a.origin !== b.origin) say('origin', { code: b.origin });
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
  const planned = new Map((after.itinerary || []).flatMap((day) => day.items.filter((item) => item.dest && item.en).map((item) => [`${item.dest}|${item.en}`, item.name])));
  for (const [key, action] of Object.entries(b.activities || {})) if (a.activities?.[key] !== action) {
    const [id, ...nameParts] = key.split('|'), name = nameParts.join('|'), dest = byId(id);
    const item = [...(dest?.attractions || []), ...(dest?.dayTrips || [])].find((place) => place.name.en === name);
    if (item) say(action === 'remove' ? 'removedPlace' : planned.has(key) ? 'addedPlace' : 'placeUnavailable', { place: item.name[l] || name });
  }
  return out;
}
export const hasPrefs = (p) => !empty(p);
