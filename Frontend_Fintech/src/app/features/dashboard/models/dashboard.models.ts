import { DashboardPeriod } from '../constants/dashboard.constants';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ExecutiveSummary {
  period: { type: DashboardPeriod; from: string; to: string };
  kpis: {
    totalRevenue: KpiMetric & { currency: string; formatted: string };
    totalTransactions: KpiMetric;
    totalMerchants: KpiMetric;
    successRate: { value: number; target: number; status: 'optimal' | 'warning' | 'critical' };
  };
}

export interface KpiMetric {
  value: number;
  changePct: number | null;
  trend: 'up' | 'down' | 'flat';
}

export interface RevenueChartData {
  labels: string[];
  actual: number[];
  forecast: number[];
}

export interface PaymentMethodsData {
  segments: { code: string; name: string; percentage: number; amount: number }[];
  dominantLabel: string;
}

export interface RegionalDistributionData {
  regions: {
    code: string;
    name: string;
    volume: number;
    formatted: string;
    percentage: number;
    progressPct: number;
  }[];
  insight: string;
}

export interface HighValueTransaction {
  uuid: string;
  transactionRef: string;
  merchant: { code: string; name: string; initials: string; color: string | null };
  amount: number;
  currency: string;
  formattedAmount: string;
  processedAt: string;
  paymentMethod: { label: string; iconKey: string };
  status: { code: string; label: string; badgeColor: string };
}

export interface HighValueTransactionsData {
  items: HighValueTransaction[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface ActivityItem {
  uuid: string;
  title: string;
  description: string;
  iconKey: string;
  colorToken: string;
  occurredAt: string;
  relativeTime: string;
}

export interface FraudAlertItem {
  uuid: string;
  title: string;
  message: string;
  severity: string;
}

export interface DashboardPreferences {
  defaultDateRange: string;
  customDateFrom: string | null;
  customDateTo: string | null;
  highValueThreshold: number;
  tablePageSize: number;
}

export type WidgetState = 'idle' | 'loading' | 'loaded' | 'empty' | 'error';
