import http from 'k6/http';
import { check } from 'k6';
import { apiUrl } from '../config/env.js';
import { authHeaders } from './auth.js';

const DEFAULT_PARAMS = {
  timeout: '30s',
};

export function get(path, token, tags = {}) {
  return http.get(apiUrl(path), {
    ...DEFAULT_PARAMS,
    headers: authHeaders(token),
    tags,
  });
}

export function post(path, token, body, tags = {}) {
  return http.post(apiUrl(path), JSON.stringify(body ?? {}), {
    ...DEFAULT_PARAMS,
    headers: authHeaders(token),
    tags,
  });
}

export function put(path, token, body, tags = {}) {
  return http.put(apiUrl(path), JSON.stringify(body ?? {}), {
    ...DEFAULT_PARAMS,
    headers: authHeaders(token),
    tags,
  });
}

export function patch(path, token, body, tags = {}) {
  return http.patch(apiUrl(path), JSON.stringify(body ?? {}), {
    ...DEFAULT_PARAMS,
    headers: authHeaders(token),
    tags,
  });
}

export function del(path, token, tags = {}) {
  return http.del(apiUrl(path), null, {
    ...DEFAULT_PARAMS,
    headers: authHeaders(token),
    tags,
  });
}

export function publicPost(path, body, tags = {}) {
  return http.post(apiUrl(path), JSON.stringify(body ?? {}), {
    ...DEFAULT_PARAMS,
    headers: { 'Content-Type': 'application/json' },
    tags,
  });
}

export function assertOk(res, name, expectedStatuses = [200, 201]) {
  return check(res, {
    [`${name} status`]: (r) => expectedStatuses.includes(r.status),
  });
}

export function parseJson(res) {
  try {
    return JSON.parse(res.body);
  } catch {
    return null;
  }
}

export function healthCheck() {
  return http.get(apiUrl('/health'), { tags: { scenario: 'health' } });
}

export function readyCheck() {
  return http.get(apiUrl('/ready'), { tags: { scenario: 'ready' } });
}

export function systemPerformance(token) {
  return get('/v1/system/performance', token, { scenario: 'system-performance' });
}

export function systemMetrics(token) {
  return get('/v1/system/metrics', token, { scenario: 'system-metrics' });
}
