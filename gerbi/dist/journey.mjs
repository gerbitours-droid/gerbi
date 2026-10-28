export const STORAGE_KEY = 'gerbi-journey-v1';
export function restoreComparison(raw, ids) {
  try {
    const value=JSON.parse(raw||'[]');
    return Array.isArray(value)?[...new Set(value.filter(id=>ids.includes(id)))].slice(0,3):[];
  } catch { return []; }
}
export function restoreJourney(raw, ids) {
  try {
    const data = JSON.parse(raw || '{}');
    const integer = (value, min, max, fallback) => Number.isInteger(value) && value >= min && value <= max ? value : fallback;
    const brief = data.brief || {};
    const adults = integer(brief.adults, 1, 9, 2);
    const children = integer(brief.children, 0, 9 - adults, 0);
    const text = (v, max = 1500) => typeof v === 'string' ? v.slice(0, max) : '';
    const saved = {};
    for (const [id, draft] of Object.entries(data.saved || {})) {
      const destinationId = planDestination(id, ids);
      if (!destinationId) continue;
      if (!draft || !Array.isArray(draft.days)) continue;
      const planAdults = integer(draft.adults,1,9,2);
      saved[id] = { destinationId, title:text(draft.title,80), days: draft.days.slice(0,31).map(x => text(x,150)), request:text(draft.request,1000), nights:integer(draft.nights,1,30,5), adults:planAdults, children:integer(draft.children,0,Math.min(6,9-planAdults),0), updated:text(draft.updated,50) };
    }
    return {brief:{city:brief.city===true,family:brief.family===true,relaxation:brief.relaxation===true,couple:brief.couple===true,cheaper:brief.cheaper===true,learningConsent:brief.learningConsent===true,adults,children,nights:integer(brief.nights,1,30,5),budget:integer(brief.budget,0,1000000,18000),month:text(brief.month,20),beach:brief.beach===true,direct:brief.direct===true,kosher:brief.kosher===true,accessible:brief.accessible===true},saved};
  } catch {return restoreJourney('{}',ids);}
}
export function filterTrips(trips, {query='',style='all',maxPrice=Infinity,sort='recommended'}={}) {
  const q=query.trim().toLowerCase();
  const items=trips.filter(t=>(!q||`${t.name} ${t.country||''} ${t.style}`.toLowerCase().includes(q)) && (style==='all'||t.categories.includes(style)) && t.price<=maxPrice);
  return [...items].sort((a,b)=>sort==='price'?a.price-b.price:sort==='nights'?a.nights-b.nights:0);
}
export function itineraryDays(trip,nights,saved) {
  return Array.from({length:nights+1},(_,i)=>saved?.[i] || (i===nights?'ארוחת בוקר וחזרה הביתה':i<trip.days.length-1?trip.days[i]:'יום חופשי בקצב שלכם'));
}

export function planDestination(key, ids) {
  if (ids.includes(key)) return key;
  return ids.find(id => key.startsWith(id+'--') && /^[a-zA-Z0-9-]{1,80}$/.test(key.slice(id.length+2))) || null;
}
export function applyBriefToDraft(trip, draft, brief) {
  const nights = brief.nights;
  const days = Array.from({length:nights+1},(_,i) => i===nights
    ? draft.days[draft.nights] || 'ארוחת בוקר וחזרה הביתה'
    : i<draft.nights ? draft.days[i] || 'יום חופשי בקצב שלכם'
    : 'יום חופשי בקצב שלכם');
  return {...draft,nights,adults:brief.adults,children:brief.children,days};
}
