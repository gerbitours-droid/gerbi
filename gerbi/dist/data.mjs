import { lang } from './i18n.mjs';
import { tripsEn } from './locales/data-en.mjs';
export const trips=[
{id:'santorini',name:'סנטוריני, יוון',short:'סנטוריני',nights:5,price:2990,description:'5 לילות | טיסה + מלון',badge:'ים ומנוחה',symbol:'♨',image:'santorini.jpg',style:'ים, בריכה ונופים לבנים',days:['נחיתה והתמקמות באי','סמטאות לבנות ושקיעה באויה','יום ים ומנוחה בבריכה','טיול בעיירות האי','יום חופשי בקצב שלכם','ארוחת בוקר וחזרה הביתה']},
{id:'rome',name:'רומא, איטליה',short:'רומא',nights:4,price:2390,description:'4 לילות | טיסה + מלון',badge:'אוכל ותרבות',symbol:'▥',image:'rome.jpg',style:'תרבות, אוכל וטיולים בעיר',days:['הגעה וערב איטלקי','הקולוסיאום ורומא העתיקה','מזרקות, כיכרות וגלידה','יום חופשי בשכונות העיר','בוקר אחרון וחזרה הביתה']},
{id:'maldives',name:'האיים המלדיביים',short:'המלדיביים',nights:7,price:4890,description:'7 לילות | הכול כלול',badge:'חופשה חלומית',symbol:'☀',image:'maldives.jpg',style:'שקט, ים וחופשה טרופית',days:['הגעה והתמקמות','בוקר בחוף ולגונה טורקיז','יום חופשי במלון','שנורקלינג לבחירתכם','זמן זוגי מול הים','יום בריכה ומנוחה','שקיעה אחרונה באי','חזרה הביתה']},
{id:'dubai',name:'דובאי, איחוד האמירויות',short:'דובאי',nights:5,price:2690,description:'5 לילות | טיסה + מלון',badge:'עיר וחוף',symbol:'%',image:'dubai.jpg',style:'עיר, חופים ואטרקציות',days:['הגעה וטיול במרינה','יום חוף ובריכה','תצפית על העיר','אטרקציה לכל המשפחה','זמן חופשי וקניות','ארוחת בוקר וחזרה הביתה']},
{id:'paris',name:'פריז, צרפת',short:'פריז',nights:4,price:2890,description:'4 לילות | טיסה + מלון',badge:'תרבות ורומנטיקה',symbol:'♜',image:'destinations/paris.webp',style:'מוזיאונים, בתי קפה ושדרות',days:['נחיתה, המארה וערב ראשון בעיר','מגדל אייפל ושייט על הסן','הלובר וגני הטווילרי','מונמרטר, הסקרה קר ובתי קפה','קרואסון אחרון וחזרה הביתה']}
];
// Where a saved flight or a support draft goes. Empty = the site offers "copy" only and says the channel is not set.
// whatsapp: international digits only (e.g. '972501234567'); email: a monitored address.
export const contact = { whatsapp: '972500000000', email: 'info@gerbitours.co.il', phone: '030000000' }; // ponytail: placeholder (proxy) details until the business supplies real ones
// English page (spec 21): the trips' visible text switches to English once; ids, prices and images stay. Hebrew stays on trip.he.
const TEXT_FIELDS = ['name', 'short', 'description', 'badge', 'style', 'days'];
if (lang === 'en') for (const trip of trips) { const en = tripsEn[trip.id]; if (!en) continue; trip.he = Object.fromEntries(TEXT_FIELDS.map((k) => [k, trip[k]])); for (const k of TEXT_FIELDS) if (en[k]) trip[k] = en[k]; }
