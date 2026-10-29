const tokenEndpoint = 'https://reseller.volero.net/reseller/oauth2/token';
const apiBase = 'https://reseller.volero.net/reseller/api';

let cachedToken = null;
// The browser gives up after 45 s; the server must stop first so a retry never overlaps a request still in flight.
export const TIMEOUTS = { token: 10_000, search: 40_000, availability: 30_000, book: 60_000 };
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
  if (cachedToken && cachedToken.expiresAt - 60 > now && cachedToken.scope === scope) return cachedToken.value;
  const credentials = Buffer.from(`${process.env.VOLERO_CLIENT_ID}:${process.env.VOLERO_CLIENT_SECRET}`).toString('base64');
  const response = await call(tokenEndpoint, { method:'POST', headers:{ Authorization:`Basic ${credentials}`, 'Content-Type':'application/x-www-form-urlencoded', Accept:'application/json' }, body:new URLSearchParams({ grant_type:'client_credentials', scope }) }, TIMEOUTS.token);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || typeof payload.access_token !== 'string') { const error = new Error('volero_token_failed'); error.status=response.status; error.details=payload; throw error; }
  cachedToken = { value:payload.access_token, scope, expiresAt:now + Number(payload.expires_in || 3600) };
  return cachedToken.value;
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
