import http from 'node:http';
import zlib from 'node:zlib';
import { existsSync, readFileSync } from 'node:fs';
const envPath = new URL('./.env', import.meta.url);
if (existsSync(envPath)) for (const line of readFileSync(envPath,'utf8').split('\n')) { const match = /^([A-Z_]+)=(.*)$/.exec(line); if(match && !process.env[match[1]]) process.env[match[1]] = match[2]; }
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { trips } from './dist/data.mjs';
import { LearningStore } from './backend/learning-store.mjs';
import { destinationTags, publicTagCatalog } from './backend/tag-catalog.mjs';
import { extractSignals, missingFields, scoreDestinations, understandRequest } from './backend/understanding.mjs';
import { voleroFlightAvailability, voleroFlightBook, voleroFlightSearch } from './backend/volero-client.mjs';
import { createStore } from './backend/kv-store.mjs';
import { validSearch, validAvailability, slimSearch, slimAvailability, cachedSearch, withRetry, allow, clientOf } from './backend/volero-guard.mjs';
import { QueryMemory, EVENT_WEIGHTS } from './backend/query-memory.mjs';
import { partnerUnderstand, partnerTieBreak, partnerStatus } from './backend/llm-partner.mjs';
import { places } from './dist/places.mjs';
import { learnFromChoice } from './dist/scoring.mjs';
const root = path.resolve(fileURLToPath(new URL('./dist/', import.meta.url)));
const dataDirectory = path.resolve(fileURLToPath(new URL('./data/', import.meta.url)));
const learning = new LearningStore(dataDirectory);
const memory = new QueryMemory(createStore('query-memory', dataDirectory));
const llmCache = createStore('llm-cache', dataDirectory);
// Learned multipliers on the prices of time and inconvenience (spec §2.6), shared by all travelers.
const learnedStore = createStore('learned-costs', dataDirectory);
const featureVector = (value) => Object.fromEntries(['hour', 'stop', 'longWait', 'overnight', 'offHours', 'nightDeparture'].map((key) => [key, Number.isFinite(value?.[key]) ? Math.max(0, Math.min(100, value[key])) : 0]));
const placeCodes = new Set(places.map((place) => place.code));
// The canonical brief the decision endpoints accept: every field re-validated, nothing free-text.
function safeBrief(input = {}) {
  const code = (value) => (typeof value === 'string' && placeCodes.has(value) ? value : '');
  const int = (value, min, max) => (Number.isInteger(value) && value >= min && value <= max ? value : undefined);
  const brief = { origin: code(input.origin) || 'TLV', destination: code(input.destination), want: Array.isArray(input.want) ? input.want.map(code).filter(Boolean).slice(0, 6) : [],
    start: typeof input.start === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input.start) ? input.start : '', month: typeof input.month === 'string' ? input.month.slice(0, 12) : '',
    tripType: input.tripType === 'oneway' ? 'oneway' : 'round', adults: int(input.adults, 1, 9) ?? 2, children: int(input.children, 0, 8) ?? 0, nights: int(input.nights, 1, 30),
    cheaper: input.cheaper === true, checkedBag: input.checkedBag === true, stops: ['0', '1'].includes(input.stops) ? input.stops : undefined,
    out: Array.isArray(input.out) ? input.out.filter((b) => ['night', 'morning', 'afternoon', 'evening'].includes(b)) : undefined,
    back: Array.isArray(input.back) ? input.back.filter((b) => ['night', 'morning', 'afternoon', 'evening'].includes(b)) : undefined,
    carrier: typeof input.carrier === 'string' ? input.carrier.slice(0, 20) : undefined };
  for (const key of ['beach', 'city', 'relaxation', 'family', 'couple']) if (typeof input[key] === 'boolean') brief[key] = input[key];
  return brief;
}
const itemKey = (value) => (typeof value === 'string' && /^[A-Za-z0-9@:+|?._-]{1,240}$/.test(value) ? value : '');
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.mjs':'text/javascript; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp', '.svg':'image/svg+xml', '.woff2':'font/woff2' };

