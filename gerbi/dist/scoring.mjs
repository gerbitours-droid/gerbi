// Gerbi decision layer: transparent utility scoring of flight offers (spec: docs/gerbi-decision-engine-spec-he.md §2).
// Pure functions over offerFacts(); filters are applied before scoring, so a score never resurrects a rejected offer.
import { timeBucket } from './flight-view.mjs';

export const BASE_WEIGHTS = { price: 0.35, duration: 0.20, stops: 0.15, layover: 0.10, hours: 0.10, baggage: 0.05, carrier: 0.03, airport: 0.02 };
export const MEMORY_WEIGHT = 0.08, PARTNER_WEIGHT = 0.05, TIE_EPSILON = 0.03;
const REMOTE_AIRPORTS = new Set(['BVA', 'BGY']);
const K_PRICE = 3, K_TIME = 2;

export function weightsFor(brief = {}) {
  const w = { ...BASE_WEIGHTS };
  if (brief.cheaper) w.price *= 1.6;
  if ((brief.children || 0) > 0) { w.stops *= 1.5; w.layover *= 1.5; w.hours *= 1.3; }
  if (brief.stops === '0' || brief.direct) w.stops *= 2;
  if (brief.checkedBag) w.baggage *= 3;
  if (brief.out?.length || brief.back?.length) w.hours *= 2;
  if (brief.carrier) w.carrier *= 3;
  const total = Object.values(w).reduce((a, b) => a + b, 0);
  return Object.fromEntries(Object.entries(w).map(([k, v]) => [k, v / total]));
}

// Stable across searches (supplier offer ids are not): carrier + flight number + departure time per segment.
export function itineraryKey(facts) {
  return facts.legs.map(leg => leg.segments.map(s => `${s.marketingCarrier?.airline?.code || '?'}${s.marketingCarrier?.flightNumber || ''}@${s.departure?.time || ''}`).join('+')).join('|');
}

function hoursUtility(facts, brief) {
  const legs = facts.legs.filter(leg => leg.segments.length);
  if (!legs.length) return 1;
  return legs.reduce((sum, leg, i) => {
    const wanted = i === 0 ? brief.out : brief.back, bucket = timeBucket(leg.segments[0].departure?.time);
    if (wanted?.length) return sum + (wanted.includes(bucket) ? 1 : 0.3);
    return sum + (bucket === 'night' ? 0.6 : 1) * (leg.summary.dayOffset > 0 ? 0.85 : 1);
  }, 0) / legs.length;
}

export function utilities(facts, context, brief = {}) {
  const { minPrice, minTime } = context;
  const price = facts.price?.value, time = facts.totalMinutes;
  const layover = facts.longestLayover;
  const anyOvernight = facts.overnight, anyChange = facts.legs.some(leg => leg.summary.layovers.some(l => l.changeAirport));
  const carriers = facts.carriers.map(name => name.toLowerCase());
  return {
    price: Number.isFinite(price) && minPrice > 0 ? Math.exp(-K_PRICE * (price - minPrice) / minPrice) : 0.5,
    duration: Number.isFinite(time) && minTime > 0 ? Math.exp(-K_TIME * (time - minTime) / minTime) : 0.5,
    stops: Math.max(0, 1 - 0.35 * (facts.stops ?? 1)),
    layover: (layover <= 120 ? 1 : Math.exp(-(layover - 120) / 360)) * (anyOvernight ? 0.6 : 1) * (anyChange ? 0.7 : 1),
    hours: hoursUtility(facts, brief),
    baggage: brief.checkedBag ? ({ included: 1, unknown: 0.5, mixed: 0.5 }[facts.checked] ?? 0.2) : 1,
    carrier: brief.carrier ? (carriers.some(name => name.includes(brief.carrier)) ? 1 : 0.8) : 1,
    airport: facts.airports.some(code => REMOTE_AIRPORTS.has(code)) ? 0.7 : 1
  };
}

