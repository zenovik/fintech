import { Request, Response } from 'express';
import { UserAdminService } from '../services/user.service';
import { sendSuccess } from '../../../shared/responses/api.response';
import { AssignUserRolesBodyDto, CreateUserBodyDto, UpdateUserBodyDto, UpdateUserStatusBodyDto, UserListQueryDto } from '../dto';

export class UserController {
  constructor(private readonly service = new UserAdminService()) {}

  list = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.list(req.query as unknown as UserListQueryDto));
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getById(Number(req.params.id)));
  };

  create = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.create(req.body as CreateUserBodyDto, req.user?.sub), 201, 'User created');
  };

  update = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.update(Number(req.params.id), req.body as UpdateUserBodyDto, req.user?.sub));
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.updateStatus(Number(req.params.id), req.body as UpdateUserStatusBodyDto, req.user?.sub));
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.remove(Number(req.params.id), req.user?.sub));
  };

  assignRoles = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.assignRoles(Number(req.params.id), req.body as AssignUserRolesBodyDto, req.user?.sub));
  };
}
