import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthStateService } from '../../../../core/auth/services/auth-state.service';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { SessionService } from '../../../../core/auth/services/session.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { BrandingService } from '../../../settings/services/branding.service';
import { FeatureFlagService } from '../../../settings/services/feature-flag.service';
import { OrganizationContextService } from '../../../organizations/services/organization-context.service';
import { AUTH_ROUTES } from '../../../../core/auth/constants/auth.constants';
import { NAV_PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import { NavService } from '../../../../core/navigation/nav.service';
import { MerchantContextService } from '../../../merchant-users/services/merchant-context.service';
import { DASHBOARD_ROUTES } from '../../constants/dashboard.constants';

@Component({
  selector: 'app-dashboard-sidenav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './dashboard-sidenav.component.html',
  styleUrl: './dashboard-sidenav.component.scss',
})
export class DashboardSidenavComponent implements OnInit {
  private readonly authState = inject(AuthStateService);
  private readonly authService = inject(AuthService);
  private readonly sessionService = inject(SessionService);
  readonly rbac = inject(RbacService);
  readonly nav = inject(NavService);
  readonly branding = inject(BrandingService);
  readonly featureFlags = inject(FeatureFlagService);
  private readonly orgContext = inject(OrganizationContextService);
  private readonly merchantContext = inject(MerchantContextService);

  readonly dashboardRoute = DASHBOARD_ROUTES.EXECUTIVE;
  readonly loginRoute = AUTH_ROUTES.LOGIN;
  readonly navPerms = NAV_PERMISSIONS;

  ngOnInit(): void {
    this.branding.load();
    this.featureFlags.load();
    this.merchantContext.load();
  }

  signOut(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.orgContext.clear();
        this.merchantContext.clear();
        this.authState.clearSession();
        this.sessionService.stopIdleMonitoring();
        window.location.href = this.loginRoute;
      },
      error: () => {
        this.orgContext.clear();
        this.merchantContext.clear();
        this.authState.clearSession();
        window.location.href = this.loginRoute;
      },
    });
  }
}
