// Spec 24: the magic trip builder – understanding, planning, itinerary rules, pricing legend, snapshots, leads,
// hotel supplier mapping and the HTTP routes (recorded supplier answers; no live calls).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { parseTrip, planPackage, planDates, buildItinerary, passengers, roomsOf, applyEdits, suggestDestinations, weekday, pace, hotelCityOf } from '../dist/trip-builder.mjs';
import { pricePackage, sanitizePackage, packageLeadFields, groundEstimate, isStale, mapsUrl } from '../dist/trip-package.mjs';
import { validateLead } from '../dist/leads-validate.mjs';
import { byId } from '../dist/catalog.mjs';
import { validHotelSearch, supplierHotelInput, hotelQueries, slimHotel, rankHotels, LEADER_NATIONALITY } from '../backend/hotels.mjs';
import { createBuilder, flightPicks } from '../backend/build.mjs';
import { createAccounts } from '../backend/accounts.mjs';
import { handleLeads } from '../backend/leads.mjs';
import { createStore } from '../backend/kv-store.mjs';
import { scoreLead, summaryText } from '../dist/lead-score.mjs';
import { leadFacts } from '../backend/ai-features.mjs';
process.env.TRUST_PROXY = '1';

const TODAY = '2026-11-15';
const plan = (text, opts = {}) => planPackage(parseTrip(text, { today: TODAY, ...opts }), { today: TODAY, ...opts });

test('understanding: a family sentence → travellers, ages, month, nights, board, kosher; car follows the destination', () => {
  const r = parseTrip('משפחה עם 2 ילדים בני 6 ו-9, אוגוסט, שבוע, בריכה והכול כלול, כשר', { today: TODAY });
  assert.equal(r.adults, 2); assert.equal(r.children, 2); assert.deepEqual(r.childAges, [6, 9]);
  assert.equal(r.month, 8); assert.equal(r.nights, 7);
  assert.equal(r.needs.allInclusive, true); assert.equal(r.needs.board, 'AI'); assert.equal(r.needs.kosher, true); assert.equal(r.needs.car, 'auto');
  assert.equal(r.occasion, 'family'); assert.ok(r.suggest, 'no destination named → suggest');
  assert.ok(r.understood.some((u) => u.field === 'board'));
});

test('understanding: English, a named destination, car and stars; "no car" wins; luxury honeymoon asks for 5 stars', () => {
  const r = parseTrip('A couple with a child aged 8, 4 nights in Rome in January, a 4-star hotel, with a car', { today: TODAY, lang: 'en' });
  assert.deepEqual([r.adults, r.children, r.childAges, r.nights], [2, 1, [8], 4], 'an age is never the night count that follows it');
  assert.deepEqual(r.destinations, ['rome']); assert.equal(r.needs.car, 'yes'); assert.equal(r.needs.minStars, 4);
  assert.equal(parseTrip('זוג ברומא, בלי רכב', { today: TODAY }).needs.car, 'no');
  const h = parseTrip('ירח דבש, 8 לילות, מלון יוקרה, תציעו לנו', { today: TODAY });
  assert.equal(h.occasion, 'honeymoon'); assert.equal(h.budgetLevel, 'high'); assert.equal(h.needs.minStars, 5); assert.ok(h.suggest);
});

test('destination choice: three catalog suggestions with reasons; "A or B" limits the choice; advisories never lead', () => {
  const p = plan('ירח דבש, 8 לילות, מלון יוקרה, תציעו לנו');
  assert.equal(p.suggestions.length, 3);
  assert.ok(p.suggestions.every((s) => s.reasons.length >= 1 && byId(s.id)));
  assert.equal(p.destination.id, p.suggestions[0].id, 'the best fit is built right away');
  assert.ok(!byId(p.destination.id).advisory);
  const alt = plan('רומא או סנטוריני בספטמבר');
  assert.deepEqual(alt.suggestions.map((s) => s.id).sort(), ['rome', 'santorini']);
  const chosen = planPackage(parseTrip('רומא או סנטוריני בספטמבר', { today: TODAY }), { today: TODAY, chosenId: 'santorini' });
  assert.equal(chosen.destination.id, 'santorini');
});

