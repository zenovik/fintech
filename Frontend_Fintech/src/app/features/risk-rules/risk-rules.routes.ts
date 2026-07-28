import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';
import { permissionGuard } from '../../core/auth/guards/permission.guard';
import { PERMISSIONS } from '../../core/auth/constants/permissions.constants';
import { DashboardShellComponent } from '../dashboard/layouts/dashboard-shell/dashboard-shell.component';

export const riskRuleRoutes: Routes = [
  {
    path: '',
    component: DashboardShellComponent,
    canActivate: [authGuard, permissionGuard(PERMISSIONS.RISK_RULES_READ)],
    children: [
      { path: '', loadComponent: () => import('./pages/risk-rules-list/risk-rules-list.component').then((m) => m.RiskRulesListComponent) },
    ],
  },
];
