import { Routes } from '@angular/router';
import { AUTH_ROUTES } from '../core/auth/constants/auth.constants';
import { authGuard } from '../core/auth/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: AUTH_ROUTES.LOGIN,
    pathMatch: 'full',
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('../features/authentication/authentication.routes').then(
        (m) => m.authenticationRoutes,
      ),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadChildren: () =>
      import('../features/dashboard/dashboard.routes').then((m) => m.dashboardRoutes),
  },
  {
    path: 'merchants',
    canActivate: [authGuard],
    loadChildren: () =>
      import('../features/merchant/merchant.routes').then((m) => m.merchantRoutes),
  },
  {
    path: 'merchant-onboarding',
    canActivate: [authGuard],
    loadChildren: () =>
      import('../features/merchant-onboarding/merchant-onboarding.routes').then((m) => m.merchantOnboardingRoutes),
  },
  {
    path: 'outlets',
    canActivate: [authGuard],
    loadChildren: () =>
      import('../features/outlets/outlets.routes').then((m) => m.outletRoutes),
  },
  {
    path: 'onboarding-approval',
    canActivate: [authGuard],
    loadChildren: () =>
      import('../features/onboarding-approval/onboarding-approval.routes').then((m) => m.onboardingApprovalRoutes),
  },
  {
    path: 'merchant-users',
    canActivate: [authGuard],
    loadChildren: () =>
      import('../features/merchant-users/merchant-users.routes').then((m) => m.merchantUserRoutes),
  },
  {
    path: 'devices',
    canActivate: [authGuard],
    loadChildren: () =>
      import('../features/devices/devices.routes').then((m) => m.deviceRoutes),
  },
  {
    path: 'fraud',
    canActivate: [authGuard],
    loadChildren: () =>
      import('../features/fraud/fraud.routes').then((m) => m.fraudRoutes),
  },
  {
    path: 'risk-rules',
    canActivate: [authGuard],
    loadChildren: () =>
      import('../features/risk-rules/risk-rules.routes').then((m) => m.riskRuleRoutes),
  },
  {
    path: 'transactions',
    canActivate: [authGuard],
    loadChildren: () =>
      import('../features/transactions/transactions.routes').then((m) => m.transactionRoutes),
  },
  {
    path: 'settlements',
    canActivate: [authGuard],
    loadChildren: () =>
      import('../features/settlements/settlements.routes').then((m) => m.settlementRoutes),
  },
  {
    path: 'users',
    loadChildren: () =>
      import('../features/users/users.routes').then((m) => m.userRoutes),
  },
  {
    path: 'roles',
    loadChildren: () =>
      import('../features/roles/roles.routes').then((m) => m.roleRoutes),
  },
  {
    path: 'reports',
    canActivate: [authGuard],
    loadChildren: () =>
      import('../features/reports/reports.routes').then((m) => m.reportsRoutes),
  },
  {
    path: 'settings',
    loadChildren: () =>
      import('../features/settings/settings.routes').then((m) => m.settingsRoutes),
  },
  {
    path: 'notifications',
    canActivate: [authGuard],
    loadChildren: () =>
      import('../features/notifications/notifications.routes').then((m) => m.notificationsRoutes),
  },
  {
    path: 'audit',
    canActivate: [authGuard],
    loadChildren: () =>
      import('../features/audit/audit.routes').then((m) => m.auditRoutes),
  },
  {
    path: 'refunds',
    canActivate: [authGuard],
    loadChildren: () =>
      import('../features/refunds/refunds.routes').then((m) => m.refundRoutes),
  },
  {
    path: 'chargebacks',
    canActivate: [authGuard],
    loadChildren: () =>
      import('../features/chargebacks/chargebacks.routes').then((m) => m.chargebackRoutes),
  },
  {
    path: 'payouts',
    canActivate: [authGuard],
    loadChildren: () =>
      import('../features/payouts/payouts.routes').then((m) => m.payoutRoutes),
  },
  {
    path: 'payment-links',
    canActivate: [authGuard],
    loadChildren: () =>
      import('../features/payment-links/payment-links.routes').then((m) => m.paymentLinkRoutes),
  },
  {
    path: 'invoices',
    canActivate: [authGuard],
    loadChildren: () =>
      import('../features/invoices/invoices.routes').then((m) => m.invoiceRoutes),
  },
  {
    path: 'qr-payments',
    canActivate: [authGuard],
    loadChildren: () =>
      import('../features/qr-payments/qr-payments.routes').then((m) => m.qrPaymentRoutes),
  },
  {
    path: 'subscriptions',
    canActivate: [authGuard],
    loadChildren: () =>
      import('../features/subscriptions/subscriptions.routes').then((m) => m.subscriptionRoutes),
  },
  {
    path: 'support',
    canActivate: [authGuard],
    loadChildren: () =>
      import('../features/support/support.routes').then((m) => m.supportRoutes),
  },
  {
    path: 'operations',
    canActivate: [authGuard],
    loadChildren: () =>
      import('../features/operations/operations.routes').then((m) => m.operationsRoutes),
  },
  {
    path: 'activity',
    canActivate: [authGuard],
    loadChildren: () =>
      import('../features/activity/activity.routes').then((m) => m.activityRoutes),
  },
  {
    path: 'checkout',
    canActivate: [authGuard],
    loadChildren: () =>
      import('../features/checkout-admin/checkout-admin.routes').then((m) => m.checkoutAdminRoutes),
  },
  {
    path: 'pay/checkout/:ref',
    loadComponent: () =>
      import('../features/checkout/pages/hosted-checkout/hosted-checkout.component').then((m) => m.HostedCheckoutComponent),
    title: 'Checkout | Merchant Pro',
  },
  {
    path: 'pay/:token',
    loadComponent: () =>
      import('../features/payment-links/pages/public-pay/public-pay.component').then((m) => m.PublicPayComponent),
    title: 'Pay | Merchant Pro',
  },
  {
    path: 'qr/:token',
    loadComponent: () =>
      import('../features/qr-payments/pages/public-qr-pay/public-qr-pay.component').then((m) => m.PublicQrPayComponent),
    title: 'QR Pay | Merchant Pro',
  },
  {
    path: 'smart-collect',
    canActivate: [authGuard],
    loadChildren: () =>
      import('../features/smart-collect/smart-collect.routes').then((m) => m.smartCollectRoutes),
  },
  {
    path: 'acceptance',
    canActivate: [authGuard],
    loadChildren: () =>
      import('../features/acceptance/acceptance.routes').then((m) => m.acceptanceRoutes),
  },
  {
    path: 'merchant-portal',
    canActivate: [authGuard],
    loadChildren: () =>
      import('../features/merchant-portal/merchant-portal.routes').then((m) => m.merchantPortalRoutes),
  },
  {
    path: 'developer',
    canActivate: [authGuard],
    loadChildren: () =>
      import('../features/developer/developer.routes').then((m) => m.developerRoutes),
  },
  {
    path: 'webhooks',
    canActivate: [authGuard],
    loadChildren: () =>
      import('../features/webhooks/webhooks.routes').then((m) => m.webhooksRoutes),
  },
  {
    path: 'reconciliation',
    canActivate: [authGuard],
    loadChildren: () =>
      import('../features/reconciliation/reconciliation.routes').then((m) => m.reconciliationRoutes),
  },
  {
    path: 'sandbox',
    canActivate: [authGuard],
    loadChildren: () =>
      import('../features/sandbox/sandbox.routes').then((m) => m.sandboxRoutes),
  },
  {
    path: 'customers',
    canActivate: [authGuard],
    loadChildren: () =>
      import('../features/customers/customers.routes').then((m) => m.customerRoutes),
  },
  {
    path: 'organizations',
    canActivate: [authGuard],
    loadChildren: () =>
      import('../features/organizations/organizations.routes').then((m) => m.organizationRoutes),
  },
  {
    path: 'select-organization',
    canActivate: [authGuard],
    loadComponent: () =>
      import('../features/organizations/pages/select-organization/select-organization.component').then(
        (m) => m.SelectOrganizationComponent,
      ),
    title: 'Select Organization | Merchant Pro',
  },
  {
    path: '**',
    redirectTo: AUTH_ROUTES.LOGIN,
  },
];
