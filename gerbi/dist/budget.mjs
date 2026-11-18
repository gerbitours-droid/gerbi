// Budget cap + "add ₪500 and get…" (spec 28 §א–ב). Pure, shared by the browser, the server and the tests: no DOM, no
// strings, no supplier calls. Everything runs in memory on data the package already has (well under 10 ms).
//   1. estimateTrip / fitTrip – before any search: what a destination costs (flight + hotel + ground + extras) and the
//      highest stars / meal plan / car that still fit the cap at the HIGH end.
//   2. fitPackage – after prices arrive: cheapest fitting flight → cheaper hotel tier (no area) → lower meal plan →
//      one star down → no car (unless asked for). Never shows an over-budget package as fitting.
//   3. upsellOffers – up to 5 upgrades that cost at most ₪500 more, each with what it adds and how to apply it.
import { COST_MODEL as M, CHILD_WEIGHT, typical, graceOf, pricePackage, selectedFlight, selectedHotels, travellers, carsFor, vansFor, MAX_PICKS } from './trip-package.mjs';
import { toIls } from './fx.mjs';

export const UPSELL_MAX = 500, UPSELL_CARDS = 5;
const BOARD_DOWN = { AI: 'FB', FB: 'HB', HB: 'BB', BB: '' };
const round10 = (v) => Math.round(v / 10) * 10, ceil10 = (v) => Math.ceil(v / 10) * 10, ceil100 = (v) => Math.ceil(v / 100) * 100;
const starMult = (s) => (s >= 5 ? M.starMult[5] : s >= 4 ? M.starMult[4] : M.starMult[3]);

// Rooms as the hotel search builds them (two adults a room, at most two children a room, four people a room, ≤ 4 rooms).
export const roomCount = (r) => Math.min(4, Math.max(1, Math.ceil((r.adults || 1) / 2), Math.ceil((r.children || 0) / 2), Math.ceil(((r.adults || 1) + (r.children || 0)) / 4)));

// stops: [{ dest (catalog entry), nights }]. cfg: the hotel stars, meal plan and car to price. insurance is reserved by
// default so ticking it later never breaks the cap; so is a checked bag per traveller.
export function estimateTrip(stops, r, { stars = 4, board = '', car = false, insurance = true } = {}) {
  const d0 = stops[0]?.dest || {}, nights = stops.reduce((s, x) => s + (x.nights || 0), 0), people = (r.adults || 0) + (r.children || 0);
  const per = (M.flight.base + M.flight.perHour * (d0.flightHours || 4)) * (d0.direct ? 1 : M.flight.connecting), pax = people + M.flight.infant * (r.infants || 0);
  const flight = { low: per * pax, high: per * M.flight.high * pax };
  const rooms = roomCount(r), mult = starMult(stars) * (M.boardMult[board] || 1);
  const hotel = stops.reduce((s, x) => { const v = (M.hotel3[x.dest?.budgetLevel] || M.hotel3[2]) * mult * rooms * x.nights; return { low: s.low + v, high: s.high + v * M.hotelHigh }; }, { low: 0, high: 0 });
  const weight = (r.adults || 0) + CHILD_WEIGHT * (r.children || 0);
  const ground = stops.reduce((s, x) => { const b = x.dest?.dailyBudgetIls; if (!b) return s; const [a, z] = r.budgetLevel === 'high' ? [b.mid, b.high] : [b.low, b.mid]; return { low: s.low + a * x.nights * weight, high: s.high + z * x.nights * weight }; }, { low: 0, high: 0 });
  const extra = (b, n) => ({ low: b.low * n, high: b.high * n });
  const parts = { flight, hotel, ground, car: car ? extra(M.carPerDay, nights * carsFor(r)) : { low: 0, high: 0 },
    insurance: insurance ? extra(M.insurancePerPersonDay, (nights + 1) * Math.max(1, people)) : { low: 0, high: 0 },
    transfers: car ? { low: 0, high: 0 } : extra(M.transferPerVanEachWay, stops.length * 2 * vansFor(r)),
    // A checked bag per traveller is reserved: the fare is unknown yet, and a fare without one adds it (pricePackage).
    bags: extra(M.bagPerTraveller, Math.max(1, people)) };
  const sum = (k) => Math.round(Object.values(parts).reduce((s, p) => s + p[k], 0));
  // cap: what the budget covers (everything but the spending on the ground).
  return { low: sum('low'), high: sum('high'), cap: { low: Math.round(sum('low') - ground.low), high: Math.round(sum('high') - ground.high) }, parts: Object.fromEntries(Object.entries(parts).map(([k, v]) => [k, { low: Math.round(v.low), high: Math.round(v.high) }])) };
}

