# Payment Architecture

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

Payment intent lifecycle: create, authorize, capture, settle, refund.

## Responsibilities

Define technical structure, boundaries, and cross-cutting concerns for Merchant Pro v1.0.0-rc1.

## Components

`PaymentEngineService`, `payment_intents`, `payment_orders`, `payment_timeline_events`, idempotency via `payment_idempotency_keys`.

## Dependencies

Node 20+, MySQL 8, Redis 7, SMTP for email, external payment gateway.

## Communication

HTTPS JSON REST between SPA and API; worker polls MySQL queues; Redis pub/sub not used.

## Data Flow

### Create Payment

```mermaid
sequenceDiagram
  autonumber
  participant Client as API Client / Checkout
  participant API as Payment API
  participant Engine as PaymentEngineService
  participant DB as MySQL

  Client->>API: POST /api/v1/payments (Idempotency-Key)
  API->>Engine: createPayment(dto)
  Engine->>DB: Lookup payment_idempotency_keys
  alt duplicate key
    Engine-->>API: Return existing intent
  else new intent
    Engine->>DB: INSERT payment_intents (pending)
    Engine->>DB: INSERT payment_timeline_events
    Engine->>DB: UPSERT payment_idempotency_keys
    Engine-->>API: PaymentIntent created
  end
  API-->>Client: 201 PaymentIntent
```

### Payment Authorization

```mermaid
sequenceDiagram
  autonumber
  participant Client as API Client
  participant API as Payment API
  participant Engine as PaymentEngineService
  participant GW as Payment Gateway
  participant DB as MySQL

  Client->>API: POST /api/v1/payments/:id/authorize
  API->>Engine: authorize(intentId)
  Engine->>DB: SELECT payment_intents FOR UPDATE
  Engine->>GW: Authorize amount (if gateway route)
  GW-->>Engine: Authorization reference
  Engine->>DB: UPDATE status → authorized
  Engine->>DB: INSERT payment_timeline_events
  API-->>Client: 200 Authorized
```

### Payment Capture

```mermaid
sequenceDiagram
  autonumber
  participant Client as API Client
  participant API as Payment API
  participant Engine as PaymentEngineService
  participant DB as MySQL
  participant WH as Webhook Queue

  Client->>API: POST /api/v1/payments/:id/capture
  API->>Engine: capture(intentId, amount)
  Engine->>DB: SELECT payment_intents FOR UPDATE
  Engine->>DB: UPDATE status → captured, amount_captured
  Engine->>DB: INSERT payment_timeline_events
  Engine->>DB: INSERT payment_webhook_deliveries
  Engine-->>WH: Enqueue payment.captured
  API-->>Client: 200 Captured
```

### Authorize and Capture (Combined)

```mermaid
sequenceDiagram
  autonumber
  participant Dev as Developer / Checkout
  participant API as Payment API
  participant Engine as PaymentEngineService
  participant DB as MySQL
  participant WH as Webhook Queue

  Dev->>API: POST /api/v1/payments (Idempotency-Key)
  API->>Engine: createPayment()
  Engine->>DB: Check payment_idempotency_keys
  Engine->>DB: INSERT payment_intents (pending)
  Engine->>DB: INSERT payment_timeline_events
  Dev->>API: POST authorize
  Engine->>DB: UPDATE status authorized
  Dev->>API: POST capture
  Engine->>DB: UPDATE status captured, amount_captured
  Engine->>DB: INSERT payment_webhook_deliveries
  Engine-->>WH: Worker delivers HMAC webhook
```

### Refund

```mermaid
sequenceDiagram
  autonumber
  participant Op as Merchant Operator
  participant API as Refund API
  participant Svc as Refund Service
  participant DB as MySQL
  participant Audit as Audit Recorder

  Op->>API: POST /api/v1/refunds
  API->>Svc: createRefund (permission refunds:write)
  Svc->>DB: SELECT payment_intents FOR UPDATE
  Svc->>DB: INSERT refunds, refund_status_history
  Svc->>DB: UPDATE payment_intents amount_refunded
  Svc->>Audit: Record audit event
  Svc->>DB: Enqueue webhook delivery
  API-->>Op: 201 Refund created
```

### Chargeback

```mermaid
sequenceDiagram
  autonumber
  participant Op as Merchant Operator
  participant API as Chargeback API
  participant Svc as Chargeback Service
  participant DB as MySQL
  participant NTF as Notification Service
  participant Audit as Audit Recorder

  Op->>API: POST /api/v1/chargebacks (dispute opened)
  API->>Svc: createChargeback()
  Svc->>DB: SELECT payment_intents
  Svc->>DB: INSERT chargebacks, chargeback_status_history
  Svc->>DB: UPDATE payment_intents dispute flags
  Svc->>Audit: Record chargeback.opened
  Svc->>NTF: Create in-app + email notification
  Svc->>DB: Enqueue webhook delivery
  API-->>Op: 201 Chargeback record
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

[01_Product/Modules/Payments.md](../01_Product/Modules/Payments.md) · [01_Product/Modules/Payment_Lifecycle.md](../01_Product/Modules/Payment_Lifecycle.md)
