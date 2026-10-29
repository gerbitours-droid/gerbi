import { places } from './places.mjs';
// Curated destination metadata describes inspiration, never verified inventory.
export const styles = [
  {id:'beach', label:'ים ובריכה', icon:'sun', destinations:['santorini','maldives','dubai']},
  {id:'city', label:'אוכל ותרבות', icon:'globe', destinations:['rome','dubai']},
  {id:'family', label:'זמן משפחתי', icon:'user', destinations:['dubai']},
  {id:'relaxation', label:'להוריד הילוך', icon:'heart', destinations:['santorini','maldives']},
  {id:'couple', label:'רק שנינו', icon:'spark', destinations:['santorini','rome','maldives']}
];
export function selectedStyles(preferences = {}) {
  return styles.filter(style => preferences[style.id] === true ||
    (preferences[style.id] !== false && Array.isArray(preferences.tags) && preferences.tags.includes(style.id)));
}
export function rankInspirations(trips, preferences = {}, limit = 3) {
  const selected = selectedStyles(preferences);
  const tripOf = code => places.find(place => place.code === code)?.trip;
  const wanted = (preferences.want || []).map(tripOf).filter(Boolean);
  const excluded = new Set((preferences.exclude || []).map(tripOf).filter(Boolean));
  return trips.map(trip => {
    const total = Math.round(trip.price * ((preferences.adults || 2) + (preferences.children || 0)) *
      (preferences.nights || trip.nights) / trip.nights / 10) * 10;
    const matches = selected.filter(style => style.destinations.includes(trip.id));
    const family = preferences.children > 0 && trip.id === 'dubai';
    const requested = wanted.includes(trip.id);
    return {trip,total,score:matches.length*5 + (family ? 2 : 0) + (requested ? 10 : 0),
      reasons:[...(requested?['היעד שביקשתם']:[]),...matches.map(style=>style.label),...(family && !matches.some(s=>s.id==='family')?['כיוון למשפחה']:[])]};
  }).filter(item=>!excluded.has(item.trip.id) && (!wanted.length || wanted.includes(item.trip.id)))
    .filter(item=>!preferences.budget || item.total<=preferences.budget)
    .sort((a,b)=>preferences.cheaper ? a.total-b.total || b.score-a.score :
      b.score-a.score || a.total-b.total || a.trip.id.localeCompare(b.trip.id))
    .slice(0,limit);
}

// Destinations named in the brief: wanted ("ברומא", "רק פריז") and ruled out ("בלי דובאי", "לא לדובאי", "חוץ מרומא").
// Stored as airport codes so an unsupported place (Paris) survives as a stated limit rather than vanishing.
const NEGATIONS = new Set(['לא', 'בלי', 'ללא', 'ולא', 'ובלי', 'וללא', 'מלבד', 'חוץ']);
const words = text => String(text || '').normalize('NFKC').toLowerCase().replace(/[״"׳']/g, '').replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean);
export function destinationConstraints(text, previous = {}) {
  const list = words(text), want = new Set(previous.want || []), exclude = new Set(previous.exclude || []);
  let only = false;
  const found = [];
  list.forEach((word, i) => {
    for (const place of places) for (const name of place.names) {
      const parts = name.split(' '), first = parts.length === 1 ? word : list.slice(i, i + parts.length).join(' ');
      // Hebrew attaches ו/ב/ל/ה/מ to the noun: "ולדובאי", "מרומא".
      if (first !== name && !(first.endsWith(name) && /^[ובלהמ]{1,2}$/.test(first.slice(0, first.length - name.length)))) continue;
      const negated = NEGATIONS.has(list[i - 1]) || NEGATIONS.has(list[i - 2]);
      if (list[i - 1] === 'רק' || list[i - 2] === 'רק') only = true;
      found.push({ code: place.code, negated });
      return;
    }
  });
  if (only) want.clear();
  for (const { code, negated } of found) {
    if (negated) { exclude.add(code); want.delete(code); } else { want.add(code); exclude.delete(code); }
  }
  return { want: [...want], exclude: [...exclude] };
}
export function coupleIntent(text, children = 0) {
  if (/לא\s+(?:חופשה\s+)?(?:זוגי|רומנטי)|בלי\s+רומנטיקה/.test(text)) return false;
  if (/רומנטי|זוגי|ירח דבש|רק שנינו|רק אנחנו/.test(text)) return true;
  // "זוג עם שני ילדים" describes who travels, not a couples' holiday.
  if (children > 0) return false;
  return /זוג/.test(text) ? true : undefined;
}
export function constraintSummary(preferences = {}) {
  const byCode = code => places.find(place => place.code === code);
  const missing = (preferences.want || []).map(byCode).filter(place => place && !place.trip);
  const excluded = (preferences.exclude || []).map(byCode).filter(Boolean);
  return { missing: missing.map(place => place.label.split(',')[0]), excluded: excluded.map(place => place.label.split(',')[0]) };
}
