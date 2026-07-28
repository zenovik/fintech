import { get, post, assertOk, parseJson } from './http.js';
import { MERCHANT } from '../data/constants.js';
import { uniqueRef } from './random.js';
import { webhookRetryDuration, recordDuration } from './metrics.js';
import { config } from '../config/env.js';

export function webhookDashboard(token) {
  return get('/v1/webhooks/dashboard', token, { scenario: 'webhook-dashboard' });
}

export function listWebhookDeliveries(token, page = 1) {
  return get(`/v1/webhooks/deliveries?page=${page}&pageSize=10`, token, { scenario: 'webhook-deliveries' });
}

export function createWebhookEndpoint(token) {
  if (!config.allowMutations) return null;
  const res = post(
    '/v1/webhooks/endpoints',
    token,
    {
      merchantId: MERCHANT.org1Active,
      url: `https://perf.example.com/hooks/${uniqueRef('WH')}`,
      description: 'k6 perf webhook',
      eventTypes: ['payment.created'],
      isActive: true,
    },
    { scenario: 'webhook-create' },
  );
  assertOk(res, 'webhook create', [201]);
  return parseJson(res);
}

export function retryWebhookDelivery(token, deliveryId, reason = 'k6 perf replay') {
  const start = Date.now();
  const res = post(
    `/v1/webhooks/deliveries/${deliveryId}/retry`,
    token,
    { reason },
    { scenario: 'webhook-replay' },
  );
  const ok = res.status === 200 || res.status === 404;
  recordDuration(webhookRetryDuration, Date.now() - start, ok);
  return res;
}

export function webhookReplayFlow(token) {
  const deliveries = listWebhookDeliveries(token);
  const body = parseJson(deliveries);
  const items = body?.data?.items ?? body?.data ?? [];
  const first = Array.isArray(items) ? items[0] : null;
  if (first?.id && config.allowMutations) {
    return retryWebhookDelivery(token, first.id);
  }
  webhookDashboard(token);
  return deliveries;
}
