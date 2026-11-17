// Spec 28 §א–ב: the budget is a hard cap (parsing, pre-search fit, post-price fit in the spec's order, honest "over"),
// and the "add up to ₪500" upgrades. Pure functions + recorded supplier fixtures; no network.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseTrip, planPackage, applyEdits, suggestDestinations } from '../dist/trip-builder.mjs';
import { pricePackage } from '../dist/trip-package.mjs';
import { estimateTrip, budgetLadder, fitPackage, upsellOffers, applyUpsell, flightsInBudget, UPSELL_MAX } from '../dist/budget.mjs';
import { byId } from '../dist/catalog.mjs';
import { slimHotel, hotelOptions } from '../backend/hotels.mjs';
import { flightAlternatives, upsellTrips } from '../backend/build.mjs';

const TODAY = '2026-11-16', FX = { rates: { USD: 3.65, EUR: 3.95 } };
const parse = (text, lang = 'he', fx = FX) => parseTrip(text, { today: TODAY, lang, fx });
const plan = (text, lang = 'he') => planPackage(parse(text, lang), { today: TODAY });
const fixture = async (n) => JSON.parse(await readFile(new URL(`./fixtures/build/${n}.json`, import.meta.url), 'utf8'));

test('parsing: total vs per person, thousands words, K, ₪/ש״ח/שקל, $ and € at today’s rate (unknown without a rate)', () => {
  assert.equal(parse('זוג לברצלונה 4 לילות ביוני, 4000 לאדם').budget, 8000, '"לאדם" without a keyword');
  assert.equal(parse('זוג לברצלונה, תקציב 4000 ש"ח לאדם').budget, 8000);
  assert.equal(parse('משפחה עם 2 ילדים, 4000 שקל לאדם').budget, 16000, 'per person × everyone');
  assert.equal(parse('זוג לרומא, 10K').budget, 10000);
  assert.equal(parse('זוג לרומא עד 4 אלף').budget, 4000);
  assert.equal(parse('זוג לרומא עד 10 אלף שקל').budget, 10000);
  assert.equal(parse('זוג לרומא 8,000 ₪').budget, 8000);
  assert.equal(parse('Couple to Rome, 12000 nis', 'en').budget, 12000);
  assert.equal(parse('Family of 4, 2000 pp, Crete', 'en').budget, 8000);
  assert.equal(parse('Couple to Rome 10k total', 'en').budget, 10000);
  assert.equal(parse('Couple, Rome 4 nights in May, budget $3000', 'en').budget, 10950, '$3000 × 3.65');
  assert.equal(parse('Couple Rome, 2500€ per person', 'en').budget, 19750, '€2500 × 2 × 3.95');
  const noFx = parse('Couple, Rome 4 nights in May, budget $3000', 'en', null);
  assert.equal(noFx.budget, null, 'no rate → no guessed budget'); assert.ok(noFx.questions.some((q) => /₪|shekel/i.test(q)), 'asks for it in shekels');
  assert.ok(parse('Couple, Rome, budget $3000', 'en').understood.some((u) => u.field === 'budget' && /₪10,950/.test(u.label)));
  assert.equal(parse('זוג לרומא בשנת 2027').budget, null, 'a year is not a budget');
  assert.equal(parse('זוג לרומא, 1500 ק"מ מהבית').budget, null, 'a distance is not a budget');
  assert.equal(applyEdits(parse('זוג לרומא, 10K'), { budget: 12000 }, TODAY).budget, 12000, 'raise-the-budget edit');
});

const CASES = ['זוג, 4 לילות ברומא במאי, תקציב עד 6000 ש"ח', 'זוג, 5 לילות ברומא במאי, תקציב 12000 ש"ח', 'משפחה עם 2 ילדים בני 5 ו-9, שבוע ביוון באוגוסט, עד 15000 שקל',
  'משפחה עם 3 ילדים, 6 לילות ביולי, עד 18000 ש"ח, תציעו', 'זוג לברצלונה 4 לילות ביוני, 4000 לאדם', 'זוג, 12 לילות בתאילנד, פוקט, בפברואר, עד 16000 ש"ח',
  'זוג, סקי בבנסקו בינואר, 6 לילות, עד 7000 ש"ח', 'זוג, משהו זול במרץ, 4 לילות, עד 5000 ש"ח, תציעו', 'זוג לרומא 4 לילות במאי, עד 10 אלף שקל', 'ירח דבש במלדיביים, 7 לילות בפברואר, תקציב 45000 שקל',
  'זוג לרומא 5 לילות במאי, תקציב 25000 ש"ח'];

