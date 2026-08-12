# Container Diagram (C4)

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

### C4 Level 1 — Containers

```mermaid
C4Container
  title Merchant Pro — Containers (L1)
  Person(user, "User")
  Container(spa, "Angular SPA", "TypeScript", "Merchant UI")
  Container(api, "Express API", "Node 20", "REST + Swagger")
  Container(worker, "Worker", "Node 20", "Queues + webhooks")
  ContainerDb(mysql, "MySQL 8", "InnoDB", "fintech_db 223 tables")
  ContainerDb(redis, "Redis 7", "Cache/Locks")
  Rel(user, spa, "HTTPS")
  Rel(spa, api, "JSON /api/v1")
  Rel(api, mysql, "mysql2 pool")
  Rel(api, redis, "ioredis")
  Rel(worker, mysql, "Job claim FOR UPDATE")
  Rel(worker, redis, "Distributed locks")
```

### C4 Level 2 — Docker Compose

```mermaid
flowchart TB
  subgraph DockerCompose
    FE[fintech-frontend :4200]
    BE[fintech-backend :3000]
    WK[fintech-worker]
    MY[fintech-mysql :3306]
    RD[fintech-redis :6379]
  end
  FE --> BE
  BE --> MY
  BE --> RD
  WK --> MY
  WK --> RD
  WK -.depends on.-> BE
```

### C4 Level 3 — API Internals

```mermaid
flowchart LR
  subgraph APIProcess["Express Process"]
    R[Routes]
    M[Middleware Chain]
    S[Services]
    RE[Repositories]
  end
  R --> M --> S --> RE
  RE --> MY[(MySQL)]
```

### C4 Level 4 — Persistent Volumes

```mermaid
flowchart TB
  subgraph Volumes
    UP[backend_uploads]
    LG[backend_logs]
    MD[mysql_data]
  end
  BE[backend] --> UP
  BE --> LG
  WK[worker] --> UP
  WK --> LG
  MY[mysql] --> MD
```

---

## Purpose

C4 levels 1–4 for deployable containers.

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
