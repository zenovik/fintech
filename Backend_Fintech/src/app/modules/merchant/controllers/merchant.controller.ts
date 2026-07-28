import { Request, Response } from 'express';
import { MerchantService } from '../services/merchant.service';
import { sendSuccess } from '../../../shared/responses/api.response';
import {
  CreateDocumentBodyDto,
  CreateMerchantBodyDto,
  MerchantListQueryDto,
  MerchantSearchQueryDto,
  MerchantTransactionsQueryDto,
  UpdateMerchantBodyDto,
  UpdateMerchantStatusBodyDto,
} from '../dto';

export class MerchantController {
  constructor(private readonly merchantService = new MerchantService()) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const data = await this.merchantService.list(req.query as unknown as MerchantListQueryDto);
    sendSuccess(res, data);
  };

  search = async (req: Request, res: Response): Promise<void> => {
    const data = await this.merchantService.search(req.query as unknown as MerchantSearchQueryDto);
    sendSuccess(res, data);
  };

  statistics = async (_req: Request, res: Response): Promise<void> => {
    const data = await this.merchantService.getStatistics();
    sendSuccess(res, data);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const data = await this.merchantService.getById(Number(req.params.id));
    sendSuccess(res, data);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const data = await this.merchantService.create(req.body as CreateMerchantBodyDto, req.user?.sub);
    sendSuccess(res, data, 201, 'Merchant created successfully');
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const data = await this.merchantService.update(
      Number(req.params.id),
      req.body as UpdateMerchantBodyDto,
      req.user?.sub,
    );
    sendSuccess(res, data, 200, 'Merchant updated successfully');
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    const data = await this.merchantService.updateStatus(
      Number(req.params.id),
      req.body as UpdateMerchantStatusBodyDto,
      req.user?.sub,
    );
    sendSuccess(res, data, 200, 'Merchant status updated');
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const data = await this.merchantService.delete(Number(req.params.id), req.user?.sub);
    sendSuccess(res, data);
  };

  transactions = async (req: Request, res: Response): Promise<void> => {
    const data = await this.merchantService.getTransactions(
      Number(req.params.id),
      req.query as unknown as MerchantTransactionsQueryDto,
    );
    sendSuccess(res, data);
  };

  settlements = async (req: Request, res: Response): Promise<void> => {
    const data = await this.merchantService.getSettlements(Number(req.params.id));
    sendSuccess(res, data);
  };

  documents = async (req: Request, res: Response): Promise<void> => {
    const data = await this.merchantService.getDocuments(Number(req.params.id));
    sendSuccess(res, data);
  };

  createDocument = async (req: Request, res: Response): Promise<void> => {
    const data = await this.merchantService.createDocument(
      Number(req.params.id),
      req.body as CreateDocumentBodyDto,
      req.user?.sub,
    );
    sendSuccess(res, data, 201, 'Document uploaded successfully');
  };

  deleteDocument = async (req: Request, res: Response): Promise<void> => {
    const data = await this.merchantService.deleteDocument(
      Number(req.params.id),
      Number(req.params.documentId),
    );
    sendSuccess(res, data);
  };
}
