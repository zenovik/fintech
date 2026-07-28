import { AiInsightsRepository } from '../repositories/ai-insights.repository';

export class AiInsightsService {
  constructor(private readonly repo = new AiInsightsRepository()) {}

  async getInsightsDashboard() {
    const data = await this.repo.getInsightsDashboard();
    const latest = data.latest as Record<string, unknown> | null;
    return {
      summary: {
        totalDays: Number((data.summary as Record<string, unknown>)?.total_days ?? 0),
        avgRevenueForecast: Number((data.summary as Record<string, unknown>)?.avg_revenue_forecast ?? 0),
        avgSettlementForecast: Number((data.summary as Record<string, unknown>)?.avg_settlement_forecast ?? 0),
        avgHealthScore: Number((data.summary as Record<string, unknown>)?.avg_health_score ?? 0),
        avgFraudScore: Number((data.summary as Record<string, unknown>)?.avg_fraud_score ?? 0),
      },
      latest: latest ? {
        insightDate: latest.insight_date,
        revenueForecast: latest.revenue_forecast != null ? Number(latest.revenue_forecast) : null,
        settlementForecast: latest.settlement_forecast != null ? Number(latest.settlement_forecast) : null,
        merchantHealthScore: latest.merchant_health_score != null ? Number(latest.merchant_health_score) : null,
        fraudRiskScore: latest.fraud_risk_score != null ? Number(latest.fraud_risk_score) : null,
        insightsJson: typeof latest.insights_json === 'string' ? JSON.parse(latest.insights_json as string) : latest.insights_json,
      } : null,
    };
  }

  async getRevenueForecast(merchantId?: number) {
    const row = await this.repo.getLatestInsights(merchantId);
    if (!row) return { forecast: null, insightDate: null };
    return { forecast: row.revenue_forecast != null ? Number(row.revenue_forecast) : null, insightDate: row.insight_date };
  }

  async getSettlementForecast(merchantId?: number) {
    const row = await this.repo.getLatestInsights(merchantId);
    if (!row) return { forecast: null, insightDate: null };
    return { forecast: row.settlement_forecast != null ? Number(row.settlement_forecast) : null, insightDate: row.insight_date };
  }

  async getMerchantHealth(merchantId?: number) {
    const row = await this.repo.getLatestInsights(merchantId);
    if (!row) return { score: null, insightDate: null };
    return { score: row.merchant_health_score != null ? Number(row.merchant_health_score) : null, insightDate: row.insight_date };
  }

  async getFraudPrediction(merchantId?: number) {
    const row = await this.repo.getLatestInsights(merchantId);
    if (!row) return { score: null, insightDate: null };
    return { score: row.fraud_risk_score != null ? Number(row.fraud_risk_score) : null, insightDate: row.insight_date };
  }

  async naturalLanguageSearch(query: string) {
    const results = await this.repo.searchTransactions(query);
    return {
      query,
      results: results.map((r) => ({
        id: r.id, transactionRef: r.transaction_ref, amount: Number(r.amount),
        currency: r.currency, merchantName: r.merchant_name, createdAt: r.created_at,
      })),
    };
  }
}
