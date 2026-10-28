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
