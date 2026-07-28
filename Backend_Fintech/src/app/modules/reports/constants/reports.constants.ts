export const REPORT_STATUSES = ['draft', 'active', 'archived'] as const;
export const EXPORT_FORMATS = ['csv', 'xlsx', 'pdf'] as const;
export const PERIOD_TYPES = ['daily', 'weekly', 'monthly'] as const;
export const EXECUTION_TYPES = ['manual', 'scheduled', 'export'] as const;
export const EXPORT_STATUSES = ['pending', 'processing', 'completed', 'failed'] as const;

export type ReportStatus = (typeof REPORT_STATUSES)[number];
export type ExportFormat = (typeof EXPORT_FORMATS)[number];
export type PeriodType = (typeof PERIOD_TYPES)[number];

export const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
