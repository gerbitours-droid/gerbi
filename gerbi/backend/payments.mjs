// Payment providers (spec 25 §2). The site never sees a card: the customer pays on the provider's hosted page
// (a full-page redirect, so the CSP needs no frame-src), and the provider notifies the server.
//
// Interface (every provider):
//   createPayment({ orderId, attempt, amount (agorot), currency, description, customer, returnUrl, notifyUrl, lang, maxInstallments })
//        → { intentId, redirectUrl }                        authorize only (J5): nothing is charged yet
//   verifyNotification({ path, headers, rawBody, form }) → { intentId, status: 'authorized'|'failed'|'captured'|'refunded', amount, eventId } | null
//   capture({ intentId, amount }) · voidAuthorization({ intentId }) · refund({ intentId, amount }) · status({ intentId })
//
// mockPayments(): an in-house hosted page (/api/payments/mock/<intent>) with approve/decline buttons; its
//   notification is HMAC-SHA256 signed exactly like a real provider would be verified. Dev, tests and e2e only.
// paymePayments(): adapter skeleton for PayMe (the recommended gateway, spec §2.3) – env-configured, NOT tested live.
//   PayMe does not sign merchant callbacks, so the callback is only a trigger: it must carry our per-order URL
//   token, and the sale is re-read from PayMe (get-sales) before anything moves.
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const hmac = (secret, value) => createHmac('sha256', String(secret)).update(String(value)).digest('hex');
export function safeEqual(a, b) { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && timingSafeEqual(x, y); }
// The notify URL carries a token only the server can compute: a forged call for another order fails before any lookup.
export const notifyToken = (secret, orderId) => hmac(secret, `notify:${orderId}`).slice(0, 32);

export function mockPayments({ store, secret, now = () => Date.now(), failures = {} } = {}) {
  if (!secret) throw new Error('payment_secret_missing');
  const get = (id) => store.get(`intent:${id}`), put = (intent) => store.set(`intent:${intent.id}`, intent, 30 * 86400);
  const fail = (op) => { if (failures[op]) throw Object.assign(new Error(`payment_${op}_failed`), { status: 502 }); };
  return {
    name: 'mock', label: 'Mock', configured: true,
    async createPayment({ orderId, attempt = 1, amount, currency = 'ILS', description = '', returnUrl, notifyUrl, maxInstallments = 1 }) {
      fail('create');
      if (!Number.isInteger(amount) || amount <= 0) throw new Error('amount_invalid');
      const id = `mock_${orderId.slice(0, 8)}_${attempt}_${randomBytes(4).toString('hex')}`;
      await put({ id, orderId, amount, currency, description: String(description).slice(0, 120), returnUrl, notifyUrl, maxInstallments, status: 'created', createdAt: new Date(now()).toISOString() });
      return { intentId: id, redirectUrl: `/api/payments/mock/${id}` };
    },
    // The signed event the mock page "sends" (and tests forge or tamper with).
    sign(event) { const body = JSON.stringify(event); return { body, signature: hmac(secret, body) }; },
    async verifyNotification({ headers = {}, rawBody = '' }) {
      const signature = String(headers['x-mock-signature'] || '');
      if (!/^[a-f0-9]{64}$/.test(signature) || !safeEqual(signature, hmac(secret, rawBody))) return null;
      let event; try { event = JSON.parse(rawBody); } catch { return null; }
      const intent = await get(String(event?.intentId || ''));
      if (!intent || !['authorized', 'failed'].includes(event.status) || event.amount !== intent.amount) return null;
      return { intentId: intent.id, orderId: intent.orderId, status: event.status, amount: intent.amount, eventId: String(event.eventId || '').slice(0, 80), installments: event.installments || 1 };
    },
    // Called by the mock hosted page when the customer clicks approve / decline.
    async complete(intentId, approve, installments = 1) {
      const intent = await get(intentId);
      if (!intent || intent.status !== 'created') return null;
      intent.status = approve ? 'authorized' : 'failed'; intent.installments = installments; await put(intent);
      return { intent, ...this.sign({ eventId: `evt_${randomBytes(6).toString('hex')}`, intentId, status: intent.status, amount: intent.amount, installments }) };
    },
    async intent(intentId) { return get(intentId); },
    async capture({ intentId, amount }) { fail('capture'); const i = await get(intentId); if (!i || i.status !== 'authorized' || amount > i.amount) throw Object.assign(new Error('capture_refused'), { status: 409 }); i.status = 'captured'; i.captured = amount; await put(i); return { status: 'captured' }; },
    async voidAuthorization({ intentId }) { fail('void'); const i = await get(intentId); if (!i || i.status !== 'authorized') throw Object.assign(new Error('void_refused'), { status: 409 }); i.status = 'voided'; await put(i); return { status: 'voided' }; },
    async refund({ intentId, amount }) { fail('refund'); const i = await get(intentId); if (!i || i.status !== 'captured' || amount > i.captured) throw Object.assign(new Error('refund_refused'), { status: 409 }); i.status = 'refunded'; i.refunded = amount; await put(i); return { status: 'refunded' }; },
    async status({ intentId }) { return (await get(intentId))?.status || 'unknown'; }
  };
}

