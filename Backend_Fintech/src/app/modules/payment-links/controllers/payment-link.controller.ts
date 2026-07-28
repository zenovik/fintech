import { Request, Response } from 'express';
import { PaymentLinkService } from '../services/payment-link.service';
import { sendSuccess } from '../../../shared/responses/api.response';
import {
  CreatePaymentLinkBodyDto,
  PaymentLinkListQueryDto,
  PublicPayBodyDto,
  UpdatePaymentLinkBodyDto,
} from '../dto';

export class PaymentLinkController {
  constructor(private readonly service = new PaymentLinkService()) {}

  list = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.list(req.query as unknown as PaymentLinkListQueryDto));
  };

  statistics = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getStatistics());
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getById(Number(req.params.id)));
  };

  create = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(
      res,
      await this.service.create(req.body as CreatePaymentLinkBodyDto, req.user?.sub),
      201,
      'Payment link created successfully',
    );
  };

  update = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(
      res,
      await this.service.update(Number(req.params.id), req.body as UpdatePaymentLinkBodyDto, req.user?.sub),
      200,
      'Payment link updated successfully',
    );
  };

  enable = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.enable(Number(req.params.id), req.user?.sub), 200, 'Payment link enabled');
  };

  disable = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.disable(Number(req.params.id), req.user?.sub), 200, 'Payment link disabled');
  };

  expire = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.expire(Number(req.params.id), req.user?.sub), 200, 'Payment link expired');
  };

  regenerateToken = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.regenerateToken(Number(req.params.id), req.user?.sub), 200, 'Token regenerated');
  };

  clone = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.clone(Number(req.params.id), req.user?.sub), 201, 'Payment link cloned');
  };

  analytics = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.linkAnalytics(Number(req.params.id)));
  };

  visits = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.linkVisits(Number(req.params.id), Number(req.query.page ?? 1), Number(req.query.pageSize ?? 25)));
  };

  qrCode = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getQrCode(Number(req.params.id)));
  };
}

export class PublicPaymentLinkController {
  constructor(private readonly service = new PaymentLinkService()) {}

  getByToken = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getPublicLink(req.params.token));
  };

  pay = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(
      res,
      await this.service.processPayment(req.params.token, req.body as PublicPayBodyDto),
      201,
      'Payment processed successfully',
    );
  };
}
