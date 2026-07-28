import type { Page, Locator } from '@playwright/test';

export async function waitForPageHeading(page: Page, heading: string | RegExp): Promise<void> {
  await page.getByRole('heading', { name: heading }).first().waitFor({ state: 'visible' });
}

export async function waitForLoadingToFinish(page: Page): Promise<void> {
  const spinner = page.locator('mat-spinner, .merchant-page__loading, .txn-page__loading, .ref-loading');
  if (await spinner.count()) {
    await spinner.first().waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {});
  }
}

export async function expectVisible(locator: Locator): Promise<void> {
  await locator.waitFor({ state: 'visible' });
}