test('dates: a month → the first Sunday on/after the 10th; nothing → the next good month at least 3 weeks away; all marked assumed', () => {
  const rome = byId('rome');
  const a = planDates({ ...parseTrip('זוג באפריל', { today: TODAY }) }, rome, TODAY);
  assert.equal(weekday(a.start), 0); assert.ok(a.start >= '2027-04-10' && a.start <= '2027-04-16'); assert.equal(a.datesAssumed, true);
  const b = planDates(parseTrip('זוג לרומא', { today: TODAY }), rome, TODAY);
  assert.ok(rome.bestMonths.includes(Number(b.start.slice(5, 7)))); assert.ok(b.start >= '2026-12-06');
  assert.equal(b.nights, 5); assert.ok(b.assumed.some((x) => x.key === 'nights'));
  const exact = planDates(parseTrip('רומא מ-12.3 עד 16.3', { today: TODAY }), rome, TODAY);
  assert.deepEqual([exact.start, exact.end, exact.nights, exact.datesAssumed], ['2027-03-12', '2027-03-16', 4, false]);
});

test('itinerary: light arrival, empty departure, kids pace, day trip from 5 nights, rest day from 6 with kids, maps links', () => {
  const p = plan('משפחה עם ילדים בני 4 ו-7, 7 לילות בדובאי בפברואר');
  const days = p.itinerary;
  assert.equal(days.length, 8);
  assert.equal(days[0].kind, 'arrival'); assert.ok(days[0].items.length <= 1 && days[0].items.every((x) => x.durationH <= 2));
  assert.equal(days.at(-1).kind, 'departure'); assert.equal(days.at(-1).items.length, 0);
  const { hours, items } = pace(p.request);
  assert.deepEqual([hours, items], [5, 2], 'a child under 6 → 5 hours, 2 places');
  for (const d of days.filter((x) => x.kind === 'full')) { assert.ok(d.items.length <= 2); assert.ok(d.items.reduce((s, x) => s + x.durationH, 0) <= 5); }
  // Spec 28: a day trip is paced too – none of Dubai's (≥7h) fits a 4-year-old's 5-hour day; school-age kids get them.
  assert.ok(days.filter((d) => d.kind === 'daytrip').every((d) => d.items[0].durationH <= hours)); assert.ok(days.some((d) => d.kind === 'rest'));
  assert.ok(plan('משפחה עם ילדים בני 8 ו-10, 7 לילות בדובאי בפברואר').itinerary.some((d) => d.kind === 'daytrip'));
  assert.ok(days.flatMap((d) => d.items).every((x) => x.mapsUrl.startsWith('https://www.google.com/maps/search/?api=1&query=')));
  const names = days.flatMap((d) => d.items.map((x) => x.name)), used = new Set(names);
  assert.equal(used.size, names.length, 'no place twice');
});

test('itinerary: Shabbat-observant travellers rest on Saturday (no places), Friday ends early; edits keep it', () => {
  const r = applyEdits(parseTrip('זוג שומרי שבת, 6 לילות ברומא', { today: TODAY }), { start: '2027-03-04' }, TODAY);
  const p = planPackage(r, { today: TODAY });
  const sat = p.itinerary.find((d) => weekday(d.date) === 6);
  assert.equal(sat.kind, 'shabbat'); assert.equal(sat.items.length, 0); assert.match(sat.note, /נסיעות/);
  assert.ok(p.itinerary.find((d) => weekday(d.date) === 5 && d.kind === 'full')?.note);
  const home = planPackage(applyEdits(r, { start: '2027-03-07' }, TODAY), { today: TODAY }).itinerary.at(-1);
  assert.equal(weekday(home.date), 6); assert.match(home.note, /שבת/, 'flying home on Shabbat is flagged');
});

test('multi-city: two places → open jaw route, nights split, a hotel search per stop', () => {
  const p = plan('רומא ואז סנטוריני, 9 לילות במאי');
  assert.deepEqual(p.stops.map((s) => [s.id, s.nights]), [['rome', 5], ['santorini', 4]]);
  assert.deepEqual(p.flightSearch.originDestinations.map((l) => `${l.origin.code}>${l.destination.code}`), ['TLV>FCO', 'FCO>JTR', 'JTR>TLV']);
  assert.equal(p.flightSearch.originDestinations[1].date, p.stops[1].start);
  assert.deepEqual(p.hotelSearches.map((h) => h.city), ['ROM', 'JTR']);
  assert.ok(p.itinerary.some((d) => d.kind === 'move'));
});

