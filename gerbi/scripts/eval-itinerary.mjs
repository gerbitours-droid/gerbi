// Itinerary + budget quality evaluation for the magic trip builder (spec 24).
// Runs realistic Hebrew/English requests through the SAME planner functions the server uses
// (parseTrip → planPackage; backend/build.mjs plan() minus the optional LLM partner), no network, no AI,
// and measures how well the day-by-day plan and the budget handling fit the request.
//   node scripts/eval-itinerary.mjs            → summary table + docs/qa/itinerary-eval.json
//   node scripts/eval-itinerary.mjs --case 7   → print one case's full itinerary
// Deterministic: fixed "today", fixed FX, recorded supplier fixtures only (tests/fixtures/build/).
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { parseTrip, planPackage, pace, roomsOf, weekday } from '../dist/trip-builder.mjs';
import { pricePackage, groundEstimate } from '../dist/trip-package.mjs';
import { byId, normalize } from '../dist/catalog.mjs';
import { flightPicks } from '../backend/build.mjs';
import { slimHotel, rankHotels, hotelEstimate } from '../backend/hotels.mjs';

const TODAY = '2026-11-16';
const FX = { rates: { USD: 3.65, EUR: 3.95, ILS: 1 } }; // fixed for determinism (stated assumption)
const root = new URL('../', import.meta.url);
const fixture = async (n) => JSON.parse(await readFile(new URL(`tests/fixtures/build/${n}.json`, root), 'utf8'));
const FLIGHTS = await fixture('flights'), HOTELS = await fixture('hotels');

