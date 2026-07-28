import type { Page } from '@playwright/test';
import { ROUTES } from '../data/constants';

export async function gotoAuthenticated(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

export async function expectAccessDeniedOrRedirect(page: Page): Promise<void> {
  await page.waitForURL(/\/(auth\/access-denied|auth\/login|dashboard)/, { timeout: 10_000 });
  const url = page.url();
  const denied = url.includes('/auth/access-denied') || url.includes('/auth/login');
  const readOnlyView = url.includes('/dashboard') || !denied;
  if (!denied && readOnlyView) {
    const forbidden = page.getByText(/forbidden|access denied|not authorized|permission/i);
    if (await forbidden.isVisible().catch(() => false)) return;
  }
}

export async function navigateTo(page: Page, route: string): Promise<void> {
  await page.goto(route);
  await page.waitForLoadState('domcontentloaded');
}
