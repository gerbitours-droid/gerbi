// Customer-service content (spec 16 §3, §5): built-in defaults for every intent. The owner can override answer texts
// and business hours in the KV key `support-content/faq` (Upstash: `gerbi:support-content:faq`); see mergeContent.
// Answers may use {hours}, {phone}, {whatsapp}, {email} placeholders, filled at reply time.
// Nothing here quotes a price, a fee or a supplier policy: those differ per fare and are confirmed by a representative.
// Texts live in dist/locales/support.mjs (spec 21): INTENTS/CHIP_LABELS hold the Hebrew; localizeContent() the English.
import { tIn, normLang } from '../dist/i18n.mjs';

const HE = tIn('he');
const CHIP_IDS = ['baggage', 'cancel_change', 'how_booking', 'payment', 'documents', 'contact_hours', 'enquiry_status', 'tailor', 'price', 'human', 'menu', 'booking_issue', 'yes_escalate', 'no_escalate', 'consent_yes', 'consent_no', 'cancel'];

export const INTENTS = {
  greeting: { title: HE('support.intent.greeting.title'), chips: ['baggage', 'cancel_change', 'how_booking', 'payment', 'documents', 'human'],
    answer: HE('support.intent.greeting.answer') },
  thanks: { title: HE('support.intent.thanks.title'), chips: ['menu', 'human'], answer: HE('support.intent.thanks.answer') },
  menu: { title: HE('support.intent.menu.title'), chips: ['baggage', 'cancel_change', 'how_booking', 'payment', 'documents', 'contact_hours', 'price', 'tailor', 'enquiry_status', 'human'],
    answer: HE('support.intent.menu.answer') },
  baggage: { title: HE('support.intent.baggage.title'), chips: ['cancel_change', 'human', 'menu'],
    answer: HE('support.intent.baggage.answer') },
  cancel_change: { title: HE('support.intent.cancel_change.title'), chips: ['booking_issue', 'human', 'menu'],
    answer: HE('support.intent.cancel_change.answer') },
  how_booking: { title: HE('support.intent.how_booking.title'), chips: ['payment', 'price', 'human', 'menu'], link: { href: '#/', label: HE('support.intent.how_booking.link') },
    answer: HE('support.intent.how_booking.answer') },
  payment: { title: HE('support.intent.payment.title'), chips: ['how_booking', 'human', 'menu'],
    answer: HE('support.intent.payment.answer') },
  documents: { title: HE('support.intent.documents.title'), chips: ['how_booking', 'human', 'menu'], link: { href: 'https://www.gov.il/he/departments/topics/passport', label: HE('support.intent.documents.link') },
    answer: HE('support.intent.documents.answer') },
  contact_hours: { title: HE('support.intent.contact_hours.title'), chips: ['human', 'enquiry_status', 'menu'], link: { href: '#/contact', label: HE('support.intent.contact_hours.link') },
    answer: HE('support.intent.contact_hours.answer') },
  enquiry_status: { title: HE('support.intent.enquiry_status.title'), chips: ['human', 'contact_hours', 'menu'],
    answer: HE('support.intent.enquiry_status.answer') },
  tailor: { title: HE('support.intent.tailor.title'), chips: ['how_booking', 'human', 'menu'], link: { href: '#/tailor-made', label: HE('support.intent.tailor.link') },
    answer: HE('support.intent.tailor.answer') },
  price: { title: HE('support.intent.price.title'), chips: ['how_booking', 'payment', 'menu'],
    answer: HE('support.intent.price.answer') },
  complaint: { title: HE('support.intent.complaint.title'), chips: [], escalate: 'complaint',
    answer: HE('support.intent.complaint.answer') },
  booking_issue: { title: HE('support.intent.booking_issue.title'), chips: [], escalate: 'booking_issue',
    answer: HE('support.intent.booking_issue.answer') },
  human: { title: HE('support.intent.human.title'), chips: [], escalate: 'asked_human', answer: HE('support.intent.human.answer') }
};

// Chip labels (quick replies). Short: WhatsApp button titles allow 20 characters, list rows 24.
export const CHIP_LABELS = Object.fromEntries(CHIP_IDS.map((id) => [id, HE(`support.chip.${id}`)]));

export const REASON_LABELS = { asked_human: 'ביקש/ה נציג', complaint: 'תלונה', frustration: 'תסכול', not_understood: 'הבוט לא הבין', booking_issue: 'בעיה בהזמנה/בחיוב' };

// Business hours in Israel time; day 0 = Sunday. ponytail: placeholder until the business confirms its real hours.
export const DEFAULT_HOURS = { text: HE('support.hours.default'), days: { 0: ['09:00', '18:00'], 1: ['09:00', '18:00'], 2: ['09:00', '18:00'], 3: ['09:00', '18:00'], 4: ['09:00', '18:00'], 5: ['09:00', '13:00'], 6: null } };

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
export const MAX_ANSWER = 1200;

