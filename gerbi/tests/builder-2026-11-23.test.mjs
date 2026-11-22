// Builder pass 23.11.2026: did-you-know about the destination's country, varied days with "more ideas", the attractions
// section, "expand with Gerbi" (rules without a key, grounded AI with one), and follow-up edits that update the plan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { destinations } from '../dist/catalog.mjs';
import { countryFor, countryOfDest, guessCountry, factsFor } from '../dist/did-you-know.mjs';
import { parseTrip, planPackage, attractionsOf } from '../dist/trip-builder.mjs';
import { createBuilder } from '../backend/build.mjs';
import { createGateway } from '../backend/ai-gateway.mjs';
import { TASKS } from '../backend/ai-tasks.mjs';
import { tripExpandDay, tripExpandStay } from '../backend/ai-features.mjs';
import { startMockLlm } from '../scripts/mock-llm-server.mjs';

const TODAY = '2026-11-23';
const facts = Object.assign({}, ...(await Promise.all(['a', 'b', 'c', 'd'].map((g) => import(`../dist/facts/group-${g}.mjs`)))).map((m) => m.default));
const plan = (text, opts = {}) => planPackage(parseTrip(text, { today: TODAY, ...opts }), { today: TODAY, ...opts });
const quiet = () => {};

test('did-you-know: every one of the catalog destinations maps to its own country with facts (plan id and plan code alike)', () => {
  assert.equal(destinations.length, 70);
  for (const d of destinations) {
    const cc = countryOfDest(d);
    assert.ok(cc && facts[cc]?.he?.length >= 12 && facts[cc]?.en?.length >= 12, `${d.id}: no facts for ${cc || '?'}`);
    // What the page passes once the plan is known: the first stop's id and code (a base's airport for a country-sized one).
    const p = planPackage(parseTrip('', { today: TODAY, destId: d.id }), { today: TODAY, chosenId: d.id });
    assert.equal(countryFor({ id: p.destination.id, code: p.destination.code }), cc, `${d.id} → ${p.destination.code}`);
    assert.notEqual(factsFor(facts, { id: p.destination.id, code: p.destination.code }), facts.XX, `${d.id} fell back to general facts`);
  }
  const italy = ['rome', 'florence-tuscany', 'amalfi-naples', 'sicily', 'venice', 'milan-lake-como'].map((id) => countryFor({ id }));
  assert.deepEqual([...new Set(italy)], ['IT']);
  assert.equal(countryFor({ id: 'paris' }), 'FR'); assert.equal(countryFor({ id: 'nice' }), 'FR');
  assert.equal(countryFor({ id: 'eilat' }), 'IL'); assert.equal(countryFor({ id: 'dead-sea', code: 'TLV' }), 'IL');
  assert.equal(countryFor({ id: 'edinburgh' }), 'GB'); assert.equal(countryFor({ id: 'tenerife' }), 'ES');
  assert.equal(countryFor({ code: 'KIX' }), 'JP'); assert.equal(factsFor(facts, 'ZZZ'), facts.XX);
});

test('did-you-know: before the plan exists the text already points at the country (Hebrew prefixes, English, aliases)', () => {
  const cases = { 'זוג עם ילד, 4 לילות ברומא בינואר': 'IT', 'שבוע בפירנצה וטוסקנה': 'IT', 'חוף אמלפי בקיץ': 'IT', 'Honeymoon in Florence': 'IT', 'רוצים לאיטליה': 'IT',
    'ירח דבש במלדיבים': 'MV', '4 nights in Nice': 'FR', 'משפחה לים המלח': 'IL', 'סוף שבוע באילת': 'IL', 'Japan in April': 'JP', 'ספארי בקניה': 'KE', 'קרקוב בחורף': 'PL' };
  for (const [text, cc] of Object.entries(cases)) assert.equal(guessCountry(text), cc, text);
  for (const text of ['a nice hotel by the sea', 'ניסיון ראשון בחו"ל', 'תציעו לנו לאן', '']) assert.equal(guessCountry(text), '', text);
});

