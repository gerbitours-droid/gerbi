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
// Since 23.11.2026 the site always collects the full passport (number, issuing country, nationality, issue and expiry
// dates, birth date) for every traveller, whatever the offer asks: the airline needs it for APIS before the flight and
// the agent completing a request needs it anyway. `supplierDocument` keeps what the supplier itself asked for.
export function requirementsFrom(config = {}) {
  const doc = config?.identificationDocument || {};
  return {
    birthDate: { ADT: true, CHD: true, INF: true },
    document: true, documentTypes: ['passport'], documentIssueDate: true, supplierDocument: doc.required === true,
    contact: config?.contactDetails?.required === true
  };
}

// Title the supplier expects, from the passenger type and gender (the wizard asks gender, never a title).
export const titleOf = (ptc, gender) => (ptc === 'ADT' ? (gender === 'f' ? 'ms' : 'mr') : gender === 'f' ? 'miss' : 'mstr');

// Issue date of a passport: a real date, not in the future, after the birth date and before the expiry date.
// → a dictionary key describing the problem, or '' when the date is fine.
export function issueDateProblem(issueDate, { expiryDate = '', birthDate = '', today = new Date().toISOString().slice(0, 10) } = {}) {
  if (!validDate(issueDate)) return 'booking.v.docIssue';
  if (issueDate > today) return 'booking.v.docIssueFuture';
  if (validDate(birthDate) && issueDate < birthDate) return 'booking.v.docIssueBirth';
  if (validDate(expiryDate) && issueDate >= expiryDate) return 'booking.v.docIssueExpiry';
  // No passport is valid for more than 10 years (a few months of grace for renewals carried over).
  if (validDate(expiryDate) && expiryDate > addMonths(issueDate, 10 * 12 + 9)) return 'booking.v.docIssueSpan';
  return '';
}

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
  if (req.document !== false) {
    const d = input.document || {}, doc = { type: req.documentTypes?.includes(d.type) ? d.type : (req.documentTypes?.[0] || 'passport'), number: String(d.number ?? '').replace(/[\s-]/g, '').toUpperCase(),
      expiryDate: String(d.expiryDate ?? '').trim(), nationality: String(d.nationality ?? '').toUpperCase(), issuingCountry: String(d.issuingCountry || d.nationality || '').toUpperCase(), issueDate: String(d.issueDate ?? '').trim() };
    // "Use the saved passport" / "keep the number from this order": the number is resolved on the server (never sent
    // back to the browser). The browser validates everything else; the server validates again with the real number.
    const reference = ctx.allowReference === true && !doc.number && (d.useSaved === true || d.keep === true);
    if (reference) { doc.useSaved = d.useSaved === true; doc.keep = d.keep === true; if (d.savedId) doc.savedId = String(d.savedId).slice(0, 40); }
    else if (!DOC_NUMBER.test(doc.number)) errors['document.number'] = t('booking.v.docNumber');
    if (!validDate(doc.expiryDate)) errors['document.expiryDate'] = t('booking.v.docExpiry');
    else if (doc.expiryDate <= end) errors['document.expiryDate'] = t('booking.v.docExpired');
    else if (doc.expiryDate < addMonths(end, 6)) warnings['document.expiryDate'] = t('booking.v.docSixMonths');
    if (!ISO2.test(doc.nationality)) errors['document.nationality'] = t('booking.v.country');
    if (!ISO2.test(doc.issuingCountry)) errors['document.issuingCountry'] = t('booking.v.country');
    const issueProblem = issueDateProblem(doc.issueDate, { expiryDate: doc.expiryDate, birthDate: dob, today });
    if (issueProblem && (req.documentIssueDate !== false || doc.issueDate)) errors['document.issueDate'] = t(issueProblem);
    if (req.documentIssueDate === false && !doc.issueDate) delete doc.issueDate;
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
export function validatePassengers(list, { pax, requirements, travelStart, travelEnd, today, lang, allowReference = false } = {}) {
  const expected = PTC_ORDER.flatMap((ptc) => Array.from({ length: pax?.[ptc] || 0 }, () => ptc));
  const input = Array.isArray(list) ? list.slice(0, 9) : [], errors = {}, warnings = {}, value = [];
  if (input.length !== expected.length) return { value: null, errors: { form: tr('booking.v.paxCount', {}, normLang(lang)) }, warnings };
  expected.forEach((ptc, i) => {
    const r = validatePassenger(input[i], { ptc, requirements, travelStart, travelEnd, today, lang, allowReference });
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
// A document as any browser or admin screen may see it: every field but the number, which is masked.
export const maskedDocument = (doc) => (doc ? { type: doc.type, number: maskDocument(doc.number), expiryDate: doc.expiryDate, nationality: doc.nationality, issuingCountry: doc.issuingCountry, ...(doc.issueDate ? { issueDate: doc.issueDate } : {}) } : null);

// Whole shekels, rounded up so the charged amount never falls below the supplier amount converted.
export const ilsOf = (price, rate) => (price && Number.isFinite(price.value) ? (price.currency === 'ILS' ? Math.ceil(price.value) : Number.isFinite(rate) && rate > 0 ? Math.ceil(price.value * rate) : null) : null);

// Customer-facing status groups (the wizard and "my orders" show these, never the internal state names).
export const STATUS_GROUP = {
  draft: 'draft', details: 'draft', price_changed: 'action', priced: 'draft', payment_failed: 'action',
  payment_pending: 'payment', payment_authorized: 'processing', booking: 'processing', booked: 'processing', ticketed: 'processing',
  confirmed: 'confirmed', requested: 'request', in_progress: 'request', needs_agent: 'agent',
  booking_failed: 'failed', voided: 'failed', unavailable: 'failed', expired: 'closed', cancelled: 'closed', refund_pending: 'refund', refunded: 'closed'
};

// ---------------------------------------------------------------- flight extras (optional services)
// The supplier lists optional services per passenger and per route (pricedOffer.optionalServices): hold bags, cabin
// bag + priority boarding bundles ("Advanced Ancillary Options"), sport equipment ("Flight Extras Options"), seats,
// meals… The server keeps them as `extras` (backend/booking-supplier.mjs extrasOf); these helpers are shared by the
// server (selection → optionalServiceList, expected total) and the wizard (labels, live total).
export const EXTRA_KINDS = ['bags', 'cabin', 'seat', 'sport', 'meal', 'other'];

// Which group a service belongs to, from its category code, its name and its options' wording. Unknown → 'other'.
export function extraKind(service = {}) {
  const name = String(service.name || service.service?.name || ''), category = String(service.categoryCode || service.service?.categoryCode || '').toUpperCase();
  const words = [name, ...(service.options || []).map((o) => o?.description || '')].join(' ');
  if (category === 'BG' || /luggage option|hold ?bag|checked bag/i.test(name)) return 'bags';
  if (category === 'SE' || category === 'SA' || /\bseat/i.test(words)) return 'seat';
  if (category === 'ML' || /\bmeal/i.test(words)) return 'meal';
  if (/sport|\bski|golf|bike|bicycle|surf/i.test(words)) return 'sport';
  if (category === 'TS' || category === 'CY' || /hand luggage|cabin bag|personal item|boarding|priority/i.test(words)) return 'cabin';
  return 'other';
}

const KG = (n) => String(Number(n));
// Readable wording of one supplier option description, e.g. "2 bags - 20Kg+20Kg(135.47 USD)" → "2 מזוודות · 20 ק״ג כל אחת".
// → { text, known }: `known` false means (part of) the supplier's own wording is shown, cleaned.
export function extraLabel(description, l = 'he') {
  const tt = (key, vars) => tr(key, vars, normLang(l));
  const raw = String(description ?? '').replace(/<[^>]*>/g, ' ').replace(/\(\s*[\d.,]+\s*[A-Z]{3}\s*\)\s*$/, '').replace(/\s+/g, ' ').trim().slice(0, 160);
  if (!raw) return { text: '', known: false };
  let m = /^(\d+)\s*bags?\s*-\s*(.+)$/i.exec(raw);
  if (m) {
    const count = Number(m[1]), rest = m[2], total = /^(\d+(?:\.\d+)?)\s*kg\s*total$/i.exec(rest), each = rest.split('+').map((w) => /^(\d+(?:\.\d+)?)\s*kg$/i.exec(w.trim())?.[1]);
    if (total) return { text: tt('booking.x.bagTotal', { count, kg: KG(total[1]) }), known: true };
    if (each.every(Boolean)) return { text: new Set(each).size === 1 ? tt('booking.x.bagEach', { count, kg: KG(each[0]) }) : tt('booking.x.bagList', { count, kg: each.map(KG).join('+') }), known: true };
  }
  m = /^(both|outbound|outward|return|inbound)\s*=\s*(.+)$/i.exec(raw);
  const direction = m ? (/both/i.test(m[1]) ? 'both' : /return|inbound/i.test(m[1]) ? 'back' : 'out') : '', body = m ? m[2] : raw;
  let known = true;
  const parts = body.split(/\s+\+\s+/).map((part) => {
    const dims = /(\d+)\s*x\s*(\d+)\s*x\s*(\d+)\s*cm/i.exec(part), size = dims ? `${dims[1]}×${dims[2]}×${dims[3]}` : '';
    const kg = /max\s*(\d+(?:\.\d+)?)\s*kg/i.exec(part)?.[1] || /(\d+(?:\.\d+)?)\s*kg/i.exec(part)?.[1];
    if (/personal item|small (cabin )?bag|underseat/i.test(part)) return tt(size ? 'booking.x.personalSize' : 'booking.x.personal', { size });
    if (/hand luggage|cabin bag|carry[- ]?on|trolley/i.test(part)) return tt(kg && size ? 'booking.x.cabinKgSize' : kg ? 'booking.x.cabinKg' : size ? 'booking.x.cabinSize' : 'booking.x.cabin', { kg: kg ? KG(kg) : '', size });
    if (/speedy boarding|priority boarding|priority/i.test(part)) return tt('booking.x.priority');
    if (/sports? equipment/i.test(part)) return tt('booking.x.sport');
    if (/^ski/i.test(part)) return tt('booking.x.ski');
    if (/bike|bicycle/i.test(part)) return tt('booking.x.bike');
    if (/golf/i.test(part)) return tt('booking.x.golf');
    if (/legroom/i.test(part)) return tt('booking.x.legroom');
    if (/window/i.test(part) && /seat/i.test(part)) return tt('booking.x.seatWindow');
    if (/aisle/i.test(part) && /seat/i.test(part)) return tt('booking.x.seatAisle');
    if (/standard seat/i.test(part)) return tt('booking.x.seatStandard');
    if (/premium seat/i.test(part)) return tt('booking.x.seatPremium');
    if (/\bmeal\b/i.test(part)) return tt('booking.x.meal');
    known = false; return part.trim();
  }).filter(Boolean);
  const text = parts.join(' + ');
  return { text: direction ? tt(`booking.x.dir.${direction}`, { text }) : text, known };
}

// The customer's choice { [bookingCode]: optionCode } → optionalServiceList for the supplier (unknown codes dropped).
export function extrasSelection(extras = [], choice = {}) {
  const list = [];
  for (const extra of extras || []) {
    const code = choice?.[extra.bookingCode];
    if (code === undefined || code === null || code === '' || !extra.options?.some((o) => o.code === String(code))) continue;
    list.push({ bookingCode: extra.bookingCode, selectedOptionCode: String(code) });
  }
  return list;
}
// Sum of the chosen options in the supplier currency (an option in another currency is left to the re-check).
export function extrasTotal(extras = [], choice = {}, currency = '') {
  let sum = 0;
  for (const { bookingCode, selectedOptionCode } of extrasSelection(extras, choice)) {
    const o = extras.find((x) => x.bookingCode === bookingCode).options.find((x) => x.code === selectedOptionCode);
    if (o?.price && Number.isFinite(o.price.value) && (!currency || o.price.currency === currency)) sum += o.price.value;
  }
  return Math.round(sum * 100) / 100;
}
// A choice cleaned against the offered extras: only known booking codes and option codes survive.
export const cleanExtrasChoice = (extras = [], choice = {}) => Object.fromEntries(extrasSelection(extras, choice).map((s) => [s.bookingCode, s.selectedOptionCode]));

// ---------------------------------------------------------------- saved travellers (customer area)
// A traveller profile the customer keeps in the account for the next booking: names as in the passport, gender,
// birth date, the passport (all or nothing) and optional contact details. No trip, so no passenger-type rules here:
// the booking validates the age against the flight when the profile is used.
export const MAX_SAVED_TRAVELLERS = 12;
export function validateTraveller(input = {}, { today = new Date().toISOString().slice(0, 10), lang: l = 'he', keepNumber = false } = {}) {
  const t = (key) => tr(key, {}, normLang(l)), errors = {};
  const value = { label: String(input.label ?? '').replace(/[<>\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 40), self: input.self === true,
    gender: input.gender === 'f' ? 'f' : input.gender === 'm' ? 'm' : '', firstName: cleanName(input.firstName), lastName: cleanName(input.lastName), birthDate: String(input.birthDate ?? '').trim(), document: null, phone: '', email: '' };
  if (!value.gender) errors.gender = t('booking.v.gender');
  for (const key of ['firstName', 'lastName']) { if (!value[key]) errors[key] = t('booking.v.nameMissing'); else if (!LATIN_NAME.test(value[key])) errors[key] = t('booking.v.nameLatin'); }
  if (!validDate(value.birthDate)) errors.birthDate = t('booking.v.dobMissing');
  else if (value.birthDate > today) errors.birthDate = t('booking.v.dobFuture');
  else if (ageOn(value.birthDate, today) > 120) errors.birthDate = t('booking.v.dobOld');
  const d = input.document || {}, any = ['number', 'expiryDate', 'nationality', 'issuingCountry', 'issueDate'].some((k) => String(d[k] ?? '').trim()) || (keepNumber && d.keep === true);
  if (any) {
    const doc = { type: 'passport', number: String(d.number ?? '').replace(/[\s-]/g, '').toUpperCase(), expiryDate: String(d.expiryDate ?? '').trim(), nationality: String(d.nationality ?? '').toUpperCase(), issuingCountry: String(d.issuingCountry || d.nationality || '').toUpperCase(), issueDate: String(d.issueDate ?? '').trim() };
    if (keepNumber && !doc.number && d.keep === true) doc.keep = true;
    else if (!DOC_NUMBER.test(doc.number)) errors['document.number'] = t('booking.v.docNumber');
    if (!validDate(doc.expiryDate)) errors['document.expiryDate'] = t('booking.v.docExpiry');
    else if (doc.expiryDate <= today) errors['document.expiryDate'] = t('booking.v.docExpiredNow');
    if (!ISO2.test(doc.nationality)) errors['document.nationality'] = t('booking.v.country');
    if (!ISO2.test(doc.issuingCountry)) errors['document.issuingCountry'] = t('booking.v.country');
    const issue = issueDateProblem(doc.issueDate, { expiryDate: doc.expiryDate, birthDate: value.birthDate, today });
    if (issue) errors['document.issueDate'] = t(issue);
    value.document = doc;
  }
  if (String(input.email ?? '').trim()) { const email = String(input.email).trim().toLowerCase().slice(0, 200); if (EMAIL.test(email)) value.email = email; else errors.email = t('booking.v.email'); }
  if (String(input.phone ?? '').trim()) { const c = validateContact({ name: 'xx', email: 'a@b.co', phone: input.phone }, l); if (c.value) value.phone = c.value.phone; else errors.phone = t('booking.v.phone'); }
  if (input.consent !== true) errors.consent = t('booking.v.saveConsent');
  return { value: Object.keys(errors).length ? null : value, errors };
}
