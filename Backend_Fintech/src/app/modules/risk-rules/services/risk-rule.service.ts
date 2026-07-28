import { NotFoundError } from '../../../shared/exceptions/app.exception';
import { auditRecorder } from '../../audit';
import { notificationDispatch } from '../../notifications';
import { RiskRuleRepository } from '../repositories/risk-rule.repository';

function mapRule(r: Record<string, unknown>) {
  return {
    id: r.id, ruleCode: r.rule_code, ruleName: r.rule_name, ruleType: r.rule_type,
    organizationId: r.organization_id, merchantId: r.merchant_id,
    thresholdValue: r.threshold_value ? Number(r.threshold_value) : null,
    thresholdCount: r.threshold_count, countryCode: r.country_code, action: r.action,
    priority: r.priority, isActive: Boolean(r.is_active), configJson: r.config_json,
  };
}

export class RiskRuleService {
  constructor(private readonly repo = new RiskRuleRepository()) {}

  async list(query: { page: number; pageSize: number; ruleType?: string; isActive?: boolean }) {
    const { items, total } = await this.repo.findAll(query);
    return {
      items: items.map(mapRule),
      pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) || 1 },
    };
  }

  async getById(id: number) {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundError('Risk rule not found');
    return mapRule(row);
  }

  async create(dto: Record<string, unknown>, actorId?: number) {
    const id = await this.repo.create(dto, actorId);
    void auditRecorder.record({ module: 'risk_rules', categoryCode: 'operations', actionCode: 'risk_rule_changed', entityType: 'risk_rule', entityId: String(id), description: 'Risk rule created', userId: actorId, riskLevel: 'high' }).catch(() => {});
    return this.getById(id);
  }

  async update(id: number, dto: Record<string, unknown>, actorId?: number) {
    await this.requireRule(id);
    await this.repo.update(id, dto);
    void auditRecorder.record({ module: 'risk_rules', categoryCode: 'operations', actionCode: 'risk_rule_changed', entityType: 'risk_rule', entityId: String(id), description: 'Risk rule updated', userId: actorId, riskLevel: 'high' }).catch(() => {});
    return this.getById(id);
  }

  async evaluate(id: number, dto: { transactionId?: number; merchantId?: number; amount?: number }, actorId?: number) {
    const rule = await this.requireRule(id);
    let matched = false;
    let actionTaken = rule.action as string;
    if (rule.rule_type === 'large_amount' && dto.amount && rule.threshold_value) {
      matched = dto.amount >= Number(rule.threshold_value);
    }
    if (matched && actorId) {
      void notificationDispatch.dispatch({ userId: actorId, eventCode: 'risk_alert', title: 'Risk rule triggered', body: `${rule.rule_name} matched`, metadata: { ruleId: id } }).catch(() => {});
    }
    await this.repo.logEvaluation(id, { ...dto, matched, actionTaken: matched ? actionTaken : null, score: matched ? 75 : 10 });
    return { ruleId: id, matched, actionTaken: matched ? actionTaken : 'none' };
  }

  private async requireRule(id: number) {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundError('Risk rule not found');
    return row;
  }
}
