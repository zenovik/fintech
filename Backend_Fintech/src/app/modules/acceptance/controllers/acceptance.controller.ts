import { Request, Response } from 'express';
import { sendSuccess } from '../../../shared/responses/api.response';
import { AcceptanceService } from '../services/acceptance.service';

export class AcceptanceController {
  constructor(private readonly service = new AcceptanceService()) {}

  analytics = async (req: Request, res: Response) => {
    sendSuccess(res, await this.service.analytics(
      req.query.merchantId ? Number(req.query.merchantId) : undefined,
      req.query.days ? Number(req.query.days) : undefined,
    ));
  };

  merchantPortal = async (req: Request, res: Response) => {
    sendSuccess(res, await this.service.merchantPortal(Number(req.params.merchantId)));
  };

  topMerchants = async (req: Request, res: Response) => {
    sendSuccess(res, await this.service.topMerchants(req.query.limit ? Number(req.query.limit) : undefined));
  };

  failureInsights = async (req: Request, res: Response) => {
    sendSuccess(res, await this.service.failureInsights(req.query.merchantId ? Number(req.query.merchantId) : undefined));
  };
}
