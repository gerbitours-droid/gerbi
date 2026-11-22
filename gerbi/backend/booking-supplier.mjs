// The flight supplier as the order service sees it (spec 25 §1): price an offer, book it, follow the reservation.
//   price()    – flights/v1 availability (read-only; also re-prices with selected bags)
//   book()     – flights/v1 …/book                         ┐ WRITE: charges the agency's supplier account.
//   issue()    – reservationsApi …/air/issue-tickets       │ Only the live adapter can make these calls, and only
//   voidTickets(), cancel()                                ┘ when BOOKING_MODE=live and VOLERO_BOOKING_ENABLED=true.
//   retrieve() – reservationsApi …/reservations/reference/{clientRef} (read-only; reconciliation)
// fakeSupplier() answers from recorded responses (tests/fixtures/booking) with scripted failures; mock mode, tests
// and the e2e run use it. Nothing here ever talks to the supplier unless liveSupplier() is constructed AND enabled.
import { readFileSync } from 'node:fs';
import { getVoleroToken, voleroFlightAvailability, TIMEOUTS } from './volero-client.mjs';
import { requirementsFrom, extraKind, extrasSelection, PTC_ORDER } from '../dist/booking-core.mjs';

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const text = (v, max = 200) => String(v ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

// Legs of the priced itinerary, in order: [{ from, to, date, time, arriveDate, arriveTime, carrier, flight, stops }].
function legsOf(priced, lists = {}) {
  const flights = new Map((lists.flightList || []).map((f) => [f.key, f])), segments = new Map((lists.flightSegmentList || []).map((s) => [s.key, s]));
  return (priced?.flightsOverview?.[0]?.flightReferences || []).map((ref) => {
    const segs = (flights.get(ref)?.segmentReferences || []).map((key) => segments.get(key)).filter(Boolean);
    if (!segs.length) return null;
    const first = segs[0], last = segs.at(-1), carrier = first.marketingCarrier?.airline || {};
    return { from: first.departure?.airport?.code || '', to: last.arrival?.airport?.code || '', fromCity: text(first.departure?.city?.name, 60), toCity: text(last.arrival?.city?.name, 60),
      date: first.departure?.date || '', time: first.departure?.time || '', arriveDate: last.arrival?.date || '', arriveTime: last.arrival?.time || '',
      carrier: text(carrier.name || carrier.code, 60), carrierCode: text(carrier.code, 3), flight: first.marketingCarrier?.flightNumber ? `${carrier.code || ''}${first.marketingCarrier.flightNumber}` : '', stops: segs.length - 1, duration: flights.get(ref)?.flightDetails?.duration || null };
  }).filter(Boolean);
}

// Every optional service the supplier offers (pricedOffer.optionalServices), one entry per passenger and route:
//   { bookingCode, kind: bags|cabin|seat|sport|meal|other, name, from, to, target: 'ADT', passengerIndex: 0, pax: 0,
//     options: [{ code, description, price: { value, currency } }] }
// `pax` is the passenger's position in the order (ADT…, CHD…, INF…), so the wizard shows each one under its traveller.
// Included services, services without priced options and unknown passengers are dropped; unknown categories are kept
// under 'other' with the supplier's own wording.
export function extrasOf(services = [], pax = {}) {
  const offset = { ADT: 0, CHD: pax.ADT || 0, INF: (pax.ADT || 0) + (pax.CHD || 0) };
  const out = [];
  for (const s of Array.isArray(services) ? services : []) {
    if (!s || s.included || !Array.isArray(s.options) || !s.options.length || typeof s.bookingCode !== 'string' || !s.bookingCode) continue;
    const target = PTC_ORDER.includes(s.target) ? s.target : 'ADT', index = Number.parseInt(s.passengerIndex, 10);
    if (!Number.isInteger(index) || index < 0 || index >= (pax[target] || 0)) continue;
    const options = s.options.map((o) => ({ code: String(o?.code ?? '').slice(0, 40), description: text(o?.description, 200), price: { value: num(o?.price?.amount), currency: text(o?.price?.currency, 3) } }))
      .filter((o) => o.code && o.price.value !== null && /^[A-Z]{3}$/.test(o.price.currency)).slice(0, 30);
    if (!options.length) continue;
    const selected = s.options.find((o) => o?.selected);
    out.push({ bookingCode: s.bookingCode.slice(0, 80), kind: extraKind({ ...s.service, options: s.options }), name: text(s.service?.name, 80), category: text(s.service?.categoryCode, 10),
      from: text(s.route?.departureCode, 3), to: text(s.route?.arrivalCode, 3), target, passengerIndex: index, pax: offset[target] + index, options,
      ...(selected ? { selected: String(selected.code) } : {}) });
  }
  return out.slice(0, 120);
}
// Services the supplier adds to every booking of this offer (pricedOffer.mandatoryServices): shown, never chosen.
function mandatoryOf(services = []) {
  return (Array.isArray(services) ? services : []).map((s) => {
    const amount = num(s?.price?.amount ?? s?.options?.[0]?.price?.amount), currency = text(s?.price?.currency || s?.options?.[0]?.price?.currency, 3);
    return { name: text(s?.service?.name || s?.name, 80), kind: extraKind({ ...s?.service, options: s?.options || [] }), from: text(s?.route?.departureCode, 3), to: text(s?.route?.arrivalCode, 3), price: amount !== null ? { value: amount, currency } : null };
  }).filter((s) => s.name).slice(0, 20);
}

// The parts of an availability answer the order keeps. Throws offer_unavailable when there is no price.
export function normalizeQuote(raw) {
  const priced = raw?.pricedOffer, fare = priced?.fareDetails || {}, total = fare.totalPrice?.selling || fare.totalPrice;
  if (!priced || num(total?.value) === null || !/^[A-Z]{3}$/.test(total?.currency || '')) throw Object.assign(new Error('offer_unavailable'), { status: 410 });
  const pax = { ADT: 0, CHD: 0, INF: 0 };
  const items = (priced.offerItems || []).filter((i) => i?.ptc in pax).map((i) => {
    pax[i.ptc] += i.count || 0;
    const taxes = (i.price?.taxes || []).reduce((sum, x) => sum + (num(x?.amount) || 0), 0);
    return { ptc: i.ptc, count: i.count || 0, fullFare: num(i.price?.fullFare), baseFare: num(i.price?.baseFare), serviceFee: num(i.price?.serviceFee), taxes: Math.round(taxes * 100) / 100, currency: i.price?.currency || total.currency };
  });
  const credit = priced.paymentMethods && !Array.isArray(priced.paymentMethods) ? priced.paymentMethods.credit : null;
  return {
    availabilityToken: typeof raw.availabilityToken === 'string' ? raw.availabilityToken.slice(0, 4000) : '',
    total: { value: Math.round(total.value * 100) / 100, currency: total.currency }, pax, items,
    requirements: requirementsFrom(priced.offerConfiguration),
    timeLimits: { offerExpiration: fare.timeLimits?.offerExpiration || null, ticketingTimeLimit: fare.timeLimits?.ticketingTimeLimit || null, lastTicketingDate: fare.timeLimits?.lastTicketingDate || null },
    autoTicketable: fare.autoTicketable === true, nonRefundable: typeof fare.nonRefundable === 'boolean' ? fare.nonRefundable : null,
    validatingCarrier: text(fare.validatingCarrier?.name || fare.validatingCarrier?.code, 60), brand: text(fare.brandedFare?.[0]?.name, 60),
    extras: extrasOf(priced.optionalServices, pax), mandatory: mandatoryOf(priced.mandatoryServices), legs: legsOf(priced, raw.dataLists),
    // Reseller credit available for this offer (admin only). Without a payment method the supplier refuses to book.
    paymentAvailable: Boolean(credit && credit.info?.enabled !== false), credit: credit?.info?.available || null,
    disclaimer: text(raw.disclaimer, 1500), notices: (raw.notifications || []).map((n) => ({ type: n?.type, text: text(n?.text, 200) })).slice(0, 5)
  };
}

// optionalServiceList for the supplier from the customer's choice { [bookingCode]: optionCode, … }.
export const extrasFor = (extras = [], choice = {}) => extrasSelection(extras, choice);
// Older clients sent one bag choice per direction { "TLV-ATH": "2" }: the same option for every traveller who can take it.
export function bagChoice(extras = [], bags = {}) {
  const choice = {};
  for (const e of extras || []) { const code = bags?.[`${e.from}-${e.to}`]; if (e.kind === 'bags' && code && e.options.some((o) => o.code === String(code))) choice[e.bookingCode] = String(code); }
  return choice;
}

// Booking travellers in the supplier's format (BookingTravelerInputType). Exactly one lead passenger: the first adult.
export function travellersFor(passengers, contact, clientRef) {
  return passengers.map((p, i) => ({
    ptc: p.ptc, reference: `${clientRef}-${i + 1}`.toLowerCase().replace(/[^a-z0-9\-_:.]/g, ''), type: p.type, lead: i === 0, title: p.title, firstName: p.firstName, lastName: p.lastName,
    ...(i === 0 ? { email: contact.email, ...phoneParts(contact.phone) } : {}),
    ...(p.birthDate ? { birthDate: p.birthDate } : {}),
    // BookingTravelerInputType.identificationDocument accepts exactly these fields (gender and names travel above).
    ...(p.document?.number ? { identificationDocument: { documentType: p.document.type || 'passport', number: p.document.number, expiryDate: p.document.expiryDate, issuingCountry: p.document.issuingCountry, nationality: p.document.nationality, ...(p.document.issueDate ? { issuingDate: p.document.issueDate } : {}) } } : {})
  }));
}
function phoneParts(phone) {
  if (/^0\d{8,9}$/.test(phone)) return { phonePrefix: '+972', phone: phone.slice(1) };
  const m = /^\+(\d{1,3})(\d{6,12})$/.exec(phone || '');
  return m ? { phonePrefix: '+' + m[1], phone: m[2] } : {};
}

// What the order keeps from a reservation (booking response or Reservations API record).
export function normalizeReservation(raw) {
  if (!raw || raw.id === undefined) return null;
  const service = (raw.services || raw._embedded?.services || [])[0] || {};
  const tickets = (service.pnr?.tickets || raw.tickets || []).map((t) => ({ number: text(t?.number || t?.ticketNumber, 20), status: text(t?.status, 20), passenger: text(t?.passenger?.name || t?.passengerName, 60) })).filter((t) => t.number);
  const status = raw.status || service.status || '';
  return { reservationId: String(raw.id), clientRef: raw.clientRef || null, status: ['OK', 'RQ', 'XX', 'XP', 'AM'].includes(status) ? status : 'UNKNOWN',
    pnr: text(raw.reference?.external || service.pnr?.locator, 12), confirmation: text(raw.reference?.confirmation, 30),
    price: raw.price?.selling ? { value: num(raw.price.selling.value), currency: raw.price.selling.currency } : null,
    ticketStatus: tickets.length ? 'ISSUED' : text(service.ticketStatus || raw.ticketStatus, 20) || 'NOT_ISSUED', tickets,
    userConfirmations: raw.userConfirmations?.status && raw.userConfirmations.status !== 'CONFIRMED' ? raw.userConfirmations.status : null };
}

// ---------------------------------------------------------------- live adapter
export const liveWritesEnabled = (env = process.env) => env.BOOKING_MODE === 'live' && env.VOLERO_BOOKING_ENABLED === 'true';
const apiBase = 'https://reseller.volero.net/reseller/api';
async function call(scope, path, { method = 'GET', body, ms = 30_000 } = {}) {
  const token = await getVoleroToken(scope);
  const response = await fetch(`${apiBase}${path}`, { method, headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(ms) })
    .catch((error) => { throw Object.assign(new Error(error.name === 'TimeoutError' ? 'supplier_timeout' : 'supplier_network'), { status: 504, unknownOutcome: method !== 'GET' }); });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error('supplier_error'), { status: response.status, details: { title: payload?.title, detail: String(payload?.detail || '').slice(0, 200) } });
  return payload;
}

