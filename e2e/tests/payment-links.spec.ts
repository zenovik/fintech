import { test, expect } from '../fixtures';
import { loginViaUi } from '../helpers/auth.helper';
import { createApiClient } from '../helpers/api.helper';

test.describe('Payment Links', () => {
  test.beforeEach(async ({ page, adminUser }) => {
    await loginViaUi(page, adminUser);
  });

  test('payment links list loads', async ({ paymentLinksPage }) => {
    await paymentLinksPage.openList();
    await paymentLinksPage.expectListLoaded();
  });

  test('create payment link via API', async ({ request, adminUser }) => {
    const api = createApiClient(request);
    const auth = await api.login(adminUser.email, adminUser.password);
    const created = await api.createPaymentLink(auth.accessToken, auth.organizationId, 35);
    expect(created.status).toBe(201);
  });

  test('open public payment link page', async ({ request, adminUser, page }) => {
    const api = createApiClient(request);
    const auth = await api.login(adminUser.email, adminUser.password);
    const created = await api.createPaymentLink(auth.accessToken, auth.organizationId, 35);
    const token = created.body.data?.publicToken ?? created.body.data?.token;
    if (token) {
      await page.goto(`/pay/${token}`);
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('expire payment link via API', async ({ request, adminUser }) => {
    const api = createApiClient(request);
    const auth = await api.login(adminUser.email, adminUser.password);
    const created = await api.createPaymentLink(auth.accessToken, auth.organizationId, 20);
    const id = created.body.data?.id ?? created.body.data?.link?.id;
    const expire = await request.post(`http://localhost:3000/api/v1/payment-links/${id}/expire`, {
      headers: { Authorization: `Bearer ${auth.accessToken}`, 'X-Organization-Id': String(auth.organizationId) },
    });
    expect(expire.status()).toBe(200);
  });
});
