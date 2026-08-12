# API Traceability

> **Phase 2 — Code Traceability** · v1.0.0-rc1 · Generated 2026-07-29 · Evidence from repository scan

## Cross References

| Layer | Path |
|-------|------|
| Product | [01_Product](../01_Product/README.md) |
| Architecture | [02_Architecture](../02_Architecture/README.md) |
| Database | [03_Database](../03_Database/README.md) |
| Repository Audit | [05_Repository_Audit](../05_Repository_Audit/README.md) |

---



## Summary

| Metric | Value |
|--------|------:|
| Route definition lines parsed | 559 |
| Backend modules | 47 |
| Mount prefixes (app.ts) | 53 |
| Full per-endpoint FE caller mapping | **NOT VERIFIED** (requires static call graph) |

## Traceability Legend

| Column | Meaning |
|--------|---------|
| Verified | File path confirmed in repo |
| NOT VERIFIED | Not traced in Phase 2 scan |
| Partial | Module-level only |


### Module: `acceptance`

| Artifact | Location |
|----------|----------|
| Controller | `Backend_Fintech/src/app/modules/acceptance/controllers/acceptance.controller.ts` |
| Service | `Backend_Fintech/src/app/modules/acceptance/services/acceptance.service.ts` |
| Repository | `Backend_Fintech/src/app/modules/acceptance/repositories/acceptance.repository.ts` |
| Routes | `Backend_Fintech/src/app/modules/acceptance/routes/acceptance.routes.ts` |
| Frontend API service | `Frontend_Fintech/src/app/features/acceptance/services/acceptance-api.service.ts` |
| FR IDs | NOT VERIFIED |
| Integration test | NOT VERIFIED |
| E2E spec | NOT VERIFIED |
| Product module doc | NOT VERIFIED |

| Method | Route fragment | Route file |
|--------|----------------|------------|
| GET | `/analytics` | `Backend_Fintech/src/app/modules/acceptance/routes/acceptance.routes.ts` |
| GET | `/top-merchants` | `Backend_Fintech/src/app/modules/acceptance/routes/acceptance.routes.ts` |
| GET | `/failure-insights` | `Backend_Fintech/src/app/modules/acceptance/routes/acceptance.routes.ts` |
| GET | `/merchant-portal/:merchantId` | `Backend_Fintech/src/app/modules/acceptance/routes/acceptance.routes.ts` |

### Module: `accounting`

| Artifact | Location |
|----------|----------|
| Controller | `Backend_Fintech/src/app/modules/accounting/controllers/accounting.controller.ts` |
| Service | `Backend_Fintech/src/app/modules/accounting/services/accounting.service.ts` |
| Repository | `Backend_Fintech/src/app/modules/accounting/repositories/accounting.repository.ts` |
| Routes | `Backend_Fintech/src/app/modules/accounting/routes/accounting.routes.ts` |
| Frontend API service | `NOT VERIFIED` |
| FR IDs | NOT VERIFIED |
| Integration test | NOT VERIFIED |
| E2E spec | NOT VERIFIED |
| Product module doc | NOT VERIFIED |

| Method | Route fragment | Route file |
|--------|----------------|------------|
| GET | `/accounts` | `Backend_Fintech/src/app/modules/accounting/routes/accounting.routes.ts` |
| GET | `/entries` | `Backend_Fintech/src/app/modules/accounting/routes/accounting.routes.ts` |
| GET | `/summary` | `Backend_Fintech/src/app/modules/accounting/routes/accounting.routes.ts` |
| GET | `/export` | `Backend_Fintech/src/app/modules/accounting/routes/accounting.routes.ts` |

### Module: `activity`

| Artifact | Location |
|----------|----------|
| Controller | `Backend_Fintech/src/app/modules/activity/controllers/activity.controller.ts` |
| Service | `Backend_Fintech/src/app/modules/activity/services/activity.service.ts` |
| Repository | `Backend_Fintech/src/app/modules/activity/repositories/activity.repository.ts` |
| Routes | `Backend_Fintech/src/app/modules/activity/routes/activity.routes.ts` |
| Frontend API service | `Frontend_Fintech/src/app/features/activity/services/activity-api.service.ts` |
| FR IDs | FR-ACT-001 |
| Integration test | NOT VERIFIED |
| E2E spec | NOT VERIFIED |
| Product module doc | NOT VERIFIED |

| Method | Route fragment | Route file |
|--------|----------------|------------|
| GET | `/timeline` | `Backend_Fintech/src/app/modules/activity/routes/activity.routes.ts` |

### Module: `ai`

| Artifact | Location |
|----------|----------|
| Controller | `Backend_Fintech/src/app/modules/ai/controllers/ai.controller.ts` |
| Service | `Backend_Fintech/src/app/modules/ai/services/ai-business-context.service.ts` |
| Repository | `Backend_Fintech/src/app/modules/ai/repositories/ai-insights.repository.ts` |
| Routes | `Backend_Fintech/src/app/modules/ai/routes/ai.routes.ts` |
| Frontend API service | `NOT VERIFIED` |
| FR IDs | FR-SYS-002 |
| Integration test | NOT VERIFIED |
| E2E spec | NOT VERIFIED |
| Product module doc | NOT VERIFIED |

| Method | Route fragment | Route file |
|--------|----------------|------------|
| POST | `/chat` | `Backend_Fintech/src/app/modules/ai/routes/ai.routes.ts` |
| GET | `/insights/dashboard` | `Backend_Fintech/src/app/modules/ai/routes/ai.routes.ts` |
| GET | `/insights/revenue-forecast` | `Backend_Fintech/src/app/modules/ai/routes/ai.routes.ts` |
| GET | `/insights/settlement-forecast` | `Backend_Fintech/src/app/modules/ai/routes/ai.routes.ts` |
| GET | `/insights/merchant-health` | `Backend_Fintech/src/app/modules/ai/routes/ai.routes.ts` |
| GET | `/insights/fraud-prediction` | `Backend_Fintech/src/app/modules/ai/routes/ai.routes.ts` |
| POST | `/search` | `Backend_Fintech/src/app/modules/ai/routes/ai.routes.ts` |

### Module: `audit`

| Artifact | Location |
|----------|----------|
| Controller | `Backend_Fintech/src/app/modules/audit/controllers/audit.controller.ts` |
| Service | `Backend_Fintech/src/app/modules/audit/services/audit-recorder.service.ts` |
| Repository | `Backend_Fintech/src/app/modules/audit/repositories/audit.repository.ts` |
| Routes | `Backend_Fintech/src/app/modules/audit/routes/audit.routes.ts` |
| Frontend API service | `Frontend_Fintech/src/app/features/audit/services/audit-api.service.ts` |
| FR IDs | FR-AUD-001, FR-AUD-002 |
| Integration test | Backend_Fintech/src/__tests__/integration/reports-audit.integration.test.ts |
| E2E spec | e2e/tests/audit.spec.ts |
| Product module doc | [Modules](../01_Product/Modules/) |

| Method | Route fragment | Route file |
|--------|----------------|------------|
| GET | `/` | `Backend_Fintech/src/app/modules/audit/routes/audit.routes.ts` |
| GET | `/export` | `Backend_Fintech/src/app/modules/audit/routes/audit.routes.ts` |
| GET | `/categories` | `Backend_Fintech/src/app/modules/audit/routes/audit.routes.ts` |
| GET | `/actions` | `Backend_Fintech/src/app/modules/audit/routes/audit.routes.ts` |
| GET | `/api-logs` | `Backend_Fintech/src/app/modules/audit/routes/audit.routes.ts` |
| GET | `/webhook-logs` | `Backend_Fintech/src/app/modules/audit/routes/audit.routes.ts` |
| GET | `/:id` | `Backend_Fintech/src/app/modules/audit/routes/audit.routes.ts` |

### Module: `auth`

| Artifact | Location |
|----------|----------|
| Controller | `Backend_Fintech/src/app/modules/auth/controllers/auth.controller.ts` |
| Service | `Backend_Fintech/src/app/modules/auth/services/auth.service.ts` |
| Repository | `Backend_Fintech/src/app/modules/auth/repositories/audit.repository.ts` |
| Routes | `Backend_Fintech/src/app/modules/auth/routes/auth.routes.ts` |
| Frontend API service | `NOT VERIFIED` |
| FR IDs | FR-AUTH-001, FR-AUTH-002, FR-AUTH-003, FR-AUTH-004, FR-AUTH-005, FR-AUTH-006, FR-AUTH-007, FR-AUTH-008, FR-AUTH-009, FR-AUTH-010 |
| Integration test | NOT VERIFIED |
| E2E spec | e2e/tests/auth.spec.ts |
| Product module doc | NOT VERIFIED |

| Method | Route fragment | Route file |
|--------|----------------|------------|
| GET | `/csrf-token` | `Backend_Fintech/src/app/modules/auth/routes/auth.routes.ts` |
| POST | `/login` | `Backend_Fintech/src/app/modules/auth/routes/auth.routes.ts` |
| POST | `/verify-otp` | `Backend_Fintech/src/app/modules/auth/routes/auth.routes.ts` |
| POST | `/resend-otp` | `Backend_Fintech/src/app/modules/auth/routes/auth.routes.ts` |
| POST | `/forgot-password` | `Backend_Fintech/src/app/modules/auth/routes/auth.routes.ts` |
| POST | `/reset-password` | `Backend_Fintech/src/app/modules/auth/routes/auth.routes.ts` |
| POST | `/refresh-token` | `Backend_Fintech/src/app/modules/auth/routes/auth.routes.ts` |
| POST | `/select-organization` | `Backend_Fintech/src/app/modules/auth/routes/auth.routes.ts` |
| POST | `/logout` | `Backend_Fintech/src/app/modules/auth/routes/auth.routes.ts` |
| GET | `/me` | `Backend_Fintech/src/app/modules/auth/routes/auth.routes.ts` |
| GET | `/sessions` | `Backend_Fintech/src/app/modules/auth/routes/auth.routes.ts` |
| DELETE | `/sessions/others` | `Backend_Fintech/src/app/modules/auth/routes/auth.routes.ts` |
| DELETE | `/session/:id` | `Backend_Fintech/src/app/modules/auth/routes/auth.routes.ts` |
| POST | `/change-password` | `Backend_Fintech/src/app/modules/auth/routes/auth.routes.ts` |
| PUT | `/mfa-preferences` | `Backend_Fintech/src/app/modules/auth/routes/auth.routes.ts` |
| GET | `/session-settings` | `Backend_Fintech/src/app/modules/auth/routes/auth.routes.ts` |

### Module: `chargebacks`

| Artifact | Location |
|----------|----------|
| Controller | `Backend_Fintech/src/app/modules/chargebacks/controllers/chargeback.controller.ts` |
| Service | `Backend_Fintech/src/app/modules/chargebacks/services/chargeback.service.ts` |
| Repository | `Backend_Fintech/src/app/modules/chargebacks/repositories/chargeback.repository.ts` |
| Routes | `Backend_Fintech/src/app/modules/chargebacks/routes/chargeback.routes.ts` |
| Frontend API service | `Frontend_Fintech/src/app/features/chargebacks/services/chargebacks-api.service.ts` |
| FR IDs | FR-CB-001, FR-CB-002 |
| Integration test | Backend_Fintech/src/__tests__/integration/chargebacks-refunds.integration.test.ts |
| E2E spec | e2e/tests/chargebacks.spec.ts |
| Product module doc | [Modules](../01_Product/Modules/) |

| Method | Route fragment | Route file |
|--------|----------------|------------|
| GET | `/statistics` | `Backend_Fintech/src/app/modules/chargebacks/routes/chargeback.routes.ts` |
| GET | `/sla-dashboard` | `Backend_Fintech/src/app/modules/chargebacks/routes/chargeback.routes.ts` |
| GET | `/analytics` | `Backend_Fintech/src/app/modules/chargebacks/routes/chargeback.routes.ts` |
| GET | `/` | `Backend_Fintech/src/app/modules/chargebacks/routes/chargeback.routes.ts` |
| POST | `/` | `Backend_Fintech/src/app/modules/chargebacks/routes/chargeback.routes.ts` |
| GET | `/:id/history` | `Backend_Fintech/src/app/modules/chargebacks/routes/chargeback.routes.ts` |
| GET | `/:id/evidence` | `Backend_Fintech/src/app/modules/chargebacks/routes/chargeback.routes.ts` |
| POST | `/:id/evidence` | `Backend_Fintech/src/app/modules/chargebacks/routes/chargeback.routes.ts` |
| POST | `/:id/representment` | `Backend_Fintech/src/app/modules/chargebacks/routes/chargeback.routes.ts` |
| POST | `/:id/arbitration` | `Backend_Fintech/src/app/modules/chargebacks/routes/chargeback.routes.ts` |
| POST | `/:id/resolve` | `Backend_Fintech/src/app/modules/chargebacks/routes/chargeback.routes.ts` |
| GET | `/:id` | `Backend_Fintech/src/app/modules/chargebacks/routes/chargeback.routes.ts` |

### Module: `checkout`

| Artifact | Location |
|----------|----------|
| Controller | `Backend_Fintech/src/app/modules/checkout/controllers/checkout.controller.ts` |
| Service | `Backend_Fintech/src/app/modules/checkout/services/checkout.service.ts` |
| Repository | `Backend_Fintech/src/app/modules/checkout/repositories/checkout.repository.ts` |
| Routes | `Backend_Fintech/src/app/modules/checkout/routes/checkout.routes.ts` |
| Frontend API service | `Frontend_Fintech/src/app/features/checkout/services/checkout-api.service.ts` |
| FR IDs | FR-CHK-001, FR-CHK-002, FR-CHK-003 |
| Integration test | Backend_Fintech/src/__tests__/integration/checkout.integration.test.ts |
| E2E spec | e2e/tests/checkout.spec.ts |
| Product module doc | [Modules](../01_Product/Modules/) |