test('passengers and rooms: infants on laps, 12+ fly as adults; two adults per room, unknown ages search as 8', () => {
  assert.deepEqual(passengers({ adults: 2, children: 3, childAges: [1, 6, 13], infants: 0 }), [{ ptc: 'ADT', count: 3 }, { ptc: 'CHD', count: 1 }, { ptc: 'INF', count: 1 }]);
  assert.deepEqual(roomsOf({ adults: 2, children: 2, childAges: [5] }), [{ adults: 2, childrenAges: [5, 8] }]);
  assert.deepEqual(roomsOf({ adults: 4, children: 0, childAges: [] }).map((r) => r.adults), [2, 2]);
  assert.equal(hotelCityOf(byId('rome')), 'ROM');
});

test('pricing: live lines carry their time, the ground estimate is a range, the rest is "on request"; totals per person and vs budget', () => {
  const p = plan('זוג עם ילד בן 8, 4 לילות ברומא בינואר, תקציב 6000 שקל');
  const pkg = { ...p, flights: { status: 'live', searchedAt: '2026-11-15T10:00:00Z', selected: 'a', picks: [{ key: 'a', price: { value: 400, currency: 'USD' } }, { key: 'b', price: { value: 500, currency: 'USD' } }] },
    hotels: { status: 'live', searchedAt: '2026-11-15T10:01:00Z', selected: 'h2', picks: [{ id: 'h1', price: { value: 200, currency: 'USD' } }, { id: 'h2', price: { value: 300, currency: 'USD' } }] }, car: { include: true } };
  const fx = { rates: { USD: 3.5 } }, pr = pricePackage(pkg, fx);
  assert.deepEqual(pr.lines.map((l) => [l.id, l.kind]), [['flight', 'live'], ['hotel', 'live'], ['ground', 'estimate'], ['car', 'quote'], ['transfers', 'quote']]);
  assert.equal(pr.total.live, 2450, '400×3.5 + 300×3.5 (the selected hotel)');
  const g = groundEstimate(pkg), d = byId('rome').dailyBudgetIls;
  assert.deepEqual(g, { low: Math.round(d.low * 4 * 2.6 / 10) * 10, high: Math.round(d.mid * 4 * 2.6 / 10) * 10 });
  assert.deepEqual([pr.total.low, pr.total.high], [2450 + g.low, 2450 + g.high]);
  assert.equal(pr.perPerson.live, Math.round(2450 / 3));
  assert.equal(pr.budget.amount, 6000); assert.ok(['within', 'tight', 'over'].includes(pr.budget.verdict));
  const noFx = pricePackage(pkg, null);
  assert.equal(noFx.total, null); assert.equal(noFx.missingFx, true, 'no shekel total without a rate');
  const quoteOnly = pricePackage({ ...pkg, flights: { status: 'quote' }, hotels: { status: 'quote' }, car: { include: false } }, fx);
  assert.deepEqual(quoteOnly.lines.filter((l) => l.kind === 'live'), []); assert.equal(quoteOnly.total.live, 0);
  assert.equal(isStale('2026-11-15T10:00:00Z', Date.parse('2026-11-15T10:20:00Z')), false);
  assert.equal(isStale('2026-11-15T10:00:00Z', Date.parse('2026-11-15T10:31:00Z')), true);
});