test('days: each planned day offers up to 3 more ideas of other kinds, none repeated across days or already planned', () => {
  for (const text of ['זוג, 5 לילות ברומא באפריל', 'משפחה עם 2 ילדים בני 6 ו-9, שבוע בברצלונה ביולי', 'A couple, 6 nights in Lisbon in May']) {
    const p = plan(text), planned = new Set(p.itinerary.flatMap((d) => d.items.map((x) => x.name))), seen = new Set();
    const withIdeas = p.itinerary.filter((d) => d.more?.length);
    assert.ok(withIdeas.length >= 2, `${text}: ideas on ${withIdeas.length} days`);
    for (const d of p.itinerary) for (const x of d.more || []) {
      assert.ok(!planned.has(x.name) && !seen.has(x.name), `${text}: ${x.name} repeated`); seen.add(x.name);
      assert.ok(x.mapsUrl && (x.generic || (x.dest && x.en)), 'idea has a map link and (catalog ones) its catalog keys');
    }
    assert.ok(new Set([...seen].map((n) => p.itinerary.flatMap((d) => d.more || []).find((x) => x.name === n).kind)).size >= 3, `${text}: ideas of 3+ kinds`);
  }
});

test('attractions section: must-sees first, the plan day of each, nothing unsuitable for children, photos/details keys', () => {
  const p = plan('זוג, 5 לילות ברומא באפריל');
  assert.ok(p.attractions.length >= 10);
  const firstOther = p.attractions.findIndex((a) => !a.must);
  assert.ok(firstOther > 0 && p.attractions.slice(firstOther).every((a) => !a.must), 'must-sees lead');
  assert.ok(p.attractions.filter((a) => a.day > 0).length >= 5, 'planned ones say their day');
  for (const a of p.attractions.filter((x) => x.day)) assert.ok(p.itinerary[a.day - 1].items.some((x) => x.name === a.name), `${a.name} on day ${a.day}`);
  const kids = plan('Family with kids aged 5 and 8, a week in Barcelona in July', { lang: 'en' });
  assert.ok(kids.attractions.every((a) => !a.tags.includes('nightlife')), 'no nightlife with children');
  const multi = plan('5 לילות ברומא ואז 3 בפריז');
  assert.deepEqual([...new Set(multi.attractions.map((a) => a.dest))], ['rome', 'paris']);
  const skip = plan('זוג, 5 לילות ברומא באפריל, בלי מוזיאונים');
  assert.ok(skip.attractions.every((a) => a.kind !== 'museum'));
  assert.equal(typeof attractionsOf, 'function');
});

test('conversation: "add a day in Florence" adds a night there and keeps Rome; a hand edit of the nights stays the base', async () => {
  const b = createBuilder({ store: null, env: {} }), first = 'זוג, 5 לילות ברומא באפריל';
  const p0 = await b.plan({ text: first, thread: [first], lang: 'he' });
  const cur = { dest: ['rome'], nights: p0.request.nights, start: p0.request.start };
  const add = await b.plan({ text: 'תוסיף יום בפירנצה', thread: [first, 'תוסיף יום בפירנצה'], lang: 'he', current: cur });
  assert.deepEqual(add.stops.map((s) => [s.id, s.nights]), [['rome', 5], ['florence-tuscany', 1]]);
  const two = await b.plan({ text: 'add 2 nights in Florence', thread: [first, 'add 2 nights in Florence'], lang: 'en', current: cur });
  assert.deepEqual(two.stops.map((s) => [s.id, s.nights]), [['rome', 5], ['florence-tuscany', 2]]);
  const also = await b.plan({ text: 'גם ונציה', thread: [first, 'גם ונציה'], lang: 'he', current: cur });
  assert.deepEqual(also.stops.map((s) => s.id), ['rome', 'venice'], '"גם X" adds, never replaces');
  // The visitor changed the nights to 7 by hand (sent as the plan's own state): one more night → 8, not 5 + 1.
  const more = await b.plan({ text: 'עוד לילה', thread: [first, 'עוד לילה'], lang: 'he', current: { ...cur, nights: 7, edited: true } });
  assert.equal(more.request.nights, 8);
  // Two places on screen with their own nights: adding a third keeps both.
  const route = await b.plan({ text: 'תוסיף 2 לילות בוונציה', thread: [first, 'תוסיף יום בפירנצה', 'תוסיף 2 לילות בוונציה'], lang: 'he', current: { dest: ['rome', 'florence-tuscany'], nights: 6, start: p0.request.start, legNights: [5, 1] } });
  assert.deepEqual(route.stops.map((s) => [s.id, s.nights]), [['rome', 5], ['florence-tuscany', 1], ['venice', 2]]);
});

