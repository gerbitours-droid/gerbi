// Spec 28 §ג: the day-by-day plan – request scoring, pace gates by traveller profile, one area per day in country-sized
// destinations, day trips every 3–4 nights without duplicates, declared free days, seasons, Shabbat flights, and the
// destination choice it relies on (names without "The", a country = a choice, all-inclusive, ski by hemisphere).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTrip, planPackage, buildItinerary, pace, travellerProfile, countrySized, weekday, L } from '../dist/trip-builder.mjs';
import { byId, search, rank } from '../dist/catalog.mjs';
import { t } from '../dist/i18n.mjs';

const TODAY = '2026-11-16';
const plan = (text, opts = {}) => planPackage(parseTrip(text, { today: TODAY, ...opts }), { today: TODAY, ...opts });
const kinds = (p) => p.itinerary.map((d) => d.kind);
const catalogItem = (dest, name) => dest.attractions.find((a) => a.name.he === name || a.name.en === name);

test('pace by traveller profile: toddlers, young kids, school-age kids, teens, adults', () => {
  const r = (children, childAges, extra = {}) => ({ adults: 2, children, childAges, infants: 0, styles: [], ...extra });
  assert.equal(travellerProfile(r(2, [2, 6])), 'toddlers');
  assert.equal(travellerProfile(r(1, [7])), 'kids');
  assert.equal(travellerProfile(r(2, [])), 'kids', 'unknown ages count as kids');
  assert.equal(travellerProfile(r(2, [14, 16])), 'teens');
  assert.equal(travellerProfile(r(0, [])), 'adults');
  assert.deepEqual([pace(r(2, [3, 5])).hours, pace(r(2, [3, 5])).items], [5, 2]);
  assert.deepEqual([pace(r(2, [8, 10])).hours, pace(r(2, [8, 10])).items], [7, 3]);
  assert.deepEqual([pace(r(2, [14, 16])).hours, pace(r(2, [14, 16])).items], [8, 3], 'teens are not paced like small children');
  assert.equal(pace(r(0, [], { styles: ['relaxation'] })).hours, 5);
});

test('toddlers: nothing longer than their day (first item and day trips included), one museum a day, no long museum', () => {
  const p = plan('זוג עם 2 ילדים בני 3 ו-5, 5 לילות ברומא באפריל'), { hours } = pace(p.request), rome = byId('rome');
  for (const d of p.itinerary) {
    assert.ok(d.items.every((x) => x.durationH <= hours), `D${d.day} ${d.items.map((x) => `${x.name} ${x.durationH}h`)}`);
    assert.ok(d.items.reduce((s, x) => s + x.durationH, 0) <= hours);
    assert.ok(d.items.filter((x) => ['museum', 'religious'].includes(x.kind)).length <= 1, `D${d.day}: two museums/churches`);
    assert.ok(!d.items.some((x) => x.kind === 'museum' && x.durationH >= 3));
    assert.ok(!d.items.some((x) => (catalogItem(rome, x.name)?.tags || []).includes('nightlife')));
  }
  assert.ok(!p.itinerary.some((d) => d.items.some((x) => /פומפיי/.test(x.name))), 'a 9-hour day trip is not for a 3-year-old');
});

test('adults never get kids\' water parks they did not ask for; nightlife friends get their night out (as the evening item)', () => {
  const lux = plan('Luxury trip to Dubai, 5 nights in January, 5-star hotel, 2 adults', { lang: 'en' }), dubai = byId('dubai');
  assert.ok(lux.itinerary.flatMap((d) => d.items).every((x) => !(catalogItem(dubai, x.name)?.tags || []).some((tag) => ['with_children', 'water_slides'].includes(tag))));
  const night = plan('אנחנו 4 חברים, 3 לילות בבודפשט, חיי לילה ומסיבות'), bp = byId('budapest');
  const day = night.itinerary.find((d) => d.items.some((x) => (catalogItem(bp, x.name)?.tags || []).includes('nightlife')));
  assert.ok(day, 'a nightlife place is planned');
  assert.ok((catalogItem(bp, day.items.at(-1).name)?.tags || []).includes('nightlife'), 'and it closes the day');
});

