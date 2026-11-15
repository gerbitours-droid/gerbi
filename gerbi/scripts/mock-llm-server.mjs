// Local fake LLM provider (OpenAI-compatible chat completions) for development, tests and screenshots (spec 22 P3).
//   node scripts/mock-llm-server.mjs [port]      → then run the site with GERBI_AI_MOCK_URL=http://127.0.0.1:<port>/v1/chat/completions
// Answers are deterministic, schema-valid and built only from the request, so grounding checks pass. Every request
// body is kept in `requests` (tests assert that no contact details reach the provider). Never used in production.
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const words = (s) => String(s || '').replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter((w) => w.length >= 3);
const firstSentences = (text, n = 2) => String(text).split(/(?<=[.!?])\s+/).slice(0, n).join(' ');

// English site (spec 21): the gateway appends an English-output note to the system prompt; customer tasks answer in English.
const englishAnswer = (task, input) => {
  switch (task) {
    case 'understand': return { want: [], exclude: [], suggest: ['TBS', 'BUS'], adults: 0, children: 0, nights: 0, month: '', beach: 'unknown', city: 'unknown', relaxation: 'unknown', family: 'unknown', couple: 'unknown', interests: ['nature', 'waterfalls'], question: 'Which month would you like to fly?', legs: [] };
    case 'tiebreak': return { pick: 1, reason: 'Returns at a more convenient hour' };
    case 'tailor_fill': {
      const t = String(input.customer_text);
      return { destinations: /japan/i.test(t) ? 'Japan' : '', start: '', end: '', flexibility: /april|may|june|august/i.test(t) ? 'month' : 'open', adults: /honeymoon|couple/i.test(t) ? 2 : 0, children: 0,
        budget: 'open', styles: [/food|wine/i.test(t) && 'culinary', /honeymoon/i.test(t) && 'romantic', /luxury/i.test(t) && 'luxury'].filter(Boolean), notes: /honeymoon/i.test(t) ? 'Celebrating a honeymoon — a romantic hotel' : '' };
    }
    case 'flight_explain': {
      const [a, b] = input.offers;
      return { summary: `Flight A costs ${a.price} and takes ${a.duration || 'an unknown time'}; flight B costs ${b.price}${b.duration ? ` and takes ${b.duration}` : ''}.`, pick: 'A',
        tradeoffs: [`A: ${a.price}${a.bag ? ' · ' + a.bag : ''}`, `B: ${b.price}${b.bag ? ' · ' + b.bag : ''}`] };
    }
    default: return null;
  }
};

