import { DashboardPeriod } from '../constants/dashboard.constants';

export type DashboardAiQuickAction =
  | 'summarize_business'
  | 'failed_payments_today'
  | 'failed_payouts_today'
  | 'settlement_summary'
  | 'top_merchants_today'
  | 'transaction_overview'
  | 'revenue_summary'
  | 'chargeback_summary'
  | 'refund_summary';

export interface DashboardAiQuickActionOption {
  id: DashboardAiQuickAction;
  label: string;
  prompt: string;
}

export interface DashboardAiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  pending?: boolean;
  error?: boolean;
}

export interface DashboardAiChatRequest {
  quickAction?: DashboardAiQuickAction;
  message?: string;
  period?: DashboardPeriod;
}

export interface DashboardAiChatResponse {
  reply?: string;
  messageId: string;
  provider: string;
  model?: string;
  quickAction?: string | null;
  period?: string;
  dataTimestamp?: string;
  tokenUsage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
}
