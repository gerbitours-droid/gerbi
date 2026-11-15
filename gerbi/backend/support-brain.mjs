// Customer-service brain (spec 16 §3): a deterministic Hebrew intent classifier and a small conversation state
// machine shared by the site widget and WhatsApp. Pure: no I/O. The caller stores the conversation and performs
// the escalation side effects (lead + escalation record) when a reply carries `escalate`.
import { INTENTS, CHIP_LABELS, hoursStatus, chipLabel, linkFor } from './support-content.mjs';
import { normalizeIsraeliPhone, CONSENT_TEXT } from '../dist/leads-validate.mjs';
import { tIn, normLang, locale } from '../dist/i18n.mjs';

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
// English questions (spec 21): same intents, same scoring. Apostrophes are removed by normalize ("don't" → "dont").
const TERMS_EN = {
  greeting: [['hi', 1], ['hello', 1], ['hey', 1], ['shalom', 1], ['good morning', 1.2], ['good evening', 1.2], ['good afternoon', 1.2], ['how are you', 1], ['anyone there', 1]],
  thanks: [['thanks', 1.2], ['thank you', 1.2], ['thx', 1], ['bye', 1], ['goodbye', 1], ['cheers', 0.8], ['great', 0.6], ['perfect', 0.6], ['awesome', 0.6]],
  menu: [['menu', 1.5], ['options', 1], ['topics', 1], ['what can you do', 1.5], ['how can you help', 1.5], ['what do you know', 1.2], ['main menu', 1.5], ['=help', 1]],
  baggage: [['baggage', 1.5], ['luggage', 1.5], ['suitcase', 1.5], ['=bag', 1.5], ['bags', 1.5], ['carry on', 1.5], ['hand luggage', 1], ['checked bag', 1], ['trolley', 1.5], ['=kg', 1], ['kilo', 1], ['weight', 1],
    ['stroller', 1.2], ['pram', 1.2], ['car seat', 1.2], ['sports equipment', 1.5], ['allowance', 1], ['personal item', 1.2], ['bring on the plane', 2], ['take on the plane', 2]],
  cancel_change: [['cancel', 1.5], ['cancellation', 1.5], ['change', 1.2], ['reschedule', 1.5], ['postpone', 1.2], ['modify', 1.2], ['refund', 1.5], ['refundable', 1.5], ['money back', 1.5],
    ['cancellation policy', 1.5], ['cancellation fee', 1.5], ['change fee', 1.5], ['change my flight', 1.5], ['change the date', 1.5], ['change dates', 1.5], ['move my flight', 1.5]],
  how_booking: [['how do i book', 2], ['how to book', 2], ['=book', 1.2], ['booking', 0.7], ['how does it work', 2], ['how it works', 2], ['process', 1.2], ['book on the site', 1.5], ['can i book', 1.5],
    ['buy a ticket', 1.5], ['buy tickets', 1.5], ['buy a flight', 1.5], ['reserve', 1.2], ['search for flights', 1.2], ['search flights', 1.2], ['find a flight', 1.2]],
  payment: [['payment', 1.5], ['=pay', 1.5], ['paying', 1.5], ['credit card', 1.5], ['=bit', 1.2], ['paybox', 1.5], ['bank transfer', 1.5], ['cash', 1.2], ['deposit', 1.5], ['invoice', 1.2], ['receipt', 1], ['installments', 1.5]],
  documents: [['passport', 1.5], ['visa', 1.5], ['visas', 1.5], ['esta', 1.5], ['=eta', 1.2], ['document', 1.2], ['id card', 1.2], ['validity', 1], ['valid for', 1], ['entry permit', 1.5], ['entry requirements', 1.5], ['biometric', 1.2], ['laissez passer', 1.5]],
  contact_hours: [['hours', 1.2], ['opening hours', 1.5], ['open', 1.2], ['phone number', 1.2], ['phone', 1], ['whatsapp', 1], ['email', 1], ['e mail', 1], ['address', 1], ['office', 1.2], ['contact', 1.5],
    ['get in touch', 1.5], ['reach you', 1.5], ['available', 1], ['when are you', 1.2], ['where are you', 1.2]],
  enquiry_status: [['status', 1.5], ['enquiry', 0.8], ['inquiry', 0.8], ['my enquiry', 2], ['my inquiry', 2], ['my request', 1.5], ['heard back', 1.5], ['havent heard', 2], ['no one got back', 2], ['nobody got back', 2],
    ['no one called', 2], ['follow up', 1.2], ['update', 0.8], ['left my details', 2], ['waiting for an answer', 2], ['waiting for a reply', 2], ['still waiting', 2], ['sent a request', 2], ['sent an enquiry', 2], ['any news', 1]],
  tailor: [['tailor made', 2], ['tailored', 1.2], ['custom', 1.2], ['organized tour', 2], ['organised tour', 2], ['guided tour', 2], ['package', 1.2], ['honeymoon', 2], ['group', 1.2], ['plan a trip', 1.5], ['plan my trip', 1.5],
    ['itinerary', 1], ['route', 1], ['family trip', 1.5], ['boutique', 1]],
  price: [['price', 1.5], ['prices', 1.5], ['how much', 2], ['cost', 1.5], ['costs', 1.5], ['expensive', 1.2], ['cheap', 1.2], ['cheaper', 1.2], ['cheapest', 1.2], ['deal', 1.2], ['deals', 1.2], ['discount', 1.2],
    ['price changed', 1.5], ['shekel', 0.8], ['dollar', 0.8], ['fare', 1]],
  complaint: [['complain', 2], ['complaint', 2], ['not happy', 2], ['unhappy', 2], ['not satisfied', 2], ['dissatisfied', 2], ['terrible', 1.5], ['awful', 1.5], ['disappointed', 1.5], ['outrageous', 1.5],
    ['compensation', 1.5], ['disgrace', 1.5], ['unacceptable', 1.5], ['poor service', 2], ['rude', 1.5], ['was rude', 1.5]],
  booking_issue: [['charged', 2], ['charge', 1.5], ['charged twice', 2.5], ['double charge', 2.5], ['my booking', 2], ['my reservation', 2], ['my ticket', 1.5], ['my flight', 1.5], ['booking number', 2], ['booking reference', 2],
    ['reference number', 1.5], ['didnt receive', 1.5], ['did not receive', 1.5], ['never received', 1.5], ['flight was cancelled', 2], ['flight was canceled', 2], ['flight cancelled', 2], ['flight canceled', 2],
    ['missed', 1.5], ['delayed', 1], ['delay', 1], ['i paid', 1.5], ['i booked', 1.2], ['booking confirmation', 1.5], ['money was taken', 1.5]],
  human: [['=agent', 2.5], ['agents', 2.5], ['representative', 2.5], ['=rep', 2.5], ['human', 2.5], ['real person', 2.5], ['a person', 1.5], ['talk to someone', 2.5], ['speak to someone', 2.5], ['speak with someone', 2.5],
    ['talk to', 1.2], ['speak to', 1.2], ['manager', 1.5], ['supervisor', 1.5], ['operator', 2], ['call me', 2.5], ['get back to me', 2.5], ['contact me', 2]]
};
for (const [id, list] of Object.entries(TERMS_EN)) TERMS[id].push(...list);
const FRUSTRATION = ['נמאס', 'מעצבנ', 'מתסכל', 'לא עוזר', 'לא עוזרת', 'זה לא עובד', 'לא מבינ אותי', 'לא מבינה אותי', 'חסר תועלת', 'די כבר', 'מטומטמ', 'עצבני', 'רובוט מעצבנ', 'בוט טיפש', 'אין לי כוח',
  'useless', 'annoying', 'frustrating', 'not helping', 'doesnt help', 'not working', 'doesnt work', 'you dont understand', 'stupid', 'fed up', 'ridiculous', 'waste of time', 'pointless'];
