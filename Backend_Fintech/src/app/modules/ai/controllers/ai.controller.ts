import { Request, Response } from 'express';
import { sendSuccess } from '../../../shared/responses/api.response';
import { AiChatService } from '../services/ai-chat.service';
import { AiInsightsService } from '../services/ai-insights.service';
import { AiChatBodyDto } from '../dto/ai.dto';

export class AiController {
  constructor(
    private readonly chatService = new AiChatService(),
    private readonly insightsService = new AiInsightsService(),
  ) {}

  chat = async (req: Request, res: Response) => {
    const data = await this.chatService.chat(req, req.body as AiChatBodyDto);
    sendSuccess(res, data);
  };

  insightsDashboard = async (_req: Request, res: Response) => {
    sendSuccess(res, await this.insightsService.getInsightsDashboard());
  };

  revenueForecast = async (req: Request, res: Response) => {
    sendSuccess(res, await this.insightsService.getRevenueForecast(req.query.merchantId ? Number(req.query.merchantId) : undefined));
  };

  settlementForecast = async (req: Request, res: Response) => {
    sendSuccess(res, await this.insightsService.getSettlementForecast(req.query.merchantId ? Number(req.query.merchantId) : undefined));
  };

  merchantHealth = async (req: Request, res: Response) => {
    sendSuccess(res, await this.insightsService.getMerchantHealth(req.query.merchantId ? Number(req.query.merchantId) : undefined));
  };

  fraudPrediction = async (req: Request, res: Response) => {
    sendSuccess(res, await this.insightsService.getFraudPrediction(req.query.merchantId ? Number(req.query.merchantId) : undefined));
  };

  nlSearch = async (req: Request, res: Response) => {
    sendSuccess(res, await this.insightsService.naturalLanguageSearch(req.body.query ?? ''));
  };
}
