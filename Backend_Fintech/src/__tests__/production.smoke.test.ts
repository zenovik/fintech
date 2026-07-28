import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePagination, buildPaginationMeta } from '../app/shared/helpers/pagination.helper';
import { maskEmail, maskSensitiveObject } from '../app/shared/helpers/pii-mask.helper';

test('normalizePagination applies defaults and caps page size', () => {
  const result = normalizePagination({ page: 0, pageSize: 500 }, { defaultPageSize: 20, maxPageSize: 100 });
  assert.equal(result.page, 1);
  assert.equal(result.pageSize, 100);
  assert.equal(result.offset, 0);
});

test('buildPaginationMeta calculates total pages', () => {
  const meta = buildPaginationMeta(2, 10, 25);
  assert.equal(meta.totalPages, 3);
});

test('maskEmail redacts local part', () => {
  assert.match(maskEmail('user@example.com'), /\*\*\*@example\.com/);
});

test('maskSensitiveObject redacts password fields', () => {
  const masked = maskSensitiveObject({ email: 'a@b.com', password: 'secret123' }) as Record<string, string>;
  assert.equal(masked.password, '***REDACTED***');
});
