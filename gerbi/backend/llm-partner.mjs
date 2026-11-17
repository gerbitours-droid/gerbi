// The LLM as a bounded decision partner (spec §4): consulted only when the deterministic layers are not enough,
// answers in a strict JSON schema, cached for identical inputs. Since spec 22 every call goes through the AI gateway
// (backend/ai-gateway.mjs): provider chain, model per task tier, budgets, circuit breaker, kill switches, usage log.
// Without a provider key every function returns null (or a cached answer) and the product runs fully deterministic.
import { places } from '../dist/places.mjs';
import { cleanRoute } from '../dist/multi-city-core.mjs';
import { gateway } from './ai-features.mjs';

const codes = places.filter(place => !place.home).map(place => place.code);

// Personal contact details never leave the server (the gateway also redacts every string it sends).
export const scrub = text => String(text || '').replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, '[מייל]').replace(/\+?\d[\d\s-]{7,}\d/g, '[טלפון]').slice(0, 600);

export const activeModel = () => gateway.activeModel('smart');
export const partnerStatus = () => {
  const providers = gateway.providerOrder();
  return { configured: providers.length > 0, model: activeModel(), providers, tokensLeftToday: Infinity, circuitOpen: false };
};
export const probeProvider = (name, task, input) => gateway.probe(name, task, input);

// Second decoder: fills only what the rules left empty; everything is re-validated like user input.
export async function partnerUnderstand(store, text, brief, { today = new Date().toISOString().slice(0, 10), lang = 'he' } = {}) {
  const known = { adults: brief.adults, children: brief.children, nights: brief.nights || 0, month: brief.month || '', want: brief.want || [] };
  // lang 'en' (spec 21): the question and interests come back in English; codes/months stay as the schema says.
  const result = await gateway.run('understand', { customer_text: scrub(text), known, today }, { cache: store, lang: lang === 'en' ? 'en' : 'he' });
  if (!result) return null;
  const v = result.value, valid = list => [...new Set((Array.isArray(list) ? list : []).filter(code => codes.includes(code)))].slice(0, 5);
  const int = (n, min, max) => Number.isInteger(n) && n >= min && n <= max ? n : null;
  const patch = {};
  if (!(brief.want || []).length && valid(v.want).length) patch.want = valid(v.want);
  if (valid(v.exclude).length) patch.exclude = [...new Set([...(brief.exclude || []), ...valid(v.exclude)])];
  if (!brief.nights && int(v.nights, 1, 30)) patch.nights = v.nights;
  if (!brief.month && v.month) patch.month = v.month;
  if (brief.adultsAssumed && int(v.adults, 1, 9)) patch.adults = v.adults;
  if (brief.children === 0 && int(v.children, 1, 8)) patch.children = v.children;
  for (const key of ['beach', 'city', 'relaxation', 'family', 'couple']) if (brief[key] === undefined && v[key] && v[key] !== 'unknown') patch[key] = v[key] === 'yes';
  const suggest = valid(v.suggest).filter(code => !(patch.want || brief.want || []).includes(code) && !(patch.exclude || brief.exclude || []).includes(code)).slice(0, 3);
  const interests = (Array.isArray(v.interests) ? v.interests : []).filter(x => typeof x === 'string').map(x => x.slice(0, 24)).slice(0, 5);
  // A multi-city route only when every leg is valid, dates do not go back and the first flight is in the future.
  const legs = cleanRoute(v.legs);
  return { patch, suggest, interests, question: typeof v.question === 'string' ? v.question.slice(0, 140) : '', ...(legs && legs[0].date >= today ? { legs } : {}), cached: result.cached };
}

// The trip builder's reader (17.11.2026): the request's meaning as catalog ids + tags (task trip_tags). The schema already
// limits every id/tag to the catalog; mergeModel (dist/trip-builder.mjs) re-validates ranges. null = rules only.
export async function partnerTripTags(store, text, { today = new Date().toISOString().slice(0, 10), lang = 'he' } = {}) {
  if (!gateway.providerOrder().length) return null;
  const result = await gateway.run('trip_tags', { customer_text: scrub(text), today }, { cache: store, lang: lang === 'en' ? 'en' : 'he' });
  return result ? { ...result.value, cached: result.cached } : null;
}

// Near-tie only: returns the chosen candidate's key; the caller adds a bounded bonus (γ) to it.
export async function partnerTieBreak(store, brief, candidates, { lang = 'he' } = {}) {
  const rows = candidates.slice(0, 5);
  if (rows.length < 2) return null;
  const compactBrief = Object.fromEntries(Object.entries(brief).filter(([key, value]) => ['adults', 'children', 'cheaper', 'stops', 'out', 'back', 'checkedBag', 'carrier', 'tripType'].includes(key) && value !== undefined && value !== ''));
  const table = rows.map(({ key, ...row }, i) => ({ i, ...row }));
  const result = await gateway.run('tiebreak', { brief: compactBrief, offers: table }, { cache: store, lang: lang === 'en' ? 'en' : 'he' });
  if (!result || !Number.isInteger(result.value.pick) || !rows[result.value.pick]) return null;
  return { pick: rows[result.value.pick].key, reason: String(result.value.reason || '').slice(0, 80), cached: result.cached };
}

// Customer-service fallback (spec 16 §8): only routes a message the rules did not understand to one of the known
// topics. It never writes text for the customer, so the answer always comes from the owner's content.
export async function partnerClassify(store, text, topics) {
  if (!gateway.providerOrder().length || !topics.length) return null;
  const result = await gateway.run('support', { customer_text: scrub(text), topics }, { cache: store });
  const topic = result?.value?.topic;
  return typeof topic === 'string' && topics.some((t) => t.id === topic) ? { topic, cached: result.cached } : null;
}
