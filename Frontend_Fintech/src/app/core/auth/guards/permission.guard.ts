import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RbacService } from '../services/rbac.service';
import { AUTH_ROUTES } from '../constants/auth.constants';

export function permissionGuard(...requiredPermissions: string[]): CanActivateFn {
  return () => {
    const rbac = inject(RbacService);
    const router = inject(Router);
    if (rbac.hasAnyPermission(...requiredPermissions)) return true;
    return router.createUrlTree([AUTH_ROUTES.ACCESS_DENIED]);
  };
}
