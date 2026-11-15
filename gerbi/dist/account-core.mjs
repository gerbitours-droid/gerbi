// Customer accounts (spec 17): validation and saved-items merging shared by the browser and the server (the authority).
import { restoreSavedFlights } from './saved-flights.mjs';
import { restoreJourney } from './journey.mjs';
import { normalizeIsraeliPhone, isEmail } from './leads-validate.mjs';
import { trips } from './data.mjs';

export const PASSWORD_MIN = 8, PASSWORD_MAX = 128, NAME_MAX = 80, MAX_SEARCHES = 20;
export const MARKETING_TEXT = 'אשמח לקבל מג׳רבי טורס רעיונות לחופשה ומבצעים במייל ובוואטסאפ (אפשר להסיר בכל עת).';
export const PRIVACY_TEXT = 'קראתי את ההסבר על הפרטיות, ואני מאשר/ת לג׳רבי טורס לשמור את פרטי החשבון והשמירות שלי כדי לספק לי את השירות.';
const COMMON = new Set(['12345678', '123456789', '1234567890', 'password', 'password1', 'qwertyui', 'qwerty123', '11111111', '00000000', 'abcd1234', 'iloveyou', '87654321', 'aa123456', 'gerbitours']);
const tripIds = trips.map((trip) => trip.id);
const clean = (value, max) => (typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, '').trim() : '').slice(0, max + 1);

export const normalizeEmail = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

export function passwordProblem(password) {
  if (typeof password !== 'string' || password.length < PASSWORD_MIN) return `הסיסמה צריכה לכלול לפחות ${PASSWORD_MIN} תווים.`;
  if (password.length > PASSWORD_MAX) return `הסיסמה ארוכה מדי (עד ${PASSWORD_MAX} תווים).`;
  if (COMMON.has(password.toLowerCase()) || /^(.)\1+$/.test(password)) return 'הסיסמה נפוצה מדי וקלה לניחוש. בחרו סיסמה אחרת.';
  return '';
}

function profilePart(input, errors) {
  const name = clean(input?.name, NAME_MAX), rawPhone = clean(input?.phone, 30), phone = rawPhone ? normalizeIsraeliPhone(rawPhone) : '';
  if (name.length < 2) errors.name = 'כתבו שם (לפחות 2 תווים).';
  else if (name.length > NAME_MAX) errors.name = `השם ארוך מדי (עד ${NAME_MAX} תווים).`;
  if (rawPhone && !phone) errors.phone = 'מספר הטלפון לא נראה ישראלי תקין. לדוגמה: ⁦050-1234567⁩.';
  return { name: name.slice(0, NAME_MAX), phone, marketing: input?.marketing === true };
}

export function validateSignup(input) {
  const errors = {}, profile = profilePart(input, errors), email = normalizeEmail(input?.email);
  if (!email) errors.email = 'כתבו כתובת מייל.';
  else if (!isEmail(email)) errors.email = 'כתובת המייל לא תקינה. לדוגמה: ⁦name@example.com⁩.';
  const problem = passwordProblem(input?.password);
  if (problem) errors.password = problem;
  if (input?.privacy !== true) errors.privacy = 'כדי לפתוח חשבון צריך לאשר את שמירת הפרטים.';
  return { value: Object.keys(errors).length ? null : { ...profile, email }, errors };
}

export function validateProfile(input) {
  const errors = {}, value = profilePart(input, errors);
  return { value: Object.keys(errors).length ? null : value, errors };
}

// A saved-items bundle, cleaned with the same rules the site uses when it reads browser storage.
export function cleanSaved(input) {
  const flights = restoreSavedFlights(JSON.stringify(Array.isArray(input?.flights) ? input.flights : []));
  const saved = input?.trips && typeof input.trips === 'object' && !Array.isArray(input.trips) ? input.trips : {};
  const tripsClean = Object.fromEntries(Object.entries(restoreJourney(JSON.stringify({ saved: Object.fromEntries(Object.entries(saved).slice(0, 40)) }), tripIds).saved)
    .map(([key, { destinationId, ...plan }]) => [key, plan]));
  const favorites = Array.isArray(input?.favorites) ? [...new Set(input.favorites.filter((id) => tripIds.includes(id)))] : [];
  return { flights, trips: tripsClean, favorites };
}

// First login on a device: union of both sides. Same flight id → keep one; same plan → the later `updated` wins.
export function mergeSaved(local, remote) {
  const a = cleanSaved(local), b = cleanSaved(remote);
  const flights = [...a.flights, ...b.flights].filter((flight, i, all) => all.findIndex((x) => x.id === flight.id) === i)
    .sort((x, y) => String(y.savedAt).localeCompare(String(x.savedAt)));
  const plans = { ...b.trips };
  for (const [key, plan] of Object.entries(a.trips)) if (!plans[key] || String(plan.updated) > String(plans[key].updated)) plans[key] = plan;
  return cleanSaved({ flights, trips: plans, favorites: [...b.favorites, ...a.favorites] });
}

// Stable text form for "did anything change since the last sync" comparisons.
export function savedSignature(bundle) {
  const value = cleanSaved(bundle);
  return JSON.stringify({ flights: value.flights.map((f) => f.id + ':' + f.checkedAt).sort(), trips: Object.entries(value.trips).map(([k, p]) => k + ':' + p.updated + ':' + JSON.stringify(p)).sort(), favorites: [...value.favorites].sort() });
}

// A flight search the traveler ran (no prices): only codes, dates and counts.
export function cleanSearch(input) {
  const code = (v) => (typeof v === 'string' && /^[A-Z]{3}$/.test(v) ? v : ''), day = (v) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : '');
  const adults = Number(input?.adults), children = Number(input?.children || 0), type = input?.type === 'oneway' ? 'oneway' : 'round';
  const search = { origin: code(input?.origin), to: code(input?.to), start: day(input?.start), end: type === 'oneway' ? '' : day(input?.end), type, adults, children };
  if (!search.origin || !search.to || !search.start || (type === 'round' && !search.end)) return null;
  if (!Number.isInteger(adults) || adults < 1 || !Number.isInteger(children) || children < 0 || adults + children > 9) return null;
  return search;
}
export const searchKey = (s) => [s.origin, s.to, s.start, s.end, s.adults, s.children].join('|');
export function addSearch(list, search, at = new Date().toISOString()) {
  const clean = cleanSearch(search);
  if (!clean) return list;
  return [{ ...clean, at }, ...list.filter((item) => searchKey(item) !== searchKey(clean))].slice(0, MAX_SEARCHES);
}
