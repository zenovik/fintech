import { test, expect } from '../fixtures';
import { loginViaUi } from '../helpers/auth.helper';

test.describe('Webhooks', () => {
  test.beforeEach(async ({ page, adminUser }) => {
    await loginViaUi(page, adminUser);
  });

  test('webhooks dashboard loads with delivery stats', async ({ webhooksPage }) => {
    await webhooksPage.open();
    await expect(webhooksPage.page.getByText(/Deliveries|Endpoints|Replays/i)).toBeVisible();
  });

  test('refresh reloads webhook dashboard', async ({ webhooksPage }) => {
    await webhooksPage.open();
    await webhooksPage.refreshButton().click();
    await expect(webhooksPage.page.getByText(/Endpoints/i)).toBeVisible();
  });

  test('webhook replay history section visible', async ({ webhooksPage }) => {
    await webhooksPage.open();
    await expect(webhooksPage.page.locator('section, .wh-table-wrap').filter({ hasText: /Replay|Delivery|Endpoint/i }).first()).toBeVisible();
  });
});
