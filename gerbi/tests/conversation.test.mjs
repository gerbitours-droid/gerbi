// The builder as a conversation (owner 18.11.2026): a first request, then follow-ups that refine it; specific wishes
// (an airline, flight times, the hotel's area, the pace, what to skip) reach the plan and the flight picks.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseTrip, planPackage } from '../dist/trip-builder.mjs';
import { parsePrefs, refineRequest, describeChange, mergePrefs } from '../dist/trip-prefs.mjs';
import { flightPicks, byPrefs } from '../backend/build.mjs';
import { offerFacts } from '../dist/flight-view.mjs';

const TODAY = '2026-11-18';
const parse = (text) => parseTrip(text, { today: TODAY });
// What the server does on every turn: parse the first message, refine it with each follow-up.
const talk = (...msgs) => msgs.slice(1).reduce((r, m) => refineRequest(r, parse(m), m), parse(msgs[0]));
const plan = (...msgs) => planPackage(talk(...msgs), { today: TODAY });

test('wishes in a message: airlines (only / prefer / avoid / no low-cost), times, bag, hotel area and type, pace, skip and more', () => {
  assert.deepEqual(parsePrefs('רק אל על').flight.only, ['el al']);
  assert.deepEqual(parsePrefs('עדיף ישראייר').flight.prefer, ['israir']);
  assert.deepEqual(parsePrefs('בלי ריינאייר ובלי וויז').flight.avoid, ['wizz', 'ryanair']);
  assert.deepEqual(parsePrefs('no low-cost airlines please').flight.avoid.sort(), ['easyjet', 'flydubai', 'pegasus', 'ryanair', 'vueling', 'wizz']);
  assert.equal(parsePrefs('בלי טיסות לילה').flight.noNight, true);
  assert.deepEqual(parsePrefs('לא לקום מוקדם').flight.out, ['afternoon', 'evening']);
  assert.equal(parsePrefs('עם מזוודה רשומה').flight.checkedBag, true);
  assert.equal(parsePrefs('מלון על הים').hotel.area, 'beach');
  assert.equal(parsePrefs('hotel in the city centre').hotel.area, 'center');
  assert.equal(parsePrefs('אנחנו מעדיפים דירה').hotel.type, 'apartment');
  assert.equal(parsePrefs('קצב יותר רגוע').pace, 'relaxed');
  assert.deepEqual(parsePrefs('בלי מוזיאונים, יותר שווקים').avoidKinds, ['museum']);
  assert.deepEqual(parsePrefs('בלי מוזיאונים, יותר שווקים').moreKinds, ['market']);
  // A later choice replaces an earlier one; things to skip add up.
  const m = mergePrefs({ flight: { only: ['el al'] }, avoidKinds: ['museum'] }, { flight: { only: ['israir'] }, avoidKinds: ['religious'] });
  assert.deepEqual(m.flight.only, ['israir']); assert.deepEqual(m.avoidKinds, ['museum', 'religious']);
});

test('a conversation: each follow-up changes only what it says, and the reply says what changed', () => {
  const r0 = parse('זוג לרומא 5 לילות במאי');
  assert.deepEqual(talk('זוג לרומא 5 לילות במאי', 'רק אל על').prefs.flight.only, ['el al']);
  assert.equal(talk('זוג לרומא 5 לילות במאי', 'עוד לילה').nights, 6);
  assert.equal(talk('זוג לרומא 5 לילות במאי', 'לילה פחות').nights, 4);
  assert.deepEqual(talk('זוג לרומא 5 לילות במאי', 'במקום רומא – ברצלונה').destinations, ['barcelona']);
  assert.deepEqual(talk('זוג לרומא 5 לילות במאי', 'תוסיף גם פירנצה').destinations, ['rome', 'florence-tuscany']);
  assert.deepEqual(talk('זוג לרומא ופירנצה 8 לילות', 'בלי פירנצה').destinations, ['rome']);
  const many = talk('זוג לרומא 5 לילות במאי', 'רק אל על', 'עוד לילה', 'מלון 5 כוכבים על הים');
  assert.deepEqual([many.nights, many.adults, many.prefs.flight.only, many.needs.minStars, many.prefs.hotel.area, many.destinations], [6, 2, ['el al'], 5, 'beach', ['rome']], 'the turns add up');
  assert.equal(talk('זוג לרומא 5 לילות במאי', 'יותר זול').budgetLevel, 'low');
  assert.equal(talk('זוג לרומא 5 לילות במאי', 'מצטרפים אלינו 2 ילדים בני 6 ו-9').children, 2);
  // The plan follows: no museum when they said so, a slower pace means fewer items a day.
  const p = plan('זוג לרומא 5 לילות במאי', 'בלי מוזיאונים, קצב יותר רגוע');
  assert.ok(!p.itinerary.some((d) => d.items.some((x) => x.kind === 'museum')));
  assert.ok(p.itinerary.every((d) => d.items.length <= 2));
  // The reply.
  const a = planPackage(r0, { today: TODAY }), b = plan('זוג לרומא 5 לילות במאי', 'רק אל על', 'עוד לילה');
  const said = describeChange(a, b, 'he');
  assert.ok(said.some((x) => /6 לילות/.test(x)) && said.some((x) => /רק אל על/.test(x)), said.join(' | '));
});

test('flight picks keep the hard wishes (only / avoid / direct / no night) and say when one cannot be met', () => {
  const data = JSON.parse(readFileSync(new URL('./fixtures/build/flights.json', import.meta.url), 'utf8'));
  const facts = data.offers.map((o) => offerFacts(o, data)).filter((f) => f.price);
  const only = (key) => flightPicks(data, { adults: 2, prefs: { flight: { only: [key] } } });
  assert.ok(only('israir').every((p) => p.carriers.some((c) => /israir/i.test(c))), 'only Israir');
  assert.ok(!only('israir')[0].unmet);
  assert.deepEqual(only('el al')[0].unmet, ['only'], 'no El Al in this search → said, closest shown');
  const avoid = flightPicks(data, { adults: 2, prefs: { flight: { avoid: ['wizz', 'aegean'] } } });
  assert.ok(avoid.length && avoid.every((p) => !p.carriers.some((c) => /wizz|aegean/i.test(c))));
  const direct = byPrefs(facts, { needs: { direct: true } });
  assert.ok(direct.facts.every((f) => f.stops === 0) || direct.unmet.includes('direct'));
});
