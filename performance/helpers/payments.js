import { check } from 'k6';
import { get, post, assertOk, parseJson } from './http.js';
import { MERCHANT, CUSTOMER } from '../data/constants.js';
import { uniqueRef, randomAmount } from './random.js';
import {
  paymentCreateDuration,
  paymentAuthorizeDuration,
  paymentCaptureDuration,
  recordDuration,
} from './metrics.js';

export function createPayment(token, overrides = {}) {
  const start = Date.now();
  const res = post(
    '/v1/payments',
    token,
    {
      merchantId: MERCHANT.org1Active,
      amount: overrides.amount ?? randomAmount(15, 250),
      currency: 'USD',
      merchantOrderId: overrides.merchantOrderId ?? uniqueRef('PERF-PAY'),
      customerId: CUSTOMER.org1,
      ...overrides,
    },
    { scenario: 'payment-create' },
  );
  const ok = assertOk(res, 'payment create', [201]);
  recordDuration(paymentCreateDuration, Date.now() - start, ok);
  const body = parseJson(res);
  const intentId = body?.data?.intent?.id ?? body?.data?.id;
  return { response: res, intentId, body };
}

export function authorizePayment(token, intentId) {
  const start = Date.now();
  const res = post(`/v1/payments/${intentId}/authorize`, token, {}, { scenario: 'payment-authorize' });
  const ok = assertOk(res, 'payment authorize', [200]);
  recordDuration(paymentAuthorizeDuration, Date.now() - start, ok);
  return res;
}

export function capturePayment(token, intentId, amount) {
  const start = Date.now();
  const body = amount != null ? { amount } : {};
  const res = post(`/v1/payments/${intentId}/capture`, token, body, { scenario: 'payment-capture' });
  const ok = assertOk(res, 'payment capture', [200]);
  recordDuration(paymentCaptureDuration, Date.now() - start, ok);
  return res;
}

export function partialCapturePayment(token, intentId, totalAmount) {
  const partial = Math.round(totalAmount * 0.4 * 100) / 100;
  authorizePayment(token, intentId);
  return capturePayment(token, intentId, partial);
}

export function refundPayment(token, intentId, amount) {
  const body = amount != null ? { amount } : {};
  return post(`/v1/payments/${intentId}/refund`, token, body, { scenario: 'payment-refund' });
}

export function cancelPayment(token, intentId) {
  return post(`/v1/payments/${intentId}/cancel`, token, { reason: 'perf cancel' }, { scenario: 'payment-cancel' });
}

export function getPaymentTimeline(token, intentId) {
  return get(`/v1/payments/${intentId}/timeline`, token, { scenario: 'payment-timeline' });
}

export function fullPaymentLifecycle(token) {
  const created = createPayment(token);
  if (!created.intentId) return created;
  authorizePayment(token, created.intentId);
  capturePayment(token, created.intentId);
  return created;
}

export function idempotentPayment(token, key) {
  const payload = { idempotencyKey: key, amount: 42, merchantOrderId: uniqueRef('IDEM') };
  const first = createPayment(token, payload);
  const second = createPayment(token, payload);
  check(first.response, { 'idempotent first 201': (r) => r.status === 201 });
  check(second.response, { 'idempotent second 201': (r) => r.status === 201 });
  return { first, second };
}
