// Homepage "deals" strip: the cheapest fare found for a handful of popular routes from Tel Aviv over the next weeks.
// Look-to-book matters, so the supplier is asked rarely: a few probes per route, cached for hours (memory + kv store),
// served stale while one background refresh runs, and never triggered by a visitor more than once per refresh window.
import { offerFacts } from '../dist/flight-view.mjs';
import { placeType } from '../dist/places.mjs';
import { validSearch, slimSearch } from './volero-guard.mjs';

export const DEAL_ROUTES = ['LON', 'PAR', 'FCO', 'ATH', 'BCN', 'LCA'];
// Days ahead to depart and nights to stay: two probes per route spread over the coming weeks.
export const DEAL_PROBES = [{ inDays: 14, nights: 4 }, { inDays: 30, nights: 5 }];
export const DEALS_FRESH_MS = 8 * 3600_000;   // after this a visit triggers one background refresh
export const DEALS_MAX_AGE_MS = 72 * 3600_000; // older than this is never shown
const LOCK_SECONDS = 180;

const addDays = (iso, days) => new Date(Date.parse(iso + 'T12:00:00Z') + days * 86400000).toISOString().slice(0, 10);

// The validated supplier requests behind one refresh (1 adult, so the price reads "per person").
export function dealRequests(today = new Date().toISOString().slice(0, 10), routes = DEAL_ROUTES, probes = DEAL_PROBES) {
  return routes.flatMap(destination => probes.map(({ inDays, nights }) => {
    const depart = addDays(today, inDays), back = addDays(depart, nights);
    const leg = (a, b, date) => ({ origin: { code: a, type: placeType(a) }, destination: { code: b, type: placeType(b) }, date });
    const request = validSearch({ originDestinations: [leg('TLV', destination, depart), leg(destination, 'TLV', back)], passengers: { ptcList: [{ ptc: 'ADT', count: 1 }] } }, today);
    return request && { destination, depart, back, request };
  }).filter(Boolean));
}

// The cheapest priced offer of one (slimmed) search, reduced to what the strip shows.
export function cheapestDeal(data, probe) {
  let best = null;
  for (const offer of data?.offers || []) {
    const facts = offerFacts(offer, data);
    if (!facts.price || !(facts.price.value > 0)) continue;
    if (!best || facts.price.value < best.price.value) best = facts;
  }
  if (!best) return null;
  return { origin: 'TLV', destination: probe.destination, depart: probe.depart, back: probe.back, price: best.price,
    carrier: best.carriers[0] || null, stops: best.stops, airports: best.airports };
}

// One deal per route: the cheapest of its probes (same currency only).
export function pickDeals(found) {
  const byRoute = new Map();
  for (const deal of found.filter(Boolean)) {
    const current = byRoute.get(deal.destination);
    if (!current || (deal.price.currency === current.price.currency && deal.price.value < current.price.value)) byRoute.set(deal.destination, deal);
  }
  return [...byRoute.values()];
}

// search(request) → slimmed supplier data. store: kv-store ({get,set}). Returns {get(), refresh()}.
export function createDeals({ search, store, now = Date.now, today = () => new Date().toISOString().slice(0, 10), concurrency = 2, log = () => {} }) {
  // lastTry: an in-memory cool-down, so a refresh that found nothing (or a store that is down and holds no lock)
  // is not repeated by every visitor.
  let memo = null, inFlight = null, lastTry = -Infinity;
  async function load() {
    if (memo) return memo;
    try { memo = await store.get('latest'); } catch { memo = null; }
    return memo;
  }
  async function refresh() {
    if (inFlight) return inFlight;
    inFlight = (async () => {
      // A short lock in the shared store keeps parallel instances from refreshing at the same time.
      try { if (await store.get('lock')) return memo; await store.set('lock', { at: now() }, LOCK_SECONDS); } catch { /* store down: refresh anyway */ }
      const probes = dealRequests(today()), found = [];
      let failures = 0;
      for (let i = 0; i < probes.length; i += concurrency) {
        const batch = await Promise.allSettled(probes.slice(i, i + concurrency).map(probe => search(probe.request).then(data => cheapestDeal(data, probe))));
        for (const result of batch) { if (result.status === 'fulfilled') found.push(result.value); else failures++; }
        // A supplier that refuses everything gets no more calls this round.
        if (failures >= concurrency && !found.some(Boolean)) break;
      }
      const deals = pickDeals(found);
      log({ route: 'deals', ok: deals.length > 0, probes: probes.length, failures, deals: deals.length });
      // Keep the previous strip when a refresh found nothing (supplier down): stale beats empty.
      if (!deals.length) return memo;
      memo = { deals, updatedAt: new Date(now()).toISOString(), at: now() };
      try { await store.set('latest', memo, Math.ceil(DEALS_MAX_AGE_MS / 1000)); } catch { /* memory copy still serves */ }
      return memo;
    })().finally(() => { inFlight = null; });
    return inFlight;
  }
  // Never waits for the supplier: returns what is cached and, when it is old, starts one refresh in the background.
  async function get({ background = promise => promise.catch(() => {}) } = {}) {
    const cached = await load(), age = cached ? now() - cached.at : Infinity;
    let refreshing = Boolean(inFlight);
    if (age > DEALS_FRESH_MS && !inFlight && now() - lastTry > LOCK_SECONDS * 1000) { lastTry = now(); background(refresh()); refreshing = true; }
    if (!cached || age > DEALS_MAX_AGE_MS) return { deals: [], updatedAt: null, stale: false, refreshing };
    return { deals: cached.deals, updatedAt: cached.updatedAt, stale: age > DEALS_FRESH_MS, refreshing };
  }
  return { get, refresh };
}

export const searchForDeals = (voleroFlightSearch, withRetry) => request => withRetry(() => voleroFlightSearch(request)).then(slimSearch);
