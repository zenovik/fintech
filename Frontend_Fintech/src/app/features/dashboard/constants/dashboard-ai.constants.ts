import { DashboardAiQuickActionOption } from '../models/dashboard-ai.models';

export const DASHBOARD_AI_API = {
  CHAT: '/dashboard/executive/ai/chat',
} as const;

export const DASHBOARD_AI_QUICK_ACTIONS: DashboardAiQuickActionOption[] = [
  { id: 'summarize_business', label: "Summarize today's business", prompt: "Summarize today's business." },
  { id: 'failed_payments_today', label: 'Failed payments today', prompt: 'Summarize failed payments today.' },
  { id: 'failed_payouts_today', label: 'Failed payouts today', prompt: 'Summarize failed payouts today.' },
  { id: 'settlement_summary', label: 'Settlement summary', prompt: 'Provide a settlement summary.' },
  { id: 'top_merchants_today', label: 'Top merchants today', prompt: 'Summarize top merchants today.' },
  { id: 'transaction_overview', label: 'Transaction overview', prompt: 'Provide a transaction overview.' },
  { id: 'revenue_summary', label: 'Revenue summary', prompt: 'Provide a revenue summary.' },
  { id: 'chargeback_summary', label: 'Chargeback summary', prompt: 'Provide a chargeback summary.' },
  { id: 'refund_summary', label: 'Refund summary', prompt: 'Provide a refund summary.' },
];

export const DASHBOARD_AI_SUGGESTED_QUESTIONS = [
  'What is our success rate?',
  'How are settlements performing?',
  'Any operational issues today?',
] as const;

export { AI_FRIENDLY_ERRORS, AI_REQUEST_TIMEOUT_MS, resolveAiErrorMessage } from '../../../shared/ai/constants/ai.constants';
