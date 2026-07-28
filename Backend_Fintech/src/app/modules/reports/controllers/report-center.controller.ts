import { Request, Response } from 'express';
import { sendSuccess } from '../../../shared/responses/api.response';
import { ReportCenterService } from '../services/report-center.service';

export class ReportCenterController {
  constructor(private readonly service = new ReportCenterService()) {}

  catalog = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.catalog());
  };

  savedFilters = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.savedFilters(req.query.reportType as string | undefined, req.user?.sub));
  };

  saveFilter = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.saveFilter(req.body, req.user!.sub), 201);
  };

  deleteFilter = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.deleteFilter(Number(req.params.id), req.user!.sub));
  };

  generate = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.generate(req.body.reportType, req.body.filters));
  };

  exportReport = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.exportReport(req.user!.sub, req.body.reportType, req.body.format, req.body.filters));
  };

  exportHistory = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.exportHistory(req.user!.sub));
  };
}