test('snapshot: whitelisted and bounded (no foreign image hosts, no script, no unknown fields); lead keeps only the chosen components', () => {
  const p = plan('זוג, 5 לילות ברומא באפריל');
  const pkg = { ...p, evil: '<script>', flights: { status: 'live', searchedAt: '2026-11-15T10:00:00Z', selected: 'b', picks: [{ key: 'a', carriers: ['X'], price: { value: 1, currency: 'USD' }, legs: [] }, { key: 'b', carriers: ['Y<script>'], price: { value: 2, currency: 'USD' }, legs: [] }] },
    hotels: { status: 'live', selected: '2', picks: [{ id: '1', name: 'A', image: 'https://evil.example/x.jpg', price: { value: 9, currency: 'USD' } }, { id: '2', name: 'B', image: '/api/build/hotel-image?src=hotel%3A1%2Fx.jpg', price: { value: 8, currency: 'USD' } }] } };
  const s = sanitizePackage(pkg);
  assert.equal(s.evil, undefined); assert.equal(s.hotels.picks[0].image, ''); assert.ok(s.hotels.picks[1].image.startsWith('/api/build/hotel-image'));
  assert.ok(!JSON.stringify(s).includes('<script>'));
  assert.equal(s.itinerary.length, 6);
  const fields = packageLeadFields(s);
  const { lead, errors } = validateLead({ type: 'package', name: 'דנה כהן', phone: '050-1234567', channel: 'whatsapp', consent: true, ...fields, package: pkg }, { today: TODAY });
  assert.deepEqual(errors, {});
  assert.deepEqual(lead.package.flights.picks.map((x) => x.key), ['b']); assert.deepEqual(lead.package.hotels.picks.map((x) => x.id), ['2']);
  assert.equal(lead.destinations, 'רומא'); assert.equal(lead.flexibility, 'month');
  assert.equal(validateLead({ type: 'package', name: 'דנה כהן', phone: '050-1234567', channel: 'whatsapp', consent: true, ...fields, package: { nope: 1 } }, { today: TODAY }).errors.package, 'invalid');
  assert.equal(scoreLead({ ...lead, createdAt: new Date().toISOString(), status: 'new' }).reasons[0], 'חבילה מלאה מבונה החופשות');
  assert.match(summaryText(lead), /^חבילה · רומא/);
  assert.equal(leadFacts({ ...lead, createdAt: TODAY }).package.flight.carriers[0], 'Y script', 'the AI brief sees the chosen components, sanitised');
  assert.equal(mapsUrl('Colosseum', 'Rome'), 'https://www.google.com/maps/search/?api=1&query=Colosseum%2C%20Rome');
});

test('hotels: validated input → supplier body (ISO nationality 376), array filters, slim + ranked with roles', () => {
  assert.equal(validHotelSearch({ city: 'rom', checkIn: '2027-01-10', checkOut: '2027-01-14', rooms: [{ adults: 2 }] }, TODAY), null);
  assert.equal(validHotelSearch({ city: 'ROM', checkIn: '2026-01-10', checkOut: '2027-01-14', rooms: [{ adults: 2 }] }, TODAY), null, 'past check-in');
  assert.equal(validHotelSearch({ city: 'ROM', checkIn: '2027-01-10', checkOut: '2027-03-14', rooms: [{ adults: 2 }] }, TODAY), null, 'over 30 nights');
  const spec = validHotelSearch({ city: 'ROM', checkIn: '2027-01-10', checkOut: '2027-01-14', rooms: [{ adults: 2, childrenAges: [8, 99] }], board: 'AI', minStars: 4, area: 'Prati <b>' }, TODAY);
  assert.deepEqual(spec.rooms, [{ adults: 2, childrenAges: [8] }]); assert.equal(spec.area, 'Prati b');
  const body = supplierHotelInput(spec);
  assert.equal(body.occupancy.leaderNationality, LEADER_NATIONALITY); assert.equal(LEADER_NATIONALITY, 376);
  assert.deepEqual(body.destination, { city: { code: 'ROM' } }); assert.equal(body.availableOnly, true);
  const { query, fallbackQuery } = hotelQueries(spec);
  assert.deepEqual(query.filter(([k]) => k === 'hotelClassifications[]').map(([, v]) => v), ['3', '4', '5']);
  assert.ok(query.some(([k, v]) => k === 'boardBasis[]' && v === 'AI')); assert.ok(!fallbackQuery.some(([k]) => k === 'boardBasis[]'));
  const raw = (id, stars, price, extra = {}) => ({ index: id, name: `H${id}`, stars, minPrice: { value: price, currency: 'USD' }, boardBasis: [{ code: 'RO', price: { value: price, currency: 'USD' } }, { code: 'AI', price: { value: price * 1.5, currency: 'USD' } }],
    nonRefundable: [], details: { address: extra.address || 'Somewhere', mainImage: { url: `https://supplier.example/thumb?src=hotel%3A1%2F${id}.jpg` }, categories: extra.family ? [{ name: 'Family property' }] : [] } });
  const slim = slimHotel(raw(7, 4, 100, { family: true }), 'AI');
  assert.deepEqual([slim.price, slim.board, slim.family, slim.image], [{ value: 150, currency: 'USD' }, 'AI', true, 'hotel:1/7.jpg']);
  const list = [raw(1, 3, 90), raw(2, 4, 120, { address: 'Via Cola di Rienzo, Prati' }), raw(3, 5, 260), raw(4, 4, 100), raw(5, 2, 50)].map((h) => slimHotel(h));
  const ranked = rankHotels(list, { minStars: 4, area: 'Prati', family: false, board: '' });
  assert.ok(ranked.picks.every((h) => h.stars >= 4)); assert.equal(ranked.relaxedStars, false);
  assert.equal(ranked.picks.find((h) => h.role === 'value').name, 'H2', 'in the recommended area');
  assert.equal(ranked.picks.find((h) => h.role === 'upgrade').stars, 5);
  assert.equal(ranked.picks.find((h) => h.role === 'budget').name, 'H4');
  assert.equal(rankHotels(list, { minStars: 5, area: '', board: '' }).relaxedStars, true, 'too few 5★ → one star lower');
});

