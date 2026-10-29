// Live smoke test of every configured LLM provider: one extraction and one tie-break, real calls, no cache.
//   node scripts/check-providers.mjs        (reads gerbi/.env; prints latency, tokens and whether the JSON is usable)
import { readFileSync, existsSync } from 'node:fs';
const env = new URL('../.env', import.meta.url);
if (existsSync(env)) for (const line of readFileSync(env, 'utf8').split('\n')) { const m = /^([A-Z_]+)=(.*)$/.exec(line.trim()); if (m && m[2] && !process.env[m[1]]) process.env[m[1]] = m[2]; }
const { probeProvider, partnerUnderstand } = await import('../backend/llm-partner.mjs');
const understandInput = { text: 'רוצים מקום עם הרבה טבע, מפלים ושווקים מקומיים, לא תיירותי מדי, אנחנו זוג', known: { adults: 2, children: 0, nights: 0, month: '', want: [] } };
const tieInput = { brief: { adults: 2, children: 2 }, offers: [{ i: 0, price: 640, currency: 'USD', minutes: 540, stops: 1, longestWait: 180, departs: ['06:10', '05:40'], bag: 'unknown' }, { i: 1, price: 655, currency: 'USD', minutes: 520, stops: 1, longestWait: 95, departs: ['11:20', '16:30'], bag: 'included' }] };
let any = false;
for (const name of ['openrouter', 'deepseek', 'anthropic']) {
  const u = await probeProvider(name, 'understand', understandInput);
  if (!u.configured) { console.log(`${name}: no key`); continue; }
  any = true;
  const t = await probeProvider(name, 'tiebreak', tieInput);
  const show = r => r.error ? `ERROR ${r.error}` : `${r.ms} ms · ${r.tokens} tokens · ${JSON.stringify(r.value).slice(0, 160)}`;
  console.log(`${name} (${u.model})\n  understand: ${show(u)}\n  tiebreak:   ${show(t)}`);
}
if (any) { const merged = await partnerUnderstand(null, understandInput.text, { want: [], adults: 2, children: 0 }); console.log('validated partner result:', JSON.stringify(merged)); }
else console.log('No provider keys found. Add OPENROUTER_API_KEY and/or DEEPSEEK_API_KEY to gerbi/.env.');