test('expand with Gerbi: null without a provider; with one, grounded ideas (no numbers, nothing already planned) and only the catalog areas', async () => {
  const off = createGateway({ tasks: TASKS, env: {}, log: quiet });
  assert.equal(await tripExpandDay({ destination: 'רומא', planned: ['הקולוסיאום'] }, { gw: off }), null);
  const mock = await startMockLlm();
  try {
    const gw = createGateway({ tasks: TASKS, env: { GERBI_AI_MOCK_URL: mock.url }, log: quiet });
    const day = await tripExpandDay({ destination: 'רומא', travellers: 'זוג', planned: ['הקולוסיאום', 'הפורום הרומי'], known: ['טרסטוורה'] }, { gw });
    assert.ok(day.tip.length > 5 && day.ideas.length >= 1 && day.ideas.every((x) => x.name && x.why && !/\d/.test(x.name + x.why)));
    const stay = await tripExpandStay({ destination: 'רומא', travellers: 'זוג', areas: [{ name: 'טרסטוורה', forWhom: 'זוגות' }, { name: 'מונטי', forWhom: 'קרוב לקולוסיאום' }] }, { gw });
    assert.deepEqual(stay.areas.map((a) => a.name), ['טרסטוורה', 'מונטי']);
    assert.ok(stay.areas.every((a) => a.pros && ['low', 'mid', 'high'].includes(a.price)));
  } finally { await mock.close(); }
  // A model answer with an invented number or a place already planned is dropped / refused.
  const liar = createGateway({ tasks: TASKS, env: { DEEPSEEK_API_KEY: 'k' }, log: quiet, fetch: async () => new Response(JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({ tip: 'פתוח עד 19:00', ideas: [{ name: 'הקולוסיאום', why: 'שוב', kind: 'landmark' }] }) } }], usage: {} }), { status: 200, headers: { 'Content-Type': 'application/json' } }) });
  assert.equal(await tripExpandDay({ destination: 'רומא', planned: ['הקולוסיאום'] }, { gw: liar }), null);
});

test('builder route /api/build/expand: { expand: null } without a provider; the plan says whether AI is on', async () => {
  const b = createBuilder({ store: null, env: {} });
  const sent = [];
  const res = { writeHead() {}, end() {} };
  const helpers = { send: (status, body) => sent.push({ status, body }), body: async () => ({ kind: 'day', destination: 'Rome', planned: ['The Colosseum'] }) };
  await b.handle({ method: 'POST', headers: {}, socket: { remoteAddress: '127.0.0.1' } }, res, new URL('http://x/api/build/expand'), helpers);
  assert.deepEqual(sent[0], { status: 200, body: { expand: null } });
  const p = await b.plan({ text: 'זוג, 5 לילות ברומא באפריל', lang: 'he' });
  assert.equal(p.config.ai, false);
  const on = createBuilder({ store: null, env: {}, expand: { day: async () => ({ tip: 'כדאי להגיע מוקדם', ideas: [] }) }, aiEnabled: async () => true });
  assert.equal((await on.plan({ text: 'זוג, 5 לילות ברומא באפריל', lang: 'he' })).config.ai, true);
});
