import { test, expect } from '../fixtures';
import { loginViaUi } from '../helpers/auth.helper';
import { createApiClient } from '../helpers/api.helper';
import { trackPayment } from '../helpers/cleanup.helper';

test.describe('Chargebacks', () => {
  test.beforeEach(async ({ page, adminUser }) => {
    await loginViaUi(page, adminUser);
  });

  test('chargebacks list loads', async ({ chargebacksPage }) => {
    await chargebacksPage.openList();
    await expect(chargebacksPage.page.getByRole('table').or(chargebacksPage.page.getByText(/No chargeback/i))).toBeVisible();
  });

  test('open chargeback via API lifecycle', async ({ request, adminUser }) => {
    const api = createApiClient(request);
    const auth = await api.login(adminUser.email, adminUser.password);
    const payment = await api.createPayment(auth.accessToken, auth.organizationId, { amount: 90 });
    const paymentId = payment.body.data?.intent?.id;
    trackPayment(paymentId);
    await api.authorizePayment(auth.accessToken, auth.organizationId, paymentId);
    await api.capturePayment(auth.accessToken, auth.organizationId, paymentId);

    const open = await request.post('http://localhost:3000/api/v1/chargebacks', {
      headers: { Authorization: `Bearer ${auth.accessToken}`, 'X-Organization-Id': String(auth.organizationId) },
      data: { paymentIntentId: paymentId, reason: 'fraudulent', amount: 90 },
    });
    expect(open.status()).toBe(201);
    const chargebackId = (await open.json()).data?.id ?? (await open.json()).data?.chargeback?.id;

    const assign = await request.post(`http://localhost:3000/api/v1/chargebacks/${chargebackId}/assign`, {
      headers: { Authorization: `Bearer ${auth.accessToken}`, 'X-Organization-Id': String(auth.organizationId) },
      data: { assigneeId: 1 },
    });
    expect(assign.status()).toBe(200);

    const resolveWon = await request.post(`http://localhost:3000/api/v1/chargebacks/${chargebackId}/resolve`, {
      headers: { Authorization: `Bearer ${auth.accessToken}`, 'X-Organization-Id': String(auth.organizationId) },
      data: { outcome: 'merchant_won', notes: 'E2E won' },
    });
    expect(resolveWon.status()).toBe(200);
  });

  test('chargeback create form opens', async ({ chargebacksPage }) => {
    await chargebacksPage.openCreate();
    await expect(chargebacksPage.page.locator('form, .cb-form, mat-form-field').first()).toBeVisible();
  });
});
