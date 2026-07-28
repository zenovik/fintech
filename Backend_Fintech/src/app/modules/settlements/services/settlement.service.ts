import { SettlementRepository } from '../repositories/settlement.repository';
import { NotFoundError, ValidationError } from '../../../shared/exceptions/app.exception';
import { ExportFileService } from '../../../shared/services/export-file.service';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { notificationDispatch } from '../../notifications';
import { auditRecorder } from '../../audit';
import {
  CreateBatchBodyDto,
  CreateSettlementBodyDto,
  ExportQueryDto,
  ReversalBodyDto,
  SettlementListQueryDto,
  SettlementSearchQueryDto,
  UpdateSettlementStatusBodyDto,
} from '../dto';
import {
  SettlementAdjustmentRow,
  SettlementBankTransferRow,
  SettlementBatchRow,
  SettlementFeeRow,
  SettlementNoteRow,
  SettlementReversalRow,
  SettlementRow,
  SettlementStatusHistoryRow,
  SettlementTransactionRow,
} from '../types/settlement.types';

function mapSettlement(row: SettlementRow) {
  return {
    id: row.id,
    uuid: row.uuid,
    settlementRef: row.settlement_ref,
    merchant: { id: row.merchant_id, code: row.merchant_code, name: row.merchant_name },
    batch: row.batch_id ? { id: row.batch_id, batchRef: row.batch_ref } : null,
    grossAmount: Number(row.gross_amount),
    feeAmount: Number(row.fee_amount),
    adjustmentAmount: Number(row.adjustment_amount),
    amount: Number(row.amount),
    currency: row.currency,
    status: row.status,
    settlementCycle: row.settlement_cycle,
    scheduledAt: row.scheduled_at,
    processedAt: row.processed_at,
    bankTransferRef: row.bank_transfer_ref,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    formattedAmount: formatCurrency(Number(row.amount), row.currency),
  };
}

function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
}

export class SettlementService {
  constructor(
    private readonly repo = new SettlementRepository(),
    private readonly exportFiles = new ExportFileService(),
  ) {}

