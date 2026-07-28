/**
 * Global k6 thresholds — production readiness targets.
 */

export const thresholds = {
  http_req_failed: ['rate<0.01'],
  http_req_duration: [
    'avg<500',
    'med<400',
    'p(90)<500',
    'p(95)<500',
    'p(99)<1000',
  ],
  http_reqs: ['rate>0'],
  checks: ['rate>0.95'],
  iteration_duration: ['p(95)<30000'],

  // Per-scenario custom metrics (see helpers/metrics.js)
  payment_create_duration: ['p(95)<800'],
  payment_authorize_duration: ['p(95)<600'],
  payment_capture_duration: ['p(95)<600'],
  checkout_public_pay_duration: ['p(95)<1000'],
  login_duration: ['p(95)<800'],
  audit_search_duration: ['p(95)<700'],
};

export const stressThresholds = {
  http_req_failed: ['rate<0.05'],
  http_req_duration: ['p(95)<2000', 'p(99)<5000'],
};

export const soakThresholds = {
  http_req_failed: ['rate<0.01'],
  http_req_duration: ['p(95)<800', 'p(99)<1500'],
  iteration_duration: ['p(95)<45000'],
};
