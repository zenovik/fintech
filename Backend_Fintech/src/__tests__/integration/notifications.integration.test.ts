import './integration-env.setup';
import test from 'node:test';
import assert from 'node:assert/strict';
import { registerIntegrationBootstrap, getIntegrationBaseUrl } from './helpers/bootstrap';
import { createClient } from './helpers/client';
import { loginAdmin, getUserIdByEmail } from './helpers/auth';
import { ORG, USERS, uniqueRef } from './helpers/fixtures';
import { claimNotificationEmails, insertRow } from './helpers/db';
import { trackNotification } from './helpers/isolation';
import { randomUUID } from 'node:crypto';

registerIntegrationBootstrap();

test('notifications: list in-app notifications', async () => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const res = await client.get('/api/v1/notifications?page=1&pageSize=10', ORG.merchantPro);
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.data?.items));
});

test('notifications: unread count', async () => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const res = await client.get('/api/v1/notifications/unread-count', ORG.merchantPro);
  assert.equal(res.status, 200);
  assert.equal(typeof (res.body.data?.count ?? res.body.data?.unreadCount ?? 0), 'number');
});

test('notifications: mark notification read', async () => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const userId = await getUserIdByEmail(USERS.admin.email);
  const notificationId = await insertRow(
    `INSERT INTO notifications (uuid, user_id, event_code, category, title, body, status)
     VALUES (?, ?, ?, 'system', ?, ?, 'unread')`,
    [randomUUID(), userId, uniqueRef('NOTIF'), 'Integration test', 'Mark read validation'],
  );
  trackNotification(notificationId);

  const res = await client.patch(`/api/v1/notifications/${notificationId}/read`, {}, ORG.merchantPro);
  assert.equal(res.status, 200);
  assert.equal(res.body.data?.status ?? res.body.data?.notification?.status, 'read');
});

test('notifications: email channel listing', async () => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const res = await client.get('/api/v1/notifications/channels', ORG.merchantPro);
  assert.equal(res.status, 200);
});

test('notifications: email claiming pattern returns pending deliveries', async () => {
  const claimed = await claimNotificationEmails(5);
  assert.ok(Array.isArray(claimed));
  for (const id of claimed) {
    assert.ok(Number.isFinite(id));
  }
});
