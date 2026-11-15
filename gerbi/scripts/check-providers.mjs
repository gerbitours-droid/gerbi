// Live smoke test of every configured LLM provider through the AI gateway (spec 22 P8). Real calls, no cache.
//   node scripts/check-providers.mjs          understand + tiebreak per provider (cheap)
//   node scripts/check-providers.mjs --all    every task (support answer, tailor form, flight comparison, lead brief, blog draft, digest)
// Prints latency, tokens, schema errors and whether the grounded feature accepted the answer. Never prints keys.
import { readFileSync, existsSync } from 'node:fs';
const env = new URL('../.env', import.meta.url);
if (existsSync(env)) for (const line of readFileSync(env, 'utf8').split('\n')) { const m = /^([A-Z_]+)=(.*)$/.exec(line.trim()); if (m && m[2] && !process.env[m[1]]) process.env[m[1]] = m[2]; }
const { gateway, supportAnswer, tailorFill, flightExplain, leadBrief, blogDraft, digest } = await import('../backend/ai-features.mjs');
const { partnerUnderstand } = await import('../backend/llm-partner.mjs');
const { INTENTS } = await import('../backend/support-content.mjs');
const all = process.argv.includes('--all');

const samples = {
  understand: { customer_text: 'רוצים מקום עם הרבה טבע, מפלים ושווקים מקומיים, לא תיירותי מדי, אנחנו זוג', known: { adults: 2, children: 0, nights: 0, month: '', want: [] }, today: new Date().toISOString().slice(0, 10) },
  tiebreak: { brief: { adults: 2, children: 2 }, offers: [{ i: 0, price: 640, currency: 'USD', minutes: 540, stops: 1, longestWait: 180, departs: ['06:10', '05:40'], bag: 'unknown' }, { i: 1, price: 655, currency: 'USD', minutes: 520, stops: 1, longestWait: 95, departs: ['11:20', '16:30'], bag: 'included' }] }
};
const show = (r) => (r.error ? `ERROR ${r.error}` : `${r.ms} ms · ${r.tokens} tokens · schema ${r.schemaErrors?.length ? 'ERR ' + r.schemaErrors.slice(0, 2).join('; ') : 'OK'} · ${JSON.stringify(r.value).slice(0, 140)}`);
const providers = ['anthropic', 'openrouter', 'deepseek'];
let any = false;
for (const name of providers) {
  const u = await gateway.probe(name, 'understand', samples.understand);
  if (!u.configured) { console.log(`${name}: no key`); continue; }
  any = true;
  console.log(`${name}\n  understand: ${show(u)}\n  tiebreak:   ${show(await gateway.probe(name, 'tiebreak', samples.tiebreak))}`);
}
if (!any) { console.log('No provider keys found. Add ANTHROPIC_API_KEY (recommended), OPENROUTER_API_KEY or DEEPSEEK_API_KEY to gerbi/.env.'); process.exit(0); }
console.log(`\nChain: ${gateway.providerOrder().join(' → ')}`);
console.log('validated planner result:', JSON.stringify(await partnerUnderstand(null, samples.understand.customer_text, { want: [], adults: 2, children: 0 })));
if (all) {
  const timed = async (label, fn) => { const t = Date.now(); try { const v = await fn(); console.log(`\n${label} (${Date.now() - t} ms):`, JSON.stringify(v).slice(0, 600)); } catch (e) { console.log(`\n${label}: ERROR ${e.message}`); } };
  const sources = Object.entries(INTENTS).filter(([id]) => !['greeting', 'thanks', 'menu'].includes(id)).map(([id, i]) => ({ id, title: i.title, text: i.answer }));
  await timed('support_answer', () => supportAnswer('אפשר לקחת עגלת תינוק למטוס, ואיך משלמים אצלכם?', sources));
  await timed('tailor_fill', () => tailorFill('ירח דבש ביפן באפריל, 12 לילות, תקציב 40 אלף, אוכל ויין ומלון יוקרתי'));
  await timed('flight_explain', () => flightExplain([{ label: 'A', price: '₪ 2,431', duration: '9 ש׳ 10 ד׳', stops: 1, longestWait: '3 ש׳', departs: ['05:40', '22:10'], arrives: ['14:50', '06:20'], bag: 'מזוודה בתשלום', carrier: 'Aegean' },
    { label: 'B', price: '₪ 2,690', duration: '4 ש׳ 20 ד׳', stops: 0, longestWait: '', departs: ['11:20', '16:30'], arrives: ['14:10', '21:05'], bag: 'מזוודה כלולה', carrier: 'El Al' }], { adults: 2, children: 2, route: 'תל אביב ← אתונה', prefs: [] }));
  const lead = { id: 'probe', type: 'tailor', status: 'new', createdAt: new Date(Date.now() - 30 * 3600000).toISOString(), name: 'דנה כהן', phone: '0501234567', email: 'dana@example.com', channel: 'whatsapp', destinations: 'איטליה', start: '', end: '', flexibility: 'month', adults: 2, children: 2, budget: '20to40', styles: ['family', 'culinary'], notes: 'רוצים חופשה משפחתית באוגוסט, הילדים בני 6 ו־9, חשוב לנו מלון עם בריכה' };
  await timed('lead_brief', () => leadBrief(lead));
  await timed('insights', () => digest([lead], { searches: 12, zero: 2, multi: 1, oneway: 3, routes: { 'TLV-FCO': 5, 'TLV-ATH': 4 }, months: { '2026-12': 6 }, party: { 2: 7, 4: 5 } }, { useAi: true }));
  await timed('blog_draft', () => blogDraft({ topic: 'סופ״ש ברומא עם ילדים', keywords: ['רומא עם ילדים'], audience: 'families', length: 'short' }));
  await gateway.flush();
  const s = await gateway.status();
  console.log(`\nToday: $${s.budget.usdToday} · ${s.budget.tokensToday} tokens`);
  for (const t of s.tasks) if (t.usage.calls) console.log(`  ${t.id.padEnd(15)} calls ${t.usage.calls} ok ${t.usage.ok} rejected ${t.usage.rejected} errors ${t.usage.errors} · avg ${Math.round(t.usage.ms / t.usage.calls)} ms · $${t.usage.usd.toFixed(5)}`);
}
