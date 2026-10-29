import { rankInspirations, coupleIntent, destinationConstraints } from './personalization.mjs';
export function parsePreferences(text, previous = {}) {
 const result = {...previous};
 const normalized = text.replace(/[,٬]/g,'').replace(/״|”/g,'"');
 const budget = normalized.match(/(?:עד|תקציב(?:\s+של)?)\s*(\d+(?:\.\d+)?)\s*(אלף|אלפים|k)?/i);
 if(budget) result.budget = Number(budget[1]) * (budget[2] ? 1000 : 1);
 const travelers = normalized.match(/(\d+)\s*(?:נוסעים|אנשים|מטיילים)/);
 if(travelers) result.adults = Math.min(9,Math.max(1,Number(travelers[1])));
 if(/זוג|שני מבוגרים|שניים/.test(text)) result.adults = 2;
 if(/לבד|סולו/.test(text)) result.adults = 1;
 const children=normalized.match(/(\d+|שני|שתי|שלושה|שלוש|ארבעה|ארבע)\s*ילד/);
 if(children) result.children = ({שני:2,שתי:2,שלושה:3,שלוש:3,ארבעה:4,ארבע:4})[children[1]] ?? Math.min(6,Number(children[1]));
 if(/בלי ילדים|ללא ילדים/.test(text)) result.children=0;
 if(/ילד אחד|ילדה אחת/.test(text)) result.children=1;
 const nights=normalized.match(/(\d+)\s*(?:לילות|ימים)/);
 if(nights) result.nights=Math.min(30,Math.max(1,Number(nights[1])));
 else if(/שבועיים/.test(text)) result.nights=14;
 else if(/שבוע/.test(text)) result.nights=7;
 else if(/סופ["׳']?ש|סוף שבוע/.test(text)) result.nights=3;
 const month=['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'].find(x=>text.includes(x));
 if(month) result.month=month;
 if(/ישיר/.test(text)) result.direct=true;
 if(/לא לקום מוקדם|לא מוקדם|טיסת צהריים/.test(text)) result.lateFlight=true;
 if(/(?:^|[\s,])(?:ים|בים|לים|בריכה|ובריכה|חוף)(?=[\s,.!?]|$)/.test(text)) result.beach=true;
 if(/כשר/.test(text)) result.kosher=true;
 if(/שבת/.test(text)) result.shabbat=true;
 if(/נגיש|כיסא גלגלים/.test(text)) result.accessible=true;
 if(/זול|משתלם|תוריד|מחיר נמוך/.test(text)) result.cheaper=true;
 for (const [key,pattern] of [['city',/אוכל|תרבות|עיר/],['relaxation',/מנוחה|להירגע|שקט|בטן.?גב/],['family',/משפח/]]) {
  if(pattern.test(text)) result[key]=true;
 }
 if(/בלי ים|ללא ים|לא רוצים ים/.test(text)) result.beach=false;
 if(/בלי ילדים|ללא ילדים/.test(text)){result.family=false;result.children=0;}
 const couple=coupleIntent(text,result.children||0);
 if(couple!==undefined) result.couple=couple;
 Object.assign(result,destinationConstraints(text,previous));
 result.text = text;
 return result;
}
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
