# Data Model

> **Merchant Pro Database Architecture** · v1.0.0-rc1 · Schema: `Database_Fintech/master_database.sql` (223 tables)

## Table of Contents

1. [Purpose](#purpose)
2. [Identity Aggregate](#identity-aggregate)
3. [Merchant Aggregate](#merchant-aggregate)
4. [Payment Aggregate](#payment-aggregate)
5. [Checkout Aggregate](#checkout-aggregate)
6. [Platform Aggregate](#platform-aggregate)
7. [Queue Model](#queue-model)

---

## Purpose

Logical grouping of 223 physical tables into domain aggregates.

## Identity Aggregate

users, auth tables (sessions, refresh_tokens, MFA), organization_members — authentication and membership.

## Merchant Aggregate

merchants, outlets, merchant_users, onboarding workflow — commercial entity lifecycle.

## Payment Aggregate

payment_orders → payment_intents → payment_sessions → transactions — monetary flow.

## Checkout Aggregate

checkout_sessions bound to payment_intents with themed presentation and event stream.

## Platform Aggregate

audit_logs, notifications, background_jobs, feature_flags — cross-cutting operational data.

## Queue Model

MySQL tables act as queues: background_jobs, retry_queue, webhook_delivery_queue, payment_webhook_deliveries, notification_deliveries.
