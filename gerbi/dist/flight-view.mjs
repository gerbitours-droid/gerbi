export function offerPrice(offer) {
  const price = offer?.fareDetails?.totalPrice?.selling;
  return price && typeof price.value === 'number' && Number.isFinite(price.value) && price.value >= 0 &&
    /^[A-Z]{3}$/.test(price.currency) ? {value:price.value,currency:price.currency} : null;
}
export function formatFare(price) {
  if (!price) return 'מחיר אינו זמין';
  try {return new Intl.NumberFormat('he-IL',{style:'currency',currency:price.currency,maximumFractionDigits:2}).format(price.value);}
  catch {return `${price.value.toFixed(2)} ${price.currency}`;}
}
export function destinationPhoto(code) {
  return ({FCO:'rome.jpg',ROM:'rome.jpg',JTR:'santorini.jpg',MLE:'maldives.jpg',DXB:'dubai.jpg'})[code] || null;
}
export function sortedOffers(offers, sort='supplier') {
  if (sort!=='price') return [...offers];
  // Cross-currency comparisons require an exchange-rate source.
  const currencies = new Set(offers.map(offerPrice).filter(Boolean).map(price=>price.currency));
  if (currencies.size>1) return [...offers];
  return [...offers].sort((a,b)=>(offerPrice(a)?.value ?? Infinity)-(offerPrice(b)?.value ?? Infinity));
}
// Volero segments: marketingCarrier/operatingCarrier = {airline:{code,name}, flightNumber}; times are local per airport.
export function carrierOf(segment) {
  const marketing = segment?.marketingCarrier, operating = segment?.operatingCarrier;
  const name = marketing?.airline?.name || marketing?.airline?.code || null;
  const number = marketing?.flightNumber ? `${marketing.airline?.code || ''}${marketing.flightNumber}` : null;
  const operator = operating?.airline?.code && operating.airline.code !== marketing?.airline?.code ? operating.airline.name || operating.airline.code : null;
  return { name, number, operator };
}
const stamp = point => /^\d{4}-\d{2}-\d{2}$/.test(point?.date || '') && /^\d{2}:\d{2}$/.test(point?.time || '') ? Date.parse(`${point.date}T${point.time}:00Z`) : NaN;
export function legSummary(segments = []) {
  const first = segments[0], last = segments.at(-1);
  const dayOffset = first && last ? Math.round((Date.parse(last.arrival?.date) - Date.parse(first.departure?.date)) / 86400000) : NaN;
  // A connection is in one airport, so both local times share a zone and the difference is exact.
  const layovers = segments.slice(1).map((segment, i) => {
    const minutes = Math.round((stamp(segment.departure) - stamp(segments[i].arrival)) / 60000);
    return { airport: segments[i].arrival?.airport?.code || '', city: segments[i].arrival?.city?.name || '', minutes: Number.isFinite(minutes) ? minutes : null,
      overnight: segments[i].arrival?.date !== segment.departure?.date };
  });
  return { departDate: first?.departure?.date || '', arriveDate: last?.arrival?.date || '', dayOffset: Number.isFinite(dayOffset) ? dayOffset : 0, stops: Math.max(0, segments.length - 1), layovers };
}
export function hoursText(minutes) {
  if (!Number.isFinite(minutes) || minutes < 0) return 'משך לא נמסר';
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return h ? `${h} שע׳${m ? ` ו־${m} דק׳` : ''}` : `${m} דק׳`;
}
export const LONG_LAYOVER_MINUTES = 6 * 60;
