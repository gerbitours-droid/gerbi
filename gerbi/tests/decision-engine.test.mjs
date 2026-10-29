import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { scoreOffers, rankScored, costsFor, needsTieBreak, badges, diverseTop, explain, itineraryKey, learnFromChoice, features } from '../dist/scoring.mjs';
import { readFile } from 'node:fs/promises';
import { recordEvent, lift, blendedBoost, signature, canonical, QueryMemory } from '../backend/query-memory.mjs';
import { partnerUnderstand, partnerTieBreak, scrub } from '../backend/llm-partner.mjs';
import { understandRequest } from '../dist/brief-engine.mjs';
import { createStore } from '../backend/kv-store.mjs';

const leg = (code, number, depart, minutes, stops = 0) => ({ minutes, segments: Array.from({ length: stops + 1 }, (_, i) => ({ marketingCarrier: { airline: { code }, flightNumber: number + i }, departure: { time: depart } })),
  summary: { stops, dayOffset: 0, layovers: stops ? [{ minutes: 90, overnight: false, changeAirport: false }] : [] } });
const offer = (id, price, minutes, { stops = 0, carrier = 'W4', depart = '10:00', checked = 'unknown' } = {}) => ({ index: id, price: { value: price, currency: 'USD' }, totalMinutes: minutes,
  stops, carriers: [carrier], longestLayover: stops ? 90 : 0, overnight: false, checked, airports: ['FCO'], legs: [leg(carrier, Number(id) * 10, depart, minutes, stops)] });

test('the price of time and inconvenience follows the brief', () => {
  assert.ok(costsFor({ cheaper: true }).hour < costsFor({}).hour);
  assert.ok(costsFor({ children: 1 }).stop > costsFor({}).stop);
  assert.ok(costsFor({}, { hour: 5 }).hour <= costsFor({}).hour * Math.exp(0.7) + 1e-9, 'learned multipliers are bounded');
});

test('a 30% cheaper offer with a similar time stays above the one the LLM and memory prefer', () => {
  const cheap = offer('1', 300, 230), pricey = offer('2', 430, 225);
  const key = itineraryKey(pricey);
  assert.equal(rankScored(scoreOffers([cheap, pricey], {}, { boosts: { [key]: 1 }, partnerPick: key }))[0].facts.index, '1');
});

test('trade-off cases with a clear right answer (tests/fixtures/ranking-cases.json)', async () => {
  const cases = JSON.parse(await readFile(new URL('./fixtures/ranking-cases.json', import.meta.url), 'utf8'));
  const make = (id, o) => ({ ...offer(id, o.price, o.minutes, { stops: o.stops }), longestLayover: o.wait || 0, overnight: Boolean(o.overnight),
    legs: [{ ...leg('X' + id, 1, '10:00', o.minutes, o.stops), summary: { stops: o.stops, dayOffset: 0, layovers: o.stops ? Array.from({ length: o.stops }, () => ({ minutes: o.wait || 0, overnight: Boolean(o.overnight), changeAirport: false })) : [] } }] });
  for (const c of cases) { const [better, worse] = scoreOffers([make('1', c.better), make('2', c.worse)], c.brief); assert.ok(better.cost < worse.cost, c.name); }
});

test('an unrelated offer never flips the order of two others (independence of irrelevant alternatives)', () => {
  let seed = 7; const rnd = (a, b) => { seed = (seed * 16807) % 2147483647; return a + (seed / 2147483647) * (b - a); };
  for (let t = 0; t < 500; t++) {
    const a = offer('1', rnd(250, 700), rnd(200, 900), { stops: Math.floor(rnd(0, 3)) }), b = offer('2', rnd(250, 700), rnd(200, 900), { stops: Math.floor(rnd(0, 3)) });
    const decoy = offer('3', rnd(80, 240), rnd(150, 1400), { stops: Math.floor(rnd(0, 3)), carrier: 'ZZ' });
    const pair = rankScored(scoreOffers([a, b])).map(x => x.facts.index).join();
    assert.equal(rankScored(scoreOffers([a, b, decoy])).map(x => x.facts.index).filter(i => i !== '3').join(), pair);
  }
});

