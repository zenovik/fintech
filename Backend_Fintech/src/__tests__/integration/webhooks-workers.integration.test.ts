import './integration-env.setup';
import test from 'node:test';
import assert from 'node:assert/strict';
import { registerIntegrationBootstrap, getIntegrationBaseUrl } from './helpers/bootstrap';
import { stubFetchSuccess, stubFetchFailure } from './helpers/harness-mocks';
import { createClient } from './helpers/client';
import { loginAdmin, enqueueBackgroundJob } from './helpers/auth';
import { MERCHANT, ORG, uniqueRef } from './helpers/fixtures';
import { claimBackgroundJobs, insertRow, queryOne } from './helpers/db';
import { processBackgroundJob, processRetryQueueItem } from '../../app/shared/workers/job-handlers';
import { webhookDeliveryProcessor } from '../../app/shared/webhooks/webhook-delivery.engine';
import { getWorkerState, runWorkerTickOnce } from '../../app/shared/workers/worker-runner';
import { getRedisClient } from '../../app/shared/infrastructure/redis.client';
import { trackBackgroundJob, trackRetryQueueItem, trackWebhook, trackWebhookDelivery } from './helpers/isolation';
import type { RowDataPacket } from 'mysql2/promise';
import { randomUUID } from 'node:crypto';

registerIntegrationBootstrap();

test('webhooks: create endpoint and delivery record', async () => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const webhook = await client.post('/api/v1/webhooks/endpoints', {
    merchantId: MERCHANT.org1Active,
    url: 'https://example.com/webhook',
    description: uniqueRef('WH'),
    eventTypes: ['payment.created'],
    isActive: true,
  }, ORG.merchantPro);
  assert.equal(webhook.status, 201);
  const webhookId = webhook.body.data?.webhook?.id ?? webhook.body.data?.id;
  trackWebhook(webhookId);
  const deliveryId = await insertRow(
    `INSERT INTO webhook_delivery_queue
       (uuid, webhook_id, merchant_id, event_type, payload, status, attempt_count, max_attempts)
     SELECT ?, w.id, w.merchant_id, 'payment.created', '{}', 'pending', 0, 5
     FROM merchant_webhooks w WHERE w.id = ?`,
    [randomUUID(), webhookId],
  );
  trackWebhookDelivery(deliveryId);
  assert.ok(deliveryId);
  const row = await queryOne<RowDataPacket>(
    'SELECT status FROM webhook_delivery_queue WHERE id = ?',
    [deliveryId],
  );
  assert.equal(row?.status, 'pending');
});

test('webhooks: delivery success via HTTP mock', async () => {
  const restore = stubFetchSuccess();
  try {
    const client = createClient(getIntegrationBaseUrl());
    await loginAdmin(client);
    const webhook = await client.post('/api/v1/webhooks/endpoints', {
      merchantId: MERCHANT.org1Active,
      url: 'https://example.com/hook-ok',
      eventTypes: ['payment.captured'],
    }, ORG.merchantPro);
    const webhookId = webhook.body.data?.webhook?.id ?? webhook.body.data?.id;
    trackWebhook(webhookId);
    const deliveryId = await insertRow(
      `INSERT INTO webhook_delivery_queue
         (uuid, webhook_id, merchant_id, event_type, payload, status, attempt_count, max_attempts)
       SELECT ?, w.id, w.merchant_id, 'payment.captured', '{"ok":true}', 'pending', 0, 5
       FROM merchant_webhooks w WHERE w.id = ?`,
      [randomUUID(), webhookId],
    );
    trackWebhookDelivery(deliveryId);
    const success = await webhookDeliveryProcessor.processQueueDelivery(deliveryId);
    assert.equal(success, true);
    const row = await queryOne<RowDataPacket>(
      'SELECT status, attempt_count FROM webhook_delivery_queue WHERE id = ?',
      [deliveryId],
    );
    assert.equal(row?.status, 'delivered');
    assert.ok(Number(row?.attempt_count) >= 1);
  } finally {
    restore();
  }
});

test('webhooks: delivery failure increments attempts and allows retry', async () => {
  const restore = stubFetchFailure(502);
  try {
    const client = createClient(getIntegrationBaseUrl());
    await loginAdmin(client);
    const webhook = await client.post('/api/v1/webhooks/endpoints', {
      merchantId: MERCHANT.org1Active,
      url: 'https://example.com/hook-fail',
      eventTypes: ['payment.created'],
    }, ORG.merchantPro);
    const webhookId = webhook.body.data?.webhook?.id ?? webhook.body.data?.id;
    trackWebhook(webhookId);
    const deliveryId = await insertRow(
      `INSERT INTO webhook_delivery_queue
         (uuid, webhook_id, merchant_id, event_type, payload, status, attempt_count, max_attempts)
       SELECT ?, w.id, w.merchant_id, 'payment.created', '{}', 'pending', 0, 5
       FROM merchant_webhooks w WHERE w.id = ?`,
      [randomUUID(), webhookId],
    );
    trackWebhookDelivery(deliveryId);
    const success = await webhookDeliveryProcessor.processQueueDelivery(deliveryId);
    assert.equal(success, false);
    const failed = await queryOne<RowDataPacket>(
      'SELECT status, attempt_count FROM webhook_delivery_queue WHERE id = ?',
      [deliveryId],
    );
    assert.equal(failed?.status, 'failed');
    assert.ok(Number(failed?.attempt_count) >= 1);

    const restoreOk = stubFetchSuccess();
    try {
      const retry = await client.post(`/api/v1/webhooks/deliveries/${deliveryId}/retry`, {
        reason: 'Integration retry',
      }, ORG.merchantPro);
      assert.equal(retry.status, 200);
    } finally {
      restoreOk();
    }
  } finally {
    restore();
  }
});

