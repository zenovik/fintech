import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { sendSuccess } from '../../../shared/responses/api.response';
import {
  ExportBodyDto,
  HighValueTransactionsQueryDto,
  PeriodQueryDto,
  PreferencesBodyDto,
  DashboardAiChatBodyDto,
} from '../dto';
import { DashboardAiService } from '../services/dashboard-ai.service';
import { WorkflowService } from '../../onboarding-approval/services/workflow.service';
import { PaymentPlatformStatsService } from '../services/payment-platform-stats.service';
import { OperationsService } from '../../operations/services/operations.service';

export class ExecutiveDashboardController {
  constructor(
    private readonly dashboardService = new DashboardService(),
    private readonly dashboardAiService = new DashboardAiService(),
    private readonly workflowService = new WorkflowService(),
    private readonly paymentPlatformStatsService = new PaymentPlatformStatsService(),
    private readonly operationsService = new OperationsService(),
  ) {}

  summary = async (req: Request, res: Response): Promise<void> => {
    const data = await this.dashboardService.getSummary(req.query as unknown as PeriodQueryDto);
    sendSuccess(res, data);
  };

  revenueChart = async (req: Request, res: Response): Promise<void> => {
    const data = await this.dashboardService.getRevenueChart();
    sendSuccess(res, data);
  };

  paymentMethods = async (req: Request, res: Response): Promise<void> => {
    const data = await this.dashboardService.getPaymentMethods(req.query as unknown as PeriodQueryDto);
    sendSuccess(res, data);
  };

  regionalDistribution = async (req: Request, res: Response): Promise<void> => {
    const data = await this.dashboardService.getRegionalDistribution(req.query as unknown as PeriodQueryDto);
    sendSuccess(res, data);
  };

  highValueTransactions = async (req: Request, res: Response): Promise<void> => {
    const data = await this.dashboardService.getHighValueTransactions(
      req.query as unknown as HighValueTransactionsQueryDto,
    );
    sendSuccess(res, data);
  };

  activities = async (_req: Request, res: Response): Promise<void> => {
    const data = await this.dashboardService.getActivities();
    sendSuccess(res, data);
  };

  fraudAlerts = async (_req: Request, res: Response): Promise<void> => {
    const data = await this.dashboardService.getFraudAlerts();
    sendSuccess(res, data);
  };

  exportReport = async (req: Request, res: Response): Promise<void> => {
    const data = await this.dashboardService.createExport(req.user!.sub, req.body as ExportBodyDto);
    sendSuccess(res, data, 201, data.message);
  };

  getPreferences = async (req: Request, res: Response): Promise<void> => {
    const data = await this.dashboardService.getPreferences(req.user!.sub);
    sendSuccess(res, data);
  };

  updatePreferences = async (req: Request, res: Response): Promise<void> => {
    const data = await this.dashboardService.updatePreferences(
      req.user!.sub,
      req.body as PreferencesBodyDto,
    );
    sendSuccess(res, data);
  };

  aiChat = async (req: Request, res: Response): Promise<void> => {
    const data = await this.dashboardAiService.chat(req, req.body as DashboardAiChatBodyDto);
    sendSuccess(res, data);
  };

  onboardingStats = async (_req: Request, res: Response): Promise<void> => {
    const data = await this.workflowService.getDashboardStats();
    sendSuccess(res, data);
  };

  paymentPlatformStats = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.paymentPlatformStatsService.getStats());
  };

  operationsStats = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.operationsService.getPendingTasks());
  };
}
