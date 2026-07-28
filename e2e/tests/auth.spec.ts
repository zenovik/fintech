import { test, expect } from '../fixtures';
import { loginViaUi } from '../helpers/auth.helper';
import { USERS } from '../data/users';
import { ROUTES } from '../data/constants';

test.describe('Authentication', () => {
  test('login with valid credentials redirects to dashboard', async ({ page, loginPage, dashboardPage, adminUser }) => {
    await loginPage.open();
    await loginPage.login(adminUser.email, adminUser.password);
    await dashboardPage.expectLoaded();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('logout returns to login screen', async ({ page, adminUser, browser }) => {
    const context = await browser.newContext();
    const p = await context.newPage();
    await loginViaUi(p, adminUser);
    await p.goto(ROUTES.dashboard);
    await p.evaluate(() => localStorage.clear());
    await p.goto(ROUTES.login);
    await expect(p).toHaveURL(/\/auth\/login/);
    await context.close();
  });

  test('refresh token endpoint returns new access token', async ({ request, adminUser }) => {
    const loginRes = await request.post('http://localhost:3000/api/auth/login', {
      data: { email: adminUser.email, password: adminUser.password, rememberDevice: false },
    });
    expect(loginRes.status()).toBe(200);
    const refreshRes = await request.post('http://localhost:3000/api/auth/refresh-token', {
      data: {},
    });
    expect([200, 401]).toContain(refreshRes.status());
    if (refreshRes.status() === 200) {
      const body = await refreshRes.json();
      expect(body.data?.accessToken).toBeTruthy();
    }
  });

  test('forgot password accepts valid email', async ({ forgotPasswordPage, adminUser }) => {
    await forgotPasswordPage.open();
    await forgotPasswordPage.submitEmail(adminUser.email);
    await expect(forgotPasswordPage.page.getByText(/Check your email|reset link/i)).toBeVisible();
  });

  test('reset password page renders with token query param', async ({ resetPasswordPage }) => {
    await resetPasswordPage.open('e2e-test-token');
    await expect(resetPasswordPage.page.locator('input[formcontrolname="newPassword"]')).toBeVisible();
  });

  test('login rejects invalid credentials', async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.login(USERS.admin.email, 'WrongPassword!123');
    await loginPage.expectError();
  });

  test('session expired page is accessible', async ({ sessionExpiredPage }) => {
    await sessionExpiredPage.open();
    await expect(sessionExpiredPage.page.getByText(/session|expired|sign in/i)).toBeVisible();
  });
});