test('pre-search cap: the chosen stars/meal plan/car fit at the HIGH end, or the plan says how far over it is (never silently over)', () => {
  for (const text of CASES) {
    const p = plan(text), b = p.budgetPlan, stops = (p.stops.length ? p.stops : [p.destination]).map((s) => ({ dest: byId(s.id), nights: s.nights }));
    assert.ok(b, text);
    const est = estimateTrip(stops, p.request, b.config);
    assert.equal(est.high, b.estimate.high, text);
    if (b.fits) assert.ok(est.high <= p.request.budget, `${text}: ${est.high} > ${p.request.budget}`);
    else { assert.ok(b.overBy > 0 && b.raiseTo >= est.high, text); const { step, ...last } = budgetLadder(b.base, p.request).at(-1); assert.deepEqual(b.config, last, 'nothing fits → everything the ladder may give up is given up'); }
    assert.equal(p.hotelSearches[0].minStars, b.config.stars, 'the hotel search uses the fitted stars'); assert.equal(p.car.include, b.config.car);
  }
  const roomy = plan('זוג לרומא 5 לילות במאי, תקציב 25000 ש"ח');
  assert.equal(roomy.budgetPlan.fits, true); assert.deepEqual(roomy.budgetPlan.changes, [], 'a roomy budget changes nothing');
  const tight = plan('זוג, 4 לילות ברומא במאי, תקציב עד 6000 ש"ח');
  assert.equal(tight.hotelSearches[0].minStars, 3, 'one star down before giving up'); assert.ok(tight.assumed.some((a) => /3★/.test(a)));
});

test('pre-search: destinations whose LOW end is above the cap are not offered; the ones that fit lead', () => {
  const r = parse('זוג, 5 לילות במרץ, עד 12000 ש"ח, תציעו');
  const list = suggestDestinations(r, { today: TODAY, limit: 3 });
  assert.equal(list.length, 3);
  for (const s of list) assert.ok(s.estimate.low <= 12000, `${s.id} low ${s.estimate.low}`);
  assert.ok(list[0].fitsBudget, 'a fitting destination leads');
  const far = suggestDestinations({ ...r, budget: 2000 }, { today: TODAY, limit: 3 });
  assert.ok(far.length === 3 && far.every((s) => s.fitsBudget === false), 'nothing fits → the closest ones, marked as not fitting');
});

test('ladder: meal plan → stars (never asked-for stars) → car (never an asked-for car); all-inclusive asked for is kept', () => {
  const r = parse('זוג לרומא, חצי פנסיון, תקציב 9000');
  assert.deepEqual(budgetLadder({ stars: 5, board: 'HB', car: true }, { ...r, needs: { ...r.needs, car: 'auto' } }).map((c) => c.step), ['', 'board', 'board', 'stars', 'stars', 'car']);
  assert.deepEqual(budgetLadder({ stars: 4, board: 'AI', car: true }, { ...r, needs: { ...r.needs, allInclusive: true, car: 'yes' } }).map((c) => c.step), ['', 'stars']);
  assert.deepEqual(budgetLadder({ stars: 4, board: '', car: false }, { ...r, asked: { stars: true } }).map((c) => c.step), ['']);
});

