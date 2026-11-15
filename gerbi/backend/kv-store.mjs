// Small key/value store for query memory and the LLM cache (spec §6).
//   Upstash Redis over REST when UPSTASH_REDIS_REST_URL + _TOKEN are set (Vercel's file system does not persist),
//   otherwise one JSON file per namespace in data/ (local), falling back to process memory if the disk is read-only.
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

// String-level edit so the rest of the JSON (e.g. empty arrays) is untouched by cjson; ids and statuses are [A-Za-z0-9-].
const SET_STATUS_LUA = `local items = redis.call('LRANGE', KEYS[1], 0, -1)
for i, raw in ipairs(items) do
  if string.find(raw, '"id":"' .. ARGV[1] .. '"', 1, true) then
    local updated, n = string.gsub(raw, '"status":"[%w_-]*"', '"status":"' .. ARGV[2] .. '"', 1)
    if n == 0 then updated = string.gsub(raw, '^{', '{"status":"' .. ARGV[2] .. '",', 1) end
    redis.call('LSET', KEYS[1], i - 1, updated)
    return 1
  end
end
return 0`;
// Fixed-window counter: INCR, and the first hit of a window sets its expiry (one atomic round trip).
// Retention for newest-first lists (LPUSH): pop from the tail while the oldest item's createdAt is before the cutoff.
const TRIM_OLDER_LUA = `local removed = 0
while true do
  local raw = redis.call('LINDEX', KEYS[1], -1)
  if not raw then break end
  local ok, item = pcall(cjson.decode, raw)
  if not ok or type(item) ~= 'table' or type(item.createdAt) ~= 'string' or item.createdAt >= ARGV[1] then break end
  redis.call('RPOP', KEYS[1])
  removed = removed + 1
end
return removed`;
const INCR_LUA = `local n = redis.call('INCR', KEYS[1])
if n == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
return n`;

class UpstashStore {
  constructor(url, token) { this.url = url.replace(/\/$/, ''); this.token = token; }
  async command(args) {
    const response = await fetch(this.url, { method: 'POST', headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(args), signal: AbortSignal.timeout(2500) });
    if (!response.ok) throw new Error(`kv_${response.status}`);
    return (await response.json()).result;
  }
  async get(key) { const value = await this.command(['GET', key]); return value ? JSON.parse(value) : null; }
  async set(key, value, ttlSeconds) { await this.command(ttlSeconds ? ['SET', key, JSON.stringify(value), 'EX', String(ttlSeconds)] : ['SET', key, JSON.stringify(value)]); }
  async push(key, value, max) { await this.command(['LPUSH', key, JSON.stringify(value)]); await this.command(['LTRIM', key, '0', String(max - 1)]); }
  async list(key, count) { return ((await this.command(['LRANGE', key, '0', String(count - 1)])) || []).map((item) => JSON.parse(item)); }
  // Atomic (one Lua script): sets the top-level "status" of the list item with this id. Returns true when found.
  async setListStatus(key, id, status) { return (await this.command(['EVAL', SET_STATUS_LUA, '1', key, id, status])) === 1; }
  async del(key) { await this.command(['DEL', key]); }
  async trimOlder(key, cutoffIso) { return Number(await this.command(['EVAL', TRIM_OLDER_LUA, '1', key, cutoffIso])); }
  async incr(key, ttlSeconds) { return Number(await this.command(['EVAL', INCR_LUA, '1', key, String(ttlSeconds)])); }
}

