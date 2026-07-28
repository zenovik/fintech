import { Pool, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../../../database';
import { getOrganizationId } from '../../../shared/context/org-context';

export class AcceptanceRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async getAnalytics(merchantId?: number, days = 30) {
    const conditions = ['analytics_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)'];
    const params: unknown[] = [days];
    const orgId = getOrganizationId();
    if (orgId) { conditions.push('organization_id = ?'); params.push(orgId); }
    if (merchantId) { conditions.push('merchant_id = ?'); params.push(merchantId); }
    const [daily] = await this.pool.query<RowDataPacket[]>(
      `SELECT * FROM acceptance_analytics_daily WHERE ${conditions.join(' AND ')} ORDER BY analytics_date DESC`, params,
    );

    const qrConditions = ['q.deleted_at IS NULL'];
    const qrParams: unknown[] = [];
    if (orgId) { qrConditions.push('q.organization_id = ?'); qrParams.push(orgId); }
    if (merchantId) { qrConditions.push('q.merchant_id = ?'); qrParams.push(merchantId); }
    const [qrSummary] = await this.pool.query<RowDataPacket[]>(
      `SELECT qr_type, COUNT(*) AS cnt, SUM(scan_count) AS scans FROM qr_codes q WHERE ${qrConditions.join(' AND ')} GROUP BY qr_type`, qrParams,
    );

    const plConditions = ['pl.deleted_at IS NULL'];
    const plParams: unknown[] = [];
    if (orgId) { plConditions.push('pl.organization_id = ?'); plParams.push(orgId); }
    if (merchantId) { plConditions.push('pl.merchant_id = ?'); plParams.push(merchantId); }
    const [plSummary] = await this.pool.query<RowDataPacket[]>(
      `SELECT status, COUNT(*) AS cnt, SUM(visit_count) AS visits, SUM(abandonment_count) AS abandonments FROM payment_links pl WHERE ${plConditions.join(' AND ')} GROUP BY status`, plParams,
    );

    return { daily, qrSummary, plSummary };
  }

  async getMerchantPortal(merchantId: number) {
    const orgId = getOrganizationId();
    const params: unknown[] = [merchantId];
    let orgClause = '';
    if (orgId) { orgClause = ' AND m.organization_id = ?'; params.push(orgId); }

    const [merchant] = await this.pool.query<RowDataPacket[]>(
      `SELECT m.id, m.display_name, m.merchant_code FROM merchants m WHERE m.id = ?${orgClause}`, params,
    );
    if (!merchant[0]) return null;

    const [qrStats] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total, SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) AS active, COALESCE(SUM(scan_count),0) AS scans
       FROM qr_codes WHERE merchant_id = ? AND deleted_at IS NULL`, [merchantId],
    );
    const [linkStats] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total, SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) AS active, COALESCE(SUM(visit_count),0) AS visits
       FROM payment_links WHERE merchant_id = ? AND deleted_at IS NULL`, [merchantId],
    );
    const [collStats] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total, SUM(CASE WHEN status='matched' THEN 1 ELSE 0 END) AS matched, COALESCE(SUM(amount),0) AS amount
       FROM collections WHERE merchant_id = ?`, [merchantId],
    );
    const [custCount] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(DISTINCT customer_id) AS cnt FROM customer_merchants WHERE merchant_id = ?`, [merchantId],
    );

    return {
      merchant: merchant[0],
      qr: qrStats[0],
      paymentLinks: linkStats[0],
      collections: collStats[0],
      customers: custCount[0],
    };
  }

  async getTopMerchants(limit = 10) {
    const orgId = getOrganizationId();
    const params: unknown[] = [];
    let orgClause = '';
    if (orgId) { orgClause = 'WHERE a.organization_id = ?'; params.push(orgId); }
    params.push(limit);
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT a.merchant_id, m.display_name AS merchant_name,
              SUM(a.qr_payments + a.link_payments) AS total_payments,
              SUM(a.qr_amount + a.link_amount) AS total_amount,
              AVG(a.conversion_rate) AS avg_conversion
       FROM acceptance_analytics_daily a
       JOIN merchants m ON m.id = a.merchant_id
       ${orgClause}
       GROUP BY a.merchant_id, m.display_name
       ORDER BY total_amount DESC LIMIT ?`, params,
    );
    return rows;
  }

  async getFailureInsights(merchantId?: number) {
    const conditions = ['1=1'];
    const params: unknown[] = [];
    const orgId = getOrganizationId();
    if (orgId) { conditions.push('cs.organization_id = ?'); params.push(orgId); }
    if (merchantId) { conditions.push('cs.merchant_id = ?'); params.push(merchantId); }
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT last_failure_reason AS reason, COUNT(*) AS cnt FROM checkout_sessions cs
       WHERE ${conditions.join(' AND ')} AND last_failure_reason IS NOT NULL
       GROUP BY last_failure_reason ORDER BY cnt DESC LIMIT 10`, params,
    );
    return rows;
  }
}