// ---------------------------------------------------------------- cases
// expect.dest: acceptable destination ids when the visitor asked us to suggest (or the one they named).
// budget cases carry budget text; `month` is implied by the text.
const CASES = [
  // families – young kids
  { id: 1, tag: 'family-young', lang: 'he', text: 'זוג עם 2 ילדים בני 3 ו-5, 5 לילות ברומא באפריל' },
  { id: 2, tag: 'family-young', lang: 'en', text: 'Family with a 2 year old and a 4 year old, 4 nights in Paris in May' },
  { id: 3, tag: 'family-young', lang: 'he', text: 'משפחה עם תינוק בן שנה וילדה בת 4, 5 לילות באילת בדצמבר' },
  { id: 4, tag: 'family-mid', lang: 'he', text: 'משפחה עם 2 ילדים בני 6 ו-9, אוגוסט, שבוע, בריכה והכול כלול, כשר', expect: { suggest: (d) => d.tags.includes('family') && d.bestMonths.includes(8) && d.flightHours <= 6 } },
  { id: 5, tag: 'family-teens', lang: 'he', text: 'משפחה עם שני ילדים בני 14 ו-16, שבוע בברצלונה ביולי' },
  { id: 6, tag: 'family-ski', lang: 'en', text: 'Family ski holiday in the Austrian Alps in February, 7 nights, kids aged 8 and 11' },
  { id: 7, tag: 'family-long', lang: 'he', text: 'משפחה עם ילדים בני 5 ו-8, 14 לילות בפלורידה באוגוסט' },
  { id: 8, tag: 'family-cheap-suggest', lang: 'he', text: 'חופשה זולה עם ילדים בני 4 ו-7 במאי, 5 לילות, תציעו', expect: { suggest: (d) => d.tags.includes('family') && d.bestMonths.includes(5) && d.budgetLevel <= 2 && d.flightHours <= 5 } },
  // couples / honeymoon
  { id: 9, tag: 'couple', lang: 'he', text: 'זוג, 4 לילות בפריז במאי, רומנטי, אוכל טוב' },
  { id: 10, tag: 'couple', lang: 'en', text: 'Romantic getaway for a couple, 5 nights in Santorini in June' },
  { id: 11, tag: 'honeymoon-suggest', lang: 'he', text: 'ירח דבש, 8 לילות, מלון יוקרה, תציעו לנו', expect: { suggest: (d) => d.tags.includes('couple') || d.tags.includes('luxury') } },
  { id: 12, tag: 'couple-culture', lang: 'en', text: 'Couple, 3-night city break in Rome in March, culture and food' },
  // friends / nightlife
  { id: 13, tag: 'friends-night', lang: 'he', text: 'אנחנו 4 חברים, 3 לילות בבודפשט, חיי לילה ומסיבות' },
  { id: 14, tag: 'friends-night', lang: 'en', text: 'Group of 5 friends, party and nightlife in Mykonos, 4 nights in July' },
  { id: 15, tag: 'friends-night', lang: 'he', text: '3 חברות, ברלין 4 לילות, ברים ואוכל' },
  // solo / culture
  { id: 16, tag: 'solo', lang: 'en', text: 'Solo traveller, 5 nights in Lisbon in October, culture and food' },
  { id: 17, tag: 'solo-long', lang: 'he', text: 'אני לבד, 10 לילות בבנגקוק בפברואר' },
  { id: 18, tag: 'culture', lang: 'he', text: 'זוג אוהבי תרבות ומוזיאונים, 4 לילות בווינה בנובמבר' },
  { id: 19, tag: 'culture', lang: 'en', text: 'History lovers, 2 adults, 3 nights in Athens in March' },
  { id: 20, tag: 'culture', lang: 'he', text: 'זוג, 5 לילות בלונדון, מוזיאונים והיסטוריה' },
  // beach / season
  { id: 21, tag: 'beach', lang: 'he', text: 'זוג, 7 לילות בכרתים באוגוסט, ים וחופים, עם רכב' },
  { id: 22, tag: 'beach-winter-suggest', lang: 'he', text: 'רוצים חופשת ים בדצמבר, 6 לילות, תציעו', expect: { suggest: (d) => d.tags.includes('beach') && d.bestMonths.includes(12) } },
  { id: 23, tag: 'beach-offseason', lang: 'en', text: 'Beach holiday in Cyprus in January, 5 nights, 2 adults' },
  { id: 24, tag: 'beach-offseason', lang: 'he', text: 'זוג, חופשת ים ברודוס בפברואר, 5 לילות' },
  // nature
  { id: 25, tag: 'nature', lang: 'he', text: 'זוג, 7 לילות בגאורגיה ביוני, טבע והרים, עם רכב' },
  { id: 26, tag: 'nature', lang: 'en', text: 'Hiking and nature in Slovenia, 6 nights in June, 2 adults, no car' },
  { id: 27, tag: 'nature-long', lang: 'he', text: 'זוג, 8 לילות באיסלנד באוגוסט, טבע ומפלים, רכב שכור' },
  { id: 28, tag: 'nature-summer-alps', lang: 'en', text: 'Swiss Alps in August, 7 nights, nature and mountains, with a car, 2 adults' },
  // ski
  { id: 29, tag: 'ski', lang: 'he', text: 'זוג, סקי בבנסקו בינואר, 6 לילות' },
  { id: 30, tag: 'ski-suggest', lang: 'he', text: 'סקי בפברואר, 6 לילות, 2 מבוגרים, תציעו', expect: { suggest: (d) => d.tags.includes('ski') && d.bestMonths.includes(2) } },
  { id: 31, tag: 'ski-wrong-season', lang: 'he', text: 'סקי ביולי, 6 לילות, תציעו', expect: { suggest: (d) => d.tags.includes('ski') && d.bestMonths.includes(7) && d.region === 'oceania' } },
  // all-inclusive / kosher / shabbat
  { id: 32, tag: 'all-inclusive-suggest', lang: 'he', text: 'חופשת הכל כלול עם ילדים בני 5 ו-10 ביוני, 6 לילות, תציעו', expect: { suggest: (d) => d.tags.includes('all_inclusive') && d.bestMonths.includes(6) } },
  { id: 33, tag: 'all-inclusive', lang: 'en', text: 'All inclusive in Phuket in February, 10 nights, 2 adults, relaxation and beach' },
  { id: 34, tag: 'shabbat', lang: 'he', text: 'זוג דתי שומרי שבת, אוכל כשר, פראג, 5 לילות במרץ' },
  { id: 35, tag: 'shabbat-family', lang: 'he', text: 'משפחה שומרת שבת עם ילדים בני 4 ו-7, כשר, לונדון, 6 לילות ביולי' },
  // short / long
  { id: 36, tag: 'short', lang: 'he', text: 'זוג, 3 לילות באמסטרדם בסוף מרץ' },
  { id: 37, tag: 'long', lang: 'he', text: 'זוג, 12 לילות בטוסקנה ופירנצה בספטמבר, עם רכב' },
  { id: 38, tag: 'long', lang: 'he', text: 'זוג, 10 לילות ביפן באפריל' },
  { id: 39, tag: 'multi-city', lang: 'he', text: 'זוג, רומא ופירנצה, 8 לילות במאי' },
  // suggest / budget level words
  { id: 40, tag: 'suggest-cheap', lang: 'en', text: "We don't know where to go, 2 adults, cheap, 5 nights in March", expect: { suggest: (d) => d.budgetLevel <= 2 && d.bestMonths.includes(3) } },
  { id: 41, tag: 'luxury', lang: 'en', text: 'Luxury trip to Dubai, 5 nights in January, 5-star hotel, 2 adults' },
  { id: 42, tag: 'relax-short', lang: 'he', text: 'זוג, מנוחה בים המלח, 3 לילות בדצמבר' },
  // ---- budget cases (owner scope addition)
  { id: 43, tag: 'budget-low', lang: 'he', text: 'זוג, 4 לילות ברומא במאי, תקציב עד 6000 ש"ח', budget: true },
  { id: 44, tag: 'budget-mid', lang: 'he', text: 'זוג, 5 לילות ברומא במאי, תקציב 12000 ש"ח', budget: true },
  { id: 45, tag: 'budget-family-low', lang: 'he', text: 'משפחה עם 2 ילדים בני 5 ו-9, שבוע ביוון באוגוסט, עד 15000 שקל', budget: true },
  { id: 46, tag: 'budget-family-suggest', lang: 'he', text: 'משפחה עם 3 ילדים, 6 לילות ביולי, עד 18000 ש"ח, תציעו', budget: true, expect: { suggest: (d) => d.budgetLevel <= 2 && d.flightHours <= 5 } },
  { id: 47, tag: 'budget-per-person', lang: 'he', text: 'זוג לברצלונה 4 לילות ביוני, 4000 לאדם', budget: true },
  { id: 48, tag: 'budget-per-person-kw', lang: 'he', text: 'זוג לברצלונה 4 לילות ביוני, תקציב 4000 ש"ח לאדם', budget: true },
  { id: 49, tag: 'budget-usd', lang: 'en', text: 'Couple, Rome 4 nights in May, budget $3000', budget: true },
  { id: 50, tag: 'budget-long', lang: 'he', text: 'זוג, 12 לילות בתאילנד, פוקט, בפברואר, עד 16000 ש"ח', budget: true },
  { id: 51, tag: 'budget-long-family', lang: 'en', text: 'Family of 4, kids 6 and 10, 10 nights in Florida in April, up to 30000 shekels, with a car', budget: true },
  { id: 52, tag: 'budget-high', lang: 'en', text: 'Honeymoon in the Maldives, 7 nights in February, budget 45000 shekels', budget: true },
  { id: 53, tag: 'budget-ski', lang: 'he', text: 'זוג, סקי בבנסקו בינואר, 6 לילות, עד 7000 ש"ח', budget: true },
  { id: 54, tag: 'budget-cheap-suggest', lang: 'he', text: 'זוג, משהו זול במרץ, 4 לילות, עד 5000 ש"ח, תציעו', budget: true, expect: { suggest: (d) => d.budgetLevel <= 2 && d.flightHours <= 4.5 } },
  { id: 55, tag: 'budget-thousands-word', lang: 'he', text: 'זוג לרומא 4 לילות במאי, עד 10 אלף שקל', budget: true }
];

