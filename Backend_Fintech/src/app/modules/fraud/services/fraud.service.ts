import { NotFoundError } from '../../../shared/exceptions/app.exception';
import { auditRecorder } from '../../audit';
import { notificationDispatch } from '../../notifications';
import { FraudRepository } from '../repositories/fraud.repository';

function mapCase(r: Record<string, unknown>) {
  return {
    id: r.id, uuid: r.uuid, caseRef: r.case_ref, organizationId: r.organization_id,
    merchantId: r.merchant_id, merchantName: r.merchant_name ?? null, transactionId: r.transaction_id,
    deviceId: r.device_id, fraudScore: Number(r.fraud_score), status: r.status, source: r.source,
    title: r.title, description: r.description, reviewerId: r.reviewer_id, reviewedAt: r.reviewed_at,
    reviewerRemarks: r.reviewer_remarks, createdAt: r.created_at,
  };
}

export class FraudService {
  constructor(private readonly repo = new FraudRepository()) {}

  async list(query: { page: number; pageSize: number; status?: string; search?: string }) {
    const { items, total } = await this.repo.findAll(query);
    const stats = await this.repo.getStatistics();
    return {
      items: items.map(mapCase),
      stats: {
        total: Number(stats.total ?? 0), pending: Number(stats.pending_count ?? 0),
        underReview: Number(stats.review_count ?? 0), avgScore: Number(stats.avg_score ?? 0),
      },
      pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) || 1 },
    };
  }

  async getById(id: number) {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundError('Fraud case not found');
    return mapCase(row);
  }

  async decide(id: number, decision: 'approved' | 'rejected' | 'released', remarks?: string, actorId?: number) {
    await this.getById(id);
    const status = decision === 'released' ? 'released' : decision;
    await this.repo.updateDecision(id, status, actorId, remarks);
    void auditRecorder.record({ module: 'fraud', categoryCode: 'operations', actionCode: 'fraud_decision', entityType: 'fraud_case', entityId: String(id), description: remarks ?? `Fraud case ${status}`, userId: actorId, riskLevel: 'high' }).catch(() => {});
    if (actorId) void notificationDispatch.dispatch({ userId: actorId, eventCode: 'fraud_alert_case', title: 'Fraud case updated', body: `Case #${id} ${status}`, relatedEntityType: 'fraud_case', relatedEntityId: id }).catch(() => {});
    return this.getById(id);
  }
}
