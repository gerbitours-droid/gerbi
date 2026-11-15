// Customer-service content (spec 16 §3, §5): built-in defaults for every intent. The owner can override answer texts
// and business hours in the KV key `support-content/faq` (Upstash: `gerbi:support-content:faq`); see mergeContent.
// Answers may use {hours}, {phone}, {whatsapp}, {email} placeholders, filled at reply time.
// Nothing here quotes a price, a fee or a supplier policy: those differ per fare and are confirmed by a representative.

export const INTENTS = {
  greeting: { title: 'פתיחה', chips: ['baggage', 'cancel_change', 'how_booking', 'payment', 'documents', 'human'],
    answer: 'היי, כאן שירות הלקוחות של ג׳רבי טורס. אפשר לבחור נושא או לכתוב שאלה במילים שלכם.' },
  thanks: { title: 'תודה', chips: ['menu', 'human'], answer: 'בשמחה! אם יש עוד שאלה, אני כאן.' },
  menu: { title: 'תפריט', chips: ['baggage', 'cancel_change', 'how_booking', 'payment', 'documents', 'contact_hours', 'price', 'tailor', 'enquiry_status', 'human'],
    answer: 'אלה הנושאים שאפשר לעזור בהם מיד. בחרו נושא או כתבו שאלה.' },
  baggage: { title: 'כבודה', chips: ['cancel_change', 'human', 'menu'],
    answer: 'הכבודה הכלולה תלויה בחברת התעופה ובסוג הכרטיס: יש כרטיסים עם תיק יד בלבד, ויש כאלה שכוללים טרולי או מזוודה רשומה. בתוצאות החיפוש מופיע מה שהספק מסר לכל טיסה, כשהמידע זמין. לפני ההזמנה הנציג מאשר איתכם בדיוק מה כלול, וכמה תעלה תוספת אם צריך.' },
  cancel_change: { title: 'ביטולים ושינויים', chips: ['booking_issue', 'human', 'menu'],
    answer: 'אפשרות הביטול או השינוי, והעלות שלהם, נקבעות לפי תנאי הכרטיס של חברת התעופה ותנאי המלון. לפני ההזמנה הנציג מציג לכם את התנאים של ההצעה הספציפית. כבר הזמנתם דרכנו ורוצים לבטל או לשנות? נציג יבדוק מול הספק — אפשר להשאיר פרטים כאן.' },
  how_booking: { title: 'איך מזמינים', chips: ['payment', 'price', 'human', 'menu'], link: { href: '#/', label: 'לחיפוש טיסות' },
    answer: 'שלושה צעדים: 1) מחפשים טיסה באתר ורואים הצעות בזמן אמת. 2) בוחרים הצעה ובודקים מחיר עדכני מול הספק. 3) משאירים פרטים, ונציג של ג׳רבי טורס חוזר אליכם, מאשר את הפרטים ומשלים את ההזמנה איתכם. ההזמנה והתשלום לא מתבצעים אוטומטית באתר.' },
  payment: { title: 'תשלום', chips: ['how_booking', 'human', 'menu'],
    answer: 'אין תשלום באתר. אחרי שהנציג מאשר איתכם מחיר וזמינות, הוא מסביר את אפשרויות התשלום ואת תנאיהן. חשוב: לעולם אל תשלחו מספר כרטיס אשראי בצ׳אט, בוואטסאפ או במייל.' },
  documents: { title: 'דרכון וויזה', chips: ['how_booking', 'human', 'menu'], link: { href: 'https://www.gov.il/he/departments/topics/passport', label: 'מידע רשמי על דרכונים' },
    answer: 'הנחיה כללית: במדינות רבות דורשים דרכון בתוקף לפחות 6 חודשים אחרי תאריך החזרה. יש יעדים שדורשים ויזה או אישור כניסה מקוון מראש (למשל ESTA לארצות הברית), ולכל נוסע — גם לתינוק — צריך דרכון משלו. הדרישות משתנות, אז כדאי לוודא באתר הרשמי של המדינה או של הנציגות שלה לפני הטיסה. הנציג ישמח לכוון.' },
  contact_hours: { title: 'שעות ויצירת קשר', chips: ['human', 'enquiry_status', 'menu'], link: { href: '#/contact', label: 'טופס צור קשר' },
    answer: 'שעות הפעילות: {hours}. טלפון: {phone}. וואטסאפ: {whatsapp}. מייל: {email}. אפשר גם להשאיר פרטים כאן, ונציג יחזור אליכם.' },
  enquiry_status: { title: 'סטטוס פנייה', chips: ['human', 'contact_hours', 'menu'],
    answer: 'פניות מטופלות לפי סדר הגעתן בשעות הפעילות ({hours}). אם השארתם פרטים באתר, נציג יחזור אליכם בערוץ שבחרתם. רוצים שנבדוק? אפשר להשאיר פרטים כאן ונציג יחזור עם עדכון.' },
  tailor: { title: 'טיול בהתאמה אישית', chips: ['how_booking', 'human', 'menu'], link: { href: '#/tailor-made', label: 'בונים טיול בהתאמה אישית' },
    answer: 'אנחנו בונים טיולים לפי מה שחשוב לכם: יעד, תאריכים, תקציב וסגנון — ירח דבש, משפחה, קבוצה או טיול מאורגן. ממלאים טופס קצר, ומתכנן של ג׳רבי טורס חוזר אליכם עם הצעה.' },
  price: { title: 'מחירים', chips: ['how_booking', 'payment', 'menu'],
    answer: 'בחיפוש טיסות המחירים מגיעים בזמן אמת מהספקים שאנחנו עובדים איתם, ויכולים להשתנות עד רגע ההזמנה — לכן יש בדיקת מחיר לפני שמשאירים פרטים. המחירים בכרטיסי היעדים ובתכנון הם הערכה להשראה בלבד. המחיר הסופי מאושר על ידי הנציג לפני כל תשלום.' },
  complaint: { title: 'תלונה', chips: [], escalate: 'complaint',
    answer: 'מצטערים לשמוע. חשוב לנו לטפל בזה אישית, ולכן נעביר את הפנייה לנציג.' },
  booking_issue: { title: 'בעיה בהזמנה או בחיוב', chips: [], escalate: 'booking_issue',
    answer: 'בעיה בהזמנה קיימת או בחיוב צריך לבדוק מול הספק, ואת זה עושה נציג. בואו נשאיר פרטים.' },
  human: { title: 'לדבר עם נציג', chips: [], escalate: 'asked_human', answer: 'בשמחה. נציג יחזור אליכם.' }
};

