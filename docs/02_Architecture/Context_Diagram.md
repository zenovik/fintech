# Context Diagram (C4)

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

### C4 Level 1 — System Context

```mermaid
C4Context
  title Merchant Pro — System Context (L1)
  Person(merchant, "Merchant User", "Operates portal")
  Person(dev, "Developer", "Integrates payments API")
  Person(admin, "Platform Admin", "Configures org")
  System(mpro, "Merchant Pro", "Payment & merchant platform")
  System_Ext(gateway, "Payment Gateway", "Acquirer / PSP")
  System_Ext(smtp, "SMTP", "Email delivery")
  Rel(merchant, mpro, "Uses HTTPS")
  Rel(dev, mpro, "REST API + webhooks")
  Rel(admin, mpro, "Administration")
  Rel(mpro, gateway, "Authorize / capture")
  Rel(mpro, smtp, "Transactional email")
```

### C4 Level 2 — Extended Context

```mermaid
C4Context
  title Extended Context — Actors & Compliance (L2)
  Person(customer, "End Customer", "Pays via checkout")
  System(mpro, "Merchant Pro")
  System_Ext(bank, "Issuing Bank", "Card authorization")
  System_Ext(gateway, "Payment Gateway")
  SystemDb_Ext(audit, "Audit Retention", "Compliance archive")
  Rel(customer, mpro, "Hosted checkout")
  Rel(mpro, gateway, "Card rails")
  Rel(gateway, bank, "Authorization")
  Rel(mpro, audit, "Export audit logs")
```

### C4 Level 3 — Context Flow

```mermaid
flowchart TB
  subgraph External
    U[Users]
    API_C[API Consumers]
  end
  subgraph MerchantPro["Merchant Pro Platform"]
    FE[Angular SPA]
    BE[Express API]
    WK[Worker]
  end
  subgraph Data
    MY[(MySQL)]
    RD[(Redis)]
  end
  U --> FE --> BE
  API_C --> BE
  BE --> MY
  BE --> RD
  WK --> MY
  WK --> RD
```

### C4 Level 4 — Trust Zones

```mermaid
flowchart LR
  subgraph TrustZones
    PZ[Public Zone]
    AZ[Application Zone]
    DZ[Data Zone]
  end
  PZ -->|TLS| AZ
  AZ -->|Private network| DZ
  note1[No direct DB access from browser]
```

---

## Purpose

C4 model levels 1–4 for system context.

## Responsibilities

Define technical structure, boundaries, and cross-cutting concerns for Merchant Pro v1.0.0-rc1.

## Components

Angular SPA, Express API (46 modules), Worker, MySQL, Redis, Docker Compose stack.

## Dependencies

Node 20+, MySQL 8, Redis 7, SMTP for email, external payment gateway.

## Communication

HTTPS JSON REST between SPA and API; worker polls MySQL queues; Redis pub/sub not used.

## Data Flow

Request → middleware → controller → service → repository → MySQL. Async side effects enqueue rows for worker.

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
