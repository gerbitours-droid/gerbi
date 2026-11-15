// Customer-service brain (spec 16 §3): a deterministic Hebrew intent classifier and a small conversation state
// machine shared by the site widget and WhatsApp. Pure: no I/O. The caller stores the conversation and performs
// the escalation side effects (lead + escalation record) when a reply carries `escalate`.
import { INTENTS, CHIP_LABELS, hoursStatus } from './support-content.mjs';
import { normalizeIsraeliPhone, CONSENT_TEXT } from '../dist/leads-validate.mjs';

const FINALS = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };
export function normalize(text) {
  return String(text || '').toLowerCase().replace(/[֑-ׇ]/g, '').replace(/[״"׳'`’]/g, '').replace(/[ךםןףץ]/g, (c) => FINALS[c])
    .replace(/[^\p{L}\p{N}!?]+/gu, ' ').replace(/([!?])/g, ' $1 ').replace(/\s+/g, ' ').trim();
}
const PREFIXES = 'והבלמשכ';
function variants(token) {
  const out = [token];
  if (token.length > 3 && PREFIXES.includes(token[0])) { out.push(token.slice(1)); if (token.length > 4 && PREFIXES.includes(token[1])) out.push(token.slice(2)); }
  return out;
}

// [term, weight]. A single-word term matches a token (after prefix stripping) that equals it or, when it has at
// least 3 letters, starts with it. A multi-word term matches as a phrase anywhere in the normalized text.
const TERMS = {
  greeting: [['היי', 1], ['הי', 1], ['שלומ', 1], ['הלו', 1], ['אהלנ', 1], ['בוקר טוב', 1.2], ['ערב טוב', 1.2], ['צהריים טובים', 1.2], ['מה נשמע', 1]],
  thanks: [['תודה', 1.2], ['תודה רבה', 0.5], ['ביי', 1], ['להתראות', 1], ['מעולה', 0.6], ['סבבה', 0.6], ['אחלה', 0.6]],
  menu: [['תפריט', 1.5], ['התחלה', 1], ['אפשרויות', 1], ['נושאים', 1], ['במה אתה יכול לעזור', 1.5], ['מה אתה יודע', 1.2]],
  baggage: [['מזווד', 1.5], ['כבודה', 1.5], ['כבודת', 1.5], ['טרולי', 1.5], ['=תיק', 1.5], ['תיקימ', 1], ['משקל', 1], ['=קילו', 1], ['קילוגרמ', 1], ['קג', 1], ['מטענ', 1], ['תיק יד', 1], ['עגלת', 1.2], ['ציוד', 0.6], ['ציוד ספורט', 1], ['לעלות למטוס', 2]],
  cancel_change: [['ביטול', 1.5], ['לבטל', 1.5], ['בטל', 1.2], ['שינוי', 1.2], ['לשנות', 1.2], ['שנות', 0.8], ['להזיז', 1], ['לדחות', 1.2], ['דחיית', 1], ['החזר כספי', 1.5], ['החזר', 1], ['זיכוי', 1.2], ['מדיניות ביטול', 1.5], ['דמי ביטול', 1.5]],
  how_booking: [['איכ מזמינימ', 2], ['להזמינ', 1.2], ['מזמינימ', 1.2], ['איכ אני מזמינ', 2], ['=מזמינ', 1], ['הזמנה', 0.7], ['איכ זה עובד', 2], ['איכ עובד', 1.5], ['תהליכ', 1.2], ['להזמינ באתר', 1.5], ['אפשר להזמינ', 1.5], ['לסגור טיסה', 1.5], ['איכ קונימ', 1.5], ['לקנות כרטיס', 1.5], ['קונה כרטיס', 1.5], ['לחפש טיסה', 1.2]],
  payment: [['תשלומ', 1.5], ['לשלמ', 1.5], ['=שלמ', 1], ['אשראי', 1.5], ['=ביט', 1.2], ['פייבוקס', 1.5], ['העברה בנקאית', 1.5], ['מזומנ', 1.2], ['מקדמה', 1.5], ['חשבונית', 1.2], ['איכ משלמימ', 1.5]],
  documents: [['דרכונ', 1.5], ['ויזה', 1.5], ['ויזות', 1.5], ['אשרה', 1.5], ['אשרת', 1.5], ['esta', 1.5], ['מסמכ', 1.2], ['תעודת זהות', 1.2], ['תוקפ', 1], ['אישור כניסה', 1.5], ['ביומטרי', 1.2], ['לייזה פאסה', 1.5]],
  contact_hours: [['שעות', 1.2], ['פתוחימ', 1.5], ['פתוח', 0.8], ['טלפונ', 1], ['מספר טלפונ', 1.2], ['וואטסאפ', 1], ['ווטסאפ', 1], ['מייל', 1], ['כתובת', 1], ['משרד', 1.2], ['ליצור קשר', 1.5], ['צור קשר', 1.5], ['זמינימ', 1], ['שעות פעילות', 1.5], ['איכ אפשר להשיג', 1.5], ['מתי אתמ', 1.2], ['איפה אתמ', 1.2]],
  enquiry_status: [['סטטוס', 1.5], ['פניה', 0.8], ['פנייה', 0.8], ['הפניה שלי', 2], ['הפנייה שלי', 2], ['לא חזרו', 2], ['חזרו אליי', 1.5], ['מעקב', 1.2], ['עדכונ', 0.8], ['השארתי פרטימ', 2], ['מחכה לתשובה', 2], ['מה קורה עמ', 1], ['שלחתי פניה', 2], ['שלחתי פנייה', 2], ['עוד לא ענו', 2]],
  tailor: [['התאמה אישית', 2], ['מותאמ', 1.2], ['טיול מאורגנ', 2], ['מאורגנ', 1.2], ['חבילה', 1.2], ['חבילות', 1.2], ['ירח דבש', 2], ['קבוצה', 1.2], ['קבוצת', 1.2], ['תכנונ טיול', 1.5], ['לתכננ', 1], ['מסלול', 1], ['טיול משפחתי', 1.5], ['בוטיק', 1]],
  price: [['מחיר', 1.5], ['כמה עולה', 2], ['כמה זה עולה', 2], ['עולה', 0.6], ['=יקר', 1.2], ['יקרימ', 1.2], ['=זול', 1.2], ['זולה', 1.2], ['זולימ', 1.2], ['מבצע', 1.2], ['הנחה', 1.2], ['עלות', 1.5], ['המחיר השתנה', 1.5], ['שקל', 0.8], ['דולר', 0.8], ['כמה כסף', 1.5]],
  complaint: [['תלונ', 2], ['התלונ', 2], ['לא מרוצה', 2], ['לא מרוצימ', 2], ['גרוע', 1.5], ['אכזב', 1.5], ['מאוכזב', 1.5], ['חוצפה', 1.5], ['בושה', 1.5], ['פיצוי', 1.5], ['שערוריה', 1.5], ['זלזול', 1.5], ['יחס מחפיר', 2]],
  booking_issue: [['חויב', 2], ['חיוב', 1.5], ['חיוב כפול', 2.5], ['ההזמנה שלי', 2], ['הכרטיס שלי', 1.5], ['הטיסה שלי', 1.5], ['מספר הזמנה', 2], ['לא קיבלתי', 1.5], ['כרטיס טיסה', 0.8], ['בוטלה', 1.5], ['פספסתי', 1.5], ['עיכוב', 1], ['איחור', 1], ['ירד לי', 1.5], ['שילמתי', 1.5], ['הזמנתי', 1.2], ['אישור הזמנה', 1.5], ['הטיסה התבטלה', 2]],
  human: [['נציג', 2.5], ['נציגה', 2.5], ['בנ אדמ', 2.5], ['בנאדמ', 2.5], ['אדמ אמיתי', 2.5], ['לדבר עמ מישהו', 2.5], ['לדבר עמ', 1.2], ['מנהל', 1.5], ['אחראי', 1.2], ['תתקשרו', 2], ['שיחזרו אליי', 2.5], ['שמישהו יחזור', 2.5], ['שמישהו יתקשר', 2.5], ['מוקד', 1.2], ['אנושי', 2], ['לחזור אליי', 1.5], ['לדבר עמ נציג', 1]]
};
const FRUSTRATION = ['נמאס', 'מעצבנ', 'מתסכל', 'לא עוזר', 'לא עוזרת', 'זה לא עובד', 'לא מבינ אותי', 'לא מבינה אותי', 'חסר תועלת', 'די כבר', 'מטומטמ', 'עצבני', 'רובוט מעצבנ', 'בוט טיפש', 'אין לי כוח'];
const YES = ['כנ', 'בטח', 'אשמח', 'יאללה', 'בסדר', 'אוקי', 'ok', 'מאשר', 'מאשרת', 'כמובנ', 'סבבה', 'yes'];
const NO = ['לא', 'לא תודה', 'אין צורכ', 'לא עכשיו', 'ביטול', 'בטל', 'עזוב', 'עזבי', 'no'];
const CANCEL = ['ביטול', 'בטל', 'עזוב', 'עזבי', 'לא עכשיו', 'לא משנה', 'תפריט'];
// Escalation intents win ties; then the specific topics; chit-chat last.
const PRIORITY = ['human', 'booking_issue', 'complaint', 'enquiry_status', 'cancel_change', 'baggage', 'documents', 'payment', 'tailor', 'price', 'how_booking', 'contact_hours', 'menu', 'thanks', 'greeting'];
// A leading '=' marks a whole-word-only term ('=ביט' must not match 'ביטול').
const PREPARED = Object.fromEntries(Object.entries(TERMS).map(([id, list]) => [id, list.map(([term, weight]) => { const t = normalize(term.replace(/^=/, '')); return { t, weight, exact: term.startsWith('='),
  // Phrases may carry Hebrew prefixes on their first word and up to 3 more letters on their last ('בהתאמה אישית').
  phrase: t.includes(' ') ? new RegExp(`(?:^| )[${PREFIXES}]{0,2}${t}\\p{L}{0,3}(?= |$)`, 'u') : null }; })]));

export function classify(text) {
  const norm = normalize(text), padded = ` ${norm} `, tokens = norm.split(' ').filter(Boolean);
  const forms = tokens.map(variants);
  const scores = {};
  for (const [id, terms] of Object.entries(PREPARED)) {
    let score = 0;
    for (const { t, weight, phrase, exact } of terms) {
      const hit = phrase ? phrase.test(norm)
        : forms.some((vs) => vs.some((v) => v === t || (!exact && t.length >= 3 && v.startsWith(t) && v.length <= t.length + 3)));
      if (hit) score += weight;
    }
    if (score) scores[id] = score;
  }
  // Short greetings/thanks only count as such when the message is not also a real question.
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1] || PRIORITY.indexOf(a[0]) - PRIORITY.indexOf(b[0]));
  let [best, score] = ranked[0] || [null, 0];
  const topical = ranked.find(([id]) => !['greeting', 'thanks'].includes(id));
  if (best && ['greeting', 'thanks'].includes(best) && topical && topical[1] >= 1) [best, score] = topical;
  const frustrated = FRUSTRATION.some((w) => padded.includes(` ${normalize(w)}`)) || /(!\s*){3,}|(\?\s*){3,}/.test(String(text));
  return { intent: score >= 1 ? best : null, score, scores, frustrated, norm };
}
const isOneOf = (norm, list) => list.some((w) => { const n = normalize(w); return norm === n || norm.startsWith(`${n} `) && norm.split(' ').length <= 3; });

