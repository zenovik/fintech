import { Request, Response } from 'express';
import { sendSuccess } from '../../../shared/responses/api.response';
import { ReconciliationService } from '../services/reconciliation.service';

export class ReconciliationController {
  constructor(private readonly service = new ReconciliationService()) {}

  dashboard = async (_req: Request, res: Response) => { sendSuccess(res, await this.service.dashboard()); };
  listImports = async (req: Request, res: Response) => {
    sendSuccess(res, await this.service.listImports({
      page: Number(req.query.page ?? 1), pageSize: Number(req.query.pageSize ?? 25),
      status: req.query.status as string | undefined,
    }));
  };
  getImport = async (req: Request, res: Response) => { sendSuccess(res, await this.service.getImport(Number(req.params.id))); };
  createImport = async (req: Request, res: Response) => { sendSuccess(res, await this.service.createImport(req.body, req.user?.sub), 201); };
  updateImport = async (req: Request, res: Response) => { sendSuccess(res, await this.service.updateImport(Number(req.params.id), req.body)); };
  deleteImport = async (req: Request, res: Response) => { sendSuccess(res, await this.service.deleteImport(Number(req.params.id))); };
  listRecords = async (req: Request, res: Response) => {
    sendSuccess(res, await this.service.listRecords({
      page: Number(req.query.page ?? 1), pageSize: Number(req.query.pageSize ?? 25),
      importId: req.query.importId ? Number(req.query.importId) : undefined,
      matchStatus: req.query.matchStatus as string | undefined,
    }));
  };
  getRecord = async (req: Request, res: Response) => { sendSuccess(res, await this.service.getRecord(Number(req.params.id))); };
  createRecord = async (req: Request, res: Response) => {
    sendSuccess(res, await this.service.createRecord(Number(req.params.importId), req.body), 201);
  };
  matchRecord = async (req: Request, res: Response) => {
    sendSuccess(res, await this.service.matchRecord(Number(req.params.id), req.body, req.user?.sub));
  };
}
