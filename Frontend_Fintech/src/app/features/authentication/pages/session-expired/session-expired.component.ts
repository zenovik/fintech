import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AUTH_ROUTES } from '../../../../core/auth/constants/auth.constants';

@Component({
  selector: 'app-session-expired',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './session-expired.component.html',
  styleUrl: './session-expired.component.scss',
})
export class SessionExpiredComponent {
  private readonly router = inject(Router);
  readonly loginRoute = AUTH_ROUTES.LOGIN;

  goHome(): void {
    void this.router.navigate(['/']);
  }
}
