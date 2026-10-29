// The LLM as a bounded decision partner (spec §4): consulted only when the deterministic layers are not enough,
// answers in a strict JSON schema, cached for identical inputs, capped by a daily token budget and a circuit breaker.
// Without ANTHROPIC_API_KEY every function returns null and the product runs fully deterministic.
import crypto from 'node:crypto';
import Anthropic from '@anthropic-ai/sdk';
import { places } from '../dist/places.mjs';

// Providers in order of preference; the first one with a key answers, the next one covers its failures.
//   openrouter (default Qwen3.8 Max) · deepseek (direct API) · anthropic (Claude). GERBI_LLM_PROVIDER puts one first.
const PROVIDERS = {
  openrouter: { key: 'OPENROUTER_API_KEY', url: 'https://openrouter.ai/api/v1/chat/completions', model: () => process.env.GERBI_LLM_MODEL || 'qwen/qwen3.8-max-0902', schema: 'json_schema' },
  deepseek: { key: 'DEEPSEEK_API_KEY', url: 'https://api.deepseek.com/chat/completions', model: () => process.env.GERBI_DEEPSEEK_MODEL || 'deepseek-chat', schema: 'json_object' },
  anthropic: { key: 'ANTHROPIC_API_KEY', model: () => process.env.GERBI_ANTHROPIC_MODEL || 'claude-opus-5-5' }
};
const providerOrder = () => { const first = process.env.GERBI_LLM_PROVIDER; return [first, 'openrouter', 'deepseek', 'anthropic'].filter((name, i, all) => PROVIDERS[name] && all.indexOf(name) === i && process.env[PROVIDERS[name].key]); };
export const activeModel = () => { const name = providerOrder()[0]; return name ? `${name}:${PROVIDERS[name].model()}` : 'none'; };
// Server-side refusal fallback exists for these Claude models only.
const FALLBACK_MODELS = new Set(['claude-opus-5-5', 'claude-opus-5', 'claude-fable-5-1', 'claude-sonnet-5-5']);
const DAILY_TOKENS = Number(process.env.GERBI_LLM_DAILY_TOKENS || 200000);
const CACHE_TTL = { understand: 30 * 86400, tiebreak: 86400 };

const codes = places.filter(place => !place.home).map(place => place.code);
const TRI = { type: 'string', enum: ['yes', 'no', 'unknown'] };

// Stable system prompts (no dates, no ids) so the prefix is cacheable.
const SYSTEMS = {
  understand: `You help Gerbi, a Hebrew travel planner, understand a traveler's free-text request that its rule engine could not fully parse.
Return only what the text states or clearly implies. Never invent dates, prices or traveler counts: use 0 or "" when not stated.
Destination codes must come from this list: ${places.filter(p => !p.home).map(p => `${p.code}=${p.names[0]}`).join(', ')}.
"want" holds only destinations the traveler named. "suggest" holds up to 3 codes from the list that fit wishes the traveler described without naming a place (nature, wine, markets...), best first.
"interests" are short Hebrew words for wishes the list of styles cannot express. "question" is one short Hebrew question that would most help, or "".`,
  tiebreak: `You help Gerbi choose between flight offers whose computed scores are nearly tied. You get the traveler's brief and a compact table.
Pick the offer that best fits what this traveler said; when nothing in the brief separates them, prefer the cheaper one.
"reason" is one short Hebrew sentence (max 80 characters) naming the deciding difference.`
};
const SCHEMAS = {
  understand: { type: 'object', additionalProperties: false,
    required: ['want', 'exclude', 'suggest', 'adults', 'children', 'nights', 'month', 'beach', 'city', 'relaxation', 'family', 'couple', 'interests', 'question'],
    properties: { want: { type: 'array', items: { type: 'string', enum: codes } }, exclude: { type: 'array', items: { type: 'string', enum: codes } },
      suggest: { type: 'array', items: { type: 'string', enum: codes } }, adults: { type: 'integer' }, children: { type: 'integer' }, nights: { type: 'integer' },
      month: { type: 'string', enum: ['', 'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'] },
      beach: TRI, city: TRI, relaxation: TRI, family: TRI, couple: TRI, interests: { type: 'array', items: { type: 'string' } }, question: { type: 'string' } } },
  tiebreak: { type: 'object', additionalProperties: false, required: ['pick', 'reason'], properties: { pick: { type: 'integer' }, reason: { type: 'string' } } }
};

