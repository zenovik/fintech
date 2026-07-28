import { Request, Response } from 'express';
import { sendSuccess } from '../../../shared/responses/api.response';
import { CheckoutService } from '../services/checkout.service';

export class CheckoutController {
  constructor(private readonly service = new CheckoutService()) {}

  create = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.createSession(req.body, req.user?.sub, {
      ipAddress: req.ip, userAgent: req.headers['user-agent'], browser: req.body.browser,
      deviceType: req.body.deviceType, osName: req.body.osName, countryCode: req.body.countryCode,
    }), 201);
  };

  list = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.listSessions({
      page: Number(req.query.page ?? 1), pageSize: Number(req.query.pageSize ?? 25),
      status: req.query.status as string | undefined,
      merchantId: req.query.merchantId ? Number(req.query.merchantId) : undefined,
    }));
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getSession(Number(req.params.id)));
  };

  analytics = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getAnalytics(
      req.query.merchantId ? Number(req.query.merchantId) : undefined,
      req.query.days ? Number(req.query.days) : undefined,
    ));
  };

  getBranding = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getBranding(Number(req.params.merchantId)));
  };

  updateBranding = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.updateBranding(Number(req.params.merchantId), req.body, req.user?.sub));
  };

  listThemes = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.listThemes());
  };
}

export class PublicCheckoutController {
  constructor(private readonly service = new CheckoutService()) {}

  private secret(req: Request): string {
    const header = req.headers['x-client-secret'] as string | undefined;
    if (header) return header;
    const query = req.query.client_secret as string | undefined;
    if (query) return query;
    return '';
  }

  getCheckout = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getPublicCheckout(req.params.ref, this.secret(req)));
  };

  pay = async (req: Request, res: Response): Promise<void> => {
    try {
      sendSuccess(res, await this.service.processPayment(req.params.ref, this.secret(req), req.body), 200);
    } catch (err: unknown) {
      const e = err as { redirectUrl?: string; canRetry?: boolean; message?: string };
      if (e.redirectUrl) {
        res.status(422).json({ success: false, message: e.message, redirectUrl: e.redirectUrl, canRetry: e.canRetry });
        return;
      }
      throw err;
    }
  };

  retry = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.retryPayment(req.params.ref, this.secret(req), req.body));
  };

  recover = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.recoverSession(req.params.token));
  };

  cancel = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.cancelSession(req.params.ref, this.secret(req)));
  };
}
