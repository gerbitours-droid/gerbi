// Query memory (spec §3): what people with the same request actually chose, as a bounded boost m ∈ (−1, 1).
// Stores aggregates per hashed signature only – no text, no user id, no IP.
import crypto from 'node:crypto';

export const EVENT_WEIGHTS = { impression: 0, open: 0.3, compare: 0.5, verify: 1, share: 1.5, save: 2, dismiss: -0.5 };
export const HALF_LIFE_DAYS = 30, PRIOR_STRENGTH = 5, LEVEL_BLEND = 10;
const DAY = 86400000;

const bucket = (n, edges, labels) => labels[edges.findIndex(edge => n <= edge)] ?? labels.at(-1);
const month = brief => (brief.start ? Number(brief.start.slice(5, 7)) : null) || brief.month || '';
export function canonical(brief = {}, level = 'fine') {
  const destination = [...(brief.want || []), brief.destination].filter(Boolean).sort().join(',');
  const base = { o: brief.origin || 'TLV', d: destination, m: month(brief), k: (brief.children || 0) > 0 ? 1 : 0 };
  if (level === 'coarse') return base;
  return { ...base, t: brief.tripType === 'oneway' ? 'ow' : 'rt', p: bucket((brief.adults || 2) + (brief.children || 0), [1, 2, 4], ['1', '2', '3-4', '5+']),
    n: brief.nights ? bucket(brief.nights, [3, 7], ['1-3', '4-7', '8+']) : '', s: ['beach', 'city', 'relaxation', 'family', 'couple'].filter(key => brief[key] === true).join(',') };
}
export const signature = (brief, level) => crypto.createHash('sha256').update(JSON.stringify(canonical(brief, level))).digest('hex').slice(0, 24);

const decay = (value, from, to) => value * 2 ** (-(to - from) / (HALF_LIFE_DAYS * DAY));

// One stats document per signature: { items: { key: { a, n, at } }, a, n } with decayed sums.
export function recordEvent(doc, item, event, now = Date.now()) {
  const weight = EVENT_WEIGHTS[event];
  if (weight === undefined) throw new Error('unsupported_event');
  const next = { a: 0, n: 0, items: {}, ...doc };
  const stats = next.items[item] || { a: 0, n: 0, at: now };
  stats.a = decay(stats.a, stats.at, now) + weight; stats.n = decay(stats.n, stats.at, now) + (event === 'impression' ? 1 : 0); stats.at = now;
  next.items = { ...next.items, [item]: stats };
  next.a = (next.a || 0) + weight; next.n = (next.n || 0) + (event === 'impression' ? 1 : 0);
  // ponytail: cap items per signature; the long tail carries no signal.
  const keys = Object.keys(next.items);
  if (keys.length > 300) for (const key of keys.sort((x, y) => next.items[x].at - next.items[y].at).slice(0, keys.length - 300)) delete next.items[key];
  return next;
}

// Beta-smoothed lift against the signature's own mean rate; 0 without data.
export function lift(doc, item, now = Date.now()) {
  const stats = doc?.items?.[item];
  if (!stats) return { m: 0, n: 0 };
  const a = decay(stats.a, stats.at, now), n = decay(stats.n, stats.at, now);
  const r0 = doc.n > 0 ? Math.max(0, doc.a) / doc.n : 0.05;
  const r = (a + PRIOR_STRENGTH * r0) / (n + PRIOR_STRENGTH);
  return { m: Math.tanh((r - r0) / Math.max(r0, 0.05)), n };
}

// Fine signature first; a sparse one leans on the coarse level until it has data.
export function blendedBoost(fineDoc, coarseDoc, item, now = Date.now()) {
  const fine = lift(fineDoc, item, now), coarse = lift(coarseDoc, item, now);
  return (fine.n * fine.m + LEVEL_BLEND * coarse.m) / (fine.n + LEVEL_BLEND);
}

export class QueryMemory {
  constructor(store) { this.store = store; }
  async boosts(brief, items) {
    const [fine, coarse] = await Promise.all([this.store.get(signature(brief, 'fine')), this.store.get(signature(brief, 'coarse'))]);
    return Object.fromEntries(items.slice(0, 200).map(item => [item, Math.round(blendedBoost(fine, coarse, item) * 1000) / 1000]));
  }
  async event(brief, item, event) {
    for (const level of ['fine', 'coarse']) {
      const key = signature(brief, level);
      await this.store.set(key, recordEvent(await this.store.get(key), item, event), 180 * 86400);
    }
  }
}
