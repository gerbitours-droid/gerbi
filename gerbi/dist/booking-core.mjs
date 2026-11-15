// Online booking (spec 25): passenger and contact validation shared by the browser wizard and the server.
// The server re-validates everything; the browser uses the same rules for instant field messages.
// Rules follow the supplier's offer configuration (which fields are required) and IATA passenger types:
//   ADT 12+ on the first flight, CHD 2–11 on the first flight, INF under 2 on the last flight.
import { t as tr, normLang } from './i18n.mjs';

export const PTC_TYPE = { ADT: 'adult', CHD: 'child', INF: 'infant' };
export const PTC_ORDER = ['ADT', 'CHD', 'INF'];
const DATE = /^\d{4}-\d{2}-\d{2}$/;
// Names as printed in the passport's machine-readable zone: Latin letters, spaces, hyphen and apostrophe.
export const LATIN_NAME = /^[A-Za-z](?:[A-Za-z' -]{0,48}[A-Za-z])?$/;
const DOC_NUMBER = /^[A-Z0-9]{5,15}$/;
const ISO2 = /^[A-Z]{2}$/;
const EMAIL = /^[^\s@<>()[\]\\,;:"]{1,64}@[A-Za-z0-9.-]{1,190}\.[A-Za-z]{2,24}$/;

const validDate = (value) => typeof value === 'string' && DATE.test(value) && !Number.isNaN(Date.parse(value + 'T12:00:00Z')) && new Date(value + 'T12:00:00Z').toISOString().slice(0, 10) === value;
// Whole years between a birth date and a day (both YYYY-MM-DD).
export function ageOn(birthDate, day) {
  if (!validDate(birthDate) || !validDate(day)) return null;
  const [by, bm, bd] = birthDate.split('-').map(Number), [y, m, d] = day.split('-').map(Number);
  return y - by - (m < bm || (m === bm && d < bd) ? 1 : 0);
}
const addMonths = (day, months) => { const d = new Date(day + 'T12:00:00Z'); d.setUTCMonth(d.getUTCMonth() + months); return d.toISOString().slice(0, 10); };
export const cleanName = (value) => String(value ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim().toUpperCase().slice(0, 60);

// What the supplier requires for this offer (pricedOffer.offerConfiguration), reduced to what the wizard asks.
export function requirementsFrom(config = {}) {
  const birth = config?.birthdate || {}, doc = config?.identificationDocument || {};
  const birthFor = (ptc) => ptc !== 'ADT' || (birth.required === true && birth.ptcList?.[ptc] !== false);
  const types = Object.keys(doc.types || {}).filter((type) => ['passport', 'identityCard'].includes(type));
  return {
    birthDate: { ADT: birthFor('ADT'), CHD: true, INF: true },
    document: doc.required === true, documentTypes: types.length ? types : ['passport'], documentIssueDate: doc.issueDate?.required === true,
    contact: config?.contactDetails?.required === true
  };
}

// Title the supplier expects, from the passenger type and gender (the wizard asks gender, never a title).
export const titleOf = (ptc, gender) => (ptc === 'ADT' ? (gender === 'f' ? 'ms' : 'mr') : gender === 'f' ? 'miss' : 'mstr');

/** One passenger. ctx: { ptc, requirements, travelStart, travelEnd, today, lang }. → { value, errors, warnings } */
export function validatePassenger(input = {}, ctx = {}) {
  const l = normLang(ctx.lang), t = (key, vars) => tr(key, vars, l), errors = {}, warnings = {};
  const ptc = PTC_TYPE[ctx.ptc] ? ctx.ptc : 'ADT', req = ctx.requirements || requirementsFrom();
  const today = ctx.today || new Date().toISOString().slice(0, 10), start = validDate(ctx.travelStart) ? ctx.travelStart : today, end = validDate(ctx.travelEnd) ? ctx.travelEnd : start;
  const value = { ptc, type: PTC_TYPE[ptc], gender: input.gender === 'f' ? 'f' : input.gender === 'm' ? 'm' : '', firstName: cleanName(input.firstName), lastName: cleanName(input.lastName), birthDate: '', document: null };
  if (!value.gender) errors.gender = t('booking.v.gender');
  for (const key of ['firstName', 'lastName']) {
    if (!value[key]) errors[key] = t('booking.v.nameMissing');
    else if (!LATIN_NAME.test(value[key])) errors[key] = t('booking.v.nameLatin');
  }
  if (value.firstName && value.lastName && (value.firstName + value.lastName).length > 55) errors.lastName = t('booking.v.nameLong');
  const dob = String(input.birthDate ?? '').trim();
  if (dob || req.birthDate?.[ptc]) {
    if (!validDate(dob)) errors.birthDate = t('booking.v.dobMissing');
    else if (dob > today) errors.birthDate = t('booking.v.dobFuture');
    else {
      const ageStart = ageOn(dob, start), ageEnd = ageOn(dob, end);
      if (ptc === 'ADT' && ageStart < 12) errors.birthDate = t('booking.v.dobAdult');
      else if (ptc === 'CHD' && (ageStart < 2 || ageStart > 11)) errors.birthDate = t('booking.v.dobChild');
      else if (ptc === 'INF' && (ageEnd >= 2 || dob > start)) errors.birthDate = t('booking.v.dobInfant');
      else if (ageStart > 120) errors.birthDate = t('booking.v.dobOld');
      else value.birthDate = dob;
    }
  }
  if (req.document) {
    const d = input.document || {}, doc = { type: req.documentTypes.includes(d.type) ? d.type : req.documentTypes[0], number: String(d.number ?? '').replace(/[\s-]/g, '').toUpperCase(),
      expiryDate: String(d.expiryDate ?? '').trim(), nationality: String(d.nationality ?? '').toUpperCase(), issuingCountry: String(d.issuingCountry || d.nationality || '').toUpperCase(), issueDate: String(d.issueDate ?? '').trim() };
    if (!DOC_NUMBER.test(doc.number)) errors['document.number'] = t('booking.v.docNumber');
    if (!validDate(doc.expiryDate)) errors['document.expiryDate'] = t('booking.v.docExpiry');
    else if (doc.expiryDate <= end) errors['document.expiryDate'] = t('booking.v.docExpired');
    else if (doc.expiryDate < addMonths(end, 6)) warnings['document.expiryDate'] = t('booking.v.docSixMonths');
    if (!ISO2.test(doc.nationality)) errors['document.nationality'] = t('booking.v.country');
    if (!ISO2.test(doc.issuingCountry)) errors['document.issuingCountry'] = t('booking.v.country');
    if (req.documentIssueDate && (!validDate(doc.issueDate) || doc.issueDate > today)) errors['document.issueDate'] = t('booking.v.docIssue');
    if (!req.documentIssueDate) delete doc.issueDate;
    value.document = doc;
  }
  return { value: Object.keys(errors).length ? null : value, errors, warnings };
}

export function validateContact(input = {}, lang) {
  const l = normLang(lang), t = (key) => tr(key, {}, l), errors = {};
  const name = String(input.name ?? '').replace(/[<>\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
  const email = String(input.email ?? '').trim().toLowerCase().slice(0, 200);
  const digits = String(input.phone ?? '').replace(/[\s()-]/g, '');
  // Israeli mobile/landline (05x… / 0x…) or an international number with a + prefix.
  const phone = /^0\d{8,9}$/.test(digits) ? digits : /^\+972\d{8,9}$/.test(digits) ? '0' + digits.slice(4) : /^\+[1-9]\d{6,14}$/.test(digits) ? digits : '';
  if (name.length < 2) errors.name = t('booking.v.contactName');
  if (!EMAIL.test(email)) errors.email = t('booking.v.email');
  if (!phone) errors.phone = t('booking.v.phone');
  return { value: Object.keys(errors).length ? null : { name, email, phone }, errors };
}

/** All passengers of an order. pax: { ADT: n, CHD: n, INF: n }. → { value, errors: { '0.firstName': … }, warnings } */
export function validatePassengers(list, { pax, requirements, travelStart, travelEnd, today, lang } = {}) {
  const expected = PTC_ORDER.flatMap((ptc) => Array.from({ length: pax?.[ptc] || 0 }, () => ptc));
  const input = Array.isArray(list) ? list.slice(0, 9) : [], errors = {}, warnings = {}, value = [];
  if (input.length !== expected.length) return { value: null, errors: { form: tr('booking.v.paxCount', {}, normLang(lang)) }, warnings };
  expected.forEach((ptc, i) => {
    const r = validatePassenger(input[i], { ptc, requirements, travelStart, travelEnd, today, lang });
    for (const [k, v] of Object.entries(r.errors)) errors[`${i}.${k}`] = v;
    for (const [k, v] of Object.entries(r.warnings)) warnings[`${i}.${k}`] = v;
    if (r.value) value.push(r.value);
  });
  // Two passengers with the same name and birth date are almost always a copy-paste mistake.
  const seen = new Set();
  value.forEach((p, i) => { const key = `${p.firstName}|${p.lastName}|${p.birthDate}`; if (seen.has(key)) errors[`${i}.firstName`] = tr('booking.v.duplicate', {}, normLang(lang)); seen.add(key); });
  // An infant flies on an adult's lap: never more infants than adults.
  if ((pax?.INF || 0) > (pax?.ADT || 0)) errors.form = tr('booking.v.infants', {}, normLang(lang));
  return { value: Object.keys(errors).length ? null : value, errors, warnings };
}

// Shown to the customer after submission: never the full document number.
export const maskDocument = (number) => (number ? '•••' + String(number).slice(-3) : '');

// Whole shekels, rounded up so the charged amount never falls below the supplier amount converted.
export const ilsOf = (price, rate) => (price && Number.isFinite(price.value) ? (price.currency === 'ILS' ? Math.ceil(price.value) : Number.isFinite(rate) && rate > 0 ? Math.ceil(price.value * rate) : null) : null);

// Customer-facing status groups (the wizard and "my orders" show these, never the internal state names).
export const STATUS_GROUP = {
  draft: 'draft', details: 'draft', price_changed: 'action', priced: 'draft', payment_failed: 'action',
  payment_pending: 'payment', payment_authorized: 'processing', booking: 'processing', booked: 'processing', ticketed: 'processing',
  confirmed: 'confirmed', requested: 'request', in_progress: 'request', needs_agent: 'agent',
  booking_failed: 'failed', voided: 'failed', unavailable: 'failed', expired: 'closed', cancelled: 'closed', refund_pending: 'refund', refunded: 'closed'
};
