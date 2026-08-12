# Consistency Model

> **Merchant Pro Solution Design** · v1.0.0-rc1

## Table of Contents

1. [Purpose](#purpose)
2. [Strong Consistency](#strong-consistency)
3. [Eventual Consistency](#eventual-consistency)
4. [Idempotency](#idempotency)

---

## Purpose

Consistency guarantees across components.

## Strong Consistency

Payment state, balances, refund amounts — single MySQL transaction.

## Eventual Consistency

Webhook delivery, email notifications — at-least-once via retry_queue.

## Idempotency

Payment create returns cached response for duplicate Idempotency-Key.
