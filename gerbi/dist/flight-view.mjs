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
      overnight: segments[i].arrival?.date !== segment.departure?.date,
      // Landing at one airport and leaving from another (LHR → LGW) means crossing the city on your own.
      changeAirport: Boolean(segments[i].arrival?.airport?.code && segment.departure?.airport?.code && segments[i].arrival.airport.code !== segment.departure.airport.code),
      nextAirport: segment.departure?.airport?.code || '' };
  });
  return { departDate: first?.departure?.date || '', arriveDate: last?.arrival?.date || '', dayOffset: Number.isFinite(dayOffset) ? dayOffset : 0, stops: Math.max(0, segments.length - 1), layovers };
}
export function hoursText(minutes) {
  if (!Number.isFinite(minutes) || minutes < 0) return 'משך לא נמסר';
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return h ? `${h} שע׳${m ? ` ו־${m} דק׳` : ''}` : `${m} דק׳`;
}
export const LONG_LAYOVER_MINUTES = 6 * 60;

// ---- Package 2: one fact sheet per offer, built once per search, used by cards, filters, sort and comparison.
export function parseDuration(value) {
  const match = /^(\d{1,3}):(\d{2})$/.exec(String(value || ''));
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}
export function legsOf(offer, payload) {
  const lists = payload?.dataLists || {};
  const flights = new Map((lists.flightList || []).map(item => [item.key, item]));
  const segments = new Map((lists.flightSegmentList || []).map(item => [item.key, item]));
  return (offer?.flightsOverview?.[0]?.flightReferences || []).map(ref => {
    const flight = flights.get(ref);
    return { segments: (flight?.segmentReferences || []).map(key => segments.get(key)).filter(Boolean), minutes: parseDuration(flight?.flightDetails?.duration) };
  });
}
const SMALL_ITEM = /small|personal|underseat/i;
// Baggage per direction from the supplier's own data. 'unknown' is never shown as free or as excluded.
function legBaggage(offer, leg) {
  const allowances = (offer.baggageAllowanceList || []).filter(item => leg.segments.some(segment => segment.key === item.segmentReference));
  const adult = allowances.flatMap(item => item.baggageAllowance || []).filter(item => item.ptc === 'ADT');
  const first = leg.segments[0]?.departure?.airport?.code, last = leg.segments.at(-1)?.arrival?.airport?.code;
  const fare = (offer.fareDetails?.brandedFare || []).find(item => item.departure === first && item.arrival === last);
  const services = fare?.serviceList || [];
  const has = (category, charge, test = () => true) => services.some(item => item.categoryCode === category && item.chargeType === charge && test(item.name || ''));
  let checked = 'unknown', pieces = null;
  if (adult.length) {
    pieces = Math.min(...adult.map(item => Number(item.quantity) || 0));
    checked = pieces > 0 ? 'included' : has('BG', 'chargeable') ? 'paid' : 'none';
  } else if (has('BG', 'included')) checked = 'included';
  else if (has('BG', 'chargeable')) checked = 'paid';
  const trolley = has('CY', 'included', name => !SMALL_ITEM.test(name)) ? 'included' : has('CY', 'chargeable', name => !SMALL_ITEM.test(name)) ? 'paid' : 'unknown';
  return { checked, pieces, trolley, fare: fare?.name || null, cabin: fare?.cabin || null };
}
const combine = values => values.length && values.every(value => value === values[0]) ? values[0] : values.includes('unknown') ? 'unknown' : 'mixed';
export function offerFacts(offer, payload) {
  const legs = legsOf(offer, payload).map(leg => ({ ...leg, summary: legSummary(leg.segments), baggage: legBaggage(offer, leg), carrier: carrierOf(leg.segments[0]) }));
  const minutes = legs.map(leg => leg.minutes);
  const layovers = legs.flatMap(leg => leg.summary.layovers);
  return {
    index: String(offer.index), offer, legs, price: offerPrice(offer),
    totalMinutes: minutes.length && minutes.every(Number.isFinite) ? minutes.reduce((a, b) => a + b, 0) : null,
    stops: legs.length ? Math.max(...legs.map(leg => leg.summary.stops)) : null,
    carriers: [...new Set(legs.map(leg => leg.carrier.name).filter(Boolean))],
    longestLayover: layovers.reduce((max, item) => Math.max(max, item.minutes || 0), 0),
    overnight: layovers.some(item => item.overnight),
    checked: combine(legs.map(leg => leg.baggage.checked)), trolley: combine(legs.map(leg => leg.baggage.trolley)),
    refundable: offer.fareDetails?.nonRefundable === true ? 'no' : offer.fareDetails?.nonRefundable === false ? 'yes' : 'unknown',
    airports: [...new Set([legs[0]?.segments.at(-1)?.arrival?.airport?.code, legs[1]?.segments[0]?.departure?.airport?.code].filter(Boolean))],
    airportChange: Boolean(legs[1] && legs[0]?.segments.at(-1)?.arrival?.airport?.code && legs[1].segments[0]?.departure?.airport?.code && legs[0].segments.at(-1).arrival.airport.code !== legs[1].segments[0].departure.airport.code)
  };
}
export const TIME_BUCKETS = [['night', 'לילה', 0, 5], ['morning', 'בוקר', 5, 12], ['afternoon', 'צהריים', 12, 18], ['evening', 'ערב', 18, 24]];
export function timeBucket(time) {
  const hour = Number(String(time || '').split(':')[0]);
  return Number.isFinite(hour) ? TIME_BUCKETS.find(([, , from, to]) => hour >= from && hour < to)?.[0] || null : null;
}
export const emptyFilters = () => ({ stops: 'any', out: [], back: [], carriers: [], airports: [], checkedBag: false });
export function matchesFilters(facts, filters) {
  const leg = i => facts.legs[i]?.segments[0]?.departure?.time;
  if (filters.stops !== 'any' && !(facts.stops !== null && facts.stops <= Number(filters.stops))) return false;
  if (filters.out.length && !filters.out.includes(timeBucket(leg(0)))) return false;
  if (filters.back.length && !filters.back.includes(timeBucket(leg(1)))) return false;
  if (filters.carriers.length && !facts.carriers.some(name => filters.carriers.includes(name))) return false;
  if (filters.checkedBag && facts.checked !== 'included') return false;
  if (filters.airports?.length && !facts.airports.some(code => filters.airports.includes(code))) return false;
  return true;
}
export function sortFacts(list, sort = 'supplier') {
  if (sort === 'duration') return [...list].sort((a, b) => (a.totalMinutes ?? Infinity) - (b.totalMinutes ?? Infinity) || (a.price?.value ?? Infinity) - (b.price?.value ?? Infinity));
  if (sort !== 'price' || new Set(list.map(item => item.price?.currency).filter(Boolean)).size > 1) return [...list];
  return [...list].sort((a, b) => (a.price?.value ?? Infinity) - (b.price?.value ?? Infinity) || (a.totalMinutes ?? Infinity) - (b.totalMinutes ?? Infinity));
}
