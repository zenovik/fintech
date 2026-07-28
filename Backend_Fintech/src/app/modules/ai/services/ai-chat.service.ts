import { randomUUID } from 'node:crypto';
import { Request } from 'express';
import { auditRecorder, AuditContext } from '../../audit/services/audit-recorder.service';
import { createAiProvider } from '../providers/ai-provider.factory';
import { AiChatBodyDto } from '../dto/ai.dto';
import { AiContextService } from './ai-context.service';
import { aiSessionStore } from './ai-session.store';
import { aiSecurityService } from './ai-security.service';
import { logger } from '../../../shared/utils/logger';
import { AppError } from '../../../shared/exceptions/app.exception';
import { AI_ERROR_CODES } from '../constants/ai.constants';
import { mapAiRuntimeError } from '../utils/ai-error.util';
import { env } from '../../../config';
import { AiBusinessContextService } from './ai-business-context.service';
import { AiChatMessage } from '../providers/ai-provider.interface';

export interface AiChatResponseData {
  reply?: string;
  messageId: string;
  provider: string;
  model?: string;
  tokenUsage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  cleared?: boolean;
}

export class AiChatService {
  constructor(
    private readonly contextService = new AiContextService(),
    private readonly businessContext = new AiBusinessContextService(),
    private readonly provider = createAiProvider(),
  ) {}

  async chat(req: Request, dto: AiChatBodyDto): Promise<AiChatResponseData> {
    this.assertValidSession(req);

    const sessionId = req.user!.sessionId;
    const messageId = randomUUID();
    const auditCtx = this.buildAuditContext(req);
    const startedAt = Date.now();

    if (dto.clearHistory) {
      aiSessionStore.clear(sessionId);
      await this.recordAudit({
        actionCode: 'ai_chat_request',
        entityType: 'ai_session',
        entityId: String(sessionId),
        description: 'AI conversation history cleared.',
        success: true,
        responseTimeMs: Date.now() - startedAt,
        rateLimited: false,
        afterValues: { clearHistory: true },
      }, auditCtx);

      if (!dto.message) {
        return { messageId, provider: this.provider.name, cleared: true };
      }
    }

    const context = await this.contextService.buildFromRequest(req);
    const userMessage = aiSecurityService.sanitizePrompt(dto.message!);
    aiSecurityService.assertSafePrompt(userMessage);
    const preparedContext = await this.businessContext.prepare(userMessage);

    await this.recordAudit({
      actionCode: 'ai_chat_request',
      entityType: 'ai_message',
      entityId: messageId,
      description: 'User sent a message to the AI assistant.',
      success: true,
      responseTimeMs: Date.now() - startedAt,
      rateLimited: false,
      afterValues: {
        messageLength: userMessage.length,
        organizationId: context.organizationId,
        userId: context.userId,
        role: context.role,
        userName: context.userName,
        intents: preparedContext.intents,
        period: preparedContext.period,
        dataSources: Object.keys(preparedContext.backendData),
      },
    }, auditCtx);

    aiSessionStore.append(sessionId, { role: 'user', content: userMessage });
    const history = aiSessionStore.getHistory(sessionId);
    const historyForProvider = this.withEnrichedUserMessage(history, preparedContext.message);

    try {
      const result = await this.provider.chat(historyForProvider, context);
      const responseTimeMs = Date.now() - startedAt;

      aiSessionStore.append(sessionId, { role: 'assistant', content: result.reply });

      const tokenMetadata = this.buildTokenMetadata(result.tokenUsage);
      await this.recordAudit({
        actionCode: 'ai_chat_response',
        entityType: 'ai_message',
        entityId: messageId,
        description: 'AI assistant returned a response.',
        success: true,
        responseTimeMs,
        rateLimited: false,
        afterValues: {
          replyLength: result.reply.length,
          provider: result.provider,
          model: result.model,
          tokenUsage: result.tokenUsage ?? null,
          success: true,
        },
        metadata: {
          provider: result.provider,
          model: result.model,
          responseTimeMs: String(responseTimeMs),
          success: 'true',
          rateLimited: 'false',
          ...tokenMetadata,
        },
      }, auditCtx);

      if (result.tokenUsage) {
        logger.info('AI chat completed', {
          sessionId,
          userId: context.userId,
          provider: result.provider,
          model: result.model,
          responseTimeMs,
          promptTokens: result.tokenUsage.promptTokens,
          completionTokens: result.tokenUsage.completionTokens,
          totalTokens: result.tokenUsage.totalTokens,
        });
      }

      return {
        reply: result.reply,
        messageId,
        provider: result.provider,
        model: result.model,
        tokenUsage: result.tokenUsage,
      };
    } catch (error) {
      const mapped = mapAiRuntimeError(error);
      const responseTimeMs = Date.now() - startedAt;

      aiSessionStore.popLast(sessionId);

      await this.recordAudit({
        actionCode: 'ai_chat_response',
        entityType: 'ai_message',
        entityId: messageId,
        description: 'AI assistant request failed.',
        success: false,
        responseTimeMs,
        rateLimited: mapped.code === AI_ERROR_CODES.AI_RATE_LIMITED,
        afterValues: {
          success: false,
          errorCode: mapped.code,
          provider: this.provider.name,
        },
        metadata: {
          provider: env.ai.provider,
          responseTimeMs: String(responseTimeMs),
          success: 'false',
          rateLimited: mapped.code === AI_ERROR_CODES.AI_RATE_LIMITED ? 'true' : 'false',
        },
      }, auditCtx);

      throw mapped;
    }
  }

