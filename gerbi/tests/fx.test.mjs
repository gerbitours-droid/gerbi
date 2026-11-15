// Spec 13: shekel prices at the transfers-and-cheques sale rate, rate providers/cache/override, converter.
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { parseLeumi, parseBoi, markupFrom, refreshMsFrom, providers, createFx, publicRates, validateOverride, handleFx, DEFAULT_MARKUP_PCT } from '../backend/fx-rates.mjs';
import { createStore } from '../backend/kv-store.mjs';
import { setFx, resetFx, toIls, formatIls, priceBasis, fxNote, originalHtml, fareText, getFx, loadFx } from '../dist/fx.mjs';
import { formatFare, sortFacts } from '../dist/flight-view.mjs';
import { parseAmount, convertAmount, formatAgorot } from '../dist/converter.mjs';

// Shape of the live Leumi feed, 13.11.2026 (trimmed).
const LEUMI = { tableType: 'yatzig', topHeaderText: { date: '2026-11-13', time: '00:00:00' }, yatzigDate: '13/11/2026', data: [
  { currencyName: 'דולר ארה&quot;ב', currencyID: 1, yatzig: '3.1990', hamchaot: { knia: '3.1683', mechira: '3.2356' }, mezuman: { knia: '3.1188', mechira: '3.2753' } },
  { currencyName: 'אירו', currencyID: 49, yatzig: '3.5394', hamchaot: { knia: '3.5029', mechira: '3.5773' } },
  { currencyName: 'לירה שטרלינג', currencyID: 19, yatzig: '4.2365', hamchaot: { knia: '4.1923', mechira: '4.2813' } },
  { currencyName: 'ין יפני 100', currencyID: 12, yatzig: '2.0009', hamchaot: { knia: '1.9812', mechira: '2.0233' } },
  { currencyName: 'סל המטבעות', currencyID: 43, yatzig: '3.3867', hamchaot: { mechira: '3.4223' } },
  { currencyName: 'שבור', currencyID: 3, hamchaot: { mechira: 'n/a' } }] };
const BOI = { exchangeRates: [
  { key: 'USD', currentExchangeRate: 3.199, unit: 1, lastUpdate: '2026-11-13T10:19:11Z' },
  { key: 'EUR', currentExchangeRate: 3.5394, unit: 1, lastUpdate: '2026-11-13T10:19:11Z' },
  { key: 'JPY', currentExchangeRate: 2.0009, unit: 100, lastUpdate: '2026-11-13T10:19:11Z' },
  { key: 'XXX', currentExchangeRate: 9, unit: 1 }] };

afterEach(() => resetFx());

test('Leumi feed: transfers-and-cheques SALE rate per currency, JPY normalised from 100, date from the header', () => {
  const table = parseLeumi(LEUMI);
  assert.equal(table.source, 'leumi');
  assert.equal(table.method, 'bank-transfer-sale');
  assert.equal(table.asOf, '2026-11-13');
  assert.deepEqual(table.rates, { USD: 3.2356, EUR: 3.5773, GBP: 4.2813, JPY: 0.020233 });
  assert.equal(parseLeumi({ data: [LEUMI.data[0]] }), null, 'no EUR → unusable');
  assert.equal(parseLeumi('<html>'), null);
  assert.equal(parseLeumi({ ...LEUMI, topHeaderText: null }).asOf, '2026-11-13', 'falls back to yatzigDate');
});

test('Bank of Israel fallback: representative rate plus the configured sale markup', () => {
  const table = parseBoi(BOI, 1.2);
  assert.equal(table.method, 'representative-plus-markup');
  assert.equal(table.markupPct, 1.2);
  assert.equal(table.rates.USD, Math.round(3.199 * 1.012 * 1e6) / 1e6);
  assert.equal(table.rates.JPY, Math.round(0.020009 * 1.012 * 1e6) / 1e6);
  assert.equal(table.rates.XXX, undefined);
  assert.equal(table.asOf, '2026-11-13');
  assert.equal(markupFrom({}), DEFAULT_MARKUP_PCT);
  assert.equal(markupFrom({ FX_SALE_MARKUP_PCT: '2' }), 2);
  assert.equal(markupFrom({ FX_SALE_MARKUP_PCT: '0' }), 0);
  assert.equal(markupFrom({ FX_SALE_MARKUP_PCT: '50' }), DEFAULT_MARKUP_PCT);
  assert.equal(markupFrom({ FX_SALE_MARKUP_PCT: 'abc' }), DEFAULT_MARKUP_PCT);
  assert.equal(refreshMsFrom({}), 4 * 3600_000);
  assert.equal(refreshMsFrom({ FX_REFRESH_HOURS: '1' }), 3600_000);
  assert.equal(refreshMsFrom({ FX_REFRESH_HOURS: '0' }), 4 * 3600_000);
});