// Owner overrides from KV, validated: only known intents, only strings, only well-formed hours.
export function mergeContent(override) {
  const answers = {}, o = override && typeof override === 'object' ? override : {};
  let answersEn = null;
  for (const [id, intent] of Object.entries(INTENTS)) {
    const custom = typeof o.answers?.[id] === 'string' ? o.answers[id].trim().slice(0, MAX_ANSWER) : '';
    answers[id] = custom || intent.answer;
    const customEn = typeof o.answersEn?.[id] === 'string' ? o.answersEn[id].trim().slice(0, MAX_ANSWER) : '';
    if (customEn) (answersEn ||= {})[id] = customEn;
  }
  let hours = DEFAULT_HOURS;
  if (o.hours && typeof o.hours === 'object') {
    const days = {};
    for (let d = 0; d < 7; d++) { const v = o.hours.days?.[d]; days[d] = Array.isArray(v) && v.length === 2 && HHMM.test(v[0]) && HHMM.test(v[1]) && v[0] < v[1] ? v : v === null ? null : DEFAULT_HOURS.days[d]; }
    hours = { text: typeof o.hours.text === 'string' && o.hours.text.trim() ? o.hours.text.trim().slice(0, 200) : DEFAULT_HOURS.text, days };
    if (typeof o.hours.textEn === 'string' && o.hours.textEn.trim()) hours.textEn = o.hours.textEn.trim().slice(0, 200);
  }
  return { answers, hours, ...(answersEn ? { answersEn } : {}) };
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
  // Optional English versions (spec 21); without one the English bot uses its built-in English answer.
  if (input.answersEn !== undefined) {
    if (!input.answersEn || typeof input.answersEn !== 'object' || Array.isArray(input.answersEn)) return { error: 'answers_invalid' };
    next.answersEn = { ...(current.answersEn || {}) };
    for (const [id, text] of Object.entries(input.answersEn)) {
      if (!Object.hasOwn(INTENTS, id)) return { error: `unknown_intent:${id}` };
      if (typeof text !== 'string' || text.length > MAX_ANSWER) return { error: `answer_invalid:${id}` };
      if (text.trim()) next.answersEn[id] = text.trim(); else delete next.answersEn[id];
    }
  } else if (current.answersEn) next.answersEn = current.answersEn;
  if (input.hours !== undefined) {
    if (input.hours === null) next.hours = undefined;
    else if (typeof input.hours !== 'object') return { error: 'hours_invalid' };
    else next.hours = { text: typeof input.hours.text === 'string' ? input.hours.text.slice(0, 200) : undefined, days: input.hours.days,
      ...(typeof input.hours.textEn === 'string' && input.hours.textEn.trim() ? { textEn: input.hours.textEn.slice(0, 200) } : {}) };
  }
  return { value: next };
}

// Is the business open at `now` (Israel time)? Returns { open, text, next } where next is a short phrase in `lang`.
export function hoursStatus(hours, now = new Date(), lang = 'he') {
  const T = tIn(lang);
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jerusalem', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now).map((p) => [p.type, p.value]));
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday), time = `${parts.hour}:${parts.minute}`;
  const today = hours.days[day];
  if (today && time >= today[0] && time < today[1]) return { open: true, text: hours.text, next: T('support.hours.openUntil', { time: today[1] }) };
  for (let i = 0; i < 7; i++) {
    const d = (day + i) % 7, slot = hours.days[d];
    if (!slot || (i === 0 && time >= slot[0])) continue;
    return { open: false, text: hours.text, next: i === 0 ? T('support.hours.opensToday', { time: slot[0] }) : i === 1 ? T('support.hours.opensTomorrow', { time: slot[0] }) : T('support.hours.opensOn', { day: T(`support.day.${d}`), time: slot[0] }) };
  }
  return { open: false, text: hours.text, next: T('support.hours.closed') };
}

// ---- English (spec 21) ----
const DAY_SHORT_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
// "Sun–Thu 09:00–18:00, Fri 09:00–13:00", from the hours themselves (the owner's hours text is Hebrew).
export function hoursTextEn(days) {
  const groups = [];
  for (let d = 0; d < 7; d++) {
    const slot = days?.[d];
    if (!slot) continue;
    const last = groups.at(-1);
    if (last && last.to === d - 1 && last.slot[0] === slot[0] && last.slot[1] === slot[1]) last.to = d; else groups.push({ from: d, to: d, slot });
  }
  return groups.map((g) => `${DAY_SHORT_EN[g.from]}${g.to > g.from ? `–${DAY_SHORT_EN[g.to]}` : ''} ${g.slot[0]}–${g.slot[1]}`).join(', ') || 'by appointment';
}
const titleOf = (id, lang) => (normLang(lang) === 'he' ? INTENTS[id]?.title : tIn('en')(`support.intent.${id}.title`));
export const intentTitle = titleOf;
export const chipLabel = (id, lang = 'he') => (normLang(lang) === 'he' ? CHIP_LABELS[id] || INTENTS[id]?.title || id : CHIP_IDS.includes(id) ? tIn('en')(`support.chip.${id}`) : titleOf(id, 'en') || id);
export const linkFor = (id, lang = 'he') => { const link = INTENTS[id]?.link; return link && normLang(lang) === 'en' ? { ...link, label: tIn('en')(`support.intent.${id}.link`) } : link; };
// The merged content in one language: Hebrew is returned as is. English answers: the owner's English text, else the
// built-in English answer (an owner's Hebrew-only edit is not shown to English visitors); hours text from the days.
export function localizeContent(c, lang = 'he') {
  if (normLang(lang) === 'he') return c;
  const T = tIn('en');
  const answers = Object.fromEntries(Object.keys(INTENTS).map((id) => [id, c.answersEn?.[id] || T(`support.intent.${id}.answer`)]));
  return { ...c, lang: 'en', answers, hours: { ...c.hours, text: c.hours.textEn || hoursTextEn(c.hours.days) } };
}
