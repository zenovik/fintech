import { TransactionRepository } from '../repositories/transaction.repository';
import { NotFoundError } from '../../../shared/exceptions/app.exception';
import { ExportFileService } from '../../../shared/services/export-file.service';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { notificationDispatch } from '../../notifications';
import { auditRecorder } from '../../audit';
import { RefundService } from '../../refunds/services/refund.service';
import { ChargebackService } from '../../chargebacks/services/chargeback.service';
import {
  CreateDisputeBodyDto,
  CreateTransactionBodyDto,
  ExportQueryDto,
  RefundTransactionBodyDto,
  TransactionListQueryDto,
  TransactionSearchQueryDto,
  UpdateTransactionStatusBodyDto,
} from '../dto';
import {
  TransactionAttachmentRow,
  TransactionDisputeRow,
  TransactionEventRow,
  TransactionFeeRow,
  TransactionNoteRow,
  TransactionRefundRow,
  TransactionRow,
  TransactionStatusHistoryRow,
} from '../types/transaction.types';

function mapTransaction(row: TransactionRow) {
  return {
    id: row.id,
    uuid: row.uuid,
    transactionRef: row.transaction_ref,
    merchant: {
      id: row.merchant_id,
      code: row.merchant_code,
      name: row.merchant_name,
      initials: row.logo_initials ?? row.merchant_name.slice(0, 2).toUpperCase(),
      color: row.logo_color,
    },
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerId: row.customer_id ?? null,
    description: row.description,
    amount: Number(row.amount),
    feeAmount: Number(row.fee_amount),
    netAmount: row.net_amount ? Number(row.net_amount) : null,
    currency: row.currency,
    paymentMethod: {
      typeId: row.payment_method_type_id,
      detail: row.payment_method_detail,
      iconKey: row.payment_icon_key,
    },
    status: {
      code: row.status_code,
      label: row.status_label,
      badgeColor: row.badge_color,
    },
    region: { id: row.region_id, code: row.region_code },
    isHighValue: Boolean(row.is_high_value),
    processedAt: row.processed_at,
    settledAt: row.settled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    formattedAmount: formatCurrency(Number(row.amount), row.currency),
  };
}

function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
}

export class TransactionService {
  constructor(
    private readonly repo = new TransactionRepository(),
    private readonly exportFiles = new ExportFileService(),
    private readonly refundService = new RefundService(),
    private readonly chargebackService = new ChargebackService(),
  ) {}

