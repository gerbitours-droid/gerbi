// Small key/value store for query memory and the LLM cache (spec §6).
//   Upstash Redis over REST when UPSTASH_REDIS_REST_URL + _TOKEN are set (Vercel's file system does not persist),
//   otherwise one JSON file per namespace in data/ (local), falling back to process memory if the disk is read-only.
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

class UpstashStore {
  constructor(url, token) { this.url = url.replace(/\/$/, ''); this.token = token; }
  async command(args) {
    const response = await fetch(this.url, { method: 'POST', headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(args), signal: AbortSignal.timeout(2500) });
    if (!response.ok) throw new Error(`kv_${response.status}`);
    return (await response.json()).result;
  }
  async get(key) { const value = await this.command(['GET', key]); return value ? JSON.parse(value) : null; }
  async set(key, value, ttlSeconds) { await this.command(ttlSeconds ? ['SET', key, JSON.stringify(value), 'EX', String(ttlSeconds)] : ['SET', key, JSON.stringify(value)]); }
}

class FileStore {
  constructor(directory, namespace) { this.file = path.join(directory, `${namespace}.json`); this.directory = directory; this.data = null; this.queue = Promise.resolve(); }
  async load() { if (!this.data) { try { this.data = JSON.parse(await readFile(this.file, 'utf8')); } catch { this.data = {}; } } return this.data; }
  async get(key) { const data = await this.load(), entry = data[key]; if (!entry) return null; if (entry.expires && entry.expires < Date.now()) { delete data[key]; return null; } return entry.value; }
  async set(key, value, ttlSeconds) {
    const data = await this.load();
    data[key] = { value, expires: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null };
    // ponytail: whole-file rewrite, fine for a prototype's few thousand keys; Redis takes over in production.
    this.queue = this.queue.then(async () => {
      try { await mkdir(this.directory, { recursive: true }); const tmp = `${this.file}.${process.pid}.tmp`; await writeFile(tmp, JSON.stringify(data), { mode: 0o600 }); await rename(tmp, this.file); }
      catch { /* Read-only disk: keep serving from memory. */ }
    });
    await this.queue;
  }
}

export function createStore(namespace, directory) {
  const { UPSTASH_REDIS_REST_URL: url, UPSTASH_REDIS_REST_TOKEN: token } = process.env;
  if (url && token) {
    const remote = new UpstashStore(url, token);
    return { get: key => remote.get(`gerbi:${namespace}:${key}`), set: (key, value, ttl) => remote.set(`gerbi:${namespace}:${key}`, value, ttl), kind: 'upstash' };
  }
  const local = new FileStore(directory, namespace);
  return { get: key => local.get(key), set: (key, value, ttl) => local.set(key, value, ttl), kind: 'file' };
}
