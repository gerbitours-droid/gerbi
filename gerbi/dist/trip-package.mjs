// Magic trip builder (spec 24): the package shape shared by the browser and the server – pricing with the
// live / estimate / quote legend, freshness, the sanitised snapshot (share links, accounts, leads) and the
// tailor-compatible lead fields. Pure: no DOM, no i18n strings, no supplier calls.
import { toIls } from './fx.mjs';

export const PRICE_KINDS = ['live', 'estimate', 'quote', 'pending'];
export const BOARDS = ['RO', 'SC', 'BB', 'HB', 'FB', 'AI', 'RD'];
// Children cost less on the ground (food, tickets); the weight is a stated assumption of the estimate.
export const CHILD_WEIGHT = 0.6;
export const STALE_MS = 30 * 60000;
export const MAX_PICKS = 8;

const num = (v, min = 0, max = 1e7) => (typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? v : null);
const int = (v, min, max) => (Number.isInteger(v) && v >= min && v <= max ? v : null);
const str = (v, max = 200) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f<>]/g, ' ').trim().slice(0, max) : '');
const day = (v) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : '');
const iso = (v) => (typeof v === 'string' && !Number.isNaN(Date.parse(v)) && v.length <= 40 ? new Date(v).toISOString() : '');
const code3 = (v) => (typeof v === 'string' && /^[A-Z]{3}$/.test(v) ? v : '');
const slug = (v) => (typeof v === 'string' && /^[a-z0-9-]{1,60}$/.test(v) ? v : '');
const price = (p) => (p && num(p.value, 0, 1e7) !== null && /^[A-Z]{3}$/.test(p.currency || '') ? { value: Math.round(p.value * 100) / 100, currency: p.currency } : null);
const list = (v, max) => (Array.isArray(v) ? v.slice(0, max) : []);
const txt = (v, max = 200) => (v && typeof v === 'object' && !Array.isArray(v) ? { he: str(v.he, max), en: str(v.en, max) } : str(v, max));

export const travellers = (request = {}) => (request.adults || 0) + (request.children || 0);
export const isStale = (at, now = Date.now()) => !at || now - Date.parse(at) > STALE_MS;

// The selected live flight / hotel(s) of a package, or null.
export const selectedFlight = (pkg) => (pkg?.flights?.status === 'live' ? pkg.flights.picks?.find((p) => p.key === pkg.flights.selected) || pkg.flights.picks?.[0] || null : null);
export function selectedHotels(pkg) {
  const groups = pkg?.hotels?.stops?.length ? pkg.hotels.stops : pkg?.hotels ? [pkg.hotels] : [];
  return groups.map((g) => ({ group: g, pick: g.status === 'live' ? g.picks?.find((p) => p.id === g.selected) || g.picks?.[0] || null : null }));
}

// Ground spending (food, attractions, local transport – no flights, no lodging) from the catalog's per-person
// daily budget: low/mid travellers [low, mid], high/luxury travellers [mid, high]. Children weigh CHILD_WEIGHT.
export function groundEstimate(pkg) {
  const r = pkg?.request || {}, stops = pkg?.stops?.length ? pkg.stops : pkg?.destination ? [{ ...pkg.destination, nights: r.nights }] : [];
  const people = (r.adults || 0) + CHILD_WEIGHT * (r.children || 0);
  let low = 0, high = 0;
  for (const s of stops) {
    const b = s.dailyBudgetIls, n = s.nights || 0;
    if (!b || !n) return null;
    const [a, z] = r.budgetLevel === 'high' ? [b.mid, b.high] : [b.low, b.mid];
    low += a * n * people; high += z * n * people;
  }
  return stops.length ? { low: Math.round(low / 10) * 10, high: Math.round(high / 10) * 10 } : null;
}

