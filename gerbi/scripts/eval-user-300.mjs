// 300 natural first messages written from the user's side only (tests/fixtures/user-300.json, labelled by hand without
// reading the code) → parseTrip → planPackage, exactly as the server runs them. Checks what was understood (travellers,
// length, month, dates, budget, needs, styles) and what was chosen (destination, route, exclusions, flight length, tags).
//   node scripts/eval-user-300.mjs          → score + failures by field
//   node scripts/eval-user-300.mjs --all    → every failing case
//   node scripts/eval-user-300.mjs --id 17  → one case in full
//   node scripts/eval-user-300.mjs --model  → the model reads each request first (trip_tags, needs a provider key such as
//     DEEPSEEK_API_KEY); answers are cached in tests/fixtures/trip-tags-cache.json, so a rerun is free and offline
import { readFile, writeFile } from 'node:fs/promises';
import { parseTrip, planPackage, mergeModel } from '../dist/trip-builder.mjs';
import { byId } from '../dist/catalog.mjs';

const TODAY = '2026-11-17', FX = { rates: { USD: 3.65, EUR: 3.95, ILS: 1 } };
const CASES = JSON.parse(await readFile(new URL('../tests/fixtures/user-300.json', import.meta.url), 'utf8'));
const args = process.argv.slice(2), only = args.includes('--id') ? Number(args[args.indexOf('--id') + 1]) : 0, withModel = args.includes('--model');
// Model mode: a file-backed cache in the gateway's get/set shape.
const cacheUrl = new URL('../tests/fixtures/trip-tags-cache.json', import.meta.url);
const memo = withModel ? JSON.parse(await readFile(cacheUrl, 'utf8').catch(() => '{}')) : {};
const cache = { get: async (k) => memo[k] ?? null, set: async (k, v) => { memo[k] = v; } };
const tagger = withModel ? (await import('../backend/llm-partner.mjs')).partnerTripTags : null;
const read = {};
if (withModel) {
  const todo = CASES.filter((c) => !only || c.id === only);
  for (let i = 0; i < todo.length; i += 8) await Promise.all(todo.slice(i, i + 8).map(async (c) => { read[c.id] = await tagger(cache, c.text, { today: TODAY, lang: c.lang }).catch(() => null); }));
  await writeFile(cacheUrl, JSON.stringify(memo));
  const miss = todo.filter((c) => !read[c.id]).length;
  if (miss) console.log(`model: no answer for ${miss}/${todo.length} (no key, timeout or invalid) – those run on the rules`);
}

export function check(c) {
  const r = mergeModel(parseTrip(c.text, { today: TODAY, lang: c.lang, fx: FX }), read[c.id], { today: TODAY }), p = planPackage(r, { today: TODAY }), e = c.expect || {}, bad = [];
  const fail = (field, got, want) => bad.push({ field, got: JSON.stringify(got), want: JSON.stringify(want) });
  const eq = (field, got, want) => { if (want !== undefined && JSON.stringify(got) !== JSON.stringify(want)) fail(field, got, want); };
  // Understanding (the request as parsed, before any budget fit changes the plan).
  // Babies (under 2) are counted apart from children on both sides, whichever way the parser holds them.
  const babies = Math.max(r.infants || 0, r.childAges.filter((a) => a < 2).length);
  eq('adults', r.adults, e.adults); eq('children', r.children - babies, e.children); eq('infants', babies, e.infants);
  if (e.childAges) eq('childAges', r.childAges.filter((a) => a >= 2).sort((a, b) => a - b), e.childAges.filter((a) => a >= 2).sort((a, b) => a - b));
  eq('nights', r.nights, e.nights);
  if (e.nightsRange && !(r.nights >= e.nightsRange[0] && r.nights <= e.nightsRange[1])) fail('nights', r.nights, e.nightsRange);
  const month = r.month || (r.start ? Number(r.start.slice(5, 7)) : 0);
  if (e.month && month !== e.month) fail('month', month, e.month);
  if (e.monthAny && !e.monthAny.includes(month)) fail('month', month, e.monthAny);
  eq('start', r.start, e.start); eq('end', r.end, e.end);
  if (e.budget !== undefined && !(r.budget && Math.abs(r.budget - e.budget) <= Math.max(50, e.budget * 0.03))) fail('budget', r.budget, e.budget);
  if (e.cheap && r.budgetLevel !== 'low') fail('cheap', r.budgetLevel, 'low');
  if (e.luxury && r.budgetLevel !== 'high' && !(r.needs.minStars >= 5)) fail('luxury', r.budgetLevel, 'high');
  for (const [k, v] of Object.entries(e.needs || {})) if (r.needs[k] !== v) fail(`needs.${k}`, r.needs[k], v);
  for (const s of e.styles || []) if (!r.styles.includes(s)) fail(`style.${s}`, r.styles, s);
  // What was chosen.
  // Bases of one destination (Tokyo → Kyoto) are one place on the route.
  const stops = (p.stops?.length ? p.stops.map((s) => s.id) : p.destination ? [p.destination.id] : []).filter((id, i, all) => id !== all[i - 1]);
  if (!stops.length && (e.dest || e.route)) fail('destination', null, e.dest || e.route);
  if (e.route && JSON.stringify(stops) !== JSON.stringify(e.route)) fail('route', stops, e.route);
  if (e.dest && stops.length && !stops.every((id) => e.dest.includes(id))) fail('dest', stops, e.dest);
  if (e.notDest && stops.some((id) => e.notDest.includes(id))) fail('notDest', stops, e.notDest);
  if (e.maxFlightHours && stops.some((id) => byId(id).flightHours > e.maxFlightHours)) fail('maxFlightHours', stops.map((id) => byId(id).flightHours), e.maxFlightHours);
  if (e.tagsAny && stops.some((id) => !e.tagsAny.some((t) => byId(id).tags.includes(t)))) fail('tagsAny', stops, e.tagsAny);
  return { c, r, p, stops, bad };
}

const results = CASES.filter((c) => !only || c.id === only).map(check);
if (only) {
  const { c, r, p, stops, bad } = results[0];
  console.log(c.text, '\n', JSON.stringify(c.expect), '\n→', JSON.stringify({ adults: r.adults, children: r.children, ages: r.childAges, infants: r.infants, nights: r.nights, start: r.start, end: r.end, month: r.month, budget: r.budget, level: r.budgetLevel, styles: r.styles, needs: r.needs, dest: r.destinations, countries: r.countries, regions: r.regions, maxFH: r.maxFlightHours }), '\n→ stops', stops, '\n', bad, '\n', p.assumed);
  process.exit(0);
}
const ok = results.filter((x) => !x.bad.length).length, byField = {};
for (const x of results) for (const b of x.bad) byField[b.field] = (byField[b.field] || 0) + 1;
const he = results.filter((x) => x.c.lang === 'he'), en = results.filter((x) => x.c.lang === 'en');
const pct = (xs) => `${xs.filter((x) => !x.bad.length).length}/${xs.length}`;
console.log(`user-300${withModel ? ' (model + rules)' : ''}: ${ok}/${results.length} (${(100 * ok / results.length).toFixed(1)}%) · Hebrew ${pct(he)} · English ${pct(en)}`);
console.log(Object.entries(byField).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · '));
for (const x of results.filter((y) => y.bad.length).slice(0, args.includes('--all') ? 1e9 : 25))
  console.log(`✗ #${x.c.id} ${x.c.text}\n   ${x.bad.map((b) => `${b.field}: got ${b.got} want ${b.want}`).join(' | ')}`);