// The builder routes + accounts + leads behind one HTTP server, recorded supplier answers.
async function withServer(run, extraEnv = {}) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'gerbi-build-'));
  const env = { GERBI_SUPPLIER_FIXTURES: '1', ...extraEnv };
  const leadStore = createStore('leads', directory), accounts = createAccounts({ store: createStore('accounts', directory), leadStore, env });
  const builder = createBuilder({ store: createStore('build', directory), env, polish: async (destination, travellers, days) => ({ intro: `חופשה ב${destination}`, dayTitles: days.map((d, i) => `יום ${i + 1}`) }) });
  const body = async (req) => { let raw = ''; for await (const chunk of req) raw += chunk; return raw ? JSON.parse(raw) : {}; };
  const server = http.createServer(async (req, res) => {
    const send = (code, data) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
    const url = new URL(req.url, 'http://x');
    if (await builder.handle(req, res, url, { send, body })) return;
    if (await accounts.handle(req, res, url, { send, body })) return;
    if (await handleLeads(req, url, { send, body, store: leadStore, env, hooks: { ...accounts.leadHooks, enrich: builder.enrichLead } })) return;
    send(404, {});
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let cookie = '';
  const call = async (method, route, payload) => {
    const response = await fetch(base + route, { method, headers: { Origin: base, 'X-Forwarded-For': '10.24.0.1', ...(payload !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) }, body: payload !== undefined ? JSON.stringify(payload) : undefined });
    const set = response.headers.get('set-cookie'); if (set) cookie = set.split(';')[0];
    return { status: response.status, data: await response.json().catch(() => null) };
  };
  try { await run(call, leadStore); } finally { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); await rm(directory, { recursive: true, force: true }); }
}

test('HTTP (HOTELS_PUBLIC_DISPLAY on): plan → flights + hotels (recorded) → share → package lead in the account; invalid input is refused', async () => {
  await withServer(async (call) => {
    assert.equal((await call('POST', '/api/build', { text: '' })).status, 400);
    const planned = await call('POST', '/api/build', { text: 'זוג עם ילד בן 8, 4 לילות ברומא בינואר', lang: 'he' });
    assert.equal(planned.status, 200);
    const p = planned.data;
    assert.equal(p.destination.id, 'rome'); assert.ok(p.flightSearch && p.hotelSearches[0]);
    assert.equal((await call('POST', '/api/build/flights', { search: { originDestinations: [{ origin: { code: 'TLV', type: 'a' }, destination: { code: 'TLV', type: 'a' }, date: '2027-01-10' }] } })).status, 400);
    const flights = (await call('POST', '/api/build/flights', { search: p.flightSearch, request: p.request })).data;
    assert.equal(flights.status, 'live'); assert.ok(flights.picks.length >= 1 && flights.picks.length <= 3); assert.ok(flights.searchedAt);
    assert.ok(flights.picks.every((x) => x.price?.currency && x.legs.length === 2));
    assert.equal((await call('POST', '/api/build/hotels', { search: { ...p.hotelSearches[0], city: 'x' } })).status, 400);
    const hotels = (await call('POST', '/api/build/hotels', { search: p.hotelSearches[0] })).data;
    assert.equal(hotels.status, 'live'); assert.ok(hotels.picks.length >= 3); assert.equal(hotels.picks[0].role, 'value');
    assert.ok(hotels.picks.every((h) => !h.image || h.image.startsWith('/api/build/hotel-image?src=')), 'never the supplier host');
    assert.ok(!JSON.stringify([p, flights, hotels]).toLowerCase().includes('volero'));
    assert.equal((await call('GET', '/api/build/hotel-image?src=https://evil.example/x')).status, 400);
    const polish = (await call('POST', '/api/build/polish', { destination: 'רומא', days: [{ kind: 'arrival', items: [] }] })).data;
    assert.deepEqual(polish.polish.dayTitles, ['יום 1']);
    const pkg = { ...p, flights: { ...flights, selected: flights.picks[0].key }, hotels: { ...hotels, selected: hotels.picks[0].id }, car: { ...p.car, include: true } };
    const shared = await call('POST', '/api/build/share', { package: pkg });
    assert.equal(shared.status, 201); assert.match(shared.data.id, /^[a-f0-9]{16}$/);
    const back = (await call('GET', `/api/build/share/${shared.data.id}`)).data.package;
    assert.equal(back.destination.id, 'rome'); assert.equal(back.hotels.picks.length, hotels.picks.length); assert.equal(back.car.include, true);
    assert.equal((await call('GET', '/api/build/share/ffffffffffffffff')).status, 404);
    // A signed-in customer sends it to a representative and saves it.
    assert.equal((await call('POST', '/api/account/signup', { name: 'דנה כהן', email: 'dana@example.com', password: 'sunny-beach-27', privacy: true })).status, 201);
    const snapshot = sanitizePackage(pkg);
    const sent = await call('POST', '/api/leads', { type: 'package', name: 'דנה כהן', phone: '050-1234567', channel: 'whatsapp', consent: true, ...packageLeadFields(snapshot), package: snapshot });
    assert.equal(sent.status, 201);
    const mine = (await call('GET', '/api/account/leads')).data.leads;
    assert.equal(mine[0].type, 'package'); assert.equal(mine[0].title, 'חבילה: רומא');
    assert.equal((await call('POST', '/api/account/packages', { id: shared.data.id, title: 'רומא · ינואר' })).status, 200);
    assert.deepEqual((await call('GET', '/api/account/packages')).data.packages.map((x) => x.id), [shared.data.id]);
    assert.equal((await call('POST', '/api/account/packages', { id: 'nope' })).status, 400);
  }, { HOTELS_PUBLIC_DISPLAY: '1' });
});

