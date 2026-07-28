import './test-env.setup';
import test from 'node:test';
import assert from 'node:assert/strict';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { buildPasswordResetUrl } from '../app/shared/helpers/password-reset.helper';
import { mapEventCodeToNotificationPreferenceType } from '../app/shared/helpers/notification-preference.helper';
import { requireOrgId } from '../app/shared/helpers/tenant-scope.helper';
import { appendOrgFilter, orgContextStorage } from '../app/shared/context/org-context';
import { canTransition } from '../app/modules/payments/constants/payment-status';
import { deliverWebhookHttp } from '../app/shared/webhooks/webhook-delivery.engine';
import { processBackgroundJob, processRetryQueueItem } from '../app/shared/workers/job-handlers';

test('buildPasswordResetUrl encodes token and uses frontend path', () => {
  const url = buildPasswordResetUrl('https://portal.example.com/', 'abc+token/value');
  assert.equal(url, 'https://portal.example.com/auth/reset-password?token=abc%2Btoken%2Fvalue');
  assert.doesNotMatch(url, /abc\+token/);
});

test('mapEventCodeToNotificationPreferenceType maps security and settlement events', () => {
  assert.equal(mapEventCodeToNotificationPreferenceType('password_changed'), 'security_alerts');
  assert.equal(mapEventCodeToNotificationPreferenceType('settlement_completed'), 'settlement_reports');
  assert.equal(mapEventCodeToNotificationPreferenceType('payment.captured'), 'transaction_updates');
});

test('requireOrgId rejects requests without tenant context', () => {
  assert.throws(() => requireOrgId(), /Organization context is required/);
  orgContextStorage.run({ organizationId: 42, organizationRoleCode: 'admin' }, () => {
    assert.equal(requireOrgId(), 42);
  });
});

test('appendOrgFilter scopes queries to active organization', () => {
  const conditions: string[] = [];
  const params: unknown[] = [];
  appendOrgFilter(conditions, params, 'm.organization_id');
  assert.equal(conditions.length, 0);

  orgContextStorage.run({ organizationId: 7, organizationRoleCode: 'member' }, () => {
    appendOrgFilter(conditions, params, 'm.organization_id');
  });
  assert.equal(conditions[0], 'm.organization_id = ?');
  assert.deepEqual(params, [7]);
});

test('canTransition allows payment create to authorize path', () => {
  assert.equal(canTransition('pending', 'authorized'), true);
  assert.equal(canTransition('pending', 'captured'), false);
  assert.equal(canTransition('authorized', 'captured'), true);
});

test('deliverWebhookHttp records HTTP success from fetch', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response('ok', { status: 200, headers: { 'Content-Type': 'text/plain' } });

  try {
    const result = await deliverWebhookHttp({
      url: 'https://example.com/webhook',
      payload: { event: 'payment.created' },
      eventType: 'payment.created',
    });
    assert.equal(result.success, true);
    assert.equal(result.statusCode, 200);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('deliverWebhookHttp records HTTP failure from fetch', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response('bad gateway', { status: 502, headers: { 'Content-Type': 'text/plain' } });

  try {
    const result = await deliverWebhookHttp({
      url: 'https://example.com/webhook',
      payload: { event: 'payment.failed' },
      eventType: 'payment.failed',
    });
    assert.equal(result.success, false);
    assert.equal(result.statusCode, 502);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

function mockBackgroundJobPool(jobType: string, payload: Record<string, unknown> | null = null): Pool {
  const updates: string[] = [];
  return {
    query: async (sql: string) => {
      if (sql.includes('SELECT * FROM background_jobs')) {
        return [[{
          id: 99,
          job_type: jobType,
          payload: payload ? JSON.stringify(payload) : null,
          organization_id: null,
        } as RowDataPacket], []];
      }
      updates.push(sql);
      return [{ affectedRows: 1 }, []];
    },
  } as unknown as Pool;
}

test('processBackgroundJob marks unknown job types as failed', async () => {
  const pool = mockBackgroundJobPool('unsupported_job_type');
  const result = await processBackgroundJob(99, pool);
  assert.equal(result.success, false);
  assert.match(result.error ?? '', /Unknown background job type/);
});

test('processBackgroundJob rejects password reset email without payload', async () => {
  const pool = mockBackgroundJobPool('password_reset_email', { recipient: '', resetUrl: '' });
  const result = await processBackgroundJob(99, pool);
  assert.equal(result.success, false);
  assert.match(result.error ?? '', /Missing password reset email payload/);
});

test('processRetryQueueItem skips duplicate attempt increment when already processing', async () => {
  let incrementCalled = false;
  const pool = {
    query: async (sql: string) => {
      if (sql.includes('SELECT * FROM retry_queue')) {
        return [[{
          id: 5,
          status: 'processing',
          attempt_count: 2,
          max_attempts: 5,
          entity_type: 'email',
          operation: 'email_retry',
          payload: null,
        } as RowDataPacket], []];
      }
      if (sql.includes('attempt_count = attempt_count + 1')) {
        incrementCalled = true;
      }
      return [{ affectedRows: 1 }, []];
    },
  } as unknown as Pool;

  await processRetryQueueItem(5, pool);
  assert.equal(incrementCalled, false);
});

test('organization merchant scope throws when merchant is outside tenant', async () => {
  const { assertMerchantInOrg } = await import('../app/shared/helpers/tenant-scope.helper');
  const pool = {
    query: async () => [[], []],
  } as unknown as Pool;

  await assert.rejects(
    () => assertMerchantInOrg(10, 1, pool),
    /Merchant does not belong to this organization/,
  );
});
