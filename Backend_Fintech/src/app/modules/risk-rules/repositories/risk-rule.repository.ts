import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { randomUUID } from 'node:crypto';
import { getPool } from '../../../database';
import { getOrganizationId } from '../../../shared/context/org-context';

export class RiskRuleRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async findAll(query: { page: number; pageSize: number; ruleType?: string; isActive?: boolean }): Promise<{ items: RowDataPacket[]; total: number }> {
    const conditions: string[] = ['1=1'];
    const params: unknown[] = [];
    const orgId = getOrganizationId();
    if (orgId) { conditions.push('(rr.organization_id IS NULL OR rr.organization_id = ?)'); params.push(orgId); }
    if (query.ruleType) { conditions.push('rr.rule_type = ?'); params.push(query.ruleType); }
    if (query.isActive !== undefined) { conditions.push('rr.is_active = ?'); params.push(query.isActive ? 1 : 0); }
    const where = `WHERE ${conditions.join(' AND ')}`;
    const offset = (query.page - 1) * query.pageSize;
    const [countRows] = await this.pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM risk_rules rr ${where}`, params);
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT rr.* FROM risk_rules rr ${where} ORDER BY rr.priority ASC, rr.rule_name LIMIT ? OFFSET ?`,
      [...params, query.pageSize, offset],
    );
    return { items: rows, total: Number(countRows[0]?.total ?? 0) };
  }

  async findById(id: number): Promise<RowDataPacket | null> {
    const [rows] = await this.pool.query<RowDataPacket[]>('SELECT * FROM risk_rules WHERE id = ?', [id]);
    return rows[0] ?? null;
  }

  async create(data: Record<string, unknown>, actorId?: number): Promise<number> {
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO risk_rules (uuid, rule_code, rule_name, rule_type, organization_id, merchant_id,
        threshold_value, threshold_count, country_code, action, priority, is_active, config_json, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [randomUUID(), data.ruleCode, data.ruleName, data.ruleType, data.organizationId ?? null, data.merchantId ?? null,
        data.thresholdValue ?? null, data.thresholdCount ?? null, data.countryCode ?? null, data.action ?? 'alert',
        data.priority ?? 50, data.isActive ?? 1, data.configJson ? JSON.stringify(data.configJson) : null, actorId ?? null],
    );
    return result.insertId;
  }

  async update(id: number, data: Record<string, unknown>): Promise<void> {
    await this.pool.query(
      `UPDATE risk_rules SET rule_name = ?, threshold_value = ?, threshold_count = ?, country_code = ?,
        action = ?, priority = ?, is_active = ?, config_json = ? WHERE id = ?`,
      [data.ruleName, data.thresholdValue ?? null, data.thresholdCount ?? null, data.countryCode ?? null,
        data.action, data.priority, data.isActive ?? 1, data.configJson ? JSON.stringify(data.configJson) : null, id],
    );
  }

  async logEvaluation(ruleId: number, data: Record<string, unknown>): Promise<void> {
    await this.pool.query(
      `INSERT INTO risk_rule_evaluations (risk_rule_id, transaction_id, merchant_id, matched, action_taken, score, details)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [ruleId, data.transactionId ?? null, data.merchantId ?? null, data.matched ? 1 : 0,
        data.actionTaken ?? null, data.score ?? null, data.details ? JSON.stringify(data.details) : null],
    );
  }
}