| Method | Route fragment | Route file |
|--------|----------------|------------|
| GET | `/themes` | `Backend_Fintech/src/app/modules/checkout/routes/checkout.routes.ts` |
| GET | `/analytics` | `Backend_Fintech/src/app/modules/checkout/routes/checkout.routes.ts` |
| GET | `/sessions` | `Backend_Fintech/src/app/modules/checkout/routes/checkout.routes.ts` |
| POST | `/sessions` | `Backend_Fintech/src/app/modules/checkout/routes/checkout.routes.ts` |
| GET | `/sessions/:id` | `Backend_Fintech/src/app/modules/checkout/routes/checkout.routes.ts` |
| GET | `/branding/:merchantId` | `Backend_Fintech/src/app/modules/checkout/routes/checkout.routes.ts` |
| PUT | `/branding/:merchantId` | `Backend_Fintech/src/app/modules/checkout/routes/checkout.routes.ts` |
| GET | `/recover/:token` | `Backend_Fintech/src/app/modules/checkout/routes/checkout.routes.ts` |
| GET | `/:ref` | `Backend_Fintech/src/app/modules/checkout/routes/checkout.routes.ts` |
| POST | `/:ref/pay` | `Backend_Fintech/src/app/modules/checkout/routes/checkout.routes.ts` |
| POST | `/:ref/retry` | `Backend_Fintech/src/app/modules/checkout/routes/checkout.routes.ts` |
| POST | `/:ref/cancel` | `Backend_Fintech/src/app/modules/checkout/routes/checkout.routes.ts` |

### Module: `customers`

| Artifact | Location |
|----------|----------|
| Controller | `Backend_Fintech/src/app/modules/customers/controllers/customer.controller.ts` |
| Service | `Backend_Fintech/src/app/modules/customers/services/customer.service.ts` |
| Repository | `Backend_Fintech/src/app/modules/customers/repositories/customer.repository.ts` |
| Routes | `Backend_Fintech/src/app/modules/customers/routes/customer.routes.ts` |
| Frontend API service | `Frontend_Fintech/src/app/features/customers/services/customers-api.service.ts` |
| FR IDs | NOT VERIFIED |
| Integration test | NOT VERIFIED |
| E2E spec | NOT VERIFIED |
| Product module doc | NOT VERIFIED |

| Method | Route fragment | Route file |
|--------|----------------|------------|
| GET | `/search` | `Backend_Fintech/src/app/modules/customers/routes/customer.routes.ts` |
| GET | `/statistics` | `Backend_Fintech/src/app/modules/customers/routes/customer.routes.ts` |
| GET | `/` | `Backend_Fintech/src/app/modules/customers/routes/customer.routes.ts` |
| POST | `/` | `Backend_Fintech/src/app/modules/customers/routes/customer.routes.ts` |
| GET | `/:id` | `Backend_Fintech/src/app/modules/customers/routes/customer.routes.ts` |
| PUT | `/:id` | `Backend_Fintech/src/app/modules/customers/routes/customer.routes.ts` |
| PATCH | `/:id/status` | `Backend_Fintech/src/app/modules/customers/routes/customer.routes.ts` |
| DELETE | `/:id` | `Backend_Fintech/src/app/modules/customers/routes/customer.routes.ts` |
| GET | `/:id/transactions` | `Backend_Fintech/src/app/modules/customers/routes/customer.routes.ts` |
| GET | `/:id/merchants` | `Backend_Fintech/src/app/modules/customers/routes/customer.routes.ts` |
| GET | `/:id/preferences` | `Backend_Fintech/src/app/modules/customers/routes/customer.routes.ts` |
| PUT | `/:id/preferences` | `Backend_Fintech/src/app/modules/customers/routes/customer.routes.ts` |
| GET | `/:id/payment-methods` | `Backend_Fintech/src/app/modules/customers/routes/customer.routes.ts` |
| GET | `/:id/timeline` | `Backend_Fintech/src/app/modules/customers/routes/customer.routes.ts` |

### Module: `dashboard`

| Artifact | Location |
|----------|----------|
| Controller | `Backend_Fintech/src/app/modules/dashboard/controllers/executive-dashboard.controller.ts` |
| Service | `Backend_Fintech/src/app/modules/dashboard/services/dashboard-ai.service.ts` |
| Repository | `Backend_Fintech/src/app/modules/dashboard/repositories/dashboard.repository.ts` |
| Routes | `Backend_Fintech/src/app/modules/dashboard/routes/executive-dashboard.routes.ts` |
| Frontend API service | `Frontend_Fintech/src/app/features/dashboard/services/dashboard-api.service.ts` |
| FR IDs | FR-RPT-004 |
| Integration test | NOT VERIFIED |
| E2E spec | NOT VERIFIED |
| Product module doc | [Modules](../01_Product/Modules/) |

| Method | Route fragment | Route file |
|--------|----------------|------------|
| GET | `/summary` | `Backend_Fintech/src/app/modules/dashboard/routes/executive-dashboard.routes.ts` |
| GET | `/charts/revenue` | `Backend_Fintech/src/app/modules/dashboard/routes/executive-dashboard.routes.ts` |
| GET | `/charts/payment-methods` | `Backend_Fintech/src/app/modules/dashboard/routes/executive-dashboard.routes.ts` |
| GET | `/charts/regional-distribution` | `Backend_Fintech/src/app/modules/dashboard/routes/executive-dashboard.routes.ts` |
| GET | `/transactions/high-value` | `Backend_Fintech/src/app/modules/dashboard/routes/executive-dashboard.routes.ts` |
| GET | `/activities` | `Backend_Fintech/src/app/modules/dashboard/routes/executive-dashboard.routes.ts` |
| GET | `/fraud-alerts` | `Backend_Fintech/src/app/modules/dashboard/routes/executive-dashboard.routes.ts` |
| GET | `/onboarding-stats` | `Backend_Fintech/src/app/modules/dashboard/routes/executive-dashboard.routes.ts` |
| GET | `/payment-platform-stats` | `Backend_Fintech/src/app/modules/dashboard/routes/executive-dashboard.routes.ts` |
| GET | `/operations-stats` | `Backend_Fintech/src/app/modules/dashboard/routes/executive-dashboard.routes.ts` |
| POST | `/export` | `Backend_Fintech/src/app/modules/dashboard/routes/executive-dashboard.routes.ts` |
| GET | `/preferences` | `Backend_Fintech/src/app/modules/dashboard/routes/executive-dashboard.routes.ts` |
| PUT | `/preferences` | `Backend_Fintech/src/app/modules/dashboard/routes/executive-dashboard.routes.ts` |
| POST | `/ai/chat` | `Backend_Fintech/src/app/modules/dashboard/routes/executive-dashboard.routes.ts` |

### Module: `developer`

| Artifact | Location |
|----------|----------|
| Controller | `Backend_Fintech/src/app/modules/developer/controllers/developer.controller.ts` |
| Service | `Backend_Fintech/src/app/modules/developer/services/developer.service.ts` |
| Repository | `Backend_Fintech/src/app/modules/developer/repositories/developer.repository.ts` |
| Routes | `Backend_Fintech/src/app/modules/developer/routes/developer.routes.ts` |
| Frontend API service | `Frontend_Fintech/src/app/features/developer/services/developer-api.service.ts` |
| FR IDs | FR-DEV-001, FR-DEV-002, FR-DEV-003 |
| Integration test | Backend_Fintech/src/__tests__/integration/developer-sandbox.integration.test.ts |
| E2E spec | NOT VERIFIED |
| Product module doc | NOT VERIFIED |

| Method | Route fragment | Route file |
|--------|----------------|------------|
| GET | `/dashboard` | `Backend_Fintech/src/app/modules/developer/routes/developer.routes.ts` |
| GET | `/profiles` | `Backend_Fintech/src/app/modules/developer/routes/developer.routes.ts` |
| POST | `/profiles` | `Backend_Fintech/src/app/modules/developer/routes/developer.routes.ts` |
| GET | `/profiles/:id` | `Backend_Fintech/src/app/modules/developer/routes/developer.routes.ts` |
| PUT | `/profiles/:id` | `Backend_Fintech/src/app/modules/developer/routes/developer.routes.ts` |
| DELETE | `/profiles/:id` | `Backend_Fintech/src/app/modules/developer/routes/developer.routes.ts` |
| GET | `/oauth-apps` | `Backend_Fintech/src/app/modules/developer/routes/developer.routes.ts` |
| POST | `/oauth-apps` | `Backend_Fintech/src/app/modules/developer/routes/developer.routes.ts` |
| GET | `/oauth-apps/:id` | `Backend_Fintech/src/app/modules/developer/routes/developer.routes.ts` |
| PUT | `/oauth-apps/:id` | `Backend_Fintech/src/app/modules/developer/routes/developer.routes.ts` |
| POST | `/oauth-apps/:id/revoke` | `Backend_Fintech/src/app/modules/developer/routes/developer.routes.ts` |
| GET | `/api-usage` | `Backend_Fintech/src/app/modules/developer/routes/developer.routes.ts` |
| GET | `/api-keys` | `Backend_Fintech/src/app/modules/developer/routes/developer.routes.ts` |

### Module: `devices`

| Artifact | Location |
|----------|----------|
| Controller | `Backend_Fintech/src/app/modules/devices/controllers/device.controller.ts` |
| Service | `Backend_Fintech/src/app/modules/devices/services/device.service.ts` |
| Repository | `Backend_Fintech/src/app/modules/devices/repositories/device.repository.ts` |
| Routes | `Backend_Fintech/src/app/modules/devices/routes/device.routes.ts` |
| Frontend API service | `Frontend_Fintech/src/app/features/devices/services/devices-api.service.ts` |
| FR IDs | NOT VERIFIED |
| Integration test | NOT VERIFIED |
| E2E spec | NOT VERIFIED |
| Product module doc | NOT VERIFIED |

| Method | Route fragment | Route file |
|--------|----------------|------------|
| GET | `/inventory` | `Backend_Fintech/src/app/modules/devices/routes/device.routes.ts` |
| GET | `/` | `Backend_Fintech/src/app/modules/devices/routes/device.routes.ts` |
| POST | `/` | `Backend_Fintech/src/app/modules/devices/routes/device.routes.ts` |
| GET | `/:id` | `Backend_Fintech/src/app/modules/devices/routes/device.routes.ts` |
| POST | `/:id/activate` | `Backend_Fintech/src/app/modules/devices/routes/device.routes.ts` |
| POST | `/:id/deactivate` | `Backend_Fintech/src/app/modules/devices/routes/device.routes.ts` |
| POST | `/:id/transfer` | `Backend_Fintech/src/app/modules/devices/routes/device.routes.ts` |
| POST | `/:id/replace` | `Backend_Fintech/src/app/modules/devices/routes/device.routes.ts` |
| POST | `/:id/sync` | `Backend_Fintech/src/app/modules/devices/routes/device.routes.ts` |

### Module: `exports`

| Artifact | Location |
|----------|----------|
| Controller | `Backend_Fintech/src/app/modules/exports/controllers/export.controller.ts` |
| Service | `NOT VERIFIED` |
| Repository | `NOT VERIFIED` |
| Routes | `Backend_Fintech/src/app/modules/exports/routes/export.routes.ts` |
| Frontend API service | `NOT VERIFIED` |
| FR IDs | NOT VERIFIED |
| Integration test | NOT VERIFIED |
| E2E spec | NOT VERIFIED |
| Product module doc | NOT VERIFIED |

| Method | Route fragment | Route file |
|--------|----------------|------------|
| GET | `/:fileId` | `Backend_Fintech/src/app/modules/exports/routes/export.routes.ts` |

### Module: `fraud`

| Artifact | Location |
|----------|----------|
| Controller | `Backend_Fintech/src/app/modules/fraud/controllers/fraud.controller.ts` |
| Service | `Backend_Fintech/src/app/modules/fraud/services/fraud.service.ts` |
| Repository | `Backend_Fintech/src/app/modules/fraud/repositories/fraud.repository.ts` |
| Routes | `Backend_Fintech/src/app/modules/fraud/routes/fraud.routes.ts` |
| Frontend API service | `Frontend_Fintech/src/app/features/fraud/services/fraud-api.service.ts` |
| FR IDs | NOT VERIFIED |
| Integration test | NOT VERIFIED |
| E2E spec | NOT VERIFIED |
| Product module doc | NOT VERIFIED |

| Method | Route fragment | Route file |
|--------|----------------|------------|
| GET | `/` | `Backend_Fintech/src/app/modules/fraud/routes/fraud.routes.ts` |
| GET | `/:id` | `Backend_Fintech/src/app/modules/fraud/routes/fraud.routes.ts` |
| POST | `/:id/approve` | `Backend_Fintech/src/app/modules/fraud/routes/fraud.routes.ts` |
| POST | `/:id/reject` | `Backend_Fintech/src/app/modules/fraud/routes/fraud.routes.ts` |
| POST | `/:id/release` | `Backend_Fintech/src/app/modules/fraud/routes/fraud.routes.ts` |

### Module: `invoices`

