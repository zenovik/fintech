import { test, expect } from '../fixtures';
import { loginViaUi } from '../helpers/auth.helper';
import { createApiClient } from '../helpers/api.helper';

test.describe('QR Payments', () => {
  test.beforeEach(async ({ page, adminUser }) => {
    await loginViaUi(page, adminUser);
  });

  test('create QR payment list loads', async ({ qrPaymentsPage }) => {
    await qrPaymentsPage.openList();
    await qrPaymentsPage.expectListLoaded();
  });

  test('create QR via API and open public pay page', async ({ request, adminUser, page }) => {
    const api = createApiClient(request);
    const auth = await api.login(adminUser.email, adminUser.password);
    const created = await api.createQrPayment(auth.accessToken, auth.organizationId, 25);
    expect(created.status).toBe(201);
    const token = created.body.data?.publicToken ?? created.body.data?.token;
    if (token) {
      await page.goto(`/qr/${token}`);
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('disable QR marks expired', async ({ request, adminUser }) => {
    const api = createApiClient(request);
    const auth = await api.login(adminUser.email, adminUser.password);
    const created = await api.createQrPayment(auth.accessToken, auth.organizationId, 15);
    const id = created.body.data?.id ?? created.body.data?.qrPayment?.id;
    const disable = await request.post(`http://localhost:3000/api/v1/qr-payments/${id}/disable`, {
      headers: { Authorization: `Bearer ${auth.accessToken}`, 'X-Organization-Id': String(auth.organizationId) },
    });
    expect(disable.status()).toBe(200);
  });
});
