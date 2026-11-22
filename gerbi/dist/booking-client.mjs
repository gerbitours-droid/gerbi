// Booking entry point for every page that sells a flight (spec 25 §9): flight results, multi-city, the trip builder.
//   startBooking({ offer: { srk, offerIndex, searchToken, itineraryIndex }, source, insurance }) → opens #/book/<id>
// The order's access token stays on this device (localStorage); a signed-in customer also sees it in the account.
import { lang } from './i18n.mjs';

const KEY = 'gerbi-orders-v1';
export function rememberedOrders() { try { const list = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(list) ? list.filter((x) => x && typeof x.id === 'string' && typeof x.token === 'string') : []; } catch { return []; } }
export function rememberOrder(id, token) { try { localStorage.setItem(KEY, JSON.stringify([{ id, token, at: new Date().toISOString() }, ...rememberedOrders().filter((x) => x.id !== id)].slice(0, 20))); } catch { /* the account or the email link still opens it */ } }
export const orderToken = (id) => rememberedOrders().find((x) => x.id === id)?.token || '';

let config = null;
export function bookingConfig(force = false) {
  if (!config || force) config = fetch('/api/orders/config', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : { enabled: false })).catch(() => ({ enabled: false }));
  return config;
}

export async function startBooking({ offer, source = 'flights', insurance = false }) {
  const response = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify({ offer, source, insurance: insurance === true, lang }) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.error || 'booking_failed'), { code: data.error || 'booking_failed', status: response.status });
  rememberOrder(data.id, data.token);
  location.hash = `#/book/${data.id}`;
  return data;
}

// "Hotel in one click" in the trip builder (spec 25 §9): after a flight booking/request on this device, the package
// form starts with the same lead traveller's contact details. Read back from the server with the order token; the
// browser keeps no copy. Fields the customer already typed are left alone.
export async function latestBookingContact() {
  const items = rememberedOrders().slice(0, 5).map(({ id, token }) => ({ id, token }));
  if (!items.length) return null;
  const data = await fetch('/api/orders/lookup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items }) }).then((r) => (r.ok ? r.json() : { orders: [] })).catch(() => ({ orders: [] }));
  const order = (data.orders || []).filter((o) => o.contact?.email).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0];
  return order ? { name: order.contact.name, email: order.contact.email, phone: order.contact.phone, ref: order.ref } : null;
}
export async function prefillFromBooking(form) {
  const contact = form ? await latestBookingContact().catch(() => null) : null;
  if (!contact || !form.isConnected) return false;
  for (const key of ['name', 'phone', 'email']) { const input = form.querySelector(`[name="${key}"]`); if (input && !input.value && contact[key]) input.value = contact[key]; }
  return true;
}
