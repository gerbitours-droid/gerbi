import { rankInspirations } from './personalization.mjs';
import { understandRequest } from './brief-engine.mjs';
// One understanding engine for the browser and the server (dist/brief-engine.mjs).
export function parsePreferences(text, previous = {}) { return understandRequest(text, previous).brief; }
export function estimateDemoTotal(trip, preferences) {
 const nights=preferences.nights || trip.nights;
 return Math.round(trip.price * ((preferences.adults || 2) + (preferences.children || 0)) * nights / trip.nights / 10) * 10;
}
export function rankDemoTrips(trips,preferences) { return rankInspirations(trips,preferences); }
// Flights: a same-day return is allowed (the supplier accepts it); one-way needs only the departure.
export function validFlightDates(start,end,today,oneWay=false) {
 const day=/^\d{4}-\d{2}-\d{2}$/;
 return day.test(start)&&start>=today&&(oneWay||(day.test(end)&&end>=start));
}
export function validDateRange(start,end,today) {
 return /^\d{4}-\d{2}-\d{2}$/.test(start)&&/^\d{4}-\d{2}-\d{2}$/.test(end)&&start>=today&&end>start;
}