test('provider order follows FX_PROVIDER and falls back to the other source', async () => {
  const seen = [];
  const fetcher = async url => { seen.push(url.includes('leumi') ? 'leumi' : 'boi'); return { ok: true, json: async () => (url.includes('leumi') ? LEUMI : BOI) }; };
  assert.deepEqual(providers({ fetcher, env: {} }).map(p => p.name), ['leumi', 'boi']);
  const list = providers({ fetcher, env: { FX_PROVIDER: 'boi', FX_SALE_MARKUP_PCT: '1.5' } });
  assert.deepEqual(list.map(p => p.name), ['boi', 'leumi']);
  assert.equal((await list[0].load()).markupPct, 1.5);
  assert.deepEqual(seen, ['boi']);
});

const memoryStore = () => { const data = new Map(); return { data, get: async key => data.get(key) ?? null, set: async (key, value) => { data.set(key, value); } }; };

test('cache: cold start waits, fresh is served without a call, old triggers one background refresh, failures keep the last table', async () => {
  let clock = Date.parse('2026-11-15T08:00:00Z'), calls = 0, fail = false;
  const store = memoryStore();
  const fx = createFx({ store, now: () => clock, refreshMs: 4 * 3600_000, sources: [
    { name: 'leumi', load: async () => { calls++; if (fail) throw new Error('down'); return parseLeumi(LEUMI); } },
    { name: 'boi', load: async () => { if (fail) throw new Error('down'); return parseBoi(BOI); } }] });
  const first = await fx.get();
  assert.equal(first.source, 'leumi');
  assert.equal(first.rates.USD, 3.2356);
  assert.equal(first.stale, false);
  assert.equal(calls, 1);
  clock += 3600_000; await fx.get(); assert.equal(calls, 1, 'fresh: no provider call');
  clock += 4 * 3600_000; store.data.delete('lock');
  const pending = [];
  await fx.get({ background: p => pending.push(p) });
  await fx.get({ background: p => pending.push(p) });
  assert.equal(pending.length, 1, 'one refresh at a time');
  await Promise.all(pending);
  assert.equal(calls, 2);
  // Every provider down: the last table keeps serving, marked stale after 7 days, dropped after 14.
  fail = true; store.data.delete('lock');
  clock += 8 * 86400_000;
  const stale = await fx.get({ background: p => p.catch(() => {}) });
  assert.equal(stale.rates.USD, 3.2356);
  assert.equal(stale.stale, true);
  clock += 7 * 86400_000;
  assert.equal(await fx.get({ background: p => p.catch(() => {}) }), null);
});

test('cache: leumi failing falls back to the Bank of Israel estimate; nothing at all → null', async () => {
  const fx = createFx({ store: memoryStore(), sources: [{ name: 'leumi', load: async () => { throw new Error('x'); } }, { name: 'boi', load: async () => parseBoi(BOI, 1.2) }] });
  const result = await fx.get();
  assert.equal(result.source, 'boi');
  assert.equal(result.markupPct, 1.2);
  const none = createFx({ store: memoryStore(), sources: [{ name: 'leumi', load: async () => null }] });
  assert.equal(await none.get(), null);
});

