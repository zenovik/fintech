# Integration Architecture

> **Merchant Pro Enterprise Architecture** · v1.0.0-rc1 · Product: [01_Product](../01_Product/README.md)

## Table of Contents

1. [Purpose](#purpose)
2. [Responsibilities](#responsibilities)
3. [Components](#components)
4. [Dependencies](#dependencies)
5. [Communication](#communication)
6. [Data Flow](#data-flow)
7. [Trust Boundaries](#trust-boundaries)
8. [Failure Handling](#failure-handling)
9. [Scalability](#scalability)
10. [Limitations](#limitations)
11. [Future Evolution](#future-evolution)
12. [Cross References](#cross-references)

---

## Purpose

External system integration patterns.

## Responsibilities

Define technical structure, boundaries, and cross-cutting concerns for Merchant Pro v1.0.0-rc1.

## Components

| Integration | Protocol | Direction |
|-------------|----------|----------|
| Payment gateway | HTTPS REST | Outbound |
| Merchant webhooks | HTTPS POST + HMAC | Outbound |
| SMTP | TLS | Outbound |
| Developer API | REST `/api/v1` | Inbound |

## Dependencies

Node 20+, MySQL 8, Redis 7, SMTP for email, external payment gateway.

## Communication

HTTPS JSON REST between SPA and API; worker polls MySQL queues; Redis pub/sub not used.

## Data Flow

### Merchant Onboarding

```mermaid
sequenceDiagram
  autonumber
  actor Admin as Platform Admin
  participant SPA as Angular SPA
  participant API as Express API
  participant Org as Organization Service
  participant Mer as Merchant Service
  participant DB as MySQL
  participant Audit as Audit Recorder

  Admin->>SPA: Create organization + merchant
  SPA->>API: POST /api/v1/organizations
  API->>Org: createOrganization()
  Org->>DB: INSERT organizations, organization_members
  Org->>Audit: Record org.created
  SPA->>API: POST /api/v1/merchants
  API->>Mer: createMerchant(orgId)
  Mer->>DB: INSERT merchants, merchant_settings
  Mer->>DB: Seed default roles/permissions scope
  Mer->>Audit: Record merchant.created
  API-->>SPA: 201 Merchant ready
  SPA-->>Admin: Onboarding wizard complete
```

Inbound REST and outbound SMTP/webhook integrations follow the request → service → repository pattern documented in [Runtime_View.md](../04_Solution_Design/Runtime_View.md).

## Trust Boundaries

Public internet → TLS → API → private DB network. See [Trust_Boundaries.md](./Trust_Boundaries.md).

## Failure Handling

Structured `AppError` responses; worker retries with exponential backoff; health endpoints for orchestration.

## Scalability

Horizontally scale API and worker replicas; Redis locks coordinate; MySQL remains primary bottleneck.

## Limitations

Single-region deployment in rc1; no read replica requirement; polling-based queues.

## Future Evolution

Read replicas, event outbox, multi-region DR, gateway abstraction layer.

## Cross References

[01_Product](../01_Product/README.md) · [03_Database](../03_Database/README.md) · [04_Solution_Design](../04_Solution_Design/README.md)
