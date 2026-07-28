import { NotFoundError } from '../../../shared/exceptions/app.exception';
import { auditRecorder } from '../../audit';
import { PricingRepository } from '../repositories/pricing.repository';

export class PricingService {
  constructor(private readonly repo = new PricingRepository()) {}

  async list(query: { page: number; pageSize: number; scopeType?: string }) {
    const { items, total } = await this.repo.findAll(query);
    return {
      items: items.map((r) => ({
        id: r.id, planCode: r.plan_code, planName: r.plan_name, scopeType: r.scope_type,
        organizationId: r.organization_id, merchantId: r.merchant_id, categoryCode: r.category_code,
        isActive: Boolean(r.is_active), effectiveFrom: r.effective_from,
      })),
      pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) || 1 },
    };
  }

  async getById(id: number) {
    const plan = await this.repo.findById(id);
    if (!plan) throw new NotFoundError('Pricing plan not found');
    const fees = await this.repo.getFeeRules(id);
    return {
      id: plan.id, planCode: plan.plan_code, planName: plan.plan_name, scopeType: plan.scope_type,
      feeRules: fees.map((f) => ({
        id: f.id, paymentMethodTypeId: f.payment_method_type_id, methodCode: f.method_code,
        feeType: f.fee_type, mdrPct: f.mdr_pct ? Number(f.mdr_pct) : null, fixedFee: f.fixed_fee ? Number(f.fixed_fee) : null,
        percentageFee: f.percentage_fee ? Number(f.percentage_fee) : null, minFee: f.min_fee ? Number(f.min_fee) : null,
        maxFee: f.max_fee ? Number(f.max_fee) : null,
      })),
    };
  }

  async create(dto: Record<string, unknown>, actorId?: number) {
    const id = await this.repo.createPlan(dto, actorId);
    if (Array.isArray(dto.feeRules)) {
      for (const rule of dto.feeRules as Record<string, unknown>[]) {
        await this.repo.saveFeeRule(id, rule);
      }
    }
    void auditRecorder.record({ module: 'pricing', categoryCode: 'merchants', actionCode: 'pricing_changed', entityType: 'pricing_plan', entityId: String(id), description: 'Pricing plan created', userId: actorId }).catch(() => {});
    return this.getById(id);
  }
}