const YES = ['כנ', 'בטח', 'אשמח', 'יאללה', 'בסדר', 'אוקי', 'ok', 'מאשר', 'מאשרת', 'כמובנ', 'סבבה', 'yes', 'yeah', 'yep', 'sure', 'okay', 'of course', 'please', 'go ahead', 'i agree', 'agree', 'fine'];
const NO = ['לא', 'לא תודה', 'אין צורכ', 'לא עכשיו', 'ביטול', 'בטל', 'עזוב', 'עזבי', 'no', 'no thanks', 'nope', 'not now', 'cancel', 'never mind'];
const CANCEL = ['ביטול', 'בטל', 'עזוב', 'עזבי', 'לא עכשיו', 'לא משנה', 'תפריט', 'cancel', 'stop', 'never mind', 'not now', 'menu'];
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

const chipIn = (lang) => (id) => ({ id, label: normLang(lang) === 'he' ? CHIP_LABELS[id] || INTENTS[id]?.title || id : chipLabel(id, lang) });
const fill = (text, ctx) => text.replace(/\{(hours|phone|whatsapp|email)\}/g, (_, key) => ctx[key] || '');
// Phone numbers are wrapped in LTR isolates so "050-1234567" does not flip inside Hebrew text.
const ltr = (value) => `\u2066${value}\u2069`;
const formatPhone = (p) => ltr(/^0\d{9}$/.test(p) ? `${p.slice(0, 3)}-${p.slice(3)}` : /^0\d{8}$/.test(p) ? `${p.slice(0, 2)}-${p.slice(2)}` : p);
export function contactContext(content, contact = {}) {
  const wa = /^972\d{8,9}$/.test(contact.whatsapp || '') ? formatPhone('0' + contact.whatsapp.slice(3)) : '';
  const soon = tIn(normLang(content.lang))('support.brain.soon');
  return { hours: content.hours.text, phone: contact.phone ? formatPhone(contact.phone) : soon, whatsapp: wa || soon, email: contact.email ? ltr(contact.email) : soon };
}
// The conversation language: the page (web) or the visitor's text (WhatsApp) sets conv.lang; content may be localized.
const langOf = (conv, content) => normLang(conv?.lang || content?.lang);

