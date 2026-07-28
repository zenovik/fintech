import { Request, Response } from 'express';
import { ChargebackService } from '../services/chargeback.service';
import { sendSuccess } from '../../../shared/responses/api.response';
import {
  AddEvidenceBodyDto,
  ChargebackListQueryDto,
  CreateChargebackBodyDto,
  RepresentmentBodyDto,
  ResolveChargebackBodyDto,
} from '../dto';

export class ChargebackController {
  constructor(private readonly service = new ChargebackService()) {}

  list = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.list(req.query as unknown as ChargebackListQueryDto));
  };

  statistics = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getStatistics());
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getById(Number(req.params.id)));
  };

  create = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.create(req.body as CreateChargebackBodyDto, req.user?.sub), 201, 'Chargeback opened');
  };

  addEvidence = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.addEvidence(Number(req.params.id), req.body as AddEvidenceBodyDto, req.user?.sub), 200, 'Evidence added');
  };

  representment = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.submitRepresentment(Number(req.params.id), req.body as RepresentmentBodyDto, req.user?.sub), 200, 'Representment submitted');
  };

  resolve = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.resolve(Number(req.params.id), req.body as ResolveChargebackBodyDto, req.user?.sub), 200, 'Chargeback resolved');
  };

  history = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getHistory(Number(req.params.id)));
  };

  evidence = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getEvidence(Number(req.params.id)));
  };

  slaDashboard = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getSlaDashboard());
  };

  analytics = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getAnalytics());
  };

  arbitration = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.submitArbitration(Number(req.params.id), req.body?.notes, req.user?.sub), 200, 'Arbitration submitted');
  };
}