// ---- PayMe (https://docs.payme.io) ----------------------------------------------------------------------------
// Env: PAYME_SELLER_ID (seller_payme_id), PAYME_ENV=sandbox|live, PAYME_API_URL (override), PAYMENT_WEBHOOK_SECRET.
// Flow: generate-sale (sale_type "authorize", installments, sale_callback_url, sale_return_url) → hosted page →
//       callback (form-encoded; NOT signed for direct merchants) → get-sales to confirm → capture-sale within 7 days
//       → refund-sale for voids (on an authorized sale it releases the hold) and refunds.
export function paymePayments({ env = process.env, fetcher = fetch } = {}) {
  const seller = env.PAYME_SELLER_ID, base = env.PAYME_API_URL || (env.PAYME_ENV === 'live' ? 'https://live.payme.io/api' : 'https://sandbox.payme.io/api');
  const configured = Boolean(seller && env.PAYMENT_WEBHOOK_SECRET);
  async function post(path, body) {
    if (!configured) throw Object.assign(new Error('payment_not_configured'), { status: 503 });
    const response = await fetcher(`${base}/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ seller_payme_id: seller, ...body }), signal: AbortSignal.timeout(20_000) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.status_code === 1) throw Object.assign(new Error('payment_provider_error'), { status: 502, details: { code: data.status_error_code, text: String(data.status_error_details || '').slice(0, 200) } });
    return data;
  }
  const sale = async (intentId) => (await post('get-sales', { sale_payme_id: intentId }))?.items?.[0] || null;
  const statusOf = (s) => ({ authorized: 'authorized', completed: 'captured', refunded: 'refunded', 'partial-refund': 'captured', failed: 'failed', voided: 'voided' })[s?.sale_status] || 'unknown';
  return {
    name: 'payme', label: 'PayMe', configured,
    async createPayment({ orderId, amount, currency = 'ILS', description, customer = {}, returnUrl, notifyUrl, lang = 'he', maxInstallments = 1 }) {
      const data = await post('generate-sale', { sale_price: amount, currency, product_name: String(description).slice(0, 120), transaction_id: orderId, sale_type: 'authorize',
        installments: maxInstallments > 1 ? String(100 + Math.min(12, maxInstallments)) : '1', sale_callback_url: notifyUrl, sale_return_url: returnUrl, language: lang === 'en' ? 'en' : 'he',
        sale_email: customer.email, sale_mobile: customer.phone, sale_name: customer.name, capture_buyer: 0 });
      return { intentId: data.payme_sale_id, redirectUrl: data.sale_url };
    },
    async verifyNotification({ form = {} }) {
      const intentId = String(form.payme_sale_id || '');
      if (!/^[A-Za-z0-9_-]{6,64}$/.test(intentId)) return null;
      const confirmed = await sale(intentId); // the callback is only a trigger
      if (!confirmed) return null;
      return { intentId, orderId: String(confirmed.transaction_id || ''), status: statusOf(confirmed), amount: Number(confirmed.sale_price), eventId: `${intentId}:${confirmed.sale_status}`, installments: Number(confirmed.installments) || 1 };
    },
    async capture({ intentId, amount }) { await post('capture-sale', { payme_sale_id: intentId, sale_price: amount }); return { status: 'captured' }; },
    async voidAuthorization({ intentId }) { await post('refund-sale', { payme_sale_id: intentId }); return { status: 'voided' }; },
    async refund({ intentId, amount }) { await post('refund-sale', { payme_sale_id: intentId, sale_refund_amount: amount }); return { status: 'refunded' }; },
    async status({ intentId }) { return statusOf(await sale(intentId)); }
  };
}

// The provider for BOOKING_MODE: mock → mockPayments; live → the configured gateway (PAYMENT_PROVIDER=payme) or null.
export function paymentProvider({ mode, env = process.env, store, secret }) {
  if (mode === 'mock') return mockPayments({ store, secret });
  if (mode === 'live' && env.PAYMENT_PROVIDER === 'payme') { const p = paymePayments({ env }); return p.configured ? p : null; }
  return null;
}
