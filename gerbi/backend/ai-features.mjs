// AI features (spec 22 §4): each one = deterministic answer first, then (when a provider is configured and the
// task is enabled) a gateway call whose output is grounded and re-validated. Nothing here sends contact details.
import { createGateway, numbersGrounded, stripLinks } from './ai-gateway.mjs';
import { TASKS } from './ai-tasks.mjs';
import { scoreLead, missingDetails, summaryText, whatsappTemplate } from '../dist/lead-score.mjs';
import { tailorFromText, cleanTailor, mergeTailor } from '../dist/tailor-fill.mjs';
import { BUDGETS, FLEXIBILITY, STYLES, CHANNELS } from '../dist/leads-validate.mjs';
import { slugFromTitle } from '../dist/content-model.mjs';
import { top } from './search-stats.mjs';
import { normLang } from '../dist/i18n.mjs';

// The process-wide gateway (server.mjs attaches the KV stores with gateway.configure).
export const gateway = createGateway({ tasks: TASKS });
export const CUSTOMER_FEATURES = ['understand', 'support_answer', 'tailor_fill', 'flight_explain', 'trip_polish'];

export async function featureStatus(gw = gateway) {
  return Object.fromEntries(await Promise.all(CUSTOMER_FEATURES.map(async (id) => [id, await gw.enabled(id)])));
}

// ---------- support: grounded answer from the owner's FAQ ----------
// sources: [{ id, title, text }] — bot answers (placeholders filled) and site FAQs.
export async function supportAnswer(text, sources, { store = null, gw = gateway, lang = 'he' } = {}) {
  if (!sources.length) return null;
  const ids = new Set(sources.map((s) => s.id));
  const validate = (v) => {
    const topics = [...new Set((v.topics || []).filter((id) => ids.has(id)))].slice(0, 3);
    const used = sources.filter((s) => topics.includes(s.id));
    const answer = stripLinks(v.answer);
    // Facts in the answer must come from the sources it cites (or, without citations, from all sources).
    const grounded = v.answerable && answer.length >= 8 && !/@/.test(answer) && numbersGrounded(answer, (used.length ? used : sources).map((s) => s.text));
    return { answerable: Boolean(grounded), answer: grounded ? answer : '', topics, escalate: v.escalate === true, rejected: v.answerable && !grounded };
  };
  const result = await gw.run('support_answer', { customer_text: String(text).slice(0, 600), sources }, { cache: store, validate, lang: normLang(lang) });
  return result ? { ...result.value, cached: result.cached } : null;
}

// ---------- tailor-made form ----------
export async function tailorFill(text, { today = new Date().toISOString().slice(0, 10), store = null, gw = gateway, lang = 'he' } = {}) {
  const rules = tailorFromText(text, today, normLang(lang)).fields; // the rules part answers in the request language too
  const result = await gw.run('tailor_fill', { customer_text: String(text).slice(0, 1500), today }, { cache: store, validate: (v) => cleanTailor(v, today), lang: normLang(lang) });
  const ai = result?.value || {};
  const fields = mergeTailor(rules, ai);
  return { fields, filled: Object.keys(fields), source: result ? 'ai' : 'rules', aiFields: Object.keys(ai).filter((k) => !(k in rules)) };
}

