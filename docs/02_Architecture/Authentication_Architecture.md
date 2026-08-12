# Authentication Architecture

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

Identity verification: login, MFA, sessions, token lifecycle.

## Responsibilities

Define technical structure, boundaries, and cross-cutting concerns for Merchant Pro v1.0.0-rc1.

## Components

Auth module: `AuthService`, `TokenService`, repositories for users/sessions/refresh_tokens. Access JWT HS256; refresh opaque token hashed SHA-256 in DB.

## Dependencies

Node 20+, MySQL 8, Redis 7, SMTP for email, external payment gateway.

## Communication

HTTPS JSON REST between SPA and API; worker polls MySQL queues; Redis pub/sub not used.

## Data Flow

### Merchant Login

```mermaid
sequenceDiagram
  autonumber
  actor U as Merchant User
  participant SPA as Angular SPA
  participant API as Express API
  participant Auth as Auth Module
  participant DB as MySQL
  participant Redis as Redis

  U->>SPA: Enter credentials
  SPA->>API: POST /api/v1/auth/login
  API->>Auth: Validate credentials
  Auth->>DB: SELECT users + org membership
  Auth->>DB: INSERT user_sessions, refresh_tokens
  Auth->>Redis: Optional session cache
  Auth-->>API: JWT access + refresh token
  API-->>SPA: 200 + Set-Cookie (CSRF)
  SPA-->>U: Dashboard redirect
```

### Refresh Token Rotation

```mermaid
sequenceDiagram
  autonumber
  participant SPA as Angular SPA
  participant API as Express API
  participant Auth as TokenService
  participant DB as MySQL

  SPA->>API: POST /api/v1/auth/refresh (refresh cookie)
  API->>Auth: hash(refreshToken)
  Auth->>DB: SELECT refresh_tokens WHERE hash AND not revoked
  alt valid and not expired
    Auth->>DB: Rotate refresh token row
    Auth-->>API: New access + refresh pair
    API-->>SPA: 200 TokenPair
  else invalid
    Auth-->>API: UnauthorizedError
    API-->>SPA: 401
  end
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

[01_Product/Modules/Authentication.md](../01_Product/Modules/Authentication.md)
