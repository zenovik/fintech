import { Request, Response } from 'express';
import { sendSuccess } from '../../../shared/responses/api.response';
import { AnalyticsService, ReportsService } from '../services/reports.service';
import {
  AnalyticsQueryDto,
  CreateReportBodyDto,
  CreateScheduledBodyDto,
  ExportQueryDto,
  ExportReportBodyDto,
  HistoryQueryDto,
  ReportListQueryDto,
  RunReportBodyDto,
  UpdateReportBodyDto,
  UpdateScheduledBodyDto,
} from '../dto';

export class ReportsController {
  constructor(private readonly service = new ReportsService()) {}

  list = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.list(req.query as unknown as ReportListQueryDto));
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getById(Number(req.params.id)));
  };

  create = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.create(req.body as CreateReportBodyDto, req.user?.sub), 201, 'Report created');
  };

  update = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.update(Number(req.params.id), req.body as UpdateReportBodyDto, req.user?.sub));
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.delete(Number(req.params.id)));
  };

  templates = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getTemplates());
  };

  categories = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getCategories());
  };

  run = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.run(req.user!.sub, req.body as RunReportBodyDto));
  };

  export = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.export(req.user!.sub, req.body as ExportReportBodyDto));
  };

  history = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getHistory(req.query as unknown as HistoryQueryDto));
  };

  scheduled = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getScheduled());
  };

  createScheduled = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.createScheduled(req.body as CreateScheduledBodyDto, req.user!.sub), 201, 'Scheduled report created');
  };

  updateScheduled = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.updateScheduled(Number(req.params.id), req.body as UpdateScheduledBodyDto));
  };

  deleteScheduled = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.deleteScheduled(Number(req.params.id)));
  };
}

export class AnalyticsController {
  constructor(private readonly service = new AnalyticsService()) {}

  overview = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getOverview(req.query as unknown as AnalyticsQueryDto));
  };

  revenue = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getRevenue(req.query as unknown as AnalyticsQueryDto));
  };

  transactions = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getTransactions(req.query as unknown as AnalyticsQueryDto));
  };

  settlements = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getSettlements(req.query as unknown as AnalyticsQueryDto));
  };

  merchants = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getMerchants(req.query as unknown as AnalyticsQueryDto));
  };

  customers = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getCustomers(req.query as unknown as AnalyticsQueryDto));
  };

  refunds = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getRefunds(req.query as unknown as AnalyticsQueryDto));
  };

  chargebacks = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getChargebacks(req.query as unknown as AnalyticsQueryDto));
  };

  payouts = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getPayouts(req.query as unknown as AnalyticsQueryDto));
  };

  paymentLinks = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getPaymentLinks(req.query as unknown as AnalyticsQueryDto));
  };

  invoices = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getInvoices(req.query as unknown as AnalyticsQueryDto));
  };

  qrPayments = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getQrPayments(req.query as unknown as AnalyticsQueryDto));
  };

  subscriptions = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getSubscriptionsAnalytics(req.query as unknown as AnalyticsQueryDto));
  };

  support = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getSupportAnalytics(req.query as unknown as AnalyticsQueryDto));
  };

  operations = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getOperationsAnalytics(req.query as unknown as AnalyticsQueryDto));
  };

  export = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.exportAnalytics(req.user!.sub, req.query as unknown as ExportQueryDto));
  };

  paymentMethods = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getPaymentMethods(req.query as unknown as AnalyticsQueryDto));
  };

  regional = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getRegional(req.query as unknown as AnalyticsQueryDto));
  };
}
