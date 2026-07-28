import { RowDataPacket } from 'mysql2';
import { DashboardPeriodType } from '../constants/dashboard.constants';

export interface KpiSnapshotRow extends RowDataPacket {
  total_revenue: string;
  total_transactions: number;
  total_merchants: number;
  success_rate: string;
  revenue_change_pct: string | null;
  transactions_change_pct: string | null;
  merchants_change_pct: string | null;
}

export interface RevenueSeriesRow extends RowDataPacket {
  period_date: Date;
  actual_revenue: string;
  forecast_revenue: string;
}

export interface PaymentMethodRow extends RowDataPacket {
  code: string;
  name: string;
  icon_key: string;
  percentage: string;
  total_amount: string;
}

export interface RegionalRow extends RowDataPacket {
  code: string;
  name: string;
  total_volume: string;
  percentage: string;
  progress_pct: string;
}

export interface HighValueTransactionRow extends RowDataPacket {
  uuid: string;
  transaction_ref: string;
  merchant_code: string;
  display_name: string;
  logo_initials: string | null;
  logo_color: string | null;
  amount: string;
  currency: string;
  payment_method_detail: string;
  payment_icon_key: string;
  status_code: string;
  status_label: string;
  badge_color: string;
  processed_at: Date;
}

export interface ActivityEventRow extends RowDataPacket {
  uuid: string;
  title: string;
  description: string;
  icon_key: string;
  color_token: string;
  occurred_at: Date;
}

export interface FraudAlertRow extends RowDataPacket {
  uuid: string;
  title: string;
  message: string;
  severity_code: string;
}

export interface UserPreferencesRow extends RowDataPacket {
  default_date_range: string;
  custom_date_from: Date | null;
  custom_date_to: Date | null;
  high_value_threshold: string;
  table_page_size: number;
}

export interface ExecutiveSummaryResponse {
  period: { type: DashboardPeriodType; from: string; to: string };
  kpis: {
    totalRevenue: { value: number; currency: string; formatted: string; changePct: number | null; trend: 'up' | 'down' | 'flat' };
    totalTransactions: { value: number; changePct: number | null; trend: 'up' | 'down' | 'flat' };
    totalMerchants: { value: number; changePct: number | null; trend: 'up' | 'down' | 'flat' };
    successRate: { value: number; target: number; status: 'optimal' | 'warning' | 'critical' };
  };
}

export interface RevenueChartResponse {
  labels: string[];
  actual: number[];
  forecast: number[];
}

export interface PaymentMethodsResponse {
  segments: { code: string; name: string; percentage: number; amount: number }[];
  dominantLabel: string;
}

export interface RegionalDistributionResponse {
  regions: { code: string; name: string; volume: number; formatted: string; percentage: number; progressPct: number }[];
  insight: string;
}

export interface HighValueTransactionsResponse {
  items: {
    uuid: string;
    transactionRef: string;
    merchant: { code: string; name: string; initials: string; color: string | null };
    amount: number;
    currency: string;
    formattedAmount: string;
    processedAt: string;
    paymentMethod: { label: string; iconKey: string };
    status: { code: string; label: string; badgeColor: string };
  }[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface ActivitiesResponse {
  items: { uuid: string; title: string; description: string; iconKey: string; colorToken: string; occurredAt: string; relativeTime: string }[];
}

export interface FraudAlertsResponse {
  items: { uuid: string; title: string; message: string; severity: string }[];
}

export interface UserPreferencesResponse {
  defaultDateRange: string;
  customDateFrom: string | null;
  customDateTo: string | null;
  highValueThreshold: number;
  tablePageSize: number;
}

export interface ExportJobResponse {
  jobId: string;
  status: string;
  downloadUrl?: string;
}
