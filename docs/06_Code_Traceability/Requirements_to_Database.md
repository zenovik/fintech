# Requirements to Database

> **Phase 2 — Code Traceability** · v1.0.0-rc1 · 2026-07-29

---

| FR domain | Primary tables | Repository | Verified |
|-----------|---------------|------------|----------|
| FR-AUTH-* | users, user_sessions, refresh_tokens, login_attempts, otp_challenges, password_reset_tokens, trusted_devices, password_history | auth.repositories.* | **Yes** — files exist |
| FR-RBAC-* | roles, permissions, role_permissions, organization_members | role.repository, permission.repository | **Yes** |
| FR-MER-* | merchants, merchant_documents, merchant_settings | merchant.repository | **Yes** |
| FR-MER-004–005 | merchant_onboarding_applications, onboarding_workflow_* | merchant-onboarding.repository, approval.repository | **Partial** — table names **NOT VERIFIED** all |
| FR-PAY-* | payment_intents, payment_orders, payment_timeline_events, payment_idempotency_keys, payment_webhook_deliveries | payment.repository | **Yes** |
| FR-CHK-* | checkout_sessions, checkout_events, checkout_themes | checkout.repository | **Yes** |
| FR-PL-* | payment_links, payment_link_visits | payment-link.repository | **Yes** |
| FR-QR-* | qr_payments, qr_scan_history | qr-payment.repository | **Yes** |
| FR-REF-* | refunds, refund_status_history | refund.repository | **Yes** |
| FR-CB-* | chargebacks, chargeback_evidence, chargeback_status_history | chargeback.repository | **Yes** |
| FR-SUB-* | subscriptions, subscription_plans, subscription_mandates | subscription.repository | **Yes** |
| FR-INV-* | invoices, invoice_line_items, invoice_templates | invoice.repository | **Yes** |
| FR-WH-* | webhook_endpoints, webhook_subscriptions, webhook_delivery_queue, webhook_deliveries | webhooks.repository | **Yes** |
| FR-DEV-* | developer_profiles, oauth_applications, organization_api_keys | developer.repository | **Partial** |
| FR-NOT-* | notifications, notification_deliveries, notification_templates | notification.repository | **Yes** |
| FR-SET-* | feature_flags, platform_settings, organization_settings | settings.repository, platform-config.repository | **Yes** |
| FR-AUD-* | audit_logs, audit_api_logs | audit.repository | **Yes** |
| FR-OPS-* | retry_queue, background_jobs, operations_* | operations.repository, system.repository | **Partial** |
| Worker/FR-INV-002 | background_jobs (invoice_email) | background-job.service | **Yes** — job-handlers.ts |

**223-table full mapping:** **NOT VERIFIED** — see [03_Database/Data_Dictionary.md](../03_Database/Data_Dictionary.md) for major entities only.

## Cross References

- [Database_Traceability.md](./Database_Traceability.md)
