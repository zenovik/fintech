import { Request, Response } from 'express';
import { sendSuccess } from '../../../shared/responses/api.response';
import { DeveloperService } from '../services/developer.service';

export class DeveloperController {
  constructor(private readonly service = new DeveloperService()) {}

  dashboard = async (_req: Request, res: Response) => { sendSuccess(res, await this.service.dashboard()); };
  listProfiles = async (req: Request, res: Response) => {
    sendSuccess(res, await this.service.listProfiles({ page: Number(req.query.page ?? 1), pageSize: Number(req.query.pageSize ?? 25) }));
  };
  getProfile = async (req: Request, res: Response) => { sendSuccess(res, await this.service.getProfile(Number(req.params.id))); };
  createProfile = async (req: Request, res: Response) => { sendSuccess(res, await this.service.createProfile(req.body), 201); };
  updateProfile = async (req: Request, res: Response) => { sendSuccess(res, await this.service.updateProfile(Number(req.params.id), req.body)); };
  deleteProfile = async (req: Request, res: Response) => { sendSuccess(res, await this.service.deleteProfile(Number(req.params.id))); };
  listOAuthApps = async (req: Request, res: Response) => {
    sendSuccess(res, await this.service.listOAuthApps({
      page: Number(req.query.page ?? 1), pageSize: Number(req.query.pageSize ?? 25),
      status: req.query.status as string | undefined,
    }));
  };
  getOAuthApp = async (req: Request, res: Response) => { sendSuccess(res, await this.service.getOAuthApp(Number(req.params.id))); };
  createOAuthApp = async (req: Request, res: Response) => { sendSuccess(res, await this.service.createOAuthApp(req.body, req.user?.sub), 201); };
  updateOAuthApp = async (req: Request, res: Response) => { sendSuccess(res, await this.service.updateOAuthApp(Number(req.params.id), req.body)); };
  revokeOAuthApp = async (req: Request, res: Response) => { sendSuccess(res, await this.service.revokeOAuthApp(Number(req.params.id))); };
  listApiUsageLogs = async (req: Request, res: Response) => {
    sendSuccess(res, await this.service.listApiUsageLogs({
      page: Number(req.query.page ?? 1), pageSize: Number(req.query.pageSize ?? 25),
      method: req.query.method as string | undefined,
      statusCode: req.query.statusCode ? Number(req.query.statusCode) : undefined,
    }));
  };
  listApiKeys = async (_req: Request, res: Response) => { sendSuccess(res, await this.service.listApiKeys()); };
}
