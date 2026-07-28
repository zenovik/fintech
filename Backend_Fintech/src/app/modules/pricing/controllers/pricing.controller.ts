import { Request, Response } from 'express';
import { PricingService } from '../services/pricing.service';

export class PricingController {
  constructor(private readonly service = new PricingService()) {}

  list = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.list({ page: Number(req.query.page ?? 1), pageSize: Number(req.query.pageSize ?? 25), scopeType: req.query.scopeType as string | undefined }));
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.getById(Number(req.params.id)));
  };

  create = async (req: Request, res: Response): Promise<void> => {
    res.status(201).json(await this.service.create(req.body, req.user?.sub));
  };
}