| Artifact | Location |
|----------|----------|
| Controller | `Backend_Fintech/src/app/modules/invoices/controllers/invoice.controller.ts` |
| Service | `Backend_Fintech/src/app/modules/invoices/services/invoice-pdf.service.ts` |
| Repository | `Backend_Fintech/src/app/modules/invoices/repositories/invoice.repository.ts` |
| Routes | `Backend_Fintech/src/app/modules/invoices/routes/invoice.routes.ts` |
| Frontend API service | `Frontend_Fintech/src/app/features/invoices/services/invoices-api.service.ts` |
| FR IDs | FR-INV-001, FR-INV-002 |
| Integration test | Backend_Fintech/src/__tests__/integration/subscriptions-invoices.integration.test.ts |
| E2E spec | NOT VERIFIED |
| Product module doc | [Modules](../01_Product/Modules/) |

| Method | Route fragment | Route file |
|--------|----------------|------------|
| GET | `/statistics` | `Backend_Fintech/src/app/modules/invoices/routes/invoice.routes.ts` |
| GET | `/analytics` | `Backend_Fintech/src/app/modules/invoices/routes/invoice.routes.ts` |
| GET | `/templates` | `Backend_Fintech/src/app/modules/invoices/routes/invoice.routes.ts` |
| POST | `/templates` | `Backend_Fintech/src/app/modules/invoices/routes/invoice.routes.ts` |
| GET | `/templates/:id` | `Backend_Fintech/src/app/modules/invoices/routes/invoice.routes.ts` |
| PUT | `/templates/:id` | `Backend_Fintech/src/app/modules/invoices/routes/invoice.routes.ts` |
| DELETE | `/templates/:id` | `Backend_Fintech/src/app/modules/invoices/routes/invoice.routes.ts` |
| GET | `/credit-notes` | `Backend_Fintech/src/app/modules/invoices/routes/invoice.routes.ts` |
| POST | `/credit-notes` | `Backend_Fintech/src/app/modules/invoices/routes/invoice.routes.ts` |
| GET | `/debit-notes` | `Backend_Fintech/src/app/modules/invoices/routes/invoice.routes.ts` |
| POST | `/debit-notes` | `Backend_Fintech/src/app/modules/invoices/routes/invoice.routes.ts` |
| GET | `/` | `Backend_Fintech/src/app/modules/invoices/routes/invoice.routes.ts` |
| POST | `/` | `Backend_Fintech/src/app/modules/invoices/routes/invoice.routes.ts` |
| GET | `/:id/pdf` | `Backend_Fintech/src/app/modules/invoices/routes/invoice.routes.ts` |
| GET | `/:id/pdf/metadata` | `Backend_Fintech/src/app/modules/invoices/routes/invoice.routes.ts` |
| POST | `/:id/duplicate` | `Backend_Fintech/src/app/modules/invoices/routes/invoice.routes.ts` |
| POST | `/:id/void` | `Backend_Fintech/src/app/modules/invoices/routes/invoice.routes.ts` |
| POST | `/:id/cancel` | `Backend_Fintech/src/app/modules/invoices/routes/invoice.routes.ts` |
| POST | `/:id/send` | `Backend_Fintech/src/app/modules/invoices/routes/invoice.routes.ts` |
| POST | `/:id/mark-viewed` | `Backend_Fintech/src/app/modules/invoices/routes/invoice.routes.ts` |
| POST | `/:id/mark-overdue` | `Backend_Fintech/src/app/modules/invoices/routes/invoice.routes.ts` |
| POST | `/:id/mark-paid` | `Backend_Fintech/src/app/modules/invoices/routes/invoice.routes.ts` |
| POST | `/:id/email` | `Backend_Fintech/src/app/modules/invoices/routes/invoice.routes.ts` |
| POST | `/:id/payment-link` | `Backend_Fintech/src/app/modules/invoices/routes/invoice.routes.ts` |
| POST | `/:id/payment-link/regenerate` | `Backend_Fintech/src/app/modules/invoices/routes/invoice.routes.ts` |
| POST | `/:id/payment-link/disable` | `Backend_Fintech/src/app/modules/invoices/routes/invoice.routes.ts` |
| GET | `/:id` | `Backend_Fintech/src/app/modules/invoices/routes/invoice.routes.ts` |
| PUT | `/:id` | `Backend_Fintech/src/app/modules/invoices/routes/invoice.routes.ts` |

### Module: `merchant`

| Artifact | Location |
|----------|----------|
| Controller | `Backend_Fintech/src/app/modules/merchant/controllers/merchant.controller.ts` |
| Service | `Backend_Fintech/src/app/modules/merchant/services/merchant.service.ts` |
| Repository | `Backend_Fintech/src/app/modules/merchant/repositories/merchant.repository.ts` |
| Routes | `Backend_Fintech/src/app/modules/merchant/routes/merchant.routes.ts` |
| Frontend API service | `Frontend_Fintech/src/app/features/merchant/services/merchant-api.service.ts` |
| FR IDs | FR-MER-001, FR-MER-002, FR-MER-003 |
| Integration test | Backend_Fintech/src/__tests__/integration/authorization.integration.test.ts; Backend_Fintech/src/__tests__/integration/merchants.integration.test.ts; Backend_Fintech/src/__tests__/integration/negative.integration.test.ts; Backend_Fintech/src/__tests__/integration/reports-audit.integration.test.ts |
| E2E spec | NOT VERIFIED |
| Product module doc | NOT VERIFIED |

| Method | Route fragment | Route file |
|--------|----------------|------------|
| GET | `/search` | `Backend_Fintech/src/app/modules/merchant/routes/merchant.routes.ts` |
| GET | `/statistics` | `Backend_Fintech/src/app/modules/merchant/routes/merchant.routes.ts` |
| GET | `/` | `Backend_Fintech/src/app/modules/merchant/routes/merchant.routes.ts` |
| POST | `/` | `Backend_Fintech/src/app/modules/merchant/routes/merchant.routes.ts` |
| GET | `/:id` | `Backend_Fintech/src/app/modules/merchant/routes/merchant.routes.ts` |
| PUT | `/:id` | `Backend_Fintech/src/app/modules/merchant/routes/merchant.routes.ts` |
| PATCH | `/:id/status` | `Backend_Fintech/src/app/modules/merchant/routes/merchant.routes.ts` |
| DELETE | `/:id` | `Backend_Fintech/src/app/modules/merchant/routes/merchant.routes.ts` |
| GET | `/:id/transactions` | `Backend_Fintech/src/app/modules/merchant/routes/merchant.routes.ts` |
| GET | `/:id/settlements` | `Backend_Fintech/src/app/modules/merchant/routes/merchant.routes.ts` |
| GET | `/:id/documents` | `Backend_Fintech/src/app/modules/merchant/routes/merchant.routes.ts` |
| POST | `/:id/documents` | `Backend_Fintech/src/app/modules/merchant/routes/merchant.routes.ts` |
| DELETE | `/:id/documents/:documentId` | `Backend_Fintech/src/app/modules/merchant/routes/merchant.routes.ts` |

### Module: `merchant-onboarding`

| Artifact | Location |
|----------|----------|
| Controller | `Backend_Fintech/src/app/modules/merchant-onboarding/controllers/merchant-onboarding.controller.ts` |
| Service | `Backend_Fintech/src/app/modules/merchant-onboarding/services/merchant-onboarding.service.ts` |
| Repository | `Backend_Fintech/src/app/modules/merchant-onboarding/repositories/merchant-onboarding.repository.ts` |
| Routes | `Backend_Fintech/src/app/modules/merchant-onboarding/routes/merchant-onboarding.routes.ts` |
| Frontend API service | `Frontend_Fintech/src/app/features/merchant-onboarding/services/merchant-onboarding-api.service.ts` |
| FR IDs | FR-MER-004, FR-MER-005 |
| Integration test | NOT VERIFIED |
| E2E spec | NOT VERIFIED |
| Product module doc | NOT VERIFIED |

| Method | Route fragment | Route file |
|--------|----------------|------------|
| GET | `/statistics` | `Backend_Fintech/src/app/modules/merchant-onboarding/routes/merchant-onboarding.routes.ts` |
| GET | `/` | `Backend_Fintech/src/app/modules/merchant-onboarding/routes/merchant-onboarding.routes.ts` |
| POST | `/` | `Backend_Fintech/src/app/modules/merchant-onboarding/routes/merchant-onboarding.routes.ts` |
| GET | `/:id` | `Backend_Fintech/src/app/modules/merchant-onboarding/routes/merchant-onboarding.routes.ts` |
| GET | `/:id/timeline` | `Backend_Fintech/src/app/modules/merchant-onboarding/routes/merchant-onboarding.routes.ts` |
| PUT | `/:id/business` | `Backend_Fintech/src/app/modules/merchant-onboarding/routes/merchant-onboarding.routes.ts` |
| PUT | `/:id/addresses` | `Backend_Fintech/src/app/modules/merchant-onboarding/routes/merchant-onboarding.routes.ts` |
| PUT | `/:id/kyc` | `Backend_Fintech/src/app/modules/merchant-onboarding/routes/merchant-onboarding.routes.ts` |
| PUT | `/:id/bank` | `Backend_Fintech/src/app/modules/merchant-onboarding/routes/merchant-onboarding.routes.ts` |
| PUT | `/:id/settlement` | `Backend_Fintech/src/app/modules/merchant-onboarding/routes/merchant-onboarding.routes.ts` |
| PUT | `/:id/payment` | `Backend_Fintech/src/app/modules/merchant-onboarding/routes/merchant-onboarding.routes.ts` |
| POST | `/:id/submit` | `Backend_Fintech/src/app/modules/merchant-onboarding/routes/merchant-onboarding.routes.ts` |
| POST | `/:id/approve` | `Backend_Fintech/src/app/modules/merchant-onboarding/routes/merchant-onboarding.routes.ts` |
| POST | `/:id/reject` | `Backend_Fintech/src/app/modules/merchant-onboarding/routes/merchant-onboarding.routes.ts` |
| POST | `/:id/go-live` | `Backend_Fintech/src/app/modules/merchant-onboarding/routes/merchant-onboarding.routes.ts` |
| POST | `/:id/suspend` | `Backend_Fintech/src/app/modules/merchant-onboarding/routes/merchant-onboarding.routes.ts` |

### Module: `merchant-users`

| Artifact | Location |
|----------|----------|
| Controller | `Backend_Fintech/src/app/modules/merchant-users/controllers/merchant-user.controller.ts` |
| Service | `Backend_Fintech/src/app/modules/merchant-users/services/merchant-user.service.ts` |
| Repository | `Backend_Fintech/src/app/modules/merchant-users/repositories/merchant-user.repository.ts` |
| Routes | `Backend_Fintech/src/app/modules/merchant-users/routes/merchant-user.routes.ts` |
| Frontend API service | `Frontend_Fintech/src/app/features/merchant-users/services/merchant-users-api.service.ts` |
| FR IDs | NOT VERIFIED |
| Integration test | NOT VERIFIED |
| E2E spec | NOT VERIFIED |
| Product module doc | [Modules](../01_Product/Modules/) |

| Method | Route fragment | Route file |
|--------|----------------|------------|
| GET | `/me` | `Backend_Fintech/src/app/modules/merchant-users/routes/merchant-user.routes.ts` |
| GET | `/roles` | `Backend_Fintech/src/app/modules/merchant-users/routes/merchant-user.routes.ts` |
| GET | `/` | `Backend_Fintech/src/app/modules/merchant-users/routes/merchant-user.routes.ts` |
| POST | `/` | `Backend_Fintech/src/app/modules/merchant-users/routes/merchant-user.routes.ts` |
| POST | `/invite` | `Backend_Fintech/src/app/modules/merchant-users/routes/merchant-user.routes.ts` |
| GET | `/:id` | `Backend_Fintech/src/app/modules/merchant-users/routes/merchant-user.routes.ts` |
| PUT | `/:id` | `Backend_Fintech/src/app/modules/merchant-users/routes/merchant-user.routes.ts` |
| POST | `/:id/activate` | `Backend_Fintech/src/app/modules/merchant-users/routes/merchant-user.routes.ts` |
| POST | `/:id/deactivate` | `Backend_Fintech/src/app/modules/merchant-users/routes/merchant-user.routes.ts` |
| PUT | `/:id/role` | `Backend_Fintech/src/app/modules/merchant-users/routes/merchant-user.routes.ts` |
| PUT | `/:id/outlets` | `Backend_Fintech/src/app/modules/merchant-users/routes/merchant-user.routes.ts` |
| POST | `/:id/reset-password` | `Backend_Fintech/src/app/modules/merchant-users/routes/merchant-user.routes.ts` |

### Module: `notifications`

| Artifact | Location |
|----------|----------|
| Controller | `Backend_Fintech/src/app/modules/notifications/controllers/notification.controller.ts` |
| Service | `Backend_Fintech/src/app/modules/notifications/services/notification-dispatch.service.ts` |
| Repository | `Backend_Fintech/src/app/modules/notifications/repositories/notification.repository.ts` |
| Routes | `Backend_Fintech/src/app/modules/notifications/routes/notification.routes.ts` |
| Frontend API service | `Frontend_Fintech/src/app/features/notifications/services/notifications-api.service.ts` |
| FR IDs | FR-NOT-001, FR-NOT-002 |
| Integration test | Backend_Fintech/src/__tests__/integration/notifications.integration.test.ts |
| E2E spec | NOT VERIFIED |
| Product module doc | [Modules](../01_Product/Modules/) |

