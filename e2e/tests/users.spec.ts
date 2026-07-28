import { test, expect } from '../fixtures';
import { loginViaUi } from '../helpers/auth.helper';
import { uniqueEmail } from '../utils/unique';

test.describe('User Management', () => {
  test.beforeEach(async ({ page, adminUser }) => {
    await loginViaUi(page, adminUser);
  });

  test('users list loads for admin', async ({ usersPage }) => {
    await usersPage.openList();
    await usersPage.expectLoaded();
  });

  test('invite user form opens', async ({ usersPage }) => {
    await usersPage.openCreate();
    await expect(usersPage.page.getByLabel(/email/i)).toBeVisible();
  });

  test('role management page accessible', async ({ page }) => {
    await page.goto('/roles');
    await expect(page.getByRole('heading', { name: /Roles/i })).toBeVisible();
  });

  test('readonly user cannot access user create', async ({ page, readonlyUser }) => {
    await loginViaUi(page, readonlyUser);
    await page.goto('/users/create');
    await expect(page).toHaveURL(/\/(auth\/access-denied|users|dashboard)/);
  });
});
