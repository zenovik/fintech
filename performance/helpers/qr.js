import { post, publicPost, get, assertOk, parseJson } from './http.js';
import { MERCHANT } from '../data/constants.js';
import { uniqueRef, randomAmount } from './random.js';
import { config } from '../config/env.js';

export function createQrPayment(token) {
  if (!config.allowMutations) return get('/v1/qr-payments?page=1&pageSize=5', token, { scenario: 'qr-list' });
  const res = post(
    '/v1/qr-payments',
    token,
    {
      merchantId: MERCHANT.org1Active,
      title: uniqueRef('PERF-QR'),
      amount: randomAmount(10, 80),
      currency: 'USD',
      qrType: 'static',
    },
    { scenario: 'qr-create' },
  );
  assertOk(res, 'qr create', [201]);
  return { response: res, body: parseJson(res) };
}

export function publicQrPay(token, publicToken, amount) {
  return publicPost(
    `/v1/public/qr-payments/${publicToken}/pay`,
    { amount, paymentMethodDetail: 'k6 perf' },
    { scenario: 'qr-public-pay' },
  );
}

export function qrPaymentFlow(token) {
  const created = createQrPayment(token);
  const publicToken = created.body?.data?.publicToken ?? created.body?.data?.token;
  if (publicToken && config.allowMutations) {
    publicQrPay(token, publicToken, created.body?.data?.amount ?? 25);
  }
  return created;
}

export function listQrPayments(token) {
  return get('/v1/qr-payments?page=1&pageSize=10', token, { scenario: 'qr-list' });
}
