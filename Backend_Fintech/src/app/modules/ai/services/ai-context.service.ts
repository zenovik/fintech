import { Request } from 'express';
import { UserAdminRepository } from '../../users/repositories/user.repository';
import { getOrganizationId, getOrganizationRoleCode } from '../../../shared/context/org-context';
import { AppError } from '../../../shared/exceptions/app.exception';
import { AiRequestContext } from '../providers/ai-provider.interface';

export class AiContextService {
  constructor(private readonly userRepo = new UserAdminRepository()) {}

  async buildFromRequest(req: Request): Promise<AiRequestContext> {
    const userId = req.user?.sub;
    const sessionId = req.user?.sessionId;
    if (!userId || !sessionId) {
      throw new AppError(401, 'Authentication required', 'UNAUTHORIZED');
    }

    const organizationId = getOrganizationId() ?? req.user?.organizationId;
    if (!organizationId) {
      throw new AppError(400, 'Organization context is required', 'ORGANIZATION_REQUIRED');
    }

    const role = getOrganizationRoleCode() ?? req.user?.organizationRoleCode ?? 'unknown';
    const user = await this.userRepo.findById(userId);
    const userName = user
      ? `${user.first_name} ${user.last_name}`.trim()
      : req.user?.email ?? 'Unknown User';

    return { organizationId, userId, role, userName };
  }
}
