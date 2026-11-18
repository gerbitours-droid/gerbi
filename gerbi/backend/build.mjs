// Magic trip builder API (spec 24 §9). The browser sends text and a few validated fields; the server plans the package
// from the catalog, then runs the supplier searches it derived itself (flights + hotels) through caches and rate limits.
import { createHash, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { parseTrip, applyEdits, planPackage, mergeModel, L } from '../dist/trip-builder.mjs';
import { refineRequest, carrierMatches } from '../dist/trip-prefs.mjs';
import { sanitizePackage } from '../dist/trip-package.mjs';
import { byId, byCode } from '../dist/catalog.mjs';
import { offerFacts } from '../dist/flight-view.mjs';
import { scoreOffers, rankScored, diverseTop, badges, explain, itineraryKey } from '../dist/scoring.mjs';
import { setLang, lang as pageLang, normLang } from '../dist/i18n.mjs';
import { validSearch, slimSearch, cachedSearch, withRetry, allow, clientOf } from './volero-guard.mjs';
import { validHotelSearch, createHotelSearch, IMAGE_SRC } from './hotels.mjs';

const FLIGHT_TTL = 20 * 60, SHARE_TTL = 30 * 86400, AGENT_TTL = 14 * 86400;
// Owner decisions (spec 24 §1.3): supplier hotels are public only when HOTELS_PUBLIC_DISPLAY is on; the insurance
// partner link (Harel) only when INSURANCE_PARTNER_URL is an https URL. Both off by default.
export const hotelsPublic = (env = process.env) => ['1', 'true'].includes(String(env.HOTELS_PUBLIC_DISPLAY || '').toLowerCase());
export const insuranceUrl = (env = process.env) => (/^https:\/\/[^\s<>"']{4,300}$/.test(env.INSURANCE_PARTNER_URL || '') ? env.INSURANCE_PARTNER_URL : '');
const fixtures = (env) => env.GERBI_SUPPLIER_FIXTURES === '1' && !env.VERCEL;
const fixture = async (name) => JSON.parse(await readFile(new URL(`../tests/fixtures/build/${name}.json`, import.meta.url), 'utf8'));
const hash = (value) => createHash('sha1').update(JSON.stringify(value)).digest('hex');

// The three flights a package shows: the site's own decision layer (generalized cost, diverse top 3), facts only.
export function flightPicks(payload, request = {}, l = 'he') {
  const all = (Array.isArray(payload?.offers) ? payload.offers : []).map((offer) => offerFacts(offer, payload)).filter((f) => f.price);
  if (!all.length) return [];
  const { facts, unmet } = byPrefs(all, request);
  const fp = request.prefs?.flight || {}, noNight = fp.noNight ? ['morning', 'afternoon', 'evening'] : undefined;
  const brief = { adults: request.adults, children: request.children, stops: request.needs?.direct || fp.direct ? '0' : undefined,
    out: fp.out || noNight, back: fp.back || noNight, checkedBag: fp.checkedBag === true, carrier: fp.prefer?.[0] };
  const previous = pageLang;
  setLang(l);
  try {
    const scored = scoreOffers(facts, brief), ranked = rankScored(scored), top = diverseTop(ranked, 3), tags = badges(scored);
    return top.map((x, i) => ({ ...pickOf(x.facts), badges: tags.get(x.key) || [], reasons: explain(x, scored, (v) => `${Math.round(v)} ${x.facts.price.currency}`), ...(i === 0 && unmet.length ? { unmet } : {}) }));
  } finally { setLang(previous); }
}
// Hard flight wishes (owner 18.11.2026): "רק אל על" keeps only that airline, "בלי ריינאייר"/"no low-cost" drops them, a
// direct flight asked for drops connections, "no night flights" drops night departures. When a wish leaves nothing, all
// offers stay and the wish is reported as unmet (the page says "no El Al flights on these dates – the closest:").
export function byPrefs(facts, request = {}) {
  const fp = request.prefs?.flight || {}, unmet = [];
  let list = facts;
  const keep = (name, fn) => { const next = list.filter(fn); if (next.length) list = next; else unmet.push(name); };
  if (fp.only?.length) keep('only', (f) => fp.only.some((k) => carrierMatches(f.carriers, k)));
  if (fp.avoid?.length) keep('avoid', (f) => !fp.avoid.some((k) => carrierMatches(f.carriers, k)));
  if (request.needs?.direct || fp.direct) keep('direct', (f) => f.stops === 0);
  if (fp.noNight) keep('noNight', (f) => f.legs.every((leg) => { const h = Number(String(leg.segments[0]?.departure?.time || '12').slice(0, 2)); return h >= 6 && h < 23; }));
  if (fp.checkedBag === true) { const bag = list.filter((f) => f.checked === 'included'); if (bag.length) list = bag; }
  return { facts: list, unmet };
}
function pickOf(f) {
  // Spec 29: every segment travels with the pick so the brochure can print flight numbers, airports and times.
  const seg = (x) => ({ carrier: x.marketingCarrier?.airline?.name || '', number: [x.marketingCarrier?.airline?.code, x.marketingCarrier?.flightNumber].filter(Boolean).join(' '),
    from: x.departure?.airport?.code || '', fromName: x.departure?.city?.name || x.departure?.airport?.name || '', to: x.arrival?.airport?.code || '', toName: x.arrival?.city?.name || x.arrival?.airport?.name || '',
    date: x.departure?.date || '', depart: x.departure?.time || '', arriveDate: x.arrival?.date || '', arrive: x.arrival?.time || '', duration: x.flightDetails?.duration || '' });
  return { key: itineraryKey(f), offerIndex: String(f.index), itineraryIndex: f.offer?.flightsOverview?.[0]?.itineraryIndex ?? 0, carriers: f.carriers.slice(0, 4), price: f.price, stops: f.stops ?? 0, minutes: f.totalMinutes, bag: f.checked,
    trolley: f.trolley ?? null, refundable: f.refundable ?? null, longestLayover: f.longestLayover ?? null, overnight: Boolean(f.overnight), airportChange: Boolean(f.airportChange),
    legs: f.legs.map((leg) => ({ from: leg.segments[0]?.departure?.airport?.code || '', to: leg.segments.at(-1)?.arrival?.airport?.code || '', date: leg.summary.departDate,
      depart: leg.segments[0]?.departure?.time || '', arrive: leg.segments.at(-1)?.arrival?.time || '', stops: leg.summary.stops, dayOffset: leg.summary.dayOffset, segments: leg.segments.slice(0, 6).map(seg) })), badges: [], reasons: [] };
}
// Budget fit + upgrades (spec 28), from the offers already fetched: the cheapest offer that meets the hard constraints
// (direct when asked for), the cheapest direct one, and the cheapest with a checked bag included.
export function flightAlternatives(payload, request = {}) {
  const facts = (Array.isArray(payload?.offers) ? payload.offers : []).map((offer) => offerFacts(offer, payload)).filter((f) => f.price && Number.isFinite(f.price.value));
  const cheapest = (list) => list.reduce((a, b) => (!a || b.price.value < a.price.value ? b : a), null);
  const hard = byPrefs(facts, request).facts;
  const pick = (f) => (f ? { ...pickOf(f), badges: [] } : null);
  return { cheapest: pick(cheapest(hard)), direct: pick(cheapest(facts.filter((f) => f.stops === 0))), bag: pick(cheapest(hard.filter((f) => f.checked === 'included'))) };
}
// The destination's day trips as "add to my trip" ideas: catalog price per person when present (spec 28 §ד),
// else an estimate from the trip's travel time. English name kept for the photo key ('<destId>|<English name>').
export function upsellTrips(destId, l = 'he') {
  const d = byId(destId);
  return (d?.dayTrips || []).slice(0, 6).map((x, i) => {
    const priced = Number.isFinite(x.priceIls?.low) && Number.isFinite(x.priceIls?.high) && x.priceIls.low <= x.priceIls.high;
    const hours = Number.isFinite(x.hours) ? x.hours : 1.5;
    return { key: i, name: L(x.name, l), en: x.name?.en || '', note: L(x.note, l), priced, price: priced ? { low: x.priceIls.low, high: x.priceIls.high } : { low: Math.round(120 + 40 * hours), high: Math.round(200 + 70 * hours) } };
  });
}

// What the booking wizard needs to price the chosen flight again (spec 25 §9). The search token lives an hour.
const bookingRef = (data) => (data?.srk && data?.tokens?.searchResults ? { srk: data.srk, searchToken: data.tokens.searchResults } : null);

export function createBuilder({ store, llmCache = null, env = process.env, flightSearch, hotelSearch: rawHotelSearch, hotelImage, partner = null, tagger = null, funnel = null, polish = null, fx = null, log = () => {}, now = () => Date.now() }) {
  const today = () => new Date(now()).toISOString().slice(0, 10);
  const hotels = createHotelSearch({ store, log, now, keyPrefix: fixtures(env) ? 'fixture-h:' : 'h:', search: async (input, options) => {
    if (fixtures(env)) { const f = await fixture('hotels'); return { hotels: f.hotels, totalItems: f.totalItems, complete: true, filtered: !options.fallbackQuery }; }
    return rawHotelSearch(input, options);
  } });

  async function flights(search, request, l) {
    // Recorded answers never read or write the live cache (one store serves both in development), and an empty
    // supplier answer is never cached: the next build asks again instead of showing nothing for 20 minutes.
    const extras = (data) => (request.budget > 0 ? { alternatives: flightAlternatives(data, request) } : {});
    if (fixtures(env)) { const data = await fixture('flights'), picks = flightPicks(data, request, l); return { status: picks.length ? 'live' : 'none', searchedAt: new Date(now()).toISOString(), total: data.offers.length, picks, selected: picks[0]?.key || '', cached: false, booking: bookingRef(data), ...extras(data) }; }
    const key = 'f:' + hash(search), cachedHit = await store?.get(key).catch(() => null), hit = cachedHit?.data?.offers?.length ? cachedHit : null;
    let data, searchedAt, cached = Boolean(hit);
    if (hit) ({ data, searchedAt } = hit);
    else {
      const result = await cachedSearch(search, (input) => withRetry(() => flightSearch(input)).then(slimSearch));
      data = result.data; searchedAt = new Date(result.searchedAt).toISOString(); cached = result.cached;
      if (data?.offers?.length) await store?.set(key, { data, searchedAt }, FLIGHT_TTL).catch(() => {});
    }
    const picks = flightPicks(data, request, l);
    return { status: picks.length ? 'live' : 'none', searchedAt, total: data?.offers?.length || 0, picks, selected: picks[0]?.key || '', cached, booking: bookingRef(data), ...extras(data) };
  }

  async function plan(input) {
    const l = normLang(input.lang), t0 = today();
    const text = typeof input.text === 'string' ? input.text.slice(0, 1500) : '';
    const dest = typeof input.dest === 'string' && byId(input.dest) ? input.dest : '';
    if (!text.trim() && !dest) return { error: 'text_required' };
    // A budget in dollars / euros converts at the site's rate (spec 28 §א.1); no rate in 1.5 s → the amount is asked for.
    const rates = fx && /[$€]|usd|eur|dollar|euro|דולר|יורו/i.test(text) ? await Promise.race([fx.get().catch(() => null), new Promise((r) => setTimeout(r, 1500, null))]) : null;
    // A conversation (owner 18.11.2026): the first message, then follow-ups that refine it. Rebuilt from the texts on
    // every turn (nothing trusted from the page but the texts and the plan's current place/length/date as a seed).
    const thread = Array.isArray(input.thread) ? input.thread.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.slice(0, 600)).slice(-8) : [];
    let request = parseTrip(thread[0] || text, { today: t0, lang: l, destId: dest, fx: rates });
    if (thread.length > 1) {
      const cur = input.current || {};
      if (!request.destinations.length && Array.isArray(cur.dest)) { const ids = cur.dest.filter((id) => byId(id)).slice(0, 4); if (ids.length) { request.destinations = ids; request.suggest = false; } }
      if (!request.nights && Number.isInteger(cur.nights) && cur.nights > 0 && cur.nights <= 90) request.nights = cur.nights;
      if (!request.start && /^\d{4}-\d{2}-\d{2}$/.test(cur.start || '') && cur.start > t0) request.start = cur.start;
      for (const msg of thread.slice(1)) request = refineRequest(request, parseTrip(msg, { today: t0, lang: l, fx: rates }), msg);
    }
    // The model reads the request's meaning (tags, places, travellers) for every request when a provider is set; the
    // rules stay the source of exact dates/amounts and the whole answer without a model (or when it is slow).
    const said = thread.length > 1 ? thread.map((m, i) => (i ? `(עדכון ${i}) ${m}` : m)).join('\n') : text;
    const tags = tagger && said.trim() ? await Promise.race([tagger(said, l, t0).catch(() => null), new Promise((r) => setTimeout(r, Number(env.GERBI_TAGGER_TIMEOUT_MS) || 6000, null))]) : null;
    if (tags) request = mergeModel(request, tags, { today: t0, refine: thread.length > 1 });
    // The older LLM partner only when there was no tagger answer, the rules understood little and named no destination (spec 24 §8).
    if (!tags && partner && !request.destinations.length && request.coverage?.needsPartner) {
      const extra = await partner(text, request, l).catch(() => null);
      if (extra) {
        const ids = (codes) => (codes || []).map((c) => byCode(c)?.id).filter(Boolean);
        if (ids(extra.patch?.want).length) request = { ...request, destinations: ids(extra.patch.want).slice(0, 3), suggest: false };
        else if (ids(extra.suggest).length) request = { ...request, boost: ids(extra.suggest) };
        if (!request.nights && extra.patch?.nights) request.nights = extra.patch.nights;
      }
    }
    request = applyEdits(request, input.edits, t0);
    const chosen = typeof input.chosen === 'string' && byId(input.chosen) ? input.chosen : '';
    const p = planPackage(request, { today: t0, chosenId: chosen });
    const { coverage, legs, ...publicRequest } = p.request;
    return { id: randomUUID().slice(0, 12), createdAt: new Date(now()).toISOString(), lang: l, ...p, request: publicRequest, upsellTrips: p.request.budget > 0 && p.destination ? upsellTrips(p.destination.id, l) : [],
      config: { hotelsPublic: hotelsPublic(env), insuranceUrl: insuranceUrl(env) },
      understood: request.understood, questions: request.questions, flightSearch: validSearch(p.flightSearch, t0), hotelSearches: (p.hotelSearches || []).map((s) => validHotelSearch(s, t0) && s) };
  }

  async function route(req, res, url, { send, body }) {
    const path = url.pathname, client = clientOf(req);
    if (path === '/api/build/hotel-image' && req.method === 'GET') {
      if (!hotelsPublic(env)) return send(404, { error: 'not_found' });
      const src = url.searchParams.get('src') || '';
      if (!IMAGE_SRC.test(src)) return send(400, { error: 'invalid_src' });
      try {
        const image = fixtures(env) ? { type: 'image/svg+xml', body: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="300" height="200" fill="#dfe8f5"/></svg>') } : await hotelImage(src);
        res.writeHead(200, { 'Content-Type': image.type, 'Cache-Control': 'public, max-age=86400, s-maxage=604800' });
        return res.end(image.body);
      } catch { return send(404, { error: 'not_found' }); }
    }
    const share = /^\/api\/build\/share\/([a-z0-9-]{8,40})$/.exec(path);
    if (share && req.method === 'GET') {
      const pkg = await store?.get('pkg:' + share[1]).catch(() => null);
      return pkg ? send(200, { package: pkg }) : send(404, { error: 'not_found' });
    }
    if (req.method !== 'POST') return send(405, { error: 'method_not_allowed' });
    // Funnel counters (no personal data): its own small limit, answered at once, written in the background.
    if (path === '/api/build/event') {
      if (!allow(client, 'funnel')) return send(429, { error: 'rate_limited' });
      const input = await body(req, 300).catch(() => ({}));
      funnel?.record(String(input?.step || '')); return send(200, { ok: true });
    }
    const supplierRoute = path === '/api/build/flights' || path === '/api/build/hotels';
    if (!allow(client, supplierRoute ? 'buildSupplier' : 'build')) return send(429, { error: 'rate_limited', message: 'יותר מדי בקשות בזמן קצר. נסו שוב בעוד דקה.' });
    const input = await body(req, 64_000);
    const l = normLang(input?.lang);
    if (path === '/api/build') {
      const result = await plan(input || {});
      return result.error ? send(400, { error: result.error, message: 'ספרו לנו בכמה מילים על החופשה.' }) : send(200, result);
    }
    if (path === '/api/build/flights') {
      const search = validSearch(input?.search, today());
      if (!search) return send(400, { error: 'search_input_invalid' });
      if (!env.VOLERO_CLIENT_ID && !fixtures(env)) return send(200, { status: 'quote', reason: 'not_connected' });
      const started = now();
      try { const result = await flights(search, input.request || {}, l); log({ route: 'build_flights', ok: true, cached: result.cached, ms: now() - started, offers: result.total }); return send(200, result); }
      catch (error) { log({ route: 'build_flights', ok: false, ms: now() - started, error: error.message, status: error.status }); return send(200, { status: 'error' }); }
    }
    if (path === '/api/build/hotels') {
      const search = validHotelSearch(input?.search, today());
      if (!search) return send(400, { error: 'search_input_invalid' });
      if (!env.VOLERO_CLIENT_ID && !fixtures(env)) return send(200, { status: 'quote', reason: 'not_connected' });
      const started = now();
      try {
        const { estimate, ...result } = await hotels(search, { publicMode: hotelsPublic(env) });
        if (hotelsPublic(env)) return send(200, result);
        // Private mode: statistics only; the agent's top options stay on the server, keyed by an opaque reference.
        const ref = randomUUID().replace(/-/g, '').slice(0, 16);
        if (result.picks.length) await store?.set('agent-hotels:' + ref, { searchedAt: result.searchedAt, city: search.city, checkIn: search.checkIn, checkOut: search.checkOut, area: search.area,
          picks: result.picks.slice(0, 3).map(({ name, stars, board, price, address, refundable, role }) => ({ name, stars, board, price, address, refundable, role })) }, AGENT_TTL).catch(() => {});
        return send(200, { status: estimate ? 'estimate' : 'quote', mode: 'private', searchedAt: result.searchedAt, nights: result.nights, board: result.board, boardFallback: result.boardFallback,
          minStars: search.minStars, estimate, options: result.options, ref: result.picks.length ? ref : '' });
      }
      catch (error) { log({ route: 'build_hotels', ok: false, ms: now() - started, error: error.message, status: error.status }); return send(200, { status: 'quote', reason: 'supplier_error' }); }
    }
    if (path === '/api/build/polish') {
      if (!polish) return send(200, { polish: null });
      const days = Array.isArray(input?.days) ? input.days.slice(0, 40) : [];
      const result = await polish(String(input?.destination || ''), String(input?.travellers || ''), days, l).catch(() => null);
      return send(200, { polish: result ? { intro: result.intro, dayTitles: result.dayTitles } : null });
    }
    if (path === '/api/build/share') {
      const pkg = sanitizePackage(input?.package);
      if (!pkg?.destination) return send(400, { error: 'package_invalid' });
      const id = randomUUID().replace(/-/g, '').slice(0, 16);
      try { await store.set('pkg:' + id, { ...pkg, id, sharedAt: new Date(now()).toISOString() }, SHARE_TTL); }
      catch { return send(503, { error: 'share_unavailable' }); }
      return send(201, { id });
    }
    return send(404, { error: 'not_found' });
  }

  // Leads hook (backend/leads.mjs): a package lead gets the agent-only hotel options it was built from (admin is private).
  async function enrichLead(lead) {
    if (lead?.type !== 'package' || !lead.package) return null;
    const groups = lead.package.hotels?.stops || [lead.package.hotels];
    const agentHotels = (await Promise.all(groups.map(async (g, i) => (/^[a-f0-9]{16}$/.test(g?.ref || '') ? { stop: i, ...(await store?.get('agent-hotels:' + g.ref).catch(() => null)) } : null)))).filter((x) => x?.picks?.length);
    return agentHotels.length ? { agentHotels } : null;
  }

  return {
    plan, flights, hotels, enrichLead,
    async handle(req, res, url, helpers) {
      if (url.pathname !== '/api/build' && !url.pathname.startsWith('/api/build/')) return false;
      await route(req, res, url, helpers);
      return true;
    }
  };
}

