import { Request } from 'express';
import { AnalyticsService } from '../../reports/services/reports.service';
import { AnalyticsQueryDto } from '../../reports/dto/reports.dto';
import { AiChatService } from '../../ai/services/ai-chat.service';
import { auditRecorder } from '../../audit/services/audit-recorder.service';
import { ValidationError } from '../../../shared/exceptions/app.exception';
import {
  DASHBOARD_AI_QUICK_ACTION_CONFIG,
  DashboardAiDataSource,
  DashboardAiQuickAction,
} from '../constants/dashboard-ai.constants';
import { DashboardAiChatBodyDto } from '../dto/dashboard-ai.dto';
import { formatBusinessDataPrompt } from '../../ai/constants/ai-prompt.constants';

export class DashboardAiService {
  constructor(
    private readonly analytics = new AnalyticsService(),
    private readonly aiChat = new AiChatService(),
  ) {}

  async chat(req: Request, dto: DashboardAiChatBodyDto) {
    const startedAt = Date.now();
    const quickAction = dto.quickAction;
    const config = quickAction ? DASHBOARD_AI_QUICK_ACTION_CONFIG[quickAction] : null;
    const userPrompt = config?.prompt ?? dto.message!;
    const dataSources = (config?.dataSources ?? []) as DashboardAiDataSource[];
    const period = dto.period ?? 'daily';
    const query: AnalyticsQueryDto = { period };

    const backendData = await this.collectAnalyticsData(dataSources, query);
    const enrichedMessage = this.buildEnrichedPrompt(userPrompt, period, backendData);

    await auditRecorder.record({
      module: 'ai',
      categoryCode: 'system',
      actionCode: 'ai_chat_request',
      entityType: 'dashboard_ai',
      entityId: quickAction ?? 'custom',
      description: quickAction
        ? `Dashboard AI quick action: ${quickAction}.`
        : 'Dashboard AI custom question.',
      riskLevel: 'low',
      afterValues: {
        quickAction: quickAction ?? null,
        period,
        dataSources,
        promptLength: enrichedMessage.length,
        success: true,
        responseTimeMs: Date.now() - startedAt,
        rateLimited: false,
      },
      metadata: {
        source: 'dashboard',
        quickAction: quickAction ?? 'custom',
        period,
        responseTimeMs: String(Date.now() - startedAt),
        success: 'true',
        rateLimited: 'false',
      },
    }, {
      userId: req.user?.sub,
      sessionId: req.user?.sessionId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });

    const result = await this.aiChat.chat(req, { message: enrichedMessage });

    return {
      ...result,
      quickAction: quickAction ?? null,
      period,
      dataTimestamp: new Date().toISOString(),
    };
  }

  private async collectAnalyticsData(
    sources: DashboardAiDataSource[],
    query: AnalyticsQueryDto,
  ): Promise<Record<string, unknown>> {
    const data: Record<string, unknown> = {};

    for (const source of sources) {
      try {
        data[source] = this.normalizeData(await this.fetchSource(source, query));
      } catch {
        data[source] = 'Data is unavailable.';
      }
    }

    return data;
  }

  private async fetchSource(source: DashboardAiDataSource, query: AnalyticsQueryDto): Promise<unknown> {
    switch (source) {
      case 'overview': return this.analytics.getOverview(query);
      case 'operations': return this.analytics.getOperationsAnalytics(query);
      case 'revenue': return this.analytics.getRevenue(query);
      case 'transactions': return this.analytics.getTransactions(query);
      case 'settlements': return this.analytics.getSettlements(query);
      case 'merchants': return this.analytics.getMerchants(query);
      case 'payouts': return this.analytics.getPayouts(query);
      case 'chargebacks': return this.analytics.getChargebacks(query);
      case 'refunds': return this.analytics.getRefunds(query);
      default: throw new ValidationError('Unsupported analytics source');
    }
  }

  private normalizeData(value: unknown): unknown {
    if (value == null) return 'Data is unavailable.';
    if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value as object).length === 0) {
      return 'Data is unavailable.';
    }
    return value;
  }

  private buildEnrichedPrompt(
    userPrompt: string,
    period: string,
    backendData: Record<string, unknown>,
  ): string {
    return formatBusinessDataPrompt(userPrompt, [`Dashboard period: ${period}`], backendData);
  }
}