test('days: at most two of a kind, no place twice, a day trip never repeats a planned attraction', () => {
  for (const text of ['זוג, 5 לילות בלונדון, מוזיאונים והיסטוריה', 'All inclusive in Phuket in February, 10 nights, 2 adults, relaxation and beach', 'Couple, 3-night city break in Rome in March, culture and food',
    'זוג, 7 לילות בגאורגיה ביוני, טבע והרים, עם רכב', 'Hiking and nature in Slovenia, 6 nights in June, 2 adults, no car', "We don't know where to go, 2 adults, cheap, 5 nights in March"]) {
    const p = plan(text, { lang: /[א-ת]/.test(text) ? 'he' : 'en' });
    for (const d of p.itinerary) for (const k of new Set(d.items.map((x) => x.kind))) assert.ok(d.items.filter((x) => x.kind === k).length <= 2, `${text} D${d.day}: 3× ${k}`);
    const names = p.itinerary.flatMap((d) => d.items.map((x) => x.name));
    assert.equal(new Set(names).size, names.length, text);
  }
  const phuket = plan('All inclusive in Phuket in February, 10 nights, 2 adults, relaxation and beach', { lang: 'en' });
  const all = phuket.itinerary.flatMap((d) => d.items.map((x) => x.name)).join(' | ');
  assert.ok(!(/Phi Phi Islands & Maya Bay/.test(all) && /The Phi Phi Islands/.test(all)), all);
});

test('long trips: a day trip every 3–4 nights (never on consecutive days) and declared free days with ideas – never an empty day', () => {
  for (const text of ['זוג, 12 לילות בטוסקנה ופירנצה בספטמבר, עם רכב', 'משפחה עם ילדים בני 5 ו-8, 14 לילות בפלורידה באוגוסט', 'זוג, 10 לילות ביפן באפריל', 'אני לבד, 10 לילות בבנגקוק בפברואר']) {
    const p = plan(text);
    assert.ok(!p.itinerary.some((d) => d.kind === 'full' && !d.items.length), `${text}: an empty full day`);
    for (const d of p.itinerary.filter((x) => x.kind === 'free')) {
      assert.equal(d.title, t('build.day.free', {}, 'he')); assert.equal(d.items.length, 0);
      assert.ok(d.ideas.length >= 2 && d.ideas.length <= 3, `${text}: ${d.ideas}`); assert.ok(d.ideas.every((x) => d.note.includes(x)));
    }
    const trips = p.itinerary.map((d, i) => (d.kind === 'daytrip' ? i : -1)).filter((i) => i >= 0);
    assert.ok(trips.every((i, k) => k === 0 || i - trips[k - 1] > 1), `${text}: consecutive day trips`);
  }
  const tuscany = plan('זוג, 12 לילות בטוסקנה ופירנצה בספטמבר, עם רכב');
  assert.ok(kinds(tuscany).filter((k) => k === 'daytrip').length >= 2, 'more than one day trip in 12 nights');
  const en = plan('Couple, 10 nights in Japan in April', { lang: 'en' }).itinerary.find((d) => d.kind === 'free');
  if (en) assert.match(en.note, /^No fixed plan today\. Ideas: /);
});

test('free-day ideas offer the long kids\' parks the pace kept out of the plan (Florida with a 5-year-old)', () => {
  const p = plan('משפחה עם ילדים בני 5 ו-8, 14 לילות בפלורידה באוגוסט');
  assert.ok(!p.itinerary.some((d) => d.items.some((x) => /מג׳יק קינגדום/.test(x.name))), 'a 10-hour park is not planned for a 5-year-old');
  assert.ok(p.itinerary.some((d) => d.kind === 'free' && /מג׳יק קינגדום/.test(d.note)), 'but it is offered as an idea');
});

test('country-sized destinations: each day stays in one area; a long flight leaves the arrival day free', () => {
  assert.ok(countrySized(byId('japan')) && countrySized(byId('florida')) && countrySized(byId('vietnam')) && !countrySized(byId('rome')));
  for (const text of ['זוג, 10 לילות ביפן באפריל', 'זוג, 9 לילות בוייטנאם בנובמבר', 'משפחה עם ילדים בני 5 ו-8, 14 לילות בפלורידה באוגוסט', 'זוג, 7 לילות בכרתים באוגוסט, ים וחופים, עם רכב']) {
    const p = plan(text), dest = byId(p.destination.id);
    for (const d of p.itinerary.filter((x) => x.kind === 'full')) {
      const areas = d.items.map((x) => catalogItem(dest, x.name)?.area || `?${x.name}`);
      assert.ok(new Set(areas).size <= 1, `${text} D${d.day}: ${areas.join(' + ')}`);
    }
  }
  const japan = plan('זוג, 10 לילות ביפן באפריל');
  assert.equal(japan.itinerary[0].items.length, 0); assert.match(japan.itinerary[0].note, /טיסה ארוכה/);
  // 10 nights in Japan are bases (Tokyo → Kyoto → Osaka): each day carries its base's name, flown in to Tokyo and home from Osaka.
  assert.ok(japan.itinerary.some((d) => /היום באזור/.test(d.note)) || japan.stops.length > 1, 'the area of the day is named');
  assert.deepEqual(japan.stops.map((s) => L(s.name, 'en')), ['Tokyo', 'Kyoto', 'Osaka']);
  assert.deepEqual(japan.flightSearch.originDestinations.map((o) => `${o.origin.code}-${o.destination.code}`), ['TLV-TYO', 'OSA-TLV']);
  assert.ok(japan.hotelSearches.map((h) => h.city).join() === 'TYO,UKY,OSA');
  // Areas are visited one after the other, never back and forth.
  const seq = japan.itinerary.filter((d) => d.kind === 'full').map((d) => catalogItem(byId('japan'), d.items[0].name).area);
  assert.deepEqual(seq.filter((a, i) => a !== seq[i - 1]), [...new Set(seq)]);
});

