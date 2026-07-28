import type { Page, Locator } from '@playwright/test';

export abstract class BasePage {
  constructor(public readonly page: Page) {}

  async goto(path: string): Promise<void> {
    await this.page.goto(path);
    await this.page.waitForLoadState('domcontentloaded');
  }

  heading(name: string | RegExp): Locator {
    return this.page.getByRole('heading', { name }).first();
  }

  async expectHeading(name: string | RegExp): Promise<void> {
    await this.heading(name).waitFor({ state: 'visible' });
  }

  alert(): Locator {
    return this.page.locator('[role="alert"]').first();
  }

  primaryButton(name: string | RegExp): Locator {
    return this.page.getByRole('button', { name }).first();
  }

  link(name: string | RegExp): Locator {
    return this.page.getByRole('link', { name }).first();
  }
}
