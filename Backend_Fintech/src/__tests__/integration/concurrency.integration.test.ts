import './integration-env.setup';
import test from 'node:test';
import assert from 'node:assert/strict';
import { registerIntegrationBootstrap, getIntegrationBaseUrl } from './helpers/bootstrap';
import { stubFetchSuccess } from './helpers/harness-mocks';
import { createClient } from './helpers/client';
import { loginAdmin, enqueueBackgroundJob } from './helpers/auth';
import { CUSTOMER, MERCHANT, ORG, uniqueRef } from './helpers/fixtures';
import { claimBackgroundJobs, claimNotificationEmails, insertRow, queryOne } from './helpers/db';
import { processBackgroundJob } from '../../app/shared/workers/job-handlers';
import { webhookDeliveryProcessor } from '../../app/shared/webhooks/webhook-delivery.engine';
import { trackBackgroundJob, trackPaymentIntent, trackWebhook, trackWebhookDelivery } from './helpers/isolation';
import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';

registerIntegrationBootstrap();

test('concurrency: parallel payment creates', async () => {
  const base = getIntegrationBaseUrl();
  const clients = await Promise.all(
    Array.from({ length: 5 }, async () => {
      const c = createClient(base);
      await loginAdmin(c);
      return c;
    }),
  );
  const orderIds = Array.from({ length: 5 }, (_, i) => uniqueRef(`CONC-PAY-${i}`));
  const results = await Promise.all(
    clients.map((c, i) =>
      c.post('/api/v1/payments', {
        merchantId: MERCHANT.org1Active,
        amount: 10 + i,
        merchantOrderId: orderIds[i],
        customerId: CUSTOMER.org1,
      }, ORG.merchantPro),
    ),
  );
  const successes = results.filter((r) => r.status === 201);
  assert.equal(successes.length, 5);
  successes.forEach((r) => trackPaymentIntent(r.body.data?.intent?.id));
  assert.equal(new Set(orderIds).size, 5);
});

test('concurrency: parallel capture attempts on single payment', async () => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const created = await client.post('/api/v1/payments', {
    merchantId: MERCHANT.org1Active,
    amount: 80,
    merchantOrderId: uniqueRef('CONC-CAP'),
  }, ORG.merchantPro);
  const id = created.body.data?.intent?.id ?? created.body.data?.id;
  trackPaymentIntent(id);
  await client.post(`/api/v1/payments/${id}/authorize`, {}, ORG.merchantPro);
  const captures = await Promise.all([
    client.post(`/api/v1/payments/${id}/capture`, {}, ORG.merchantPro),
    client.post(`/api/v1/payments/${id}/capture`, {}, ORG.merchantPro),
  ]);
  const ok = captures.filter((r) => r.status === 200).length;
  assert.equal(ok, 1);
  const row = await queryOne<RowDataPacket>(
    'SELECT status, amount_captured FROM payment_intents WHERE id = ?',
    [id],
  );
  assert.equal(row?.status, 'captured');
  assert.equal(Number(row?.amount_captured), 80);
});

test('concurrency: parallel webhook delivery processing', async () => {
  const restore = stubFetchSuccess();
  try {
    const client = createClient(getIntegrationBaseUrl());
    await loginAdmin(client);
    const webhook = await client.post('/api/v1/webhooks/endpoints', {
      merchantId: MERCHANT.org1Active,
      url: 'https://example.com/concurrent',
      eventTypes: ['payment.created'],
    }, ORG.merchantPro);
    const webhookId = webhook.body.data?.webhook?.id ?? webhook.body.data?.id;
    trackWebhook(webhookId);
    const ids = await Promise.all(
      Array.from({ length: 3 }, () =>
        insertRow(
          `INSERT INTO webhook_delivery_queue
             (uuid, webhook_id, merchant_id, event_type, payload, status, attempt_count, max_attempts)
           SELECT ?, w.id, w.merchant_id, 'payment.created', '{}', 'pending', 0, 5
           FROM merchant_webhooks w WHERE w.id = ?`,
          [randomUUID(), webhookId],
        ),
      ),
    );
    ids.forEach(trackWebhookDelivery);
    const results = await Promise.all(ids.map((id) => webhookDeliveryProcessor.processQueueDelivery(id)));
    assert.equal(results.filter(Boolean).length, 3);
    assert.equal(new Set(ids).size, 3);
  } finally {
    restore();
  }
});

test('concurrency: parallel queue claiming has no duplicate job ids', async () => {
  const jobIds = await Promise.all(
    Array.from({ length: 5 }, (_, i) =>
      enqueueBackgroundJob('password_reset_email', {
        recipient: `conc-${i}@example.com`,
        resetUrl: 'https://example.com/r',
        organizationId: ORG.merchantPro,
      }),
    ),
  );
  jobIds.forEach(trackBackgroundJob);
  const claims = await Promise.all([
    claimBackgroundJobs(3),
    claimBackgroundJobs(3),
    claimBackgroundJobs(3),
  ]);
  const allClaimed = claims.flat();
  assert.equal(new Set(allClaimed).size, allClaimed.length);
  assert.equal(allClaimed.length, 5);
});

test('concurrency: parallel notification claiming returns arrays', async () => {
  const claims = await Promise.all([
    claimNotificationEmails(3),
    claimNotificationEmails(3),
    claimNotificationEmails(3),
  ]);
  assert.ok(claims.every(Array.isArray));
});

test('concurrency: parallel worker job processing completes all jobs', async () => {
  const ids = await Promise.all(
    Array.from({ length: 3 }, (_, i) =>
      enqueueBackgroundJob('password_reset_email', {
        recipient: `worker-conc-${i}@example.com`,
        resetUrl: 'https://example.com/r',
        organizationId: ORG.merchantPro,
      }),
    ),
  );
  ids.forEach(trackBackgroundJob);
  const results = await Promise.all(ids.map((id) => processBackgroundJob(id)));
  assert.equal(results.filter((r) => r.success).length, 3);
  for (const id of ids) {
    const row = await queryOne<RowDataPacket>('SELECT status FROM background_jobs WHERE id = ?', [id]);
    assert.equal(row?.status, 'completed');
  }
});
