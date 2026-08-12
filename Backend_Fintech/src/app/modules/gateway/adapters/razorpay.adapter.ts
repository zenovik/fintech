import { createHmac, timingSafeEqual } from 'crypto';
import { BaseGatewayAdapter, GatewayRequest, GatewayResponse } from './gateway.adapter';

export class RazorpayGatewayAdapter extends BaseGatewayAdapter {
  readonly providerCode = 'razorpay';

  private get keyId(): string | undefined {
    return process.env.RAZORPAY_KEY_ID;
  }

  private get keySecret(): string | undefined {
    return process.env.RAZORPAY_KEY_SECRET;
  }

  private authHeader(): string | undefined {
    if (!this.keyId || !this.keySecret) return undefined;
    return `Basic ${Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64')}`;
  }

  async authorize(req: GatewayRequest): Promise<GatewayResponse> {
    const auth = this.authHeader();
    if (!auth) return super.authorize(req);
    try {
      const res = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: { Authorization: auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(req.amount * 100), currency: req.currency, payment_capture: 0 }),
      });
      const data = await res.json() as Record<string, unknown>;
      if (!res.ok) return this.buildFailure(String(data.error ?? 'Razorpay authorize failed'));
      return {
        success: true,
        externalId: String(data.id),
        status: 'succeeded',
        acquirerReference: String(data.id),
        raw: data,
      };
    } catch (err) {
      return this.buildFailure(err instanceof Error ? err.message : 'Razorpay error');
    }
  }

  async capture(req: GatewayRequest): Promise<GatewayResponse> {
    const auth = this.authHeader();
    if (!auth || !req.externalId) return super.capture(req);
    try {
      const res = await fetch(`https://api.razorpay.com/v1/payments/${req.externalId}/capture`, {
        method: 'POST',
        headers: { Authorization: auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(req.amount * 100), currency: req.currency }),
      });
      const data = await res.json() as Record<string, unknown>;
      if (!res.ok) return this.buildFailure(String(data.error ?? 'Razorpay capture failed'));
      return { success: true, externalId: req.externalId, status: 'succeeded', raw: data };
    } catch (err) {
      return this.buildFailure(err instanceof Error ? err.message : 'Razorpay capture error');
    }
  }

  verifyWebhook(payload: string, signature: string, secret: string): boolean {
    const webhookSecret = secret || process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) return false;
    const expected = createHmac('sha256', webhookSecret).update(payload).digest('hex');
    try {
      return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return signature === expected;
    }
  }
}
