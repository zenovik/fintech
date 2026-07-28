import { Request, Response } from 'express';
import { OperationsService } from '../services/operations.service';
import { sendSuccess } from '../../../shared/responses/api.response';
import { AlertListQueryDto, IncidentListQueryDto, JobListQueryDto, RetryListQueryDto } from '../dto';

export class OperationsController {
  constructor(private readonly service = new OperationsService()) {}

  dashboard = async (_req: Request, res: Response) => { sendSuccess(res, await this.service.getDashboard()); };
  pendingTasks = async (_req: Request, res: Response) => { sendSuccess(res, await this.service.getPendingTasks()); };
  health = async (_req: Request, res: Response) => { sendSuccess(res, await this.service.getHealth()); };
  alerts = async (req: Request, res: Response) => { sendSuccess(res, await this.service.listAlerts(req.query as unknown as AlertListQueryDto)); };
  incidents = async (req: Request, res: Response) => { sendSuccess(res, await this.service.listIncidents(req.query as unknown as IncidentListQueryDto)); };
  retryQueue = async (req: Request, res: Response) => { sendSuccess(res, await this.service.listRetryQueue(req.query as unknown as RetryListQueryDto)); };
  jobs = async (req: Request, res: Response) => { sendSuccess(res, await this.service.listJobs(req.query as unknown as JobListQueryDto)); };
  failedPayments = async (_req: Request, res: Response) => { sendSuccess(res, await this.service.getFailedPayments()); };
  failedPayouts = async (_req: Request, res: Response) => { sendSuccess(res, await this.service.getFailedPayouts()); };
  failedWebhooks = async (_req: Request, res: Response) => { sendSuccess(res, await this.service.getFailedWebhooks()); };
  acknowledgeAlert = async (req: Request, res: Response) => { sendSuccess(res, await this.service.acknowledgeAlert(Number(req.params.id), req.user?.sub)); };
  resolveAlert = async (req: Request, res: Response) => { sendSuccess(res, await this.service.resolveAlert(Number(req.params.id))); };
  retryQueueItem = async (req: Request, res: Response) => { sendSuccess(res, await this.service.manualRetryQueue(Number(req.params.id), req.user?.sub)); };
  retryJob = async (req: Request, res: Response) => { sendSuccess(res, await this.service.manualRetryJob(Number(req.params.id), req.user?.sub)); };
  queuesDashboard = async (_req: Request, res: Response) => { sendSuccess(res, await this.service.getQueuesDashboard()); };
  deadLetterQueue = async (req: Request, res: Response) => {
    sendSuccess(res, await this.service.getDeadLetterQueue({ page: Number(req.query.page ?? 1), pageSize: Number(req.query.pageSize ?? 25) }));
  };
  getMaintenanceMode = async (_req: Request, res: Response) => { sendSuccess(res, await this.service.getMaintenanceMode()); };
  setMaintenanceMode = async (req: Request, res: Response) => {
    sendSuccess(res, await this.service.setMaintenanceMode(Boolean(req.body.enabled), req.body.message, req.user?.sub));
  };
  deploymentHistory = async (req: Request, res: Response) => {
    sendSuccess(res, await this.service.getDeploymentHistory({ page: Number(req.query.page ?? 1), pageSize: Number(req.query.pageSize ?? 25) }));
  };
}