export function newConversation(id, channel, now = new Date()) {
  return { id, channel, createdAt: now.toISOString(), updatedAt: now.toISOString(), lastInboundAt: null, missCount: 0, collect: null, offer: null, contact: {}, escalationId: null, escalationRef: null, handoff: false, transcript: [] };
}

const chip = (id) => ({ id, label: CHIP_LABELS[id] || INTENTS[id]?.title || id });
const fill = (text, ctx) => text.replace(/\{(hours|phone|whatsapp|email)\}/g, (_, key) => ctx[key] || '');
// Phone numbers are wrapped in LTR isolates so "050-1234567" does not flip inside Hebrew text.
const ltr = (value) => `\u2066${value}\u2069`;
const formatPhone = (p) => ltr(/^0\d{9}$/.test(p) ? `${p.slice(0, 3)}-${p.slice(3)}` : /^0\d{8}$/.test(p) ? `${p.slice(0, 2)}-${p.slice(2)}` : p);
export function contactContext(content, contact = {}) {
  const wa = /^972\d{8,9}$/.test(contact.whatsapp || '') ? formatPhone('0' + contact.whatsapp.slice(3)) : '';
  return { hours: content.hours.text, phone: contact.phone ? formatPhone(contact.phone) : 'יפורסם בקרוב', whatsapp: wa || 'יפורסם בקרוב', email: contact.email ? ltr(contact.email) : 'יפורסם בקרוב' };
}