function answer(id, content, ctx, lang = 'he') {
  const intent = INTENTS[id], link = linkFor(id, lang), messages = [{ text: fill(content.answers[id], ctx), ...(link ? { link } : {}) }];
  return { messages, chips: intent.chips.map(chipIn(lang)), input: 'text', intent: id };
}

function startCollect(conv, reason, lead, ctx) {
  conv.offer = null;
  const T = tIn(normLang(conv.lang)), chip = chipIn(conv.lang);
  if (conv.escalationRef) return { messages: [...lead, { text: T('support.brain.alreadyEscalated', { ref: conv.escalationRef, hours: ctx.hours }) }], chips: ['menu'].map(chip), input: 'text', intent: 'human' };
  conv.collect = { reason, step: null, tries: 0 };
  return nextStep(conv, lead);
}
function nextStep(conv, lead = []) {
  const c = conv.collect, known = conv.contact, lang = normLang(conv.lang), T = tIn(lang), chip = chipIn(lang);
  if (!known.name) { c.step = 'name'; return { messages: [...lead, { text: T('support.brain.askName') }], chips: [chip('cancel')], input: 'name' }; }
  if (!known.phone) { c.step = 'phone'; return { messages: [...lead, { text: T('support.brain.askPhone', { name: known.name }) }], chips: [chip('cancel')], input: 'tel' }; }
  c.step = 'consent';
  const phoneLine = conv.channel === 'whatsapp' ? T('support.brain.phoneWhatsapp') : T('support.brain.phoneLine', { phone: formatPhone(known.phone) });
  return { messages: [...lead, { text: `${phoneLine} ${lang === 'he' ? CONSENT_TEXT : T('support.brain.consent')}` }], chips: [chip('consent_yes'), chip('consent_no')], input: 'text' };
}

