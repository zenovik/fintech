import express, { Application } from 'express';

import morgan from 'morgan';

import cookieParser from 'cookie-parser';

import { env } from './config';
import { healthService } from './modules/system/services/health.service';
import {
  buildCompressionMiddleware,
  buildCorsMiddleware,
  buildHelmetMiddleware,
} from './config/http-security';
import { notFoundHandler } from './shared/middleware/not-found.middleware';
import { errorHandler } from './shared/middleware/error-handler.middleware';
import { requestContextMiddleware } from './shared/middleware/request-context.middleware';
import { requestLoggingMiddleware } from './shared/middleware/request-logging.middleware';

import { authRoutes } from './modules/auth';
import { executiveDashboardRoutes } from './modules/dashboard';
import { merchantRoutes } from './modules/merchant';
import { transactionRoutes } from './modules/transactions';
import { settlementRoutes } from './modules/settlements';
import { userRoutes } from './modules/users';
import { roleRoutes } from './modules/roles';
import { permissionRoutes } from './modules/permissions';
import { reportRoutes, analyticsRoutes } from './modules/reports';
import { exportRoutes } from './modules/exports';
import { settingsRoutes } from './modules/settings';
import { notificationRoutes } from './modules/notifications';
import { auditRoutes } from './modules/audit';
import { organizationRoutes } from './modules/organizations';
import { customerRoutes } from './modules/customers';
import { refundRoutes } from './modules/refunds';
import { chargebackRoutes } from './modules/chargebacks';
import { payoutRoutes } from './modules/payouts';
import { paymentLinkRoutes, publicPaymentLinkRoutes } from './modules/payment-links';
import { invoiceRoutes } from './modules/invoices';
import { qrPaymentRoutes, publicQrPaymentRoutes } from './modules/qr-payments';
import { subscriptionRoutes } from './modules/subscriptions';
import { supportRoutes } from './modules/support';
import { merchantOnboardingRoutes } from './modules/merchant-onboarding';
import { outletRoutes } from './modules/outlets';
import { merchantUserRoutes } from './modules/merchant-users';
import { onboardingApprovalRoutes } from './modules/onboarding-approval';
import { deviceRoutes } from './modules/devices';
import { paymentConfigRoutes } from './modules/payment-config';
import { pricingRoutes } from './modules/pricing';
import { riskRuleRoutes } from './modules/risk-rules';
import { fraudRoutes } from './modules/fraud';
import { accountingRoutes } from './modules/accounting';
import { searchRoutes } from './modules/search';
import { activityRoutes } from './modules/activity';
import { paymentRoutes } from './modules/payments';
import { checkoutRoutes, publicCheckoutRoutes } from './modules/checkout';
import { smartCollectRoutes } from './modules/smart-collect';
import { acceptanceRoutes } from './modules/acceptance';
import { operationsRoutes } from './modules/operations';
import { aiRoutes } from './modules/ai';
import { systemRoutes } from './modules/system';
import { developerRoutes } from './modules/developer';
import { webhooksRoutes } from './modules/webhooks';
import { reconciliationRoutes } from './modules/reconciliation';
import { sandboxRoutes } from './modules/sandbox';

import { featureFlagGuard } from './shared/middleware/feature-flag.middleware';
import { buildGlobalRateLimitMiddleware, buildApiRateLimitMiddleware } from './shared/middleware/global-rate-limit.middleware';
import { csrfProtectionMiddleware } from './shared/middleware/csrf.middleware';
import { setupSwagger } from './swagger';



