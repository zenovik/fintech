# Component Diagram (C4)

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

### C4 Level 1 — Major Modules

```mermaid
C4Component
  title API — Major Components (L1)
  Container(api, "Express API")
  Component(auth, "Auth Module", "JWT, sessions")
  Component(pay, "Payments Module", "Intents, capture")
  Component(chk, "Checkout Module", "Hosted sessions")
  Component(wh, "Webhooks Module", "Subscriptions, delivery")
  Component(rbac, "RBAC Middleware", "144 permissions")
  Component(sys, "System Module", "Health, metrics")
  Rel(api, auth, "routes")
  Rel(api, pay, "routes")
  Rel(api, chk, "routes")
  Rel(api, wh, "routes")
  Rel(auth, rbac, "token payload")
  Rel(pay, wh, "events")
```

### C4 Level 2 — Shared Middleware

```mermaid
flowchart TB
  subgraph Shared
    EH[Error Handler]
    RL[Rate Limiter]
    CSRF[CSRF Middleware]
    LOG[Logger]
    MET[Metrics Registry]
  end
  subgraph Modules["46 API Modules"]
    direction TB
    AUTH[auth]
    PAY[payments]
    REF[refunds]
    NTF[notifications]
  end
  AUTH --> EH
  PAY --> EH
  Modules --> RL
  Modules --> CSRF
  Modules --> LOG
  Modules --> MET
```

### C4 Level 3 — Payment Module

```mermaid
flowchart LR
  subgraph PaymentModule
    PC[PaymentController]
    PS[PaymentEngineService]
    PR[PaymentRepository]
  end
  PC --> PS --> PR
  PS --> Audit[AuditRecorder]
  PS --> WHQ[payment_webhook_deliveries]
```

### C4 Level 4 — Class View

```mermaid
classDiagram
  class PaymentEngineService {
    +createPayment()
    +authorize()
    +capture()
    +getIdempotency()
  }
  class PaymentRepository {
    +insertIntent()
    +updateStatus()
  }
  class WebhookDeliveryEngine {
    +deliver()
  }
  PaymentEngineService --> PaymentRepository
  PaymentEngineService --> WebhookDeliveryEngine
```

---

## Purpose

C4 levels 1–4 for API components.

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
