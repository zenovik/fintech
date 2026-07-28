import { RefundRepository } from '../repositories/refund.repository';
import { NotFoundError, ValidationError } from '../../../shared/exceptions/app.exception';
import { auditRecorder } from '../../audit';
import { notificationDispatch } from '../../notifications';
import { CreateRefundBodyDto, RefundListQueryDto, RejectRefundBodyDto } from '../dto';
import { RefundHistoryRow, RefundRow } from '../types/refund.types';

function mapRefund(row: RefundRow) {
  return {
    id: row.id,
    uuid: row.uuid,
    refundRef: row.refund_ref,
    transactionId: row.transaction_id,
    transactionRef: row.transaction_ref ?? null,
    transactionAmount: row.transaction_amount ? Number(row.transaction_amount) : null,
    merchantId: row.merchant_id,
    merchantName: row.merchant_name ?? null,
    merchantCode: row.merchant_code ?? null,
    customerId: row.customer_id,
    customerName: row.customer_name ?? row.customer_email ?? null,
    customerEmail: row.customer_email ?? null,
    refundType: row.refund_type,
    amount: Number(row.amount),
    currency: row.currency,
    reason: row.reason,
    status: row.status,
    requestedBy: row.requested_by,
    requestedByName: row.requested_by_name ?? null,
    approvedBy: row.approved_by,
    approvedByName: row.approved_by_name ?? null,
    rejectedBy: row.rejected_by,
    rejectedByName: row.rejected_by_name ?? null,
    approvedAt: row.approved_at,
    rejectedAt: row.rejected_at,
    rejectionReason: row.rejection_reason,
    processedAt: row.processed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapHistory(row: RefundHistoryRow) {
  return {
    id: row.id,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    reason: row.reason,
    changedBy: row.changed_by,
    changedByName: row.changed_by_name ?? null,
    createdAt: row.created_at,
  };
}

export class RefundService {
  constructor(private readonly repo = new RefundRepository()) {}

  async list(query: RefundListQueryDto) {
    const { items, total } = await this.repo.findAll(query);
    const stats = await this.repo.getStatistics();
    return {
      items: items.map(mapRefund),
      stats: {
        total: Number(stats.total),
        pending: Number(stats.pending_count),
        approved: Number(stats.approved_count),
        rejected: Number(stats.rejected_count),
        processed: Number(stats.processed_count),
        failed: Number(stats.failed_count),
        pendingAmount: Number(stats.pending_amount),
        processedAmount: Number(stats.processed_amount),
      },
      pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) },
    };
  }

  async getStatistics() {
    const stats = await this.repo.getStatistics();
    return {
      total: Number(stats.total),
      pending: Number(stats.pending_count),
      approved: Number(stats.approved_count),
      rejected: Number(stats.rejected_count),
      processed: Number(stats.processed_count),
      failed: Number(stats.failed_count),
      pendingAmount: Number(stats.pending_amount),
      processedAmount: Number(stats.processed_amount),
    };
  }

  async getById(id: number) {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundError('Refund not found');
    const history = await this.repo.findHistory(id);
    return { ...mapRefund(row), history: history.map(mapHistory) };
  }

  async createRequest(dto: CreateRefundBodyDto, actorId?: number) {
    try {
      const id = await this.repo.createRequest(dto, actorId);
      const detail = await this.getById(id);
      void auditRecorder.record({
        module: 'refunds', categoryCode: 'transactions', actionCode: 'refund_request',
        entityType: 'refund', entityId: String(id),
        description: `Submitted refund request ${detail.refundRef} for ${detail.amount} ${detail.currency}.`,
        afterValues: { transactionId: dto.transactionId, amount: dto.amount },
        riskLevel: 'low', userId: actorId,
      }).catch(() => {});
      if (actorId) {
        void notificationDispatch.refundRequested(actorId, id, detail.refundRef, String(detail.amount), detail.currency).catch(() => {});
      }
      return detail;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'TRANSACTION_NOT_FOUND') throw new NotFoundError('Transaction not found');
      if (msg === 'AMOUNT_EXCEEDS_REMAINING') throw new ValidationError('Refund amount exceeds remaining refundable balance');
      throw err;
    }
  }

  async approve(id: number, actorId?: number) {
    const before = await this.getById(id);
    if (before.status !== 'pending') throw new ValidationError('Only pending refunds can be approved');
    try {
      await this.repo.approve(id, actorId);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'INVALID_STATUS') throw new ValidationError('Refund cannot be approved');
      throw err;
    }
    const detail = await this.getById(id);
    void auditRecorder.record({
      module: 'refunds', categoryCode: 'transactions', actionCode: 'refund_approve',
      entityType: 'refund', entityId: String(id),
      description: `Approved refund ${detail.refundRef}.`,
      beforeValues: { status: before.status }, afterValues: { status: detail.status },
      riskLevel: 'medium', userId: actorId,
    }).catch(() => {});
    void auditRecorder.refund(detail.transactionId, detail.transactionRef ?? '', String(detail.amount), { userId: actorId }).catch(() => {});
    if (actorId) {
      void notificationDispatch.refundProcessed(actorId, detail.transactionId, detail.transactionRef ?? '', String(detail.amount), detail.currency).catch(() => {});
    }
    return detail;
  }

  async reject(id: number, dto: RejectRefundBodyDto, actorId?: number) {
    const before = await this.getById(id);
    if (before.status !== 'pending') throw new ValidationError('Only pending refunds can be rejected');
    try {
      await this.repo.reject(id, dto.reason, actorId);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'INVALID_STATUS') throw new ValidationError('Refund cannot be rejected');
      throw err;
    }
    const detail = await this.getById(id);
    void auditRecorder.record({
      module: 'refunds', categoryCode: 'transactions', actionCode: 'refund_reject',
      entityType: 'refund', entityId: String(id),
      description: `Rejected refund ${detail.refundRef}. Reason: ${dto.reason}`,
      beforeValues: { status: before.status }, afterValues: { status: detail.status, reason: dto.reason },
      riskLevel: 'medium', userId: actorId,
    }).catch(() => {});
    if (actorId) {
      void notificationDispatch.refundRejected(actorId, id, detail.refundRef, dto.reason).catch(() => {});
    }
    return detail;
  }

  async getHistory(id: number) {
    await this.getById(id);
    const history = await this.repo.findHistory(id);
    return history.map(mapHistory);
  }
}