test('owner override: validation, per-currency precedence, expiry, clearing', async () => {
  const now = Date.parse('2026-11-15T08:00:00Z');
  assert.ok(validateOverride({ rates: { USD: 3.3 } }, now).override);
  assert.deepEqual(Object.keys(validateOverride({ rates: { USD: -1, XYZ: 3, EUR: '3.5' } }, now).errors).sort(), ['EUR', 'USD', 'XYZ']);
  assert.ok(validateOverride({ rates: {} }, now).errors.rates);
  assert.ok(validateOverride({}, now).errors.rates);
  assert.ok(validateOverride({ rates: { USD: 3.3 }, expiresAt: '2020-01-01' }, now).errors.expiresAt);
  assert.equal(validateOverride({ rates: { USD: 3.3 }, note: 'x'.repeat(500) }, now).override.note.length, 200);

  const live = { ...parseLeumi(LEUMI), at: now };
  const { override } = validateOverride({ rates: { USD: 3.3 }, note: 'שער הבנק שלנו' }, now);
  const merged = publicRates(live, override, now);
  assert.equal(merged.rates.USD, 3.3);
  assert.equal(merged.rates.EUR, 3.5773);
  assert.equal(merged.isOverride, true);
  assert.deepEqual(merged.overridden, ['USD']);
  assert.equal(merged.source, 'leumi');
  assert.equal(merged.asOf, '2026-11-15');
  const only = publicRates(null, override, now);
  assert.equal(only.source, 'override');
  assert.equal(only.method, 'manual');
  const expired = { ...override, expiresAt: new Date(now - 1000).toISOString() };
  assert.equal(publicRates(live, expired, now).isOverride, false);

  const store = memoryStore();
  const fx = createFx({ store, sources: [{ name: 'leumi', load: async () => parseLeumi(LEUMI) }] });
  assert.equal((await fx.setOverride(override)).rates.USD, 3.3);
  assert.equal(store.data.get('override').rates.USD, 3.3);
  // A second instance (another serverless function) sees the override through the store.
  const other = createFx({ store, sources: [{ name: 'leumi', load: async () => parseLeumi(LEUMI) }] });
  assert.equal((await other.get()).rates.USD, 3.3);
  assert.equal((await fx.clearOverride()).rates.USD, 3.2356);
});

