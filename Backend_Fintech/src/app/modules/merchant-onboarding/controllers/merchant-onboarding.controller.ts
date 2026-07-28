import { Request, Response } from 'express';
import { MerchantOnboardingService } from '../services/merchant-onboarding.service';
import { sendSuccess } from '../../../shared/responses/api.response';
import {
  AddressesBodyDto, BankDetailsDto, BusinessInfoDto, KycDocumentsBodyDto,
  OnboardingListQueryDto, PaymentConfigDto, RejectBodyDto, SettlementConfigDto, SuspendBodyDto,
} from '../dto';

export class MerchantOnboardingController {
  constructor(private readonly service = new MerchantOnboardingService()) {}

  statistics = async (_req: Request, res: Response) => { sendSuccess(res, await this.service.getStatistics()); };
  list = async (req: Request, res: Response) => { sendSuccess(res, await this.service.list(req.query as unknown as OnboardingListQueryDto)); };
  getById = async (req: Request, res: Response) => { sendSuccess(res, await this.service.getById(Number(req.params.id))); };
  create = async (req: Request, res: Response) => { sendSuccess(res, await this.service.create(req.user?.sub), 201, 'Onboarding application created'); };
  saveBusiness = async (req: Request, res: Response) => { sendSuccess(res, await this.service.saveBusiness(Number(req.params.id), req.body as BusinessInfoDto, req.user?.sub)); };
  saveAddresses = async (req: Request, res: Response) => { sendSuccess(res, await this.service.saveAddresses(Number(req.params.id), req.body as AddressesBodyDto, req.user?.sub)); };
  saveKyc = async (req: Request, res: Response) => { sendSuccess(res, await this.service.saveKyc(Number(req.params.id), req.body as KycDocumentsBodyDto, req.user?.sub)); };
  saveBank = async (req: Request, res: Response) => { sendSuccess(res, await this.service.saveBank(Number(req.params.id), req.body as BankDetailsDto, req.user?.sub)); };
  saveSettlement = async (req: Request, res: Response) => { sendSuccess(res, await this.service.saveSettlement(Number(req.params.id), req.body as SettlementConfigDto, req.user?.sub)); };
  savePayment = async (req: Request, res: Response) => { sendSuccess(res, await this.service.savePayment(Number(req.params.id), req.body as PaymentConfigDto, req.user?.sub)); };
  submit = async (req: Request, res: Response) => { sendSuccess(res, await this.service.submit(Number(req.params.id), req.user?.sub), 200, 'Application submitted'); };
  approve = async (req: Request, res: Response) => { sendSuccess(res, await this.service.approve(Number(req.params.id), req.user?.sub), 200, 'Application approved'); };
  reject = async (req: Request, res: Response) => { sendSuccess(res, await this.service.reject(Number(req.params.id), req.body as RejectBodyDto, req.user?.sub), 200, 'Application rejected'); };
  goLive = async (req: Request, res: Response) => { sendSuccess(res, await this.service.goLive(Number(req.params.id), req.user?.sub), 200, 'Merchant is now live'); };
  suspend = async (req: Request, res: Response) => { sendSuccess(res, await this.service.suspend(Number(req.params.id), req.body as SuspendBodyDto, req.user?.sub), 200, 'Merchant suspended'); };
  timeline = async (req: Request, res: Response) => { sendSuccess(res, await this.service.getTimeline(Number(req.params.id))); };
}
