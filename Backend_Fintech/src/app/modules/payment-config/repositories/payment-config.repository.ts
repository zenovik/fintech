import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { randomUUID } from 'node:crypto';
import { getPool } from '../../../database';
import { getOrganizationId } from '../../../shared/context/org-context';
import { appendMerchantFilter } from '../../../shared/context/merchant-context';

export class PaymentConfigRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async findByMerchant(merchantId: number): Promise<RowDataPacket[]> {
    const orgId = getOrganizationId();
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT c.*, pmt.code AS method_code, pmt.name AS method_name
       FROM merchant_payment_method_config c
       JOIN payment_method_types pmt ON pmt.id = c.payment_method_type_id
       WHERE c.merchant_id = ? AND (? IS NULL OR c.organization_id = ?)
       ORDER BY pmt.name`,
      [merchantId, orgId ?? null, orgId ?? null],
    );
    return rows;
  }

  async upsert(merchantId: number, orgId: number, data: Record<string, unknown>, actorId?: number): Promise<number> {
    const [existing] = await this.pool.query<RowDataPacket[]>(
      'SELECT id FROM merchant_payment_method_config WHERE merchant_id = ? AND payment_method_type_id = ?',
      [merchantId, data.paymentMethodTypeId],
    );
    if (existing[0]) {
      await this.pool.query(
        `UPDATE merchant_payment_method_config SET status = ?, settlement_cycle = ?, mdr_pct = ?, fixed_fee = ?,
          min_fee = ?, max_fee = ?, daily_limit = ?, per_txn_limit = ?, updated_by = ? WHERE id = ?`,
        [data.status, data.settlementCycle, data.mdrPct, data.fixedFee, data.minFee, data.maxFee ?? null,
          data.dailyLimit ?? null, data.perTxnLimit ?? null, actorId ?? null, existing[0].id],
      );
      return Number(existing[0].id);
    }
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO merchant_payment_method_config (uuid, merchant_id, organization_id, payment_method_type_id,
        status, settlement_cycle, mdr_pct, fixed_fee, min_fee, max_fee, daily_limit, per_txn_limit, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [randomUUID(), merchantId, orgId, data.paymentMethodTypeId, data.status ?? 'active', data.settlementCycle ?? 't1',
        data.mdrPct ?? 0, data.fixedFee ?? 0, data.minFee ?? 0, data.maxFee ?? null, data.dailyLimit ?? null,
        data.perTxnLimit ?? null, actorId ?? null, actorId ?? null],
    );
    return result.insertId;
  }

  async listLimits(merchantId?: number): Promise<RowDataPacket[]> {
    const conditions = ['tlr.is_active = 1'];
    const params: unknown[] = [];
    const orgId = getOrganizationId();
    if (orgId) { conditions.push('tlr.organization_id = ?'); params.push(orgId); }
    if (merchantId) { conditions.push('tlr.merchant_id = ?'); params.push(merchantId); }
    else { appendMerchantFilter(conditions, params, 'tlr.merchant_id'); }
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT tlr.* FROM transaction_limit_rules tlr WHERE ${conditions.join(' AND ')}`, params,
    );
    return rows;
  }

  async upsertLimit(data: Record<string, unknown>, orgId: number): Promise<number> {
    if (data.id) {
      await this.pool.query(
        `UPDATE transaction_limit_rules SET rule_name = ?, per_txn_limit = ?, daily_limit = ?,
          weekly_limit = ?, monthly_limit = ?, is_active = ? WHERE id = ?`,
        [data.ruleName, data.perTxnLimit ?? null, data.dailyLimit ?? null, data.weeklyLimit ?? null,
          data.monthlyLimit ?? null, data.isActive ?? 1, data.id],
      );
      return Number(data.id);
    }
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO transaction_limit_rules (uuid, rule_name, scope_type, merchant_id, outlet_id, device_id,
        organization_id, per_txn_limit, daily_limit, weekly_limit, monthly_limit)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [randomUUID(), data.ruleName, data.scopeType ?? 'merchant', data.merchantId ?? null, data.outletId ?? null,
        data.deviceId ?? null, orgId, data.perTxnLimit ?? null, data.dailyLimit ?? null, data.weeklyLimit ?? null, data.monthlyLimit ?? null],
    );
    return result.insertId;
  }
}
