# Architecture Overview

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

Merchant Pro is a monorepo fintech platform: **Angular 19 SPA**, **Express 4 API** (46 modules), **MySQL 8** (`fintech_db`, 223 tables), **Redis 7** (distributed locks and cache), and a **background worker** using custom MySQL job queues with `SELECT ... FOR UPDATE` (not BullMQ). Business requirements and user journeys live in [01_Product](../01_Product/README.md). This document describes technical architecture only.

## Responsibilities

Provide a single entry point to Merchant Pro technical architecture: layers, runtime processes, data stores, and integration points.

## Components

| Layer | Technology | Role |
|-------|------------|------|
| Presentation | Angular 19 | Merchant portal SPA |
| API | Express 4 / TypeScript | 46 REST modules |
| Worker | Node worker process | MySQL queues, webhooks, email |
| Data | MySQL 8 | 223 tables, ACID |
| Cache/Lock | Redis 7 | Distributed locks, optional cache |

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
