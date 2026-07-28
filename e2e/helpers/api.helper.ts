import type { APIRequestContext } from '@playwright/test';
import { CUSTOMER, MERCHANT, ORG, PAYMENT_METHOD } from '../data/constants';
import { uniqueEmail, uniqueRef } from '../utils/unique';

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  organizationId: number;
}

export class ApiClient {
  constructor(
    private readonly request: APIRequestContext,
    private readonly baseUrl: string,
  ) {}

  async login(email: string, password: string, orgId = ORG.merchantPro): Promise<AuthTokens> {
    const res = await this.request.post(`${this.baseUrl}/auth/login`, {
      data: { email, password, rememberDevice: false },
    });
    if (res.status() !== 200) {
      throw new Error(`Login failed: ${res.status()} ${await res.text()}`);
    }
    const body = await res.json();
    const accessToken = body.data?.accessToken as string;
    const refreshToken = body.data?.refreshToken as string | undefined;

    const selectRes = await this.request.post(`${this.baseUrl}/auth/select-organization`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Organization-Id': String(orgId),
      },
      data: { organizationId: orgId },
    });

    const token = selectRes.ok()
      ? ((await selectRes.json()).data?.accessToken as string) ?? accessToken
      : accessToken;

    return { accessToken: token, refreshToken, organizationId: orgId };
  }

  private headers(token: string, orgId: number): Record<string, string> {
    return {
      Authorization: `Bearer ${token}`,
      'X-Organization-Id': String(orgId),
      'Content-Type': 'application/json',
    };
  }

  async createPayment(
    token: string,
    orgId: number,
    payload: {
      merchantId?: number;
      amount: number;
      merchantOrderId?: string;
      customerId?: number;
      idempotencyKey?: string;
    },
  ) {
    const res = await this.request.post(`${this.baseUrl}/v1/payments`, {
      headers: this.headers(token, orgId),
      data: {
        merchantId: payload.merchantId ?? MERCHANT.org1Active,
        amount: payload.amount,
        currency: 'USD',
        merchantOrderId: payload.merchantOrderId ?? uniqueRef('E2E-PAY'),
        customerId: payload.customerId ?? CUSTOMER.org1,
        idempotencyKey: payload.idempotencyKey,
      },
    });
    return { status: res.status(), body: await res.json() };
  }

  async authorizePayment(token: string, orgId: number, paymentId: number) {
    const res = await this.request.post(`${this.baseUrl}/v1/payments/${paymentId}/authorize`, {
      headers: this.headers(token, orgId),
      data: {},
    });
    return { status: res.status(), body: await res.json() };
  }

  async capturePayment(token: string, orgId: number, paymentId: number, amount?: number) {
    const res = await this.request.post(`${this.baseUrl}/v1/payments/${paymentId}/capture`, {
      headers: this.headers(token, orgId),
      data: amount != null ? { amount } : {},
    });
    return { status: res.status(), body: await res.json() };
  }

  async cancelPayment(token: string, orgId: number, paymentId: number, reason = 'E2E cancel') {
    const res = await this.request.post(`${this.baseUrl}/v1/payments/${paymentId}/cancel`, {
      headers: this.headers(token, orgId),
      data: { reason },
    });
    return { status: res.status(), body: await res.json() };
  }

  async refundPayment(token: string, orgId: number, paymentId: number, amount?: number) {
    const res = await this.request.post(`${this.baseUrl}/v1/payments/${paymentId}/refund`, {
      headers: this.headers(token, orgId),
      data: amount != null ? { amount } : {},
    });
    return { status: res.status(), body: await res.json() };
  }

  async createCheckoutSession(token: string, orgId: number, amount = 49.99) {
    const res = await this.request.post(`${this.baseUrl}/v1/checkout/sessions`, {
      headers: this.headers(token, orgId),
      data: {
        merchantId: MERCHANT.org1Active,
        amount,
        currency: 'USD',
        merchantOrderId: uniqueRef('E2E-CHK'),
        expiryMinutes: 30,
      },
    });
    return { status: res.status(), body: await res.json() };
  }

  async payCheckout(ref: string, secret: string, amount: number) {
    const res = await this.request.post(
      `${this.baseUrl}/v1/public/checkout/${ref}/pay?client_secret=${encodeURIComponent(secret)}`,
      {
        data: { paymentMethodCode: PAYMENT_METHOD, amount },
      },
    );
    return { status: res.status(), body: await res.json() };
  }

  async createQrPayment(token: string, orgId: number, amount = 25) {
    const res = await this.request.post(`${this.baseUrl}/v1/qr-payments`, {
      headers: this.headers(token, orgId),
      data: {
        merchantId: MERCHANT.org1Active,
        amount,
        currency: 'USD',
        description: `E2E QR ${uniqueRef('QR')}`,
      },
    });
    return { status: res.status(), body: await res.json() };
  }

  async createPaymentLink(token: string, orgId: number, amount = 35) {
    const res = await this.request.post(`${this.baseUrl}/v1/payment-links`, {
      headers: this.headers(token, orgId),
      data: {
        merchantId: MERCHANT.org1Active,
        amount,
        currency: 'USD',
        title: `E2E Link ${uniqueRef('LNK')}`,
      },
    });
    return { status: res.status(), body: await res.json() };
  }

  async createUser(token: string, orgId: number, email = uniqueEmail('e2e-user')) {
    const res = await this.request.post(`${this.baseUrl}/v1/users`, {
      headers: this.headers(token, orgId),
      data: {
        email,
        password: 'Password123!',
        firstName: 'E2E',
        lastName: 'User',
        status: 'active',
      },
    });
    return { status: res.status(), body: await res.json(), email };
  }

  async createMerchant(token: string, orgId: number, legalName = uniqueRef('E2E-MERCH')) {
    const res = await this.request.post(`${this.baseUrl}/v1/merchants`, {
      headers: this.headers(token, orgId),
      data: {
        legalName,
        displayName: legalName,
        businessEmail: uniqueEmail('merchant'),
        regionId: 1,
      },
    });
    return { status: res.status(), body: await res.json(), legalName };
  }

  async cleanupPayment(token: string, orgId: number, paymentId: number) {
    await this.request.delete(`${this.baseUrl}/v1/payments/${paymentId}`, {
      headers: this.headers(token, orgId),
    }).catch(() => {});
  }
}

export function createApiClient(request: APIRequestContext, baseUrl?: string): ApiClient {
  const url = baseUrl ?? process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:3000/api';
  return new ApiClient(request, url);
}
