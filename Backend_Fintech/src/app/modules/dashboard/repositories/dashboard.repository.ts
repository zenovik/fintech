import { randomUUID } from 'crypto';
import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { getPool } from '../../../database';
import { periodFallbackChain } from '../../../shared/helpers/period-filter.helper';
import { DashboardPeriodType } from '../constants/dashboard.constants';
import {
  ActivityEventRow,
  FraudAlertRow,
  HighValueTransactionRow,
  KpiSnapshotRow,
  PaymentMethodRow,
  RegionalRow,
  RevenueSeriesRow,
  UserPreferencesRow,
} from '../types/dashboard.types';

export class DashboardRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async getKpiSnapshot(period: DashboardPeriodType): Promise<KpiSnapshotRow | null> {
    const [rows] = await this.pool.query<KpiSnapshotRow[]>(
      `SELECT total_revenue, total_transactions, total_merchants, success_rate,
              revenue_change_pct, transactions_change_pct, merchants_change_pct
       FROM dashboard_kpi_snapshots
       WHERE period_type = ? AND snapshot_date <= CURDATE()
       ORDER BY snapshot_date DESC LIMIT 1`,
      [period],
    );
    return rows[0] ?? null;
  }

  async getRevenueSeries(): Promise<RevenueSeriesRow[]> {
    const [rows] = await this.pool.query<RevenueSeriesRow[]>(
      `SELECT period_date, actual_revenue, forecast_revenue
       FROM revenue_time_series
       WHERE period_type = 'monthly' AND granularity = 'month'
       ORDER BY period_date ASC
       LIMIT 12`,
    );
    return rows;
  }

  async getPaymentMethods(period: DashboardPeriodType): Promise<PaymentMethodRow[]> {
    for (const candidate of periodFallbackChain(period)) {
      const [rows] = await this.pool.query<PaymentMethodRow[]>(
        `SELECT pmt.code, pmt.name, pmt.icon_key, pmd.percentage, pmd.total_amount
         FROM payment_method_distribution pmd
         JOIN payment_method_types pmt ON pmt.id = pmd.payment_method_type_id
         WHERE pmd.period_type = ? AND pmd.snapshot_date <= CURDATE()
           AND pmd.snapshot_date = (
             SELECT MAX(snapshot_date) FROM payment_method_distribution WHERE period_type = ?
           )
         ORDER BY pmd.percentage DESC`,
        [candidate, candidate],
      );
      if (rows.length > 0) {
        return rows;
      }
    }
    return [];
  }

  async getRegionalDistribution(period: DashboardPeriodType): Promise<RegionalRow[]> {
    for (const candidate of periodFallbackChain(period)) {
      const [rows] = await this.pool.query<RegionalRow[]>(
        `SELECT r.code, r.name, rd.total_volume, rd.percentage, rd.progress_pct
         FROM regional_distribution rd
         JOIN regions r ON r.id = rd.region_id
         WHERE rd.period_type = ? AND rd.snapshot_date <= CURDATE()
           AND rd.snapshot_date = (
             SELECT MAX(snapshot_date) FROM regional_distribution WHERE period_type = ?
           )
         ORDER BY rd.total_volume DESC`,
        [candidate, candidate],
      );
      if (rows.length > 0) {
        return rows;
      }
    }
    return [];
  }

  async countHighValueTransactions(
    period: DashboardPeriodType,
    search?: string,
    status?: string,
    minAmount?: number,
    requireThreshold = true,
  ): Promise<number> {
    const { clause, params } = this.buildTransactionFilters(period, search, status, minAmount, requireThreshold);
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total
       FROM transactions t
       JOIN merchants m ON m.id = t.merchant_id
       JOIN transaction_statuses ts ON ts.id = t.status_id
       WHERE t.deleted_at IS NULL ${clause}`,
      params,
    );
    return Number(rows[0]?.['total'] ?? 0);
  }

  async getHighValueTransactions(
    period: DashboardPeriodType,
    page: number,
    pageSize: number,
    search?: string,
    status?: string,
    minAmount?: number,
    requireThreshold = true,
  ): Promise<HighValueTransactionRow[]> {
    const { clause, params } = this.buildTransactionFilters(period, search, status, minAmount, requireThreshold);
    const offset = (page - 1) * pageSize;
    const [rows] = await this.pool.query<HighValueTransactionRow[]>(
      `SELECT t.uuid, t.transaction_ref, m.merchant_code, m.display_name, m.logo_initials, m.logo_color,
              t.amount, t.currency, t.payment_method_detail, pmt.icon_key AS payment_icon_key,
              ts.code AS status_code, ts.label AS status_label, ts.badge_color, t.processed_at
       FROM transactions t
       JOIN merchants m ON m.id = t.merchant_id
       JOIN payment_method_types pmt ON pmt.id = t.payment_method_type_id
       JOIN transaction_statuses ts ON ts.id = t.status_id
       WHERE t.deleted_at IS NULL ${clause}
       ORDER BY t.amount DESC, t.processed_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset],
    );
    return rows;
  }

  async getActivities(limit = 10): Promise<ActivityEventRow[]> {
    const [rows] = await this.pool.query<ActivityEventRow[]>(
      `SELECT ae.uuid, ae.title, ae.description, aet.icon_key, aet.color_token, ae.occurred_at
       FROM activity_events ae
       JOIN activity_event_types aet ON aet.id = ae.event_type_id
       ORDER BY ae.occurred_at DESC
       LIMIT ?`,
      [limit],
    );
    return rows;
  }

  async getFraudAlerts(): Promise<FraudAlertRow[]> {
    const [rows] = await this.pool.query<FraudAlertRow[]>(
      `SELECT fa.uuid, fa.title, fa.message, fas.code AS severity_code
       FROM fraud_alerts fa
       JOIN fraud_alert_severities fas ON fas.id = fa.severity_id
       WHERE fa.is_active = 1 AND fa.is_dismissed = 0
         AND (fa.expires_at IS NULL OR fa.expires_at > NOW())
       ORDER BY fa.created_at DESC
       LIMIT 10`,
    );
    return rows;
  }

  async getUserPreferences(userId: number): Promise<UserPreferencesRow | null> {
    const [rows] = await this.pool.query<UserPreferencesRow[]>(
      `SELECT default_date_range, custom_date_from, custom_date_to, high_value_threshold, table_page_size
       FROM user_dashboard_preferences WHERE user_id = ?`,
      [userId],
    );
    return rows[0] ?? null;
  }

  async upsertUserPreferences(
    userId: number,
    prefs: Partial<{
      defaultDateRange: string;
      customDateFrom: string | null;
      customDateTo: string | null;
      highValueThreshold: number;
      tablePageSize: number;
    }>,
  ): Promise<void> {
    await this.pool.query(
      `INSERT INTO user_dashboard_preferences
         (user_id, default_date_range, custom_date_from, custom_date_to, high_value_threshold, table_page_size)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         default_date_range = COALESCE(VALUES(default_date_range), default_date_range),
         custom_date_from = COALESCE(VALUES(custom_date_from), custom_date_from),
         custom_date_to = COALESCE(VALUES(custom_date_to), custom_date_to),
         high_value_threshold = COALESCE(VALUES(high_value_threshold), high_value_threshold),
         table_page_size = COALESCE(VALUES(table_page_size), table_page_size)`,
      [
        userId,
        prefs.defaultDateRange ?? 'monthly',
        prefs.customDateFrom ?? null,
        prefs.customDateTo ?? null,
        prefs.highValueThreshold ?? 50000,
        prefs.tablePageSize ?? 10,
      ],
    );
  }

  async createExportJob(userId: number, formatId: number, params: object): Promise<string> {
    const uuid = randomUUID();
    await this.pool.query<ResultSetHeader>(
      `INSERT INTO dashboard_export_jobs (uuid, user_id, format_id, date_range_params, status, completed_at)
       VALUES (?, ?, ?, ?, 'completed', NOW())`,
      [uuid, userId, formatId, JSON.stringify(params)],
    );
    return uuid;
  }

  async getExportFormatId(code: string): Promise<number | null> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT id FROM dashboard_export_formats WHERE code = ? LIMIT 1`,
      [code],
    );
    return rows[0] ? Number(rows[0]['id']) : null;
  }

  private buildTransactionFilters(
    period: DashboardPeriodType,
    search?: string,
    status?: string,
    minAmount?: number,
    requireThreshold = true,
  ): { clause: string; params: unknown[] } {
    const params: unknown[] = [];
    let clause = '';

    const days = period === 'daily' ? 1 : period === 'weekly' ? 7 : 30;
    clause += ' AND t.processed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)';
    params.push(days);

    if (requireThreshold && minAmount !== undefined) {
      clause += ' AND t.amount >= ?';
      params.push(minAmount);
    }

    if (status) {
      clause += ' AND ts.code = ?';
      params.push(status);
    }

    if (search) {
      clause += ' AND (m.display_name LIKE ? OR m.merchant_code LIKE ? OR t.transaction_ref LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    return { clause, params };
  }
}
