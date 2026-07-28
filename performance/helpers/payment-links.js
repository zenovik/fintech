import { post, publicPost, get, assertOk, parseJson } from './http.js';
import { MERCHANT } from '../data/constants.js';
import { uniqueRef, randomAmount } from './random.js';
import { config } from '../config/env.js';

export function createPaymentLink(token) {
  if (!config.allowMutations) return get('/v1/payment-links?page=1&pageSize=5', token, { scenario: 'payment-link-list' });
  const res = post(
    '/v1/payment-links',
    token,
    {
      merchantId: MERCHANT.org1Active,
      title: uniqueRef('PERF-LNK'),
      amount: randomAmount(15, 100),
      currency: 'USD',
    },
    { scenario: 'payment-link-create' },
  );
  assertOk(res, 'payment link create', [201]);
  return { response: res, body: parseJson(res) };
}

export function publicPaymentLinkPay(publicToken, amount) {
  return publicPost(
    `/v1/public/payment-links/${publicToken}/pay`,
    { amount, paymentMethodDetail: 'k6 perf' },
    { scenario: 'payment-link-public-pay' },
  );
}

export function paymentLinkFlow(token) {
  const created = createPaymentLink(token);
  const publicToken = created.body?.data?.publicToken ?? created.body?.data?.token;
  if (publicToken && config.allowMutations) {
    publicPaymentLinkPay(publicToken, created.body?.data?.amount ?? 35);
  }
  return created;
}

export function listPaymentLinks(token) {
  return get('/v1/payment-links?page=1&pageSize=10', token, { scenario: 'payment-link-list' });
}
