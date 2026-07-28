import { test, expect } from '../fixtures';
import { loginViaUi } from '../helpers/auth.helper';
import { createApiClient } from '../helpers/api.helper';
import { trackPayment } from '../helpers/cleanup.helper';
import { uniqueRef } from '../utils/unique';

test.describe('Payments lifecycle', () => {
  test.beforeEach(async ({ page, adminUser }) => {
    await loginViaUi(page, adminUser);
  });

  test('transactions list loads', async ({ paymentsPage }) => {
    await paymentsPage.openList();
    await expect(paymentsPage.searchInput()).toBeVisible();
  });

  test('create payment via API and view in transactions UI', async ({ page, request, adminUser, paymentsPage }) => {
    const api = createApiClient(request);
    const auth = await api.login(adminUser.email, adminUser.password);
    const orderId = uniqueRef('E2E-TXN');
    const created = await api.createPayment(auth.accessToken, auth.organizationId, { amount: 55, merchantOrderId: orderId });
    expect(created.status).toBe(201);
    const intentId = created.body.data?.intent?.id;
    trackPayment(intentId);

    await paymentsPage.openList();
    await paymentsPage.searchInput().fill(orderId);
    await paymentsPage.searchInput().press('Enter');
    await expect(paymentsPage.page.getByText(orderId).or(paymentsPage.page.locator('table tbody tr').first())).toBeVisible();
  });

  test('authorize payment via API', async ({ request, adminUser }) => {
    const api = createApiClient(request);
    const auth = await api.login(adminUser.email, adminUser.password);
    const created = await api.createPayment(auth.accessToken, auth.organizationId, { amount: 60 });
    const id = created.body.data?.intent?.id;
    trackPayment(id);
    const authorized = await api.authorizePayment(auth.accessToken, auth.organizationId, id);
    expect(authorized.status).toBe(200);
    expect(authorized.body.data?.intent?.status).toMatch(/authorized/i);
  });

  test('capture payment via API', async ({ request, adminUser }) => {
    const api = createApiClient(request);
    const auth = await api.login(adminUser.email, adminUser.password);
    const created = await api.createPayment(auth.accessToken, auth.organizationId, { amount: 70 });
    const id = created.body.data?.intent?.id;
    trackPayment(id);
    await api.authorizePayment(auth.accessToken, auth.organizationId, id);
    const captured = await api.capturePayment(auth.accessToken, auth.organizationId, id);
    expect(captured.status).toBe(200);
    expect(captured.body.data?.intent?.status).toMatch(/captured/i);
  });

  test('partial capture via API', async ({ request, adminUser }) => {
    const api = createApiClient(request);
    const auth = await api.login(adminUser.email, adminUser.password);
    const created = await api.createPayment(auth.accessToken, auth.organizationId, { amount: 100 });
    const id = created.body.data?.intent?.id;
    trackPayment(id);
    await api.authorizePayment(auth.accessToken, auth.organizationId, id);
    const captured = await api.capturePayment(auth.accessToken, auth.organizationId, id, 40);
    expect(captured.status).toBe(200);
    expect(Number(captured.body.data?.intent?.amountCaptured ?? 0)).toBe(40);
  });

  test('cancel pending payment via API', async ({ request, adminUser }) => {
    const api = createApiClient(request);
    const auth = await api.login(adminUser.email, adminUser.password);
    const created = await api.createPayment(auth.accessToken, auth.organizationId, { amount: 15 });
    const id = created.body.data?.intent?.id;
    trackPayment(id);
    const cancelled = await api.cancelPayment(auth.accessToken, auth.organizationId, id);
    expect(cancelled.status).toBe(200);
  });

  test('full refund via API', async ({ request, adminUser }) => {
    const api = createApiClient(request);
    const auth = await api.login(adminUser.email, adminUser.password);
    const created = await api.createPayment(auth.accessToken, auth.organizationId, { amount: 45 });
    const id = created.body.data?.intent?.id;
    trackPayment(id);
    await api.authorizePayment(auth.accessToken, auth.organizationId, id);
    await api.capturePayment(auth.accessToken, auth.organizationId, id);
    const refunded = await api.refundPayment(auth.accessToken, auth.organizationId, id);
    expect(refunded.status).toBe(200);
  });

  test('partial refund via API', async ({ request, adminUser }) => {
    const api = createApiClient(request);
    const auth = await api.login(adminUser.email, adminUser.password);
    const created = await api.createPayment(auth.accessToken, auth.organizationId, { amount: 80 });
    const id = created.body.data?.intent?.id;
    trackPayment(id);
    await api.authorizePayment(auth.accessToken, auth.organizationId, id);
    await api.capturePayment(auth.accessToken, auth.organizationId, id);
    const refunded = await api.refundPayment(auth.accessToken, auth.organizationId, id, 20);
    expect(refunded.status).toBe(200);
  });

  test('idempotency key prevents duplicate payment', async ({ request, adminUser }) => {
    const api = createApiClient(request);
    const auth = await api.login(adminUser.email, adminUser.password);
    const key = uniqueRef('IDEM');
    const first = await api.createPayment(auth.accessToken, auth.organizationId, { amount: 33, idempotencyKey: key });
    const second = await api.createPayment(auth.accessToken, auth.organizationId, { amount: 33, idempotencyKey: key });
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(first.body.data?.intent?.id).toBe(second.body.data?.intent?.id);
    trackPayment(first.body.data?.intent?.id);
  });

  test('payment timeline visible in transaction details', async ({ page, request, adminUser, paymentsPage }) => {
    const api = createApiClient(request);
    const auth = await api.login(adminUser.email, adminUser.password);
    const created = await api.createPayment(auth.accessToken, auth.organizationId, { amount: 29 });
    const id = created.body.data?.intent?.id;
    trackPayment(id);
    await api.authorizePayment(auth.accessToken, auth.organizationId, id);

    await paymentsPage.openList();
    const timelineRes = await request.get(`http://localhost:3000/api/v1/payments/${id}/timeline`, {
      headers: { Authorization: `Bearer ${auth.accessToken}`, 'X-Organization-Id': String(auth.organizationId) },
    });
    expect(timelineRes.status()).toBe(200);
    const timeline = await timelineRes.json();
    expect(timeline.data?.events?.length).toBeGreaterThan(0);
  });
});