test('seasons: no beach in a cold sea (with a warning), ski only in its months – by hemisphere', () => {
  const cy = plan('Beach holiday in Cyprus in January, 5 nights, 2 adults', { lang: 'en' }), cyprus = byId('cyprus');
  assert.ok(!cy.itinerary.flatMap((d) => d.items).some((x) => catalogItem(cyprus, x.name)?.kind === 'beach'));
  assert.equal(cy.warnings.length, 1); assert.match(cy.warnings[0], /sea in Cyprus is cold/); assert.ok(cy.practical.season.startsWith(cy.warnings[0]));
  assert.deepEqual(plan('זוג, 7 לילות בכרתים באוגוסט, ים וחופים, עם רכב').warnings, []);
  const july = plan('סקי ביולי, 6 לילות, תציעו');
  assert.notEqual(july.destination.id, 'swiss-alps', 'July is not ski season in the Alps');
  assert.equal(july.destination.id, 'new-zealand');
  assert.equal(plan('סקי בפברואר, 6 לילות, 2 מבוגרים, תציעו').suggestions[0].id !== 'new-zealand', true);
});

test('destination names: "Swiss Alps" without "The"; a country is a choice of 2–3, not a route; explicit routes stay', () => {
  assert.equal(plan('Swiss Alps in August, 7 nights, nature and mountains, with a car, 2 adults', { lang: 'en' }).destination.id, 'swiss-alps');
  assert.equal(plan('Maldives honeymoon, 7 nights in February', { lang: 'en' }).destination.id, 'maldives');
  assert.equal(search('swiss alps')[0].id, 'swiss-alps');
  const gr = plan('משפחה עם 2 ילדים בני 5 ו-9, שבוע ביוון באוגוסט');
  assert.deepEqual(gr.stops, [], 'one base, not four islands in a week');
  assert.equal(byId(gr.destination.id).country.en, 'Greece');
  assert.ok(gr.suggestions.length >= 2 && gr.suggestions.length <= 3 && gr.suggestions.every((s) => byId(s.id).country.en === 'Greece'));
  assert.equal(gr.destination.id, gr.suggestions[0].id);
  assert.deepEqual(plan('זוג, רומא ופירנצה, 8 לילות במאי').stops.map((s) => s.id), ['rome', 'florence-tuscany']);
  assert.deepEqual(plan('זוג, 12 לילות בתאילנד, פוקט, בפברואר').destination.id, 'phuket', 'a city named with its country is that city');
  // The day trip to the next stop of the route is not planned as a day trip from the previous one.
  assert.ok(!plan('זוג, רומא ופירנצה, 8 לילות במאי').itinerary.some((d) => d.kind === 'daytrip' && /פירנצה/.test(d.items[0].name)));
});

test('ranking: all-inclusive counts, a short trip avoids a long-haul flight', () => {
  const ai = plan('חופשת הכל כלול עם ילדים בני 5 ו-10 ביוני, 6 לילות, תציעו');
  assert.ok(byId(ai.destination.id).tags.includes('all_inclusive'), ai.destination.id);
  const short = rank({ beach: true, month: 2, nights: 4 }).slice(0, 3);
  assert.ok(short.every((x) => x.destination.flightHours < 6), short.map((x) => x.destination.id).join());
});

test('Shabbat-observant: dates we choose never fly on Saturday, neither does an internal leg', () => {
  const p = plan('משפחה שומרת שבת עם ילדים בני 4 ו-7, כשר, לונדון, 6 לילות ביולי');
  assert.notEqual(weekday(p.request.start), 6); assert.notEqual(weekday(p.request.end), 6);
  assert.ok(p.assumed.some((x) => /שבת/.test(x)));
  assert.ok(p.itinerary.some((d) => d.kind === 'shabbat'));
  const route = plan('זוג שומרי שבת, רומא ואז סנטוריני, 9 לילות במאי');
  assert.ok(route.stops.every((s) => weekday(s.start) !== 6 && weekday(s.end) !== 6), route.stops.map((s) => s.start).join());
  assert.equal(route.stops.reduce((n, s) => n + s.nights, 0), 9);
});

