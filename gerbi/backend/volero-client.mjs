const tokenEndpoint = 'https://reseller.volero.net/reseller/oauth2/token';
const apiBase = 'https://reseller.volero.net/reseller/api';

let cachedToken = null;

export async function getVoleroToken(scope) {
  if (!process.env.VOLERO_CLIENT_ID || !process.env.VOLERO_CLIENT_SECRET) throw new Error('volero_credentials_missing');
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt - 60 > now && cachedToken.scope === scope) return cachedToken.value;
  const credentials = Buffer.from(`${process.env.VOLERO_CLIENT_ID}:${process.env.VOLERO_CLIENT_SECRET}`).toString('base64');
  const response = await fetch(tokenEndpoint, { method:'POST', headers:{ Authorization:`Basic ${credentials}`, 'Content-Type':'application/x-www-form-urlencoded', Accept:'application/json' }, body:new URLSearchParams({ grant_type:'client_credentials', scope }) });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || typeof payload.access_token !== 'string') { const error = new Error('volero_token_failed'); error.status=response.status; error.details=payload; throw error; }
  cachedToken = { value:payload.access_token, scope, expiresAt:now + Number(payload.expires_in || 3600) };
  return cachedToken.value;
}

export async function voleroFlightSearch(input) {
  const token = await getVoleroToken('read:flights-search');
  const response = await fetch(`${apiBase}/flights/v1/search`, { method:'POST', headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json', Accept:'application/json' }, body:JSON.stringify(input) });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) { const error = new Error('volero_flight_search_failed'); error.status=response.status; error.details=payload; throw error; }
  return payload;
}

export async function voleroFlightAvailability({ srk, offerIndex, searchToken, input }) {
  const token = await getVoleroToken('read:flights-search');
  const url = `${apiBase}/flights/v1/search/results/${encodeURIComponent(srk)}/offers/${encodeURIComponent(offerIndex)}/availability?token=${encodeURIComponent(searchToken)}`;
  const response = await fetch(url, { method:'POST', headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json', Accept:'application/json' }, body:JSON.stringify(input) });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) { const error = new Error('volero_flight_availability_failed'); error.status=response.status; error.details=payload; throw error; }
  return payload;
}

export async function voleroFlightBook({ srk, offerIndex, searchToken, input }) {
  const token = await getVoleroToken('write:flights-book');
  const url = `${apiBase}/flights/v1/search/results/${encodeURIComponent(srk)}/offers/${encodeURIComponent(offerIndex)}/book?token=${encodeURIComponent(searchToken)}`;
  const response = await fetch(url, { method:'POST', headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json', Accept:'application/json' }, body:JSON.stringify(input) });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) { const error = new Error('volero_flight_booking_failed'); error.status=response.status; error.details=payload; throw error; }
  return payload;
}
