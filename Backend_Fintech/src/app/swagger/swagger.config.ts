import swaggerJsdoc from 'swagger-jsdoc';
import { env } from '../config';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Merchant Management Portal API',
      version: '1.0.0',
      description: 'Enterprise FinTech Merchant Management Portal — Backend API',
    },
    servers: [{ url: `http://localhost:${env.port}/api`, description: 'Development' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
            rememberDevice: { type: 'boolean', default: false },
            deviceFingerprint: { type: 'string' },
          },
        },
        ApiSuccess: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
        ApiError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            code: { type: 'string' },
            errors: { type: 'object' },
          },
        },
      },
    },
    paths: {
      '/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: 'Login with email and password',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
          },
          responses: {
            '200': { description: 'Login successful', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } },
            '202': { description: 'MFA required' },
            '401': { description: 'Invalid credentials' },
            '423': { description: 'Account locked' },
          },
        },
      },
      '/auth/logout': {
        post: {
          tags: ['Authentication'],
          summary: 'Logout current session',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Logged out' } },
        },
      },
      '/auth/forgot-password': {
        post: {
          tags: ['Authentication'],
          summary: 'Request password reset email',
          responses: { '200': { description: 'Request accepted' } },
        },
      },
      '/auth/reset-password': {
        post: {
          tags: ['Authentication'],
          summary: 'Reset password with token',
          responses: { '200': { description: 'Password reset' }, '410': { description: 'Token expired' } },
        },
      },
      '/auth/refresh-token': {
        post: {
          tags: ['Authentication'],
          summary: 'Refresh access token',
          responses: { '200': { description: 'Token refreshed' }, '401': { description: 'Invalid refresh token' } },
        },
      },
      '/auth/verify-otp': {
        post: {
          tags: ['Authentication'],
          summary: 'Verify MFA OTP or TOTP',
          responses: { '200': { description: 'Verified' } },
        },
      },
      '/auth/resend-otp': {
        post: {
          tags: ['Authentication'],
          summary: 'Resend OTP code',
          responses: { '200': { description: 'OTP resent' }, '429': { description: 'Cooldown active' } },
        },
      },
      '/auth/me': {
        get: {
          tags: ['Authentication'],
          summary: 'Get current user profile',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'User profile' } },
        },
      },
      '/auth/sessions': {
        get: {
          tags: ['Authentication'],
          summary: 'List active sessions',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Session list' } },
        },
      },
      '/auth/session/{id}': {
        delete: {
          tags: ['Authentication'],
          summary: 'Revoke a session',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Session revoked' }, '403': { description: 'Cannot revoke current session' } },
        },
      },
      '/auth/sessions/others': {
        delete: {
          tags: ['Authentication'],
          summary: 'Revoke all other sessions',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Other sessions revoked' } },
        },
      },
      '/auth/change-password': {
        post: {
          tags: ['Authentication'],
          summary: 'Change password for authenticated user',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Password changed' } },
        },
      },
      '/auth/mfa-preferences': {
        put: {
          tags: ['Authentication'],
          summary: 'Update MFA preferences',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'MFA preferences updated' } },
        },
      },
      '/auth/session-settings': {
        get: {
          tags: ['Authentication'],
          summary: 'Get session timeout settings',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Session settings' } },
        },
      },
      '/v1/settings/overview': {
        get: {
          tags: ['Settings'],
          summary: 'Settings overview',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Overview' } },
        },
      },
      '/v1/settings/organization': {
        get: { tags: ['Settings'], summary: 'Get organization settings', security: [{ bearerAuth: [] }] },
        put: { tags: ['Settings'], summary: 'Update organization settings', security: [{ bearerAuth: [] }] },
      },
      '/v1/settings/branding': {
        get: { tags: ['Settings'], summary: 'Get branding settings', security: [{ bearerAuth: [] }] },
        put: { tags: ['Settings'], summary: 'Update branding settings', security: [{ bearerAuth: [] }] },
      },
      '/v1/settings/public/branding': {
        get: { tags: ['Settings'], summary: 'Public branding (no auth)' },
      },
      '/v1/settings/feature-flags': {
        get: { tags: ['Settings'], summary: 'List feature flags', security: [{ bearerAuth: [] }] },
        post: { tags: ['Settings'], summary: 'Create feature flag', security: [{ bearerAuth: [] }] },
      },
      '/v1/settings/notifications/me': {
        get: { tags: ['Settings'], summary: 'User notification preferences', security: [{ bearerAuth: [] }] },
        put: { tags: ['Settings'], summary: 'Update user notification preferences', security: [{ bearerAuth: [] }] },
      },
      '/v1/notifications': {
        get: { tags: ['Notifications'], summary: 'List user notifications', security: [{ bearerAuth: [] }] },
      },
      '/v1/notifications/unread-count': {
        get: { tags: ['Notifications'], summary: 'Get unread notification count', security: [{ bearerAuth: [] }] },
      },
      '/v1/notifications/read-all': {
        patch: { tags: ['Notifications'], summary: 'Mark all notifications as read', security: [{ bearerAuth: [] }] },
      },
      '/v1/notifications/{id}': {
        get: { tags: ['Notifications'], summary: 'Get notification details', security: [{ bearerAuth: [] }] },
        delete: { tags: ['Notifications'], summary: 'Delete notification', security: [{ bearerAuth: [] }] },
      },
      '/v1/notifications/{id}/read': {
        patch: { tags: ['Notifications'], summary: 'Mark notification as read', security: [{ bearerAuth: [] }] },
      },
      '/v1/notifications/{id}/archive': {
        patch: { tags: ['Notifications'], summary: 'Archive notification', security: [{ bearerAuth: [] }] },
      },
      '/v1/notifications/templates': {
        get: { tags: ['Notifications'], summary: 'List notification templates', security: [{ bearerAuth: [] }] },
        post: { tags: ['Notifications'], summary: 'Create notification template', security: [{ bearerAuth: [] }] },
      },
      '/v1/notifications/broadcasts': {
        get: { tags: ['Notifications'], summary: 'List broadcasts', security: [{ bearerAuth: [] }] },
        post: { tags: ['Notifications'], summary: 'Send broadcast', security: [{ bearerAuth: [] }] },
      },
      '/v1/audit': {
        get: { tags: ['Audit'], summary: 'List audit logs', security: [{ bearerAuth: [] }] },
      },
      '/v1/audit/export': {
        get: { tags: ['Audit'], summary: 'Export audit logs to CSV', security: [{ bearerAuth: [] }] },
      },
      '/v1/audit/categories': {
        get: { tags: ['Audit'], summary: 'List audit categories', security: [{ bearerAuth: [] }] },
      },
      '/v1/audit/actions': {
        get: { tags: ['Audit'], summary: 'List audit actions', security: [{ bearerAuth: [] }] },
      },
      '/v1/audit/api-logs': {
        get: { tags: ['Audit'], summary: 'List API logs', security: [{ bearerAuth: [] }] },
      },
      '/v1/audit/webhook-logs': {
        get: { tags: ['Audit'], summary: 'List webhook logs', security: [{ bearerAuth: [] }] },
      },
      '/v1/audit/{id}': {
        get: { tags: ['Audit'], summary: 'Get audit log details', security: [{ bearerAuth: [] }] },
      },
      '/v1/organizations': {
        get: { tags: ['Organizations'], summary: 'List organizations', security: [{ bearerAuth: [] }] },
        post: { tags: ['Organizations'], summary: 'Create organization', security: [{ bearerAuth: [] }] },
      },
      '/v1/organizations/mine': {
        get: { tags: ['Organizations'], summary: 'List my organization memberships', security: [{ bearerAuth: [] }] },
      },
      '/v1/organizations/{id}': {
        get: { tags: ['Organizations'], summary: 'Get organization details', security: [{ bearerAuth: [] }] },
        put: { tags: ['Organizations'], summary: 'Update organization', security: [{ bearerAuth: [] }] },
      },
      '/v1/organizations/{id}/members': {
        get: { tags: ['Organizations'], summary: 'List organization members', security: [{ bearerAuth: [] }] },
        post: { tags: ['Organizations'], summary: 'Add organization member', security: [{ bearerAuth: [] }] },
      },
      '/v1/organizations/{id}/domains': {
        get: { tags: ['Organizations'], summary: 'List organization domains', security: [{ bearerAuth: [] }] },
        post: { tags: ['Organizations'], summary: 'Add organization domain', security: [{ bearerAuth: [] }] },
      },
      '/v1/organizations/{id}/branding': {
        get: { tags: ['Organizations'], summary: 'Get organization branding', security: [{ bearerAuth: [] }] },
        put: { tags: ['Organizations'], summary: 'Update organization branding', security: [{ bearerAuth: [] }] },
      },
      '/v1/organizations/{id}/api-keys': {
        get: { tags: ['Organizations'], summary: 'List organization API keys', security: [{ bearerAuth: [] }] },
        post: { tags: ['Organizations'], summary: 'Create organization API key', security: [{ bearerAuth: [] }] },
      },
      '/v1/organizations/{id}/billing': {
        get: { tags: ['Organizations'], summary: 'Get organization billing', security: [{ bearerAuth: [] }] },
        put: { tags: ['Organizations'], summary: 'Update organization billing', security: [{ bearerAuth: [] }] },
      },
      '/v1/customers': {
        get: { tags: ['Customers'], summary: 'List customers', security: [{ bearerAuth: [] }] },
        post: { tags: ['Customers'], summary: 'Create customer', security: [{ bearerAuth: [] }] },
      },
      '/v1/customers/statistics': {
        get: { tags: ['Customers'], summary: 'Customer statistics', security: [{ bearerAuth: [] }] },
      },
      '/v1/customers/{id}': {
        get: { tags: ['Customers'], summary: 'Get customer details', security: [{ bearerAuth: [] }] },
        put: { tags: ['Customers'], summary: 'Update customer', security: [{ bearerAuth: [] }] },
        delete: { tags: ['Customers'], summary: 'Delete customer', security: [{ bearerAuth: [] }] },
      },
      '/v1/customers/{id}/transactions': {
        get: { tags: ['Customers'], summary: 'List customer transactions', security: [{ bearerAuth: [] }] },
      },
      '/v1/customers/{id}/merchants': {
        get: { tags: ['Customers'], summary: 'List customer merchants', security: [{ bearerAuth: [] }] },
      },
      '/v1/refunds': {
        get: { tags: ['Refunds'], summary: 'List refunds (queue)', security: [{ bearerAuth: [] }] },
        post: { tags: ['Refunds'], summary: 'Submit refund request', security: [{ bearerAuth: [] }] },
      },
      '/v1/refunds/statistics': {
        get: { tags: ['Refunds'], summary: 'Refund statistics', security: [{ bearerAuth: [] }] },
      },
      '/v1/refunds/{id}': {
        get: { tags: ['Refunds'], summary: 'Get refund details', security: [{ bearerAuth: [] }] },
      },
      '/v1/refunds/{id}/approve': {
        post: { tags: ['Refunds'], summary: 'Approve refund', security: [{ bearerAuth: [] }] },
      },
      '/v1/refunds/{id}/reject': {
        post: { tags: ['Refunds'], summary: 'Reject refund', security: [{ bearerAuth: [] }] },
      },
      '/v1/refunds/{id}/history': {
        get: { tags: ['Refunds'], summary: 'Refund status history', security: [{ bearerAuth: [] }] },
      },
      '/v1/chargebacks': {
        get: { tags: ['Chargebacks'], summary: 'List chargebacks (queue)', security: [{ bearerAuth: [] }] },
        post: { tags: ['Chargebacks'], summary: 'Open chargeback', security: [{ bearerAuth: [] }] },
      },
      '/v1/chargebacks/statistics': {
        get: { tags: ['Chargebacks'], summary: 'Chargeback statistics', security: [{ bearerAuth: [] }] },
      },
      '/v1/chargebacks/{id}': {
        get: { tags: ['Chargebacks'], summary: 'Get chargeback details', security: [{ bearerAuth: [] }] },
      },
      '/v1/chargebacks/{id}/evidence': {
        get: { tags: ['Chargebacks'], summary: 'List chargeback evidence', security: [{ bearerAuth: [] }] },
        post: { tags: ['Chargebacks'], summary: 'Add chargeback evidence', security: [{ bearerAuth: [] }] },
      },
      '/v1/chargebacks/{id}/representment': {
        post: { tags: ['Chargebacks'], summary: 'Submit representment', security: [{ bearerAuth: [] }] },
      },
      '/v1/chargebacks/{id}/resolve': {
        post: { tags: ['Chargebacks'], summary: 'Resolve chargeback (won/lost)', security: [{ bearerAuth: [] }] },
      },
      '/v1/chargebacks/{id}/history': {
        get: { tags: ['Chargebacks'], summary: 'Chargeback status timeline', security: [{ bearerAuth: [] }] },
      },
      '/v1/analytics/chargebacks': {
        get: { tags: ['Analytics'], summary: 'Chargeback analytics', security: [{ bearerAuth: [] }] },
      },
      '/v1/payouts': {
        get: { tags: ['Payouts'], summary: 'List payouts (queue)', security: [{ bearerAuth: [] }] },
        post: { tags: ['Payouts'], summary: 'Create manual/scheduled payout', security: [{ bearerAuth: [] }] },
      },
      '/v1/payouts/statistics': {
        get: { tags: ['Payouts'], summary: 'Payout statistics', security: [{ bearerAuth: [] }] },
      },
      '/v1/payouts/bank-accounts': {
        get: { tags: ['Payouts'], summary: 'List merchant bank accounts', security: [{ bearerAuth: [] }] },
        post: { tags: ['Payouts'], summary: 'Add bank account', security: [{ bearerAuth: [] }] },
      },
      '/v1/payouts/bank-accounts/{id}': {
        patch: { tags: ['Payouts'], summary: 'Update bank account', security: [{ bearerAuth: [] }] },
      },
      '/v1/payouts/{id}': {
        get: { tags: ['Payouts'], summary: 'Get payout details', security: [{ bearerAuth: [] }] },
      },
      '/v1/payouts/{id}/approve': {
        post: { tags: ['Payouts'], summary: 'Approve payout', security: [{ bearerAuth: [] }] },
      },
      '/v1/payouts/{id}/reject': {
        post: { tags: ['Payouts'], summary: 'Reject payout', security: [{ bearerAuth: [] }] },
      },
      '/v1/payouts/{id}/retry': {
        post: { tags: ['Payouts'], summary: 'Retry failed payout', security: [{ bearerAuth: [] }] },
      },
      '/v1/payouts/{id}/history': {
        get: { tags: ['Payouts'], summary: 'Payout status timeline', security: [{ bearerAuth: [] }] },
      },
      '/v1/analytics/payouts': {
        get: { tags: ['Analytics'], summary: 'Payout analytics', security: [{ bearerAuth: [] }] },
      },
      '/v1/merchant-onboarding/statistics': {
        get: { tags: ['Merchant Onboarding'], summary: 'Onboarding dashboard counters', security: [{ bearerAuth: [] }] },
      },
      '/v1/merchant-onboarding': {
        get: { tags: ['Merchant Onboarding'], summary: 'List onboarding applications', security: [{ bearerAuth: [] }] },
        post: { tags: ['Merchant Onboarding'], summary: 'Create draft onboarding application', security: [{ bearerAuth: [] }] },
      },
      '/v1/merchant-onboarding/{id}': {
        get: { tags: ['Merchant Onboarding'], summary: 'Get onboarding application detail', security: [{ bearerAuth: [] }] },
      },
      '/v1/merchant-onboarding/{id}/business': {
        put: { tags: ['Merchant Onboarding'], summary: 'Save business information step', security: [{ bearerAuth: [] }] },
      },
      '/v1/merchant-onboarding/{id}/addresses': {
        put: { tags: ['Merchant Onboarding'], summary: 'Save address step', security: [{ bearerAuth: [] }] },
      },
      '/v1/merchant-onboarding/{id}/kyc': {
        put: { tags: ['Merchant Onboarding'], summary: 'Save KYC documents metadata', security: [{ bearerAuth: [] }] },
      },
      '/v1/merchant-onboarding/{id}/bank': {
        put: { tags: ['Merchant Onboarding'], summary: 'Save bank details step', security: [{ bearerAuth: [] }] },
      },
      '/v1/merchant-onboarding/{id}/settlement': {
        put: { tags: ['Merchant Onboarding'], summary: 'Save settlement configuration', security: [{ bearerAuth: [] }] },
      },
      '/v1/merchant-onboarding/{id}/payment': {
        put: { tags: ['Merchant Onboarding'], summary: 'Save payment configuration', security: [{ bearerAuth: [] }] },
      },
      '/v1/merchant-onboarding/{id}/submit': {
        post: { tags: ['Merchant Onboarding'], summary: 'Submit onboarding application', security: [{ bearerAuth: [] }] },
      },
      '/v1/merchant-onboarding/{id}/approve': {
        post: { tags: ['Merchant Onboarding'], summary: 'Approve onboarding application', security: [{ bearerAuth: [] }] },
      },
      '/v1/merchant-onboarding/{id}/reject': {
        post: { tags: ['Merchant Onboarding'], summary: 'Reject onboarding application', security: [{ bearerAuth: [] }] },
      },
      '/v1/merchant-onboarding/{id}/go-live': {
        post: { tags: ['Merchant Onboarding'], summary: 'Activate merchant (go live)', security: [{ bearerAuth: [] }] },
      },
      '/v1/merchant-onboarding/{id}/timeline': {
        get: { tags: ['Merchant Onboarding'], summary: 'Get onboarding timeline events', security: [{ bearerAuth: [] }] },
      },
      '/v1/onboarding-approval/stages': {
        get: { tags: ['Onboarding Approval'], summary: 'List workflow stage definitions', security: [{ bearerAuth: [] }] },
      },
      '/v1/onboarding-approval/dashboard-stats': {
        get: { tags: ['Onboarding Approval'], summary: 'Approval dashboard statistics', security: [{ bearerAuth: [] }] },
      },
      '/v1/onboarding-approval/compliance-queue': {
        get: { tags: ['Onboarding Approval'], summary: 'Compliance work queue', security: [{ bearerAuth: [] }] },
      },
      '/v1/onboarding-approval/compliance-queue/bulk-assign': {
        post: { tags: ['Onboarding Approval'], summary: 'Bulk assign queue items', security: [{ bearerAuth: [] }] },
      },
      '/v1/onboarding-approval/{applicationId}/workflow': {
        get: { tags: ['Onboarding Approval'], summary: 'Get workflow instance and history', security: [{ bearerAuth: [] }] },
      },
      '/v1/onboarding-approval/{applicationId}/approve': {
        post: { tags: ['Onboarding Approval'], summary: 'Approve current workflow stage', security: [{ bearerAuth: [] }] },
      },
      '/v1/onboarding-approval/{applicationId}/reject': {
        post: { tags: ['Onboarding Approval'], summary: 'Reject application', security: [{ bearerAuth: [] }] },
      },
      '/v1/onboarding-approval/{applicationId}/send-back': {
        post: { tags: ['Onboarding Approval'], summary: 'Send application back', security: [{ bearerAuth: [] }] },
      },
      '/v1/onboarding-approval/{applicationId}/go-live': {
        post: { tags: ['Onboarding Approval'], summary: 'Execute go live promotion', security: [{ bearerAuth: [] }] },
      },
      '/v1/onboarding-approval/{applicationId}/risk': {
        get: { tags: ['Onboarding Approval'], summary: 'Get risk review', security: [{ bearerAuth: [] }] },
        put: { tags: ['Onboarding Approval'], summary: 'Save risk review', security: [{ bearerAuth: [] }] },
      },
      '/v1/onboarding-approval/{applicationId}/kyc': {
        get: { tags: ['Onboarding Approval'], summary: 'List KYC documents for review', security: [{ bearerAuth: [] }] },
      },
      '/v1/onboarding-approval/{applicationId}/kyc/{documentId}/decision': {
        post: { tags: ['Onboarding Approval'], summary: 'KYC document verification decision', security: [{ bearerAuth: [] }] },
      },
      '/v1/dashboard/executive/onboarding-stats': {
        get: { tags: ['Dashboard'], summary: 'Onboarding approval dashboard widgets', security: [{ bearerAuth: [] }] },
      },
      '/v1/dashboard/executive/payment-platform-stats': {
        get: { tags: ['Dashboard'], summary: 'Payment platform dashboard widgets (devices, QR, settlements, fraud, risk)', security: [{ bearerAuth: [] }] },
      },
      '/v1/devices': {
        get: { tags: ['Devices'], summary: 'List payment devices', security: [{ bearerAuth: [] }] },
        post: { tags: ['Devices'], summary: 'Provision device', security: [{ bearerAuth: [] }] },
      },
      '/v1/devices/inventory': {
        get: { tags: ['Devices'], summary: 'Terminal inventory list', security: [{ bearerAuth: [] }] },
      },
      '/v1/devices/{id}/activate': { post: { tags: ['Devices'], summary: 'Activate device', security: [{ bearerAuth: [] }] } },
      '/v1/devices/{id}/sync': { post: { tags: ['Devices'], summary: 'Sync device health', security: [{ bearerAuth: [] }] } },
      '/v1/payment-config/merchants/{merchantId}': {
        get: { tags: ['Payment Config'], summary: 'Get merchant payment method config', security: [{ bearerAuth: [] }] },
        put: { tags: ['Payment Config'], summary: 'Update payment method config', security: [{ bearerAuth: [] }] },
      },
      '/v1/payment-config/limits': {
        get: { tags: ['Payment Config'], summary: 'List transaction limits', security: [{ bearerAuth: [] }] },
        post: { tags: ['Payment Config'], summary: 'Create/update transaction limit', security: [{ bearerAuth: [] }] },
      },
      '/v1/pricing': {
        get: { tags: ['Pricing'], summary: 'List pricing plans', security: [{ bearerAuth: [] }] },
        post: { tags: ['Pricing'], summary: 'Create pricing plan', security: [{ bearerAuth: [] }] },
      },
      '/v1/risk-rules': {
        get: { tags: ['Risk Rules'], summary: 'List risk rules', security: [{ bearerAuth: [] }] },
        post: { tags: ['Risk Rules'], summary: 'Create risk rule', security: [{ bearerAuth: [] }] },
      },
      '/v1/risk-rules/{id}/evaluate': { post: { tags: ['Risk Rules'], summary: 'Evaluate risk rule', security: [{ bearerAuth: [] }] } },
      '/v1/fraud': { get: { tags: ['Fraud'], summary: 'Fraud case queue', security: [{ bearerAuth: [] }] } },
      '/v1/fraud/{id}/approve': { post: { tags: ['Fraud'], summary: 'Approve fraud case', security: [{ bearerAuth: [] }] } },
      '/v1/fraud/{id}/reject': { post: { tags: ['Fraud'], summary: 'Reject fraud case', security: [{ bearerAuth: [] }] } },
      '/v1/fraud/{id}/release': { post: { tags: ['Fraud'], summary: 'Release fraud hold', security: [{ bearerAuth: [] }] } },
      '/v1/accounting/accounts': { get: { tags: ['Accounting'], summary: 'List ledger accounts', security: [{ bearerAuth: [] }] } },
      '/v1/accounting/entries': { get: { tags: ['Accounting'], summary: 'List ledger entries', security: [{ bearerAuth: [] }] } },
      '/v1/accounting/summary': { get: { tags: ['Accounting'], summary: 'Ledger summary', security: [{ bearerAuth: [] }] } },
      '/v1/accounting/export': { get: { tags: ['Accounting'], summary: 'Export ledger data', security: [{ bearerAuth: [] }] } },
      '/v1/settlements/calendar': { get: { tags: ['Settlements'], summary: 'Settlement calendar with holidays', security: [{ bearerAuth: [] }] } },
      '/v1/settlements/reserves': { get: { tags: ['Settlements'], summary: 'List settlement reserves', security: [{ bearerAuth: [] }] } },
      '/v1/settlements/{id}/hold': { post: { tags: ['Settlements'], summary: 'Hold settlement', security: [{ bearerAuth: [] }] } },
      '/v1/settlements/{id}/release': { post: { tags: ['Settlements'], summary: 'Release settlement hold', security: [{ bearerAuth: [] }] } },
      '/v1/settlements/{id}/retry': { post: { tags: ['Settlements'], summary: 'Retry failed settlement', security: [{ bearerAuth: [] }] } },
      '/v1/reports/center/catalog': { get: { tags: ['Reports'], summary: 'Report center catalog', security: [{ bearerAuth: [] }] } },
      '/v1/reports/center/saved-filters': {
        get: { tags: ['Reports'], summary: 'List saved report filters', security: [{ bearerAuth: [] }] },
        post: { tags: ['Reports'], summary: 'Save report filter', security: [{ bearerAuth: [] }] },
      },
      '/v1/reports/center/generate': { post: { tags: ['Reports'], summary: 'Generate report preview', security: [{ bearerAuth: [] }] } },
      '/v1/reports/center/export': { post: { tags: ['Reports'], summary: 'Export report (CSV/XLSX/PDF)', security: [{ bearerAuth: [] }] } },
      '/v1/reports/center/export-history': { get: { tags: ['Reports'], summary: 'Report export download history', security: [{ bearerAuth: [] }] } },
      '/v1/search': { get: { tags: ['Search'], summary: 'Global fuzzy search', security: [{ bearerAuth: [] }] } },
      '/v1/activity/timeline': { get: { tags: ['Activity'], summary: 'Unified activity timeline', security: [{ bearerAuth: [] }] } },
      '/v1/operations/pending-tasks': { get: { tags: ['Operations'], summary: 'Pending operations tasks summary', security: [{ bearerAuth: [] }] } },
      '/v1/settings/configuration': {
        get: { tags: ['Settings'], summary: 'List platform configuration', security: [{ bearerAuth: [] }] },
        put: { tags: ['Settings'], summary: 'Update platform configuration', security: [{ bearerAuth: [] }] },
      },
      '/v1/dashboard/executive/operations-stats': { get: { tags: ['Dashboard'], summary: 'Executive dashboard pending work KPIs', security: [{ bearerAuth: [] }] } },
      '/v1/system/admin/status': { get: { tags: ['System'], summary: 'Admin system health (API, DB, queues, jobs, memory)', security: [{ bearerAuth: [] }] } },
      '/v1/payments': {
        get: { tags: ['Payments'], summary: 'Search/list payment intents', security: [{ bearerAuth: [] }] },
        post: { tags: ['Payments'], summary: 'Create payment (order + intent + optional session)', security: [{ bearerAuth: [] }] },
      },
      '/v1/payments/{id}': { get: { tags: ['Payments'], summary: 'Get payment status', security: [{ bearerAuth: [] }] } },
      '/v1/payments/{id}/timeline': { get: { tags: ['Payments'], summary: 'Payment lifecycle timeline', security: [{ bearerAuth: [] }] } },
      '/v1/payments/{id}/authorize': { post: { tags: ['Payments'], summary: 'Authorize payment', security: [{ bearerAuth: [] }] } },
      '/v1/payments/{id}/capture': { post: { tags: ['Payments'], summary: 'Capture payment (full or partial)', security: [{ bearerAuth: [] }] } },
      '/v1/payments/{id}/cancel': { post: { tags: ['Payments'], summary: 'Cancel/void payment', security: [{ bearerAuth: [] }] } },
      '/v1/payments/{id}/refund': { post: { tags: ['Payments'], summary: 'Refund captured payment', security: [{ bearerAuth: [] }] } },
      '/v1/payments/{id}/retry': { post: { tags: ['Payments'], summary: 'Retry failed payment', security: [{ bearerAuth: [] }] } },
      '/v1/payments/{id}/expire': { post: { tags: ['Payments'], summary: 'Expire payment intent', security: [{ bearerAuth: [] }] } },
      '/v1/payments/sessions': { post: { tags: ['Payments'], summary: 'Create payment session', security: [{ bearerAuth: [] }] } },
      '/v1/payments/sessions/{id}': { get: { tags: ['Payments'], summary: 'Get payment session', security: [{ bearerAuth: [] }] } },
      '/v1/payments/orders': { get: { tags: ['Payments'], summary: 'List payment orders', security: [{ bearerAuth: [] }] } },
      '/v1/payments/orders/{id}': { get: { tags: ['Payments'], summary: 'Get payment order', security: [{ bearerAuth: [] }] } },
      '/v1/payments/merchant-config/{merchantId}': { get: { tags: ['Payments'], summary: 'Merchant gateway configuration', security: [{ bearerAuth: [] }] } },
      '/v1/payments/customers/{customerId}/profile': { get: { tags: ['Payments'], summary: 'Customer saved payment methods', security: [{ bearerAuth: [] }] } },
      '/v1/payments/webhooks/deliveries': { get: { tags: ['Payments'], summary: 'Webhook delivery history', security: [{ bearerAuth: [] }] } },
      '/v1/checkout/sessions': {
        get: { tags: ['Checkout'], summary: 'List checkout sessions', security: [{ bearerAuth: [] }] },
        post: { tags: ['Checkout'], summary: 'Create hosted checkout session', security: [{ bearerAuth: [] }] },
      },
      '/v1/checkout/sessions/{id}': { get: { tags: ['Checkout'], summary: 'Get checkout session detail', security: [{ bearerAuth: [] }] } },
      '/v1/checkout/analytics': { get: { tags: ['Checkout'], summary: 'Checkout analytics dashboard', security: [{ bearerAuth: [] }] } },
      '/v1/checkout/themes': { get: { tags: ['Checkout'], summary: 'List checkout themes', security: [{ bearerAuth: [] }] } },
      '/v1/checkout/branding/{merchantId}': {
        get: { tags: ['Checkout'], summary: 'Get merchant checkout branding', security: [{ bearerAuth: [] }] },
        put: { tags: ['Checkout'], summary: 'Update merchant checkout branding', security: [{ bearerAuth: [] }] },
      },
      '/v1/public/checkout/{ref}': { get: { tags: ['Checkout Public'], summary: 'Load hosted checkout (client secret required)' } },
      '/v1/public/checkout/{ref}/pay': { post: { tags: ['Checkout Public'], summary: 'Process checkout payment' } },
      '/v1/public/checkout/{ref}/retry': { post: { tags: ['Checkout Public'], summary: 'Retry failed checkout payment' } },
      '/v1/public/checkout/{ref}/cancel': { post: { tags: ['Checkout Public'], summary: 'Cancel checkout session' } },
      '/v1/public/checkout/recover/{token}': { get: { tags: ['Checkout Public'], summary: 'Recover abandoned checkout session' } },
      '/v1/smart-collect/dashboard': { get: { tags: ['Smart Collect'], summary: 'Smart collect dashboard', security: [{ bearerAuth: [] }] } },
      '/v1/smart-collect/virtual-accounts': { get: { tags: ['Smart Collect'], summary: 'List virtual accounts', security: [{ bearerAuth: [] }] }, post: { tags: ['Smart Collect'], summary: 'Create virtual account', security: [{ bearerAuth: [] }] } },
      '/v1/smart-collect/virtual-accounts/{id}': { get: { tags: ['Smart Collect'], summary: 'Get virtual account', security: [{ bearerAuth: [] }] } },
      '/v1/smart-collect/collections': { get: { tags: ['Smart Collect'], summary: 'List collections', security: [{ bearerAuth: [] }] } },
      '/v1/smart-collect/collections/{id}': { get: { tags: ['Smart Collect'], summary: 'Get collection detail', security: [{ bearerAuth: [] }] } },
      '/v1/smart-collect/collections/{id}/match': { post: { tags: ['Smart Collect'], summary: 'Match collection', security: [{ bearerAuth: [] }] } },
      '/v1/acceptance/analytics': { get: { tags: ['Acceptance'], summary: 'Payment acceptance analytics', security: [{ bearerAuth: [] }] } },
      '/v1/acceptance/top-merchants': { get: { tags: ['Acceptance'], summary: 'Top merchants by acceptance volume', security: [{ bearerAuth: [] }] } },
      '/v1/acceptance/failure-insights': { get: { tags: ['Acceptance'], summary: 'Payment failure insights', security: [{ bearerAuth: [] }] } },
      '/v1/acceptance/merchant-portal/{merchantId}': { get: { tags: ['Acceptance'], summary: 'Merchant payment portal dashboard', security: [{ bearerAuth: [] }] } },
      '/v1/qr-payments/bulk': { post: { tags: ['QR Payments'], summary: 'Bulk generate QR codes', security: [{ bearerAuth: [] }] } },
      '/v1/qr-payments/templates': { get: { tags: ['QR Payments'], summary: 'List QR templates', security: [{ bearerAuth: [] }] } },
      '/v1/qr-payments/{id}/scan-history': { get: { tags: ['QR Payments'], summary: 'QR scan history', security: [{ bearerAuth: [] }] } },
      '/v1/qr-payments/{id}/clone': { post: { tags: ['QR Payments'], summary: 'Clone QR code', security: [{ bearerAuth: [] }] } },
      '/v1/payment-links/{id}/clone': { post: { tags: ['Payment Links'], summary: 'Clone payment link', security: [{ bearerAuth: [] }] } },
      '/v1/payment-links/{id}/analytics': { get: { tags: ['Payment Links'], summary: 'Payment link analytics', security: [{ bearerAuth: [] }] } },
      '/v1/customers/{id}/preferences': { get: { tags: ['Customers'], summary: 'Customer preferences', security: [{ bearerAuth: [] }] }, put: { tags: ['Customers'], summary: 'Update customer preferences', security: [{ bearerAuth: [] }] } },
      '/v1/customers/{id}/payment-methods': { get: { tags: ['Customers'], summary: 'Customer saved payment methods', security: [{ bearerAuth: [] }] } },
      '/v1/customers/{id}/timeline': { get: { tags: ['Customers'], summary: 'Customer payment timeline', security: [{ bearerAuth: [] }] } },
      '/v1/developer/dashboard': { get: { tags: ['Developer'], summary: 'Developer portal dashboard', security: [{ bearerAuth: [] }] } },
      '/v1/developer/profiles': { get: { tags: ['Developer'], summary: 'List developer profiles', security: [{ bearerAuth: [] }] }, post: { tags: ['Developer'], summary: 'Create developer profile', security: [{ bearerAuth: [] }] } },
      '/v1/developer/oauth-apps': { get: { tags: ['Developer'], summary: 'List OAuth applications', security: [{ bearerAuth: [] }] }, post: { tags: ['Developer'], summary: 'Create OAuth application', security: [{ bearerAuth: [] }] } },
      '/v1/developer/api-usage': { get: { tags: ['Developer'], summary: 'List API usage logs', security: [{ bearerAuth: [] }] } },
      '/v1/webhooks/dashboard': { get: { tags: ['Webhooks'], summary: 'Webhook platform dashboard', security: [{ bearerAuth: [] }] } },
      '/v1/webhooks/endpoints': { get: { tags: ['Webhooks'], summary: 'List webhook endpoints', security: [{ bearerAuth: [] }] }, post: { tags: ['Webhooks'], summary: 'Create webhook endpoint', security: [{ bearerAuth: [] }] } },
      '/v1/webhooks/deliveries': { get: { tags: ['Webhooks'], summary: 'List webhook deliveries', security: [{ bearerAuth: [] }] } },
      '/v1/reconciliation/dashboard': { get: { tags: ['Reconciliation'], summary: 'Reconciliation dashboard', security: [{ bearerAuth: [] }] } },
      '/v1/reconciliation/imports': { get: { tags: ['Reconciliation'], summary: 'List reconciliation imports', security: [{ bearerAuth: [] }] }, post: { tags: ['Reconciliation'], summary: 'Create reconciliation import', security: [{ bearerAuth: [] }] } },
      '/v1/reconciliation/records': { get: { tags: ['Reconciliation'], summary: 'List reconciliation records', security: [{ bearerAuth: [] }] } },
      '/v1/sandbox/dashboard': { get: { tags: ['Sandbox'], summary: 'Sandbox dashboard', security: [{ bearerAuth: [] }] } },
      '/v1/sandbox/accounts': { get: { tags: ['Sandbox'], summary: 'List sandbox accounts', security: [{ bearerAuth: [] }] }, post: { tags: ['Sandbox'], summary: 'Create sandbox account', security: [{ bearerAuth: [] }] } },
      '/v1/sandbox/test-cards': { get: { tags: ['Sandbox'], summary: 'List sandbox test cards', security: [{ bearerAuth: [] }] } },
      '/v1/subscriptions/analytics': { get: { tags: ['Subscriptions'], summary: 'Subscription analytics', security: [{ bearerAuth: [] }] } },
      '/v1/subscriptions/dunning': { get: { tags: ['Subscriptions'], summary: 'List dunning events', security: [{ bearerAuth: [] }] } },
      '/v1/invoices/templates': { get: { tags: ['Invoices'], summary: 'List invoice templates', security: [{ bearerAuth: [] }] }, post: { tags: ['Invoices'], summary: 'Create invoice template', security: [{ bearerAuth: [] }] } },
      '/v1/invoices/analytics': { get: { tags: ['Invoices'], summary: 'Invoice analytics', security: [{ bearerAuth: [] }] } },
      '/v1/chargebacks/sla-dashboard': { get: { tags: ['Chargebacks'], summary: 'Chargeback SLA dashboard', security: [{ bearerAuth: [] }] } },
      '/v1/chargebacks/analytics': { get: { tags: ['Chargebacks'], summary: 'Chargeback analytics', security: [{ bearerAuth: [] }] } },
      '/v1/operations/queues': { get: { tags: ['Operations'], summary: 'Operations queues dashboard', security: [{ bearerAuth: [] }] } },
      '/v1/operations/dead-letter-queue': { get: { tags: ['Operations'], summary: 'Dead letter queue', security: [{ bearerAuth: [] }] } },
      '/v1/ai/insights/dashboard': { get: { tags: ['AI'], summary: 'AI insights dashboard', security: [{ bearerAuth: [] }] } },
      '/v1/ai/search': { post: { tags: ['AI'], summary: 'Natural language search', security: [{ bearerAuth: [] }] } },
      '/v1/settings/rate-limits': { get: { tags: ['Settings'], summary: 'List API rate limits', security: [{ bearerAuth: [] }] } },
      '/v1/notifications/campaigns': { get: { tags: ['Notifications'], summary: 'List communication campaigns', security: [{ bearerAuth: [] }] }, post: { tags: ['Notifications'], summary: 'Create communication campaign', security: [{ bearerAuth: [] }] } },
      '/v1/system/cache-config': { get: { tags: ['System'], summary: 'List cache configurations', security: [{ bearerAuth: [] }] } },
      '/v1/system/performance': { get: { tags: ['System'], summary: 'Performance metrics', security: [{ bearerAuth: [] }] } },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
