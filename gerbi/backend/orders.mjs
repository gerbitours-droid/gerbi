// Online booking orders (spec docs/specs/25-online-booking-he.md): the order service behind #/book/<id>, "my orders"
// and the admin orders tab. Storage: the KV store only (namespace "orders"); passenger and contact details sealed
// with AES-256-GCM (booking-crypto.mjs). Every status change goes through order-machine.mjs (audit trail).
//
// Modes (BOOKING_MODE):
//   request (default) – the wizard collects everything, nothing is authorized or booked; the order becomes a lead and
//                        a representative completes it by hand. Prices are re-checked with the supplier (read-only).
//   mock              – fake supplier + mock hosted payment page; the whole live flow runs without a real call.
//   live              – real supplier booking + real payment provider. Needs VOLERO_BOOKING_ENABLED=true,
//                        PAYMENT_PROVIDER + its keys, PAYMENT_WEBHOOK_SECRET, BOOKING_DATA_KEY and SITE_URL;
//                        anything missing falls back to request (fail closed) and /api/status says why.
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { transition, audit, flag, unflag, EDITABLE, IN_FLIGHT, TERMINAL, canMove } from './order-machine.mjs';
import { liveSupplier, fakeSupplier, bagSelection, travellersFor, SCENARIOS } from './booking-supplier.mjs';
import { paymentProvider, notifyToken, hmac } from './payments.mjs';
import { createSealer, bookingKey } from './booking-crypto.mjs';
import { validatePassengers, validateContact, titleOf, maskDocument, ilsOf, STATUS_GROUP, requirementsFrom } from '../dist/booking-core.mjs';
import { allow, allowShared, clientOf, LIMITS } from './volero-guard.mjs';
import { tokenMatches, recordLead } from './leads.mjs';
import { sameOrigin, emailSender } from './accounts.mjs';
import { normLang, tIn, homePath } from '../dist/i18n.mjs';

LIMITS.ordersCreate ??= [12, 600_000];
LIMITS.orders ??= [90, 60_000];
LIMITS.ordersNotify ??= [120, 60_000];

const sha = (value) => createHash('sha256').update(String(value)).digest('hex');
const QUOTE_MAX_AGE_MS = 15 * 60_000, PAYMENT_LINK_MS = 10 * 60_000, DRAFT_TTL = 7 * 86400, MAX_INSTALLMENTS = 6;
const ID = /^[0-9a-f-]{36}$/;
const REF_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newRef = () => 'GB' + Array.from(randomBytes(6), (b) => REF_CHARS[b % REF_CHARS.length]).join('');
const production = (env) => env.VERCEL_ENV === 'production' || env.NODE_ENV === 'production';