  private assertValidSession(req: Request): void {
    if (!req.user?.sub || !req.user?.sessionId) {
      throw new AppError(401, 'Valid session required.', AI_ERROR_CODES.UNAUTHORIZED);
    }
  }

  private buildTokenMetadata(tokenUsage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  }): Record<string, string> {
    const metadata: Record<string, string> = {};
    if (tokenUsage?.promptTokens != null) metadata.promptTokens = String(tokenUsage.promptTokens);
    if (tokenUsage?.completionTokens != null) metadata.completionTokens = String(tokenUsage.completionTokens);
    if (tokenUsage?.totalTokens != null) metadata.totalTokens = String(tokenUsage.totalTokens);
    return metadata;
  }

  private async recordAudit(
    input: {
      actionCode: string;
      entityType: string;
      entityId: string;
      description: string;
      success: boolean;
      responseTimeMs: number;
      rateLimited: boolean;
      afterValues?: Record<string, unknown>;
      metadata?: Record<string, string>;
    },
    auditCtx: AuditContext,
  ): Promise<void> {
    await auditRecorder.record({
      module: 'ai',
      categoryCode: 'system',
      actionCode: input.actionCode,
      entityType: input.entityType,
      entityId: input.entityId,
      description: input.description,
      riskLevel: input.success ? 'low' : 'medium',
      afterValues: {
        ...input.afterValues,
        success: input.success,
        responseTimeMs: input.responseTimeMs,
        rateLimited: input.rateLimited,
      },
      metadata: {
        provider: env.ai.provider,
        responseTimeMs: String(input.responseTimeMs),
        success: String(input.success),
        rateLimited: String(input.rateLimited),
        ...input.metadata,
      },
    }, auditCtx);
  }

  private buildAuditContext(req: Request): AuditContext {
    return {
      userId: req.user?.sub,
      sessionId: req.user?.sessionId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    };
  }

  private withEnrichedUserMessage(history: AiChatMessage[], enrichedMessage: string): AiChatMessage[] {
    if (history.length === 0) {
      return history;
    }

    const cloned = [...history];
    const lastIndex = cloned.length - 1;
    const last = cloned[lastIndex];

    if (last.role === 'user') {
      cloned[lastIndex] = { ...last, content: enrichedMessage };
    }

    return cloned;
  }
}
