import { get, post, assertOk, parseJson } from './http.js';
import { MERCHANT } from '../data/constants.js';
import { reportGenerateDuration, recordDuration } from './metrics.js';
import { config } from '../config/env.js';

export function reportCenterCatalog(token) {
  return get('/v1/reports/center/catalog', token, { scenario: 'report-catalog' });
}

export function reportHistory(token) {
  return get('/v1/reports/history?page=1&pageSize=10', token, { scenario: 'report-history' });
}

export function generateReport(token) {
  const start = Date.now();
  const res = post(
    '/v1/reports/center/generate',
    token,
    {
      templateCode: 'transaction_summary',
      filters: {
        merchantId: MERCHANT.org1Active,
        dateFrom: '2026-01-01',
        dateTo: '2026-12-31',
      },
      format: 'json',
    },
    { scenario: 'report-generate' },
  );
  const ok = res.status === 200 || res.status === 201 || res.status === 404;
  recordDuration(reportGenerateDuration, Date.now() - start, ok);
  return res;
}

export function analyticsOverview(token) {
  return get('/v1/analytics/overview', token, { scenario: 'analytics-overview' });
}

export function reportGenerationFlow(token) {
  reportCenterCatalog(token);
  if (config.readOnly) return analyticsOverview(token);
  return generateReport(token);
}

export function listReports(token) {
  return get('/v1/reports?page=1&pageSize=10', token, { scenario: 'report-list' });
}
