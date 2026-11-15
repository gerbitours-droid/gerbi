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
  const base = [['perPage', '60'], ['sortField', 'price'], ['sortOrder', 'ASC'], ['includeHotelDetails', '1']];
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
    address: String(d.address || '').slice(0, 160), image: imageSrc(d.mainImage?.url || ''), refundable: !nonRef,
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
  const prices = pool.map((h) => h.price.value).sort((a, b) => a - b), pct = (v) => prices.findIndex((p) => p >= v) / Math.max(1, prices.length - 1);
  const scored = pool.map((h) => {
    const areaMatch = words.length > 0 && words.some((w) => h.address.toLowerCase().includes(w) || h.name.toLowerCase().includes(w));
    const score = pct(h.price.value) * 3 - h.stars * 0.45 - (areaMatch ? 0.8 : 0) - (spec.family && h.family ? 0.5 : 0) - (spec.board && h.board === spec.board ? 0.6 : 0);
    return { ...h, areaMatch, score };
  }).sort((a, b) => a.score - b.score);
  const value = scored[0], budget = [...scored].sort((a, b) => a.price.value - b.price.value)[0];
  const upgrade = scored.filter((h) => h.stars > value.stars && h !== budget).sort((a, b) => a.price.value - b.price.value)[0]
    || scored.find((h) => h !== value && h !== budget && h.price.value > value.price.value);
  const roles = new Map([[value, 'value'], ...(upgrade ? [[upgrade, 'upgrade']] : []), ...(budget !== value ? [[budget, 'budget']] : [])]);
  const ordered = [...roles.keys(), ...scored.filter((h) => !roles.has(h))].slice(0, 8);
  return { picks: ordered.map(({ score, ...h }) => ({ ...h, role: roles.get(scored.find((x) => x.id === h.id)) || '' })), relaxedStars };
}

// Search → slim → rank, through a KV cache (30 min) with in-flight de-duplication.
const HOTEL_TTL = 30 * 60;
const inFlight = new Map();
export function createHotelSearch({ store, search, log = () => {}, now = () => Date.now() }) {
  return async function hotels(spec) {
    const key = 'h:' + createHash('sha1').update(JSON.stringify(spec)).digest('hex');
    const hit = await store?.get(key).catch(() => null);
    if (hit) return { ...hit, cached: true };
    if (inFlight.has(key)) return inFlight.get(key);
    const run = (async () => {
      const started = now(), { query, fallbackQuery } = hotelQueries(spec);
      const raw = await search(supplierHotelInput(spec), { query, fallbackQuery });
      const list = raw.hotels.map((h) => slimHotel(h, raw.filtered ? spec.board : ''));
      const ranked = rankHotels(list, spec), nights = nightsOf(spec);
      const result = { status: ranked.picks.length ? 'live' : 'none', searchedAt: new Date(now()).toISOString(), total: raw.totalItems, nights,
        board: spec.board, boardFallback: Boolean(spec.board) && !raw.filtered, relaxedStars: ranked.relaxedStars,
        picks: ranked.picks.map((h) => ({ ...h, nights, image: h.image ? `/api/build/hotel-image?src=${encodeURIComponent(h.image)}` : '' })) };
      log({ route: 'hotels', ok: true, ms: now() - started, hotels: raw.hotels.length, complete: raw.complete });
      await store?.set(key, result, HOTEL_TTL).catch(() => {});
      return { ...result, cached: false };
    })().finally(() => inFlight.delete(key));
    inFlight.set(key, run);
    return run;
  };
}
