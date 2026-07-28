import { RowDataPacket } from 'mysql2/promise';

export interface ReportCategoryRow extends RowDataPacket {
  id: number;
  uuid: string;
  code: string;
  name: string;
  description: string | null;
  display_order: number;
}

export interface ReportTemplateRow extends RowDataPacket {
  id: number;
  uuid: string;
  category_id: number;
  category_name: string;
  code: string;
  name: string;
  description: string | null;
  query_type: string;
  config: string | null;
  is_system: number;
}

export interface ReportRow extends RowDataPacket {
  id: number;
  uuid: string;
  name: string;
  description: string | null;
  template_id: number | null;
  template_name: string | null;
  category_id: number | null;
  category_name: string | null;
  status: string;
  filters: string | null;
  created_by: number | null;
  created_by_name: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface SavedReportRow extends RowDataPacket {
  id: number;
  uuid: string;
  user_id: number;
  report_id: number;
  report_name: string;
  name: string;
  filters: string | null;
  is_favorite: number;
  created_at: Date;
}

export interface ScheduledReportRow extends RowDataPacket {
  id: number;
  uuid: string;
  report_id: number;
  report_name: string;
  user_id: number;
  name: string;
  cron_expression: string;
  format: string;
  recipients: string | null;
  filters: string | null;
  is_active: number;
  last_run_at: Date | null;
  next_run_at: Date | null;
  created_at: Date;
}

export interface ReportExportRow extends RowDataPacket {
  id: number;
  uuid: string;
  user_id: number;
  report_id: number | null;
  report_name: string | null;
  format: string;
  status: string;
  file_url: string | null;
  file_name: string | null;
  row_count: number | null;
  filter_params: string | null;
  completed_at: Date | null;
  created_at: Date;
}

export interface ReportExecutionLogRow extends RowDataPacket {
  id: number;
  uuid: string;
  report_id: number | null;
  report_name: string | null;
  user_id: number | null;
  user_name: string | null;
  execution_type: string;
  status: string;
  rows_returned: number | null;
  duration_ms: number | null;
  error_message: string | null;
  filter_params: string | null;
  started_at: Date;
  completed_at: Date | null;
}

export interface AnalyticsSnapshotRow extends RowDataPacket {
  snapshot_date: Date;
  period_type: string;
  metric_group: string;
  data: string;
}

export interface TopMerchantRow extends RowDataPacket {
  id: number;
  merchant_code: string;
  display_name: string;
  transaction_count: number;
  total_volume: number;
}