// Cost model for what no supplier prices yet (spec 28 §א): stated, rounded assumptions in ILS – the same ones
// docs/qa/itinerary-algorithm-review-he.md measured with. Used for the pre-search fit and for the estimate lines.
export const COST_MODEL = {
  // Economy round trip per traveller from flight hours, booked ~2 months out; non-direct ×1.15; high end ×1.7.
  flight: { base: 350, perHour: 230, connecting: 1.15, high: 1.7, infant: 0.1 },
  // Hotel per room-night at 3★ by the destination's budgetLevel (1–4); stars and meal plan multiply; high end ×1.35.
  hotel3: { 1: 300, 2: 450, 3: 650, 4: 950 }, starMult: { 3: 1, 4: 1.4, 5: 2.3 }, boardMult: { AI: 1.8, FB: 1.5, HB: 1.3 }, hotelHigh: 1.35,
  carPerDay: { low: 170, high: 300 }, insurancePerPersonDay: { low: 30, high: 50 },
  transferPerVanEachWay: { low: 150, high: 400 }, bagPerTraveller: { low: 180, high: 400 }
};
const band = (b, n) => ({ low: Math.round(b.low * n), high: Math.round(b.high * n) });
export const carsFor = (r = {}) => ((r.adults || 0) + (r.children || 0) > 5 ? 2 : 1);
export const vansFor = (r = {}) => Math.max(1, Math.ceil(((r.adults || 0) + (r.children || 0)) / 4));
// The extras every package carries as estimate ranges: car (when included), insurance (when chosen), transfers
// (when there is no car), a checked bag per traveller (when the chosen fare has none included), added day trips.
export function extrasLines(pkg) {
  const r = pkg?.request || {}, nights = r.nights || 0, people = travellers(r), stops = pkg?.stops?.length || 1, out = [];
  if (pkg?.car?.include) out.push({ id: 'car', kind: 'estimate', range: band(COST_MODEL.carPerDay, nights * carsFor(r)) });
  if (pkg?.insurance?.include) out.push({ id: 'insurance', kind: 'estimate', range: band(COST_MODEL.insurancePerPersonDay, (nights + 1) * Math.max(1, people)) });
  if (!pkg?.car?.include) out.push({ id: 'transfers', kind: 'estimate', range: band(COST_MODEL.transferPerVanEachWay, stops * 2 * vansFor(r)) });
  const flight = selectedFlight(pkg);
  if (flight && flight.bag !== 'included') out.push({ id: 'bags', kind: 'estimate', range: band(COST_MODEL.bagPerTraveller, Math.max(1, people)) });
  (Array.isArray(pkg?.extras) ? pkg.extras : []).forEach((x, i) => { if (num(x?.range?.low) !== null && num(x?.range?.high) !== null) out.push({ id: `extra:${i}`, kind: 'estimate', name: x.name, range: { low: x.range.low, high: x.range.high } }); });
  return out;
}

