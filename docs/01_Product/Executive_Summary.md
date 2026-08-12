# Executive Summary — Merchant Pro

## What the Platform Is

**Merchant Pro** is an enterprise **Merchant Management Portal** and payment operations platform. It provides a unified web application for payment service providers, acquirers, and merchant aggregators to onboard merchants, process payments, manage settlements and disputes, and operate developer-facing payment APIs — all within a multi-organization, role-governed environment.

## Business Purpose

The platform reduces operational fragmentation by consolidating merchant lifecycle management, payment processing, financial operations, compliance workflows, and merchant self-service into a single product. It serves as the operational backbone for teams that manage merchant portfolios at scale.

## Target Users

| Segment | Description |
|---------|-------------|
| Platform operators | Admins, operations, finance, support staff |
| Merchant organizations | Merchant admins, branch staff, finance users |
| Developers | Integrators building on payment APIs |
| Compliance & audit | Auditors and compliance officers reviewing activity |

## Business Value

- **Faster merchant onboarding** through structured KYC and approval workflows
- **Reduced payment operations cost** via centralized capture, refund, and chargeback handling
- **Improved visibility** through executive dashboards, analytics, and audit trails
- **Developer enablement** via sandbox, webhooks, and API key management
- **Risk reduction** through RBAC, tenant isolation, fraud queues, and configurable rules

## Major Capabilities (V1)

- Multi-organization authentication with MFA and session management
- 144-permission RBAC across 40+ functional modules
- Payment intents with full lifecycle (authorize, capture, refund, chargeback)
- Public checkout, payment links, and QR payment pages
- Subscriptions, invoices, settlements, payouts, and reconciliation
- Webhooks, background workers, notifications, and audit logging
- AI assistant with business-intent routing (Gemini)
- Feature flags, system health, and operations center

## Expected Deployment Model

| Environment | Topology |
|-------------|----------|
| Development | Angular dev server + Express API + local MySQL |
| UAT / Production | Docker Compose or PM2 + nginx: MySQL, Redis, backend API, worker, frontend SPA |

Health endpoints (`/api/live`, `/api/ready`, `/api/health`) support container orchestration and load balancer probes.

## Release Status

**v1.0.0-rc1** — implementation complete; 101/101 integration tests passing; UAT-ready with documented known limitations (see [Assumptions_and_Constraints.md](./Assumptions_and_Constraints.md)).
