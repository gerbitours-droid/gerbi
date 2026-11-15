// Aggregated flight-search counters for the owner's daily digest (spec 22 §4.6): per day, how many searches, which
// routes, which departure months, party sizes, multi-city share and searches with no results. Counts only — no IP,
// no ids, no free text. One KV document per day, kept 120 days; writes are best-effort and never block a search.
const TTL = 120 * 86400;
const bump = (map, key, max = 200) => { if (key in map || Object.keys(map).length < max) map[key] = (map[key] || 0) + 1; };

export function createSearchStats(store, { now = () => Date.now() } = {}) {
  let queue = Promise.resolve();
  const dayOf = (t) => new Date(t).toISOString().slice(0, 10);
  function record(request, offers) {
    const legs = request?.originDestinations || [];
    if (!legs.length) return queue;
    const day = dayOf(now());
    queue = queue.then(async () => {
      const doc = (await store.get(`day:${day}`).catch(() => null)) || { day, searches: 0, zero: 0, multi: 0, oneway: 0, routes: {}, months: {}, party: {} };
      doc.searches++;
      if (!offers) doc.zero++;
      if (legs.length > 2 || (legs.length === 2 && legs[1].destination?.code !== legs[0].origin?.code)) doc.multi++;
      else if (legs.length === 1) doc.oneway++;
      bump(doc.routes, `${legs[0].origin?.code}-${legs[0].destination?.code}`);
      bump(doc.months, String(legs[0].date || '').slice(0, 7));
      const party = (request.passengers?.ptcList || []).reduce((n, p) => n + (p.count || 0), 0);
      bump(doc.party, party >= 5 ? '5+' : String(party));
      await store.set(`day:${day}`, doc, TTL);
    }).catch(() => {});
    return queue;
  }
  async function summary(days = 7) {
    const out = { days, searches: 0, zero: 0, multi: 0, oneway: 0, routes: {}, months: {}, party: {}, byDay: [] };
    for (let i = 0; i < Math.min(days, 60); i++) {
      const day = dayOf(now() - i * 86400000), doc = await store.get(`day:${day}`).catch(() => null);
      out.byDay.push({ day, searches: doc?.searches || 0 });
      if (!doc) continue;
      for (const k of ['searches', 'zero', 'multi', 'oneway']) out[k] += doc[k] || 0;
      for (const k of ['routes', 'months', 'party']) for (const [key, n] of Object.entries(doc[k] || {})) out[k][key] = (out[k][key] || 0) + n;
    }
    return out;
  }
  return { record, summary, flush: () => queue };
}

export const top = (map, n = 5) => Object.entries(map || {}).sort((a, b) => b[1] - a[1]).slice(0, n);
