// Pure date logic for the range picker (dates are 'YYYY-MM-DD' strings; weeks start on Sunday, as in Israel).
const pad = n => String(n).padStart(2, '0');
export const isoOf = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`; // m is 0-based
export const parseIso = iso => { const [y, m, d] = iso.split('-').map(Number); return { y, m: m - 1, d }; };
export function addDays(iso, days) {
  const { y, m, d } = parseIso(iso), date = new Date(Date.UTC(y, m, d + days));
  return isoOf(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}
export const addMonths = (y, m, n) => { const t = y * 12 + m + n; return { y: Math.floor(t / 12), m: ((t % 12) + 12) % 12 }; };
export const nightsBetween = (a, b) => (a && b ? Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000) : 0);
export const maxDate = today => addDays(today, 365); // the supplier accepts up to a year ahead

// Weeks of one month: null for the blank cells before the 1st and after the last day.
export function monthGrid(y, m) {
  const first = new Date(Date.UTC(y, m, 1)).getUTCDay(), days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => isoOf(y, m, i + 1))];
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
}

export const selectable = (iso, today) => Boolean(iso) && iso >= today && iso <= maxDate(today);

// One click in the calendar. Round trip: first click = departure, second = return (a click before the departure
// starts over from that day; the same day twice is a same-day return). One way: every click is the departure.
export function pickDate({ start = '', end = '' } = {}, iso, { oneWay = false } = {}) {
  if (oneWay) return { start: iso, end: '' };
  if (!start || end || iso < start) return { start: iso, end: '' };
  return { start, end: iso };
}

// How a day looks: in a chosen range, its ends, or the range previewed while hovering the return day.
export function dayState(iso, { start = '', end = '', hover = '' } = {}, today = '') {
  const last = end || (start && hover && hover >= start ? hover : '');
  return {
    disabled: !selectable(iso, today), today: iso === today,
    start: iso === start, end: Boolean(end) && iso === end,
    inRange: Boolean(start && last) && iso > start && iso < last, preview: !end && Boolean(last) && iso <= last && iso > start
  };
}
