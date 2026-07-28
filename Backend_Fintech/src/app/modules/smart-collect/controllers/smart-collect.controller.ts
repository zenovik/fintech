import { Request, Response } from 'express';
import { sendSuccess } from '../../../shared/responses/api.response';
import { SmartCollectService } from '../services/smart-collect.service';

export class SmartCollectController {
  constructor(private readonly service = new SmartCollectService()) {}

  dashboard = async (req: Request, res: Response) => {
    sendSuccess(res, await this.service.dashboard(req.query.merchantId ? Number(req.query.merchantId) : undefined));
  };

  listVirtualAccounts = async (req: Request, res: Response) => {
    sendSuccess(res, await this.service.listVirtualAccounts({
      page: Number(req.query.page ?? 1), pageSize: Number(req.query.pageSize ?? 25),
      status: req.query.status as string | undefined,
      merchantId: req.query.merchantId ? Number(req.query.merchantId) : undefined,
      accountType: req.query.accountType as string | undefined,
    }));
  };

  createVirtualAccount = async (req: Request, res: Response) => {
    sendSuccess(res, await this.service.createVirtualAccount(req.body, req.user?.sub), 201);
  };

  getVirtualAccount = async (req: Request, res: Response) => {
    sendSuccess(res, await this.service.getVirtualAccount(Number(req.params.id)));
  };

  listCollections = async (req: Request, res: Response) => {
    sendSuccess(res, await this.service.listCollections({
      page: Number(req.query.page ?? 1), pageSize: Number(req.query.pageSize ?? 25),
      status: req.query.status as string | undefined,
      merchantId: req.query.merchantId ? Number(req.query.merchantId) : undefined,
      virtualAccountId: req.query.virtualAccountId ? Number(req.query.virtualAccountId) : undefined,
    }));
  };

  getCollection = async (req: Request, res: Response) => {
    sendSuccess(res, await this.service.getCollection(Number(req.params.id)));
  };

  matchCollection = async (req: Request, res: Response) => {
    sendSuccess(res, await this.service.matchCollection(Number(req.params.id), req.body, req.user?.sub));
  };
}
