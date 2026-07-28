import type { Page } from '@playwright/test';
import type { TestUser } from '../data/users';
import { ROUTES } from '../data/constants';

export async function loginViaUi(page: Page, user: TestUser): Promise<void> {
  await page.goto(ROUTES.login);
  await page.locator('#email').fill(user.email);
  await page.locator('#password').fill(user.password);
  await page.locator('button.auth-btn[type="submit"]').click();

  await page.waitForURL(/\/(dashboard|select-organization)/, { timeout: 30_000 });

  if (page.url().includes('/select-organization')) {
    await page.locator('.select-org__item').first().click();
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
  }
}

export async function logoutViaUi(page: Page): Promise<void> {
  const profileBtn = page.locator('.topnav__profile, .dash-topnav__profile, [aria-label="User menu"]').first();
  if (await profileBtn.isVisible().catch(() => false)) {
    await profileBtn.click();
    const logout = page.getByRole('menuitem', { name: /log out|sign out/i });
    if (await logout.isVisible().catch(() => false)) {
      await logout.click();
    }
  }
  await page.goto(ROUTES.login);
}

export async function setAuthStorage(page: Page, accessToken: string, userEmail: string): Promise<void> {
  await page.addInitScript(
    ({ token, email }) => {
      localStorage.setItem('fintech_access_token', token);
      localStorage.setItem('fintech_user', JSON.stringify({ email }));
    },
    { token: accessToken, email: userEmail },
  );
}

export async function clearAuthStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('fintech_access_token');
    localStorage.removeItem('fintech_user');
    localStorage.removeItem('fintech_refresh_token');
  });
}
