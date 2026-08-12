# Feature Matrix — Merchant Pro v1.0.0-rc1

Legend: **✓** Available · **R** Read-only · **—** Not available · **Status:** Implemented / Partial / Planned

## Core Platform

| Module | Feature | Super Admin | Admin | Finance Mgr | Ops Mgr | Support | Read Only | Status | Dependencies |
|--------|---------|:-----------:|:-----:|:-----------:|:-------:|:-------:|:---------:|--------|--------------|
| Authentication | Login / MFA / Logout | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Implemented | — |
| Authentication | Session management | ✓ | ✓ | ✓ | ✓ | ✓ | R | Implemented | Auth |
| Dashboard | Executive KPIs | ✓ | ✓ | ✓ | ✓ | R | R | Implemented | analytics |
| Organizations | Org CRUD | ✓ | ✓ | — | — | — | R | Implemented | RBAC |
| Users | User admin | ✓ | ✓ | — | — | — | R | Implemented | RBAC |
| Roles | Role admin | ✓ | ✓* | — | — | — | R | Implemented | RBAC |
| Settings | Feature flags | ✓ | ✓ | — | — | — | R | Implemented | settings:write |
| Settings | Security policy | ✓ | ✓ | — | — | — | R | Implemented | settings:write |
| System | Health / status | ✓ | ✓ | R | R | R | R | Implemented | — |

*Admin lacks `permissions:manage`

## Merchant Domain

| Module | Feature | Super Admin | Admin | Merchant Mgr | Merchant Admin | Branch Mgr | Status | Dependencies |
|--------|---------|:-----------:|:-----:|:------------:|:--------------:|:----------:|--------|--------------|
| Merchants | CRUD / search | ✓ | ✓ | ✓ | R | R | Implemented | org context |
| Merchant Onboarding | Application workflow | ✓ | ✓ | ✓ | — | — | Implemented | onboarding |
| Onboarding Approval | KYC / compliance | ✓ | ✓ | R | — | — | Implemented | compliance_queue |
| Outlets | Outlet CRUD | ✓ | ✓ | ✓ | ✓ | R | Implemented | merchant context |
| Merchant Users | Portal user mgmt | ✓ | ✓ | ✓ | ✓ | — | Implemented | merchant_users |
| Devices | Terminal devices | ✓ | ✓ | ✓ | ✓ | R | Implemented | devices |

## Payments Domain

| Module | Feature | Super Admin | Admin | Finance | Ops | Developer | Status | Dependencies |
|--------|---------|:-----------:|:-----:|:-------:|:---:|:---------:|--------|--------------|
| Payments | Create / authorize / capture | ✓ | ✓ | ✓ | ✓ | — | Implemented | payments:* |
| Payments | Cancel / void | ✓ | ✓ | ✓ | ✓ | — | Implemented | state machine |
| Checkout | Hosted sessions | ✓ | ✓ | ✓ | ✓ | — | Implemented | checkout:write |
| Checkout | Public pay page | Public | Public | Public | Public | Public | Implemented | — |
| Payment Links | Create / expire | ✓ | ✓ | ✓ | ✓ | — | Implemented | payment_links |
| Payment Links | Public pay | Public | Public | Public | Public | Public | Implemented | — |
| QR Payments | Create / disable | ✓ | ✓ | ✓ | ✓ | — | Implemented | qr_payments |
| QR Payments | Public pay | Public | Public | Public | Public | Public | Implemented | — |
| Smart Collect | Virtual accounts | ✓ | ✓ | ✓ | R | — | Implemented | smart_collect |
| Refunds | Create / approve | ✓ | ✓ | ✓ | R | — | Implemented | refunds:approve |
| Chargebacks | Create / resolve | ✓ | ✓ | ✓ | R | — | Implemented | chargebacks:resolve |
| Subscriptions | Plans / lifecycle | ✓ | ✓ | ✓ | R | — | Implemented | subscriptions |
| Invoices | Create / PDF / email | ✓ | ✓ | ✓ | R | — | Implemented | background jobs |

