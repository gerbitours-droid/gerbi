// Gerbi decision layer v2: generalized cost (spec: docs/gerbi-decision-engine-spec-he.md §2).
// Every offer becomes one money amount – fare + the traveler's value of time + a price on each inconvenience – so
// the order of two offers never depends on which other offers happen to be in the list (v1's ratio-to-cheapest
// utilities flipped 30% of pairs when an unrelated cheap offer appeared). Filters run before; nothing rejected returns.
import { timeBucket } from './flight-view.mjs';

export const MEMORY_WEIGHT = 0.08, PARTNER_WEIGHT = 0.05, TIE_EPSILON = 0.03;
const REMOTE_AIRPORTS = new Set(['BVA', 'BGY']);
// Reference amounts are per traveler, in USD; other currencies scale by a fixed reference rate (an order of
// magnitude for comfort costs, never used to convert a fare). ponytail: fixed table, a rates feed if this matters.
const CURRENCY_SCALE = { USD: 1, EUR: 0.95, GBP: 0.8, ILS: 3.7 };
export const BASE_COSTS = { hour: 12, stop: 25, longWait: 6, overnight: 60, airportChange: 40, offHours: 30, nightDeparture: 15, nextDayArrival: 10, remoteAirport: 20, carrierMismatch: 20, bagPaid: 45, bagUnknown: 25 };
const LEARNABLE = ['hour', 'stop', 'longWait', 'overnight', 'offHours', 'nightDeparture'];

// The traveler's prices for time and inconvenience, from the brief and (bounded) learned multipliers θ.
export function costsFor(brief = {}, learned = {}) {
  const c = { ...BASE_COSTS };
  if (brief.cheaper) { c.hour *= 0.35; c.stop *= 0.4; c.longWait *= 0.5; }
  if ((brief.children || 0) > 0) { c.hour *= 1.3; c.stop *= 1.5; c.overnight *= 1.5; c.longWait *= 1.5; c.nightDeparture *= 2; }
  if (brief.stops === '0' || brief.direct) c.stop *= 2.4;
  for (const key of LEARNABLE) if (Number.isFinite(learned[key])) c[key] *= Math.exp(Math.max(-0.7, Math.min(0.7, learned[key])));
  return c;
}

// Stable across searches (supplier offer ids are not): carrier + flight number + departure time per segment.
export function itineraryKey(facts) {
  return facts.legs.map(leg => leg.segments.map(s => `${s.marketingCarrier?.airline?.code || '?'}${s.marketingCarrier?.flightNumber || ''}@${s.departure?.time || ''}`).join('+')).join('|');
}

// Inconvenience amounts (hours, stops, ...) – the features the learning step adjusts the prices of.
export function features(facts, brief = {}) {
  const legs = facts.legs.filter(leg => leg.segments.length);
  let offHours = 0, nightDeparture = 0, nextDayArrival = 0;
  legs.forEach((leg, i) => {
    const wanted = i === 0 ? brief.out : brief.back, bucket = timeBucket(leg.segments[0].departure?.time);
    if (wanted?.length && !wanted.includes(bucket)) offHours++;
    if (!wanted?.length && bucket === 'night') nightDeparture++;
    if (leg.summary.dayOffset > 0) nextDayArrival++;
  });
  return {
    hour: Number.isFinite(facts.totalMinutes) ? facts.totalMinutes / 60 : null,
    stop: facts.legs.reduce((sum, leg) => sum + leg.summary.stops, 0),
    longWait: facts.legs.reduce((sum, leg) => sum + leg.summary.layovers.reduce((s, l) => s + Math.max(0, (l.minutes || 0) - 120) / 60, 0), 0),
    overnight: facts.legs.reduce((sum, leg) => sum + leg.summary.layovers.filter(l => l.overnight).length, 0),
    airportChange: facts.legs.reduce((sum, leg) => sum + leg.summary.layovers.filter(l => l.changeAirport).length, 0) + (facts.airportChange ? 1 : 0),
    offHours, nightDeparture, nextDayArrival,
    remoteAirport: facts.airports.filter(code => REMOTE_AIRPORTS.has(code)).length,
    carrierMismatch: brief.carrier && !facts.carriers.some(name => name.toLowerCase().includes(brief.carrier)) ? 1 : 0,
    bagPaid: brief.checkedBag && ['paid', 'none'].includes(facts.checked) ? legs.length : 0,
    bagUnknown: brief.checkedBag && ['unknown', 'mixed'].includes(facts.checked) ? legs.length : 0
  };
}

