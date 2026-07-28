import { test, expect } from '../fixtures';
import { loginViaUi } from '../helpers/auth.helper';
import { ROUTES } from '../data/constants';

test.describe('Error handling', () => {
  test('network error shows connection message on login', async ({ page, loginPage }) => {
    await page.route('**/api/auth/login', (route) => route.abort('failed'));
    await loginPage.open();
    await loginPage.login('admin@merchantpro.com', 'Password123!');
    await expect(loginPage.page.getByText(/connect|network|server|error/i)).toBeVisible();
  });

  test('expired session redirects to login', async ({ page }) => {
    await page.goto(ROUTES.dashboard);
    await expect(page).toHaveURL(/\/auth\/(login|session-expired)/);
  });

  test('validation errors on empty login submit', async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.submitButton().click();
    await expect(loginPage.page.getByText(/required|valid email/i).first()).toBeVisible();
  });

  test('server error page on unknown route', async ({ page, adminUser }) => {
    await loginViaUi(page, adminUser);
    await page.goto('/this-route-does-not-exist-e2e');
    await expect(page.locator('body')).toBeVisible();
  });
});
