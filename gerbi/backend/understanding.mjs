import { flatTags, destinationTags } from './tag-catalog.mjs';
import { rankInspirations, coupleIntent, destinationConstraints } from '../dist/personalization.mjs';

const months = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
const tagIndex = flatTags();

export function normalizeHebrew(value = '') {
  return String(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/["׳״']/g, '')
    .replace(/[,;:!?().]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function safeTokens(value = '') {
  return [...new Set(normalizeHebrew(value)
    .split(' ')
    .filter((token) => token.length >= 2 && token.length <= 32 && !/^\d+$/.test(token))
    .slice(0, 40))];
}

function numberWord(value) {
  return ({ אחד: 1, אחת: 1, שני: 2, שתי: 2, שלושה: 3, שלוש: 3, ארבעה: 4, ארבע: 4 })[value] ?? Number(value);
}

export function extractSignals(text, previous = {}) {
  const normalized = normalizeHebrew(text);
  const tags = tagIndex.filter((tag) => tag.aliases.some((alias) => {
    const words = normalizeHebrew(alias).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?:^|\\s)(?:ב|ו|ל|ה)?${words}(?=\\s|$)`).test(normalized);
  })).map((tag) => tag.id);
  const result = { ...previous, tags: [...new Set([...(previous.tags || []), ...tags])] };
  const budget = normalized.match(/(?:עד|תקציב(?: של)?)\s*(\d+(?:\.\d+)?)\s*(אלף|אלפים|k)?/);
  if (budget) result.budget = Math.round(Number(budget[1]) * (budget[2] ? 1000 : 1));
  const nights = normalized.match(/(\d+)\s*(?:לילות|ימים)/);
  if (nights) result.nights = Math.min(30, Math.max(1, Number(nights[1])));
  else if (normalized.includes('שבועיים')) result.nights = 14;
  else if (normalized.includes('שבוע')) result.nights = 7;
  else if (/סופש|סוף שבוע/.test(normalized)) result.nights = 3;
  const children = normalized.match(/(\d+|שני|שתי|שלושה|שלוש|ארבעה|ארבע)\s*ילד/);
  if (children) result.children = Math.min(6, numberWord(children[1]));
  if (/בלי ילדים|ללא ילדים/.test(normalized)) {
    result.children = 0;
    result.family = false;
    result.tags = result.tags.filter(tag=>!['family','with_children'].includes(tag));
  }
  if (/בלי ים|ללא ים|לא רוצים ים/.test(normalized)) {
    result.beach = false;
    result.tags = result.tags.filter(tag=>tag!=='beach');
  }
  if (/זוג|שני מבוגרים/.test(normalized)) result.adults = 2;
  if (/לבד|סולו/.test(normalized)) result.adults = 1;
  const people = normalized.match(/(\d+)\s*(?:נוסעים|אנשים|מטיילים)/);
  if (people) result.adults = Math.min(9, Math.max(1, Number(people[1]) - (result.children || 0)));
  const month = months.find((name) => normalized.includes(name));
  if (month) result.month = month;
  const couple = coupleIntent(text, result.children || 0);
  if (couple !== undefined) result.couple = couple;
  if (couple === false) result.tags = result.tags.filter(tag => tag !== 'couple');
  Object.assign(result, destinationConstraints(text, previous));
  return result;
}

export function missingFields(signals) {
  const missing = [];
  if (!signals.adults) missing.push({ id: 'travelers', question: 'כמה מבוגרים וילדים נוסעים?' });
  if (!signals.nights) missing.push({ id: 'nights', question: 'לכמה לילות תרצו לצאת?' });
  if (!signals.month && !signals.startDate) missing.push({ id: 'dates', question: 'באיזה חודש או תאריכים נוחים לכם?' });
  if (!signals.budget) missing.push({ id: 'budget', question: 'מה התקציב הכולל לכל הנוסעים?' });
  return missing;
}

export function scoreDestinations(destinations, signals) {
  // Global popularity must not silently override this traveler's explicit brief.
  return rankInspirations(destinations, signals).map(({trip,score,total})=>({
    destination:trip,score,estimate:total,affordable:true,
    matchedTags:(destinationTags[trip.id]||[]).filter(tag=>signals[tag]===true ||
      (signals[tag]!==false && (signals.tags||[]).includes(tag)))
  }));
}
