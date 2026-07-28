import { Request, Response } from 'express';
import { OrganizationService } from '../services/organization.service';
import { sendSuccess } from '../../../shared/responses/api.response';
import {
  BillingBodyDto,
  BrandingBodyDto,
  CreateApiKeyBodyDto,
  CreateDomainBodyDto,
  CreateMemberBodyDto,
  CreateOrganizationBodyDto,
  OrganizationListQueryDto,
  PreferencesBodyDto,
  UpdateDomainBodyDto,
  UpdateMemberBodyDto,
  UpdateOrganizationBodyDto,
  UpdateOrganizationStatusBodyDto,
} from '../dto';

export class OrganizationController {
  constructor(private readonly service = new OrganizationService()) {}

  private uid(req: Request): number {
    return req.user!.sub;
  }

  list = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.list(req.query as unknown as OrganizationListQueryDto));
  };

  getMine = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getMine(this.uid(req)));
  };

  getRoles = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getRoles());
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getById(Number(req.params.id), this.uid(req)));
  };

  create = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.create(req.body as CreateOrganizationBodyDto, req.user?.sub), 201, 'Organization created');
  };

  update = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.update(Number(req.params.id), req.body as UpdateOrganizationBodyDto, this.uid(req)), 200, 'Organization updated');
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.updateStatus(Number(req.params.id), req.body as UpdateOrganizationStatusBodyDto, this.uid(req)));
  };

  archive = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.archive(Number(req.params.id), this.uid(req)), 200, 'Organization archived');
  };

  restore = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.restore(Number(req.params.id), this.uid(req)), 200, 'Organization restored');
  };

  getMembers = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getMembers(Number(req.params.id), this.uid(req)));
  };

  addMember = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.addMember(Number(req.params.id), req.body as CreateMemberBodyDto, this.uid(req)), 201);
  };

  updateMember = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.updateMember(Number(req.params.id), Number(req.params.memberId), req.body as UpdateMemberBodyDto, this.uid(req)));
  };

  removeMember = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.removeMember(Number(req.params.id), Number(req.params.memberId), this.uid(req)));
  };

  getDomains = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getDomains(Number(req.params.id), this.uid(req)));
  };

  addDomain = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.addDomain(Number(req.params.id), req.body as CreateDomainBodyDto, this.uid(req)), 201);
  };

  updateDomain = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.updateDomain(Number(req.params.id), Number(req.params.domainId), req.body as UpdateDomainBodyDto, this.uid(req)));
  };

  deleteDomain = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.deleteDomain(Number(req.params.id), Number(req.params.domainId), this.uid(req)));
  };

  getBranding = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getBranding(Number(req.params.id), this.uid(req)));
  };

  updateBranding = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.updateBranding(Number(req.params.id), req.body as BrandingBodyDto, this.uid(req)));
  };

  getPreferences = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getPreferences(Number(req.params.id), this.uid(req)));
  };

  updatePreferences = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.updatePreferences(Number(req.params.id), req.body as PreferencesBodyDto, this.uid(req)));
  };

  getApiKeys = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getApiKeys(Number(req.params.id), this.uid(req)));
  };

  createApiKey = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.createApiKey(Number(req.params.id), req.body as CreateApiKeyBodyDto, this.uid(req)), 201);
  };

  revokeApiKey = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.revokeApiKey(Number(req.params.id), Number(req.params.keyId), this.uid(req)));
  };

  getBilling = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getBilling(Number(req.params.id), this.uid(req)));
  };

  updateBilling = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.updateBilling(Number(req.params.id), req.body as BillingBodyDto, this.uid(req)));
  };
}
