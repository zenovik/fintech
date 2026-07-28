import { Request, Response } from 'express';
import { sendSuccess } from '../../../shared/responses/api.response';
import { WebhooksService } from '../services/webhooks.service';

export class WebhooksController {
  constructor(private readonly service = new WebhooksService()) {}

  dashboard = async (_req: Request, res: Response) => { sendSuccess(res, await this.service.dashboard()); };
  listWebhooks = async (req: Request, res: Response) => {
    sendSuccess(res, await this.service.listWebhooks({
      page: Number(req.query.page ?? 1), pageSize: Number(req.query.pageSize ?? 25),
      merchantId: req.query.merchantId ? Number(req.query.merchantId) : undefined,
      isActive: req.query.isActive != null ? req.query.isActive === 'true' : undefined,
    }));
  };
  getWebhook = async (req: Request, res: Response) => { sendSuccess(res, await this.service.getWebhook(Number(req.params.id))); };
  createWebhook = async (req: Request, res: Response) => { sendSuccess(res, await this.service.createWebhook(req.body), 201); };
  updateWebhook = async (req: Request, res: Response) => { sendSuccess(res, await this.service.updateWebhook(Number(req.params.id), req.body)); };
  deleteWebhook = async (req: Request, res: Response) => { sendSuccess(res, await this.service.deleteWebhook(Number(req.params.id))); };
  createSubscription = async (req: Request, res: Response) => {
    sendSuccess(res, await this.service.createSubscription(Number(req.params.id), req.body), 201);
  };
  updateSubscription = async (req: Request, res: Response) => {
    sendSuccess(res, await this.service.updateSubscription(Number(req.params.id), Number(req.params.subId), req.body));
  };
  deleteSubscription = async (req: Request, res: Response) => {
    sendSuccess(res, await this.service.deleteSubscription(Number(req.params.id), Number(req.params.subId)));
  };
  listDeliveries = async (req: Request, res: Response) => {
    sendSuccess(res, await this.service.listDeliveries({
      page: Number(req.query.page ?? 1), pageSize: Number(req.query.pageSize ?? 25),
      status: req.query.status as string | undefined,
      webhookId: req.query.webhookId ? Number(req.query.webhookId) : undefined,
    }));
  };
  getDelivery = async (req: Request, res: Response) => { sendSuccess(res, await this.service.getDelivery(Number(req.params.id))); };
  retryDelivery = async (req: Request, res: Response) => {
    sendSuccess(res, await this.service.retryDelivery(Number(req.params.id), req.user?.sub, req.body?.reason));
  };
}
