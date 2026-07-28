import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStateService } from '../services/auth-state.service';
import { AuthService } from '../services/auth.service';
import { SessionService } from '../services/session.service';
import { AUTH_ROUTES, AUTH_STORAGE_KEYS } from '../constants/auth.constants';
import { map, catchError, of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authState = inject(AuthStateService);
  const authService = inject(AuthService);
  const sessionService = inject(SessionService);
  const router = inject(Router);

  if (!authState.isAuthenticated()) {
    sessionStorage.setItem(AUTH_STORAGE_KEYS.RETURN_URL, state.url);
    return router.createUrlTree([AUTH_ROUTES.LOGIN]);
  }

  return authService.getMe().pipe(
    map((profile) => {
      authState.updateUser({
        uuid: profile.uuid,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        mfaEnabled: profile.mfaEnabled,
        roles: profile.roles ?? [],
        permissions: profile.permissions ?? [],
      });
      sessionService.startIdleMonitoring();
      return true;
    }),
    catchError(() => {
      authState.clearSession();
      sessionStorage.setItem(AUTH_STORAGE_KEYS.RETURN_URL, state.url);
      return of(router.createUrlTree([AUTH_ROUTES.LOGIN]));
    }),
  );
};
