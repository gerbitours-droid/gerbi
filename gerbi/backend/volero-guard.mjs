// Everything between the browser and Volero: validation (the server never forwards free-form JSON with the
// agency's credentials), trimming (a 610-offer search is ~6.5 MB raw, over Vercel's 4.5 MB response limit),
// a short cache with in-flight de-duplication, one retry on transient failures, and per-client rate limits.
const CODE = /^[A-Z]{3}$/, DATE = /^\d{4}-\d{2}-\d{2}$/;
// Multi-city: the supplier answers up to 5 legs in one request (6 returns no offers; tested 15.11.2026).
export const MAX_LEGS = 5;

export function validSearch(input, today = new Date().toISOString().slice(0, 10)) {
  const legs = input?.originDestinations;
  if (!Array.isArray(legs) || legs.length < 1 || legs.length > MAX_LEGS) return null;
  const limit = new Date(Date.parse(today) + 365 * 86400000).toISOString().slice(0, 10);
  const point = p => (p && CODE.test(p.code) && ['a', 'c'].includes(p.type) ? { code: p.code, type: p.type } : null);
  const clean = legs.map(leg => ({ origin: point(leg?.origin), destination: point(leg?.destination), date: leg?.date }));
  if (clean.some(leg => !leg.origin || !leg.destination || leg.origin.code === leg.destination.code || !DATE.test(leg.date) || leg.date < today || leg.date > limit)) return null;
  if (clean.some((leg, i) => i && leg.date < clean[i - 1].date)) return null;
  if (new Set(clean.map(leg => `${leg.origin.code}-${leg.destination.code}-${leg.date}`)).size !== clean.length) return null;
  const ptcList = (Array.isArray(input?.passengers?.ptcList) ? input.passengers.ptcList : []).filter(p => ['ADT', 'CHD', 'INF'].includes(p?.ptc) && Number.isInteger(p.count) && p.count > 0);
  const total = ptcList.reduce((sum, p) => sum + p.count, 0), adults = ptcList.find(p => p.ptc === 'ADT')?.count || 0;
  if (!adults || total > 9 || new Set(ptcList.map(p => p.ptc)).size !== ptcList.length) return null;
  return { originDestinations: clean, passengers: { ptcList: ptcList.map(({ ptc, count }) => ({ ptc, count })) }, sellingChannel: 'B2B', language: 'en_GB', timeout: 10 };
}

// More than a plain round trip (3+ legs, or an open jaw) is heavier for the supplier: it gets its own, tighter bucket.
export const isMultiCity = request => request.originDestinations.length > 2 || (request.originDestinations.length === 2 &&
  (request.originDestinations[0].destination.code !== request.originDestinations[1].origin.code || request.originDestinations[0].origin.code !== request.originDestinations[1].destination.code));

export function validAvailability(input) {
  const id = (value, max) => (typeof value === 'string' && value.length <= max && /^[A-Za-z0-9._~:=+/-]+$/.test(value) ? value : null);
  const srk = id(input?.srk, 200), offerIndex = id(input?.offerIndex, 200), searchToken = id(input?.searchToken, 4000);
  const itineraryIndex = Number.isInteger(input?.input?.itineraryIndex) && input.input.itineraryIndex >= 0 && input.input.itineraryIndex < 100 ? input.input.itineraryIndex : 0;
  return srk && offerIndex && searchToken ? { srk, offerIndex, searchToken, input: { itineraryIndex } } : null;
}