test('HTTP (default, hotels private): aggregate estimate only – no hotel names, photos or rates; the agent sees the options in the lead', async () => {
  await withServer(async (call, leadStore) => {
    const p = (await call('POST', '/api/build', { text: 'זוג עם ילד בן 8, 4 לילות ברומא בינואר', lang: 'he' })).data;
    assert.equal(p.config.hotelsPublic, false); assert.equal(p.config.insuranceUrl, '');
    const hotels = (await call('POST', '/api/build/hotels', { search: p.hotelSearches[0] })).data;
    assert.equal(hotels.status, 'estimate'); assert.equal(hotels.mode, 'private'); assert.equal(hotels.picks, undefined);
    assert.match(hotels.ref, /^[a-f0-9]{16}$/);
    const e = hotels.estimate;
    assert.ok(e.perNight.low > 0 && e.perNight.low <= e.perNight.high && e.stay.low === e.perNight.low * 4 && e.count >= 3 && /^[A-Z]{3}$/.test(e.currency));
    const text = JSON.stringify(hotels);
    for (const word of ['SEVEN HILLS', 'Via ', 'hotel-image', 'name']) assert.ok(!text.includes(word), `no ${word} in the public answer`);
    assert.equal((await call('GET', '/api/build/hotel-image?src=' + encodeURIComponent('hotel:1/x.jpg'))).status, 404, 'no photo proxy');
    const flights = (await call('POST', '/api/build/flights', { search: p.flightSearch, request: p.request })).data;
    const pkg = { ...p, flights: { ...flights, selected: flights.picks[0].key }, hotels: { ...hotels, area: p.hotelAreas[0] }, insurance: { include: true } };
    const pr = pricePackage(pkg, { rates: { USD: 3.5 } });
    assert.deepEqual(pr.lines.map((l) => [l.id, l.kind]), [['flight', 'live'], ['hotel', 'estimate'], ['ground', 'estimate'], ['insurance', 'quote'], ['transfers', 'quote']]);
    assert.equal(pr.total.low, pr.total.live + pr.lines[1].range.low + pr.lines[2].range.low, 'the hotel range adds to the estimate, never to the live sum');
    const snapshot = sanitizePackage(pkg);
    assert.equal(snapshot.hotels.ref, hotels.ref); assert.equal(snapshot.insurance.include, true);
    const fields = packageLeadFields(snapshot);
    assert.match(fields.notes, /ביטוח נסיעות \(הראל\)/);
    assert.equal((await call('POST', '/api/leads', { type: 'package', name: 'דנה כהן', phone: '050-1234567', channel: 'whatsapp', consent: true, ...fields, package: snapshot })).status, 201);
    const [lead] = await leadStore.list('all', 1);
    assert.equal(lead.agentHotels.length, 1); assert.ok(lead.agentHotels[0].picks.length >= 1 && lead.agentHotels[0].picks[0].name, 'the agent (admin only) sees the hotel options');
    assert.equal(lead.package.insurance.include, true);
  });
});

