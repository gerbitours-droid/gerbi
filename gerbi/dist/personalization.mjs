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
  return trips.map(trip => {
    const total = Math.round(trip.price * ((preferences.adults || 2) + (preferences.children || 0)) *
      (preferences.nights || trip.nights) / trip.nights / 10) * 10;
    const matches = selected.filter(style => style.destinations.includes(trip.id));
    const family = preferences.children > 0 && trip.id === 'dubai';
    return {trip,total,score:matches.length*5 + (family ? 2 : 0),
      reasons:[...matches.map(style=>style.label),...(family && !matches.some(s=>s.id==='family')?['כיוון למשפחה']:[])]};
  }).filter(item=>!preferences.budget || item.total<=preferences.budget)
    .sort((a,b)=>preferences.cheaper ? a.total-b.total || b.score-a.score :
      b.score-a.score || a.total-b.total || a.trip.id.localeCompare(b.trip.id))
    .slice(0,limit);
}
