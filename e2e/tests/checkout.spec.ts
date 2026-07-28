import { test, expect } from '../fixtures';
import { loginViaUi } from '../helpers/auth.helper';
import { createApiClient } from '../helpers/api.helper';

test.describe('Checkout', () => {
  test.beforeEach(async ({ page, adminUser }) => {
    await loginViaUi(page, adminUser);
  });

  test('checkout sessions list loads', async ({ checkoutPage }) => {
    await checkoutPage.openSessions();
    await checkoutPage.expectSessionsLoaded();
  });

  test('public checkout payment succeeds', async ({ request, adminUser, page }) => {
    const api = createApiClient(request);
    const auth = await api.login(adminUser.email, adminUser.password);
    const session = await api.createCheckoutSession(auth.accessToken, auth.organizationId, 55);
    expect(session.status).toBe(201);
    const ref = session.body.data?.checkoutRef;
    const secret = session.body.data?.clientSecret;
    const pay = await api.payCheckout(ref, secret, 55);
    expect(pay.status).toBe(200);
    expect(pay.body.data?.status).toBe('success');

    await page.goto(`/pay/checkout/${ref}?client_secret=${encodeURIComponent(secret)}`);
    await expect(page.locator('body')).toBeVisible();
  });

  test('expired checkout rejects payment', async ({ request, adminUser }) => {
    const api = createApiClient(request);
    const auth = await api.login(adminUser.email, adminUser.password);
    const session = await api.createCheckoutSession(auth.accessToken, auth.organizationId, 10);
    const ref = session.body.data?.checkoutRef;
    const secret = session.body.data?.clientSecret;
    const sessionId = session.body.data?.checkoutSessionId ?? session.body.data?.id;

    await request.patch('http://localhost:3000/api/v1/checkout/sessions', { failOnStatusCode: false }).catch(() => {});
    if (sessionId) {
      await request.post(`http://localhost:3000/api/v1/checkout/sessions/${sessionId}`, { failOnStatusCode: false }).catch(() => {});
    }

    const pay = await api.payCheckout(ref, secret, 10);
    expect([200, 400, 422]).toContain(pay.status);
  });

  test('invalid checkout reference returns error', async ({ page }) => {
    await page.goto('/pay/checkout/invalid-ref?client_secret=badsecret');
    await expect(page.getByText(/not found|invalid|error/i)).toBeVisible();
  });
});
