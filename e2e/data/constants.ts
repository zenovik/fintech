export const SEED_PASSWORD = 'Password123!';

export const ORG = {
  merchantPro: 1,
  secondOrg: 2,
} as const;

export const MERCHANT = {
  org1Active: 1,
  org1Active2: 7,
} as const;

export const CUSTOMER = {
  org1: 8,
} as const;

export const PAYMENT_METHOD = 'credit_card';

export const ROUTES = {
  login: '/auth/login',
  forgotPassword: '/auth/forgot-password',
  resetPassword: '/auth/reset-password',
  sessionExpired: '/auth/session-expired',
  dashboard: '/dashboard/executive',
  merchants: '/merchants',
  merchantCreate: '/merchants/create',
  merchantUsers: '/merchant-users',
  transactions: '/transactions',
  checkoutSessions: '/checkout/sessions',
  qrPayments: '/qr-payments',
  paymentLinks: '/payment-links',
  refunds: '/refunds',
  chargebacks: '/chargebacks',
  subscriptions: '/subscriptions',
  reports: '/reports',
  audit: '/audit',
  developer: '/developer',
  sandbox: '/sandbox',
  webhooks: '/webhooks',
  users: '/users',
  settings: '/settings',
  profile: '/settings/account',
} as const;
