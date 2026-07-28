import { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../../../database';
import { PaymentRepository } from '../repositories/payment.repository';
import { PaymentWebhookService } from './payment-webhook.service';
import { getOrganizationId, orgContextStorage } from '../../../shared/context/org-context';
import { assertCustomerInOrg, assertMerchantAndCustomerInOrg, requireOrgId } from '../../../shared/helpers/tenant-scope.helper';
import { NotFoundError, ValidationError } from '../../../shared/exceptions/app.exception';
import { canTransition, PaymentIntentStatus } from '../constants/payment-status';
import { auditRecorder } from '../../audit';
import { notificationDispatch } from '../../notifications';
import { PaymentConfigRepository } from '../../payment-config/repositories/payment-config.repository';

function mapIntent(row: RowDataPacket) {
  return {
    id: row.id,
    uuid: row.uuid,
    intentRef: row.intent_ref,
    orderId: row.order_id,
    merchantId: row.merchant_id,
    merchantName: row.merchant_name ?? null,
    customerId: row.customer_id,
    status: row.status,
    amount: Number(row.amount),
    amountCaptured: Number(row.amount_captured),
    amountRefunded: Number(row.amount_refunded),
    currency: row.currency,
    paymentMethodCode: row.payment_method_code,
    idempotencyKey: row.idempotency_key,
    merchantOrderId: row.merchant_order_id,
    gatewayTransactionId: row.gateway_transaction_id,
    acquirerReference: row.acquirer_reference,
    rrn: row.rrn,
    transactionId: row.transaction_id,
    failureReason: row.failure_reason,
    expiresAt: row.expires_at,
    authorizedAt: row.authorized_at,
    capturedAt: row.captured_at,
    settledAt: row.settled_at,
    createdAt: row.created_at,
  };
}

export class PaymentEngineService {
  constructor(
    private readonly repo = new PaymentRepository(),
    private readonly webhooks = new PaymentWebhookService(),
    private readonly paymentConfig = new PaymentConfigRepository(),
    private readonly pool: Pool = getPool(),
  ) {}

  private runInOrgContext<T>(organizationId: number, fn: () => Promise<T>): Promise<T> {
    return orgContextStorage.run({ organizationId, organizationRoleCode: 'system' }, async () => fn());
  }

  async setPaymentMethodCodeInOrg(intentId: number, organizationId: number, paymentMethodCode: string): Promise<void> {
    return this.runInOrgContext(organizationId, () => this.setPaymentMethodCode(intentId, paymentMethodCode));
  }

  async authorizeInOrg(intentId: number, organizationId: number, actorId?: number) {
    return this.runInOrgContext(organizationId, () => this.authorize(intentId, actorId));
  }

  async captureInOrg(intentId: number, organizationId: number, dto: { amount?: number }, actorId?: number) {
    return this.runInOrgContext(organizationId, () => this.capture(intentId, dto, actorId));
  }

  async cancelInOrg(intentId: number, organizationId: number, reason: string | undefined, actorId?: number) {
    return this.runInOrgContext(organizationId, () => this.cancel(intentId, reason, actorId));
  }

  async createPayment(dto: Record<string, unknown>, actorId?: number, idempotencyKey?: string) {
    const orgId = requireOrgId();
    const merchantId = Number(dto.merchantId);
    if (!merchantId || !dto.amount) throw new ValidationError('merchantId and amount are required');

    await assertMerchantAndCustomerInOrg(merchantId, dto.customerId as number | undefined, orgId, this.pool);
    await this.validateMerchantConfig(merchantId, dto);

    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();

      if (idempotencyKey) {
        const cached = await this.repo.getIdempotency(merchantId, idempotencyKey, conn, true);
        if (cached?.response_body) {
          await conn.commit();
          return JSON.parse(String(cached.response_body));
        }
      }

      let orderId: number | undefined;
      if (dto.createOrder !== false) {
        orderId = await this.repo.createOrder({
          merchantId, merchantOrderId: dto.merchantOrderId, customerId: dto.customerId,
          amount: dto.amount, currency: dto.currency, description: dto.description,
          metadata: dto.metadata, expiresAt: dto.expiresAt, status: 'pending',
        }, orgId, actorId, conn);
      }

      const intentId = await this.repo.createIntent({
        orderId, merchantId, customerId: dto.customerId, amount: dto.amount,
        currency: dto.currency, paymentMethodTypeId: dto.paymentMethodTypeId,
        paymentMethodCode: dto.paymentMethodCode, idempotencyKey,
        merchantOrderId: dto.merchantOrderId, metadata: dto.metadata,
        expiresAt: dto.expiresAt,
      }, orgId, actorId, conn);

      let session: RowDataPacket | null = null;
      if (dto.createSession) {
        const sessionId = await this.repo.createSession({
          merchantId, customerId: dto.customerId, orderId, paymentIntentId: intentId,
          amount: dto.amount, currency: dto.currency,
          ipAddress: dto.ipAddress, userAgent: dto.userAgent, browser: dto.browser,
          deviceId: dto.deviceId,
        }, orgId, conn);
        const [sessionRows] = await conn.query<RowDataPacket[]>(
          'SELECT * FROM payment_sessions WHERE id = ? AND organization_id = ?', [sessionId, orgId],
        );
        session = sessionRows[0] ?? null;
      }

      await this.repo.addTimelineEvent(intentId, 'created', null, 'pending', 'Payment intent created', actorId, undefined, conn);
      await this.repo.addTimelineEvent(intentId, 'intent', 'pending', 'pending', 'Payment intent initialized', actorId, undefined, conn);

      const intentRow = await this.repo.findIntentById(intentId, conn);
      const intent = mapIntent(intentRow!);
      const result = { intent, orderId: orderId ?? null, session: session ? this.mapSession(session) : null };

      if (idempotencyKey) {
        await this.repo.saveIdempotency(merchantId, orgId, idempotencyKey, '/payments', 201, result, conn);
      }

      await conn.commit();

      void this.recordAudit('payment_created', intent.intentRef, actorId, `Created payment ${intent.intentRef}`);
      void this.webhooks.dispatch(merchantId, intentId, 'payment.created', intent);

      if (dto.autoAuthorize) {
        return this.authorize(intentId, actorId);
      }

      return result;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async authorize(intentId: number, actorId?: number) {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      const row = await this.repo.findIntentById(intentId, conn, true);
      if (!row) throw new NotFoundError('Payment not found');
      this.assertTransition(row.status, 'authorized');
      await this.repo.updateIntentStatus(intentId, 'authorized', {
        acquirerReference: `ACQ-${Date.now()}`,
        rrn: `RRN${String(Date.now()).slice(-12)}`,
      }, conn);
      await this.repo.addTimelineEvent(intentId, 'authorized', row.status, 'authorized', 'Payment authorized', actorId, undefined, conn);
      await conn.commit();

      const intent = mapIntent((await this.repo.findIntentById(intentId))!);
      void this.recordAudit('payment_authorized', intent.intentRef, actorId, 'Payment authorized');
      void this.webhooks.dispatch(Number(row.merchant_id), intentId, 'payment.authorized', intent);
      return { intent };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async capture(intentId: number, dto: { amount?: number }, actorId?: number) {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();

      let row = await this.repo.findIntentById(intentId, conn, true);
      if (!row) throw new NotFoundError('Payment not found');

      const currentStatus = row.status as PaymentIntentStatus;
      if (currentStatus === 'pending' || currentStatus === 'processing') {
        this.assertTransition(row.status, 'authorized');
        await this.repo.updateIntentStatus(intentId, 'authorized', {
          acquirerReference: `ACQ-${Date.now()}`,
          rrn: `RRN${String(Date.now()).slice(-12)}`,
        }, conn);
        await this.repo.addTimelineEvent(intentId, 'authorized', row.status, 'authorized', 'Payment authorized', actorId, undefined, conn);
        row = (await this.repo.findIntentById(intentId, conn, true))!;
      }

      this.assertTransition(row.status, 'captured');
      const captureAmount = dto.amount ?? Number(row.amount);
      const totalCaptured = Number(row.amount_captured) + captureAmount;
      if (totalCaptured > Number(row.amount)) throw new ValidationError('Capture amount exceeds intent amount');

      const txnId = await this.repo.createTransactionFromIntent(row, captureAmount, actorId, conn);
      await this.repo.updateIntentStatus(intentId, 'captured', { amountCaptured: totalCaptured, transactionId: txnId }, conn);
      await this.repo.addTimelineEvent(intentId, 'captured', row.status, 'captured', `Captured ${captureAmount}`, actorId, { amount: captureAmount }, conn);

      if (row.order_id) {
        const orderStatus = totalCaptured >= Number(row.amount) ? 'paid' : 'partial_paid';
        await this.repo.updateOrderPayment(Number(row.order_id), totalCaptured, orderStatus, conn);
      }

      await conn.commit();

      const intent = mapIntent((await this.repo.findIntentById(intentId))!);
      void this.recordAudit('payment_captured', intent.intentRef, actorId, `Captured ${captureAmount}`);
      void this.webhooks.dispatch(Number(row.merchant_id), intentId, 'payment.captured', intent);
      if (actorId) {
        void notificationDispatch.paymentReceived(actorId, txnId, intent.intentRef, String(captureAmount), intent.currency).catch(() => {});
      }
      return { intent, transactionId: txnId };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async cancel(intentId: number, reason: string | undefined, actorId?: number) {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      const row = await this.repo.findIntentById(intentId, conn, true);
      if (!row) throw new NotFoundError('Payment not found');
      this.assertTransition(row.status, 'cancelled');
      await this.repo.updateIntentStatus(intentId, 'cancelled', { failureReason: reason ?? 'Cancelled by merchant' }, conn);
      await this.repo.addTimelineEvent(intentId, 'cancelled', row.status, 'cancelled', reason ?? 'Payment cancelled', actorId, undefined, conn);
      await conn.commit();
      const intent = mapIntent((await this.repo.findIntentById(intentId))!);
      void this.recordAudit('payment_cancelled', intent.intentRef, actorId, reason ?? 'Cancelled');
      return { intent };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async refund(intentId: number, dto: { amount?: number; reason?: string }, actorId?: number) {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      const row = await this.repo.findIntentById(intentId, conn, true);
      if (!row) throw new NotFoundError('Payment not found');
      if (!['captured', 'settled', 'partially_refunded'].includes(row.status)) {
        throw new ValidationError('Payment must be captured before refund');
      }
      const captured = Number(row.amount_captured ?? 0);
      const alreadyRefunded = Number(row.amount_refunded ?? 0);
      const refundAmount = dto.amount ?? captured - alreadyRefunded;
      if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
        throw new ValidationError('Refund amount must be greater than zero');
      }
      if (refundAmount + alreadyRefunded > captured + 0.001) {
        throw new ValidationError('Refund amount exceeds captured balance');
      }
      const totalRefunded = alreadyRefunded + refundAmount;
      const newStatus: PaymentIntentStatus = totalRefunded >= Number(row.amount_captured) ? 'refunded' : 'partially_refunded';
      await this.repo.updateIntentStatus(intentId, newStatus, { amountRefunded: totalRefunded }, conn);
      await this.repo.addTimelineEvent(intentId, 'refunded', row.status, newStatus, dto.reason ?? 'Refund processed', actorId, { amount: refundAmount }, conn);
      if (row.order_id) {
        const amountPaid = Number(row.amount_paid);
        await this.repo.updateOrderPayment(
          Number(row.order_id),
          Number.isFinite(amountPaid) ? amountPaid : Number(row.amount_captured),
          'refunded',
          conn,
        );
      }
      await conn.commit();

      const intent = mapIntent((await this.repo.findIntentById(intentId))!);
      void this.recordAudit('payment_refunded', intent.intentRef, actorId, `Refunded ${refundAmount}`);
      void this.webhooks.dispatch(Number(row.merchant_id), intentId, 'payment.refunded', intent);
      if (actorId) {
        void notificationDispatch.refundProcessed(actorId, Number(row.transaction_id) || 0, intent.intentRef, String(refundAmount), intent.currency).catch(() => {});
      }
      return { intent, refundAmount };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async setPaymentMethodCode(intentId: number, paymentMethodCode: string): Promise<void> {
    const row = await this.repo.findIntentById(intentId);
    if (!row) throw new NotFoundError('Payment not found');
    await this.repo.updateIntentPaymentMethod(intentId, paymentMethodCode);
  }

  async retry(intentId: number, actorId?: number) {
    const row = await this.repo.findIntentById(intentId);
    if (!row) throw new NotFoundError('Payment not found');
    if (row.status !== 'failed') throw new ValidationError('Only failed payments can be retried');
    await this.repo.updateIntentStatus(intentId, 'pending');
    await this.repo.addTimelineEvent(intentId, 'intent', 'failed', 'pending', 'Payment retry initiated', actorId);
    return { intent: mapIntent((await this.repo.findIntentById(intentId))!) };
  }

  async expire(intentId: number, actorId?: number) {
    const row = await this.repo.findIntentById(intentId);
    if (!row) throw new NotFoundError('Payment not found');
    this.assertTransition(row.status, 'expired');
    await this.repo.updateIntentStatus(intentId, 'expired', { failureReason: 'Payment expired' });
    await this.repo.addTimelineEvent(intentId, 'expired', row.status, 'expired', 'Payment expired', actorId);
    return { intent: mapIntent((await this.repo.findIntentById(intentId))!) };
  }

  async getStatus(id: number) {
    const row = await this.repo.findIntentById(id);
    if (!row) throw new NotFoundError('Payment not found');
    return mapIntent(row);
  }

  async search(query: { page: number; pageSize: number; status?: string; merchantId?: number; search?: string }) {
    const { items, total } = await this.repo.listIntents(query);
    return {
      items: items.map(mapIntent),
      pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) || 1 },
    };
  }

  async timeline(intentId: number) {
    const row = await this.repo.findIntentById(intentId);
    if (!row) throw new NotFoundError('Payment not found');
    const events = await this.repo.getTimeline(intentId);
    return {
      intentRef: row.intent_ref,
      status: row.status,
      events: events.map((e) => ({
        eventType: e.event_type, fromStatus: e.from_status, toStatus: e.to_status,
        description: e.description, actorName: e.actor_name, occurredAt: e.created_at,
      })),
    };
  }

  async createSession(dto: Record<string, unknown>, actorId?: number) {
    const orgId = requireOrgId();
    const merchantId = Number(dto.merchantId);
    if (!merchantId) throw new ValidationError('merchantId is required');
    await assertMerchantAndCustomerInOrg(merchantId, dto.customerId as number | undefined, orgId, this.pool);
    const sessionId = await this.repo.createSession(dto, orgId);
    const session = await this.repo.getSessionById(sessionId);
    return { session: this.mapSession(session!) };
  }

  async getSession(id: number) {
    const session = await this.repo.getSessionById(id);
    if (!session) throw new NotFoundError('Payment session not found');
    return { session: this.mapSession(session) };
  }

  async listOrders(query: { page: number; pageSize: number; status?: string; merchantId?: number }) {
    const { items, total } = await this.repo.listOrders(query);
    return {
      items: items.map((o) => ({
        id: o.id, orderRef: o.order_ref, merchantOrderId: o.merchant_order_id,
        merchantId: o.merchant_id, status: o.status, amount: Number(o.amount),
        amountPaid: Number(o.amount_paid), currency: o.currency, createdAt: o.created_at,
      })),
      pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) || 1 },
    };
  }

  async getOrder(id: number) {
    const order = await this.repo.findOrderById(id);
    if (!order) throw new NotFoundError('Order not found');
    return {
      id: order.id, orderRef: order.order_ref, merchantOrderId: order.merchant_order_id,
      merchantId: order.merchant_id, status: order.status, amount: Number(order.amount),
      amountPaid: Number(order.amount_paid), amountRefunded: Number(order.amount_refunded),
      currency: order.currency, createdAt: order.created_at,
    };
  }

  async merchantConfig(merchantId: number) {
    const orgId = requireOrgId();
    await assertMerchantAndCustomerInOrg(merchantId, undefined, orgId, this.pool);
    const methods = await this.paymentConfig.findByMerchant(merchantId);
    const limits = await this.paymentConfig.listLimits(merchantId);
    return {
      merchantId,
      allowedPaymentMethods: methods.map((m) => ({
        code: m.method_code, name: m.method_name, status: m.status,
        settlementCycle: m.settlement_cycle, mdrPct: Number(m.mdr_pct),
        dailyLimit: m.daily_limit ? Number(m.daily_limit) : null,
        perTxnLimit: m.per_txn_limit ? Number(m.per_txn_limit) : null,
      })),
      limits: limits.map((l) => ({
        ruleName: l.rule_name, perTxnLimit: l.per_txn_limit ? Number(l.per_txn_limit) : null,
        dailyLimit: l.daily_limit ? Number(l.daily_limit) : null,
      })),
      allowedCurrencies: ['USD', 'INR', 'EUR', 'GBP'],
    };
  }

  async customerProfile(customerId: number) {
    const orgId = requireOrgId();
    await assertCustomerInOrg(customerId, orgId, this.pool);
    const methods = await this.repo.listCustomerMethods(customerId);
    return {
      customerId,
      savedMethods: methods.map((m) => ({
        id: m.id, methodType: m.method_type, provider: m.provider,
        lastFour: m.last_four, brand: m.brand, vpa: m.vpa,
        walletBalance: Number(m.wallet_balance), isDefault: Boolean(m.is_default),
      })),
    };
  }

  async webhookDeliveries(merchantId?: number) {
    const items = await this.repo.listWebhookDeliveries(merchantId);
    return items.map((d) => ({
      id: d.id, eventType: d.event_type, status: d.status, webhookUrl: d.webhook_url,
      attemptCount: d.attempt_count, deliveredAt: d.delivered_at, createdAt: d.created_at,
    }));
  }

  private mapSession(row: RowDataPacket) {
    return {
      id: row.id, sessionRef: row.session_ref, status: row.status,
      amount: Number(row.amount), currency: row.currency,
      clientSecret: row.client_secret, paymentIntentId: row.payment_intent_id,
      expiresAt: row.expires_at, ipAddress: row.ip_address, browser: row.browser,
    };
  }

  private assertTransition(from: string, to: PaymentIntentStatus) {
    if (!canTransition(from as PaymentIntentStatus, to)) {
      throw new ValidationError(`Invalid status transition from ${from} to ${to}`);
    }
  }

  private async validateMerchantConfig(merchantId: number, dto: Record<string, unknown>) {
    const limits = await this.paymentConfig.listLimits(merchantId);
    const amount = Number(dto.amount);
    for (const rule of limits) {
      if (rule.per_txn_limit && amount > Number(rule.per_txn_limit)) {
        throw new ValidationError(`Amount exceeds per-transaction limit (${rule.per_txn_limit})`);
      }
    }
  }

  private recordAudit(action: string, entityId: string, actorId?: number, description?: string) {
    return auditRecorder.record({
      module: 'payments', categoryCode: 'payments', actionCode: action,
      entityType: 'payment_intent', entityId, description: description ?? action,
      userId: actorId, riskLevel: action.includes('refund') || action.includes('captured') ? 'medium' : 'low',
    });
  }
}