export function generalizedCost(facts, brief = {}, learned = {}) {
  const c = costsFor(brief, learned), x = features(facts, brief);
  const people = (brief.adults || 2) + (brief.children || 0), scale = CURRENCY_SCALE[facts.price?.currency] ?? 1;
  // A missing duration is charged at a long trip's length rather than guessed short.
  const parts = Object.fromEntries(Object.keys(c).map(key => [key, (key === 'hour' ? (x.hour ?? 12) : x[key]) * c[key] * people * scale]));
  const fare = Number.isFinite(facts.price?.value) ? facts.price.value : null;
  return { fare, parts, features: x, total: fare === null ? Infinity : fare + Object.values(parts).reduce((a, b) => a + b, 0) };
}

// boosts: itineraryKey → m ∈ (−1, 1) from query memory; partnerPick: key chosen by the LLM in a near tie.
// Score = GC_min / GC′ ∈ (0, 1]: scale-free, ordered exactly like the cost, so a near tie (< ε) means within 3%.
export function scoreOffers(list, brief = {}, { boosts = {}, partnerPick = null, learned = {} } = {}) {
  const items = list.map(facts => {
    const gc = generalizedCost(facts, brief, learned), key = itineraryKey(facts);
    const memory = Math.max(-1, Math.min(1, boosts[key] || 0));
    const adjusted = gc.total * (1 - MEMORY_WEIGHT * memory) * (partnerPick === key ? 1 - PARTNER_WEIGHT : 1);
    return { facts, key, gc, cost: adjusted, memory, partner: partnerPick === key };
  });
  const min = Math.min(...items.map(item => item.cost).filter(Number.isFinite));
  for (const item of items) { item.score = Number.isFinite(item.cost) && min > 0 ? min / item.cost : 0; item.base = item.score; }
  return items;
}

export const rankScored = scored => [...scored].sort((a, b) => a.cost - b.cost || (a.facts.price?.value ?? Infinity) - (b.facts.price?.value ?? Infinity));

export function needsTieBreak(ranked, epsilon = TIE_EPSILON) {
  return ranked.length >= 2 && Number.isFinite(ranked[1].cost) && ranked[0].score - ranked[1].score < epsilon;
}

export function badges(scored) {
  const out = new Map(scored.map(item => [item.key, []]));
  const priced = scored.filter(item => Number.isFinite(item.facts.price?.value));
  const timed = scored.filter(item => Number.isFinite(item.facts.totalMinutes));
  if (scored.length) out.get(rankScored(scored)[0].key).push('recommended');
  if (priced.length && new Set(priced.map(i => i.facts.price.currency)).size === 1) out.get(priced.reduce((a, b) => (b.facts.price.value < a.facts.price.value ? b : a)).key).push('cheapest');
  if (timed.length) out.get(timed.reduce((a, b) => (b.facts.totalMinutes < a.facts.totalMinutes ? b : a)).key).push('fastest');
  for (const item of scored) {
    const dominated = scored.some(other => other !== item && Number.isFinite(other.facts.price?.value) && Number.isFinite(other.facts.totalMinutes)
      && other.facts.price.value <= item.facts.price?.value && other.facts.totalMinutes <= item.facts.totalMinutes
      && (other.facts.price.value < item.facts.price?.value || other.facts.totalMinutes < item.facts.totalMinutes));
    if (!dominated && Number.isFinite(item.facts.price?.value) && !out.get(item.key).length) out.get(item.key).push('value');
  }
  return out;
}

