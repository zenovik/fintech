import { Trend, Counter, Rate, Gauge } from 'k6/metrics';

export const loginDuration = new Trend('login_duration', true);
export const paymentCreateDuration = new Trend('payment_create_duration', true);
export const paymentAuthorizeDuration = new Trend('payment_authorize_duration', true);
export const paymentCaptureDuration = new Trend('payment_capture_duration', true);
export const checkoutPublicPayDuration = new Trend('checkout_public_pay_duration', true);
export const auditSearchDuration = new Trend('audit_search_duration', true);
export const webhookRetryDuration = new Trend('webhook_retry_duration', true);
export const reportGenerateDuration = new Trend('report_generate_duration', true);

export const scenarioErrors = new Counter('scenario_errors');
export const scenarioSuccess = new Counter('scenario_success');
export const timeoutErrors = new Counter('timeout_errors');
export const degradationEvents = new Counter('degradation_events');

export const failureRate = new Rate('custom_failure_rate');
export const rpsGauge = new Gauge('custom_rps');

export function recordDuration(metric, ms, ok) {
  metric.add(ms);
  if (ok) scenarioSuccess.add(1);
  else scenarioErrors.add(1);
  failureRate.add(!ok);
}

export function recordTimeout() {
  timeoutErrors.add(1);
  failureRate.add(true);
}
