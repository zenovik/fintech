import { Request, Response } from 'express';
import { RiskRuleService } from '../services/risk-rule.service';

export class RiskRuleController {
  constructor(private readonly service = new RiskRuleService()) {}

  list = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.list({
      page: Number(req.query.page ?? 1), pageSize: Number(req.query.pageSize ?? 25),
      ruleType: req.query.ruleType as string | undefined,
      isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
    }));
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.getById(Number(req.params.id)));
  };

  create = async (req: Request, res: Response): Promise<void> => {
    res.status(201).json(await this.service.create(req.body, req.user?.sub));
  };

  update = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.update(Number(req.params.id), req.body, req.user?.sub));
  };

  evaluate = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.evaluate(Number(req.params.id), req.body, req.user?.sub));
  };
}
