// Live hotels for the magic trip builder (spec 24 §1.1): the only hotel input the server forwards is rebuilt here from
// validated fields; results are trimmed to what the page shows, ranked for the travellers and cached.
import { createHash } from 'node:crypto';
import { BOARDS } from '../dist/trip-package.mjs';

// The supplier's nationality ids are ISO-3166 numeric codes (376 = Israel; tested 15.11.2026).
export const LEADER_NATIONALITY = 376;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const addDays = (iso, n) => new Date(Date.parse(iso + 'T12:00:00Z') + n * 86400000).toISOString().slice(0, 10);

export function validHotelSearch(input, today = new Date().toISOString().slice(0, 10)) {
  const s = input || {};
  if (typeof s.city !== 'string' || !/^[A-Z]{3}$/.test(s.city)) return null;
  if (!DATE.test(s.checkIn || '') || !DATE.test(s.checkOut || '') || s.checkIn < today || s.checkIn > addDays(today, 500) || s.checkOut <= s.checkIn || s.checkOut > addDays(s.checkIn, 30)) return null;
  const rooms = Array.isArray(s.rooms) ? s.rooms.slice(0, 4).map((r) => ({ adults: Number.isInteger(r?.adults) && r.adults >= 1 && r.adults <= 4 ? r.adults : 0,
    childrenAges: (Array.isArray(r?.childrenAges) ? r.childrenAges : []).filter((a) => Number.isInteger(a) && a >= 0 && a <= 17).slice(0, 3) })) : [];
  if (!rooms.length || rooms.some((r) => !r.adults)) return null;
  return { city: s.city, checkIn: s.checkIn, checkOut: s.checkOut, rooms, board: BOARDS.includes(s.board) ? s.board : '',
    minStars: Number.isInteger(s.minStars) && s.minStars >= 0 && s.minStars <= 5 ? s.minStars : 3, family: s.family === true,
    area: typeof s.area === 'string' ? s.area.replace(/[^\p{L}\p{N} &()'.–-]/gu, '').slice(0, 80) : '' };
}
export const nightsOf = (s) => Math.round((Date.parse(s.checkOut) - Date.parse(s.checkIn)) / 86400000);

// What the supplier receives: built from the validated fields only.
export function supplierHotelInput(s) {
  return { destination: { city: { code: s.city } }, checkIn: s.checkIn, checkOut: s.checkOut,
    occupancy: { leaderNationality: LEADER_NATIONALITY, rooms: s.rooms.map((r) => ({ adults: r.adults, childrenAges: r.childrenAges })) },
    language: 'en_GB', timeout: 10, sellingChannel: 'B2B', availableOnly: true };
}
// Query pairs for the results call; list filters are PHP-style arrays (hotelClassifications[]=4) – a comma string is refused.
export function hotelQueries(s) {
  const base = [['perPage', '100'], ['sortField', 'price'], ['sortOrder', 'ASC'], ['includeHotelDetails', '1']];
  const from = Math.max(1, s.minStars - 1), stars = s.minStars >= 2 ? Array.from({ length: 6 - from }, (_, i) => ['hotelClassifications[]', String(from + i)]) : [];
  const query = [...base, ...stars, ...(s.board ? [['boardBasis[]', s.board]] : [])];
  return { query, fallbackQuery: s.board ? [...base, ...stars] : null };
}

// The thumbnail id inside the supplier's image URL ("hotel:1/0/b/48035/….jpg"); anything else is dropped.
export const IMAGE_SRC = /^hotel:[\w/.-]{1,200}$/;
function imageSrc(url) {
  try { const src = new URL(url).searchParams.get('src') || ''; return IMAGE_SRC.test(src) ? src : ''; } catch { return ''; }
}
const priceOf = (p) => (p && Number.isFinite(p.value) && /^[A-Z]{3}$/.test(p.currency || '') ? { value: Math.round(p.value * 100) / 100, currency: p.currency } : null);

// One supplier hotel → the fields the page shows. board: the requested meal plan's price when the hotel has it.
export function slimHotel(h, board = '') {
  const boards = (Array.isArray(h?.boardBasis) ? h.boardBasis : []).filter((b) => BOARDS.includes(b?.code) && priceOf(b.price));
  const wanted = board ? boards.find((b) => b.code === board) : null;
  const cheapest = boards.reduce((a, b) => (!a || b.price.value < a.price.value ? b : a), null);
  const price = priceOf(wanted?.price || h?.minPrice);
  const d = h?.details || {};
  const nonRef = (Array.isArray(h?.nonRefundable) ? h.nonRefundable : []).some((x) => priceOf(x?.price) && price && x.price.value <= price.value + 0.01);
  return { id: String(h?.index ?? d.id ?? '').slice(0, 20), name: String(h?.name || d.name || '').slice(0, 120), stars: Number.isInteger(h?.stars) ? h.stars : Number(d.stars) || 0,
    price, board: wanted ? board : cheapest?.code || '', boards: [...new Set(boards.map((b) => b.code))],
    address: String(d.address || '').slice(0, 160), lat: Number(d.geolocation?.latitude) || null, lon: Number(d.geolocation?.longitude) || null, image: imageSrc(d.mainImage?.url || ''), refundable: !nonRef,
    family: (Array.isArray(d.categories) ? d.categories : []).some((c) => /family/i.test(c?.name || '')) };
}

// Up to 8 hotels for these travellers. The first three carry a role: value (best fit for the money), upgrade (more
// stars), budget (cheapest that still fits). Stars relax by one only when fewer than three hotels meet the minimum.
export function rankHotels(list, spec) {
  const priced = list.filter((h) => h.price && h.name);
  let pool = priced.filter((h) => h.stars >= spec.minStars), relaxedStars = false;
  if (pool.length < 3 && spec.minStars > 0) { pool = priced.filter((h) => h.stars >= spec.minStars - 1); relaxedStars = true; }
  if (!pool.length) return { picks: [], relaxedStars };
  const words = String(spec.area || '').toLowerCase().split(/[^a-zÀ-ɏ]+/).filter((w) => w.length >= 4);
  // Price counts relative to the cheapest fitting hotel (20% more = 0.6), capped, so a good area or more stars can win.
  const cheapest = Math.min(...pool.map((h) => h.price.value)), pct = (v) => Math.min(1.5, v / cheapest - 1);
  // Where most of the city's hotels are (median position) stands in for the centre: far-out hotels pay a distance penalty.
  const med = (k) => { const v = pool.map((h) => h[k]).filter(Number.isFinite).sort((a, b) => a - b); return v.length >= 5 ? v[Math.floor(v.length / 2)] : null; };
  const centre = { lat: med('lat'), lon: med('lon') };
  const km = (h) => (centre.lat === null || !Number.isFinite(h.lat) ? 0 : Math.hypot((h.lat - centre.lat) * 111, (h.lon - centre.lon) * 111 * Math.cos(centre.lat * Math.PI / 180)));
  const scored = pool.map((h) => {
    const areaMatch = words.length > 0 && words.some((w) => h.address.toLowerCase().includes(w) || h.name.toLowerCase().includes(w));
    const score = pct(h.price.value) * 3 - h.stars * 0.45 - (areaMatch ? 0.8 : 0) - (spec.family && h.family ? 0.5 : 0) - (spec.board && h.board === spec.board ? 0.6 : 0) + Math.min(2, Math.max(0, km(h) - 3) / 4);
    return { ...h, areaMatch, score };
  }).sort((a, b) => a.score - b.score);
  const value = scored[0], budget = [...scored].sort((a, b) => a.price.value - b.price.value)[0];
  const upgrade = scored.filter((h) => h.stars > value.stars && h !== budget).sort((a, b) => a.price.value - b.price.value)[0]
    || scored.find((h) => h !== value && h !== budget && h.price.value > value.price.value);
  // 'upgrade' only when it really has more stars; otherwise the second choice is an 'alternative'.
  const roles = new Map([[value, 'value'], ...(upgrade ? [[upgrade, upgrade.stars > value.stars ? 'upgrade' : 'alternative']] : []), ...(budget !== value ? [[budget, 'budget']] : [])]);
  const ordered = [...roles.keys(), ...scored.filter((h) => !roles.has(h))].slice(0, 8);
  return { picks: ordered.map(({ score, lat, lon, ...h }) => ({ ...h, role: roles.get(scored.find((x) => x.id === h.id)) || '' })), relaxedStars };
}

// Owner decision (spec 24 §1.3): unless HOTELS_PUBLIC_DISPLAY is on, the public page never shows a supplier hotel
// (no name, photo or per-hotel rate). It gets aggregate statistics only: the middle half (25th–75th percentile) of
// per-night prices of the hotels that fit (stars, board; the recommended area when it has at least 5), from 3 hotels up.
export function hotelEstimate(list, spec) {
  const nights = nightsOf(spec) || 1, fitting = list.filter((h) => h.price && h.stars >= spec.minStars);
  const currency = [...fitting.reduce((m, h) => m.set(h.price.currency, (m.get(h.price.currency) || 0) + 1), new Map())].sort((a, b) => b[1] - a[1])[0]?.[0];
  const pool = fitting.filter((h) => h.price.currency === currency);
  const words = String(spec.area || '').toLowerCase().split(/[^a-z\u00c0-\u024f]+/).filter((w) => w.length >= 4);
  const inArea = words.length ? pool.filter((h) => words.some((w) => h.address.toLowerCase().includes(w) || h.name.toLowerCase().includes(w))) : [];
  const scope = inArea.length >= 5 ? inArea : pool;
  if (scope.length < 3) return null;
  const per = scope.map((h) => h.price.value / nights).sort((a, b) => a - b), at = (p) => per[Math.round(p * (per.length - 1))];
  const low = Math.round(at(0.25)), high = Math.max(low, Math.round(at(0.75)));
  return { perNight: { low, high }, stay: { low: low * nights, high: high * nights }, currency, count: scope.length, areaScope: scope === inArea, nights };
}

// Search → slim (KV cache 30 min, in-flight de-dup) → rank per request. The cache key holds only what the supplier
// receives, so another area or family preference re-ranks the same list without a new supplier call.
const HOTEL_TTL = 30 * 60;
const inFlight = new Map();
// keyPrefix keeps recorded (fixture) answers apart from live ones when both share a store.
export function createHotelSearch({ store, search, log = () => {}, now = () => Date.now(), keyPrefix = 'h:' }) {
  async function list(spec) {
    const supplierSpec = { city: spec.city, checkIn: spec.checkIn, checkOut: spec.checkOut, rooms: spec.rooms, board: spec.board, minStars: spec.minStars };
    const key = keyPrefix + createHash('sha1').update(JSON.stringify(supplierSpec)).digest('hex');
    const hit = await store?.get(key).catch(() => null);
    if (hit?.list?.length) return { ...hit, cached: true };
    if (inFlight.has(key)) return inFlight.get(key);
    const run = (async () => {
      const started = now(), { query, fallbackQuery } = hotelQueries(spec);
      const raw = await search(supplierHotelInput(spec), { query, fallbackQuery });
      const entry = { list: raw.hotels.map((h) => slimHotel(h, raw.filtered ? spec.board : '')), total: raw.totalItems, filtered: raw.filtered, searchedAt: new Date(now()).toISOString() };
      log({ route: 'hotels', ok: true, ms: now() - started, hotels: raw.hotels.length, complete: raw.complete });
      if (entry.list.length) await store?.set(key, entry, HOTEL_TTL).catch(() => {}); // an empty answer is asked again next time
      return { ...entry, cached: false };
    })().finally(() => inFlight.delete(key));
    inFlight.set(key, run);
    return run;
  }
  return async function hotels(spec) {
    const found = await list(spec), ranked = rankHotels(found.list, spec), nights = nightsOf(spec);
    return { status: ranked.picks.length ? 'live' : 'none', searchedAt: found.searchedAt, total: found.total, nights, cached: found.cached,
      board: spec.board, boardFallback: Boolean(spec.board) && !found.filtered, relaxedStars: ranked.relaxedStars,
      picks: ranked.picks.map((h) => ({ ...h, nights, image: h.image ? `/api/build/hotel-image?src=${encodeURIComponent(h.image)}` : '' })),
      estimate: hotelEstimate(found.list, spec) };
  };
}