## Financial Operations

| Module | Feature | Super Admin | Admin | Finance | Status | Dependencies |
|--------|---------|:-----------:|:-----:|:-------:|--------|--------------|
| Transactions | List / export | ✓ | ✓ | ✓ | Implemented | transactions |
| Settlements | Batches | ✓ | ✓ | ✓ | Implemented | settlements |
| Payouts | Request / approve | ✓ | ✓ | ✓ | Implemented | payouts:approve |
| Accounting | Reports / export | ✓ | ✓ | ✓ | Implemented | accounting |
| Reconciliation | Match records | ✓ | ✓ | ✓ | Implemented | reconciliation |
| Pricing | Fee configuration | ✓ | ✓ | R | Implemented | pricing |

## Risk & Compliance

| Module | Feature | Super Admin | Admin | Compliance | Status | Dependencies |
|--------|---------|:-----------:|:-----:|:----------:|--------|--------------|
| Fraud | Fraud queue | ✓ | ✓ | R | Implemented | fraud |
| Risk Rules | Rule CRUD | ✓ | ✓ | R | Implemented | risk_rules |
| Audit | Log search / export | ✓ | ✓ | ✓ | Implemented | audit |
| Compliance Queue | Review items | ✓ | ✓ | ✓ | Implemented | compliance_queue |
| KYC Review | Document review | ✓ | ✓ | ✓ | Implemented | kyc_review |

## Developer & Integration

| Module | Feature | Super Admin | Admin | Developer | Status | Dependencies |
|--------|---------|:-----------:|:-----:|:---------:|--------|--------------|
| Developer Portal | Profiles / OAuth | ✓ | ✓ | ✓ | Implemented | developer |
| Developer Portal | API keys | ✓ | ✓ | ✓ | Implemented | organizations |
| Webhooks | Endpoint CRUD | ✓ | ✓ | ✓ | Implemented | webhooks |
| Webhooks | Delivery log / retry | ✓ | ✓ | ✓ | Implemented | worker |
| Sandbox | Test simulations | ✓ | ✓ | ✓ | Implemented | sandbox |
| OpenAPI | Swagger docs | ✓ | ✓ | ✓ | Implemented | /api/docs |

## Operations & Intelligence

| Module | Feature | Super Admin | Admin | Ops | Support | Status | Dependencies |
|--------|---------|:-----------:|:-----:|:---:|:-------:|--------|--------------|
| Operations Center | Dashboard / alerts | ✓ | ✓ | ✓ | R | Implemented | operations |
| Operations Center | Retry queue | ✓ | ✓ | ✓ | — | Implemented | worker |
| Activity Center | Activity feed | ✓ | ✓ | ✓ | R | Implemented | activity |
| Search Center | Global search | ✓ | ✓ | ✓ | ✓ | Implemented | global_search |
| Reports | Templates / schedule | ✓ | ✓ | ✓ | R | Implemented | reports |
| Analytics | Domain analytics | ✓ | ✓ | ✓ | R | Implemented | analytics |
| AI Assistant | Chat / dashboard AI | ✓ | ✓ | R | — | Implemented | ai:chat, Gemini |
| Notifications | Inbox / broadcast | ✓ | ✓ | R | ✓ | Implemented | notifications |
| Support | Ticket lifecycle | ✓ | ✓ | R | ✓ | Implemented | support |

## Infrastructure Modules

| Module | Feature | User-Facing | Status | Dependencies |
|--------|---------|-------------|--------|--------------|
| Background Jobs | Email, webhook jobs | Admin (logs) | Implemented | worker |
| Workers | Queue processing | System | Implemented | Redis/MySQL |
| Feature Flags | Route gating | Admin settings | Implemented | settings |
| Configuration | Payment config | Admin | Implemented | payment_config |
| System Health | live/ready/health | All (status page) | Implemented | — |

**Total matrix rows:** 62 feature entries across 35 modules