// The catalog fields being added (spec 28 §ד) are optional; a fixture shows what they do when present.
const fixture = () => ({
  id: 'fixture', code: 'FIX', name: { he: 'עיר בדיקה', en: 'Test City' }, country: { he: 'מדינה', en: 'Testland' }, region: 'europe', bestMonths: [5, 6, 7, 8, 9], flightHours: 3,
  tags: ['city', 'beach'], transport: { carRecommended: false }, highlights: [{ he: 'מבצר', en: 'The fortress' }], areas: [{ name: { he: 'מרכז', en: 'Centre' } }, { name: { he: 'נמל', en: 'Harbour' } }],
  attractions: [
    { name: { he: 'כיכר', en: 'Main square' }, kind: 'landmark', durationH: 1, tags: ['culture'], area: 'Centre' },
    { name: { he: 'אוצר נסתר', en: 'Hidden gem' }, kind: 'landmark', durationH: 1.5, tags: [], area: 'Centre', mustSee: true },
    { name: { he: 'מבצר', en: 'The fortress' }, kind: 'landmark', durationH: 2, tags: ['culture'], area: 'Centre' },
    { name: { he: 'פסטיבל קיץ', en: 'Summer festival' }, kind: 'experience', durationH: 2, tags: ['culture'], area: 'Harbour', months: [7, 8] },
    { name: { he: 'בר על הגג', en: 'Rooftop bar' }, kind: 'experience', durationH: 2, tags: ['adults', 'evening'], area: 'Harbour' },
    { name: { he: 'פארק הרפתקאות', en: 'Adventure park' }, kind: 'park', durationH: 3, tags: ['teens', 'adventure'], area: 'Harbour' },
    { name: { he: 'מוזיאון', en: 'Museum' }, kind: 'museum', durationH: 2, tags: ['culture'], area: 'Centre' },
    { name: { he: 'שוק', en: 'Market' }, kind: 'market', durationH: 1, tags: ['food'], area: 'Harbour' }
  ],
  dayTrips: [{ name: { he: 'אי הדייגים', en: 'Fishermen island' }, hours: 1, note: { he: 'סירה', en: 'Boat' }, months: [6, 7, 8], priceIls: { low: 100, high: 200 } }]
});
const req = (text, start) => ({ ...parseTrip(text, { today: TODAY }), start, end: '' });

test('fixture: mustSee leads, months/seasonal day trips are skipped with a warning, adults-only kept from children, teens tag scores', () => {
  const may = buildItinerary([{ dest: fixture(), start: '2027-05-10', nights: 5 }], req('זוג', '2027-05-10'));
  const names = may.days.flatMap((d) => d.items.map((x) => x.name));
  assert.ok(names.includes('אוצר נסתר'), 'the mustSee item is planned although it matches no style');
  const firstFull = may.days.find((d) => d.kind === 'full');
  assert.ok(firstFull.items.some((x) => x.name === 'אוצר נסתר' || x.name === 'מבצר'), 'must-sees lead the first day');
  assert.ok(!names.includes('פסטיבל קיץ'), 'out of its months'); assert.ok(may.warnings.length === 1 && /עונתיות/.test(may.warnings[0]));
  assert.ok(!may.days.some((d) => d.kind === 'daytrip'), 'the seasonal day trip is not offered in May');
  const july = buildItinerary([{ dest: fixture(), start: '2027-07-10', nights: 5 }], req('זוג', '2027-07-10'));
  assert.ok(july.days.some((d) => d.kind === 'daytrip')); assert.deepEqual(july.warnings, []);
  const kids = buildItinerary([{ dest: fixture(), start: '2027-07-10', nights: 5 }], req('משפחה עם ילדים בני 6 ו-9', '2027-07-10'));
  assert.ok(!kids.days.some((d) => d.items.some((x) => x.name === 'בר על הגג')), 'adults-only stays out with children');
  const teens = buildItinerary([{ dest: fixture(), start: '2027-07-10', nights: 3 }], req('משפחה עם ילדים בני 14 ו-16', '2027-07-10'));
  const teenNames = teens.days.flatMap((d) => d.items.map((x) => x.name));
  assert.ok(teenNames.includes('פארק הרפתקאות'), 'teens get the teens-tagged park');
});

test('fixture: without the new fields nothing breaks (must-sees come from the highlights)', () => {
  const d = fixture();
  for (const a of d.attractions) { delete a.mustSee; delete a.months; }
  for (const x of d.dayTrips) { delete x.months; delete x.priceIls; }
  const it = buildItinerary([{ dest: d, start: '2027-05-10', nights: 5 }], req('זוג', '2027-05-10'));
  const first = it.days.find((x) => x.kind === 'full');
  assert.equal(first.items[0].name, 'מבצר', 'the highlighted fortress leads');
  assert.ok(it.days.some((x) => x.kind === 'daytrip'));
});
