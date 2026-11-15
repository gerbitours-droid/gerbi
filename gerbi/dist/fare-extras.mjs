// Spec 10 §7 (item 12): what the big flight sites show that our search response already carries — no extra supplier calls.
// Price per passenger type, what the fare includes, seats left, and the layover airports to avoid.

// Per-person price by passenger type (fullFare + serviceFee). Shown only when it adds up to the offer's total.
export function perPassenger(offer, total) {
  const items = (offer?.offerItems || []).filter(i => ['ADT', 'CHD', 'INF'].includes(i?.ptc) && Number.isInteger(i.count) && i.count > 0
    && Number.isFinite(i.price?.fullFare) && i.price?.currency === total?.currency);
  if (!items.length || !total) return null;
  const list = items.map(i => ({ ptc: i.ptc, count: i.count, value: Math.round((i.price.fullFare + (i.price.serviceFee || 0)) * 100) / 100, currency: i.price.currency }));
  return Math.abs(list.reduce((sum, i) => sum + i.value * i.count, 0) - total.value) <= 1 ? list : null;
}
export const PTC_LABEL = { ADT: 'למבוגר', CHD: 'לילד', INF: 'לתינוק' };

// The fewest seats the supplier reports at this fare (it reports up to 9; "few" means 4 or fewer).
export const FEW_SEATS = 4;
export function seatsLeft(offer) {
  const seats = (offer?.offerItems || []).map(i => i?.seats).filter(n => Number.isInteger(n) && n > 0 && n < 99);
  return seats.length ? Math.min(...seats) : null;
}

// What the fare family says about changes, refunds, seat choice and meals for one leg. Missing = not shown.
const RANK = { included: 3, chargeable: 2, notOffered: 1 };
const STATE = { included: 'included', chargeable: 'paid', notOffered: 'no' };
export const INCLUSION_TEXT = {
  change: { included: 'שינוי ללא תוספת', paid: 'שינוי בתשלום', no: 'ללא שינויים' },
  refund: { included: 'החזר כספי כלול', paid: 'ביטול בתשלום', no: 'ללא החזר' },
  seat: { included: 'בחירת מושב כלולה', paid: 'בחירת מושב בתשלום', no: 'ללא בחירת מושב' },
  meal: { included: 'ארוחה או כיבוד כלולים', paid: 'ארוחה בתשלום', no: 'ללא ארוחה' }
};
const CATEGORY = { VC: 'change', VR: 'refund', SE: 'seat', ML: 'meal' };
export function fareInclusions(offer, leg) {
  const first = leg?.segments?.[0]?.departure, last = leg?.segments?.at(-1)?.arrival;
  if (!first || !last) return [];
  // The supplier names a fare's ends by airport or by city code (TLV → ROM).
  const at = (code, point) => code && (code === point?.airport?.code || code === point?.city?.code);
  const fare = (offer?.fareDetails?.brandedFare || []).find(b => at(b.departure, first) && at(b.arrival, last));
  const best = {};
  for (const s of fare?.serviceList || []) {
    const key = CATEGORY[s.categoryCode];
    if (key && RANK[s.chargeType] && (!best[key] || RANK[s.chargeType] > RANK[best[key]])) best[key] = s.chargeType;
  }
  return ['change', 'refund', 'seat', 'meal'].filter(k => best[k]).map(k => ({ key: k, state: STATE[best[k]], text: INCLUSION_TEXT[k][STATE[best[k]]] }));
}

// Layover airports across the results, most common first (for the "avoid a stop in…" filter).
export function layoverAirports(factsList, limit = 10) {
  const counts = new Map();
  for (const f of factsList) for (const code of new Set(f.legs.flatMap(l => l.summary.layovers.map(x => x.airport)).filter(Boolean))) counts.set(code, (counts.get(code) || 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit);
}
