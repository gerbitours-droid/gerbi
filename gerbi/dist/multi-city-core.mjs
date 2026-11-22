// Multi-city (2–5 legs, incl. open jaw): pure logic shared by the form, the share link and saved flights.
// Spec: docs/specs/10-multi-city-he.md. The supplier prices all legs together in one request.
import { resolvePlace, placeByCode, placeType } from './places.mjs';
import { t, lang } from './i18n.mjs';

export const MIN_LEGS = 2, MAX_LEGS = 5;
const DAY = /^\d{4}-\d{2}-\d{2}$/, CODE = /^[A-Z]{3}$/;
const addYear = today => new Date(Date.parse(today + 'T00:00:00Z') + 365 * 86400000).toISOString().slice(0, 10);
const fail = (message, index, part) => Object.assign(new Error(message), { field: `[data-leg="${index}"] [data-part="${part}"]`, index, part });

// legs: [{ from, to, date }] where from/to are what the traveler typed or picked. Returns codes; throws a Hebrew error.
export function validateLegs(legs, today) {
  if (!Array.isArray(legs) || legs.length < MIN_LEGS) throw fail(t('search.mc.tooFew', { min: MIN_LEGS }), 0, 'from');
  if (legs.length > MAX_LEGS) throw fail(t('search.mc.tooMany', { max: MAX_LEGS }), MAX_LEGS - 1, 'from');
  const limit = addYear(today);
  return legs.map((leg, i, all) => {
    const n = i + 1, from = resolvePlace(leg.from), to = resolvePlace(leg.to);
    if (!String(leg.from || '').trim()) throw fail(t('search.mc.noFrom', { n }), i, 'from');
    if (!from) throw fail(t('search.mc.unknownFrom', { place: leg.from, n }), i, 'from');
    if (!String(leg.to || '').trim()) throw fail(t('search.mc.noTo', { n }), i, 'to');
    if (!to) throw fail(t('search.mc.unknownTo', { place: leg.to, n }), i, 'to');
    if (from.code === to.code) throw fail(t('search.mc.same', { n }), i, 'to');
    if (!DAY.test(leg.date || '')) throw fail(t('search.mc.noDate', { n }), i, 'date');
    if (leg.date < today || leg.date > limit) throw fail(t('search.mc.dateRange', { n }), i, 'date');
    if (i && DAY.test(all[i - 1].date || '') && leg.date < all[i - 1].date) throw fail(t('search.mc.dateOrder', { n, prev: i }), i, 'date');
    return { from: from.code, to: to.code, date: leg.date };
  });
}

export const multiRequest = (legs, adults, children) => ({
  originDestinations: legs.map(l => ({ origin: { code: l.from, type: placeType(l.from) }, destination: { code: l.to, type: placeType(l.to) }, date: l.date })),
  passengers: { ptcList: [{ ptc: 'ADT', count: adults }, ...(children ? [{ ptc: 'CHD', count: children }] : [])] },
  sellingChannel: 'B2B', language: 'en_GB', timeout: 10
});

const cityOf = code => placeByCode(code)?.city || code;
export const nameOf = code => (lang === 'en' ? placeByCode(code)?.name : placeByCode(code)?.names?.[0]) || placeByCode(code)?.sub || code;
// "תל אביב ← רומא ← פריז ← תל אביב" (the arrow points at where the route goes: left on the Hebrew page); a leg that starts somewhere else than where the last one landed opens a new run.
export function routeText(legs) {
  const runs = [];
  legs.forEach((l, i) => { if (!i || cityOf(legs[i - 1].to) !== cityOf(l.from)) runs.push([l.from]); runs.at(-1).push(l.to); });
  return runs.map(run => run.map(nameOf).join(lang === 'en' ? ' → ' : ' ← ')).join(' · ');
}
// Legs the traveler must reach on their own: landing in Rome, the next flight leaves Paris.
export const groundGaps = legs => legs.flatMap((l, i) => (i && cityOf(legs[i - 1].to) !== cityOf(l.from) ? [{ index: i, from: legs[i - 1].to, to: l.from }] : []));
export const gapText = gap => t('search.mc.gap', { from: nameOf(gap.from), to: nameOf(gap.to) });
// "Round trip" for two legs that mirror each other; anything else is multi-city (incl. open jaw).
export const isRoundShape = legs => legs.length === 2 && cityOf(legs[0].to) === cityOf(legs[1].from) && cityOf(legs[0].from) === cityOf(legs[1].to);
export const legName = (i, multi) => (multi ? t('search.mc.flightN', { n: i + 1 }) : i === 0 ? t('search.mc.outbound') : t('search.mc.inbound'));

// Route in a stored record (last search, saved flight): codes and dates only, never trusted as-is.
export function cleanRoute(list) {
  if (!Array.isArray(list) || list.length < MIN_LEGS || list.length > MAX_LEGS) return null;
  const legs = list.map(l => ({ from: CODE.test(l?.from) ? l.from : '', to: CODE.test(l?.to) ? l.to : '', date: DAY.test(l?.date) ? l.date : '' }));
  if (legs.some((l, i) => !l.from || !l.to || l.from === l.to || !l.date || (i && l.date < legs[i - 1].date))) return null;
  return legs;
}

// Share link: "#/?type=multi&legs=TLV-ROM-2026-12-10,ROM-PAR-2026-12-14&adults=2&children=0". No prices, no ids.
export const multiLink = ({ legs, adults, children }) => '#/?' + new URLSearchParams({ type: 'multi', legs: legs.map(l => `${l.from}-${l.to}-${l.date}`).join(','), adults: String(adults), children: String(children) });
export function parseMultiLink(params) {
  const legs = cleanRoute(String(params.get('legs') || '').split(',').map(part => { const m = /^([A-Z]{3})-([A-Z]{3})-(\d{4}-\d{2}-\d{2})$/.exec(part); return m ? { from: m[1], to: m[2], date: m[3] } : null; }));
  const adults = Number(params.get('adults')), children = Number(params.get('children') || 0);
  if (!legs || !Number.isInteger(adults) || adults < 1 || !Number.isInteger(children) || children < 0 || adults + children > 9) return null;
  return { type: 'multi', legs, adults, children, origin: legs[0].from, to: legs.at(-1).to, start: legs[0].date, end: '', destination: routeText(legs) };
}
