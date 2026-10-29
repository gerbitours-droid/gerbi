// Pairwise trade-off cases with an unambiguous right answer (tests/fixtures/ranking-cases.json).
import { readFile } from 'node:fs/promises';
import { scoreOffers } from '../dist/scoring.mjs';
const cases = JSON.parse(await readFile(new URL('../tests/fixtures/ranking-cases.json', import.meta.url), 'utf8'));
export const facts = (id, o) => ({ index: id, price: { value: o.price, currency: 'USD' }, totalMinutes: o.minutes, stops: o.stops, carriers: ['X' + id], longestLayover: o.wait || 0,
  overnight: Boolean(o.overnight), checked: 'unknown', airports: ['FCO'], legs: [{ minutes: o.minutes, segments: [{ marketingCarrier: { airline: { code: 'X' + id }, flightNumber: 1 }, departure: { time: '10:00' } }],
    summary: { stops: o.stops, dayOffset: 0, layovers: o.stops ? [{ minutes: o.wait || 0, overnight: Boolean(o.overnight), changeAirport: false }] : [] } }] });
let right = 0;
for (const c of cases) {
  const [b, w] = scoreOffers([facts('1', c.better), facts('2', c.worse)], c.brief);
  const ok = b.score > w.score; if (ok) right++;
  console.log(`${ok ? '✓' : '✗'} ${c.name}  (${b.score.toFixed(3)} vs ${w.score.toFixed(3)})`);
}
console.log(`${right}/${cases.length}`);
