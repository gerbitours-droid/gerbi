import { flatTags, destinationTags } from './tag-catalog.mjs';
import { rankInspirations } from '../dist/personalization.mjs';
import { understandRequest } from '../dist/brief-engine.mjs';
export { understandRequest };

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
  const { brief } = understandRequest(text, previous);
  const normalized = normalizeHebrew(text);
  // Catalog tags feed the learning layer; an explicit "no" in the brief always wins over an alias match.
  let tags = [...new Set([...(previous.tags || []), ...tagIndex.filter((tag) => tag.aliases.some((alias) => {
    const words = normalizeHebrew(alias).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?:^|\\s)(?:ב|ו|ל|ה)?${words}(?=\\s|$)`).test(normalized);
  })).map((tag) => tag.id)])];
  for (const [key, ids] of [['beach', ['beach']], ['family', ['family', 'with_children']], ['couple', ['couple']], ['city', ['city']], ['relaxation', ['relaxation']]])
    if (brief[key] === false) tags = tags.filter((tag) => !ids.includes(tag));
  return { ...brief, tags };
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