// The destination(s) a case names explicitly: the plan must be built there (and only there).
const NAMED = { 1: ['rome'], 2: ['paris'], 3: ['eilat'], 5: ['barcelona'], 6: ['austrian-alps'], 7: ['florida'], 9: ['paris'], 10: ['santorini'], 12: ['rome'], 13: ['budapest'], 14: ['mykonos'], 15: ['berlin'],
  16: ['lisbon'], 17: ['bangkok'], 18: ['vienna'], 19: ['athens'], 20: ['london'], 21: ['crete'], 23: ['cyprus'], 24: ['rhodes'], 25: ['georgia'], 26: ['slovenia'], 27: ['iceland'], 28: ['swiss-alps'], 29: ['bansko'],
  33: ['phuket'], 34: ['prague'], 35: ['london'], 36: ['amsterdam'], 37: ['florence-tuscany'], 38: ['japan'], 39: ['rome', 'florence-tuscany'], 41: ['dubai'], 42: ['dead-sea'], 43: ['rome'], 44: ['rome'],
  47: ['barcelona'], 48: ['barcelona'], 49: ['rome'], 50: ['phuket'], 51: ['florida'], 52: ['maldives'], 53: ['bansko'], 55: ['rome'],
  // "a week in Greece" names a country: one or two Greek bases are fine, four stops in 7 nights for a family are not.
  45: (ids) => ids.length <= 2 && ids.every((id) => byId(id).country.en === 'Greece') };
// ---------------------------------------------------------------- helpers
const kidsUnder6 = (r) => r.childAges.some((a) => a < 6) || r.infants > 0;
// What the CUSTOMER asked for, independent of the code's PREFER map (occasion counts too).
function intentTags(r) {
  const s = new Set();
  const M = { family: ['family', 'with_children', 'water_slides'], couple: ['couple', 'food'], beach: ['beach', 'relaxation'], city: ['culture', 'food', 'shopping'], culture: ['culture'], food: ['food'],
    nature: ['nature', 'adventure'], nightlife: ['nightlife', 'food'], relaxation: ['relaxation', 'beach'], ski: ['ski', 'adventure', 'nature'], shopping: ['shopping'], luxury: ['luxury', 'couple'] };
  for (const st of r.styles) (M[st] || []).forEach((t) => s.add(t));
  if (r.children) ['family', 'with_children', 'water_slides'].forEach((t) => s.add(t));
  if (['couple', 'honeymoon'].includes(r.occasion)) ['couple', 'food'].forEach((t) => s.add(t));
  if (r.occasion === 'friends') ['nightlife', 'food', 'adventure'].forEach((t) => s.add(t));
  return s;
}
const matches = (a, want) => (a.tags || []).some((t) => want.has(t));
const GENERIC = new Set('the and of de da di del la le el los las to at in on with a an & old new town city national park museum museums beach beaches market markets island islands tower palace street square church cathedral quarter district gardens garden view viewpoint lake river bay hill hills mount mountain day trip tour cruise walk walking centre center historic its world great grand royal house castle bridge harbour port night evening evenings best every sunset trail valley falls waterfall coast village villages'.split(' '));
const words = (s) => normalize(s).split(' ').filter((w) => w.length >= 4 && !GENERIC.has(w));
// A catalog attraction counts as a must-see when one of its distinctive name words appears in the destination's highlights.
function mustSees(d) {
  const hl = (d.highlights || []).map((h) => normalize(h.en)).join(' | ');
  return d.attractions.filter((a) => words(a.name.en).some((w) => hl.includes(w)));
}
const byName = (d) => new Map(d.attractions.map((a) => [a.name.he, a]).concat(d.attractions.map((a) => [a.name.en, a])));