// ---------- flight comparison ----------
// offers: [{ label:'A', price:'₪ 2,431', duration:'4 ש׳ 50 ד׳', stops, longestWait, departs[], arrives[], bag, carrier }]
export async function flightExplain(offers, brief, { store = null, gw = gateway, lang = 'he' } = {}) {
  if (!Array.isArray(offers) || offers.length < 2) return null;
  const labels = offers.map((o) => o.label), english = normLang(lang) === 'en';
  const validate = (v) => {
    // Travelers see a list, not letters: "A" becomes "הטיסה הראשונה" ("the first flight") and so on.
    const ord = english
      // "A" is also an English article: it is replaced only as "flight/offer/option A", "A:" or "(A)"; B and C anywhere.
      ? (t) => stripLinks(t).replace(/\b(?:the )?(?:flight|offer|option) ([ABC])\b|^([ABC])(?=:)|\(([ABC])\)|\b([BC])\b(?![’'])/gi, (m, a, b, c, d) => {
        const l = (a || b || c || d).toUpperCase();
        return /^[abc]$/.test(a || b || c || d) && !a ? m : `the ${({ A: 'first', B: 'second', C: 'third' })[l]} flight`;
      }).replace(/(^|[.!?]\s+)the /g, (m, p) => p + 'The ')
      : (t) => stripLinks(t).replace(/(^|[^A-Za-z])(?:הטיסה |טיסה )?([ABC])(?![A-Za-z])/g, (m, pre, l) => pre + 'הטיסה ' + ({ A: 'הראשונה', B: 'השנייה', C: 'השלישית' })[l]);
    const summary = ord(v.summary), tradeoffs = (v.tradeoffs || []).map(ord).filter(Boolean).slice(0, 3);
    if (summary.length < 10 || !numbersGrounded([summary, ...tradeoffs].join(' '), [JSON.stringify(offers), JSON.stringify(brief)])) return null;
    return { summary, tradeoffs, pick: labels.includes(v.pick) ? v.pick : '' };
  };
  const result = await gw.run('flight_explain', { brief, offers }, { cache: store, validate, lang: normLang(lang) });
  return result ? { ...result.value, cached: result.cached } : null;
}

// ---------- magic trip builder (spec 24 §7): wording only, never new places or numbers ----------
// days: [{ kind, items:[names] }] from the deterministic plan. Returns { intro, dayTitles } or null (keep the rules' text).
export async function tripPolish(destination, travellers, days, { store = null, gw = gateway, lang = 'he' } = {}) {
  if (!Array.isArray(days) || !days.length || days.length > 40) return null;
  const input = { destination: String(destination || '').slice(0, 80), travellers: String(travellers || '').slice(0, 120),
    days: days.map((d, i) => ({ day: i + 1, kind: String(d?.kind || 'full').slice(0, 12), items: (Array.isArray(d?.items) ? d.items : []).map((x) => String(x).slice(0, 120)).slice(0, 6) })) };
  const validate = (v) => {
    const titles = (v.dayTitles || []).map((x) => stripLinks(x).slice(0, 80));
    if (titles.length !== input.days.length || titles.some((x) => x.length < 2)) return null;
    const intro = stripLinks(v.intro).slice(0, 400);
    if (!numbersGrounded([intro, ...titles].join(' '), [JSON.stringify(input)])) return null;
    return { intro, dayTitles: titles };
  };
  const result = await gw.run('trip_polish', input, { cache: store, validate, lang: normLang(lang) });
  return result ? { ...result.value, cached: result.cached } : null;
}

// ---------- owner: lead brief ----------
// What the model may see: trip fields and the customer's text (redacted). Never name, phone or e-mail.
export function leadFacts(lead, now = new Date()) {
  const ageHours = Math.max(0, Math.round((Date.parse(now) - Date.parse(lead.createdAt || now)) / 3600000));
  return { type: lead.type, status: lead.status, receivedHoursAgo: ageHours, channel: CHANNELS[lead.channel] || lead.channel || '', source: lead.source || '',
    destinations: lead.destinations || '', start: lead.start || '', end: lead.end || '', flexibility: FLEXIBILITY[lead.flexibility] || '',
    adults: lead.adults ?? null, children: lead.children ?? null, budget: BUDGETS[lead.budget] || '', styles: (lead.styles || []).map((s) => STYLES[s]).filter(Boolean),
    customer_text: String(lead.type === 'tailor' ? lead.notes || '' : lead.message || '').slice(0, 1500),
    searchContext: lead.context ? { from: lead.context.from, to: lead.context.to, depart: lead.context.depart, return: lead.context.return, adults: lead.context.adults, children: lead.context.children } : null,
    ownerNotes: (lead.adminNotes || []).slice(-3).map((n) => String(n.text || '').slice(0, 200)) };
}
export async function leadBrief(lead, { store = null, gw = gateway, now = new Date(), useAi = true } = {}) {
  const priority = scoreLead(lead, now), missing = missingDetails(lead);
  const base = { priority, summary: summaryText(lead), intent: '', missing, nextStep: missing.length ? 'לחזור ללקוח ולשאול את השאלות החסרות' : 'להכין הצעה ולחזור ללקוח', whatsapp: whatsappTemplate(lead), source: 'rules' };
  if (!useAi) return base;
  const facts = leadFacts(lead, now);
  const validate = (v) => {
    const whatsapp = stripLinks(v.whatsapp).replace(/^היי[^,\n]*,/, 'היי {שם},');
    if (!numbersGrounded([v.summary, whatsapp, ...(v.missing || [])].join(' '), [JSON.stringify(facts), JSON.stringify(priority)])) return null;
    return { summary: stripLinks(v.summary), intent: v.intent, missing: (v.missing || []).map(stripLinks).filter(Boolean), nextStep: stripLinks(v.nextStep), whatsapp: whatsapp.includes('{שם}') ? whatsapp : `היי {שם},\n${whatsapp}` };
  };
  const result = await gw.run('lead_brief', { lead: facts, priority: { score: priority.score, level: priority.level, reasons: priority.reasons }, missing }, { cache: store, validate });
  return result ? { ...base, ...result.value, source: 'ai', cached: result.cached } : base;
}

// ---------- owner: blog draft ----------
const MONEY = /(?:[₪$€]\s?\d|\d[\d,.]*\s?(?:₪|ש"ח|ש״ח|שקל|דולר|יורו|אירו|%|אחוז))/;
export function blogSkeleton({ topic, keywords = [], audience = 'general' }) {
  const who = { families: 'משפחות עם ילדים', couples: 'זוגות', general: 'מטיילים' }[audience] || 'מטיילים';
  const outline = ['למי זה מתאים ולמה דווקא עכשיו', 'מתי הכי כדאי לנסוע', 'איך מגיעים ואיך מתניידים', 'איפה כדאי לישון', `מה לעשות — המלצות ל${who}`, 'טיפים מעשיים לפני שיוצאים', 'מתכננים עם ג׳רבי טורס'];
  const body = outline.map((h) => `## ${h}\n\n[לכתוב כאן: 2–4 משפטים על ${topic}${h.includes('מתי') ? ' — עונות, מזג אוויר, חגים' : ''}.]\n`).join('\n');
  const kw = keywords.length ? ` ${keywords.slice(0, 2).join(', ')}` : '';
  return { title: topic, seoTitle: `${topic}: המדריך המלא`.slice(0, 60), seoDescription: `כל מה שצריך לדעת על ${topic}${kw} — מתי לנסוע, איפה לישון ומה לעשות. מדריך של ג׳רבי טורס.`.slice(0, 155),
    excerpt: `מדריך קצר ומעשי: ${topic}.`.slice(0, 250), slug: slugFromTitle(keywords.find((k) => /^[a-z0-9 -]+$/i.test(k)) || ''), category: 'מדריכים', tags: keywords.slice(0, 5), outline, body,
    factsToVerify: ['כל פרט על מחירים, שעות פתיחה וחוקי כניסה — לבדוק במקור רשמי לפני פרסום'], source: 'template' };
}
export async function blogDraft(request, { store = null, gw = gateway } = {}) {
  const base = blogSkeleton(request);
  const validate = (v) => {
    if (String(v.body || '').length < 300) return null;
    const facts = [...(v.factsToVerify || [])];
    const lines = String(v.body).split('\n').filter((l) => MONEY.test(l));
    if (lines.length) facts.unshift(`בגוף יש סכומים או אחוזים (${lines.length} שורות) — לבדוק או למחוק: „${lines[0].trim().slice(0, 60)}”`);
    const slug = String(v.slug || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50);
    return { title: v.title.trim(), seoTitle: v.seoTitle.trim().slice(0, 70), seoDescription: v.seoDescription.trim().slice(0, 160), excerpt: v.excerpt.trim().slice(0, 300),
      slug: slug.length >= 3 ? slug : base.slug, category: v.category.trim().slice(0, 40), tags: (v.tags || []).map((t) => t.trim().slice(0, 30)).filter(Boolean).slice(0, 8),
      outline: v.outline || [], body: stripLinks(v.body).replace(/!\[[^\]]*\]\([^)]*\)/g, ''), factsToVerify: facts.slice(0, 15) };
  };
  const result = await gw.run('blog_draft', { topic: request.topic, keywords: request.keywords, audience: request.audience, length: request.length }, { cache: store, validate });
  return result ? { ...result.value, source: 'ai', cached: result.cached } : base;
}

// ---------- owner: daily digest ----------
const norm = (s) => String(s || '').trim().replace(/\s+/g, ' ').replace(/^ל(?=[א-ת]{3})/, '').slice(0, 40);
export function digestFacts(leads, searches, { days = 7, now = new Date() } = {}) {
  const since = Date.parse(now) - days * 86400000, recent = leads.filter((l) => Date.parse(l.createdAt) >= since);
  const count = (list, key) => list.reduce((m, l) => { const k = key(l); if (k) m[k] = (m[k] || 0) + 1; return m; }, {});
  const waiting = leads.filter((l) => l.status === 'new' && Date.parse(now) - Date.parse(l.createdAt) > 86400000);
  const scored = leads.filter((l) => l.status !== 'closed').map((l) => ({ l, s: scoreLead(l, now) })).filter((x) => x.s.level === 'high');
  return {
    periodDays: days,
    leads: { total: recent.length, byType: count(recent, (l) => ({ tailor: 'התאמה אישית', contact: 'צור קשר', support: 'שירות' })[l.type]), byStatus: count(leads, (l) => ({ new: 'חדש', progress: 'בטיפול', closed: 'נסגר' })[l.status] || 'חדש'),
      topDestinations: top(count(recent, (l) => norm(l.destinations || l.context?.to)), 5), budgets: top(count(recent, (l) => (l.budget && l.budget !== 'open' ? BUDGETS[l.budget] : '')), 5),
      waitingOver24h: waiting.length, highPriorityOpen: scored.length, fromFlightSearch: recent.filter((l) => l.context?.to).length },
    searches: { total: searches.searches, noResults: searches.zero, multiCity: searches.multi, oneWay: searches.oneway, topRoutes: top(searches.routes, 5), topMonths: top(searches.months, 4), partySizes: top(searches.party, 4) }
  };
}
export function digestRules(f) {
  const bullets = [], actions = [];
  if (f.leads.waitingOver24h) { bullets.push({ kind: 'risk', text: `${f.leads.waitingOver24h} פניות חדשות מחכות יותר מיממה.` }); actions.push(`לחזור היום ל־${f.leads.waitingOver24h} הפניות שמחכות יותר מיממה, מהעדיפות הגבוהה.`); }
  if (f.leads.highPriorityOpen) bullets.push({ kind: 'opportunity', text: `${f.leads.highPriorityOpen} פניות פתוחות בעדיפות גבוהה.` });
  if (f.leads.total) bullets.push({ kind: 'trend', text: `${f.leads.total} פניות ב־${f.periodDays} הימים האחרונים${f.leads.topDestinations[0] ? `; היעד המבוקש: ${f.leads.topDestinations[0][0]} (${f.leads.topDestinations[0][1]})` : ''}.` });
  if (f.searches.total) bullets.push({ kind: 'trend', text: `${f.searches.total} חיפושי טיסות${f.searches.topRoutes[0] ? `; המסלול המוביל ${f.searches.topRoutes[0][0]} (${f.searches.topRoutes[0][1]})` : ''}.` });
  if (f.searches.noResults) { bullets.push({ kind: 'risk', text: `${f.searches.noResults} חיפושים בלי תוצאות.` }); actions.push('לבדוק מול הספק את המסלולים שחזרו בלי תוצאות.'); }
  if (f.searches.topRoutes[0]) actions.push(`לכתוב מדריך או לקדם את ${f.searches.topRoutes[0][0].split('-')[1]} — המסלול המבוקש ביותר.`);
  if (!actions.length) actions.push('אין עדיין מספיק נתונים. לשתף את האתר ולחזור לכאן מחר.');
  return { headline: f.leads.waitingOver24h ? 'יש פניות שמחכות — כדאי להתחיל מהן.' : f.leads.total ? 'הפניות מטופלות בזמן.' : 'עוד אין פניות בתקופה הזו.', bullets: bullets.slice(0, 5), actions: actions.slice(0, 3), source: 'rules' };
}
export async function digest(leads, searches, { days = 7, now = new Date(), useAi = false, store = null, gw = gateway } = {}) {
  const facts = digestFacts(leads, searches, { days, now }), base = digestRules(facts);
  if (!useAi) return { facts, ...base };
  const validate = (v) => (numbersGrounded([v.headline, ...v.bullets.map((b) => b.text), ...v.actions].join(' '), [JSON.stringify(facts)]) ? { headline: stripLinks(v.headline), bullets: v.bullets.map((b) => ({ kind: b.kind, text: stripLinks(b.text) })), actions: v.actions.map(stripLinks) } : null);
  const result = await gw.run('insights', { data: facts }, { cache: store, validate });
  return result ? { facts, ...result.value, source: 'ai', cached: result.cached } : { facts, ...base };
}
