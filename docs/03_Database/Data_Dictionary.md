# Data Dictionary

> **Merchant Pro Database Architecture** · v1.0.0-rc1 · Schema: `Database_Fintech/master_database.sql` (223 tables)

## Table of Contents

1. [Purpose](#purpose)
2. [users](#users)
3. [organizations](#organizations)
4. [merchants](#merchants)
5. [payment_intents](#paymentintents)
6. [checkout_sessions](#checkoutsessions)
7. [refresh_tokens](#refreshtokens)
8. [background_jobs](#backgroundjobs)
9. [audit_logs](#auditlogs)
10. [feature_flags](#featureflags)
11. [webhook_subscriptions](#webhooksubscriptions)

---

## Purpose

Major entity reference with lifecycle and PII classification.

## users

**Purpose:** Platform identity. **Relationships:** organization_members, user_sessions, refresh_tokens. **Lifecycle:** pending → active → locked/inactive; soft delete. **PII:** email, phone, name — HIGH.

## organizations

**Purpose:** Tenant root. **Relationships:** merchants, organization_members, organization_api_keys. **Lifecycle:** active/archived. **PII:** billing contacts — MEDIUM.

## merchants

**Purpose:** Commercial entity accepting payments. **Relationships:** payment_intents, checkout_sessions, outlets. **Lifecycle:** pending → active → suspended. **PII:** legal_name, registration — MEDIUM.

## payment_intents

**Purpose:** Core payment state machine. **Relationships:** payment_orders, checkout_sessions, refunds, timeline events. **Lifecycle:** pending → authorized → captured → settled/refunded. **PII:** metadata may contain customer refs — LOW direct.

## checkout_sessions

**Purpose:** Hosted checkout context. **Relationships:** payment_intents, checkout_themes, events. **Lifecycle:** open → complete/expired/abandoned. **PII:** customer_email, billing_address JSON — HIGH.

## refresh_tokens

**Purpose:** Session continuity. **Relationships:** users. **Lifecycle:** issued → rotated → revoked/expired. **PII:** token_hash only — no plaintext.

## background_jobs

**Purpose:** Async work queue. **Lifecycle:** queued → running → completed/failed. **PII:** payload JSON may reference user email — context dependent.

## audit_logs

**Purpose:** Compliance trail. **Relationships:** users, organizations, merchants. **Lifecycle:** append-only. **PII:** actor identity, IP — MEDIUM.

## feature_flags

**Purpose:** Runtime toggles per org. **Lifecycle:** created → enabled/disabled. **PII:** none.

## webhook_subscriptions

**Purpose:** Merchant endpoint registration. **PII:** URL may be merchant-controlled — LOW.
