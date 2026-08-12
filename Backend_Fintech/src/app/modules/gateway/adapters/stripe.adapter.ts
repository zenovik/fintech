import { createHmac, timingSafeEqual } from 'crypto';
import { BaseGatewayAdapter, GatewayRequest, GatewayResponse } from './gateway.adapter';

export class StripeGatewayAdapter extends BaseGatewayAdapter {
  readonly providerCode = 'stripe';

  private get secretKey(): string | undefined {
    return process.env.STRIPE_SECRET_KEY;
  }

  async authorize(req: GatewayRequest): Promise<GatewayResponse> {
    if (!this.secretKey) return super.authorize(req);
    try {
      const body = new URLSearchParams({
        amount: String(Math.round(req.amount * 100)),
        currency: req.currency.toLowerCase(),
        'payment_method_types[]': 'card',
        capture_method: 'manual',
      });
      const res = await fetch('https://api.stripe.com/v1/payment_intents', {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.secretKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      const data = await res.json() as Record<string, unknown>;
      if (!res.ok) return this.buildFailure(String(data.error ?? 'Stripe authorize failed'));
      return {
        success: true,
        externalId: String(data.id),
        status: 'succeeded',
        acquirerReference: String(data.id),
        raw: data,
      };
    } catch (err) {
      return this.buildFailure(err instanceof Error ? err.message : 'Stripe error');
    }
  }

  async capture(req: GatewayRequest): Promise<GatewayResponse> {
    if (!this.secretKey || !req.externalId) return super.capture(req);
    try {
      const body = new URLSearchParams({ amount_to_capture: String(Math.round(req.amount * 100)) });
      const res = await fetch(`https://api.stripe.com/v1/payment_intents/${req.externalId}/capture`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.secretKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      const data = await res.json() as Record<string, unknown>;
      if (!res.ok) return this.buildFailure(String((data.error as { message?: string })?.message ?? 'Stripe capture failed'));
      return { success: true, externalId: req.externalId, status: 'succeeded', raw: data };
    } catch (err) {
      return this.buildFailure(err instanceof Error ? err.message : 'Stripe capture error');
    }
  }

  verifyWebhook(payload: string, signature: string, secret: string): boolean {
    const webhookSecret = secret || process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) return false;
    const expected = createHmac('sha256', webhookSecret).update(payload).digest('hex');
    try {
      return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return signature === expected;
    }
  }
}
