import { PeriodType } from '../../reports/constants/reports.constants';

export type AiBusinessIntent =
  | 'transactions'
  | 'merchants'
  | 'customers'
  | 'refunds'
  | 'chargebacks'
  | 'settlements'
  | 'reports'
  | 'dashboard';

export type AiAnalyticsSource =
  | 'overview'
  | 'operations'
  | 'revenue'
  | 'transactions'
  | 'settlements'
  | 'merchants'
  | 'customers'
  | 'refunds'
  | 'chargebacks';

export interface AiBusinessContextResult {
  message: string;
  intents: AiBusinessIntent[];
  period: PeriodType;
  backendData: Record<string, unknown>;
}