// ---------------------------------------------------------------- budget model (no supplier calls)
// Flights: per traveller round trip in ILS, from flight hours (economy, booked ~2 months out). Infants 10%.
const flightModel = (d, r) => {
  const per = 350 + 230 * d.flightHours, low = per * (d.direct ? 1 : 1.15), high = low * 1.7;
  const pax = r.adults + r.children + 0.1 * (r.infants || 0);
  return { low: low * pax, high: high * pax };
};
// Hotel per room-night ILS at 3★ by the destination's budgetLevel; stars and board multiply. Range = 25th–75th pct proxy.
const HOTEL3 = { 1: 300, 2: 450, 3: 650, 4: 950 };
const hotelModel = (d, stop, r, minStars, board) => {
  const rooms = roomsOf(r).length, mult = (minStars >= 5 ? 2.3 : minStars >= 4 ? 1.4 : 1) * (board === 'AI' ? 1.8 : board === 'FB' ? 1.5 : board === 'HB' ? 1.3 : 1);
  const low = HOTEL3[d.budgetLevel] * mult * rooms * stop.nights;
  return { low, high: low * 1.35 };
};
const CAR = { low: 170, high: 300 }, INS = { low: 30, high: 50 }, TRANSFER = { low: 150, high: 400 };

function budgetAnalysis(p, c) {
  const r = p.request, stops = p.stops.length ? p.stops : [p.destination];
  const days = r.nights + 1, people = r.adults + r.children;
  const d0 = byId(stops[0].id);
  // 1) what the SYSTEM would show today: flight live (fixture for Rome-like cases, else model) + hotel estimate + ground.
  const fl = flightModel(d0, r);
  let flightSource = 'model', flightHigh = fl.high, flightLow = fl.low, fixturePick = null;
  if (stops.length === 1 && stops[0].id === 'rome' && r.adults === 2 && !r.children) {
    const picks = flightPicks(FLIGHTS, r, 'he');
    const all = FLIGHTS.offers.map((o) => o.fareDetails.totalPrice.selling.value).sort((a, b) => a - b);
    fixturePick = { selectedUsd: picks[0]?.price.value, cheapestUsd: all[0], pickRank: all.indexOf(picks[0]?.price.value) + 1, offers: all.length };
    flightHigh = flightLow = picks[0].price.value * FX.rates.USD; flightSource = 'fixture-live';
  }
  let fixtureHotelRoles = null;
  const hotels = stops.map((s, i) => {
    const hs = p.hotelSearches[i], d = byId(s.id);
    // The recorded hotel fixture (Rome, unknown stay length) only shows the ranking mechanism; its prices are not used.
    const fx_ = s.id === 'rome' ? rankHotels(HOTELS.hotels.map((h) => slimHotel(h, hs.board)), hs).picks.slice(0, 3).map((h) => `${h.role}:${h.stars}* $${h.price.value}`) : null;
    if (fx_) fixtureHotelRoles = fx_;
    return { source: 'model', ...hotelModel(d, s, r, hs.minStars, hs.board), minStars: hs.minStars };
  });
  const ground = groundEstimate(p) || { low: 0, high: 0 };
  const pkg = { request: r, destination: p.destination, stops: p.stops, flights: { status: 'live', picks: [{ key: 'k', price: { value: Math.round(flightHigh), currency: 'ILS' } }], selected: 'k' },
    hotels: stops.length > 1 ? { stops: hotels.map((h) => ({ status: 'estimate', estimate: { stay: { low: h.low, high: h.high }, currency: 'ILS' } })) } : { status: 'estimate', estimate: { stay: { low: hotels[0].low, high: hotels[0].high }, currency: 'ILS' } },
    car: p.car, insurance: { include: true } };
  const priced = pricePackage(pkg, FX);
  // 2) the full trip cost the customer will actually pay (HIGH ends), in the order a cap would be applied.
  const carDays = p.car.include ? r.nights : 0;
  const steps = [
    ['flights', flightHigh], ['hotel', hotels.reduce((s, h) => s + h.high, 0)], ['ground', ground.high],
    ['car', carDays * CAR.high], ['insurance', days * people * INS.high], ['transfers', p.car.include ? 0 : stops.length * TRANSFER.high * Math.ceil(people / 4) * 2]
  ];
  let cum = 0, firstOver = '';
  const cumulative = steps.map(([k, v]) => { cum += v; if (r.budget && !firstOver && cum > r.budget) firstOver = k; return [k, Math.round(v), Math.round(cum)]; });
  const fullHigh = Math.round(cum);
  const systemHigh = priced.total?.high ?? null;
  return { budget: r.budget, budgetLevel: r.budgetLevel, flightSource, fixturePick, hotelSource: hotels.map((h) => h.source), fixtureHotelRoles, hotelMinStars: hotels.map((h) => h.minStars),
    systemTotal: priced.total, systemVerdict: priced.budget?.verdict || (r.budget ? 'n/a' : 'no-budget'), linesNotInTotal: priced.lines.filter((l) => l.kind === 'quote').map((l) => l.id),
    fullHigh, steps: cumulative, firstOverAt: firstOver || (r.budget ? '' : null), overBy: r.budget ? fullHigh - r.budget : null,
    hiddenOverrun: Boolean(r.budget && priced.budget && priced.budget.verdict !== 'over' && fullHigh > r.budget),
    // Spec 28: the plan itself says it cannot fit (closest + actions) instead of presenting an over-budget package.
    planFits: p.budgetPlan ? p.budgetPlan.fits : null, planOverBy: p.budgetPlan?.overBy ?? null, planActions: p.budgetPlan && !p.budgetPlan.fits ? { nights: p.budgetPlan.nights || null, raiseTo: p.budgetPlan.raiseTo, alternatives: (p.budgetPlan.alternatives || []).map((a) => a.id) } : null };
}

