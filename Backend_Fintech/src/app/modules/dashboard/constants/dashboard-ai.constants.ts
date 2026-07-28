export const DASHBOARD_AI_QUICK_ACTIONS = [
  'summarize_business',
  'failed_payments_today',
  'failed_payouts_today',
  'settlement_summary',
  'top_merchants_today',
  'transaction_overview',
  'revenue_summary',
  'chargeback_summary',
  'refund_summary',
] as const;

export type DashboardAiQuickAction = (typeof DASHBOARD_AI_QUICK_ACTIONS)[number];

export const DASHBOARD_AI_QUICK_ACTION_CONFIG: Record<
  DashboardAiQuickAction,
  { label: string; prompt: string; dataSources: string[] }
> = {
  summarize_business: {
    label: "Summarize today's business",
    prompt: "Summarize today's business.",
    dataSources: ['overview', 'operations', 'revenue', 'transactions', 'settlements', 'merchants'],
  },
  failed_payments_today: {
    label: 'Failed payments today',
    prompt: 'Summarize failed payments today.',
    dataSources: ['operations', 'payouts'],
  },
  failed_payouts_today: {
    label: 'Failed payouts today',
    prompt: 'Summarize failed payouts today.',
    dataSources: ['operations', 'payouts'],
  },
  settlement_summary: {
    label: 'Settlement summary',
    prompt: 'Provide a settlement summary.',
    dataSources: ['settlements'],
  },
  top_merchants_today: {
    label: 'Top merchants today',
    prompt: 'Summarize top merchants today.',
    dataSources: ['merchants'],
  },
  transaction_overview: {
    label: 'Transaction overview',
    prompt: 'Provide a transaction overview.',
    dataSources: ['transactions', 'overview'],
  },
  revenue_summary: {
    label: 'Revenue summary',
    prompt: 'Provide a revenue summary.',
    dataSources: ['revenue', 'overview'],
  },
  chargeback_summary: {
    label: 'Chargeback summary',
    prompt: 'Provide a chargeback summary.',
    dataSources: ['chargebacks'],
  },
  refund_summary: {
    label: 'Refund summary',
    prompt: 'Provide a refund summary.',
    dataSources: ['refunds'],
  },
};

export const DASHBOARD_AI_SUGGESTED_QUESTIONS = [
  'What is our success rate?',
  'How are settlements performing?',
  'Any operational issues today?',
] as const;

export type DashboardAiDataSource =
  | 'overview'
  | 'operations'
  | 'revenue'
  | 'transactions'
  | 'settlements'
  | 'merchants'
  | 'payouts'
  | 'chargebacks'
  | 'refunds';
