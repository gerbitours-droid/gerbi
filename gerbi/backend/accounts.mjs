// Customer accounts (spec docs/specs/17-customer-area-he.md): email + password sign-up, cookie sessions,
// saved items synced across devices, linked enquiries, export and deletion. Storage is the KV store only.
import { createHash, randomBytes, randomInt, randomUUID, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { validateSignup, validateProfile, passwordProblem, normalizeEmail, cleanSaved, addSearch, marketingText, privacyText } from '../dist/account-core.mjs';
import { tIn, normLang, homePath } from '../dist/i18n.mjs';
import { clientOf } from './volero-guard.mjs';

const scryptAsync = promisify(scrypt);
const SESSION_TTL = 30 * 86400, CODE_TTL = 600, RESET_TTL = 1800, FAIL_TTL = 900, MAX_FAILS = 8, CODE_ATTEMPTS = 5, MAX_LEADS = 50;
const KDF = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const COOKIE = 'gerbi_sid', SECURE_COOKIE = '__Host-gerbi_sid';
const sha = (value) => createHash('sha256').update(String(value)).digest('hex');
const GENERIC_LOGIN = 'המייל או הסיסמה שגויים.';
const TOO_MANY = 'יותר מדי ניסיונות. נסו שוב בעוד כמה דקות.';
const UNAVAILABLE = 'החשבון אינו זמין כרגע. נסו שוב בעוד רגע — השמירות במכשיר לא נפגעו.';
// Lead titles the server fills in itself (the English page shows its own wording for them).
const GENERIC_TITLES = ['טיול בהתאמה אישית', 'פנייה כללית'];

export async function hashPassword(password, salt = randomBytes(16)) {
  const key = await scryptAsync(password.normalize('NFC'), salt, 64, KDF);
  return `scrypt$${KDF.N}$${KDF.r}$${KDF.p}$${salt.toString('base64')}$${key.toString('base64')}`;
}
export async function verifyPassword(password, stored) {
  const [kind, N, r, p, salt, hash] = String(stored || '').split('$');
  if (kind !== 'scrypt' || typeof password !== 'string') return false;
  const expected = Buffer.from(hash, 'base64');
  const key = await scryptAsync(password.normalize('NFC'), Buffer.from(salt, 'base64'), expected.length, { N: Number(N), r: Number(r), p: Number(p), maxmem: KDF.maxmem });
  return key.length === expected.length && timingSafeEqual(key, expected);
}
// Spent on unknown emails so "no such user" and "wrong password" take the same time.
let dummyHash;
const dummy = () => (dummyHash ||= hashPassword(randomBytes(12).toString('hex')));

// In-process limiter per client IP (the per-email failure counter in the KV store is the cross-instance guard).
const buckets = new Map();
export function limited(key, capacity, windowMs, now = Date.now()) {
  const bucket = buckets.get(key);
  if (!bucket || bucket.reset < now) { buckets.set(key, { count: 1, reset: now + windowMs }); if (buckets.size > 20000) buckets.clear(); return false; }
  return ++bucket.count > capacity;
}

export function emailSender(env = process.env) {
  const provider = String(env.EMAIL_PROVIDER || '').toLowerCase();
  if (provider === 'resend' && env.EMAIL_API_KEY && env.EMAIL_FROM)
    return async ({ to, subject, text }) => {
      const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${env.EMAIL_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: env.EMAIL_FROM, to: [to], subject, text }), signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error(`email_${response.status}`);
    };
  if (provider === 'webhook' && /^https?:\/\//i.test(env.EMAIL_WEBHOOK_URL || ''))
    return async ({ to, subject, text }) => {
      const response = await fetch(env.EMAIL_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(env.EMAIL_WEBHOOK_SECRET ? { Authorization: `Bearer ${env.EMAIL_WEBHOOK_SECRET}` } : {}) }, body: JSON.stringify({ to, subject, text }), signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error(`email_${response.status}`);
    };
  return null;
}

const isSecure = (req, env) => env.NODE_ENV === 'production' || Boolean(env.VERCEL) || String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https';
function cookieValue(req) {
  const jar = {};
  for (const part of String(req.headers.cookie || '').split(';')) { const at = part.indexOf('='); if (at > 0) jar[part.slice(0, at).trim()] = part.slice(at + 1).trim(); }
  const token = jar[SECURE_COOKIE] || jar[COOKIE] || '';
  return /^[A-Za-z0-9_-]{20,100}$/.test(token) ? token : '';
}
function setCookie(res, req, env, token, maxAge) {
  const secure = isSecure(req, env);
  res.setHeader('Set-Cookie', `${secure ? SECURE_COOKIE : COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`);
}
// State-changing requests must come from this site: SameSite=Lax plus an Origin (or Referer) that matches the host.
export function sameOrigin(req, env = process.env) {
  const source = req.headers.origin || req.headers.referer;
  if (!source || source === 'null') return false;
  let origin;
  try { origin = new URL(source); } catch { return false; }
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim().toLowerCase();
  if (origin.host.toLowerCase() === host) return true;
  return String(env.ACCOUNT_TRUSTED_ORIGINS || '').split(',').map((x) => x.trim().replace(/\/$/, '').toLowerCase()).filter(Boolean).includes(origin.origin.toLowerCase());
}

const publicUser = (user) => ({ name: user.name, email: user.email, phone: user.phone || '', marketing: user.marketing?.given === true, emailVerified: user.emailVerified === true, createdAt: user.createdAt });
const leadSummary = (record) => ({ ref: String(record.id).slice(0, 8), createdAt: record.createdAt, type: record.type, source: String(record.source || '').slice(0, 60),
  title: record.type === 'tailor' ? String(record.destinations || '').slice(0, 120) || 'טיול בהתאמה אישית' : 'פנייה כללית' });

export function createAccounts({ store, env = process.env, now = () => Date.now() }) {
  const send = emailSender(env);
  const siteUrl = /^https?:\/\//i.test(env.SITE_URL || '') ? env.SITE_URL.replace(/\/+$/, '') : '';
  const iso = () => new Date(now()).toISOString();

  async function userByEmail(email) { const id = await store.get(`email:${sha(email)}`); return id ? store.get(`user:${id}`) : null; }
  async function startSession(res, req, user) {
    const token = randomBytes(32).toString('base64url');
    await store.set(`session:${sha(token)}`, { userId: user.id, v: user.sessionVersion || 0, createdAt: iso() }, SESSION_TTL);
    setCookie(res, req, env, token, SESSION_TTL);
  }
  async function current(req) {
    const token = cookieValue(req);
    if (!token) return null;
    const session = await store.get(`session:${sha(token)}`);
    if (!session) return null;
    const user = await store.get(`user:${session.userId}`);
    return user && (user.sessionVersion || 0) === session.v ? { user, key: `session:${sha(token)}` } : null;
  }
  const saveUser = (user) => store.set(`user:${user.id}`, { ...user, updatedAt: iso() });
  async function failures(email) { return Number(await store.get(`fail:${sha(email)}`)) || 0; }
  async function fail(email) { await store.set(`fail:${sha(email)}`, (await failures(email)) + 1, FAIL_TTL); }

  async function route(req, res, url, { send: reply, body }) {
    const path = url.pathname.slice('/api/account'.length) || '/', method = req.method, ip = clientOf(req);
    if (limited(`account:${ip}`, 120, 60_000)) return reply(429, { error: 'rate_limited', message: TOO_MANY });
    if (method === 'GET' && path === '/config') return reply(200, { emailLogin: Boolean(send), passwordReset: Boolean(send && siteUrl) });
    if (method === 'POST') {
      if (!sameOrigin(req, env)) return reply(403, { error: 'bad_origin' });
      if (!/^application\/json\b/i.test(req.headers['content-type'] || '')) return reply(415, { error: 'json_required' });
    } else if (method !== 'GET') return reply(405, { error: 'method_not_allowed' });
    const authRoute = ['/signup', '/login', '/code/request', '/code/verify', '/password/forgot', '/password/reset'].includes(path);
    if (authRoute && method === 'POST' && limited(`auth:${ip}`, 10, 600_000)) return reply(429, { error: 'rate_limited', message: TOO_MANY });
    const input = method === 'POST' ? await body(req, 64_000) : {};
    // Spec 21: the page language comes with every POST; field messages, success messages and emails follow it.
    // Error `message`s stay Hebrew for compatibility; the English page maps the `error` code.
    const l = normLang(input?.lang), tr = tIn(l);

    if (method === 'POST' && path === '/signup') {
      const { value, errors } = validateSignup(input, l);
      if (!value) return reply(400, { error: 'signup_invalid', fields: errors, message: 'חלק מהפרטים חסרים או לא תקינים.' });
      if (await store.get(`email:${sha(value.email)}`)) return reply(409, { error: 'signup_failed', message: 'לא ניתן לפתוח חשבון עם המייל הזה. אם כבר יש לכם חשבון, התחברו.' });
      const at = iso();
      const user = { id: randomUUID(), email: value.email, name: value.name, phone: value.phone, password: await hashPassword(input.password), emailVerified: false, sessionVersion: 0, createdAt: at,
        marketing: { given: value.marketing, at, text: marketingText(l) }, privacy: { at, text: privacyText(l) }, saved: { flights: [], trips: {}, favorites: [], updatedAt: null }, searches: [], leads: [] };
      await saveUser(user);
      await store.set(`email:${sha(user.email)}`, user.id);
      await startSession(res, req, user);
      return reply(201, { user: publicUser(user) });
    }
    if (method === 'POST' && path === '/login') {
      const email = normalizeEmail(input.email), password = typeof input.password === 'string' ? input.password.slice(0, 200) : '';
      if (!email || !password) return reply(400, { error: 'login_invalid', message: 'כתבו מייל וסיסמה.' });
      if ((await failures(email)) >= MAX_FAILS) return reply(429, { error: 'rate_limited', message: TOO_MANY });
      const user = await userByEmail(email);
      const ok = user ? await verifyPassword(password, user.password) : (await verifyPassword(password, await dummy()), false);
      if (!ok) { await fail(email); return reply(401, { error: 'invalid_credentials', message: GENERIC_LOGIN }); }
      await store.del(`fail:${sha(email)}`);
      await startSession(res, req, user);
      return reply(200, { user: publicUser(user) });
    }
    if (method === 'POST' && path === '/code/request') {
      if (!send) return reply(404, { error: 'not_available' });
      const email = normalizeEmail(input.email);
      const user = email ? await userByEmail(email) : null;
      if (user) {
        const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
        await store.set(`code:${sha(email)}`, { hash: sha(email + ':' + code), attempts: 0 }, CODE_TTL);
        try { await send({ to: user.email, subject: tr('account.mail.codeSubject'), text: tr('account.mail.codeText', { name: user.name, code }) }); }
        catch (error) { console.log(JSON.stringify({ evt: 'account_email', ok: false, error: error.message })); }
      }
      return reply(200, { ok: true, message: tr('account.ok.codeSent') });
    }
    if (method === 'POST' && path === '/code/verify') {
      if (!send) return reply(404, { error: 'not_available' });
      const email = normalizeEmail(input.email), code = String(input.code ?? '').replace(/\s/g, '');
      const entry = email ? await store.get(`code:${sha(email)}`) : null;
      if (!entry || !/^\d{6}$/.test(code)) return reply(401, { error: 'invalid_code', message: 'הקוד שגוי או שפג תוקפו.' });
      if (sha(email + ':' + code) !== entry.hash) {
        if (entry.attempts + 1 >= CODE_ATTEMPTS) await store.del(`code:${sha(email)}`); else await store.set(`code:${sha(email)}`, { ...entry, attempts: entry.attempts + 1 }, CODE_TTL);
        return reply(401, { error: 'invalid_code', message: 'הקוד שגוי או שפג תוקפו.' });
      }
      await store.del(`code:${sha(email)}`);
      const user = await userByEmail(email);
      if (!user) return reply(401, { error: 'invalid_code', message: 'הקוד שגוי או שפג תוקפו.' });
      user.emailVerified = true; await saveUser(user);
      await startSession(res, req, user);
      return reply(200, { user: publicUser(user) });
    }
    if (method === 'POST' && path === '/password/forgot') {
      if (!send || !siteUrl) return reply(404, { error: 'not_available' });
      const email = normalizeEmail(input.email), user = email ? await userByEmail(email) : null;
      if (user) {
        const token = randomBytes(32).toString('base64url');
        await store.set(`reset:${sha(token)}`, { userId: user.id }, RESET_TTL);
        try { await send({ to: user.email, subject: tr('account.mail.resetSubject'), text: tr('account.mail.resetText', { name: user.name, link: `${siteUrl}${homePath(l)}#/account?reset=${token}` }) }); }
        catch (error) { console.log(JSON.stringify({ evt: 'account_email', ok: false, error: error.message })); }
      }
      return reply(200, { ok: true, message: tr('account.ok.resetSent') });
    }
    if (method === 'POST' && path === '/password/reset') {
      const token = typeof input.token === 'string' && /^[A-Za-z0-9_-]{20,100}$/.test(input.token) ? input.token : '';
      const entry = token ? await store.get(`reset:${sha(token)}`) : null, user = entry ? await store.get(`user:${entry.userId}`) : null;
      if (!user) return reply(400, { error: 'invalid_token', message: 'הקישור אינו תקף או שפג תוקפו. בקשו קישור חדש.' });
      const problem = passwordProblem(input.password, l);
      if (problem) return reply(400, { error: 'password_invalid', fields: { password: problem }, message: problem });
      await store.del(`reset:${sha(token)}`);
      Object.assign(user, { password: await hashPassword(input.password), emailVerified: true, sessionVersion: (user.sessionVersion || 0) + 1 });
      await saveUser(user);
      await store.del(`fail:${sha(user.email)}`);
      return reply(200, { ok: true, message: tr('account.ok.passwordReset') });
    }

    const session = await current(req);
    if (method === 'GET' && path === '/me') return reply(200, { user: session ? publicUser(session.user) : null });
    if (method === 'POST' && path === '/logout') { if (session) await store.del(session.key); setCookie(res, req, env, '', 0); return reply(200, { ok: true }); }
    if (!session) return reply(401, { error: 'unauthenticated', message: 'צריך להתחבר מחדש.' });
    const { user } = session;

    if (method === 'POST' && path === '/profile') {
      const { value, errors } = validateProfile(input, l);
      if (!value) return reply(400, { error: 'profile_invalid', fields: errors, message: 'חלק מהפרטים לא תקינים.' });
      if (value.marketing !== (user.marketing?.given === true)) user.marketing = { given: value.marketing, at: iso(), text: marketingText(l) };
      Object.assign(user, { name: value.name, phone: value.phone });
      await saveUser(user);
      return reply(200, { user: publicUser(user) });
    }
    if (method === 'POST' && path === '/password/change') {
      if (!(await verifyPassword(String(input.current ?? '').slice(0, 200), user.password))) return reply(401, { error: 'invalid_credentials', fields: { current: tr('account.v.currentWrong') }, message: 'הסיסמה הנוכחית שגויה.' });
      const problem = passwordProblem(input.password, l);
      if (problem) return reply(400, { error: 'password_invalid', fields: { password: problem }, message: problem });
      Object.assign(user, { password: await hashPassword(input.password), sessionVersion: (user.sessionVersion || 0) + 1 });
      await saveUser(user);
      await startSession(res, req, user); // other devices are signed out, this one stays in
      return reply(200, { ok: true, message: tr('account.ok.passwordChanged') });
    }
    if (path === '/saved') {
      if (method === 'GET') return reply(200, { ...cleanSaved(user.saved), updatedAt: user.saved?.updatedAt || null });
      user.saved = { ...cleanSaved(input), updatedAt: iso() };
      await saveUser(user);
      return reply(200, user.saved);
    }
    if (path === '/searches') {
      if (method === 'POST') { user.searches = input.clear === true ? [] : addSearch(Array.isArray(user.searches) ? user.searches : [], input.search, iso()); await saveUser(user); }
      return reply(200, { searches: user.searches || [] });
    }
    if (method === 'GET' && path === '/leads') return reply(200, { leads: await leadsOf(user) });
    if (method === 'GET' && path === '/export') {
      const { password, sessionVersion, ...data } = user;
      res.setHeader('Content-Disposition', 'attachment; filename="gerbi-tours-my-data.json"');
      return reply(200, { exportedAt: iso(), service: 'ג׳רבי טורס', account: { ...data, saved: cleanSaved(user.saved) }, leads: await leadsOf(user) });
    }
    if (method === 'POST' && path === '/delete') {
      if (!(await verifyPassword(String(input.password ?? '').slice(0, 200), user.password))) return reply(401, { error: 'invalid_credentials', fields: { password: tr('account.v.passwordWrong') }, message: 'הסיסמה שגויה.' });
      await store.del(`user:${user.id}`); await store.del(`email:${sha(user.email)}`); await store.del(`leadsByEmail:${sha(user.email)}`); await store.del(session.key);
      setCookie(res, req, env, '', 0);
      console.log(JSON.stringify({ evt: 'account_deleted' }));
      return reply(200, { ok: true });
    }
    return reply(404, { error: 'not_found' });
  }

  async function leadsOf(user) {
    const own = Array.isArray(user.leads) ? user.leads : [];
    const byEmail = user.emailVerified ? (await store.get(`leadsByEmail:${sha(user.email)}`)) || [] : [];
    return [...own, ...byEmail].filter((lead, i, all) => all.findIndex((x) => x.ref === lead.ref) === i).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, MAX_LEADS)
      .map((lead) => (GENERIC_TITLES.includes(lead.title) ? { ...lead, generic: true } : lead));
  }

  return {
    async handle(req, res, url, helpers) {
      if (url.pathname !== '/api/account' && !url.pathname.startsWith('/api/account/')) return false;
      try { await route(req, res, url, helpers); }
      catch (error) {
        if (['payload_too_large', 'invalid_json'].includes(error.message)) throw error;
        console.log(JSON.stringify({ evt: 'account', ok: false, error: error.message }));
        helpers.send(503, { error: 'account_unavailable', message: UNAVAILABLE });
      }
      return true;
    },
    // Hooks for backend/leads.mjs: who is submitting, and remember the enquiry for the customer area.
    leadHooks: {
      async userOf(req) { try { return (await current(req))?.user.id || null; } catch { return null; } },
      async created(record) {
        const summary = leadSummary(record);
        if (record.userId) { const user = await store.get(`user:${record.userId}`); if (user) { user.leads = [summary, ...(user.leads || [])].slice(0, MAX_LEADS); await saveUser(user); } }
        const email = normalizeEmail(record.email);
        if (email) { const key = `leadsByEmail:${sha(email)}`; await store.set(key, [summary, ...((await store.get(key)) || [])].slice(0, MAX_LEADS)); }
      }
    }
  };
}