// ---------------------------------------------------------------- per-case evaluation
function evaluate(c) {
  const t0 = performance.now();
  const req = parseTrip(c.text, { today: TODAY, lang: c.lang, fx: FX }); // FX: "$3000" converts like the server does
  const p = planPackage(req, { today: TODAY });
  const ms = performance.now() - t0;
  if (!p.destination) return { ...c, error: 'no destination', ms };
  const r = p.request, pc = pace(r), want = intentTags(r);
  const month = Number(r.start.slice(5, 7));
  const stops = p.stops.length ? p.stops : [p.destination];
  const issues = [];
  const days = p.itinerary.map((d) => {
    const dest = byId(stops[d.stop].id), names = byName(dest);
    const items = d.items.map((x) => ({ ...x, a: names.get(x.name) || null }));
    const hours = items.reduce((s, x) => s + (x.durationH || 0), 0);
    return { ...d, dest, items, hours, areas: [...new Set(items.map((x) => x.a?.area).filter(Boolean))] };
  });
  const attractionItems = days.flatMap((d) => d.items.filter((x) => x.a));
  const full = days.filter((d) => d.kind === 'full');
  // 1. style / who fit
  const styleShare = want.size && attractionItems.length ? attractionItems.filter((x) => matches(x.a, want)).length / attractionItems.length : null;
  const availShare = !want.size ? null : stops.map((s) => byId(s.id)).flatMap((d) => d.attractions).filter((a) => matches(a, want)).length / stops.map((s) => byId(s.id)).flatMap((d) => d.attractions).length;
  // 2. unsuitable for the group
  const unsuitable = [];
  for (const d of days) {
    for (const x of d.items) {
      if (r.children && x.a && (x.a.tags || []).includes('nightlife')) unsuitable.push(`D${d.day} ${x.name}: nightlife with kids`);
      if (kidsUnder6(r) && x.durationH > pc.hours) unsuitable.push(`D${d.day} ${x.name}: ${x.durationH}h > ${pc.hours}h toddler day`);
      if (!r.children && x.a && (x.a.tags || []).some((t) => ['with_children', 'water_slides'].includes(t)) && !(x.a.tags || []).some((t) => want.has(t))) unsuitable.push(`D${d.day} ${x.name}: kids-oriented for adults`);
    }
    if (kidsUnder6(r) && d.items.filter((x) => ['museum', 'religious'].includes(x.kind)).length >= 2) unsuitable.push(`D${d.day}: 2 museums/churches in one toddler day`);
    if (kidsUnder6(r) && d.items.some((x) => x.kind === 'museum' && x.durationH >= 3)) unsuitable.push(`D${d.day}: ${d.items.find((x) => x.kind === 'museum' && x.durationH >= 3).name} ${d.items.find((x) => x.kind === 'museum' && x.durationH >= 3).durationH}h museum for toddlers`);
  }
  const removedForKids = r.children ? stops.flatMap((s) => byId(s.id).attractions.filter((a) => a.tags.includes('nightlife')).map((a) => `${a.name.en} [${a.tags}]`)) : [];
  // 3. pace
  const overloaded = days.filter((d) => (d.kind === 'full' || d.kind === 'daytrip') && d.hours > pc.hours + 0.01).map((d) => `D${d.day} ${d.kind} ${d.hours}h > ${pc.hours}h`);
  const emptyFull = full.filter((d) => !d.items.length).map((d) => `D${d.day}`);
  const thin = full.filter((d) => d.items.length && d.hours < pc.hours * 0.4).map((d) => `D${d.day} ${d.hours}h`);
  const arrivalHeavy = days.filter((d) => ['arrival', 'move'].includes(d.kind) && d.hours > 2).map((d) => `D${d.day} ${d.hours}h`);
  const longHaulArrival = days[0].items.length && byId(stops[0].id).flightHours >= 8 ? `arrival-day activity after ${byId(stops[0].id).flightHours}h flight` : '';
  // 4. geography (only the catalog's `area` exists – no coordinates)
  const knownArea = attractionItems.filter((x) => x.a.area).length / Math.max(1, attractionItems.length);
  const multiArea = full.filter((d) => d.areas.length >= 2).map((d) => `D${d.day}: ${d.areas.join(' + ')}`);
  let backForth = 0;
  for (let i = 0; i < full.length; i++) for (let k = i + 2; k < full.length; k++) if (full[i].stop === full[k].stop) for (const a of full[i].areas) if (full[k].areas.includes(a) && full.slice(i + 1, k).some((m) => m.areas.length && !m.areas.includes(a))) backForth++;
  // 5. duplicates
  const seen = new Map(); days.forEach((d) => d.items.forEach((x) => seen.set(x.name, (seen.get(x.name) || 0) + 1)));
  const dups = [...seen].filter(([, n]) => n > 1).map(([k, n]) => `${k} ×${n}`);
  // the same place as an attraction AND as a day trip (names differ, a distinctive word is shared)
  for (const d of days.filter((x) => x.kind === 'daytrip')) {
    const dt = d.dest.dayTrips.find((t) => t.name.he === d.items[0].name || t.name.en === d.items[0].name);
    const w = dt ? words(dt.name.en) : [];
    for (const x of attractionItems) if (x.a.area !== undefined || true) { const hit = words(x.a.name.en).find((v) => w.includes(v)); if (hit) dups.push(`day trip "${dt.name.en}" (D${d.day}) repeats "${x.a.name.en}"`); }
  }
  // 6. must-sees
  const ms_ = stops.flatMap((s) => mustSees(byId(s.id)).map((a) => ({ a, stop: s.id })));
  const scheduled = new Set(attractionItems.map((x) => x.a));
  const capacity = full.length * pc.items + days.filter((d) => ['arrival', 'move'].includes(d.kind)).length;
  const missedMust = ms_.filter((m) => !scheduled.has(m.a));
  const weaker = attractionItems.filter((x) => !ms_.some((m) => m.a === x.a) && !matches(x.a, want));
  const mustCoverage = ms_.length ? (ms_.length - missedMust.length) / Math.min(ms_.length, Math.max(1, capacity)) : null;
  const mustInversion = missedMust.length && weaker.length ? `${missedMust.length} highlight(s) left out (e.g. ${missedMust[0].a.name.en}) while ${weaker.length} non-highlight, off-style item(s) planned (e.g. ${weaker[0].a.name.en})` : '';
  // 7. day trips
  const dayTripDays = days.filter((d) => d.kind === 'daytrip');
  const dtAvail = stops.reduce((s, x) => s + (byId(x.id).dayTrips?.length || 0), 0);
  const dayTripIssue = r.nights >= 8 && dayTripDays.length <= 1 && dtAvail > 1 ? `${r.nights} nights, ${dtAvail} day trips in catalog, only ${dayTripDays.length} used` : '';
  const dayTripTooLong = dayTripDays.filter((d) => r.children && d.items[0].durationH > pc.hours).map((d) => `D${d.day} ${d.items[0].name} ${d.items[0].durationH}h vs ${pc.hours}h kids pace`);
  // 8. variety
  const monotone = full.filter((d) => d.items.length >= 2 && new Set(d.items.map((x) => x.kind)).size === 1).map((d) => `D${d.day}: ${d.items.length}× ${d.items[0].kind}`);
  // 9. spare quality: an on-request spare left out while an off-request item is planned
  const spareA = p.spare.map((x) => byName(byId(stops.find((s) => s.name.he === x.where || s.name.en === x.where)?.id || stops[0].id)).get(x.name)).filter(Boolean);
  const spareInversions = spareA.filter((a) => matches(a, want)).length && attractionItems.some((x) => !matches(x.a, want)) ? spareA.filter((a) => matches(a, want)).map((a) => a.name.en) : [];
  // 10. season / weather
  const seasonIssues = [];
  for (const s of stops) { const d = byId(s.id); if (!d.bestMonths.includes(month)) seasonIssues.push(`${d.id} out of season in month ${month} (best ${d.bestMonths})`); }
  const coldMonths = [11, 12, 1, 2, 3, 4];
  for (const d of days) for (const x of d.items) if (x.kind === 'beach' && coldMonths.includes(month) && ['europe', 'middle-east'].includes(d.dest.region) && !['eilat', 'dubai', 'abu-dhabi', 'tenerife', 'dead-sea'].includes(d.dest.id)) seasonIssues.push(`D${d.day} beach "${x.name}" in month ${month}`);
  if (r.styles.includes('ski')) { const d = byId(stops[0].id); const skiItems = attractionItems.filter((x) => (x.a.tags || []).includes('ski')).length; if (!d.tags.includes('ski') || ![12, 1, 2, 3].includes(month) && d.region !== 'oceania') seasonIssues.push(`ski request → ${d.id} in month ${month}`); if (!skiItems) seasonIssues.push('ski request but no ski item in the plan'); }
  if (r.styles.includes('nightlife') && !attractionItems.some((x) => (x.a.tags || []).includes('nightlife'))) issues.push('nightlife asked, no nightlife item planned');
  // 11. Shabbat
  const shabbatIssues = [];
  if (r.needs.shabbat) for (const d of days) if (weekday(d.date) === 6 && ['arrival', 'departure', 'move', 'daytrip'].includes(d.kind)) shabbatIssues.push(`D${d.day} ${d.kind} on Shabbat`);
  // 12. destination choice
  let destFit = null;
  if (c.expect?.suggest) { const d = byId(p.destination.id); destFit = { chosen: d.id, ok: Boolean(c.expect.suggest(d)), suggestions: p.suggestions.map((s) => s.id) }; }
  const named = NAMED[c.id];
  const namedOk = named === undefined ? null : typeof named === 'function' ? named(stops.map((x) => x.id)) : JSON.stringify(named) === JSON.stringify(stops.map((x) => x.id));
  const budget = (c.budget || r.budget) ? budgetAnalysis(p, c) : null;
  // budget influence: does removing the budget sentence change anything in the plan?
  let budgetInfluence = null;
  if (c.budget) {
    // Same request with the budget removed: does the stated amount change anything that is planned?
    const q = planPackage({ ...req, budget: null }, { today: TODAY });
    budgetInfluence = { sameDestination: q.destination?.id === p.destination.id, sameNights: q.request.nights === r.nights, sameMinStars: JSON.stringify(q.hotelSearches.map((h) => h.minStars)) === JSON.stringify(p.hotelSearches.map((h) => h.minStars)), sameBoard: JSON.stringify(q.hotelSearches.map((h) => h.board)) === JSON.stringify(p.hotelSearches.map((h) => h.board)), sameCar: q.car.include === p.car.include, sameFlightSearch: JSON.stringify(q.flightSearch) === JSON.stringify(p.flightSearch) };
  }
  return {
    id: c.id, tag: c.tag, lang: c.lang, text: c.text, ms: Math.round(ms * 10) / 10,
    parsed: { styles: r.styles, occasion: r.occasion, adults: r.adults, children: r.children, childAges: r.childAges, nights: r.nights, month, budget: r.budget, budgetLevel: r.budgetLevel, car: r.needs.car, shabbat: r.needs.shabbat, suggest: r.suggest },
    destination: stops.map((s) => s.id), namedOk, suggestions: p.suggestions.map((s) => s.id), destFit, pace: pc,
    metrics: { styleShare, availShare, knownArea, mustCoverage, items: attractionItems.length, fullDays: full.length, dayTrips: dayTripDays.length, capacity, mustSeeTotal: ms_.length, spare: p.spare.length },
    findings: { unsuitable, removedForKids, overloaded, emptyFull, thin, arrivalHeavy, longHaulArrival, multiArea, backForth, dups, mustInversion, missedMust: missedMust.map((m) => m.a.name.en), dayTripIssue, dayTripTooLong, monotone, spareInversions, seasonIssues, shabbatIssues, issues },
    budget, budgetInfluence,
    plan: days.map((d) => `D${d.day} ${d.date} ${d.kind}${d.hours ? ` ${d.hours}h` : ''}: ${d.items.map((x) => `${x.a?.name.en || x.name} [${x.kind} ${x.durationH}h${x.a?.area ? ' @' + x.a.area : ''}${x.a ? ' ' + (x.a.tags.join('/') || '-') : ''}]`).join(' | ') || '—'}`),
    spare: p.spare.map((x) => x.name)
  };
}

