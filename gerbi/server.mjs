import http from 'node:http';
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
const root = path.resolve(fileURLToPath(new URL('./dist/', import.meta.url)));
const dataDirectory = path.resolve(fileURLToPath(new URL('./data/', import.meta.url)));
const learning = new LearningStore(dataDirectory);
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.mjs':'text/javascript; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp', '.svg':'image/svg+xml', '.woff2':'font/woff2' };

function json(res, code, data) {
  res.writeHead(code, { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store' });
  res.end(JSON.stringify(data));
}

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
  return send(status, { error:error.message, provider:'volero', details:error.details || undefined });
}
export function createServer() {
 return http.createServer(async (req,res) => {
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  const send = (code,data) => json(res, code, data);
  try {
   const url = new URL(req.url,'http://localhost');
   if (url.pathname === '/api/status') return send(200,{ mode:'demo', provider:'Volero', connected:false, credentialsConfigured:!!(process.env.VOLERO_CLIENT_ID && process.env.VOLERO_CLIENT_SECRET), reason:'authentication_documentation_required', learning:'local_aggregates' });
   if (url.pathname === '/api/tags' && req.method === 'GET') return send(200, { facets: publicTagCatalog(), destinations: destinationTags });
   if (url.pathname === '/api/learning/summary' && req.method === 'GET') return send(200, await learning.summary());
   if (url.pathname === '/api/ai/understand') {
    if (req.method !== 'POST') return send(405,{error:'method_not_allowed'});
    const input = await body(req);
    const text = string(input.text);
    if (!text.trim()) return send(400, { error:'text_required', message:'צריך לתאר בקצרה את החופשה.' });
    const previous = input.previous && typeof input.previous === 'object' ? input.previous : {};
    const signals = extractSignals(text, previous);
    const understanding = understandRequest(text, previous);
    const weights = await learning.weightsFor(text);
    const recommendations = scoreDestinations(trips, signals, weights).map(({ destination, score, estimate, matchedTags }) => ({
      id: destination.id, score: Math.round(score * 100) / 100, estimate, matchedTags
    }));
    const summary = await learning.learnQuery({ text, tags: signals.tags, consent: input.learningConsent === true });
    return send(200, { mode:'rules_and_local_learning', signals, missing:missingFields(signals), understood:understanding.understood, assumed:understanding.assumed, questions:understanding.questions, flightSearch:understanding.flightSearch, recommendations, learning: { recorded: input.learningConsent === true, totals:summary.totals } });
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
   if (url.pathname === '/api/volero/flights/search') {
    if (req.method !== 'POST') return send(405,{error:'method_not_allowed'});
    const input = await body(req);
    if (!input || typeof input !== 'object' || Array.isArray(input)) return send(400,{error:'search_input_required'});
    try { return send(200, { provider:'volero', data:await voleroFlightSearch(input) }); }
    catch (error) { return supplierError(send, error); }
   }
   if (url.pathname === '/api/volero/flights/availability') {
    if (req.method !== 'POST') return send(405,{error:'method_not_allowed'});
    const input = await body(req);
    if (!input?.srk || !input?.searchToken || typeof input.offerIndex !== 'string' || !input.offerIndex) return send(400,{error:'search_reference_required'});
    try { return send(200, { provider:'volero', data:await voleroFlightAvailability(input) }); }
    catch (error) { return supplierError(send, error); }
   }
   if (url.pathname === '/api/volero/flights/book') {
    if (req.method !== 'POST') return send(405,{error:'method_not_allowed'});
    const input = await body(req);
    // A live booking charges the agency's supplier account; the browser has no booking flow yet, so the public
    // deployment refuses it unless an operator turns it on deliberately.
    if (process.env.VOLERO_BOOKING_ENABLED !== 'true') return send(403,{error:'booking_disabled',message:'הזמנה אינה זמינה באתר בשלב זה.'});
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