test('learning from choices moves prices the right way, in bounded steps', () => {
  const slowCheap = features(offer('1', 300, 600, { stops: 1 })), fastDirect = features(offer('2', 340, 240));
  // Travelers keep choosing the fast direct offer although the slow cheap one ranked above it: time was under-priced.
  let learned = {};
  for (let i = 0; i < 100; i++) learned = learnFromChoice(learned, fastDirect, [slowCheap]);
  assert.ok(learned.hour > 0 && learned.stop > 0);
  assert.ok(Object.values(learned).every(v => Math.abs(v) <= 0.7));
  assert.deepEqual(learnFromChoice({ hour: 0.1 }, fastDirect, []), { hour: 0.1 }, 'no ranking information, no change');
});

test('memory and the LLM reorder only near-ties', () => {
  const a = offer('1', 300, 230), b = offer('2', 301, 230);
  const plain = rankScored(scoreOffers([a, b]));
  assert.equal(plain[0].facts.index, '1'); assert.equal(needsTieBreak(plain), true);
  const boosted = rankScored(scoreOffers([a, b], {}, { boosts: { [itineraryKey(b)]: 0.8 } }));
  assert.equal(boosted[0].facts.index, '2');
});

test('baggage that is "not provided" never counts as included when a bag was asked for', () => {
  const [included, unknown, paid] = scoreOffers([offer('1', 300, 230, { checked: 'included' }), offer('2', 300, 230, { checked: 'unknown' }), offer('3', 300, 230, { checked: 'paid' })], { checkedBag: true });
  assert.ok(included.cost < unknown.cost && unknown.cost < paid.cost);
});

test('badges, Pareto value, diverse top three and grounded reasons', () => {
  const list = [offer('1', 300, 300), offer('2', 400, 200, { carrier: 'A3', depart: '07:00' }), offer('3', 500, 400, { carrier: 'LH', depart: '13:00' }), offer('4', 305, 300, { depart: '10:30' }), offer('5', 320, 310, { carrier: 'LY', depart: '18:00' })];
  const scored = scoreOffers(list), tags = badges(scored);
  assert.ok(tags.get(itineraryKey(list[0])).includes('cheapest'));
  assert.ok(tags.get(itineraryKey(list[1])).includes('fastest'));
  assert.deepEqual(tags.get(itineraryKey(list[2])), [], 'a dominated offer gets no badge');
  const top = diverseTop(rankScored(scored), 3).map(x => x.facts.index);
  assert.ok(!(top.includes('1') && top.includes('4')), 'two versions of the same flight are not both in the top three');
  const trade = explain(scored.find(x => x.facts.index === '2'), scored);
  assert.equal(trade[0], 'עוד 100 וחוסכת 1:40 שע׳ לעומת הזולה');
});

test('query memory: identical requests share a signature, decay halves at 30 days, smoothing needs evidence', () => {
  const a = understandRequest('זוג, 5 לילות בפריז ביוני', {}, { today: '2026-10-29' }).brief;
  const b = understandRequest('אני ואשתי חמישה לילות ביוני לפריז', {}, { today: '2026-10-29' }).brief;
  assert.equal(signature(a), signature(b));
  assert.notEqual(signature(a), signature({ ...a, want: ['LON'] }));
  assert.deepEqual(Object.keys(canonical(a, 'coarse')).sort(), ['d', 'k', 'm', 'o']);
  const now = Date.parse('2026-10-29T00:00:00Z');
  let doc = null;
  for (let i = 0; i < 20; i++) doc = recordEvent(doc, i % 2 ? 'A' : 'B', 'impression', now);
  for (let i = 0; i < 6; i++) doc = recordEvent(doc, 'A', 'save', now);
  assert.ok(lift(doc, 'A', now).m > 0.5); assert.ok(lift(doc, 'B', now).m < 0); assert.equal(lift(doc, 'C', now).m, 0);
  const aged = lift(doc, 'A', now + 30 * 86400000);
  assert.ok(Math.abs(aged.n - 5) < 1e-6, 'exposure halves after one half-life');
  assert.ok(Math.abs(blendedBoost(null, doc, 'A', now)) > 0, 'a new signature leans on the coarse level');
});