// Keep only what the site reads: times, carriers, durations, prices, baggage-relevant services, refundability.
const firstLine = text => String(text || '').split('\n')[0].replace(/^#\d+\.\s*/, '').slice(0, 80);
const slimPoint = p => p && ({ airport: { code: p.airport?.code, name: p.airport?.name }, city: { code: p.city?.code, name: p.city?.name }, date: p.date, time: p.time });
// Fare-family services beyond baggage: one entry per category and charge type (change, refund, seat, meal).
const FARE_SERVICE = s => ['VC', 'VR', 'SE', 'ML'].includes(s.categoryCode) || (s.categoryCode === 'OTHER' && s.atpcoSubGroup === 'RF');
function slimServices(list = []) {
  const seen = new Set(), out = [];
  for (const s of list) {
    if (['BG', 'CY'].includes(s.categoryCode)) { out.push({ categoryCode: s.categoryCode, chargeType: s.chargeType, name: firstLine(s.name) }); continue; }
    if (!FARE_SERVICE(s)) continue;
    const category = s.categoryCode === 'OTHER' ? 'VR' : s.categoryCode, key = `${category}|${s.chargeType}`;
    if (!seen.has(key)) { seen.add(key); out.push({ categoryCode: category, chargeType: s.chargeType, name: firstLine(s.name) }); }
  }
  return out;
}
// Per passenger type: the per-person amount and the fewest seats the supplier reports on any segment.
const num = v => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const slimItems = items => (Array.isArray(items) ? items.slice(0, 3).map(i => ({ ptc: i?.ptc, count: i?.count,
  price: { currency: i?.price?.currency, fullFare: num(i?.price?.fullFare), serviceFee: num(i?.price?.serviceFee) },
  seats: (s => (s.length ? Math.min(...s) : null))((i?.fareComponents || []).map(f => f?.numberOfSeats).filter(Number.isInteger)) })) : undefined);
const slimCarrier = c => c && ({ airline: { code: c.airline?.code, name: c.airline?.name }, flightNumber: c.flightNumber ?? null });
function slimOffer(offer) {
  if (!offer) return offer;
  const fare = offer.fareDetails || {};
  return {
    index: offer.index,
    flightsOverview: (offer.flightsOverview || []).map(f => ({ itineraryIndex: f.itineraryIndex, flightReferences: f.flightReferences })),
    baggageAllowanceList: offer.baggageAllowanceList,
    fareDetails: { totalPrice: fare.totalPrice, nonRefundable: fare.nonRefundable ?? null, timeLimits: fare.timeLimits,
      brandedFare: (fare.brandedFare || []).map(b => ({ code: b.code, name: b.name, departure: b.departure, arrival: b.arrival, cabin: b.cabin,
        serviceList: slimServices(b.serviceList) })) },
    offerItems: slimItems(offer.offerItems)
  };
}
function slimLists(lists = {}) {
  return {
    flightList: (lists.flightList || []).map(f => ({ key: f.key, segmentReferences: f.segmentReferences, flightDetails: { duration: f.flightDetails?.duration ?? null } })),
    flightSegmentList: (lists.flightSegmentList || []).map(s => ({ key: s.key, departure: slimPoint(s.departure), arrival: slimPoint(s.arrival),
      marketingCarrier: slimCarrier(s.marketingCarrier), operatingCarrier: slimCarrier(s.operatingCarrier), flightDetails: { duration: s.flightDetails?.duration ?? null } }))
  };
}
export const slimSearch = data => ({ srk: data?.srk, tokens: data?.tokens, offers: (data?.offers || []).map(slimOffer), dataLists: slimLists(data?.dataLists) });
export const slimAvailability = data => ({ ...data, pricedOffer: slimOffer(data?.pricedOffer), dataLists: data?.dataLists ? slimLists(data.dataLists) : undefined });

// Identical searches within a few minutes share one supplier call (refresh, a shared link, a double click).
const SEARCH_TTL_MS = 3 * 60000;
const searchCache = new Map(), inFlight = new Map();
export async function cachedSearch(body, run, now = Date.now) {
  const key = JSON.stringify(body), hit = searchCache.get(key);
  if (hit && now() - hit.at < SEARCH_TTL_MS) return { data: hit.data, cached: true, searchedAt: hit.at };
  if (inFlight.has(key)) return inFlight.get(key);
  const promise = run(body).then(data => {
    searchCache.set(key, { data, at: now() });
    if (searchCache.size > 200) searchCache.delete(searchCache.keys().next().value);
    return { data, cached: false, searchedAt: now() };
  }).finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
}

// One retry for transient supplier failures that came back fast enough to fit in the browser's 45 s wait.
export async function withRetry(run, { retryWithinMs = 15000, delayMs = 800, sleep = ms => new Promise(r => setTimeout(r, ms)) } = {}) {
  const started = Date.now();
  try { return await run(); }
  catch (error) {
    const transient = [429, 502, 503, 504].includes(error.status) || error.message === 'volero_timeout' || error.name === 'TypeError';
    if (!transient || Date.now() - started > retryWithinMs || error.message === 'volero_timeout') throw error;
    await sleep(delayMs + Math.random() * 400);
    return run();
  }
}

// Token bucket per client and route, per instance: traffic shaping for the supplier/AI routes (see allowShared below for security limits).
const buckets = new Map();
export const LIMITS = { search: [12, 60000], searchMulti: [6, 60000], availability: [30, 60000], ai: [40, 60000], book: [3, 60000], leads: [5, 600000], leadsAdmin: [10, 60000] };
export function allow(client, route, now = Date.now()) {
  const [capacity, windowMs] = LIMITS[route] || [60, 60000], key = `${route}:${client}`;
  const bucket = buckets.get(key) || { tokens: capacity, at: now };
  bucket.tokens = Math.min(capacity, bucket.tokens + ((now - bucket.at) / windowMs) * capacity); bucket.at = now;
  if (buckets.size > 5000) buckets.clear();
  if (bucket.tokens < 1) { buckets.set(key, bucket); return false; }
  bucket.tokens -= 1; buckets.set(key, bucket); return true;
}
// The client address every limit is keyed on. Never the left-most X-Forwarded-For: the browser writes that one.
//   Vercel: x-vercel-forwarded-for / x-real-ip, set by the platform edge (it also overwrites X-Forwarded-For).
//   TRUST_PROXY=1 (own reverse proxy in front): the right-most X-Forwarded-For hop, the one that proxy appended.
//   Otherwise (direct): the socket address.
const header = (value) => String(Array.isArray(value) ? value[0] : value || '');
const ip = (value) => { const v = value.trim().slice(0, 64); return /^[0-9A-Fa-f:.]+$/.test(v) ? v : ''; };
export function clientOf(req, env = process.env) {
  const h = req.headers || {}, xff = header(h['x-forwarded-for']).split(',').map((part) => part.trim()).filter(Boolean);
  if (env.VERCEL) { const v = ip(header(h['x-vercel-forwarded-for']).split(',')[0]) || ip(header(h['x-real-ip'])) || ip(xff.at(-1) || ''); if (v) return v; }
  else if (env.TRUST_PROXY === '1' && xff.length) return xff.at(-1).slice(0, 64);
  return req.socket?.remoteAddress || 'unknown';
}

// Limits that guard secrets and storage (owner login, account sign-in, lead creation) must hold across serverless
// instances: fixed-window counters in the KV store (Upstash INCR + EXPIRE; data/ratelimit.json locally).
// Without a configured store, or when it fails, an in-process counter stands in, so a KV outage never locks people out.
let sharedStore = null;
const memory = new Map();
export function configureLimits(store) { sharedStore = store; memory.clear(); }
function memoryIncr(key, seconds, now) {
  const entry = memory.get(key);
  if (!entry || entry.expires < now) { if (memory.size > 20000) memory.clear(); memory.set(key, { value: 1, expires: now + seconds * 1000 }); return 1; }
  return ++entry.value;
}
let warned = false;
const fallback = (error) => { if (!warned) { warned = true; console.log(JSON.stringify({ evt: 'rate_limit_store', ok: false, error: String(error?.message || error).slice(0, 80) })); } };
export const counters = {
  async hit(key, seconds, now = Date.now()) {
    if (sharedStore?.incr) try { return await sharedStore.incr(`rl:${key}`, seconds); } catch (error) { fallback(error); }
    return memoryIncr(key, seconds, now);
  },
  async peek(key, now = Date.now()) {
    if (sharedStore) try { return Number(await sharedStore.get(`rl:${key}`)) || 0; } catch (error) { fallback(error); }
    const entry = memory.get(key); return entry && entry.expires >= now ? entry.value : 0;
  },
  async lock(key, seconds, now = Date.now()) {
    if (sharedStore) try { await sharedStore.set(`rl:${key}`, 1, seconds); return; } catch (error) { fallback(error); }
    memory.set(key, { value: 1, expires: now + seconds * 1000 });
  },
  async clear(key) {
    memory.delete(key);
    if (sharedStore) try { await sharedStore.del(`rl:${key}`); } catch (error) { fallback(error); }
  }
};
// Same LIMITS table as allow(), fixed window instead of a token bucket; false = over the limit.
export async function allowShared(client, route) {
  const [capacity, windowMs] = LIMITS[route] || [60, 60000];
  return (await counters.hit(`${route}:${client}`, Math.ceil(windowMs / 1000))) <= capacity;
}
