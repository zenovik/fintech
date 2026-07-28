import { Request, Response } from 'express';
import { SubscriptionService } from '../services/subscription.service';
import { sendSuccess } from '../../../shared/responses/api.response';
import { CreatePlanBodyDto, CreateSubscriptionBodyDto, PlanListQueryDto, SubscriptionListQueryDto } from '../dto';

export class SubscriptionController {
  constructor(private readonly service = new SubscriptionService()) {}

  listPlans = async (req: Request, res: Response) => { sendSuccess(res, await this.service.listPlans(req.query as unknown as PlanListQueryDto)); };
  createPlan = async (req: Request, res: Response) => {
    sendSuccess(res, await this.service.createPlan(req.body as CreatePlanBodyDto, req.user?.sub), 201, 'Plan created');
  };
  list = async (req: Request, res: Response) => { sendSuccess(res, await this.service.listSubscriptions(req.query as unknown as SubscriptionListQueryDto)); };
  statistics = async (_req: Request, res: Response) => { sendSuccess(res, await this.service.getStatistics()); };
  getById = async (req: Request, res: Response) => { sendSuccess(res, await this.service.getById(Number(req.params.id))); };
  create = async (req: Request, res: Response) => {
    sendSuccess(res, await this.service.create(req.body as CreateSubscriptionBodyDto, req.user?.sub), 201, 'Subscription created');
  };
  pause = async (req: Request, res: Response) => { sendSuccess(res, await this.service.pause(Number(req.params.id), req.user?.sub)); };
  cancel = async (req: Request, res: Response) => { sendSuccess(res, await this.service.cancel(Number(req.params.id), req.user?.sub)); };
  renew = async (req: Request, res: Response) => { sendSuccess(res, await this.service.renew(Number(req.params.id), req.user?.sub)); };
  markFailed = async (req: Request, res: Response) => { sendSuccess(res, await this.service.markFailed(Number(req.params.id), req.user?.sub)); };
  resume = async (req: Request, res: Response) => { sendSuccess(res, await this.service.resume(Number(req.params.id), req.user?.sub)); };
  upgrade = async (req: Request, res: Response) => { sendSuccess(res, await this.service.upgrade(Number(req.params.id), Number(req.body.planId), req.user?.sub)); };
  downgrade = async (req: Request, res: Response) => { sendSuccess(res, await this.service.downgrade(Number(req.params.id), Number(req.body.planId), req.user?.sub)); };
  listDunning = async (req: Request, res: Response) => {
    sendSuccess(res, await this.service.listDunning({
      page: Number(req.query.page ?? 1), pageSize: Number(req.query.pageSize ?? 25),
      subscriptionId: req.query.subscriptionId ? Number(req.query.subscriptionId) : undefined,
    }));
  };
  listMandates = async (req: Request, res: Response) => {
    sendSuccess(res, await this.service.listMandates(req.query.subscriptionId ? Number(req.query.subscriptionId) : undefined));
  };
  analytics = async (_req: Request, res: Response) => { sendSuccess(res, await this.service.getAnalytics()); };
}
