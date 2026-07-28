import { PERMISSIONS } from '../auth/constants/permissions.constants';
import { DASHBOARD_ROUTES } from '../../features/dashboard/constants/dashboard.constants';

export interface NavItemConfig {
  label: string;
  route: string;
  icon: string;
  permission: string;
  group?: string;
}

export const NAV_ITEMS: NavItemConfig[] = [
  { label: 'Dashboard', route: DASHBOARD_ROUTES.EXECUTIVE, icon: 'dashboard', permission: PERMISSIONS.DASHBOARD_READ },
  { label: 'Organizations', route: '/organizations', icon: 'corporate_fare', permission: PERMISSIONS.ORGANIZATIONS_READ },
  { label: 'Onboarding', route: '/merchant-onboarding', icon: 'assignment', permission: PERMISSIONS.MERCHANT_ONBOARDING_READ },
  { label: 'Compliance Queue', route: '/onboarding-approval/compliance', icon: 'fact_check', permission: PERMISSIONS.COMPLIANCE_QUEUE_READ },
  { label: 'Merchants', route: '/merchants', icon: 'storefront', permission: PERMISSIONS.MERCHANTS_READ },
  { label: 'Outlets', route: '/outlets', icon: 'store', permission: PERMISSIONS.OUTLETS_READ },
  { label: 'Merchant Users', route: '/merchant-users', icon: 'groups', permission: PERMISSIONS.MERCHANT_USERS_READ },
  { label: 'Transactions', route: '/transactions', icon: 'payments', permission: PERMISSIONS.TRANSACTIONS_READ },
  { label: 'Devices', route: '/devices', icon: 'devices', permission: PERMISSIONS.DEVICES_READ },
  { label: 'Fraud Queue', route: '/fraud', icon: 'security', permission: PERMISSIONS.FRAUD_READ },
  { label: 'Risk Rules', route: '/risk-rules', icon: 'rule', permission: PERMISSIONS.RISK_RULES_READ },
  { label: 'Refunds', route: '/refunds', icon: 'currency_exchange', permission: PERMISSIONS.REFUNDS_READ },
  { label: 'Chargebacks', route: '/chargebacks', icon: 'gavel', permission: PERMISSIONS.CHARGEBACKS_READ },
  { label: 'Settlements', route: '/settlements', icon: 'account_balance', permission: PERMISSIONS.SETTLEMENTS_READ },
  { label: 'Payouts', route: '/payouts', icon: 'send', permission: PERMISSIONS.PAYOUTS_READ },
  { label: 'Payment Links', route: '/payment-links', icon: 'link', permission: PERMISSIONS.PAYMENT_LINKS_READ },
  { label: 'Checkout', route: '/checkout/sessions', icon: 'shopping_cart_checkout', permission: PERMISSIONS.CHECKOUT_READ },
  { label: 'Checkout Analytics', route: '/checkout/analytics', icon: 'insights', permission: PERMISSIONS.CHECKOUT_ANALYTICS },
  { label: 'Invoices', route: '/invoices', icon: 'receipt_long', permission: PERMISSIONS.INVOICES_READ },
  { label: 'QR Payments', route: '/qr-payments', icon: 'qr_code_2', permission: PERMISSIONS.QR_PAYMENTS_READ },
  { label: 'Smart Collect', route: '/smart-collect', icon: 'account_balance', permission: PERMISSIONS.SMART_COLLECT_READ },
  { label: 'Acceptance Analytics', route: '/acceptance/analytics', icon: 'monitoring', permission: PERMISSIONS.ACCEPTANCE_ANALYTICS_READ },
  { label: 'Merchant Portal', route: '/merchant-portal', icon: 'store', permission: PERMISSIONS.MERCHANT_PORTAL_READ },
  { label: 'Developer Portal', route: '/developer', icon: 'code', permission: PERMISSIONS.DEVELOPER_READ },
  { label: 'Webhooks', route: '/webhooks', icon: 'webhook', permission: PERMISSIONS.WEBHOOKS_READ },
  { label: 'Reconciliation', route: '/reconciliation', icon: 'compare_arrows', permission: PERMISSIONS.RECONCILIATION_READ },
  { label: 'Sandbox', route: '/sandbox', icon: 'science', permission: PERMISSIONS.SANDBOX_READ },
  { label: 'Subscriptions', route: '/subscriptions', icon: 'autorenew', permission: PERMISSIONS.SUBSCRIPTIONS_READ },
  { label: 'Customers', route: '/customers', icon: 'group', permission: PERMISSIONS.CUSTOMERS_READ },
  { label: 'Reports', route: '/reports', icon: 'assessment', permission: PERMISSIONS.REPORTS_READ },
  { label: 'Report Center', route: '/reports/center', icon: 'summarize', permission: PERMISSIONS.REPORTS_READ },
  { label: 'Activity', route: '/activity', icon: 'timeline', permission: PERMISSIONS.ACTIVITY_CENTER_READ },
  { label: 'Users', route: '/users', icon: 'manage_accounts', permission: PERMISSIONS.USERS_READ },
  { label: 'Roles', route: '/roles', icon: 'admin_panel_settings', permission: PERMISSIONS.ROLES_READ },
  { label: 'Communications', route: '/notifications', icon: 'forum', permission: PERMISSIONS.NOTIFICATIONS_READ },
  { label: 'Audit', route: '/audit', icon: 'shield', permission: PERMISSIONS.AUDIT_READ },
  { label: 'Support', route: '/support', icon: 'contact_support', permission: PERMISSIONS.SUPPORT_READ },
  { label: 'Operations', route: '/operations', icon: 'monitoring', permission: PERMISSIONS.OPERATIONS_READ },
  { label: 'Settings', route: '/settings', icon: 'settings', permission: PERMISSIONS.SETTINGS_READ },
];
