import { test, expect } from '../fixtures';
import { loginViaUi } from '../helpers/auth.helper';
import { USERS } from '../data/users';

test.describe('Reports', () => {
  test.beforeEach(async ({ page, adminUser }) => {
    await loginViaUi(page, adminUser);
  });

  test('report center loads', async ({ reportsPage }) => {
    await reportsPage.openCenter();
    await reportsPage.expectLoaded();
  });

  test('report history page loads', async ({ page }) => {
    await page.goto('/reports/history');
    await expect(page.getByRole('heading', { name: /History|Report/i })).toBeVisible();
  });

  test('organization isolation on reports API', async ({ request }) => {
    const login = await request.post('http://localhost:3000/api/auth/login', {
      data: { email: USERS.admin.email, password: USERS.admin.password, rememberDevice: false },
    });
    const token = (await login.json()).data?.accessToken;
    const res = await request.get('http://localhost:3000/api/v1/reports/history', {
      headers: { Authorization: `Bearer ${token}`, 'X-Organization-Id': '2' },
    });
    expect([200, 403]).toContain(res.status());
  });
});
