import { Request, Response } from 'express';
import { AccountingService } from '../services/accounting.service';
import { LedgerService } from '../../../shared/financial/ledger.service';

export class AccountingController {
  constructor(
    private readonly service = new AccountingService(),
    private readonly ledger = new LedgerService(),
  ) {}

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

  listJournals = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.ledger.listJournals({
      page: Number(req.query.page ?? 1),
      pageSize: Number(req.query.pageSize ?? 25),
      status: req.query.status as string | undefined,
    }));
  };

  getJournal = async (req: Request, res: Response): Promise<void> => {
    const data = await this.ledger.getJournal(Number(req.params.id));
    res.json(data ?? { error: 'Not found' });
  };

  postJournal = async (req: Request, res: Response): Promise<void> => {
    const actorId = req.user?.sub;
    res.status(201).json(await this.ledger.postJournal(req.body, actorId));
  };

  reverseJournal = async (req: Request, res: Response): Promise<void> => {
    const actorId = req.user?.sub;
    res.json(await this.ledger.reverseJournal(Number(req.params.id), actorId, req.body?.reason));
  };

  trialBalance = async (_req: Request, res: Response): Promise<void> => {
    res.json(await this.ledger.trialBalance());
  };

  validateBalances = async (_req: Request, res: Response): Promise<void> => {
    res.json(await this.ledger.validateBalances());
  };

  listPeriods = async (_req: Request, res: Response): Promise<void> => {
    res.json(await this.ledger.listPeriods());
  };

  closePeriod = async (req: Request, res: Response): Promise<void> => {
    const actorId = req.user?.sub;
    res.json(await this.ledger.closePeriod(Number(req.body.year), Number(req.body.month), actorId));
  };
}