// A priced package built by hand: two flights, one hotel group with the server's budget options, a car.
function pricedPackage({ budget, car = 'auto', direct = false, flightUsd = 900 } = {}) {
  const request = { ...parse('זוג לרומא 4 לילות במאי'), budget, nights: 4 };
  request.needs = { ...request.needs, car, direct };
  // The plan is built without the cap (this tests the post-price fit alone, not the pre-search one); the cap is set after.
  const p = planPackage({ ...request, budget: null }, { today: TODAY });
  const est = (low, high) => ({ perNight: { low: low / 4, high: high / 4 }, stay: { low, high }, currency: 'USD', count: 10, areaScope: false, nights: 4 });
  return { ...p, request: { ...p.request, budget }, insurance: { include: false }, car: { ...p.car, include: true },
    flights: { status: 'live', searchedAt: '2026-11-16T10:00:00Z', selected: 'exp', total: 3, picks: [{ key: 'exp', price: { value: flightUsd, currency: 'USD' }, stops: 0, bag: 'included', carriers: ['AZ'] }, { key: 'mid', price: { value: 700, currency: 'USD' }, stops: 1, bag: 'included', carriers: ['LH'] }],
      alternatives: { cheapest: { key: 'cheap', price: { value: 400, currency: 'USD' }, stops: 1, bag: 'included', carriers: ['W6'] }, direct: { key: 'exp', price: { value: flightUsd, currency: 'USD' }, stops: 0, bag: 'included' }, bag: null } },
    hotels: { status: 'estimate', searchedAt: '2026-11-16T10:00:00Z', minStars: 4, board: '', estimate: est(1200, 1600), options: [
      { id: 'budget', tier: 'cheap', minStars: 4, board: '', estimate: est(1000, 1200) }, { id: 'board', tier: 'cheap', minStars: 4, board: '', estimate: est(950, 1100) },
      { id: 'stars', tier: 'cheap', minStars: 3, board: '', estimate: est(700, 800) },
      { id: 'upStars', tier: 'asked', minStars: 5, board: '', estimate: est(1300, 1700) }, { id: 'upBoard', tier: 'asked', minStars: 4, board: 'BB', estimate: est(1250, 1680) }] } };
}
const high = (pkg) => pricePackage(pkg, FX).total.high;

test('post-price fit: cheapest fitting flight → cheaper hotel (any area) → lower meal plan → a star down → no car; compared at the high end', () => {
  const full = pricedPackage({ budget: 1e6 }), start = high(full);
  // A budget that only the very last step meets: every step runs, in order.
  const strip = pricedPackage({ budget: 1e6 }); strip.flights.selected = 'cheap'; strip.flights.picks.push(strip.flights.alternatives.cheapest);
  Object.assign(strip.hotels, { estimate: strip.hotels.options[2].estimate }); strip.car.include = false;
  const floor = high(strip), pkg = pricedPackage({ budget: floor });
  const t0 = performance.now(), r = fitPackage(pkg, FX), ms = performance.now() - t0;
  assert.deepEqual(r.steps, ['flight', 'hotel', 'board', 'stars', 'car']); assert.equal(r.verdict, 'within'); assert.ok(high(pkg) <= floor);
  assert.ok(ms < 10, `fit in ${ms.toFixed(2)} ms`); assert.ok(start > floor);
  assert.equal(pkg.flights.selected, 'cheap'); assert.equal(pkg.hotels.minStars, 3); assert.equal(pkg.car.include, false);
  // A budget the cheaper flight alone meets: nothing else is given up.
  const one = pricedPackage({ budget: start - 1000 }), r1 = fitPackage(one, FX);
  assert.deepEqual(r1.steps, ['flight']); assert.equal(one.hotels.minStars, 4); assert.equal(one.car.include, true);
});

test('post-price fit keeps hard constraints: a direct flight, a car and stars that were asked for', () => {
  const pkg = pricedPackage({ budget: 1000, car: 'yes', direct: true });
  pkg.request.asked = { stars: true };
  const r = fitPackage(pkg, FX);
  assert.equal(pkg.flights.selected, 'exp', 'only the direct flight meets "direct"'); assert.equal(pkg.car.include, true, 'the asked-for car stays');
  assert.equal(pkg.hotels.minStars, 4, 'asked-for stars stay'); assert.ok(!r.steps.includes('stars') && !r.steps.includes('car'));
  // Still over → never "within": the honest closest + ways out.
  assert.equal(r.verdict, 'over'); assert.equal(r.fits, false); assert.ok(r.overBy > 0 && r.raiseTo >= high(pkg));
  assert.equal(pricePackage(pkg, FX).budget.verdict, 'over');
});

