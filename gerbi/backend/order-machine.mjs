// Order lifecycle (spec 25 §4). Pure: no I/O. Every status change goes through transition(), which refuses moves the
// table does not allow and appends an audit entry (who, when, from → to, note) to the order's timeline.
//
//   draft → details → priced ─┬─ request mode ─→ requested → in_progress → confirmed
//                    ↕ price_changed           └─ live/mock ─→ payment_pending → payment_authorized → booking → booked → ticketed → confirmed
//   failures: unavailable (seat gone) · payment_failed (retry) · booking_failed → voided (authorization released)
//             any uncertain outcome → needs_agent (a person decides) · confirmed → refund_pending → refunded
export const TRANSITIONS = {
  draft: ['details', 'unavailable', 'cancelled', 'expired'],
  details: ['details', 'priced', 'price_changed', 'unavailable', 'cancelled', 'expired'],
  price_changed: ['details', 'priced', 'price_changed', 'unavailable', 'cancelled', 'expired'],
  priced: ['details', 'priced', 'price_changed', 'unavailable', 'requested', 'payment_pending', 'cancelled', 'expired'],
  requested: ['in_progress', 'confirmed', 'cancelled'],
  in_progress: ['confirmed', 'cancelled'],
  payment_pending: ['payment_authorized', 'payment_failed', 'expired', 'cancelled', 'needs_agent'],
  payment_failed: ['payment_pending', 'details', 'priced', 'price_changed', 'unavailable', 'cancelled', 'expired'],
  // A final price check runs after the authorization: a change releases the hold and asks the customer again.
  payment_authorized: ['booking', 'price_changed', 'unavailable', 'voided', 'needs_agent'],
  booking: ['booked', 'booking_failed', 'needs_agent'],
  booking_failed: ['voided', 'needs_agent'],
  booked: ['ticketed', 'needs_agent', 'cancelled'],
  ticketed: ['confirmed', 'needs_agent'],
  confirmed: ['refund_pending', 'refunded', 'cancelled'],
  needs_agent: ['booked', 'ticketed', 'confirmed', 'voided', 'cancelled', 'refund_pending', 'refunded'],
  refund_pending: ['refunded', 'needs_agent'],
  cancelled: ['refund_pending', 'refunded'],
  voided: [], refunded: [], expired: [], unavailable: []
};
export const STATES = Object.keys(TRANSITIONS);
export const TERMINAL = STATES.filter((s) => !TRANSITIONS[s].length);
// The customer may still change passengers, add-ons or re-check the price in these states.
export const EDITABLE = ['draft', 'details', 'price_changed', 'priced', 'payment_failed'];
// The supplier or payment provider holds something for this order: never expire these silently.
export const IN_FLIGHT = ['payment_pending', 'payment_authorized', 'booking', 'booked', 'ticketed', 'refund_pending'];
const ACTORS = ['customer', 'system', 'admin', 'webhook', 'reconcile'];

export const canMove = (from, to) => Boolean(TRANSITIONS[from]?.includes(to));

export function transition(order, to, { by = 'system', note = '', at = new Date().toISOString(), data } = {}) {
  if (!STATES.includes(to)) throw new Error('unknown_state');
  if (!canMove(order.status, to)) { const error = new Error('invalid_transition'); error.from = order.status; error.to = to; throw error; }
  const entry = { at, from: order.status, to, by: ACTORS.includes(by) ? by : 'system', ...(note ? { note: String(note).slice(0, 300) } : {}), ...(data ? { data } : {}) };
  return { ...order, status: to, updatedAt: at, timeline: [...(order.timeline || []), entry].slice(-100) };
}

// An event that is not a status change (note, flag, retry) still goes to the audit trail.
export function audit(order, event, { by = 'system', note = '', at = new Date().toISOString(), data } = {}) {
  return { ...order, updatedAt: at, timeline: [...(order.timeline || []), { at, event: String(event).slice(0, 40), by: ACTORS.includes(by) ? by : 'system', ...(note ? { note: String(note).slice(0, 300) } : {}), ...(data ? { data } : {}) }].slice(-100) };
}

export const flag = (order, name) => (order.flags?.includes(name) ? order : { ...order, flags: [...(order.flags || []), name] });
export const unflag = (order, name) => ({ ...order, flags: (order.flags || []).filter((f) => f !== name) });
