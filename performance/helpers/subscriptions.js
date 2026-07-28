import { get, post, assertOk, parseJson } from './http.js';
import { MERCHANT, CUSTOMER } from '../data/constants.js';
import { uniqueRef } from './random.js';
import { config } from '../config/env.js';

export function listSubscriptions(token) {
  return get('/v1/subscriptions?page=1&pageSize=10', token, { scenario: 'subscription-list' });
}

export function createSubscriptionPlan(token) {
  if (!config.allowMutations) return null;
  const res = post(
    '/v1/subscriptions/plans',
    token,
    {
      merchantId: MERCHANT.org1Active,
      name: uniqueRef('PERF-PLAN'),
      price: 29.99,
      currency: 'USD',
      billingInterval: 'monthly',
    },
    { scenario: 'subscription-plan-create' },
  );
  if (res.status !== 201) return null;
  return parseJson(res);
}

export function createSubscription(token, planId) {
  if (!config.allowMutations) return listSubscriptions(token);
  const res = post(
    '/v1/subscriptions',
    token,
    {
      merchantId: MERCHANT.org1Active,
      customerId: CUSTOMER.org1,
      planId,
      externalRef: uniqueRef('PERF-SUB'),
    },
    { scenario: 'subscription-create' },
  );
  assertOk(res, 'subscription create', [201, 400]);
  return { response: res, body: parseJson(res) };
}

export function subscriptionCreateFlow(token) {
  const plan = createSubscriptionPlan(token);
  const planId = plan?.data?.id ?? plan?.data?.plan?.id;
  if (planId) return createSubscription(token, planId);
  return listSubscriptions(token);
}

export function subscriptionStatistics(token) {
  return get('/v1/subscriptions/statistics', token, { scenario: 'subscription-stats' });
}
