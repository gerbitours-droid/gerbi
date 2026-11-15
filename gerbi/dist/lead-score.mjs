// Lead priority, missing details and a WhatsApp draft template (spec 22 §4.4) — deterministic, shared by the admin
// page (instant badge, sorting) and the server (fallback when no AI key, and grounding facts for the AI).
import { BUDGETS, FLEXIBILITY, STYLES } from './leads-validate.mjs';

const DAY = 86400000;
const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / DAY);
const heDate = (iso) => (/^\d{4}-\d{2}-\d{2}$/.test(iso || '') ? `${Number(iso.slice(8, 10))}.${Number(iso.slice(5, 7))}` : '');
const VAGUE = /^(?:\s*|עוד לא (?:יודעים|יודע|יודעת|החלטנו)|לא יודע(?:ים|ת)?|פתוח(?:ים)?|גמיש(?:ים)?|הכל|הכול|כל מקום)$/;
const REASON = /^\[([^\]]+)\]/;

export const PRIORITY_LABEL = { high: 'עדיפות גבוהה', medium: 'עדיפות בינונית', low: 'עדיפות נמוכה', done: 'טופל' };

// → { score 0–100, level high|medium|low|done, reasons[] (Hebrew) }
export function scoreLead(lead, now = new Date()) {
  const today = new Date(now).toISOString().slice(0, 10), reasons = [];
  if (lead.status === 'closed') return { score: 0, level: 'done', reasons: ['הפנייה סגורה'] };
  let score = 0;
  const add = (points, reason) => { score += points; if (reason) reasons.push(reason); };
  if (lead.type === 'tailor') add(25, 'טיול בהתאמה אישית');
  else if (lead.type === 'support') {
    const reason = REASON.exec(lead.message || '')?.[1] || '';
    if (/תלונה|חיוב|בעיה בהזמנה/.test(reason)) add(40, `שירות: ${reason}`); else add(20, 'פנייה לשירות');
  } else add(12, 'פנייה כללית');
  const start = lead.start || lead.context?.depart || '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(start)) {
    const days = daysBetween(today, start);
    if (days >= 0 && days <= 30) add(25, `יציאה בעוד ${days} ימים`);
    else if (days > 30 && days <= 90) add(15, 'יציאה בשלושת החודשים הקרובים');
    else if (days > 90) add(5);
  }
  const budgetPoints = { over40: 20, '20to40': 15, '10to20': 10, '5to10': 5 }[lead.budget];
  if (budgetPoints) add(budgetPoints, `תקציב ${BUDGETS[lead.budget]}`);
  const party = (Number(lead.adults) || (lead.context?.adults ?? 0)) + (Number(lead.children) || (lead.context?.children ?? 0));
  if (party >= 4) add(10, `${party} נוסעים`); else if (party >= 2) add(4);
  if (lead.context?.to) add(10, 'הגיע מחיפוש טיסה');
  if (String(lead.message || lead.notes || '').length > 60) add(5, 'כתב/ה פירוט');
  const waited = Math.floor((Date.parse(now) - Date.parse(lead.createdAt || now)) / 3600000);
  if (lead.status !== 'progress' && waited >= 24) add(15, `ממתין/ה ${waited >= 48 ? Math.floor(waited / 24) + ' ימים' : 'יותר מיום'}`);
  else if (lead.status !== 'progress' && waited < 2) add(8, 'פנייה טרייה');
  score = Math.min(100, score);
  return { score, level: score >= 60 ? 'high' : score >= 35 ? 'medium' : 'low', reasons };
}

// The questions a quote needs, most important first.
export function missingDetails(lead) {
  const out = [];
  if (lead.type === 'tailor') {
    if (VAGUE.test(lead.destinations || '')) out.push('יש כיוון או סוג מקום שמושך אתכם (ים, עיר, טבע)?');
    if (!lead.start) out.push(lead.flexibility === 'month' ? 'באיזה חודש בדיוק, וכמה לילות?' : 'מתי תרצו לטוס, ועד כמה התאריכים גמישים?');
    if (!lead.budget || lead.budget === 'open') out.push('מה התקציב המשוער לכל הטיול?');
    if (Number(lead.children) > 0) out.push('בני כמה הילדים?');
  } else if (lead.type === 'contact') {
    if (!lead.context?.to && !/\p{L}{3,}/u.test(lead.message || '')) out.push('במה נוכל לעזור? לאן ומתי חשבתם לטוס?');
    else if (!lead.context?.depart) out.push('מתי תרצו לטוס, וכמה נוסעים?');
  } else if (lead.type === 'support') out.push('מה מספר ההזמנה או הפרטים שאפשר לבדוק מולם?');
  return out.slice(0, 3);
}

// One-line summary for the card (no AI).
export function summaryText(lead) {
  const party = lead.adults ? `${lead.adults} מבוגרים${Number(lead.children) ? ` + ${lead.children} ילדים` : ''}` : lead.context?.adults ? `${lead.context.adults + (lead.context.children || 0)} נוסעים` : '';
  const dates = lead.start ? `${heDate(lead.start)}${lead.end ? '–' + heDate(lead.end) : ''}` : lead.context?.depart ? heDate(lead.context.depart) : FLEXIBILITY[lead.flexibility] || '';
  const where = lead.destinations || (lead.context?.to ? `טיסה ל־${lead.context.to}` : '');
  const styles = (lead.styles || []).map((s) => STYLES[s]).filter(Boolean).slice(0, 2).join(', ');
  const kind = lead.type === 'tailor' ? 'טיול בהתאמה' : lead.type === 'support' ? 'שירות' : 'פנייה';
  const text = lead.type === 'tailor' ? '' : String(lead.message || '').replace(REASON, '').trim().slice(0, 80);
  return [kind, where, dates, party, lead.budget && lead.budget !== 'open' ? BUDGETS[lead.budget] : '', styles, text && `„${text}”`].filter(Boolean).join(' · ');
}

// WhatsApp draft with the {שם} placeholder (the browser fills the first name; the server never needs it).
export function whatsappTemplate(lead) {
  const where = !VAGUE.test(lead.destinations || '') && lead.destinations ? ` ל${lead.destinations.replace(/^ל/, '')}` : lead.context?.to ? ' שחיפשתם' : '';
  const when = lead.start ? ` ב־${heDate(lead.start)}` : '';
  const q = missingDetails(lead).slice(0, 2);
  const opener = lead.type === 'support' ? 'קיבלנו את הפנייה שלכם לשירות הלקוחות ואנחנו על זה.' : `קיבלנו את הפנייה שלכם${lead.type === 'tailor' ? ` לטיול${where}${when}` : where ? ` לגבי הטיסה${where}` : ''} — תודה שפניתם!`;
  return [`היי {שם}, כאן ג׳רבי טורס.`, opener, q.length ? `כדי להכין לכם הצעה מדויקת, נשמח לדעת: ${q.join(' ')}` : 'נשמח לתאם שיחה קצרה כדי להתקדם.', 'מתי נוח לכם לדבר?'].join('\n');
}

export const firstName = (name) => String(name || '').trim().split(/\s+/)[0] || '';
export const fillName = (text, name) => String(text || '').replace(/\{שם\}/g, firstName(name) || '').replace(/^היי ,/, 'היי,');
