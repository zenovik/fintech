# Notification Architecture

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

In-app and email notification delivery.

## Responsibilities

Define technical structure, boundaries, and cross-cutting concerns for Merchant Pro v1.0.0-rc1.

## Components

Create notification → `notification_deliveries` (in_app always, email if preference enabled) → worker SMTP via Nodemailer.

## Dependencies

Node 20+, MySQL 8, Redis 7, SMTP for email, external payment gateway.

## Communication

HTTPS JSON REST between SPA and API; worker polls MySQL queues; Redis pub/sub not used.

## Data Flow

### Notification Delivery

```mermaid
sequenceDiagram
  autonumber
  participant Src as Domain Service
  participant NTF as Notification Service
  participant DB as MySQL
  participant Worker as Background Worker
  participant SMTP as SMTP Server
  participant User as Merchant User

  Src->>NTF: emit(event, userId, payload)
  NTF->>DB: INSERT notifications
  NTF->>DB: INSERT notification_deliveries (in_app)
  alt email preference enabled
    NTF->>DB: INSERT background_jobs (notification_email)
    Worker->>DB: Claim job FOR UPDATE
    Worker->>SMTP: Send templated email
    Worker->>DB: UPDATE delivery status sent/failed
  end
  User->>User: Poll / SSE in-app feed
```

See [Worker_Architecture.md](./Worker_Architecture.md) for retry semantics on failed email jobs.

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

[01_Product/Modules/Notifications.md](../01_Product/Modules/Notifications.md)