| Method | Route fragment | Route file |
|--------|----------------|------------|
| GET | `/` | `Backend_Fintech/src/app/modules/notifications/routes/notification.routes.ts` |
| GET | `/unread-count` | `Backend_Fintech/src/app/modules/notifications/routes/notification.routes.ts` |
| PATCH | `/read-all` | `Backend_Fintech/src/app/modules/notifications/routes/notification.routes.ts` |
| PATCH | `/archive-all` | `Backend_Fintech/src/app/modules/notifications/routes/notification.routes.ts` |
| GET | `/templates` | `Backend_Fintech/src/app/modules/notifications/routes/notification.routes.ts` |
| POST | `/templates` | `Backend_Fintech/src/app/modules/notifications/routes/notification.routes.ts` |
| GET | `/templates/:id` | `Backend_Fintech/src/app/modules/notifications/routes/notification.routes.ts` |
| PUT | `/templates/:id` | `Backend_Fintech/src/app/modules/notifications/routes/notification.routes.ts` |
| DELETE | `/templates/:id` | `Backend_Fintech/src/app/modules/notifications/routes/notification.routes.ts` |
| GET | `/broadcasts` | `Backend_Fintech/src/app/modules/notifications/routes/notification.routes.ts` |
| POST | `/broadcasts` | `Backend_Fintech/src/app/modules/notifications/routes/notification.routes.ts` |
| GET | `/campaigns` | `Backend_Fintech/src/app/modules/notifications/routes/notification.routes.ts` |
| POST | `/campaigns` | `Backend_Fintech/src/app/modules/notifications/routes/notification.routes.ts` |
| GET | `/campaigns/:id` | `Backend_Fintech/src/app/modules/notifications/routes/notification.routes.ts` |
| PUT | `/campaigns/:id` | `Backend_Fintech/src/app/modules/notifications/routes/notification.routes.ts` |
| DELETE | `/campaigns/:id` | `Backend_Fintech/src/app/modules/notifications/routes/notification.routes.ts` |
| GET | `/templates/:id/variables` | `Backend_Fintech/src/app/modules/notifications/routes/notification.routes.ts` |
| GET | `/channels` | `Backend_Fintech/src/app/modules/notifications/routes/notification.routes.ts` |
| GET | `/events` | `Backend_Fintech/src/app/modules/notifications/routes/notification.routes.ts` |
| GET | `/groups` | `Backend_Fintech/src/app/modules/notifications/routes/notification.routes.ts` |
| GET | `/:id` | `Backend_Fintech/src/app/modules/notifications/routes/notification.routes.ts` |
| PATCH | `/:id/read` | `Backend_Fintech/src/app/modules/notifications/routes/notification.routes.ts` |
| PATCH | `/:id/archive` | `Backend_Fintech/src/app/modules/notifications/routes/notification.routes.ts` |
| DELETE | `/:id` | `Backend_Fintech/src/app/modules/notifications/routes/notification.routes.ts` |

### Module: `onboarding-approval`

| Artifact | Location |
|----------|----------|
| Controller | `Backend_Fintech/src/app/modules/onboarding-approval/controllers/approval.controller.ts` |
| Service | `Backend_Fintech/src/app/modules/onboarding-approval/services/go-live-promotion.service.ts` |
| Repository | `Backend_Fintech/src/app/modules/onboarding-approval/repositories/approval.repository.ts` |
| Routes | `Backend_Fintech/src/app/modules/onboarding-approval/routes/approval.routes.ts` |
| Frontend API service | `Frontend_Fintech/src/app/features/onboarding-approval/services/onboarding-approval-api.service.ts` |
| FR IDs | NOT VERIFIED |
| Integration test | NOT VERIFIED |
| E2E spec | NOT VERIFIED |
| Product module doc | NOT VERIFIED |

| Method | Route fragment | Route file |
|--------|----------------|------------|
| GET | `/stages` | `Backend_Fintech/src/app/modules/onboarding-approval/routes/approval.routes.ts` |
| GET | `/dashboard-stats` | `Backend_Fintech/src/app/modules/onboarding-approval/routes/approval.routes.ts` |
| GET | `/compliance-queue` | `Backend_Fintech/src/app/modules/onboarding-approval/routes/approval.routes.ts` |
| POST | `/compliance-queue/bulk-assign` | `Backend_Fintech/src/app/modules/onboarding-approval/routes/approval.routes.ts` |
| GET | `/:applicationId/workflow` | `Backend_Fintech/src/app/modules/onboarding-approval/routes/approval.routes.ts` |
| POST | `/:applicationId/workflow/start` | `Backend_Fintech/src/app/modules/onboarding-approval/routes/approval.routes.ts` |
| POST | `/:applicationId/approve` | `Backend_Fintech/src/app/modules/onboarding-approval/routes/approval.routes.ts` |
| POST | `/:applicationId/reject` | `Backend_Fintech/src/app/modules/onboarding-approval/routes/approval.routes.ts` |
| POST | `/:applicationId/send-back` | `Backend_Fintech/src/app/modules/onboarding-approval/routes/approval.routes.ts` |
| POST | `/:applicationId/reassign` | `Backend_Fintech/src/app/modules/onboarding-approval/routes/approval.routes.ts` |
| POST | `/:applicationId/skip-stage` | `Backend_Fintech/src/app/modules/onboarding-approval/routes/approval.routes.ts` |
| POST | `/:applicationId/go-live` | `Backend_Fintech/src/app/modules/onboarding-approval/routes/approval.routes.ts` |
| POST | `/:applicationId/suspend` | `Backend_Fintech/src/app/modules/onboarding-approval/routes/approval.routes.ts` |
| POST | `/:applicationId/activate` | `Backend_Fintech/src/app/modules/onboarding-approval/routes/approval.routes.ts` |
| GET | `/:applicationId/risk` | `Backend_Fintech/src/app/modules/onboarding-approval/routes/approval.routes.ts` |
| PUT | `/:applicationId/risk` | `Backend_Fintech/src/app/modules/onboarding-approval/routes/approval.routes.ts` |
| GET | `/:applicationId/kyc` | `Backend_Fintech/src/app/modules/onboarding-approval/routes/approval.routes.ts` |
| POST | `/:applicationId/kyc/:documentId/decision` | `Backend_Fintech/src/app/modules/onboarding-approval/routes/approval.routes.ts` |

### Module: `operations`

| Artifact | Location |
|----------|----------|
| Controller | `Backend_Fintech/src/app/modules/operations/controllers/operations.controller.ts` |
| Service | `Backend_Fintech/src/app/modules/operations/services/operations.service.ts` |
| Repository | `Backend_Fintech/src/app/modules/operations/repositories/operations.repository.ts` |
| Routes | `Backend_Fintech/src/app/modules/operations/routes/operations.routes.ts` |
| Frontend API service | `Frontend_Fintech/src/app/features/operations/services/operations-api.service.ts` |
| FR IDs | FR-OPS-001, FR-OPS-002 |
| Integration test | NOT VERIFIED |
| E2E spec | NOT VERIFIED |
| Product module doc | NOT VERIFIED |

| Method | Route fragment | Route file |
|--------|----------------|------------|
| GET | `/dashboard` | `Backend_Fintech/src/app/modules/operations/routes/operations.routes.ts` |
| GET | `/queues` | `Backend_Fintech/src/app/modules/operations/routes/operations.routes.ts` |
| GET | `/dead-letter-queue` | `Backend_Fintech/src/app/modules/operations/routes/operations.routes.ts` |
| GET | `/maintenance` | `Backend_Fintech/src/app/modules/operations/routes/operations.routes.ts` |
| PUT | `/maintenance` | `Backend_Fintech/src/app/modules/operations/routes/operations.routes.ts` |
| GET | `/deployments` | `Backend_Fintech/src/app/modules/operations/routes/operations.routes.ts` |
| GET | `/pending-tasks` | `Backend_Fintech/src/app/modules/operations/routes/operations.routes.ts` |
| GET | `/health` | `Backend_Fintech/src/app/modules/operations/routes/operations.routes.ts` |
| GET | `/alerts` | `Backend_Fintech/src/app/modules/operations/routes/operations.routes.ts` |
| GET | `/incidents` | `Backend_Fintech/src/app/modules/operations/routes/operations.routes.ts` |
| GET | `/retry-queue` | `Backend_Fintech/src/app/modules/operations/routes/operations.routes.ts` |
| GET | `/jobs` | `Backend_Fintech/src/app/modules/operations/routes/operations.routes.ts` |
| GET | `/failed-payments` | `Backend_Fintech/src/app/modules/operations/routes/operations.routes.ts` |
| GET | `/failed-payouts` | `Backend_Fintech/src/app/modules/operations/routes/operations.routes.ts` |
| GET | `/failed-webhooks` | `Backend_Fintech/src/app/modules/operations/routes/operations.routes.ts` |
| POST | `/alerts/:id/acknowledge` | `Backend_Fintech/src/app/modules/operations/routes/operations.routes.ts` |
| POST | `/alerts/:id/resolve` | `Backend_Fintech/src/app/modules/operations/routes/operations.routes.ts` |
| POST | `/retry-queue/:id/retry` | `Backend_Fintech/src/app/modules/operations/routes/operations.routes.ts` |
| POST | `/jobs/:id/retry` | `Backend_Fintech/src/app/modules/operations/routes/operations.routes.ts` |

### Module: `organizations`

| Artifact | Location |
|----------|----------|
| Controller | `Backend_Fintech/src/app/modules/organizations/controllers/organization.controller.ts` |
| Service | `Backend_Fintech/src/app/modules/organizations/services/organization.service.ts` |
| Repository | `Backend_Fintech/src/app/modules/organizations/repositories/organization.repository.ts` |
| Routes | `Backend_Fintech/src/app/modules/organizations/routes/organization.routes.ts` |
| Frontend API service | `Frontend_Fintech/src/app/features/organizations/services/organizations-api.service.ts` |
| FR IDs | FR-SET-001 |
| Integration test | Backend_Fintech/src/__tests__/integration/developer-sandbox.integration.test.ts; Backend_Fintech/src/__tests__/integration/users.integration.test.ts |
| E2E spec | NOT VERIFIED |
| Product module doc | NOT VERIFIED |

| Method | Route fragment | Route file |
|--------|----------------|------------|
| GET | `/mine` | `Backend_Fintech/src/app/modules/organizations/routes/organization.routes.ts` |
| GET | `/roles` | `Backend_Fintech/src/app/modules/organizations/routes/organization.routes.ts` |
| GET | `/` | `Backend_Fintech/src/app/modules/organizations/routes/organization.routes.ts` |
| POST | `/` | `Backend_Fintech/src/app/modules/organizations/routes/organization.routes.ts` |
| GET | `/:id` | `Backend_Fintech/src/app/modules/organizations/routes/organization.routes.ts` |
| PUT | `/:id` | `Backend_Fintech/src/app/modules/organizations/routes/organization.routes.ts` |
| PATCH | `/:id/status` | `Backend_Fintech/src/app/modules/organizations/routes/organization.routes.ts` |
| POST | `/:id/archive` | `Backend_Fintech/src/app/modules/organizations/routes/organization.routes.ts` |
| POST | `/:id/restore` | `Backend_Fintech/src/app/modules/organizations/routes/organization.routes.ts` |
| GET | `/:id/members` | `Backend_Fintech/src/app/modules/organizations/routes/organization.routes.ts` |
| POST | `/:id/members` | `Backend_Fintech/src/app/modules/organizations/routes/organization.routes.ts` |
| PUT | `/:id/members/:memberId` | `Backend_Fintech/src/app/modules/organizations/routes/organization.routes.ts` |
| DELETE | `/:id/members/:memberId` | `Backend_Fintech/src/app/modules/organizations/routes/organization.routes.ts` |
| GET | `/:id/domains` | `Backend_Fintech/src/app/modules/organizations/routes/organization.routes.ts` |
| POST | `/:id/domains` | `Backend_Fintech/src/app/modules/organizations/routes/organization.routes.ts` |
| PUT | `/:id/domains/:domainId` | `Backend_Fintech/src/app/modules/organizations/routes/organization.routes.ts` |
| DELETE | `/:id/domains/:domainId` | `Backend_Fintech/src/app/modules/organizations/routes/organization.routes.ts` |
| GET | `/:id/branding` | `Backend_Fintech/src/app/modules/organizations/routes/organization.routes.ts` |
| PUT | `/:id/branding` | `Backend_Fintech/src/app/modules/organizations/routes/organization.routes.ts` |
| GET | `/:id/preferences` | `Backend_Fintech/src/app/modules/organizations/routes/organization.routes.ts` |
| PUT | `/:id/preferences` | `Backend_Fintech/src/app/modules/organizations/routes/organization.routes.ts` |
| GET | `/:id/api-keys` | `Backend_Fintech/src/app/modules/organizations/routes/organization.routes.ts` |
| POST | `/:id/api-keys` | `Backend_Fintech/src/app/modules/organizations/routes/organization.routes.ts` |
| DELETE | `/:id/api-keys/:keyId` | `Backend_Fintech/src/app/modules/organizations/routes/organization.routes.ts` |
| GET | `/:id/billing` | `Backend_Fintech/src/app/modules/organizations/routes/organization.routes.ts` |
| PUT | `/:id/billing` | `Backend_Fintech/src/app/modules/organizations/routes/organization.routes.ts` |

### Module: `outlets`

| Artifact | Location |
|----------|----------|
| Controller | `Backend_Fintech/src/app/modules/outlets/controllers/outlet.controller.ts` |
| Service | `Backend_Fintech/src/app/modules/outlets/services/outlet.service.ts` |
| Repository | `Backend_Fintech/src/app/modules/outlets/repositories/outlet.repository.ts` |
| Routes | `Backend_Fintech/src/app/modules/outlets/routes/outlet.routes.ts` |
| Frontend API service | `Frontend_Fintech/src/app/features/outlets/services/outlets-api.service.ts` |
| FR IDs | FR-MER-006 |
| Integration test | NOT VERIFIED |
| E2E spec | NOT VERIFIED |
| Product module doc | NOT VERIFIED |

