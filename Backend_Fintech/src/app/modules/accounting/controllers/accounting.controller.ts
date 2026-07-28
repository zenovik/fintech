import { Request, Response } from 'express';
import { AccountingService } from '../services/accounting.service';

export class AccountingController {
  constructor(private readonly service = new AccountingService()) {}

  listAccounts = async (_req: Request, res: Response): Promise<void> => {
    res.json(await this.service.listAccounts());
  };

  listEntries = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.listEntries({
      page: Number(req.query.page ?? 1), pageSize: Number(req.query.pageSize ?? 25),
      accountId: req.query.accountId ? Number(req.query.accountId) : undefined,
      referenceType: req.query.referenceType as string | undefined,
    }));
  };

  summary = async (_req: Request, res: Response): Promise<void> => {
    res.json(await this.service.summary());
  };

  export = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.export({
      accountId: req.query.accountId ? Number(req.query.accountId) : undefined,
      referenceType: req.query.referenceType as string | undefined,
    }));
  };
}