function answer(id, content, ctx) {
  const intent = INTENTS[id], messages = [{ text: fill(content.answers[id], ctx), ...(intent.link ? { link: intent.link } : {}) }];
  return { messages, chips: intent.chips.map(chip), input: 'text', intent: id };
}

function startCollect(conv, reason, lead, ctx) {
  conv.offer = null;
  if (conv.escalationRef) return { messages: [...lead, { text: `כבר העברנו את הפנייה שלכם לנציג (מספר פנייה ${conv.escalationRef}). נחזור אליכם בשעות הפעילות: ${ctx.hours}.` }], chips: ['menu'].map(chip), input: 'text', intent: 'human' };
  conv.collect = { reason, step: null, tries: 0 };
  return nextStep(conv, lead);
}
function nextStep(conv, lead = []) {
  const c = conv.collect, known = conv.contact;
  if (!known.name) { c.step = 'name'; return { messages: [...lead, { text: 'איך קוראים לכם?' }], chips: [chip('cancel')], input: 'name' }; }
  if (!known.phone) { c.step = 'phone'; return { messages: [...lead, { text: `תודה ${known.name}. לאיזה מספר טלפון לחזור?` }], chips: [chip('cancel')], input: 'tel' }; }
  c.step = 'consent';
  const phoneLine = conv.channel === 'whatsapp' ? 'נחזור אליכם בוואטסאפ למספר הזה.' : `נחזור אליכם למספר ${formatPhone(known.phone)}.`;
  return { messages: [...lead, { text: `${phoneLine} ${CONSENT_TEXT}` }], chips: [chip('consent_yes'), chip('consent_no')], input: 'text' };
}