| Method | Route fragment | Route file |
|--------|----------------|------------|
| GET | `/` | `Backend_Fintech/src/app/modules/outlets/routes/outlet.routes.ts` |
| POST | `/` | `Backend_Fintech/src/app/modules/outlets/routes/outlet.routes.ts` |
| GET | `/:id` | `Backend_Fintech/src/app/modules/outlets/routes/outlet.routes.ts` |
| PUT | `/:id` | `Backend_Fintech/src/app/modules/outlets/routes/outlet.routes.ts` |
| POST | `/:id/activate` | `Backend_Fintech/src/app/modules/outlets/routes/outlet.routes.ts` |
| POST | `/:id/deactivate` | `Backend_Fintech/src/app/modules/outlets/routes/outlet.routes.ts` |

### Module: `payment-config`

| Artifact | Location |
|----------|----------|
| Controller | `Backend_Fintech/src/app/modules/payment-config/controllers/payment-config.controller.ts` |
| Service | `Backend_Fintech/src/app/modules/payment-config/services/payment-config.service.ts` |
| Repository | `Backend_Fintech/src/app/modules/payment-config/repositories/payment-config.repository.ts` |
| Routes | `Backend_Fintech/src/app/modules/payment-config/routes/payment-config.routes.ts` |
| Frontend API service | `NOT VERIFIED` |
| FR IDs | NOT VERIFIED |
| Integration test | NOT VERIFIED |
| E2E spec | NOT VERIFIED |
| Product module doc | NOT VERIFIED |

| Method | Route fragment | Route file |
|--------|----------------|------------|
| GET | `/limits` | `Backend_Fintech/src/app/modules/payment-config/routes/payment-config.routes.ts` |
| POST | `/limits` | `Backend_Fintech/src/app/modules/payment-config/routes/payment-config.routes.ts` |
| GET | `/merchants/:merchantId` | `Backend_Fintech/src/app/modules/payment-config/routes/payment-config.routes.ts` |
| PUT | `/merchants/:merchantId` | `Backend_Fintech/src/app/modules/payment-config/routes/payment-config.routes.ts` |

### Module: `payment-links`

| Artifact | Location |
|----------|----------|
| Controller | `Backend_Fintech/src/app/modules/payment-links/controllers/payment-link.controller.ts` |
| Service | `Backend_Fintech/src/app/modules/payment-links/services/payment-link.service.ts` |
| Repository | `Backend_Fintech/src/app/modules/payment-links/repositories/payment-link.repository.ts` |
| Routes | `Backend_Fintech/src/app/modules/payment-links/routes/payment-link.routes.ts` |
| Frontend API service | `Frontend_Fintech/src/app/features/payment-links/services/payment-links-api.service.ts` |
| FR IDs | FR-PL-001, FR-PL-002 |
| Integration test | Backend_Fintech/src/__tests__/integration/qr-payment-links.integration.test.ts |
| E2E spec | NOT VERIFIED |
| Product module doc | [Modules](../01_Product/Modules/) |

| Method | Route fragment | Route file |
|--------|----------------|------------|
| GET | `/statistics` | `Backend_Fintech/src/app/modules/payment-links/routes/payment-link.routes.ts` |
| GET | `/` | `Backend_Fintech/src/app/modules/payment-links/routes/payment-link.routes.ts` |
| POST | `/` | `Backend_Fintech/src/app/modules/payment-links/routes/payment-link.routes.ts` |
| GET | `/:id/analytics` | `Backend_Fintech/src/app/modules/payment-links/routes/payment-link.routes.ts` |
| GET | `/:id/visits` | `Backend_Fintech/src/app/modules/payment-links/routes/payment-link.routes.ts` |
| POST | `/:id/clone` | `Backend_Fintech/src/app/modules/payment-links/routes/payment-link.routes.ts` |
| GET | `/:id/qr` | `Backend_Fintech/src/app/modules/payment-links/routes/payment-link.routes.ts` |
| POST | `/:id/enable` | `Backend_Fintech/src/app/modules/payment-links/routes/payment-link.routes.ts` |
| POST | `/:id/disable` | `Backend_Fintech/src/app/modules/payment-links/routes/payment-link.routes.ts` |
| POST | `/:id/expire` | `Backend_Fintech/src/app/modules/payment-links/routes/payment-link.routes.ts` |
| POST | `/:id/regenerate-token` | `Backend_Fintech/src/app/modules/payment-links/routes/payment-link.routes.ts` |
| GET | `/:id` | `Backend_Fintech/src/app/modules/payment-links/routes/payment-link.routes.ts` |
| PUT | `/:id` | `Backend_Fintech/src/app/modules/payment-links/routes/payment-link.routes.ts` |
| GET | `/:token` | `Backend_Fintech/src/app/modules/payment-links/routes/public-payment-link.routes.ts` |
| POST | `/:token/pay` | `Backend_Fintech/src/app/modules/payment-links/routes/public-payment-link.routes.ts` |

### Module: `payments`

| Artifact | Location |
|----------|----------|
| Controller | `Backend_Fintech/src/app/modules/payments/controllers/payment.controller.ts` |
| Service | `Backend_Fintech/src/app/modules/payments/services/payment-engine.service.ts` |
| Repository | `Backend_Fintech/src/app/modules/payments/repositories/payment.repository.ts` |
| Routes | `Backend_Fintech/src/app/modules/payments/routes/payment.routes.ts` |
| Frontend API service | `NOT VERIFIED` |
| FR IDs | FR-PAY-001, FR-PAY-002, FR-PAY-003, FR-PAY-004, FR-PAY-005, FR-PAY-006, FR-PAY-007 |
| Integration test | Backend_Fintech/src/__tests__/integration/chargebacks-refunds.integration.test.ts; Backend_Fintech/src/__tests__/integration/concurrency.integration.test.ts; Backend_Fintech/src/__tests__/integration/negative.integration.test.ts; Backend_Fintech/src/__tests__/integration/payment-transactions.integration.test.ts; Backend_Fintech/src/__tests__/integration/payments.integration.test.ts |
| E2E spec | e2e/tests/payments.spec.ts |
| Product module doc | [Modules](../01_Product/Modules/) |

| Method | Route fragment | Route file |
|--------|----------------|------------|
| GET | `/webhooks/deliveries` | `Backend_Fintech/src/app/modules/payments/routes/payment.routes.ts` |
| GET | `/orders` | `Backend_Fintech/src/app/modules/payments/routes/payment.routes.ts` |
| GET | `/orders/:id` | `Backend_Fintech/src/app/modules/payments/routes/payment.routes.ts` |
| POST | `/sessions` | `Backend_Fintech/src/app/modules/payments/routes/payment.routes.ts` |
| GET | `/sessions/:id` | `Backend_Fintech/src/app/modules/payments/routes/payment.routes.ts` |
| GET | `/merchant-config/:merchantId` | `Backend_Fintech/src/app/modules/payments/routes/payment.routes.ts` |
| GET | `/customers/:customerId/profile` | `Backend_Fintech/src/app/modules/payments/routes/payment.routes.ts` |
| GET | `/` | `Backend_Fintech/src/app/modules/payments/routes/payment.routes.ts` |
| POST | `/` | `Backend_Fintech/src/app/modules/payments/routes/payment.routes.ts` |
| GET | `/:id` | `Backend_Fintech/src/app/modules/payments/routes/payment.routes.ts` |
| GET | `/:id/timeline` | `Backend_Fintech/src/app/modules/payments/routes/payment.routes.ts` |
| POST | `/:id/authorize` | `Backend_Fintech/src/app/modules/payments/routes/payment.routes.ts` |
| POST | `/:id/capture` | `Backend_Fintech/src/app/modules/payments/routes/payment.routes.ts` |
| POST | `/:id/cancel` | `Backend_Fintech/src/app/modules/payments/routes/payment.routes.ts` |
| POST | `/:id/refund` | `Backend_Fintech/src/app/modules/payments/routes/payment.routes.ts` |
| POST | `/:id/retry` | `Backend_Fintech/src/app/modules/payments/routes/payment.routes.ts` |
| POST | `/:id/expire` | `Backend_Fintech/src/app/modules/payments/routes/payment.routes.ts` |

### Module: `payouts`

| Artifact | Location |
|----------|----------|
| Controller | `Backend_Fintech/src/app/modules/payouts/controllers/payout.controller.ts` |
| Service | `Backend_Fintech/src/app/modules/payouts/services/payout.service.ts` |
| Repository | `Backend_Fintech/src/app/modules/payouts/repositories/payout.repository.ts` |
| Routes | `Backend_Fintech/src/app/modules/payouts/routes/payout.routes.ts` |
| Frontend API service | `Frontend_Fintech/src/app/features/payouts/services/payouts-api.service.ts` |
| FR IDs | FR-PAYT-001, FR-PAYT-002 |
| Integration test | NOT VERIFIED |
| E2E spec | NOT VERIFIED |
| Product module doc | NOT VERIFIED |

| Method | Route fragment | Route file |
|--------|----------------|------------|
| GET | `/statistics` | `Backend_Fintech/src/app/modules/payouts/routes/payout.routes.ts` |
| GET | `/bank-accounts` | `Backend_Fintech/src/app/modules/payouts/routes/payout.routes.ts` |
| POST | `/bank-accounts` | `Backend_Fintech/src/app/modules/payouts/routes/payout.routes.ts` |
| PATCH | `/bank-accounts/:id` | `Backend_Fintech/src/app/modules/payouts/routes/payout.routes.ts` |
| GET | `/` | `Backend_Fintech/src/app/modules/payouts/routes/payout.routes.ts` |
| POST | `/` | `Backend_Fintech/src/app/modules/payouts/routes/payout.routes.ts` |
| GET | `/:id/history` | `Backend_Fintech/src/app/modules/payouts/routes/payout.routes.ts` |
| POST | `/:id/approve` | `Backend_Fintech/src/app/modules/payouts/routes/payout.routes.ts` |
| POST | `/:id/reject` | `Backend_Fintech/src/app/modules/payouts/routes/payout.routes.ts` |
| POST | `/:id/retry` | `Backend_Fintech/src/app/modules/payouts/routes/payout.routes.ts` |
| GET | `/:id` | `Backend_Fintech/src/app/modules/payouts/routes/payout.routes.ts` |

### Module: `permissions`

| Artifact | Location |
|----------|----------|
| Controller | `Backend_Fintech/src/app/modules/permissions/controllers/permission.controller.ts` |
| Service | `Backend_Fintech/src/app/modules/permissions/services/permission.service.ts` |
| Repository | `Backend_Fintech/src/app/modules/permissions/repositories/permission.repository.ts` |
| Routes | `Backend_Fintech/src/app/modules/permissions/routes/permission.routes.ts` |
| Frontend API service | `Frontend_Fintech/src/app/features/permissions/services/permission-api.service.ts` |
| FR IDs | FR-USR-003 |
| Integration test | NOT VERIFIED |
| E2E spec | NOT VERIFIED |
| Product module doc | NOT VERIFIED |

| Method | Route fragment | Route file |
|--------|----------------|------------|
| GET | `/` | `Backend_Fintech/src/app/modules/permissions/routes/permission.routes.ts` |

### Module: `pricing`

| Artifact | Location |
|----------|----------|
| Controller | `Backend_Fintech/src/app/modules/pricing/controllers/pricing.controller.ts` |
| Service | `Backend_Fintech/src/app/modules/pricing/services/pricing.service.ts` |
| Repository | `Backend_Fintech/src/app/modules/pricing/repositories/pricing.repository.ts` |
| Routes | `Backend_Fintech/src/app/modules/pricing/routes/pricing.routes.ts` |
| Frontend API service | `NOT VERIFIED` |
| FR IDs | NOT VERIFIED |
| Integration test | NOT VERIFIED |
| E2E spec | NOT VERIFIED |
| Product module doc | NOT VERIFIED |

| Method | Route fragment | Route file |
|--------|----------------|------------|
| GET | `/` | `Backend_Fintech/src/app/modules/pricing/routes/pricing.routes.ts` |
| POST | `/` | `Backend_Fintech/src/app/modules/pricing/routes/pricing.routes.ts` |
| GET | `/:id` | `Backend_Fintech/src/app/modules/pricing/routes/pricing.routes.ts` |

### Module: `qr-payments`

| Artifact | Location |
|----------|----------|
| Controller | `Backend_Fintech/src/app/modules/qr-payments/controllers/qr-payment.controller.ts` |
| Service | `Backend_Fintech/src/app/modules/qr-payments/services/qr-payment.service.ts` |
| Repository | `Backend_Fintech/src/app/modules/qr-payments/repositories/qr-payment.repository.ts` |
| Routes | `Backend_Fintech/src/app/modules/qr-payments/routes/qr-payment.routes.ts` |
| Frontend API service | `Frontend_Fintech/src/app/features/qr-payments/services/qr-payments-api.service.ts` |
| FR IDs | FR-QR-001, FR-QR-002 |
| Integration test | Backend_Fintech/src/__tests__/integration/qr-payment-links.integration.test.ts |
| E2E spec | NOT VERIFIED |
| Product module doc | [Modules](../01_Product/Modules/) |