// Chip labels (quick replies). Short: WhatsApp button titles allow 20 characters, list rows 24.
export const CHIP_LABELS = { baggage: 'כבודה', cancel_change: 'ביטולים ושינויים', how_booking: 'איך מזמינים', payment: 'תשלום', documents: 'דרכון וויזה',
  contact_hours: 'שעות ויצירת קשר', enquiry_status: 'סטטוס פנייה', tailor: 'טיול בהתאמה אישית', price: 'מחירים', human: 'לדבר עם נציג', menu: 'כל הנושאים',
  booking_issue: 'בעיה בהזמנה קיימת', yes_escalate: 'כן, שנציג יחזור', no_escalate: 'לא, תודה', consent_yes: 'כן, אפשר לחזור אליי', consent_no: 'לא עכשיו', cancel: 'ביטול' };

export const REASON_LABELS = { asked_human: 'ביקש/ה נציג', complaint: 'תלונה', frustration: 'תסכול', not_understood: 'הבוט לא הבין', booking_issue: 'בעיה בהזמנה/בחיוב' };

// Business hours in Israel time; day 0 = Sunday. ponytail: placeholder until the business confirms its real hours.
export const DEFAULT_HOURS = { text: 'א׳–ה׳ 09:00–18:00, ו׳ 09:00–13:00', days: { 0: ['09:00', '18:00'], 1: ['09:00', '18:00'], 2: ['09:00', '18:00'], 3: ['09:00', '18:00'], 4: ['09:00', '18:00'], 5: ['09:00', '13:00'], 6: null } };

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
export const MAX_ANSWER = 1200;

// Owner overrides from KV, validated: only known intents, only strings, only well-formed hours.
export function mergeContent(override) {
  const answers = {}, o = override && typeof override === 'object' ? override : {};
  for (const [id, intent] of Object.entries(INTENTS)) {
    const custom = typeof o.answers?.[id] === 'string' ? o.answers[id].trim().slice(0, MAX_ANSWER) : '';
    answers[id] = custom || intent.answer;
  }
  let hours = DEFAULT_HOURS;
  if (o.hours && typeof o.hours === 'object') {
    const days = {};
    for (let d = 0; d < 7; d++) { const v = o.hours.days?.[d]; days[d] = Array.isArray(v) && v.length === 2 && HHMM.test(v[0]) && HHMM.test(v[1]) && v[0] < v[1] ? v : v === null ? null : DEFAULT_HOURS.days[d]; }
    hours = { text: typeof o.hours.text === 'string' && o.hours.text.trim() ? o.hours.text.trim().slice(0, 200) : DEFAULT_HOURS.text, days };
  }
  return { answers, hours };
}

// Validates an owner PUT; returns { value } to store or { error }.
export function validateContentUpdate(input, current = {}) {
  if (!input || typeof input !== 'object') return { error: 'invalid' };
  const next = { answers: { ...(current.answers || {}) }, hours: current.hours, updatedAt: new Date().toISOString() };
  if (input.answers !== undefined) {
    if (typeof input.answers !== 'object' || Array.isArray(input.answers)) return { error: 'answers_invalid' };
    for (const [id, text] of Object.entries(input.answers)) {
      if (!Object.hasOwn(INTENTS, id)) return { error: `unknown_intent:${id}` };
      if (typeof text !== 'string' || text.length > MAX_ANSWER) return { error: `answer_invalid:${id}` };
      if (text.trim()) next.answers[id] = text.trim(); else delete next.answers[id];
    }
  }
  if (input.hours !== undefined) {
    if (input.hours === null) next.hours = undefined;
    else if (typeof input.hours !== 'object') return { error: 'hours_invalid' };
    else next.hours = { text: typeof input.hours.text === 'string' ? input.hours.text.slice(0, 200) : undefined, days: input.hours.days };
  }
  return { value: next };
}

// Is the business open at `now` (Israel time)? Returns { open, text, next } where next is a short Hebrew phrase.
const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
export function hoursStatus(hours, now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jerusalem', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now).map((p) => [p.type, p.value]));
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday), time = `${parts.hour}:${parts.minute}`;
  const today = hours.days[day];
  if (today && time >= today[0] && time < today[1]) return { open: true, text: hours.text, next: `פתוחים עכשיו, עד ${today[1]}` };
  for (let i = 0; i < 7; i++) {
    const d = (day + i) % 7, slot = hours.days[d];
    if (!slot || (i === 0 && time >= slot[0])) continue;
    return { open: false, text: hours.text, next: i === 0 ? `סגורים כרגע. נפתחים היום ב־${slot[0]}` : i === 1 ? `סגורים כרגע. נפתחים מחר ב־${slot[0]}` : `סגורים כרגע. נפתחים ביום ${DAY_NAMES[d]} ב־${slot[0]}` };
  }
  return { open: false, text: hours.text, next: 'סגורים כרגע' };
}