// One customer turn. Mutates `conv`; returns { messages, chips, input, intent, escalate? }.
// `escalate` = { reason } means the caller must create the escalation and then append confirmation(...) messages.
export function respond(conv, { text = '', chip: chipId = '' } = {}, { content, contact = {}, now = new Date() } = {}) {
  if (!conv.lang && content?.lang) conv.lang = content.lang;
  const lang = langOf(conv, content), T = tIn(lang), chip = chipIn(lang);
  const ctx = contactContext(content, contact), norm = normalize(text), chosen = chipId && (Object.hasOwn(INTENTS, chipId) || Object.hasOwn(CHIP_LABELS, chipId)) ? chipId : '';
  // 1) Collecting contact details for an escalation.
  if (conv.collect) {
    const c = conv.collect;
    if (chosen === 'cancel' || chosen === 'consent_no' || (!chosen && isOneOf(norm, CANCEL)) || (c.step === 'consent' && !chosen && isOneOf(norm, NO))) {
      conv.collect = null;
      return { messages: [{ text: T('support.brain.cancelled', { phone: ctx.phone, whatsapp: ctx.whatsapp }) }], chips: ['menu', 'human'].map(chip), input: 'text', intent: null };
    }
    if (c.step === 'name' && !chosen) {
      const name = String(text).replace(/[\u0000-\u001f<>]/g, '').trim().replace(/^(קוראימ לי|שמי|אני|השמ שלי)\s+/u, '').replace(/^(my name is|my name's|i am|i'm|this is|it's)\s+/i, '').slice(0, 80);
      if (name.length < 2 || /\d{3,}|\?/.test(name) || name.split(/\s+/).length > 4) return { messages: [{ text: T('support.brain.nameInvalid') }], chips: [chip('cancel')], input: 'name' };
      conv.contact.name = name; return nextStep(conv);
    }
    if (c.step === 'phone' && !chosen) {
      const phone = normalizeIsraeliPhone(text);
      if (!phone) {
        c.tries += 1;
        if (c.tries >= 2) { conv.collect = null; return { messages: [{ text: T('support.brain.phoneGiveUp', { phone: ctx.phone, whatsapp: ctx.whatsapp }), link: { href: '#/contact', label: T('support.brain.contactForm') } }], chips: ['human', 'menu'].map(chip), input: 'text', intent: null }; }
        return { messages: [{ text: T('support.brain.phoneInvalid', { example: ltr('050-1234567') }) }], chips: [chip('cancel')], input: 'tel' };
      }
      conv.contact.phone = phone; return nextStep(conv);
    }
    if (c.step === 'consent' && (chosen === 'consent_yes' || (!chosen && isOneOf(norm, YES)))) {
      conv.collect = null;
      return { messages: [], chips: [], input: 'text', intent: null, escalate: { reason: c.reason } };
    }
    // Anything else mid-collection: repeat the current question.
    return nextStep(conv, [{ text: T('support.brain.toComplete') }]);
  }
  // 2) An open offer to escalate (after two misses).
  if (conv.offer === 'escalate') {
    if (chosen === 'yes_escalate' || (!chosen && isOneOf(norm, YES))) return startCollect(conv, 'not_understood', [], ctx);
    conv.offer = null;
    if (chosen === 'no_escalate' || (!chosen && isOneOf(norm, NO))) { conv.missCount = 0; return { messages: [{ text: T('support.brain.offerDeclined') }], chips: INTENTS.menu.chips.map(chip), input: 'text', intent: null }; }
  }
  // 3) Classify.
  let id = chosen && INTENTS[chosen] ? chosen : '', frustrated = false;
  if (chosen === 'yes_escalate') id = 'human';
  if (!id && text) { const r = classify(text); id = r.intent || ''; frustrated = r.frustrated; }
  if (frustrated && !['human', 'complaint', 'booking_issue'].includes(id)) return startCollect(conv, 'frustration', [{ text: T('support.brain.frustrated') }], ctx);
  if (!id) {
    conv.missCount += 1;
    if (conv.missCount >= 2) { conv.offer = 'escalate'; return { messages: [{ text: T('support.brain.offerEscalate') }], chips: [chip('yes_escalate'), chip('no_escalate')], input: 'text', intent: null }; }
    return { messages: [{ text: T('support.brain.notUnderstood') }], chips: ['baggage', 'cancel_change', 'how_booking', 'payment', 'documents', 'human'].map(chip), input: 'text', intent: null };
  }
  conv.missCount = 0;
  const intent = INTENTS[id];
  if (intent.escalate) return { ...startCollect(conv, intent.escalate, [{ text: fill(content.answers[id], ctx) }], ctx), intent: id };
  const reply = answer(id, content, ctx, lang);
  if (id === 'enquiry_status' && conv.escalationRef) reply.messages.unshift({ text: T('support.brain.statusOfThis', { ref: conv.escalationRef, when: new Date(conv.escalationAt || now).toLocaleString(locale(lang), { timeZone: 'Asia/Jerusalem', dateStyle: 'short', timeStyle: 'short', ...(lang === 'en' ? { hour12: false } : {}) }) }) });
  if (id === 'contact_hours') reply.messages.push({ text: hoursStatus(content.hours, now, lang).next + '.' });
  return reply;
}

// Messages after the escalation record exists.
export function confirmation(conv, ref, content, now = new Date()) {
  const lang = langOf(conv, content), T = tIn(lang), status = hoursStatus(content.hours, now, lang);
  conv.escalationRef = ref; conv.escalationAt = now.toISOString();
  const when = status.open ? T('support.brain.soonToday') : T('support.brain.nextDay', { next: status.next });
  const channel = conv.channel === 'whatsapp' ? T('support.brain.continueWhatsapp') : T('support.brain.continueWeb');
  return [{ text: T('support.brain.received', { ref, when, hours: status.text, channel }) }];
}

export const INTENT_IDS = Object.keys(INTENTS);
