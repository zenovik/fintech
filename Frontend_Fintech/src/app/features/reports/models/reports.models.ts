export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ReportItem {
  id: number;
  uuid: string;
  name: string;
  description: string | null;
  templateId: number | null;
  templateName: string | null;
  categoryId: number | null;
  categoryName: string | null;
  status: string;
  filters: Record<string, unknown> | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReportTemplate {
  id: number;
  uuid: string;
  categoryId: number;
  categoryName: string;
  code: string;
  name: string;
  description: string | null;
  queryType: string;
  config: Record<string, unknown> | null;
  isSystem: boolean;
}

export interface ReportCategory {
  id: number;
  uuid: string;
  code: string;
  name: string;
  description: string | null;
  displayOrder: number;
}

export interface ReportListResponse {
  items: ReportItem[];
  pagination: Pagination;
}

export interface ScheduledReport {
  id: number;
  uuid: string;
  reportId: number;
  reportName: string;
  name: string;
  cronExpression: string;
  format: string;
  recipients: string[] | null;
  filters: Record<string, unknown> | null;
  isActive: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  createdAt: string;
}

export interface ExecutionLog {
  id: number;
  uuid: string;
  reportId: number | null;
  reportName: string | null;
  userName: string | null;
  executionType: string;
  status: string;
  rowsReturned: number | null;
  durationMs: number | null;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
}

export interface AnalyticsOverview {
  period: string;
  kpis: {
    totalRevenue: { value: number; changePct: number };
    totalTransactions: { value: number; changePct: number };
    activeMerchants: { value: number; new30d: number };
    successRate: { value: number };
  };
}

export interface RevenueChartData {
  labels: string[];
  actual: number[];
  forecast: number[];
}

export interface PaymentSegment {
  code: string;
  name: string;
  percentage: number;
  amount: number;
}

export interface RegionalItem {
  code: string;
  name: string;
  volume: number;
  percentage: number;
}

export interface TopMerchant {
  id: number;
  merchantCode: string;
  name: string;
  transactionCount: number;
  totalVolume: number;
}

export type PageState = 'idle' | 'loading' | 'loaded' | 'empty' | 'error';
