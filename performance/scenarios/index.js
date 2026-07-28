import { sleep } from 'k6';
import { group } from 'k6';
import { config } from '../config/env.js';
import { login, refreshToken, getMe } from '../helpers/auth.js';
import { analyticsOverview } from '../helpers/reports.js';
import { listMerchants, merchantCrudFlow, merchantSearchFlow } from '../helpers/merchants.js';
import {
  createPayment,
  authorizePayment,
  capturePayment,
  partialCapturePayment,
  refundPayment,
  fullPaymentLifecycle,
} from '../helpers/payments.js';
import { checkoutFlow, listCheckoutSessions } from '../helpers/checkout.js';
import { qrPaymentFlow, listQrPayments } from '../helpers/qr.js';
import { paymentLinkFlow, listPaymentLinks } from '../helpers/payment-links.js';
import { webhookReplayFlow, webhookDashboard } from '../helpers/webhooks.js';
import { subscriptionCreateFlow, listSubscriptions } from '../helpers/subscriptions.js';
import { reportGenerationFlow } from '../helpers/reports.js';
import { auditSearchFlow } from '../helpers/audit.js';
import { healthCheck, systemMetrics, systemPerformance } from '../helpers/http.js';

/**
 * Weighted scenario mix for realistic load distribution.
 */
const SCENARIO_WEIGHTS = [
  { name: 'login', weight: 8, fn: (ctx) => scenarioLogin(ctx) },
  { name: 'dashboard', weight: 12, fn: (ctx) => scenarioDashboard(ctx) },
  { name: 'merchant-list', weight: 8, fn: (ctx) => scenarioMerchantList(ctx) },
  { name: 'merchant-search', weight: 6, fn: (ctx) => scenarioMerchantSearch(ctx) },
  { name: 'merchant-crud', weight: 4, fn: (ctx) => scenarioMerchantCrud(ctx) },
  { name: 'payment-create', weight: 14, fn: (ctx) => scenarioPaymentCreate(ctx) },
  { name: 'payment-authorize', weight: 10, fn: (ctx) => scenarioPaymentAuthorize(ctx) },
  { name: 'payment-capture', weight: 10, fn: (ctx) => scenarioPaymentCapture(ctx) },
  { name: 'payment-partial-capture', weight: 5, fn: (ctx) => scenarioPartialCapture(ctx) },
  { name: 'payment-refund', weight: 5, fn: (ctx) => scenarioPaymentRefund(ctx) },
  { name: 'checkout', weight: 8, fn: (ctx) => scenarioCheckout(ctx) },
  { name: 'qr', weight: 5, fn: (ctx) => scenarioQr(ctx) },
  { name: 'payment-links', weight: 5, fn: (ctx) => scenarioPaymentLinks(ctx) },
  { name: 'webhook-replay', weight: 4, fn: (ctx) => scenarioWebhookReplay(ctx) },
  { name: 'subscription', weight: 3, fn: (ctx) => scenarioSubscription(ctx) },
  { name: 'reports', weight: 4, fn: (ctx) => scenarioReports(ctx) },
  { name: 'audit', weight: 4, fn: (ctx) => scenarioAudit(ctx) },
];

function pickScenario() {
  const total = SCENARIO_WEIGHTS.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (const s of SCENARIO_WEIGHTS) {
    r -= s.weight;
    if (r <= 0) return s;
  }
  return SCENARIO_WEIGHTS[0];
}

export function runMixedScenario(ctx) {
  const scenario = pickScenario();
  group(scenario.name, () => scenario.fn(ctx));
  sleep(Math.random() * 1.5 + 0.3);
}

export function runAllScenariosOnce(ctx) {
  for (const s of SCENARIO_WEIGHTS) {
    group(s.name, () => s.fn(ctx));
  }
}

function token(ctx) {
  return ctx?.accessToken;
}

export function scenarioLogin(ctx) {
  if (config.readOnly) {
    healthCheck();
    return;
  }
  const session = login();
  if (session?.refreshToken) refreshToken(session.refreshToken);
}

export function scenarioDashboard(ctx) {
  analyticsOverview(token(ctx));
  getMe(token(ctx));
}

export function scenarioMerchantList(ctx) {
  listMerchants(token(ctx));
}

export function scenarioMerchantSearch(ctx) {
  merchantSearchFlow(token(ctx));
}

export function scenarioMerchantCrud(ctx) {
  if (config.readOnly) {
    listMerchants(token(ctx));
    return;
  }
  merchantCrudFlow(token(ctx));
}

export function scenarioPaymentCreate(ctx) {
  createPayment(token(ctx));
}

export function scenarioPaymentAuthorize(ctx) {
  const created = createPayment(token(ctx));
  if (created.intentId) authorizePayment(token(ctx), created.intentId);
}

export function scenarioPaymentCapture(ctx) {
  fullPaymentLifecycle(token(ctx));
}

export function scenarioPartialCapture(ctx) {
  const created = createPayment(token(ctx), { amount: 100 });
  if (created.intentId) partialCapturePayment(token(ctx), created.intentId, 100);
}

export function scenarioPaymentRefund(ctx) {
  const created = createPayment(token(ctx), { amount: 75 });
  if (!created.intentId) return;
  authorizePayment(token(ctx), created.intentId);
  capturePayment(token(ctx), created.intentId);
  refundPayment(token(ctx), created.intentId, 25);
}

export function scenarioCheckout(ctx) {
  if (config.readOnly) {
    listCheckoutSessions(token(ctx));
    return;
  }
  checkoutFlow(token(ctx));
}

export function scenarioQr(ctx) {
  if (config.readOnly) {
    listQrPayments(token(ctx));
    return;
  }
  qrPaymentFlow(token(ctx));
}

export function scenarioPaymentLinks(ctx) {
  if (config.readOnly) {
    listPaymentLinks(token(ctx));
    return;
  }
  paymentLinkFlow(token(ctx));
}

export function scenarioWebhookReplay(ctx) {
  webhookReplayFlow(token(ctx));
}

export function scenarioSubscription(ctx) {
  if (config.readOnly) {
    listSubscriptions(token(ctx));
    return;
  }
  subscriptionCreateFlow(token(ctx));
}

export function scenarioReports(ctx) {
  reportGenerationFlow(token(ctx));
}

export function scenarioAudit(ctx) {
  auditSearchFlow(token(ctx));
}

export function scenarioHealth(ctx) {
  healthCheck();
  if (token(ctx)) {
    systemMetrics(token(ctx));
    systemPerformance(token(ctx));
  }
}

export function scenarioSoakMonitoring(ctx) {
  scenarioHealth(ctx);
  webhookDashboard(token(ctx));
  sleep(2);
}

export { SCENARIO_WEIGHTS };