export function liveSupplier({ env = process.env } = {}) {
  const guard = () => { if (!liveWritesEnabled(env)) throw Object.assign(new Error('live_booking_disabled'), { status: 403 }); };
  return {
    kind: 'live',
    async price({ srk, offerIndex, searchToken, itineraryIndex = 0, optionalServiceList = [] }) {
      return normalizeQuote(await voleroFlightAvailability({ srk, offerIndex, searchToken, input: { itineraryIndex, ...(optionalServiceList.length ? { optionalServiceList } : {}) } }));
    },
    async book({ srk, offerIndex, searchToken, availabilityToken, clientRef, travellers, comments }) {
      guard();
      const url = `/flights/v1/search/results/${encodeURIComponent(srk)}/offers/${encodeURIComponent(offerIndex)}/book?token=${encodeURIComponent(searchToken)}`;
      return normalizeReservation(await call('write:flights-book', url, { method: 'POST', body: { clientRef, availabilityToken, travelers: travellers, payment: { method: 'credit' }, ...(comments ? { comments } : {}) }, ms: TIMEOUTS.book }));
    },
    async retrieve({ clientRef }) {
      try { return normalizeReservation(await call('read:reservations', `/reservationsApi/v1/reservations/reference/${encodeURIComponent(clientRef)}`)); }
      catch (error) { if (error.status === 404) return null; throw error; }
    },
    async issue({ reservationId }) {
      guard();
      const methods = await call('read:reservations', `/reservationsApi/v1/reservations/${encodeURIComponent(reservationId)}/air/issue-methods`);
      // Only the agency credit line: the site never sends a card to the supplier (spec 25 §8, PCI scope).
      const method = (methods?._embedded?.issueMethods || []).find((m) => m.type === 'credit' || /credit/i.test(m.code || '')) || null;
      if (!method) throw Object.assign(new Error('no_credit_issue_method'), { status: 409 });
      const result = await call('write:reservations', `/reservationsApi/v1/reservations/${encodeURIComponent(reservationId)}/air/issue-tickets`, { method: 'POST', body: { issueMethodCode: method.code }, ms: 60_000 });
      return { tickets: (result?.ticketLists || []).map((t) => ({ number: text(t?.number || t?.ticketNumber, 20), passenger: text(t?.passenger?.name, 60) })).filter((t) => t.number) };
    },
    async voidTickets({ reservationId }) {
      guard();
      const details = await call('read:reservations', `/reservationsApi/v1/reservations/${encodeURIComponent(reservationId)}/air/void-details`);
      if (!details?.available) throw Object.assign(new Error('void_not_available'), { status: 409 });
      await call('write:reservations', `/reservationsApi/v1/reservations/${encodeURIComponent(reservationId)}/air/void-tickets`, { method: 'POST', body: {} });
      return { voided: true };
    },
    async cancel({ reservationId }) {
      guard();
      return normalizeReservation(await call('write:reservations', `/reservationsApi/v1/reservations/${encodeURIComponent(reservationId)}`, { method: 'DELETE' }));
    }
  };
}