// One customer turn. Mutates `conv`; returns { messages, chips, input, intent, escalate? }.
// `escalate` = { reason } means the caller must create the escalation and then append confirmation(...) messages.
export function respond(conv, { text = '', chip: chipId = '' } = {}, { content, contact = {}, now = new Date() } = {}) {
  const ctx = contactContext(content, contact), norm = normalize(text), chosen = chipId && (INTENTS[chipId] || CHIP_LABELS[chipId]) ? chipId : '';
  // 1) Collecting contact details for an escalation.
  if (conv.collect) {
    const c = conv.collect;
    if (chosen === 'cancel' || chosen === 'consent_no' || (!chosen && isOneOf(norm, CANCEL)) || (c.step === 'consent' && !chosen && isOneOf(norm, NO))) {
      conv.collect = null;
      return { messages: [{ text: `בסדר, לא נשמרה פנייה. אפשר לפנות אלינו בכל זמן: טלפון ${ctx.phone}, וואטסאפ ${ctx.whatsapp}.` }], chips: ['menu', 'human'].map(chip), input: 'text', intent: null };
    }
    if (c.step === 'name' && !chosen) {
      const name = String(text).replace(/[\u0000-\u001f<>]/g, '').trim().replace(/^(קוראימ לי|שמי|אני|השמ שלי)\s+/u, '').slice(0, 80);
      if (name.length < 2 || /\d{3,}|\?/.test(name) || name.split(/\s+/).length > 4) return { messages: [{ text: 'כתבו בבקשה שם (לפחות 2 אותיות).' }], chips: [chip('cancel')], input: 'name' };
      conv.contact.name = name; return nextStep(conv);
    }
    if (c.step === 'phone' && !chosen) {
      const phone = normalizeIsraeliPhone(text);
      if (!phone) {
        c.tries += 1;
        if (c.tries >= 2) { conv.collect = null; return { messages: [{ text: `המספר לא נראה ישראלי תקין. אפשר לפנות אלינו ישירות: טלפון ${ctx.phone}, וואטסאפ ${ctx.whatsapp}, או דרך טופס צור קשר.`, link: { href: '#/contact', label: 'טופס צור קשר' } }], chips: ['human', 'menu'].map(chip), input: 'text', intent: null }; }
        return { messages: [{ text: `המספר לא נראה ישראלי תקין. לדוגמה: ${ltr('050-1234567')}.` }], chips: [chip('cancel')], input: 'tel' };
      }
      conv.contact.phone = phone; return nextStep(conv);
    }
    if (c.step === 'consent' && (chosen === 'consent_yes' || (!chosen && isOneOf(norm, YES)))) {
      conv.collect = null;
      return { messages: [], chips: [], input: 'text', intent: null, escalate: { reason: c.reason } };
    }
    // Anything else mid-collection: repeat the current question.
    return nextStep(conv, [{ text: 'רק כדי להשלים את הפנייה:' }]);
  }
  // 2) An open offer to escalate (after two misses).
  if (conv.offer === 'escalate') {
    if (chosen === 'yes_escalate' || (!chosen && isOneOf(norm, YES))) return startCollect(conv, 'not_understood', [], ctx);
    conv.offer = null;
    if (chosen === 'no_escalate' || (!chosen && isOneOf(norm, NO))) { conv.missCount = 0; return { messages: [{ text: 'בסדר. אפשר לבחור נושא מהרשימה או לנסח את השאלה אחרת.' }], chips: INTENTS.menu.chips.map(chip), input: 'text', intent: null }; }
  }
  // 3) Classify.
  let id = chosen && INTENTS[chosen] ? chosen : '', frustrated = false;
  if (chosen === 'yes_escalate') id = 'human';
  if (!id && text) { const r = classify(text); id = r.intent || ''; frustrated = r.frustrated; }
  if (frustrated && !['human', 'complaint', 'booking_issue'].includes(id)) return startCollect(conv, 'frustration', [{ text: 'מצטערים שזה מתסכל. בואו נעביר את זה לנציג אנושי שיחזור אליכם.' }], ctx);
  if (!id) {
    conv.missCount += 1;
    if (conv.missCount >= 2) { conv.offer = 'escalate'; return { messages: [{ text: 'נראה שאני לא מצליח לעזור כאן. רוצים שנציג יחזור אליכם?' }], chips: [chip('yes_escalate'), chip('no_escalate')], input: 'text', intent: null }; }
    return { messages: [{ text: 'לא בטוח שהבנתי. אפשר לבחור נושא, או לנסח במילים אחרות.' }], chips: ['baggage', 'cancel_change', 'how_booking', 'payment', 'documents', 'human'].map(chip), input: 'text', intent: null };
  }
  conv.missCount = 0;
  const intent = INTENTS[id];
  if (intent.escalate) return { ...startCollect(conv, intent.escalate, [{ text: fill(content.answers[id], ctx) }], ctx), intent: id };
  const reply = answer(id, content, ctx);
  if (id === 'enquiry_status' && conv.escalationRef) reply.messages.unshift({ text: `הפנייה שלכם מהשיחה הזו (מספר ${conv.escalationRef}) התקבלה ב־${new Date(conv.escalationAt || now).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem', dateStyle: 'short', timeStyle: 'short' })} ומחכה לנציג.` });
  if (id === 'contact_hours') reply.messages.push({ text: hoursStatus(content.hours, now).next + '.' });
  return reply;
}

// Messages after the escalation record exists.
export function confirmation(conv, ref, content, now = new Date()) {
  const status = hoursStatus(content.hours, now);
  conv.escalationRef = ref; conv.escalationAt = now.toISOString();
  const when = status.open ? 'נציג יחזור אליכם בהקדם, בדרך כלל עוד היום.' : `${status.next}, ונחזור אליכם ביום הפעילות הקרוב.`;
  const channel = conv.channel === 'whatsapp' ? 'הנציג ימשיך איתכם כאן בוואטסאפ.' : 'אפשר להמשיך לשאול כאן בינתיים.';
  return [{ text: `קיבלנו. מספר הפנייה: ${ref}. ${when} שעות הפעילות: ${status.text}. ${channel}` }];
}

export const INTENT_IDS = Object.keys(INTENTS);
