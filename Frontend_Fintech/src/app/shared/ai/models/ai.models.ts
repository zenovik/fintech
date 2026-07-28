export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  pending?: boolean;
  error?: boolean;
}

export interface AiTokenUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface AiChatResponse {
  reply?: string;
  messageId: string;
  provider: string;
  model?: string;
  tokenUsage?: AiTokenUsage;
  cleared?: boolean;
}

export interface AiChatRequest {
  message?: string;
  clearHistory?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
