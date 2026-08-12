import { InternalGatewayAdapter } from '../adapters/internal.adapter';
import { StripeGatewayAdapter } from '../adapters/stripe.adapter';
import { RazorpayGatewayAdapter } from '../adapters/razorpay.adapter';
import type { GatewayOperation, GatewayRequest, GatewayResponse, PaymentGatewayAdapter } from '../adapters/gateway.adapter';
import { Pool, RowDataPacket } from 'mysql2/promise';
import { randomUUID } from 'crypto';
import { getPool } from '../../../database';

export class GatewayService {
  private readonly adapters = new Map<string, PaymentGatewayAdapter>([
    ['internal', new InternalGatewayAdapter()],
    ['stripe', new StripeGatewayAdapter()],
    ['razorpay', new RazorpayGatewayAdapter()],
  ]);

  constructor(
    private readonly pool: Pool = getPool(),
    private readonly defaultProvider = process.env.PAYMENT_GATEWAY_PROVIDER ?? 'internal',
  ) {}

  resolve(providerCode?: string): PaymentGatewayAdapter {
    const code = providerCode ?? this.defaultProvider;
    const adapter = this.adapters.get(code);
    if (!adapter) throw new Error(`Unknown gateway provider: ${code}`);
    return adapter;
  }

  async execute(
    providerCode: string | undefined,
    req: GatewayRequest,
    context: { paymentIntentId?: number; organizationId?: number; merchantId?: number },
  ): Promise<GatewayResponse> {
    const adapter = this.resolve(providerCode);
    const providerId = await this.getProviderId(adapter.providerCode);
    const txnId = await this.logTransaction(providerId, req, context);

    let response: GatewayResponse;
    switch (req.operation) {
      case 'authorize': response = await adapter.authorize(req); break;
      case 'capture': response = await adapter.capture(req); break;
      case 'refund': response = await adapter.refund(req); break;
      case 'void': response = await adapter.void(req); break;
      case 'tokenize': response = adapter.tokenize ? await adapter.tokenize(req) : { success: false, status: 'failed', errorMessage: 'Tokenize not supported' }; break;
      default: response = { success: false, status: 'failed', errorMessage: 'Unknown operation' };
    }

    await this.completeTransaction(txnId, response);
    return response;
  }

  verifyWebhook(providerCode: string, payload: string, signature: string, secret?: string): boolean {
    const adapter = this.resolve(providerCode);
    return adapter.verifyWebhook?.(payload, signature, secret ?? '') ?? false;
  }

  async listProviders(): Promise<Record<string, unknown>[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>(`SELECT * FROM payment_gateway_providers WHERE is_active = 1`);
    return rows.map((r) => ({
      id: r.id, code: r.code, name: r.name,
      supports: {
        authorize: Boolean(r.supports_authorize), capture: Boolean(r.supports_capture),
        refund: Boolean(r.supports_refund), void: Boolean(r.supports_void), tokenize: Boolean(r.supports_tokenize),
      },
    }));
  }

  async listTransactions(query: { page: number; pageSize: number; paymentIntentId?: number }): Promise<{ items: Record<string, unknown>[]; total: number }> {
    const conditions = ['1=1'];
    const params: unknown[] = [];
    if (query.paymentIntentId) { conditions.push('payment_intent_id = ?'); params.push(query.paymentIntentId); }
    const where = conditions.join(' AND ');
    const offset = (query.page - 1) * query.pageSize;
    const [countRows] = await this.pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM payment_gateway_transactions WHERE ${where}`, params);
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT pgt.*, pgp.code AS provider_code FROM payment_gateway_transactions pgt
       JOIN payment_gateway_providers pgp ON pgp.id = pgt.provider_id
       WHERE ${where} ORDER BY pgt.created_at DESC LIMIT ? OFFSET ?`,
      [...params, query.pageSize, offset],
    );
    return {
      total: Number(countRows[0]?.total ?? 0),
      items: rows.map((r) => ({
        id: r.id, providerCode: r.provider_code, operation: r.operation, status: r.status,
        externalId: r.external_id, amount: r.amount ? Number(r.amount) : null, paymentIntentId: r.payment_intent_id,
        createdAt: r.created_at,
      })),
    };
  }

  private async getProviderId(code: string): Promise<number> {
    const [rows] = await this.pool.query<RowDataPacket[]>(`SELECT id FROM payment_gateway_providers WHERE code = ? LIMIT 1`, [code]);
    if (!rows[0]) throw new Error(`Provider not registered: ${code}`);
    return Number(rows[0].id);
  }

  private async logTransaction(
    providerId: number,
    req: GatewayRequest,
    ctx: { paymentIntentId?: number; organizationId?: number; merchantId?: number },
  ): Promise<number> {
    const [result] = await this.pool.query(
      `INSERT INTO payment_gateway_transactions (uuid, provider_id, payment_intent_id, organization_id, merchant_id, operation, amount, currency, request_payload, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [randomUUID(), providerId, ctx.paymentIntentId ?? null, ctx.organizationId ?? null, ctx.merchantId ?? null,
        req.operation, req.amount, req.currency, JSON.stringify(req.metadata ?? {})],
    );
    return Number((result as { insertId: number }).insertId);
  }

  private async completeTransaction(id: number, response: GatewayResponse): Promise<void> {
    await this.pool.query(
      `UPDATE payment_gateway_transactions SET status = ?, external_id = ?, response_payload = ?, error_message = ?, completed_at = NOW(), webhook_verified = 0 WHERE id = ?`,
      [response.status, response.externalId ?? null, JSON.stringify(response.raw ?? {}), response.errorMessage ?? null, id],
    );
  }
}

export const gatewayService = new GatewayService();