| Method | Route fragment | Route file |
|--------|----------------|------------|
| GET | `/templates` | `Backend_Fintech/src/app/modules/qr-payments/routes/qr-payment.routes.ts` |
| GET | `/categories` | `Backend_Fintech/src/app/modules/qr-payments/routes/qr-payment.routes.ts` |
| POST | `/bulk` | `Backend_Fintech/src/app/modules/qr-payments/routes/qr-payment.routes.ts` |
| GET | `/statistics` | `Backend_Fintech/src/app/modules/qr-payments/routes/qr-payment.routes.ts` |
| GET | `/` | `Backend_Fintech/src/app/modules/qr-payments/routes/qr-payment.routes.ts` |
| POST | `/` | `Backend_Fintech/src/app/modules/qr-payments/routes/qr-payment.routes.ts` |
| GET | `/:id/download/svg` | `Backend_Fintech/src/app/modules/qr-payments/routes/qr-payment.routes.ts` |
| GET | `/:id/download` | `Backend_Fintech/src/app/modules/qr-payments/routes/qr-payment.routes.ts` |
| GET | `/:id/scan-history` | `Backend_Fintech/src/app/modules/qr-payments/routes/qr-payment.routes.ts` |
| POST | `/:id/clone` | `Backend_Fintech/src/app/modules/qr-payments/routes/qr-payment.routes.ts` |
| POST | `/:id/archive` | `Backend_Fintech/src/app/modules/qr-payments/routes/qr-payment.routes.ts` |
| POST | `/:id/enable` | `Backend_Fintech/src/app/modules/qr-payments/routes/qr-payment.routes.ts` |
| POST | `/:id/disable` | `Backend_Fintech/src/app/modules/qr-payments/routes/qr-payment.routes.ts` |
| POST | `/:id/regenerate` | `Backend_Fintech/src/app/modules/qr-payments/routes/qr-payment.routes.ts` |
| GET | `/:id` | `Backend_Fintech/src/app/modules/qr-payments/routes/qr-payment.routes.ts` |
| PUT | `/:id` | `Backend_Fintech/src/app/modules/qr-payments/routes/qr-payment.routes.ts` |
| GET | `/:token` | `Backend_Fintech/src/app/modules/qr-payments/routes/qr-payment.routes.ts` |
| POST | `/:token/pay` | `Backend_Fintech/src/app/modules/qr-payments/routes/qr-payment.routes.ts` |

### Module: `reconciliation`

| Artifact | Location |
|----------|----------|
| Controller | `Backend_Fintech/src/app/modules/reconciliation/controllers/reconciliation.controller.ts` |
| Service | `Backend_Fintech/src/app/modules/reconciliation/services/reconciliation.service.ts` |
| Repository | `Backend_Fintech/src/app/modules/reconciliation/repositories/reconciliation.repository.ts` |
| Routes | `Backend_Fintech/src/app/modules/reconciliation/routes/reconciliation.routes.ts` |
| Frontend API service | `Frontend_Fintech/src/app/features/reconciliation/services/reconciliation-api.service.ts` |
| FR IDs | FR-REC-001 |
| Integration test | NOT VERIFIED |
| E2E spec | NOT VERIFIED |
| Product module doc | NOT VERIFIED |

| Method | Route fragment | Route file |
|--------|----------------|------------|
| GET | `/dashboard` | `Backend_Fintech/src/app/modules/reconciliation/routes/reconciliation.routes.ts` |
| GET | `/imports` | `Backend_Fintech/src/app/modules/reconciliation/routes/reconciliation.routes.ts` |
| POST | `/imports` | `Backend_Fintech/src/app/modules/reconciliation/routes/reconciliation.routes.ts` |
| GET | `/imports/:id` | `Backend_Fintech/src/app/modules/reconciliation/routes/reconciliation.routes.ts` |
| PUT | `/imports/:id` | `Backend_Fintech/src/app/modules/reconciliation/routes/reconciliation.routes.ts` |
| DELETE | `/imports/:id` | `Backend_Fintech/src/app/modules/reconciliation/routes/reconciliation.routes.ts` |
| POST | `/imports/:importId/records` | `Backend_Fintech/src/app/modules/reconciliation/routes/reconciliation.routes.ts` |
| GET | `/records` | `Backend_Fintech/src/app/modules/reconciliation/routes/reconciliation.routes.ts` |
| GET | `/records/:id` | `Backend_Fintech/src/app/modules/reconciliation/routes/reconciliation.routes.ts` |
| POST | `/records/:id/match` | `Backend_Fintech/src/app/modules/reconciliation/routes/reconciliation.routes.ts` |

### Module: `refunds`

| Artifact | Location |
|----------|----------|
| Controller | `Backend_Fintech/src/app/modules/refunds/controllers/refund.controller.ts` |
| Service | `Backend_Fintech/src/app/modules/refunds/services/refund.service.ts` |
| Repository | `Backend_Fintech/src/app/modules/refunds/repositories/refund.repository.ts` |
| Routes | `Backend_Fintech/src/app/modules/refunds/routes/refund.routes.ts` |
| Frontend API service | `Frontend_Fintech/src/app/features/refunds/services/refunds-api.service.ts` |
| FR IDs | FR-REF-001, FR-REF-002, FR-REF-003 |
| Integration test | Backend_Fintech/src/__tests__/integration/chargebacks-refunds.integration.test.ts |
| E2E spec | NOT VERIFIED |
| Product module doc | [Modules](../01_Product/Modules/) |

| Method | Route fragment | Route file |
|--------|----------------|------------|
| GET | `/statistics` | `Backend_Fintech/src/app/modules/refunds/routes/refund.routes.ts` |
| GET | `/` | `Backend_Fintech/src/app/modules/refunds/routes/refund.routes.ts` |
| POST | `/` | `Backend_Fintech/src/app/modules/refunds/routes/refund.routes.ts` |
| GET | `/:id/history` | `Backend_Fintech/src/app/modules/refunds/routes/refund.routes.ts` |
| GET | `/:id` | `Backend_Fintech/src/app/modules/refunds/routes/refund.routes.ts` |
| POST | `/:id/approve` | `Backend_Fintech/src/app/modules/refunds/routes/refund.routes.ts` |
| POST | `/:id/reject` | `Backend_Fintech/src/app/modules/refunds/routes/refund.routes.ts` |

### Module: `reports`

| Artifact | Location |
|----------|----------|
| Controller | `Backend_Fintech/src/app/modules/reports/controllers/report-center.controller.ts` |
| Service | `Backend_Fintech/src/app/modules/reports/services/report-center.service.ts` |
| Repository | `Backend_Fintech/src/app/modules/reports/repositories/report-center.repository.ts` |
| Routes | `Backend_Fintech/src/app/modules/reports/routes/analytics.routes.ts` |
| Frontend API service | `Frontend_Fintech/src/app/features/reports/services/reports-api.service.ts` |
| FR IDs | FR-RPT-001, FR-RPT-002, FR-RPT-003 |
| Integration test | Backend_Fintech/src/__tests__/integration/reports-audit.integration.test.ts |
| E2E spec | e2e/tests/reports.spec.ts |
| Product module doc | [Modules](../01_Product/Modules/) |

| Method | Route fragment | Route file |
|--------|----------------|------------|
| GET | `/overview` | `Backend_Fintech/src/app/modules/reports/routes/analytics.routes.ts` |
| GET | `/revenue` | `Backend_Fintech/src/app/modules/reports/routes/analytics.routes.ts` |
| GET | `/transactions` | `Backend_Fintech/src/app/modules/reports/routes/analytics.routes.ts` |
| GET | `/settlements` | `Backend_Fintech/src/app/modules/reports/routes/analytics.routes.ts` |
| GET | `/merchants` | `Backend_Fintech/src/app/modules/reports/routes/analytics.routes.ts` |
| GET | `/customers` | `Backend_Fintech/src/app/modules/reports/routes/analytics.routes.ts` |
| GET | `/refunds` | `Backend_Fintech/src/app/modules/reports/routes/analytics.routes.ts` |
| GET | `/chargebacks` | `Backend_Fintech/src/app/modules/reports/routes/analytics.routes.ts` |
| GET | `/payouts` | `Backend_Fintech/src/app/modules/reports/routes/analytics.routes.ts` |
| GET | `/payment-links` | `Backend_Fintech/src/app/modules/reports/routes/analytics.routes.ts` |
| GET | `/invoices` | `Backend_Fintech/src/app/modules/reports/routes/analytics.routes.ts` |
| GET | `/qr-payments` | `Backend_Fintech/src/app/modules/reports/routes/analytics.routes.ts` |
| GET | `/subscriptions` | `Backend_Fintech/src/app/modules/reports/routes/analytics.routes.ts` |
| GET | `/support` | `Backend_Fintech/src/app/modules/reports/routes/analytics.routes.ts` |
| GET | `/operations` | `Backend_Fintech/src/app/modules/reports/routes/analytics.routes.ts` |
| GET | `/payment-methods` | `Backend_Fintech/src/app/modules/reports/routes/analytics.routes.ts` |
| GET | `/regional` | `Backend_Fintech/src/app/modules/reports/routes/analytics.routes.ts` |
| GET | `/export` | `Backend_Fintech/src/app/modules/reports/routes/analytics.routes.ts` |
| GET | `/center/catalog` | `Backend_Fintech/src/app/modules/reports/routes/reports.routes.ts` |
| GET | `/center/saved-filters` | `Backend_Fintech/src/app/modules/reports/routes/reports.routes.ts` |
| POST | `/center/saved-filters` | `Backend_Fintech/src/app/modules/reports/routes/reports.routes.ts` |
| DELETE | `/center/saved-filters/:id` | `Backend_Fintech/src/app/modules/reports/routes/reports.routes.ts` |
| POST | `/center/generate` | `Backend_Fintech/src/app/modules/reports/routes/reports.routes.ts` |
| POST | `/center/export` | `Backend_Fintech/src/app/modules/reports/routes/reports.routes.ts` |
| GET | `/center/export-history` | `Backend_Fintech/src/app/modules/reports/routes/reports.routes.ts` |
| GET | `/templates` | `Backend_Fintech/src/app/modules/reports/routes/reports.routes.ts` |
| GET | `/categories` | `Backend_Fintech/src/app/modules/reports/routes/reports.routes.ts` |
| GET | `/history` | `Backend_Fintech/src/app/modules/reports/routes/reports.routes.ts` |
| GET | `/scheduled` | `Backend_Fintech/src/app/modules/reports/routes/reports.routes.ts` |
| POST | `/scheduled` | `Backend_Fintech/src/app/modules/reports/routes/reports.routes.ts` |
| PUT | `/scheduled/:id` | `Backend_Fintech/src/app/modules/reports/routes/reports.routes.ts` |
| DELETE | `/scheduled/:id` | `Backend_Fintech/src/app/modules/reports/routes/reports.routes.ts` |
| POST | `/run` | `Backend_Fintech/src/app/modules/reports/routes/reports.routes.ts` |
| POST | `/export` | `Backend_Fintech/src/app/modules/reports/routes/reports.routes.ts` |
| GET | `/` | `Backend_Fintech/src/app/modules/reports/routes/reports.routes.ts` |
| POST | `/` | `Backend_Fintech/src/app/modules/reports/routes/reports.routes.ts` |
| GET | `/:id` | `Backend_Fintech/src/app/modules/reports/routes/reports.routes.ts` |
| PUT | `/:id` | `Backend_Fintech/src/app/modules/reports/routes/reports.routes.ts` |
| DELETE | `/:id` | `Backend_Fintech/src/app/modules/reports/routes/reports.routes.ts` |

### Module: `risk-rules`

| Artifact | Location |
|----------|----------|
| Controller | `Backend_Fintech/src/app/modules/risk-rules/controllers/risk-rule.controller.ts` |
| Service | `Backend_Fintech/src/app/modules/risk-rules/services/risk-rule.service.ts` |
| Repository | `Backend_Fintech/src/app/modules/risk-rules/repositories/risk-rule.repository.ts` |
| Routes | `Backend_Fintech/src/app/modules/risk-rules/routes/risk-rule.routes.ts` |
| Frontend API service | `Frontend_Fintech/src/app/features/risk-rules/services/risk-rules-api.service.ts` |
| FR IDs | NOT VERIFIED |
| Integration test | NOT VERIFIED |
| E2E spec | NOT VERIFIED |
| Product module doc | NOT VERIFIED |

| Method | Route fragment | Route file |
|--------|----------------|------------|
| GET | `/` | `Backend_Fintech/src/app/modules/risk-rules/routes/risk-rule.routes.ts` |
| POST | `/` | `Backend_Fintech/src/app/modules/risk-rules/routes/risk-rule.routes.ts` |
| GET | `/:id` | `Backend_Fintech/src/app/modules/risk-rules/routes/risk-rule.routes.ts` |
| PUT | `/:id` | `Backend_Fintech/src/app/modules/risk-rules/routes/risk-rule.routes.ts` |
| POST | `/:id/evaluate` | `Backend_Fintech/src/app/modules/risk-rules/routes/risk-rule.routes.ts` |

### Module: `roles`

| Artifact | Location |
|----------|----------|
| Controller | `Backend_Fintech/src/app/modules/roles/controllers/role.controller.ts` |
| Service | `Backend_Fintech/src/app/modules/roles/services/role.service.ts` |
| Repository | `Backend_Fintech/src/app/modules/roles/repositories/role.repository.ts` |
| Routes | `Backend_Fintech/src/app/modules/roles/routes/role.routes.ts` |
| Frontend API service | `Frontend_Fintech/src/app/features/roles/services/role-api.service.ts` |
| FR IDs | FR-USR-002 |
| Integration test | NOT VERIFIED |
| E2E spec | NOT VERIFIED |
| Product module doc | NOT VERIFIED |

