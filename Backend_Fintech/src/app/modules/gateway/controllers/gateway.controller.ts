import { Request, Response } from 'express';
import { GatewayService } from '../services/gateway.service';

export class GatewayController {
  constructor(private readonly service = new GatewayService()) {}

  listProviders = async (_req: Request, res: Response): Promise<void> => {
    res.json(await this.service.listProviders());
  };

  listTransactions = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.listTransactions({
      page: Number(req.query.page ?? 1),
      pageSize: Number(req.query.pageSize ?? 25),
      paymentIntentId: req.query.paymentIntentId ? Number(req.query.paymentIntentId) : undefined,
    }));
  };

  verifyWebhook = async (req: Request, res: Response): Promise<void> => {
    const provider = String(req.params.provider);
    const signature = String(req.headers['x-signature'] ?? req.headers['stripe-signature'] ?? req.headers['x-razorpay-signature'] ?? '');
    const valid = this.service.verifyWebhook(provider, JSON.stringify(req.body), signature);
    res.json({ valid });
  };
}
