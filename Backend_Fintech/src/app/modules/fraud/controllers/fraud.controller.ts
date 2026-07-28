import { Request, Response } from 'express';
import { FraudService } from '../services/fraud.service';

export class FraudController {
  constructor(private readonly service = new FraudService()) {}

  list = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.list({
      page: Number(req.query.page ?? 1), pageSize: Number(req.query.pageSize ?? 25),
      status: req.query.status as string | undefined, search: req.query.search as string | undefined,
    }));
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.getById(Number(req.params.id)));
  };

  approve = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.decide(Number(req.params.id), 'approved', req.body.remarks, req.user?.sub));
  };

  reject = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.decide(Number(req.params.id), 'rejected', req.body.remarks, req.user?.sub));
  };

  release = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.decide(Number(req.params.id), 'released', req.body.remarks, req.user?.sub));
  };
}