// Which mode actually runs, and why when it is not the one asked for.
export function bookingMode(env = process.env) {
  const wanted = ['live', 'mock', 'request', 'off'].includes(env.BOOKING_MODE) ? env.BOOKING_MODE : 'request';
  if (wanted === 'mock' && production(env) && env.BOOKING_ALLOW_MOCK !== '1') return { mode: 'request', wanted, reason: 'mock_refused_in_production' };
  if (wanted === 'live') {
    const missing = [['VOLERO_BOOKING_ENABLED', env.VOLERO_BOOKING_ENABLED === 'true'], ['PAYMENT_PROVIDER', env.PAYMENT_PROVIDER === 'payme'], ['PAYME_SELLER_ID', Boolean(env.PAYME_SELLER_ID)],
      ['PAYMENT_WEBHOOK_SECRET', Boolean(env.PAYMENT_WEBHOOK_SECRET)], ['BOOKING_DATA_KEY', Boolean(env.BOOKING_DATA_KEY)], ['SITE_URL', /^https:\/\//.test(env.SITE_URL || '')]].filter(([, ok]) => !ok).map(([k]) => k);
    if (missing.length) return { mode: 'request', wanted, reason: 'live_not_configured', missing };
  }
  return { mode: wanted, wanted };
}

const clean = (value, max = 300) => String(value ?? '').replace(/[<>\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const idOf = (value, max = 200) => (typeof value === 'string' && value.length <= max && /^[A-Za-z0-9._~:=+/-]+$/.test(value) ? value : '');
async function rawBody(req, limit = 16_000) { let raw = ''; for await (const chunk of req) { raw += chunk; if (raw.length > limit) throw new Error('payload_too_large'); } return raw; }

export function createOrders({ store, leadStore = null, env = process.env, now = () => Date.now(), fx = null, dataDirectory = '', supplier = null, payments = undefined, userOf = async () => null, leadCreated = async () => {}, background = (p) => p.catch(() => {}), log = (entry) => console.log(JSON.stringify(entry)), mail = undefined } = {}) {
  const resolved = bookingMode(env), mode = resolved.mode;
  const key = bookingKey(env, dataDirectory), sealer = key ? createSealer(key.secret) : null;
  // Without an encryption key (production without BOOKING_DATA_KEY) no passenger data may be stored: booking is off.
  const enabled = mode !== 'off' && Boolean(sealer);
  const webhookSecret = env.PAYMENT_WEBHOOK_SECRET || (key ? hmac(key.secret, 'payment-webhook-v1') : '');
  const fakeReads = env.BOOKING_SUPPLIER === 'fake' && !production(env);
  const supply = supplier || (mode === 'mock' || fakeReads ? fakeSupplier({ now }) : liveSupplier({ env }));
  const pay = payments !== undefined ? payments : (['mock', 'live'].includes(mode) && webhookSecret ? paymentProvider({ mode, env, store, secret: webhookSecret }) : null);
  const send = mail !== undefined ? mail : emailSender(env);
  const siteUrl = /^https?:\/\//i.test(env.SITE_URL || '') ? env.SITE_URL.replace(/\/+$/, '') : '';
  const iso = () => new Date(now()).toISOString();
  const online = ['mock', 'live'].includes(mode) && Boolean(pay);
  if (resolved.reason) log({ evt: 'booking_mode', level: 'warn', wanted: resolved.wanted, running: mode, reason: resolved.reason, missing: resolved.missing });

  // ---------------------------------------------------------------- storage
  const load = (id) => (ID.test(id) ? store.get(`order:${id}`) : null);
  async function save(order) {
    await store.set(`order:${order.id}`, order, ['draft', 'details', 'priced', 'price_changed'].includes(order.status) && !order.submittedAt ? DRAFT_TTL : undefined);
    return order;
  }
  async function locked(id, fn) {
    const lockKey = `lock:${id}`;
    if ((await store.incr(lockKey, 90)) !== 1) return null;
    try { return await fn(); } finally { await store.del(lockKey).catch(() => {}); }
  }
  const openSealed = (order) => { if (!order?.sealed || !sealer) return null; try { return sealer.open(order.sealed, order.id); } catch { return null; } };
  const reseal = (order, data) => ({ ...order, sealed: sealer.seal(data, order.id) });

  async function rate(currency) {
    if (currency === 'ILS') return { rate: 1, asOf: null };
    try { const table = await fx?.get?.(); const r = table?.rates?.[currency]; return Number.isFinite(r) ? { rate: r, asOf: table.asOf } : null; } catch { return null; }
  }
  async function priced(order, quote, by) {
    const fxRate = await rate(quote.total.currency), ils = fxRate ? ilsOf(quote.total, fxRate.rate) : null;
    const bagsTotal = (quote.bags || []).reduce((sum, b) => sum + (b.options.find((o) => o.code === order.addons?.bags?.[b.route])?.price.value || 0) * b.services.length, 0);
    return { ...order, quote: { ...quote, availabilityToken: quote.availabilityToken }, quotedAt: iso(), expected: quote.total,
      price: { total: quote.total, ils, rate: fxRate?.rate ?? null, rateAsOf: fxRate?.asOf ?? null, bags: Math.round(bagsTotal * 100) / 100, base: Math.round((quote.total.value - bagsTotal) * 100) / 100 }, pricedBy: by };
  }
  const travelDates = (order) => ({ travelStart: order.quote?.legs?.[0]?.date || '', travelEnd: order.quote?.legs?.at(-1)?.arriveDate || order.quote?.legs?.at(-1)?.date || '' });
  const scenarioOf = (order) => (mode === 'mock' ? order.scenario || null : null);

  // ---------------------------------------------------------------- views
  function publicView(order) {
    const data = openSealed(order) || {};
    const passengers = (data.passengers || []).map((p) => ({ ptc: p.ptc, gender: p.gender, firstName: p.firstName, lastName: p.lastName, birthDate: p.birthDate,
      ...(p.document ? { document: { type: p.document.type, number: maskDocument(p.document.number), expiryDate: p.document.expiryDate, nationality: p.document.nationality, issuingCountry: p.document.issuingCountry } } : {}) }));
    const q = order.quote || {};
    return { id: order.id, ref: order.ref, status: order.status, group: STATUS_GROUP[order.status] || 'closed', mode: order.mode, online: order.mode !== 'request', createdAt: order.createdAt, updatedAt: order.updatedAt, lang: order.lang, source: order.source,
      legs: q.legs || [], pax: q.pax || {}, carrier: q.validatingCarrier || '', brand: q.brand || '', requirements: q.requirements || requirementsFrom(), bags: (q.bags || []).map(({ services, ...b }) => ({ ...b, travellers: services.length })),
      nonRefundable: q.nonRefundable ?? null, autoTicketable: q.autoTicketable === true, disclaimer: q.disclaimer || '', items: q.items || [],
      price: order.price || null, priceChange: order.status === 'price_changed' ? order.priceChange || null : null, quotedAt: order.quotedAt || null, quoteExpiresAt: q.timeLimits?.offerExpiration || null,
      passengers, contact: data.contact || null, addons: order.addons || { bags: {}, insurance: false }, terms: order.terms ? { acceptedAt: order.terms.acceptedAt } : null,
      payment: order.payment ? { status: order.payment.status, amount: order.payment.amount, installments: order.payment.installments || 1 } : null,
      supplier: order.supplier ? { pnr: order.supplier.pnr || '', ticketStatus: order.supplier.ticketStatus || '', tickets: (order.supplier.tickets || []).map((t) => t.number) } : null,
      cancelRequested: order.flags?.includes('cancel_requested') || false, piiPurged: Boolean(order.piiPurgedAt),
      timeline: (order.timeline || []).filter((e) => e.to).map((e) => ({ at: e.at, to: e.to, group: STATUS_GROUP[e.to] })),
      maxInstallments: MAX_INSTALLMENTS, canEdit: EDITABLE.includes(order.status) };
  }
  function adminView(order) {
    const data = openSealed(order) || {};
    return { ...publicView(order), passengers: data.passengers || [], contact: data.contact || null, flags: order.flags || [], timeline: order.timeline || [], offer: { srk: order.offer?.srk, offerIndex: order.offer?.offerIndex },
      payment: order.payment || null, supplier: order.supplier || null, quote: { timeLimits: order.quote?.timeLimits, paymentAvailable: order.quote?.paymentAvailable, credit: order.quote?.credit, notices: order.quote?.notices }, userId: order.userId || null, leadId: order.leadId || null, scenario: order.scenario || null };
  }
  const summaryOf = (order) => { const legs = order.quote?.legs || []; return { route: legs.map((l) => l.from).concat(legs.at(-1)?.to || []).join(' → '), start: legs[0]?.date || '', end: legs.at(-1)?.date || '' }; };

  // ---------------------------------------------------------------- notifications
  async function mailCustomer(order, kind) {
    if (!send) return;
    const data = openSealed(order), email = data?.contact?.email;
    if (!email) return;
    const tr = tIn(order.lang), token = data.accessToken, link = siteUrl ? `${siteUrl}${homePath(order.lang)}#/book/${order.id}${token ? '?t=' + token : ''}` : '';
    const s = summaryOf(order);
    try { await send({ to: email, subject: tr(`booking.mail.${kind}Subject`, { ref: order.ref }), text: tr(`booking.mail.${kind}Text`, { name: data.contact.name, ref: order.ref, route: s.route, start: s.start, pnr: order.supplier?.pnr || '-', link }) }); }
    catch (error) { log({ evt: 'booking_email', ok: false, error: error.message }); }
  }
  async function leadFor(order, why) {
    if (!leadStore) return order;
    const data = openSealed(order) || {}, c = data.contact || {}, s = summaryOf(order), pax = order.quote?.pax || {};
    const total = order.price?.ils ? `₪${order.price.ils}` : `${order.price?.total?.value} ${order.price?.total?.currency}`;
    const lines = [`הזמנה ${order.ref} (${order.mode === 'request' ? 'בקשה – לטיפול נציג' : 'אונליין'})`, `מסלול: ${s.route} · ${s.start}${s.end && s.end !== s.start ? ' – ' + s.end : ''}`, `מחיר שאושר: ${total}`,
      order.addons?.insurance ? 'מבקש/ת הצעת ביטוח נסיעות (הראל) – לחזור עם הצעה' : '', why === 'cancel' ? 'בקשת ביטול מהלקוח' : ''].filter(Boolean);
    const record = { id: randomUUID(), createdAt: iso(), status: 'new', type: 'booking', source: `booking:${why}`, lang: order.lang, name: c.name || '', phone: c.phone || '', email: c.email || '', channel: 'phone',
      destinations: s.route, start: s.start, end: s.end, adults: pax.ADT || 0, children: (pax.CHD || 0) + (pax.INF || 0), message: lines.join('\n'), orderId: order.id, orderRef: order.ref, ...(order.userId ? { userId: order.userId } : {}),
      consent: { given: true, text: 'נוצר מתהליך ההזמנה באתר (תנאי השימוש אושרו בהזמנה).', at: iso() } };
    await recordLead(leadStore, record, env);
    try { await leadCreated(record); } catch { /* the customer area link is a nicety */ }
    return { ...order, leadId: record.id };
  }

  // ---------------------------------------------------------------- fulfilment (live / mock)
  async function releaseHold(order) {
    try { await pay.voidAuthorization({ intentId: order.payment.intentId }); return { ...order, payment: { ...order.payment, status: 'voided', voidedAt: iso() } }; }
    catch { return null; }
  }
  async function voidHold(order, reason) {
    try { await pay.voidAuthorization({ intentId: order.payment.intentId }); return transition({ ...order, payment: { ...order.payment, status: 'voided', voidedAt: iso() } }, 'voided', { note: reason }); }
    catch (error) { return flag(transition(order, 'needs_agent', { note: `void_failed: ${error.message}` }), 'void_failed'); }
  }
  async function fulfil(id) {
    return locked(id, async () => {
      let order = await load(id);
      if (!order || !pay) return order;
      const scenario = scenarioOf(order);
      for (let step = 0; step < 6; step++) {
        if (order.status === 'payment_authorized') {
          // Final check between the hold and the booking: the customer pays exactly what was shown.
          try {
            const quote = await supply.price({ ...order.offer, optionalServiceList: bagSelection(order.quote.bags, order.addons?.bags), scenario });
            if (Math.abs(quote.total.value - order.quote.total.value) > 0.009 || quote.total.currency !== order.quote.total.currency) {
              // The hold is released and the order re-opens at the new price: the customer accepts it and pays again.
              const released = await releaseHold(order);
              if (!released) { order = flag(transition(order, 'needs_agent', { note: 'void_failed' }), 'void_failed'); break; }
              const next = await priced(released, quote, 'system');
              order = transition({ ...next, priceChange: { from: order.price.ils, to: next.price.ils, fromOriginal: order.quote.total, toOriginal: quote.total } }, 'price_changed', { note: 'price_changed_before_booking' });
              break;
            }
            order = transition({ ...order, quote: { ...order.quote, availabilityToken: quote.availabilityToken } }, 'booking');
          } catch (error) {
            if (error.message === 'offer_unavailable') {
              const released = await releaseHold(order);
              order = released ? transition(released, 'unavailable', { note: 'sold_out_before_booking' }) : flag(transition(order, 'needs_agent', { note: 'void_failed' }), 'void_failed'); break;
            }
            order = flag(transition(order, 'needs_agent', { note: `final_check_failed: ${error.message}` }), 'final_check_failed'); break;
          }
        } else if (order.status === 'booking') {
          const data = openSealed(order), clientRef = `${order.ref}-${order.payment.attempt}`;
          try {
            // Idempotent: a booking that already went through (a retry after a timeout) is found by its clientRef.
            const existing = await supply.retrieve({ clientRef }).catch(() => null);
            const reservation = existing || await supply.book({ srk: order.offer.srk, offerIndex: order.offer.offerIndex, searchToken: order.offer.searchToken, availabilityToken: order.quote.availabilityToken, clientRef, travellers: travellersFor(data.passengers, data.contact, clientRef), comments: `Gerbi ${order.ref}`, scenario, autoTicketable: order.quote.autoTicketable });
            order = transition({ ...order, supplier: { ...reservation, clientRef, bookedAt: iso() } }, 'booked', { data: { pnr: reservation.pnr } });
            if (reservation.status === 'RQ') { order = flag(transition(order, 'needs_agent', { note: 'on_request' }), 'on_request'); break; }
            if (reservation.price?.value && reservation.price.value > order.quote.total.value + 0.009) { order = flag(transition(order, 'needs_agent', { note: 'supplier_price_higher' }), 'price_mismatch'); break; }
          } catch (error) {
            if (error.unknownOutcome) {
              const found = await supply.retrieve({ clientRef }).catch(() => null);
              if (found) { order = transition({ ...order, supplier: { ...found, clientRef, bookedAt: iso() } }, 'booked', { note: 'found_after_timeout' }); continue; }
              order = flag(transition({ ...order, supplier: { clientRef } }, 'needs_agent', { note: 'booking_outcome_unknown' }), 'booking_unknown'); break;
            }
            order = transition({ ...order, supplier: { clientRef, error: error.details?.title || error.message } }, 'booking_failed', { note: error.message });
            order = await voidHold(order, 'booking_failed'); break;
          }
        } else if (order.status === 'booked') {
          try {
            let tickets;
            if (order.quote.autoTicketable || order.supplier.ticketStatus === 'ISSUED') {
              // The airline issues on booking: read the ticket numbers back; none yet → a person confirms before any charge.
              const issued = order.supplier.tickets?.length ? order.supplier : await supply.retrieve({ clientRef: order.supplier.clientRef }).catch(() => null);
              if (!issued?.tickets?.length) { order = flag(transition(order, 'needs_agent', { note: 'tickets_not_confirmed' }), 'ticketing_unconfirmed'); break; }
              tickets = { tickets: issued.tickets };
            } else tickets = await supply.issue({ reservationId: order.supplier.reservationId, scenario });
            order = transition({ ...order, supplier: { ...order.supplier, ticketStatus: 'ISSUED', tickets: tickets.tickets, ticketedAt: iso() } }, 'ticketed');
          } catch (error) { order = flag(transition(order, 'needs_agent', { note: `ticketing_failed: ${error.message}` }), 'ticketing_failed'); break; }
        } else if (order.status === 'ticketed') {
          try { await pay.capture({ intentId: order.payment.intentId, amount: order.payment.amount }); order = transition({ ...order, payment: { ...order.payment, status: 'captured', capturedAt: iso() } }, 'confirmed'); }
          catch (error) { order = flag(transition(order, 'needs_agent', { note: `capture_failed: ${error.message}` }), 'capture_failed'); break; }
        } else break;
      }
      await save(order);
      log({ evt: 'booking_fulfil', ref: order.ref, status: order.status, flags: order.flags || [] });
      if (order.status === 'confirmed' && !order.confirmedMailAt) {
        await mailCustomer(order, 'confirmed');
        let next = { ...order, confirmedMailAt: iso() };
        if (order.addons?.insurance) next = await leadFor(next, 'insurance');
        order = await save(next);
      }
      if (order.status === 'needs_agent' && !order.agentLeadId) order = await save({ ...(await leadFor(order, 'agent')), agentLeadId: true });
      return order;
    });
  }

  // ---------------------------------------------------------------- payment notifications
  async function notification(providerName, orderId, token, input) {
    if (!pay || providerName !== pay.name || !ID.test(orderId) || !/^[a-f0-9]{32}$/.test(token) || token !== notifyToken(webhookSecret, orderId)) return { code: 404 };
    const event = await pay.verifyNotification(input).catch(() => null);
    if (!event || (event.orderId && event.orderId !== orderId)) { log({ evt: 'payment_notify', ok: false, error: 'unverified' }); return { code: 400 }; }
    if (event.eventId && await store.get(`evt:${sha(event.eventId)}`)) return { code: 200, duplicate: true };
    const result = await locked(orderId, async () => {
      let order = await load(orderId);
      if (!order || order.payment?.intentId !== event.intentId) return { code: 404 };
      if (event.amount !== order.payment.amount) { await save(flag(audit(order, 'payment_amount_mismatch', { by: 'webhook' }), 'payment_mismatch')); return { code: 200 }; }
      if (event.status === 'authorized' && order.status === 'payment_pending') order = transition({ ...order, payment: { ...order.payment, status: 'authorized', authorizedAt: iso(), installments: event.installments || 1 } }, 'payment_authorized', { by: 'webhook' });
      else if (event.status === 'failed' && order.status === 'payment_pending') order = transition({ ...order, payment: { ...order.payment, status: 'failed' } }, 'payment_failed', { by: 'webhook' });
      else order = audit(order, `payment_${event.status}_ignored`, { by: 'webhook' });
      await save(order);
      return { code: 200, order };
    });
    if (!result) return { code: 503 }; // busy: the provider retries
    if (event.eventId) await store.set(`evt:${sha(event.eventId)}`, { at: iso() }, 30 * 86400);
    if (result.order?.status === 'payment_authorized') background(fulfil(orderId));
    return result;
  }

  // ---------------------------------------------------------------- reconciliation
  async function ids(limit = 500) { return [...new Set((await store.list('index', limit)).map((x) => x.id))]; }
  async function reconcile({ by = 'reconcile' } = {}) {
    const report = { checked: 0, advanced: 0, expired: 0, flagged: 0, purged: 0 }, at = now();
    const age = (iso8601) => at - Date.parse(iso8601 || 0);
    const piiDays = Math.max(30, Number.parseInt(env.BOOKING_PII_RETENTION_DAYS, 10) || 90);
    for (const id of await ids()) {
      let order = await load(id);
      if (!order) continue;
      report.checked++;
      const before = JSON.stringify([order.status, order.flags]);
      if (EDITABLE.includes(order.status) && !order.submittedAt && age(order.updatedAt) > 24 * 3600_000) { order = transition({ ...order, sealed: null, piiPurgedAt: iso() }, 'expired', { by }); report.expired++; }
      else if (order.status === 'payment_pending' && pay && age(order.payment?.createdAt) > 30 * 60_000) {
        const status = await pay.status({ intentId: order.payment.intentId }).catch(() => 'unknown');
        if (status === 'authorized') { order = transition({ ...order, payment: { ...order.payment, status: 'authorized', authorizedAt: iso() } }, 'payment_authorized', { by, note: 'found_by_reconcile' }); }
        else if (age(order.payment?.createdAt) > 2 * 3600_000) { order = transition(order, 'expired', { by, note: `payment_${status}` }); report.expired++; }
      }
      if (['payment_authorized', 'booking', 'booked', 'ticketed'].includes(order.status) && age(order.updatedAt) > 60_000) { await save(order); order = (await fulfil(id)) || order; }
      if (order.status === 'needs_agent' && order.flags?.includes('booking_unknown') && order.supplier?.clientRef) {
        const found = await supply.retrieve({ clientRef: order.supplier.clientRef }).catch(() => null);
        if (found && !order.flags.includes('found_by_reconcile')) order = flag(audit({ ...order, supplier: { ...order.supplier, ...found } }, 'reservation_found', { by, data: { pnr: found.pnr } }), 'found_by_reconcile');
      }
      if (order.payment?.status === 'authorized' && age(order.payment.authorizedAt) > 5 * 86400_000) order = flag(order, 'hold_expiring');
      if (order.status === 'booked' && order.quote?.timeLimits?.ticketingTimeLimit && Date.parse(order.quote.timeLimits.ticketingTimeLimit) - at < 2 * 3600_000) order = flag(order, 'ticketing_deadline');
      const travelEnd = order.quote?.legs?.at(-1)?.date;
      if (order.sealed && !IN_FLIGHT.includes(order.status) && travelEnd && at - Date.parse(travelEnd + 'T23:59:59Z') > piiDays * 86400_000) { order = audit({ ...order, sealed: null, piiPurgedAt: iso() }, 'pii_purged', { by }); report.purged++; }
      if (JSON.stringify([order.status, order.flags]) !== before || order.piiPurgedAt) { await save(order); if (order.status !== JSON.parse(before)[0]) report.advanced++; if ((order.flags || []).length > (JSON.parse(before)[1] || []).length) report.flagged++; }
    }
    log({ evt: 'booking_reconcile', ...report });
    return report;
  }

  // ---------------------------------------------------------------- customer actions
  async function access(req, order) {
    if (!order) return false;
    const token = String(req.headers['x-order-token'] || '');
    if (/^[A-Za-z0-9_-]{20,80}$/.test(token) && sha(token) === order.accessHash) return true;
    const user = await userOf(req).catch(() => null);
    return Boolean(user && order.userId && user === order.userId);
  }

  async function create(req, input, l) {
    if (input?.kind === 'hotel') return [501, { error: 'hotel_booking_disabled' }];
    const offer = input?.offer || {};
    const ref = { srk: idOf(offer.srk), offerIndex: idOf(offer.offerIndex), searchToken: idOf(offer.searchToken, 4000), itineraryIndex: Number.isInteger(offer.itineraryIndex) && offer.itineraryIndex >= 0 && offer.itineraryIndex < 100 ? offer.itineraryIndex : 0 };
    if (!ref.srk || !ref.offerIndex || !ref.searchToken) return [400, { error: 'offer_required' }];
    const idem = typeof req.headers['idempotency-key'] === 'string' && /^[A-Za-z0-9-]{16,64}$/.test(req.headers['idempotency-key']) ? `idem:${sha(req.headers['idempotency-key'])}` : '';
    if (idem) { const seen = await store.get(idem); if (seen) { const order = await load(seen.id); if (order) return [200, { id: order.id, token: seen.token, order: publicView(order), repeated: true }]; } }
    let quote;
    try { quote = await supply.price({ ...ref }); }
    catch (error) { return error.message === 'offer_unavailable' ? [410, { error: 'offer_unavailable' }] : [502, { error: 'price_check_failed' }]; }
    if (!quote.pax.ADT) return [400, { error: 'offer_invalid' }];
    const token = randomBytes(24).toString('base64url'), userId = await userOf(req).catch(() => null);
    let order = { id: randomUUID(), ref: newRef(), mode, kind: 'flight', source: ['flights', 'multi', 'builder', 'saved'].includes(input.source) ? input.source : 'flights', lang: l, status: 'draft', createdAt: iso(), updatedAt: iso(),
      offer: ref, addons: { bags: {}, insurance: input.insurance === true }, accessHash: sha(token), ...(userId ? { userId } : {}), timeline: [{ at: iso(), to: 'draft', by: 'customer' }] };
    order = await priced(order, quote, 'customer');
    order.sealed = sealer.seal({ accessToken: token }, order.id);
    await save(order);
    await store.push('index', { id: order.id, createdAt: order.createdAt }, 5000);
    if (userId) await store.set(`user:${userId}`, [order.id, ...((await store.get(`user:${userId}`)) || [])].slice(0, 50));
    if (idem) await store.set(idem, { id: order.id, token }, 86400);
    log({ evt: 'booking_order', op: 'create', ref: order.ref, mode });
    return [201, { id: order.id, token, order: publicView(order) }];
  }

  async function recheck(order, by) {
    try {
      const quote = await supply.price({ ...order.offer, optionalServiceList: bagSelection(order.quote.bags, order.addons?.bags), scenario: scenarioOf(order) });
      const expected = order.expected || order.price?.total;
      let next = await priced(order, quote, by);
      const changed = expected && (Math.abs(quote.total.value - expected.value) > 0.009 || quote.total.currency !== expected.currency);
      next = changed ? transition({ ...next, priceChange: { from: order.price.ils, to: next.price.ils, fromOriginal: expected, toOriginal: quote.total } }, 'price_changed', { by, note: `${expected.value}→${quote.total.value} ${quote.total.currency}` })
        : transition(next, 'priced', { by });
      return next;
    } catch (error) {
      if (error.message === 'offer_unavailable') return transition(order, 'unavailable', { by });
      throw error;
    }
  }

  // Before money moves: terms accepted, the shown total confirmed, a fresh quote (re-checked when older than 15 min).
  async function readyToCommit(order, input) {
    if (input?.terms !== true || input?.cancellation !== true) return [400, { error: 'terms_required' }];
    if (!order.price?.ils && order.mode !== 'request') return [503, { error: 'fx_unavailable' }];
    if (now() - Date.parse(order.quotedAt) > QUOTE_MAX_AGE_MS) {
      order = await recheck(order, 'system');
      if (order.status !== 'priced') { await save(order); return [409, { error: order.status === 'unavailable' ? 'offer_unavailable' : 'price_changed', order: publicView(order) }]; }
    }
    const shown = Number(input.expectedTotal);
    if (order.price?.ils ? shown !== order.price.ils : shown !== order.price?.total?.value) return [409, { error: 'price_mismatch', order: publicView(order) }];
    return [0, { ...order, terms: { acceptedAt: iso(), version: '2026-11-15', cancellationShown: true } }];
  }

  async function act(req, order, action, input, l) {
    const by = 'customer';
    if (action === 'passengers') {
      if (!EDITABLE.includes(order.status)) return [409, { error: 'not_editable' }];
      const dates = travelDates(order);
      const pax = order.quote.pax, { value, errors, warnings } = validatePassengers(input.passengers, { pax, requirements: order.quote.requirements, ...dates, today: iso().slice(0, 10), lang: l });
      const contact = validateContact(input.contact, l);
      if (!value || !contact.value) return [400, { error: 'details_invalid', fields: { ...errors, ...Object.fromEntries(Object.entries(contact.errors).map(([k, v]) => [`contact.${k}`, v])) }, warnings }];
      const passengers = value.map((p) => ({ ...p, title: titleOf(p.ptc, p.gender) }));
      const previous = openSealed(order) || {};
      let next = reseal(order, { ...previous, passengers, contact: contact.value });
      next = order.status === 'details' ? audit(next, 'details_updated', { by }) : transition(next, 'details', { by });
      // Mock mode: a passenger surname can script a failure, like a payment gateway's test card numbers.
      if (mode === 'mock') next.scenario = SCENARIOS.find((s) => passengers.some((p) => p.lastName === s)) || null;
      return [200, { order: publicView(await save(next)), warnings }];
    }
    if (action === 'addons') {
      if (!EDITABLE.includes(order.status) || order.status === 'draft') return [409, { error: 'not_editable' }];
      const bags = {};
      for (const bag of order.quote.bags || []) { const code = input?.bags?.[bag.route]; if (code && bag.options.some((o) => o.code === code)) bags[bag.route] = code; }
      // The total the customer now expects: the fare without bags plus the chosen bags (checked again at the re-check).
      const bagSum = (order.quote.bags || []).reduce((sum, b) => sum + (b.options.find((o) => o.code === bags[b.route])?.price.value || 0) * b.services.length, 0);
      const expected = { value: Math.round(((order.price?.base ?? order.quote.total.value) + bagSum) * 100) / 100, currency: order.quote.total.currency };
      const next = audit({ ...order, addons: { bags, insurance: input?.insurance === true }, expected }, 'addons_updated', { by });
      return [200, { order: publicView(await save(next)) }];
    }
    if (action === 'recheck') {
      if (!['details', 'priced', 'price_changed', 'payment_failed'].includes(order.status)) return [409, { error: 'not_ready' }];
      const before = order.status, next = await save(await recheck(order, by));
      return [200, { order: publicView(next), changed: next.status === 'price_changed' && before !== 'price_changed' || next.status === 'price_changed' }];
    }
    if (action === 'accept-price') {
      if (order.status !== 'price_changed') return [409, { error: 'not_needed' }];
      return [200, { order: publicView(await save(transition({ ...order, priceChange: null }, 'priced', { by, note: 'new_price_accepted' }))) }];
    }
    if (action === 'submit') {
      if (order.mode !== 'request') return [409, { error: 'wrong_mode' }];
      if (order.status !== 'priced') return [409, { error: 'not_ready' }];
      const [code, ready] = await readyToCommit(order, input);
      if (code) return [code, ready];
      let next = transition({ ...ready, submittedAt: iso() }, 'requested', { by });
      next = await leadFor(next, 'request');
      await save(next);
      await mailCustomer(next, 'requested');
      return [200, { order: publicView(next) }];
    }
    if (action === 'pay') {
      if (!online || order.mode === 'request') return [409, { error: 'wrong_mode' }];
      if (order.status === 'payment_pending' && order.payment?.redirectUrl && now() - Date.parse(order.payment.createdAt) < PAYMENT_LINK_MS) return [200, { redirectUrl: order.payment.redirectUrl, order: publicView(order) }];
      if (!['priced', 'payment_failed'].includes(order.status)) return [409, { error: 'not_ready' }];
      const [code, ready] = await readyToCommit(order.status === 'payment_failed' ? { ...order, status: 'priced' } : order, input);
      if (code) return [code, ready];
      const data = openSealed(order), attempt = (order.payment?.attempt || 0) + 1, amount = ready.price.ils * 100;
      const returnUrl = `${siteUrl}${homePath(order.lang)}#/book/${order.id}`, notifyUrl = `${siteUrl}/api/payments/notify/${pay.name}/${order.id}/${notifyToken(webhookSecret, order.id)}`;
      let intent;
      try { intent = await pay.createPayment({ orderId: order.id, attempt, amount, currency: 'ILS', description: `Gerbi Tours ${order.ref}`, customer: data?.contact || {}, returnUrl, notifyUrl, lang: order.lang, maxInstallments: MAX_INSTALLMENTS }); }
      catch (error) { log({ evt: 'payment_create', ok: false, error: error.message }); return [502, { error: 'payment_unavailable' }]; }
      const next = transition({ ...ready, status: order.status, submittedAt: order.submittedAt || iso(), payment: { provider: pay.name, intentId: intent.intentId, redirectUrl: intent.redirectUrl, amount, currency: 'ILS', attempt, installments: 1, status: 'pending', createdAt: iso() } }, 'payment_pending', { by });
      await save(next);
      return [200, { redirectUrl: intent.redirectUrl, order: publicView(next) }];
    }
    if (action === 'continue') {
      // The return page nudges a fulfilment that a lost notification or a cold instance left behind.
      if (['payment_authorized', 'booking', 'booked', 'ticketed'].includes(order.status)) background(fulfil(order.id));
      return [200, { order: publicView(order) }];
    }
    if (action === 'cancel') {
      if (!EDITABLE.includes(order.status)) return [409, { error: 'not_cancellable' }];
      return [200, { order: publicView(await save(transition({ ...order, sealed: null, piiPurgedAt: iso() }, 'cancelled', { by, note: 'customer_abandoned' }))) }];
    }
    if (action === 'cancel-request') {
      if (EDITABLE.includes(order.status) || TERMINAL.includes(order.status) || order.flags?.includes('cancel_requested')) return [409, { error: 'not_cancellable' }];
      let next = flag(audit(order, 'cancel_requested', { by, note: clean(input?.reason, 300) }), 'cancel_requested');
      next = await leadFor(next, 'cancel');
      return [200, { order: publicView(await save(next)) }];
    }
    return [404, { error: 'not_found' }];
  }

  // ---------------------------------------------------------------- admin
  async function adminAction(order, input) {
    const by = 'admin', action = String(input?.action || ''), note = clean(input?.note, 300);
    const move = (o, to, extra = {}) => { if (!canMove(o.status, to)) throw Object.assign(new Error('invalid_transition'), { status: 409 }); return transition({ ...o, ...extra }, to, { by, note }); };
    switch (action) {
      case 'note': if (!note) throw Object.assign(new Error('note_required'), { status: 400 }); return audit(order, 'note', { by, note });
      case 'in_progress': return move(order, 'in_progress');
      case 'confirm': {
        const pnr = clean(input?.pnr, 12).toUpperCase(), tickets = (Array.isArray(input?.tickets) ? input.tickets : String(input?.tickets || '').split(/[\s,]+/)).map((t) => clean(t, 20)).filter((t) => /^[0-9A-Z-]{6,20}$/.test(t)).slice(0, 9);
        if (!/^[A-Z0-9]{5,8}$/.test(pnr)) throw Object.assign(new Error('pnr_required'), { status: 400 });
        const next = move(order, 'confirmed', { supplier: { ...(order.supplier || {}), pnr, tickets: tickets.map((number) => ({ number })), ticketStatus: tickets.length ? 'ISSUED' : (order.supplier?.ticketStatus || 'NOT_ISSUED'), manual: true } });
        await mailCustomer(next, 'confirmed'); return { ...next, confirmedMailAt: iso() };
      }
      case 'mark_ticketed': {
        const tickets = String(input?.tickets || '').split(/[\s,]+/).map((t) => clean(t, 20)).filter((t) => /^[0-9A-Z-]{6,20}$/.test(t)).slice(0, 9);
        return move(order, 'ticketed', { supplier: { ...(order.supplier || {}), ticketStatus: 'ISSUED', tickets: tickets.map((number) => ({ number })), manual: true } });
      }
      case 'resume': {
        // Back into the automatic flow after the agent fixed the cause (e.g. tickets issued by hand → capture).
        const to = ['booked', 'ticketed'].includes(input?.to) ? input.to : order.flags?.includes('capture_failed') ? 'ticketed' : 'booked';
        if (!order.payment?.intentId || order.payment.status !== 'authorized') throw Object.assign(new Error('no_authorized_payment'), { status: 409 });
        const next = move(order, to); await save(next); return (await fulfil(order.id)) || next;
      }
      case 'capture': {
        if (!pay || order.payment?.status !== 'authorized') throw Object.assign(new Error('no_authorized_payment'), { status: 409 });
        await pay.capture({ intentId: order.payment.intentId, amount: order.payment.amount });
        return move(order, 'confirmed', { payment: { ...order.payment, status: 'captured', capturedAt: iso() } });
      }
      case 'void_payment': {
        if (!pay || order.payment?.status !== 'authorized') throw Object.assign(new Error('no_authorized_payment'), { status: 409 });
        await pay.voidAuthorization({ intentId: order.payment.intentId });
        return move(order, 'voided', { payment: { ...order.payment, status: 'voided', voidedAt: iso() } });
      }
      case 'refund': {
        if (!pay || order.payment?.status !== 'captured') throw Object.assign(new Error('no_captured_payment'), { status: 409 });
        const amount = Math.round(Number(input?.amount) * 100) || order.payment.amount;
        if (amount <= 0 || amount > order.payment.amount) throw Object.assign(new Error('amount_invalid'), { status: 400 });
        await pay.refund({ intentId: order.payment.intentId, amount });
        return move(order, 'refunded', { payment: { ...order.payment, status: amount === order.payment.amount ? 'refunded' : 'partially_refunded', refunded: amount, refundedAt: iso() } });
      }
      case 'cancel': {
        let next = order;
        if (order.payment?.status === 'authorized' && pay) { await pay.voidAuthorization({ intentId: order.payment.intentId }); next = { ...next, payment: { ...next.payment, status: 'voided', voidedAt: iso() } }; }
        return move(next, 'cancelled');
      }
      case 'resolve_flag': return audit(unflag(order, clean(input?.flag, 40)), 'flag_resolved', { by, note: clean(input?.flag, 40) });
      default: throw Object.assign(new Error('unknown_action'), { status: 400 });
    }
  }
  const csvCell = (value) => { let s = String(value ?? ''); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  function ordersCsv(orders) {
    const head = ['תאריך', 'מספר הזמנה', 'מצב', 'אופן', 'מסלול', 'יציאה', 'חזרה', 'נוסעים', 'סה״כ ₪', 'מחיר מקור', 'PNR', 'כרטיסים', 'תשלום', 'שם', 'טלפון', 'מייל', 'ביטוח', 'דגלים'];
    const rows = orders.map((o) => { const v = adminView(o), s = summaryOf(o); return [o.createdAt, o.ref, o.status, o.mode, s.route, s.start, s.end, Object.entries(v.pax).filter(([, n]) => n).map(([k, n]) => `${k}×${n}`).join(' '), o.price?.ils ?? '', o.price?.total ? `${o.price.total.value} ${o.price.total.currency}` : '', o.supplier?.pnr || '', (o.supplier?.tickets || []).map((t) => t.number).join(' '), o.payment?.status || '', v.contact?.name || '', v.contact?.phone || '', v.contact?.email || '', o.addons?.insurance ? 'כן' : '', (o.flags || []).join(' ')]; });
    return '﻿' + [head, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
  }
  let lastAutoReconcile = 0;

  // ---------------------------------------------------------------- HTTP
  async function route(req, res, url, { send: reply, body }) {
    const path = url.pathname, method = req.method, ip = clientOf(req);
    // Payment provider → server (no Origin; authenticated by the URL token + the provider's own verification).
    let m = /^\/api\/payments\/notify\/([a-z]+)\/([0-9a-f-]{36})\/([a-f0-9]{32})$/.exec(path);
    if (m) {
      if (method !== 'POST') return reply(405, { error: 'method_not_allowed' });
      if (!allow(ip, 'ordersNotify')) return reply(429, { error: 'rate_limited' });
      const raw = await rawBody(req), form = /urlencoded/.test(req.headers['content-type'] || '') ? Object.fromEntries(new URLSearchParams(raw)) : {};
      const result = await notification(m[1], m[2], m[3], { headers: req.headers, rawBody: raw, form });
      return reply(result.code, result.code === 200 ? { received: true } : { error: 'rejected' });
    }
    // Mock hosted payment page (mock mode only).
    m = /^\/api\/payments\/mock\/(mock_[A-Za-z0-9_]+)$/.exec(path);
    if (m) {
      if (!pay || pay.name !== 'mock') return reply(404, { error: 'not_found' });
      const intent = await pay.intent(m[1]);
      if (!intent) return reply(404, { error: 'not_found' });
      const order = await load(intent.orderId), tr = tIn(order?.lang);
      if (method === 'GET') {
        const options = Array.from({ length: intent.maxInstallments || 1 }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' });
        return res.end(`<!doctype html><html lang="${order?.lang === 'en' ? 'en' : 'he'}" dir="${order?.lang === 'en' ? 'ltr' : 'rtl'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${tr('booking.mock.title')}</title>
<style>body{font-family:system-ui,sans-serif;background:#f4f6f8;margin:0;padding:24px;color:#14213d}main{max-width:440px;margin:auto;background:#fff;border-radius:16px;padding:24px;box-shadow:0 6px 24px #0001}strong.amount{font-size:2rem;display:block;margin:8px 0}button{font:inherit;padding:12px 18px;border-radius:10px;border:0;margin-top:12px;width:100%;cursor:pointer}.ok{background:#ffd23f}.no{background:#e9edf2}label{display:block;margin-top:12px}select{font:inherit;padding:8px;width:100%}.note{font-size:.9rem;color:#5b6575}</style></head>
<body><main><p class="note">${tr('booking.mock.notice')}</p><h1>${tr('booking.mock.heading')}</h1><p>${clean(intent.description, 120)}</p><strong class="amount" dir="ltr">₪${(intent.amount / 100).toLocaleString('en-US')}</strong>
<form method="post"><label>${tr('booking.mock.installments')}<select name="installments">${options}</select></label><button class="ok" name="action" value="approve" type="submit">${tr('booking.mock.approve')}</button><button class="no" name="action" value="decline" type="submit">${tr('booking.mock.decline')}</button></form></main></body></html>`);
      }
      if (method !== 'POST') return reply(405, { error: 'method_not_allowed' });
      if (!sameOrigin(req, env)) return reply(403, { error: 'bad_origin' });
      const form = Object.fromEntries(new URLSearchParams(await rawBody(req, 2000)));
      const done = await pay.complete(m[1], form.action === 'approve', Math.max(1, Math.min(intent.maxInstallments || 1, Number.parseInt(form.installments, 10) || 1)));
      // The "provider" notifies the server exactly like a real gateway would: signed body to the notify URL.
      if (done) await notification('mock', intent.orderId, notifyToken(webhookSecret, intent.orderId), { headers: { 'x-mock-signature': done.signature }, rawBody: done.body });
      res.writeHead(303, { Location: intent.returnUrl || '/', 'Cache-Control': 'no-store' });
      return res.end();
    }
    // Vercel cron / external scheduler.
    if (path === '/api/orders/cron/reconcile') {
      if (!env.CRON_SECRET || !tokenMatches(req.headers.authorization, env.CRON_SECRET)) return reply(401, { error: 'unauthorized' });
      return reply(200, await reconcile());
    }
    // ---- admin (owner session bridged to the token by backend/admin.mjs, or the token itself)
    if (path === '/api/orders/admin' || path.startsWith('/api/orders/admin/')) {
      if (!env.LEADS_ADMIN_TOKEN) return reply(404, { error: 'not_found' });
      if (!allow(ip, 'leadsAdmin')) return reply(429, { error: 'rate_limited' });
      if (!tokenMatches(req.headers.authorization, env.LEADS_ADMIN_TOKEN)) return reply(401, { error: 'unauthorized' });
      const sub = path.slice('/api/orders/admin'.length);
      if (method === 'GET' && (sub === '' || sub === '/')) {
        if (now() - lastAutoReconcile > 10 * 60_000) { lastAutoReconcile = now(); background(reconcile({ by: 'reconcile' })); }
        const status = url.searchParams.get('status') || '', q = clean(url.searchParams.get('q'), 60).toLowerCase(), flagged = url.searchParams.get('flagged') === '1';
        const orders = (await Promise.all((await ids()).map((id) => load(id)))).filter(Boolean)
          .filter((o) => (!status || o.status === status || STATUS_GROUP[o.status] === status) && (!flagged || (o.flags || []).length))
          .map((o) => { const v = adminView(o); return { id: o.id, ref: o.ref, status: o.status, group: v.group, mode: o.mode, createdAt: o.createdAt, updatedAt: o.updatedAt, route: summaryOf(o).route, start: summaryOf(o).start, pax: v.pax, price: o.price, contact: v.contact ? { name: v.contact.name, phone: v.contact.phone, email: v.contact.email } : null, flags: o.flags || [], pnr: o.supplier?.pnr || '', insurance: o.addons?.insurance === true }; })
          .filter((o) => !q || [o.ref, o.route, o.pnr, o.contact?.name, o.contact?.phone, o.contact?.email].some((v) => String(v || '').toLowerCase().includes(q)));
        const counts = {}; for (const o of orders) counts[o.status] = (counts[o.status] || 0) + 1;
        return reply(200, { orders, counts, mode, wanted: resolved.wanted, reason: resolved.reason || null, missing: resolved.missing || [] });
      }
      if (method === 'GET' && sub === '/export.csv') {
        const orders = (await Promise.all((await ids()).map((id) => load(id)))).filter(Boolean);
        res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="gerbi-orders-${iso().slice(0, 10)}.csv"`, 'Cache-Control': 'no-store' });
        return res.end(ordersCsv(orders));
      }
      if (method === 'POST' && sub === '/reconcile') return reply(200, await reconcile({ by: 'admin' }));
      m = /^\/([0-9a-f-]{36})(\/action)?$/.exec(sub);
      if (!m) return reply(404, { error: 'not_found' });
      if (method === 'GET' && !m[2]) { const order = await load(m[1]); return order ? reply(200, { order: adminView(order) }) : reply(404, { error: 'not_found' }); }
      if (method === 'POST' && m[2]) {
        const input = await body(req, 8000);
        const result = await locked(m[1], async () => {
          const order = await load(m[1]);
          if (!order) return [404, { error: 'not_found' }];
          try { const next = await adminAction(order, input); await save(next); log({ evt: 'booking_admin', ref: order.ref, action: input?.action, status: next.status }); return [200, { order: adminView((await load(m[1])) || next) }]; }
          catch (error) { return [error.status || 502, { error: error.message }]; }
        });
        return result ? reply(...result) : reply(409, { error: 'busy' });
      }
      return reply(405, { error: 'method_not_allowed' });
    }
    // ---- customer
    if (path === '/api/orders/config' && method === 'GET') return reply(200, { enabled, mode, online, insurance: true, maxInstallments: MAX_INSTALLMENTS, hotels: false });
    if (!enabled) return reply(503, { error: 'booking_unavailable' });
    if (method === 'POST') {
      if (!sameOrigin(req, env)) return reply(403, { error: 'bad_origin' });
      if (!/^application\/json\b/i.test(req.headers['content-type'] || '')) return reply(415, { error: 'json_required' });
    } else if (method !== 'GET') return reply(405, { error: 'method_not_allowed' });
    if (!allow(ip, 'orders')) return reply(429, { error: 'rate_limited' });
    const input = method === 'POST' ? await body(req, 32_000) : {};
    const l = normLang(input?.lang || url.searchParams.get('lang'));
    if (path === '/api/orders' && method === 'POST') {
      if (!(await allowShared(ip, 'ordersCreate'))) return reply(429, { error: 'rate_limited' });
      return reply(...await create(req, input, l));
    }
    if (path === '/api/orders/mine' && method === 'GET') {
      const user = await userOf(req).catch(() => null);
      const own = user ? (await Promise.all(((await store.get(`user:${user}`)) || []).map((id) => load(id)))).filter(Boolean) : [];
      return reply(200, { orders: own.map(publicView), signedIn: Boolean(user) });
    }
    if (path === '/api/orders/lookup' && method === 'POST') {
      const items = (Array.isArray(input?.items) ? input.items : []).slice(0, 20), found = [];
      for (const item of items) { const order = await load(String(item?.id || '')); if (order && /^[A-Za-z0-9_-]{20,80}$/.test(String(item?.token || '')) && sha(item.token) === order.accessHash) found.push(publicView(order)); }
      return reply(200, { orders: found });
    }
    m = /^\/api\/orders\/([0-9a-f-]{36})(?:\/([a-z-]+))?$/.exec(path);
    if (!m) return reply(404, { error: 'not_found' });
    const order = await load(m[1]);
    // Unknown order and no access look the same.
    if (!(await access(req, order))) return reply(404, { error: 'not_found' });
    if (method === 'GET' && !m[2]) return reply(200, { order: publicView(order) });
    if (method !== 'POST' || !m[2]) return reply(405, { error: 'method_not_allowed' });
    const result = await locked(order.id, async () => act(req, (await load(order.id)) || order, m[2], input, l));
    return result ? reply(...result) : reply(409, { error: 'busy' });
  }

  return {
    mode, enabled, online, resolved, supplier: supply, payments: pay,
    status: () => ({ mode, wanted: resolved.wanted, reason: resolved.reason || null, missing: resolved.missing || [], enabled, online, payment: pay?.name || null, supplier: supply.kind, encryption: key?.source || null }),
    reconcile, fulfil, notification,
    async handle(req, res, url, helpers) {
      if (!url.pathname.startsWith('/api/orders') && !url.pathname.startsWith('/api/payments/')) return false;
      try { await route(req, res, url, helpers); }
      catch (error) {
        if (['payload_too_large', 'invalid_json'].includes(error.message)) throw error;
        log({ evt: 'booking', ok: false, error: String(error.message).slice(0, 80) });
        helpers.send(503, { error: 'booking_unavailable' });
      }
      return true;
    }
  };
}