test('flight picks: the decision layer\'s diverse top three, facts only, reasons in the visitor\'s language', async () => {
  const { readFile } = await import('node:fs/promises');
  const payload = JSON.parse(await readFile(new URL('./fixtures/build/flights.json', import.meta.url), 'utf8'));
  const he = flightPicks(payload, { adults: 2, children: 1 }, 'he'), en = flightPicks(payload, { adults: 2, children: 1 }, 'en');
  assert.equal(he.length, 3); assert.equal(new Set(he.map((x) => x.key)).size, 3);
  assert.ok(he[0].badges.includes('recommended'));
  assert.ok(he.flatMap((x) => x.reasons).some((r) => /[א-ת]/.test(r))); assert.ok(en.flatMap((x) => x.reasons).every((r) => !/[א-ת]/.test(r)));
  assert.deepEqual(flightPicks({ offers: [] }), []);
});

test('suggestions follow the request: kids favour short flights, kosher and season reasons', () => {
  const r = parseTrip('משפחה עם 3 ילדים, ים, כשר, ביולי', { today: TODAY });
  const s = suggestDestinations(r, { today: TODAY });
  assert.equal(s.length, 3);
  assert.ok(s.every((x) => byId(x.id).flightHours <= 6));
});

test('time zones read relative to Israel on the trip date (daylight saving included)', async () => {
  const { timeVsIsrael } = await import('../dist/timezone.mjs');
  const jan = new Date('2027-01-10T12:00:00Z');
  assert.equal(timeVsIsrael('Europe/Athens', jan, 'he'), 'אותה שעה כמו בישראל');
  assert.equal(timeVsIsrael('Europe/Rome', jan, 'he'), 'שעה אחת פחות מבישראל');
  assert.equal(timeVsIsrael('Asia/Dubai', jan, 'he'), 'שעתיים יותר מבישראל');
  assert.equal(timeVsIsrael('Asia/Kolkata', jan, 'en'), '3.5 hours ahead of Israel');
  assert.equal(timeVsIsrael('Nowhere/Land', jan, 'en'), 'Nowhere/Land');
});

test('an empty supplier answer is never cached; recorded answers never read a poisoned live cache', async () => {
  const mem = new Map(), store = { get: async (k) => mem.get(k) ?? null, set: async (k, v) => { mem.set(k, v); } };
  const p = planPackage(parseTrip('זוג, 4 לילות ברומא בינואר', { today: TODAY }), { today: TODAY });
  let calls = 0;
  const live = createBuilder({ store, env: { VOLERO_CLIENT_ID: 'x' }, flightSearch: async () => { calls++; return { srk: 's', tokens: {}, offers: [], dataLists: {} }; } });
  const search = { ...p.flightSearch, originDestinations: p.flightSearch.originDestinations.map((l) => ({ ...l, date: l.date.replace('2027-01', '2027-02') })) };
  assert.equal((await live.flights(search, p.request, 'he')).status, 'none');
  assert.equal([...mem.keys()].filter((k) => k.startsWith('f:')).length, 0, 'nothing stored for an empty answer');
  const { createHash } = await import('node:crypto');
  mem.set('f:' + createHash('sha1').update(JSON.stringify(p.flightSearch)).digest('hex'), { data: { offers: [] }, searchedAt: '2026-11-15T10:00:00Z' });
  const recorded = await createBuilder({ store, env: { GERBI_SUPPLIER_FIXTURES: '1' } }).flights(p.flightSearch, p.request, 'he');
  assert.equal(recorded.status, 'live'); assert.ok(recorded.picks.length >= 1);
  assert.equal(calls, 1);
});

test('guests get an empty package list (no 401 on the account page); saving still needs a session', async () => {
  await withServer(async (call) => {
    const r = await call('GET', '/api/account/packages');
    assert.equal(r.status, 200); assert.deepEqual(r.data.packages, []);
    assert.equal((await call('POST', '/api/account/packages', { id: 'a'.repeat(16) })).status, 401);
  });
});