| Method | Route fragment | Route file |
|--------|----------------|------------|
| GET | `/` | `Backend_Fintech/src/app/modules/roles/routes/role.routes.ts` |
| POST | `/` | `Backend_Fintech/src/app/modules/roles/routes/role.routes.ts` |
| GET | `/:id` | `Backend_Fintech/src/app/modules/roles/routes/role.routes.ts` |
| PUT | `/:id` | `Backend_Fintech/src/app/modules/roles/routes/role.routes.ts` |
| DELETE | `/:id` | `Backend_Fintech/src/app/modules/roles/routes/role.routes.ts` |
| PUT | `/:id/permissions` | `Backend_Fintech/src/app/modules/roles/routes/role.routes.ts` |

### Module: `sandbox`

| Artifact | Location |
|----------|----------|
| Controller | `Backend_Fintech/src/app/modules/sandbox/controllers/sandbox.controller.ts` |
| Service | `Backend_Fintech/src/app/modules/sandbox/services/sandbox.service.ts` |
| Repository | `Backend_Fintech/src/app/modules/sandbox/repositories/sandbox.repository.ts` |
| Routes | `Backend_Fintech/src/app/modules/sandbox/routes/sandbox.routes.ts` |
| Frontend API service | `Frontend_Fintech/src/app/features/sandbox/services/sandbox-api.service.ts` |
| FR IDs | FR-SBX-001, FR-SBX-002 |
| Integration test | Backend_Fintech/src/__tests__/integration/developer-sandbox.integration.test.ts |
| E2E spec | NOT VERIFIED |
| Product module doc | [Modules](../01_Product/Modules/) |

| Method | Route fragment | Route file |
|--------|----------------|------------|
| GET | `/dashboard` | `Backend_Fintech/src/app/modules/sandbox/routes/sandbox.routes.ts` |
| GET | `/accounts` | `Backend_Fintech/src/app/modules/sandbox/routes/sandbox.routes.ts` |
| POST | `/accounts` | `Backend_Fintech/src/app/modules/sandbox/routes/sandbox.routes.ts` |
| GET | `/accounts/:id` | `Backend_Fintech/src/app/modules/sandbox/routes/sandbox.routes.ts` |
| PUT | `/accounts/:id` | `Backend_Fintech/src/app/modules/sandbox/routes/sandbox.routes.ts` |
| DELETE | `/accounts/:id` | `Backend_Fintech/src/app/modules/sandbox/routes/sandbox.routes.ts` |
| GET | `/test-cards` | `Backend_Fintech/src/app/modules/sandbox/routes/sandbox.routes.ts` |
| GET | `/simulations` | `Backend_Fintech/src/app/modules/sandbox/routes/sandbox.routes.ts` |
| POST | `/simulations` | `Backend_Fintech/src/app/modules/sandbox/routes/sandbox.routes.ts` |
| GET | `/simulations/:id` | `Backend_Fintech/src/app/modules/sandbox/routes/sandbox.routes.ts` |
| PUT | `/simulations/:id` | `Backend_Fintech/src/app/modules/sandbox/routes/sandbox.routes.ts` |
| DELETE | `/simulations/:id` | `Backend_Fintech/src/app/modules/sandbox/routes/sandbox.routes.ts` |

### Module: `search`

| Artifact | Location |
|----------|----------|
| Controller | `Backend_Fintech/src/app/modules/search/controllers/search.controller.ts` |
| Service | `Backend_Fintech/src/app/modules/search/services/search.service.ts` |
| Repository | `Backend_Fintech/src/app/modules/search/repositories/search.repository.ts` |
| Routes | `Backend_Fintech/src/app/modules/search/routes/search.routes.ts` |
| Frontend API service | `NOT VERIFIED` |
| FR IDs | FR-SRC-001 |
| Integration test | NOT VERIFIED |
| E2E spec | NOT VERIFIED |
| Product module doc | NOT VERIFIED |

| Method | Route fragment | Route file |
|--------|----------------|------------|
| GET | `/` | `Backend_Fintech/src/app/modules/search/routes/search.routes.ts` |

### Module: `settings`

| Artifact | Location |
|----------|----------|
| Controller | `Backend_Fintech/src/app/modules/settings/controllers/settings.controller.ts` |
| Service | `Backend_Fintech/src/app/modules/settings/services/platform-config.service.ts` |
| Repository | `Backend_Fintech/src/app/modules/settings/repositories/platform-config.repository.ts` |
| Routes | `Backend_Fintech/src/app/modules/settings/routes/settings.routes.ts` |
| Frontend API service | `Frontend_Fintech/src/app/features/settings/services/system-api.service.ts` |
| FR IDs | FR-SET-001, FR-SET-002, FR-SET-003, FR-SET-004 |
| Integration test | NOT VERIFIED |
| E2E spec | NOT VERIFIED |
| Product module doc | NOT VERIFIED |

| Method | Route fragment | Route file |
|--------|----------------|------------|
| GET | `/public/branding` | `Backend_Fintech/src/app/modules/settings/routes/settings.routes.ts` |
| GET | `/public/feature-flags` | `Backend_Fintech/src/app/modules/settings/routes/settings.routes.ts` |
| GET | `/overview` | `Backend_Fintech/src/app/modules/settings/routes/settings.routes.ts` |
| GET | `/organization` | `Backend_Fintech/src/app/modules/settings/routes/settings.routes.ts` |
| PUT | `/organization` | `Backend_Fintech/src/app/modules/settings/routes/settings.routes.ts` |
| GET | `/branding` | `Backend_Fintech/src/app/modules/settings/routes/settings.routes.ts` |
| PUT | `/branding` | `Backend_Fintech/src/app/modules/settings/routes/settings.routes.ts` |
| GET | `/security` | `Backend_Fintech/src/app/modules/settings/routes/settings.routes.ts` |
| PUT | `/security` | `Backend_Fintech/src/app/modules/settings/routes/settings.routes.ts` |
| GET | `/password-policy` | `Backend_Fintech/src/app/modules/settings/routes/settings.routes.ts` |
| PUT | `/password-policy` | `Backend_Fintech/src/app/modules/settings/routes/settings.routes.ts` |
| GET | `/session` | `Backend_Fintech/src/app/modules/settings/routes/settings.routes.ts` |
| PUT | `/session` | `Backend_Fintech/src/app/modules/settings/routes/settings.routes.ts` |
| GET | `/notifications/me` | `Backend_Fintech/src/app/modules/settings/routes/settings.routes.ts` |
| PUT | `/notifications/me` | `Backend_Fintech/src/app/modules/settings/routes/settings.routes.ts` |
| GET | `/notifications/defaults` | `Backend_Fintech/src/app/modules/settings/routes/settings.routes.ts` |
| PUT | `/notifications/defaults` | `Backend_Fintech/src/app/modules/settings/routes/settings.routes.ts` |
| GET | `/configuration` | `Backend_Fintech/src/app/modules/settings/routes/settings.routes.ts` |
| PUT | `/configuration` | `Backend_Fintech/src/app/modules/settings/routes/settings.routes.ts` |
| GET | `/feature-flags` | `Backend_Fintech/src/app/modules/settings/routes/settings.routes.ts` |
| POST | `/feature-flags` | `Backend_Fintech/src/app/modules/settings/routes/settings.routes.ts` |
| GET | `/feature-flags/:id` | `Backend_Fintech/src/app/modules/settings/routes/settings.routes.ts` |
| PUT | `/feature-flags/:id` | `Backend_Fintech/src/app/modules/settings/routes/settings.routes.ts` |
| DELETE | `/feature-flags/:id` | `Backend_Fintech/src/app/modules/settings/routes/settings.routes.ts` |
| GET | `/api` | `Backend_Fintech/src/app/modules/settings/routes/settings.routes.ts` |
| PUT | `/api` | `Backend_Fintech/src/app/modules/settings/routes/settings.routes.ts` |
| GET | `/smtp` | `Backend_Fintech/src/app/modules/settings/routes/settings.routes.ts` |
| PUT | `/smtp` | `Backend_Fintech/src/app/modules/settings/routes/settings.routes.ts` |
| GET | `/storage` | `Backend_Fintech/src/app/modules/settings/routes/settings.routes.ts` |
| PUT | `/storage` | `Backend_Fintech/src/app/modules/settings/routes/settings.routes.ts` |
| GET | `/rate-limits` | `Backend_Fintech/src/app/modules/settings/routes/settings.routes.ts` |
| PUT | `/rate-limits` | `Backend_Fintech/src/app/modules/settings/routes/settings.routes.ts` |
| PUT | `/security/geo-login` | `Backend_Fintech/src/app/modules/settings/routes/settings.routes.ts` |
| GET | `/security/api-ip-restrictions` | `Backend_Fintech/src/app/modules/settings/routes/settings.routes.ts` |
| PUT | `/security/api-ip-restrictions` | `Backend_Fintech/src/app/modules/settings/routes/settings.routes.ts` |

### Module: `settlements`

| Artifact | Location |
|----------|----------|
| Controller | `Backend_Fintech/src/app/modules/settlements/controllers/settlement.controller.ts` |
| Service | `Backend_Fintech/src/app/modules/settlements/services/settlement-engine.service.ts` |
| Repository | `Backend_Fintech/src/app/modules/settlements/repositories/settlement-engine.repository.ts` |
| Routes | `Backend_Fintech/src/app/modules/settlements/routes/settlement.routes.ts` |
| Frontend API service | `Frontend_Fintech/src/app/features/settlements/services/settlement-api.service.ts` |
| FR IDs | FR-SETT-001 |
| Integration test | NOT VERIFIED |
| E2E spec | NOT VERIFIED |
| Product module doc | NOT VERIFIED |

| Method | Route fragment | Route file |
|--------|----------------|------------|
| GET | `/calendar` | `Backend_Fintech/src/app/modules/settlements/routes/settlement.routes.ts` |
| GET | `/reserves` | `Backend_Fintech/src/app/modules/settlements/routes/settlement.routes.ts` |
| POST | `/merchants/:merchantId/reserves` | `Backend_Fintech/src/app/modules/settlements/routes/settlement.routes.ts` |
| GET | `/search` | `Backend_Fintech/src/app/modules/settlements/routes/settlement.routes.ts` |
| GET | `/statistics` | `Backend_Fintech/src/app/modules/settlements/routes/settlement.routes.ts` |
| GET | `/export` | `Backend_Fintech/src/app/modules/settlements/routes/settlement.routes.ts` |
| GET | `/batches` | `Backend_Fintech/src/app/modules/settlements/routes/settlement.routes.ts` |
| POST | `/batches` | `Backend_Fintech/src/app/modules/settlements/routes/settlement.routes.ts` |
| GET | `/batches/:id` | `Backend_Fintech/src/app/modules/settlements/routes/settlement.routes.ts` |
| GET | `/` | `Backend_Fintech/src/app/modules/settlements/routes/settlement.routes.ts` |
| POST | `/` | `Backend_Fintech/src/app/modules/settlements/routes/settlement.routes.ts` |
| GET | `/:id` | `Backend_Fintech/src/app/modules/settlements/routes/settlement.routes.ts` |
| PATCH | `/:id/status` | `Backend_Fintech/src/app/modules/settlements/routes/settlement.routes.ts` |
| GET | `/:id/transactions` | `Backend_Fintech/src/app/modules/settlements/routes/settlement.routes.ts` |
| POST | `/:id/hold` | `Backend_Fintech/src/app/modules/settlements/routes/settlement.routes.ts` |
| POST | `/:id/release` | `Backend_Fintech/src/app/modules/settlements/routes/settlement.routes.ts` |
| POST | `/:id/retry` | `Backend_Fintech/src/app/modules/settlements/routes/settlement.routes.ts` |
| POST | `/:id/reversal` | `Backend_Fintech/src/app/modules/settlements/routes/settlement.routes.ts` |

### Module: `smart-collect`

| Artifact | Location |
|----------|----------|
| Controller | `Backend_Fintech/src/app/modules/smart-collect/controllers/smart-collect.controller.ts` |
| Service | `Backend_Fintech/src/app/modules/smart-collect/services/smart-collect.service.ts` |
| Repository | `Backend_Fintech/src/app/modules/smart-collect/repositories/smart-collect.repository.ts` |
| Routes | `Backend_Fintech/src/app/modules/smart-collect/routes/smart-collect.routes.ts` |
| Frontend API service | `Frontend_Fintech/src/app/features/smart-collect/services/smart-collect-api.service.ts` |
| FR IDs | NOT VERIFIED |
| Integration test | NOT VERIFIED |
| E2E spec | NOT VERIFIED |
| Product module doc | NOT VERIFIED |

| Method | Route fragment | Route file |
|--------|----------------|------------|
| GET | `/dashboard` | `Backend_Fintech/src/app/modules/smart-collect/routes/smart-collect.routes.ts` |
| GET | `/virtual-accounts` | `Backend_Fintech/src/app/modules/smart-collect/routes/smart-collect.routes.ts` |
| POST | `/virtual-accounts` | `Backend_Fintech/src/app/modules/smart-collect/routes/smart-collect.routes.ts` |
| GET | `/virtual-accounts/:id` | `Backend_Fintech/src/app/modules/smart-collect/routes/smart-collect.routes.ts` |
| GET | `/collections` | `Backend_Fintech/src/app/modules/smart-collect/routes/smart-collect.routes.ts` |
| GET | `/collections/:id` | `Backend_Fintech/src/app/modules/smart-collect/routes/smart-collect.routes.ts` |
| POST | `/collections/:id/match` | `Backend_Fintech/src/app/modules/smart-collect/routes/smart-collect.routes.ts` |