  async list(query: TransactionListQueryDto) {
    const { items, total } = await this.repo.findAll(query);
    return {
      items: items.map(mapTransaction),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize) || 1,
      },
    };
  }

  async search(query: TransactionSearchQueryDto) {
    const items = await this.repo.search(query);
    return { items: items.map(mapTransaction) };
  }

  async getStatistics(query: Partial<TransactionListQueryDto>) {
    const stats = await this.repo.getStatistics(query);
    return {
      total: Number(stats.total),
      totalVolume: Number(stats.total_volume),
      settled: Number(stats.settled_count),
      pending: Number(stats.pending_count),
      failed: Number(stats.failed_count),
      flagged: Number(stats.flagged_count),
      highValue: Number(stats.high_value_count),
      refunds: Number(stats.refund_count),
      disputes: Number(stats.dispute_count),
    };
  }

  async getById(id: number) {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundError('Transaction not found');

    const [events, statusHistory, refunds, fees, notes, attachments, disputes, linkedSettlement] = await Promise.all([
      this.repo.findEvents(id),
      this.repo.findStatusHistory(id),
      this.repo.findRefunds(id),
      this.repo.findFees(id),
      this.repo.findNotes(id),
      this.repo.findAttachments(id),
      this.repo.findDisputes(id),
      this.repo.findLinkedSettlement(id),
    ]);

    return {
      ...mapTransaction(row),
      settlement: linkedSettlement
        ? {
            id: Number(linkedSettlement['id']),
            uuid: linkedSettlement['uuid'] as string,
            settlementRef: linkedSettlement['settlement_ref'] as string,
            amount: Number(linkedSettlement['amount']),
            currency: linkedSettlement['currency'] as string,
            status: linkedSettlement['status'] as string,
            processedAt: linkedSettlement['processed_at'] as Date,
          }
        : null,
      events: events.map((e: TransactionEventRow) => ({
        id: e.id,
        uuid: e.uuid,
        eventType: e.event_type,
        eventData: typeof e.event_data === 'string' ? JSON.parse(e.event_data) : e.event_data,
        createdAt: e.created_at,
      })),
      statusHistory: statusHistory.map((h: TransactionStatusHistoryRow) => ({
        id: h.id,
        fromStatus: h.from_status_code ? { code: h.from_status_code, label: h.from_status_label } : null,
        toStatus: { code: h.to_status_code, label: h.to_status_label },
        reason: h.reason,
        createdAt: h.created_at,
      })),
      refunds: refunds.map((r: TransactionRefundRow) => ({
        id: r.id,
        uuid: r.uuid,
        refundRef: r.refund_ref,
        amount: Number(r.amount),
        currency: r.currency,
        reason: r.reason,
        status: r.status,
        processedAt: r.processed_at,
        createdAt: r.created_at,
      })),
      fees: fees.map((f: TransactionFeeRow) => ({
        id: f.id,
        feeType: f.fee_type,
        amount: Number(f.amount),
        currency: f.currency,
        description: f.description,
      })),
      notes: notes.map((n: TransactionNoteRow) => ({
        id: n.id,
        uuid: n.uuid,
        noteText: n.note_text,
        isInternal: Boolean(n.is_internal),
        createdAt: n.created_at,
      })),
      attachments: attachments.map((a: TransactionAttachmentRow) => ({
        id: a.id,
        uuid: a.uuid,
        fileName: a.file_name,
        fileUrl: a.file_url,
        mimeType: a.mime_type,
        createdAt: a.created_at,
      })),
      disputes: disputes.map((d: TransactionDisputeRow) => ({
        id: d.id,
        uuid: d.uuid,
        disputeRef: d.dispute_ref,
        reason: d.reason,
        status: d.status,
        amount: Number(d.amount),
        currency: d.currency,
        evidenceDueAt: d.evidence_due_at,
        resolvedAt: d.resolved_at,
        createdAt: d.created_at,
      })),
    };
  }

  async create(dto: CreateTransactionBodyDto, userId?: number) {
    const id = await this.repo.create(dto, userId);
    return this.getById(id);
  }

  async updateStatus(id: number, dto: UpdateTransactionStatusBodyDto, userId?: number) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('Transaction not found');
    await this.repo.updateStatus(id, dto, userId);
    const detail = await this.getById(id);
    if (userId && dto.statusCode === 'failed') {
      void notificationDispatch.paymentFailed(userId, id, existing.transaction_ref, dto.reason).catch(() => {});
      void auditRecorder.paymentFailed(id, existing.transaction_ref, dto.reason, { userId }).catch(() => {});
    }
    return detail;
  }

  async refund(id: number, dto: RefundTransactionBodyDto, userId?: number) {
    const refund = await this.refundService.createRequest(
      { transactionId: id, amount: dto.amount, reason: dto.reason },
      userId,
    );
    const detail = await this.getById(id);
    return { transaction: detail, refund };
  }

  async getDisputes() {
    const result = await this.chargebackService.list({
      page: 1,
      pageSize: 100,
      sortBy: 'created_at',
      sortOrder: 'desc',
    });
    return {
      items: result.items.map((d) => ({
        id: d.id,
        uuid: d.uuid,
        disputeRef: d.disputeRef,
        transactionId: d.transactionId,
        transactionRef: d.transactionRef,
        merchantName: d.merchantName,
        reason: d.reason,
        status: d.status,
        amount: d.amount,
        currency: d.currency,
        evidenceDueAt: d.evidenceDueAt,
        resolvedAt: d.resolvedAt,
        createdAt: d.createdAt,
      })),
    };
  }

  async createDispute(dto: CreateDisputeBodyDto, userId?: number) {
    const detail = await this.chargebackService.create(
      {
        transactionId: dto.transactionId,
        reason: dto.reason,
        reasonCode: 'other',
        cardNetwork: 'visa',
        amount: dto.amount,
      },
      userId,
    );
    return {
      id: detail.id,
      uuid: detail.uuid,
      disputeRef: detail.disputeRef,
      transactionId: detail.transactionId,
      transactionRef: detail.transactionRef,
      reason: detail.reason,
      status: detail.status,
      amount: detail.amount,
      currency: detail.currency,
      evidenceDueAt: detail.evidenceDueAt,
      createdAt: detail.createdAt,
    };
  }

  async export(userId: number, query: ExportQueryDto) {
    const jobId = await this.repo.createExport(userId, query);
    const rows = await this.repo.exportRows(query);
    const { fileId, rowCount } = await this.exportFiles.writeCsv(
      'transactions',
      ['Transaction Ref', 'Merchant', 'Amount', 'Currency', 'Status', 'Processed At'],
      rows.map((r) => ({
        'Transaction Ref': r.transaction_ref,
        Merchant: r.merchant_name,
        Amount: Number(r.amount),
        Currency: r.currency,
        Status: r.status_label,
        'Processed At': r.processed_at ? new Date(r.processed_at).toISOString() : '',
      })),
      { userId, permissionCode: PERMISSIONS.TRANSACTIONS_EXPORT },
    );
    return {
      jobId,
      status: 'completed',
      format: query.format ?? 'csv',
      rowCount,
      message: 'Transaction export generated successfully',
      downloadUrl: this.exportFiles.buildDownloadUrl(fileId),
    };
  }
}
