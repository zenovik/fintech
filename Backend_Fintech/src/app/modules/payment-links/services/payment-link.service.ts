import QRCode from 'qrcode';
import { getPool } from '../../../database';
import { getOrganizationId } from '../../../shared/context/org-context';
import { NotFoundError, ValidationError, GoneError } from '../../../shared/exceptions/app.exception';
import { auditRecorder } from '../../audit';
import { notificationDispatch } from '../../notifications';
import { TransactionService } from '../../transactions/services/transaction.service';
import { invoicePaymentHandler } from '../../invoices/services/invoice-payment.handler';
import { PaymentLinkRepository } from '../repositories/payment-link.repository';
import {
  CreatePaymentLinkBodyDto,
  PaymentLinkListQueryDto,
  PublicPayBodyDto,
  UpdatePaymentLinkBodyDto,
} from '../dto';
import { PaymentLinkRow } from '../types/payment-link.types';
import { env } from '../../../config';

function mapLink(row: PaymentLinkRow) {
  const publicUrl = `${env.corsOrigin.replace(/\/$/, '')}/pay/${row.public_token}`;
  return {
    id: row.id,
    uuid: row.uuid,
    organizationId: row.organization_id,
    organizationName: row.organization_name ?? null,
    organizationCode: row.organization_code ?? null,
    merchantId: row.merchant_id,
    merchantName: row.merchant_name ?? null,
    merchantCode: row.merchant_code ?? null,
    customerId: row.customer_id,
    customerName: row.customer_name ?? null,
    customerEmail: row.customer_email ?? null,
    linkRef: row.link_ref,
    title: row.title,
    description: row.description,
    amount: row.amount ? Number(row.amount) : null,
    currency: row.currency,
    allowCustomAmount: Boolean(row.allow_custom_amount),
    expiresAt: row.expires_at,
    maxUsage: row.max_usage,
    currentUsage: row.current_usage,
    status: row.status,
    publicToken: row.public_token,
    publicUrl,
    redirectUrl: row.redirect_url,
    successUrl: row.success_url,
    cancelUrl: row.cancel_url,
    totalCollected: Number(row.total_collected ?? 0),
    createdBy: row.created_by,
    createdByName: row.created_by_name ?? null,
    updatedBy: row.updated_by,
    updatedByName: row.updated_by_name ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class PaymentLinkService {
  constructor(
    private readonly repo = new PaymentLinkRepository(),
    private readonly transactionService = new TransactionService(),
  ) {}

  async list(query: PaymentLinkListQueryDto) {
    const { items, total } = await this.repo.findAll(query);
    const stats = await this.repo.getStatistics();
    return {
      items: items.map(mapLink),
      stats: {
        total: Number(stats.total),
        active: Number(stats.active_count),
        disabled: Number(stats.disabled_count),
        expired: Number(stats.expired_count),
        totalCollected: Number(stats.total_collected),
        totalUsage: Number(stats.total_usage),
        conversionRate: Number(stats.conversion_rate),
      },
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    };
  }

  async getStatistics() {
    const stats = await this.repo.getStatistics();
    return {
      total: Number(stats.total),
      active: Number(stats.active_count),
      disabled: Number(stats.disabled_count),
      expired: Number(stats.expired_count),
      totalCollected: Number(stats.total_collected),
      totalUsage: Number(stats.total_usage),
      conversionRate: Number(stats.conversion_rate),
    };
  }

  async getById(id: number) {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundError('Payment link not found');
    const payments = await this.repo.findPayments(id);
    return {
      ...mapLink(row),
      payments: payments.map((p) => ({
        id: p.id,
        transactionId: p.transaction_id,
        transactionRef: p.transaction_ref ?? null,
        transactionStatus: p.transaction_status ?? null,
        paidAmount: Number(p.paid_amount),
        createdAt: p.created_at,
      })),
    };
  }

  async create(dto: CreatePaymentLinkBodyDto, actorId?: number) {
    const organizationId = getOrganizationId();
    if (!organizationId) throw new ValidationError('Organization context is required');
    if (!(await this.repo.validateMerchantInOrg(dto.merchantId, organizationId))) {
      throw new ValidationError('Merchant does not belong to the current organization');
    }
    if (dto.customerId && !(await this.repo.validateCustomerInOrg(dto.customerId, organizationId))) {
      throw new ValidationError('Customer does not belong to the current organization');
    }
    const id = await this.repo.create(dto, organizationId, actorId);
    const detail = await this.getById(id);
    void auditRecorder.record({
      module: 'payment_links', categoryCode: 'transactions', actionCode: 'payment_link_created',
      entityType: 'payment_link', entityId: String(id),
      description: `Created payment link ${detail.linkRef}: ${detail.title}.`,
      afterValues: { merchantId: dto.merchantId, amount: detail.amount },
      riskLevel: 'low', userId: actorId,
    }).catch(() => {});
    if (actorId) {
      void notificationDispatch.paymentLinkCreated(actorId, id, detail.linkRef, detail.title).catch(() => {});
    }
    return detail;
  }

  async update(id: number, dto: UpdatePaymentLinkBodyDto, actorId?: number) {
    const before = await this.getById(id);
    const organizationId = getOrganizationId();
    if (!organizationId) throw new ValidationError('Organization context is required');
    if (dto.merchantId && !(await this.repo.validateMerchantInOrg(dto.merchantId, organizationId))) {
      throw new ValidationError('Merchant does not belong to the current organization');
    }
    if (dto.customerId && !(await this.repo.validateCustomerInOrg(dto.customerId, organizationId))) {
      throw new ValidationError('Customer does not belong to the current organization');
    }
    await this.repo.update(id, dto, actorId);
    const detail = await this.getById(id);
    void auditRecorder.record({
      module: 'payment_links', categoryCode: 'transactions', actionCode: 'payment_link_updated',
      entityType: 'payment_link', entityId: String(id),
      description: `Updated payment link ${detail.linkRef}.`,
      beforeValues: { title: before.title, amount: before.amount },
      afterValues: { title: detail.title, amount: detail.amount },
      riskLevel: 'low', userId: actorId,
    }).catch(() => {});
    return detail;
  }

  async enable(id: number, actorId?: number) {
    await this.getById(id);
    await this.repo.setStatus(id, 'active', actorId);
    return this.getById(id);
  }

  async disable(id: number, actorId?: number) {
    const before = await this.getById(id);
    await this.repo.setStatus(id, 'disabled', actorId);
    void auditRecorder.record({
      module: 'payment_links', categoryCode: 'transactions', actionCode: 'payment_link_disabled',
      entityType: 'payment_link', entityId: String(id),
      description: `Disabled payment link ${before.linkRef}.`,
      beforeValues: { status: before.status }, afterValues: { status: 'disabled' },
      riskLevel: 'medium', userId: actorId,
    }).catch(() => {});
    return this.getById(id);
  }

  async expire(id: number, actorId?: number) {
    const before = await this.getById(id);
    await this.repo.setStatus(id, 'expired', actorId);
    void auditRecorder.record({
      module: 'payment_links', categoryCode: 'transactions', actionCode: 'payment_link_disabled',
      entityType: 'payment_link', entityId: String(id),
      description: `Expired payment link ${before.linkRef}.`,
      beforeValues: { status: before.status }, afterValues: { status: 'expired' },
      riskLevel: 'medium', userId: actorId,
    }).catch(() => {});
    if (before.createdBy) {
      void notificationDispatch.paymentLinkExpired(before.createdBy, id, before.linkRef, before.title).catch(() => {});
    }
    return this.getById(id);
  }

  async regenerateToken(id: number, actorId?: number) {
    await this.getById(id);
    const token = await this.repo.regenerateToken(id, actorId);
    const detail = await this.getById(id);
    return { ...detail, publicToken: token, publicUrl: detail.publicUrl };
  }

  async getQrCode(id: number): Promise<{ dataUrl: string; publicUrl: string }> {
    const detail = await this.getById(id);
    const dataUrl = await QRCode.toDataURL(detail.publicUrl, { width: 256, margin: 2 });
    return { dataUrl, publicUrl: detail.publicUrl };
  }

  async clone(id: number, actorId?: number) {
    const orgId = getOrganizationId();
    if (!orgId) throw new ValidationError('Organization context is required');
    const newId = await this.repo.clone(id, orgId, actorId);
    void auditRecorder.record({
      module: 'payment_links', categoryCode: 'transactions', actionCode: 'link_cloned',
      entityType: 'payment_link', entityId: String(newId), description: `Cloned payment link from ${id}`, userId: actorId, riskLevel: 'low',
    }).catch(() => {});
    return this.getById(newId);
  }

  async linkAnalytics(id: number) {
    await this.getById(id);
    return this.repo.getLinkAnalytics(id);
  }

  async linkVisits(id: number, page = 1, pageSize = 25) {
    await this.getById(id);
    const { items, total } = await this.repo.getVisits(id, page, pageSize);
    return { items, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) || 1 } };
  }

  getPublicUrl(token: string): string {
    return `${env.corsOrigin.replace(/\/$/, '')}/pay/${token}`;
  }

  private validateLinkForPayment(link: PaymentLinkRow): void {
    if (link.status === 'disabled') throw new GoneError('This payment link has been disabled');
    if (link.status === 'expired') throw new GoneError('This payment link has expired');
    if (link.expires_at && new Date(link.expires_at) <= new Date()) {
      throw new GoneError('This payment link has expired');
    }
    if (link.max_usage != null && link.current_usage >= link.max_usage) {
      throw new GoneError('This payment link has reached its maximum usage limit');
    }
  }

  async getPublicLink(token: string) {
    const link = await this.repo.findByToken(token);
    if (!link) throw new NotFoundError('Payment link not found');
    this.validateLinkForPayment(link);
    void this.repo.recordVisit(link.id, 'view');
    return {
      title: link.title,
      description: link.description,
      amount: link.amount ? Number(link.amount) : null,
      currency: link.currency,
      allowCustomAmount: Boolean(link.allow_custom_amount),
      merchantName: link.merchant_name,
      expiresAt: link.expires_at,
      maxUsage: link.max_usage,
      currentUsage: link.current_usage,
      successUrl: link.success_url,
      cancelUrl: link.cancel_url,
    };
  }

  async processPayment(token: string, dto: PublicPayBodyDto) {
    const link = await this.repo.findByToken(token);
    if (!link) throw new NotFoundError('Payment link not found');
    this.validateLinkForPayment(link);

    let amount = link.amount ? Number(link.amount) : undefined;
    if (link.allow_custom_amount) {
      if (!dto.amount) throw new ValidationError('Amount is required for this payment link');
      amount = dto.amount;
    }
    if (!amount || amount <= 0) throw new ValidationError('Invalid payment amount');

    const customerName = dto.customerName ?? link.customer_name ?? undefined;
    const customerEmail = dto.customerEmail ?? link.customer_email ?? undefined;

    const transaction = await this.transactionService.create({
      merchantId: link.merchant_id,
      amount,
      currency: link.currency,
      paymentMethodTypeId: 1,
      paymentMethodDetail: dto.paymentMethodDetail ?? 'Payment Link',
      customerName,
      customerEmail,
      description: `Payment via link ${link.link_ref}: ${link.title}`,
    });

    await this.transactionService.updateStatus(transaction.id, { statusCode: 'settled' });

    const pool = getPool();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await this.repo.recordPayment(conn, link.id, transaction.id, amount);
      await this.repo.expireIfMaxUsage(conn, link.id);
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    void this.repo.recordVisit(link.id, 'complete');

    void auditRecorder.record({
      module: 'payment_links', categoryCode: 'transactions', actionCode: 'payment_link_paid',
      entityType: 'payment_link', entityId: String(link.id),
      description: `Payment of ${amount} ${link.currency} received via link ${link.link_ref}.`,
      afterValues: { transactionId: transaction.id, amount },
      riskLevel: 'medium',
    }).catch(() => {});

    if (link.created_by) {
      void notificationDispatch.paymentReceived(
        link.created_by, transaction.id, transaction.transactionRef, String(amount), link.currency,
      ).catch(() => {});
    }

    void invoicePaymentHandler.onPaymentLinkPaid(link.id, transaction.id, amount).catch(() => {});

    return {
      transactionId: transaction.id,
      transactionRef: transaction.transactionRef,
      amount,
      currency: link.currency,
      successUrl: link.success_url,
      redirectUrl: link.redirect_url,
    };
  }
}