test('the verdict never says "within" above the cap, and there is no "tight"', () => {
  for (const budget of [3000, 6000, 9000, 12000, 15000, 20000]) {
    const pkg = pricedPackage({ budget }); fitPackage(pkg, FX);
    const pr = pricePackage(pkg, FX);
    assert.ok(['within', 'over'].includes(pr.budget.verdict));
    if (pr.budget.verdict === 'within') assert.ok(pr.total.high <= budget, `${budget}: ${pr.total.high}`);
    else assert.ok(pr.total.high > budget);
  }
  const unknown = pricedPackage({ budget: 1e6 }); unknown.flights = { status: 'quote' };
  assert.equal(pricePackage(unknown, FX).budget.verdict, 'unverified');
});

test('upgrades: only with a budget and a fitting package; each adds more than ₪0 and at most ₪500; adding one raises the budget only as needed', () => {
  const trips = upsellTrips('rome', 'he');
  assert.ok(trips.length && trips.every((x) => x.price.low <= x.price.high && x.en), 'catalog day trips with an estimate when unpriced');
  const base = pricedPackage({ budget: 1e6 }), roomy = high(base) + 600;
  const pkg = pricedPackage({ budget: roomy });
  const offers = upsellOffers(pkg, FX, { trips, images: { [`rome|${trips[0].en}`]: '/assets/attractions/x.webp' } });
  assert.ok(offers.length >= 2 && offers.length <= 5, String(offers.length));
  for (const o of offers) assert.ok(o.extra > 0 && o.extra <= UPSELL_MAX, `${o.id} ${o.extra}`);
  assert.ok(offers.some((o) => o.type === 'stars') && offers.some((o) => o.type === 'board'));
  const trip = offers.find((o) => o.type === 'trip' && o.image === '/assets/attractions/x.webp');
  assert.ok(!trip || trip.image.startsWith('/assets/'), 'attraction photo when the map has it');
  const stars = offers.find((o) => o.type === 'stars'), before = high(pkg), done = applyUpsell(pkg, stars, FX);
  assert.equal(done.rebuild, false); assert.equal(pkg.hotels.minStars, 5);
  assert.ok(Math.abs(high(pkg) - before - stars.extra) <= 10, 'the card shows what it adds');
  assert.ok(pkg.request.budget >= high(pkg) && pkg.request.budget >= roomy, 'budget raised only when needed');
  assert.equal(pricePackage(pkg, FX).budget.verdict, 'within');
  const night = upsellOffers(pricedPackage({ budget: roomy }), FX).find((o) => o.type === 'night');
  if (night) { const r = applyUpsell(pricedPackage({ budget: roomy }), night, FX); assert.equal(r.rebuild, true); assert.equal(r.nights, 5); }
  assert.deepEqual(upsellOffers(pricedPackage({ budget: 1000 }), FX), [], 'none while over budget');
  assert.deepEqual(upsellOffers({ ...pricedPackage({ budget: 1e6 }), request: { ...pkg.request, budget: null } }, FX), [], 'none without a budget');
});

test('server data: hotel options from the fetched list (private = aggregates only), flight alternatives respect "direct"', async () => {
  const hotels = await fixture('hotels'), flights = await fixture('flights');
  const list = hotels.hotels.map((h) => slimHotel(h, ''));
  const spec = { city: 'ROM', checkIn: '2027-05-10', checkOut: '2027-05-14', minStars: 4, board: 'HB', rooms: [{ adults: 2, childrenAges: [] }] };
  const priv = hotelOptions(list, spec), pub = hotelOptions(list, spec, { publicMode: true });
  assert.ok(priv.length && priv.every((o) => o.estimate && !o.pick && !JSON.stringify(o).includes('"name"')), 'no hotel in the private options');
  for (const o of priv) assert.ok(o.estimate.stay.low <= o.estimate.stay.high && o.estimate.count >= 3);
  assert.ok(pub.every((o) => o.pick?.name && o.pick.price?.value > 0));
  assert.ok(!hotelOptions(list, { ...spec, board: 'AI' }).some((o) => o.id === 'board'), 'never down from an all-inclusive');
  const any = flightAlternatives(flights, { needs: {} }), direct = flightAlternatives(flights, { needs: { direct: true } });
  const prices = flights.offers.map((o) => o.fareDetails.totalPrice.selling.value);
  assert.equal(any.cheapest.price.value, Math.min(...prices));
  assert.ok(!direct.cheapest || direct.cheapest.stops === 0);
});

