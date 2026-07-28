export type AiChatRole = 'user' | 'assistant';

export interface AiChatMessage {
  role: AiChatRole;
  content: string;
}

export interface AiRequestContext {
  organizationId: number;
  userId: number;
  role: string;
  userName: string;
}

export interface AiTokenUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface AiChatResult {
  reply: string;
  tokenUsage?: AiTokenUsage;
  provider: string;
  model: string;
}

export interface AiProvider {
  readonly name: string;
  chat(messages: AiChatMessage[], context: AiRequestContext): Promise<AiChatResult>;
}
