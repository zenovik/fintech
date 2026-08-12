# Webhook Architecture

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

Outbound event delivery to merchant endpoints.

## Responsibilities

Define technical structure, boundaries, and cross-cutting concerns for Merchant Pro v1.0.0-rc1.

## Components

Tables: `webhook_subscriptions`, `webhook_delivery_queue`, `payment_webhook_deliveries`. Engine: `webhook-delivery.engine.ts` with HMAC signing.

## Dependencies

Node 20+, MySQL 8, Redis 7, SMTP for email, external payment gateway.

## Communication

HTTPS JSON REST between SPA and API; worker polls MySQL queues; Redis pub/sub not used.

## Data Flow

### Webhook Delivery

```mermaid
sequenceDiagram
  autonumber
  participant Worker as Worker Process
  participant DB as MySQL
  participant Redis as Redis
  participant EP as Merchant Endpoint

  Worker->>DB: SELECT payment_webhook_deliveries FOR UPDATE
  Worker->>Redis: acquireLock(lock:webhook:*)
  Worker->>EP: POST payload + HMAC signature
  alt HTTP 2xx
    Worker->>DB: status delivered
  else failure
    Worker->>DB: INSERT retry_queue (scheduled_at backoff)
    Worker->>DB: status failed
  end
  Worker->>Redis: releaseLock
```

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

[01_Product/Modules/Webhooks.md](../01_Product/Modules/Webhooks.md)