export function createApp(): Application {

  const app = express();



  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(buildHelmetMiddleware());
  app.use(buildCorsMiddleware());
  app.use(buildCompressionMiddleware());

  app.use(cookieParser());

  app.use(express.json({ limit: '10mb' }));

  app.use(express.urlencoded({ extended: true }));

  app.use(csrfProtectionMiddleware());

  app.use(requestContextMiddleware);
  app.use(requestLoggingMiddleware);

  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));



  app.get('/api/live', (_req, res) => {
    res.status(200).json(healthService.getLiveness());
  });

  app.get('/api/ready', async (_req, res) => {
    const readiness = await healthService.getReadiness();
    res.status(readiness.ready ? 200 : 503).json(readiness);
  });

  app.get('/api/health', async (_req, res) => {
    const health = await healthService.getHealth();
    res.status(health.status === 'unhealthy' ? 503 : 200).json({
      ...health,
      service: 'backend-fintech',
    });
  });



  setupSwagger(app);

  app.use('/api/v1', buildGlobalRateLimitMiddleware());
  app.use('/api/v1', buildApiRateLimitMiddleware());
  app.use('/api/v1', featureFlagGuard);

  app.use('/api/auth', authRoutes);
  app.use('/api/v1/dashboard/executive', executiveDashboardRoutes);
  app.use('/api/v1/merchants', merchantRoutes);
  app.use('/api/v1/transactions', transactionRoutes);
  app.use('/api/v1/settlements', settlementRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/roles', roleRoutes);
  app.use('/api/v1/permissions', permissionRoutes);
  app.use('/api/v1/reports', reportRoutes);
  app.use('/api/v1/analytics', analyticsRoutes);
  app.use('/api/v1/exports', exportRoutes);
  app.use('/api/v1/settings', settingsRoutes);
  app.use('/api/v1/notifications', notificationRoutes);
  app.use('/api/v1/audit', auditRoutes);
  app.use('/api/v1/organizations', organizationRoutes);
  app.use('/api/v1/customers', customerRoutes);
  app.use('/api/v1/refunds', refundRoutes);
  app.use('/api/v1/chargebacks', chargebackRoutes);
  app.use('/api/v1/payouts', payoutRoutes);
  app.use('/api/v1/payment-links', paymentLinkRoutes);
  app.use('/api/v1/public/payment-links', publicPaymentLinkRoutes);
  app.use('/api/v1/invoices', invoiceRoutes);
  app.use('/api/v1/qr-payments', qrPaymentRoutes);
  app.use('/api/v1/public/qr-payments', publicQrPaymentRoutes);
  app.use('/api/v1/subscriptions', subscriptionRoutes);
  app.use('/api/v1/support', supportRoutes);
  app.use('/api/v1/merchant-onboarding', merchantOnboardingRoutes);
  app.use('/api/v1/outlets', outletRoutes);
  app.use('/api/v1/merchant-users', merchantUserRoutes);
  app.use('/api/v1/onboarding-approval', onboardingApprovalRoutes);
  app.use('/api/v1/devices', deviceRoutes);
  app.use('/api/v1/payment-config', paymentConfigRoutes);
  app.use('/api/v1/pricing', pricingRoutes);
  app.use('/api/v1/risk-rules', riskRuleRoutes);
  app.use('/api/v1/fraud', fraudRoutes);
  app.use('/api/v1/accounting', accountingRoutes);
  app.use('/api/v1/search', searchRoutes);
  app.use('/api/v1/activity', activityRoutes);
  app.use('/api/v1/payments', paymentRoutes);
  app.use('/api/v1/checkout', checkoutRoutes);
  app.use('/api/v1/public/checkout', publicCheckoutRoutes);
  app.use('/api/v1/smart-collect', smartCollectRoutes);
  app.use('/api/v1/acceptance', acceptanceRoutes);
  app.use('/api/v1/operations', operationsRoutes);
  app.use('/api/v1/ai', aiRoutes);
  app.use('/api/v1/system', systemRoutes);
  app.use('/api/v1/developer', developerRoutes);
  app.use('/api/v1/webhooks', webhooksRoutes);
  app.use('/api/v1/reconciliation', reconciliationRoutes);
  app.use('/api/v1/sandbox', sandboxRoutes);



  app.use(notFoundHandler);

  app.use(errorHandler);



  return app;

}