// ---------------------------------------------------------------- run + report
const results = CASES.map(evaluate);
const one = process.argv.indexOf('--case');
if (one > 0) { const r = results.find((x) => x.id === Number(process.argv[one + 1])); console.log(JSON.stringify(r, null, 2)); process.exit(0); }

const avg = (xs) => { const v = xs.filter((x) => typeof x === 'number'); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
const pct = (x) => (x === null ? '  – ' : `${String(Math.round(x * 100)).padStart(3)}%`);
const cnt = (f) => results.filter((r) => !r.error && f(r)).length;
const ok = results.filter((r) => !r.error);
console.log('id tag                       dest              style avail must  area  items/full  issues');
for (const r of ok) {
  const f = r.findings, n = f.unsuitable.length + f.overloaded.length + f.emptyFull.length + f.seasonIssues.length + f.monotone.length + f.dups.length + (f.mustInversion ? 1 : 0) + (f.dayTripIssue ? 1 : 0) + f.dayTripTooLong.length + f.shabbatIssues.length + f.issues.length + (r.destFit && !r.destFit.ok ? 1 : 0) + (r.namedOk === false ? 1 : 0);
  console.log(`${String(r.id).padStart(2)} ${r.tag.padEnd(25)} ${r.destination.join('+').padEnd(17)} ${pct(r.metrics.styleShare)} ${pct(r.metrics.availShare)} ${pct(r.metrics.mustCoverage)} ${pct(r.metrics.knownArea)}  ${String(r.metrics.items).padStart(3)}/${String(r.metrics.fullDays).padEnd(3)}     ${n}${r.destFit && !r.destFit.ok ? ' DEST✗' : ''}${r.namedOk === false ? ' NAMED✗' : ''}`);
}
const summary = {
  cases: results.length, errors: results.filter((r) => r.error).map((r) => r.id),
  avgStyleShare: avg(ok.map((r) => r.metrics.styleShare)), avgAvailableShare: avg(ok.map((r) => r.metrics.availShare)), avgMustCoverage: avg(ok.map((r) => r.metrics.mustCoverage)), avgKnownArea: avg(ok.map((r) => r.metrics.knownArea)),
  casesWithUnsuitable: cnt((r) => r.findings.unsuitable.length), casesOverloaded: cnt((r) => r.findings.overloaded.length), casesWithEmptyFullDays: cnt((r) => r.findings.emptyFull.length), emptyFullDays: ok.reduce((s, r) => s + r.findings.emptyFull.length, 0),
  casesThinDays: cnt((r) => r.findings.thin.length), casesMultiAreaDays: cnt((r) => r.findings.multiArea.length), backAndForth: ok.reduce((s, r) => s + r.findings.backForth, 0), casesWithDuplicates: cnt((r) => r.findings.dups.length),
  casesMustSeeInversion: cnt((r) => r.findings.mustInversion), casesDayTripUnderused: cnt((r) => r.findings.dayTripIssue), casesDayTripTooLongForKids: cnt((r) => r.findings.dayTripTooLong.length), casesMonotoneDays: cnt((r) => r.findings.monotone.length),
  casesSpareInversions: cnt((r) => r.findings.spareInversions.length), casesSeasonIssues: cnt((r) => r.findings.seasonIssues.length), casesShabbatIssues: cnt((r) => r.findings.shabbatIssues.length), casesLongHaulArrivalActivity: cnt((r) => r.findings.longHaulArrival),
  nightlifeAskedNotPlanned: cnt((r) => r.findings.issues.some((i) => i.startsWith('nightlife'))),
  named: { cases: ok.filter((r) => r.namedOk !== null).length, honoured: ok.filter((r) => r.namedOk === true).length, misses: ok.filter((r) => r.namedOk === false).map((r) => `${r.id}: ${r.destination.join('+')}`) },
  suggest: { cases: ok.filter((r) => r.destFit).length, fitting: ok.filter((r) => r.destFit?.ok).length, misses: ok.filter((r) => r.destFit && !r.destFit.ok).map((r) => `${r.id}: ${r.destFit.chosen}`) },
  budget: (() => {
    const b = ok.filter((r) => r.budget);
    return { cases: b.length, budgetParsed: b.filter((r) => r.budget.budget).length, notParsed: b.filter((r) => !r.budget.budget).map((r) => r.id),
      overByFullHigh: b.filter((r) => r.budget.budget && r.budget.overBy > 0).length,
      silentOverruns: b.filter((r) => r.budget.budget && r.budget.overBy > 0 && r.budget.planFits !== false).map((r) => r.id),
      honestNoFit: b.filter((r) => r.budget.planFits === false).map((r) => `${r.id}: +${r.budget.planOverBy}`), systemSaysWithinOrTightButOver: b.filter((r) => r.budget.hiddenOverrun).length,
      verdicts: b.reduce((m, r) => ({ ...m, [r.budget.systemVerdict]: (m[r.budget.systemVerdict] || 0) + 1 }), {}),
      firstOverAt: b.filter((r) => r.budget.firstOverAt).reduce((m, r) => ({ ...m, [r.budget.firstOverAt]: (m[r.budget.firstOverAt] || 0) + 1 }), {}),
      budgetChangedNothing: b.filter((r) => r.budgetInfluence && r.budgetInfluence.sameDestination && r.budgetInfluence.sameNights && r.budgetInfluence.sameMinStars && r.budgetInfluence.sameCar && r.budgetInfluence.sameBoard && r.budgetInfluence.sameFlightSearch).map((r) => r.id) };
  })(),
  avgPlanMs: avg(ok.map((r) => r.ms))
};
console.log('\nSUMMARY'); console.log(JSON.stringify(summary, null, 1));
await mkdir(new URL('docs/qa/', root), { recursive: true });
await writeFile(new URL('docs/qa/itinerary-eval.json', root), JSON.stringify({ today: TODAY, fx: FX, assumptions: { flightModelIlsPerTraveller: '350 + 230×flightHours (×1.15 non-direct), high = ×1.7', hotelModel3StarPerRoomNight: HOTEL3, starMult: { 4: 1.4, 5: 2.3 }, boardMult: { AI: 1.8, FB: 1.5, HB: 1.3 }, hotelHigh: '×1.35', carPerDay: CAR, insurancePerPersonDay: INS, transfersPerStopPerVanEachWay: TRANSFER, fixtures: 'Rome couple cases use the recorded flight answer tests/fixtures/build/flights.json (USD to ILS 3.65) as the live flight; the hotel fixture only for the ranking roles' }, summary, results }, null, 2));
console.log('\nsaved docs/qa/itinerary-eval.json');
