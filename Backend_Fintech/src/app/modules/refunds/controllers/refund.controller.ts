import { Request, Response } from 'express';
import { RefundService } from '../services/refund.service';
import { sendSuccess } from '../../../shared/responses/api.response';
import { CreateRefundBodyDto, RefundListQueryDto, RejectRefundBodyDto } from '../dto';

export class RefundController {
  constructor(private readonly service = new RefundService()) {}

  list = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.list(req.query as unknown as RefundListQueryDto));
  };

  statistics = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getStatistics());
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getById(Number(req.params.id)));
  };

  create = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.createRequest(req.body as CreateRefundBodyDto, req.user?.sub), 201, 'Refund request submitted');
  };

  approve = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.approve(Number(req.params.id), req.user?.sub), 200, 'Refund approved and processed');
  };

  reject = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.reject(Number(req.params.id), req.body as RejectRefundBodyDto, req.user?.sub), 200, 'Refund rejected');
  };

  history = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getHistory(Number(req.params.id)));
  };
}
