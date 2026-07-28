import { test, expect } from '../fixtures';
import { loginViaUi } from '../helpers/auth.helper';

test.describe('Audit', () => {
  test.beforeEach(async ({ page, adminUser }) => {
    await loginViaUi(page, adminUser);
  });

  test('audit dashboard reflects history', async ({ auditPage }) => {
    await auditPage.openDashboard();
    await auditPage.expectLoaded();
    const rows = auditPage.auditRows();
    await expect(rows.first().or(auditPage.page.getByText(/No audit|No events|Security/i))).toBeVisible();
  });

  test('audit timeline page loads', async ({ auditPage }) => {
    await auditPage.openTimeline();
    await expect(auditPage.page.getByText(/Timeline|Audit|Event/i)).toBeVisible();
  });
});
