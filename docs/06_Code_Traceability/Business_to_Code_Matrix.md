# Business to Code Matrix

> **Phase 2 — Code Traceability** · v1.0.0-rc1 · 2026-07-29

---

| Business domain | Product doc | Backend module | Frontend feature | Primary tables | FR IDs |
|-----------------|-------------|----------------|------------------|----------------|--------|
| Authentication | [Authentication.md](../01_Product/Modules/Authentication.md) | `auth/` | `authentication/` | users, user_sessions, refresh_tokens, otp_challenges | FR-AUTH-* |
| Authorization | [Authorization.md](../01_Product/Modules/Authorization.md) | shared RBAC + `roles/`, `permissions/` | `roles/`, guards | roles, permissions, role_permissions | FR-RBAC-* |
| Merchants | [Merchant_Management.md](../01_Product/Modules/Merchant_Management.md) | `merchant/` | `merchant/` | merchants, merchant_documents | FR-MER-001–003 |
| Onboarding | **NOT VERIFIED** module deep dive | `merchant-onboarding/`, `onboarding-approval/` | `merchant-onboarding/`, `onboarding-approval/` | merchant_onboarding_applications | FR-MER-004–005 |
| Payments | [Payments.md](../01_Product/Modules/Payments.md) | `payments/` | via transactions/checkout | payment_intents, payment_orders | FR-PAY-* |
| Checkout | [Checkout.md](../01_Product/Modules/Checkout.md) | `checkout/` | `checkout/`, `checkout-admin/` | checkout_sessions | FR-CHK-* |
| Payment links | [Payment_Links.md](../01_Product/Modules/Payment_Links.md) | `payment-links/` | `payment-links/` | payment_links | FR-PL-* |
| QR payments | [QR_Payments.md](../01_Product/Modules/QR_Payments.md) | `qr-payments/` | `qr-payments/` | qr_payments | FR-QR-* |
| Refunds | [Refunds.md](../01_Product/Modules/Refunds.md) | `refunds/` | `refunds/` | refunds | FR-REF-* |
| Chargebacks | [Chargebacks.md](../01_Product/Modules/Chargebacks.md) | `chargebacks/` | `chargebacks/` | chargebacks | FR-CB-* |
| Subscriptions | [Subscriptions.md](../01_Product/Modules/Subscriptions.md) | `subscriptions/` | `subscriptions/` | subscriptions, subscription_plans | FR-SUB-* |
| Invoices | [Invoices.md](../01_Product/Modules/Invoices.md) | `invoices/` | `invoices/` | invoices | FR-INV-* |
| Webhooks | [Webhooks.md](../01_Product/Modules/Webhooks.md) | `webhooks/` | `webhooks/` | webhook_endpoints, webhook_delivery_queue | FR-WH-* |
| Developer | [Developer_Portal.md](../01_Product/Modules/Developer_Portal.md) | `developer/` | `developer/` | developer_profiles, oauth_apps | FR-DEV-* |
| Sandbox | [Sandbox.md](../01_Product/Modules/Sandbox.md) | `sandbox/` | `sandbox/` | sandbox_accounts | FR-SBX-* |
| Reports | [Reports.md](../01_Product/Modules/Reports.md) | `reports/`, `exports/` | `reports/` | report_templates, scheduled_reports | FR-RPT-* |
| Dashboard | [Dashboard.md](../01_Product/Modules/Dashboard.md) | `dashboard/` | `dashboard/` | dashboard_preferences | FR-RPT-004 |
| Audit | [Audit.md](../01_Product/Modules/Audit.md) | `audit/` | `audit/` | audit_logs | FR-AUD-* |
| Operations | [Operations_Center.md](../01_Product/Modules/Operations_Center.md) | `operations/` | `operations/` | operations_alerts | FR-OPS-* |
| Notifications | [Notifications.md](../01_Product/Modules/Notifications.md) | `notifications/` | `notifications/` | notifications, notification_deliveries | FR-NOT-* |
| Settings | [Configuration.md](../01_Product/Modules/Configuration.md) | `settings/` | `settings/` | feature_flags, platform_settings | FR-SET-* |
| System | [System_Health.md](../01_Product/Modules/System_Health.md) | `system/` | settings/system-status | — | FR-SYS-* |
| Settlements | **NOT VERIFIED** module deep dive | `settlements/` | `settlements/` | settlements, settlement_batches | FR-SETT-001 |
| Payouts | **NOT VERIFIED** module deep dive | `payouts/` | `payouts/` | payouts | FR-PAYT-* |
| Reconciliation | **NOT VERIFIED** module deep dive | `reconciliation/` | `reconciliation/` | reconciliation_records | FR-REC-001 |
| Customers | **NOT VERIFIED** module deep dive | `customers/` | `customers/` | customers | NOT VERIFIED FR |
| Fraud | **NOT VERIFIED** module deep dive | `fraud/` | `fraud/` | fraud_cases | NOT VERIFIED FR |
| Smart Collect | **NOT VERIFIED** module deep dive | `smart-collect/` | `smart-collect/` | virtual_accounts | NOT VERIFIED FR |
| Accounting | **NOT VERIFIED** | `accounting/` | **NOT FOUND** FE feature | accounting_entries | NOT VERIFIED FR |
| Pricing | **NOT VERIFIED** | `pricing/` | **NOT FOUND** FE feature | pricing_rules | NOT VERIFIED FR |

## Cross References

- [Requirements_to_Code.md](./Requirements_to_Code.md)
- [Frontend_Traceability.md](./Frontend_Traceability.md)