// Top picks that are not three versions of the same flight (maximal marginal relevance, λ = 0.7).
export function diverseTop(ranked, count = 3, lambda = 0.7) {
  const similar = (a, b) => a.facts.carriers[0] === b.facts.carriers[0] && Math.abs(minutesOf(a) - minutesOf(b)) <= 60 ? 1 : 0;
  const chosen = [], pool = [...ranked];
  while (chosen.length < count && pool.length) {
    let best = 0, bestValue = -Infinity;
    pool.forEach((item, i) => { const value = lambda * item.score - (1 - lambda) * Math.max(0, ...chosen.map(c => similar(item, c))); if (value > bestValue) { bestValue = value; best = i; } });
    chosen.push(pool.splice(best, 1)[0]);
  }
  return chosen;
}
const minutesOf = item => { const [h, m] = String(item.facts.legs[0]?.segments[0]?.departure?.time || '0:0').split(':').map(Number); return h * 60 + m; };
const median = values => { const v = [...values].sort((a, b) => a - b); return v.length ? (v.length % 2 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2) : NaN; };
const clock = minutes => `${Math.floor(minutes / 60)}:${String(Math.round(minutes % 60)).padStart(2, '0')}`;

// Reasons in the traveler's terms, only from facts: the trade against the cheapest fare, the median offer, comfort.
export function explain(item, scored, format = price => `${Math.round(price)}`) {
  const reasons = [], f = item.facts;
  const sameCurrency = new Set(scored.map(x => x.facts.price?.currency).filter(Boolean)).size === 1;
  const cheapest = sameCurrency ? scored.filter(x => Number.isFinite(x.facts.price?.value)).reduce((a, b) => (b.facts.price.value < a.facts.price.value ? b : a), item) : null;
  const typicalPrice = median(scored.map(x => x.facts.price?.value).filter(Number.isFinite));
  if (cheapest && cheapest !== item && Number.isFinite(f.totalMinutes) && Number.isFinite(cheapest.facts.totalMinutes) && cheapest.facts.totalMinutes - f.totalMinutes >= 45)
    reasons.push(`עוד ${format(f.price.value - cheapest.facts.price.value)} וחוסכת ${clock(cheapest.facts.totalMinutes - f.totalMinutes)} שע׳ לעומת הזולה`);
  else if (sameCurrency && Number.isFinite(f.price?.value) && f.price.value < typicalPrice * 0.9) reasons.push(`זולה ב־${Math.round((1 - f.price.value / typicalPrice) * 100)}% מהמחיר הטיפוסי בחיפוש`);
  if (f.stops === 0) reasons.push('ישירה');
  else if (item.gc.features.longWait === 0 && !f.overnight) reasons.push('קונקשן קצר');
  if (f.checked === 'included') reasons.push('מזוודה כלולה');
  if (item.memory > 0.2) reasons.push('נבחרה הרבה בחיפושים דומים');
  if (item.partner) reasons.push('ג׳רבי AI המליץ בתיקו');
  return reasons.slice(0, 3);
}

// Online pairwise learning (spec §2.6): when a traveler acts on an offer ranked below others, the inconvenience
// those higher offers had more of was under-priced. θ moves by η·(x_above − x_chosen)/scale, bounded |θ| ≤ 0.7.
export function learnFromChoice(learned = {}, chosen, above, eta = 0.04) {
  if (!chosen || !above?.length) return learned;
  const next = { ...learned }, scale = { hour: 4, stop: 1, longWait: 2, overnight: 1, offHours: 1, nightDeparture: 1 };
  for (const key of LEARNABLE) {
    const mean = above.reduce((sum, x) => sum + (x[key] ?? 0), 0) / above.length;
    const step = eta * ((mean - (chosen[key] ?? 0)) / scale[key]);
    next[key] = Math.max(-0.7, Math.min(0.7, (next[key] || 0) + Math.max(-0.2, Math.min(0.2, step))));
  }
  return next;
}