// Owner report 16.11: "עד 4800 שח" → the builder showed flights of ~₪48,000.
test('regression (owner report): every cap phrasing parses; a ₪4,800 cap never shows a ₪48,000 flight as the package', () => {
  for (const [text, cap] of [['זוג לרומא עד 4800 שח', 4800], ['זוג לרומא, עד 4800', 4800], ['זוג לרומא, תקציב 4,800', 4800], ['זוג לרומא, 4.8K', 4800], ['זוג לרומא 4800 ש״ח לזוג', 4800],
    ['זוג לרומא, בסביבות 5000', 5000], ['זוג לרומא, מקסימום 5 אלף', 5000], ['זוג לרומא, לא יותר מ־4800', 4800], ['זוג לרומא, לא יותר מ-4800 שקל', 4800], ['Couple to Rome, up to 4800 shekels', 4800]]) {
    assert.equal(parse(text, /[a-z]/i.test(text) ? 'en' : 'he').budget, cap, text);
  }
  // Suggest mode: the cheapest-to-reach destinations lead; the plan says it cannot fit and offers cheaper ones.
  const p = plan('עד 4800 שח');
  assert.equal(p.request.budget, 4800);
  assert.ok(p.suggestions.every((s) => s.estimate) && p.suggestions[0].estimate.low <= p.suggestions.at(-1).estimate.low, 'ordered by cost when nothing fits');
  assert.equal(p.budgetPlan.fits, false); assert.ok(p.budgetPlan.overBy > 0 && p.budgetPlan.raiseTo > 4800);
  const far = plan('זוג לתאילנד עד 4800 שח');
  assert.ok(far.budgetPlan.alternatives.length >= 1 && far.budgetPlan.alternatives.every((a) => a.estimate.high < far.budgetPlan.estimate.high), 'nearest cheaper destinations offered');
  // After prices: three ₪48,000-ish flights → only the cheapest is listed, flagged; the verdict is "over", never "within".
  const pkg = pricedPackage({ budget: 4800 });
  pkg.flights.picks = [{ key: 'a', price: { value: 13200, currency: 'USD' }, stops: 1, bag: 'included' }, { key: 'b', price: { value: 15000, currency: 'USD' }, stops: 0, bag: 'included' }, { key: 'c', price: { value: 14000, currency: 'USD' }, stops: 1, bag: 'included' }];
  pkg.flights.selected = 'b'; pkg.flights.alternatives = { cheapest: pkg.flights.picks[0], direct: pkg.flights.picks[1], bag: null };
  const r = fitPackage(pkg, FX);
  assert.equal(pkg.flights.selected, 'a', 'the cheapest flight is the one in the package'); assert.equal(r.verdict, 'over'); assert.ok(r.overBy > 40000);
  const view = flightsInBudget(pkg, FX);
  assert.equal(view.allOver, true); assert.deepEqual(view.shown.map((x) => x.key), ['a']); assert.equal(view.hidden, 2);
  assert.equal(pricePackage(pkg, FX).budget.verdict, 'over');
  // One flight fits, two do not: the over-budget ones are not offered.
  const mixed = pricedPackage({ budget: 4800 });
  mixed.flights.picks = [{ key: 'ok', price: { value: 600, currency: 'USD' }, stops: 1, bag: 'included' }, { key: 'x', price: { value: 2000, currency: 'USD' }, stops: 0, bag: 'included' }];
  mixed.flights.selected = 'ok';
  assert.deepEqual(flightsInBudget(mixed, FX).shown.map((x) => x.key), ['ok']);
  assert.deepEqual(flightsInBudget({ ...mixed, request: { ...mixed.request, budget: null } }, FX).shown.length, 2, 'no budget → all picks');
});
