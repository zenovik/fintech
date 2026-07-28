import { check } from 'k6';
import { get, post, put, patch, assertOk, parseJson } from './http.js';
import { MERCHANT } from '../data/constants.js';
import { uniqueRef, uniqueEmail } from './random.js';
import { config } from '../config/env.js';

export function listMerchants(token, page = 1, pageSize = 10) {
  return get(`/v1/merchants?page=${page}&pageSize=${pageSize}`, token, { scenario: 'merchant-list' });
}

export function searchMerchants(token, query = 'Merchant') {
  return get(`/v1/merchants/search?q=${encodeURIComponent(query)}`, token, { scenario: 'merchant-search' });
}

export function getMerchant(token, id = MERCHANT.org1Active) {
  return get(`/v1/merchants/${id}`, token, { scenario: 'merchant-get' });
}

export function createMerchant(token) {
  if (!config.allowMutations) return null;
  const legalName = uniqueRef('PERF-MERCH');
  const res = post(
    '/v1/merchants',
    token,
    {
      legalName,
      displayName: legalName,
      businessEmail: uniqueEmail('perf-merchant'),
      regionId: 1,
      status: 'active',
    },
    { scenario: 'merchant-create' },
  );
  assertOk(res, 'merchant create', [201]);
  return { response: res, body: parseJson(res), legalName };
}

export function updateMerchant(token, id, data) {
  if (!config.allowMutations) return null;
  return put(`/v1/merchants/${id}`, token, data, { scenario: 'merchant-update' });
}

export function disableMerchant(token, id) {
  if (!config.allowMutations) return null;
  return patch(`/v1/merchants/${id}/status`, token, { status: 'inactive', reason: 'perf test' }, { scenario: 'merchant-disable' });
}

export function merchantCrudFlow(token) {
  const created = createMerchant(token);
  if (!created?.body?.data?.id) return created;
  const id = created.body.data.id;
  updateMerchant(token, id, { displayName: `${created.legalName} Updated` });
  return created;
}

export function merchantSearchFlow(token) {
  const res = searchMerchants(token, 'Velocity');
  check(res, { 'merchant search ok': (r) => r.status === 200 });
  return res;
}