### Module: `subscriptions`

| Artifact | Location |
|----------|----------|
| Controller | `Backend_Fintech/src/app/modules/subscriptions/controllers/subscription.controller.ts` |
| Service | `Backend_Fintech/src/app/modules/subscriptions/services/subscription.service.ts` |
| Repository | `Backend_Fintech/src/app/modules/subscriptions/repositories/subscription.repository.ts` |
| Routes | `Backend_Fintech/src/app/modules/subscriptions/routes/subscription.routes.ts` |
| Frontend API service | `Frontend_Fintech/src/app/features/subscriptions/services/subscriptions-api.service.ts` |
| FR IDs | FR-SUB-001, FR-SUB-002 |
| Integration test | Backend_Fintech/src/__tests__/integration/subscriptions-invoices.integration.test.ts |
| E2E spec | e2e/tests/subscriptions.spec.ts |
| Product module doc | [Modules](../01_Product/Modules/) |

| Method | Route fragment | Route file |
|--------|----------------|------------|
| GET | `/statistics` | `Backend_Fintech/src/app/modules/subscriptions/routes/subscription.routes.ts` |
| GET | `/analytics` | `Backend_Fintech/src/app/modules/subscriptions/routes/subscription.routes.ts` |
| GET | `/dunning` | `Backend_Fintech/src/app/modules/subscriptions/routes/subscription.routes.ts` |
| GET | `/mandates` | `Backend_Fintech/src/app/modules/subscriptions/routes/subscription.routes.ts` |
| GET | `/plans` | `Backend_Fintech/src/app/modules/subscriptions/routes/subscription.routes.ts` |
| POST | `/plans` | `Backend_Fintech/src/app/modules/subscriptions/routes/subscription.routes.ts` |
| GET | `/` | `Backend_Fintech/src/app/modules/subscriptions/routes/subscription.routes.ts` |
| POST | `/` | `Backend_Fintech/src/app/modules/subscriptions/routes/subscription.routes.ts` |
| POST | `/:id/pause` | `Backend_Fintech/src/app/modules/subscriptions/routes/subscription.routes.ts` |
| POST | `/:id/resume` | `Backend_Fintech/src/app/modules/subscriptions/routes/subscription.routes.ts` |
| POST | `/:id/upgrade` | `Backend_Fintech/src/app/modules/subscriptions/routes/subscription.routes.ts` |
| POST | `/:id/downgrade` | `Backend_Fintech/src/app/modules/subscriptions/routes/subscription.routes.ts` |
| POST | `/:id/cancel` | `Backend_Fintech/src/app/modules/subscriptions/routes/subscription.routes.ts` |
| POST | `/:id/renew` | `Backend_Fintech/src/app/modules/subscriptions/routes/subscription.routes.ts` |
| POST | `/:id/fail` | `Backend_Fintech/src/app/modules/subscriptions/routes/subscription.routes.ts` |
| GET | `/:id` | `Backend_Fintech/src/app/modules/subscriptions/routes/subscription.routes.ts` |

### Module: `support`

| Artifact | Location |
|----------|----------|
| Controller | `Backend_Fintech/src/app/modules/support/controllers/support.controller.ts` |
| Service | `Backend_Fintech/src/app/modules/support/services/support.service.ts` |
| Repository | `Backend_Fintech/src/app/modules/support/repositories/support.repository.ts` |
| Routes | `Backend_Fintech/src/app/modules/support/routes/support.routes.ts` |
| Frontend API service | `Frontend_Fintech/src/app/features/support/services/support-api.service.ts` |
| FR IDs | FR-SUP-001, FR-SUP-002 |
| Integration test | NOT VERIFIED |
| E2E spec | NOT VERIFIED |
| Product module doc | NOT VERIFIED |

| Method | Route fragment | Route file |
|--------|----------------|------------|
| GET | `/statistics` | `Backend_Fintech/src/app/modules/support/routes/support.routes.ts` |
| GET | `/` | `Backend_Fintech/src/app/modules/support/routes/support.routes.ts` |
| POST | `/` | `Backend_Fintech/src/app/modules/support/routes/support.routes.ts` |
| GET | `/:id` | `Backend_Fintech/src/app/modules/support/routes/support.routes.ts` |
| PUT | `/:id` | `Backend_Fintech/src/app/modules/support/routes/support.routes.ts` |
| POST | `/:id/assign` | `Backend_Fintech/src/app/modules/support/routes/support.routes.ts` |
| POST | `/:id/reassign` | `Backend_Fintech/src/app/modules/support/routes/support.routes.ts` |
| POST | `/:id/escalate` | `Backend_Fintech/src/app/modules/support/routes/support.routes.ts` |
| POST | `/:id/close` | `Backend_Fintech/src/app/modules/support/routes/support.routes.ts` |
| POST | `/:id/reopen` | `Backend_Fintech/src/app/modules/support/routes/support.routes.ts` |
| POST | `/:id/notes` | `Backend_Fintech/src/app/modules/support/routes/support.routes.ts` |
| POST | `/:id/attachments` | `Backend_Fintech/src/app/modules/support/routes/support.routes.ts` |

### Module: `system`

| Artifact | Location |
|----------|----------|
| Controller | `Backend_Fintech/src/app/modules/system/controllers/system.controller.ts` |
| Service | `Backend_Fintech/src/app/modules/system/services/health.service.ts` |
| Repository | `Backend_Fintech/src/app/modules/system/repositories/system.repository.ts` |
| Routes | `Backend_Fintech/src/app/modules/system/routes/system.routes.ts` |
| Frontend API service | `NOT VERIFIED` |
| FR IDs | FR-SYS-001 |
| Integration test | NOT VERIFIED |
| E2E spec | NOT VERIFIED |
| Product module doc | NOT VERIFIED |

| Method | Route fragment | Route file |
|--------|----------------|------------|
| GET | `/admin/status` | `Backend_Fintech/src/app/modules/system/routes/system.routes.ts` |
| GET | `/health` | `Backend_Fintech/src/app/modules/system/routes/system.routes.ts` |
| GET | `/liveness` | `Backend_Fintech/src/app/modules/system/routes/system.routes.ts` |
| GET | `/readiness` | `Backend_Fintech/src/app/modules/system/routes/system.routes.ts` |
| GET | `/metrics` | `Backend_Fintech/src/app/modules/system/routes/system.routes.ts` |
| GET | `/version` | `Backend_Fintech/src/app/modules/system/routes/system.routes.ts` |
| GET | `/cache-config` | `Backend_Fintech/src/app/modules/system/routes/system.routes.ts` |
| PUT | `/cache-config/:id` | `Backend_Fintech/src/app/modules/system/routes/system.routes.ts` |
| GET | `/backup-config` | `Backend_Fintech/src/app/modules/system/routes/system.routes.ts` |
| PUT | `/backup-config/:id` | `Backend_Fintech/src/app/modules/system/routes/system.routes.ts` |
| GET | `/jobs/history` | `Backend_Fintech/src/app/modules/system/routes/system.routes.ts` |
| GET | `/performance` | `Backend_Fintech/src/app/modules/system/routes/system.routes.ts` |

### Module: `transactions`

| Artifact | Location |
|----------|----------|
| Controller | `Backend_Fintech/src/app/modules/transactions/controllers/transaction.controller.ts` |
| Service | `Backend_Fintech/src/app/modules/transactions/services/transaction.service.ts` |
| Repository | `Backend_Fintech/src/app/modules/transactions/repositories/transaction.repository.ts` |
| Routes | `Backend_Fintech/src/app/modules/transactions/routes/transaction.routes.ts` |
| Frontend API service | `Frontend_Fintech/src/app/features/transactions/services/transaction-api.service.ts` |
| FR IDs | NOT VERIFIED |
| Integration test | NOT VERIFIED |
| E2E spec | NOT VERIFIED |
| Product module doc | NOT VERIFIED |

| Method | Route fragment | Route file |
|--------|----------------|------------|
| GET | `/search` | `Backend_Fintech/src/app/modules/transactions/routes/transaction.routes.ts` |
| GET | `/statistics` | `Backend_Fintech/src/app/modules/transactions/routes/transaction.routes.ts` |
| GET | `/export` | `Backend_Fintech/src/app/modules/transactions/routes/transaction.routes.ts` |
| GET | `/disputes` | `Backend_Fintech/src/app/modules/transactions/routes/transaction.routes.ts` |
| POST | `/disputes` | `Backend_Fintech/src/app/modules/transactions/routes/transaction.routes.ts` |
| GET | `/` | `Backend_Fintech/src/app/modules/transactions/routes/transaction.routes.ts` |
| POST | `/` | `Backend_Fintech/src/app/modules/transactions/routes/transaction.routes.ts` |
| GET | `/:id` | `Backend_Fintech/src/app/modules/transactions/routes/transaction.routes.ts` |
| PATCH | `/:id/status` | `Backend_Fintech/src/app/modules/transactions/routes/transaction.routes.ts` |
| POST | `/:id/refund` | `Backend_Fintech/src/app/modules/transactions/routes/transaction.routes.ts` |

### Module: `users`

| Artifact | Location |
|----------|----------|
| Controller | `Backend_Fintech/src/app/modules/users/controllers/user.controller.ts` |
| Service | `Backend_Fintech/src/app/modules/users/services/user.service.ts` |
| Repository | `Backend_Fintech/src/app/modules/users/repositories/user.repository.ts` |
| Routes | `Backend_Fintech/src/app/modules/users/routes/user.routes.ts` |
| Frontend API service | `Frontend_Fintech/src/app/features/users/services/user-api.service.ts` |
| FR IDs | FR-USR-001 |
| Integration test | Backend_Fintech/src/__tests__/integration/auth.integration.test.ts; Backend_Fintech/src/__tests__/integration/users.integration.test.ts |
| E2E spec | e2e/tests/users.spec.ts |
| Product module doc | NOT VERIFIED |

| Method | Route fragment | Route file |
|--------|----------------|------------|
| GET | `/` | `Backend_Fintech/src/app/modules/users/routes/user.routes.ts` |
| POST | `/` | `Backend_Fintech/src/app/modules/users/routes/user.routes.ts` |
| GET | `/:id` | `Backend_Fintech/src/app/modules/users/routes/user.routes.ts` |
| PUT | `/:id` | `Backend_Fintech/src/app/modules/users/routes/user.routes.ts` |
| PATCH | `/:id/status` | `Backend_Fintech/src/app/modules/users/routes/user.routes.ts` |
| DELETE | `/:id` | `Backend_Fintech/src/app/modules/users/routes/user.routes.ts` |
| PUT | `/:id/roles` | `Backend_Fintech/src/app/modules/users/routes/user.routes.ts` |

### Module: `webhooks`

| Artifact | Location |
|----------|----------|
| Controller | `Backend_Fintech/src/app/modules/webhooks/controllers/webhooks.controller.ts` |
| Service | `Backend_Fintech/src/app/modules/webhooks/services/webhooks.service.ts` |
| Repository | `Backend_Fintech/src/app/modules/webhooks/repositories/webhooks.repository.ts` |
| Routes | `Backend_Fintech/src/app/modules/webhooks/routes/webhooks.routes.ts` |
| Frontend API service | `Frontend_Fintech/src/app/features/webhooks/services/webhooks-api.service.ts` |
| FR IDs | FR-WH-001, FR-WH-002, FR-WH-003, FR-WH-004 |
| Integration test | Backend_Fintech/src/__tests__/integration/concurrency.integration.test.ts; Backend_Fintech/src/__tests__/integration/webhooks-workers.integration.test.ts |
| E2E spec | e2e/tests/webhooks.spec.ts |
| Product module doc | [Modules](../01_Product/Modules/) |

| Method | Route fragment | Route file |
|--------|----------------|------------|
| GET | `/dashboard` | `Backend_Fintech/src/app/modules/webhooks/routes/webhooks.routes.ts` |
| GET | `/endpoints` | `Backend_Fintech/src/app/modules/webhooks/routes/webhooks.routes.ts` |
| POST | `/endpoints` | `Backend_Fintech/src/app/modules/webhooks/routes/webhooks.routes.ts` |
| GET | `/endpoints/:id` | `Backend_Fintech/src/app/modules/webhooks/routes/webhooks.routes.ts` |
| PUT | `/endpoints/:id` | `Backend_Fintech/src/app/modules/webhooks/routes/webhooks.routes.ts` |
| DELETE | `/endpoints/:id` | `Backend_Fintech/src/app/modules/webhooks/routes/webhooks.routes.ts` |
| POST | `/endpoints/:id/subscriptions` | `Backend_Fintech/src/app/modules/webhooks/routes/webhooks.routes.ts` |
| PUT | `/endpoints/:id/subscriptions/:subId` | `Backend_Fintech/src/app/modules/webhooks/routes/webhooks.routes.ts` |
| DELETE | `/endpoints/:id/subscriptions/:subId` | `Backend_Fintech/src/app/modules/webhooks/routes/webhooks.routes.ts` |
| GET | `/deliveries` | `Backend_Fintech/src/app/modules/webhooks/routes/webhooks.routes.ts` |
| GET | `/deliveries/:id` | `Backend_Fintech/src/app/modules/webhooks/routes/webhooks.routes.ts` |
| POST | `/deliveries/:id/retry` | `Backend_Fintech/src/app/modules/webhooks/routes/webhooks.routes.ts` |
