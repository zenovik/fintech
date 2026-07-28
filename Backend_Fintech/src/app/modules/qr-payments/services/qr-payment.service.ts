import QRCode from 'qrcode';
import { getPool } from '../../../database';
import { getOrganizationId } from '../../../shared/context/org-context';
import { NotFoundError, ValidationError, GoneError } from '../../../shared/exceptions/app.exception';
import { env } from '../../../config';
import { auditRecorder } from '../../audit';
import { notificationDispatch } from '../../notifications';
import { TransactionService } from '../../transactions/services/transaction.service';
import { QrPaymentRepository, QrCodeRow } from '../repositories/qr-payment.repository';
import { CreateQrBodyDto, PublicQrPayBodyDto, QrListQueryDto, UpdateQrBodyDto } from '../dto';

function mapQr(row: QrCodeRow) {
  const payUrl = `${env.corsOrigin.replace(/\/$/, '')}/qr/${row.public_token}`;
  return {
    id: row.id, uuid: row.uuid, organizationId: row.organization_id,
    organizationName: row.organization_name ?? null, merchantId: row.merchant_id,
    merchantName: row.merchant_name ?? null, customerId: row.customer_id,
    customerName: row.customer_name ?? null, qrRef: row.qr_ref, qrType: row.qr_type,
    title: row.title, description: row.description,
    amount: row.amount ? Number(row.amount) : null, currency: row.currency,
    allowCustomAmount: Boolean(row.allow_custom_amount), expiresAt: row.expires_at,
    scanCount: row.scan_count, status: row.status, publicToken: row.public_token,
    payUrl, totalCollected: Number(row.total_collected ?? 0),
    createdByName: row.created_by_name ?? null, createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

export class QrPaymentService {
  constructor(
    private readonly repo = new QrPaymentRepository(),
    private readonly transactionService = new TransactionService(),
  ) {}

  async list(query: QrListQueryDto) {
    const { items, total } = await this.repo.findAll(query);
    const stats = await this.repo.getStatistics();
    return {
      items: items.map(mapQr),
      stats: {
        total: Number(stats?.total ?? 0), active: Number(stats?.active_count ?? 0),
        disabled: Number(stats?.disabled_count ?? 0), totalScans: Number(stats?.total_scans ?? 0),
        totalCollected: Number(stats?.total_collected ?? 0),
      },
      pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) },
    };
  }

  async getStatistics() {
    const stats = await this.repo.getStatistics();
    return {
      total: Number(stats?.total ?? 0), active: Number(stats?.active_count ?? 0),
      disabled: Number(stats?.disabled_count ?? 0), totalScans: Number(stats?.total_scans ?? 0),
      totalCollected: Number(stats?.total_collected ?? 0),
    };
  }

  async getById(id: number) {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundError('QR code not found');
    return mapQr(row);
  }

  async create(dto: CreateQrBodyDto, actorId?: number) {
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
      module: 'qr_payments', categoryCode: 'transactions', actionCode: 'qr_code_created',
      entityType: 'qr_code', entityId: String(id),
      description: `Created QR code ${detail.qrRef}: ${detail.title}.`,
      afterValues: { qrType: detail.qrType, amount: detail.amount }, riskLevel: 'low', userId: actorId,
    }).catch(() => {});
    if (actorId) void notificationDispatch.qrCodeCreated(actorId, id, detail.qrRef, detail.title).catch(() => {});
    return detail;
  }

  async update(id: number, dto: UpdateQrBodyDto, actorId?: number) {
    await this.getById(id);
    await this.repo.update(id, dto, actorId);
    void auditRecorder.record({
      module: 'qr_payments', categoryCode: 'transactions', actionCode: 'qr_code_updated',
      entityType: 'qr_code', entityId: String(id), description: `Updated QR code.`,
      riskLevel: 'low', userId: actorId,
    }).catch(() => {});
    return this.getById(id);
  }

  async enable(id: number, actorId?: number) { await this.repo.setStatus(id, 'active', actorId); return this.getById(id); }
  async disable(id: number, actorId?: number) {
    const before = await this.getById(id);
    await this.repo.setStatus(id, 'disabled', actorId);
    void auditRecorder.record({
      module: 'qr_payments', categoryCode: 'transactions', actionCode: 'qr_code_disabled',
      entityType: 'qr_code', entityId: String(id), description: `Disabled QR code ${before.qrRef}.`,
      riskLevel: 'medium', userId: actorId,
    }).catch(() => {});
    return this.getById(id);
  }

  async regenerateToken(id: number, actorId?: number) {
    await this.repo.regenerateToken(id, actorId);
    return this.getById(id);
  }

  async getQrImage(id: number): Promise<{ dataUrl: string; payUrl: string }> {
    const detail = await this.getById(id);
    const dataUrl = await QRCode.toDataURL(detail.payUrl, { width: 256, margin: 2 });
    return { dataUrl, payUrl: detail.payUrl };
  }

  async getQrSvg(id: number): Promise<{ svg: string; payUrl: string }> {
    const detail = await this.getById(id);
    const svg = await QRCode.toString(detail.payUrl, { type: 'svg', width: 256, margin: 2 });
    return { svg, payUrl: detail.payUrl };
  }

  async clone(id: number, actorId?: number) {
    const orgId = getOrganizationId();
    if (!orgId) throw new ValidationError('Organization context is required');
    const newId = await this.repo.clone(id, orgId, actorId);
    return this.getById(newId);
  }

  async archive(id: number, actorId?: number) {
    await this.getById(id);
    await this.repo.archive(id, actorId);
    return this.getById(id);
  }

  async bulkCreate(items: CreateQrBodyDto[], actorId?: number) {
    const orgId = getOrganizationId();
    if (!orgId) throw new ValidationError('Organization context is required');
    const ids = await this.repo.bulkCreate(items, orgId, actorId);
    void auditRecorder.record({
      module: 'qr_payments', categoryCode: 'transactions', actionCode: 'qr_bulk_generated',
      entityType: 'qr_code', entityId: 'bulk', description: `Bulk generated ${ids.length} QR codes`, userId: actorId, riskLevel: 'low',
    }).catch(() => {});
    return { created: ids.length, ids, items: await Promise.all(ids.map((i) => this.getById(i))) };
  }

  async scanHistory(id: number, page = 1, pageSize = 25) {
    await this.getById(id);
    const { items, total } = await this.repo.getScanHistory(id, page, pageSize);
    return { items, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) || 1 } };
  }

  async listTemplates() {
    return (await this.repo.listTemplates()).map((t) => ({
      id: t.id, code: t.code, name: t.name, layout: t.layout, primaryColor: t.primary_color, printReady: Boolean(t.print_ready),
    }));
  }

  async listCategories() {
    const orgId = getOrganizationId();
    if (!orgId) throw new ValidationError('Organization context is required');
    return (await this.repo.listCategories(orgId)).map((c) => ({ id: c.id, code: c.code, name: c.name }));
  }

  private validateForPayment(row: QrCodeRow): void {
    if (row.status === 'disabled') throw new GoneError('This QR code has been disabled');
    if (row.expires_at && new Date(row.expires_at) <= new Date()) throw new GoneError('This QR code has expired');
  }

  async getPublicQr(token: string) {
    const row = await this.repo.findByToken(token);
    if (!row) throw new NotFoundError('QR code not found');
    this.validateForPayment(row);
    void this.repo.recordScan(row.id, {}, 'viewed');
    return {
      title: row.title, description: row.description,
      amount: row.amount ? Number(row.amount) : null, currency: row.currency,
      allowCustomAmount: Boolean(row.allow_custom_amount), qrType: row.qr_type,
      merchantName: row.merchant_name, expiresAt: row.expires_at,
    };
  }

  async processPayment(token: string, dto: PublicQrPayBodyDto) {
    const row = await this.repo.findByToken(token);
    if (!row) throw new NotFoundError('QR code not found');
    this.validateForPayment(row);

    let amount = row.amount ? Number(row.amount) : undefined;
    if (row.allow_custom_amount || row.qr_type === 'dynamic' || row.qr_type === 'merchant') {
      if (!dto.amount) throw new ValidationError('Amount is required for this QR code');
      amount = dto.amount;
    }
    if (!amount || amount <= 0) throw new ValidationError('Invalid payment amount');

    const transaction = await this.transactionService.create({
      merchantId: row.merchant_id, amount, currency: row.currency,
      paymentMethodTypeId: 1, paymentMethodDetail: dto.paymentMethodDetail ?? 'QR Payment',
      customerName: dto.customerName ?? row.customer_name ?? undefined,
      customerEmail: dto.customerEmail ?? undefined,
      description: `Payment via QR ${row.qr_ref}: ${row.title}`,
    });
    await this.transactionService.updateStatus(transaction.id, { statusCode: 'settled' });

    const pool = getPool();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await this.repo.recordPayment(conn, row.id, transaction.id, amount);
      await conn.commit();
    } catch (err) { await conn.rollback(); throw err; } finally { conn.release(); }

    await this.repo.recordScan(row.id, {}, 'paid', amount, transaction.id);

    await auditRecorder.record({
      module: 'qr_payments', categoryCode: 'transactions', actionCode: 'qr_code_paid',
      entityType: 'qr_code', entityId: String(row.id),
      description: `Payment of ${amount} ${row.currency} received via QR ${row.qr_ref}.`,
      afterValues: { transactionId: transaction.id, amount }, riskLevel: 'medium',
    }).catch(() => {});
    if (row.created_by) {
      await notificationDispatch.qrPaymentReceived(row.created_by, row.id, row.qr_ref, String(amount), row.currency).catch(() => {});
    }

    return { transactionId: transaction.id, transactionRef: transaction.transactionRef, amount, currency: row.currency };
  }
}
