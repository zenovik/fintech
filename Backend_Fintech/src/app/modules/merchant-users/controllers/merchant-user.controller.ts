import { Request, Response } from 'express';
import { MerchantUserService } from '../services/merchant-user.service';
import {
  AssignOutletsBodyDto, AssignRoleBodyDto, CreateMerchantUserBodyDto,
  InviteMerchantUserBodyDto, MerchantUserListQueryDto, UpdateMerchantUserBodyDto,
} from '../dto';

export class MerchantUserController {
  constructor(private readonly service = new MerchantUserService()) {}

  listRoles = async (_req: Request, res: Response) => {
    res.json(await this.service.listRoles());
  };

  list = async (req: Request, res: Response) => {
    res.json(await this.service.list(req.query as unknown as MerchantUserListQueryDto));
  };

  getById = async (req: Request, res: Response) => {
    res.json(await this.service.getById(Number(req.params.id)));
  };

  create = async (req: Request, res: Response) => {
    res.status(201).json(await this.service.create(req.body as CreateMerchantUserBodyDto, req.user?.sub));
  };

  invite = async (req: Request, res: Response) => {
    res.status(201).json(await this.service.invite(req.body as InviteMerchantUserBodyDto, req.user?.sub));
  };

  update = async (req: Request, res: Response) => {
    res.json(await this.service.update(Number(req.params.id), req.body as UpdateMerchantUserBodyDto, req.user?.sub));
  };

  activate = async (req: Request, res: Response) => {
    res.json(await this.service.activate(Number(req.params.id), req.user?.sub));
  };

  deactivate = async (req: Request, res: Response) => {
    res.json(await this.service.deactivate(Number(req.params.id), req.user?.sub));
  };

  assignRole = async (req: Request, res: Response) => {
    res.json(await this.service.assignRole(Number(req.params.id), req.body as AssignRoleBodyDto, req.user?.sub));
  };

  assignOutlets = async (req: Request, res: Response) => {
    res.json(await this.service.assignOutlets(Number(req.params.id), req.body as AssignOutletsBodyDto, req.user?.sub));
  };

  resetPassword = async (req: Request, res: Response) => {
    res.json(await this.service.resetPassword(Number(req.params.id), req.body.password, req.user?.sub));
  };

  me = async (req: Request, res: Response) => {
    res.json(await this.service.getMyContext(req.user!.sub, req.user!.organizationRoleCode));
  };
}
