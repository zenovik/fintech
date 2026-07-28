import { PeriodType } from '../../reports/constants/reports.constants';
import {
  AiAnalyticsSource,
  AiBusinessIntent,
} from '../types/ai-intent.types';

export { AiBusinessIntent, AiAnalyticsSource };

interface IntentRule {
  keywords: RegExp[];
  sources: AiAnalyticsSource[];
}

export const AI_INTENT_RULES: Record<AiBusinessIntent, IntentRule> = {
  transactions: {
    keywords: [/transaction/i, /payment/i, /payments/i, /success rate/i, /volume/i],
    sources: ['transactions'],
  },
  merchants: {
    keywords: [/merchant/i, /merchants/i, /seller/i, /sellers/i],
    sources: ['merchants'],
  },
  customers: {
    keywords: [/customer/i, /customers/i, /client/i, /clients/i],
    sources: ['customers'],
  },
  refunds: {
    keywords: [/refund/i, /refunds/i],
    sources: ['refunds'],
  },
  chargebacks: {
    keywords: [/chargeback/i, /chargebacks/i, /dispute/i, /disputes/i],
    sources: ['chargebacks'],
  },
  settlements: {
    keywords: [/settlement/i, /settlements/i],
    sources: ['settlements'],
  },
  reports: {
    keywords: [/report/i, /reports/i, /revenue/i, /analytics/i, /metric/i, /metrics/i],
    sources: ['overview', 'revenue'],
  },
  dashboard: {
    keywords: [/dashboard/i, /overview/i, /kpi/i, /business today/i, /executive/i, /operations/i],
    sources: ['overview', 'operations'],
  },
};

const PERIOD_PATTERNS: Array<{ pattern: RegExp; period: PeriodType }> = [
  { pattern: /\btoday\b|\bdaily\b|\bthis day\b/i, period: 'daily' },
  { pattern: /\bweek\b|\bweekly\b|\bthis week\b/i, period: 'weekly' },
  { pattern: /\bmonth\b|\bmonthly\b|\bthis month\b/i, period: 'monthly' },
];

export function detectBusinessIntents(message: string): AiBusinessIntent[] {
  const matched: AiBusinessIntent[] = [];

  for (const [intent, rule] of Object.entries(AI_INTENT_RULES) as Array<[AiBusinessIntent, IntentRule]>) {
    if (rule.keywords.some((pattern) => pattern.test(message))) {
      matched.push(intent);
    }
  }

  return matched;
}

export function resolveAnalyticsSources(intents: AiBusinessIntent[]): AiAnalyticsSource[] {
  const sources = new Set<AiAnalyticsSource>();

  for (const intent of intents) {
    for (const source of AI_INTENT_RULES[intent].sources) {
      sources.add(source);
    }
  }

  return [...sources];
}

export function detectAnalyticsPeriod(message: string): PeriodType {
  for (const { pattern, period } of PERIOD_PATTERNS) {
    if (pattern.test(message)) return period;
  }
  return 'daily';
}
