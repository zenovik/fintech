import { Request, Response } from 'express';
import { TransactionService } from '../services/transaction.service';
import { sendSuccess } from '../../../shared/responses/api.response';
import {
  CreateDisputeBodyDto,
  CreateTransactionBodyDto,
  ExportQueryDto,
  RefundTransactionBodyDto,
  TransactionListQueryDto,
  TransactionSearchQueryDto,
  UpdateTransactionStatusBodyDto,
} from '../dto';

const LEGACY_REFUND_DEPRECATION = 'Sun, 01 Jan 2028 00:00:00 GMT';
const LEGACY_DISPUTE_DEPRECATION = 'Sun, 01 Jan 2028 00:00:00 GMT';

function setLegacyRefundHeaders(res: Response): void {
  res.setHeader('Deprecation', 'true');
  res.setHeader('Sunset', LEGACY_REFUND_DEPRECATION);
  res.setHeader('Link', '</api/v1/refunds>; rel="successor-version"');
}

function setLegacyDisputeHeaders(res: Response): void {
  res.setHeader('Deprecation', 'true');
  res.setHeader('Sunset', LEGACY_DISPUTE_DEPRECATION);
  res.setHeader('Link', '</api/v1/chargebacks>; rel="successor-version"');
}

export class TransactionController {
  constructor(private readonly transactionService = new TransactionService()) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const data = await this.transactionService.list(req.query as unknown as TransactionListQueryDto);
    sendSuccess(res, data);
  };

  search = async (req: Request, res: Response): Promise<void> => {
    const data = await this.transactionService.search(req.query as unknown as TransactionSearchQueryDto);
    sendSuccess(res, data);
  };

  statistics = async (req: Request, res: Response): Promise<void> => {
    const data = await this.transactionService.getStatistics(req.query as unknown as TransactionListQueryDto);
    sendSuccess(res, data);
  };

  export = async (req: Request, res: Response): Promise<void> => {
    const data = await this.transactionService.export(req.user!.sub, req.query as unknown as ExportQueryDto);
    sendSuccess(res, data);
  };

  disputes = async (_req: Request, res: Response): Promise<void> => {
    setLegacyDisputeHeaders(res);
    const data = await this.transactionService.getDisputes();
    sendSuccess(res, data);
  };

  createDispute = async (req: Request, res: Response): Promise<void> => {
    setLegacyDisputeHeaders(res);
    const data = await this.transactionService.createDispute(req.body as CreateDisputeBodyDto, req.user?.sub);
    sendSuccess(res, data, 201, 'Dispute created successfully');
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const data = await this.transactionService.getById(Number(req.params.id));
    sendSuccess(res, data);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const data = await this.transactionService.create(req.body as CreateTransactionBodyDto, req.user?.sub);
    sendSuccess(res, data, 201, 'Transaction created successfully');
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    const data = await this.transactionService.updateStatus(
      Number(req.params.id),
      req.body as UpdateTransactionStatusBodyDto,
      req.user?.sub,
    );
    sendSuccess(res, data, 200, 'Transaction status updated');
  };

  refund = async (req: Request, res: Response): Promise<void> => {
    setLegacyRefundHeaders(res);
    const data = await this.transactionService.refund(
      Number(req.params.id),
      req.body as RefundTransactionBodyDto,
      req.user?.sub,
    );
    sendSuccess(res, data, 201, 'Refund request submitted successfully');
  };
}
