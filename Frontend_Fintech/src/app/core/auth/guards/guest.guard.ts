import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStateService } from '../services/auth-state.service';
import { DASHBOARD_ROUTES } from '../../../features/dashboard/constants/dashboard.constants';

export const guestGuard: CanActivateFn = () => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  if (authState.isAuthenticated()) {
    return router.createUrlTree([DASHBOARD_ROUTES.EXECUTIVE]);
  }
  return true;
};