  async list(query: SettlementListQueryDto) {
    const { items, total } = await this.repo.findAll(query);
    return {
      items: items.map(mapSettlement),
      pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) || 1 },
    };
  }

  async search(query: SettlementSearchQueryDto) {
    return { items: (await this.repo.search(query)).map(mapSettlement) };
  }

  async getStatistics(query: SettlementListQueryDto) {
    const stats = await this.repo.getStatistics(query);
    return {
      total: Number(stats.total),
      totalVolume: Number(stats.total_volume),
      processed: Number(stats.processed_count),
      pending: Number(stats.pending_count),
      processing: Number(stats.processing_count),
      failed: Number(stats.failed_count),
      reversed: Number(stats.reversed_count),
    };
  }

  async getById(id: number) {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundError('Settlement not found');

    const [transactions, statusHistory, reversals, fees, bankTransfers, notes, adjustments] = await Promise.all([
      this.repo.findTransactions(id),
      this.repo.findStatusHistory(id),
      this.repo.findReversals(id),
      this.repo.findFees(id),
      this.repo.findBankTransfers(id),
      this.repo.findNotes(id),
      this.repo.findAdjustments(id),
    ]);

    return {
      ...mapSettlement(row),
      transactions: transactions.map((t: SettlementTransactionRow) => ({
        id: t.id,
        transactionId: t.transaction_id,
        transactionRef: t.transaction_ref,
        amount: Number(t.amount),
        currency: t.currency,
        paymentMethodDetail: t.payment_method_detail,
        processedAt: t.processed_at,
      })),
      statusHistory: statusHistory.map((h: SettlementStatusHistoryRow) => ({
        id: h.id,
        fromStatus: h.from_status,
        toStatus: h.to_status,
        reason: h.reason,
        createdAt: h.created_at,
      })),
      reversals: reversals.map((r: SettlementReversalRow) => ({
        id: r.id,
        uuid: r.uuid,
        reversalRef: r.reversal_ref,
        amount: Number(r.amount),
        currency: r.currency,
        reason: r.reason,
        status: r.status,
        processedAt: r.processed_at,
        createdAt: r.created_at,
      })),
      fees: fees.map((f: SettlementFeeRow) => ({
        id: f.id,
        feeType: f.fee_type,
        amount: Number(f.amount),
        currency: f.currency,
        description: f.description,
      })),
      bankTransfers: bankTransfers.map((b: SettlementBankTransferRow) => ({
        id: b.id,
        uuid: b.uuid,
        bankName: b.bank_name,
        accountMasked: b.account_masked,
        transferRef: b.transfer_ref,
        amount: Number(b.amount),
        currency: b.currency,
        status: b.status,
        sentAt: b.sent_at,
        confirmedAt: b.confirmed_at,
      })),
      notes: notes.map((n: SettlementNoteRow) => ({
        id: n.id,
        uuid: n.uuid,
        noteText: n.note_text,
        isInternal: Boolean(n.is_internal),
        createdAt: n.created_at,
      })),
      adjustments: adjustments.map((a: SettlementAdjustmentRow) => ({
        id: a.id,
        uuid: a.uuid,
        adjustmentType: a.adjustment_type,
        amount: Number(a.amount),
        currency: a.currency,
        reason: a.reason,
      })),
    };
  }

  async getByTransactionId(transactionId: number) {
    const row = await this.repo.findByTransactionId(transactionId);
    if (!row) return null;
    return mapSettlement(row);
  }

  async create(dto: CreateSettlementBodyDto, userId?: number) {
    const id = await this.repo.create(dto, userId);
    return this.getById(id);
  }

  async updateStatus(id: number, dto: UpdateSettlementStatusBodyDto, userId?: number) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('Settlement not found');
    await this.repo.updateStatus(id, dto, userId);
    const detail = await this.getById(id);
    if (userId && dto.status === 'processed') {
      void notificationDispatch.settlementCompleted(
        userId, id, existing.settlement_ref, String(existing.amount), existing.currency,
      ).catch(() => {});
      void auditRecorder.settlementCompleted(id, existing.settlement_ref, String(existing.amount), { userId }).catch(() => {});
    }
    return detail;
  }

  async reversal(id: number, dto: ReversalBodyDto, userId?: number) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('Settlement not found');
    if (dto.amount > Number(existing.amount)) {
      throw new ValidationError('Reversal amount cannot exceed settlement amount');
    }
    const reversalId = await this.repo.createReversal(id, dto, userId);
    const detail = await this.getById(id);
    const reversal = detail.reversals.find((r) => r.id === reversalId);
    return { settlement: detail, reversal };
  }

  async getTransactions(id: number) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('Settlement not found');
    const transactions = await this.repo.findTransactions(id);
    return {
      items: transactions.map((t: SettlementTransactionRow) => ({
        id: t.id,
        transactionId: t.transaction_id,
        transactionRef: t.transaction_ref,
        amount: Number(t.amount),
        currency: t.currency,
        paymentMethodDetail: t.payment_method_detail,
        processedAt: t.processed_at,
      })),
    };
  }

  async getBatches() {
    const items = await this.repo.findBatches();
    return {
      items: items.map((b: SettlementBatchRow) => ({
        id: b.id,
        uuid: b.uuid,
        batchRef: b.batch_ref,
        status: b.status,
        totalAmount: Number(b.total_amount),
        settlementCount: b.settlement_count,
        currency: b.currency,
        scheduledAt: b.scheduled_at,
        processedAt: b.processed_at,
        createdAt: b.created_at,
      })),
    };
  }

  async getBatchById(id: number) {
    const batch = await this.repo.findBatchById(id);
    if (!batch) throw new NotFoundError('Batch not found');
    const { items } = await this.list({ page: 1, pageSize: 50, batchId: id, sortBy: 'created_at', sortOrder: 'desc' });
    return {
      id: batch.id,
      uuid: batch.uuid,
      batchRef: batch.batch_ref,
      status: batch.status,
      totalAmount: Number(batch.total_amount),
      settlementCount: batch.settlement_count,
      currency: batch.currency,
      scheduledAt: batch.scheduled_at,
      processedAt: batch.processed_at,
      createdAt: batch.created_at,
      settlements: items,
    };
  }

  async createBatch(dto: CreateBatchBodyDto, userId?: number) {
    const batchId = await this.repo.createBatch(dto, userId);
    return this.getBatchById(batchId);
  }

  async export(userId: number, query: ExportQueryDto) {
    const jobId = await this.repo.createExport(userId, query);
    const rows = await this.repo.exportRows(query);
    const { fileId, rowCount } = await this.exportFiles.writeCsv(
      'settlements',
      ['Settlement Ref', 'Merchant', 'Amount', 'Currency', 'Status', 'Processed At'],
      rows.map((r) => ({
        'Settlement Ref': r.settlement_ref,
        Merchant: r.merchant_name,
        Amount: Number(r.amount),
        Currency: r.currency,
        Status: r.status,
        'Processed At': r.processed_at ? new Date(r.processed_at).toISOString() : '',
      })),
      { userId, permissionCode: PERMISSIONS.SETTLEMENTS_EXPORT },
    );
    return {
      jobId,
      status: 'completed',
      format: query.format ?? 'csv',
      rowCount,
      message: 'Settlement export generated successfully',
      downloadUrl: this.exportFiles.buildDownloadUrl(fileId),
    };
  }
}
