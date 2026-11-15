// Multi-city from the planner's free text (spec 10 + spec 22 §4.7): "מתל אביב לרומא ב־10.12, משם לפריז ב־14.12
// וחוזרים ב־18.12" → three legs. Deterministic and conservative: it needs a route cue ("משם", "ואז", "חוזרים מ…"),
// at least two named destinations and one exact date per flight; anything less returns null and the planner
// keeps its usual single-destination flow. The result is validated by the same rules as the multi-city form.
import { resolvePlace } from './places.mjs';
import { validateLegs, MAX_LEGS } from './multi-city-core.mjs';

const MONTHS = { ינואר: 1, פברואר: 2, מרץ: 3, מרס: 3, אפריל: 4, מאי: 5, יוני: 6, יולי: 7, אוגוסט: 8, ספטמבר: 9, אוקטובר: 10, נובמבר: 11, דצמבר: 12 };
const CUE = /משם|ומשם|ואז|אחר כך|אחרי זה|ממשיכים|ממשיך|נמשיך|חוזרים מ|חוזר מ|חוזרת מ|חזרה מ|ונחזור מ/;
const RETURN_FROM = /(?:חוזרים|חוזר|חוזרת|חזרה|נחזור)\s+מ/;
const pad = (n) => String(n).padStart(2, '0');

function datesIn(text, today) {
  const found = [], year = Number(today.slice(0, 4));
  const push = (index, d, m, y) => {
    if (!(d >= 1 && d <= 31 && m >= 1 && m <= 12)) return;
    let yy = y ? (y < 100 ? 2000 + y : y) : year, iso = `${yy}-${pad(m)}-${pad(d)}`;
    if (!y && iso < today) iso = `${++yy}-${pad(m)}-${pad(d)}`;
    if (!Number.isNaN(Date.parse(iso + 'T00:00:00Z')) && new Date(iso + 'T00:00:00Z').getUTCDate() === d) found.push({ index, iso });
  };
  for (const m of text.matchAll(/(?<![\d.])(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?(?![\d])/g)) push(m.index, +m[1], +m[2], m[3] ? +m[3] : 0);
  for (const m of text.matchAll(new RegExp(`(?<![\\d.])(\\d{1,2})\\s*(?:[בל]|ב־|ב-)?(${Object.keys(MONTHS).join('|')})`, 'g'))) push(m.index, +m[1], MONTHS[m[2]], 0);
  return found.sort((a, b) => a.index - b.index);
}

function placesIn(text) {
  const words = [...text.matchAll(/[\u05d0-\u05ea׳״"'A-Za-z]+/g)], out = [];
  for (let i = 0; i < words.length;) {
    let hit = null;
    for (const span of [2, 1]) {
      if (hit || i + span > words.length) continue;
      const raw = words.slice(i, i + span).map((w) => w[0]).join(' ');
      for (const cut of [0, 1, 2]) {
        const prefix = raw.slice(0, cut), rest = raw.slice(cut);
        if (cut && !/^[ולבמה]+$/.test(prefix)) break;
        const place = rest.length >= 3 ? resolvePlace(rest) : null;
        if (place?.names) { hit = { index: words[i].index, place, from: prefix.includes('מ'), span }; break; }
      }
    }
    if (hit) { out.push(hit); i += hit.span; } else i++;
  }
  // The same place twice in a row ("רומא… ברומא") counts once.
  return out.filter((p, i) => !i || p.place.code !== out[i - 1].place.code);
}

/** → { legs, origin } or null */
export function detectLegs(text, { today, origin = 'TLV' } = {}) {
  const t = String(text || '');
  if (!CUE.test(t)) return null;
  const dates = datesIn(t, today), mentions = placesIn(t);
  let start = origin;
  if (mentions[0]?.place.home && mentions[0].from) start = mentions.shift().place.code;
  const home = mentions.filter((m) => m.place.home), stops = mentions.filter((m) => !m.place.home).map((m) => m.place.code);
  if (stops.length < 2 || dates.length < 2) return null;
  let legs;
  const returnHome = home.length > 0 || /הביתה|לארץ|חוזרים ב|חזרה ב|ונחזור ב/.test(t);
  if (dates.length === stops.length + 1 || (returnHome && dates.length === stops.length + 1)) {
    legs = [start, ...stops].map((from, i, all) => ({ from, to: all[i + 1] || start, date: dates[i].iso }));
  } else if (dates.length === stops.length && stops.length === 2 && RETURN_FROM.test(t)) {
    legs = [{ from: start, to: stops[0], date: dates[0].iso }, { from: stops[1], to: start, date: dates[1].iso }]; // open jaw
  } else if (dates.length === stops.length) {
    legs = stops.map((to, i) => ({ from: i ? stops[i - 1] : start, to, date: dates[i].iso }));
  } else return null;
  if (legs.length > MAX_LEGS) return null;
  try { return { legs: validateLegs(legs, today), origin: start }; } catch { return null; }
}
