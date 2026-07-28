import { Request, Response } from 'express';
import { sendSuccess } from '../../../shared/responses/api.response';
import { PaymentEngineService } from '../services/payment-engine.service';

export class PaymentController {
  constructor(private readonly engine = new PaymentEngineService()) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const idempotencyKey = req.headers['x-idempotency-key'] as string | undefined;
    sendSuccess(res, await this.engine.createPayment(req.body, req.user?.sub, idempotencyKey), 201);
  };

  list = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.engine.search({
      page: Number(req.query.page ?? 1),
      pageSize: Number(req.query.pageSize ?? 25),
      status: req.query.status as string | undefined,
      merchantId: req.query.merchantId ? Number(req.query.merchantId) : undefined,
      search: req.query.search as string | undefined,
    }));
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.engine.getStatus(Number(req.params.id)));
  };

  timeline = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.engine.timeline(Number(req.params.id)));
  };

  capture = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.engine.capture(Number(req.params.id), req.body, req.user?.sub));
  };

  cancel = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.engine.cancel(Number(req.params.id), req.body.reason, req.user?.sub));
  };

  refund = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.engine.refund(Number(req.params.id), req.body, req.user?.sub));
  };

  authorize = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.engine.authorize(Number(req.params.id), req.user?.sub));
  };

  retry = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.engine.retry(Number(req.params.id), req.user?.sub));
  };

  expire = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.engine.expire(Number(req.params.id), req.user?.sub));
  };

  createSession = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.engine.createSession(req.body, req.user?.sub), 201);
  };

  getSession = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.engine.getSession(Number(req.params.id)));
  };

  listOrders = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.engine.listOrders({
      page: Number(req.query.page ?? 1),
      pageSize: Number(req.query.pageSize ?? 25),
      status: req.query.status as string | undefined,
      merchantId: req.query.merchantId ? Number(req.query.merchantId) : undefined,
    }));
  };

  getOrder = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.engine.getOrder(Number(req.params.id)));
  };

  merchantConfig = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.engine.merchantConfig(Number(req.params.merchantId)));
  };

  customerProfile = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.engine.customerProfile(Number(req.params.customerId)));
  };

  webhookDeliveries = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.engine.webhookDeliveries(
      req.query.merchantId ? Number(req.query.merchantId) : undefined,
    ));
  };
}
