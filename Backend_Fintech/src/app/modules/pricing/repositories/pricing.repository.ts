import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { randomUUID } from 'node:crypto';
import { getPool } from '../../../database';
import { getOrganizationId } from '../../../shared/context/org-context';

export class PricingRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async findAll(query: { page: number; pageSize: number; scopeType?: string }): Promise<{ items: RowDataPacket[]; total: number }> {
    const conditions = ['pp.is_active = 1'];
    const params: unknown[] = [];
    if (query.scopeType) { conditions.push('pp.scope_type = ?'); params.push(query.scopeType); }
    const orgId = getOrganizationId();
    if (orgId) { conditions.push('(pp.organization_id IS NULL OR pp.organization_id = ?)'); params.push(orgId); }
    const where = `WHERE ${conditions.join(' AND ')}`;
    const offset = (query.page - 1) * query.pageSize;
    const [countRows] = await this.pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM pricing_plans pp ${where}`, params);
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT pp.* FROM pricing_plans pp ${where} ORDER BY pp.scope_type, pp.plan_name LIMIT ? OFFSET ?`,
      [...params, query.pageSize, offset],
    );
    return { items: rows, total: Number(countRows[0]?.total ?? 0) };
  }

  async findById(id: number): Promise<RowDataPacket | null> {
    const [rows] = await this.pool.query<RowDataPacket[]>('SELECT * FROM pricing_plans WHERE id = ?', [id]);
    return rows[0] ?? null;
  }

  async getFeeRules(planId: number): Promise<RowDataPacket[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT pfr.*, pmt.code AS method_code FROM pricing_fee_rules pfr
       LEFT JOIN payment_method_types pmt ON pmt.id = pfr.payment_method_type_id WHERE pfr.pricing_plan_id = ?`, [planId],
    );
    return rows;
  }

  async createPlan(data: Record<string, unknown>, actorId?: number): Promise<number> {
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO pricing_plans (uuid, plan_code, plan_name, scope_type, organization_id, merchant_id, category_code, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [randomUUID(), data.planCode, data.planName, data.scopeType ?? 'default', data.organizationId ?? null,
        data.merchantId ?? null, data.categoryCode ?? null, actorId ?? null],
    );
    return result.insertId;
  }

  async saveFeeRule(planId: number, data: Record<string, unknown>): Promise<void> {
    await this.pool.query(
      `INSERT INTO pricing_fee_rules (pricing_plan_id, payment_method_type_id, fee_type, mdr_pct, fixed_fee, percentage_fee, min_fee, max_fee)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [planId, data.paymentMethodTypeId ?? null, data.feeType ?? 'mdr', data.mdrPct ?? null, data.fixedFee ?? null,
        data.percentageFee ?? null, data.minFee ?? null, data.maxFee ?? null],
    );
  }
}
