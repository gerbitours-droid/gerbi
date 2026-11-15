// Tailor-made form from one free sentence (spec 22 §4.2). The rules part runs in the browser with zero calls;
// the server's AI result is merged in by mergeTailor, and every value is checked like a typed form value.
import { understandRequest } from './brief-engine.mjs';
import { places, countries, countryNameEn } from './places.mjs';
import { t, lang } from './i18n.mjs';
import { BUDGETS, FLEXIBILITY, STYLES, LIMITS } from './leads-validate.mjs';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const addDays = (day, n) => new Date(Date.parse(day) + n * 86400000).toISOString().slice(0, 10);
export const budgetBand = (ils) => (!ils ? 'open' : ils <= 5000 ? 'up5' : ils <= 10000 ? '5to10' : ils <= 20000 ? '10to20' : ils <= 40000 ? '20to40' : 'over40');

function destinationText(want, unknown, l = lang) {
  const left = new Set(want), names = [];
  for (const c of countries) if (c.codes.length > 1 && c.codes.every((code) => left.has(code))) { names.push(l === 'en' ? countryNameEn(c.names[0]) : c.names[0]); c.codes.forEach((code) => left.delete(code)); }
  for (const code of left) { const p = places.find((x) => x.code === code); if (p) names.push(p.name || p.names[0]); }
  // A word like "ביפן"/"ליפן" that no list knows is still the traveler's destination.
  if (!names.length) for (const w of unknown || []) { const m = /^[בל]([א-ת]{3,})$/.exec(w); if (m) { names.push(m[1]); break; } }
  return names.join(', ');
}

// → { fields, filled[] } where fields only holds what the text supported.
// l: the language of the notes it writes (the page language in the browser, Hebrew on the server unless given).
export function tailorFromText(text, today, l = lang) {
  const r = understandRequest(String(text || '').slice(0, 1500), {}, { today }), b = r.brief, f = {};
  const destinations = destinationText(b.want || [], r.coverage?.unknown, l);
  if (destinations) f.destinations = destinations.slice(0, LIMITS.destinations);
  if (DATE.test(b.start || '') && b.start >= today) { f.start = b.start; if (DATE.test(b.end || '') && b.end >= b.start) f.end = b.end; else if (b.nights) f.end = addDays(b.start, b.nights); f.flexibility = 'exact'; }
  else if (b.month) f.flexibility = 'month';
  if (!b.adultsAssumed && b.adults) f.adults = b.adults;
  else if (b.couple) f.adults = 2;
  if (b.children) f.children = b.children;
  if (b.budget && (b.budgetCurrency || 'ILS') === 'ILS') f.budget = budgetBand(b.budget);
  const styles = [b.beach && 'beach', b.city && 'city', (b.family || b.children > 0) && 'family', b.couple && 'romantic'].filter(Boolean);
  if (styles.length) f.styles = styles;
  const extras = [b.kosher && t('leads.fill.kosher', {}, l), b.shabbat && t('leads.fill.shabbat', {}, l), b.accessible && t('leads.fill.accessible', {}, l), b.month && !f.start && (b.nights ? t('leads.fill.monthNights', { month: b.month, nights: b.nights }, l) : t('leads.fill.month', { month: b.month }, l)), b.childAges?.length && t('leads.fill.childAges', { ages: b.childAges.join(', ') }, l)].filter(Boolean);
  if (extras.length) f.notes = extras.join(' · ');
  return { fields: f, filled: Object.keys(f) };
}

// Server/AI values re-checked against the form's own rules; anything else is dropped.
export function cleanTailor(v, today) {
  if (!v || typeof v !== 'object') return {};
  const out = {}, latest = addDays(today, 2 * 366);
  const text = (s, max) => (typeof s === 'string' ? s.replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, max) : '');
  const dest = text(v.destinations, LIMITS.destinations); if (dest.length >= 2) out.destinations = dest;
  if (DATE.test(v.start || '') && v.start >= today && v.start <= latest) { out.start = v.start; if (DATE.test(v.end || '') && v.end >= v.start && v.end <= latest) out.end = v.end; }
  if (Object.hasOwn(FLEXIBILITY, v.flexibility) && v.flexibility !== 'open') out.flexibility = out.start ? v.flexibility : v.flexibility === 'exact' ? 'days' : v.flexibility;
  if (Number.isInteger(v.adults) && v.adults >= 1 && v.adults <= 30) out.adults = v.adults;
  if (Number.isInteger(v.children) && v.children >= 1 && v.children <= 20) out.children = v.children;
  if (Object.hasOwn(BUDGETS, v.budget) && v.budget !== 'open') out.budget = v.budget;
  const styles = [...new Set(Array.isArray(v.styles) ? v.styles.filter((s) => Object.hasOwn(STYLES, s)) : [])];
  if (styles.length) out.styles = styles;
  const notes = text(v.notes, 300); if (notes) out.notes = notes;
  return out;
}

// Rules win where they have explicit evidence (numbers, dates, budget); the AI fills the rest and adds styles.
export function mergeTailor(rules, ai) {
  const out = { ...ai, ...rules };
  if (ai.styles || rules.styles) out.styles = [...new Set([...(rules.styles || []), ...(ai.styles || [])])];
  if (rules.notes && ai.notes && !rules.notes.includes(ai.notes)) out.notes = `${rules.notes} · ${ai.notes}`;
  if (!rules.destinations && ai.destinations) out.destinations = ai.destinations;
  return out;
}