export function mockAnswer(task, input, system = '') {
  const english = /English version of the site/.test(system) && englishAnswer(task, input);
  if (english) return english;
  switch (task) {
    case 'understand': return { want: [], exclude: [], suggest: ['TBS', 'BUS'], adults: 0, children: 0, nights: 0, month: '', beach: 'unknown', city: 'unknown', relaxation: 'unknown', family: 'unknown', couple: 'unknown', interests: ['טבע', 'מפלים'], question: 'באיזה חודש תרצו לטוס?', legs: [] };
    case 'tiebreak': return { pick: 1, reason: 'חוזרת בשעה נוחה יותר' };
    case 'support': return { topic: input.topics?.[0]?.id || 'none' };
    case 'support_answer': {
      const ask = new Set(words(input.customer_text).map((w) => w.replace(/^[והבלמש]/, '')));
      const scored = (input.sources || []).map((s) => ({ s, n: words(`${s.title} ${s.text}`).filter((w) => ask.has(w) || ask.has(w.replace(/^[והבלמש]/, ''))).length })).sort((a, b) => b.n - a.n);
      const best = scored[0];
      if (!best || best.n === 0) return { answerable: false, answer: '', topics: [], escalate: /נציג|תלונה/.test(input.customer_text) };
      const two = scored[1]?.n ? [best.s, scored[1].s] : [best.s];
      return { answerable: true, answer: two.map((s) => firstSentences(s.text, 1)).join(' '), topics: two.map((s) => s.id), escalate: false };
    }
    case 'tailor_fill': {
      const t = String(input.customer_text);
      return { destinations: /יפן/.test(t) ? 'יפן' : '', start: '', end: '', flexibility: /אפריל|מאי|יוני|אוגוסט/.test(t) ? 'month' : 'open', adults: /ירח דבש|זוג/.test(t) ? 2 : 0, children: 0,
        budget: 'open', styles: [/אוכל|יין/.test(t) && 'culinary', /ירח דבש/.test(t) && 'romantic', /יוקרה|פינוק/.test(t) && 'luxury'].filter(Boolean), notes: /ירח דבש/.test(t) ? 'חוגגים ירח דבש — מלון רומנטי' : '' };
    }
    case 'flight_explain': {
      const [a, b] = input.offers;
      return { summary: `הטיסה A עולה ${a.price} ונמשכת ${a.duration || 'זמן לא ידוע'}; הטיסה B עולה ${b.price}${b.duration ? ` ונמשכת ${b.duration}` : ''}.${a.stops !== b.stops ? ` ב־A ${a.stops ? 'יש החלפה' : 'טיסה ישירה'}, וב־B ${b.stops ? 'יש החלפה' : 'טיסה ישירה'}.` : ''}`,
        pick: 'A', tradeoffs: [`A: ${a.price}${a.bag ? ' · ' + a.bag : ''}`, `B: ${b.price}${b.bag ? ' · ' + b.bag : ''}`] };
    }
    case 'lead_brief': {
      const l = input.lead || {};
      return { summary: `${l.type === 'tailor' ? 'טיול בהתאמה' : 'פנייה'} ל${l.destinations || l.searchContext?.to || 'יעד לא ידוע'}${l.adults ? `, ${l.adults} מבוגרים` : ''}${l.budget ? `, ${l.budget}` : ''}.`, intent: l.start ? 'ready_to_book' : 'planning',
        missing: input.missing || [], nextStep: 'להתקשר היום ולשאול על תאריכים ותקציב', whatsapp: `היי {שם}, כאן ג׳רבי טורס.\nראינו שאתם מתכננים טיול ל${l.destinations || 'חו״ל'} — איזה כיף!\n${(input.missing || [])[0] || 'נשמח לשמוע עוד פרטים.'}\nמתי נוח לדבר?` };
    }
    case 'blog_draft': {
      const topic = input.topic || 'מדריך';
      const sections = ['למי זה מתאים', 'מתי כדאי לנסוע', 'מה לעשות', 'טיפים מעשיים'];
      return { title: topic, seoTitle: `${topic} — מדריך`.slice(0, 60), seoDescription: `מדריך מעשי: ${topic}. מתי לנסוע, מה לעשות ואיך לתכנן בלי לחץ, עם טיפים למטיילים ישראלים.`.slice(0, 155), excerpt: `כל מה שצריך לדעת לפני שיוצאים: ${topic}.`, slug: 'mock-guide', category: 'מדריכים', tags: (input.keywords || []).slice(0, 3),
        outline: sections, body: sections.map((h) => `## ${h}\n\nפסקה לדוגמה על ${topic}: מה חשוב לדעת, למי זה מתאים ואיך מתכננים נכון. [לבדוק: מחירי כניסה ושעות פתיחה עדכניים]\n\n- נקודה ראשונה\n- נקודה שנייה`).join('\n\n') + '\n\nרוצים שנבנה לכם את הטיול? ג׳רבי טורס כאן בשבילכם.', factsToVerify: ['מחירי כניסה ושעות פתיחה'] };
    }
    case 'insights': {
      const d = input.data || {};
      return { headline: `${d.leads?.total ?? 0} פניות בתקופה, ${d.leads?.waitingOver24h ?? 0} מחכות מעל יממה.`, bullets: [{ kind: 'trend', text: `${d.searches?.total ?? 0} חיפושי טיסות בתקופה.` }, { kind: 'risk', text: `${d.searches?.noResults ?? 0} חיפושים בלי תוצאות.` }],
        actions: ['לחזור קודם לפניות בעדיפות גבוהה', 'לכתוב מדריך ליעד המבוקש ביותר', 'לבדוק מול הספק מסלולים בלי תוצאות'] };
    }
    default: return {};
  }
}

export function startMockLlm({ port = 0, latencyMs = 0, broken = new Set() } = {}) {
  const requests = [];
  const server = http.createServer(async (req, res) => {
    let raw = ''; for await (const chunk of req) raw += chunk;
    let body = {}; try { body = JSON.parse(raw); } catch { /* empty */ }
    requests.push({ url: req.url, auth: req.headers.authorization || '', body });
    const task = body.response_format?.json_schema?.name || 'unknown';
    let input = {}; try { input = JSON.parse(body.messages?.find((m) => m.role === 'user')?.content || '{}'); } catch { /* not JSON */ }
    if (latencyMs) await new Promise((r) => setTimeout(r, latencyMs));
    if (broken.has(task)) { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: '{"not":"valid"}' } }], usage: { prompt_tokens: 10, completion_tokens: 3 } })); }
    const content = JSON.stringify(mockAnswer(task, input, body.messages?.find((m) => m.role === 'system')?.content || ''));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content } }], usage: { prompt_tokens: Math.ceil(raw.length / 4), completion_tokens: Math.ceil(content.length / 4) } }));
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve({ server, requests, url: `http://127.0.0.1:${server.address().port}/v1/chat/completions`, close: () => new Promise((r) => server.close(r)) })));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const mock = await startMockLlm({ port: Number(process.argv[2] || 4199) });
  console.log(`Mock LLM ready: GERBI_AI_MOCK_URL=${mock.url}`);
}