// The order in which the plan gives things up: meal plan (never an all-inclusive that was asked for), stars down to 3
// (never stars that were asked for), then the car (never one that was asked for). Each step keeps the previous ones.
export function budgetLadder(base, r) {
  const out = [{ ...base, step: '' }];
  let c = { ...base };
  if (!r.needs?.allInclusive) while (c.board && c.board in BOARD_DOWN) { c = { ...c, board: BOARD_DOWN[c.board], step: 'board' }; out.push(c); }
  if (!r.asked?.stars) while (c.stars > 3) { c = { ...c, stars: c.stars - 1, step: 'stars' }; out.push(c); }
  if (c.car && r.needs?.car !== 'yes') { c = { ...c, car: false, step: 'car' }; out.push(c); }
  return out;
}
// Spread n nights over the stops the way the plan does (first stops get the extra night).
const spread = (stops, n) => stops.map((s, i) => ({ ...s, nights: Math.max(1, Math.floor(n / stops.length) + (i < n % stops.length ? 1 : 0)) }));

// Before the search: the best configuration whose HIGH end fits, or the closest one with how far over it is.
export function fitTrip(stops, r, base) {
  if (!(r?.budget > 0) || !stops.length) return null;
  const configs = budgetLadder(base, r), at = configs.findIndex((c) => typical(estimateTrip(stops, r, c).cap) <= graceOf(r.budget));
  const fits = at >= 0, config = configs[fits ? at : configs.length - 1], est = estimateTrip(stops, r, config);
  const changes = [config.board !== base.board && 'board', config.stars !== base.stars && 'stars', config.car !== base.car && 'car'].filter(Boolean);
  const out = { amount: r.budget, fits, config: { stars: config.stars, board: config.board, car: config.car }, base: { stars: base.stars, board: base.board, car: base.car }, changes, estimate: { low: est.low, high: est.high } };
  if (!fits) {
    out.overBy = typical(est.cap) - r.budget; out.raiseTo = ceil100(typical(est.cap));
    const total = stops.reduce((s, x) => s + x.nights, 0);
    for (let n = total - 1; n >= Math.max(2, stops.length); n--) if (typical(estimateTrip(spread(stops, n), r, config).cap) <= graceOf(r.budget)) { out.nights = n; break; }
  }
  return out;
}
// The cheapest a destination can be (everything the ladder may give up, given up): for filtering suggestions.
export const floorConfig = (r, base) => budgetLadder(base, r).at(-1);