// Every line of the "total" card with its kind, and the sums. fx = the /api/fx rates (null → no shekel totals).
// With a budget the verdict compares the HIGH end of everything (flight, hotel, ground, car, insurance, transfers,
// bags, extras): "within" only when the high end fits; anything else is "over" (there is no "tight"). It is only
// given once the flight is live and every hotel has a live price or estimate ("pending" / "unverified" before).
export function pricePackage(pkg, fx) {
  const r = pkg?.request || {}, people = Math.max(1, travellers(r)), lines = [];
  const fl = pkg?.flights || {}, flight = selectedFlight(pkg);
  if (flight) lines.push({ id: 'flight', kind: 'live', price: flight.price, ils: toIls(flight.price, fx), at: fl.searchedAt });
  else lines.push({ id: 'flight', kind: fl.status === 'pending' ? 'pending' : 'quote' });
  selectedHotels(pkg).forEach(({ group, pick }, i) => {
    const id = pkg.hotels?.stops?.length ? `hotel:${i}` : 'hotel';
    const est = group.status === 'estimate' ? group.estimate : null;
    if (pick) lines.push({ id, stop: i, kind: 'live', price: pick.price, ils: toIls(pick.price, fx), at: group.searchedAt });
    // Hotels kept private (spec 24 §1.3): a range from the supplier's prices for the fitting hotels, never a hotel.
    else if (est) { const low = toIls({ value: est.stay.low, currency: est.currency }, fx), high = toIls({ value: est.stay.high, currency: est.currency }, fx);
      lines.push({ id, stop: i, kind: 'estimate', hotel: true, range: low === null ? null : { low: Math.round(low), high: Math.round(high) }, original: { ...est.stay, currency: est.currency }, at: group.searchedAt }); }
    else lines.push({ id, stop: i, kind: group.status === 'pending' ? 'pending' : 'quote' });
  });
  const ground = groundEstimate(pkg);
  if (ground) lines.push({ id: 'ground', kind: 'estimate', range: ground });
  lines.push(...extrasLines(pkg));
  const live = lines.filter((l) => l.kind === 'live'), hotelEst = lines.filter((l) => l.hotel), missingFx = live.some((l) => l.ils === null) || hotelEst.some((l) => !l.range);
  const liveIls = live.length && !missingFx ? Math.round(live.reduce((s, l) => s + l.ils, 0)) : live.length ? null : 0;
  const est = lines.filter((l) => l.kind === 'estimate' && l.range).reduce((s, l) => ({ low: s.low + l.range.low, high: s.high + l.range.high }), { low: 0, high: 0 });
  const total = liveIls === null || missingFx ? null : { live: liveIls, low: liveIls + est.low, high: liveIls + est.high };
  const perPerson = total ? { live: Math.round(total.live / people), low: Math.round(total.low / people), high: Math.round(total.high / people) } : null;
  let budget = null;
  if (num(r.budget, 1)) {
    const pending = lines.some((l) => l.kind === 'pending'), known = total && flight && selectedHotels(pkg).every(({ group, pick }) => pick || (group.status === 'estimate' && group.estimate));
    budget = !known ? { amount: r.budget, verdict: pending ? 'pending' : 'unverified' }
      : { amount: r.budget, verdict: total.high <= r.budget ? 'within' : 'over', diff: Math.round(total.high - r.budget), left: Math.max(0, Math.round(r.budget - total.high)) };
  }
  return { lines, total, perPerson, people, budget, missingFx, pending: lines.some((l) => l.kind === 'pending'), oldestLive: live.map((l) => l.at).filter(Boolean).sort()[0] || null };
}

// ---- Snapshot: what may be stored, shared and sent to the owner. Whitelisted, bounded, no free-form JSON.
function cleanFlightPick(p) {
  return { key: str(p?.key, 240), carriers: list(p?.carriers, 4).map((c) => str(c, 60)), price: price(p?.price), stops: int(p?.stops, 0, 8) ?? 0, minutes: int(p?.minutes, 0, 6000),
    legs: list(p?.legs, 5).map((l) => ({ from: code3(l?.from), to: code3(l?.to), date: day(l?.date), depart: str(l?.depart, 5), arrive: str(l?.arrive, 5), stops: int(l?.stops, 0, 8) ?? 0, dayOffset: int(l?.dayOffset, 0, 3) ?? 0 })),
    badges: list(p?.badges, 4).map((b) => slug(b)).filter(Boolean), reasons: list(p?.reasons, 3).map((x) => str(x, 120)), bag: slug(p?.bag) };
}
function cleanHotelGroup(g) {
  const e = g?.estimate, money = (v) => num(v, 0, 1e7);
  return { status: ['live', 'none', 'quote', 'pending', 'error', 'estimate'].includes(g?.status) ? g.status : 'quote', searchedAt: iso(g?.searchedAt), stop: int(g?.stop, 0, 4),
    ref: typeof g?.ref === 'string' && /^[a-f0-9]{16}$/.test(g.ref) ? g.ref : '', minStars: int(g?.minStars, 0, 5) ?? 0,
    estimate: e && /^[A-Z]{3}$/.test(e.currency || '') && [e.perNight?.low, e.perNight?.high, e.stay?.low, e.stay?.high].every((v) => money(v) !== null)
      ? { perNight: { low: e.perNight.low, high: e.perNight.high }, stay: { low: e.stay.low, high: e.stay.high }, currency: e.currency, count: int(e.count, 0, 10000) ?? 0, areaScope: e.areaScope === true, nights: int(e.nights, 1, 60) ?? 1 } : null,
    board: BOARDS.includes(g?.board) ? g.board : '', boardFallback: g?.boardFallback === true, total: int(g?.total, 0, 100000),
    area: g?.area ? { name: txt(g.area.name, 80), forWhom: txt(g.area.forWhom, 200) } : null, selected: str(g?.selected, 20),
    picks: list(g?.picks, MAX_PICKS).map((h) => ({ id: str(h?.id, 20), name: str(h?.name, 120), stars: int(h?.stars, 0, 5) ?? 0, board: BOARDS.includes(h?.board) ? h.board : '', boards: list(h?.boards, 7).filter((b) => BOARDS.includes(b)),
      price: price(h?.price), nights: int(h?.nights, 1, 60), address: str(h?.address, 160), image: typeof h?.image === 'string' && /^\/api\/build\/hotel-image\?src=[\w%.-]{1,400}$/.test(h.image) ? h.image : '',
      family: h?.family === true, refundable: h?.refundable === true, areaMatch: h?.areaMatch === true, role: slug(h?.role) })) };
}
const cleanStop = (s) => ({ id: slug(s?.id), code: code3(s?.code), name: txt(s?.name, 80), country: txt(s?.country, 80), nights: int(s?.nights, 0, 60) ?? 0, start: day(s?.start), end: day(s?.end),
  dailyBudgetIls: s?.dailyBudgetIls && ['low', 'mid', 'high'].every((k) => num(s.dailyBudgetIls[k], 0, 100000) !== null) ? { low: s.dailyBudgetIls.low, mid: s.dailyBudgetIls.mid, high: s.dailyBudgetIls.high } : null,
  image: typeof s?.image === 'string' && /^\/assets\/[\w./-]{1,120}$/.test(s.image) ? s.image : '', summary: txt(s?.summary, 400) });

