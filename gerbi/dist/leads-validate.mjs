// Lead forms (contact + tailor-made trips): one validator shared by the browser (inline errors) and the server
// (the authority). Returns { lead, errors } where errors maps field name -> Hebrew message.
export const CHANNELS = { whatsapp: 'וואטסאפ', phone: 'שיחת טלפון', email: 'מייל' };
export const FLEXIBILITY = { exact: 'תאריכים מדויקים', days: 'גמישים בכמה ימים', month: 'גמישים בחודש', open: 'עוד לא יודעים' };
export const BUDGETS = { up5: 'עד 5,000 ₪', '5to10': '5,000–10,000 ₪', '10to20': '10,000–20,000 ₪', '20to40': '20,000–40,000 ₪', over40: 'מעל 40,000 ₪', open: 'עוד לא החלטנו' };
export const STYLES = { beach: 'ים וחופים', city: 'עיר ותרבות', nature: 'טבע וטיולים', family: 'משפחות וילדים', romantic: 'זוגי ורומנטי', adventure: 'אקסטרים והרפתקאות', culinary: 'אוכל ויין', luxury: 'יוקרה ופינוק', ski: 'סקי', tour: 'טיול מאורגן' };
export const LIMITS = { name: 80, email: 120, message: 2000, destinations: 200, notes: 2000, source: 60 };
export const CONSENT_TEXT = 'אני מאשר/ת לג׳רבי טורס לשמור את הפרטים שמסרתי וליצור איתי קשר בנוגע לפנייה זו, בערוץ שבחרתי.';

const DATE = /^\d{4}-\d{2}-\d{2}$/, CODE = /^[A-Z]{3}$/;
const text = (value, max) => (typeof value === 'string' ? value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim() : '').slice(0, max + 1);
const int = (value) => (typeof value === 'number' ? value : typeof value === 'string' && /^\d{1,3}$/.test(value.trim()) ? Number(value) : NaN);

// Israeli numbers: mobile 05X-XXXXXXX, landline 0[2-489]-XXXXXXX, VoIP 07X-XXXXXXX; +972 / 972 prefixes accepted.
export function normalizeIsraeliPhone(value) {
  let digits = String(value ?? '').replace(/[\s\-().‎‏]/g, '');
  if (/^\+?972/.test(digits)) digits = '0' + digits.replace(/^\+?972/, '').replace(/^0/, '');
  if (/^05\d{8}$/.test(digits) || /^07\d{8}$/.test(digits) || /^0[2-489]\d{7}$/.test(digits)) return digits;
  return '';
}
export const isEmail = (value) => value.length <= LIMITS.email && /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']{2,}$/.test(value);
const addDays = (day, n) => new Date(Date.parse(day) + n * 86400000).toISOString().slice(0, 10);

function contactPart(input, errors) {
  const name = text(input.name, LIMITS.name), email = text(input.email, LIMITS.email), phone = normalizeIsraeliPhone(input.phone);
  const channel = Object.hasOwn(CHANNELS, input.channel) ? input.channel : '';
  if (name.length < 2) errors.name = 'כתבו שם (לפחות 2 תווים).';
  else if (name.length > LIMITS.name) errors.name = `השם ארוך מדי (עד ${LIMITS.name} תווים).`;
  if (!phone) errors.phone = String(input.phone ?? '').trim() ? 'מספר הטלפון לא נראה ישראלי תקין. לדוגמה: \u2066050-1234567\u2069.' : 'כתבו מספר טלפון כדי שנוכל לחזור אליכם.';
  if (email && !isEmail(email)) errors.email = 'כתובת המייל לא תקינה. לדוגמה: \u2066name@example.com\u2069.';
  if (!channel) errors.channel = 'בחרו איך נוח לכם שנחזור אליכם.';
  else if (channel === 'email' && !email) errors.email = 'בחרתם מייל כערוץ חזרה. כתבו כתובת מייל, או בחרו ערוץ אחר.';
  if (input.consent !== true) errors.consent = 'כדי שנוכל לחזור אליכם צריך לאשר את יצירת הקשר.';
  return { name, phone, email, channel, marketing: input.marketing === true };
}