function json(res, code, data) {
  const text = JSON.stringify(data), headers = { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store', Vary:'Accept-Encoding' };
  // Flight results are large JSON; gzip cuts them by ~90% on the wire.
  if (text.length > 2048 && /\bgzip\b/.test(res.req?.headers['accept-encoding'] || '')) { res.writeHead(code, { ...headers, 'Content-Encoding':'gzip' }); return res.end(zlib.gzipSync(text)); }
  res.writeHead(code, headers); res.end(text);
}
// One JSON line per supplier call for the hosting logs: route, outcome, timing, size – never passenger data.
const supplier = { lastOkAt: null, lastErrorAt: null, lastError: null, calls: 0, cacheHits: 0 };
function logSupplier(entry) { supplier.calls++; if (entry.cached) supplier.cacheHits++; if (entry.ok) supplier.lastOkAt = new Date().toISOString(); else { supplier.lastErrorAt = new Date().toISOString(); supplier.lastError = entry.error; } console.log(JSON.stringify({ evt:'volero', ...entry })); }
const tooMany = (send) => send(429, { error:'rate_limited', message:'יותר מדי בקשות בזמן קצר. נסו שוב בעוד דקה.' });

async function body(req, limit = 32_000) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > limit) throw new Error('payload_too_large');
  }
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { throw new Error('invalid_json'); }
}

function string(value, max = 1500) {
  return typeof value === 'string' ? value.slice(0, max) : '';
}

