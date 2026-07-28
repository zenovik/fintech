import { get } from './http.js';
import { auditSearchDuration, recordDuration } from './metrics.js';
import { check } from 'k6';

export function auditSearch(token, page = 1, pageSize = 20) {
  const start = Date.now();
  const res = get(`/v1/audit?page=${page}&pageSize=${pageSize}`, token, { scenario: 'audit-search' });
  const ok = check(res, { 'audit search 200': (r) => r.status === 200 });
  recordDuration(auditSearchDuration, Date.now() - start, ok);
  return res;
}

export function auditApiLogs(token) {
  return get('/v1/audit/api-logs?page=1&pageSize=10', token, { scenario: 'audit-api-logs' });
}

export function auditWebhookLogs(token) {
  return get('/v1/audit/webhook-logs?page=1&pageSize=10', token, { scenario: 'audit-webhook-logs' });
}

export function auditCategories(token) {
  return get('/v1/audit/categories', token, { scenario: 'audit-categories' });
}

export function auditSearchFlow(token) {
  auditSearch(token);
  auditApiLogs(token);
  return auditCategories(token);
}
