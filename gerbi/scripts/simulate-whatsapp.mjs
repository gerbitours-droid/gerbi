// WhatsApp Cloud API simulator (spec 16 §7): proves the webhook flow end to end without Meta.
// Starts a fake Graph API that records what the bot "sends", starts the real server.mjs with dummy WhatsApp
// credentials pointed at it, then delivers signed webhooks exactly like Meta does and prints the conversation.
// Usage: node scripts/simulate-whatsapp.mjs        (writes to the local data/ files; refuses to run against Upstash)
import http from 'node:http';
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { sign } from '../backend/whatsapp.mjs';

const serverFile = fileURLToPath(new URL('../server.mjs', import.meta.url));
const envFile = new URL('../.env', import.meta.url);
if (process.env.UPSTASH_REDIS_REST_URL || (existsSync(envFile) && /^UPSTASH_REDIS_REST_URL=./m.test(readFileSync(envFile, 'utf8')))) {
  console.error('Upstash is configured: the simulator only runs against local file storage. Unset UPSTASH_* first.'); process.exit(2);
}
const SECRET = 'sim-app-secret', VERIFY = 'sim-verify-token', PHONE_ID = '100000000000001', ADMIN = 'sim-admin-' + process.pid, CUSTOMER = '972500000099';
const outbox = [];
const graph = http.createServer(async (req, res) => {
  let raw = ''; for await (const chunk of req) raw += chunk;
  outbox.push({ path: req.url, auth: req.headers.authorization, payload: JSON.parse(raw || '{}') });
  res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('{"messaging_product":"whatsapp","messages":[{"id":"wamid.sim"}]}');
});
await new Promise((resolve) => graph.listen(0, '127.0.0.1', resolve));
const port = 4300 + Math.floor(Math.random() * 500), base = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, [serverFile], { env: { ...process.env, PORT: String(port), WHATSAPP_VERIFY_TOKEN: VERIFY, WHATSAPP_APP_SECRET: SECRET, WHATSAPP_TOKEN: 'sim-graph-token',
  WHATSAPP_PHONE_NUMBER_ID: PHONE_ID, WHATSAPP_GRAPH_URL: `http://127.0.0.1:${graph.address().port}/v21.0`, LEADS_ADMIN_TOKEN: ADMIN, LEADS_WEBHOOK_URL: 'none' }, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((resolve, reject) => { child.stdout.on('data', (d) => /ready/.test(d) && resolve()); child.on('exit', reject); setTimeout(() => reject(new Error('server did not start')), 8000); });

let failures = 0, seq = Date.now();
const check = (ok, label) => { console.log(`${ok ? '  ✓' : '  ✗'} ${label}`); if (!ok) failures++; };
const describe = (p) => p.type === 'text' ? p.text.body : `${p.interactive.body.text}\n     ${p.interactive.type === 'button' ? p.interactive.action.buttons.map((b) => `[${b.reply.title}]`).join(' ') : p.interactive.action.sections[0].rows.map((r) => `[${r.title}]`).join(' ')}`;
async function deliver(message, { secret = SECRET, label } = {}) {
  const payload = { object: 'whatsapp_business_account', entry: [{ id: 'WABA_SIM', changes: [{ field: 'messages', value: { messaging_product: 'whatsapp', metadata: { display_phone_number: '97230000000', phone_number_id: PHONE_ID },
    contacts: [{ wa_id: CUSTOMER, profile: { name: 'לקוח סימולציה' } }], messages: [{ from: CUSTOMER, id: `wamid.sim.${++seq}`, timestamp: String(Math.floor(Date.now() / 1000)), ...message }] } }] }] };
  const raw = JSON.stringify(payload), before = outbox.length;
  const response = await fetch(`${base}/api/whatsapp/webhook`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Hub-Signature-256': sign(raw, secret) }, body: raw });
  console.log(`\n👤 ${label || message.text?.body || message.interactive?.button_reply?.title || message.interactive?.list_reply?.title || message.type}  (HTTP ${response.status})`);
  const sent = outbox.slice(before);
  for (const out of sent) console.log(`🤖 ${describe(out.payload).replace(/\n/g, '\n   ')}`);
  if (!sent.length) console.log('🤖 (no reply)');
  return { status: response.status, sent };
}

try {
  console.log('WhatsApp simulator →', base);
  let res = await fetch(`${base}/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=${VERIFY}&hub.challenge=CHALLENGE_42`);
  check(res.status === 200 && (await res.text()) === 'CHALLENGE_42', 'verify handshake returns hub.challenge');
  res = await fetch(`${base}/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=x`);
  check(res.status === 403, 'wrong verify token → 403');
  let r = await deliver({ type: 'text', text: { body: 'זה לא אמור לעבור' } }, { secret: 'forged', label: 'webhook with a forged signature' });
  check(r.status === 401 && !r.sent.length, 'forged X-Hub-Signature-256 → 401, nothing sent');
  r = await deliver({ type: 'text', text: { body: 'היי' } });
  check(r.sent.length === 1 && r.sent[0].payload.interactive?.type === 'list', 'greeting → topic list');
  check(r.sent[0].path === `/v21.0/${PHONE_ID}/messages` && r.sent[0].auth === 'Bearer sim-graph-token', 'reply goes to Graph /{phone-number-id}/messages with the bearer token');
  r = await deliver({ type: 'text', text: { body: 'כמה מזוודות מותר לקחת?' } });
  check(/חברת התעופה/.test(JSON.stringify(r.sent)), 'baggage question answered from the FAQ content');
  r = await deliver({ type: 'interactive', interactive: { type: 'list_reply', list_reply: { id: 'documents', title: 'דרכון וויזה' } } });
  check(/דרכון/.test(JSON.stringify(r.sent)), 'list choice (documents) answered');
  r = await deliver({ type: 'text', text: { body: 'אני רוצה לדבר עם נציג' } });
  check(r.sent.some((s) => s.payload.interactive?.action?.buttons?.some((b) => b.reply.id === 'consent_yes')), 'asking for a person → consent buttons (name and phone already known)');
  r = await deliver({ type: 'interactive', interactive: { type: 'button_reply', button_reply: { id: 'consent_yes', title: 'כן, אפשר לחזור אליי' } } });
  const ref = /מספר הפנייה: ([0-9a-f]{8})/.exec(JSON.stringify(r.sent))?.[1];
  check(Boolean(ref), `escalation created, reference ${ref}`);
  r = await deliver({ type: 'text', text: { body: 'עוד פרט לנציג: אנחנו 2 מבוגרים וילד' } });
  check(r.sent.length === 0, 'after hand-off the bot stays silent');
  const inbox = await (await fetch(`${base}/api/support/escalations?status=open`, { headers: { Authorization: `Bearer ${ADMIN}` } })).json();
  const mine = inbox.escalations?.find((e) => e.ref === ref);
  check(mine && mine.channel === 'whatsapp' && mine.handoff && /עוד פרט לנציג/.test(JSON.stringify(mine.transcript)), 'owner inbox shows the escalation, hand-off flag and the later message');
  if (mine) console.log(`\n📥 owner inbox: ${mine.reasonLabel} · ${mine.name} · ${mine.phone} · ${mine.transcript.length} messages in transcript`);
  res = await fetch(`${base}/api/support/escalations/${ref}`, { method: 'POST', headers: { Authorization: `Bearer ${ADMIN}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'handled' }) });
  check(res.status === 200, 'owner marks it handled');
  r = await deliver({ type: 'text', text: { body: 'מה שעות הפעילות?' } });
  check(r.sent.length >= 1 && /שעות הפעילות/.test(JSON.stringify(r.sent)), 'bot is back after handled');
  r = await deliver({ type: 'audio', audio: { id: 'voice-note' } }, { label: '(voice note)' });
  check(/רק הודעות טקסט/.test(JSON.stringify(r.sent)), 'non-text message → polite text-only note');
} catch (error) { console.error(error); failures++; }
finally { child.kill(); graph.close(); }
console.log(failures ? `\n${failures} check(s) failed` : '\nAll WhatsApp checks passed.');
process.exit(failures ? 1 : 0);