function id(value, max = 80) {
  return typeof value === 'string' && /^[a-z0-9_-]+$/i.test(value) ? value.slice(0, max) : '';
}
function supplierError(send, error) {
  const status = error.status === 504 ? 504 : Number.isInteger(error.status) && error.status >= 400 && error.status < 500 ? error.status : 502;
  return send(status, { error:error.message, provider:'volero' });
}
export function createServer() {
 return http.createServer(async (req,res) => {
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  const send = (code,data) => json(res, code, data);
  try {
   const url = new URL(req.url,'http://localhost');
   if (url.pathname === '/api/status') { const partner = partnerStatus(); return send(200,{ mode:'demo', provider:'Volero', credentialsConfigured:!!(process.env.VOLERO_CLIENT_ID && process.env.VOLERO_CLIENT_SECRET), connected:Boolean(supplier.lastOkAt && (!supplier.lastErrorAt || supplier.lastOkAt > supplier.lastErrorAt)), supplier:{ lastOkAt:supplier.lastOkAt, lastErrorAt:supplier.lastErrorAt, lastError:supplier.lastError, calls:supplier.calls, cacheHits:supplier.cacheHits }, booking:process.env.VOLERO_BOOKING_ENABLED === 'true' ? 'enabled' : 'disabled', storage:process.env.UPSTASH_REDIS_REST_URL ? 'upstash' : 'local', learning:'local_aggregates', partner:{ configured:partner.configured, model:partner.model, available:partner.configured && !partner.circuitOpen && partner.tokensLeftToday > 2000 } }); }
   if (url.pathname === '/api/tags' && req.method === 'GET') return send(200, { facets: publicTagCatalog(), destinations: destinationTags });
   if (url.pathname === '/api/learning/summary' && req.method === 'GET') return send(200, await learning.summary());
   if (url.pathname.startsWith('/api/ai/') && req.method === 'POST' && !allow(clientOf(req), 'ai')) return tooMany(send);
   if (url.pathname === '/api/ai/understand') {
    if (req.method !== 'POST') return send(405,{error:'method_not_allowed'});
    const input = await body(req);
    const text = string(input.text);
    if (!text.trim()) return send(400, { error:'text_required', message:'צריך לתאר בקצרה את החופשה.' });
    const previous = input.previous && typeof input.previous === 'object' ? input.previous : {};
    const signals = extractSignals(text, previous);
    const understanding = understandRequest(text, previous);
    // The LLM is consulted only when the rules understood too little of the text (spec §4.1).
    const partner = understanding.coverage.needsPartner ? await partnerUnderstand(llmCache, text, understanding.brief) : null;
    const weights = await learning.weightsFor(text);
    const recommendations = scoreDestinations(trips, signals, weights).map(({ destination, score, estimate, matchedTags }) => ({
      id: destination.id, score: Math.round(score * 100) / 100, estimate, matchedTags
    }));
    const summary = await learning.learnQuery({ text, tags: signals.tags, consent: input.learningConsent === true });
    return send(200, { mode:'rules_and_local_learning', signals, missing:missingFields(signals), understood:understanding.understood, assumed:understanding.assumed, questions:understanding.questions, flightSearch:understanding.flightSearch, coverage:understanding.coverage, partner: partner ? { used:true, ...partner } : { used:false }, recommendations, learning: { recorded: input.learningConsent === true, totals:summary.totals } });
   }
   if (url.pathname === '/api/ai/feedback') {
    if (req.method !== 'POST') return send(405,{error:'method_not_allowed'});
    const input = await body(req);
    const destinationId = id(input.destinationId);
    if (destinationId && !trips.some((trip) => trip.id === destinationId)) return send(400, { error:'unknown_destination' });
    const tags = Array.isArray(input.tags) ? input.tags.filter((tag) => typeof tag === 'string').slice(0, 20) : destinationTags[destinationId] || [];
    try { return send(200, { accepted:true, learning:await learning.feedback({ event:string(input.event,40), destinationId, tags }) }); }
    catch (error) { return send(400, { error:error.message }); }
   }
   if (url.pathname === '/api/ai/memory') {
    if (req.method !== 'POST') return send(405,{error:'method_not_allowed'});
    const input = await body(req);
    const items = Array.isArray(input.items) ? input.items.map(itemKey).filter(Boolean) : [];
    const learned = await learnedStore.get('global').catch(() => null) || {};
    try { return send(200, { boosts: await memory.boosts(safeBrief(input.brief), items), learned }); } catch { return send(200, { boosts: {}, learned }); }
   }
   if (url.pathname === '/api/ai/event') {
    if (req.method !== 'POST') return send(405,{error:'method_not_allowed'});
    const input = await body(req), event = string(input.event, 20);
    const items = [...new Set([].concat(input.items || input.item || []).map(itemKey).filter(Boolean))].slice(0, event === 'impression' ? 12 : 1);
    if (!items.length || !(event in EVENT_WEIGHTS)) return send(400, { error:'invalid_event' });
    try {
      const brief = safeBrief(input.brief); for (const item of items) await memory.event(brief, item, event);
      // A strong choice of an offer ranked below others teaches the cost model (bounded step, bounded total).
      if (['verify', 'save'].includes(event) && input.choice && Array.isArray(input.choice.above) && input.choice.above.length) {
        const learned = await learnedStore.get('global').catch(() => null) || {};
        await learnedStore.set('global', learnFromChoice(learned, featureVector(input.choice.chosen), input.choice.above.slice(0, 5).map(featureVector)));
      }
      return send(200, { accepted:true });
    } catch { return send(200, { accepted:false }); }
   }
   if (url.pathname === '/api/ai/tiebreak') {
    if (req.method !== 'POST') return send(405,{error:'method_not_allowed'});
    const input = await body(req);
    const number = (value, max) => (Number.isFinite(value) && value >= 0 && value <= max ? Math.round(value * 100) / 100 : null);
    const candidates = (Array.isArray(input.candidates) ? input.candidates : []).slice(0, 5).map((row) => ({ key: itemKey(row?.key),
      price: number(row?.price, 1e6), currency: typeof row?.currency === 'string' && /^[A-Z]{3}$/.test(row.currency) ? row.currency : '', minutes: number(row?.minutes, 1e4),
      stops: number(row?.stops, 6), longestWait: number(row?.longestWait, 1e4), departs: Array.isArray(row?.departs) ? row.departs.filter((t) => /^\d{2}:\d{2}$/.test(t)).slice(0, 2) : [],
      bag: ['included', 'paid', 'none', 'mixed', 'unknown'].includes(row?.bag) ? row.bag : 'unknown', carrier: string(row?.carrier, 40) })).filter((row) => row.key);
    const result = await partnerTieBreak(llmCache, safeBrief(input.brief), candidates);
    return send(200, result || { pick:null });
   }
   if (url.pathname === '/api/volero/flights/search') {
    if (req.method !== 'POST') return send(405,{error:'method_not_allowed'});
    if (!allow(clientOf(req), 'search')) return tooMany(send);
    const request = validSearch(await body(req));
    if (!request) return send(400,{error:'search_input_invalid',message:'פרטי החיפוש אינם תקינים.'});
    const started = Date.now();
    try {
      const result = await cachedSearch(request, (input) => withRetry(() => voleroFlightSearch(input)).then(slimSearch));
      logSupplier({ route:'search', ok:true, cached:result.cached, ms:Date.now() - started, offers:result.data.offers.length, legs:request.originDestinations.length });
      return send(200, { provider:'volero', data:result.data, cached:result.cached, searchedAt:new Date(result.searchedAt).toISOString() });
    } catch (error) { logSupplier({ route:'search', ok:false, ms:Date.now() - started, error:error.message, status:error.status }); return supplierError(send, error); }
   }
   if (url.pathname === '/api/volero/flights/availability') {
    if (req.method !== 'POST') return send(405,{error:'method_not_allowed'});
    if (!allow(clientOf(req), 'availability')) return tooMany(send);
    const request = validAvailability(await body(req));
    if (!request) return send(400,{error:'search_reference_required'});
    const started = Date.now();
    try { const data = slimAvailability(await withRetry(() => voleroFlightAvailability(request))); logSupplier({ route:'availability', ok:true, ms:Date.now() - started }); return send(200, { provider:'volero', data }); }
    catch (error) { logSupplier({ route:'availability', ok:false, ms:Date.now() - started, error:error.message, status:error.status }); return supplierError(send, error); }
   }
   if (url.pathname === '/api/volero/flights/book') {
    if (req.method !== 'POST') return send(405,{error:'method_not_allowed'});
    const input = await body(req);
    // A live booking charges the agency's supplier account; the browser has no booking flow yet, so the public
    // deployment refuses it unless an operator turns it on deliberately.
    if (process.env.VOLERO_BOOKING_ENABLED !== 'true') return send(403,{error:'booking_disabled',message:'הזמנה אינה זמינה באתר בשלב זה.'});
    if (!allow(clientOf(req), 'book')) return tooMany(send);
    if (input?.confirm !== true) return send(428,{error:'explicit_booking_confirmation_required',message:'Booking requires confirm:true.'});
    if (!input?.srk || !input?.searchToken || typeof input.offerIndex !== 'string' || !input.offerIndex || !input.input || typeof input.input !== 'object') return send(400,{error:'booking_input_required'});
    try { return send(200, { provider:'volero', data:await voleroFlightBook(input) }); }
    catch (error) { return supplierError(send, error); }
   }
   if (url.pathname === '/api/search' || url.pathname === '/api/revalidate') {
    if(req.method !== 'POST') return send(405,{error:'method_not_allowed'});
    return send(503,{error:'provider_not_connected',message:'אין כרגע חיבור מאומת לספק. לא ניתן לאשר מחיר או זמינות, ולא בוצעה הזמנה.'});
   }
   if (url.pathname.startsWith('/api/')) return send(404,{error:'not_found'});
   if (!['GET','HEAD'].includes(req.method)) return send(405,{error:'method_not_allowed'});
   let decoded;
   try { decoded = decodeURIComponent(url.pathname); } catch { return send(400,{error:'invalid_path'}); }
   const file = path.resolve(root, '.' + (decoded === '/' ? '/index.html' : decoded));
   if (!file.startsWith(root + path.sep) || decoded.split('/').some(x=>x.startsWith('.'))) return send(404,{error:'not_found'});
   const fileBody = await readFile(file);
   res.writeHead(200,{'Content-Type':types[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-cache'});
   res.end(req.method === 'HEAD' ? undefined : fileBody);
  } catch (error) {
   if (error.message === 'payload_too_large') return send(413, { error:'payload_too_large' });
   if (error.message === 'invalid_json') return send(400, { error:'invalid_json' });
   send(404,{error:'not_found'});
  }
 });
}
// Deployment runtimes import the server; only direct CLI execution binds a local port.
const server = createServer();
export default server;
if(process.argv[1] === fileURLToPath(import.meta.url)) server.listen(Number(process.env.PORT || 4173),'127.0.0.1',()=>console.log(`Gerbi is ready at http://localhost:${process.env.PORT || 4173}`));
