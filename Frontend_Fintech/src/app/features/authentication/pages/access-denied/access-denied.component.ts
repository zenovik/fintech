import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthLayoutComponent } from '../../components/auth-layout/auth-layout.component';
import { AUTH_ROUTES } from '../../../../core/auth/constants/auth.constants';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [RouterLink, AuthLayoutComponent],
  templateUrl: './access-denied.component.html',
  styleUrl: './access-denied.component.scss',
})
export class AccessDeniedComponent {
  readonly loginRoute = AUTH_ROUTES.LOGIN;
  readonly sessionsRoute = AUTH_ROUTES.SESSIONS;
}
