export const DASHBOARD_PERIOD_TYPES = ['daily', 'weekly', 'monthly'] as const;
export type DashboardPeriodType = (typeof DASHBOARD_PERIOD_TYPES)[number];

export const DASHBOARD_EXPORT_FORMATS = ['csv', 'xlsx', 'pdf'] as const;

export const HIGH_VALUE_THRESHOLD_DEFAULT = 50000;

export const DASHBOARD_PAGE_SIZES = [10, 25, 50] as const;

export const PERIOD_DAYS: Record<DashboardPeriodType, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
};

export const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;