async function withFxServer(env, sources, run) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'gerbi-fx-api-'));
  const fx = createFx({ store: createStore('fx', directory), sources });
  const body = async req => { let raw = ''; for await (const chunk of req) raw += chunk; return raw ? JSON.parse(raw) : {}; };
  const server = http.createServer(async (req, res) => {
    const send = (code, data) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
    if (!(await handleFx(req, new URL(req.url, 'http://x'), { send, body, fx, env, res }))) send(404, {});
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/fx`;
  try { await run(base); } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); await rm(directory, { recursive: true, force: true }); }
}
const leumiOnly = [{ name: 'leumi', load: async () => parseLeumi(LEUMI) }];

test('GET /api/fx: rates with source and date, cacheable; ok:false (not cached) when there is no rate at all', async () => {
  await withFxServer({}, leumiOnly, async base => {
    const response = await fetch(base);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('cache-control'), /max-age=60\b/);
    const data = await response.json();
    assert.equal(data.ok, true);
    assert.equal(data.base, 'ILS');
    assert.equal(data.rates.USD, 3.2356);
    assert.equal(data.asOf, '2026-11-13');
    assert.equal(data.isOverride, false);
    assert.equal((await fetch(base, { method: 'POST' })).status, 405);
  });
  await withFxServer({}, [{ name: 'leumi', load: async () => { throw new Error('down'); } }], async base => {
    const response = await fetch(base);
    assert.equal(response.status, 200);
    assert.doesNotMatch(String(response.headers.get('cache-control')), /max-age/, 'a missing rate is never cached publicly');
    const data = await response.json();
    assert.equal(data.ok, false);
    assert.equal(data.rates, null);
  });
});

test('PUT /api/fx/override: 404 without a token configured, 401 on a wrong token, 400 on bad input, 200 sets and DELETE clears', async () => {
  const put = (base, payload, token) => fetch(base + '/override', { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(payload) });
  await withFxServer({}, leumiOnly, async base => { assert.equal((await put(base, { rates: { USD: 3.3 } }, 'x')).status, 404); });
  await withFxServer({ LEADS_ADMIN_TOKEN: 'secret-token' }, leumiOnly, async base => {
    assert.equal((await put(base, { rates: { USD: 3.3 } })).status, 401);
    assert.equal((await put(base, { rates: { USD: 3.3 } }, 'wrong')).status, 401);
    const bad = await put(base, { rates: { USD: 0 } }, 'secret-token');
    assert.equal(bad.status, 400);
    assert.ok((await bad.json()).fields.USD);
    const ok = await put(base, { rates: { USD: 3.31, EUR: 3.6 } }, 'secret-token');
    assert.equal(ok.status, 200);
    assert.equal((await ok.json()).isOverride, true);
    const after = await (await fetch(base)).json();
    assert.equal(after.rates.USD, 3.31);
    assert.deepEqual(after.overridden.sort(), ['EUR', 'USD']);
    const cleared = await fetch(base + '/override', { method: 'DELETE', headers: { Authorization: 'Bearer secret-token' } });
    assert.equal(cleared.status, 200);
    assert.equal((await (await fetch(base)).json()).rates.USD, 3.2356);
    assert.equal((await fetch(base + '/override', { method: 'GET', headers: { Authorization: 'Bearer secret-token' } })).status, 405);
  });
});

const FX = { ok: true, rates: { USD: 3.2356, EUR: 3.5773 }, asOf: '2026-11-13', method: 'bank-transfer-sale', stale: false };

test('client: shekels first, rounded to whole shekels, Hebrew grouping, supplier currency without rates', () => {
  const usd = { value: 1234.56, currency: 'USD' };
  assert.equal(toIls(usd), null);
  assert.equal(formatFare(usd), new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(1234.56));
  assert.equal(originalHtml(usd), '');
  setFx(FX);
  assert.equal(formatFare(usd), '₪3,995');
  assert.equal(formatIls(999.5), '₪1,000');
  assert.equal(formatIls(-12), '-₪12');
  assert.equal(formatFare({ value: 2000, currency: 'ILS' }), '₪2,000');
  assert.equal(formatFare({ value: 10, currency: 'GBP' }).includes('₪'), false, 'no rate → original');
  assert.deepEqual(priceBasis(usd), { value: 3995, currency: 'ILS' });
  assert.match(originalHtml(usd), /במקור/);
  assert.match(originalHtml(usd), /1,234\.56/);
  assert.equal(originalHtml({ value: 5, currency: 'ILS' }), '');
  assert.equal(fxNote(), 'לפי שער העברות והמחאות – מכירה, נכון ל־13.11.2026');
  assert.match(fareText(usd), /^₪3,995 \(במקור .*1,234\.56.*לפי שער העברות והמחאות – מכירה/);
  setFx({ ...FX, method: 'representative-plus-markup', markupPct: 1.2, stale: true });
  assert.equal(fxNote(), 'לפי הערכת שער העברות והמחאות – מכירה (יציג + 1.2%), נכון ל־13.11.2026 · ייתכן שהשער התעדכן');
  setFx({ ok: false, rates: null });
  assert.equal(getFx(), null);
  setFx({ rates: { USD: -1, eur: 3 } });
  assert.equal(getFx(), null, 'invalid rates are ignored');
});

test('client: price sort uses converted shekels, so mixed supplier currencies sort and ties stay consistent', () => {
  const offer = (index, value, currency, totalMinutes = 300) => ({ index, price: { value, currency }, totalMinutes });
  const list = [offer('a', 500, 'EUR'), offer('b', 520, 'USD'), offer('c', 1700, 'ILS', 200), offer('d', 1700, 'ILS', 100)];
  assert.deepEqual(sortFacts(list, 'price').map(x => x.index), ['a', 'b', 'c', 'd'], 'mixed without rates: unsorted');
  setFx(FX);
  // EUR 500 = ₪1,789; USD 520 = ₪1,683; ILS 1,700 ×2 (shorter first).
  assert.deepEqual(sortFacts(list, 'price').map(x => x.index), ['b', 'd', 'c', 'a']);
  assert.deepEqual(sortFacts([offer('x', 100, 'GBP'), offer('y', 50, 'USD')], 'price').map(x => x.index), ['x', 'y'], 'a currency without a rate keeps supplier order');
});

test('client: loadFx never rejects and falls back to no rates', async () => {
  assert.equal(await loadFx(async () => { throw new Error('offline'); }), null);
  resetFx();
  assert.equal(await loadFx(async () => ({ ok: false, json: async () => ({}) })), null);
  resetFx();
  assert.equal((await loadFx(async () => ({ ok: true, json: async () => FX }))).rates.USD, 3.2356);
  assert.equal(getFx().asOf, '2026-11-13');
});

test('converter: amount parsing, conversion at the same rate, agorot formatting', () => {
  assert.deepEqual(parseAmount('1,250.50'), { value: 1250.5 });
  assert.deepEqual(parseAmount('99,5'), { value: 99.5 });
  assert.deepEqual(parseAmount(' $250 '), { value: 250 });
  assert.equal(parseAmount('').empty, true);
  assert.ok(parseAmount('-5').error);
  assert.ok(parseAmount('abc').error);
  assert.ok(parseAmount('99999999999').error);
  assert.equal(convertAmount(100, 'USD', FX.rates), 323.56);
  assert.equal(convertAmount(100, 'GBP', FX.rates), null);
  assert.equal(formatAgorot(323.56), '₪323.56');
});
