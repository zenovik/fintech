import { Request, Response } from 'express';
import { PaymentConfigService } from '../services/payment-config.service';

export class PaymentConfigController {
  constructor(private readonly service = new PaymentConfigService()) {}

  getMerchantConfig = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.getMerchantConfig(Number(req.params.merchantId)));
  };

  saveConfig = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.saveConfig(Number(req.params.merchantId), req.body, req.user?.sub));
  };

  listLimits = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.listLimits(req.query.merchantId ? Number(req.query.merchantId) : undefined));
  };

  saveLimit = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.saveLimit(req.body));
  };
}