// ---------------------------------------------------------------- fake adapter (tests, mock mode, e2e)
const FIXTURE_DIR = new URL('../tests/fixtures/booking/', import.meta.url);
let recorded;
const fixtures = () => (recorded ||= JSON.parse(readFileSync(new URL('availability-raw.json', FIXTURE_DIR), 'utf8')));
// Scripted outcomes. In mock mode a passenger surname picks one (like a payment gateway's test card numbers):
//   PRICECHANGE – the re-check returns a higher price · SOLDOUT – the offer is gone at the re-check
//   SUPPLIERFAIL – booking fails after the payment hold · TICKETFAIL – booked, tickets not issued · TIMEOUT – unknown outcome
export const SCENARIOS = ['PRICECHANGE', 'SOLDOUT', 'SUPPLIERFAIL', 'TICKETFAIL', 'TIMEOUT', 'RQ'];
export function fakeSupplier({ scenario: fixed = null, now = () => Date.now() } = {}) {
  const reservations = new Map(), calls = [];
  let seq = 1000, priceBump = 0;
  const scenarioOf = (input) => fixed || input?.scenario || null;
  return {
    kind: 'fake', calls, reservations,
    async price({ offerIndex, optionalServiceList = [], scenario }) {
      calls.push({ op: 'price', offerIndex });
      const s = scenarioOf({ scenario });
      if (s === 'SOLDOUT') throw Object.assign(new Error('offer_unavailable'), { status: 410 });
      const list = fixtures(), entry = list.find((x) => x.offerIndex === offerIndex) || list[1] || list[0];
      const raw = structuredClone(entry.raw), fare = raw.pricedOffer.fareDetails;
      // Fresh time limits relative to now (the recorded ones are in the past).
      const at = (minutes) => new Date(now() + minutes * 60000).toISOString().replace(/\.\d{3}Z$/, '+00:00');
      fare.timeLimits = { offerExpiration: at(30), ticketingTimeLimit: at(180), lastTicketingDate: at(180).slice(0, 10) };
      let extra = 0;
      for (const sel of optionalServiceList) for (const svc of raw.pricedOffer.optionalServices || []) if (svc.bookingCode === sel.bookingCode) for (const o of svc.options || []) if (o.code === sel.selectedOptionCode) { o.selected = true; extra += o.price.amount; }
      if (s === 'PRICECHANGE') priceBump = priceBump || 37.5;
      fare.totalPrice.selling.value = Math.round((fare.totalPrice.selling.value + extra + priceBump) * 100) / 100;
      raw.notifications = [];
      raw.availabilityToken = `fake-availability-${offerIndex.slice(0, 6)}-${calls.length}`;
      raw.pricedOffer.paymentMethods = { credit: { code: 'credit', info: { enabled: true, available: { value: 50000, currency: fare.totalPrice.selling.currency } } } };
      return normalizeQuote(raw);
    },
    async book({ clientRef, travellers, availabilityToken, scenario, autoTicketable = false }) {
      calls.push({ op: 'book', clientRef, travellers: travellers.length, availabilityToken });
      const s = scenarioOf({ scenario });
      if (reservations.has(clientRef)) return reservations.get(clientRef); // the supplier de-duplicates by clientRef
      if (s === 'SUPPLIERFAIL') throw Object.assign(new Error('supplier_error'), { status: 400, details: { title: 'Booking failed', detail: 'Fare no longer available' } });
      const reservation = { reservationId: String(++seq), clientRef, status: s === 'RQ' ? 'RQ' : 'OK', pnr: 'FK' + String(seq).slice(-4), confirmation: '', price: null, ticketStatus: 'NOT_ISSUED', tickets: [], userConfirmations: null };
      if (autoTicketable) { reservation.tickets = travellers.map((_, i) => ({ number: `1149${seq}${i}0001`, passenger: '' })); reservation.ticketStatus = 'ISSUED'; }
      reservations.set(clientRef, reservation);
      if (s === 'TIMEOUT') throw Object.assign(new Error('supplier_timeout'), { status: 504, unknownOutcome: true });
      return reservation;
    },
    async retrieve({ clientRef }) { calls.push({ op: 'retrieve', clientRef }); return reservations.get(clientRef) || null; },
    async issue({ reservationId, scenario }) {
      calls.push({ op: 'issue', reservationId });
      if (scenarioOf({ scenario }) === 'TICKETFAIL') throw Object.assign(new Error('supplier_error'), { status: 409, details: { title: 'Ticketing failed' } });
      const r = [...reservations.values()].find((x) => x.reservationId === reservationId);
      if (!r) throw Object.assign(new Error('supplier_error'), { status: 404 });
      r.tickets = Array.from({ length: 1 }, (_, i) => ({ number: `1149${reservationId}${i}0001`, passenger: '' })); r.ticketStatus = 'ISSUED';
      return { tickets: r.tickets };
    },
    async voidTickets({ reservationId }) { calls.push({ op: 'void', reservationId }); const r = [...reservations.values()].find((x) => x.reservationId === reservationId); if (r) { r.ticketStatus = 'VOIDED'; r.status = 'XX'; } return { voided: true }; },
    async cancel({ reservationId }) { calls.push({ op: 'cancel', reservationId }); const r = [...reservations.values()].find((x) => x.reservationId === reservationId); if (r) r.status = 'XX'; return r || null; }
  };
}