// Personal contact details never leave the server.
export const scrub = text => String(text || '').replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, '[מייל]').replace(/\+?\d[\d\s-]{7,}\d/g, '[טלפון]').slice(0, 600);

const state = { day: '', used: 0, failures: 0, openUntil: 0, calls: 0, cacheHits: 0, errors: 0, lastProvider: null };
function budgetLeft() {
  const today = new Date().toISOString().slice(0, 10);
  if (state.day !== today) { state.day = today; state.used = 0; }
  return DAILY_TOKENS - state.used;
}
export const partnerStatus = () => ({ configured: providerOrder().length > 0, model: activeModel(), providers: providerOrder(), tokensLeftToday: Math.max(0, budgetLeft()), tokensUsedToday: state.used, circuitOpen: Date.now() < state.openUntil, calls: state.calls, cacheHits: state.cacheHits, errors: state.errors, lastProvider: state.lastProvider });

const parseJson = text => JSON.parse(String(text || '').trim().replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, ''));

// OpenAI-compatible chat completions (OpenRouter, DeepSeek). OpenRouter enforces the JSON schema; DeepSeek gets
// JSON mode with the schema spelled out in the prompt, and the answer is validated afterwards either way.
async function askCompatible(provider, task, input, timeoutMs) {
  const system = provider.schema === 'json_schema' ? SYSTEMS[task] : `${SYSTEMS[task]}\nAnswer with one json object only, matching this JSON schema: ${JSON.stringify(SCHEMAS[task])}`;
  const response = await fetch(provider.url, {
    method: 'POST', signal: AbortSignal.timeout(timeoutMs),
    headers: { Authorization: `Bearer ${process.env[provider.key]}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://gerbi.travel', 'X-Title': 'Gerbi' },
    body: JSON.stringify({ model: provider.model(), max_tokens: 900, temperature: 0,
      messages: [{ role: 'system', content: system }, { role: 'user', content: JSON.stringify(input) }],
      response_format: provider.schema === 'json_schema' ? { type: 'json_schema', json_schema: { name: task, strict: true, schema: SCHEMAS[task] } } : { type: 'json_object' },
      ...(provider === PROVIDERS.openrouter ? { reasoning: { effort: 'low', exclude: true } } : {}) })
  });
  if (!response.ok) throw Object.assign(new Error(`http_${response.status}`), { status: response.status });
  const data = await response.json();
  state.used += (data.usage?.prompt_tokens || 0) + (data.usage?.completion_tokens || 0);
  const choice = data.choices?.[0];
  if (!choice || choice.finish_reason === 'length') return null;
  return parseJson(choice.message?.content);
}

let anthropicClient = null;
async function askAnthropic(provider, task, input, timeoutMs) {
  const model = provider.model();
  anthropicClient ||= new Anthropic({ maxRetries: 0 });
  const response = await anthropicClient.beta.messages.create({
    model, max_tokens: 1500,
    ...(FALLBACK_MODELS.has(model) ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' } : {}),
    system: [{ type: 'text', text: SYSTEMS[task], cache_control: { type: 'ephemeral' } }],
    output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMAS[task] } },
    messages: [{ role: 'user', content: JSON.stringify(input) }]
  }, { timeout: timeoutMs });
  state.used += (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);
  if (response.stop_reason === 'refusal' || response.stop_reason === 'max_tokens') return null;
  return parseJson(response.content.find(block => block.type === 'text')?.text);
}

export async function probeProvider(name, task, input, timeoutMs = 20000) {
  const provider = PROVIDERS[name];
  if (!provider || !process.env[provider.key]) return { name, configured: false };
  const started = Date.now(), before = state.used;
  try { const value = await (name === 'anthropic' ? askAnthropic : askCompatible)(provider, task, input, timeoutMs); return { name, configured: true, model: provider.model(), ms: Date.now() - started, tokens: state.used - before, value }; }
  catch (error) { return { name, configured: true, model: provider.model(), ms: Date.now() - started, error: `${error.status || ''} ${error.message}`.trim() }; }
}

async function ask(task, input, timeoutMs) {
  if (Date.now() < state.openUntil || budgetLeft() < 2000) return null;
  for (const name of providerOrder()) {
    const provider = PROVIDERS[name];
    try {
      state.calls++;
      const value = await (name === 'anthropic' ? askAnthropic : askCompatible)(provider, task, input, timeoutMs);
      if (value) { state.failures = 0; state.lastProvider = name; return value; }
    } catch (error) {
      state.errors++;
      if (process.env.GERBI_DEBUG) console.warn(`llm partner ${name}:`, error?.status || error?.name, error?.message);
    }
  }
  // Every provider failed: the deterministic answer stands. Three rounds in a row pause the partner for 10 minutes.
  if (providerOrder().length && ++state.failures >= 3) { state.openUntil = Date.now() + 10 * 60000; state.failures = 0; }
  return null;
}

async function cached(store, task, input, timeoutMs) {
  const key = crypto.createHash('sha256').update(`${activeModel()}|${task}|${JSON.stringify(input)}`).digest('hex').slice(0, 32);
  const hit = store && await store.get(key).catch(() => null);
  if (hit) { state.cacheHits++; return { value: hit, cached: true }; }
  const value = await ask(task, input, timeoutMs);
  if (value && store) await store.set(key, value, CACHE_TTL[task]).catch(() => {});
  return value ? { value, cached: false } : null;
}

// Second decoder: fills only what the rules left empty; everything is re-validated like user input.
export async function partnerUnderstand(store, text, brief) {
  const known = { adults: brief.adults, children: brief.children, nights: brief.nights || 0, month: brief.month || '', want: brief.want || [] };
  const result = await cached(store, 'understand', { text: scrub(text), known }, 8000);
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
  for (const key of ['beach', 'city', 'relaxation', 'family', 'couple']) if (brief[key] === undefined && v[key] !== 'unknown') patch[key] = v[key] === 'yes';
  const suggest = valid(v.suggest).filter(code => !(patch.want || brief.want || []).includes(code) && !(patch.exclude || brief.exclude || []).includes(code)).slice(0, 3);
  const interests = (Array.isArray(v.interests) ? v.interests : []).filter(x => typeof x === 'string').map(x => x.slice(0, 24)).slice(0, 5);
  return { patch, suggest, interests, question: typeof v.question === 'string' ? v.question.slice(0, 140) : '', cached: result.cached };
}

// Near-tie only: returns the chosen candidate's key; the caller adds a bounded bonus (γ) to it.
export async function partnerTieBreak(store, brief, candidates) {
  const rows = candidates.slice(0, 5);
  if (rows.length < 2) return null;
  const compactBrief = Object.fromEntries(Object.entries(brief).filter(([key, value]) => ['adults', 'children', 'cheaper', 'stops', 'out', 'back', 'checkedBag', 'carrier', 'tripType'].includes(key) && value !== undefined && value !== ''));
  const table = rows.map(({ key, ...row }, i) => ({ i, ...row }));
  const result = await cached(store, 'tiebreak', { brief: compactBrief, offers: table }, 6000);
  if (!result || !Number.isInteger(result.value.pick) || !rows[result.value.pick]) return null;
  return { pick: rows[result.value.pick].key, reason: String(result.value.reason || '').slice(0, 80), cached: result.cached };
}