// ---- after prices arrive
const flightIls = (p, fx) => (p?.price ? toIls(p.price, fx) : null);
const verdictOf = (pkg, fx) => pricePackage(pkg, fx).budget?.verdict;
// A flight pick the package does not list yet joins it in place of the last unselected pick (the snapshot keeps three).
export function usePick(flights, pick) {
  if (!flights.picks.some((p) => p.key === pick.key)) {
    const i = flights.picks.length < 3 ? -1 : flights.picks.map((p) => p.key !== flights.selected).lastIndexOf(true);
    if (i < 0) flights.picks.push(pick); else flights.picks[i] = pick;
  }
  flights.selected = pick.key;
}
// One hotel option from the server (a cheaper tier, a lower meal plan, a star down, an upgrade) becomes the group's state.
export function useHotelOption(group, opt) {
  group.fit = opt.id; group.minStars = opt.minStars; if (opt.board !== undefined) group.board = opt.board;
  if (opt.pick) { if (!group.picks.some((h) => h.id === opt.pick.id)) group.picks = [opt.pick, ...group.picks].slice(0, MAX_PICKS); group.selected = opt.pick.id; }
  else if (opt.estimate) { group.estimate = { ...opt.estimate }; group.boardFallback = false; }
}
const hotelHigh = (group, pick, fx) => {
  if (pick) return toIls(pick.price, fx);
  const e = group.estimate;
  return e ? toIls({ value: e.stay.high, currency: e.currency }, fx) : null;
};
const optionHigh = (opt, fx) => (opt.pick ? toIls(opt.pick.price, fx) : opt.estimate ? toIls({ value: opt.estimate.stay.high, currency: opt.estimate.currency }, fx) : null);

// Mutates pkg (selected flight, hotel tiers, car) until the HIGH end fits, in the spec's order; returns what it did.
// Runs only when every price is in; it never undoes a choice while the package already fits.
export function fitPackage(pkg, fx) {
  const r = pkg?.request;
  if (!(r?.budget > 0)) return null;
  const steps = [];
  let verdict = verdictOf(pkg, fx);
  // The pre-search estimate is cautious: when live prices leave room, the stars it gave up come back if they still fit.
  const plan = pkg.budgetPlan;
  if (verdict === 'within' && plan?.changes?.includes('stars') && !pkg.restored) {
    pkg.restored = true;
    for (const { group } of selectedHotels(pkg)) {
      const tier = group.fit ? 'cheap' : 'asked', ups = (group.options || []).filter((o) => o.id === 'upStars' && o.minStars <= plan.base.stars && (o.pick || o.tier === tier));
      for (const opt of ups) {
        const before = clone(group);
        useHotelOption(group, opt);
        if (verdictOf(pkg, fx) === 'within') steps.push('restored');
        else { for (const k of Object.keys(group)) if (!(k in before)) delete group[k]; Object.assign(group, before); }
      }
    }
    verdict = verdictOf(pkg, fx);
  }
  if (verdict !== 'over') return { verdict, steps, fits: verdict === 'within' };
  const done = () => (verdict = verdictOf(pkg, fx)) !== 'over';
  // 1. the cheapest flight that meets the hard constraints (direct when asked for).
  const fl = pkg.flights;
  if (fl?.status === 'live') {
    const pool = [...(fl.picks || []), fl.alternatives?.cheapest].filter((p) => p && flightIls(p, fx) !== null && (!r.needs?.direct || p.stops === 0));
    const best = pool.sort((a, b) => flightIls(a, fx) - flightIls(b, fx))[0], now = selectedFlight(pkg);
    if (best && (!now || flightIls(best, fx) < flightIls(now, fx))) { usePick(fl, best); steps.push('flight'); }
  }
  // 2–4. per hotel group: cheaper tier with no area constraint → lower meal plan → one star down.
  if (!done()) {
    for (const id of ['budget', 'board', 'stars']) {
      if (id === 'board' && r.needs?.allInclusive) continue;
      if (id === 'stars' && r.asked?.stars) continue;
      let used = false;
      for (const { group, pick } of selectedHotels(pkg)) {
        const opt = (group.options || []).find((o) => o.id === id), cur = hotelHigh(group, pick, fx), next = opt && optionHigh(opt, fx);
        if (next !== null && next !== undefined && (cur === null || next < cur)) { useHotelOption(group, opt); used = true; }
      }
      if (used) steps.push(id === 'budget' ? 'hotel' : id);
      if (done()) break;
    }
  }
  // 5. no car, unless the visitor asked for one.
  if (verdict === 'over' && pkg.car?.include && r.needs?.car !== 'yes') { pkg.car.include = false; steps.push('car'); done(); }
  const out = { verdict, steps, fits: verdict === 'within' };
  if (verdict === 'over') {
    const pr = pricePackage(pkg, fx);
    out.overBy = pr.budget.diff; out.raiseTo = ceil100(pr.budget.cost);
    // Fewer nights: what scales with nights (hotel, ground, car, insurance) shrinks; flights, transfers and bags stay.
    const fixed = pr.lines.filter((l) => ['flight', 'transfers', 'bags'].includes(l.id.split(':')[0]) || l.id.startsWith('extra')).reduce((s, l) => s + (l.kind === 'live' ? l.ils : l.range?.high || 0), 0);
    const nights = r.nights || 1, perNight = (pr.budget.cost - fixed) / nights, n = perNight > 0 ? Math.floor((graceOf(r.budget) - fixed) / perNight) : 0;
    if (n >= 1 && n < nights) out.nights = n;
  }
  return out;
}

