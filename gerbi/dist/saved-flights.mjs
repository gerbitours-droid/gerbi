// A flight the traveler chose after a price check: a snapshot (times, price, check time), never a booking.
// Stored on this device only; no passenger names or contact details.
import { places, resolvePlace } from './places.mjs';

export const SAVED_FLIGHTS_KEY = 'gerbi-saved-flights-v1';
const MAX_SAVED = 10;
const date = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : '';
const time = value => typeof value === 'string' && /^\d{2}:\d{2}$/.test(value) ? value : '';
const code = value => typeof value === 'string' && /^[A-Z]{3}$/.test(value) ? value : '';
const text = (value, max = 80) => typeof value === 'string' ? value.slice(0, max) : '';
const int = (value, min, max) => Number.isInteger(value) && value >= min && value <= max ? value : null;

export function flightSnapshot(facts, search, check) {
  const place = resolvePlace(search.destination);
  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    savedAt: new Date().toISOString(), checkedAt: check.at.toISOString(),
    price: check.price.value, currency: check.price.currency, priceChanged: Boolean(check.changed),
    destination: place?.label || search.destination, trip: place?.trip || null,
    from: search.origin, to: place?.code || '', start: search.start, end: search.end, adults: search.adults, children: search.children,
    carriers: facts.carriers.slice(0, 3), checked: facts.checked, trolley: facts.trolley,
    legs: facts.legs.map(leg => {
      const first = leg.segments[0], last = leg.segments.at(-1);
      return { from: first?.departure?.airport?.code || '', to: last?.arrival?.airport?.code || '',
        departDate: first?.departure?.date || '', departTime: first?.departure?.time || '',
        arriveDate: last?.arrival?.date || '', arriveTime: last?.arrival?.time || '',
        stops: leg.summary.stops, minutes: leg.minutes, dayOffset: leg.summary.dayOffset };
    })
  };
}

export function restoreSavedFlights(raw) {
  let list;
  try { list = JSON.parse(raw || '[]'); } catch { return []; }
  if (!Array.isArray(list)) return [];
  return list.map(item => {
    if (!item || typeof item !== 'object' || !Array.isArray(item.legs)) return null;
    const price = typeof item.price === 'number' && Number.isFinite(item.price) && item.price >= 0 ? item.price : null;
    const legs = item.legs.slice(0, 2).map(leg => ({ from: code(leg?.from), to: code(leg?.to), departDate: date(leg?.departDate), departTime: time(leg?.departTime),
      arriveDate: date(leg?.arriveDate), arriveTime: time(leg?.arriveTime), stops: int(leg?.stops, 0, 6) ?? 0, minutes: int(leg?.minutes, 0, 6000), dayOffset: int(leg?.dayOffset, 0, 3) ?? 0 }));
    const adults = int(item.adults, 1, 9);
    if (!text(item.id, 40) || price === null || !code(item.currency) || !legs.length || !adults) return null;
    return { id: text(item.id, 40), savedAt: text(item.savedAt, 40), checkedAt: text(item.checkedAt, 40), price, currency: item.currency,
      priceChanged: item.priceChanged === true, destination: text(item.destination), trip: places.some(place => place.trip === item.trip) ? item.trip : null,
      from: code(item.from), to: code(item.to), start: date(item.start), end: date(item.end), adults, children: int(item.children, 0, 9 - adults) ?? 0,
      carriers: Array.isArray(item.carriers) ? item.carriers.map(name => text(name, 60)).filter(Boolean).slice(0, 3) : [],
      checked: ['included', 'paid', 'none', 'mixed', 'unknown'].includes(item.checked) ? item.checked : 'unknown',
      trolley: ['included', 'paid', 'mixed', 'unknown'].includes(item.trolley) ? item.trolley : 'unknown', legs };
  }).filter(Boolean).slice(0, MAX_SAVED);
}

export const addSavedFlight = (list, flight) => [flight, ...list.filter(item => item.id !== flight.id)].slice(0, MAX_SAVED);

// Share link: search conditions only – never prices, supplier offer ids or passenger details.
export function searchLink({ origin, destination, start, end, type, adults, children }) {
  const to = resolvePlace(destination)?.code || '', single = type === 'oneway' || !end;
  return '#/?' + new URLSearchParams({ from: resolvePlace(origin)?.code || origin, to, depart: start, ...(single ? { type: 'oneway' } : { return: end }), adults: String(adults), children: String(children) });
}
export function parseSearchLink(hash) {
  const [path, query = ''] = String(hash || '').replace(/^#/, '').split('?');
  if ((path || '/') !== '/' || !query) return null;
  const params = new URLSearchParams(query);
  const adults = Number(params.get('adults')), children = Number(params.get('children') || 0);
  const type = params.get('type') === 'oneway' ? 'oneway' : 'round';
  const result = { origin: code(params.get('from')), to: code(params.get('to')), start: date(params.get('depart')), end: type === 'oneway' ? '' : date(params.get('return')), type, adults, children };
  if (!result.origin || !result.to || !result.start || (type === 'round' && (!result.end || result.end < result.start))) return null;
  if (!Number.isInteger(adults) || adults < 1 || !Number.isInteger(children) || children < 0 || adults + children > 9) return null;
  return { ...result, destination: places.find(place => place.code === result.to)?.label || result.to };
}

export function followUpText(flight, formatPrice) {
  const line = (leg, label) => `${label}: ${leg.from}→${leg.to} ${leg.departDate} ${leg.departTime}–${leg.arriveTime}${leg.dayOffset ? ` (+${leg.dayOffset})` : ''}, ${leg.stops ? `${leg.stops} החלפות` : 'ישירה'}`;
  return [`שלום, אשמח לבדוק את הטיסה הזו לג׳רבי:`, `${flight.destination} · ${flight.adults + flight.children} נוסעים (${flight.adults} מבוגרים${flight.children ? `, ${flight.children} ילדים` : ''})`,
    ...flight.legs.map((leg, i) => line(leg, i ? 'חזור' : 'הלוך')), `חברה: ${flight.carriers.join(' + ') || 'לא נמסר'}`,
    `מחיר שנבדק: ${formatPrice({ value: flight.price, currency: flight.currency })} ב־${new Date(flight.checkedAt).toLocaleString('he-IL')} (לא הוזמן)`].join('\n');
}

export function contactActions(contact, message, subject = 'פנייה מג׳רבי') {
  const actions = [];
  if (/^\d{8,15}$/.test(contact?.whatsapp || '')) actions.push({ label: 'שליחה בוואטסאפ', href: `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(message)}` });
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact?.email || '')) actions.push({ label: 'שליחה במייל', href: `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}` });
  return actions;
}
