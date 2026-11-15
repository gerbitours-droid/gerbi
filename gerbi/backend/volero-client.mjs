const tokenEndpoint = 'https://reseller.volero.net/reseller/oauth2/token';
const apiBase = 'https://reseller.volero.net/reseller/api';

// One token per OAuth scope (flights and hotels use different scopes; one slot would refetch on every switch).
const tokens = new Map();
// The browser gives up after 45 s; the server must stop first so a retry never overlaps a request still in flight.
export const TIMEOUTS = { token: 10_000, search: 40_000, availability: 30_000, book: 60_000, hotelStep: 12_000 };
async function call(url, options, ms) {
  try { return await fetch(url, { ...options, signal: AbortSignal.timeout(ms) }); }
  catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') { const timeout = new Error('volero_timeout'); timeout.status = 504; throw timeout; }
    throw error;
  }
}

export async function getVoleroToken(scope) {
  if (!process.env.VOLERO_CLIENT_ID || !process.env.VOLERO_CLIENT_SECRET) throw new Error('volero_credentials_missing');
  const now = Math.floor(Date.now() / 1000);
  const cachedToken = tokens.get(scope);
  if (cachedToken && cachedToken.expiresAt - 60 > now) return cachedToken.value;
  const credentials = Buffer.from(`${process.env.VOLERO_CLIENT_ID}:${process.env.VOLERO_CLIENT_SECRET}`).toString('base64');
  const response = await call(tokenEndpoint, { method:'POST', headers:{ Authorization:`Basic ${credentials}`, 'Content-Type':'application/x-www-form-urlencoded', Accept:'application/json' }, body:new URLSearchParams({ grant_type:'client_credentials', scope }) }, TIMEOUTS.token);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || typeof payload.access_token !== 'string') { const error = new Error('volero_token_failed'); error.status=response.status; error.details=payload; throw error; }
  tokens.set(scope, { value:payload.access_token, expiresAt:now + Number(payload.expires_in || 3600) });
  return payload.access_token;
}

// ---- Hotels (spec 24 §1.1): asynchronous destination search → progress → one page of results (cheapest first).
async function hotelCall(path, { method = 'GET', body, ms = TIMEOUTS.hotelStep } = {}) {
  const token = await getVoleroToken('read:hotels-search');
  const response = await call(`${apiBase}/hotels/v1${path}`, { method, headers:{ Authorization:`Bearer ${token}`, Accept:'application/json', ...(body ? { 'Content-Type':'application/json' } : {}) }, ...(body ? { body:JSON.stringify(body) } : {}) }, ms);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) { const error = new Error('volero_hotel_search_failed'); error.status=response.status; error.details=payload; throw error; }
  return payload;
}
// input: the validated search body; query: results filters (fallbackQuery when the filtered page is empty). Waits for
// the search to finish (or maxMs): at most 1 start + ~7 progress + 2 results calls. → { hotels, totalItems, complete, filtered }
export async function voleroHotelSearch(input, { query = [], fallbackQuery = null, maxMs = 22_000, pollMs = 3_000, sleep = ms => new Promise(r => setTimeout(r, ms)) } = {}) {
  const started = Date.now(), created = await hotelCall('/search/start', { method:'POST', body:input });
  if (!created?.srk || !created.tokens?.results) throw Object.assign(new Error('volero_hotel_search_failed'), { status: 502 });
  let complete = created.status === 'COMPLETED';
  while (!complete && Date.now() - started < maxMs) {
    await sleep(pollMs);
    const progress = await hotelCall(`/search/progress?token=${encodeURIComponent(created.tokens.progress)}`).catch(() => null);
    complete = Boolean(progress?.status) && progress.status !== 'IN_PROGRESS';
  }
  const results = (q) => hotelCall(`/search/results/${encodeURIComponent(created.srk)}?${new URLSearchParams([['token', created.tokens.results], ...q])}`);
  let page = await results(query), filtered = true;
  if (!page?.hotels?.length && fallbackQuery) { page = await results(fallbackQuery); filtered = false; }
  return { hotels: Array.isArray(page?.hotels) ? page.hotels : [], totalItems: page?.pages?.totalItems ?? (page?.hotels?.length || 0), complete, filtered };
}
// Hotel thumbnails live on the supplier's host; the site serves them from its own path (no supplier name in the page).
export async function voleroHotelImage(src) {
  const response = await call(`https://reseller.volero.net/reseller/search/hotels/thumb?src=${encodeURIComponent(src)}`, { headers:{ Accept:'image/*' } }, 8000);
  const type = (response.headers.get('content-type') || '').split(';')[0];
  if (!response.ok || !/^image\/(jpeg|png|webp|gif)$/.test(type)) throw Object.assign(new Error('hotel_image_failed'), { status: 404 });
  return { type, body: Buffer.from(await response.arrayBuffer()) };
}

export async function voleroFlightSearch(input) {
  const token = await getVoleroToken('read:flights-search');
  const response = await call(`${apiBase}/flights/v1/search`, { method:'POST', headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json', Accept:'application/json' }, body:JSON.stringify(input) }, TIMEOUTS.search);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) { const error = new Error('volero_flight_search_failed'); error.status=response.status; error.details=payload; throw error; }
  return payload;
}

export async function voleroFlightAvailability({ srk, offerIndex, searchToken, input }) {
  const token = await getVoleroToken('read:flights-search');
  const url = `${apiBase}/flights/v1/search/results/${encodeURIComponent(srk)}/offers/${encodeURIComponent(offerIndex)}/availability?token=${encodeURIComponent(searchToken)}`;
  const response = await call(url, { method:'POST', headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json', Accept:'application/json' }, body:JSON.stringify(input) }, TIMEOUTS.availability);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) { const error = new Error('volero_flight_availability_failed'); error.status=response.status; error.details=payload; throw error; }
  return payload;
}

export async function voleroFlightBook({ srk, offerIndex, searchToken, input }) {
  const token = await getVoleroToken('write:flights-book');
  const url = `${apiBase}/flights/v1/search/results/${encodeURIComponent(srk)}/offers/${encodeURIComponent(offerIndex)}/book?token=${encodeURIComponent(searchToken)}`;
  const response = await call(url, { method:'POST', headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json', Accept:'application/json' }, body:JSON.stringify(input) }, TIMEOUTS.book);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) { const error = new Error('volero_flight_booking_failed'); error.status=response.status; error.details=payload; throw error; }
  return payload;
}
