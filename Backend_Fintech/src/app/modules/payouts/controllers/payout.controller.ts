import { Request, Response } from 'express';
import { PayoutService } from '../services/payout.service';
import { sendSuccess } from '../../../shared/responses/api.response';
import {
  BankAccountListQueryDto,
  CreateBankAccountBodyDto,
  CreatePayoutBodyDto,
  PayoutListQueryDto,
  RejectPayoutBodyDto,
  UpdateBankAccountBodyDto,
} from '../dto';

export class PayoutController {
  constructor(private readonly service = new PayoutService()) {}

  list = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.list(req.query as unknown as PayoutListQueryDto));
  };

  statistics = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getStatistics());
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getById(Number(req.params.id)));
  };

  create = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.create(req.body as CreatePayoutBodyDto, req.user?.sub), 201, 'Payout created');
  };

  approve = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.approve(Number(req.params.id), req.user?.sub), 200, 'Payout approved and processed');
  };

  reject = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.reject(Number(req.params.id), req.body as RejectPayoutBodyDto, req.user?.sub), 200, 'Payout rejected');
  };

  retry = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.retry(Number(req.params.id), req.user?.sub), 200, 'Payout retry succeeded');
  };

  history = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getHistory(Number(req.params.id)));
  };

  listBankAccounts = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.listBankAccounts(req.query as unknown as BankAccountListQueryDto));
  };

  createBankAccount = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.createBankAccount(req.body as CreateBankAccountBodyDto), 201, 'Bank account added');
  };

  updateBankAccount = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.updateBankAccount(Number(req.params.id), req.body as UpdateBankAccountBodyDto), 200, 'Bank account updated');
  };
}
