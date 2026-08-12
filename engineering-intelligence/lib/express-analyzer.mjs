import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { REPO_ROOT } from './constants.mjs';

import { walkFiles as wf } from './walk.mjs';

export function analyzeExpressSync() {
  const appPath = join(REPO_ROOT, 'Backend_Fintech', 'src', 'app', 'app.ts');
  const appContent = readFileSync(appPath, 'utf8');
  const mounts = [];
  for (const m of appContent.matchAll(/app\.use\(\s*['"`]([^'"`]+)['"`]\s*,\s*(\w+)/g)) {
    mounts.push({ prefix: m[1], routerVar: m[2] });
  }
  for (const m of appContent.matchAll(/app\.(get|post|put|patch|delete)\(\s*['"`]([^'"`]+)['"`]/g)) {
    mounts.push({ prefix: m[2], method: m[1].toUpperCase(), routerVar: 'app', direct: true });
  }

  const mountToPrefix = {};
  for (const mt of mounts) {
    if (mt.routerVar) mountToPrefix[mt.routerVar] = mt.prefix;
  }

  const importToVar = {};
  for (const m of appContent.matchAll(/import\s+\{\s*([^}]+)\s*\}\s+from\s+['"]([^'"]+)['"]/g)) {
    for (const name of m[1].split(',').map((s) => s.trim().split(/\s+as\s+/).pop().trim())) {
      importToVar[name] = m[2];
    }
  }

  const varToPrefix = {};
  for (const mt of mounts) {
    if (mt.routerVar && mountToPrefix[mt.routerVar]) {
      varToPrefix[mt.routerVar] = mountToPrefix[mt.routerVar];
    }
  }

  const routeVarMap = {
    authRoutes: '/api/auth',
    executiveDashboardRoutes: '/api/v1/dashboard/executive',
    merchantRoutes: '/api/v1/merchants',
    transactionRoutes: '/api/v1/transactions',
    settlementRoutes: '/api/v1/settlements',
    userRoutes: '/api/v1/users',
    roleRoutes: '/api/v1/roles',
    permissionRoutes: '/api/v1/permissions',
    reportRoutes: '/api/v1/reports',
    analyticsRoutes: '/api/v1/analytics',
    exportRoutes: '/api/v1/exports',
    settingsRoutes: '/api/v1/settings',
    notificationRoutes: '/api/v1/notifications',
    auditRoutes: '/api/v1/audit',
    organizationRoutes: '/api/v1/organizations',
    customerRoutes: '/api/v1/customers',
    refundRoutes: '/api/v1/refunds',
    chargebackRoutes: '/api/v1/chargebacks',
    payoutRoutes: '/api/v1/payouts',
    paymentLinkRoutes: '/api/v1/payment-links',
    publicPaymentLinkRoutes: '/api/v1/public/payment-links',
    invoiceRoutes: '/api/v1/invoices',
    qrPaymentRoutes: '/api/v1/qr-payments',
    publicQrPaymentRoutes: '/api/v1/public/qr-payments',
    subscriptionRoutes: '/api/v1/subscriptions',
    supportRoutes: '/api/v1/support',
    merchantOnboardingRoutes: '/api/v1/merchant-onboarding',
    outletRoutes: '/api/v1/outlets',
    merchantUserRoutes: '/api/v1/merchant-users',
    onboardingApprovalRoutes: '/api/v1/onboarding-approval',
    deviceRoutes: '/api/v1/devices',
    paymentConfigRoutes: '/api/v1/payment-config',
    pricingRoutes: '/api/v1/pricing',
    riskRuleRoutes: '/api/v1/risk-rules',
    fraudRoutes: '/api/v1/fraud',
    accountingRoutes: '/api/v1/accounting',
    searchRoutes: '/api/v1/search',
    activityRoutes: '/api/v1/activity',
    paymentRoutes: '/api/v1/payments',
    checkoutRoutes: '/api/v1/checkout',
    publicCheckoutRoutes: '/api/v1/public/checkout',
    smartCollectRoutes: '/api/v1/smart-collect',
    acceptanceRoutes: '/api/v1/acceptance',
    operationsRoutes: '/api/v1/operations',
    aiRoutes: '/api/v1/ai',
    systemRoutes: '/api/v1/system',
    developerRoutes: '/api/v1/developer',
    webhooksRoutes: '/api/v1/webhooks',
    reconciliationRoutes: '/api/v1/reconciliation',
    sandboxRoutes: '/api/v1/sandbox',
  };

  const routeFiles = wf(join(REPO_ROOT, 'Backend_Fintech', 'src')).filter((f) => f.endsWith('.routes.ts'));
  const endpoints = [];
  const routeRe = /\.(get|post|put|patch|delete|use)\(\s*['"`]([^'"`]+)['"`]/gi;

  for (const rf of routeFiles) {
    const content = readFileSync(rf, 'utf8');
    const rel = relative(REPO_ROOT, rf).replace(/\\/g, '/');
    let prefix = 'NOT VERIFIED';
    for (const [varName, p] of Object.entries(routeVarMap)) {
      if (importToVar[varName] && rel.includes(importToVar[varName].replace('./', '').replace('../', ''))) {
        prefix = p;
        break;
      }
    }
    if (prefix === 'NOT VERIFIED' && rel.includes('auth/routes')) prefix = '/api/auth';
    if (prefix === 'NOT VERIFIED') {
      const mod = rel.match(/modules\/([^/]+)/)?.[1];
      if (mod) prefix = `/api/v1/${mod}`;
    }
    const mod = rel.match(/modules\/([^/]+)/)?.[1] || 'app';
    const authz = [...content.matchAll(/authorize\s*\(\s*([^)]+)\)/g)].map((x) => x[1].trim());
    let m;
    const re = new RegExp(routeRe.source, 'gi');
    while ((m = re.exec(content))) {
      const frag = m[2];
      const full = (prefix + (frag.startsWith('/') ? frag : '/' + frag)).replace(/\/+/g, '/');
      endpoints.push({
        method: m[1].toUpperCase(),
        pathFragment: frag,
        fullPath: full,
        mountPrefix: prefix,
        routeFile: rel,
        module: mod,
        authenticate: /\bauthenticate\b/.test(content),
        permissions: authz.length ? [...new Set(authz)] : [],
        middlewareChain: [
          /\bauthenticate\b/.test(content) ? 'authenticate' : null,
          authz.length ? 'authorize' : null,
        ].filter(Boolean),
        validation: /Dto|\.parse\(|validateBody|validateQuery/.test(content) ? 'present' : 'NOT VERIFIED',
        sourceEvidence: rel,
      });
    }
  }

  for (const m of appContent.matchAll(/app\.(get|post)\(\s*['"`]([^'"`]+)['"`]/g)) {
    endpoints.push({
      method: m[1].toUpperCase(),
      pathFragment: m[2],
      fullPath: m[2],
      mountPrefix: '',
      routeFile: relative(REPO_ROOT, appPath).replace(/\\/g, '/'),
      module: 'system',
      authenticate: false,
      permissions: [],
      middlewareChain: [],
      validation: 'NOT VERIFIED',
      sourceEvidence: relative(REPO_ROOT, appPath).replace(/\\/g, '/'),
    });
  }

  return { mounts, endpoints, routeFileCount: routeFiles.length };
}