// Scores a filtered list. boosts: itineraryKey → m ∈ (−1, 1) from query memory; partnerPick: itineraryKey chosen by the LLM.
export function scoreOffers(list, brief = {}, { boosts = {}, partnerPick = null } = {}) {
  const sameCurrency = new Set(list.map(f => f.price?.currency).filter(Boolean)).size <= 1;
  const prices = list.map(f => f.price?.value).filter(Number.isFinite), times = list.map(f => f.totalMinutes).filter(Number.isFinite);
  const context = { minPrice: sameCurrency && prices.length ? Math.min(...prices) : NaN, minTime: times.length ? Math.min(...times) : NaN };
  const w = weightsFor(brief);
  return list.map(facts => {
    const u = utilities(facts, context, brief), key = itineraryKey(facts);
    const contributions = Object.fromEntries(Object.keys(w).map(k => [k, w[k] * u[k]]));
    const base = Object.values(contributions).reduce((a, b) => a + b, 0);
    const memory = Math.max(-1, Math.min(1, boosts[key] || 0));
    const score = base + MEMORY_WEIGHT * memory + (partnerPick === key ? PARTNER_WEIGHT : 0);
    return { facts, key, base, score, memory, partner: partnerPick === key, utilities: u, contributions };
  });
}

export const rankScored = scored => [...scored].sort((a, b) => b.score - a.score || (a.facts.price?.value ?? Infinity) - (b.facts.price?.value ?? Infinity));

// Near-tie at the top: the only case in which the LLM is asked to weigh in (§4.1).
export function needsTieBreak(ranked, epsilon = TIE_EPSILON) {
  return ranked.length >= 2 && ranked[0].score - ranked[1].score < epsilon;
}

// Badges: cheapest, fastest, recommended, and Pareto-efficient on (price, time).
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

// The two strongest reasons, in words, relative to the list average – never a reason the data does not support.
export function explain(item, scored) {
  const avg = key => scored.reduce((s, x) => s + x.utilities[key], 0) / scored.length;
  // Compared with the median, the typical offer: a few very expensive outliers must not make every fare look like a bargain.
  const median = values => { const v = [...values].sort((a, b) => a - b); return v.length ? (v.length % 2 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2) : NaN; };
  const meanPrice = median(scored.map(x => x.facts.price?.value).filter(Number.isFinite)), meanTime = median(scored.map(x => x.facts.totalMinutes).filter(Number.isFinite));
  const phrases = {
    price: () => Number.isFinite(item.facts.price?.value) && item.facts.price.value < meanPrice ? `זולה ב־${Math.round((1 - item.facts.price.value / meanPrice) * 100)}% מהמחיר הטיפוסי בחיפוש` : null,
    duration: () => Number.isFinite(item.facts.totalMinutes) && meanTime - item.facts.totalMinutes >= 30 ? `קצרה ב־${Math.floor((meanTime - item.facts.totalMinutes) / 60)}:${String(Math.round((meanTime - item.facts.totalMinutes) % 60)).padStart(2, '0')} שע׳ מהטיפוסי` : null,
    stops: () => item.facts.stops === 0 ? 'ישירה' : null,
    layover: () => item.facts.stops > 0 && item.facts.longestLayover <= 120 ? 'קונקשן קצר' : null,
    hours: () => 'שעות נוחות',
    baggage: () => item.facts.checked === 'included' ? 'מזוודה כלולה' : null,
    carrier: () => 'החברה שביקשתם',
    airport: () => null
  };
  const ranked = Object.keys(item.contributions).map(key => ({ key, gain: item.contributions[key] - item.contributions[key] / (item.utilities[key] || 1) * avg(key) }))
    .filter(x => x.gain > 0.002).sort((a, b) => b.gain - a.gain);
  const reasons = [];
  for (const { key } of ranked) { const text = phrases[key](); if (text && !reasons.includes(text)) reasons.push(text); if (reasons.length === 2) break; }
  if (item.memory > 0.2) reasons.push('נבחרה הרבה בחיפושים דומים');
  if (item.partner) reasons.push('ג׳רבי AI המליץ בתיקו');
  return reasons.slice(0, 3);
}
