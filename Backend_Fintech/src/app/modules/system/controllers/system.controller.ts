import { Request, Response } from 'express';
import { healthService } from '../services/health.service';
import { SystemConfigService } from '../services/system-config.service';
import { sendSuccess } from '../../../shared/responses/api.response';

export class SystemController {
  constructor(private readonly configService = new SystemConfigService()) {}

  liveness = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, healthService.getLiveness());
  };

  metrics = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, healthService.getMetrics());
  };

  health = async (_req: Request, res: Response): Promise<void> => {
    const data = await healthService.getHealth();
    const statusCode = data.status === 'unhealthy' ? 503 : 200;
    sendSuccess(res, data, statusCode);
  };

  readiness = async (_req: Request, res: Response): Promise<void> => {
    const data = await healthService.getReadiness();
    sendSuccess(res, data, data.ready ? 200 : 503);
  };

  version = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, healthService.getVersion());
  };

  adminStatus = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await healthService.getAdminStatus());
  };

  listCacheConfig = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.configService.listCacheConfig());
  };

  updateCacheConfig = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.configService.updateCacheConfig(Number(req.params.id), req.body));
  };

  listBackupConfig = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.configService.listBackupConfig());
  };

  updateBackupConfig = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.configService.updateBackupConfig(Number(req.params.id), req.body));
  };

  jobHistory = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.configService.getJobHistory({ page: Number(req.query.page ?? 1), pageSize: Number(req.query.pageSize ?? 25) }));
  };

  performanceMetrics = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.configService.getPerformanceMetrics());
  };
}
