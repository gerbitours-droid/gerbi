// Passenger and contact details of an order are stored encrypted (spec 25 §8): AES-256-GCM, a fresh 12-byte IV per
// write, and the order id as additional authenticated data so a sealed blob cannot be moved to another order.
// Key: BOOKING_DATA_KEY (32 random bytes as base64/hex, or any 32+ character secret, stretched with HKDF).
// Local development without a key uses data/booking-dev.key (created once, mode 600); production refuses to start
// the booking flow without BOOKING_DATA_KEY (see bookingKey()).
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const VERSION = 'v1';
export function keyFrom(secret) {
  const text = String(secret || '').trim();
  if (/^[A-Fa-f0-9]{64}$/.test(text)) return Buffer.from(text, 'hex');
  if (/^[A-Za-z0-9+/_-]{43}=?$/.test(text)) { const raw = Buffer.from(text.replace(/-/g, '+').replace(/_/g, '/'), 'base64'); if (raw.length === 32) return raw; }
  if (text.length < 32) throw new Error('booking_key_too_short');
  return Buffer.from(hkdfSync('sha256', text, 'gerbi-booking', 'order-pii-v1', 32));
}

export function createSealer(secret) {
  const key = keyFrom(secret);
  return {
    seal(value, aad) {
      const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', key, iv);
      cipher.setAAD(Buffer.from(String(aad)));
      const body = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
      return [VERSION, iv.toString('base64url'), body.toString('base64url'), cipher.getAuthTag().toString('base64url')].join('.');
    },
    open(sealed, aad) {
      const [version, iv, body, tag] = String(sealed || '').split('.');
      if (version !== VERSION || !iv || !body || !tag) throw new Error('sealed_invalid');
      const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64url'));
      decipher.setAAD(Buffer.from(String(aad)));
      decipher.setAuthTag(Buffer.from(tag, 'base64url'));
      return JSON.parse(Buffer.concat([decipher.update(Buffer.from(body, 'base64url')), decipher.final()]).toString('utf8'));
    }
  };
}

const production = (env) => env.NODE_ENV === 'production' || Boolean(env.VERCEL);
// → { secret, source: 'env' | 'dev-file' } or null when no key may be used (production without BOOKING_DATA_KEY).
export function bookingKey(env = process.env, dataDirectory = '') {
  if (env.BOOKING_DATA_KEY) { keyFrom(env.BOOKING_DATA_KEY); return { secret: env.BOOKING_DATA_KEY, source: 'env' }; }
  if (production(env) || !dataDirectory) return null;
  const file = path.join(dataDirectory, 'booking-dev.key');
  try {
    if (!existsSync(file)) { mkdirSync(dataDirectory, { recursive: true }); writeFileSync(file, randomBytes(32).toString('hex'), { mode: 0o600 }); }
    return { secret: readFileSync(file, 'utf8').trim(), source: 'dev-file' };
  } catch { return null; }
}
