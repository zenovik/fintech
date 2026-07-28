import { PayoutRepository } from '../repositories/payout.repository';
import { NotFoundError, ValidationError } from '../../../shared/exceptions/app.exception';
import { auditRecorder } from '../../audit';
import { notificationDispatch } from '../../notifications';
import {
  BankAccountListQueryDto,
  CreateBankAccountBodyDto,
  CreatePayoutBodyDto,
  PayoutListQueryDto,
  RejectPayoutBodyDto,
  UpdateBankAccountBodyDto,
} from '../dto';
import { BankAccountRow, PayoutHistoryRow, PayoutRow } from '../types/payout.types';

function mapPayout(row: PayoutRow) {
  return {
    id: row.id,
    uuid: row.uuid,
    payoutRef: row.payout_ref,
    merchantId: row.merchant_id,
    merchantName: row.merchant_name ?? null,
    merchantCode: row.merchant_code ?? null,
    settlementId: row.settlement_id,
    settlementRef: row.settlement_ref ?? null,
    bankAccountId: row.bank_account_id,
    bankName: row.bank_name ?? null,
    accountMasked: row.account_masked ?? null,
    batchId: row.batch_id,
    amount: Number(row.amount),
    feeAmount: Number(row.fee_amount),
    currency: row.currency,
    payoutType: row.payout_type,
    payoutMethod: row.payout_method,
    status: row.status,
    transferRef: row.transfer_ref,
    failureReason: row.failure_reason,
    notes: row.notes,
    scheduledAt: row.scheduled_at,
    processedAt: row.processed_at,
    confirmedAt: row.confirmed_at,
    approvedBy: row.approved_by,
    approvedByName: row.approved_by_name ?? null,
    approvedAt: row.approved_at,
    createdByName: row.created_by_name ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapHistory(row: PayoutHistoryRow) {
  return {
    id: row.id,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    reason: row.reason,
    changedByName: row.changed_by_name ?? null,
    createdAt: row.created_at,
  };
}

function mapBankAccount(row: BankAccountRow) {
  return {
    id: row.id,
    uuid: row.uuid,
    merchantId: row.merchant_id,
    merchantName: row.merchant_name ?? null,
    accountHolder: row.account_holder,
    bankName: row.bank_name,
    accountNumberMasked: row.account_number_masked,
    iban: row.iban,
    swiftBic: row.swift_bic,
    currency: row.currency,
    isPrimary: Boolean(row.is_primary),
    createdAt: row.created_at,
  };
}

export class PayoutService {
  constructor(private readonly repo = new PayoutRepository()) {}

  async list(query: PayoutListQueryDto) {
    const { items, total } = await this.repo.findAll(query);
    const stats = await this.repo.getStatistics();
    return {
      items: items.map(mapPayout),
      stats: {
        total: Number(stats.total),
        pending: Number(stats.pending_count),
        scheduled: Number(stats.scheduled_count),
        processing: Number(stats.processing_count),
        sent: Number(stats.sent_count),
        confirmed: Number(stats.confirmed_count),
        failed: Number(stats.failed_count),
        cancelled: Number(stats.cancelled_count),
        pendingAmount: Number(stats.pending_amount),
        confirmedAmount: Number(stats.confirmed_amount),
        failedAmount: Number(stats.failed_amount),
      },
      pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) },
    };
  }

  async getStatistics() {
    const stats = await this.repo.getStatistics();
    return {
      total: Number(stats.total),
      pending: Number(stats.pending_count),
      scheduled: Number(stats.scheduled_count),
      processing: Number(stats.processing_count),
      sent: Number(stats.sent_count),
      confirmed: Number(stats.confirmed_count),
      failed: Number(stats.failed_count),
      cancelled: Number(stats.cancelled_count),
      pendingAmount: Number(stats.pending_amount),
      confirmedAmount: Number(stats.confirmed_amount),
      failedAmount: Number(stats.failed_amount),
    };
  }

  async getById(id: number) {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundError('Payout not found');
    const history = await this.repo.findHistory(id);
    return { ...mapPayout(row), history: history.map(mapHistory) };
  }

  async create(dto: CreatePayoutBodyDto, actorId?: number) {
    try {
      const id = await this.repo.create(dto, actorId);
      const detail = await this.getById(id);
      void auditRecorder.record({
        module: 'payouts', categoryCode: 'settlements', actionCode: 'payout_request',
        entityType: 'payout', entityId: String(id),
        description: `Payout ${detail.payoutRef} for ${detail.amount} ${detail.currency} submitted.`,
        afterValues: { merchantId: dto.merchantId, amount: detail.amount },
        riskLevel: 'medium', userId: actorId,
      }).catch(() => {});
      if (actorId) {
        if (detail.status === 'scheduled') {
          void notificationDispatch.payoutScheduled(actorId, id, detail.payoutRef, String(detail.amount), detail.currency).catch(() => {});
        }
      }
      return detail;
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message === 'SETTLEMENT_NOT_FOUND') throw new NotFoundError('Settlement not found');
        if (err.message === 'SETTLEMENT_MERCHANT_MISMATCH') throw new ValidationError('Settlement does not belong to merchant');
        if (err.message === 'INVALID_BANK_ACCOUNT') throw new ValidationError('Invalid bank account for merchant');
      }
      throw err;
    }
  }

  async approve(id: number, actorId?: number) {
    const before = await this.getById(id);
    if (!['pending', 'scheduled'].includes(before.status)) {
      throw new ValidationError('Only pending or scheduled payouts can be approved');
    }
    try {
      await this.repo.approve(id, actorId);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'INVALID_STATUS') throw new ValidationError('Payout cannot be approved');
      throw err;
    }
    const detail = await this.getById(id);
    void auditRecorder.record({
      module: 'payouts', categoryCode: 'settlements', actionCode: 'payout_approve',
      entityType: 'payout', entityId: String(id),
      description: `Approved payout ${detail.payoutRef}.`,
      beforeValues: { status: before.status }, afterValues: { status: detail.status },
      riskLevel: 'medium', userId: actorId,
    }).catch(() => {});
    void auditRecorder.record({
      module: 'payouts', categoryCode: 'settlements', actionCode: 'payout_sent',
      entityType: 'payout', entityId: String(id),
      description: `Payout ${detail.payoutRef} confirmed.`,
      riskLevel: 'high', userId: actorId,
    }).catch(() => {});
    if (actorId) {
      void notificationDispatch.payoutCompleted(actorId, id, detail.payoutRef, String(detail.amount), detail.currency).catch(() => {});
    }
    return detail;
  }

  async reject(id: number, dto: RejectPayoutBodyDto, actorId?: number) {
    const before = await this.getById(id);
    if (before.status !== 'pending') throw new ValidationError('Only pending payouts can be rejected');
    try {
      await this.repo.reject(id, dto.reason, actorId);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'INVALID_STATUS') throw new ValidationError('Payout cannot be rejected');
      throw err;
    }
    const detail = await this.getById(id);
    if (actorId) {
      void notificationDispatch.payoutFailed(actorId, id, detail.payoutRef, dto.reason).catch(() => {});
    }
    return detail;
  }

  async retry(id: number, actorId?: number) {
    const before = await this.getById(id);
    if (before.status !== 'failed') throw new ValidationError('Only failed payouts can be retried');
    try {
      await this.repo.retry(id, actorId);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'INVALID_STATUS') throw new ValidationError('Payout cannot be retried');
      throw err;
    }
    const detail = await this.getById(id);
    void auditRecorder.record({
      module: 'payouts', categoryCode: 'settlements', actionCode: 'payout_sent',
      entityType: 'payout', entityId: String(id),
      description: `Retried payout ${detail.payoutRef} — confirmed.`,
      beforeValues: { status: before.status }, afterValues: { status: detail.status },
      riskLevel: 'high', userId: actorId,
    }).catch(() => {});
    if (actorId) {
      void notificationDispatch.payoutCompleted(actorId, id, detail.payoutRef, String(detail.amount), detail.currency).catch(() => {});
    }
    return detail;
  }

  async getHistory(id: number) {
    await this.getById(id);
    const history = await this.repo.findHistory(id);
    return history.map(mapHistory);
  }

  async listBankAccounts(query: BankAccountListQueryDto) {
    const rows = await this.repo.findBankAccounts(query);
    return rows.map(mapBankAccount);
  }

  async createBankAccount(dto: CreateBankAccountBodyDto) {
    const id = await this.repo.createBankAccount(dto);
    const row = await this.repo.findBankAccountById(id);
    return mapBankAccount(row!);
  }

  async updateBankAccount(id: number, dto: UpdateBankAccountBodyDto) {
    try {
      await this.repo.updateBankAccount(id, dto);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'NOT_FOUND') throw new NotFoundError('Bank account not found');
      throw err;
    }
    const row = await this.repo.findBankAccountById(id);
    return mapBankAccount(row!);
  }
}
