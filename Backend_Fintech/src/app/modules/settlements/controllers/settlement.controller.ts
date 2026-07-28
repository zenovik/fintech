import { Request, Response } from 'express';
import { SettlementService } from '../services/settlement.service';
import { SettlementEngineService } from '../services/settlement-engine.service';
import { sendSuccess } from '../../../shared/responses/api.response';
import {
  CreateBatchBodyDto,
  CreateSettlementBodyDto,
  ExportQueryDto,
  ReversalBodyDto,
  SettlementListQueryDto,
  SettlementSearchQueryDto,
  UpdateSettlementStatusBodyDto,
} from '../dto';

export class SettlementController {
  constructor(
    private readonly settlementService = new SettlementService(),
    private readonly engineService = new SettlementEngineService(),
  ) {}

  list = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.settlementService.list(req.query as unknown as SettlementListQueryDto));
  };

  search = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.settlementService.search(req.query as unknown as SettlementSearchQueryDto));
  };

  statistics = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.settlementService.getStatistics(req.query as unknown as SettlementListQueryDto));
  };

  export = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.settlementService.export(req.user!.sub, req.query as unknown as ExportQueryDto));
  };

  batches = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.settlementService.getBatches());
  };

  batchById = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.settlementService.getBatchById(Number(req.params.id)));
  };

  createBatch = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.settlementService.createBatch(req.body as CreateBatchBodyDto, req.user?.sub), 201, 'Batch created');
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.settlementService.getById(Number(req.params.id)));
  };

  create = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.settlementService.create(req.body as CreateSettlementBodyDto, req.user?.sub), 201, 'Settlement created');
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.settlementService.updateStatus(Number(req.params.id), req.body as UpdateSettlementStatusBodyDto, req.user?.sub));
  };

  transactions = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.settlementService.getTransactions(Number(req.params.id)));
  };

  reversal = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.settlementService.reversal(Number(req.params.id), req.body as ReversalBodyDto, req.user?.sub), 201, 'Reversal processed');
  };

  calendar = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.engineService.calendar(req.query.year ? Number(req.query.year) : undefined));
  };

  listReserves = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.engineService.listReserves(req.query.merchantId ? Number(req.query.merchantId) : undefined));
  };

  createReserve = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.engineService.createReserve(Number(req.params.merchantId), req.body), 201);
  };

  hold = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.engineService.hold(Number(req.params.id), req.body, req.user?.sub));
  };

  release = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.engineService.release(Number(req.params.id), req.user?.sub));
  };

  retry = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.engineService.retry(Number(req.params.id), req.user?.sub));
  };
}
