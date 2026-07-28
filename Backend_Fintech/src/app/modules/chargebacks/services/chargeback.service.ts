import { ChargebackRepository } from '../repositories/chargeback.repository';
import { NotFoundError, ValidationError } from '../../../shared/exceptions/app.exception';
import { auditRecorder } from '../../audit';
import { notificationDispatch } from '../../notifications';
import {
  AddEvidenceBodyDto,
  ChargebackListQueryDto,
  CreateChargebackBodyDto,
  RepresentmentBodyDto,
  ResolveChargebackBodyDto,
} from '../dto';
import { ChargebackEvidenceRow, ChargebackHistoryRow, ChargebackRow } from '../types/chargeback.types';

function mapChargeback(row: ChargebackRow) {
  return {
    id: row.id,
    uuid: row.uuid,
    disputeRef: row.dispute_ref,
    transactionId: row.transaction_id,
    transactionRef: row.transaction_ref ?? null,
    transactionAmount: row.transaction_amount ? Number(row.transaction_amount) : null,
    merchantId: row.merchant_id,
    merchantName: row.merchant_name ?? null,
    merchantCode: row.merchant_code ?? null,
    customerId: row.customer_id,
    customerName: row.customer_name ?? row.customer_email ?? null,
    customerEmail: row.customer_email ?? null,
    reason: row.reason,
    reasonCode: row.reason_code,
    cardNetwork: row.card_network,
    status: row.status,
    amount: Number(row.amount),
    currency: row.currency,
    evidenceDueAt: row.evidence_due_at,
    representmentNotes: row.representment_notes,
    representmentSubmittedAt: row.representment_submitted_at,
    representmentSubmittedBy: row.representment_submitted_by,
    representmentSubmittedByName: row.representment_submitted_by_name ?? null,
    resolutionNotes: row.resolution_notes,
    resolvedAt: row.resolved_at,
    resolvedBy: row.resolved_by,
    resolvedByName: row.resolved_by_name ?? null,
    createdBy: row.created_by,
    createdByName: row.created_by_name ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapHistory(row: ChargebackHistoryRow) {
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

function mapEvidence(row: ChargebackEvidenceRow) {
  return {
    id: row.id,
    uuid: row.uuid,
    fileName: row.file_name,
    fileUrl: row.file_url,
    mimeType: row.mime_type,
    description: row.description,
    uploadedBy: row.uploaded_by,
    uploadedByName: row.uploaded_by_name ?? null,
    createdAt: row.created_at,
  };
}

export class ChargebackService {
  constructor(private readonly repo = new ChargebackRepository()) {}

  async list(query: ChargebackListQueryDto) {
    const { items, total } = await this.repo.findAll(query);
    const stats = await this.repo.getStatistics();
    return {
      items: items.map(mapChargeback),
      stats: {
        total: Number(stats.total),
        open: Number(stats.open_count),
        evidenceRequired: Number(stats.evidence_required_count),
        underReview: Number(stats.under_review_count),
        representmentSubmitted: Number(stats.representment_count),
        won: Number(stats.won_count),
        lost: Number(stats.lost_count),
        closed: Number(stats.closed_count),
        openAmount: Number(stats.open_amount),
        wonAmount: Number(stats.won_amount),
        lostAmount: Number(stats.lost_amount),
      },
      pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) },
    };
  }

  async getStatistics() {
    const stats = await this.repo.getStatistics();
    return {
      total: Number(stats.total),
      open: Number(stats.open_count),
      evidenceRequired: Number(stats.evidence_required_count),
      underReview: Number(stats.under_review_count),
      representmentSubmitted: Number(stats.representment_count),
      won: Number(stats.won_count),
      lost: Number(stats.lost_count),
      closed: Number(stats.closed_count),
      openAmount: Number(stats.open_amount),
      wonAmount: Number(stats.won_amount),
      lostAmount: Number(stats.lost_amount),
    };
  }

  async getById(id: number) {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundError('Chargeback not found');
    const [history, evidence] = await Promise.all([this.repo.findHistory(id), this.repo.findEvidence(id)]);
    return { ...mapChargeback(row), history: history.map(mapHistory), evidence: evidence.map(mapEvidence) };
  }

  async create(dto: CreateChargebackBodyDto, actorId?: number) {
    try {
      const id = await this.repo.create(dto, actorId);
      const detail = await this.getById(id);
      void auditRecorder.record({
        module: 'chargebacks', categoryCode: 'transactions', actionCode: 'chargeback_open',
        entityType: 'chargeback', entityId: String(id),
        description: `Chargeback ${detail.disputeRef} opened for ${detail.amount} ${detail.currency}.`,
        afterValues: { transactionId: dto.transactionId, amount: detail.amount },
        riskLevel: 'high', userId: actorId,
      }).catch(() => {});
      if (actorId) {
        void notificationDispatch.chargebackOpened(actorId, id, detail.disputeRef, String(detail.amount), detail.currency).catch(() => {});
        if (detail.evidenceDueAt) {
          void notificationDispatch.chargebackEvidenceDue(
            actorId,
            id,
            detail.disputeRef,
            new Date(detail.evidenceDueAt).toISOString().slice(0, 10),
            String(detail.amount),
            detail.currency,
          ).catch(() => {});
        }
      }
      return detail;
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'TRANSACTION_NOT_FOUND') throw new NotFoundError('Transaction not found');
      throw err;
    }
  }

  async addEvidence(id: number, dto: AddEvidenceBodyDto, actorId?: number) {
    try {
      await this.repo.addEvidence(id, dto, actorId);
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message === 'NOT_FOUND') throw new NotFoundError('Chargeback not found');
        if (err.message === 'INVALID_STATUS') throw new ValidationError('Cannot add evidence to a resolved chargeback');
      }
      throw err;
    }
    const detail = await this.getById(id);
    void auditRecorder.record({
      module: 'chargebacks', categoryCode: 'transactions', actionCode: 'chargeback_evidence',
      entityType: 'chargeback', entityId: String(id),
      description: `Evidence "${dto.fileName}" uploaded for chargeback ${detail.disputeRef}.`,
      afterValues: { fileName: dto.fileName },
      riskLevel: 'medium', userId: actorId,
    }).catch(() => {});
    return detail;
  }

  async submitRepresentment(id: number, dto: RepresentmentBodyDto, actorId?: number) {
    try {
      await this.repo.submitRepresentment(id, dto, actorId);
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message === 'NOT_FOUND') throw new NotFoundError('Chargeback not found');
        if (err.message === 'INVALID_STATUS') throw new ValidationError('Chargeback cannot accept representment in current status');
      }
      throw err;
    }
    const detail = await this.getById(id);
    void auditRecorder.record({
      module: 'chargebacks', categoryCode: 'transactions', actionCode: 'chargeback_representment',
      entityType: 'chargeback', entityId: String(id),
      description: `Representment submitted for chargeback ${detail.disputeRef}.`,
      afterValues: { status: detail.status },
      riskLevel: 'medium', userId: actorId,
    }).catch(() => {});
    return detail;
  }

  async resolve(id: number, dto: ResolveChargebackBodyDto, actorId?: number) {
    const before = await this.getById(id);
    if (['won', 'lost', 'closed'].includes(before.status)) {
      throw new ValidationError('Chargeback is already resolved');
    }
    try {
      await this.repo.resolve(id, dto, actorId);
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message === 'NOT_FOUND') throw new NotFoundError('Chargeback not found');
        if (err.message === 'INVALID_STATUS') throw new ValidationError('Chargeback cannot be resolved in current status');
      }
      throw err;
    }
    const detail = await this.getById(id);
    void auditRecorder.record({
      module: 'chargebacks', categoryCode: 'transactions', actionCode: 'chargeback_resolve',
      entityType: 'chargeback', entityId: String(id),
      description: `Chargeback ${detail.disputeRef} resolved as ${dto.outcome}.`,
      beforeValues: { status: before.status }, afterValues: { status: detail.status, outcome: dto.outcome },
      riskLevel: 'high', userId: actorId,
    }).catch(() => {});
    if (actorId) {
      void notificationDispatch.chargebackResolved(actorId, id, detail.disputeRef, dto.outcome).catch(() => {});
    }
    return detail;
  }

  async getHistory(id: number) {
    await this.getById(id);
    const history = await this.repo.findHistory(id);
    return history.map(mapHistory);
  }

  async getEvidence(id: number) {
    await this.getById(id);
    const evidence = await this.repo.findEvidence(id);
    return evidence.map(mapEvidence);
  }

  async getSlaDashboard() {
    const stats = await this.repo.getSlaDashboard();
    return {
      total: Number(stats?.total ?? 0), breached: Number(stats?.breached ?? 0),
      dueSoon: Number(stats?.due_soon ?? 0), pendingRepresentment: Number(stats?.pending_representment ?? 0),
    };
  }

  async submitArbitration(id: number, notes: string | undefined, actorId?: number) {
    await this.getById(id);
    await this.repo.submitArbitration(id, notes, actorId);
    return this.getById(id);
  }

  async getAnalytics() {
    const stats = await this.repo.getAnalytics();
    return {
      total: Number(stats?.total ?? 0), won: Number(stats?.won ?? 0), lost: Number(stats?.lost ?? 0),
      totalAmount: Number(stats?.total_amount ?? 0), avgResolutionDays: Number(stats?.avg_resolution_days ?? 0),
    };
  }
}
