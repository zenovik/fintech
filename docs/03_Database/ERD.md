# Entity Relationship Diagrams

> **Merchant Pro Database Architecture** · v1.0.0-rc1 · Schema: `Database_Fintech/master_database.sql` (223 tables)

## Table of Contents

1. [Purpose](#purpose)
2. [Identity](#identity)
3. [Merchant](#merchant)
4. [Payments](#payments)
5. [Checkout](#checkout)
6. [Refunds](#refunds)
7. [Subscriptions](#subscriptions)
8. [Invoices](#invoices)
9. [Notifications](#notifications)
10. [Audit](#audit)
11. [Configuration](#configuration)
12. [Notes](#notes)

---

## Purpose

Domain-scoped ER diagrams for major bounded contexts.

## Identity

```mermaid
erDiagram
  users ||--o{ user_sessions : has
  users ||--o{ refresh_tokens : has
  users ||--o{ organization_members : belongs
  users ||--o{ password_history : tracks
  users ||--o{ login_attempts : logs
  organizations ||--o{ organization_members : includes
  organization_members }o--|| organization_roles : assigned
  users {
    bigint id PK
    char uuid UK
    varchar email UK
    varchar password_hash
    enum status
    datetime deleted_at
  }
  refresh_tokens {
    bigint id PK
    bigint user_id FK
    varchar token_hash
    datetime expires_at
    datetime revoked_at
  }
```

## Merchant

```mermaid
erDiagram
  organizations ||--o{ merchants : owns
  merchants ||--o{ merchant_addresses : has
  merchants ||--o{ merchant_users : employs
  merchants ||--o{ outlets : operates
  merchants }o--|| regions : located
  merchant_users }o--|| users : links
  merchants {
    bigint id PK
    char uuid UK
    varchar merchant_code UK
    enum kyc_status
    enum status
    datetime deleted_at
  }
```

## Payments

```mermaid
erDiagram
  merchants ||--o{ payment_orders : creates
  payment_orders ||--o{ payment_intents : contains
  payment_intents ||--o{ payment_timeline_events : logs
  payment_intents ||--o| payment_sessions : opens
  payment_intents }o--o| transactions : settles
  payment_intents {
    bigint id PK
    varchar intent_ref UK
    enum status
    decimal amount
    varchar idempotency_key
  }
```

## Checkout

```mermaid
erDiagram
  checkout_sessions }o--|| payment_intents : pays
  checkout_sessions }o--o| checkout_themes : styled
  checkout_sessions ||--o{ checkout_session_events : tracks
  merchants ||--o{ checkout_sessions : hosts
  checkout_sessions {
    bigint id PK
    varchar checkout_ref UK
    enum status
    enum checkout_mode
    datetime expires_at
  }
```

## Refunds

```mermaid
erDiagram
  payment_intents ||--o{ refunds : reversed
  refunds ||--o{ refund_status_history : tracks
  merchants ||--o{ refunds : initiates
  refunds {
    bigint id PK
    bigint payment_intent_id FK
    decimal amount
    enum status
    varchar reason
  }
```

## Subscriptions

```mermaid
erDiagram
  merchants ||--o{ subscription_plans : offers
  subscription_plans ||--o{ subscriptions : sold
  subscriptions ||--o{ subscription_invoices : bills
  customers ||--o{ subscriptions : subscribes
  subscriptions {
    bigint id PK
    enum status
    date current_period_start
    date current_period_end
  }
```

## Invoices

```mermaid
erDiagram
  merchants ||--o{ invoices : issues
  invoices ||--o{ invoice_line_items : contains
  invoices ||--o{ invoice_payments : paid_by
  customers ||--o{ invoices : billed
  invoices {
    bigint id PK
    varchar invoice_number UK
    enum status
    decimal total_amount
    datetime due_date
  }
```

## Notifications

```mermaid
erDiagram
  users ||--o{ notifications : receives
  notifications ||--o{ notification_deliveries : channels
  notification_templates ||--o{ notifications : renders
  notification_deliveries {
    bigint id PK
    enum channel
    enum status
    datetime sent_at
  }
```

## Audit

```mermaid
erDiagram
  users ||--o{ audit_logs : performs
  organizations ||--o{ audit_logs : scopes
  merchants ||--o{ audit_logs : scopes
  audit_logs ||--o{ audit_log_details : expands
  audit_logs {
    bigint id PK
    varchar action
    varchar resource_type
    bigint resource_id
    json metadata
  }
```

## Configuration

```mermaid
erDiagram
  organizations ||--o{ organization_preferences : configures
  organizations ||--o{ feature_flags : toggles
  organizations ||--o{ platform_settings : overrides
  feature_flags {
    bigint id PK
    varchar flag_key
    tinyint enabled
    json conditions
  }
  platform_settings {
    bigint id PK
    varchar setting_key UK
    text setting_value
  }
```

## Notes

Full schema: `Database_Fintech/master_database.sql`. FK constraints enforce referential integrity with RESTRICT/SET NULL/CASCADE per relationship.
