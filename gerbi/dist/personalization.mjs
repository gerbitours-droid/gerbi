import { places } from './places.mjs';
import { t, lang } from './i18n.mjs';
// Curated destination metadata describes inspiration, never verified inventory.
export const styles = [
  {id:'beach', label:t('app.style.beach'), icon:'sun', destinations:['santorini','maldives','dubai']},
  {id:'city', label:t('app.style.city'), icon:'globe', destinations:['rome','dubai']},
  {id:'family', label:t('app.style.family'), icon:'user', destinations:['dubai']},
  {id:'relaxation', label:t('app.style.relaxation'), icon:'heart', destinations:['santorini','maldives']},
  {id:'couple', label:t('app.style.couple'), icon:'spark', destinations:['santorini','rome','maldives']}
];
export function selectedStyles(preferences = {}) {
  return styles.filter(style => preferences[style.id] === true ||
    (preferences[style.id] !== false && Array.isArray(preferences.tags) && preferences.tags.includes(style.id)));
}
// Season fit, from the destination guides (pages.mjs destinationInfo.guide): good months add, poor months subtract.
export const SEASONS = {
  santorini: { best: [5, 6, 9, 10], poor: [11, 12, 1, 2, 3], penalty: 2 },
  rome: { best: [4, 5, 6, 9, 10], poor: [7, 8], penalty: 2 },
  maldives: { best: [11, 12, 1, 2, 3, 4], poor: [5, 6, 7, 8, 9, 10], penalty: 2 },
  dubai: { best: [11, 12, 1, 2, 3], poor: [6, 7, 8, 9], penalty: 4 }
};
const MONTH_NAMES = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
// English requests may name the month in English (spec 21); Hebrew names are matched first, as before.
const MONTH_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthOf = p => (p.start ? Number(p.start.slice(5, 7)) : 0) || MONTH_NAMES.indexOf(p.month) + 1 || MONTH_EN.findIndex(m => m.toLowerCase() === String(p.month || '').toLowerCase()) + 1;
export function seasonFit(tripId, preferences = {}) {
  const month = monthOf(preferences), season = SEASONS[tripId];
  if (!month || !season) return 0;
  return season.best.includes(month) ? 3 : season.poor.includes(month) ? -season.penalty : 0;
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
    const season = seasonFit(trip.id, preferences), month = MONTH_NAMES[monthOf(preferences) - 1];
    return {trip,total,score:matches.length*5 + (family ? 2 : 0) + (requested ? 10 : 0) + season,
      reasons:[...(requested?[t('app.reason.requested')]:[]),...(season>0&&month?[t('app.reason.season', { month: lang === 'en' ? MONTH_EN[MONTH_NAMES.indexOf(month)] : month })]:[]),...matches.map(style=>style.label),...(family && !matches.some(s=>s.id==='family')?[t('app.reason.family')]:[])]};
  }).filter(item=>!excluded.has(item.trip.id) && (!wanted.length || wanted.includes(item.trip.id)))
    .filter(item=>!preferences.budget || item.total<=preferences.budget)
    .sort((a,b)=>preferences.cheaper ? a.total-b.total || b.score-a.score :
      b.score-a.score || a.total-b.total || a.trip.id.localeCompare(b.trip.id))
    .slice(0,limit);
}

export function constraintSummary(preferences = {}) {
  const byCode = code => places.find(place => place.code === code);
  const missing = (preferences.want || []).map(byCode).filter(place => place && !place.trip);
  const excluded = (preferences.exclude || []).map(byCode).filter(Boolean);
  const shown = place => (lang === 'en' ? place.name : place.names[0]);
  return { missing: missing.map(shown), excluded: excluded.map(shown) };
}
