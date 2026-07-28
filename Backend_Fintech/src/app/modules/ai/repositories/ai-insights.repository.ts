import { Pool, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../../../database';
import { getOrganizationId } from '../../../shared/context/org-context';

export class AiInsightsRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async getLatestInsights(merchantId?: number) {
    const orgId = getOrganizationId();
    const params: unknown[] = [];
    const conditions = ['1=1'];
    if (orgId) { conditions.push('organization_id = ?'); params.push(orgId); }
    if (merchantId) { conditions.push('merchant_id = ?'); params.push(merchantId); }
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT * FROM ai_insights_daily WHERE ${conditions.join(' AND ')} ORDER BY insight_date DESC LIMIT 1`, params,
    );
    return rows[0] ?? null;
  }

  async getInsightsDashboard() {
    const orgId = getOrganizationId();
    const params: unknown[] = [];
    let orgClause = '';
    if (orgId) { orgClause = ' WHERE organization_id = ?'; params.push(orgId); }
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total_days,
              AVG(revenue_forecast) AS avg_revenue_forecast,
              AVG(settlement_forecast) AS avg_settlement_forecast,
              AVG(merchant_health_score) AS avg_health_score,
              AVG(fraud_risk_score) AS avg_fraud_score
       FROM ai_insights_daily${orgClause}`, params,
    );
    const latest = await this.getLatestInsights();
    return { summary: rows[0], latest };
  }

  async searchTransactions(query: string, limit = 20) {
    const orgId = getOrganizationId();
    const params: unknown[] = [`%${query}%`, `%${query}%`];
    let orgClause = '';
    if (orgId) { orgClause = ' AND m.organization_id = ?'; params.push(orgId); }
    params.push(limit);
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT t.id, t.transaction_ref, t.amount, t.currency, t.created_at, m.display_name AS merchant_name
       FROM transactions t JOIN merchants m ON m.id = t.merchant_id
       WHERE (t.transaction_ref LIKE ? OR m.display_name LIKE ?) AND t.deleted_at IS NULL${orgClause}
       ORDER BY t.created_at DESC LIMIT ?`, params,
    );
    return rows;
  }
}
