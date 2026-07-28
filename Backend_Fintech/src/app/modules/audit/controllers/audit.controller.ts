import { Request, Response } from 'express';
import { AuditService } from '../services/audit.service';
import { sendSuccess } from '../../../shared/responses/api.response';
import { AuditExportQueryDto, AuditListQueryDto, ApiLogListQueryDto, WebhookLogListQueryDto } from '../dto';

export class AuditController {
  constructor(private readonly service = new AuditService()) {}

  list = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.list(req.query as unknown as AuditListQueryDto));
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getById(Number(req.params.id)));
  };

  getCategories = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getCategories());
  };

  getActions = async (req: Request, res: Response): Promise<void> => {
    const categoryCode = req.query.categoryCode as string | undefined;
    sendSuccess(res, await this.service.getActions(categoryCode));
  };

  exportLogs = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.export(req.user!.sub, req.query as unknown as AuditExportQueryDto));
  };

  listApiLogs = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.listApiLogs(req.query as unknown as ApiLogListQueryDto));
  };

  listWebhookLogs = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.listWebhookLogs(req.query as unknown as WebhookLogListQueryDto));
  };
}
