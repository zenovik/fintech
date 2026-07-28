import { check } from 'k6';
import { get, post, publicPost, assertOk, parseJson } from './http.js';
import { MERCHANT, PAYMENT_METHOD } from '../data/constants.js';
import { uniqueRef, randomAmount } from './random.js';
import { checkoutPublicPayDuration, recordDuration } from './metrics.js';
import { config } from '../config/env.js';

export function createCheckoutSession(token, amount) {
  const res = post(
    '/v1/checkout/sessions',
    token,
    {
      merchantId: MERCHANT.org1Active,
      amount: amount ?? randomAmount(20, 120),
      currency: 'USD',
      merchantOrderId: uniqueRef('PERF-CHK'),
      expiryMinutes: 30,
    },
    { scenario: 'checkout-create' },
  );
  assertOk(res, 'checkout create', [201]);
  return { response: res, body: parseJson(res) };
}

export function publicCheckoutPay(checkoutRef, clientSecret, amount) {
  const start = Date.now();
  const res = publicPost(
    `/v1/public/checkout/${checkoutRef}/pay?client_secret=${encodeURIComponent(clientSecret)}`,
    { paymentMethodCode: PAYMENT_METHOD, amount },
    { scenario: 'checkout-public-pay' },
  );
  const ok = assertOk(res, 'checkout pay', [200]);
  recordDuration(checkoutPublicPayDuration, Date.now() - start, ok);
  return res;
}

export function checkoutFlow(token) {
  if (!config.allowMutations) {
    return get('/v1/checkout/sessions?page=1&pageSize=5', token, { scenario: 'checkout-list' });
  }
  const session = createCheckoutSession(token);
  const ref = session.body?.data?.checkoutRef;
  const secret = session.body?.data?.clientSecret;
  const amount = session.body?.data?.amount ?? 50;
  if (ref && secret) {
    publicCheckoutPay(ref, secret, amount);
  }
  return session;
}

export function listCheckoutSessions(token) {
  return get('/v1/checkout/sessions?page=1&pageSize=10', token, { scenario: 'checkout-list' });
}

export function getPublicCheckout(checkoutRef, clientSecret) {
  return publicPost(`/v1/public/checkout/${checkoutRef}?client_secret=${encodeURIComponent(clientSecret)}`, null, {
    scenario: 'checkout-public-get',
  });
}
