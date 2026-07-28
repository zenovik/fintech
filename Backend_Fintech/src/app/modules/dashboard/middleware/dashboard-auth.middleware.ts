import { Request, Response, NextFunction } from 'express';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { ForbiddenError } from '../../../shared/exceptions/app.exception';

/** Dashboard access requires authentication. Extend with RBAC when roles module is implemented. */
export async function dashboardAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  await authenticate(req, res, () => {
    if (!req.user) {
      next(new ForbiddenError('Dashboard access denied'));
      return;
    }
    next();
  });
}
