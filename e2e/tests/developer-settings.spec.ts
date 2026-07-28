import { test, expect } from '../fixtures';
import { loginViaUi } from '../helpers/auth.helper';

test.describe('Developer & Sandbox', () => {
  test.beforeEach(async ({ page, adminUser }) => {
    await loginViaUi(page, adminUser);
  });

  test('developer portal loads', async ({ developerPortalPage }) => {
    await developerPortalPage.open();
  });

  test('sandbox dashboard loads', async ({ sandboxPage }) => {
    await sandboxPage.open();
    await sandboxPage.expectLoaded();
  });
});

test.describe('Profile & Settings', () => {
  test.beforeEach(async ({ page, adminUser }) => {
    await loginViaUi(page, adminUser);
  });

  test('settings page loads', async ({ settingsPage }) => {
    await settingsPage.open();
    await settingsPage.expectLoaded();
  });

  test('profile account page loads', async ({ profilePage }) => {
    await profilePage.open();
    await profilePage.expectLoaded();
  });
});
