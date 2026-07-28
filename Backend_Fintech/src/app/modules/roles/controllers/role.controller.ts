import { Request, Response } from 'express';
import { RoleService } from '../services/role.service';
import { sendSuccess } from '../../../shared/responses/api.response';
import { AssignRolePermissionsBodyDto, CreateRoleBodyDto, RoleListQueryDto, UpdateRoleBodyDto } from '../dto';

export class RoleController {
  constructor(private readonly service = new RoleService()) {}

  list = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.list(req.query as unknown as RoleListQueryDto));
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getById(Number(req.params.id)));
  };

  create = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.create(req.body as CreateRoleBodyDto, req.user?.sub), 201, 'Role created');
  };

  update = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.update(Number(req.params.id), req.body as UpdateRoleBodyDto, req.user?.sub));
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.remove(Number(req.params.id)));
  };

  assignPermissions = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.assignPermissions(Number(req.params.id), req.body as AssignRolePermissionsBodyDto, req.user?.sub));
  };
}
