import { test, expect } from '../fixtures';
import { loginViaUi } from '../helpers/auth.helper';

test.describe('Responsive layouts', () => {
  test('dashboard renders on desktop', async ({ page, adminUser, dashboardPage }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await loginViaUi(page, adminUser);
    await dashboardPage.open();
    await dashboardPage.expectLoaded();
    await expect(page.locator('.dash-main, .dash-content')).toBeVisible();
  });

  test('dashboard renders on tablet', async ({ page, adminUser, dashboardPage }) => {
    await page.setViewportSize({ width: 834, height: 1194 });
    await loginViaUi(page, adminUser);
    await dashboardPage.open();
    await dashboardPage.expectLoaded();
    await expect(page.locator('.dash-mobile-nav, .dash-main')).toBeVisible();
  });

  test('login form renders on tablet', async ({ page, loginPage }) => {
    await page.setViewportSize({ width: 834, height: 1194 });
    await loginPage.open();
    await loginPage.expectLoginForm();
  });

  test('merchants list renders on tablet', async ({ page, adminUser, merchantPage }) => {
    await page.setViewportSize({ width: 834, height: 1194 });
    await loginViaUi(page, adminUser);
    await merchantPage.openList();
    await expect(merchantPage.searchInput()).toBeVisible();
  });
});
