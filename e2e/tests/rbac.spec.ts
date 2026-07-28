import { test, expect } from '../fixtures';
import { loginViaUi } from '../helpers/auth.helper';

test.describe('RBAC', () => {
  test('readonly user can view dashboard', async ({ page, readonlyUser, dashboardPage }) => {
    await loginViaUi(page, readonlyUser);
    await dashboardPage.open();
    await dashboardPage.expectLoaded();
  });

  test('readonly user cannot create merchant', async ({ page, readonlyUser, merchantPage }) => {
    await loginViaUi(page, readonlyUser);
    await merchantPage.openList();
    await expect(merchantPage.addMerchantButton()).toHaveCount(0);
  });

  test('readonly user cannot create refund request', async ({ page, readonlyUser, refundsPage }) => {
    await loginViaUi(page, readonlyUser);
    await refundsPage.openList();
    await expect(refundsPage.newRefundLink()).toHaveCount(0);
  });

  test('support user can view transactions', async ({ page, supportUser, paymentsPage }) => {
    await loginViaUi(page, supportUser);
    await paymentsPage.openList();
    await expect(paymentsPage.searchInput()).toBeVisible();
  });

  test('merchant admin can view merchant users', async ({ page, merchantAdminUser, merchantUsersPage }) => {
    await loginViaUi(page, merchantAdminUser);
    await merchantUsersPage.open();
    await merchantUsersPage.expectLoaded();
  });
});