test('saving a flight repeatedly lifts it above an equal rival, within β', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'gerbi-memory-'));
  try {
    const memory = new QueryMemory(createStore('memory-test', directory)), brief = { origin: 'TLV', destination: 'FCO', start: '2027-06-10', adults: 2 };
    const a = offer('1', 300, 230), b = offer('2', 300, 230), ka = itineraryKey(a), kb = itineraryKey(b);
    for (const key of [ka, kb]) for (let i = 0; i < 5; i++) await memory.event(brief, key, 'impression');
    for (let i = 0; i < 3; i++) await memory.event(brief, kb, 'save');
    const boosts = await memory.boosts(brief, [ka, kb]);
    assert.ok(boosts[kb] > boosts[ka]);
    assert.equal(rankScored(scoreOffers([a, b], {}, { boosts }))[0].facts.index, '2');
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('LLM partner: off without a key, contact details scrubbed, cached answers validated like user input', async () => {
  const keys = ['OPENROUTER_API_KEY', 'DEEPSEEK_API_KEY', 'ANTHROPIC_API_KEY'], saved = keys.map(k => process.env[k]); keys.forEach(k => delete process.env[k]);
  try {
    assert.equal(await partnerUnderstand(null, 'משהו עם טבע', { want: [] }), null);
    assert.equal(await partnerTieBreak(null, {}, [{ key: 'a' }, { key: 'b' }]), null);
    assert.equal(scrub('תתקשרו 050-123-4567 או dana@example.com'), 'תתקשרו [טלפון] או [מייל]');
    // A cache hit is served with zero tokens and still validated: unknown codes and bad numbers are dropped.
    const store = { get: async () => ({ want: [], exclude: ['XXX'], suggest: ['TBS', 'NOPE', 'BUS'], adults: 0, children: 0, nights: 99, month: 'יוני', beach: 'no', city: 'unknown', relaxation: 'yes', family: 'unknown', couple: 'unknown', interests: ['טבע', 'מפלים'], question: 'מתי?' }), set: async () => {} };
    const result = await partnerUnderstand(store, 'טבע ומפלים', { want: [], adults: 2, children: 0 });
    assert.equal(result.cached, true);
    assert.deepEqual(result.suggest, ['TBS', 'BUS']);
    assert.equal(result.patch.nights, undefined);
    assert.equal(result.patch.month, 'יוני'); assert.equal(result.patch.beach, false); assert.equal(result.patch.relaxation, true);
    assert.equal(result.patch.exclude, undefined);
    const pick = await partnerTieBreak({ get: async () => ({ pick: 1, reason: 'חוזרת בערב' }), set: async () => {} }, {}, [{ key: 'a' }, { key: 'b' }]);
    assert.deepEqual(pick, { pick: 'b', reason: 'חוזרת בערב', cached: true });
    assert.equal(await partnerTieBreak({ get: async () => ({ pick: 7, reason: '' }), set: async () => {} }, {}, [{ key: 'a' }, { key: 'b' }]), null);
  } finally { keys.forEach((k, i) => { if (saved[i] !== undefined) process.env[k] = saved[i]; }); }
});

test('the LLM gate opens only for text the rules did not understand', () => {
  const t = { today: '2026-10-29' };
  assert.equal(understandRequest('אנחנו 4 חברים, 10-15 ביוני ללונדון, טיסה ישירה', {}, t).coverage.needsPartner, false);
  assert.equal(understandRequest('רוצים מקום עם הרבה טבע, מפלים ושווקים מקומיים, לא תיירותי מדי', {}, t).coverage.needsPartner, true);
});

test('season fit: Dubai drops out of August beach ideas and leads in December for a family', async () => {
  const { parsePreferences, rankDemoTrips } = await import('../dist/planner.mjs');
  const { trips } = await import('../dist/data.mjs');
  const august = rankDemoTrips(trips, { ...parsePreferences('זוג, ים ובריכה, שבוע באוגוסט', {}), budget: undefined }).map(x => x.trip.id);
  assert.equal(august.includes('dubai'), false);
  const december = rankDemoTrips(trips, { ...parsePreferences('משפחה עם 2 ילדים, ים ובריכה, שבוע בדצמבר', {}), budget: undefined });
  assert.equal(december[0].trip.id, 'dubai'); assert.ok(december[0].reasons.includes('עונה טובה בדצמבר'));
});
