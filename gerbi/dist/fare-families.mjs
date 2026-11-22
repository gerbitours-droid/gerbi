// Branded fares: the supplier returns the same flights once per fare family (SKY Joy, SKY Joy+, SKY Enjoy, BLISS…).
// The results show one card per itinerary at its cheapest fare; the other fares are options on that card.
import { fareInclusions } from './fare-extras.mjs';

// Same flights = same flight references in the same order, for every direction of the offer.
export const flightsKey = offer => (offer?.flightsOverview || []).map(o => (o?.flightReferences || []).join(',')).join('|');

// The supplier sometimes lists the very same flights under other references (another content source): the same
// flight numbers leaving at the same date and time are the same seats, so they share one card.
export const physicalKey = facts => (facts?.legs || []).map(leg => (leg.segments || []).map(s =>
  `${s.marketingCarrier?.airline?.code || '?'}${s.marketingCarrier?.flightNumber ?? ''}@${s.departure?.date || ''}T${s.departure?.time || ''}>${s.arrival?.airport?.code || ''}`).join('+')).join('|');
const keyOf = f => (f.legs?.length && f.legs.every(l => l.segments?.length) ? physicalKey(f) : '') || flightsKey(f.offer) || `offer:${f.index}`;

const priceValue = f => (Number.isFinite(f?.price?.value) ? f.price.value : Infinity);
// Two offers of the same flights with the same fare name, cabins and conditions are one fare: the cheaper one stays.
const fareSignature = f => !fareNames(f).label ? `offer:${f.index}` : JSON.stringify([fareNames(f).names.map(n => String(n || '').toLowerCase()), (f.legs || []).map(l => l.baggage?.cabin || ''), fareHighlights(f)]);
// factsList: offerFacts() per offer, supplier order. Returns one representative per itinerary (its cheapest fare), in the
// order the itineraries first appear, each with .fares = the fare types of those flights, cheapest first, and .groupKey.
// Fares in different currencies are never reordered against each other (the supplier's order stands).
export function groupFares(factsList = []) {
  const groups = new Map();
  for (const f of factsList) {
    const key = keyOf(f);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(f);
  }
  return [...groups].map(([key, list]) => {
    const oneCurrency = new Set(list.map(f => f.price?.currency).filter(Boolean)).size <= 1;
    const sorted = oneCurrency ? [...list].sort((a, b) => priceValue(a) - priceValue(b)) : list;
    const seen = new Set(), fares = sorted.filter(f => { const sig = fareSignature(f); if (seen.has(sig)) return false; seen.add(sig); return true; });
    const lead = fares[0];
    lead.fares = fares; lead.groupKey = key;
    for (const f of list) f.groupKey = key;
    return lead;
  });
}

// What one fare gives across the whole route: one state per service, 'mixed' when the directions differ.
const SERVICE_ORDER = ['checked', 'trolley', 'change', 'refund', 'seat'];
export function fareHighlights(facts) {
  const perLeg = (facts?.legs || []).map(leg => {
    const states = { checked: leg.baggage?.checked, trolley: leg.baggage?.trolley };
    for (const item of fareInclusions(facts.offer, leg)) if (item.key !== 'meal') states[item.key] = item.state === 'included' ? 'included' : item.state === 'paid' ? 'paid' : 'no';
    return states;
  });
  return SERVICE_ORDER.map(key => {
    const values = perLeg.map(s => s[key]).filter(v => v && v !== 'unknown');
    if (!values.length) return null;
    const state = values.every(v => v === values[0]) && values.length === perLeg.length ? values[0] : values.includes('included') ? 'mixed' : values[0];
    return { key, state: state === 'none' ? 'no' : state };
  }).filter(Boolean);
}

// The fare names per direction ("SKY Joy" both ways, or "SKY Joy" out and "SKY Enjoy" back); null when not given.
export function fareNames(facts) {
  const names = (facts?.legs || []).map(leg => leg.baggage?.fare || null);
  const known = names.filter(Boolean);
  if (!known.length) return { same: true, names, label: null };
  const same = known.length === names.length && known.every(n => n.toLowerCase() === known[0].toLowerCase());
  return { same, names, label: same ? known[0] : [...new Set(known)].join(' / ') };
}

// The fare a card shows: the traveler's choice for this itinerary, else (with the checked-bag filter on) the cheapest
// fare that includes a bag, else the cheapest.
export function chosenFare(lead, choice, { wantBag = false } = {}) {
  const fares = lead?.fares || [lead];
  return fares.find(f => f.index === choice) || (wantBag && lead?.checked !== 'included' && fares.find(f => f.checked === 'included')) || lead;
}
