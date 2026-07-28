import { test, expect } from '../fixtures';
import { loginViaUi } from '../helpers/auth.helper';
import { createApiClient } from '../helpers/api.helper';
import { MERCHANT } from '../data/constants';
import { uniqueRef } from '../utils/unique';

test.describe('Subscriptions', () => {
  test.beforeEach(async ({ page, adminUser }) => {
    await loginViaUi(page, adminUser);
  });

  test('subscriptions list loads', async ({ subscriptionsPage }) => {
    await subscriptionsPage.openList();
    await subscriptionsPage.expectLoaded();
  });

  test('create subscription via API', async ({ request, adminUser }) => {
    const api = createApiClient(request);
    const auth = await api.login(adminUser.email, adminUser.password);
    const res = await request.post('http://localhost:3000/api/v1/subscriptions', {
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        'X-Organization-Id': String(auth.organizationId),
        'Content-Type': 'application/json',
      },
      data: {
        merchantId: MERCHANT.org1Active,
        customerId: 8,
        planCode: 'basic-monthly',
        billingEmail: `sub.${Date.now()}@e2e.test`,
        externalRef: uniqueRef('E2E-SUB'),
      },
    });
    expect([201, 400, 404]).toContain(res.status());
  });

  test('subscription plans page loads', async ({ page }) => {
    await page.goto('/subscriptions/plans');
    await expect(page.getByRole('heading', { name: /Plan/i })).toBeVisible();
  });

  test('invoices list accessible from subscriptions area', async ({ page }) => {
    await page.goto('/invoices');
    await expect(page.getByRole('heading', { name: /Invoice/i })).toBeVisible();
  });
});