class FileStore {
  constructor(directory, namespace) { this.file = path.join(directory, `${namespace}.json`); this.directory = directory; this.data = null; this.queue = Promise.resolve(); }
  // One shared read, so two first calls in flight never end up with two different copies of the data.
  load() { return this.loading ||= readFile(this.file, 'utf8').then(JSON.parse).catch(() => ({})).then((data) => (this.data = data)); }
  async get(key) { const data = await this.load(), entry = data[key]; if (!entry) return null; if (entry.expires && entry.expires < Date.now()) { delete data[key]; return null; } return entry.value; }
  async set(key, value, ttlSeconds) {
    const data = await this.load();
    data[key] = { value, expires: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null };
    // ponytail: whole-file rewrite, fine for a prototype's few thousand keys; Redis takes over in production.
    await this.persist(data);
  }
  persist(data) {
    const at = Date.now();
    for (const [k, v] of Object.entries(data)) if (v?.expires && v.expires < at) delete data[k];
    this.queue = this.queue.then(async () => {
      try { await mkdir(this.directory, { recursive: true }); const tmp = `${this.file}.${process.pid}.tmp`; await writeFile(tmp, JSON.stringify(data), { mode: 0o600 }); await rename(tmp, this.file); }
      catch { /* Read-only disk: keep serving from memory. */ }
    });
    return this.queue;
  }
  // Newest-first list, capped at max entries (leads).
  // Read-modify-write without an await in between, so concurrent pushes in one process never drop an entry.
  async push(key, value, max) {
    const data = await this.load(), list = Array.isArray(data[key]?.value) ? data[key].value : [];
    data[key] = { value: [value, ...list].slice(0, max), expires: null };
    await this.persist(data);
  }
  async list(key, count) { return ((await this.get(key)) || []).slice(0, count); }
  async setListStatus(key, id, status) {
    const data = await this.load(), item = (Array.isArray(data[key]?.value) ? data[key].value : []).find((entry) => entry?.id === id);
    if (!item) return false;
    item.status = status; await this.persist(data); return true;
  }
  async del(key) { const data = await this.load(); if (key in data) { delete data[key]; await this.persist(data); } }
  async trimOlder(key, cutoffIso) {
    const data = await this.load(), list = Array.isArray(data[key]?.value) ? data[key].value : [];
    const kept = list.filter((item) => !(typeof item?.createdAt === 'string' && item.createdAt < cutoffIso));
    if (kept.length === list.length) return 0;
    data[key] = { ...data[key], value: kept }; await this.persist(data); return list.length - kept.length;
  }
  // Counter with an expiry set by its first hit (same semantics as the Upstash INCR + EXPIRE). Expired keys are pruned here.
  async incr(key, ttlSeconds) {
    const data = await this.load(), at = Date.now(), entry = data[key];
    const live = entry && (!entry.expires || entry.expires >= at) && Number.isFinite(entry.value);
    data[key] = live ? { value: entry.value + 1, expires: entry.expires } : { value: 1, expires: at + ttlSeconds * 1000 };
    const value = data[key].value; await this.persist(data); return value;
  }
}

// Vercel's Upstash integration names its vars <PREFIX>_KV_REST_API_URL/_TOKEN (or KV_REST_API_*); alias them once.
// ponytail: first match wins; set UPSTASH_REDIS_REST_* explicitly if a project ever has two databases.
export function aliasKvEnv(env = process.env) {
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) return env;
  const key = Object.keys(env).find(k => /(^|_)KV_REST_API_URL$/.test(k) && env[k] && env[k.replace(/URL$/, 'TOKEN')]);
  if (key) { env.UPSTASH_REDIS_REST_URL = env[key]; env.UPSTASH_REDIS_REST_TOKEN = env[key.replace(/URL$/, 'TOKEN')]; }
  return env;
}
aliasKvEnv();

export function createStore(namespace, directory) {
  const { UPSTASH_REDIS_REST_URL: url, UPSTASH_REDIS_REST_TOKEN: token } = process.env;
  if (url && token) {
    const remote = new UpstashStore(url, token);
    return { get: key => remote.get(`gerbi:${namespace}:${key}`), set: (key, value, ttl) => remote.set(`gerbi:${namespace}:${key}`, value, ttl),
      push: (key, value, max = 5000) => remote.push(`gerbi:${namespace}:${key}`, value, max), list: (key, count = 200) => remote.list(`gerbi:${namespace}:${key}`, count), del: key => remote.del(`gerbi:${namespace}:${key}`),
      setListStatus: (key, id, status) => remote.setListStatus(`gerbi:${namespace}:${key}`, id, status), incr: (key, ttl) => remote.incr(`gerbi:${namespace}:${key}`, ttl), trimOlder: (key, cutoff) => remote.trimOlder(`gerbi:${namespace}:${key}`, cutoff), kind: 'upstash' };
  }
  const local = new FileStore(directory, namespace);
  return { get: key => local.get(key), set: (key, value, ttl) => local.set(key, value, ttl),
    push: (key, value, max = 5000) => local.push(key, value, max), list: (key, count = 200) => local.list(key, count), del: key => local.del(key), setListStatus: (key, id, status) => local.setListStatus(key, id, status), incr: (key, ttl) => local.incr(key, ttl), trimOlder: (key, cutoff) => local.trimOlder(key, cutoff), kind: 'file' };
}