export function sanitizePackage(pkg) {
  if (!pkg || typeof pkg !== 'object') return null;
  const r = pkg.request || {}, needs = r.needs || {};
  const request = { text: str(r.text, 1500), origin: code3(r.origin) || 'TLV', adults: int(r.adults, 1, 9) ?? 2, children: int(r.children, 0, 8) ?? 0, childAges: list(r.childAges, 8).filter((a) => int(a, 0, 17) !== null),
    nights: int(r.nights, 1, 30) ?? 5, start: day(r.start), end: day(r.end), month: int(r.month, 0, 12) ?? 0, datesAssumed: r.datesAssumed === true, styles: list(r.styles, 12).map(slug).filter(Boolean),
    budget: num(r.budget, 1, 5e6), budgetLevel: ['low', 'mid', 'high'].includes(r.budgetLevel) ? r.budgetLevel : 'mid', occasion: slug(r.occasion),
    needs: { car: ['yes', 'no', 'auto'].includes(needs.car) ? needs.car : 'auto', allInclusive: needs.allInclusive === true, board: BOARDS.includes(needs.board) ? needs.board : '', minStars: int(needs.minStars, 0, 5) ?? 0,
      kosher: needs.kosher === true, shabbat: needs.shabbat === true, accessible: needs.accessible === true, direct: needs.direct === true } };
  const fl = pkg.flights || {};
  return { v: 1, id: str(pkg.id, 40), createdAt: iso(pkg.createdAt) || new Date().toISOString(), lang: pkg.lang === 'en' ? 'en' : 'he', request,
    destination: pkg.destination ? cleanStop(pkg.destination) : null, stops: list(pkg.stops, 4).map(cleanStop),
    flights: { status: ['live', 'none', 'quote', 'pending', 'error'].includes(fl.status) ? fl.status : 'quote', searchedAt: iso(fl.searchedAt), total: int(fl.total, 0, 100000), selected: str(fl.selected, 240), picks: list(fl.picks, 3).map(cleanFlightPick) },
    hotels: pkg.hotels?.stops?.length ? { stops: list(pkg.hotels.stops, 4).map(cleanHotelGroup) } : cleanHotelGroup(pkg.hotels),
    car: { advice: ['recommended', 'optional', 'not_needed'].includes(pkg.car?.advice) ? pkg.car.advice : 'optional', include: pkg.car?.include === true, note: txt(pkg.car?.note, 300) },
    insurance: { include: pkg.insurance?.include === true },
    extras: list(pkg.extras, 4).map((x) => ({ name: str(x?.name, 120), range: { low: num(x?.range?.low, 0, 1e6), high: num(x?.range?.high, 0, 1e6) } })).filter((x) => x.name && x.range.low !== null && x.range.high !== null && x.range.low <= x.range.high),
    itinerary: list(pkg.itinerary, 40).map((d) => ({ day: int(d?.day, 1, 61) ?? 1, date: day(d?.date), kind: slug(d?.kind) || 'full', stop: int(d?.stop, 0, 4) ?? 0, title: str(d?.title, 140), note: str(d?.note, 240),
      items: list(d?.items, 6).map((x) => ({ name: str(x?.name, 120), kind: slug(x?.kind), durationH: num(x?.durationH, 0, 24) ?? 0, mapsUrl: mapsUrl(str(x?.name, 120), str(x?.where, 80)), where: str(x?.where, 80) })) })),
    practical: pkg.practical && typeof pkg.practical === 'object' ? Object.fromEntries(['visa', 'currency', 'language', 'timeZone', 'kosher', 'shabbat', 'season', 'transport'].map((k) => [k, str(pkg.practical[k], 600)])) : null,
    polish: pkg.polish ? { intro: str(pkg.polish.intro, 400), dayTitles: list(pkg.polish.dayTitles, 40).map((x) => str(x, 140)) } : null };
}

