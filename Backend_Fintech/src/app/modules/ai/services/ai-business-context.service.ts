import { AnalyticsService } from '../../reports/services/reports.service';
import { AnalyticsQueryDto } from '../../reports/dto/reports.dto';
import { ValidationError } from '../../../shared/exceptions/app.exception';
import {
  detectAnalyticsPeriod,
  detectBusinessIntents,
  resolveAnalyticsSources,
} from '../constants/ai-intent.rules';
import {
  AiAnalyticsSource,
  AiBusinessContextResult,
  AiBusinessIntent,
} from '../types/ai-intent.types';
import { formatBusinessDataPrompt } from '../constants/ai-prompt.constants';

export class AiBusinessContextService {
  constructor(private readonly analytics = new AnalyticsService()) {}

  async prepare(userMessage: string): Promise<AiBusinessContextResult> {
    const intents = detectBusinessIntents(userMessage);
    const period = detectAnalyticsPeriod(userMessage);

    if (intents.length === 0) {
      return {
        message: userMessage,
        intents: [],
        period,
        backendData: {},
      };
    }

    const sources = resolveAnalyticsSources(intents);
    const query: AnalyticsQueryDto = { period };
    const backendData = await this.collectAnalyticsData(sources, query);

    return {
      message: this.buildEnrichedPrompt(userMessage, period, intents, backendData),
      intents,
      period,
      backendData,
    };
  }

  private async collectAnalyticsData(
    sources: AiAnalyticsSource[],
    query: AnalyticsQueryDto,
  ): Promise<Record<string, unknown>> {
    const entries = await Promise.all(
      sources.map(async (source) => {
        try {
          const value = await this.fetchSource(source, query);
          return [source, this.normalizeData(value)] as const;
        } catch {
          return [source, null] as const;
        }
      }),
    );

    return Object.fromEntries(entries);
  }

  private async fetchSource(source: AiAnalyticsSource, query: AnalyticsQueryDto): Promise<unknown> {
    switch (source) {
      case 'overview':
        return this.analytics.getOverview(query);
      case 'operations':
        return this.analytics.getOperationsAnalytics(query);
      case 'revenue':
        return this.analytics.getRevenue(query);
      case 'transactions':
        return this.analytics.getTransactions(query);
      case 'settlements':
        return this.analytics.getSettlements(query);
      case 'merchants':
        return this.analytics.getMerchants(query);
      case 'customers':
        return this.analytics.getCustomers(query);
      case 'refunds':
        return this.analytics.getRefunds(query);
      case 'chargebacks':
        return this.analytics.getChargebacks(query);
      default:
        throw new ValidationError('Unsupported analytics source');
    }
  }

  private normalizeData(value: unknown): unknown {
    if (value == null) {
      return null;
    }
    return value;
  }

  private buildEnrichedPrompt(
    userMessage: string,
    period: string,
    intents: AiBusinessIntent[],
    backendData: Record<string, unknown>,
  ): string {
    return formatBusinessDataPrompt(userMessage, [
      `Detected intents: ${intents.join(', ')}`,
      `Analytics period: ${period}`,
    ], backendData);
  }
}
