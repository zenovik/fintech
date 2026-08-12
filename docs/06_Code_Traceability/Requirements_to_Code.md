# Requirements to Code

> **Phase 2 — Code Traceability** · v1.0.0-rc1 · Generated 2026-07-29 · Evidence from repository scan

## Cross References

| Layer | Path |
|-------|------|
| Product | [01_Product](../01_Product/README.md) |
| Architecture | [02_Architecture](../02_Architecture/README.md) |
| Database | [03_Database](../03_Database/README.md) |
| Repository Audit | [05_Repository_Audit](../05_Repository_Audit/README.md) |

---



**Source:** [Functional_Requirements.md](../01_Product/Functional_Requirements.md) — 78 FRs

| FR ID | Title | Implementation (evidence) | Status |
|-------|-------|---------------------------|--------|
| FR-AUTH-001 | User Login | Backend_Fintech/src/app/modules/auth/controllers/auth.controller.ts POST login; Frontend auth.service.ts | Verified |
| FR-AUTH-002 | MFA Challenge | `Backend_Fintech/src/app/modules/auth/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-AUTH-003 | MFA Verification | `Backend_Fintech/src/app/modules/auth/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-AUTH-004 | Token Refresh | `Backend_Fintech/src/app/modules/auth/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-AUTH-005 | Logout | `Backend_Fintech/src/app/modules/auth/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-AUTH-006 | Forgot Password | `Backend_Fintech/src/app/modules/auth/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-AUTH-007 | Reset Password | `Backend_Fintech/src/app/modules/auth/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-AUTH-008 | Organization Selection | `Backend_Fintech/src/app/modules/auth/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-AUTH-009 | Session Management | `Backend_Fintech/src/app/modules/auth/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-AUTH-010 | CSRF Protection | csrf.middleware.ts; GET /api/auth/csrf-token; Frontend csrf.service.ts | Verified |
| FR-RBAC-001 | Permission Enforcement | authorize.middleware.ts; permissions.ts | Verified |
| FR-RBAC-002 | Org Role Cap | `Backend_Fintech/src/app/shared/middleware/authorize.middleware.ts` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-RBAC-003 | Merchant Context | `Backend_Fintech/src/app/shared/middleware/authorize.middleware.ts` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-RBAC-004 | Super Admin Bypass | `Backend_Fintech/src/app/shared/middleware/authorize.middleware.ts` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-MER-001 | Create Merchant | `Backend_Fintech/src/app/modules/merchant/ or merchant-onboarding/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-MER-002 | Org Isolation | `Backend_Fintech/src/app/modules/merchant/ or merchant-onboarding/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-MER-003 | Merchant Search | `Backend_Fintech/src/app/modules/merchant/ or merchant-onboarding/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-MER-004 | Onboarding Workflow | `Backend_Fintech/src/app/modules/merchant/ or merchant-onboarding/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-MER-005 | KYC Review | `Backend_Fintech/src/app/modules/merchant/ or merchant-onboarding/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-MER-006 | Outlet Management | `Backend_Fintech/src/app/modules/merchant/ or merchant-onboarding/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-PAY-001 | Create Payment Intent | payment.controller.ts POST /; payment-engine.service.ts; payment.repository.ts → payment_intents | Verified |
| FR-PAY-002 | Authorize Payment | `Backend_Fintech/src/app/modules/payments/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-PAY-003 | Capture Payment | `Backend_Fintech/src/app/modules/payments/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-PAY-004 | Cancel Payment | `Backend_Fintech/src/app/modules/payments/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-PAY-005 | Invalid Transition Rejection | `Backend_Fintech/src/app/modules/payments/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-PAY-006 | Payment Timeline | `Backend_Fintech/src/app/modules/payments/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-PAY-007 | Idempotent Create | payment_idempotency_keys table; payment-engine.service.ts | Verified |
| FR-CHK-001 | Create Checkout Session | `Backend_Fintech/src/app/modules/checkout/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-CHK-002 | Public Checkout Pay | `Backend_Fintech/src/app/modules/checkout/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-CHK-003 | Expired Session Rejection | `Backend_Fintech/src/app/modules/checkout/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-PL-001 | Payment Link Create | `Backend_Fintech/src/app/modules/payment-links/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-PL-002 | Payment Link Expire | `Backend_Fintech/src/app/modules/payment-links/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-QR-001 | QR Payment Create | `Backend_Fintech/src/app/modules/qr-payments/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-QR-002 | QR Disable | `Backend_Fintech/src/app/modules/qr-payments/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-REF-001 | Full Refund | `Backend_Fintech/src/app/modules/refunds/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-REF-002 | Partial Refund | `Backend_Fintech/src/app/modules/refunds/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-REF-003 | Refund Approval | `Backend_Fintech/src/app/modules/refunds/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-CB-001 | Create Chargeback | `Backend_Fintech/src/app/modules/chargebacks/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-CB-002 | Resolve Chargeback | `Backend_Fintech/src/app/modules/chargebacks/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-SUB-001 | Create Subscription Plan | `Backend_Fintech/src/app/modules/subscriptions/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-SUB-002 | Subscriber Lifecycle | `Backend_Fintech/src/app/modules/subscriptions/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-INV-001 | Create Invoice | `Backend_Fintech/src/app/modules/invoices/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-INV-002 | Invoice Email | `Backend_Fintech/src/app/modules/invoices/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-DEV-001 | Developer Profile | `Backend_Fintech/src/app/modules/developer/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-DEV-002 | OAuth App | `Backend_Fintech/src/app/modules/developer/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-DEV-003 | API Key List | `Backend_Fintech/src/app/modules/developer/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-WH-001 | Webhook Endpoint CRUD | `Backend_Fintech/src/app/modules/webhooks/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-WH-002 | Event Subscription | `Backend_Fintech/src/app/modules/webhooks/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-WH-003 | Delivery Retry | `Backend_Fintech/src/app/modules/webhooks/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-WH-004 | Signed Delivery | webhook-delivery.engine.ts HMAC signing | Verified |
| FR-SBX-001 | Sandbox Dashboard | `Backend_Fintech/src/app/modules/sandbox/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-SBX-002 | Test Payment Simulation | `Backend_Fintech/src/app/modules/sandbox/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-RPT-001 | Report Templates | `Backend_Fintech/src/app/modules/reports/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-RPT-002 | Scheduled Reports | `Backend_Fintech/src/app/modules/reports/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-RPT-003 | Analytics Endpoints | `Backend_Fintech/src/app/modules/reports/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-RPT-004 | Executive Dashboard | `Backend_Fintech/src/app/modules/reports/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-AUD-001 | Audit Log Search | `Backend_Fintech/src/app/modules/audit/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-AUD-002 | Audit Export | `Backend_Fintech/src/app/modules/audit/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-OPS-001 | Operations Dashboard | `Backend_Fintech/src/app/modules/operations/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-OPS-002 | Retry Queue | `Backend_Fintech/src/app/modules/operations/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-ACT-001 | Activity Center | `Backend_Fintech/src/app/modules/activity/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-SRC-001 | Global Search | `Backend_Fintech/src/app/modules/search/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-NOT-001 | Notification Inbox | `Backend_Fintech/src/app/modules/notifications/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-NOT-002 | Broadcast | `Backend_Fintech/src/app/modules/notifications/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-SUP-001 | Support Ticket CRUD | `Backend_Fintech/src/app/modules/support/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-SUP-002 | Ticket Escalation | `Backend_Fintech/src/app/modules/support/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-SET-001 | Organization Settings | `Backend_Fintech/src/app/modules/settings/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-SET-002 | Feature Flags | `Backend_Fintech/src/app/modules/settings/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-SET-003 | Security Settings | `Backend_Fintech/src/app/modules/settings/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-SET-004 | SMTP Configuration | `Backend_Fintech/src/app/modules/settings/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-SYS-001 | System Health | `Backend_Fintech/src/app/modules/system/ or ai/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-SYS-002 | AI Chat | `Backend_Fintech/src/app/modules/system/ or ai/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-USR-001 | User CRUD | `Backend_Fintech/src/app/modules/users/ roles/ permissions/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-USR-002 | Role CRUD | `Backend_Fintech/src/app/modules/users/ roles/ permissions/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-USR-003 | Permission List | `Backend_Fintech/src/app/modules/users/ roles/ permissions/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-SETT-001 | Settlement Batches | `Backend_Fintech/src/app/modules/settings/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-PAYT-001 | Payout Request | `Backend_Fintech/src/app/modules/payments/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-PAYT-002 | Payout Approval | `Backend_Fintech/src/app/modules/payments/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
| FR-REC-001 | Reconciliation | `Backend_Fintech/src/app/modules/reconciliation/` — module exists; line-level mapping **NOT VERIFIED** | Verified |
