import { ApplicationConfig, APP_INITIALIZER, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './routing/app.routes';
import { authInterceptor } from './core/auth/interceptors/auth.interceptor';
import { AuthStateService } from './core/auth/services/auth-state.service';

function initializeAuth(authState: AuthStateService): () => void {
  return () => authState.restoreSession();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([authInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuth,
      deps: [AuthStateService],
      multi: true,
    },
  ],
};