// A plain Google Maps search link – no API key, no tracking.
export const mapsUrl = (name, where = '') => (name ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([name, where].filter(Boolean).join(', '))}` : '');

// ---- Lead: the tailor-made fields (so priority, AI brief, CSV and the customer area work unchanged) + the package.
const BUDGET_BANDS = [[5000, 'up5'], [10000, '5to10'], [20000, '10to20'], [40000, '20to40'], [Infinity, 'over40']];
const STYLE_MAP = { beach: 'beach', city: 'city', culture: 'city', nature: 'nature', family: 'family', couple: 'romantic', honeymoon: 'romantic', adventure: 'adventure', food: 'culinary', luxury: 'luxury', ski: 'ski' };
const name = (v, l) => (v && typeof v === 'object' ? v[l] || v.he || v.en || '' : v || '');
export function packageLeadFields(pkg, l = 'he') {
  const r = pkg.request, stops = pkg.stops?.length ? pkg.stops : [pkg.destination].filter(Boolean);
  const budget = r.budget ? BUDGET_BANDS.find(([max]) => r.budget <= max)[1] : 'open';
  const styles = [...new Set([...(r.styles || []), r.occasion].map((s) => STYLE_MAP[s]).filter(Boolean))];
  const needs = [r.needs.allInclusive && (l === 'en' ? 'all-inclusive' : 'הכול כלול'), r.needs.kosher && (l === 'en' ? 'kosher' : 'כשר'), r.needs.shabbat && (l === 'en' ? 'Shabbat observant' : 'שומרי שבת'),
    r.needs.accessible && (l === 'en' ? 'accessibility' : 'נגישות'), ...(pkg.extras || []).map((x) => (l === 'en' ? `add-on: ${x.name}` : `תוספת: ${x.name}`)), pkg.car?.include && (l === 'en' ? 'car rental' : 'השכרת רכב'), pkg.insurance?.include && (l === 'en' ? 'travel insurance (Harel)' : 'ביטוח נסיעות (הראל)'), r.childAges?.length && (l === 'en' ? `children's ages ${r.childAges.join(', ')}` : `גילי ילדים ${r.childAges.join(', ')}`)].filter(Boolean);
  return { destinations: stops.map((s) => name(s.name, l)).filter(Boolean).join(', ').slice(0, 200) || '—', start: r.start || '', end: r.end || '', flexibility: r.datesAssumed ? 'month' : 'exact',
    adults: r.adults, children: r.children, budget, styles, notes: [l === 'en' ? 'Package from the magic trip builder.' : 'חבילה מבונה החופשות.', needs.join(' · ')].filter(Boolean).join(' ').slice(0, 2000) };
}
