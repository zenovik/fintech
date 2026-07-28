import { HttpInterceptorFn, HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { AuthStateService } from '../services/auth-state.service';
import { SessionService } from '../services/session.service';
import { CsrfService } from '../services/csrf.service';
import { AUTH_ROUTES } from '../constants/auth.constants';
import { ORG_STORAGE_KEY } from '../../../features/organizations/constants/organizations.constants';
import { MERCHANT_STORAGE_KEY, OUTLET_STORAGE_KEY } from '../../../features/merchant-users/constants/merchant-context.constants';
import { environment } from '../../../../environments/environment';

let isRefreshing = false;

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function buildContextHeaders(isPublicAuth: boolean): Record<string, string> {
  const headers: Record<string, string> = {};
  const orgId = localStorage.getItem(ORG_STORAGE_KEY);
  const merchantId = localStorage.getItem(MERCHANT_STORAGE_KEY);
  const outletId = localStorage.getItem(OUTLET_STORAGE_KEY);
  if (orgId && !isPublicAuth) {
    headers['X-Organization-Id'] = orgId;
  }
  if (merchantId && !isPublicAuth) {
    headers['X-Merchant-Id'] = merchantId;
  }
  if (outletId && !isPublicAuth) {
    headers['X-Outlet-Id'] = outletId;
  }
  return headers;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authState = inject(AuthStateService);
  const authService = inject(AuthService);
  const sessionService = inject(SessionService);
  const csrfService = inject(CsrfService);
  const router = inject(Router);

  const isPublicAuth =
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/forgot-password') ||
    req.url.includes('/auth/reset-password') ||
    req.url.includes('/auth/verify-otp') ||
    req.url.includes('/auth/resend-otp');

  const isApiRequest = req.url.startsWith(environment.apiUrl) || req.url.startsWith('/api');
  const contextHeaders = buildContextHeaders(isPublicAuth);

  const prepare = async (): Promise<HttpRequest<unknown>> => {
    let authReq = req.clone({
      withCredentials: isApiRequest,
      ...(Object.keys(contextHeaders).length > 0 ? { setHeaders: contextHeaders } : {}),
    });

    if (isApiRequest && MUTATING_METHODS.has(req.method) && !req.url.includes('/auth/csrf-token')) {
      const csrfToken = await csrfService.getToken();
      authReq = authReq.clone({ setHeaders: { ...contextHeaders, 'X-CSRF-Token': csrfToken } });
    }

    return authReq;
  };

  return from(prepare()).pipe(
    switchMap((authReq) => next(authReq)),
    catchError((error: HttpErrorResponse) => {
      if (error.status === 403 && error.error?.code === 'CSRF_INVALID') {
        csrfService.clear();
      }

      if (error.status === 403 && !req.url.includes('/auth/')) {
        void router.navigate([AUTH_ROUTES.ACCESS_DENIED]);
        return throwError(() => error);
      }

      if (
        error.status !== 401 ||
        isPublicAuth ||
        req.headers.has('X-Retry') ||
        req.url.includes('/auth/refresh-token')
      ) {
        return throwError(() => error);
      }

      if (isRefreshing) {
        return throwError(() => error);
      }

      isRefreshing = true;
      return authService.refreshToken().pipe(
        switchMap((response) => {
          isRefreshing = false;
          authState.setAuthenticated(response.user, response.accessToken, response.expiresIn);
          sessionService.startIdleMonitoring();
          return from(prepare()).pipe(
            switchMap((retryReq) =>
              next(
                retryReq.clone({
                  setHeaders: {
                    ...retryReq.headers.keys().reduce<Record<string, string>>((acc, key) => {
                      const value = retryReq.headers.get(key);
                      if (value) acc[key] = value;
                      return acc;
                    }, {}),
                    'X-Retry': 'true',
                  },
                }),
              ),
            ),
          );
        }),
        catchError((refreshError) => {
          isRefreshing = false;
          sessionService.handleSessionExpired();
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
