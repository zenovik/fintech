import http from 'k6/http';
import { check } from 'k6';
import { apiUrl, config } from '../config/env.js';
import { loginDuration, recordDuration } from './metrics.js';

export function login(email = config.adminEmail, password = config.adminPassword) {
  const start = Date.now();
  const res = http.post(
    apiUrl('/auth/login'),
    JSON.stringify({ email, password, rememberDevice: false }),
    { headers: { 'Content-Type': 'application/json' }, tags: { scenario: 'login' } },
  );
  const ok = check(res, {
    'login status 200': (r) => r.status === 200,
    'login has token': (r) => {
      try {
        return !!JSON.parse(r.body).data?.accessToken;
      } catch {
        return false;
      }
    },
  });
  recordDuration(loginDuration, Date.now() - start, ok);
  if (!ok) return null;

  const body = JSON.parse(res.body);
  let accessToken = body.data.accessToken;

  if (body.data.requiresOrganizationSelection || !body.data.organizationId) {
    const orgRes = selectOrganization(accessToken, config.orgId);
    if (orgRes?.accessToken) accessToken = orgRes.accessToken;
  }

  return {
    accessToken,
    refreshToken: body.data.refreshToken,
    organizationId: config.orgId,
    user: body.data.user,
  };
}

export function selectOrganization(accessToken, organizationId = config.orgId) {
  const res = http.post(
    apiUrl('/auth/select-organization'),
    JSON.stringify({ organizationId }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'X-Organization-Id': String(organizationId),
      },
      tags: { scenario: 'select-organization' },
    },
  );
  if (res.status !== 200) return null;
  const body = JSON.parse(res.body);
  return body.data;
}

export function refreshToken(refreshTokenValue, organizationId = config.orgId) {
  const res = http.post(
    apiUrl('/auth/refresh-token'),
    JSON.stringify({ organizationId, refreshToken: refreshTokenValue }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { scenario: 'refresh-token' },
    },
  );
  return res;
}

export function logout(accessToken) {
  return http.post(apiUrl('/auth/logout'), JSON.stringify({}), {
    headers: authHeaders(accessToken),
    tags: { scenario: 'logout' },
  });
}

export function authHeaders(accessToken, organizationId = config.orgId) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
    'X-Organization-Id': String(organizationId),
  };
}

export function getMe(accessToken) {
  return http.get(apiUrl('/auth/me'), {
    headers: authHeaders(accessToken),
    tags: { scenario: 'auth-me' },
  });
}