test('webhooks: replay on retry records history', async () => {
  const restore = stubFetchSuccess();
  try {
    const client = createClient(getIntegrationBaseUrl());
    await loginAdmin(client);
    const webhook = await client.post('/api/v1/webhooks/endpoints', {
      merchantId: MERCHANT.org1Active,
      url: 'https://example.com/replay',
      eventTypes: ['payment.created'],
    }, ORG.merchantPro);
    const webhookId = webhook.body.data?.webhook?.id ?? webhook.body.data?.id;
    trackWebhook(webhookId);
    const deliveryId = await insertRow(
      `INSERT INTO webhook_delivery_queue
         (uuid, webhook_id, merchant_id, event_type, payload, status, attempt_count, max_attempts)
       SELECT ?, w.id, w.merchant_id, 'payment.created', '{}', 'failed', 1, 5
       FROM merchant_webhooks w WHERE w.id = ?`,
      [randomUUID(), webhookId],
    );
    trackWebhookDelivery(deliveryId);
    const retried = await client.post(`/api/v1/webhooks/deliveries/${deliveryId}/retry`, {
      reason: 'Manual replay',
    }, ORG.merchantPro);
    assert.equal(retried.status, 200);
    assert.ok(Array.isArray(retried.body.data?.replays));
    assert.ok(retried.body.data.replays.length >= 1);
  } finally {
    restore();
  }
});

test('workers: background job execution', async () => {
  const jobId = await enqueueBackgroundJob('password_reset_email', {
    recipient: 'worker-test@example.com',
    resetUrl: 'https://example.com/reset',
    organizationId: ORG.merchantPro,
  });
  trackBackgroundJob(jobId);
  const result = await processBackgroundJob(jobId);
  assert.equal(result.success, true);
  const row = await queryOne<RowDataPacket>('SELECT status FROM background_jobs WHERE id = ?', [jobId]);
  assert.equal(row?.status, 'completed');
});

test('workers: retry queue processing completes item', async () => {
  const retryId = await insertRow(
    `INSERT INTO retry_queue (uuid, organization_id, entity_type, entity_id, operation, status, attempt_count, max_attempts, scheduled_at)
     VALUES (?, ?, 'email', '1', 'email_retry', 'pending', 0, 3, NOW())`,
    [randomUUID(), ORG.merchantPro],
  );
  trackRetryQueueItem(retryId);
  const result = await processRetryQueueItem(retryId);
  assert.equal(result.success, true);
  const row = await queryOne<RowDataPacket>(
    'SELECT status, processed_at FROM retry_queue WHERE id = ?',
    [retryId],
  );
  assert.equal(row?.status, 'completed');
  assert.ok(row?.processed_at);
});

test('workers: dead letter on unknown job type', async () => {
  const jobId = await enqueueBackgroundJob('unsupported_integration_job', { organizationId: ORG.merchantPro });
  trackBackgroundJob(jobId);
  const result = await processBackgroundJob(jobId);
  assert.equal(result.success, false);
  const row = await queryOne<RowDataPacket>(
    'SELECT status, error_message FROM background_jobs WHERE id = ?',
    [jobId],
  );
  assert.equal(row?.status, 'failed');
  assert.ok(row?.error_message);
});

test('workers: queue claiming uses FOR UPDATE pattern without duplicates', async () => {
  const ids = await Promise.all(
    Array.from({ length: 3 }, (_, i) =>
      enqueueBackgroundJob('password_reset_email', {
        recipient: `claim-test-${i}@example.com`,
        resetUrl: 'https://example.com/r',
        organizationId: ORG.merchantPro,
      }),
    ),
  );
  ids.forEach(trackBackgroundJob);
  const claimed = await claimBackgroundJobs(5);
  assert.equal(new Set(claimed).size, claimed.length);
  assert.ok(claimed.length >= 3);
  for (const id of claimed) {
    const row = await queryOne<RowDataPacket>('SELECT status FROM background_jobs WHERE id = ?', [id]);
    assert.equal(row?.status, 'running');
  }
});

test('workers: heartbeat via worker tick', async () => {
  const before = getWorkerState().ticksProcessed;
  await runWorkerTickOnce();
  const after = getWorkerState();
  assert.ok(after.ticksProcessed > before);
  assert.ok(after.lastTickAt);
  const heartbeat = await getRedisClient().get('worker:heartbeat');
  assert.ok(heartbeat);
});