// The flight search a lead came from (results page): only codes, dates and counts, re-validated.
function searchContext(input) {
  if (!input || typeof input !== 'object') return null;
  const code = (v) => (typeof v === 'string' && CODE.test(v) ? v : ''), day = (v) => (typeof v === 'string' && DATE.test(v) ? v : '');
  const count = (v, max) => (Number.isInteger(v) && v >= 0 && v <= max ? v : null);
  const context = { from: code(input.from), to: code(input.to), depart: day(input.depart), return: day(input.return), adults: count(input.adults, 9), children: count(input.children, 8), results: count(input.results, 10000) };
  return context.to || context.depart ? context : null;
}

export function validateLead(input, { today = new Date().toISOString().slice(0, 10) } = {}) {
  const errors = {};
  if (!input || typeof input !== 'object') return { lead: null, errors: { form: 'invalid' } };
  const type = input.type === 'tailor' ? 'tailor' : input.type === 'contact' ? 'contact' : '';
  if (!type) return { lead: null, errors: { type: 'invalid' } };
  const contact = contactPart(input, errors);
  const source = typeof input.source === 'string' && /^\/[a-z0-9/_-]{0,59}$/i.test(input.source) ? input.source : '';
  const lead = { type, ...contact, source, context: searchContext(input.context) };
  if (type === 'contact') {
    lead.message = text(input.message, LIMITS.message);
    if (lead.message.length > LIMITS.message) errors.message = `ההודעה ארוכה מדי (עד ${LIMITS.message} תווים).`;
  } else {
    const destinations = text(input.destinations, LIMITS.destinations), notes = text(input.notes, LIMITS.notes);
    if (destinations.length < 2) errors.destinations = 'לאן תרצו לטוס? אפשר לכתוב גם "עוד לא יודעים" או אזור כללי.';
    else if (destinations.length > LIMITS.destinations) errors.destinations = `עד ${LIMITS.destinations} תווים.`;
    if (notes.length > LIMITS.notes) errors.notes = `הטקסט ארוך מדי (עד ${LIMITS.notes} תווים).`;
    const start = typeof input.start === 'string' ? input.start : '', end = typeof input.end === 'string' ? input.end : '';
    const latest = addDays(today, 2 * 366);
    if (start && (!DATE.test(start) || start < today || start > latest)) errors.start = 'בחרו תאריך יציאה עתידי (עד שנתיים קדימה).';
    if (end && (!DATE.test(end) || end > latest)) errors.end = 'תאריך החזרה לא תקין.';
    else if (end && !start) errors.start = 'בחרו גם תאריך יציאה, או השאירו את שני התאריכים ריקים.';
    else if (end && start && end < start) errors.end = 'תאריך החזרה צריך להיות אחרי תאריך היציאה.';
    const flexibility = Object.hasOwn(FLEXIBILITY, input.flexibility) ? input.flexibility : 'open';
    const adults = int(input.adults), children = int(input.children ?? 0);
    if (!Number.isInteger(adults) || adults < 1 || adults > 30) errors.adults = 'מספר המבוגרים בין 1 ל־30.';
    if (!Number.isInteger(children) || children < 0 || children > 20) errors.children = 'מספר הילדים בין 0 ל־20.';
    const budget = Object.hasOwn(BUDGETS, input.budget) ? input.budget : 'open';
    const styles = [...new Set(Array.isArray(input.styles) ? input.styles.filter((s) => Object.hasOwn(STYLES, s)) : [])].slice(0, Object.keys(STYLES).length);
    Object.assign(lead, { destinations, start: start || '', end: end || '', flexibility, adults, children, budget, styles, notes });
  }
  return Object.keys(errors).length ? { lead: null, errors } : { lead, errors };
}
