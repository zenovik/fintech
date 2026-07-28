import { getOrganizationId } from '../../../shared/context/org-context';
import { ValidationError } from '../../../shared/exceptions/app.exception';
import { auditRecorder } from '../../audit';
import { PaymentConfigRepository } from '../repositories/payment-config.repository';

export class PaymentConfigService {
  constructor(private readonly repo = new PaymentConfigRepository()) {}

  async getMerchantConfig(merchantId: number) {
    const rows = await this.repo.findByMerchant(merchantId);
    return rows.map((r) => ({
      id: r.id, paymentMethodTypeId: r.payment_method_type_id, methodCode: r.method_code, methodName: r.method_name,
      status: r.status, settlementCycle: r.settlement_cycle, mdrPct: Number(r.mdr_pct), fixedFee: Number(r.fixed_fee),
      minFee: Number(r.min_fee), maxFee: r.max_fee ? Number(r.max_fee) : null,
      dailyLimit: r.daily_limit ? Number(r.daily_limit) : null, perTxnLimit: r.per_txn_limit ? Number(r.per_txn_limit) : null,
    }));
  }

  async saveConfig(merchantId: number, dto: Record<string, unknown>, actorId?: number) {
    const orgId = getOrganizationId();
    if (!orgId) throw new ValidationError('Organization context is required');
    const id = await this.repo.upsert(merchantId, orgId, dto, actorId);
    void auditRecorder.record({ module: 'payment_config', categoryCode: 'merchants', actionCode: 'pricing_changed', entityType: 'merchant_payment_config', entityId: String(id), description: 'Payment method config updated', userId: actorId }).catch(() => {});
    return this.getMerchantConfig(merchantId);
  }

  async listLimits(merchantId?: number) {
    return (await this.repo.listLimits(merchantId)).map((r) => ({
      id: r.id, ruleName: r.rule_name, scopeType: r.scope_type, merchantId: r.merchant_id, outletId: r.outlet_id,
      deviceId: r.device_id, perTxnLimit: r.per_txn_limit ? Number(r.per_txn_limit) : null,
      dailyLimit: r.daily_limit ? Number(r.daily_limit) : null, weeklyLimit: r.weekly_limit ? Number(r.weekly_limit) : null,
      monthlyLimit: r.monthly_limit ? Number(r.monthly_limit) : null, isActive: Boolean(r.is_active),
    }));
  }

  async saveLimit(dto: Record<string, unknown>) {
    const orgId = getOrganizationId();
    if (!orgId) throw new ValidationError('Organization context is required');
    await this.repo.upsertLimit(dto, orgId);
    return this.listLimits(dto.merchantId as number | undefined);
  }
}
