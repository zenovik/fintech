import { Request, Response } from 'express';
import { CustomerService } from '../services/customer.service';
import { sendSuccess } from '../../../shared/responses/api.response';
import {
  CreateCustomerBodyDto,
  CustomerListQueryDto,
  CustomerSearchQueryDto,
  CustomerTransactionsQueryDto,
  UpdateCustomerBodyDto,
  UpdateCustomerStatusBodyDto,
} from '../dto';

export class CustomerController {
  constructor(private readonly service = new CustomerService()) {}

  list = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.list(req.query as unknown as CustomerListQueryDto));
  };

  search = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.search(req.query as unknown as CustomerSearchQueryDto));
  };

  statistics = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getStatistics());
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getById(Number(req.params.id)));
  };

  create = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.create(req.body as CreateCustomerBodyDto, req.user?.sub), 201, 'Customer created successfully');
  };

  update = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.update(Number(req.params.id), req.body as UpdateCustomerBodyDto, req.user?.sub), 200, 'Customer updated successfully');
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.updateStatus(Number(req.params.id), req.body as UpdateCustomerStatusBodyDto, req.user?.sub), 200, 'Customer status updated');
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.delete(Number(req.params.id), req.user?.sub));
  };

  transactions = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getTransactions(Number(req.params.id), req.query as unknown as CustomerTransactionsQueryDto));
  };

  merchants = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getMerchants(Number(req.params.id)));
  };

  preferences = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getPreferences(Number(req.params.id)));
  };

  updatePreferences = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.updatePreferences(Number(req.params.id), req.body, req.user?.sub));
  };

  paymentMethods = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getPaymentMethods(Number(req.params.id)));
  };

  timeline = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getTimeline(Number(req.params.id)));
  };
}
