// Everything between the browser and Volero: validation (the server never forwards free-form JSON with the
// agency's credentials), trimming (a 610-offer search is ~6.5 MB raw, over Vercel's 4.5 MB response limit),
// a short cache with in-flight de-duplication, one retry on transient failures, and per-client rate limits.
const CODE = /^[A-Z]{3}$/, DATE = /^\d{4}-\d{2}-\d{2}$/;

export function validSearch(input, today = new Date().toISOString().slice(0, 10)) {
  const legs = input?.originDestinations;
  if (!Array.isArray(legs) || legs.length < 1 || legs.length > 2) return null;
  const limit = new Date(Date.parse(today) + 365 * 86400000).toISOString().slice(0, 10);
  const point = p => (p && CODE.test(p.code) && ['a', 'c'].includes(p.type) ? { code: p.code, type: p.type } : null);
  const clean = legs.map(leg => ({ origin: point(leg?.origin), destination: point(leg?.destination), date: leg?.date }));
  if (clean.some(leg => !leg.origin || !leg.destination || leg.origin.code === leg.destination.code || !DATE.test(leg.date) || leg.date < today || leg.date > limit)) return null;
  if (clean[1] && clean[1].date < clean[0].date) return null;
  const ptcList = (Array.isArray(input?.passengers?.ptcList) ? input.passengers.ptcList : []).filter(p => ['ADT', 'CHD', 'INF'].includes(p?.ptc) && Number.isInteger(p.count) && p.count > 0);
  const total = ptcList.reduce((sum, p) => sum + p.count, 0), adults = ptcList.find(p => p.ptc === 'ADT')?.count || 0;
  if (!adults || total > 9 || new Set(ptcList.map(p => p.ptc)).size !== ptcList.length) return null;
  return { originDestinations: clean, passengers: { ptcList: ptcList.map(({ ptc, count }) => ({ ptc, count })) }, sellingChannel: 'B2B', language: 'en_GB', timeout: 10 };
}

export function validAvailability(input) {
  const id = (value, max) => (typeof value === 'string' && value.length <= max && /^[A-Za-z0-9._~:=+/-]+$/.test(value) ? value : null);
  const srk = id(input?.srk, 200), offerIndex = id(input?.offerIndex, 200), searchToken = id(input?.searchToken, 4000);
  const itineraryIndex = Number.isInteger(input?.input?.itineraryIndex) && input.input.itineraryIndex >= 0 && input.input.itineraryIndex < 100 ? input.input.itineraryIndex : 0;
  return srk && offerIndex && searchToken ? { srk, offerIndex, searchToken, input: { itineraryIndex } } : null;
}

// Keep only what the site reads: times, carriers, durations, prices, baggage-relevant services, refundability.
const firstLine = text => String(text || '').split('\n')[0].replace(/^#\d+\.\s*/, '').slice(0, 80);
const slimPoint = p => p && ({ airport: { code: p.airport?.code, name: p.airport?.name }, city: { code: p.city?.code, name: p.city?.name }, date: p.date, time: p.time });
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
        serviceList: (b.serviceList || []).filter(s => ['BG', 'CY'].includes(s.categoryCode)).map(s => ({ categoryCode: s.categoryCode, chargeType: s.chargeType, name: firstLine(s.name) })) })) }
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

// Token bucket per client and route. ponytail: per instance; a shared store (Upstash) if abuse spans instances.
const buckets = new Map();
export const LIMITS = { search: [12, 60000], availability: [30, 60000], ai: [40, 60000], book: [3, 60000] };
export function allow(client, route, now = Date.now()) {
  const [capacity, windowMs] = LIMITS[route] || [60, 60000], key = `${route}:${client}`;
  const bucket = buckets.get(key) || { tokens: capacity, at: now };
  bucket.tokens = Math.min(capacity, bucket.tokens + ((now - bucket.at) / windowMs) * capacity); bucket.at = now;
  if (buckets.size > 5000) buckets.clear();
  if (bucket.tokens < 1) { buckets.set(key, bucket); return false; }
  bucket.tokens -= 1; buckets.set(key, bucket); return true;
}
export const clientOf = req => String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
