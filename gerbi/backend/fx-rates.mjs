// Shekel rates for showing supplier prices in ILS (docs/specs/13-pricing-ils-he.md).
// The rate a customer pays is the bank's "transfers and cheques – sale" rate. Providers, in order:
//   leumi: Bank Leumi's public JSON, hamchaot.mechira = transfers & cheques, sale (the real thing);
//   boi:   Bank of Israel representative rate × (1 + FX_SALE_MARKUP_PCT/100), an estimate.
// An owner override (kv key "override") wins per currency. Cached in memory + kv, refreshed in the background.
import { allow, clientOf } from './volero-guard.mjs';
import { tokenMatches } from './leads.mjs';

export const SUPPORTED = ['USD', 'EUR', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD', 'AED', 'SEK', 'NOK', 'DKK', 'ZAR', 'TRY', 'EGP', 'JOD', 'PLN', 'HUF', 'CZK', 'THB', 'INR'];
export const DEFAULT_MARKUP_PCT = 1.2;
const STALE_AFTER_MS = 7 * 86400_000, MAX_AGE_MS = 14 * 86400_000, LOCK_SECONDS = 60, TIMEOUT_MS = 4000;
// Leumi currencyID → ISO code (from the live feed, 13.11.2026). JPY is quoted per 100.
const LEUMI_IDS = { 1: 'USD', 49: 'EUR', 19: 'GBP', 12: 'JPY', 3: 'CHF', 18: 'AUD', 15: 'CAD', 13: 'ZAR', 87: 'AED', 5: 'SEK', 7: 'NOK', 10: 'DKK' };
const LEUMI_URL = 'https://www.bankleumi.co.il/Rates/Api3.5/ForeignExchange/LatestSelectedRates.aspx';
const BOI_URL = 'https://boi.org.il/PublicApi/GetExchangeRates';
const HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; GerbiTours-rates/1.0)', Accept: 'application/json' };

const positive = value => { const n = Number(value); return Number.isFinite(n) && n > 0 ? n : null; };
const round6 = n => Math.round(n * 1e6) / 1e6;
const isoDay = value => /^\d{4}-\d{2}-\d{2}/.test(String(value || '')) ? String(value).slice(0, 10) : null;
// A usable table has at least the two currencies the supplier actually prices in.
const usable = rates => Boolean(rates?.USD && rates?.EUR);

export function parseLeumi(json) {
  const rates = {};
  for (const row of Array.isArray(json?.data) ? json.data : []) {
    const code = LEUMI_IDS[row?.currencyID], sale = positive(row?.hamchaot?.mechira);
    if (code && sale) rates[code] = round6(code === 'JPY' ? sale / 100 : sale);
  }
  const dmy = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(json?.yatzigDate || '');
  const asOf = isoDay(json?.topHeaderText?.date) || (dmy ? `${dmy[3]}-${dmy[2]}-${dmy[1]}` : null);
  return usable(rates) ? { rates, asOf, source: 'leumi', method: 'bank-transfer-sale', markupPct: null } : null;
}

export function parseBoi(json, markupPct = DEFAULT_MARKUP_PCT) {
  const rates = {}, factor = 1 + markupPct / 100;
  let asOf = null;
  for (const row of Array.isArray(json?.exchangeRates) ? json.exchangeRates : []) {
    const code = String(row?.key || ''), rate = positive(row?.currentExchangeRate), unit = positive(row?.unit) || 1;
    if (!SUPPORTED.includes(code) || !rate) continue;
    rates[code] = round6((rate / unit) * factor);
    asOf = isoDay(row.lastUpdate) || asOf;
  }
  return usable(rates) ? { rates, asOf, source: 'boi', method: 'representative-plus-markup', markupPct } : null;
}

export function markupFrom(env = process.env) {
  const value = Number(env.FX_SALE_MARKUP_PCT);
  return env.FX_SALE_MARKUP_PCT !== undefined && env.FX_SALE_MARKUP_PCT !== '' && Number.isFinite(value) && value >= 0 && value <= 5 ? value : DEFAULT_MARKUP_PCT;
}
export function refreshMsFrom(env = process.env) {
  const hours = Number(env.FX_REFRESH_HOURS);
  return (Number.isFinite(hours) && hours >= 0.25 && hours <= 24 ? hours : 4) * 3600_000;
}

