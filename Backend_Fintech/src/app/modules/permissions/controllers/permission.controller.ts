import { Request, Response } from 'express';
import { PermissionService } from '../services/permission.service';
import { sendSuccess } from '../../../shared/responses/api.response';

export class PermissionController {
  constructor(private readonly service = new PermissionService()) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.list());
  };
}
