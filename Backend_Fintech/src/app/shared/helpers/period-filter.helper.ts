import type { PeriodType } from '../../modules/reports/constants/reports.constants';

const PERIOD_DAYS: Record<PeriodType, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
};

export function periodDateClause(column: string, period: PeriodType): { clause: string; params: unknown[] } {
  const days = PERIOD_DAYS[period] ?? 30;
  return {
    clause: ` AND ${column} >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
    params: [days],
  };
}

const PERIOD_FALLBACK_ORDER: PeriodType[] = ['monthly', 'weekly', 'daily'];

export function periodFallbackChain(requested: PeriodType): PeriodType[] {
  return [requested, ...PERIOD_FALLBACK_ORDER.filter((period) => period !== requested)];
}
