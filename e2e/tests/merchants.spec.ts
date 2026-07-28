import { test, expect } from '../fixtures';
import { loginViaUi } from '../helpers/auth.helper';
import { createApiClient } from '../helpers/api.helper';
import { USERS } from '../data/users';
import { uniqueRef } from '../utils/unique';

test.describe('Merchants', () => {
  test.beforeEach(async ({ page, adminUser }) => {
    await loginViaUi(page, adminUser);
  });

  test('merchant list loads', async ({ merchantPage }) => {
    await merchantPage.openList();
    await expect(merchantPage.searchInput()).toBeVisible();
  });

  test('merchant create form opens', async ({ merchantPage }) => {
    await merchantPage.openCreate();
    await expect(merchantPage.page.getByLabel(/Legal Business Name/i)).toBeVisible();
  });

  test('merchant search filters results', async ({ merchantPage }) => {
    await merchantPage.openList();
    await merchantPage.search('MerchantPro');
    await expect(merchantPage.page.locator('table tbody tr').first()).toBeVisible();
  });

  test('merchant edit page opens from list', async ({ merchantPage }) => {
    await merchantPage.openList();
    const firstLink = merchantPage.page.locator('table tbody tr a').first();
    await firstLink.click();
    await expect(merchantPage.page).toHaveURL(/\/merchants\/\d+/);
  });

  test('organization isolation hides cross-org merchant', async ({ page, request }) => {
    const api = createApiClient(request);
    const auth = await api.login(USERS.admin.email, USERS.admin.password, 2);
    const res = await request.get('http://localhost:3000/api/v1/merchants/1', {
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        'X-Organization-Id': '2',
      },
    });
    expect([403, 404]).toContain(res.status());
  });
});

test.describe('Merchant API create', () => {
  test('create merchant via API and verify in UI list', async ({ page, adminUser, request }) => {
    const api = createApiClient(request);
    const auth = await api.login(adminUser.email, adminUser.password);
    const name = uniqueRef('E2E-MERCH-UI');
    const created = await api.createMerchant(auth.accessToken, auth.organizationId, name);
    expect(created.status).toBe(201);

    await loginViaUi(page, adminUser);
    const merchantPage = await import('../pages/merchant.page').then((m) => new m.MerchantPage(page));
    await merchantPage.openList();
    await merchantPage.search(name);
    await merchantPage.expectMerchantInTable(name);
  });
});