// The flights the card lists: with a budget, a flight that alone costs more than the whole budget is not offered (the
// owner's ₪48,000-flight report). If every flight is over, only the cheapest is shown, flagged (allOver) – never a
// pricier one, never silently. Without a budget or a rate: all picks.
export function flightsInBudget(pkg, fx) {
  const fl = pkg?.flights, picks = fl?.picks || [], budget = pkg?.request?.budget;
  if (!(budget > 0) || !picks.length) return { shown: picks, hidden: 0, allOver: false };
  const ils = (p) => flightIls(p, fx);
  if (picks.some((p) => ils(p) === null)) return { shown: picks, hidden: 0, allOver: false };
  const within = picks.filter((p) => ils(p) <= budget);
  if (!within.length) { const cheapest = [...picks].sort((a, b) => ils(a) - ils(b))[0]; return { shown: [cheapest], hidden: picks.length - 1, allOver: true }; }
  const shown = picks.filter((p) => ils(p) <= budget || p.key === fl.selected);
  return { shown, hidden: picks.length - shown.length, allOver: false };
}

// ---- "add up to ₪500 and get…"
const clone = (v) => (typeof structuredClone === 'function' ? structuredClone(v) : JSON.parse(JSON.stringify(v)));
// Only with a budget, only while the package fits, only upgrades that add more than ₪0 and at most UPSELL_MAX.
// Each offer: { id, type, extra (₪, whole), exact, image, … what to show, how to apply }. trips: the destination's day
// trips with a per-person price range ({ name, en, price: { low, high }, priced }); images: '<destId>|<English name>' → url.
export function upsellOffers(pkg, fx, { trips = [], images = {}, max = UPSELL_CARDS } = {}) {
  const r = pkg?.request;
  if (!(r?.budget > 0)) return [];
  const base = pricePackage(pkg, fx);
  if (base.budget?.verdict !== 'within') return [];
  const destImage = pkg.destination?.image || '', out = [];
  const tryApply = (type, apply, extra) => {
    const copy = clone(pkg); apply(copy);
    const pr = pricePackage(copy, fx);
    return pr.total ? Math.round(pr.total.high - base.total.high) : null;
  };
  const add = (offer) => { if (offer.extra > 0 && offer.extra <= UPSELL_MAX) out.push({ image: destImage, ...offer, extra: ceil10(offer.extra) }); };
  // Hotel: more stars / a better meal plan (same tier as the current state).
  selectedHotels(pkg).slice(0, 1).forEach(({ group }, gi) => {
    const tier = group.fit ? 'cheap' : 'asked';
    for (const [id, type] of [['upStars', 'stars'], ['upBoard', 'board']]) {
      if (type === 'stars' && group.fit === 'stars') continue;
      if (type === 'board' && ['board', 'stars'].includes(group.fit)) continue;
      const opt = (group.options || []).find((o) => o.id === id && (o.pick || o.tier === tier));
      if (!opt) continue;
      const apply = (p) => useHotelOption(selectedHotels(p)[gi].group, opt);
      add({ id: `hotel-${type}`, type, stars: opt.minStars, board: opt.board || '', extra: tryApply(type, apply), exact: Boolean(opt.pick), image: opt.pick?.image || destImage, apply: { kind: 'hotel', group: gi, option: opt } });
    }
  });
  // Flight: a direct one, or a fare with a checked bag included.
  const fl = pkg.flights, now = selectedFlight(pkg);
  if (fl?.status === 'live' && now) {
    const direct = fl.alternatives?.direct;
    if (direct && now.stops > 0 && direct.key !== now.key) add({ id: 'flight-direct', type: 'direct', extra: tryApply('direct', (p) => usePick(p.flights, direct)), exact: true, carriers: direct.carriers, apply: { kind: 'flight', pick: direct } });
    const bag = fl.alternatives?.bag;
    if (bag && now.bag !== 'included' && bag.key !== now.key && (!r.needs?.direct || bag.stops === 0)) add({ id: 'flight-bag', type: 'bag', extra: tryApply('bag', (p) => usePick(p.flights, bag)), exact: false, carriers: bag.carriers, apply: { kind: 'flight', pick: bag } });
  }
  // One more night (estimate: hotel night + a day on the ground, car and insurance; the flight is re-checked).
  const stops = pkg.stops?.length ? pkg.stops : [pkg.destination];
  if (!pkg.stops?.length && pkg.destination) {
    const line = (id) => base.lines.find((l) => l.id === id);
    const hotel = base.lines.find((l) => l.id === 'hotel'), nights = r.nights || 1;
    const hotelNight = hotel ? (hotel.kind === 'live' ? hotel.ils : hotel.range?.high) / nights : null;
    const perDay = (id) => (line(id)?.range ? line(id).range.high / (id === 'insurance' ? nights + 1 : nights) : 0);
    if (hotelNight) add({ id: 'night', type: 'night', nights: nights + 1, extra: Math.round(hotelNight + perDay('ground') + perDay('car') + perDay('insurance')), exact: false, apply: { kind: 'rebuild', nights: nights + 1 } });
  }
  // Day trips / experiences from the catalog (estimated price per person; children weigh CHILD_WEIGHT).
  const weight = (r.adults || 0) + CHILD_WEIGHT * (r.children || 0), had = new Set((pkg.extras || []).map((x) => x.name));
  for (const trip of trips) {
    if (out.filter((o) => o.type === 'trip').length >= 2) break;
    const range = { low: round10(trip.price.low * weight), high: round10(trip.price.high * weight) };
    if (had.has(trip.name)) continue;
    add({ id: `trip-${trip.key}`, type: 'trip', name: trip.name, note: trip.note || '', extra: range.high, exact: false, priced: trip.priced === true, image: images[`${stops[0]?.id}|${trip.en}`] || destImage, apply: { kind: 'extra', name: trip.name, range } });
  }
  return out.slice(0, max);
}
// Applies an offer in place; returns what the caller must do next ('rebuild' with new nights, or nothing) and raises
// the budget only as far as the new high end needs.
export function applyUpsell(pkg, offer, fx) {
  const r = pkg.request, a = offer.apply;
  if (a.kind === 'rebuild') return { rebuild: true, nights: a.nights, budget: Math.max(r.budget, ceil10((pricePackage(pkg, fx).total?.high || r.budget) + offer.extra)) };
  if (a.kind === 'hotel') useHotelOption(selectedHotels(pkg)[a.group].group, a.option);
  else if (a.kind === 'flight') usePick(pkg.flights, a.pick);
  else if (a.kind === 'extra') pkg.extras = [...(pkg.extras || []), { name: a.name, range: a.range }];
  const high = pricePackage(pkg, fx).total?.high;
  if (high && high > r.budget) r.budget = ceil10(high);
  return { rebuild: false, budget: r.budget };
}
