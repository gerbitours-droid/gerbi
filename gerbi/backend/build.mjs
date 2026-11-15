// Magic trip builder API (spec 24 §9). The browser sends text and a few validated fields; the server plans the package
// from the catalog, then runs the supplier searches it derived itself (flights + hotels) through caches and rate limits.
import { createHash, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { parseTrip, applyEdits, planPackage, L } from '../dist/trip-builder.mjs';
import { sanitizePackage } from '../dist/trip-package.mjs';
import { byId, byCode } from '../dist/catalog.mjs';
import { offerFacts } from '../dist/flight-view.mjs';
import { scoreOffers, rankScored, diverseTop, badges, explain, itineraryKey } from '../dist/scoring.mjs';
import { setLang, lang as pageLang, normLang } from '../dist/i18n.mjs';
import { validSearch, slimSearch, cachedSearch, withRetry, allow, clientOf } from './volero-guard.mjs';
import { validHotelSearch, createHotelSearch, IMAGE_SRC } from './hotels.mjs';

const FLIGHT_TTL = 20 * 60, SHARE_TTL = 30 * 86400;
const fixtures = (env) => env.GERBI_SUPPLIER_FIXTURES === '1' && !env.VERCEL;
const fixture = async (name) => JSON.parse(await readFile(new URL(`../tests/fixtures/build/${name}.json`, import.meta.url), 'utf8'));
const hash = (value) => createHash('sha1').update(JSON.stringify(value)).digest('hex');

// The three flights a package shows: the site's own decision layer (generalized cost, diverse top 3), facts only.
export function flightPicks(payload, request = {}, l = 'he') {
  const facts = (Array.isArray(payload?.offers) ? payload.offers : []).map((offer) => offerFacts(offer, payload)).filter((f) => f.price);
  if (!facts.length) return [];
  const brief = { adults: request.adults, children: request.children, stops: request.needs?.direct ? '0' : undefined };
  const previous = pageLang;
  setLang(l);
  try {
    const scored = scoreOffers(facts, brief), ranked = rankScored(scored), top = diverseTop(ranked, 3), tags = badges(scored);
    return top.map((x) => ({ key: itineraryKey(x.facts), carriers: x.facts.carriers.slice(0, 4), price: x.facts.price, stops: x.facts.stops ?? 0, minutes: x.facts.totalMinutes, bag: x.facts.checked,
      legs: x.facts.legs.map((leg) => ({ from: leg.segments[0]?.departure?.airport?.code || '', to: leg.segments.at(-1)?.arrival?.airport?.code || '', date: leg.summary.departDate,
        depart: leg.segments[0]?.departure?.time || '', arrive: leg.segments.at(-1)?.arrival?.time || '', stops: leg.summary.stops, dayOffset: leg.summary.dayOffset })),
      badges: tags.get(x.key) || [], reasons: explain(x, scored, (v) => `${Math.round(v)} ${x.facts.price.currency}`) }));
  } finally { setLang(previous); }
}

export function createBuilder({ store, llmCache = null, env = process.env, flightSearch, hotelSearch: rawHotelSearch, hotelImage, partner = null, polish = null, log = () => {}, now = () => Date.now() }) {
  const today = () => new Date(now()).toISOString().slice(0, 10);
  const hotels = createHotelSearch({ store, log, now, search: async (input, options) => {
    if (fixtures(env)) { const f = await fixture('hotels'); return { hotels: f.hotels, totalItems: f.totalItems, complete: true, filtered: !options.fallbackQuery }; }
    return rawHotelSearch(input, options);
  } });

  async function flights(search, request, l) {
    const key = 'f:' + hash(search), hit = await store?.get(key).catch(() => null);
    let data, searchedAt, cached = Boolean(hit);
    if (hit) ({ data, searchedAt } = hit);
    else if (fixtures(env)) { data = await fixture('flights'); searchedAt = new Date(now()).toISOString(); }
    else {
      const result = await cachedSearch(search, (input) => withRetry(() => flightSearch(input)).then(slimSearch));
      data = result.data; searchedAt = new Date(result.searchedAt).toISOString(); cached = result.cached;
      await store?.set(key, { data, searchedAt }, FLIGHT_TTL).catch(() => {});
    }
    const picks = flightPicks(data, request, l);
    return { status: picks.length ? 'live' : 'none', searchedAt, total: data?.offers?.length || 0, picks, selected: picks[0]?.key || '', cached };
  }

  async function plan(input) {
    const l = normLang(input.lang), t0 = today();
    const text = typeof input.text === 'string' ? input.text.slice(0, 1500) : '';
    const dest = typeof input.dest === 'string' && byId(input.dest) ? input.dest : '';
    if (!text.trim() && !dest) return { error: 'text_required' };
    let request = parseTrip(text, { today: t0, lang: l, destId: dest });
    // The LLM partner only when the rules understood little and named no destination (spec 24 §8).
    if (partner && !request.destinations.length && request.coverage?.needsPartner) {
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
    return { id: randomUUID().slice(0, 12), createdAt: new Date(now()).toISOString(), lang: l, ...p, request: publicRequest,
      understood: request.understood, questions: request.questions, flightSearch: validSearch(p.flightSearch, t0), hotelSearches: (p.hotelSearches || []).map((s) => validHotelSearch(s, t0) && s) };
  }

  async function route(req, res, url, { send, body }) {
    const path = url.pathname, client = clientOf(req);
    if (path === '/api/build/hotel-image' && req.method === 'GET') {
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
      try { return send(200, await hotels(search)); }
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

  return {
    plan, flights, hotels,
    async handle(req, res, url, helpers) {
      if (url.pathname !== '/api/build' && !url.pathname.startsWith('/api/build/')) return false;
      await route(req, res, url, helpers);
      return true;
    }
  };
}