const getJson = async (fetcher, url) => {
  const response = await fetcher(url, { headers: HEADERS, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) throw new Error(`fx_http_${response.status}`);
  return response.json();
};
export function providers({ fetcher = fetch, env = process.env } = {}) {
  const markup = markupFrom(env);
  const all = {
    leumi: async () => parseLeumi(await getJson(fetcher, LEUMI_URL)),
    boi: async () => parseBoi(await getJson(fetcher, BOI_URL), markup)
  };
  const first = env.FX_PROVIDER === 'boi' ? 'boi' : 'leumi';
  return [first, ...Object.keys(all).filter(name => name !== first)].map(name => ({ name, load: all[name] }));
}

// ---- Owner override: {rates:{USD:3.25}, note, setAt, expiresAt}
export function validateOverride(input, now = Date.now()) {
  const fields = {};
  const rates = {};
  if (!input || typeof input.rates !== 'object' || Array.isArray(input.rates) || !input.rates) fields.rates = 'נדרש אובייקט שערים, למשל {"USD": 3.25}';
  else {
    for (const [code, value] of Object.entries(input.rates)) {
      const n = Number(value);
      if (!SUPPORTED.includes(code)) fields[code] = 'מטבע לא נתמך';
      else if (typeof value !== 'number' || !Number.isFinite(n) || n < 0.001 || n > 100) fields[code] = 'שער בין 0.001 ל־100 שקלים ליחידה';
      else rates[code] = round6(n);
    }
    if (!Object.keys(rates).length && !Object.keys(fields).length) fields.rates = 'לא נשלח אף שער';
  }
  let expiresAt = null;
  if (input?.expiresAt !== undefined && input.expiresAt !== null) {
    const t = Date.parse(input.expiresAt);
    if (!Number.isFinite(t) || t <= now || t > now + 90 * 86400_000) fields.expiresAt = 'תאריך תפוגה עתידי, עד 90 יום';
    else expiresAt = new Date(t).toISOString();
  }
  const note = typeof input?.note === 'string' ? input.note.trim().slice(0, 200) : '';
  if (Object.keys(fields).length) return { errors: fields };
  return { override: { rates, note, setAt: new Date(now).toISOString(), expiresAt } };
}
const activeOverride = (override, now) => override?.rates && Object.keys(override.rates).length && (!override.expiresAt || Date.parse(override.expiresAt) > now) ? override : null;

// The public shape of /api/fx from the cached live table + an optional override.
export function publicRates(live, override, now = Date.now()) {
  const manual = activeOverride(override, now);
  const fresh = live && now - live.at <= MAX_AGE_MS ? live : null;
  if (!fresh && !manual) return null;
  const rates = { ...(fresh?.rates || {}), ...(manual?.rates || {}) };
  const overridden = manual ? Object.keys(manual.rates) : [];
  const allManual = !fresh || overridden.length && Object.keys(rates).every(code => overridden.includes(code));
  return {
    ok: true, base: 'ILS', kind: 'transfer-sale', rates,
    asOf: manual ? manual.setAt.slice(0, 10) : fresh.asOf || new Date(fresh.at).toISOString().slice(0, 10),
    fetchedAt: fresh ? new Date(fresh.at).toISOString() : null,
    source: allManual ? 'override' : fresh.source, method: allManual ? 'manual' : fresh.method, markupPct: allManual ? null : fresh.markupPct,
    isOverride: Boolean(manual), overridden, note: manual?.note || '',
    stale: Boolean(fresh && now - fresh.at > STALE_AFTER_MS && !allManual)
  };
}

// A manual rate must reach visitors within about a minute (QA O4): instances re-read the override every 30 s, and
// browsers/CDN keep /api/fx for 60 s (+30 s stale-while-revalidate), so the worst case is about 2 minutes and typically under 1.
export const OVERRIDE_RECHECK_MS = 30_000;
export const FX_CACHE_CONTROL = 'public, max-age=60, s-maxage=60, stale-while-revalidate=30';
// store: kv-store ({get,set}). Returns {get(), refresh(), setOverride(), clearOverride()}.
export function createFx({ store, sources = providers(), now = Date.now, refreshMs = refreshMsFrom(), log = () => {} }) {
  let memo = null, inFlight = null, override, overrideCheckedAt = -Infinity;
  async function load() {
    if (!memo) { try { memo = await store.get('latest'); } catch { memo = null; } }
    // Re-read the owner's override every OVERRIDE_RECHECK_MS: on serverless another instance may have set or cleared it.
    if (now() - overrideCheckedAt >= OVERRIDE_RECHECK_MS) { try { override = await store.get('override'); overrideCheckedAt = now(); } catch { override = override ?? null; } }
    return memo;
  }
  function refresh() {
    if (inFlight) return inFlight;
    inFlight = (async () => {
      try { if (await store.get('lock')) return memo; await store.set('lock', { at: now() }, LOCK_SECONDS); } catch { /* store down: refresh anyway */ }
      for (const source of sources) {
        try {
          const table = await source.load();
          if (!table) throw new Error('fx_unusable');
          memo = { ...table, at: now() };
          log({ evt: 'fx_refresh', ok: true, source: source.name, asOf: table.asOf });
          try { await store.set('latest', memo, Math.ceil(MAX_AGE_MS / 1000)); } catch { /* memory copy still serves */ }
          return memo;
        } catch (error) { log({ evt: 'fx_refresh', ok: false, source: source.name, error: error.name === 'TimeoutError' ? 'timeout' : error.message }); }
      }
      return memo; // every source failed: keep the last good table
    })().finally(() => { inFlight = null; });
    return inFlight;
  }
  // Cold cache waits (bounded by the provider timeouts); otherwise never waits for a provider.
  async function get({ background = promise => promise.catch(() => {}) } = {}) {
    await load();
    if (!memo) await refresh();
    else if (now() - memo.at > refreshMs && !inFlight) background(refresh());
    return publicRates(memo, override, now());
  }
  async function setOverride(value) { await store.set('override', value); override = value; overrideCheckedAt = now(); return get(); }
  async function clearOverride() { await store.set('override', null); override = null; overrideCheckedAt = now(); return get(); }
  return { get, refresh, setOverride, clearOverride };
}

// Returns true when the request was an fx route (and has been answered).
export async function handleFx(req, url, { send, body, fx, env = process.env, background, res }) {
  if (url.pathname === '/api/fx') {
    if (req.method !== 'GET' && req.method !== 'HEAD') { send(405, { error: 'method_not_allowed' }); return true; }
    const result = await fx.get({ background });
    // 200 + ok:false (not 5xx): the page treats it as "show supplier currency", and browsers log no failed request.
    if (!result) { send(200, { ok: false, error: 'fx_unavailable', rates: null, message: 'שערי המטבע אינם זמינים כרגע.' }); return true; }
    // A small public payload: let browsers and the CDN keep it for a while (the server's own json() says no-store).
    if (res) { res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': FX_CACHE_CONTROL }); res.end(req.method === 'HEAD' ? undefined : JSON.stringify(result)); }
    else send(200, result);
    return true;
  }
  if (url.pathname !== '/api/fx/override') return false;
  if (!['PUT', 'DELETE'].includes(req.method)) { send(405, { error: 'method_not_allowed' }); return true; }
  if (!env.LEADS_ADMIN_TOKEN) { send(404, { error: 'not_found' }); return true; }
  if (!allow(clientOf(req), 'fxAdmin')) { send(429, { error: 'rate_limited' }); return true; }
  if (!tokenMatches(req.headers.authorization, env.LEADS_ADMIN_TOKEN)) { send(401, { error: 'unauthorized' }); return true; }
  try {
    const input = req.method === 'DELETE' ? { rates: null } : await body(req, 4000);
    if (input?.rates === null) { send(200, (await fx.clearOverride()) || { ok: false, rates: null }); return true; }
    const { override, errors } = validateOverride(input);
    if (errors) { send(400, { error: 'fx_override_invalid', fields: errors }); return true; }
    console.log(JSON.stringify({ evt: 'fx_override', currencies: Object.keys(override.rates), expiresAt: override.expiresAt }));
    send(200, await fx.setOverride(override));
  } catch (error) {
    if (['payload_too_large', 'invalid_json'].includes(error.message)) throw error;
    send(503, { error: 'fx_store_unavailable', message: 'לא הצלחנו לשמור את השער כרגע.' });
  }
  return true;
}
