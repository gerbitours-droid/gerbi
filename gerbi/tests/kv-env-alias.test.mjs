import test from 'node:test';
import assert from 'node:assert/strict';
import { aliasKvEnv } from '../backend/kv-store.mjs';

test('Vercel Upstash integration vars (prefixed) alias to UPSTASH_REDIS_REST_*', () => {
  const env = aliasKvEnv({ GERBIDB_KV_REST_API_URL: 'https://x.upstash.io', GERBIDB_KV_REST_API_TOKEN: 't', GERBIDB_KV_REST_API_READ_ONLY_TOKEN: 'ro' });
  assert.equal(env.UPSTASH_REDIS_REST_URL, 'https://x.upstash.io');
  assert.equal(env.UPSTASH_REDIS_REST_TOKEN, 't');
  assert.equal(aliasKvEnv({ UPSTASH_REDIS_REST_URL: 'a', UPSTASH_REDIS_REST_TOKEN: 'b', KV_REST_API_URL: 'c', KV_REST_API_TOKEN: 'd' }).UPSTASH_REDIS_REST_URL, 'a');
  assert.equal(aliasKvEnv({}).UPSTASH_REDIS_REST_URL, undefined);
});
