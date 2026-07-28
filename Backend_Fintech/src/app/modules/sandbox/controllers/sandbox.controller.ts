import { Request, Response } from 'express';
import { sendSuccess } from '../../../shared/responses/api.response';
import { SandboxService } from '../services/sandbox.service';

export class SandboxController {
  constructor(private readonly service = new SandboxService()) {}

  dashboard = async (_req: Request, res: Response) => { sendSuccess(res, await this.service.dashboard()); };
  listAccounts = async (req: Request, res: Response) => {
    sendSuccess(res, await this.service.listAccounts({
      page: Number(req.query.page ?? 1), pageSize: Number(req.query.pageSize ?? 25),
      status: req.query.status as string | undefined,
    }));
  };
  getAccount = async (req: Request, res: Response) => { sendSuccess(res, await this.service.getAccount(Number(req.params.id))); };
  createAccount = async (req: Request, res: Response) => { sendSuccess(res, await this.service.createAccount(req.body, req.user?.sub), 201); };
  updateAccount = async (req: Request, res: Response) => { sendSuccess(res, await this.service.updateAccount(Number(req.params.id), req.body)); };
  deleteAccount = async (req: Request, res: Response) => { sendSuccess(res, await this.service.deleteAccount(Number(req.params.id))); };
  listTestCards = async (_req: Request, res: Response) => { sendSuccess(res, await this.service.listTestCards()); };
  listSimulations = async (req: Request, res: Response) => {
    sendSuccess(res, await this.service.listSimulations({ page: Number(req.query.page ?? 1), pageSize: Number(req.query.pageSize ?? 25) }));
  };
  getSimulation = async (req: Request, res: Response) => { sendSuccess(res, await this.service.getSimulation(Number(req.params.id))); };
  createSimulation = async (req: Request, res: Response) => { sendSuccess(res, await this.service.createSimulation(req.body), 201); };
  updateSimulation = async (req: Request, res: Response) => { sendSuccess(res, await this.service.updateSimulation(Number(req.params.id), req.body)); };
  deleteSimulation = async (req: Request, res: Response) => { sendSuccess(res, await this.service.deleteSimulation(Number(req.params.id))); };
}
