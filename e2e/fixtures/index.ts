import { test as base, expect } from '@playwright/test';
import { USERS, type TestUser } from '../data/users';
import { createApiClient } from '../helpers/api.helper';
import { runE2eCleanup } from '../helpers/cleanup.helper';
import {
  LoginPage,
  DashboardPage,
  MerchantPage,
  MerchantUsersPage,
  PaymentsPage,
  CheckoutPage,
  QrPaymentsPage,
  PaymentLinksPage,
  RefundsPage,
  ChargebacksPage,
  SubscriptionsPage,
  ReportsPage,
  AuditPage,
  DeveloperPortalPage,
  WebhooksPage,
  SandboxPage,
  ProfilePage,
  SettingsPage,
  UsersPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  SessionExpiredPage,
} from '../pages';

type PageFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  merchantPage: MerchantPage;
  merchantUsersPage: MerchantUsersPage;
  paymentsPage: PaymentsPage;
  checkoutPage: CheckoutPage;
  qrPaymentsPage: QrPaymentsPage;
  paymentLinksPage: PaymentLinksPage;
  refundsPage: RefundsPage;
  chargebacksPage: ChargebacksPage;
  subscriptionsPage: SubscriptionsPage;
  reportsPage: ReportsPage;
  auditPage: AuditPage;
  developerPortalPage: DeveloperPortalPage;
  webhooksPage: WebhooksPage;
  sandboxPage: SandboxPage;
  profilePage: ProfilePage;
  settingsPage: SettingsPage;
  usersPage: UsersPage;
  forgotPasswordPage: ForgotPasswordPage;
  resetPasswordPage: ResetPasswordPage;
  sessionExpiredPage: SessionExpiredPage;
};

type AuthFixtures = {
  adminUser: TestUser;
  merchantAdminUser: TestUser;
  operatorUser: TestUser;
  supportUser: TestUser;
  readonlyUser: TestUser;
  api: ReturnType<typeof createApiClient>;
};

export const test = base.extend<PageFixtures & AuthFixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  dashboardPage: async ({ page }, use) => use(new DashboardPage(page)),
  merchantPage: async ({ page }, use) => use(new MerchantPage(page)),
  merchantUsersPage: async ({ page }, use) => use(new MerchantUsersPage(page)),
  paymentsPage: async ({ page }, use) => use(new PaymentsPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),
  qrPaymentsPage: async ({ page }, use) => use(new QrPaymentsPage(page)),
  paymentLinksPage: async ({ page }, use) => use(new PaymentLinksPage(page)),
  refundsPage: async ({ page }, use) => use(new RefundsPage(page)),
  chargebacksPage: async ({ page }, use) => use(new ChargebacksPage(page)),
  subscriptionsPage: async ({ page }, use) => use(new SubscriptionsPage(page)),
  reportsPage: async ({ page }, use) => use(new ReportsPage(page)),
  auditPage: async ({ page }, use) => use(new AuditPage(page)),
  developerPortalPage: async ({ page }, use) => use(new DeveloperPortalPage(page)),
  webhooksPage: async ({ page }, use) => use(new WebhooksPage(page)),
  sandboxPage: async ({ page }, use) => use(new SandboxPage(page)),
  profilePage: async ({ page }, use) => use(new ProfilePage(page)),
  settingsPage: async ({ page }, use) => use(new SettingsPage(page)),
  usersPage: async ({ page }, use) => use(new UsersPage(page)),
  forgotPasswordPage: async ({ page }, use) => use(new ForgotPasswordPage(page)),
  resetPasswordPage: async ({ page }, use) => use(new ResetPasswordPage(page)),
  sessionExpiredPage: async ({ page }, use) => use(new SessionExpiredPage(page)),

  adminUser: async ({}, use) => use(USERS.admin),
  merchantAdminUser: async ({}, use) => use(USERS.merchantAdmin),
  operatorUser: async ({}, use) => use(USERS.operator),
  supportUser: async ({}, use) => use(USERS.support),
  readonlyUser: async ({}, use) => use(USERS.readonly),

  api: async ({ request }, use) => use(createApiClient(request)),
});

test.afterEach(async ({ request }) => {
  await runE2eCleanup(request);
});

export { expect };
